-- Migration 028: Add husband fields for female-headed households
-- Purpose: Support proper data storage when head of family is female (mother/wife_head)
-- Issue: Previously husband data was incorrectly stored in wife_* columns

-- Husband fields (for female-headed households)
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_name VARCHAR(255);
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_national_id VARCHAR(50);
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_date_of_birth DATE;
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_age INTEGER;
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_is_working BOOLEAN DEFAULT FALSE;
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_occupation VARCHAR(255);
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_medical_followup_required BOOLEAN DEFAULT FALSE;
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_medical_followup_frequency VARCHAR(50);
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_medical_followup_details TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_disability_type VARCHAR(20) CHECK (husband_disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'));
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_disability_severity VARCHAR(20) CHECK (husband_disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية'));
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_disability_details TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_chronic_disease_type VARCHAR(20) CHECK (husband_chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'));
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_chronic_disease_details TEXT;
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_war_injury_type VARCHAR(20) CHECK (husband_war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'));
ALTER TABLE families ADD COLUMN IF NOT EXISTS husband_war_injury_details TEXT;

-- Add comments for documentation
COMMENT ON COLUMN families.husband_name IS 'Name of husband (for female-headed households)';
COMMENT ON COLUMN families.husband_national_id IS 'National ID of husband (for female-headed households)';
COMMENT ON COLUMN families.husband_date_of_birth IS 'Date of birth of husband (for female-headed households)';
COMMENT ON COLUMN families.husband_age IS 'Age of husband (for female-headed households)';
COMMENT ON COLUMN families.husband_is_working IS 'Whether husband is working (for female-headed households)';
COMMENT ON COLUMN families.husband_occupation IS 'Occupation of husband (for female-headed households)';
COMMENT ON COLUMN families.husband_medical_followup_required IS 'Whether husband requires medical followup (for female-headed households)';
COMMENT ON COLUMN families.husband_medical_followup_frequency IS 'Frequency of husband medical followup (for female-headed households)';
COMMENT ON COLUMN families.husband_medical_followup_details IS 'Details of husband medical followup (for female-headed households)';
COMMENT ON COLUMN families.husband_disability_type IS 'Type of husband disability (for female-headed households)';
COMMENT ON COLUMN families.husband_disability_severity IS 'Severity of husband disability (for female-headed households)';
COMMENT ON COLUMN families.husband_disability_details IS 'Details of husband disability (for female-headed households)';
COMMENT ON COLUMN families.husband_chronic_disease_type IS 'Type of husband chronic disease (for female-headed households)';
COMMENT ON COLUMN families.husband_chronic_disease_details IS 'Details of husband chronic disease (for female-headed households)';
COMMENT ON COLUMN families.husband_war_injury_type IS 'Type of husband war injury (for female-headed households)';
COMMENT ON COLUMN families.husband_war_injury_details IS 'Details of husband war injury (for female-headed households)';

-- Create indexes for performance optimization (matching wife indexes)
CREATE INDEX IF NOT EXISTS idx_families_husband_working ON families(husband_is_working) WHERE husband_is_working = true;
CREATE INDEX IF NOT EXISTS idx_families_husband_disability ON families(husband_disability_type) WHERE husband_disability_type != 'لا يوجد';
CREATE INDEX IF NOT EXISTS idx_families_husband_chronic ON families(husband_chronic_disease_type) WHERE husband_chronic_disease_type != 'لا يوجد';
CREATE INDEX IF NOT EXISTS idx_families_husband_war_injury ON families(husband_war_injury_type) WHERE husband_war_injury_type != 'لا يوجد';
CREATE INDEX IF NOT EXISTS idx_families_husband_medical_followup ON families(husband_medical_followup_required) WHERE husband_medical_followup_required = true;

-- Note: No need to update triggers as husband fields follow same pattern as wife fields
-- Vulnerability score calculation will automatically include husband's conditions
-- when the head is female (similar to how it includes wife's conditions when head is male)
