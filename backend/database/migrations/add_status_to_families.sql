-- Migration: Add status column to families table for approval workflow
-- This allows Camp Managers to approve/reject newly registered families

-- Add the status column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'families' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE public.families 
        ADD COLUMN status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')) NOT NULL;
        
        -- Add index for faster filtering by status
        CREATE INDEX IF NOT EXISTS idx_families_status ON public.families(status);
        
        -- Add index for camp_id + status combination (common query pattern)
        CREATE INDEX IF NOT EXISTS idx_families_camp_status ON public.families(camp_id, status);
        
        RAISE NOTICE 'Added status column to families table';
    ELSE
        RAISE NOTICE 'Column status already exists in families table';
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.families.status IS 'Approval status: pending (awaiting camp manager approval), approved (active), rejected (denied)';

-- Update existing families to 'approved' status (since they're already active)
UPDATE public.families 
SET status = 'approved' 
WHERE status IS NULL OR status = 'pending';
