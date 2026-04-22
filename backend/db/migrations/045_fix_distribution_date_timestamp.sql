-- Migration: Fix distribution_date to store full timestamp (date + time)
-- Issue: distribution_date column is DATE type, which only stores date without time
-- Solution: Change column type to TIMESTAMP WITH TIME ZONE

-- Step 1: Alter aid_distributions table (main distribution table)
ALTER TABLE aid_distributions 
  ALTER COLUMN distribution_date TYPE TIMESTAMP WITH TIME ZONE 
  USING distribution_date::TIMESTAMP WITH TIME ZONE;

-- Step 2: Alter distributions table (legacy table) - if needed
ALTER TABLE distributions 
  ALTER COLUMN distribution_date TYPE TIMESTAMP WITH TIME ZONE 
  USING distribution_date::TIMESTAMP WITH TIME ZONE;

-- Step 3: Update the trigger function to use the full timestamp
-- (Already handled in the updated trigger - no additional changes needed)

-- Note: This change ensures that:
-- 1. Distribution timestamps include both date AND time
-- 2. Inventory transaction ledger shows correct timestamps
-- 3. Distribution history displays accurate date+time information

-- To apply this migration:
-- psql -U postgres -d your_database -f backend/db/migrations/045_fix_distribution_date_timestamp.sql
