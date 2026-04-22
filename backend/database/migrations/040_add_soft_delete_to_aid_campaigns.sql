-- Migration 040: Add Soft Delete Columns to Aid Campaigns
-- This migration adds soft delete functionality to aid_campaigns table
-- to allow camp managers to delete campaigns while maintaining historical distribution records

-- ============================================
-- Add Soft Delete Columns to Aid Campaigns
-- ============================================
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for filtering deleted records
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_deleted ON aid_campaigns(is_deleted);
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_deleted_at ON aid_campaigns(deleted_at);

-- ============================================
-- Update RLS Policies to Filter Deleted Records (Optional)
-- ============================================
-- Note: The backend query already filters by deleted_at IS NULL by default
-- If you want to enforce at database level, uncomment and modify these policies:

-- DROP POLICY IF EXISTS "Camp managers can view campaigns" ON aid_campaigns;
-- CREATE POLICY "Camp managers can view campaigns"
--     ON aid_campaigns FOR SELECT
--     USING (
--         (is_deleted = FALSE OR is_deleted IS NULL)
--         AND ...existing authorization...
--     );

-- ============================================
-- Update Updated At Trigger
-- ============================================
-- The existing updated_at trigger should handle updates automatically
-- No additional trigger needed for soft delete

-- ============================================
-- Documentation
-- ============================================
COMMENT ON COLUMN aid_campaigns.is_deleted IS 'Soft delete flag - true when campaign is deleted';
COMMENT ON COLUMN aid_campaigns.deleted_at IS 'Timestamp when the campaign was soft deleted';
COMMENT ON COLUMN aid_campaigns.deleted_by IS 'User ID who deleted the campaign';

-- ============================================
-- Rollback Instructions (if needed)
-- ============================================
-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_aid_campaigns_deleted_at;
-- DROP INDEX IF EXISTS idx_aid_campaigns_deleted;
-- ALTER TABLE aid_campaigns DROP COLUMN IF EXISTS deleted_by;
-- ALTER TABLE aid_campaigns DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE aid_campaigns DROP COLUMN IF EXISTS is_deleted;
