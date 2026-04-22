# Family Approval Workflow - Migration Guide

## Problem
When families register through the public registration system, they immediately appear as active in the camp manager's system without any approval process. Camp Managers need the ability to review and approve/reject newly registered families.

## Solution
Added a `status` field to the `families` table with values: `pending`, `approved`, `rejected`.

## Changes Made

### 1. Database Schema
- Added `status` column to `families` table
- Default value: `'pending'`
- Check constraint: `status IN ('pending', 'approved', 'rejected')`
- Added indexes for faster filtering

### 2. Backend API
- **Updated** `GET /api/families` - Now returns all families (including pending) for CAMP_MANAGER
- **Updated** `POST /api/public/families` - New registrations default to `status='pending'`
- **Added** `PUT /api/families/:id/approve` - Approve a pending family
- **Added** `PUT /api/families/:id/reject` - Reject a pending family

### 3. Frontend Service
- Added `approveFamily(id, admin_notes)` method
- Added `rejectFamily(id, rejection_reason)` method
- Updated `getDPById()` to include `registrationStatus` from `family.status`

### 4. Database Migration File
Created: `backend/database/migrations/add_status_to_families.sql`

## Migration Steps

### Step 1: Fix the families table trigger (IMPORTANT!)

The families table has a trigger that tries to update `updated_at`, but it uses `last_updated` instead. Run this first:

```sql
-- Fix: Drop the incorrect trigger and create the correct one
DROP TRIGGER IF EXISTS update_families_updated_at ON public.families;

-- Create new trigger for last_updated
CREATE OR REPLACE FUNCTION update_families_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_families_last_updated
BEFORE UPDATE ON public.families
FOR EACH ROW
EXECUTE FUNCTION update_families_last_updated();
```

### Step 2: Run the Database Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Migration: Add status column to families table for approval workflow
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'families' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.families 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL;
        
        CREATE INDEX IF NOT EXISTS idx_families_status ON public.families(status);
        CREATE INDEX IF NOT EXISTS idx_families_camp_status ON public.families(camp_id, status);
        
        RAISE NOTICE 'Added status column to families table';
    ELSE
        RAISE NOTICE 'Column status already exists in families table';
    END IF;
END $$;

COMMENT ON COLUMN public.families.status IS 'Approval status: pending (awaiting camp manager approval), approved (active), rejected (denied)';

-- Update existing families to 'approved' status (since they're already active)
UPDATE public.families 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending';
```

**How to execute:**
1. Go to Supabase Dashboard → SQL Editor
2. Paste the migration SQL
3. Click **Run**

### Step 2: Verify the Migration

```sql
-- Check if status column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'families' AND column_name = 'status';

-- Check existing families status
SELECT status, COUNT(*) as count
FROM families
GROUP BY status;
```

Expected output:
```
column_name | data_type | column_default
status      | character varying | 'pending'::character varying

status   | count
---------|-------
approved | [all existing families]
```

### Step 3: Test the Approval Workflow

1. **Register a new family** (public registration)
   - Go to family registration page
   - Fill out the form
   - Submit

2. **Login as Camp Manager**
   - Navigate to **إدارة العائلات** (DP Management)
   - You should see the new family with status "قيد الانتظار" (Pending)

3. **Approve the family**
   - Click on the pending family
   - Click "قبول" (Approve)
   - Optionally add admin notes
   - Family status changes to "معتمد" (Approved)

4. **Reject a family** (optional test)
   - Click on a pending family
   - Click "رفض" (Reject)
   - Enter rejection reason (required)
   - Family status changes to "مرفوض" (Rejected)

## API Usage

### Approve Family

```javascript
PUT /api/families/:familyId/approve
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "admin_notes": "Approved - all documents verified"
}
```

**Response:**
```json
{
  "message": "تم قبول العائلة بنجاح",
  "family": {
    "id": "uuid",
    "status": "approved",
    "admin_notes": "Approved - all documents verified",
    ...
  }
}
```

### Reject Family

```javascript
PUT /api/families/:familyId/reject
Headers:
  Authorization: Bearer <token>
  Content-Type: application/json

Body:
{
  "rejection_reason": "Incomplete documentation - missing ID card"
}
```

**Response:**
```json
{
  "message": "تم رفض العائلة",
  "family": {
    "id": "uuid",
    "status": "rejected",
    "admin_notes": "Incomplete documentation - missing ID card",
    ...
  }
}
```

## User Flow

### For Camp Managers:

1. **View Pending Families**
   - Default tab shows all families
   - Filter by "قيد الانتظار" to see only pending families
   - Pending families are highlighted with amber/yellow badge

2. **Review Family Details**
   - Click on any family to view full details
   - Check vulnerability score, members, documents

3. **Approve/Reject Actions**
   - **Approve**: Family becomes active, can receive aid
   - **Reject**: Family marked as rejected, cannot receive aid (can add notes)

### For Families:

1. **Register** → Status: `pending`
2. **Wait for approval** → Status: `pending`
3. **Approved** → Can receive aid distributions
   - OR -
   **Rejected** → Cannot receive aid (may re-register with corrections)

## Access Control

- **CAMP_MANAGER**: Can approve/reject families in their camp only
- **SYSTEM_ADMIN**: Can approve/reject families in any camp
- **FIELD_OFFICER**: Can only view approved families
- **BENEFICIARY**: No access to approval workflow

## Database Schema

```sql
CREATE TABLE families (
    -- ... other fields ...
    status VARCHAR(20) DEFAULT 'pending' 
           CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL,
    admin_notes TEXT,
    -- ... other fields ...
);

CREATE INDEX idx_families_status ON families(status);
CREATE INDEX idx_families_camp_status ON families(camp_id, status);
```

## Files Modified

### Backend
- `backend/database/database_schema_unified.sql` - Added status column
- `backend/database/database_schema_unified_with_if_not_exists.sql` - Added status column
- `backend/database/migrations/add_status_to_families.sql` - Migration script
- `backend/routes/families.js` - Added approve/reject endpoints, updated GET filter
- `backend/routes/public.js` - Set status='pending' on registration

### Frontend
- `services/realDataServiceBackend.ts` - Added approveFamily/rejectFamily methods
- `views/camp-manager/DPManagement.tsx` - (To be updated) Add approve/reject UI

## Next Steps

The DPManagement frontend needs to be updated to:
1. Show approve/reject buttons for pending families
2. Display status badges (pending/approved/rejected)
3. Add modal for entering approval notes or rejection reason
4. Filter families by status tab (All / Pending)

## Rollback

If you need to rollback:

```sql
-- Remove status column (WARNING: This will delete all approval data)
ALTER TABLE public.families 
DROP COLUMN IF EXISTS status;

DROP INDEX IF EXISTS idx_families_status;
DROP INDEX IF EXISTS idx_families_camp_status;
```

## Support

For issues or questions, refer to project documentation or contact the development team.
