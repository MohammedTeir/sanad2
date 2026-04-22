-- Migration 037: Fix Complaints Status Check Constraint
-- Date: 2026-03-15
-- Description: Fix the complaints_status_check constraint to ensure it uses correct Arabic values
-- Issue: Constraint was rejecting valid Arabic status values

-- ============================================
-- Drop existing constraint
-- ============================================
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;

-- ============================================
-- Add corrected constraint with proper Arabic values
-- ============================================
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check 
CHECK (status IN ('جديد', 'قيد المراجعة', 'تم الرد', 'مغلق'));

-- ============================================
-- Verify the constraint
-- ============================================
-- Run this to verify:
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conname = 'complaints_status_check';

-- ============================================
-- Also fix emergency_reports status constraint for consistency
-- ============================================
ALTER TABLE emergency_reports DROP CONSTRAINT IF EXISTS emergency_reports_status_check;

ALTER TABLE emergency_reports ADD CONSTRAINT emergency_reports_status_check 
CHECK (status IN ('جديد', 'قيد المعالجة', 'تم التحويل', 'تم الحل', 'مرفوض'));

-- ============================================
-- Add comments for documentation
-- ============================================
COMMENT ON CONSTRAINT complaints_status_check ON complaints IS 'Valid complaint status values: جديد (New), قيد المراجعة (Under Review), تم الرد (Responded), مغلق (Closed)';
COMMENT ON CONSTRAINT emergency_reports_status_check ON emergency_reports IS 'Valid emergency report status values: جديد (New), قيد المعالجة (In Progress), تم التحويل (Transferred), تم الحل (Resolved), مرفوض (Rejected)';
