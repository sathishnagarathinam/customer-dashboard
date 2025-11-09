-- Database Migration: Change Primary Unique Constraint from customer_id to contract_id
-- Run this script in your Supabase SQL Editor to update existing database

-- Step 1: Remove the existing unique constraint on customer_id
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_customer_id_key;

-- Step 2: Add unique constraint on contract_id
ALTER TABLE customers ADD CONSTRAINT customers_contract_id_key UNIQUE (contract_id);

-- Step 3: Update any existing indexes
DROP INDEX IF EXISTS idx_customers_customer_id;
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_contract_id ON customers(contract_id);

-- Step 4: Verify the changes
SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'customers'::regclass
AND contype = 'u';

-- Step 5: Show current table structure
\d customers;

-- Note: This migration allows multiple customers to have the same customer_id
-- as long as they have different contract_id values, which supports the business
-- requirement of handling multiple service contracts per customer.
