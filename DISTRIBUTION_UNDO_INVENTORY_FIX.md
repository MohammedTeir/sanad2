# Distribution Undo Quantity and Ledger Fix

## Problem

Two related issues were found when undoing an aid distribution:

### Issue 1: Inventory Quantity Not Restored
- **Initial state:** Inventory = 15
- **Distribute 5:** Inventory = 10 ✓ (correct)
- **Undo distribution:** Inventory = 10 ✗ (should be 15)

### Issue 2: No Ledger Entries
- Distribution operations were not appearing in the inventory ledger (`inventory_transactions` table)
- Undo operations were not appearing in the inventory ledger
- Users couldn't see distribution history in the inventory ledger report

## Root Cause

The database trigger `update_inventory_on_distribution()` had two problems:

1. **Only fired on INSERT or DELETE operations:**
   ```sql
   CREATE TRIGGER update_inventory_trigger
     AFTER INSERT OR DELETE ON aid_distributions
     FOR EACH ROW
     EXECUTE FUNCTION update_inventory_on_distribution();
   ```

2. **Didn't create inventory_transactions records:**
   - Only updated `inventory_items.quantity_available`
   - Never inserted into `inventory_transactions` table

However, the backend performs a **soft delete** (UPDATE with `is_deleted = true`) instead of a hard DELETE when undoing a distribution:

```javascript
// Backend route: /aid/distributions/:id (DELETE)
await supabase
  .from('aid_distributions')
  .update({
    is_deleted: true,
    deleted_at: new Date().toISOString(),
    deleted_by: req.user.userId
  })
  .eq('id', id);
```

Since soft delete is an UPDATE operation, the trigger never fired, and:
- Inventory was never restored
- No ledger entry was created

## Solution

Updated the trigger to:
1. Fire on `INSERT OR UPDATE OR DELETE`
2. Detect soft delete operations (`OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE`)
3. Restore inventory when a distribution is soft-deleted (undo)
4. **Create `inventory_transactions` records for all operations**

### Updated Trigger Function

```sql
CREATE OR REPLACE FUNCTION update_inventory_on_distribution()
RETURNS TRIGGER AS $$
DECLARE
  item_id_var UUID;
BEGIN
  SELECT inventory_item_id INTO item_id_var
  FROM aid_campaigns
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id)
  LIMIT 1;

  IF item_id_var IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      -- Reduce inventory on new distribution
      UPDATE inventory_items
      SET quantity_available = quantity_available - NEW.quantity,
          updated_at = NOW()
      WHERE id = item_id_var
      AND quantity_available >= NEW.quantity;
      
      -- Create inventory transaction record (صادر - out)
      INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity,
        related_to,
        related_id,
        notes,
        processed_by_user_id,
        processed_at,
        is_deleted
      ) VALUES (
        item_id_var,
        'صادر',
        NEW.quantity,
        'توزيع',
        NEW.id,
        COALESCE(NEW.notes, 'توزيع مساعدة'),
        NEW.distributed_by_user_id,
        NEW.distribution_date,
        FALSE
      );
    ELSIF TG_OP = 'DELETE' THEN
      -- Restore inventory on hard delete
      UPDATE inventory_items
      SET quantity_available = quantity_available + OLD.quantity,
          updated_at = NOW()
      WHERE id = item_id_var;
      
      -- Create inventory transaction record for undo (وارد - in)
      INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity,
        related_to,
        related_id,
        notes,
        processed_by_user_id,
        processed_at,
        is_deleted
      ) VALUES (
        item_id_var,
        'وارد',
        OLD.quantity,
        'توزيع',
        OLD.id,
        COALESCE(OLD.notes, 'تراجع عن توزيع'),
        OLD.distributed_by_user_id,
        NOW(),
        FALSE
      );
    ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
      -- Restore inventory on soft delete (undo operation)
      UPDATE inventory_items
      SET quantity_available = quantity_available + OLD.quantity,
          updated_at = NOW()
      WHERE id = item_id_var;
      
      -- Create inventory transaction record for undo (وارد - in)
      INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity,
        related_to,
        related_id,
        notes,
        processed_by_user_id,
        processed_at,
        is_deleted
      ) VALUES (
        item_id_var,
        'وارد',
        OLD.quantity,
        'توزيع',
        OLD.id,
        COALESCE(OLD.notes, 'تراجع عن توزيع'),
        OLD.distributed_by_user_id,
        NOW(),
        FALSE
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Updated Trigger

```sql
CREATE TRIGGER update_inventory_trigger
  AFTER INSERT OR UPDATE OR DELETE ON aid_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_distribution();
```

## Files Modified

| File | Change |
|------|--------|
| `backend/database/database_schema_unified.sql` | Updated trigger function to create inventory_transactions |
| `backend/database/database_schema_unified_with_if_not_exists.sql` | Same update with conditional creation |
| `backend/db/migrations/043_fix_distribution_undo_inventory.sql` | New migration to apply fix |
| `DISTRIBUTION_UNDO_INVENTORY_FIX.md` | This documentation |

## Testing

### Test Case 1: Normal Distribution
```
Initial: inventory.quantity_available = 15
Action: Distribute 5
Expected: 
  - inventory.quantity_available = 10 ✓
  - inventory_transactions record created (صادر) ✓
```

### Test Case 2: Undo Distribution (The Fix)
```
Before: inventory.quantity_available = 10
Action: Undo distribution (soft delete)
Expected:
  - inventory.quantity_available = 15 ✓
  - inventory_transactions record created (وارد) ✓
```

### Test Case 3: Multiple Operations
```
Initial: 20
Distribute 5 → 15 ✓ (transaction record created)
Distribute 3 → 12 ✓ (transaction record created)
Undo first → 17 ✓ (transaction record created)
Undo second → 20 ✓ (transaction record created)
```

### Test Case 4: Inventory Ledger
```
Check inventory_transactions table:
- Distribution shows as 'صادر' with related_id = distribution_id ✓
- Undo shows as 'وارد' with related_id = distribution_id ✓
- Both appear in inventory ledger report ✓
```

### Test Case 5: Audit Trail
```
After undo:
- aid_distributions.is_deleted = TRUE ✓
- aid_distributions.deleted_at is set ✓
- aid_distributions.deleted_by is set ✓
- Inventory restored correctly ✓
- inventory_transactions shows 'وارد' entry ✓
```

## How to Apply

Run the migration:
```bash
cd backend
psql -U postgres -d your_database -f db/migrations/043_fix_distribution_undo_inventory.sql
```

Or the schema will be applied automatically on next database setup.

## Related Issues

- Migration 042: Fixed double-update issue where inventory was reduced twice
- This migration (043): Fixes soft delete not restoring inventory AND not creating ledger entries

## Notes

- The trigger now uses `COALESCE(NEW.campaign_id, OLD.campaign_id)` to handle all operation types
- Soft delete preserves audit trail (who deleted, when)
- Hard delete still works for permanent removal
- The frontend undo flow doesn't need any changes
- **Inventory ledger now shows all distribution/undo operations**
- **Distribution history page shows all distributions including undone ones**
