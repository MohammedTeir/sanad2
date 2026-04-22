# Database SQL Scripts

This folder contains all database setup scripts for the Supabase backend.

## 📁 Files

### 1. Database Schema

**`database_schema_unified_with_if_not_exists.sql`** ✅ RECOMMENDED
- Complete database schema with all tables
- Uses `IF NOT EXISTS` to avoid errors
- Safe to run multiple times
- Creates: families, individuals, camps, users, permissions, etc.

**`database_schema_unified.sql`**
- Original database schema
- May fail if tables already exist
- Use only for fresh databases

### 2. Storage Setup

**`supabase-storage-policies-only.sql`** ✅ RECOMMENDED
- Creates policies for file upload buckets
- Run this AFTER creating buckets manually
- Won't fail with permission errors

**`supabase-storage-setup.sql`**
- Attempts to create both buckets AND policies
- May fail with "must be owner of table" error
- Requires admin privileges

### 3. RLS Scripts

**`disable-rls-all-tables.sql`**
- Disables Row Level Security on all tables
- ⚠️ Use only for development/testing
- ⚠️ Never use in production!

---

## 🚀 Setup Order

### For New Installation:

```bash
# Step 1: Create Storage Buckets (MANUALLY)
# Go to Supabase Dashboard > Storage > Create 3 buckets:
# - id-cards (public, 5MB)
# - medical-reports (public, 5MB)
# - signatures (public, 2MB)

# Step 2: Run Database Schema
# Go to SQL Editor and run:
database_schema_unified_with_if_not_exists.sql

# Step 3: Run Storage Policies
# Go to SQL Editor and run:
supabase-storage-policies-only.sql

# Step 4: Seed Admin User
cd ..
npm run seed:admin

# Step 5: Initialize Permissions
npm run init:permissions
```

---

## 📋 Detailed Instructions

### Creating Storage Buckets (Manual)

1. Go to https://app.supabase.com
2. Select your project
3. Click **"Storage"** in left sidebar
4. Click **"Create bucket"**
5. Create each bucket with these settings:

**Bucket: id-cards**
```
Name: id-cards
Public: Yes
File size limit: 5242880 (5MB)
Allowed MIME types: image/jpeg, image/png, application/pdf
```

**Bucket: medical-reports**
```
Name: medical-reports
Public: Yes
File size limit: 5242880 (5MB)
Allowed MIME types: image/jpeg, image/png, application/pdf
```

**Bucket: signatures**
```
Name: signatures
Public: Yes
File size limit: 2097152 (2MB)
Allowed MIME types: image/jpeg, image/png
```

### Running SQL Scripts

1. Go to **SQL Editor** in Supabase Dashboard
2. Click **"New Query"**
3. Open the SQL file (copy its contents)
4. Paste into the SQL Editor
5. Click **"Run"** or press `Ctrl+Enter`
6. Check for success messages

### Troubleshooting

**Error: "must be owner of table objects"**
- Solution: Create buckets manually via Dashboard (see above)
- Then run `supabase-storage-policies-only.sql`

**Error: "relation already exists"**
- Solution: Use `database_schema_unified_with_if_not_exists.sql` instead
- Or drop existing tables first (⚠️ destroys data!)

**Error: "permission denied"**
- Solution: Make sure you're logged in as project owner
- Or use manual bucket creation method

**Error: "bucket already exists"**
- Solution: This is OK! Bucket already created
- Skip to policies script

---

## 🎯 What Each Script Does

### database_schema_unified_with_if_not_exists.sql

Creates these tables:
- `families` - Family registration data
- `individuals` - Individual family members
- `camps` - Refugee camps
- `users` - System users
- `permissions` - Role-based permissions
- `aid_distributions` - Aid distribution records
- `inventory_items` - Inventory tracking
- `audit_logs` - Security audit trail
- `backup_sync_operations` - Backup/sync tracking
- And more...

### supabase-storage-policies-only.sql

Creates policies for:
- Public file upload (for registration forms)
- Public file read (to view uploaded files)
- Authenticated file update/delete
- Organized in `registrations/` folder

### disable-rls-all-tables.sql

Disables Row Level Security on:
- All tables in the database
- ⚠️ Use ONLY for development
- ⚠️ Never in production!

---

## 📚 Additional Documentation

- **Full Setup Guide:** `../STORAGE_SETUP_GUIDE.md`
- **Backend Structure:** `../STRUCTURE.md`
- **Family Registration:** `../FAMILY_REGISTRATION_BACKEND_GUIDE.md`
- **Seeding Instructions:** `../SEEDING_INSTRUCTIONS.md`

---

## ✅ Verification

After running all scripts, verify:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check storage buckets
SELECT id, name, public, file_size_limit
FROM storage.buckets
ORDER BY name;

-- Check policies
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage'
ORDER BY policyname;
```

---

**Last Updated:** 2026-02-18
**Version:** 1.1
