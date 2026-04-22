-- Migration: Add Individual Work Status and Enhanced Family Health Counts
-- Date: 2026-02-22
-- Description: Adds is_working field to individuals and chronic_count/medical_followup_count to families
--              Updates family counts trigger to calculate these new statistics

-- =====================================================
-- PART 1: Add is_working to individuals table
-- =====================================================

ALTER TABLE individuals 
  ADD COLUMN IF NOT EXISTS is_working BOOLEAN DEFAULT FALSE;

-- Add index for is_working
CREATE INDEX IF NOT EXISTS idx_individuals_is_working ON individuals(is_working);

-- =====================================================
-- PART 2: Add chronic_count and medical_followup_count to families
-- =====================================================

-- Note: chronic_count may already exist in some schemas
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS chronic_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS medical_followup_count INTEGER DEFAULT 0;

-- Add indexes for new count fields
CREATE INDEX IF NOT EXISTS idx_families_chronic_count ON families(chronic_count);
CREATE INDEX IF NOT EXISTS idx_families_medical_followup_count ON families(medical_followup_count);

-- =====================================================
-- PART 3: Update family counts trigger function
-- =====================================================

-- Drop existing triggers first (they depend on the function)
DROP TRIGGER IF EXISTS update_family_counts_after_individual_change ON individuals;
DROP TRIGGER IF EXISTS update_family_counts_after_family_change ON families;

-- Now drop the function (no more dependencies)
DROP FUNCTION IF EXISTS update_family_counts();

-- Create updated function with new counts
CREATE OR REPLACE FUNCTION update_family_counts()
RETURNS TRIGGER AS $$
DECLARE
  family_uuid UUID;
  new_total INTEGER;
  new_male INTEGER;
  new_female INTEGER;
  new_child INTEGER;
  new_teen INTEGER;
  new_adult INTEGER;
  new_senior INTEGER;
  new_disabled INTEGER;
  new_chronic INTEGER;
  new_injured INTEGER;
  new_medical_followup INTEGER;
  new_pregnant INTEGER;
BEGIN
  -- Determine which family to update
  IF TG_TABLE_NAME = 'individuals' THEN
    family_uuid := COALESCE(NEW.family_id, OLD.family_id);
  ELSE
    family_uuid := NEW.id;
  END IF;

  -- Calculate new counts including is_working, chronic diseases, and medical followup
  SELECT
    -- Total members: 1 (head) + individuals + wife (if exists)
    1 +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND is_deleted = FALSE), 0) +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END,
    
    -- Male count: head (if male) + male individuals
    CASE WHEN f.head_of_family_gender = 'male' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND gender = 'male' AND is_deleted = FALSE), 0),
    
    -- Female count: head (if female) + wife + female individuals
    CASE WHEN f.head_of_family_gender = 'female' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND gender = 'female' AND is_deleted = FALSE), 0),
    
    -- Age classifications
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age < 12 AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age >= 12 AND age <= 18 AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 18 AND age <= 60 AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 60 AND is_deleted = FALSE), 0),
    
    -- Disabled count: head + wife + individuals with disability != 'none'
    CASE WHEN f.head_of_family_disability_type IS NOT NULL AND f.head_of_family_disability_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_disability_type IS NOT NULL AND f.wife_disability_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND disability_type IS NOT NULL AND disability_type != 'none' AND is_deleted = FALSE), 0),
    
    -- Chronic disease count: head + wife + individuals with chronic disease != 'none'
    CASE WHEN f.head_of_family_chronic_disease_type IS NOT NULL AND f.head_of_family_chronic_disease_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_chronic_disease_type IS NOT NULL AND f.wife_chronic_disease_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND chronic_disease_type IS NOT NULL AND chronic_disease_type != 'none' AND is_deleted = FALSE), 0),
    
    -- Injured count: head + wife + individuals with war injury != 'none'
    CASE WHEN f.head_of_family_war_injury_type IS NOT NULL AND f.head_of_family_war_injury_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_war_injury_type IS NOT NULL AND f.wife_war_injury_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND has_war_injury = TRUE AND is_deleted = FALSE), 0),
    
    -- Medical followup count: head + wife + individuals requiring followup
    CASE WHEN f.head_of_family_medical_followup_required = TRUE THEN 1 ELSE 0 END +
    CASE WHEN f.wife_medical_followup_required = TRUE THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND medical_followup_required = TRUE AND is_deleted = FALSE), 0),
    
    -- Pregnant women count
    CASE WHEN f.wife_is_pregnant = TRUE THEN 1 ELSE 0 END
    
  INTO new_total, new_male, new_female, new_child, new_teen, new_adult, new_senior, 
       new_disabled, new_chronic, new_injured, new_medical_followup, new_pregnant
  FROM families f WHERE id = family_uuid;

  -- Update family with new counts (only if values changed to avoid infinite recursion)
  UPDATE families f SET
    total_members_count = new_total,
    male_count = new_male,
    female_count = new_female,
    child_count = new_child,
    teenager_count = new_teen,
    adult_count = new_adult,
    senior_count = new_senior,
    disabled_count = new_disabled,
    chronic_count = new_chronic,
    injured_count = new_injured,
    medical_followup_count = new_medical_followup,
    pregnant_women_count = new_pregnant
  WHERE id = family_uuid
    AND (
      total_members_count IS DISTINCT FROM new_total
      OR male_count IS DISTINCT FROM new_male
      OR female_count IS DISTINCT FROM new_female
      OR disabled_count IS DISTINCT FROM new_disabled
      OR chronic_count IS DISTINCT FROM new_chronic
      OR injured_count IS DISTINCT FROM new_injured
      OR medical_followup_count IS DISTINCT FROM new_medical_followup
      OR pregnant_women_count IS DISTINCT FROM new_pregnant
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PART 4: Recreate triggers
-- =====================================================

-- Trigger on individuals table
CREATE TRIGGER update_family_counts_after_individual_change
  AFTER INSERT OR UPDATE OR DELETE ON individuals
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

-- Trigger on families table (for wife/head updates)
CREATE TRIGGER update_family_counts_after_family_change
  AFTER INSERT OR UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

-- =====================================================
-- PART 5: One-time data fix for existing records
-- =====================================================

-- Update all existing families with correct counts including new fields
UPDATE families f SET
  chronic_count = (
    CASE WHEN f.head_of_family_chronic_disease_type IS NOT NULL AND f.head_of_family_chronic_disease_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_chronic_disease_type IS NOT NULL AND f.wife_chronic_disease_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.chronic_disease_type IS NOT NULL AND i.chronic_disease_type != 'none' AND i.is_deleted = FALSE), 0)
  ),
  medical_followup_count = (
    CASE WHEN f.head_of_family_medical_followup_required = TRUE THEN 1 ELSE 0 END +
    CASE WHEN f.wife_medical_followup_required = TRUE THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.medical_followup_required = TRUE AND i.is_deleted = FALSE), 0)
  )
WHERE 
  chronic_count IS DISTINCT FROM (
    CASE WHEN f.head_of_family_chronic_disease_type IS NOT NULL AND f.head_of_family_chronic_disease_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_chronic_disease_type IS NOT NULL AND f.wife_chronic_disease_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.chronic_disease_type IS NOT NULL AND i.chronic_disease_type != 'none' AND i.is_deleted = FALSE), 0)
  )
  OR
  medical_followup_count IS DISTINCT FROM (
    CASE WHEN f.head_of_family_medical_followup_required = TRUE THEN 1 ELSE 0 END +
    CASE WHEN f.wife_medical_followup_required = TRUE THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.medical_followup_required = TRUE AND i.is_deleted = FALSE), 0)
  );

-- =====================================================
-- PART 6: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN individuals.is_working IS 'هل يعمل/تعمل؟ - Work status for individuals';
COMMENT ON COLUMN families.chronic_count IS 'إحصائيات الصحة: عدد المصابين بأمراض مزمنة - Auto-calculated count of individuals with chronic diseases';
COMMENT ON COLUMN families.medical_followup_count IS 'إحصائيات الصحة: عدد الذين يحتاجون متابعة طبية - Auto-calculated count of individuals requiring medical followup';
