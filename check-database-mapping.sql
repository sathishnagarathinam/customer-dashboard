-- Database Mapping Diagnostic Script
-- Run this in Supabase SQL Editor to check table structure and constraints

-- 1. Check if tables exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename IN ('customers', 'traffic_data')
ORDER BY tablename;

-- 2. Check customers table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'customers'
ORDER BY ordinal_position;

-- 3. Check traffic_data table structure  
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'traffic_data'
ORDER BY ordinal_position;

-- 4. Check foreign key constraints
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'traffic_data';

-- 5. Check existing customers (to verify customer_id values)
SELECT 
    customer_id,
    customer_name,
    COUNT(*) as count
FROM customers 
GROUP BY customer_id, customer_name
ORDER BY customer_id
LIMIT 10;

-- 6. Check if there are any traffic_data records
SELECT COUNT(*) as traffic_records_count FROM traffic_data;

-- 7. Test the foreign key relationship
-- This will show if the constraint is working properly
SELECT 
    c.customer_id as customer_table_id,
    c.customer_name,
    COUNT(t.id) as traffic_records
FROM customers c
LEFT JOIN traffic_data t ON c.customer_id = t.customer_id
GROUP BY c.customer_id, c.customer_name
ORDER BY c.customer_id;

-- 8. Show any constraint violations (if tables have data)
SELECT 
    t.customer_id as traffic_customer_id,
    COUNT(*) as orphaned_records
FROM traffic_data t
LEFT JOIN customers c ON t.customer_id = c.customer_id
WHERE c.customer_id IS NULL
GROUP BY t.customer_id;

-- Expected Results:
-- - Both tables should exist
-- - customers.customer_id should be VARCHAR(100) 
-- - traffic_data.customer_id should be VARCHAR(100)
-- - Foreign key should reference customers(customer_id)
-- - No orphaned records should exist
