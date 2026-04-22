-- Diagnostic Query: Check family counts
-- Run this to see if stored counts match calculated counts

SELECT 
  f.id,
  f.head_of_family_name,
  f.head_of_family_gender,
  f.wife_name,
  f.total_members_count as stored_total,
  f.male_count as stored_male,
  f.female_count as stored_female,
  -- Calculate what it SHOULD be
  1 + 
  COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.is_deleted = FALSE), 0) +
  CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END as calculated_total,
  
  CASE WHEN f.head_of_family_gender = 'male' THEN 1 ELSE 0 END +
  COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND gender = 'male' AND i.is_deleted = FALSE), 0) as calculated_male,
  
  CASE WHEN f.head_of_family_gender = 'female' THEN 1 ELSE 0 END +
  CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END +
  COALESCE((SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND gender = 'female' AND i.is_deleted = FALSE), 0) as calculated_female,
  
  -- Show individuals count
  (SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.is_deleted = FALSE) as individual_count,
  (SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.gender = 'male' AND i.is_deleted = FALSE) as male_individuals,
  (SELECT COUNT(*) FROM individuals i WHERE i.family_id = f.id AND i.gender = 'female' AND i.is_deleted = FALSE) as female_individuals
  
FROM families f
WHERE f.wife_name IS NOT NULL AND f.wife_name != ''
ORDER BY f.head_of_family_name;
