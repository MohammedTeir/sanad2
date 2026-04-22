-- Migration: Complete Families and Individuals Model Implementation
-- Date: 2026-02-22
-- Description: Adds missing fields to fully implement the families and individuals data model
--              including disability severity, expanded disease types, wife work info, and individual education details

-- =====================================================
-- PART 1: Update families table
-- =====================================================

-- 1.1 Add wife work information fields
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS wife_is_working BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS wife_occupation VARCHAR(255);

-- 1.2 Add monthly income range enum (keep numeric for flexibility)
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS head_of_family_monthly_income_range VARCHAR(20) CHECK (head_of_family_monthly_income_range IN ('no_income', 'under_100', '100_to_300', '300_to_500', 'over_500'));

-- 1.3 Add disability severity for head of family
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS head_of_family_disability_severity VARCHAR(20) CHECK (head_of_family_disability_severity IN ('simple', 'moderate', 'severe', 'total'));

-- 1.4 Add disability severity for wife
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS wife_disability_severity VARCHAR(20) CHECK (wife_disability_severity IN ('simple', 'moderate', 'severe', 'total'));

-- 1.5 Expand chronic disease types - add asthma, kidney_failure, mental_disease
-- Note: We'll keep the existing field and add a new expanded field for flexibility
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS head_of_family_chronic_disease_type_expanded VARCHAR(30) CHECK (head_of_family_chronic_disease_type_expanded IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other')),
  ADD COLUMN IF NOT EXISTS wife_chronic_disease_type_expanded VARCHAR(30) CHECK (wife_chronic_disease_type_expanded IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other'));

-- 1.6 Expand war injury types - add head_face, spinal
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS head_of_family_war_injury_type_expanded VARCHAR(30) CHECK (head_of_family_war_injury_type_expanded IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other')),
  ADD COLUMN IF NOT EXISTS wife_war_injury_type_expanded VARCHAR(30) CHECK (wife_war_injury_type_expanded IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other'));

-- 1.7 Add medical follow-up details for head of family
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS head_of_family_medical_followup_details TEXT,
  ADD COLUMN IF NOT EXISTS wife_medical_followup_details TEXT;

-- 1.8 Expand widow reason to include accident and disease
-- We'll add a new field to maintain backward compatibility
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS head_of_family_widow_reason_expanded VARCHAR(20) CHECK (head_of_family_widow_reason_expanded IN ('martyr', 'natural', 'accident', 'disease', 'other'));

-- =====================================================
-- PART 2: Update individuals table
-- =====================================================

-- 2.1 Add is_studying field for children/students
ALTER TABLE individuals 
  ADD COLUMN IF NOT EXISTS is_studying BOOLEAN DEFAULT FALSE;

-- 2.2 Add education stage field (more detailed than education_level)
ALTER TABLE individuals 
  ADD COLUMN IF NOT EXISTS education_stage VARCHAR(20) CHECK (education_stage IN ('none', 'primary', 'secondary', 'university', 'other'));

-- 2.3 Expand relation types to include extended family
-- Drop old constraint and create new one with expanded relations
ALTER TABLE individuals 
  DROP CONSTRAINT IF EXISTS individuals_relation_check;

ALTER TABLE individuals 
  ADD CONSTRAINT individuals_relation_check 
  CHECK (relation IN ('father', 'mother', 'wife', 'husband', 'son', 'daughter', 'brother', 'sister', 'grandfather', 'grandmother', 'grandson', 'granddaughter', 'uncle', 'aunt', 'nephew', 'niece', 'cousin', 'other'));

-- 2.4 Add disability severity for individuals
ALTER TABLE individuals 
  ADD COLUMN IF NOT EXISTS disability_severity VARCHAR(20) CHECK (disability_severity IN ('simple', 'moderate', 'severe', 'total'));

-- 2.5 Expand chronic disease types for individuals
ALTER TABLE individuals 
  DROP CONSTRAINT IF EXISTS individuals_chronic_disease_type_check;

ALTER TABLE individuals 
  ADD CONSTRAINT individuals_chronic_disease_type_check 
  CHECK (chronic_disease_type IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other'));

-- 2.6 Expand war injury types for individuals
ALTER TABLE individuals 
  DROP CONSTRAINT IF EXISTS individuals_war_injury_type_check;

ALTER TABLE individuals 
  ADD CONSTRAINT individuals_war_injury_type_check 
  CHECK (war_injury_type IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other'));

-- 2.7 Add medical follow-up details for individuals
ALTER TABLE individuals 
  ADD COLUMN IF NOT EXISTS medical_followup_details TEXT;

-- =====================================================
-- PART 3: Update indexes for new fields
-- =====================================================

-- Index for disability severity
CREATE INDEX IF NOT EXISTS idx_families_head_disability_severity ON families(head_of_family_disability_severity);
CREATE INDEX IF NOT EXISTS idx_families_wife_disability_severity ON families(wife_disability_severity);
CREATE INDEX IF NOT EXISTS idx_individuals_disability_severity ON individuals(disability_severity);

-- Index for expanded disease types
CREATE INDEX IF NOT EXISTS idx_families_head_chronic_expanded ON families(head_of_family_chronic_disease_type_expanded);
CREATE INDEX IF NOT EXISTS idx_families_wife_chronic_expanded ON families(wife_chronic_disease_type_expanded);
CREATE INDEX IF NOT EXISTS idx_individuals_chronic_expanded ON individuals(chronic_disease_type);

-- Index for expanded war injury types
CREATE INDEX IF NOT EXISTS idx_families_head_war_injury_expanded ON families(head_of_family_war_injury_type_expanded);
CREATE INDEX IF NOT EXISTS idx_families_wife_war_injury_expanded ON families(wife_war_injury_type_expanded);
CREATE INDEX IF NOT EXISTS idx_individuals_war_injury_expanded ON individuals(war_injury_type);

-- Index for income range
CREATE INDEX IF NOT EXISTS idx_families_income_range ON families(head_of_family_monthly_income_range);

-- Index for education/studying
CREATE INDEX IF NOT EXISTS idx_individuals_is_studying ON individuals(is_studying);
CREATE INDEX IF NOT EXISTS idx_individuals_education_stage ON individuals(education_stage);

-- =====================================================
-- PART 4: Update family counts trigger to include new fields
-- =====================================================

-- The existing trigger already handles disability counts correctly
-- No changes needed as we're using the same type fields

-- =====================================================
-- PART 5: Data migration - Set default values for existing records
-- =====================================================

-- 5.1 Set default values for wife work fields (already FALSE by DEFAULT)
-- 5.2 Set default values for is_studying (already FALSE by DEFAULT)
-- 5.3 Copy existing chronic disease types to expanded fields where applicable
UPDATE families SET 
  head_of_family_chronic_disease_type_expanded = head_of_family_chronic_disease_type,
  wife_chronic_disease_type_expanded = wife_chronic_disease_type,
  head_of_family_war_injury_type_expanded = head_of_family_war_injury_type,
  wife_war_injury_type_expanded = wife_war_injury_type
WHERE head_of_family_chronic_disease_type_expanded IS NULL;

UPDATE individuals SET 
  education_stage = education_level,
  disability_severity = 'moderate' -- Default to moderate for existing disabilities
WHERE disability_type IS NOT NULL AND disability_type != 'none';

-- =====================================================
-- PART 6: Update comments for documentation
-- =====================================================

COMMENT ON COLUMN families.wife_is_working IS 'هل الزوجة تعمل؟';
COMMENT ON COLUMN families.wife_occupation IS 'مهنة الزوجة';
COMMENT ON COLUMN families.head_of_family_monthly_income_range IS 'نطاق الدخل الشهري: no_income, under_100, 100_to_300, 300_to_500, over_500';
COMMENT ON COLUMN families.head_of_family_disability_severity IS 'درجة الإعاقة: simple, moderate, severe, total';
COMMENT ON COLUMN families.wife_disability_severity IS 'درجة إعاقة الزوجة';
COMMENT ON COLUMN families.head_of_family_chronic_disease_type_expanded IS 'نوع المرض المزمن الموسع (يشمل الربو، الفشل الكلوي، الأمراض النفسية)';
COMMENT ON COLUMN families.wife_chronic_disease_type_expanded IS 'نوع المرض المزمن الموسع للزوجة';
COMMENT ON COLUMN families.head_of_family_war_injury_type_expanded IS 'نوع إصابة الحرب الموسع (يشمل إصابات الرأس والوجه، العمود الفقري)';
COMMENT ON COLUMN families.wife_war_injury_type_expanded IS 'نوع إصابة الحرب الموسع للزوجة';
COMMENT ON COLUMN families.head_of_family_medical_followup_details IS 'تفاصيل المتابعة الطبية (نوعها)';
COMMENT ON COLUMN families.wife_medical_followup_details IS 'تفاصيل المتابعة الطبية للزوجة';
COMMENT ON COLUMN families.head_of_family_widow_reason_expanded IS 'سبب الوفاة الموسع (يشمل الحادث، المرض)';

COMMENT ON COLUMN individuals.is_studying IS 'هل يدرس/تدرس؟';
COMMENT ON COLUMN individuals.education_stage IS 'المرحلة الدراسية: primary, secondary, university';
COMMENT ON COLUMN individuals.disability_severity IS 'درجة الإعاقة: simple, moderate, severe, total';
COMMENT ON COLUMN individuals.medical_followup_details IS 'تفاصيل المتابعة الطبية';
