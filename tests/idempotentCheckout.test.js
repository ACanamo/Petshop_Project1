import { after, before, beforeEach, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const sql = name => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
const customerId = '00000000-0000-4000-8000-000000000001';
const otherCustomerId = '00000000-0000-4000-8000-000000000002';

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
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT ALL ON TABLES TO anon, authenticated;
`;

describe('idempotent checkout & quote contract', () => {
  let db;

  before(async () => {
    db = new PGlite();
    await db.exec(prerequisites);
    await db.exec(sql('supabase_schema.sql'));
    await db.exec(sql('sql/enforce_atomic_checkout.sql'));
    await db.exec(sql('sql/enforce_order_lifecycle.sql'));
    await db.exec(sql('sql/enforce_idempotent_checkout.sql'));
    // Idempotent re-run must not error
    await db.exec(sql('sql/enforce_idempotent_checkout.sql'));

    await db.query('INSERT INTO auth.users (id, email) VALUES ($1, $2), ($3, $4)',
      [customerId, 'customer@example.test', otherCustomerId, 'other@example.test']);
  });

  after(async () => {
    await db?.close();
  });

  beforeEach(async () => {
    await db.exec(`
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

  async function checkoutWithKey(items, coupon = '', attemptKey = null, userId = customerId) {
    const { rows } = await asRole('authenticated', userId,
      'SELECT * FROM public.place_order($1, $2::jsonb, $3, $4)',
      ['Buddy', JSON.stringify(items), coupon, attemptKey]);
    return rows[0];
  }

  async function checkoutLegacy(items, coupon = '', userId = customerId) {
    const { rows } = await asRole('authenticated', userId,
      'SELECT * FROM public.place_order($1, $2::jsonb, $3)',
      ['Buddy', JSON.stringify(items), coupon]);
    return rows[0];
  }

  async function getStock() {
    const res = await db.query('SELECT id, stock_quantity FROM public.products ORDER BY id');
    return res.rows;
  }

  test('submitting with attempt key records key and deducts stock', async () => {
    const attemptKey = 'att_test_123';
    const order = await checkoutWithKey(
      [{ id: 'a-food', qty: 2, price: 12.50 }],
      'FIRSTPAW20',
      attemptKey
    );

    assert.equal(order.checkout_attempt_key, attemptKey);
    assert.equal(order.customer_id, customerId);
    assert.equal(Number(order.total), 20.00);

    const stock = await getStock();
    assert.equal(stock.find(s => s.id === 'a-food').stock_quantity, 8);
  });

  test('retrying with identical attempt key returns existing order without duplicate insertion or double deduction', async () => {
    const attemptKey = 'att_retry_test';
    const items = [{ id: 'a-food', qty: 2, price: 12.50 }];

    // First attempt
    const firstOrder = await checkoutWithKey(items, 'FIRSTPAW20', attemptKey);
    const stockAfterFirst = await getStock();
    assert.equal(stockAfterFirst.find(s => s.id === 'a-food').stock_quantity, 8);

    // Second attempt (e.g. retry after lost network response)
    const secondOrder = await checkoutWithKey(items, 'FIRSTPAW20', attemptKey);

    // Must resolve to the exact same order
    assert.equal(secondOrder.id, firstOrder.id);
    assert.equal(secondOrder.checkout_attempt_key, attemptKey);

    // Total orders count in DB must still be 1
    const { rows: orders } = await db.query('SELECT * FROM public.orders');
    assert.equal(orders.length, 1);

    // Stock must not be deducted a second time
    const stockAfterSecond = await getStock();
    assert.equal(stockAfterSecond.find(s => s.id === 'a-food').stock_quantity, 8);
  });

  test('reusing an attempt key with different parameters is rejected', async () => {
    const attemptKey = 'att_tamper_test';
    await checkoutWithKey([{ id: 'a-food', qty: 2, price: 12.50 }], 'FIRSTPAW20', attemptKey);

    // Try reusing attempt key with different coupon
    await assert.rejects(
      checkoutWithKey([{ id: 'a-food', qty: 2, price: 12.50 }], 'DIFFERENT', attemptKey),
      /Checkout attempt key was already used with different parameters/
    );

    // Try reusing attempt key with different item count
    await assert.rejects(
      checkoutWithKey([
        { id: 'a-food', qty: 2, price: 12.50 },
        { id: 'z-toy', qty: 1, price: 5.00 }
      ], 'FIRSTPAW20', attemptKey),
      /Checkout attempt key was already used with different parameters/
    );
  });

  test('detects and rejects quote price changes against locked catalog state', async () => {
    // Catalog price for a-food is 12.50, but client passed accepted quote of 10.00
    await assert.rejects(
      checkoutWithKey([{ id: 'a-food', qty: 1, price: 10.00 }], '', 'att_price_mismatch'),
      /Price for "Real food" has changed from 10.00 to 12.50/
    );

    // Verify stock is untouched
    const stock = await getStock();
    assert.equal(stock.find(s => s.id === 'a-food').stock_quantity, 10);
  });

  test('legacy 3-argument place_order calls continue to work seamlessly', async () => {
    const order = await checkoutLegacy([{ id: 'z-toy', qty: 1 }], '');
    assert.equal(order.status, 'pending');
    assert.equal(Number(order.total), 5.00);

    const stock = await getStock();
    assert.equal(stock.find(s => s.id === 'z-toy').stock_quantity, 4);
  });
});
