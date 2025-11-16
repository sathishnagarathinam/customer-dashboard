-- ============================================================================
-- DIAGNOSE MISSING TRAFFIC DATA IN REPORTS
-- ============================================================================
-- This script helps identify why traffic data is missing from reports

-- Step 1: Check total traffic records in database
SELECT 'TOTAL TRAFFIC RECORDS IN DATABASE' as check_name;
SELECT COUNT(*) as total_traffic_records
FROM traffic_data;

-- Step 2: Check traffic records WITHOUT matching customers (orphaned records)
SELECT 'TRAFFIC RECORDS WITHOUT MATCHING CUSTOMERS (ORPHANED)' as check_name;
SELECT COUNT(*) as orphaned_traffic_records
FROM traffic_data t
LEFT JOIN customers c ON t.contract_id = c.contract_id
WHERE c.contract_id IS NULL;

-- Step 3: Show sample orphaned traffic records
SELECT 'SAMPLE ORPHANED TRAFFIC RECORDS' as check_name;
SELECT 
    t.contract_id,
    t.date,
    t.traffic_volume,
    t.revenue,
    t.service_type,
    'NO MATCHING CUSTOMER' as issue
FROM traffic_data t
LEFT JOIN customers c ON t.contract_id = c.contract_id
WHERE c.contract_id IS NULL
ORDER BY t.date DESC
LIMIT 20;

-- Step 4: Check traffic records WITH matching customers
SELECT 'TRAFFIC RECORDS WITH MATCHING CUSTOMERS' as check_name;
SELECT COUNT(*) as valid_traffic_records
FROM traffic_data t
INNER JOIN customers c ON t.contract_id = c.contract_id;

-- Step 5: Check for specific office (J P Nagar SO)
SELECT 'J P NAGAR SO - TOTAL TRAFFIC IN DATABASE' as check_name;
SELECT COUNT(*) as jp_nagar_total_traffic
FROM traffic_data t
WHERE EXISTS (
    SELECT 1 FROM customers c 
    WHERE c.contract_id = t.contract_id 
    AND c.office_name = 'J P Nagar SO'
);

-- Step 6: Check J P Nagar SO traffic WITHOUT matching customers
SELECT 'J P NAGAR SO - ORPHANED TRAFFIC RECORDS' as check_name;
SELECT 
    t.contract_id,
    COUNT(*) as record_count,
    SUM(t.traffic_volume) as total_traffic,
    SUM(t.revenue) as total_revenue
FROM traffic_data t
WHERE NOT EXISTS (
    SELECT 1 FROM customers c 
    WHERE c.contract_id = t.contract_id
)
GROUP BY t.contract_id
ORDER BY record_count DESC
LIMIT 20;

-- Step 7: Breakdown by office name
SELECT 'TRAFFIC BREAKDOWN BY OFFICE' as check_name;
SELECT 
    COALESCE(c.office_name, 'NO CUSTOMER MATCH') as office_name,
    COUNT(*) as traffic_record_count,
    SUM(t.traffic_volume) as total_traffic,
    SUM(t.revenue) as total_revenue
FROM traffic_data t
LEFT JOIN customers c ON t.contract_id = c.contract_id
GROUP BY c.office_name
ORDER BY traffic_record_count DESC;

-- Step 8: Find contract IDs in traffic_data but NOT in customers
SELECT 'CONTRACT IDs IN TRAFFIC BUT NOT IN CUSTOMERS' as check_name;
SELECT 
    t.contract_id,
    COUNT(*) as traffic_records,
    SUM(t.traffic_volume) as total_traffic,
    MIN(t.date) as first_date,
    MAX(t.date) as last_date
FROM traffic_data t
WHERE NOT EXISTS (
    SELECT 1 FROM customers c WHERE c.contract_id = t.contract_id
)
GROUP BY t.contract_id
ORDER BY traffic_records DESC;

-- Step 9: Summary comparison
SELECT 'SUMMARY COMPARISON' as check_name;
SELECT 
    (SELECT COUNT(*) FROM traffic_data) as total_traffic_records,
    (SELECT COUNT(*) FROM traffic_data t INNER JOIN customers c ON t.contract_id = c.contract_id) as traffic_with_customers,
    (SELECT COUNT(*) FROM traffic_data t LEFT JOIN customers c ON t.contract_id = c.contract_id WHERE c.contract_id IS NULL) as orphaned_traffic,
    (SELECT COUNT(*) FROM traffic_data) - (SELECT COUNT(*) FROM traffic_data t INNER JOIN customers c ON t.contract_id = c.contract_id) as missing_from_reports;

-- Step 10: Specific check for J P Nagar SO discrepancy
SELECT 'J P NAGAR SO - DETAILED BREAKDOWN' as check_name;
SELECT 
    'Total in database' as category,
    COUNT(*) as record_count,
    SUM(t.traffic_volume) as total_traffic
FROM traffic_data t
LEFT JOIN customers c ON t.contract_id = c.contract_id
WHERE c.office_name = 'J P Nagar SO'

UNION ALL

SELECT 
    'With matching customer' as category,
    COUNT(*) as record_count,
    SUM(t.traffic_volume) as total_traffic
FROM traffic_data t
INNER JOIN customers c ON t.contract_id = c.contract_id
WHERE c.office_name = 'J P Nagar SO'

UNION ALL

SELECT 
    'Missing from reports' as category,
    15121 - COUNT(*) as record_count,
    15121 - SUM(t.traffic_volume) as total_traffic
FROM traffic_data t
INNER JOIN customers c ON t.contract_id = c.contract_id
WHERE c.office_name = 'J P Nagar SO';

