-- =====================================================
-- SIMPLE FIX: Run in Supabase SQL Editor
-- No DO blocks, no complex syntax
-- =====================================================

-- Step 1: Add updated_at column
ALTER TABLE inventory_transactions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

UPDATE inventory_transactions
SET updated_at = COALESCE(updated_at, created_at);

CREATE INDEX IF NOT EXISTS idx_inventory_transactions_updated_at
ON inventory_transactions(updated_at);

-- Step 2: Drop old constraints
ALTER TABLE inventory_transactions
DROP CONSTRAINT IF EXISTS inventory_transactions_related_to_check;

ALTER TABLE inventory_transactions
DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;

-- Step 3: Convert data to Arabic
UPDATE inventory_transactions SET related_to = 'شراء' WHERE related_to = 'purchase';
UPDATE inventory_transactions SET related_to = 'تبرع' WHERE related_to = 'donation';
UPDATE inventory_transactions SET related_to = 'توزيع' WHERE related_to = 'distribution';
UPDATE inventory_transactions SET related_to = 'تحويل' WHERE related_to = 'transfer';
UPDATE inventory_transactions SET related_to = 'تعديل' WHERE related_to = 'adjustment';
UPDATE inventory_transactions SET related_to = 'تلف' WHERE related_to = 'damage';

UPDATE inventory_transactions SET transaction_type = 'وارد' WHERE transaction_type = 'in';
UPDATE inventory_transactions SET transaction_type = 'صادر' WHERE transaction_type = 'out';

-- Step 4: Add Arabic constraints
ALTER TABLE inventory_transactions
ADD CONSTRAINT inventory_transactions_related_to_check
CHECK (related_to IN ('شراء', 'تبرع', 'توزيع', 'تحويل', 'تعديل', 'تلف'));

ALTER TABLE inventory_transactions
ADD CONSTRAINT inventory_transactions_transaction_type_check
CHECK (transaction_type IN ('وارد', 'صادر'));

-- Done! Check the Messages tab for success
