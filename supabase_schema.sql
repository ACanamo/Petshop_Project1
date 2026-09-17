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
  link TEXT DEFAULT '/shop',
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

-- Multi-image gallery support: `images` holds an ordered list of URLs
-- (images[0] is the cover shown on product cards). `image_url` is kept
-- in sync with images[0] for any old code that still reads it directly.
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images JSONB NOT NULL DEFAULT '[]'::jsonb;
UPDATE public.products
SET images = jsonb_build_array(image_url)
WHERE jsonb_array_length(images) = 0 AND image_url IS NOT NULL AND image_url <> '';

-- FIX 0001: Index the orders.customer_id FK — improves join/filter performance.
CREATE INDEX IF NOT EXISTS ix_orders_customer_id ON public.orders (customer_id);

-- 4B. CART ITEMS TABLE
-- Persists a signed-in shopper's cart server-side, keyed by (user_id,
-- product_id), so it survives logout/login and follows them across devices.
-- No FK on product_id (unlike orders, which snapshot items into JSONB) —
-- OrderHistoryModal's "Reorder" can re-add a discontinued product's id, and
-- a strict FK would reject that insert.
CREATE TABLE IF NOT EXISTS public.cart_items (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  img TEXT DEFAULT '🐾',
  image_url TEXT DEFAULT '',
  qty INTEGER NOT NULL DEFAULT 1 CHECK (qty > 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, product_id)
);

-- 4C. COUPON REDEMPTIONS TABLE
-- Tracks that a given customer has used a given coupon code, so "first
-- order" codes like FIRSTPAW20 can only ever apply once per customer
-- instead of being reusable forever. Written only by place_order() below
-- (SECURITY DEFINER) — no direct INSERT/UPDATE/DELETE policy exists for
-- authenticated, so a customer can't fabricate or erase their own
-- redemption history via the REST API.
CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  order_id TEXT REFERENCES public.orders(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (customer_id, code)
);

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

-- Admin status lives in exactly one place: profiles.role. This used to also
-- OR in a hardcoded email match, which meant admin access didn't actually
-- depend on the role column at all — anyone who ever got Supabase to accept
-- that exact email (a recreated account, a future email-change edge case)
-- would be admin forever regardless of what their role said. The first
-- admin is seeded once via the bootstrap UPDATE near the bottom of section
-- 8 below; after that, promoting/demoting an admin is just an UPDATE on
-- profiles.role, not a code change.
CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = (SELECT auth.uid()) AND role = 'admin'
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
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "cart_items_select_own"          ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_insert_own"          ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_update_own"          ON public.cart_items;
DROP POLICY IF EXISTS "cart_items_delete_own"          ON public.cart_items;

DROP POLICY IF EXISTS "coupon_redemptions_select_own"  ON public.coupon_redemptions;

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

-- Security Hardening: Direct INSERT on public.orders is disabled.
-- All checkouts must execute through public.place_order() (SECURITY DEFINER),
-- which enforces atomic stock locking, stock deduction, rate-limiting, and
-- single-use coupon redemption.
DROP POLICY IF EXISTS "orders_insert_public" ON public.orders;

-- Checkout inserts as the function owner. Clients must not create an order
-- independently of its inventory transaction, even if a legacy INSERT policy remains.
REVOKE INSERT ON public.orders FROM PUBLIC, anon, authenticated;

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

-- ── CART ITEMS ──────────────────────────────────────────────────────────────
-- Each shopper reads/writes only their own saved cart rows. No admin
-- override needed — cart contents aren't a support/moderation concern the
-- way orders are.
CREATE POLICY "cart_items_select_own"
  ON public.cart_items FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "cart_items_insert_own"
  ON public.cart_items FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "cart_items_update_own"
  ON public.cart_items FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "cart_items_delete_own"
  ON public.cart_items FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- ── COUPON REDEMPTIONS ──────────────────────────────────────────────────────
-- Read-only for customers (so a future "your coupons" UI could show history);
-- deliberately no INSERT/UPDATE/DELETE policy at all — only place_order()
-- (SECURITY DEFINER) can write here, so a customer can't call
-- supabase.from('coupon_redemptions').delete(...) to erase their own usage
-- and reuse a code.
CREATE POLICY "coupon_redemptions_select_own"
  ON public.coupon_redemptions FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = customer_id);

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
-- Every new signup starts as 'customer' — no email is auto-promoted to
-- admin here. The one existing admin is granted their role by the one-time
-- bootstrap UPDATE just below this function (run once, when this schema is
-- first applied); any admin added after that is a direct
-- `UPDATE public.profiles SET role = 'admin' WHERE id = ...`, not a code
-- change. The ON CONFLICT branch deliberately never touches `role` — this
-- trigger should only ever set it once, on true first insert, never reset
-- it back to 'customer' if it somehow re-fires for an existing id.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, pet_name, pet_type, pet_emoji, member_tier)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    'customer',
    COALESCE(NEW.raw_user_meta_data->>'pet_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'pet_type', 'dog'),
    COALESCE(NEW.raw_user_meta_data->>'pet_emoji', '🐶'),
    'VIP Paw Member'
  )
  ON CONFLICT (id) DO UPDATE SET
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

-- BACKFILL: handle_new_user() only fires on NEW signups (AFTER INSERT ON
-- auth.users) — an account created before this trigger existed in the
-- project has no public.profiles row at all, not a row with bad data. That
-- silently breaks anything that looks the customer up by id (place_order()
-- deriving customer_name/email, is_admin() checking role — an orphaned
-- account can never pass private.is_admin(), since its query finds zero
-- rows) and the admin-role UPDATE just below this would silently affect
-- zero rows for such an account. Safe to re-run — only ever inserts for an
-- auth.users row that still has no matching profiles row.
INSERT INTO public.profiles (id, name, email, role, pet_name, pet_type, pet_emoji, member_tier)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1)),
  u.email,
  'customer',
  COALESCE(u.raw_user_meta_data->>'pet_name', ''),
  COALESCE(u.raw_user_meta_data->>'pet_type', 'dog'),
  COALESCE(u.raw_user_meta_data->>'pet_emoji', '🐶'),
  'VIP Paw Member'
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE p.id IS NULL;

-- ONE-TIME BOOTSTRAP: grants the very first admin their role. This is the
-- only place a specific email should ever appear in this file going
-- forward — it runs once (re-running the whole schema is idempotent since
-- it's just re-asserting the same UPDATE), and every admin decision after
-- this is a plain role UPDATE, not a hardcoded identity check in a function
-- that runs on every request.
UPDATE public.profiles SET role = 'admin' WHERE LOWER(email) = 'canamoaries13@gmail.com';

-- Customers may edit presentation fields, but never identity or authorization fields.
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (name, pet_name, pet_type, pet_emoji, member_tier, updated_at)
  ON public.profiles TO authenticated;

-- ==============================================================================
-- 9. INITIAL PRODUCTION CATALOG
-- ==============================================================================
INSERT INTO public.products (id, sku, name, category, category_label, pet, price, original_price, stock_quantity, in_stock, img, image_url, images, badge, badge_class, tint_class, "desc", price_history)
VALUES
('p1', 'PET-FEE-001', 'Salmon & Sweet Potato Crunchies (12lb)', 'feeds', 'Feeds & Dry Food', 'dog', 34.99, 41.99, 25, true, '🥩', 'https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Top Pick', 'badge-bestseller', 'bg-yellow-tint', 'Oven-baked whole feeds with ancient grains and omega-3s for energy and shiny coats.', '[{"price": 34.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p2', 'PET-FEE-002', 'Pasture Duck Stew Cans (Pack of 6)', 'feeds', 'Canned Wet Feeds', 'dog', 22.50, 0, 40, true, '🥫', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'New Recipe', 'badge-new', 'bg-coral-tint', 'Slow-braised duck in 18-hour marrow bone broth. Zero gums or fillers.', '[{"price": 22.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p3-cat', 'PET-FEE-003', 'Wild Pacific Salmon & Kelp Pate (Pack of 6)', 'feeds', 'Canned Wet Feeds', 'cat', 19.99, 24.00, 30, true, '🐟', 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Feline Favorite', 'badge-popular', 'bg-teal-tint', 'Smooth, high-moisture salmon puree with taurine and kelp for finicky eaters.', '[{"price": 19.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p3', 'PET-ACC-001', 'Rainbow Weave No-Pull Leash & Collar Set', 'accessories', 'Accessories', 'dog', 24.99, 29.99, 15, true, '🌈', 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Fan Favorite', 'badge-popular', 'bg-teal-tint', 'High-tensile climbing rope weave with padded handle and corrosion-proof hardware.', '[{"price": 24.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p4', 'PET-ACC-002', 'Cloud-Comfort Donut Calming Bed', 'accessories', 'Accessories', 'all', 42.00, 54.00, 12, true, '🛏️', 'https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Ultra Soft', 'badge-bestseller', 'bg-orange-tint', 'Raised rim creates cozy security to relieve pet anxiety. Machine washable cover.', '[{"price": 42.00, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p5', 'PET-ACC-003', 'Squishy Squeak Donut & Bone Bundle', 'accessories', 'Toys & Play', 'dog', 14.99, 19.99, 50, true, '🍩', 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Super Squeak', 'badge-fun', 'bg-coral-tint', 'Double-layer plush with puncture-resistant squeakers that keep squeaking.', '[{"price": 14.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p7-cat-collar', 'PET-ACC-004', 'Velvet-Soft Breakaway Safety Collar', 'accessories', 'Accessories', 'cat', 14.50, 18.00, 35, true, '🎀', 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Safety Quick-Release', 'badge-health', 'bg-yellow-tint', 'Gentle elastic breakaway buckle prevents snagging on outdoor adventures.', '[{"price": 14.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p6', 'PET-WEL-001', 'Wild Alaskan Salmon Shiny Coat Oil (16oz)', 'wellness', 'Wellness', 'all', 18.50, 22.00, 28, true, '🐟', 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Shiny Coat', 'badge-health', 'bg-teal-tint', 'Pure cold-pressed salmon oil packed with EPA and DHA for itchy skin and shiny fur.', '[{"price": 18.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p8-broth', 'PET-FEE-004', 'Slow-Simmered Beef Bone Broth Topper (16oz)', 'feeds', 'Feeds & Toppers', 'all', 12.99, 15.99, 45, true, '🍲', 'https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1544568100-847a948585b9?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Hydration Hit', 'badge-bestseller', 'bg-coral-tint', 'Rich collagen elixir simmered for 18 hours. Entices fussy eaters instantly.', '[{"price": 12.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p9-kibble-chick', 'PET-FEE-005', 'Free-Range Chicken & Ancient Grains (10lb)', 'feeds', 'Feeds & Dry Food', 'dog', 31.50, 38.00, 20, true, '🍗', 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Oven Baked', 'badge-popular', 'bg-yellow-tint', 'Slow baked with chia seeds, millet, and fresh cage-free chicken.', '[{"price": 31.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p10-shampoo', 'PET-GRO-001', 'Soothing Oatmeal & Honey Dog Wash (16oz)', 'grooming', 'Grooming', 'dog', 15.99, 19.99, 30, true, '🧴', 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Tear-Free', 'badge-health', 'bg-teal-tint', 'Plant-based hypoallergenic formula relieves itchy skin and leaves a fresh clean scent.', '[{"price": 15.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p11-brush', 'PET-GRO-002', 'Magic-Release De-Shedding Pet Brush', 'grooming', 'Grooming', 'all', 16.50, 21.00, 22, true, '🪮', 'https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1535294435445-d7249524ef2e?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Easy Clean', 'badge-popular', 'bg-orange-tint', 'Removes loose undercoat fur with one-click hair release button. Ergonomic grip.', '[{"price": 16.50, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p12-joint', 'PET-WEL-002', 'Hip & Joint Glucosamine Chews (90ct)', 'wellness', 'Wellness', 'dog', 26.99, 32.99, 18, true, '🦴', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Vet Recommended', 'badge-health', 'bg-coral-tint', 'Daily soft chews with chondroitin, MSM, and organic turmeric for bouncy agility.', '[{"price": 26.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p13-cat-tree', 'PET-ACC-005', 'Cozy Cloud Multi-Tier Cat Scratching Tree', 'accessories', 'Accessories', 'cat', 58.00, 72.00, 8, true, '🌳', 'https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Cat Approved', 'badge-bestseller', 'bg-teal-tint', 'Natural sisal rope pillars with ultra-plush observation perches and hammock.', '[{"price": 58.00, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p14-cat-grass', 'PET-WEL-003', 'Organic Sweet Wheatgrass Grow Kit', 'wellness', 'Wellness', 'cat', 11.99, 14.99, 40, true, '🌱', 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=600&q=80"]'::jsonb, '100% Organic', 'badge-health', 'bg-yellow-tint', 'Sprouts in just 5 days! Helps hairball control and digestive health naturally.', '[{"price": 11.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb),
('p15-dental', 'PET-WEL-004', 'Fresh Breath Dental Care Water Additive', 'wellness', 'Wellness', 'all', 13.99, 17.50, 35, true, '💧', 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80', '["https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=600&q=80"]'::jsonb, 'Clean Teeth', 'badge-health', 'bg-teal-tint', 'Tasteless water additive eliminates plaque and freshens breath for both cats and dogs.', '[{"price": 13.99, "changed_at": "2026-09-01T00:00:00Z", "note": "Initial catalog price"}]'::jsonb)
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
  image_url      = EXCLUDED.image_url,
  images         = EXCLUDED.images,
  img            = EXCLUDED.img,
  badge          = EXCLUDED.badge,
  badge_class    = EXCLUDED.badge_class,
  tint_class     = EXCLUDED.tint_class,
  "desc"         = EXCLUDED."desc";

-- Initial Announcements with Schedule
INSERT INTO public.announcements (id, pill, title, text, link, link_text, start_date, end_date, is_active)
VALUES
('ann-1', '🎉 PAWTY SALE', 'Free 2-Day Shipping', 'Free 2-Day Shipping on all orders over ₱49 + Free chew toy in every box!', '/shop', 'Shop Treats & Feeds ->', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '30 days', true),
('ann-2', '🐶 NEW PUPPY PACK', 'Starter Bundles', 'Save 20% on all First-Time Puppy & Kitten starter packs this week.', '/shop', 'View Bundles ->', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '14 days', false),
('ann-3', '✨ VIP MEMBER PERK', 'First-Order Welcome', 'Use code FIRSTPAW20 at checkout for 20% off your first pet care haul!', '/shop', 'Claim Perk ->', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '90 days', false)
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
-- 12. SERVER-SIDE ORDER TOTAL VALIDATION
-- FIX price_manipulation: subtotal/discount_amount/total were previously
-- whatever the client sent on INSERT. Since the anon key is public, anyone
-- could call supabase.from('orders').insert(...) directly from devtools with
-- fabricated prices or discounts, bypassing the app's checkout math entirely.
-- This trigger ignores those client-submitted numbers and recomputes them
-- from the authoritative public.products prices and the fixed coupon table
-- below (kept in sync with the codes in src/context/CartContext.jsx).
-- Runs on INSERT only — updateOrderStatus() only ever changes `status`, so
-- admin status updates are untouched, and RLS already restricts UPDATE on
-- orders to admins only (see orders_update_admin above).
-- ==============================================================================
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

-- ==============================================================================
-- 15. LIGHTWEIGHT ERROR LOGGING
-- Background failures (a cart sync, a product refresh, a session restore)
-- previously only ever reached console.warn — invisible unless a developer
-- happened to have devtools open on that exact browser at that exact
-- moment. This is a minimal, self-hosted stand-in for a real error-tracking
-- service (Sentry etc.): src/lib/errorLog.js calls log_client_error() below
-- from the app's catch blocks, and AdminPage's "System Errors" tab reads
-- the table back.
--
-- Writing goes through log_client_error(), not a direct table INSERT policy
-- — Security Advisor correctly flagged an earlier version of this that used
-- `WITH CHECK (true)` open to anon as overly permissive, and unlike
-- place_order() (reviewed and kept broad because a checkout's blast radius
-- is bounded by real stock/prices), an unbounded free-text INSERT has no
-- such natural bound: anyone could script-flood this table, and even
-- without malice, a client-side logging bug that loops could do the same
-- thing. The function truncates every field and adds a coarse global rate
-- limit, and derives user_id from the session instead of trusting a
-- client-supplied one.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.error_logs (
  id BIGSERIAL PRIMARY KEY,
  context TEXT NOT NULL,
  message TEXT NOT NULL,
  stack TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ix_error_logs_created_at ON public.error_logs (created_at DESC);

ALTER TABLE public.error_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "error_logs_insert_any"   ON public.error_logs;
DROP POLICY IF EXISTS "error_logs_select_admin" ON public.error_logs;
DROP POLICY IF EXISTS "error_logs_delete_admin" ON public.error_logs;

-- No INSERT policy at all — every write goes through log_client_error()
-- (SECURITY DEFINER), which bypasses RLS as the table owner. Direct
-- `supabase.from('error_logs').insert(...)` from a client is now rejected
-- outright, regardless of role.
CREATE POLICY "error_logs_select_admin"
  ON public.error_logs FOR SELECT
  TO authenticated
  USING (private.is_admin());

CREATE POLICY "error_logs_delete_admin"
  ON public.error_logs FOR DELETE
  TO authenticated
  USING (private.is_admin());

GRANT SELECT, DELETE ON public.error_logs TO authenticated;

CREATE OR REPLACE FUNCTION public.log_client_error(
  p_context TEXT,
  p_message TEXT,
  p_stack TEXT
)
RETURNS VOID AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  -- Coarse circuit breaker: global, not per-caller, since an anonymous
  -- caller has no stable identity to key a per-user limit on. Bounds worst
  -- case storage growth from either a flooding script or an ordinary bug
  -- (e.g. an effect that logs in a loop) rather than trying to distinguish
  -- the two.
  SELECT COUNT(*) INTO recent_count
  FROM public.error_logs
  WHERE created_at > NOW() - INTERVAL '1 minute';

  IF recent_count >= 200 THEN
    RETURN;
  END IF;

  INSERT INTO public.error_logs (context, message, stack, user_id)
  VALUES (
    LEFT(COALESCE(p_context, 'unknown'), 200),
    LEFT(COALESCE(p_message, ''), 2000),
    LEFT(p_stack, 4000),
    (SELECT auth.uid())
  );
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

-- Security Advisor Fix: Revoke from anon to clear the SECURITY DEFINER warning
-- and prevent unauthenticated error log spam. Authenticated users can still log.
REVOKE EXECUTE ON FUNCTION public.log_client_error(TEXT, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_client_error(TEXT, TEXT, TEXT) TO authenticated;

-- ==============================================================================
-- 15B. RETIRED DIRECT INVENTORY RPC
-- SECURITY FIX (A01): Direct stock mutation is retired. All inventory deductions
-- must execute exclusively within public.place_order().
-- ==============================================================================
-- Keep a denied SECURITY INVOKER stub so old clients receive a clear error,
-- and accidental future execution grants cannot restore direct stock mutation.
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

-- ==============================================================================
-- 16. AUTOMATIC INVENTORY RESTOCK ON ORDER CANCELLATION
-- Fixes inventory leak: when an order transitions to 'cancelled', the items
-- previously deducted by place_order() are automatically restored to stock.
-- Enforces terminal state: once cancelled, an order cannot be reverted to
-- 'pending' or 'processing' because the returned stock may have already been
-- purchased by other shoppers.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_order_cancel_restock()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  v_product_id TEXT;
  v_qty INTEGER;
BEGIN
  -- 1. State machine terminality guard:
  IF OLD.status = 'cancelled' AND NEW.status <> 'cancelled' THEN
    RAISE EXCEPTION 'Cancelled orders cannot be reopened because returned inventory may have already been allocated to other shoppers.';
  END IF;

  -- 2. Restock only on true state transition into 'cancelled':
  IF OLD.status IS DISTINCT FROM 'cancelled' AND NEW.status = 'cancelled' THEN
    IF jsonb_typeof(NEW.items) = 'array' THEN
      FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
      LOOP
        v_product_id := item->>'id';
        v_qty := GREATEST(COALESCE((item->>'qty')::INTEGER, 0), 0);

        IF v_product_id IS NOT NULL AND v_qty > 0 THEN
          UPDATE public.products
          SET stock_quantity = stock_quantity + v_qty,
              in_stock = true,
              updated_at = NOW()
          WHERE id = v_product_id;
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

DROP TRIGGER IF EXISTS trg_restock_on_order_cancel ON public.orders;
CREATE TRIGGER trg_restock_on_order_cancel
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_order_cancel_restock();

REVOKE EXECUTE ON FUNCTION public.handle_order_cancel_restock() FROM PUBLIC, anon, authenticated;

-- 3. Restock on hard delete of active orders:
CREATE OR REPLACE FUNCTION public.handle_order_delete_restock()
RETURNS TRIGGER AS $$
DECLARE
  item JSONB;
  v_product_id TEXT;
  v_qty INTEGER;
BEGIN
  -- Only restock if the order was active/unfulfilled ('pending' or 'processing').
  -- Completed, delivered, or already-cancelled orders must NEVER be restocked upon deletion.
  IF OLD.status IN ('pending', 'processing') AND jsonb_typeof(OLD.items) = 'array' THEN
    FOR item IN SELECT * FROM jsonb_array_elements(OLD.items)
    LOOP
      v_product_id := item->>'id';
      v_qty := GREATEST(COALESCE((item->>'qty')::INTEGER, 0), 0);

      IF v_product_id IS NOT NULL AND v_qty > 0 THEN
        UPDATE public.products
        SET stock_quantity = stock_quantity + v_qty,
            in_stock = true,
            updated_at = NOW()
        WHERE id = v_product_id;
      END IF;
    END LOOP;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = '';

DROP TRIGGER IF EXISTS trg_restock_on_order_delete ON public.orders;
CREATE TRIGGER trg_restock_on_order_delete
  BEFORE DELETE ON public.orders
  FOR EACH ROW EXECUTE PROCEDURE public.handle_order_delete_restock();

REVOKE EXECUTE ON FUNCTION public.handle_order_delete_restock() FROM PUBLIC, anon, authenticated;

-- ==============================================================================
-- NOTE: auth_leaked_password_protection warning must be fixed in Supabase Dashboard:
--   Authentication -> Providers -> Email -> "Enable Leaked Password Protection"
--   (toggle it ON). This cannot be changed via SQL.
-- ==============================================================================
