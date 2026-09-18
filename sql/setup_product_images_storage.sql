-- ============================================================================
-- PETCHUP: PRODUCT IMAGES SUPABASE STORAGE BUCKET & RLS POLICIES
-- ============================================================================
-- 1. Creates 'product-images' public bucket in storage.buckets with:
--    - 5MB file size limit
--    - Allowed MIME types: JPEG, JPG, PNG, WEBP
-- 2. Grants public read access to all visitors and customers
-- 3. Restricts upload, update, and deletion to authenticated administrators
-- ============================================================================

-- 1. Create or update the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB (5 * 1024 * 1024 bytes)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 2. Storage RLS Policies
-- Note: RLS is already enabled by Supabase system on storage.objects.

-- 3. Read Access:
-- Public buckets automatically serve images via direct URL without RLS.
-- Restrict table queries (listing all files) to authenticated admins only.
DROP POLICY IF EXISTS "Public Read Product Images" ON storage.objects;
DROP POLICY IF EXISTS "Admin Read Product Images" ON storage.objects;
CREATE POLICY "Admin Read Product Images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    ))
  );

-- 4. Admin Upload: only authenticated admins can upload images to product-images
DROP POLICY IF EXISTS "Admin Upload Product Images" ON storage.objects;
CREATE POLICY "Admin Upload Product Images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    ))
  );

-- 5. Admin Update: only authenticated admins can overwrite/update product images
DROP POLICY IF EXISTS "Admin Update Product Images" ON storage.objects;
CREATE POLICY "Admin Update Product Images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    ))
  );

-- 6. Admin Delete: only authenticated admins can remove product images
DROP POLICY IF EXISTS "Admin Delete Product Images" ON storage.objects;
CREATE POLICY "Admin Delete Product Images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    ))
  );
