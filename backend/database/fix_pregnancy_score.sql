-- =====================================================
-- VULNERABILITY SCORE PREGNANCY CALCULATION FIX
-- =====================================================
-- This script diagnoses and fixes the inverted pregnancy score issue
-- Issue: Pregnancy shows 26 points when NOT pregnant, 0 points when pregnant
-- =====================================================

-- =====================================================
-- STEP 1: Verify trigger exists and is active
-- =====================================================
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    pg_get_triggerdef(oid) as trigger_definition
FROM pg_trigger 
WHERE tgname = 'auto_calculate_vulnerability_on_family_change';

-- =====================================================
-- STEP 2: Check current data for the affected family
-- =====================================================
SELECT 
    id,
    wife_is_pregnant,
    wife_pregnancy_month,
    vulnerability_score,
    vulnerability_priority,
    vulnerability_breakdown->>'pregnancy' as pregnancy_points,
    vulnerability_breakdown->>'weights' as weights,
    head_of_family_name,
    last_updated
FROM families 
WHERE id = '541d1b8a-3fc4-48e1-b41a-ba1e7ea0c7dc';

-- =====================================================
-- STEP 3: Check ALL families for pregnancy score inconsistency
-- This will show families where pregnancy points don't match pregnancy status
-- =====================================================
SELECT 
    id,
    head_of_family_name,
    wife_is_pregnant,
    wife_pregnancy_month,
    vulnerability_score,
    vulnerability_priority,
    vulnerability_breakdown->>'pregnancy' as pregnancy_points,
    CASE 
        WHEN wife_is_pregnant = TRUE AND (vulnerability_breakdown->>'pregnancy')::numeric = 0 
            THEN '❌ WRONG: Pregnant but 0 points'
        WHEN wife_is_pregnant = FALSE AND (vulnerability_breakdown->>'pregnancy')::numeric > 0 
            THEN '❌ WRONG: Not pregnant but has points'
        WHEN wife_is_pregnant = TRUE AND (vulnerability_breakdown->>'pregnancy')::numeric > 0 
            THEN '✅ CORRECT: Pregnant with points'
        WHEN wife_is_pregnant = FALSE AND (vulnerability_breakdown->>'pregnancy')::numeric = 0 
            THEN '✅ CORRECT: Not pregnant, 0 points'
        ELSE 'Unknown'
    END as status
FROM families
WHERE is_deleted = FALSE
ORDER BY 
    CASE 
        WHEN wife_is_pregnant = TRUE AND (vulnerability_breakdown->>'pregnancy')::numeric = 0 THEN 1
        WHEN wife_is_pregnant = FALSE AND (vulnerability_breakdown->>'pregnancy')::numeric > 0 THEN 2
        ELSE 3
    END,
    head_of_family_name;

-- =====================================================
-- STEP 4: Manually calculate what the pregnancy score SHOULD be
-- Using the current pregnancyWeight from global_config
-- =====================================================
SELECT 
    id,
    head_of_family_name,
    wife_is_pregnant,
    wife_pregnancy_month,
    (SELECT (config_value->>'pregnancyWeight')::numeric FROM global_config WHERE config_key = 'vulnerability_weights') as pregnancy_weight,
    CASE 
        WHEN wife_is_pregnant = TRUE THEN 
            COALESCE((SELECT (config_value->>'pregnancyWeight')::numeric FROM global_config WHERE config_key = 'vulnerability_weights'), 10) * 0.8
            + CASE 
                WHEN wife_pregnancy_month >= 7 THEN 
                    COALESCE((SELECT (config_value->>'pregnancyWeight')::numeric FROM global_config WHERE config_key = 'vulnerability_weights'), 10) * 0.5
                ELSE 0 
            END
        ELSE 0 
    END as expected_pregnancy_points,
    vulnerability_breakdown->>'pregnancy' as current_pregnancy_points
FROM families
WHERE is_deleted = FALSE
ORDER BY wife_is_pregnant DESC, wife_pregnancy_month DESC;

-- =====================================================
-- STEP 5: Check the actual function source code in the database
-- This shows what code is actually running
-- =====================================================
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc 
WHERE proname = 'calculate_vulnerability_score';

-- =====================================================
-- STEP 6: Force recalculate vulnerability score for the affected family
-- This triggers the database function manually
-- =====================================================
SELECT * FROM calculate_vulnerability_score('541d1b8a-3fc4-48e1-b41a-ba1e7ea0c7dc');

-- =====================================================
-- STEP 7: Compare CALCULATED score vs STORED score
-- This shows if the trigger is updating the table correctly
-- =====================================================
SELECT 
    f.id,
    f.wife_is_pregnant,
    f.wife_pregnancy_month,
    f.vulnerability_score as stored_score,
    calc.score as calculated_score,
    f.vulnerability_breakdown->>'pregnancy' as stored_pregnancy,
    calc.breakdown->>'pregnancy' as calculated_pregnancy,
    CASE 
        WHEN f.vulnerability_score = calc.score THEN '✅ MATCH'
        ELSE '❌ MISMATCH - Trigger not updating!'
    END as status
FROM families f,
     LATERAL calculate_vulnerability_score(f.id) calc
WHERE f.id = '541d1b8a-3fc4-48e1-b41a-ba1e7ea0c7dc';

-- =====================================================
-- STEP 8: Update the family record to trigger the auto-calculation trigger
-- (This is a no-op update that forces the trigger to fire)
-- =====================================================
UPDATE families 
SET head_of_family_name = head_of_family_name 
WHERE id = '541d1b8a-3fc4-48e1-b41a-ba1e7ea0c7dc';

-- Verify the update worked
SELECT 
    id,
    wife_is_pregnant,
    wife_pregnancy_month,
    vulnerability_score,
    vulnerability_priority,
    vulnerability_breakdown->>'pregnancy' as pregnancy_points
FROM families 
WHERE id = '541d1b8a-3fc4-48e1-b41a-ba1e7ea0c7dc';

-- =====================================================
-- STEP 9: If the issue persists, check the actual trigger function code
-- =====================================================
-- Run this to see the current trigger function implementation:
-- SELECT prosrc FROM pg_proc WHERE proname = 'auto_calculate_vulnerability_trigger';

-- =====================================================
-- STEP 10: Backfill all families if needed (run with caution!)
-- =====================================================
-- Uncomment to recalculate ALL vulnerability scores:
-- SELECT backfill_vulnerability_scores();

-- =====================================================
-- DIAGNOSIS RESULTS GUIDE:
-- =====================================================
-- If STEP 1 shows trigger is missing:
--   → Run migration 030_fix_vulnerability_score_calculation.sql
--
-- If STEP 5 shows WRONG function code (check for "NOT" or inverted logic):
--   → The function in database is outdated - re-run migration 030
--
-- If STEP 7 shows "MISMATCH - Trigger not updating!":
--   → The trigger is not firing on UPDATE - recreate the trigger
--
-- If all steps show correct data but frontend still shows wrong:
--   → Frontend caching issue - clear cache and refresh
-- =====================================================
