-- Manual Migration Runner for 043_fix_distribution_undo_inventory.sql
-- Run this in Supabase SQL Editor to fix the inventory trigger

-- =====================================================
-- STEP 1: Check if trigger exists
-- =====================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_name = 'update_inventory_trigger'
  AND event_object_table = 'aid_distributions';

-- Expected: Should show 3 rows (INSERT, UPDATE, DELETE)
-- If no rows, the trigger needs to be created

-- =====================================================
-- STEP 2: Drop existing trigger if it exists
-- =====================================================
DROP TRIGGER IF EXISTS update_inventory_trigger ON aid_distributions;

-- =====================================================
-- STEP 3: Create or replace the function
-- =====================================================
CREATE OR REPLACE FUNCTION update_inventory_on_distribution()
RETURNS TRIGGER AS $$
DECLARE
  item_id_var UUID;
BEGIN
  -- Get the inventory_item_id from the campaign
  SELECT inventory_item_id INTO item_id_var
  FROM aid_campaigns
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id)
  LIMIT 1;

  -- If found, update inventory based on operation
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
      
      RAISE NOTICE '[Trigger] INSERT: Created inventory transaction for distribution % (qty: %)', NEW.id, NEW.quantity;
      
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
      
      RAISE NOTICE '[Trigger] DELETE: Restored inventory for distribution % (qty: %)', OLD.id, OLD.quantity;
      
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
      
      RAISE NOTICE '[Trigger] UPDATE: Restored inventory for soft-deleted distribution % (qty: %)', OLD.id, OLD.quantity;
    END IF;
  ELSE
    RAISE NOTICE '[Trigger] No inventory_item_id found for campaign, skipping inventory update';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: Recreate trigger to fire on INSERT, UPDATE, and DELETE
-- =====================================================
CREATE TRIGGER update_inventory_trigger
  AFTER INSERT OR UPDATE OR DELETE ON aid_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_distribution();

-- =====================================================
-- STEP 5: Verify trigger was created
-- =====================================================
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'update_inventory_trigger'
  AND event_object_table = 'aid_distributions';

-- Expected: Should show 3 rows:
-- | update_inventory_trigger | INSERT  | aid_distributions | AFTER |
-- | update_inventory_trigger | UPDATE  | aid_distributions | AFTER |
-- | update_inventory_trigger | DELETE  | aid_distributions | AFTER |

-- =====================================================
-- STEP 6: Test the trigger (optional - uncomment to test)
-- =====================================================
-- This creates a test distribution and checks if inventory is updated
-- DO $$
-- DECLARE
--   test_dist_id UUID;
--   test_campaign_id UUID;
--   test_family_id UUID;
--   test_item_id UUID;
--   initial_qty NUMERIC;
--   final_qty NUMERIC;
-- BEGIN
--   -- Get a test campaign with inventory_item_id
--   SELECT id, inventory_item_id INTO test_campaign_id, test_item_id
--   FROM aid_campaigns
--   WHERE inventory_item_id IS NOT NULL
--   LIMIT 1;
--   
--   IF test_campaign_id IS NULL THEN
--     RAISE NOTICE 'No test campaign found with inventory_item_id';
--     RETURN;
--   END IF;
--   
--   -- Get initial inventory quantity
--   SELECT quantity_available INTO initial_qty
--   FROM inventory_items
--   WHERE id = test_item_id;
--   
--   -- Get a test family
--   SELECT id INTO test_family_id
--   FROM families
--   LIMIT 1;
--   
--   -- Create test distribution
--   INSERT INTO aid_distributions (
--     family_id, campaign_id, aid_type, aid_category, quantity,
--     distribution_date, distributed_by_user_id, status
--   ) VALUES (
--     test_family_id, test_campaign_id, 'غذائية', 'غذائية', 1,
--     NOW(), '00000000-0000-0000-0000-000000000000', 'تم التسليم'
--   ) RETURNING id INTO test_dist_id;
--   
--   -- Check final inventory quantity
--   SELECT quantity_available INTO final_qty
--   FROM inventory_items
--   WHERE id = test_item_id;
--   
--   RAISE NOTICE 'Test Distribution Created: %', test_dist_id;
--   RAISE NOTICE 'Initial Qty: %, Final Qty: %', initial_qty, final_qty;
--   RAISE NOTICE 'Difference: %', (initial_qty - final_qty);
--   
--   -- Verify transaction was created
--   RAISE NOTICE 'Checking inventory_transactions...';
-- END $$;

-- =====================================================
-- Migration Complete
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 043 applied successfully!';
  RAISE NOTICE '   Trigger update_inventory_trigger is now active';
  RAISE NOTICE '   - INSERT: Reduces inventory + creates transaction record';
  RAISE NOTICE '   - UPDATE (soft delete): Restores inventory + creates transaction record';
  RAISE NOTICE '   - DELETE: Restores inventory + creates transaction record';
END $$;
