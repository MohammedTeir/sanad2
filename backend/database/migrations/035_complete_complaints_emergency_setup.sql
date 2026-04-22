-- Migration 035: Complete Complaints and Emergency Reports Setup
-- Date: 2026-03-13
-- Description: Complete setup for complaints and emergency reports features
-- This migration combines 033 and 034, and ensures all columns and policies exist

-- ============================================
-- PART 1: Add Soft Delete Columns (Migration 033)
-- ============================================

-- Add columns to complaints
DO $$ BEGIN
    ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add columns to emergency_reports
DO $$ BEGIN
    ALTER TABLE emergency_reports ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE emergency_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE emergency_reports ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_complaints_deleted ON complaints(deleted);
CREATE INDEX IF NOT EXISTS idx_complaints_deleted_at ON complaints(deleted_at);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_deleted ON emergency_reports(deleted);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_deleted_at ON emergency_reports(deleted_at);

-- ============================================
-- PART 2: Add Restoration Reason Column (Migration 034)
-- ============================================

-- Add to complaints
DO $$ BEGIN
    ALTER TABLE complaints ADD COLUMN IF NOT EXISTS restoration_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add to emergency_reports
DO $$ BEGIN
    ALTER TABLE emergency_reports ADD COLUMN IF NOT EXISTS restoration_reason TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ============================================
-- PART 3: Update RLS Policies
-- ============================================

-- Enable RLS
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Beneficiaries can view own complaints" ON complaints;
DROP POLICY IF EXISTS "Beneficiaries can insert own complaints" ON complaints;
DROP POLICY IF EXISTS "Beneficiaries can delete own complaints" ON complaints;
DROP POLICY IF EXISTS "Staff can view all complaints" ON complaints;
DROP POLICY IF EXISTS "Staff can update complaints" ON complaints;

DROP POLICY IF EXISTS "Beneficiaries can view own emergency reports" ON emergency_reports;
DROP POLICY IF EXISTS "Beneficiaries can insert own emergency reports" ON emergency_reports;
DROP POLICY IF EXISTS "Beneficiaries can delete own emergency reports" ON emergency_reports;
DROP POLICY IF EXISTS "Staff can view all emergency reports" ON emergency_reports;
DROP POLICY IF EXISTS "Staff can update emergency reports" ON emergency_reports;

-- Complaints Policies
CREATE POLICY "Beneficiaries can view own complaints"
    ON complaints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'BENEFICIARY'
            AND users.family_id = complaints.family_id
        )
        AND (deleted = FALSE OR deleted IS NULL)
    );

CREATE POLICY "Beneficiaries can insert own complaints"
    ON complaints FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'BENEFICIARY'
            AND users.family_id = complaints.family_id
        )
    );

CREATE POLICY "Beneficiaries can delete own complaints"
    ON complaints FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'BENEFICIARY'
            AND users.family_id = complaints.family_id
        )
    );

CREATE POLICY "Staff can view all complaints"
    ON complaints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
        AND (deleted = FALSE OR deleted IS NULL)
    );

CREATE POLICY "Staff can update complaints"
    ON complaints FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

-- Emergency Reports Policies
CREATE POLICY "Beneficiaries can view own emergency reports"
    ON emergency_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'BENEFICIARY'
            AND users.family_id = emergency_reports.family_id
        )
        AND (deleted = FALSE OR deleted IS NULL)
    );

CREATE POLICY "Beneficiaries can insert own emergency reports"
    ON emergency_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'BENEFICIARY'
            AND users.family_id = emergency_reports.family_id
        )
    );

CREATE POLICY "Beneficiaries can delete own emergency reports"
    ON emergency_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'BENEFICIARY'
            AND users.family_id = emergency_reports.family_id
        )
    );

CREATE POLICY "Staff can view all emergency reports"
    ON emergency_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
        AND (deleted = FALSE OR deleted IS NULL)
    );

CREATE POLICY "Staff can update emergency reports"
    ON emergency_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN complaints.deleted IS 'Soft delete flag - true when record is deleted';
COMMENT ON COLUMN complaints.deleted_at IS 'Timestamp when record was deleted';
COMMENT ON COLUMN complaints.deleted_by IS 'User ID who deleted the record';
COMMENT ON COLUMN complaints.restoration_reason IS 'Reason for restoring a soft-deleted complaint';

COMMENT ON COLUMN emergency_reports.deleted IS 'Soft delete flag - true when record is deleted';
COMMENT ON COLUMN emergency_reports.deleted_at IS 'Timestamp when record was deleted';
COMMENT ON COLUMN emergency_reports.deleted_by IS 'User ID who deleted the record';
COMMENT ON COLUMN emergency_reports.restoration_reason IS 'Reason for restoring a soft-deleted emergency report';
