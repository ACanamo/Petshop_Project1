-- Run after disable_direct_inventory_rpc.sql, as the database owner.
-- All checks are read-only; even an old function receives an empty item list.
BEGIN;

DO $$
BEGIN
  IF has_function_privilege('anon', 'public.deduct_product_stock(jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.deduct_product_stock(jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: direct inventory RPC is still granted to a client role';
  END IF;
  IF (SELECT prosecdef FROM pg_proc WHERE oid = 'public.deduct_product_stock(jsonb)'::regprocedure) THEN
    RAISE EXCEPTION 'FAIL: retired RPC still runs as SECURITY DEFINER';
  END IF;
  IF NOT has_function_privilege('authenticated', 'public.place_order(text,jsonb,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: authenticated checkout is no longer executable';
  END IF;
  IF has_function_privilege('anon', 'public.place_order(text,jsonb,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: transactional checkout is executable anonymously';
  END IF;

  -- The owner can execute despite revoked grants. The retired body must deny
  -- even this privileged call, so future accidental grants cannot restore it.
  BEGIN
    PERFORM public.deduct_product_stock('[]'::jsonb);
    RAISE EXCEPTION 'FAIL: retired function did not reject its owner';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;

SET LOCAL ROLE anon;
DO $$
BEGIN
  BEGIN
    PERFORM public.deduct_product_stock('[]'::jsonb);
    RAISE EXCEPTION 'FAIL: anonymous inventory call succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;
RESET ROLE;

SET LOCAL ROLE authenticated;
DO $$
BEGIN
  BEGIN
    PERFORM public.deduct_product_stock('[]'::jsonb);
    RAISE EXCEPTION 'FAIL: customer inventory call succeeded';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
END;
$$;
RESET ROLE;

ROLLBACK;
SELECT 'PASS: direct inventory RPC is disabled; checkout grants remain correct' AS result;
