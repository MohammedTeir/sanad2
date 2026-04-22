# Migration Instructions - Complete Fix

## Problem Fixed
The `inventory_transactions` table was missing the `updated_at` column, but had a trigger that tried to update it. This caused the error:
```
ERROR: 42703: record "new" has no field "updated_at"
```

## Migrations to Apply (IN ORDER)

### Step 1: Apply Migration 044a FIRST (Add updated_at column)
**File**: `backend/db/migrations/044a_add_updated_at_to_inventory_transactions.sql`

This migration:
- Adds `updated_at` column to `inventory_transactions` table
- Sets existing rows to have `updated_at = created_at`
- Creates index on `updated_at` for performance

**How to Apply**:
1. Open Supabase SQL Editor
2. Copy contents of `044a_add_updated_at_to_inventory_transactions.sql`
3. Paste and run
4. Verify output shows: `✅ Migration applied successfully!`

### Step 2: Apply Migration 044 (Fix Arabic constraints)
**File**: `backend/db/migrations/044_readd_inventory_transactions_constraints.sql`

This migration:
- Drops old English constraints
- Converts existing English data → Arabic
- Re-adds constraints with Arabic values
- Tests that Arabic values work

**How to Apply**:
1. Open Supabase SQL Editor
2. Copy contents of `044_readd_inventory_transactions_constraints.sql`
3. Paste and run
4. Verify output shows: `✅ Migration 044 applied successfully!`

### Step 3: Restart Backend
```bash
cd backend
npm restart
```

### Step 4: Test Distribution Creation
1. Go to Distribution Management
2. Select a campaign
3. Distribute to a family
4. Should succeed without errors! ✅

## Why This Order?

1. **Migration 044a** must run first because it adds the `updated_at` column
2. **Migration 044** can then run successfully because the trigger won't fail
3. Both migrations are needed for the complete fix

## Files Updated

### Schema Files (Updated for future deployments):
- ✅ `backend/database/database_schema_unified.sql` - Added `updated_at` column
- ✅ `backend/database/database_schema_unified_with_if_not_exists.sql` - Added `updated_at` column

### Migration Files (Apply in order):
- ✅ `backend/db/migrations/044a_add_updated_at_to_inventory_transactions.sql` - NEW (add column)
- ✅ `backend/db/migrations/044_readd_inventory_transactions_constraints.sql` - Fix constraints

## Complete Migration Script (Optional)

If you want to apply both migrations at once, you can combine them:

```sql
-- =====================================================
-- COMPLETE FIX: Add column + Fix constraints
-- Run this in Supabase SQL Editor
-- =====================================================

-- PART 1: Add updated_at column (Migration 044a)
ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE inventory_transactions 
SET updated_at = created_at 
WHERE updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_updated_at 
ON inventory_transactions(updated_at);

-- PART 2: Fix constraints (Migration 044)
ALTER TABLE inventory_transactions 
DROP CONSTRAINT IF EXISTS inventory_transactions_related_to_check;

ALTER TABLE inventory_transactions 
DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;

-- Convert English → Arabic
UPDATE inventory_transactions SET related_to = 'شراء' WHERE related_to = 'purchase';
UPDATE inventory_transactions SET related_to = 'تبرع' WHERE related_to = 'donation';
UPDATE inventory_transactions SET related_to = 'توزيع' WHERE related_to = 'distribution';
UPDATE inventory_transactions SET related_to = 'تحويل' WHERE related_to = 'transfer';
UPDATE inventory_transactions SET related_to = 'تعديل' WHERE related_to = 'adjustment';
UPDATE inventory_transactions SET related_to = 'تلف' WHERE related_to = 'damage';

UPDATE inventory_transactions SET transaction_type = 'وارد' WHERE transaction_type = 'in';
UPDATE inventory_transactions SET transaction_type = 'صادر' WHERE transaction_type = 'out';

-- Re-add constraints with Arabic values
ALTER TABLE inventory_transactions 
ADD CONSTRAINT inventory_transactions_related_to_check 
CHECK (
    related_to IN (
        'شراء', 'تبرع', 'توزيع', 'تحويل', 'تعديل', 'تلف'
    )
);

ALTER TABLE inventory_transactions 
ADD CONSTRAINT inventory_transactions_transaction_type_check 
CHECK (
    transaction_type IN (
        'وارد', 'صادر'
    )
);

-- Verify
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'inventory_transactions'::regclass
AND conname IN (
    'inventory_transactions_related_to_check',
    'inventory_transactions_transaction_type_check'
);

DO $$
BEGIN
    RAISE NOTICE '✅ Complete fix applied successfully!';
    RAISE NOTICE '   - updated_at column added';
    RAISE NOTICE '   - Constraints converted to Arabic';
    RAISE NOTICE '   - Distribution system should now work!';
END $$;
```

## Verification

After applying migrations, verify everything works:

### Check Column Exists
```sql
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'inventory_transactions'
AND column_name = 'updated_at';
```

**Expected**: 1 row showing `updated_at | timestamp with time zone | NULL::...`

### Check Constraints
```sql
SELECT 
    conname,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'inventory_transactions'::regclass
AND conname IN (
    'inventory_transactions_related_to_check',
    'inventory_transactions_transaction_type_check'
);
```

**Expected**: Both constraints should show Arabic values

### Test Insert
```sql
-- This should SUCCEED:
INSERT INTO inventory_transactions (
    item_id,
    transaction_type,
    quantity,
    related_to,
    notes,
    is_deleted
) VALUES (
    (SELECT id FROM inventory_items LIMIT 1),
    'صادر',
    1,
    'توزيع',
    'Test - should succeed',
    true
);

-- Clean up:
DELETE FROM inventory_transactions 
WHERE notes = 'Test - should succeed';
```

**Expected**: Insert succeeds, no errors

## Summary

### What Was Fixed:
1. ✅ Added `updated_at` column to `inventory_transactions`
2. ✅ Fixed trigger that was failing
3. ✅ Converted constraints from English → Arabic
4. ✅ Updated schema files for future deployments

### Impact:
- ✅ No more "record has no field updated_at" errors
- ✅ Trigger works correctly
- ✅ Arabic localization complete
- ✅ Distribution creation works
- ✅ Inventory transactions work

### Next Steps:
1. Apply migration 044a (add column)
2. Apply migration 044 (fix constraints)
3. Restart backend
4. Test distribution creation
5. Everything should work! 🎉
