-- ============================================================================
-- QUICK FIX: Add payment_type column to customers table
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor and run it

-- Add the payment_type column with default value 'Advance'
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'Advance' NOT NULL;

-- Add a check constraint to ensure only valid values (Advance or BNPL)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_payment_type_check'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT customers_payment_type_check 
        CHECK (payment_type IN ('Advance', 'BNPL'));
    END IF;
END $$;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_payment_type ON customers(payment_type);

-- Update any existing customers that might have NULL values
UPDATE customers 
SET payment_type = 'Advance' 
WHERE payment_type IS NULL;

-- Verify the changes
SELECT 'Payment type column added successfully!' as status;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customers' 
AND column_name = 'payment_type';

-- Show payment type distribution
SELECT 
    payment_type,
    COUNT(*) as customer_count
FROM customers 
GROUP BY payment_type;

