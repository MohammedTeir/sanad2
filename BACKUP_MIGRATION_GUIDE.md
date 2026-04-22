# Backup System Improvements - Migration Guide

## Overview
This migration adds support for custom backup names and fixes the `campId` field handling in the backup system.

## Changes Made

### 1. Database Schema
- Added `name` column to `backup_sync_operations` table
- The `camp_id` column already exists in the schema (no change needed)

### 2. Backend API
- Updated `POST /api/backup-sync` to accept `name` and `camp_id` fields
- Added validation for scope and camp_id requirements
- Proper handling of `camp_id` (snake_case) instead of `campId` (camelCase)

### 3. Frontend
- Added name input field in the backup creation modal
- Updated `BackupOperation` interface to include `name` field
- Display custom backup names in the backup list (with fallback to default)

## Migration Steps

### Step 1: Run the Database Migration

Execute the following SQL migration in your Supabase SQL Editor:

```sql
-- Migration: Add name field to backup_sync_operations table
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'backup_sync_operations' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.backup_sync_operations 
        ADD COLUMN name VARCHAR(255);
        
        CREATE INDEX IF NOT EXISTS idx_backup_sync_name ON public.backup_sync_operations(name);
        
        RAISE NOTICE 'Added name column to backup_sync_operations table';
    ELSE
        RAISE NOTICE 'Column name already exists in backup_sync_operations table';
    END IF;
END $$;

COMMENT ON COLUMN public.backup_sync_operations.name IS 'Custom name given to the backup by the user';
```

**How to execute:**
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Paste the migration SQL
4. Click **Run**

### Step 2: Verify the Migration

Run this query to verify the column was added:

```sql
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'backup_sync_operations'
AND column_name = 'name';
```

Expected output:
```
column_name | data_type | character_maximum_length
name        | character | 255
```

### Step 3: Test the Backup Creation

1. Log in as SYSTEM_ADMIN or CAMP_MANAGER
2. Navigate to **Admin > مركز النسخ الاحتياطي** (Backup Center)
3. Click **إنشاء نسخة احتياطية** (Create Backup)
4. Enter a custom name (optional)
5. Select backup type and create
6. Verify the name appears in the backup list

## API Usage

### Create Backup with Custom Name

```javascript
POST /api/backup-sync
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "scope": "full",           // Required: 'full', 'partial', or 'camp_specific'
  "name": "Daily Backup",    // Optional: Custom name
  "camp_id": "uuid-here"     // Required if scope is 'camp_specific'
}
```

### Response

```json
{
  "id": "uuid",
  "operation_type": "backup",
  "scope": "full",
  "name": "Daily Backup",
  "camp_id": "uuid-here",
  "status": "processing",
  "initiated_by": "uuid",
  "started_at": "2026-02-18T12:00:00Z"
}
```

## Field Naming Convention

**Important:** The backend uses **snake_case** for database fields:
- ✅ `camp_id` (correct)
- ❌ `campId` (incorrect)

The frontend service now properly converts camelCase to snake_case when sending requests.

## Troubleshooting

### Error: "column camp_id does not exist"

This error should NOT occur because `camp_id` is already in the schema. If you see this:

1. Check if you're using the correct table name: `backup_sync_operations`
2. Verify the column exists:
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'backup_sync_operations';
   ```

### Error: "column name does not exist"

Run the migration SQL above to add the `name` column.

### Backup not showing custom name

1. Check browser console for errors
2. Verify the migration was successful
3. Clear browser cache and reload

## Files Modified

### Backend
- `backend/routes/backupSync.js` - Updated POST endpoint
- `backend/database/migrations/add_name_to_backup_sync_operations.sql` - New migration file

### Frontend
- `views/admin/GlobalBackupCenter.tsx` - Added name input and display
- `services/realDataServiceBackend.ts` - Updated createBackup method

## Rollback

If you need to rollback the name field:

```sql
-- Remove the name column
ALTER TABLE public.backup_sync_operations 
DROP COLUMN IF EXISTS name;

-- Drop the index
DROP INDEX IF EXISTS idx_backup_sync_name;
```

## Support

For issues or questions, please refer to the project documentation or contact the development team.
