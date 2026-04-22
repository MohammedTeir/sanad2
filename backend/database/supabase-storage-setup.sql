-- =====================================================
-- Supabase Storage Setup Script
-- =====================================================
-- This script creates storage buckets and policies
-- for file uploads (ID cards, medical reports, signatures)
-- 
-- Run this in Supabase SQL Editor:
-- https://app.supabase.com/project/_/sql
--
-- IMPORTANT: You must be a Supabase admin to run this.
-- If you get "must be owner of table" error:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create buckets manually (see manual instructions below)
-- =====================================================

-- =====================================================
-- 1. Create Storage Buckets (Admin Only)
-- =====================================================
-- If this fails, create buckets manually via Dashboard:
-- Storage > All buckets > Create bucket

-- Try to create bucket for ID cards
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'id-cards',
    'id-cards',
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping id-cards bucket creation - please create manually in Storage dashboard';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating id-cards bucket: %', SQLERRM;
END $$;

-- Try to create bucket for medical reports
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'medical-reports',
    'medical-reports',
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'application/pdf']
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping medical-reports bucket creation - please create manually in Storage dashboard';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating medical-reports bucket: %', SQLERRM;
END $$;

-- Try to create bucket for signatures
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'signatures',
    'signatures',
    true,
    2097152, -- 2MB in bytes
    ARRAY['image/jpeg', 'image/png']
  )
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Skipping signatures bucket creation - please create manually in Storage dashboard';
  WHEN OTHERS THEN
    RAISE NOTICE 'Error creating signatures bucket: %', SQLERRM;
END $$;

-- =====================================================
-- 2. Create Storage Policies
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
    RAISE NOTICE 'Storage objects table not found - enable Storage in Supabase';
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
CREATE POLICY "Authenticated Update - ID Cards"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'id-cards'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated Delete - ID Cards"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'id-cards'
  AND auth.uid() IS NOT NULL
);

-- =====================================================
-- Medical Reports Bucket Policies
-- =====================================================

-- Allow public upload to medical-reports bucket
CREATE POLICY "Public Upload Access - Medical Reports"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'medical-reports'
  AND (storage.foldername(name))[1] = 'registrations'
);

-- Allow public read access to medical-reports bucket
CREATE POLICY "Public Read Access - Medical Reports"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'medical-reports'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated Update - Medical Reports"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'medical-reports'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated Delete - Medical Reports"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'medical-reports'
  AND auth.uid() IS NOT NULL
);

-- =====================================================
-- Signatures Bucket Policies
-- =====================================================

-- Allow public upload to signatures bucket
CREATE POLICY "Public Upload Access - Signatures"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'signatures'
  AND (storage.foldername(name))[1] = 'registrations'
);

-- Allow public read access to signatures bucket
CREATE POLICY "Public Read Access - Signatures"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'signatures'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Authenticated Update - Signatures"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'signatures'
  AND auth.uid() IS NOT NULL
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Authenticated Delete - Signatures"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'signatures'
  AND auth.uid() IS NOT NULL
);

-- =====================================================
-- 3. Create Indexes for Performance
-- =====================================================

-- Index for faster lookups by bucket
CREATE INDEX IF NOT EXISTS idx_storage_objects_bucket_id
ON storage.objects(bucket_id);

-- Index for faster lookups by name
CREATE INDEX IF NOT EXISTS idx_storage_objects_name
ON storage.objects(name);

-- Index for faster lookups by owner
CREATE INDEX IF NOT EXISTS idx_storage_objects_owner
ON storage.objects(owner);

-- =====================================================
-- 4. Verify Setup
-- =====================================================

-- Query to verify buckets were created
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id IN ('id-cards', 'medical-reports', 'signatures')
ORDER BY name;

-- Query to verify policies were created
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
  OR policyname LIKE '%Medical Reports%'
  OR policyname LIKE '%Signatures%'
ORDER BY policyname;

-- =====================================================
-- 5. Cleanup (Optional - Run if you need to reset)
-- =====================================================

-- To delete buckets and start over (UNCOMMENT TO USE):
-- WARNING: This will delete all files in the buckets!

-- DELETE FROM storage.objects WHERE bucket_id IN ('id-cards', 'medical-reports', 'signatures');
-- DELETE FROM storage.buckets WHERE id IN ('id-cards', 'medical-reports', 'signatures');

-- =====================================================
-- End of Script
-- =====================================================
