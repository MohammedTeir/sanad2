# Database Trigger Fix - Inventory Double Update

## Problem

The inventory was being reduced **TWICE** when a distribution was created:

1. **Frontend** creates inventory transaction manually: `20 - 5 = 15`
2. **Database trigger** fires on INSERT and reduces again: `15 - 5 = 10`

Result: User distributes 5 units, but inventory decreases by 10!

## Root Cause

The database has a trigger `update_inventory_trigger` that automatically updates inventory when a distribution is created:

```sql
CREATE TRIGGER update_inventory_trigger
  AFTER INSERT ON aid_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_distribution();
```

The frontend code was ALSO creating inventory transactions manually, not knowing the trigger existed.

## Solution

### 1. Updated Database Trigger Function

**Before:**
```sql
-- Find inventory by name matching aid_type
SELECT id INTO item_id_var FROM inventory_items WHERE name = NEW.aid_type LIMIT 1;
```

**After:**
```sql
-- Find inventory from campaign's inventory_item_id
SELECT inventory_item_id INTO item_id_var 
FROM aid_campaigns 
WHERE id = NEW.campaign_id 
LIMIT 1;
```

### 2. Added DELETE Handling (for Undo)

**Before:** Only handled INSERT
**After:** Handles both INSERT and DELETE

```sql
IF TG_OP = 'INSERT' THEN
  -- Reduce inventory on distribution
  UPDATE inventory_items
  SET quantity_available = quantity_available - NEW.quantity
  WHERE id = item_id_var;
ELSIF TG_OP = 'DELETE' THEN
  -- Restore inventory on undo
  UPDATE inventory_items
  SET quantity_available = quantity_available + OLD.quantity
  WHERE id = item_id_var;
END IF;
```

### 3. Removed Manual Transaction from Frontend

**Before:**
```typescript
// Create inventory transaction
const txPayload = { ... };
await realDataService.createInventoryTransaction(txPayload);
```

**After:**
```typescript
// NOTE: Inventory transaction is now handled automatically by database trigger
// No need to create inventory transaction manually
```

## Migration

Run the migration file to update the trigger:

```bash
cd backend
psql -U your_user -d your_database -f db/migrations/042_fix_inventory_trigger_double_update.sql
```

Or execute the SQL directly in Supabase SQL Editor.

## Testing

### Test Distribution
1. Note current inventory quantity (e.g., 30)
2. Create distribution for 10 units
3. Check inventory: Should be **20** (not 10)

### Test Undo
1. Undo the distribution
2. Check inventory: Should be **30** (back to original)

## Files Modified

- ✅ `backend/database/database_schema_unified.sql` - Updated trigger function
- ✅ `backend/database/database_schema_unified_with_if_not_exists.sql` - Updated trigger function  
- ✅ `backend/db/migrations/042_fix_inventory_trigger_double_update.sql` - Migration file
- ✅ `views/camp-manager/DistributionDetails.tsx` - Removed duplicate code
- ✅ `DISTRIBUTION_UNDO_QUANTITY_FIX.md` - Updated documentation

## Benefits

1. **Single Source of Truth**: Database trigger handles all inventory updates
2. **Atomic Operations**: Inventory update happens in same transaction as distribution
3. **Automatic Undo**: DELETE operation automatically restores inventory
4. **Correct Item Matching**: Uses `inventory_item_id` instead of name matching
5. **No Race Conditions**: Database ensures consistency

## Rollback

If issues occur, revert the trigger:

```sql
DROP TRIGGER IF EXISTS update_inventory_trigger ON aid_distributions;

CREATE TRIGGER update_inventory_trigger
  AFTER INSERT ON aid_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_distribution();
```

And restore manual transaction creation in frontend.

---

**Created:** 2026-03-19
**Status:** ✅ Ready for Migration
