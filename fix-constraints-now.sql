-- ============================================================================
-- URGENT FIX: Remove customer_id unique constraint and add contract_id constraint
-- ============================================================================
-- This script fixes the "duplicate key value violates unique constraint customers_customer_id_key" error
-- Run this in your Supabase SQL Editor immediately

-- Step 1: Check current constraints (for reference)
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass
AND contype = 'u'
ORDER BY conname;

-- Step 2: Remove the problematic unique constraint on customer_id
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_id_key;

-- Step 3: Add the correct unique constraint on contract_id
ALTER TABLE customers ADD CONSTRAINT customers_contract_id_key UNIQUE (contract_id);

-- Step 4: Update indexes for better performance
DROP INDEX IF EXISTS idx_customers_customer_id;
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_contract_id ON customers(contract_id);

-- Step 5: Verify the fix worked
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass
AND contype = 'u'
ORDER BY conname;

-- Step 6: Test the fix with sample data
-- This should work now (same customer_id, different contract_id)
INSERT INTO customers (customer_name, office_name, service_type, customer_id, contract_id)
VALUES 
    ('Test Corp', 'Main Office', 'Premium', 'TEST001', 'CONT_TEST_001'),
    ('Test Corp', 'Branch Office', 'Standard', 'TEST001', 'CONT_TEST_002')
ON CONFLICT (contract_id) DO NOTHING;

-- Clean up test data
DELETE FROM customers WHERE customer_id = 'TEST001';

-- Success message
SELECT 'Database constraints have been fixed! You can now upload customers with multiple contracts.' as status;
