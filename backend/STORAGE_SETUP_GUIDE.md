# Supabase Storage Setup Guide

## ⚡ Quick Start (Recommended)

### Step 1: Create Buckets Manually (EASIEST)

**This avoids the "must be owner of table" error!**

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Click **"Storage"** in the left sidebar
4. Click **"Create bucket"** button
5. Create these 3 buckets:

**Bucket 1:**
- Name: `id-cards`
- Public: ✅ **Yes**
- File size limit: `5242880` bytes (5MB)
- Allowed MIME types: `image/jpeg, image/png, application/pdf`

**Bucket 2:**
- Name: `medical-reports`
- Public: ✅ **Yes**
- File size limit: `5242880` bytes (5MB)
- Allowed MIME types: `image/jpeg, image/png, application/pdf`

**Bucket 3:**
- Name: `signatures`
- Public: ✅ **Yes**
- File size limit: `2097152` bytes (2MB)
- Allowed MIME types: `image/jpeg, image/png`

### Step 2: Run Policies Script

1. Go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Copy and paste contents of: `database/supabase-storage-policies-only.sql`
4. Click **"Run"** or press `Ctrl+Enter`

This will create all necessary policies for file uploads.

### Step 3: Verify Setup

After running the script, you should see:

**Buckets Created:**
- ✅ `id-cards` (5MB limit, JPEG/PNG/PDF)
- ✅ `medical-reports` (5MB limit, JPEG/PNG/PDF)
- ✅ `signatures` (2MB limit, JPEG/PNG)

**Policies Created:**
- ✅ Public upload access (for registration forms)
- ✅ Public read access (to view uploaded files)
- ✅ Authenticated update/delete (for users to manage their files)

### Step 4: Test File Upload

1. Restart your dev server:
   ```bash
   npm run dev
   ```

2. Go to registration page:
   - Family registration: `/register-family`
   - Camp registration: `/register-camp`

3. Try uploading a file:
   - Should upload successfully
   - Console should show: `✅ Supabase storage configured`

---

## Alternative: Full SQL Script (Admin Only)

If you have admin privileges, you can run the full script:

1. Go to **SQL Editor**
2. Copy and paste contents of: `database/supabase-storage-setup.sql`
3. Click **"Run"**

**⚠️ This will fail with "must be owner of table" if you're not an admin.**

If it fails, use the manual method above instead.

## Manual Setup (Alternative)

If you prefer to set up manually:

### Step 1: Create Buckets

Go to **Storage** in Supabase Dashboard and create:

1. **id-cards**
   - Public: ✅ Yes
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg, image/png, application/pdf`

2. **medical-reports**
   - Public: ✅ Yes
   - File size limit: `5242880` (5MB)
   - Allowed MIME types: `image/jpeg, image/png, application/pdf`

3. **signatures**
   - Public: ✅ Yes
   - File size limit: `2097152` (2MB)
   - Allowed MIME types: `image/jpeg, image/png`

### Step 2: Add Policies

For each bucket, add these policies:

**Policy 1: Public Upload**
```sql
Name: Public Upload Access - [Bucket Name]
Action: INSERT
Target: all
Definition: 
  bucket_id = '[bucket-name]'
  AND (storage.foldername(name))[1] = 'registrations'
```

**Policy 2: Public Read**
```sql
Name: Public Read Access - [Bucket Name]
Action: SELECT
Target: all
Definition: bucket_id = '[bucket-name]'
```

## Troubleshooting

### Error: "Supabase not configured"

**Solution:**
1. Check console for error messages
2. Verify `.env` file exists with correct values:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Restart dev server

### Error: "Permission denied"

**Solution:**
1. Run the SQL script again
2. Verify policies are created correctly
3. Check bucket is set to **Public**

### Error: "File too large"

**Solution:**
- ID cards & medical reports: Max 5MB
- Signatures: Max 2MB
- Compress images before upload

## File Structure

After upload, files are organized as:

```
Bucket: id-cards
└── registrations/
    ├── 1708272000000-abc123.jpg
    └── 1708272000001-def456.pdf

Bucket: medical-reports
└── registrations/
    ├── 1708272000002-ghi789.jpg
    └── 1708272000003-jkl012.pdf

Bucket: signatures
└── registrations/
    └── 1708272000004-mno345.jpg
```

## Security Notes

- ✅ Buckets are **public** for easy registration
- ✅ Files organized in `registrations/` folder
- ✅ File size limits prevent abuse
- ✅ MIME type validation prevents malicious uploads
- ✅ Authenticated users can only manage their own files

## Cleanup (If Needed)

To delete all buckets and start over:

```sql
-- WARNING: This deletes ALL files!
DELETE FROM storage.objects 
WHERE bucket_id IN ('id-cards', 'medical-reports', 'signatures');

DELETE FROM storage.buckets 
WHERE id IN ('id-cards', 'medical-reports', 'signatures');
```

## Support

For issues:
1. Check Supabase logs: https://app.supabase.com/project/_/logs
2. Check browser console for errors
3. Verify environment variables are set correctly

---

**Last Updated:** 2026-02-18
**Version:** 1.0
