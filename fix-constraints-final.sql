-- ============================================================================
-- FINAL FIX: Handle foreign key constraints properly for contract_id system
-- ============================================================================
-- This script provides multiple approaches to fix the constraint issue

-- Step 1: Check current state
SELECT 'Current Constraints:' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass
OR confrelid = 'customers'::regclass
ORDER BY contype, conname;

-- Step 2: Check for existing duplicate customer_ids
SELECT 'Checking for duplicate customer_ids:' as info;
SELECT customer_id, COUNT(*) as count 
FROM customers 
GROUP BY customer_id 
HAVING COUNT(*) > 1;

-- ============================================================================
-- APPROACH 1: Remove foreign key constraint entirely (Recommended)
-- ============================================================================
-- This is the cleanest approach for the contract_id system
-- We'll handle referential integrity at the application level

-- Remove the foreign key constraint
ALTER TABLE traffic_data DROP CONSTRAINT IF EXISTS traffic_data_customer_id_fkey;

-- Remove the unique constraint on customer_id
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_id_key;

-- Add unique constraint on contract_id
ALTER TABLE customers ADD CONSTRAINT customers_contract_id_key UNIQUE (contract_id);

-- Create indexes for performance
DROP INDEX IF EXISTS idx_customers_customer_id;
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_contract_id ON customers(contract_id);

-- ============================================================================
-- APPROACH 2: Alternative - Keep foreign key with modified approach
-- ============================================================================
-- Uncomment this section if you absolutely need the foreign key constraint

/*
-- First, ensure customer_id has a unique constraint for foreign key support
-- This means we can't have duplicate customer_ids, which limits our contract system
-- ALTER TABLE customers ADD CONSTRAINT customers_customer_id_key UNIQUE (customer_id);

-- Then recreate the foreign key
-- ALTER TABLE traffic_data 
-- ADD CONSTRAINT traffic_data_customer_id_fkey 
-- FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- Add contract_id unique constraint
-- ALTER TABLE customers ADD CONSTRAINT customers_contract_id_key UNIQUE (contract_id);
*/

-- ============================================================================
-- Verification and Testing
-- ============================================================================

-- Check final constraints
SELECT 'Final Constraints:' as info;
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass
OR confrelid = 'customers'::regclass
ORDER BY contype, conname;

-- Test the contract_id system
INSERT INTO customers (customer_name, office_name, service_type, customer_id, contract_id)
VALUES 
    ('Test Corp', 'Main Office', 'Premium', 'TEST001', 'CONT_TEST_001'),
    ('Test Corp', 'Branch Office', 'Standard', 'TEST001', 'CONT_TEST_002')
ON CONFLICT (contract_id) DO NOTHING;

-- Test traffic data insertion (should work even without foreign key)
INSERT INTO traffic_data (customer_id, date, traffic_volume, revenue, service_type)
VALUES ('TEST001', '2024-01-01', 1000, 5000.00, 'Premium')
ON CONFLICT DO NOTHING;

-- Verify the test data
SELECT 'Test Results:' as info;
SELECT 'Customers with same customer_id, different contract_id:' as test;
SELECT customer_id, contract_id, customer_name, service_type 
FROM customers 
WHERE customer_id = 'TEST001';

SELECT 'Traffic data linked to customer_id:' as test;
SELECT customer_id, date, revenue, service_type 
FROM traffic_data 
WHERE customer_id = 'TEST001';

-- Clean up test data
DELETE FROM traffic_data WHERE customer_id = 'TEST001';
DELETE FROM customers WHERE customer_id = 'TEST001';

-- Final success message
SELECT 'SUCCESS: Database constraints fixed! Contract_id system is now active.' as status,
       'Multiple contracts per customer_id are now allowed.' as details,
       'Foreign key constraint removed - referential integrity handled by application.' as note;
