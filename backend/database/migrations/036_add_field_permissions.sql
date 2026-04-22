-- Migration 036: Add field-level permissions for family data editing
-- This allows Camp Managers to control which fields beneficiaries can edit

-- Create family_field_permissions table
CREATE TABLE IF NOT EXISTS family_field_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES families(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  is_editable BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, field_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_family_permissions ON family_field_permissions(family_id);
CREATE INDEX IF NOT EXISTS idx_editable_fields ON family_field_permissions(family_id, is_editable);

-- Add comment
COMMENT ON TABLE family_field_permissions IS 'Controls which fields each family can edit in the beneficiary portal';
COMMENT ON COLUMN family_field_permissions.field_name IS 'Field name in snake_case format (e.g., phone_number, head_first_name)';
COMMENT ON COLUMN family_field_permissions.is_editable IS 'Whether this field can be edited by the beneficiary';

-- Note: No default permissions are seeded
-- Camp Managers must explicitly enable editable fields per family
-- This ensures maximum security - nothing is editable by default
