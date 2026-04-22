# Family Counts Fix - Troubleshooting Guide

## Problem
Family counts (total_members_count, male_count, female_count) are not correctly including the wife.

## Solution Files

### 1. Run Diagnostic First
**File:** `006_diagnose_family_counts.sql`

This query shows:
- Stored counts (what's in the database)
- Calculated counts (what it should be)
- Individual family members count

**How to run:**
1. Open Supabase SQL Editor
2. Copy and paste the content of `006_diagnose_family_counts.sql`
3. Click **Run**
4. Check if `stored_total` matches `calculated_total`

### 2. Run Fix if Needed
**File:** `007_fix_family_counts.sql`

If the diagnostic shows mismatched counts, run this fix.

**How to run:**
1. Open Supabase SQL Editor
2. Copy and paste the content of `007_fix_family_counts.sql`
3. Click **Run**
4. This will update all families where counts don't match

### 3. Verify the Fix
Run the diagnostic query again (`006_diagnose_family_counts.sql`) to confirm counts now match.

## Expected Results

For a family with **head (male) + wife (female)** and **no individuals**:
- total_members_count = 2
- male_count = 1 (head)
- female_count = 1 (wife)

For a family with **head (male) + wife (female) + 1 son**:
- total_members_count = 3
- male_count = 2 (head + son)
- female_count = 1 (wife)

## Automatic Updates (Triggers)

The triggers in `005_add_family_counts_trigger.sql` will automatically keep counts updated when:
- A family is created/updated (wife added/removed)
- An individual is added/updated/deleted

**Note:** Triggers do NOT update `last_updated` to avoid infinite recursion.
