-- ============================================================================
-- ADD PAYMENT TYPE COLUMN TO CUSTOMERS TABLE
-- ============================================================================
-- This script adds a payment_type column to the customers table
-- with 'Advance' as the default value for all existing and new customers

-- Step 1: Check current customers table structure
SELECT 'CURRENT CUSTOMERS TABLE STRUCTURE' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Step 2: Add payment_type column
SELECT 'ADDING PAYMENT_TYPE COLUMN' as step;

-- Add the payment_type column with default value
ALTER TABLE customers 
ADD COLUMN payment_type VARCHAR(20) DEFAULT 'Advance' NOT NULL;

-- Add a check constraint to ensure only valid values
ALTER TABLE customers 
ADD CONSTRAINT customers_payment_type_check 
CHECK (payment_type IN ('Advance', 'BNPL'));

-- Create an index for better query performance
CREATE INDEX idx_customers_payment_type ON customers(payment_type);

-- Step 3: Update all existing customers to have 'Advance' as default
SELECT 'UPDATING EXISTING CUSTOMERS' as step;

-- Update any NULL values to 'Advance' (though there shouldn't be any due to DEFAULT)
UPDATE customers 
SET payment_type = 'Advance' 
WHERE payment_type IS NULL;

-- Step 4: Verify the changes
SELECT 'VERIFICATION - AFTER ADDING PAYMENT_TYPE' as step;

-- Check updated table structure
SELECT 'Updated customers table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
ORDER BY ordinal_position;

-- Check constraints
SELECT 'Payment type constraints:' as info;
SELECT conname as constraint_name, pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass 
AND conname LIKE '%payment_type%';

-- Check data distribution
SELECT 'Payment type distribution:' as info;
SELECT 
    payment_type,
    COUNT(*) as customer_count,
    ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM customers), 2) as percentage
FROM customers 
GROUP BY payment_type
ORDER BY customer_count DESC;

-- Sample data preview
SELECT 'Sample customer data with payment_type:' as info;
SELECT 
    customer_name,
    office_name,
    service_type,
    customer_id,
    contract_id,
    payment_type
FROM customers 
ORDER BY created_at DESC 
LIMIT 5;

SELECT 'PAYMENT TYPE COLUMN ADDED SUCCESSFULLY!' as status,
       'All customers now have payment_type field with Advance as default' as details;
