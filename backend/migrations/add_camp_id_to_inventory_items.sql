-- Migration: Add camp_id and enhanced fields to inventory_items table
-- Run this on existing databases to add camp association and stock management fields

-- Add camp_id column for camp association
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS camp_id UUID REFERENCES camps(id) ON DELETE SET NULL;

-- Add name_ar column for Arabic name
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

-- Add unit_ar column for Arabic unit name
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS unit_ar VARCHAR(100);

-- Add min_stock column for minimum stock threshold
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS min_stock NUMERIC(10, 2) DEFAULT 0;

-- Add max_stock column for maximum stock capacity
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS max_stock NUMERIC(10, 2) DEFAULT 0;

-- Add is_active column for soft delete/deactivation
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Drop category check constraint to allow flexible categories
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_camp_id ON inventory_items(camp_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON inventory_items(quantity_available, min_stock) 
WHERE quantity_available <= min_stock;

-- Add comments
COMMENT ON COLUMN inventory_items.camp_id IS 'The camp this item belongs to';
COMMENT ON COLUMN inventory_items.name_ar IS 'Arabic name for the item';
COMMENT ON COLUMN inventory_items.unit_ar IS 'Arabic name for the unit of measurement';
COMMENT ON COLUMN inventory_items.min_stock IS 'Minimum stock threshold (reorder point)';
COMMENT ON COLUMN inventory_items.max_stock IS 'Maximum stock capacity';
COMMENT ON COLUMN inventory_items.is_active IS 'Whether this item is currently active';
