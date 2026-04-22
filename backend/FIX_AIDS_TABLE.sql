-- Fix for: column aids.is_deleted does not exist
-- Run this SQL in your Supabase SQL Editor to add the missing column

-- Add is_deleted column to aids table if it doesn't exist
ALTER TABLE aids ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;

-- Add deleted_at column if it doesn't exist (for soft delete timestamp)
ALTER TABLE aids ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_aids_is_deleted ON aids(is_deleted);
CREATE INDEX IF NOT EXISTS idx_aids_deleted_at ON aids(deleted_at);
CREATE INDEX IF NOT EXISTS idx_aids_is_active ON aids(is_active);

-- Add helpful comments
COMMENT ON COLUMN aids.is_deleted IS 'Soft delete flag - true when record is deleted';
COMMENT ON COLUMN aids.deleted_at IS 'Timestamp when record was soft deleted';
COMMENT ON COLUMN aids.is_active IS 'Active status flag - false when record is deactivated';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'aids'
ORDER BY ordinal_position;
