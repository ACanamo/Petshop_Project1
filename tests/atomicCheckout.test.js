import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const sql = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const customerId = '00000000-0000-4000-8000-000000000001';
const otherCustomerId = '00000000-0000-4000-8000-000000000002';

// Real PostgreSQL executes the application schema, RLS, triggers and RPCs.
// Only Supabase-owned auth/storage prerequisites are minimal local fixtures.
// PGlite has one connection: these tests do NOT establish multi-session locking
// or validate a hosted Supabase deployment, JWT verification, or the REST gateway.
const prerequisites = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE SCHEMA auth;
  CREATE TABLE auth.users (
    id UUID PRIMARY KEY, email TEXT, raw_user_meta_data JSONB DEFAULT '{}'
  );
  CREATE FUNCTION auth.uid() RETURNS UUID LANGUAGE SQL STABLE AS $$
    SELECT nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
  $$;
  GRANT USAGE ON SCHEMA auth, public TO anon, authenticated;
  CREATE SCHEMA storage;
  CREATE TABLE storage.buckets (
    id TEXT PRIMARY KEY, name TEXT, public BOOLEAN,
    file_size_limit BIGINT, allowed_mime_types TEXT[]
  );
  CREATE TABLE storage.objects (id UUID PRIMARY KEY, bucket_id TEXT, name TEXT);
  -- Exercise RLS with legacy Supabase-style grants, not accidental denied grants.
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO anon, authenticated;
`;

for (const installation of ['bootstrap', 'upgrade']) {
  describe(`atomic checkout: ${installation}`, () => {
    let db;

    before(async () => {
      db = new PGlite();
      await db.exec(prerequisites);
      await db.exec(sql('supabase_schema.sql'));

      if (installation === 'upgrade') {
        // Simulate unsafe legacy definitions/permissions and a missing stock
        // constraint. The focused patch must repair these, without replaying seeds.
        await db.exec(`
          ALTER TABLE public.products DROP CONSTRAINT chk_products_stock_nonnegative;
          GRANT INSERT ON public.orders TO anon, authenticated;
          CREATE OR REPLACE FUNCTION public.place_order(
            p_pet_name TEXT, p_items JSONB, p_discount_code TEXT
          ) RETURNS public.orders LANGUAGE plpgsql SECURITY DEFINER AS $$
          BEGIN RAISE EXCEPTION 'legacy checkout must be replaced'; END;
          $$;
          CREATE OR REPLACE FUNCTION public.deduct_product_stock(p_items JSONB)
          RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
          BEGIN UPDATE public.products SET stock_quantity = 0; END;
          $$;
          GRANT EXECUTE ON FUNCTION public.deduct_product_stock(JSONB)
            TO PUBLIC, anon, authenticated;
        `);
        await db.exec(sql('sql/enforce_atomic_checkout.sql'));
        // Applying the same focused patch twice must remain safe.
        await db.exec(sql('sql/enforce_atomic_checkout.sql'));
      }

      await db.query('INSERT INTO auth.users (id, email) VALUES ($1, $2), ($3, $4)',
        [customerId, 'customer@example.test', otherCustomerId, 'other@example.test']);
    });

    after(async () => { await db?.close(); });

    beforeEach(async () => {
      await db.exec(`
        DROP TRIGGER IF EXISTS checkout_test_failure ON public.products;
        DROP TRIGGER IF EXISTS checkout_test_failure ON public.orders;
        TRUNCATE public.coupon_redemptions, public.orders, public.products;
        INSERT INTO public.products (id, name, price, stock_quantity)
        VALUES ('a-food', 'Real food', 12.50, 10), ('z-toy', 'Real toy', 5.00, 5);
      `);
    });

    async function asRole(role, userId, query, params = []) {
      assert.ok(['anon', 'authenticated'].includes(role));
      return db.transaction(async tx => {
        await tx.exec(`SET LOCAL ROLE ${role}`);
        await tx.query("SELECT set_config('request.jwt.claim.sub', $1, true)", [userId || '']);
        return tx.query(query, params);
      });
    }

    async function checkout(items, coupon = '', userId = customerId) {
      const { rows } = await asRole('authenticated', userId,
        'SELECT * FROM public.place_order($1, $2::jsonb, $3)',
        ['Buddy', JSON.stringify(items), coupon]);
      return rows[0];
    }

    async function snapshot() {
      const results = await db.exec(`
        SELECT id, stock_quantity, in_stock FROM public.products ORDER BY id;
        SELECT * FROM public.orders ORDER BY id;
        SELECT * FROM public.coupon_redemptions ORDER BY customer_id, code;
      `);
      return results.map(result => result.rows);
    }

    test('successful checkout commits one order, exact stock changes and its coupon', async () => {
      const order = await checkout([
        { id: 'a-food', qty: 2, name: 'Fake name', price: 0.01 },
        { id: 'z-toy', qty: 1, price: 0 }
      ], 'FIRSTPAW20');
      assert.equal(order.customer_id, customerId);
      assert.equal(order.customer_email, 'customer@example.test');
      assert.equal(order.status, 'pending');
      assert.equal(Number(order.subtotal), 30);
      assert.equal(Number(order.total), 24);
      assert.equal(Number(order.discount_amount), 6);
      assert.equal(order.items[0].name, 'Real food');
      assert.equal(order.items[0].price, 12.5);
      const [products, orders, coupons] = await snapshot();
      assert.deepEqual(products.map(p => p.stock_quantity), [8, 4]);
      assert.equal(orders.length, 1);
      assert.equal(coupons.length, 1);
      assert.equal(coupons[0].order_id, order.id);
    });

    test('insufficient stock on any line leaves all three tables unchanged', async () => {
      const original = await snapshot();
      await assert.rejects(checkout([{ id: 'a-food', qty: 2 }, { id: 'z-toy', qty: 6 }]), /Not enough stock/);
      assert.deepEqual(await snapshot(), original);
    });

    test('duplicate lines cannot oversell; valid duplicates deduct the combined quantity', async () => {
      const original = await snapshot();
      await assert.rejects(checkout([{ id: 'a-food', qty: 6 }, { id: 'a-food', qty: 6 }]), /Not enough stock/);
      assert.deepEqual(await snapshot(), original);
      const order = await checkout([{ id: 'a-food', qty: 2 }, { id: 'a-food', qty: 3 }]);
      assert.equal(order.item_count, 5);
      assert.equal(Number(order.total), 62.5);
      assert.equal((await snapshot())[0][0].stock_quantity, 5);
    });

    test('malformed items, missing products and invalid quantities never change stock or orders', async () => {
      const original = await snapshot();
      for (const items of [null, {}, [], [null], [{}], [{ id: 'missing', qty: 1 }],
        [{ id: 'a-food', qty: 0 }], [{ id: 'a-food', qty: -1 }],
        [{ id: 'a-food', qty: 1.5 }], [{ id: 'a-food', qty: 'bad' }],
        [{ id: 'a-food', qty: 2 }, { id: 'a-food', qty: -1 }]]) {
        await assert.rejects(checkout(items));
        assert.deepEqual(await snapshot(), original);
      }
    });

    test('an order insert failure leaves inventory and coupon redemption unchanged', async () => {
      await db.exec(`
        CREATE OR REPLACE FUNCTION public.checkout_test_failure()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN RAISE EXCEPTION 'injected order insert failure'; END;
        $$;
        CREATE TRIGGER checkout_test_failure BEFORE INSERT ON public.orders
        FOR EACH ROW EXECUTE FUNCTION public.checkout_test_failure();
      `);
      const original = await snapshot();
      await assert.rejects(checkout([{ id: 'a-food', qty: 2 }], 'FIRSTPAW20'), /injected order insert failure/);
      assert.deepEqual(await snapshot(), original);
    });

    test('failure AFTER order, coupon and first deduction rolls everything back', async () => {
      await db.exec(`
        CREATE OR REPLACE FUNCTION public.checkout_test_failure()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN
          IF NEW.id = 'z-toy' THEN
            IF (SELECT count(*) FROM public.orders) <> 1
               OR (SELECT count(*) FROM public.coupon_redemptions) <> 1
               OR (SELECT stock_quantity FROM public.products WHERE id = 'a-food') <> 8 THEN
              RAISE EXCEPTION 'test did not reach partial transaction state';
            END IF;
            RAISE EXCEPTION 'injected failure after partial transaction';
          END IF;
          RETURN NEW;
        END;
        $$;
        CREATE TRIGGER checkout_test_failure BEFORE UPDATE ON public.products
        FOR EACH ROW EXECUTE FUNCTION public.checkout_test_failure();
      `);
      const original = await snapshot();
      await assert.rejects(checkout([{ id: 'a-food', qty: 2 }, { id: 'z-toy', qty: 1 }], 'FIRSTPAW20'),
        /injected failure after partial transaction/);
      assert.deepEqual(await snapshot(), original);
    });

    test('a suppressed stock update cannot leave a confirmed order behind', async () => {
      await db.exec(`
        CREATE OR REPLACE FUNCTION public.checkout_test_failure()
        RETURNS TRIGGER LANGUAGE plpgsql AS $$
        BEGIN RETURN NULL; END;
        $$;
        CREATE TRIGGER checkout_test_failure BEFORE UPDATE ON public.products
        FOR EACH ROW EXECUTE FUNCTION public.checkout_test_failure();
      `);
      const original = await snapshot();
      await assert.rejects(checkout([{ id: 'a-food', qty: 2 }], 'FIRSTPAW20'), /Stock deduction failed/);
      assert.deepEqual(await snapshot(), original);
    });

    test('an already redeemed coupon cannot cause another order or deduction', async () => {
      await checkout([{ id: 'a-food', qty: 2 }], 'FIRSTPAW20');
      const original = await snapshot();
      await assert.rejects(checkout([{ id: 'a-food', qty: 1 }], 'FIRSTPAW20'), /already used/);
      assert.deepEqual(await snapshot(), original);
    });

    test('buying the last units sets sold out; later checkout fails without another order', async () => {
      await checkout([{ id: 'z-toy', qty: 5 }]);
      const original = await snapshot();
      assert.equal(original[0][1].stock_quantity, 0);
      assert.equal(original[0][1].in_stock, false);
      await assert.rejects(checkout([{ id: 'z-toy', qty: 1 }], '', otherCustomerId), /Not enough stock/);
      assert.deepEqual(await snapshot(), original);
    });

    test('anonymous checkout, missing user identity and direct order insertion are denied', async () => {
      const original = await snapshot();
      await assert.rejects(asRole('anon', null,
        "SELECT public.place_order('', '[{\"id\":\"a-food\",\"qty\":1}]', '')"), /permission denied/);
      await assert.rejects(checkout([{ id: 'a-food', qty: 1 }], '', null), /must be signed in/);
      for (const role of ['anon', 'authenticated']) {
        await assert.rejects(asRole(role, role === 'authenticated' ? customerId : null,
          "INSERT INTO public.orders (id) VALUES ('bypass')"), /permission denied/);
      }
      assert.deepEqual(await snapshot(), original);
    });

    test('standalone stock RPC is denied to visitors, customers, and even its owner', async () => {
      const original = await snapshot();
      for (const role of ['anon', 'authenticated']) {
        await assert.rejects(asRole(role, role === 'authenticated' ? customerId : null,
          "SELECT public.deduct_product_stock('[{\"id\":\"a-food\",\"qty\":2}]')"), /permission denied/);
      }
      await assert.rejects(db.query("SELECT public.deduct_product_stock('[]')"), /Direct stock deduction is disabled/);
      assert.deepEqual(await snapshot(), original);
    });

    test('customer direct stock updates affect no rows and customers cannot read each other\'s orders', async () => {
      const update = await asRole('authenticated', customerId,
        'UPDATE public.products SET stock_quantity = 0 RETURNING id');
      assert.equal(update.rows.length, 0);
      await checkout([{ id: 'a-food', qty: 1 }]);
      const other = await asRole('authenticated', otherCustomerId, 'SELECT * FROM public.orders');
      assert.equal(other.rows.length, 0);
      const own = await asRole('authenticated', customerId, 'SELECT * FROM public.orders');
      assert.equal(own.rows.length, 1);
    });

    test('read-only deployment checks pass without changing product/order data', async () => {
      const original = await snapshot();
      await db.exec(sql('sql/verify_direct_inventory_rpc.sql'));
      await db.exec(sql('sql/verify_atomic_checkout.sql'));
      assert.deepEqual(await snapshot(), original);
    });

    test('inventory verifier accepts absence; standalone hotfix restores a denied stub safely', async () => {
      const original = await snapshot();
      await db.exec('DROP FUNCTION public.deduct_product_stock(JSONB)');
      try {
        await db.exec(sql('sql/verify_direct_inventory_rpc.sql'));
      } finally {
        await db.exec('ROLLBACK');
        await db.exec(sql('sql/disable_direct_inventory_rpc.sql'));
      }
      assert.deepEqual(await snapshot(), original);
    });

    test('inventory verifier rejects accidentally restored execution privileges', async () => {
      await db.exec('GRANT EXECUTE ON FUNCTION public.deduct_product_stock(JSONB) TO anon');
      try {
        await assert.rejects(db.exec(sql('sql/verify_direct_inventory_rpc.sql')), /still granted/);
      } finally {
        await db.exec('ROLLBACK; REVOKE EXECUTE ON FUNCTION public.deduct_product_stock(JSONB) FROM anon');
      }
    });

    test('upgrade aborts on inherited INSERT access instead of partially committing', async () => {
      await db.exec(`
        CREATE ROLE checkout_legacy_writer NOLOGIN;
        GRANT INSERT (id) ON public.orders TO checkout_legacy_writer;
        GRANT checkout_legacy_writer TO authenticated;
        GRANT EXECUTE ON FUNCTION public.deduct_product_stock(JSONB) TO anon;
      `);
      const original = await snapshot();
      try {
        await assert.rejects(db.exec(sql('sql/enforce_atomic_checkout.sql')), /privileges still allow a bypass/);
        await db.exec('ROLLBACK');
        // Revocation earlier in the failed patch must have rolled back too.
        const { rows } = await db.query(`SELECT has_function_privilege(
          'anon', 'public.deduct_product_stock(jsonb)', 'EXECUTE') AS allowed`);
        assert.equal(rows[0].allowed, true);
        assert.deepEqual(await snapshot(), original);
      } finally {
        await db.exec(`ROLLBACK;
          REVOKE checkout_legacy_writer FROM authenticated;
          REVOKE INSERT (id) ON public.orders FROM checkout_legacy_writer;
          DROP ROLE checkout_legacy_writer;
          REVOKE EXECUTE ON FUNCTION public.deduct_product_stock(JSONB) FROM anon;`);
      }
    });

    test('upgrade refuses historical negative stock instead of silently changing inventory', async () => {
      await db.exec(`
        ALTER TABLE public.products DROP CONSTRAINT chk_products_stock_nonnegative;
        UPDATE public.products SET stock_quantity = -1 WHERE id = 'a-food';
      `);
      const original = await snapshot();
      try {
        await assert.rejects(db.exec(sql('sql/enforce_atomic_checkout.sql')), /violated by some row/);
        await db.exec('ROLLBACK');
        assert.deepEqual(await snapshot(), original);
      } finally {
        await db.exec(`ROLLBACK;
          UPDATE public.products SET stock_quantity = 10 WHERE id = 'a-food';
          ALTER TABLE public.products ADD CONSTRAINT chk_products_stock_nonnegative
            CHECK (stock_quantity >= 0);`);
      }
    });
  });
}
