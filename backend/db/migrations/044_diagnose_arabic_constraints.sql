-- Diagnostic: Check what values are actually in the database for related_to
-- and compare with the constraint definition

-- =====================================================
-- 1. Check existing related_to values in the database
-- =====================================================
SELECT DISTINCT related_to, 
       octet_length(related_to) as byte_length,
       encode(related_to::bytea, 'hex') as hex_encoding
FROM inventory_transactions
ORDER BY related_to;

-- =====================================================
-- 2. Check the actual constraint definition
-- =====================================================
SELECT 
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'inventory_transactions_related_to_check';

-- =====================================================
-- 3. Try inserting with explicit Unicode escape sequences
-- =====================================================
-- This will help identify if there's an encoding issue

-- First, let's see what the correct value looks like:
SELECT 'توزيع' as correct_value,
       octet_length('توزيع') as correct_byte_length,
       encode('توزيع'::bytea, 'hex') as correct_hex;

-- =====================================================
-- 4. Check database encoding
-- =====================================================
SHOW server_encoding;
SHOW client_encoding;

-- Expected: UTF8 for both

-- =====================================================
-- 5. List all constraints on inventory_transactions
-- =====================================================
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'inventory_transactions'::regclass;
