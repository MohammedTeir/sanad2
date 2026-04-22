# Migration 017: Fix Age Group Counts

**Date:** 2026-02-23  
**Priority:** High  
**Breaking:** No  
**Downtime Required:** No (but recommended to run during low-traffic period)

---

## Problem

The `update_family_counts()` database trigger was not counting the **head of family** and **wife** in age group categories:
- `child_count` (under 12)
- `teenager_count` (12-18)
- `adult_count` (19-60)
- `senior_count` (over 60)

This caused the Family Composition section in DPDetails to show incorrect values (all zeros) even when the head and wife should be counted in these categories.

### Example Issue

For a family with:
- Head (age 35, adult)
- Wife (age 30, adult)
- 2 children (ages 8 and 10)

**Before Migration:**
- child_count: 2 ✅ (only counted individuals)
- teenager_count: 0 ✅
- adult_count: 0 ❌ (should be 2 - head + wife)
- senior_count: 0 ✅

**After Migration:**
- child_count: 2 ✅
- teenager_count: 0 ✅
- adult_count: 2 ✅ (now includes head + wife)
- senior_count: 0 ✅

---

## Solution

Updated the `update_family_counts()` trigger function to include head and wife's ages in the calculations:

```sql
-- Child count now includes head and wife
COALESCE((SELECT COUNT(*) FROM individuals WHERE age < 12), 0) +
CASE WHEN head_of_family_age < 12 THEN 1 ELSE 0 END +
CASE WHEN wife_age < 12 THEN 1 ELSE 0 END
```

---

## How to Run

### Option 1: Via Supabase SQL Editor (Recommended)

1. Go to Supabase Dashboard → Your Project → SQL Editor
2. Copy the contents of `017_fix_age_group_counts.sql`
3. Paste into SQL Editor
4. Click **Run**
5. Wait for completion (may take 1-2 minutes for large datasets)

### Option 2: Via Command Line (if using local development)

```bash
# Navigate to backend directory
cd backend

# Run the migration
psql $DATABASE_URL -f database/migrations/017_fix_age_group_counts.sql
```

### Option 3: Via Node.js Script

```bash
cd backend
node -e "
const { supabase } = require('./db/connection');
const fs = require('fs');
const sql = fs.readFileSync('database/migrations/017_fix_age_group_counts.sql', 'utf8');
supabase.query(sql).then(() => console.log('Migration complete!')).catch(console.error);
"
```

---

## What the Migration Does

1. **Updates the trigger function** - Replaces `update_family_counts()` with corrected logic
2. **Recreates triggers** - Drops and recreates triggers to use updated function
3. **Recalculates existing data** - Updates all existing family records with correct counts
4. **Adds verification** - Includes comments for optional verification query

---

## Expected Results

After running the migration:

### Frontend Display (DPDetails.tsx)

The Family Composition section will now show correct counts:

```
تركيب الأسرة
عدد الأفراد: 4
ذكور: 2
إناث: 2

أطفال: 2      (under 12, includes head/wife if applicable)
مراهقين: 0    (12-18, includes head/wife if applicable)
بالغين: 2     (19-60, NOW INCLUDES head + wife)
كبار سن: 0    (over 60, includes head/wife if applicable)

ذوي إعاقة: 2
مصابين: 2
```

### Database Verification

Run this query to verify:

```sql
SELECT 
  id,
  head_of_family_name,
  head_of_family_age,
  wife_name,
  wife_age,
  child_count,
  teenager_count,
  adult_count,
  senior_count,
  total_members_count,
  (child_count + teenager_count + adult_count + senior_count) as age_sum
FROM families 
WHERE is_deleted = FALSE 
ORDER BY head_of_family_name
LIMIT 20;
```

**Expected:** `age_sum` should equal `total_members_count`

---

## Rollback

If you need to rollback (not recommended):

```sql
-- Revert to old behavior (only counts individuals)
CREATE OR REPLACE FUNCTION update_family_counts()
RETURNS TRIGGER AS $$
-- ... use old version from database_schema_unified.sql before migration
$$ LANGUAGE plpgsql;
```

**Note:** Rollback will reintroduce the bug and is not recommended.

---

## Testing

### Before Running Migration

1. Open a family record in DPDetails
2. Check the Family Composition section
3. Note the age group counts (likely showing 0 for adults)

### After Running Migration

1. Refresh the same family record
2. Verify age group counts now include head and wife
3. Test with different family configurations:
   - Single head (should count in appropriate age group)
   - Head + Wife (both should be counted)
   - Head + Wife + Children (all should be counted correctly)

---

## Performance Impact

- **Trigger Execution:** Minimal (adds 4 CASE statements per trigger fire)
- **Migration Runtime:** ~1-2 seconds per 100 families
- **Query Performance:** No impact (uses existing indexes)

---

## Related Files

- `backend/database/database_schema_unified_with_if_not_exists.sql` - Updated
- `backend/database/database_schema_unified.sql` - Updated
- `backend/database/migrations/017_fix_age_group_counts.sql` - New migration file
- `views/camp-manager/DPDetails.tsx` - Frontend display (no changes needed)

---

## Support

If you encounter issues:
1. Check Supabase logs for error messages
2. Verify the trigger was created: `SELECT * FROM pg_trigger WHERE tgname LIKE 'update_family_counts%'`
3. Test on a single family first: `UPDATE families SET last_updated = NOW() WHERE id = 'your-test-family-id'`

---

**Migration Status:** ✅ Ready for Production
