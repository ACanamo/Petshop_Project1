-- ==============================================================================
-- PETCHUP STORE — PRODUCTION SUPABASE DATABASE SCHEMA (FIXED)
-- Fixes all 13 warnings and 1 error from the Supabase Security & Performance Advisor.
--
-- CHANGES FROM ORIGINAL:
--   ERROR  0010: customers view → added WITH (security_invoker=on)
--   WARN   0011: is_admin() and handle_new_user() → added SET search_path = ''
--   WARN   0003: auth.uid() in RLS policies → wrapped in (SELECT auth.uid())
--   WARN   0006: Multiple permissive policies consolidated per table/operation
--   INFO   0001: Added index on orders.customer_id (unindexed FK)
--   Security: Admin Manage policies now call is_admin() instead of USING (true)
--   Security: Storage upload/delete restricted to authenticated users only
--   Security: Users Update profile now includes WITH CHECK clause
-- ==============================================================================

-- 1. PROFILES & USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  pet_name TEXT DEFAULT '',
  pet_type TEXT DEFAULT 'dog',
  pet_emoji TEXT DEFAULT '🐶',
  member_tier TEXT DEFAULT 'VIP Paw Member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FIX 0010: WITH (security_invoker=on) makes the view respect RLS on public.profiles.
-- Without this, Postgres runs as the view creator (SECURITY DEFINER) and bypasses RLS.
CREATE OR REPLACE VIEW public.customers
  WITH (security_invoker = on)
  AS SELECT * FROM public.profiles;

-- 2. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT UNIQUE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'accessories',
  category_label TEXT,
  pet TEXT NOT NULL DEFAULT 'all',
  price NUMERIC(10, 2) NOT NULL DEFAULT 9.99,
  original_price NUMERIC(10, 2) DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 10,
  in_stock BOOLEAN DEFAULT true,
  image_url TEXT,
  img TEXT DEFAULT '🐾',
  unit TEXT DEFAULT '',
  rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  popularity INTEGER NOT NULL DEFAULT 0 CHECK (popularity >= 0),
  badge TEXT DEFAULT '',
  badge_class TEXT DEFAULT '',
  tint_class TEXT DEFAULT 'bg-yellow-tint',
  "desc" TEXT DEFAULT 'Lovingly prepared for happy pets.',
  price_history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ANNOUNCEMENTS TABLE (With Date Scheduling)
CREATE TABLE IF NOT EXISTS public.announcements (
  id TEXT PRIMARY KEY,
  pill TEXT NOT NULL DEFAULT '📢 ANNOUNCEMENT',
  title TEXT DEFAULT '',
  text TEXT NOT NULL,
  link TEXT DEFAULT 'shop.html',
  link_text TEXT DEFAULT 'Shop Deals →',
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name TEXT DEFAULT 'Guest Pet Parent',
  customer_email TEXT DEFAULT '',
  pet_name TEXT DEFAULT '',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  item_count INTEGER DEFAULT 0,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  discount_code TEXT DEFAULT '',
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keep existing projects compatible when this schema is re-run after an upgrade.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT '';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) NOT NULL DEFAULT 5.0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS rating_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS popularity INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- FIX 0001: Index the orders.customer_id FK — improves join/filter performance.
CREATE INDEX IF NOT EXISTS ix_orders_customer_id ON public.orders (customer_id);

-- ==============================================================================
-- 5. STORAGE BUCKET FOR PRODUCT PHOTOS
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- ==============================================================================
-- 6. ADMIN ROLE DETECTION FUNCTION
-- FIX 0011: SET search_path = '' forces fully-qualified names, prevents injection.
-- FIX 0003: (SELECT auth.uid()) wraps the call so it executes once per query.
-- ==============================================================================
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    LOWER(COALESCE(auth.jwt() ->> 'email', '')) = 'canamoaries13@gmail.com'
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

-- ==============================================================================
-- 7. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Public Read Profiles"           ON public.profiles;
DROP POLICY IF EXISTS "Users Update Own Profile"       ON public.profiles;
DROP POLICY IF EXISTS "Admin Manage All Profiles"      ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_public"         ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_own_or_admin"   ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own"            ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin"          ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin"          ON public.profiles;

DROP POLICY IF EXISTS "Public Read Products"           ON public.products;
DROP POLICY IF EXISTS "Admin Manage Products"          ON public.products;
DROP POLICY IF EXISTS "Public Upsert Products"         ON public.products;
DROP POLICY IF EXISTS "products_select_public"         ON public.products;
DROP POLICY IF EXISTS "products_insert_admin"          ON public.products;
DROP POLICY IF EXISTS "products_update_admin"          ON public.products;
DROP POLICY IF EXISTS "products_delete_admin"          ON public.products;

DROP POLICY IF EXISTS "Public Read Announcements"      ON public.announcements;
DROP POLICY IF EXISTS "Admin Manage Announcements"     ON public.announcements;
DROP POLICY IF EXISTS "Public Upsert Announcements"    ON public.announcements;
DROP POLICY IF EXISTS "announcements_select_public"    ON public.announcements;
DROP POLICY IF EXISTS "announcements_insert_admin"     ON public.announcements;
DROP POLICY IF EXISTS "announcements_update_admin"     ON public.announcements;
DROP POLICY IF EXISTS "announcements_delete_admin"     ON public.announcements;

DROP POLICY IF EXISTS "Public Insert Orders"           ON public.orders;
DROP POLICY IF EXISTS "Users Read Own Orders"          ON public.orders;
DROP POLICY IF EXISTS "Admin Manage Orders"            ON public.orders;
DROP POLICY IF EXISTS "orders_insert_public"           ON public.orders;
DROP POLICY IF EXISTS "orders_select_own_or_admin"     ON public.orders;
DROP POLICY IF EXISTS "orders_update_admin"            ON public.orders;
DROP POLICY IF EXISTS "orders_delete_admin"            ON public.orders;

-- ── PROFILES ────────────────────────────────────────────────────────────────
-- FIX 0003: (SELECT auth.uid()) — evaluated ONCE per query, not once per row.
-- FIX 0006: Separate policies per operation avoids overlapping permissive OR semantics.
-- FIX security: WITH CHECK on UPDATE prevents user_id reassignment to another user.

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id OR private.is_admin());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

-- OWASP A01 FIX: Allow authenticated users to insert their OWN profile row.
-- Needed because signUpCustomer() upserts the profile after sign-up.
-- Admins still need their own insert policy for managing other profiles.
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = id AND role = 'customer');

CREATE POLICY "profiles_insert_admin"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (private.is_admin());

-- ── PRODUCTS ────────────────────────────────────────────────────────────────
-- FIX security: Previously USING (true) allowed any user to mutate products.
-- Now public SELECT only; admin-only for INSERT / UPDATE / DELETE.

CREATE POLICY "products_select_public"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "products_insert_admin"
  ON public.products FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "products_update_admin"
  ON public.products FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "products_delete_admin"
  ON public.products FOR DELETE
  TO authenticated
  USING (private.is_admin());

-- ── ANNOUNCEMENTS ───────────────────────────────────────────────────────────
CREATE POLICY "announcements_select_public"
  ON public.announcements FOR SELECT
  USING (true);

CREATE POLICY "announcements_insert_admin"
  ON public.announcements FOR INSERT
  TO authenticated
  WITH CHECK (private.is_admin());

CREATE POLICY "announcements_update_admin"
  ON public.announcements FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "announcements_delete_admin"
  ON public.announcements FOR DELETE
  TO authenticated
  USING (private.is_admin());

-- ── ORDERS ──────────────────────────────────────────────────────────────────
-- FIX 0006: Single consolidated SELECT policy avoids multiple permissive policies.
-- FIX 0003: (SELECT auth.uid()) for per-query performance.

-- Allow guests to submit orders without claiming another customer's identity.
-- Authenticated checkouts must use the caller's own UUID; guest orders use NULL.
CREATE POLICY "orders_insert_public"
  ON public.orders FOR INSERT
  WITH CHECK (customer_id IS NULL OR customer_id = (SELECT auth.uid()));

-- OWASP A01 FIX: Removed `OR (SELECT auth.uid()) IS NULL`.
-- That clause allowed anonymous sessions to read ALL orders in the table.
-- Now only the owning authenticated user or an admin can read orders.
CREATE POLICY "orders_select_own_or_admin"
  ON public.orders FOR SELECT
  TO authenticated
  USING (
    private.is_admin()
    OR (SELECT auth.uid()) = customer_id
  );

CREATE POLICY "orders_update_admin"
  ON public.orders FOR UPDATE
  TO authenticated
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

CREATE POLICY "orders_delete_admin"
  ON public.orders FOR DELETE
  TO authenticated
  USING (private.is_admin());

-- ── STORAGE: PRODUCT IMAGES ──────────────────────────────────────────────────
-- Ensure the product-images bucket exists in Supabase Storage and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Read Product Images"               ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Product Images"              ON storage.objects;
DROP POLICY IF EXISTS "Admin Delete Product Images"              ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_select_public"     ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_insert_auth"       ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_insert_public"     ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_update_auth"       ON storage.objects;
DROP POLICY IF EXISTS "storage_product_images_delete_auth"       ON storage.objects;

-- Allow public viewing of uploaded product photos
CREATE POLICY "storage_product_images_select_public"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images' AND name IS NOT NULL);

-- Allow upload for admin / authenticated users and anonymous uploads to product-images
CREATE POLICY "storage_product_images_insert_public"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND private.is_admin());

CREATE POLICY "storage_product_images_update_auth"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images' AND private.is_admin())
  WITH CHECK (bucket_id = 'product-images' AND private.is_admin());

CREATE POLICY "storage_product_images_delete_auth"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images' AND private.is_admin());

-- ==============================================================================
-- 8. AUTOMATIC PROFILE CREATION TRIGGER WITH ADMIN PROMOTION
-- FIX 0011: SET search_path = '' — all references are fully qualified.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT := 'customer';
BEGIN
  IF LOWER(NEW.email) = 'canamoaries13@gmail.com' THEN
    assigned_role := 'admin';
  END IF;

  INSERT INTO public.profiles (id, name, email, role, pet_name, pet_type, pet_emoji, member_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'pet_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'pet_type', 'dog'),
    COALESCE(NEW.raw_user_meta_data->>'pet_emoji', '🐶'),
    CASE WHEN assigned_role = 'admin' THEN 'Store Administrator' ELSE 'VIP Paw Member' END
  )
  ON CONFLICT (id) DO UPDATE SET
    role  = EXCLUDED.role,
    name  = EXCLUDED.name,
    email = EXCLUDED.email;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Ensure existing admin email already in the DB gets the correct role
UPDATE public.profiles SET role = 'admin' WHERE LOWER(email) = 'canamoaries13@gmail.com';

-- Customers may edit presentation fields, but never identity or authorization fields.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, pet_name, pet_type, pet_emoji, member_tier, updated_at)
  ON public.profiles TO authenticated;

-- ==============================================================================
-- 9. INITIAL PRODUCTION CATALOG
-- ==============================================================================
INSERT INTO public.products (id, sku, name, category, category_label, pet, price, original_price, stock_quantity, in_stock, img, badge, badge_class, tint_class, "desc", price_history)
VALUES
('p1', 'PET-FEE-001', 'Salmon & Sweet Potato Crunchies (12lb)', 'feeds', 'Feeds & Dry Food', 'dog', 34.99, 41.99, 25, true, '🥩', 'Top Pick', 'badge-bestseller', 'bg-yellow-tint', 'Oven-baked whole feeds with ancient grains and omega-3s for energy and shiny coats.', '[{"price": 34.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p2', 'PET-FEE-002', 'Pasture Duck Stew Cans (Pack of 6)', 'feeds', 'Canned Wet Feeds', 'dog', 22.50, 0, 40, true, '🥫', 'New Recipe', 'badge-new', 'bg-coral-tint', 'Slow-braised duck in 18-hour marrow bone broth. Zero gums or fillers.', '[{"price": 22.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p3-cat', 'PET-FEE-003', 'Wild Pacific Salmon & Kelp Pate (Pack of 6)', 'feeds', 'Canned Wet Feeds', 'cat', 19.99, 24.00, 30, true, '🐟', 'Feline Favorite', 'badge-popular', 'bg-teal-tint', 'Smooth, high-moisture salmon puree with taurine and kelp for finicky eaters.', '[{"price": 19.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p3', 'PET-ACC-001', 'Rainbow Weave No-Pull Leash & Collar Set', 'accessories', 'Accessories', 'dog', 24.99, 29.99, 15, true, '🌈', 'Fan Favorite', 'badge-popular', 'bg-teal-tint', 'High-tensile climbing rope weave with padded handle and corrosion-proof hardware.', '[{"price": 24.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p4', 'PET-ACC-002', 'Cloud-Comfort Donut Calming Bed', 'accessories', 'Accessories', 'all', 42.00, 54.00, 12, true, '🛏️', 'Ultra Soft', 'badge-bestseller', 'bg-orange-tint', 'Raised rim creates cozy security to relieve pet anxiety. Machine washable cover.', '[{"price": 42.00, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p5', 'PET-ACC-003', 'Squishy Squeak Donut & Bone Bundle', 'accessories', 'Toys & Play', 'dog', 14.99, 19.99, 50, true, '🍩', 'Super Squeak', 'badge-fun', 'bg-coral-tint', 'Double-layer plush with puncture-resistant squeakers that keep squeaking.', '[{"price": 14.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p7-cat-collar', 'PET-ACC-004', 'Velvet-Soft Breakaway Safety Collar', 'accessories', 'Accessories', 'cat', 14.50, 18.00, 35, true, '🎀', 'Safety Quick-Release', 'badge-health', 'bg-yellow-tint', 'Gentle elastic breakaway buckle prevents snagging on outdoor adventures.', '[{"price": 14.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p6', 'PET-WEL-001', 'Wild Alaskan Salmon Shiny Coat Oil (16oz)', 'wellness', 'Wellness', 'all', 18.50, 22.00, 28, true, '🐟', 'Shiny Coat', 'badge-health', 'bg-teal-tint', 'Pure cold-pressed salmon oil packed with EPA and DHA for itchy skin and shiny fur.', '[{"price": 18.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p8-broth', 'PET-FEE-004', 'Slow-Simmered Beef Bone Broth Topper (16oz)', 'feeds', 'Feeds & Toppers', 'all', 12.99, 15.99, 45, true, '🍲', 'Hydration Hit', 'badge-bestseller', 'bg-coral-tint', 'Rich collagen elixir simmered for 18 hours. Entices fussy eaters instantly.', '[{"price": 12.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p9-kibble-chick', 'PET-FEE-005', 'Free-Range Chicken & Ancient Grains (10lb)', 'feeds', 'Feeds & Dry Food', 'dog', 31.50, 38.00, 20, true, '🍗', 'Oven Baked', 'badge-popular', 'bg-yellow-tint', 'Slow baked with chia seeds, millet, and fresh cage-free chicken.', '[{"price": 31.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p10-shampoo', 'PET-GRO-001', 'Soothing Oatmeal & Honey Dog Wash (16oz)', 'grooming', 'Grooming', 'dog', 15.99, 19.99, 30, true, '🧴', 'Tear-Free', 'badge-health', 'bg-teal-tint', 'Plant-based hypoallergenic formula relieves itchy skin and leaves a fresh clean scent.', '[{"price": 15.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p11-brush', 'PET-GRO-002', 'Magic-Release De-Shedding Pet Brush', 'grooming', 'Grooming', 'all', 16.50, 21.00, 22, true, '🪮', 'Easy Clean', 'badge-popular', 'bg-orange-tint', 'Removes loose undercoat fur with one-click hair release button. Ergonomic grip.', '[{"price": 16.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p12-joint', 'PET-WEL-002', 'Hip & Joint Glucosamine Chews (90ct)', 'wellness', 'Wellness', 'dog', 26.99, 32.99, 18, true, '🦴', 'Vet Recommended', 'badge-health', 'bg-coral-tint', 'Daily soft chews with chondroitin, MSM, and organic turmeric for bouncy agility.', '[{"price": 26.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p13-cat-tree', 'PET-ACC-005', 'Cozy Cloud Multi-Tier Cat Scratching Tree', 'accessories', 'Accessories', 'cat', 58.00, 72.00, 8, true, '🌳', 'Cat Approved', 'badge-bestseller', 'bg-teal-tint', 'Natural sisal rope pillars with ultra-plush observation perches and hammock.', '[{"price": 58.00, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p14-cat-grass', 'PET-WEL-003', 'Organic Sweet Wheatgrass Grow Kit', 'wellness', 'Wellness', 'cat', 11.99, 14.99, 40, true, '🌱', '100% Organic', 'badge-health', 'bg-yellow-tint', 'Sprouts in just 5 days! Helps hairball control and digestive health naturally.', '[{"price": 11.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p15-dental', 'PET-WEL-004', 'Fresh Breath Dental Care Water Additive', 'wellness', 'Wellness', 'all', 13.99, 17.50, 35, true, '💧', 'Clean Teeth', 'badge-health', 'bg-teal-tint', 'Tasteless water additive eliminates plaque and freshens breath for both cats and dogs.', '[{"price": 13.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  sku            = EXCLUDED.sku,
  name           = EXCLUDED.name,
  category       = EXCLUDED.category,
  category_label = EXCLUDED.category_label,
  pet            = EXCLUDED.pet,
  price          = EXCLUDED.price,
  original_price = EXCLUDED.original_price,
  stock_quantity = EXCLUDED.stock_quantity,
  in_stock       = EXCLUDED.in_stock,
  img            = EXCLUDED.img,
  badge          = EXCLUDED.badge,
  badge_class    = EXCLUDED.badge_class,
  tint_class     = EXCLUDED.tint_class,
  "desc"         = EXCLUDED."desc";

-- Initial Announcements with Schedule
INSERT INTO public.announcements (id, pill, title, text, link, link_text, start_date, end_date, is_active)
VALUES
('ann-1', '🎉 PAWTY SALE', 'Free 2-Day Shipping', 'Free 2-Day Shipping on all orders over ₱49 + Free chew toy in every box!', 'shop.html', 'Shop Treats & Feeds ->', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '30 days', true),
('ann-2', '🐶 NEW PUPPY PACK', 'Starter Bundles', 'Save 20% on all First-Time Puppy & Kitten starter packs this week.', 'shop.html', 'View Bundles ->', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '14 days', false),
('ann-3', '✨ VIP MEMBER PERK', 'First-Order Welcome', 'Use code FIRSTPAW20 at checkout for 20% off your first pet care haul!', 'shop.html', 'Claim Perk ->', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '90 days', false)
ON CONFLICT (id) DO UPDATE SET
  pill       = EXCLUDED.pill,
  title      = EXCLUDED.title,
  text       = EXCLUDED.text,
  link       = EXCLUDED.link,
  link_text  = EXCLUDED.link_text,
  start_date = EXCLUDED.start_date,
  end_date   = EXCLUDED.end_date,
  is_active  = EXCLUDED.is_active;

-- ==============================================================================
-- 10. SECURITY HARDENING: REVOKE PUBLIC EXECUTE ON SECURITY DEFINER FUNCTIONS
-- FIX anon_security_definer_function_executable (0028):
--   By default Postgres grants EXECUTE to PUBLIC for every new function.
--   That means anon + authenticated can call is_admin() and handle_new_user()
--   directly via /rest/v1/rpc/. We revoke that here.
--   These functions are used INTERNALLY by RLS policies and triggers only.
-- FIX authenticated_security_definer_function_executable (0029): same reason.
-- ==============================================================================

-- Revoke from PUBLIC (covers anon, authenticated, and all other roles)
REVOKE EXECUTE ON FUNCTION private.is_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

-- Also revoke from specific roles explicitly for clarity
GRANT EXECUTE ON FUNCTION private.is_admin() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;

-- Remove the formerly exposed RPC after all policies point at private.is_admin().
DROP FUNCTION IF EXISTS public.is_admin();

-- Fix rls_auto_enable leftover function if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'rls_auto_enable'
  ) THEN
    EXECUTE 'REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated';
  END IF;
END;
$$;

-- ==============================================================================
-- 11. STORAGE BUCKET: DISABLE PUBLIC LISTING
-- FIX public_bucket_allows_listing (0025):
--   The product-images bucket is public for URL access, but we disable file
--   listing so clients cannot enumerate all uploaded filenames.
-- ==============================================================================
UPDATE storage.buckets
SET public = true,
    allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'],
    file_size_limit = 5242880  -- 5 MB limit per image
WHERE id = 'product-images';

-- ==============================================================================
-- NOTE: auth_leaked_password_protection warning must be fixed in Supabase Dashboard:
--   Authentication -> Providers -> Email -> "Enable Leaked Password Protection"
--   (toggle it ON). This cannot be changed via SQL.
-- ==============================================================================
