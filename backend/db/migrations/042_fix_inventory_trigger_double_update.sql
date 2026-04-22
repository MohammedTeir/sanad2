-- Migration: Fix inventory trigger to use campaign's inventory_item_id
-- and handle both INSERT (distribute) and DELETE (undo) operations
-- Created: 2026-03-19
-- 
-- This migration fixes the double-update issue where inventory was being reduced twice:
-- 1. Once by frontend creating inventory transaction
-- 2. Once by database trigger on aid_distributions INSERT
--
-- The fix:
-- - Updates trigger to use inventory_item_id from aid_campaigns (not name matching)
-- - Adds DELETE handling to automatically restore inventory on undo
-- - Removes manual inventory transaction creation from frontend

-- Drop existing trigger
DROP TRIGGER IF EXISTS update_inventory_trigger ON aid_distributions;

-- Update the function to use inventory_item_id from campaign
CREATE OR REPLACE FUNCTION update_inventory_on_distribution()
RETURNS TRIGGER AS $$
DECLARE
  item_id_var UUID;
BEGIN
  -- Get the inventory_item_id from the campaign
  SELECT inventory_item_id INTO item_id_var 
  FROM aid_campaigns 
  WHERE id = NEW.campaign_id 
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
    ELSIF TG_OP = 'DELETE' THEN
      -- Restore inventory on distribution deletion (undo)
      UPDATE inventory_items
      SET quantity_available = quantity_available + OLD.quantity,
          updated_at = NOW()
      WHERE id = item_id_var;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger to fire on both INSERT and DELETE
CREATE TRIGGER update_inventory_trigger
  AFTER INSERT OR DELETE ON aid_distributions
  FOR EACH ROW
  EXECUTE FUNCTION update_inventory_on_distribution();

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE '✅ Inventory trigger updated successfully';
  RAISE NOTICE '   - Now uses inventory_item_id from aid_campaigns';
  RAISE NOTICE '   - Handles INSERT (distribution) - reduces inventory';
  RAISE NOTICE '   - Handles DELETE (undo) - restores inventory';
  RAISE NOTICE '   - Frontend manual transaction creation should be disabled';
END $$;
