-- Migration 041: Add Soft Delete to All Aid and Inventory Tables
-- This migration adds soft delete functionality to all aid-related and inventory tables
-- to preserve historical records and maintain audit trails

-- ============================================
-- 1. Add Soft Delete to distributions table
-- ============================================
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE distributions ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_distributions_deleted ON distributions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_distributions_deleted_at ON distributions(deleted_at);

-- ============================================
-- 2. Add Soft Delete to distribution_records table
-- ============================================
ALTER TABLE distribution_records ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE distribution_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE distribution_records ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_distribution_records_deleted ON distribution_records(is_deleted);
CREATE INDEX IF NOT EXISTS idx_distribution_records_deleted_at ON distribution_records(deleted_at);

-- ============================================
-- 3. Add Soft Delete to inventory table (legacy)
-- ============================================
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_deleted ON inventory(is_deleted);
CREATE INDEX IF NOT EXISTS idx_inventory_deleted_at ON inventory(deleted_at);

-- ============================================
-- 4. Add Soft Delete to inventory_transactions table
-- ============================================
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE inventory_transactions ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_deleted ON inventory_transactions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_deleted_at ON inventory_transactions(deleted_at);

-- ============================================
-- 5. Add Soft Delete to inventory_audits table
-- ============================================
ALTER TABLE inventory_audits ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE inventory_audits ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE inventory_audits ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inventory_audits_deleted ON inventory_audits(is_deleted);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_deleted_at ON inventory_audits(deleted_at);

-- ============================================
-- 6. Add Soft Delete to aid_distributions table
-- ============================================
ALTER TABLE aid_distributions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE aid_distributions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE aid_distributions ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_aid_distributions_deleted ON aid_distributions(is_deleted);
CREATE INDEX IF NOT EXISTS idx_aid_distributions_deleted_at ON aid_distributions(deleted_at);

-- ============================================
-- Documentation Comments
-- ============================================
COMMENT ON COLUMN distributions.is_deleted IS 'Soft delete flag - true when distribution campaign is deleted';
COMMENT ON COLUMN distributions.deleted_at IS 'Timestamp when the distribution campaign was soft deleted';
COMMENT ON COLUMN distributions.deleted_by IS 'User ID who deleted the distribution campaign';

COMMENT ON COLUMN distribution_records.is_deleted IS 'Soft delete flag - true when distribution record is deleted';
COMMENT ON COLUMN distribution_records.deleted_at IS 'Timestamp when the distribution record was soft deleted';
COMMENT ON COLUMN distribution_records.deleted_by IS 'User ID who deleted the distribution record';

COMMENT ON COLUMN inventory.is_deleted IS 'Soft delete flag - true when inventory item is deleted';
COMMENT ON COLUMN inventory.deleted_at IS 'Timestamp when the inventory item was soft deleted';
COMMENT ON COLUMN inventory.deleted_by IS 'User ID who deleted the inventory item';

COMMENT ON COLUMN inventory_transactions.is_deleted IS 'Soft delete flag - true when transaction is deleted';
COMMENT ON COLUMN inventory_transactions.deleted_at IS 'Timestamp when the transaction was soft deleted';
COMMENT ON COLUMN inventory_transactions.deleted_by IS 'User ID who deleted the transaction';

COMMENT ON COLUMN inventory_audits.is_deleted IS 'Soft delete flag - true when audit is deleted';
COMMENT ON COLUMN inventory_audits.deleted_at IS 'Timestamp when the audit was soft deleted';
COMMENT ON COLUMN inventory_audits.deleted_by IS 'User ID who deleted the audit';

COMMENT ON COLUMN aid_distributions.is_deleted IS 'Soft delete flag - true when aid distribution is deleted';
COMMENT ON COLUMN aid_distributions.deleted_at IS 'Timestamp when the aid distribution was soft deleted';
COMMENT ON COLUMN aid_distributions.deleted_by IS 'User ID who deleted the aid distribution';

-- ============================================
-- Rollback Instructions (if needed)
-- ============================================
-- To rollback this migration, run:
-- 
-- DROP INDEX IF EXISTS idx_aid_distributions_deleted_at;
-- DROP INDEX IF EXISTS idx_aid_distributions_deleted;
-- ALTER TABLE aid_distributions DROP COLUMN IF EXISTS deleted_by;
-- ALTER TABLE aid_distributions DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE aid_distributions DROP COLUMN IF EXISTS is_deleted;
--
-- DROP INDEX IF EXISTS idx_inventory_audits_deleted_at;
-- DROP INDEX IF EXISTS idx_inventory_audits_deleted;
-- ALTER TABLE inventory_audits DROP COLUMN IF EXISTS deleted_by;
-- ALTER TABLE inventory_audits DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE inventory_audits DROP COLUMN IF EXISTS is_deleted;
--
-- DROP INDEX IF EXISTS idx_inventory_transactions_deleted_at;
-- DROP INDEX IF EXISTS idx_inventory_transactions_deleted;
-- ALTER TABLE inventory_transactions DROP COLUMN IF EXISTS deleted_by;
-- ALTER TABLE inventory_transactions DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE inventory_transactions DROP COLUMN IF EXISTS is_deleted;
--
-- DROP INDEX IF EXISTS idx_inventory_deleted_at;
-- DROP INDEX IF EXISTS idx_inventory_deleted;
-- ALTER TABLE inventory DROP COLUMN IF EXISTS deleted_by;
-- ALTER TABLE inventory DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE inventory DROP COLUMN IF EXISTS is_deleted;
--
-- DROP INDEX IF EXISTS idx_distribution_records_deleted_at;
-- DROP INDEX IF EXISTS idx_distribution_records_deleted;
-- ALTER TABLE distribution_records DROP COLUMN IF EXISTS deleted_by;
-- ALTER TABLE distribution_records DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE distribution_records DROP COLUMN IF EXISTS is_deleted;
--
-- DROP INDEX IF EXISTS idx_distributions_deleted_at;
-- DROP INDEX IF EXISTS idx_distributions_deleted;
-- ALTER TABLE distributions DROP COLUMN IF EXISTS deleted_by;
-- ALTER TABLE distributions DROP COLUMN IF EXISTS deleted_at;
-- ALTER TABLE distributions DROP COLUMN IF EXISTS is_deleted;
