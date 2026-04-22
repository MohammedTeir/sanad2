-- Migration: Add trigger to auto-update family counts including wife
-- Date: 2026-02-20
-- Description: Automatically calculates total_members_count, male_count, female_count, etc. including the wife
-- Fix: Removed last_updated update to avoid infinite recursion

-- Drop existing triggers if they exist (in different order to avoid dependency issues)
DROP TRIGGER IF EXISTS update_family_counts_after_family_change ON families;
DROP TRIGGER IF EXISTS update_family_counts_after_individual_change ON individuals;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_family_counts();

-- Function to update family counts from individuals and wife data
-- Note: Does NOT update last_updated to avoid triggering other triggers and infinite recursion
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
  new_injured INTEGER;
  new_pregnant INTEGER;
BEGIN
  -- Determine which family to update
  IF TG_TABLE_NAME = 'individuals' THEN
    family_uuid := COALESCE(NEW.family_id, OLD.family_id);
  ELSE
    family_uuid := NEW.id;
  END IF;

  -- Calculate new counts
  SELECT
    1 +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND is_deleted = FALSE), 0) +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END,
    CASE WHEN f.head_of_family_gender = 'male' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND gender = 'male' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_gender = 'female' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND gender = 'female' AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age < 12 AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age >= 12 AND age <= 18 AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 18 AND age <= 60 AND is_deleted = FALSE), 0),
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 60 AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_disability_type IS NOT NULL AND f.head_of_family_disability_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_disability_type IS NOT NULL AND f.wife_disability_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND disability_type IS NOT NULL AND disability_type != 'none' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_war_injury_type IS NOT NULL AND f.head_of_family_war_injury_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_war_injury_type IS NOT NULL AND f.wife_war_injury_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND has_war_injury = TRUE AND is_deleted = FALSE), 0),
    CASE WHEN f.wife_is_pregnant = TRUE THEN 1 ELSE 0 END
  INTO new_total, new_male, new_female, new_child, new_teen, new_adult, new_senior, new_disabled, new_injured, new_pregnant
  FROM families f WHERE id = family_uuid;

  -- Only update if values changed (to avoid infinite recursion)
  UPDATE families f SET
    total_members_count = new_total,
    male_count = new_male,
    female_count = new_female,
    child_count = new_child,
    teenager_count = new_teen,
    adult_count = new_adult,
    senior_count = new_senior,
    disabled_count = new_disabled,
    injured_count = new_injured,
    pregnant_women_count = new_pregnant
  WHERE id = family_uuid
    AND (
      total_members_count IS DISTINCT FROM new_total
      OR male_count IS DISTINCT FROM new_male
      OR female_count IS DISTINCT FROM new_female
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger on individuals table
CREATE TRIGGER update_family_counts_after_individual_change
  AFTER INSERT OR UPDATE OR DELETE ON individuals
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

-- Trigger on families table (for wife updates)
CREATE TRIGGER update_family_counts_after_family_change
  AFTER INSERT OR UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

-- One-time fix: Update all existing families with correct counts
-- Run once to fix existing data
UPDATE families f SET
  total_members_count = (
    1 +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.is_deleted = FALSE), 0) +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END
  ),
  male_count = (
    CASE WHEN f.head_of_family_gender = 'male' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.gender = 'male' AND i.is_deleted = FALSE), 0)
  ),
  female_count = (
    CASE WHEN f.head_of_family_gender = 'female' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.gender = 'female' AND i.is_deleted = FALSE), 0)
  ),
  child_count = (
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.age < 12 AND i.is_deleted = FALSE), 0)
  ),
  teenager_count = (
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.age >= 12 AND i.age <= 18 AND i.is_deleted = FALSE), 0)
  ),
  adult_count = (
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.age > 18 AND i.age <= 60 AND i.is_deleted = FALSE), 0)
  ),
  senior_count = (
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.age > 60 AND i.is_deleted = FALSE), 0)
  ),
  disabled_count = (
    CASE WHEN f.head_of_family_disability_type IS NOT NULL AND f.head_of_family_disability_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_disability_type IS NOT NULL AND f.wife_disability_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.disability_type IS NOT NULL AND i.disability_type != 'none' AND i.is_deleted = FALSE), 0)
  ),
  injured_count = (
    CASE WHEN f.head_of_family_war_injury_type IS NOT NULL AND f.head_of_family_war_injury_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_war_injury_type IS NOT NULL AND f.wife_war_injury_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.has_war_injury = TRUE AND i.is_deleted = FALSE), 0)
  ),
  pregnant_women_count = (
    CASE WHEN f.wife_is_pregnant = TRUE THEN 1 ELSE 0 END
  )
WHERE f.wife_name IS NOT NULL AND f.wife_name != ''
  AND (
    total_members_count IS DISTINCT FROM (
      1 +
      COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.is_deleted = FALSE), 0) +
      CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END
    )
    OR female_count IS DISTINCT FROM (
      CASE WHEN f.head_of_family_gender = 'female' THEN 1 ELSE 0 END +
      CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END +
      COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.gender = 'female' AND i.is_deleted = FALSE), 0)
    )
  );
