-- Cleanup: Delete duplicate individuals (head of family)
-- Run this ONCE to clean up existing duplicates
-- The head of family should NOT be in the individuals table

DELETE FROM individuals i
USING families f
WHERE i.family_id = f.id
  AND (
    i.name = f.head_of_family_name
    OR i.national_id = f.head_of_family_national_id
  )
  AND i.relation IN ('father', 'head', 'self', 'رب أسرة');

-- Verify the cleanup
SELECT 
  f.head_of_family_name,
  f.wife_name,
  f.total_members_count,
  f.male_count,
  f.female_count,
  (SELECT COUNT(*) FROM individuals ind WHERE ind.family_id = f.id AND ind.is_deleted = FALSE) as individual_count
FROM families f
WHERE f.wife_name IS NOT NULL AND f.wife_name != ''
ORDER BY f.head_of_family_name;
