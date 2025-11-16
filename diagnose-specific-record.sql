-- ============================================================================
-- DIAGNOSE SPECIFIC MISSING RECORD
-- Contract ID: 40087891, Date: 2025-04-30, Expected Traffic: 17
-- ============================================================================

-- Step 1: Check if the record exists in traffic_data table
SELECT 'CHECK IF RECORD EXISTS IN DATABASE' as check_name;
SELECT 
    id,
    contract_id,
    date,
    traffic_volume,
    revenue,
    service_type,
    batch_id,
    created_at
FROM traffic_data
WHERE contract_id = '40087891'
  AND date = '2025-04-30';

-- Step 2: Check if customer exists for this contract ID
SELECT 'CHECK IF CUSTOMER EXISTS FOR THIS CONTRACT ID' as check_name;
SELECT 
    id,
    customer_id,
    customer_name,
    contract_id,
    office_name,
    service_type,
    payment_type,
    created_at
FROM customers
WHERE contract_id = '40087891';

-- Step 3: Check all traffic records for this contract ID
SELECT 'ALL TRAFFIC RECORDS FOR CONTRACT ID 40087891' as check_name;
SELECT 
    date,
    traffic_volume,
    revenue,
    service_type,
    created_at
FROM traffic_data
WHERE contract_id = '40087891'
ORDER BY date DESC;

-- Step 4: Check if there are duplicate records for this date
SELECT 'CHECK FOR DUPLICATE RECORDS ON 2025-04-30' as check_name;
SELECT 
    contract_id,
    date,
    traffic_volume,
    revenue,
    COUNT(*) as duplicate_count
FROM traffic_data
WHERE date = '2025-04-30'
  AND contract_id = '40087891'
GROUP BY contract_id, date, traffic_volume, revenue
HAVING COUNT(*) > 1;

-- Step 5: Check if the date format is correct
SELECT 'CHECK DATE FORMAT VARIATIONS' as check_name;
SELECT 
    contract_id,
    date,
    traffic_volume,
    revenue,
    TO_CHAR(date::date, 'YYYY-MM-DD') as formatted_date
FROM traffic_data
WHERE contract_id = '40087891'
  AND (
    date::text LIKE '2025-04-30%' 
    OR date::text LIKE '%2025-04-30%'
  );

-- Step 6: Check the most recent upload batch
SELECT 'MOST RECENT UPLOAD BATCH' as check_name;
SELECT 
    batch_id,
    COUNT(*) as records_in_batch,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    MAX(created_at) as upload_time
FROM traffic_data
WHERE batch_id IS NOT NULL
GROUP BY batch_id
ORDER BY MAX(created_at) DESC
LIMIT 5;

-- Step 7: Check if this record is in the most recent batch
SELECT 'IS THIS RECORD IN RECENT BATCH?' as check_name;
SELECT 
    t.contract_id,
    t.date,
    t.traffic_volume,
    t.batch_id,
    t.created_at
FROM traffic_data t
WHERE t.contract_id = '40087891'
  AND t.date = '2025-04-30'
ORDER BY t.created_at DESC;

-- Step 8: Check for any NULL or zero values
SELECT 'CHECK FOR NULL OR ZERO VALUES' as check_name;
SELECT 
    contract_id,
    date,
    traffic_volume,
    revenue,
    CASE 
        WHEN traffic_volume IS NULL THEN 'NULL'
        WHEN traffic_volume = 0 THEN 'ZERO'
        ELSE 'HAS VALUE'
    END as traffic_status
FROM traffic_data
WHERE contract_id = '40087891'
  AND date = '2025-04-30';

-- Step 9: Check the exact data type and value
SELECT 'EXACT DATA TYPE AND VALUE CHECK' as check_name;
SELECT 
    contract_id,
    date,
    traffic_volume,
    pg_typeof(traffic_volume) as traffic_data_type,
    revenue,
    pg_typeof(revenue) as revenue_data_type,
    LENGTH(contract_id::text) as contract_id_length,
    LENGTH(TRIM(contract_id::text)) as contract_id_trimmed_length
FROM traffic_data
WHERE contract_id = '40087891'
  AND date = '2025-04-30';

-- Step 10: Check if contract_id has leading/trailing spaces
SELECT 'CHECK FOR WHITESPACE IN CONTRACT ID' as check_name;
SELECT 
    contract_id,
    LENGTH(contract_id) as original_length,
    LENGTH(TRIM(contract_id)) as trimmed_length,
    CASE 
        WHEN LENGTH(contract_id) != LENGTH(TRIM(contract_id)) THEN 'HAS WHITESPACE'
        ELSE 'NO WHITESPACE'
    END as whitespace_status
FROM traffic_data
WHERE contract_id LIKE '%40087891%';

-- Step 11: Search for similar contract IDs (in case of typo)
SELECT 'SIMILAR CONTRACT IDs' as check_name;
SELECT DISTINCT
    contract_id,
    COUNT(*) as record_count
FROM traffic_data
WHERE contract_id LIKE '%40087891%'
   OR contract_id LIKE '40087891%'
   OR contract_id LIKE '%40087891'
GROUP BY contract_id;

-- Step 12: Final verification - Join with customer
SELECT 'FINAL VERIFICATION - TRAFFIC WITH CUSTOMER' as check_name;
SELECT 
    t.contract_id,
    t.date,
    t.traffic_volume,
    t.revenue,
    c.customer_name,
    c.office_name,
    c.service_type,
    c.payment_type
FROM traffic_data t
LEFT JOIN customers c ON t.contract_id = c.contract_id
WHERE t.contract_id = '40087891'
  AND t.date = '2025-04-30';

