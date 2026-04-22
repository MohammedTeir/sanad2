-- =====================================================
-- Migration: Make head_of_family_role Nullable
-- =====================================================
-- 
-- This migration makes the head_of_family_role column nullable
-- to support single registrants who are not heads of families.
--
-- Usage:
--   psql -d your_database -f make_head_of_family_role_nullable.sql
-- =====================================================

-- Drop the existing CHECK constraint (it doesn't allow NULL)
ALTER TABLE families 
DROP CONSTRAINT IF EXISTS families_head_of_family_role_check;

-- Add new CHECK constraint that allows NULL
ALTER TABLE families 
ADD CONSTRAINT families_head_of_family_role_check 
CHECK (head_of_family_role IS NULL OR head_of_family_role IN ('father', 'mother', 'wife_head'));

-- Add comment
COMMENT ON COLUMN families.head_of_family_role IS 
'Role of the head of family. NULL for single registrants. Options: father, mother, wife_head';

-- Output migration info
DO $$
BEGIN
    RAISE NOTICE 'Migration completed: head_of_family_role is now nullable';
    RAISE NOTICE 'Single registrants will have NULL for this field';
END $$;
