-- Migration: Add camp-specific fields to aids table
-- This allows each camp to have its own aid types with Arabic name support

-- Add camp_id column to aids table if not exists
ALTER TABLE aids ADD COLUMN IF NOT EXISTS camp_id UUID REFERENCES camps(id) ON DELETE SET NULL;

-- Add is_active column to allow soft deactivation if not exists
ALTER TABLE aids ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add name_ar column for Arabic name if not exists
ALTER TABLE aids ADD COLUMN IF NOT EXISTS name_ar VARCHAR(255);

-- Add unit_ar column for Arabic unit name if not exists
ALTER TABLE aids ADD COLUMN IF NOT EXISTS unit_ar VARCHAR(100);

-- Add index for faster filtering by camp
CREATE INDEX IF NOT EXISTS idx_aids_camp_id ON aids(camp_id);

-- Add index for filtering by category
CREATE INDEX IF NOT EXISTS idx_aids_category ON aids(category);

-- Add index for filtering active aids
CREATE INDEX IF NOT EXISTS idx_aids_is_active ON aids(is_active);

-- Add comments
COMMENT ON COLUMN aids.camp_id IS 'The camp this aid type belongs to (NULL for global aid types)';
COMMENT ON COLUMN aids.is_active IS 'Whether this aid type is currently active';
COMMENT ON COLUMN aids.name_ar IS 'Arabic name for the aid type';
COMMENT ON COLUMN aids.unit_ar IS 'Arabic name for the unit of measurement';
