-- Migration: Update Section 5.3 - Refugee/Resident Outside Country
-- Date: 2026-02-22
-- Description: 
--   - Renames displacement_abroad_* to refugee_resident_abroad_*
--   - Drops displacement_abroad_legal_status column (not needed)
--   - Simplifies residence_type to 3 options: refugee, legal_resident, other

-- =====================================================
-- PART 1: Rename columns from displacement_abroad to refugee_resident_abroad
-- =====================================================

-- Rename country column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'families' 
    AND column_name = 'displacement_abroad_country'
  ) THEN
    ALTER TABLE families 
      RENAME COLUMN displacement_abroad_country TO refugee_resident_abroad_country;
  END IF;
END $$;

-- Rename city column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'families' 
    AND column_name = 'displacement_abroad_city'
  ) THEN
    ALTER TABLE families 
      RENAME COLUMN displacement_abroad_city TO refugee_resident_abroad_city;
  END IF;
END $$;

-- Rename residence_type column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'families' 
    AND column_name = 'displacement_abroad_residence_type'
  ) THEN
    ALTER TABLE families 
      RENAME COLUMN displacement_abroad_residence_type TO refugee_resident_abroad_residence_type;
  END IF;
END $$;

-- =====================================================
-- PART 2: Drop legal_status column (not needed in simplified version)
-- =====================================================

ALTER TABLE families 
  DROP COLUMN IF EXISTS displacement_abroad_legal_status;

-- =====================================================
-- PART 3: Update CHECK constraint for residence_type
-- =====================================================

-- Drop old check constraint if exists
ALTER TABLE families 
  DROP CONSTRAINT IF EXISTS families_displacement_abroad_residence_type_check;

-- Add new simplified check constraint
ALTER TABLE families 
  ADD CONSTRAINT families_refugee_resident_abroad_residence_type_check 
  CHECK (refugee_resident_abroad_residence_type IN (
    'refugee',         -- لاجئ
    'legal_resident',  -- مقيم نظامي
    'other'            -- أخرى
  ));

-- =====================================================
-- PART 4: Rename indexes
-- =====================================================

-- Rename index for country
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'families' 
    AND indexname = 'idx_families_displacement_abroad_country'
  ) THEN
    ALTER INDEX idx_families_displacement_abroad_country 
      RENAME TO idx_families_refugee_resident_abroad_country;
  END IF;
END $$;

-- Rename index for city
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'families' 
    AND indexname = 'idx_families_displacement_abroad_city'
  ) THEN
    ALTER INDEX idx_families_displacement_abroad_city 
      RENAME TO idx_families_refugee_resident_abroad_city;
  END IF;
END $$;

-- Rename index for residence_type
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'families' 
    AND indexname = 'idx_families_displacement_abroad_residence_type'
  ) THEN
    ALTER INDEX idx_families_displacement_abroad_residence_type 
      RENAME TO idx_families_refugee_resident_abroad_residence_type;
  END IF;
END $$;

-- Drop index for legal_status (column is being removed)
DROP INDEX IF EXISTS idx_families_displacement_abroad_legal_status;

-- =====================================================
-- PART 5: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN families.refugee_resident_abroad_country IS '5.3 لاجئ / مقيم بالخارج: اسم الدولة';
COMMENT ON COLUMN families.refugee_resident_abroad_city IS '5.3 لاجئ / مقيم بالخارج: المدينة';
COMMENT ON COLUMN families.refugee_resident_abroad_residence_type IS '5.3 لاجئ / مقيم بالخارج: نوع الإقامة (لاجئ، مقيم نظامي، أخرى)';

-- =====================================================
-- PART 6: Enum value translations for reference
-- =====================================================

-- Residence Type Translation:
-- 'refugee' = 'لاجئ'
-- 'legal_resident' = 'مقيم نظامي'
-- 'other' = 'أخرى'
