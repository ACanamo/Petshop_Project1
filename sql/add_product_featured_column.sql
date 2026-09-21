-- ==============================================================================
-- MIGRATION: ADD is_featured COLUMN TO products TABLE
-- ==============================================================================
-- Allows store admins to mark specific products as highlighted/featured
-- on the main page ("Little things. Big tail wags." section).

-- 1. Add column if it doesn't already exist
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT false;

-- 2. Seed initial featured products (top 4 products)
UPDATE public.products
SET is_featured = true
WHERE id IN ('p1', 'p2', 'p3-cat', 'p3');

-- 3. Add an index for fast lookups on featured products
CREATE INDEX IF NOT EXISTS idx_products_is_featured
ON public.products (is_featured)
WHERE is_featured = true;

-- Verification query:
-- SELECT id, name, is_featured FROM public.products ORDER BY is_featured DESC, name ASC;
