-- ============================================================================
-- TRAFFIC DATA MIGRATION: customer_id → contract_id
-- ============================================================================
-- This script migrates the traffic_data table to use contract_id instead of customer_id
-- IMPORTANT: Backup your database before running this migration!

-- Step 1: Analyze current data state
SELECT 'MIGRATION ANALYSIS - BEFORE' as step;

-- Check current traffic_data structure
SELECT 'Current traffic_data table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'traffic_data'
ORDER BY ordinal_position;

-- Check current constraints
SELECT 'Current constraints on traffic_data:' as info;
SELECT conname as constraint_name, contype as constraint_type, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'traffic_data'::regclass;

-- Analyze data relationships
SELECT 'Data relationship analysis:' as info;
SELECT
    COUNT(*) as total_traffic_records,
    COUNT(DISTINCT customer_id) as unique_customer_ids_in_traffic,
    (SELECT COUNT(*) FROM customers) as total_customers,
    (SELECT COUNT(DISTINCT customer_id) FROM customers) as unique_customer_ids_in_customers,
    (SELECT COUNT(DISTINCT contract_id) FROM customers WHERE contract_id IS NOT NULL) as unique_contract_ids
FROM traffic_data;

-- Check for orphaned traffic records (customer_ids that don't exist in customers)
SELECT 'Orphaned traffic records check:' as info;
SELECT t.customer_id, COUNT(*) as traffic_records
FROM traffic_data t
LEFT JOIN customers c ON t.customer_id = c.customer_id
WHERE c.customer_id IS NULL
GROUP BY t.customer_id
ORDER BY traffic_records DESC;

-- ============================================================================
-- Step 2: Data Migration Strategy
-- ============================================================================

-- Create a mapping table to handle customer_id → contract_id conversion
-- This handles cases where one customer_id might map to multiple contract_ids
CREATE TEMP TABLE customer_contract_mapping AS
SELECT
    customer_id,
    contract_id,
    customer_name,
    created_at,
    ROW_NUMBER() OVER (PARTITION BY customer_id ORDER BY created_at ASC) as contract_rank
FROM customers
WHERE contract_id IS NOT NULL
ORDER BY customer_id, created_at;

-- Show the mapping for review
SELECT 'Customer to Contract mapping:' as info;
SELECT customer_id, contract_id, customer_name, contract_rank,
       CASE WHEN contract_rank = 1 THEN 'PRIMARY' ELSE 'SECONDARY' END as contract_type
FROM customer_contract_mapping
ORDER BY customer_id, contract_rank;

-- Check for customer_ids with multiple contracts
SELECT 'Customers with multiple contracts:' as info;
SELECT customer_id, COUNT(*) as contract_count, 
       STRING_AGG(contract_id, ', ' ORDER BY contract_rank) as all_contracts
FROM customer_contract_mapping
GROUP BY customer_id
HAVING COUNT(*) > 1
ORDER BY contract_count DESC;

-- ============================================================================
-- Step 3: Add new contract_id column to traffic_data
-- ============================================================================

-- Add the new contract_id column
ALTER TABLE traffic_data ADD COLUMN contract_id VARCHAR(100);

-- Create index on the new column for performance
CREATE INDEX idx_traffic_data_contract_id ON traffic_data(contract_id);

-- ============================================================================
-- Step 4: Migrate data from customer_id to contract_id
-- ============================================================================

-- Update traffic_data with contract_id values
-- For customers with multiple contracts, use the primary (first created) contract
UPDATE traffic_data 
SET contract_id = mapping.contract_id
FROM (
    SELECT customer_id, contract_id
    FROM customer_contract_mapping
    WHERE contract_rank = 1  -- Use primary contract for each customer
) mapping
WHERE traffic_data.customer_id = mapping.customer_id;

-- Check migration results
SELECT 'Migration results:' as info;
SELECT 
    COUNT(*) as total_records,
    COUNT(contract_id) as records_with_contract_id,
    COUNT(*) - COUNT(contract_id) as records_without_contract_id,
    COUNT(DISTINCT contract_id) as unique_contract_ids_in_traffic
FROM traffic_data;

-- Show records that couldn't be migrated
SELECT 'Records that could not be migrated:' as info;
SELECT customer_id, COUNT(*) as unmigrated_records
FROM traffic_data 
WHERE contract_id IS NULL
GROUP BY customer_id
ORDER BY unmigrated_records DESC;

-- ============================================================================
-- Step 5: Update constraints and relationships
-- ============================================================================

-- Make contract_id NOT NULL (after ensuring all records have values)
-- First, handle any remaining NULL values by either:
-- 1. Deleting orphaned records, or 
-- 2. Creating placeholder contracts

-- Option 1: Delete orphaned traffic records (uncomment if desired)
-- DELETE FROM traffic_data WHERE contract_id IS NULL;

-- Option 2: Create placeholder contracts for orphaned records (recommended)
INSERT INTO customers (customer_name, office_name, service_type, customer_id, contract_id)
SELECT DISTINCT 
    'Unknown Customer (' || t.customer_id || ')' as customer_name,
    'Unknown Office' as office_name,
    'Unknown' as service_type,
    t.customer_id,
    'MIGRATED_' || t.customer_id || '_' || EXTRACT(EPOCH FROM NOW())::bigint as contract_id
FROM traffic_data t
WHERE t.contract_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM customers c WHERE c.customer_id = t.customer_id)
ON CONFLICT (contract_id) DO NOTHING;

-- Update remaining NULL contract_ids with the newly created contracts
UPDATE traffic_data 
SET contract_id = c.contract_id
FROM customers c
WHERE traffic_data.customer_id = c.customer_id 
  AND traffic_data.contract_id IS NULL;

-- Now make contract_id NOT NULL
ALTER TABLE traffic_data ALTER COLUMN contract_id SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE traffic_data 
ADD CONSTRAINT traffic_data_contract_id_fkey 
FOREIGN KEY (contract_id) REFERENCES customers(contract_id);

-- ============================================================================
-- Step 6: Remove old customer_id column completely
-- ============================================================================

-- Drop any existing foreign key constraints on customer_id first
DO $$
DECLARE
    constraint_name text;
BEGIN
    -- Find and drop foreign key constraints on customer_id
    FOR constraint_name IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'traffic_data'::regclass
        AND contype = 'f'
        AND pg_get_constraintdef(oid) LIKE '%customer_id%'
    LOOP
        EXECUTE 'ALTER TABLE traffic_data DROP CONSTRAINT ' || constraint_name;
        RAISE NOTICE 'Dropped constraint: %', constraint_name;
    END LOOP;
END $$;

-- Drop any indexes on customer_id
DROP INDEX IF EXISTS idx_traffic_data_customer_id;

-- Now completely remove the customer_id column
ALTER TABLE traffic_data DROP COLUMN IF EXISTS customer_id;
ALTER TABLE traffic_data DROP COLUMN IF EXISTS customer_id_backup;

SELECT 'customer_id column completely removed from traffic_data table' as status;

-- ============================================================================
-- Step 7: Verification
-- ============================================================================

SELECT 'MIGRATION VERIFICATION - AFTER' as step;

-- Check final table structure
SELECT 'Final traffic_data table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'traffic_data' 
ORDER BY ordinal_position;

-- Check final constraints
SELECT 'Final constraints on traffic_data:' as info;
SELECT conname as constraint_name, contype as constraint_type, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'traffic_data'::regclass;

-- Verify customer_id column is completely removed
SELECT 'Verifying customer_id column removal:' as info;
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'traffic_data' AND column_name IN ('customer_id', 'customer_id_backup')
        )
        THEN '❌ customer_id column still exists!'
        ELSE '✅ customer_id column successfully removed'
    END as customer_id_removal_status;

-- Verify data integrity
SELECT 'Final data verification:' as info;
SELECT
    COUNT(*) as total_traffic_records,
    COUNT(t.contract_id) as records_with_contract_id,
    COUNT(DISTINCT t.contract_id) as unique_contract_ids_in_traffic,
    COUNT(CASE WHEN c.contract_id IS NOT NULL THEN 1 END) as records_with_valid_contracts
FROM traffic_data t
LEFT JOIN customers c ON t.contract_id = c.contract_id;

-- Check for any orphaned traffic records
SELECT 'Orphaned traffic records check (should be 0):' as info;
SELECT COUNT(*) as orphaned_records
FROM traffic_data t
LEFT JOIN customers c ON t.contract_id = c.contract_id
WHERE c.contract_id IS NULL;

-- Test a sample join query
SELECT 'Sample join test:' as info;
SELECT t.contract_id, c.customer_name, c.customer_id, t.date, t.revenue
FROM traffic_data t
JOIN customers c ON t.contract_id = c.contract_id
ORDER BY t.date DESC
LIMIT 5;

-- Clean up temp table
DROP TABLE IF EXISTS customer_contract_mapping;

SELECT 'MIGRATION COMPLETED SUCCESSFULLY!' as status,
       'Traffic data now uses contract_id as the ONLY identifier.' as details,
       'customer_id column has been completely removed from traffic_data table.' as cleanup_info;
