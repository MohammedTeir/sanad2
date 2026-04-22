-- Migration 017: Fix Age Group Counts to Include Head and Wife
-- Date: 2026-02-23
-- Description: Update family counts trigger to include head of family and wife in age group calculations
-- Issue: Child, teenager, adult, and senior counts were only counting individuals, not head and wife

-- Step 1: Update the update_family_counts() function
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
  v_head_age INTEGER;
  v_wife_age INTEGER;
BEGIN
  -- Determine which family to update
  IF TG_TABLE_NAME = 'individuals' THEN
    family_uuid := COALESCE(NEW.family_id, OLD.family_id);
  ELSE
    family_uuid := NEW.id;
  END IF;

  -- Calculate head and wife ages from date of birth
  SELECT 
    CASE 
      WHEN f.head_of_family_date_of_birth IS NOT NULL 
      THEN EXTRACT(YEAR FROM AGE(f.head_of_family_date_of_birth))::INTEGER
      ELSE f.head_of_family_age
    END,
    CASE 
      WHEN f.wife_date_of_birth IS NOT NULL 
      THEN EXTRACT(YEAR FROM AGE(f.wife_date_of_birth))::INTEGER
      ELSE NULL
    END
  INTO v_head_age, v_wife_age
  FROM families f WHERE id = family_uuid;

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
    -- Child count (under 12): includes head, wife, and individuals
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age < 12 AND is_deleted = FALSE), 0) +
    CASE WHEN v_head_age IS NOT NULL AND v_head_age < 12 THEN 1 ELSE 0 END +
    CASE WHEN v_wife_age IS NOT NULL AND v_wife_age < 12 THEN 1 ELSE 0 END,
    -- Teenager count (12-18): includes head, wife, and individuals
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age >= 12 AND age <= 18 AND is_deleted = FALSE), 0) +
    CASE WHEN v_head_age IS NOT NULL AND v_head_age >= 12 AND v_head_age <= 18 THEN 1 ELSE 0 END +
    CASE WHEN v_wife_age IS NOT NULL AND v_wife_age >= 12 AND v_wife_age <= 18 THEN 1 ELSE 0 END,
    -- Adult count (19-60): includes head, wife, and individuals
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 18 AND age <= 60 AND is_deleted = FALSE), 0) +
    CASE WHEN v_head_age IS NOT NULL AND v_head_age > 18 AND v_head_age <= 60 THEN 1 ELSE 0 END +
    CASE WHEN v_wife_age IS NOT NULL AND v_wife_age > 18 AND v_wife_age <= 60 THEN 1 ELSE 0 END,
    -- Senior count (over 60): includes head, wife, and individuals
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 60 AND is_deleted = FALSE), 0) +
    CASE WHEN v_head_age IS NOT NULL AND v_head_age > 60 THEN 1 ELSE 0 END +
    CASE WHEN v_wife_age IS NOT NULL AND v_wife_age > 60 THEN 1 ELSE 0 END,
    CASE WHEN f.head_of_family_disability_type IS NOT NULL AND f.head_of_family_disability_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_disability_type IS NOT NULL AND f.wife_disability_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND disability_type IS NOT NULL AND disability_type != 'none' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_chronic_disease_type IS NOT NULL AND f.head_of_family_chronic_disease_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_chronic_disease_type IS NOT NULL AND f.wife_chronic_disease_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND chronic_disease_type IS NOT NULL AND chronic_disease_type != 'none' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_war_injury_type IS NOT NULL AND f.head_of_family_war_injury_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_war_injury_type IS NOT NULL AND f.wife_war_injury_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND has_war_injury = TRUE AND is_deleted = FALSE), 0),
    CASE WHEN f.wife_is_pregnant = TRUE THEN 1 ELSE 0 END
  INTO new_total, new_male, new_female, new_child, new_teen, new_adult, new_senior, new_disabled, new_chronic, new_injured, new_pregnant
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
    chronic_count = new_chronic,
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

-- Step 2: Recreate triggers to use updated function
DROP TRIGGER IF EXISTS update_family_counts_after_individual_change ON individuals;
DROP TRIGGER IF EXISTS update_family_counts_after_family_change ON families;

-- Trigger on individuals table
CREATE TRIGGER update_family_counts_after_individual_change
  AFTER INSERT OR UPDATE OR DELETE ON individuals
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

-- Trigger on families table (for wife updates)
CREATE TRIGGER update_family_counts_after_family_change
  AFTER INSERT OR UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

-- Step 3: Recalculate counts for all existing families
-- This ensures all existing records have correct age group counts
DO $$
DECLARE
  family_record RECORD;
  v_child_count INTEGER;
  v_teen_count INTEGER;
  v_adult_count INTEGER;
  v_senior_count INTEGER;
  v_head_age INTEGER;
  v_wife_age INTEGER;
BEGIN
  RAISE NOTICE 'Recalculating age group counts for all families...';
  
  FOR family_record IN SELECT id FROM families WHERE is_deleted = FALSE LOOP
    -- Calculate head and wife ages
    SELECT 
      CASE 
        WHEN f.head_of_family_date_of_birth IS NOT NULL 
        THEN EXTRACT(YEAR FROM AGE(f.head_of_family_date_of_birth))::INTEGER
        ELSE f.head_of_family_age
      END,
      CASE 
        WHEN f.wife_date_of_birth IS NOT NULL 
        THEN EXTRACT(YEAR FROM AGE(f.wife_date_of_birth))::INTEGER
        ELSE NULL
      END
    INTO v_head_age, v_wife_age
    FROM families f WHERE id = family_record.id;
    
    -- Calculate counts including head and wife
    SELECT
      COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_record.id AND age < 12 AND is_deleted = FALSE), 0) +
      CASE WHEN v_head_age IS NOT NULL AND v_head_age < 12 THEN 1 ELSE 0 END +
      CASE WHEN v_wife_age IS NOT NULL AND v_wife_age < 12 THEN 1 ELSE 0 END,
      COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_record.id AND age >= 12 AND age <= 18 AND is_deleted = FALSE), 0) +
      CASE WHEN v_head_age IS NOT NULL AND v_head_age >= 12 AND v_head_age <= 18 THEN 1 ELSE 0 END +
      CASE WHEN v_wife_age IS NOT NULL AND v_wife_age >= 12 AND v_wife_age <= 18 THEN 1 ELSE 0 END,
      COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_record.id AND age > 18 AND age <= 60 AND is_deleted = FALSE), 0) +
      CASE WHEN v_head_age IS NOT NULL AND v_head_age > 18 AND v_head_age <= 60 THEN 1 ELSE 0 END +
      CASE WHEN v_wife_age IS NOT NULL AND v_wife_age > 18 AND v_wife_age <= 60 THEN 1 ELSE 0 END,
      COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_record.id AND age > 60 AND is_deleted = FALSE), 0) +
      CASE WHEN v_head_age IS NOT NULL AND v_head_age > 60 THEN 1 ELSE 0 END +
      CASE WHEN v_wife_age IS NOT NULL AND v_wife_age > 60 THEN 1 ELSE 0 END
    INTO v_child_count, v_teen_count, v_adult_count, v_senior_count;
    
    -- Update the family record
    UPDATE families SET
      child_count = v_child_count,
      teenager_count = v_teen_count,
      adult_count = v_adult_count,
      senior_count = v_senior_count
    WHERE id = family_record.id;
  END LOOP;
  
  RAISE NOTICE 'Age group counts recalculated successfully!';
END $$;

-- Verification query (optional - uncomment to verify results)
-- SELECT 
--   id,
--   head_of_family_name,
--   head_of_family_age,
--   wife_name,
--   wife_age,
--   child_count,
--   teenager_count,
--   adult_count,
--   senior_count,
--   total_members_count
-- FROM families 
-- WHERE is_deleted = FALSE 
-- ORDER BY head_of_family_name
-- LIMIT 10;

-- Migration complete
COMMENT ON FUNCTION update_family_counts() IS 'Migration 017: Updated to include head and wife in age group counts (child, teenager, adult, senior)';
