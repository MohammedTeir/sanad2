-- =====================================================
-- QUICK FIX: Remove aids_category_check constraint
-- Purpose: Allow custom category values in aids table
-- Run this on existing databases to fix the constraint issue
-- =====================================================

-- Drop the constraint if it exists
DO $$ BEGIN
    ALTER TABLE aids DROP CONSTRAINT IF EXISTS aids_category_check;
EXCEPTION
    WHEN undefined_object THEN
        RAISE NOTICE 'Constraint aids_category_check does not exist';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error dropping constraint: %', SQLERRM;
END $$;

-- Update existing masculine values to feminine (if any remain)
UPDATE aids SET category = 'غذائية' WHERE category = 'غذاء';
UPDATE aids SET category = 'غير غذائية' WHERE category = 'غير غذائي';
UPDATE aids SET category = 'طبية' WHERE category = 'طبي';
UPDATE aids SET category = 'مائية' WHERE category = 'ماء';

-- Verify the constraint was dropped
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'aids'::regclass 
  AND conname = 'aids_category_check';

-- Show current categories in use
SELECT DISTINCT category FROM aids ORDER BY category;
