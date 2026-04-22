-- Migration: Fix inventory trigger to handle soft delete (undo distribution)
-- and create inventory_transactions ledger entries
-- Created: 2026-03-19
--
-- This migration fixes two issues:
-- 1. Undoing a distribution (soft delete) does not restore inventory quantity
-- 2. Distribution and undo operations are not logged in inventory_transactions ledger
--
-- Problem:
-- - When distributing: INSERT fires trigger, inventory reduced correctly ✓
-- - When undoing: UPDATE (is_deleted = true) doesn't fire trigger, inventory NOT restored ✗
-- - No inventory_transactions records created for distribution/undo ✗
--
-- Solution:
-- - Update trigger to fire on INSERT OR UPDATE OR DELETE
-- - Add condition to detect soft delete (OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE)
-- - Restore inventory when soft delete occurs
-- - Create inventory_transactions records for all operations (INSERT, DELETE, UPDATE soft delete)

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_inventory_trigger ON aid_distributions;

-- Update the function to handle soft delete and create transaction records
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

-- Recreate trigger to fire on INSERT, UPDATE, and DELETE
CREATE TRIGGER update_inventory_trigger
  AFTER INSERT OR UPDATE OR DELETE ON aid_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_distribution();

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE '✅ Inventory trigger updated successfully';
  RAISE NOTICE '   - Now handles INSERT (distribution) - reduces inventory + creates transaction record';
  RAISE NOTICE '   - Handles DELETE (hard delete) - restores inventory + creates transaction record';
  RAISE NOTICE '   - Handles UPDATE (soft delete/undo) - restores inventory + creates transaction record';
  RAISE NOTICE '   - Undo distribution will now correctly restore inventory quantity';
  RAISE NOTICE '   - All distribution/undo operations will appear in inventory ledger';
END $$;
