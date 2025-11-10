-- Traffic Data Migration Verification Script
-- This script checks the current state of the database and verifies migration status

\echo '=== TRAFFIC DATA MIGRATION VERIFICATION ==='
\echo ''

-- Check if traffic_data table exists
\echo '1. Checking if traffic_data table exists...'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'traffic_data') 
        THEN '✅ traffic_data table exists'
        ELSE '❌ traffic_data table does not exist'
    END as table_status;

\echo ''

-- Check current column structure
\echo '2. Current traffic_data table structure:'
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'traffic_data' 
ORDER BY ordinal_position;

\echo ''

-- Check if contract_id column exists
\echo '3. Checking for contract_id column...'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'traffic_data' AND column_name = 'contract_id'
        ) 
        THEN '✅ contract_id column exists - Migration appears to be complete'
        ELSE '⚠️  contract_id column missing - Migration needs to be run'
    END as migration_status;

\echo ''

-- Check if customer_id column still exists (should exist during transition)
\echo '4. Checking for customer_id column...'
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'traffic_data' AND column_name = 'customer_id'
        ) 
        THEN '✅ customer_id column exists'
        ELSE '❌ customer_id column missing'
    END as customer_id_status;

\echo ''

-- Count total traffic records
\echo '5. Traffic data record counts:'
SELECT 
    COUNT(*) as total_traffic_records,
    COUNT(CASE WHEN customer_id IS NOT NULL THEN 1 END) as records_with_customer_id,
    COUNT(CASE WHEN contract_id IS NOT NULL THEN 1 END) as records_with_contract_id
FROM traffic_data;

\echo ''

-- Check customers table structure
\echo '6. Customers table structure:'
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

\echo ''

-- Check customer-contract relationships
\echo '7. Customer-Contract relationship analysis:'
SELECT 
    COUNT(*) as total_customers,
    COUNT(DISTINCT customer_id) as unique_customer_ids,
    COUNT(DISTINCT contract_id) as unique_contract_ids,
    CASE 
        WHEN COUNT(*) = COUNT(DISTINCT contract_id) 
        THEN '✅ Each customer has unique contract_id'
        ELSE '⚠️  Multiple customers may share contract_ids'
    END as contract_uniqueness
FROM customers;

\echo ''

-- Check for any orphaned traffic records (if migration is complete)
\echo '8. Data integrity check:'
DO $$
DECLARE
    contract_col_exists boolean;
    orphaned_count integer := 0;
BEGIN
    -- Check if contract_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'traffic_data' AND column_name = 'contract_id'
    ) INTO contract_col_exists;
    
    IF contract_col_exists THEN
        -- Check for orphaned records
        SELECT COUNT(*) INTO orphaned_count
        FROM traffic_data t
        LEFT JOIN customers c ON t.contract_id = c.contract_id
        WHERE c.contract_id IS NULL;
        
        IF orphaned_count = 0 THEN
            RAISE NOTICE '✅ All traffic records have valid contract_id references';
        ELSE
            RAISE NOTICE '❌ Found % orphaned traffic records with invalid contract_id', orphaned_count;
        END IF;
    ELSE
        RAISE NOTICE '⚠️  contract_id column not found - migration not yet complete';
    END IF;
END $$;

\echo ''

-- Sample data preview (first 5 records)
\echo '9. Sample traffic data (first 5 records):'
SELECT 
    id,
    COALESCE(contract_id, 'NULL') as contract_id,
    COALESCE(customer_id, 'NULL') as customer_id,
    date,
    traffic_volume,
    revenue,
    service_type
FROM traffic_data 
ORDER BY created_at DESC 
LIMIT 5;

\echo ''

-- Migration recommendations
\echo '10. Migration Status Summary:'
DO $$
DECLARE
    has_contract_id boolean;
    has_customer_id boolean;
    traffic_count integer;
BEGIN
    -- Check column existence
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'traffic_data' AND column_name = 'contract_id'
    ) INTO has_contract_id;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'traffic_data' AND column_name = 'customer_id'
    ) INTO has_customer_id;
    
    SELECT COUNT(*) INTO traffic_count FROM traffic_data;
    
    RAISE NOTICE '=== MIGRATION STATUS SUMMARY ===';
    
    IF has_contract_id AND has_customer_id THEN
        RAISE NOTICE '✅ Migration appears to be COMPLETE';
        RAISE NOTICE '   - Both contract_id and customer_id columns exist';
        RAISE NOTICE '   - Ready for application testing';
        RAISE NOTICE '   - After testing, customer_id column can be dropped';
    ELSIF has_customer_id AND NOT has_contract_id THEN
        RAISE NOTICE '⚠️  Migration NOT STARTED';
        RAISE NOTICE '   - Only customer_id column exists';
        RAISE NOTICE '   - Run: migrate-traffic-to-contract-id.sql';
    ELSIF has_contract_id AND NOT has_customer_id THEN
        RAISE NOTICE '✅ Migration FULLY COMPLETE';
        RAISE NOTICE '   - Only contract_id column exists';
        RAISE NOTICE '   - customer_id column has been dropped';
    ELSE
        RAISE NOTICE '❌ CRITICAL: No ID columns found!';
        RAISE NOTICE '   - Database may be corrupted';
        RAISE NOTICE '   - Restore from backup immediately';
    END IF;
    
    RAISE NOTICE 'Total traffic records: %', traffic_count;
END $$;

\echo ''
\echo '=== VERIFICATION COMPLETE ==='
