-- Migration 034: Add restoration_reason Column for Complaints and Emergency Reports
-- Date: 2026-03-13
-- Description: Add restoration_reason column to track why deleted records were restored

-- ============================================
-- Add restoration_reason Column
-- ============================================

-- Add to complaints table
DO $$ BEGIN
    ALTER TABLE complaints ADD COLUMN IF NOT EXISTS restoration_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add to emergency_reports table
DO $$ BEGIN
    ALTER TABLE emergency_reports ADD COLUMN IF NOT EXISTS restoration_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN complaints.restoration_reason IS 'Reason for restoring a soft-deleted complaint';
COMMENT ON COLUMN emergency_reports.restoration_reason IS 'Reason for restoring a soft-deleted emergency report';
