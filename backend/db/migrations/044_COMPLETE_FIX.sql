-- =====================================================
-- COMPLETE FIX: Distribution & Inventory System
-- Run this ENTIRE script in Supabase SQL Editor
-- Created: 2026-03-22
-- =====================================================

-- =====================================================
-- PART 1: Add updated_at column (fixes trigger error)
-- =====================================================
ALTER TABLE inventory_transactions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE inventory_transactions
SET updated_at = COALESCE(updated_at, created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_updated_at
ON inventory_transactions(updated_at);

-- =====================================================
-- PART 2: Drop old English constraints
-- =====================================================
ALTER TABLE inventory_transactions
DROP CONSTRAINT IF EXISTS inventory_transactions_related_to_check;

ALTER TABLE inventory_transactions
DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;

-- =====================================================
-- PART 3: Convert existing data from English to Arabic
-- =====================================================
UPDATE inventory_transactions SET related_to = 'شراء' WHERE related_to = 'purchase';
UPDATE inventory_transactions SET related_to = 'تبرع' WHERE related_to = 'donation';
UPDATE inventory_transactions SET related_to = 'توزيع' WHERE related_to = 'distribution';
UPDATE inventory_transactions SET related_to = 'تحويل' WHERE related_to = 'transfer';
UPDATE inventory_transactions SET related_to = 'تعديل' WHERE related_to = 'adjustment';
UPDATE inventory_transactions SET related_to = 'تلف' WHERE related_to = 'damage';

UPDATE inventory_transactions SET transaction_type = 'وارد' WHERE transaction_type = 'in';
UPDATE inventory_transactions SET transaction_type = 'صادر' WHERE transaction_type = 'out';

-- =====================================================
-- PART 4: Re-add constraints with Arabic values
-- =====================================================
ALTER TABLE inventory_transactions
ADD CONSTRAINT inventory_transactions_related_to_check
CHECK (related_to IN ('شراء', 'تبرع', 'توزيع', 'تحويل', 'تعديل', 'تلف'));

ALTER TABLE inventory_transactions
ADD CONSTRAINT inventory_transactions_transaction_type_check
CHECK (transaction_type IN ('وارد', 'صادر'));

-- =====================================================
-- PART 5: Verify constraints
-- =====================================================
SELECT
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'inventory_transactions'::regclass
AND conname IN (
    'inventory_transactions_related_to_check',
    'inventory_transactions_transaction_type_check'
);

-- =====================================================
-- PART 6: Test with actual insert
-- =====================================================
DO $$
BEGIN
    -- Test distribution (صادر - out)
    INSERT INTO inventory_transactions (
        item_id, transaction_type, quantity, related_to, notes, is_deleted
    )
    SELECT
        (SELECT id FROM inventory_items LIMIT 1),
        'صادر', 1, 'توزيع', 'Test distribution', true;

    -- Test donation (وارد - in)
    INSERT INTO inventory_transactions (
        item_id, transaction_type, quantity, related_to, notes, is_deleted
    )
    SELECT
        (SELECT id FROM inventory_items LIMIT 1),
        'وارد', 1, 'تبرع', 'Test donation', true;

    -- Clean up test records
    DELETE FROM inventory_transactions
    WHERE notes IN ('Test distribution', 'Test donation');

    RAISE NOTICE '✅ All tests passed!';
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Test failed: %', SQLERRM;
END $$;

-- =====================================================
-- PART 7: Final summary
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ COMPLETE FIX APPLIED SUCCESSFULLY!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Changes applied:';
    RAISE NOTICE '  1. Added updated_at column';
    RAISE NOTICE '  2. Converted data to Arabic';
    RAISE NOTICE '  3. Fixed constraints';
    RAISE NOTICE '';
    RAISE NOTICE 'Allowed values:';
    RAISE NOTICE '  related_to: شراء، تبرع، توزيع، تحويل، تعديل، تلف';
    RAISE NOTICE '  transaction_type: وارد، صادر';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '  1. Restart backend server';
    RAISE NOTICE '  2. Test distribution creation';
    RAISE NOTICE '  3. Verify Inventory Ledger shows Arabic';
    RAISE NOTICE '========================================';
END $$;
