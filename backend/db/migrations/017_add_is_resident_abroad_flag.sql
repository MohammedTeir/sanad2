-- Migration 017: Add explicit is_resident_abroad boolean flag
-- Purpose: Add a boolean field to explicitly track if beneficiary is a refugee/resident abroad
-- Date: 2026-03-09

-- PART 1: Add the new boolean column
ALTER TABLE families 
ADD COLUMN IF NOT EXISTS is_resident_abroad BOOLEAN DEFAULT false;

-- PART 2: Add comment explaining the field
COMMENT ON COLUMN families.is_resident_abroad IS 'لاجئ / مقيم بالخارج: هل الفرد لاجئ أو مقيم بالخارج؟ (true = نعم، false = لا)';

-- PART 3: Create index for efficient filtering
CREATE INDEX IF NOT EXISTS idx_families_is_resident_abroad 
ON families(is_resident_abroad);

-- PART 4: Optional - Update existing records that have refugee_resident_abroad_country set
-- This ensures data consistency for existing records
UPDATE families 
SET is_resident_abroad = true 
WHERE refugee_resident_abroad_country IS NOT NULL 
  AND refugee_resident_abroad_country != ''
  AND is_resident_abroad = false;
