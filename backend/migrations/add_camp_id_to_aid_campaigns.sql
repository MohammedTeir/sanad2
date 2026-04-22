-- Migration: Add camp_id to aid_campaigns table
-- This allows CAMP_MANAGERs to manage campaigns only in their own camp

-- Add camp_id column to aid_campaigns table
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS camp_id UUID REFERENCES camps(id) ON DELETE SET NULL;

-- Add index for faster filtering by camp
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_camp_id ON aid_campaigns(camp_id);

-- Add comment
COMMENT ON COLUMN aid_campaigns.camp_id IS 'The camp this campaign belongs to (NULL for SYSTEM_ADMIN global campaigns)';

-- Update existing campaigns to have NULL camp_id (for SYSTEM_ADMIN to manage)
-- CAMP_MANAGERs will only see campaigns with their camp_id
