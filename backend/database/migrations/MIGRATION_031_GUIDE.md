# Migration 031: Remove Vulnerability Database Triggers

**Date:** 2026-03-07  
**Purpose:** Move vulnerability calculation from database triggers to backend Node.js service

## Overview

This migration removes the database triggers and functions that automatically calculated vulnerability scores, and replaces them with a backend Node.js service. The vulnerability scores are now calculated by the backend API on family CREATE/UPDATE operations.

## What Changed

### Removed from Database

1. **Functions:**
   - `calculate_vulnerability_score(UUID)` - SQL function for score calculation
   - `auto_calculate_vulnerability_trigger()` - Trigger function for families
   - `recalculate_family_vulnerability_on_individual_change()` - Trigger function for individuals

2. **Triggers:**
   - `auto_calculate_vulnerability_on_family_change` - ON families INSERT/UPDATE
   - `auto_calculate_vulnerability_on_individual_change` - ON individuals INSERT/UPDATE/DELETE

3. **Indexes:**
   - `idx_individuals_family_vulnerability` (removed as no longer needed for trigger performance)

### What Stayed in Database

1. **Columns** (still needed to store results):
   - `vulnerability_score` NUMERIC(5, 2)
   - `vulnerability_priority` VARCHAR(30)
   - `vulnerability_breakdown` JSONB

2. **Indexes** (for query optimization):
   - `idx_families_vulnerability_priority`
   - `idx_families_vulnerability_score`
   - `idx_families_camp_vulnerability`

3. **Configuration:**
   - `global_config` table still stores vulnerability weights
   - Weights are fetched by backend service with caching

## New Backend Implementation

### Files Created

1. **`backend/services/vulnerabilityService.js`**
   - Main calculation logic in Node.js
   - 11 vulnerability criteria
   - Configurable weights from database
   - Caching for performance (5-minute TTL)

2. **`backend/VULNERABILITY_BACKEND_IMPLEMENTATION.md`**
   - Complete documentation
   - Architecture diagram
   - API reference
   - Testing instructions

### Files Modified

1. **`backend/routes/families.js`**
   - POST route: Calculates score on family creation
   - PUT route: Recalculates score when vulnerability fields change

2. **`backend/routes/public.js`**
   - POST route: Calculates score for public registrations

3. **`backend/database/database_schema_unified.sql`**
   - Removed vulnerability functions and triggers
   - Updated comments to reflect new architecture

4. **`backend/database/database_schema_unified_with_if_not_exists.sql`**
   - Removed vulnerability functions and triggers
   - Updated comments to reflect new architecture

## Migration Steps

### 1. Deploy Backend Code

```bash
# Ensure new files are in place
ls -la backend/services/vulnerabilityService.js
ls -la backend/VULNERABILITY_BACKEND_IMPLEMENTATION.md
```

### 2. Run Database Migration

```bash
# Connect to your database
psql -U postgres -d camp_management

# Run the migration
\i backend/database/migrations/031_remove_vulnerability_triggers.sql
```

Or manually:
```sql
-- Drop triggers
DROP TRIGGER IF EXISTS auto_calculate_vulnerability_on_family_change ON families;
DROP TRIGGER IF EXISTS auto_calculate_vulnerability_on_individual_change ON individuals;

-- Drop trigger functions
DROP FUNCTION IF EXISTS auto_calculate_vulnerability_trigger();
DROP FUNCTION IF EXISTS recalculate_family_vulnerability_on_individual_change();
```

### 3. Verify Migration

```sql
-- Check that triggers are removed
SELECT tgname, tgrelid::regclass 
FROM pg_trigger 
WHERE tgname LIKE '%vulnerability%';
-- Should return 0 rows

-- Check that columns still exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'families' 
  AND column_name LIKE 'vulnerability%';
-- Should show: vulnerability_score, vulnerability_priority, vulnerability_breakdown
```

### 4. Test Backend Calculation

```bash
# Start the backend server
cd backend
node server.js

# Test family creation (should calculate vulnerability score)
curl -X POST http://localhost:3001/api/families \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "head_first_name": "أحمد",
    "head_father_name": "محمد",
    "head_family_name": "الخالد",
    "head_of_family_national_id": "123456789",
    "child_count": 5,
    "senior_count": 1,
    "head_of_family_disability_type": "حركية",
    "head_of_family_monthly_income": 0,
    "current_housing_type": "خيمة",
    "wife_is_pregnant": true
  }'

# Response should include vulnerability_score, vulnerability_priority, vulnerability_breakdown
```

## Backfill Existing Records

If you need to recalculate all existing vulnerability scores with the new backend service:

### Option 1: Using Database Function (if still available)

```sql
-- Only works if you kept the calculate_vulnerability_score() function
SELECT backfill_vulnerability_scores();
```

### Option 2: Using Backend Script

Create `scripts/backfill-vulnerability-scores.js`:

```javascript
const { supabase } = require('../backend/db/connection');
const { calculateVulnerabilityScore } = require('../backend/services/vulnerabilityService');

async function backfill() {
  console.log('Starting vulnerability score backfill...');
  
  const { data: families, error } = await supabase
    .from('families')
    .select('*')
    .is('is_deleted', false);
  
  if (error) {
    console.error('Error fetching families:', error);
    return;
  }
  
  console.log(`Found ${families.length} families to process`);
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const family of families) {
    try {
      const result = await calculateVulnerabilityScore(family);
      
      await supabase
        .from('families')
        .update({
          vulnerability_score: result.score,
          vulnerability_priority: result.priorityLevel,
          vulnerability_breakdown: result.breakdown,
          last_updated: new Date().toISOString()
        })
        .eq('id', family.id);
      
      successCount++;
      console.log(`✓ Updated: ${family.head_of_family_name} (Score: ${result.score})`);
    } catch (err) {
      errorCount++;
      console.error(`✗ Error updating ${family.id}:`, err.message);
    }
  }
  
  console.log(`\nBackfill complete!`);
  console.log(`Success: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
}

backfill().catch(console.error);
```

Run it:
```bash
node scripts/backfill-vulnerability-scores.js
```

## Rollback Plan

If you need to rollback to database triggers:

1. **Revert schema changes:**
   ```bash
   psql -U postgres -d camp_management -f backend/database/migrations/add_vulnerability_calculation_trigger.sql
   ```

2. **Revert code changes:**
   ```bash
   git checkout HEAD -- backend/routes/families.js
   git checkout HEAD -- backend/routes/public.js
   ```

3. **Remove new files:**
   ```bash
   rm backend/services/vulnerabilityService.js
   rm backend/VULNERABILITY_BACKEND_IMPLEMENTATION.md
   ```

## Benefits

| Aspect | Before (Database Triggers) | After (Backend Service) |
|--------|---------------------------|------------------------|
| **Location** | PostgreSQL functions | Node.js/Express |
| **Testing** | Hard to test (SQL) | Easy unit testing (JavaScript) |
| **Debugging** | SQL debugging | Standard JS debugging |
| **Version Control** | SQL migrations | Git-friendly JS files |
| **Portability** | PostgreSQL-specific | Database-agnostic |
| **Maintainability** | SQL knowledge required | JavaScript (common skill) |
| **Performance** | Very fast (DB level) | Fast (with caching) |
| **Flexibility** | Limited | High (can call APIs, etc.) |

## Monitoring

After deployment, monitor:

1. **Backend logs** for calculation errors:
   ```bash
   tail -f backend/logs/app.log | grep -i vulnerability
   ```

2. **Database for null scores** (should be 0):
   ```sql
   SELECT COUNT(*) 
   FROM families 
   WHERE vulnerability_score IS NULL 
     AND is_deleted = FALSE;
   ```

3. **Performance** (response times for family creation/update):
   ```bash
   # Check backend response times
   curl -w "@curl-format.txt" -o /dev/null -s [API_ENDPOINT]
   ```

## Support

For issues or questions:
- Check backend logs
- Review `backend/VULNERABILITY_BACKEND_IMPLEMENTATION.md`
- Verify weights in `global_config` table

## Related Files

- Migration: `backend/database/migrations/031_remove_vulnerability_triggers.sql`
- Service: `backend/services/vulnerabilityService.js`
- Documentation: `backend/VULNERABILITY_BACKEND_IMPLEMENTATION.md`
- Schema: `backend/database/database_schema_unified.sql`
- Schema: `backend/database/database_schema_unified_with_if_not_exists.sql`
