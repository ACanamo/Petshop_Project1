-- Focused checkout upgrade for an EXISTING Petchup database.
-- Run the WHOLE file as the database owner, first in staging. Do not run
-- the complete bootstrap schema as an upgrade: it also seeds data/admins.
-- This is a standalone deployment patch, not a migration-history entry.
-- Preconditions: profiles, products, orders, and coupon_redemptions already
-- have the columns in supabase_schema.sql. Verify schema compatibility in staging.
-- Definitions below are also exercised through the full bootstrap in tests.
-- This transaction changes schema/permissions only, not existing order/stock rows.
BEGIN;
SET LOCAL lock_timeout = '5s';

DO $$
BEGIN
  IF to_regclass('public.profiles') IS NULL
     OR to_regclass('public.products') IS NULL
     OR to_regclass('public.orders') IS NULL
     OR to_regclass('public.coupon_redemptions') IS NULL THEN
    RAISE EXCEPTION 'Missing Petchup tables; inspect the database baseline before upgrading checkout';
  END IF;
END;
$$;

-- Defense in depth: client-created orders must never bypass stock deduction.
REVOKE INSERT ON public.orders FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;
DROP POLICY IF EXISTS "Public Insert Orders" ON public.orders;

-- Enforce non-negative inventory on products
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'chk_products_stock_nonnegative'
      AND conrelid = 'public.products'::regclass
  ) THEN
    ALTER TABLE public.products ADD CONSTRAINT chk_products_stock_nonnegative CHECK (stock_quantity >= 0);
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_order_totals()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  item_price NUMERIC(10, 2);
  item_qty INTEGER;
  real_subtotal NUMERIC(10, 2) := 0;
  real_item_count INTEGER := 0;
  discount_percent NUMERIC(5, 2) := 0;
  normalized_code TEXT := UPPER(TRIM(COALESCE(NEW.discount_code, '')));
BEGIN
  IF jsonb_typeof(NEW.items) IS DISTINCT FROM 'array' OR jsonb_array_length(NEW.items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
  LOOP
    item_qty := GREATEST(COALESCE((item->>'qty')::INTEGER, 0), 0);
    IF item_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity in order';
    END IF;

    SELECT price INTO item_price
    FROM public.products
    WHERE id = (item->>'id');

    IF item_price IS NULL THEN
      RAISE EXCEPTION 'Unknown product % in order', item->>'id';
    END IF;

    real_subtotal := real_subtotal + (item_price * item_qty);
    real_item_count := real_item_count + item_qty;
  END LOOP;

  discount_percent := CASE normalized_code
    WHEN 'FIRSTPAW20' THEN 20
    WHEN 'WELCOME20'  THEN 20
    WHEN 'FIRSTPAW15' THEN 15
    WHEN 'PAWTY15'    THEN 15
    WHEN 'MEOW10'     THEN 10
    WHEN 'WOOF10'     THEN 10
    ELSE 0
  END;

  NEW.item_count := real_item_count;
  NEW.subtotal := ROUND(real_subtotal, 2);
  NEW.discount_amount := ROUND(real_subtotal * discount_percent / 100, 2);
  NEW.total := GREATEST(0, ROUND(real_subtotal - NEW.discount_amount, 2));

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

DROP TRIGGER IF EXISTS trg_validate_order_totals ON public.orders;
CREATE TRIGGER trg_validate_order_totals
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.validate_order_totals();

-- FIX security_definer_function_executable: like is_admin() and
-- handle_new_user() above, Postgres grants EXECUTE to PUBLIC on new
-- functions by default. This is only ever meant to run as a trigger, not
-- be called directly via /rest/v1/rpc/, so revoke the default grant.
REVOKE EXECUTE ON FUNCTION public.validate_order_totals() FROM PUBLIC, anon, authenticated;

-- ==============================================================================
-- 13. ORDER-SPAM RATE LIMITING
-- Caps how many orders a single customer (or guest, by email) can place in a
-- short window. Complements validate_order_totals(): that trigger stops
-- fake PRICES, this one stops sheer VOLUME. Since the anon key is public,
-- nothing else currently prevents a script from looping order inserts.
-- Not a complete defense against a determined attacker (Postgres triggers
-- have no visibility into the caller's IP, so many fake guest emails or
-- throwaway accounts can still get around this) — pair with a checkout
-- CAPTCHA for stronger protection if abuse becomes a real problem.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.check_order_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_count INTEGER;
  window_minutes CONSTANT INTEGER := 5;
  max_orders CONSTANT INTEGER := 5;
BEGIN
  IF NEW.customer_id IS NOT NULL THEN
    SELECT COUNT(*) INTO recent_count
    FROM public.orders
    WHERE customer_id = NEW.customer_id
      AND created_at > NOW() - (window_minutes || ' minutes')::INTERVAL;
  ELSE
    SELECT COUNT(*) INTO recent_count
    FROM public.orders
    WHERE customer_id IS NULL
      AND LOWER(COALESCE(customer_email, '')) = LOWER(COALESCE(NEW.customer_email, ''))
      AND created_at > NOW() - (window_minutes || ' minutes')::INTERVAL;
  END IF;

  IF recent_count >= max_orders THEN
    RAISE EXCEPTION 'Too many orders placed recently. Please wait a few minutes and try again.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

DROP TRIGGER IF EXISTS trg_check_order_rate_limit ON public.orders;
CREATE TRIGGER trg_check_order_rate_limit
  BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.check_order_rate_limit();

REVOKE EXECUTE ON FUNCTION public.check_order_rate_limit() FROM PUBLIC, anon, authenticated;

-- ==============================================================================
-- 14. ATOMIC CHECKOUT: DECREMENT STOCK + INSERT ORDER IN ONE TRANSACTION
-- Bug fix: the client used to insert the order row directly, which never
-- touched public.products at all — stock_quantity stayed unchanged after
-- checkout no matter how many units were bought, and nothing stopped an
-- order for more units than were in stock.
--
-- This RPC replaces that direct insert (see createOrder() in
-- src/context/OrdersContext.jsx). It runs as one Postgres transaction:
--   1. Locks each ordered product row (FOR UPDATE) and checks stock_quantity
--      is enough — raises and rolls back the whole thing if not, so a
--      rejected order never touches stock at all.
--   2. Inserts the order (trg_validate_order_totals and
--      trg_check_order_rate_limit above still fire normally, since this is
--      a plain INSERT from inside the function).
--   3. Decrements stock_quantity per item and flips in_stock off at 0.
-- SECURITY DEFINER is what lets it write to public.products despite
-- products_update_admin restricting direct UPDATEs to admins — the function
-- itself is the only path that can move stock, and only by the exact
-- ordered quantities, so that restriction isn't weakened.
--
-- Security Advisor flags this as "SECURITY DEFINER callable by authenticated"
-- (security_definer_function_executable) — reviewed and intentional, not an
-- oversight: a signed-in customer placing a normal order is exactly who is
-- meant to call this. The two alternatives the advisor suggests don't work
-- here: SECURITY INVOKER would run the stock UPDATE as the calling customer,
-- which products_update_admin (admin-only) would then reject, breaking
-- checkout entirely; revoking EXECUTE from authenticated breaks checkout the
-- same way (see the anon-only revoke just below this function, which *is*
-- the fix for the separate, valid "callable while signed out" finding — that
-- one caught real dead surface area, this one is a false positive for an
-- RPC whose whole job is a scoped, audited privilege escalation).
--
-- Audit fix: this function used to also accept p_id, p_customer_id,
-- p_customer_name and p_customer_email straight from the client and trust
-- them (customer_id was at least checked against auth.uid(), but name/email
-- were not checked at all). Since this RPC is authenticated-only, there is
-- no legitimate reason left to accept any client-supplied identity —
-- customer_id, name and email are now all derived from auth.uid() and
-- profiles, and the order id is server-generated. A signed-in caller can no
-- longer attach an arbitrary name/email to their own order.
--
-- Also adds coupon-redemption enforcement: a customer can only successfully
-- apply a given discount_code once, ever (see public.coupon_redemptions).
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.place_order(
  p_pet_name TEXT,
  p_items JSONB,
  p_discount_code TEXT
)
RETURNS public.orders AS $$
DECLARE
  v_customer_id UUID := (SELECT auth.uid());
  v_customer_name TEXT;
  v_customer_email TEXT;
  v_order_id TEXT := 'ord-' || replace(gen_random_uuid()::text, '-', '');
  v_normalized_code TEXT := UPPER(TRIM(COALESCE(p_discount_code, '')));
  agg_item RECORD;
  item JSONB;
  v_product_id TEXT;
  v_qty INTEGER;
  v_prod_record RECORD;
  v_snapshot_items JSONB := '[]'::jsonb;
  new_order public.orders;
BEGIN
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to place an order';
  END IF;

  SELECT name, email INTO v_customer_name, v_customer_email
  FROM public.profiles
  WHERE id = v_customer_id;

  v_customer_name := COALESCE(v_customer_name, 'Guest Pet Parent');
  v_customer_email := COALESCE(v_customer_email, '');

  IF jsonb_typeof(p_items) IS DISTINCT FROM 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Reject upfront if this exact code was already redeemed by this customer
  IF v_normalized_code <> '' AND EXISTS (
    SELECT 1 FROM public.coupon_redemptions
    WHERE customer_id = v_customer_id AND code = v_normalized_code
  ) THEN
    RAISE EXCEPTION 'You''ve already used the coupon "%"', v_normalized_code;
  END IF;

  -- Pass 1: Aggregate requested quantities per product ID and lock rows in deterministic order
  -- Prevents overselling on duplicate lines; consistent checkout lock ordering
  -- avoids deadlocks between checkouts (other inventory writers must also cooperate).
  FOR agg_item IN
    SELECT
      it->>'id' AS product_id,
      SUM(GREATEST(COALESCE((it->>'qty')::INTEGER, 0), 0)) AS aggregate_qty
    FROM jsonb_array_elements(p_items) AS it
    GROUP BY it->>'id'
    ORDER BY it->>'id' ASC
  LOOP
    IF agg_item.product_id IS NULL OR agg_item.product_id = '' THEN
      RAISE EXCEPTION 'Order contains an item with missing product id';
    END IF;

    IF agg_item.aggregate_qty <= 0 THEN
      RAISE EXCEPTION 'Invalid item quantity in order';
    END IF;

    -- Row lock in deterministic order (ORDER BY product_id ASC)
    SELECT id, name, price, img, image_url, stock_quantity
    INTO v_prod_record
    FROM public.products
    WHERE id = agg_item.product_id
    FOR UPDATE;

    IF v_prod_record.id IS NULL THEN
      RAISE EXCEPTION 'Unknown product % in order', agg_item.product_id;
    END IF;

    IF v_prod_record.stock_quantity < agg_item.aggregate_qty THEN
      RAISE EXCEPTION 'Not enough stock for "%": only % left, % requested',
        v_prod_record.name, v_prod_record.stock_quantity, agg_item.aggregate_qty;
    END IF;
  END LOOP;

  -- Pass 2: Build immutable server snapshot using authoritative catalog prices and names
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_product_id := item->>'id';
    v_qty := GREATEST(COALESCE((item->>'qty')::INTEGER, 0), 0);

    SELECT id, name, price, img, image_url
    INTO v_prod_record
    FROM public.products
    WHERE id = v_product_id;

    v_snapshot_items := v_snapshot_items || jsonb_build_array(
      jsonb_build_object(
        'id', v_product_id,
        'name', v_prod_record.name,
        'price', v_prod_record.price,
        'qty', v_qty,
        'img', COALESCE(v_prod_record.img, '🐾'),
        'image_url', COALESCE(v_prod_record.image_url, '')
      )
    );
  END LOOP;

  -- Insert order with authoritative line-item snapshot.
  -- trg_validate_order_totals BEFORE INSERT trigger recomputes subtotal, discount, and total.
  INSERT INTO public.orders (
    id, customer_id, customer_name, customer_email, pet_name,
    items, item_count, subtotal, discount_code, discount_amount, total, status, created_at
  ) VALUES (
    v_order_id, v_customer_id, v_customer_name, v_customer_email,
    COALESCE(p_pet_name, ''), v_snapshot_items, 0, 0, v_normalized_code, 0, 0, 'pending', NOW()
  )
  RETURNING * INTO new_order;

  -- Record coupon redemption if a discount was recognized
  IF new_order.discount_amount > 0 THEN
    INSERT INTO public.coupon_redemptions (customer_id, code, order_id, redeemed_at)
    VALUES (v_customer_id, v_normalized_code, new_order.id, NOW());
  END IF;

  -- Pass 3: Deduct stock atomically per aggregated product
  FOR agg_item IN
    SELECT
      it->>'id' AS product_id,
      SUM(GREATEST(COALESCE((it->>'qty')::INTEGER, 0), 0)) AS aggregate_qty
    FROM jsonb_array_elements(p_items) AS it
    GROUP BY it->>'id'
    ORDER BY it->>'id' ASC
  LOOP
    UPDATE public.products
    SET stock_quantity = stock_quantity - agg_item.aggregate_qty,
        in_stock = (stock_quantity - agg_item.aggregate_qty) > 0,
        updated_at = NOW()
    WHERE id = agg_item.product_id
      AND stock_quantity >= agg_item.aggregate_qty;

    -- Never return an order if a deduction did not update its product. Any
    -- exception rolls back the order, coupon redemption, and ALL deductions.
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Stock deduction failed for product %', agg_item.product_id;
    END IF;
  END LOOP;

  RETURN new_order;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

-- Old 7-argument signature is gone — DROP explicitly, since CREATE OR
-- REPLACE with a different parameter list creates a second overload instead
-- of replacing it, which would leave the old, less-safe version still
-- callable.
DROP FUNCTION IF EXISTS public.place_order(TEXT, UUID, TEXT, TEXT, TEXT, JSONB, TEXT);

-- authenticated only, not anon: CartDrawer.handleCheckout already blocks
-- checkout entirely for a signed-out user (redirects to /login first), so
-- this never needs to run pre-auth. Restricting the grant to match is what
-- the Security Advisor's "SECURITY DEFINER callable without signing in"
-- check is looking for — a signed-out request now gets a permission error
-- from Postgres before any of the function's logic runs.
REVOKE EXECUTE ON FUNCTION public.place_order(TEXT, JSONB, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(TEXT, JSONB, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.deduct_product_stock(p_items JSONB)
RETURNS VOID AS $$
BEGIN
  RAISE EXCEPTION 'Direct stock deduction is disabled; use place_order'
    USING ERRCODE = '42501';
END;
$$ LANGUAGE plpgsql
   SECURITY INVOKER
   SET search_path = '';

REVOKE EXECUTE ON FUNCTION public.deduct_product_stock(JSONB)
  FROM PUBLIC, anon, authenticated;

-- Abort rather than commit an upgrade with inherited or column-level bypasses.
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orders'::regclass)
     OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.products'::regclass) THEN
    RAISE EXCEPTION 'Order/product RLS is disabled; inspect policies before upgrading';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname = 'chk_products_stock_nonnegative'
      AND contype = 'c' AND convalidated
      AND pg_get_expr(conbin, conrelid) = '(stock_quantity >= 0)'
  ) THEN
    RAISE EXCEPTION 'Expected validated inventory constraint is missing or different';
  END IF;

  IF has_function_privilege('anon', 'public.deduct_product_stock(jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.deduct_product_stock(jsonb)', 'EXECUTE')
     OR has_function_privilege('anon', 'public.place_order(text,jsonb,text)', 'EXECUTE')
     OR NOT has_function_privilege('authenticated', 'public.place_order(text,jsonb,text)', 'EXECUTE')
     OR has_any_column_privilege('anon', 'public.orders', 'INSERT')
     OR has_any_column_privilege('authenticated', 'public.orders', 'INSERT') THEN
    RAISE EXCEPTION 'Checkout privileges still allow a bypass; inspect inherited/column grants';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('place_order', 'deduct_product_stock')
      AND p.oid NOT IN ('public.place_order(text,jsonb,text)'::regprocedure,
                        'public.deduct_product_stock(jsonb)'::regprocedure)
      AND (has_function_privilege('anon', p.oid, 'EXECUTE')
           OR has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  ) THEN
    RAISE EXCEPTION 'Unexpected callable checkout/inventory overload; inspect before deployment';
  END IF;
END;
$$;

NOTIFY pgrst, 'reload schema';
COMMIT;

SELECT 'PASS: atomic checkout upgrade committed; run verify_atomic_checkout.sql next' AS result;
