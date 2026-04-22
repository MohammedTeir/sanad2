-- Migration: Add Housing Facilities Enum Fields
-- Date: 2026-02-22
-- Description:
--   - Adds new column current_housing_sanitary_facilities with enum values (private/shared)
--   - Updates water and electricity fields to support enum values
--   - Handles existing data by migrating to 'other' or appropriate enum values

-- =====================================================
-- PART 1: Add new sanitary facilities column with CHECK constraint
-- =====================================================

ALTER TABLE families
  ADD COLUMN IF NOT EXISTS current_housing_sanitary_facilities VARCHAR(20)
  CHECK (current_housing_sanitary_facilities IN ('private', 'shared'));

-- =====================================================
-- PART 2: Migrate existing water source data to enum values
-- =====================================================

-- First, update any NULL or empty values to NULL
UPDATE families
  SET current_housing_water_source = NULL
  WHERE current_housing_water_source = '' OR current_housing_water_source IS NULL;

-- Migrate common Arabic text values to enum equivalents
UPDATE families
  SET current_housing_water_source = 'public_network'
  WHERE current_housing_water_source LIKE '%شبكة%' 
     OR current_housing_water_source LIKE '%عام%'
     OR LOWER(current_housing_water_source) = 'شبكة عامة';

UPDATE families
  SET current_housing_water_source = 'tanker'
  WHERE current_housing_water_source LIKE '%صهاريج%'
     OR LOWER(current_housing_water_source) = 'صهاريج';

UPDATE families
  SET current_housing_water_source = 'well'
  WHERE current_housing_water_source LIKE '%آبار%'
     OR LOWER(current_housing_water_source) = 'آبار';

-- Set any remaining non-matching values to 'other'
UPDATE families
  SET current_housing_water_source = 'other'
  WHERE current_housing_water_source IS NOT NULL
    AND current_housing_water_source NOT IN ('public_network', 'tanker', 'well', 'other');

-- =====================================================
-- PART 3: Update water source CHECK constraint
-- =====================================================

-- Drop existing check constraint if exists
ALTER TABLE families
  DROP CONSTRAINT IF EXISTS families_current_housing_water_source_check;

-- Add new check constraint for water source enum values
ALTER TABLE families
  ADD CONSTRAINT families_current_housing_water_source_check
  CHECK (current_housing_water_source IS NULL OR current_housing_water_source IN (
    'public_network',  -- شبكة عامة
    'tanker',          -- صهاريج
    'well',            -- آبار
    'other'            -- آخر
  ));

-- =====================================================
-- PART 4: Migrate existing electricity access data to enum values
-- =====================================================

-- First, update any NULL or empty values to NULL
UPDATE families
  SET current_housing_electricity_access = NULL
  WHERE current_housing_electricity_access = '' OR current_housing_electricity_access IS NULL;

-- Migrate common Arabic text values to enum equivalents
UPDATE families
  SET current_housing_electricity_access = 'public_grid'
  WHERE current_housing_electricity_access LIKE '%شبكة%'
     OR current_housing_electricity_access LIKE '%عام%'
     OR LOWER(current_housing_electricity_access) = 'شبكة عامة';

UPDATE families
  SET current_housing_electricity_access = 'generator'
  WHERE current_housing_electricity_access LIKE '%مولد%'
     OR LOWER(current_housing_electricity_access) = 'مولد';

UPDATE families
  SET current_housing_electricity_access = 'solar'
  WHERE current_housing_electricity_access LIKE '%شمس%'
     OR current_housing_electricity_access LIKE '%شمسية%'
     OR LOWER(current_housing_electricity_access) = 'طاقة شمسية';

UPDATE families
  SET current_housing_electricity_access = 'none'
  WHERE current_housing_electricity_access LIKE '%لا يوجد%'
     OR LOWER(current_housing_electricity_access) = 'لا يوجد';

-- Set any remaining non-matching values to 'other'
UPDATE families
  SET current_housing_electricity_access = 'other'
  WHERE current_housing_electricity_access IS NOT NULL
    AND current_housing_electricity_access NOT IN ('public_grid', 'generator', 'solar', 'none', 'other');

-- =====================================================
-- PART 5: Update electricity access CHECK constraint
-- =====================================================

-- Drop existing check constraint if exists
ALTER TABLE families
  DROP CONSTRAINT IF EXISTS families_current_housing_electricity_access_check;

-- Add new check constraint for electricity access enum values
ALTER TABLE families
  ADD CONSTRAINT families_current_housing_electricity_access_check
  CHECK (current_housing_electricity_access IS NULL OR current_housing_electricity_access IN (
    'public_grid',     -- شبكة عامة
    'generator',       -- مولد
    'solar',           -- طاقة شمسية
    'none',            -- لا يوجد
    'other'            -- آخر
  ));

-- =====================================================
-- PART 6: Create index for new column
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_families_current_housing_sanitary_facilities
  ON families(current_housing_sanitary_facilities);

-- =====================================================
-- PART 7: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN families.current_housing_sanitary_facilities IS '5.2 السكن الحالي: المرافق الصحية (private=نعم دورة مياه خاصة, shared=لا مرافق مشتركة)';
COMMENT ON COLUMN families.current_housing_water_source IS '5.2 السكن الحالي: مصدر المياه (public_network=شبكة عامة, tanker=صهاريج, well=آبار, other=آخر)';
COMMENT ON COLUMN families.current_housing_electricity_access IS '5.2 السكن الحالي: مصدر الكهرباء (public_grid=شبكة عامة, generator=مولد, solar=طاقة شمسية, none=لا يوجد, other=آخر)';

-- =====================================================
-- PART 8: Note on backward compatibility
-- =====================================================

-- The old column current_housing_sanitary_conditions (TEXT) is kept for backward compatibility
-- New code should use current_housing_sanitary_facilities with enum values
-- Legacy text values will be supported during migration period
