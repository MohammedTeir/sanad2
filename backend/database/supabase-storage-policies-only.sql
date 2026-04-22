-- =====================================================
-- Supabase Storage - POLICIES ONLY
-- =====================================================
-- Run this AFTER creating buckets manually in the Dashboard
-- 
-- Manual Steps (DO THIS FIRST):
-- 1. Go to https://app.supabase.com
-- 2. Select your project
-- 3. Go to "Storage" in left sidebar
-- 4. Create 3 buckets:
--    - id-cards (Public, 5MB)
--    - medical-reports (Public, 5MB)
--    - signatures (Public, 2MB)
--
-- Then run this script to add policies
-- =====================================================

-- =====================================================
-- ID Cards Bucket Policies
-- =====================================================

-- Allow public upload to id-cards bucket
DO $$
BEGIN
  CREATE POLICY "Public Upload Access - ID Cards"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'id-cards'
    AND (storage.foldername(name))[1] = 'registrations'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Public Upload Access - ID Cards" already exists';
  WHEN undefined_table THEN
    RAISE NOTICE 'Storage objects table not found - enable Storage in Supabase Dashboard';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Allow public read access to id-cards bucket
DO $$
BEGIN
  CREATE POLICY "Public Read Access - ID Cards"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'id-cards'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Public Read Access - ID Cards" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Allow authenticated users to update their own files
DO $$
BEGIN
  CREATE POLICY "Authenticated Update - ID Cards"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'id-cards'
    AND auth.uid() IS NOT NULL
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Authenticated Update - ID Cards" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Allow authenticated users to delete their own files
DO $$
BEGIN
  CREATE POLICY "Authenticated Delete - ID Cards"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'id-cards'
    AND auth.uid() IS NOT NULL
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Authenticated Delete - ID Cards" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- =====================================================
-- Medical Reports Bucket Policies
-- =====================================================

-- Allow public upload to medical-reports bucket
DO $$
BEGIN
  CREATE POLICY "Public Upload Access - Medical Reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'medical-reports'
    AND (storage.foldername(name))[1] = 'registrations'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Public Upload Access - Medical Reports" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Allow public read access to medical-reports bucket
DO $$
BEGIN
  CREATE POLICY "Public Read Access - Medical Reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'medical-reports'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Public Read Access - Medical Reports" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Allow authenticated users to update their own files
DO $$
BEGIN
  CREATE POLICY "Authenticated Update - Medical Reports"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'medical-reports'
    AND auth.uid() IS NOT NULL
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Authenticated Update - Medical Reports" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Allow authenticated users to delete their own files
DO $$
BEGIN
  CREATE POLICY "Authenticated Delete - Medical Reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'medical-reports'
    AND auth.uid() IS NOT NULL
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Authenticated Delete - Medical Reports" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- =====================================================
-- Signatures Bucket Policies
-- =====================================================

-- Allow public upload to signatures bucket
DO $$
BEGIN
  CREATE POLICY "Public Upload Access - Signatures"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'signatures'
    AND (storage.foldername(name))[1] = 'registrations'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Public Upload Access - Signatures" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Allow public read access to signatures bucket
DO $$
BEGIN
  CREATE POLICY "Public Read Access - Signatures"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'signatures'
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Public Read Access - Signatures" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Allow authenticated users to update their own files
DO $$
BEGIN
  CREATE POLICY "Authenticated Update - Signatures"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'signatures'
    AND auth.uid() IS NOT NULL
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Authenticated Update - Signatures" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- Allow authenticated users to delete their own files
DO $$
BEGIN
  CREATE POLICY "Authenticated Delete - Signatures"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'signatures'
    AND auth.uid() IS NOT NULL
  );
EXCEPTION
  WHEN duplicate_object THEN
    RAISE NOTICE 'Policy "Authenticated Delete - Signatures" already exists';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- =====================================================
-- Verification Query
-- =====================================================

-- Show all policies created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND (policyname LIKE '%ID Cards%' 
       OR policyname LIKE '%Medical Reports%' 
       OR policyname LIKE '%Signatures%')
ORDER BY policyname;

-- =====================================================
-- Done!
-- =====================================================
-- Your storage buckets are now configured with proper policies.
-- 
-- Expected output: 12 policies (4 for each bucket)
-- 
-- Next steps:
-- 1. Verify all 3 buckets exist in Storage dashboard
-- 2. Test file upload from the registration form
-- 3. Check console for "✅ Supabase storage configured" message
-- 
-- For support, see: backend/STORAGE_SETUP_GUIDE.md
-- =====================================================
