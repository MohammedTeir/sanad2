-- =====================================================
-- Phase 1.5: Update Chronic Count Trigger
-- Convert all English enum values to Arabic
-- =====================================================

-- Drop existing triggers and function
DROP TRIGGER IF EXISTS update_family_counts_after_individual_change ON individuals;
DROP TRIGGER IF EXISTS update_family_counts_after_family_change ON families;
DROP FUNCTION IF EXISTS update_family_counts();

-- =====================================================
-- Create updated family counts function with Arabic values
-- =====================================================

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
  new_pregnant INTEGER;
BEGIN
  -- Determine which family to update
  IF TG_TABLE_NAME = 'individuals' THEN
    family_uuid := COALESCE(NEW.family_id, OLD.family_id);
  ELSE
    family_uuid := NEW.id;
  END IF;

  -- Calculate new counts using Arabic values
  SELECT
    1 +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND is_deleted = FALSE), 0) +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END,
    CASE WHEN f.head_of_family_gender = 'ذكر' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND gender = 'ذكر' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_gender = 'أنثى' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND gender = 'أنثى' AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age < 12 AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age >= 12 AND age <= 18 AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 18 AND age <= 60 AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 60 AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_disability_type IS NOT NULL AND f.head_of_family_disability_type != 'لا يوجد' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_disability_type IS NOT NULL AND f.wife_disability_type != 'لا يوجد' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND disability_type IS NOT NULL AND disability_type != 'لا يوجد' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_chronic_disease_type IS NOT NULL AND f.head_of_family_chronic_disease_type != 'لا يوجد' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_chronic_disease_type IS NOT NULL AND f.wife_chronic_disease_type != 'لا يوجد' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND chronic_disease_type IS NOT NULL AND chronic_disease_type != 'لا يوجد' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_war_injury_type IS NOT NULL AND f.head_of_family_war_injury_type != 'لا يوجد' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_war_injury_type IS NOT NULL AND f.wife_war_injury_type != 'لا يوجد' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND has_war_injury = TRUE AND is_deleted = FALSE), 0),
    CASE WHEN f.wife_is_pregnant = TRUE THEN 1 ELSE 0 END
  INTO new_total, new_male, new_female, new_child, new_teen, new_adult, new_senior, new_disabled, new_chronic, new_injured, new_pregnant
  FROM families f WHERE id = family_uuid;

  -- Update the family statistics
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
    pregnant_women_count = new_pregnant,
    last_updated = NOW()
  WHERE id = family_uuid
    AND (
      total_members_count IS DISTINCT FROM new_total
      OR male_count IS DISTINCT FROM new_male
      OR female_count IS DISTINCT FROM new_female
      OR chronic_count IS DISTINCT FROM new_chronic
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Recreate triggers
-- =====================================================

CREATE TRIGGER update_family_counts_after_individual_change
  AFTER INSERT OR UPDATE OR DELETE ON individuals
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

CREATE TRIGGER update_family_counts_after_family_change
  AFTER INSERT OR UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

-- =====================================================
-- Update existing records with correct chronic_count using Arabic values
-- =====================================================

UPDATE families f SET
  chronic_count = (
    CASE WHEN f.head_of_family_chronic_disease_type IS NOT NULL AND f.head_of_family_chronic_disease_type != 'لا يوجد' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_chronic_disease_type IS NOT NULL AND f.wife_chronic_disease_type != 'لا يوجد' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = f.id AND chronic_disease_type IS NOT NULL AND chronic_disease_type != 'لا يوجد' AND is_deleted = FALSE), 0)
  ),
  last_updated = NOW()
WHERE chronic_count IS NULL OR chronic_count = 0;

-- =====================================================
-- Update comments
-- =====================================================

COMMENT ON FUNCTION update_family_counts() IS
'Trigger function that updates family member counts including chronic_count using Arabic enum values.';

-- Output migration info
DO $$
BEGIN
    RAISE NOTICE 'Chronic count trigger updated to use Arabic values!';
END $$;
