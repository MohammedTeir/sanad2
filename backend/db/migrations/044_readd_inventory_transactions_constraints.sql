-- Migration: Fix inventory_transactions check constraints - Convert English to Arabic
-- Problem: Constraints were created with English values instead of Arabic
-- This causes "القيمة غير صالحة" errors when creating inventory transactions
-- Created: 2026-03-22

-- =====================================================
-- STEP 1: Drop existing constraints with English values
-- =====================================================
ALTER TABLE inventory_transactions 
DROP CONSTRAINT IF EXISTS inventory_transactions_related_to_check;

ALTER TABLE inventory_transactions 
DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;

-- =====================================================
-- STEP 2: Update existing data from English to Arabic
-- =====================================================
-- Convert related_to values
UPDATE inventory_transactions SET related_to = 'شراء' WHERE related_to = 'purchase';
UPDATE inventory_transactions SET related_to = 'تبرع' WHERE related_to = 'donation';
UPDATE inventory_transactions SET related_to = 'توزيع' WHERE related_to = 'distribution';
UPDATE inventory_transactions SET related_to = 'تحويل' WHERE related_to = 'transfer';
UPDATE inventory_transactions SET related_to = 'تعديل' WHERE related_to = 'adjustment';
UPDATE inventory_transactions SET related_to = 'تلف' WHERE related_to = 'damage';

-- Convert transaction_type values
UPDATE inventory_transactions SET transaction_type = 'وارد' WHERE transaction_type = 'in';
UPDATE inventory_transactions SET transaction_type = 'صادر' WHERE transaction_type = 'out';

-- =====================================================
-- STEP 3: Re-add constraints with correct Arabic values
-- =====================================================
-- related_to constraint - allows all valid relation types (in Arabic)
ALTER TABLE inventory_transactions 
ADD CONSTRAINT inventory_transactions_related_to_check 
CHECK (
    related_to IN (
        'شراء',      -- purchase
        'تبرع',      -- donation
        'توزيع',     -- distribution
        'تحويل',     -- transfer
        'تعديل',     -- adjustment
        'تلف'        -- damage
    )
);

-- transaction_type constraint - allows in/out (in Arabic)
ALTER TABLE inventory_transactions 
ADD CONSTRAINT inventory_transactions_transaction_type_check 
CHECK (
    transaction_type IN (
        'وارد',      -- in
        'صادر'       -- out
    )
);

-- =====================================================
-- STEP 4: Verify constraints were added correctly
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

-- Expected: 2 rows with Arabic values in constraint definitions

-- =====================================================
-- STEP 5: Verify data was converted
-- =====================================================
SELECT 
    COUNT(*) as total_transactions,
    COUNT(DISTINCT related_to) as unique_related_to_values,
    COUNT(DISTINCT transaction_type) as unique_transaction_type_values
FROM inventory_transactions;

-- Show sample of converted values
SELECT 
    related_to, 
    transaction_type, 
    COUNT(*) as count
FROM inventory_transactions
GROUP BY related_to, transaction_type
ORDER BY count DESC;

-- =====================================================
-- STEP 6: Test the constraints
-- =====================================================
-- This test should SUCCEED (valid Arabic values)
DO $$
BEGIN
    -- Test valid related_to value (توزيع - distribution)
    INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity,
        related_to,
        notes,
        is_deleted
    )
    SELECT 
        (SELECT id FROM inventory_items LIMIT 1),
        'صادر',
        0.01,
        'توزيع',
        'Constraint test - توزيع (distribution)',
        true
    );
    
    -- Test valid transaction_type value (وارد - in)
    INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity,
        related_to,
        notes,
        is_deleted
    )
    SELECT 
        (SELECT id FROM inventory_items LIMIT 1),
        'وارد',
        0.01,
        'تبرع',
        'Constraint test - وارد (in)',
        true
    );
    
    -- Clean up test records
    DELETE FROM inventory_transactions 
    WHERE notes LIKE 'Constraint test%';
    
    RAISE NOTICE '✅ Constraint test PASSED - Arabic values accepted';
EXCEPTION
    WHEN check_violation THEN
        RAISE EXCEPTION '❌ Constraint test FAILED - Arabic values rejected. Check constraint definition.';
    WHEN OTHERS THEN
        RAISE EXCEPTION '❌ Constraint test FAILED with error: %', SQLERRM;
END $$;

-- =====================================================
-- STEP 7: Log completion
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Migration 044 applied successfully!';
    RAISE NOTICE '   ';
    RAISE NOTICE '   Fixed constraints (converted from English to Arabic):';
    RAISE NOTICE '   - inventory_transactions_related_to_check ✓';
    RAISE NOTICE '   - inventory_transactions_transaction_type_check ✓';
    RAISE NOTICE '   ';
    RAISE NOTICE '   Converted existing data:';
    RAISE NOTICE '   - purchase → شراء';
    RAISE NOTICE '   - donation → تبرع';
    RAISE NOTICE '   - distribution → توزيع';
    RAISE NOTICE '   - transfer → تحويل';
    RAISE NOTICE '   - adjustment → تعديل';
    RAISE NOTICE '   - damage → تلف';
    RAISE NOTICE '   - in → وارد';
    RAISE NOTICE '   - out → صادر';
    RAISE NOTICE '   ';
    RAISE NOTICE '   Allowed related_to values (Arabic):';
    RAISE NOTICE '   - شراء (purchase)';
    RAISE NOTICE '   - تبرع (donation)';
    RAISE NOTICE '   - توزيع (distribution) ← This was failing before';
    RAISE NOTICE '   - تحويل (transfer)';
    RAISE NOTICE '   - تعديل (adjustment)';
    RAISE NOTICE '   - تلف (damage)';
    RAISE NOTICE '   ';
    RAISE NOTICE '   Allowed transaction_type values (Arabic):';
    RAISE NOTICE '   - وارد (in)';
    RAISE NOTICE '   - صادر (out)';
    RAISE NOTICE '   ';
    RAISE NOTICE '   Distribution creation should now work correctly! 🎉';
END $$;

-- =====================================================
-- ROLLBACK INSTRUCTIONS
-- =====================================================
-- To rollback this migration:
-- 
-- -- Drop Arabic constraints
-- ALTER TABLE inventory_transactions 
-- DROP CONSTRAINT IF EXISTS inventory_transactions_related_to_check;
-- 
-- ALTER TABLE inventory_transactions 
-- DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;
-- 
-- -- Re-add English constraints (NOT RECOMMENDED)
-- ALTER TABLE inventory_transactions 
-- ADD CONSTRAINT inventory_transactions_related_to_check 
-- CHECK (related_to IN ('purchase', 'donation', 'distribution', 'transfer', 'adjustment', 'damage'));
-- 
-- ALTER TABLE inventory_transactions 
-- ADD CONSTRAINT inventory_transactions_transaction_type_check 
-- CHECK (transaction_type IN ('in', 'out'));
-- =====================================================
