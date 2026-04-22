-- Migration: Add updated_at column to inventory_transactions table
-- Problem: Table has update_updated_at trigger but no updated_at column
-- This causes error when trigger fires: "record has no field updated_at"
-- Created: 2026-03-22

-- =====================================================
-- STEP 1: Add updated_at column
-- =====================================================
ALTER TABLE inventory_transactions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Set default value for existing rows
UPDATE inventory_transactions 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- =====================================================
-- STEP 2: Add index for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_updated_at 
ON inventory_transactions(updated_at);

-- =====================================================
-- STEP 3: Verify column was added
-- =====================================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'inventory_transactions'
AND column_name = 'updated_at';

-- Expected: 1 row showing updated_at | timestamp with time zone | YES | NULL::timestamp...

-- =====================================================
-- STEP 4: Log completion
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration applied successfully!';
    RAISE NOTICE '   Added updated_at column to inventory_transactions table';
    RAISE NOTICE '   Existing rows updated with created_at value';
    RAISE NOTICE '   Index created on updated_at column';
END $$;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- To rollback this migration:
-- 
-- DROP INDEX IF EXISTS idx_inventory_transactions_updated_at;
-- ALTER TABLE inventory_transactions DROP COLUMN IF EXISTS updated_at;
-- =====================================================
