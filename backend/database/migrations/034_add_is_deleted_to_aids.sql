-- Migration 034: Add is_deleted flag to aids table
-- This migration adds the is_deleted boolean flag for consistent soft delete handling
-- Date: 2026-03-10

-- Add is_deleted column to aids table
ALTER TABLE aids ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add index for filtering soft-deleted records
CREATE INDEX IF NOT EXISTS idx_aids_is_deleted ON aids(is_deleted);
CREATE INDEX IF NOT EXISTS idx_aids_deleted_at ON aids(deleted_at);

-- Add index for is_active filtering
CREATE INDEX IF NOT EXISTS idx_aids_is_active ON aids(is_active);

-- Comments
COMMENT ON COLUMN aids.is_deleted IS 'Soft delete flag - true when record is deleted';
COMMENT ON COLUMN aids.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN aids.is_active IS 'Active status flag - false when record is deactivated';
