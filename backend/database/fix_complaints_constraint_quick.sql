-- Quick Fix: Update complaints_status_check constraint
-- Run this directly on your database to fix the constraint issue

-- First, check what the current constraint looks like:
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'complaints_status_check';

-- Drop the existing constraint
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;

-- Recreate with correct Arabic values
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('جديد', 'قيد المراجعة', 'تم الرد', 'مغلق'));

-- Verify it was created correctly
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'complaints_status_check';
