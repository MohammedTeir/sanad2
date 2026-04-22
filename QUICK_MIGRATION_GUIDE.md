# Quick Migration Guide - Distribution Fix

## ✅ EASIEST WAY: Run the Complete Fix Script

**File**: `backend/db/migrations/044_COMPLETE_FIX.sql`

### Steps:

1. **Open Supabase SQL Editor**

2. **Copy the entire contents** of `044_COMPLETE_FIX.sql`

3. **Paste into SQL Editor**

4. **Click "Run"**

5. **Wait for success message**:
   ```
   ========================================
   ✅ COMPLETE FIX APPLIED SUCCESSFULLY!
   ========================================
   ```

6. **Restart backend**:
   ```bash
   cd backend
   npm restart
   ```

7. **Test distribution** - should work! ✅

---

## What This Script Does:

1. ✅ Adds `updated_at` column (fixes trigger error)
2. ✅ Drops old English constraints
3. ✅ Converts existing data: English → Arabic
4. ✅ Re-adds constraints with Arabic values
5. ✅ Tests that everything works
6. ✅ Shows verification summary

---

## Alternative: Run Individual Migrations

If you prefer to run migrations separately:

### Step 1: Add updated_at column
```sql
-- Run: backend/db/migrations/044a_add_updated_at_to_inventory_transactions.sql
```

### Step 2: Fix Arabic constraints
```sql
-- Run: backend/db/migrations/044_readd_inventory_transactions_constraints.sql
```

**Note**: The complete fix script (`044_COMPLETE_FIX.sql`) does both steps at once.

---

## After Migration:

### Verify It Worked:

```sql
-- Check constraints show Arabic values
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'inventory_transactions'::regclass;
```

**Expected**: Both constraints should list Arabic values

### Test Distribution:

```sql
-- This should succeed now:
INSERT INTO inventory_transactions (
    item_id, transaction_type, quantity, related_to, is_deleted
) VALUES (
    (SELECT id FROM inventory_items LIMIT 1),
    'صادر', 1, 'توزيع', true
);
```

**Expected**: Insert succeeds, no errors

---

## Troubleshooting:

### If you get "syntax error":
- Make sure you're running `044_COMPLETE_FIX.sql` (not the old individual migrations)
- Copy the ENTIRE file content, not just parts
- Run in Supabase SQL Editor (not psql or other tools)

### If you get "constraint already exists":
- The migration already ran partially
- Run this to clean up:
  ```sql
  ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_related_to_check;
  ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;
  ```
- Then re-run the complete fix script

### If backend still shows errors:
- Restart the backend server: `npm restart`
- Check backend logs for specific errors
- Verify migration ran successfully in Supabase

---

## Files Reference:

### Use This (Complete Fix):
- ✅ `044_COMPLETE_FIX.sql` - **RECOMMENDED** - Everything in one script

### Don't Use (Old Versions):
- ❌ `044_readd_inventory_transactions_constraints.sql` - Old version, use complete fix instead
- ❌ `044a_add_updated_at_to_inventory_transactions.sql` - Included in complete fix

### Schema Files (Updated):
- ✅ `database_schema_unified.sql` - Updated with `updated_at` column
- ✅ `database_schema_unified_with_if_not_exists.sql` - Updated with `updated_at` column

---

## Success Criteria:

After migration, you should be able to:
- ✅ Create distributions without errors
- ✅ See inventory transactions in Inventory Ledger
- ✅ See Arabic values (صادر، توزيع، etc.)
- ✅ Undo distributions successfully
- ✅ Inventory quantities update correctly

---

**Questions?** Check `MIGRATION_INSTRUCTIONS_COMPLETE.md` for detailed guide.
