-- =====================================================
-- Supabase Storage - ID CARDS BUCKET POLICIES ONLY
-- =====================================================
-- Run this AFTER creating the id-cards bucket manually
-- 
-- Manual Steps (Already Done):
-- 1. Go to https://app.supabase.com
-- 2. Storage > Create bucket
-- 3. Created: id-cards (Public, 5MB)
--
-- This script creates policies for id-cards bucket only
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
-- Verification Query
-- =====================================================

-- Show all policies created for id-cards
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
  AND policyname LIKE '%ID Cards%'
ORDER BY policyname;

-- =====================================================
-- Done!
-- =====================================================
-- Your id-cards bucket is now configured with proper policies.
-- 
-- Expected output: 4 policies
-- - Public Upload Access - ID Cards
-- - Public Read Access - ID Cards
-- - Authenticated Update - ID Cards
-- - Authenticated Delete - ID Cards
-- 
-- Next steps:
-- 1. Verify id-cards bucket exists in Storage dashboard
-- 2. Test file upload from the registration form
-- 3. Check console for "✅ Supabase storage configured" message
-- 
-- Note: You can add medical-reports and signatures buckets later
-- by running the full policies script when ready.
-- =====================================================
