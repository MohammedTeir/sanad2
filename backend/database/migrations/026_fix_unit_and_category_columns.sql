-- Migration 026: Fix Unit and Category Columns
-- Date: 2026-02-25
-- Description: 
--   1. Remove unit_ar columns (keep only unit - Arabic/custom values)
--   2. Remove category CHECK constraint from inventory_items (allow custom categories)
--   3. Keep name as-is (Arabic primary)

-- ============================================
-- STEP 1: Update aids table
-- ============================================

-- Drop unit_ar column from aids if exists
ALTER TABLE aids DROP COLUMN IF EXISTS unit_ar;

-- Update unit column to be VARCHAR(50) for custom values
ALTER TABLE aids ALTER COLUMN unit TYPE VARCHAR(50);
ALTER TABLE aids ALTER COLUMN unit SET NOT NULL;

-- ============================================
-- STEP 2: Update inventory_items table
-- ============================================

-- Drop unit_ar column from inventory_items if exists
ALTER TABLE inventory_items DROP COLUMN IF EXISTS unit_ar;

-- Drop name_ar column from inventory_items if exists
ALTER TABLE inventory_items DROP COLUMN IF EXISTS name_ar;

-- Drop category CHECK constraint if exists
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;

-- Update unit column to be VARCHAR(50) for custom values
ALTER TABLE inventory_items ALTER COLUMN unit TYPE VARCHAR(50);
ALTER TABLE inventory_items ALTER COLUMN unit SET NOT NULL;

-- ============================================
-- STEP 3: Update comments
-- ============================================

COMMENT ON COLUMN aids.name IS 'Item name (Arabic primary)';
COMMENT ON COLUMN aids.unit IS 'Measurement unit (قطعة, كيلوغرام, etc.) - supports custom values';
COMMENT ON COLUMN aids.category IS 'No constraint - allows flexible custom categories';

COMMENT ON COLUMN inventory_items.name IS 'Item name (Arabic primary)';
COMMENT ON COLUMN inventory_items.unit IS 'Measurement unit (قطعة, كيلوغرام, etc.) - supports custom values';
COMMENT ON COLUMN inventory_items.category IS 'No constraint - allows flexible custom categories';

-- ============================================
-- STEP 4: Verification queries (optional)
-- ============================================

-- Verify aids table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'aids' 
-- ORDER BY ordinal_position;

-- Verify inventory_items table structure
-- SELECT column_name, data_type, is_nullable, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'inventory_items' 
-- ORDER BY ordinal_position;

-- Verify constraints removed
-- SELECT conname, contype 
-- FROM pg_constraint 
-- WHERE conrelid = 'inventory_items'::regclass;
