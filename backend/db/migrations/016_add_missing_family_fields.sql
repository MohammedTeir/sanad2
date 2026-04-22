-- Migration 016: Add Missing Family and Individual Fields
-- This migration adds all missing fields from the data model specification

-- =====================================================
-- PART 1: Families Table - Enhanced Fields
-- =====================================================

-- 4.2 Spouse - Pregnancy Special Needs
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS wife_pregnancy_special_needs BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS wife_pregnancy_followup_details TEXT;

-- 5.2 Current Housing - Enhanced Details
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS current_housing_sharing_status VARCHAR(20) CHECK (current_housing_sharing_status IN ('individual', 'shared')),
  ADD COLUMN IF NOT EXISTS current_housing_detailed_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS current_housing_furnished BOOLEAN;

-- Add comments for housing detailed type values
COMMENT ON COLUMN families.current_housing_detailed_type IS 'Detailed housing type: tent_individual, tent_shared, house_full, house_room, apartment_furnished, apartment_unfurnished, caravan, other';

-- =====================================================
-- PART 2: Individuals Table - Enhanced Fields
-- =====================================================

-- 4.4 Family Members - Education and Work Status
ALTER TABLE individuals
  ADD COLUMN IF NOT EXISTS is_studying BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS education_stage VARCHAR(20) CHECK (education_stage IN ('none', 'primary', 'secondary', 'university', 'other')),
  ADD COLUMN IF NOT EXISTS is_working BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS occupation VARCHAR(255),
  ADD COLUMN IF NOT EXISTS marital_status VARCHAR(20) CHECK (marital_status IN ('single', 'married', 'widow', 'divorced', 'vulnerable')),
  ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- 4.4 Family Members - Enhanced Health Fields
ALTER TABLE individuals
  ADD COLUMN IF NOT EXISTS disability_severity VARCHAR(20) CHECK (disability_severity IN ('simple', 'moderate', 'severe', 'total')),
  ADD COLUMN IF NOT EXISTS disability_details TEXT,
  ADD COLUMN IF NOT EXISTS chronic_disease_details TEXT,
  ADD COLUMN IF NOT EXISTS war_injury_details TEXT,
  ADD COLUMN IF NOT EXISTS medical_followup_frequency VARCHAR(50),
  ADD COLUMN IF NOT EXISTS medical_followup_details TEXT;

-- =====================================================
-- PART 3: Add Indexes for New Fields
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_individuals_is_studying ON individuals(is_studying);
CREATE INDEX IF NOT EXISTS idx_individuals_is_working ON individuals(is_working);
CREATE INDEX IF NOT EXISTS idx_individuals_education_stage ON individuals(education_stage);
CREATE INDEX IF NOT EXISTS idx_individuals_marital_status ON individuals(marital_status);
CREATE INDEX IF NOT EXISTS idx_families_housing_sharing ON families(current_housing_sharing_status);
CREATE INDEX IF NOT EXISTS idx_families_wife_pregnant_special_needs ON families(wife_pregnancy_special_needs);

-- =====================================================
-- PART 4: Add Comments for Documentation
-- =====================================================

COMMENT ON COLUMN families.wife_pregnancy_special_needs IS 'هل تحتاج متابعة خاصة للحمل - Does she need special pregnancy follow-up';
COMMENT ON COLUMN families.wife_pregnancy_followup_details IS 'تفاصيل المتابعة الخاصة للحمل - Special pregnancy follow-up details';

COMMENT ON COLUMN families.current_housing_sharing_status IS 'حالة مشاركة السكن: individual (خيمة/سكن فردي) أو shared (خيمة/سكن مشترك) - Housing sharing status';
COMMENT ON COLUMN families.current_housing_detailed_type IS 'النوع المفصل للسكن: tent_individual, tent_shared, house_full, house_room, apartment_furnished, apartment_unfurnished, caravan, other';
COMMENT ON COLUMN families.current_housing_furnished IS 'مفروش/غير مفروش للشقق - Furnished/unfurnished for apartments';

COMMENT ON COLUMN individuals.is_studying IS 'هل يدرس/تدرس - Is studying';
COMMENT ON COLUMN individuals.education_stage IS 'المرحلة الدراسية: primary, secondary, university, other - Education stage';
COMMENT ON COLUMN individuals.is_working IS 'هل يعمل/تعمل - Is working';
COMMENT ON COLUMN individuals.occupation IS 'المهنة - Occupation';
COMMENT ON COLUMN individuals.marital_status IS 'الحالة الاجتماعية للأفراد البالغين - Marital status for adult members';
COMMENT ON COLUMN individuals.phone_number IS 'رقم الجوال للفرد - Individual phone number';

COMMENT ON COLUMN individuals.disability_severity IS 'درجة الإعاقة: simple, moderate, severe, total - Disability severity';
COMMENT ON COLUMN individuals.disability_details IS 'تفاصيل الإعاقة - Disability details';
COMMENT ON COLUMN individuals.chronic_disease_details IS 'تفاصيل المرض المزمن - Chronic disease details';
COMMENT ON COLUMN individuals.war_injury_details IS 'تفاصيل إصابة الحرب - War injury details';
COMMENT ON COLUMN individuals.medical_followup_frequency IS 'تكرار المتابعة الطبية: daily, weekly, monthly, etc. - Medical follow-up frequency';
COMMENT ON COLUMN individuals.medical_followup_details IS 'تفاصيل المتابعة الطبية - Medical follow-up details';

-- =====================================================
-- PART 5: Update existing records with default values
-- =====================================================

-- Set default values for existing records
UPDATE individuals 
SET 
  is_studying = COALESCE(is_studying, FALSE),
  is_working = COALESCE(is_working, FALSE),
  marital_status = COALESCE(marital_status, 'single')
WHERE is_studying IS NULL OR is_working IS NULL OR marital_status IS NULL;

UPDATE families
SET
  wife_pregnancy_special_needs = COALESCE(wife_pregnancy_special_needs, FALSE),
  current_housing_sharing_status = COALESCE(current_housing_sharing_status, 'individual')
WHERE wife_pregnancy_special_needs IS NULL OR current_housing_sharing_status IS NULL;

-- =====================================================
-- Migration Complete
-- =====================================================
