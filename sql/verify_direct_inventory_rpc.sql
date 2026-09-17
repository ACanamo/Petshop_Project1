-- Catalog-only check: safe for a live database; does not invoke unknown legacy code.
-- Accepts either an absent retired RPC or the denied SECURITY INVOKER stub.
-- This verifies privileges, not the transactional behavior of deployed checkout.
BEGIN READ ONLY;

DO $$
DECLARE
  retired_oid OID := to_regprocedure('public.deduct_product_stock(jsonb)');
  checkout_oid OID := to_regprocedure('public.place_order(text,jsonb,text)');
BEGIN
  IF retired_oid IS NOT NULL THEN
    IF has_function_privilege('anon', retired_oid, 'EXECUTE')
       OR has_function_privilege('authenticated', retired_oid, 'EXECUTE') THEN
      RAISE EXCEPTION 'FAIL: direct inventory RPC is still granted to a client role';
    END IF;
    IF (SELECT prosecdef FROM pg_proc WHERE oid = retired_oid) THEN
      RAISE EXCEPTION 'FAIL: retired RPC still runs as SECURITY DEFINER';
    END IF;
  END IF;

  IF checkout_oid IS NULL THEN
    RAISE EXCEPTION 'FAIL: expected checkout function is missing';
  END IF;
  IF NOT has_function_privilege('authenticated', checkout_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: authenticated checkout is no longer executable';
  END IF;
  IF has_function_privilege('anon', checkout_oid, 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: transactional checkout is executable anonymously';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('place_order', 'deduct_product_stock')
      AND p.oid <> checkout_oid
      AND (has_function_privilege('anon', p.oid, 'EXECUTE')
           OR has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  ) THEN
    RAISE EXCEPTION 'FAIL: another checkout/inventory overload is callable by clients';
  END IF;
END;
$$;

ROLLBACK;
SELECT 'PASS: direct inventory execution is blocked; checkout grants are correct (privileges only)' AS result;
