-- Migration: Add chronic_count column to families table
-- This tracks the number of family members with chronic diseases

ALTER TABLE families 
ADD COLUMN IF NOT EXISTS chronic_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN families.chronic_count IS 'إحصائيات الصحة: عدد المصابين بأمراض مزمنة';

-- Create index for better query performance (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_families_chronic_count ON families(chronic_count);

-- Update existing records to have a default value (should already be 0 from DEFAULT)
UPDATE families SET chronic_count = 0 WHERE chronic_count IS NULL;
