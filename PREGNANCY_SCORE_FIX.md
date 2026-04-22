# Pregnancy Vulnerability Score Fix

## Problem Summary

The vulnerability score calculation is showing **INVERTED** pregnancy values:

| wife_is_pregnant | wife_pregnancy_month | Expected Pregnancy Points | Actual Pregnancy Points |
|-----------------|---------------------|--------------------------|------------------------|
| `false` | 0 | **0** | **26** ❌ |
| `true` | 9 | **26** (16 base + 10 for month 7+) | **0** ❌ |

## Root Cause Analysis

Based on code review, the database trigger code in migration 030 is **CORRECT**:

```sql
IF p_family.wife_is_pregnant = TRUE THEN
    v_pregnancy_points := v_pregnancy_weight * 0.8;  -- 16 points (20 * 0.8)
    IF p_family.wife_pregnancy_month >= 7 THEN
        v_pregnancy_points := v_pregnancy_points + (v_pregnancy_weight * 0.5);  -- +10 points
    END IF;
END IF;
```

**However**, the data being returned shows the opposite values. This suggests one of these issues:

1. **Database trigger not firing** - The trigger might not be attached or enabled
2. **Stale cached data** - Frontend cache serving old data
3. **Migration not applied** - The fix migration 030 wasn't run in production

## Diagnosis Steps

### Step 1: Run the Diagnostic SQL Script

Execute the diagnostic script to check trigger status and data:

```bash
# Connect to your database
psql -h <host> -U postgres -d <database_name>

# Run the diagnostic script
\i backend/database/fix_pregnancy_score.sql
```

Or run individual queries:

```sql
-- Check if trigger exists
SELECT tgname, tgenabled 
FROM pg_trigger 
WHERE tgname = 'auto_calculate_vulnerability_on_family_change';

-- Check the affected family
SELECT 
    id,
    wife_is_pregnant,
    wife_pregnancy_month,
    vulnerability_score,
    vulnerability_breakdown->>'pregnancy' as pregnancy_points
FROM families 
WHERE id = '541d1b8a-3fc4-48e1-b41a-ba1e7ea0c7dc';

-- Check ALL families for inconsistencies
SELECT 
    id,
    head_of_family_name,
    wife_is_pregnant,
    wife_pregnancy_month,
    vulnerability_breakdown->>'pregnancy' as pregnancy_points,
    CASE 
        WHEN wife_is_pregnant = TRUE AND (vulnerability_breakdown->>'pregnancy')::numeric = 0 
            THEN '❌ WRONG: Pregnant but 0 points'
        WHEN wife_is_pregnant = FALSE AND (vulnerability_breakdown->>'pregnancy')::numeric > 0 
            THEN '❌ WRONG: Not pregnant but has points'
        ELSE '✅ CORRECT'
    END as status
FROM families
WHERE is_deleted = FALSE
ORDER BY status;
```

### Step 2: Interpret Results

**If trigger is missing:**
```
trigger_name | enabled
-------------|--------
(0 rows)
```
→ **Solution:** Run migration 030

**If trigger exists but data is wrong:**
```
trigger_name                        | enabled
------------------------------------|--------
auto_calculate_vulnerability_on_... | true
```
→ **Solution:** Force recalculation (see Step 3)

### Step 3: Force Recalculation

```sql
-- Method 1: Use the database function directly
SELECT * FROM calculate_vulnerability_score('541d1b8a-3fc4-48e1-b41a-ba1e7ea0c7dc');

-- Then update to trigger the auto-calculation
UPDATE families 
SET head_of_family_name = head_of_family_name 
WHERE id = '541d1b8a-3fc4-48e1-b41a-ba1e7ea0c7dc';

-- Method 2: Backfill all families (use with caution!)
SELECT backfill_vulnerability_scores();
```

### Step 3.5: Clear Frontend Cache

If the database shows correct data but frontend still shows wrong:

```javascript
// In browser console (for web) or React Native debugger:
localStorage.clear();
// OR reload the app with cache bypass
```

The app uses a 5-minute in-memory cache. Wait 5 minutes or restart the app.

### Step 4: Verify Fix

After running the fix, verify:

```sql
SELECT 
    id,
    wife_is_pregnant,
    wife_pregnancy_month,
    vulnerability_score,
    vulnerability_breakdown->>'pregnancy' as pregnancy_points,
    vulnerability_breakdown->>'income' as income_points,
    vulnerability_breakdown->>'disabilities' as disability_points
FROM families 
WHERE id = '541d1b8a-3fc4-48e1-b41a-ba1e7ea0c7dc';
```

**Expected result for pregnant wife (month 9):**
- `pregnancy_points`: ~26 (with pregnancyWeight=20)
- `vulnerability_score`: Should be HIGHER than before

**Expected result for non-pregnant wife:**
- `pregnancy_points`: 0
- `vulnerability_score`: Should be LOWER than before

## Solutions

### Solution 1: Re-apply Migration 030

If the migration wasn't applied or was corrupted:

```bash
psql -h <host> -U postgres -d <database_name> -f backend/database/migrations/030_fix_vulnerability_score_calculation.sql
```

### Solution 2: Manual Trigger Re-creation

```sql
-- Drop existing trigger
DROP TRIGGER IF EXISTS auto_calculate_vulnerability_on_family_change ON families;

-- Recreate trigger
CREATE TRIGGER auto_calculate_vulnerability_on_family_change
    AFTER INSERT OR UPDATE ON families
    FOR EACH ROW
    EXECUTE FUNCTION auto_calculate_vulnerability_trigger();

-- Backfill existing data
SELECT backfill_vulnerability_scores();
```

### Solution 3: Frontend Cache Issue

If backend data is correct but frontend shows wrong:

1. **Clear app cache**: Restart the React Native app
2. **Check network requests**: Verify `/families/:id` returns correct data
3. **Check console logs**: Look for `[getDPById]` logs showing the data

## Prevention

### Add Database Test

Add a test to verify pregnancy calculation:

```sql
-- Test pregnancy calculation
DO $$
DECLARE
    v_result RECORD;
    v_test_family_id UUID;
BEGIN
    -- Create test family
    INSERT INTO families (head_of_family_name, camp_id, wife_is_pregnant, wife_pregnancy_month)
    VALUES ('Test Family', '0453e97c-d648-4cb9-8553-8a4d2f7bec61', TRUE, 9)
    RETURNING id INTO v_test_family_id;
    
    -- Check calculated score
    SELECT * INTO v_result
    FROM calculate_vulnerability_score(v_test_family_id);
    
    -- Verify pregnancy points are > 0
    IF (v_result.breakdown->>'pregnancy')::numeric <= 0 THEN
        RAISE EXCEPTION 'Pregnancy calculation failed: expected > 0, got %', v_result.breakdown->>'pregnancy';
    END IF;
    
    -- Clean up
    DELETE FROM families WHERE id = v_test_family_id;
    
    RAISE NOTICE 'Pregnancy calculation test PASSED';
END $$;
```

### Add Monitoring Query

Run this periodically to catch inconsistencies:

```sql
SELECT COUNT(*) as affected_families
FROM families
WHERE is_deleted = FALSE
  AND (
    (wife_is_pregnant = TRUE AND (vulnerability_breakdown->>'pregnancy')::numeric = 0)
    OR 
    (wife_is_pregnant = FALSE AND (vulnerability_breakdown->>'pregnancy')::numeric > 0)
  );
```

## Related Files

- **Migration:** `backend/database/migrations/030_fix_vulnerability_score_calculation.sql`
- **Diagnostic Script:** `backend/database/fix_pregnancy_score.sql`
- **Trigger Function:** `backend/database/database_schema_unified.sql` (line ~1076)
- **Frontend Service:** `services/realDataServiceBackend.ts` (getDPById method)

## Expected Behavior

### Pregnancy Weight Configuration

Default `pregnancyWeight` from `global_config`: **20** (can be configured)

### Pregnancy Points Calculation

| Condition | Formula | Points (weight=20) |
|-----------|---------|-------------------|
| Not pregnant | 0 | 0 |
| Pregnant (any month) | weight × 0.8 | 16 |
| Pregnant (month 7+) | (weight × 0.8) + (weight × 0.5) | 26 |

### Priority Levels

| Score Range | Priority (Arabic) | Priority (English) |
|-------------|------------------|-------------------|
| ≥ 80 | عالي جداً | Very High |
| 60-79 | عالي | High |
| 40-59 | متوسط | Medium |
| < 40 | منخفض | Low |

## Checklist

- [ ] Run diagnostic SQL script
- [ ] Identify root cause (trigger/cache/migration)
- [ ] Apply appropriate fix
- [ ] Verify pregnancy points are correct
- [ ] Clear frontend cache if needed
- [ ] Test with pregnant and non-pregnant families
- [ ] Add monitoring query to regular checks

## Contact

If issue persists after following these steps, check:
1. Database logs for trigger errors
2. Backend API logs for calculation errors
3. Frontend network tab for API response data
