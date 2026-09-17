-- Run as database owner after enforce_atomic_checkout.sql. Catalog-only;
-- no orders are created and no inventory rows are updated.
-- Run verify_direct_inventory_rpc.sql too. Neither replaces behavioral tests.
BEGIN READ ONLY;

DO $$
DECLARE
  checkout_oid OID := to_regprocedure('public.place_order(text,jsonb,text)');
BEGIN
  IF checkout_oid IS NULL THEN
    RAISE EXCEPTION 'FAIL: transactional checkout is missing';
  END IF;
  IF NOT has_function_privilege('authenticated', checkout_oid, 'EXECUTE')
     OR has_function_privilege('anon', checkout_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: checkout execution privileges are incorrect';
  END IF;
  IF has_any_column_privilege('anon', 'public.orders', 'INSERT')
     OR has_any_column_privilege('authenticated', 'public.orders', 'INSERT') THEN
    RAISE EXCEPTION 'FAIL: client order inserts can bypass checkout';
  END IF;
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.orders'::regclass)
     OR NOT (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.products'::regclass) THEN
    RAISE EXCEPTION 'FAIL: order/product row-level security is disabled';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.products'::regclass
      AND conname = 'chk_products_stock_nonnegative'
      AND contype = 'c' AND convalidated
      AND pg_get_expr(conbin, conrelid) = '(stock_quantity >= 0)'
  ) THEN
    RAISE EXCEPTION 'FAIL: validated nonnegative inventory constraint is missing or different';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE oid = checkout_oid AND prosecdef
      AND 'search_path=""' = ANY(proconfig)
  ) THEN
    RAISE EXCEPTION 'FAIL: checkout security mode or fixed search path differs';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.orders'::regclass
      AND tgname = 'trg_validate_order_totals'
      AND tgfoid = 'public.validate_order_totals()'::regprocedure
      AND tgenabled IN ('O', 'A') AND tgtype = 7
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgrelid = 'public.orders'::regclass
      AND tgname = 'trg_check_order_rate_limit'
      AND tgfoid = 'public.check_order_rate_limit()'::regprocedure
      AND tgenabled IN ('O', 'A') AND tgtype = 7
  ) THEN
    RAISE EXCEPTION 'FAIL: expected enabled BEFORE INSERT checkout triggers are missing';
  END IF;
END;
$$;

ROLLBACK;
SELECT 'PASS: checkout grants, RLS flags, constraint and triggers verified; run behavioral tests in staging' AS result;
