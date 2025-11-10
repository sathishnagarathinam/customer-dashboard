-- ============================================================================
-- ROLLBACK SCRIPT: Revert traffic_data from contract_id back to customer_id
-- ============================================================================
-- This script reverts the traffic_data table migration if needed
-- ONLY run this if you need to rollback the contract_id migration
-- WARNING: This completely removes contract_id and restores customer_id

-- Step 1: Check current state and backup availability
SELECT 'ROLLBACK ANALYSIS - CURRENT STATE' as step;

-- Check if backup table exists (created during migration)
SELECT 'Checking for backup table:' as info;
SELECT
    CASE
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'traffic_data_backup_pre_migration')
        THEN 'Backup table exists - rollback possible'
        ELSE 'NO BACKUP TABLE FOUND - ROLLBACK NOT POSSIBLE!'
    END as backup_status;

-- Check current table structure
SELECT 'Current traffic_data structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'traffic_data'
ORDER BY ordinal_position;

-- Check if we have contract_id column (what we're rolling back from)
SELECT 'Contract ID column status:' as info;
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'traffic_data' AND column_name = 'contract_id'
        )
        THEN '✅ contract_id column exists - can rollback'
        ELSE '❌ contract_id column not found - already rolled back or never migrated'
    END as contract_id_status;

-- Compare current data with backup
SELECT 'Data comparison:' as info;
SELECT
    (SELECT COUNT(*) FROM traffic_data) as current_records,
    (SELECT COUNT(*) FROM traffic_data_backup_pre_migration) as backup_records;

-- Step 2: Remove foreign key constraint on contract_id
SELECT 'STEP 2: REMOVING CONSTRAINTS' as step;
ALTER TABLE traffic_data DROP CONSTRAINT IF EXISTS traffic_data_contract_id_fkey;

-- Drop any indexes on contract_id
DROP INDEX IF EXISTS idx_traffic_data_contract_id;

-- Step 3: Completely restore from backup table
SELECT 'STEP 3: RESTORING FROM BACKUP' as step;

-- Drop current traffic_data table completely
DROP TABLE IF EXISTS traffic_data_rollback_temp;
ALTER TABLE traffic_data RENAME TO traffic_data_rollback_temp;

-- Recreate traffic_data from backup
CREATE TABLE traffic_data AS
SELECT * FROM traffic_data_backup_pre_migration;

-- Restore original indexes
CREATE INDEX IF NOT EXISTS idx_traffic_data_customer_id ON traffic_data(customer_id);
CREATE INDEX IF NOT EXISTS idx_traffic_data_date ON traffic_data(date);

-- Step 4: Attempt to restore original foreign key constraint (optional)
SELECT 'STEP 4: RESTORING CONSTRAINTS (OPTIONAL)' as step;
-- Note: This might fail if the original constraint was removed during customer table migration
-- Uncomment the following lines if you want to restore the foreign key constraint:
-- ALTER TABLE traffic_data
-- ADD CONSTRAINT traffic_data_customer_id_fkey
-- FOREIGN KEY (customer_id) REFERENCES customers(customer_id);

-- Step 5: Verification
SELECT 'STEP 5: ROLLBACK VERIFICATION' as step;

-- Check final structure (should have customer_id, no contract_id)
SELECT 'Final traffic_data table structure:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'traffic_data'
ORDER BY ordinal_position;

-- Verify contract_id column is completely removed
SELECT 'Verifying contract_id column removal:' as info;
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'traffic_data' AND column_name = 'contract_id'
        )
        THEN '❌ contract_id column still exists!'
        ELSE '✅ contract_id column successfully removed'
    END as contract_id_removal_status;

-- Verify customer_id column is restored
SELECT 'Verifying customer_id column restoration:' as info;
SELECT
    CASE
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'traffic_data' AND column_name = 'customer_id'
        )
        THEN '✅ customer_id column successfully restored'
        ELSE '❌ customer_id column missing!'
    END as customer_id_restoration_status;

-- Check constraints
SELECT 'Current constraints:' as info;
SELECT conname as constraint_name, contype as constraint_type
FROM pg_constraint
WHERE conrelid = 'traffic_data'::regclass;

-- Verify data integrity
SELECT 'Data verification:' as info;
SELECT
    COUNT(*) as total_records,
    COUNT(customer_id) as records_with_customer_id,
    COUNT(DISTINCT customer_id) as unique_customer_ids
FROM traffic_data;

-- Test join with customers table
SELECT 'Join test with customers table:' as info;
SELECT COUNT(*) as successful_joins
FROM traffic_data t
INNER JOIN customers c ON t.customer_id = c.customer_id;

-- Step 6: Cleanup
SELECT 'STEP 6: CLEANUP' as step;
DROP TABLE IF EXISTS traffic_data_rollback_temp;

SELECT 'ROLLBACK COMPLETED SUCCESSFULLY!' as status,
       'Traffic data reverted to use customer_id as the primary identifier.' as details,
       'contract_id column has been completely removed.' as cleanup_info;
