-- Verify and Apply Soft Delete Columns to aid_campaigns
-- Run this in your Supabase SQL Editor if migration 040 hasn't been applied yet

-- ============================================
-- Step 1: Check if columns exist
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'aid_campaigns'
  AND column_name IN ('is_deleted', 'deleted_at', 'deleted_by')
ORDER BY column_name;

-- ============================================
-- Step 2: Add columns if they don't exist
-- ============================================
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- ============================================
-- Step 3: Create indexes for performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_deleted ON aid_campaigns(is_deleted);
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_deleted_at ON aid_campaigns(deleted_at);

-- ============================================
-- Step 4: Verify columns were added
-- ============================================
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'aid_campaigns'
  AND column_name IN ('is_deleted', 'deleted_at', 'deleted_by')
ORDER BY column_name;

-- ============================================
-- Step 5: Add comments for documentation
-- ============================================
COMMENT ON COLUMN aid_campaigns.is_deleted IS 'Soft delete flag - true when campaign is deleted';
COMMENT ON COLUMN aid_campaigns.deleted_at IS 'Timestamp when the campaign was soft deleted';
COMMENT ON COLUMN aid_campaigns.deleted_by IS 'User ID who deleted the campaign';

-- ============================================
-- Expected Output:
-- is_deleted  | boolean | YES | false
-- deleted_at  | timestamp with time zone | YES | NULL
-- deleted_by  | uuid | YES | NULL
-- ============================================
