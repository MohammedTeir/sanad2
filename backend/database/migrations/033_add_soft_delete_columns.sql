-- Migration 033: Add Soft Delete Columns for Complaints and Emergency Reports
-- This migration adds soft delete functionality to allow camp managers to delete records
-- while maintaining an audit trail
-- Note: Update Requests soft delete removed as the table was never implemented

-- ============================================
-- Add Soft Delete Columns to Complaints
-- ============================================
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for filtering deleted records
CREATE INDEX IF NOT EXISTS idx_complaints_deleted ON complaints(deleted);
CREATE INDEX IF NOT EXISTS idx_complaints_deleted_at ON complaints(deleted_at);

-- ============================================
-- Add Soft Delete Columns to Emergency Reports
-- ============================================
ALTER TABLE emergency_reports ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE emergency_reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE emergency_reports ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for filtering deleted records
CREATE INDEX IF NOT EXISTS idx_emergency_reports_deleted ON emergency_reports(deleted);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_deleted_at ON emergency_reports(deleted_at);

-- ============================================
-- Update RLS Policies to Filter Deleted Records
-- ============================================

-- Update complaints policies to exclude deleted records for normal viewing
DROP POLICY IF EXISTS "Beneficiaries can view own complaints" ON complaints;
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

DROP POLICY IF EXISTS "Beneficiaries can insert own complaints" ON complaints;
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

DROP POLICY IF EXISTS "Beneficiaries can delete own complaints" ON complaints;
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

-- Update emergency reports policies to exclude deleted records
DROP POLICY IF EXISTS "Beneficiaries can view own emergency reports" ON emergency_reports;
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

DROP POLICY IF EXISTS "Beneficiaries can insert own emergency reports" ON emergency_reports;
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

DROP POLICY IF EXISTS "Beneficiaries can delete own emergency reports" ON emergency_reports;
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

-- Staff policies for viewing (CAMP_MANAGER, FIELD_OFFICER)
DROP POLICY IF EXISTS "Staff can view all complaints" ON complaints;
CREATE POLICY "Staff can view all complaints"
    ON complaints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('CAMP_MANAGER', 'FIELD_OFFICER', 'SYSTEM_ADMIN')
            AND (users.camp_id = complaints.family_id OR users.role = 'SYSTEM_ADMIN')
        )
        AND (deleted = FALSE OR deleted IS NULL)
    );

DROP POLICY IF EXISTS "Staff can view all emergency reports" ON emergency_reports;
CREATE POLICY "Staff can view all emergency reports"
    ON emergency_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('CAMP_MANAGER', 'FIELD_OFFICER', 'SYSTEM_ADMIN')
            AND (users.camp_id = emergency_reports.family_id OR users.role = 'SYSTEM_ADMIN')
        )
        AND (deleted = FALSE OR deleted IS NULL)
    );

-- ============================================
-- Comments
-- ============================================
COMMENT ON COLUMN complaints.deleted IS 'Soft delete flag - true when record is deleted';
COMMENT ON COLUMN complaints.deleted_at IS 'Timestamp when record was deleted';
COMMENT ON COLUMN complaints.deleted_by IS 'User ID who deleted the record';

COMMENT ON COLUMN emergency_reports.deleted IS 'Soft delete flag - true when record is deleted';
COMMENT ON COLUMN emergency_reports.deleted_at IS 'Timestamp when record was deleted';
COMMENT ON COLUMN emergency_reports.deleted_by IS 'User ID who deleted the record';
