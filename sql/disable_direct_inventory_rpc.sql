-- A01 hotfix for an existing Supabase project. Run this entire file in its
-- SQL Editor as the database owner. No product/order rows are changed.
-- This repository has no configured migration runner; this is a standalone
-- deployment patch, not a migration-history entry. Also deploy the frontend fix.
BEGIN;

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

-- Fail the transaction if inherited privileges leave a client execution path.
DO $$
BEGIN
  IF has_function_privilege('anon', 'public.deduct_product_stock(jsonb)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.deduct_product_stock(jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Inventory RPC still executable by a client role';
  END IF;
END;
$$;

COMMIT;

-- Both values must be false after the patch commits.
SELECT
  has_function_privilege('anon', 'public.deduct_product_stock(jsonb)', 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', 'public.deduct_product_stock(jsonb)', 'EXECUTE') AS authenticated_can_execute;
