-- ============================================================
-- COMPLETE MIGRATION: Family Approval Workflow
-- This script fixes the trigger AND adds the status column
-- Run this ONCE in your Supabase SQL Editor
-- ============================================================

-- STEP 1: Fix the families table trigger (required for updates to work)
-- ============================================================

-- Drop the incorrect trigger that tries to update non-existent 'updated_at' column
DROP TRIGGER IF EXISTS update_families_updated_at ON public.families;

-- Drop the old function if it exists
DROP FUNCTION IF EXISTS update_families_last_updated();

-- Create new function that updates 'last_updated' (the actual column name in families table)
CREATE OR REPLACE FUNCTION update_families_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the new trigger
CREATE TRIGGER update_families_last_updated
BEFORE UPDATE ON public.families
FOR EACH ROW
EXECUTE FUNCTION update_families_last_updated();

-- Add comment
COMMENT ON FUNCTION update_families_last_updated() IS 'Automatically update last_updated timestamp on families table';

-- STEP 2: Add status column to families table
-- ============================================================

DO $$ 
BEGIN 
    -- Check if status column already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'families' 
        AND column_name = 'status'
    ) THEN
        -- Add the status column
        ALTER TABLE public.families 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pending' 
        CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL;
        
        -- Add index for faster filtering by status
        CREATE INDEX IF NOT EXISTS idx_families_status ON public.families(status);
        
        -- Add index for camp_id + status combination (common query pattern)
        CREATE INDEX IF NOT EXISTS idx_families_camp_status ON public.families(camp_id, status);
        
        RAISE NOTICE 'Added status column to families table';
    ELSE
        RAISE NOTICE 'Column status already exists in families table - skipping';
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.families.status IS 'Approval status: pending (awaiting camp manager approval), approved (active), rejected (denied)';

-- STEP 3: Update existing families to 'approved' status
-- ============================================================

-- Set all existing families to 'approved' since they're already active
UPDATE public.families 
SET status = 'approved',
    last_updated = NOW()
WHERE status IS NULL 
   OR status = 'pending';

-- Show how many families were updated
DO $$
DECLARE
    family_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO family_count FROM families WHERE status = 'approved';
    RAISE NOTICE 'Updated % existing families to approved status', family_count;
END $$;

-- STEP 4: Verify the migration
-- ============================================================

-- Show the results
SELECT 
    'Migration Complete!' as status,
    (SELECT COUNT(*) FROM families WHERE status = 'approved') as approved_families,
    (SELECT COUNT(*) FROM families WHERE status = 'pending') as pending_families,
    (SELECT COUNT(*) FROM families WHERE status = 'rejected') as rejected_families;

-- Verify the column exists
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'families' 
  AND column_name = 'status';

-- Verify the indexes exist
SELECT 
    indexname, 
    tablename
FROM pg_indexes
WHERE tablename = 'families' 
  AND indexname LIKE 'idx_families%';

-- ============================================================
-- MIGRATION COMPLETE!
-- 
-- Next steps:
-- 1. Test by registering a new family (they should appear as 'pending')
-- 2. Login as Camp Manager and approve/reject the family
-- 3. Check that the status updates correctly
-- ============================================================
