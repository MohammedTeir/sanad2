-- Migration 034: Drop update_requests Table
-- Date: 2026-03-13
-- Description: Remove the update_requests table as it was never implemented in the application
-- Note: This migration is safe to run even if the table doesn't exist

-- ============================================
-- Drop everything in a single block with exception handling
-- ============================================
DO $$ BEGIN
    -- Drop Indexes
    DROP INDEX IF EXISTS idx_update_requests_family_id;
    DROP INDEX IF EXISTS idx_update_requests_status;
    DROP INDEX IF EXISTS idx_update_requests_created_at;
    DROP INDEX IF EXISTS idx_update_requests_deleted;
    DROP INDEX IF EXISTS idx_update_requests_deleted_at;

    -- Drop RLS Policies
    DROP POLICY IF EXISTS "Beneficiaries can view own update requests" ON update_requests;
    DROP POLICY IF EXISTS "Beneficiaries can insert own update requests" ON update_requests;
    DROP POLICY IF EXISTS "Beneficiaries can delete own update requests" ON update_requests;
    DROP POLICY IF EXISTS "Staff can view all update requests" ON update_requests;
    DROP POLICY IF EXISTS "Staff can update update requests" ON update_requests;

    -- Disable RLS
    ALTER TABLE update_requests DISABLE ROW LEVEL SECURITY;

    -- Drop Trigger
    DROP TRIGGER IF EXISTS update_update_requests_updated_at ON update_requests;

    -- Drop Table
    DROP TABLE IF EXISTS update_requests;

    -- Remove Comments
    COMMENT ON TABLE update_requests IS NULL;
    COMMENT ON COLUMN update_requests.field_name IS NULL;
EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, nothing to do
    NULL;
END $$;
