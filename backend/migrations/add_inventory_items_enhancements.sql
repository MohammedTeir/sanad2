-- Migration: Add Arabic name support and stock management to inventory_items table
-- Run this migration to update existing inventory_items table

-- Add name_ar column for Arabic name if not exists
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

-- Add unit_ar column for Arabic unit name if not exists
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_ar VARCHAR(100);

-- Add min_stock column for minimum stock threshold if not exists
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS min_stock NUMERIC(10, 2) DEFAULT 0;

-- Add max_stock column for maximum stock capacity if not exists
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS max_stock NUMERIC(10, 2) DEFAULT 0;

-- Add is_active column for soft delete/deactivation if not exists
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop category check constraint to allow flexible categories
-- First drop the old constraint if it exists
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_camp_id ON inventory_items(camp_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON inventory_items(quantity_available, min_stock) 
WHERE quantity_available <= min_stock;

-- Add comments
COMMENT ON COLUMN inventory_items.name_ar IS 'Arabic name for the item';
COMMENT ON COLUMN inventory_items.unit_ar IS 'Arabic name for the unit of measurement';
COMMENT ON COLUMN inventory_items.min_stock IS 'Minimum stock threshold (reorder point)';
COMMENT ON COLUMN inventory_items.max_stock IS 'Maximum stock capacity';
COMMENT ON COLUMN inventory_items.is_active IS 'Whether this item is currently active';
