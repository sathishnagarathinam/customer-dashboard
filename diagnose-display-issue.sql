-- ============================================================================
-- DIAGNOSE WHY RECORD EXISTS BUT DOESN'T SHOW IN REPORTS
-- Contract ID: 40087891, Date: 2025-04-30, Traffic: 17
-- ============================================================================

-- Step 1: Verify the exact record with all details
SELECT 'EXACT RECORD WITH ALL DETAILS' as check_name;
SELECT 
    t.id,
    t.contract_id,
    t.date,
    t.traffic_volume,
    t.revenue,
    t.service_type,
    t.batch_id,
    t.created_at,
    c.customer_id,
    c.customer_name,
    c.office_name,
    c.service_type as customer_service_type,
    c.payment_type
FROM traffic_data t
INNER JOIN customers c ON t.contract_id = c.contract_id
WHERE t.contract_id = '40087891'
  AND t.date = '2025-04-30';

-- Step 2: Check if there are multiple customers with the same contract_id
SELECT 'CHECK FOR DUPLICATE CUSTOMERS WITH SAME CONTRACT ID' as check_name;
SELECT 
    contract_id,
    COUNT(*) as customer_count,
    STRING_AGG(customer_name, ', ') as customer_names
FROM customers
WHERE contract_id = '40087891'
GROUP BY contract_id
HAVING COUNT(*) > 1;

-- Step 3: Check the service_type match between traffic and customer
SELECT 'SERVICE TYPE COMPARISON' as check_name;
SELECT 
    t.contract_id,
    t.date,
    t.service_type as traffic_service_type,
    c.service_type as customer_service_type,
    CASE 
        WHEN t.service_type = c.service_type THEN 'MATCH'
        ELSE 'MISMATCH'
    END as service_type_status
FROM traffic_data t
LEFT JOIN customers c ON t.contract_id = c.contract_id
WHERE t.contract_id = '40087891'
  AND t.date = '2025-04-30';

-- Step 4: Check the office name for this contract
SELECT 'OFFICE NAME FOR THIS CONTRACT' as check_name;
SELECT 
    c.contract_id,
    c.office_name,
    c.payment_type,
    c.service_type
FROM customers c
WHERE c.contract_id = '40087891';

-- Step 5: Check all traffic for this contract in April 2025
SELECT 'ALL APRIL 2025 TRAFFIC FOR THIS CONTRACT' as check_name;
SELECT 
    t.date,
    t.traffic_volume,
    t.revenue,
    t.service_type
FROM traffic_data t
WHERE t.contract_id = '40087891'
  AND t.date >= '2025-04-01'
  AND t.date <= '2025-04-30'
ORDER BY t.date;

-- Step 6: Check if date is exactly 2025-04-30 (no time component)
SELECT 'DATE FORMAT AND TYPE CHECK' as check_name;
SELECT 
    contract_id,
    date,
    date::text as date_as_text,
    EXTRACT(YEAR FROM date) as year,
    EXTRACT(MONTH FROM date) as month,
    EXTRACT(DAY FROM date) as day,
    TO_CHAR(date, 'YYYY-MM-DD') as formatted_date,
    TO_CHAR(date, 'YYYY-MM') as month_key
FROM traffic_data
WHERE contract_id = '40087891'
  AND date = '2025-04-30';

-- Step 7: Check if this is the ONLY record for this contract on this date
SELECT 'CHECK FOR MULTIPLE RECORDS ON SAME DATE' as check_name;
SELECT 
    contract_id,
    date,
    COUNT(*) as record_count,
    SUM(traffic_volume) as total_traffic,
    STRING_AGG(traffic_volume::text, ', ') as all_traffic_values
FROM traffic_data
WHERE contract_id = '40087891'
  AND date = '2025-04-30'
GROUP BY contract_id, date;

-- Step 8: Check the data types
SELECT 'DATA TYPE VERIFICATION' as check_name;
SELECT 
    contract_id,
    date,
    traffic_volume,
    pg_typeof(traffic_volume) as traffic_type,
    traffic_volume::text as traffic_as_text,
    CASE 
        WHEN traffic_volume IS NULL THEN 'NULL'
        WHEN traffic_volume = 0 THEN 'ZERO'
        WHEN traffic_volume > 0 THEN 'POSITIVE'
        ELSE 'NEGATIVE'
    END as traffic_status
FROM traffic_data
WHERE contract_id = '40087891'
  AND date = '2025-04-30';

-- Step 9: Simulate the JOIN that the application does
SELECT 'SIMULATE APPLICATION JOIN' as check_name;
SELECT 
    t.id as traffic_id,
    t.contract_id,
    t.date,
    t.traffic_volume,
    t.revenue,
    t.service_type as traffic_service_type,
    c.id as customer_id,
    c.customer_name,
    c.office_name,
    c.service_type as customer_service_type,
    c.payment_type
FROM traffic_data t
INNER JOIN customers c ON t.contract_id = c.contract_id
WHERE t.contract_id = '40087891'
  AND t.date = '2025-04-30';

-- Step 10: Check if there's a filter that might exclude this record
SELECT 'CHECK POTENTIAL FILTER EXCLUSIONS' as check_name;
SELECT 
    'Office Name' as filter_type,
    c.office_name as filter_value
FROM customers c
WHERE c.contract_id = '40087891'
UNION ALL
SELECT 
    'Payment Type' as filter_type,
    c.payment_type as filter_value
FROM customers c
WHERE c.contract_id = '40087891'
UNION ALL
SELECT 
    'Service Type (Customer)' as filter_type,
    c.service_type as filter_value
FROM customers c
WHERE c.contract_id = '40087891'
UNION ALL
SELECT 
    'Service Type (Traffic)' as filter_type,
    t.service_type as filter_value
FROM traffic_data t
WHERE t.contract_id = '40087891'
  AND t.date = '2025-04-30';

