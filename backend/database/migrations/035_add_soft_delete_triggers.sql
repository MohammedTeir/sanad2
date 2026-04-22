-- Migration 035: Add Trigger to Auto-Log Soft Deletes to soft_deletes Table
-- This migration creates a trigger function that automatically logs soft-deleted records
-- Note: This is a backup mechanism - routes should still log manually for better control
-- Date: 2026-03-10

-- ============================================
-- Create Trigger Function for Families
-- ============================================
CREATE OR REPLACE FUNCTION log_family_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when is_deleted changes from false to true
    IF OLD.is_deleted IS DISTINCT FROM NEW.is_deleted 
       AND OLD.is_deleted = FALSE 
       AND NEW.is_deleted = TRUE THEN
       
        INSERT INTO soft_deletes (
            table_name,
            record_id,
            deleted_data,
            deleted_by_user_id,
            deleted_at
        ) VALUES (
            'families',
            NEW.id,
            to_jsonb(OLD),
            NULL, -- Will be set by application
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_family_soft_delete ON families;
CREATE TRIGGER trg_family_soft_delete
    AFTER UPDATE ON families
    FOR EACH ROW
    EXECUTE FUNCTION log_family_soft_delete();

-- ============================================
-- Create Trigger Function for Individuals
-- ============================================
CREATE OR REPLACE FUNCTION log_individual_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when is_deleted changes from false to true
    IF OLD.is_deleted IS DISTINCT FROM NEW.is_deleted 
       AND OLD.is_deleted = FALSE 
       AND NEW.is_deleted = TRUE THEN
       
        INSERT INTO soft_deletes (
            table_name,
            record_id,
            deleted_data,
            deleted_by_user_id,
            deleted_at
        ) VALUES (
            'individuals',
            NEW.id,
            to_jsonb(OLD),
            NULL, -- Will be set by application
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_individual_soft_delete ON individuals;
CREATE TRIGGER trg_individual_soft_delete
    AFTER UPDATE ON individuals
    FOR EACH ROW
    EXECUTE FUNCTION log_individual_soft_delete();

-- ============================================
-- Create Trigger Function for Inventory Items
-- ============================================
CREATE OR REPLACE FUNCTION log_inventory_item_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when is_deleted changes from false to true
    IF OLD.is_deleted IS DISTINCT FROM NEW.is_deleted 
       AND OLD.is_deleted = FALSE 
       AND NEW.is_deleted = TRUE THEN
       
        INSERT INTO soft_deletes (
            table_name,
            record_id,
            deleted_data,
            deleted_by_user_id,
            deleted_at
        ) VALUES (
            'inventory_items',
            NEW.id,
            to_jsonb(OLD),
            NULL, -- Will be set by application
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_inventory_item_soft_delete ON inventory_items;
CREATE TRIGGER trg_inventory_item_soft_delete
    AFTER UPDATE ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION log_inventory_item_soft_delete();

-- ============================================
-- Create Trigger Function for Aids
-- ============================================
CREATE OR REPLACE FUNCTION log_aid_soft_delete()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log when is_deleted changes from false to true
    IF OLD.is_deleted IS DISTINCT FROM NEW.is_deleted 
       AND OLD.is_deleted = FALSE 
       AND NEW.is_deleted = TRUE THEN
       
        INSERT INTO soft_deletes (
            table_name,
            record_id,
            deleted_data,
            deleted_by_user_id,
            deleted_at
        ) VALUES (
            'aids',
            NEW.id,
            to_jsonb(OLD),
            NULL, -- Will be set by application
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and create new one
DROP TRIGGER IF EXISTS trg_aid_soft_delete ON aids;
CREATE TRIGGER trg_aid_soft_delete
    AFTER UPDATE ON aids
    FOR EACH ROW
    EXECUTE FUNCTION log_aid_soft_delete();

-- ============================================
-- Comments
-- ============================================
COMMENT ON FUNCTION log_family_soft_delete() IS 'Automatically logs soft-deleted families to soft_deletes table';
COMMENT ON FUNCTION log_individual_soft_delete() IS 'Automatically logs soft-deleted individuals to soft_deletes table';
COMMENT ON FUNCTION log_inventory_item_soft_delete() IS 'Automatically logs soft-deleted inventory items to soft_deletes table';
COMMENT ON FUNCTION log_aid_soft_delete() IS 'Automatically logs soft-deleted aids to soft_deletes table';
