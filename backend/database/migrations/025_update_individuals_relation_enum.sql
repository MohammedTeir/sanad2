-- Migration 025: Update individuals.relation CHECK constraint
-- Date: 2026-02-25
-- Description: Update relation enum values to remove duplicate family roles
--              (الأب، الأم، الزوج، الزوجة، الأخ، الأخت) as they are covered by 
--              head_of_family and wife fields in families table.
--              Add الخال and الخالة for extended family relations.

-- Step 1: Drop the existing constraint
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_relation_check;

-- Step 2: Add the new constraint with updated values
ALTER TABLE individuals ADD CONSTRAINT individuals_relation_check
    CHECK (relation IN (
        'الابن', 'البنت', 
        'الجد', 'الجدة', 
        'الحفيد', 'الحفيدة', 
        'العم', 'العمة', 
        'الخال', 'الخالة',
        'ابن الأخ', 'ابنة الأخ', 
        'ابن العم', 'أخرى'
    ));

-- Step 3: Update any existing records that have the old values
-- Map removed values to appropriate new values or 'أخرى'
UPDATE individuals 
SET relation = 'أخرى' 
WHERE relation IN ('الأب', 'الأم', 'الزوجة', 'الزوج', 'الأخ', 'الأخت')
  AND relation NOT IN (
        'الابن', 'البنت', 
        'الجد', 'الجدة', 
        'الحفيد', 'الحفيدة', 
        'العم', 'العمة', 
        'الخال', 'الخالة',
        'ابن الأخ', 'ابنة الأخ', 
        'ابن العم', 'أخرى'
    );

-- Note: The above UPDATE should not affect any records if the old constraint was enforced.
-- It's included as a safety measure for any data that might have been inserted
-- before the constraint was applied or via bypass methods.

-- Verification query (optional - run to check affected records)
-- SELECT relation, COUNT(*) 
-- FROM individuals 
-- WHERE relation IN ('الأب', 'الأم', 'الزوجة', 'الزوج', 'الأخ', 'الأخت')
-- GROUP BY relation;
