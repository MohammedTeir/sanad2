-- Migration: Update Section 5 - Displacement Abroad and Remove Neighborhood
-- Date: 2026-02-22
-- Description: 
--   - Removes original_address_neighborhood (redundant with governorate + region)
--   - Renames current_housing_country to displacement_abroad_country
--   - Adds new displacement abroad fields (city, residence_type, legal_status)

-- =====================================================
-- PART 1: Remove original_address_neighborhood column
-- =====================================================

ALTER TABLE families 
  DROP COLUMN IF EXISTS original_address_neighborhood;

-- =====================================================
-- PART 2: Rename current_housing_country to displacement_abroad_country
-- =====================================================

-- Check if column exists before renaming
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'families' 
    AND column_name = 'current_housing_country'
  ) THEN
    ALTER TABLE families 
      RENAME COLUMN current_housing_country TO displacement_abroad_country;
  END IF;
END $$;

-- =====================================================
-- PART 3: Add new displacement abroad columns
-- =====================================================

-- City field
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS displacement_abroad_city VARCHAR(100);

-- Residence type field
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS displacement_abroad_residence_type VARCHAR(20) 
  CHECK (displacement_abroad_residence_type IN (
    'official_camp',      -- مخيم رسمي
    'private_housing',    -- سكن خاص
    'shelter_center',     -- مركز إيواء
    'other'               -- آخر
  ));

-- Legal status field
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS displacement_abroad_legal_status VARCHAR(20) 
  CHECK (displacement_abroad_legal_status IN (
    'legal_resident',      -- إقامة نظامية
    'registered_refugee',  -- لاجئ مسجل
    'asylum_seeker',       -- طالب لجوء
    'irregular_resident',  -- إقامة غير نظامية
    'other'                -- آخر
  ));

-- =====================================================
-- PART 4: Add indexes for new columns
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_families_displacement_abroad_country 
  ON families(displacement_abroad_country);

CREATE INDEX IF NOT EXISTS idx_families_displacement_abroad_city 
  ON families(displacement_abroad_city);

CREATE INDEX IF NOT EXISTS idx_families_displacement_abroad_residence_type 
  ON families(displacement_abroad_residence_type);

CREATE INDEX IF NOT EXISTS idx_families_displacement_abroad_legal_status 
  ON families(displacement_abroad_legal_status);

-- =====================================================
-- PART 5: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN families.original_address_governorate IS '5.1 السكن الأصلي: المحافظة الأصلية';
COMMENT ON COLUMN families.original_address_region IS '5.1 السكن الأصلي: المنطقة / المديرية';
COMMENT ON COLUMN families.original_address_details IS '5.1 السكن الأصلي: العنوان بالتفصيل';
COMMENT ON COLUMN families.original_address_housing_type IS '5.1 السكن الأصلي: نوع السكن (ملك، إيجار)';

COMMENT ON COLUMN families.current_housing_type IS '5.2 السكن الحالي: نوع السكن (خيمة، بيت إسمنتي، شقة، أخرى)';
COMMENT ON COLUMN families.current_housing_camp_id IS '5.2 السكن الحالي: المخيم (FK to camps table)';
COMMENT ON COLUMN families.current_housing_unit_number IS '5.2 السكن الحالي: رقم الخيمة / الوحدة السكنية';
COMMENT ON COLUMN families.current_housing_is_suitable_for_family_size IS '5.2 السكن الحالي: هل السكن مناسب لعدد الأفراد؟';
COMMENT ON COLUMN families.current_housing_sanitary_conditions IS '5.2 السكن الحالي: المرافق الصحية';
COMMENT ON COLUMN families.current_housing_water_source IS '5.2 السكن الحالي: مصدر المياه';
COMMENT ON COLUMN families.current_housing_electricity_access IS '5.2 السكن الحالي: مصدر الكهرباء';
COMMENT ON COLUMN families.current_housing_landmark IS '5.2 السكن الحالي: أقرب معلم معروف';

COMMENT ON COLUMN families.displacement_abroad_country IS '5.3 النزوح خارج البلاد: اسم الدولة';
COMMENT ON COLUMN families.displacement_abroad_city IS '5.3 النزوح خارج البلاد: المدينة';
COMMENT ON COLUMN families.displacement_abroad_residence_type IS '5.3 النزوح خارج البلاد: نوع الإقامة';
COMMENT ON COLUMN families.displacement_abroad_legal_status IS '5.3 النزوح خارج البلاد: حالة الإقامة القانونية';

-- =====================================================
-- PART 6: Enum value translations for reference
-- =====================================================

-- Residence Type Translation:
-- 'official_camp' = 'مخيم رسمي'
-- 'private_housing' = 'سكن خاص'
-- 'shelter_center' = 'مركز إيواء'
-- 'other' = 'أخرى'

-- Legal Status Translation:
-- 'legal_resident' = 'إقامة نظامية'
-- 'registered_refugee' = 'لاجئ مسجل'
-- 'asylum_seeker' = 'طالب لجوء'
-- 'irregular_resident' = 'إقامة غير نظامية'
-- 'other' = 'أخرى'
