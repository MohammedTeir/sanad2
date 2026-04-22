-- Fix: Update family counts to correct values
-- Run this if the diagnostic shows mismatched counts

UPDATE families f SET
  total_members_count = 1 +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.is_deleted = FALSE), 0) +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END,
    
  male_count = CASE WHEN f.head_of_family_gender = 'male' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND gender = 'male' AND i.is_deleted = FALSE), 0),
    
  female_count = CASE WHEN f.head_of_family_gender = 'female' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND gender = 'female' AND i.is_deleted = FALSE), 0),
    
  child_count = COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND age < 12 AND i.is_deleted = FALSE), 0),
  
  teenager_count = COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND age >= 12 AND age <= 18 AND i.is_deleted = FALSE), 0),
  
  adult_count = COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND age > 18 AND age <= 60 AND i.is_deleted = FALSE), 0),
  
  senior_count = COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND age > 60 AND i.is_deleted = FALSE), 0),
  
  disabled_count = CASE WHEN f.head_of_family_disability_type IS NOT NULL AND f.head_of_family_disability_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_disability_type IS NOT NULL AND f.wife_disability_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND disability_type IS NOT NULL AND disability_type != 'none' AND i.is_deleted = FALSE), 0),
    
  injured_count = CASE WHEN f.head_of_family_war_injury_type IS NOT NULL AND f.head_of_family_war_injury_type != 'none' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_war_injury_type IS NOT NULL AND f.wife_war_injury_type != 'none' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND has_war_injury = TRUE AND i.is_deleted = FALSE), 0),
    
  pregnant_women_count = CASE WHEN f.wife_is_pregnant = TRUE THEN 1 ELSE 0 END
  
WHERE f.wife_name IS NOT NULL AND f.wife_name != ''
  AND (
    total_members_count IS DISTINCT FROM (
      1 +
      COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.is_deleted = FALSE), 0) +
      CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END
    )
    OR
    male_count IS DISTINCT FROM (
      CASE WHEN f.head_of_family_gender = 'male' THEN 1 ELSE 0 END +
      COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND gender = 'male' AND i.is_deleted = FALSE), 0)
    )
    OR
    female_count IS DISTINCT FROM (
      CASE WHEN f.head_of_family_gender = 'female' THEN 1 ELSE 0 END +
      CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END +
      COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND gender = 'female' AND i.is_deleted = FALSE), 0)
    )
  );
