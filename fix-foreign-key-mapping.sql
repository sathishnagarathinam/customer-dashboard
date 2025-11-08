-- Fix Foreign Key Mapping Script
-- Run this in Supabase SQL Editor to fix the customer_id mapping issue

-- Step 1: Drop existing foreign key constraint if it exists
ALTER TABLE traffic_data 
DROP CONSTRAINT IF EXISTS traffic_data_customer_id_fkey;

-- Step 2: Ensure both tables exist with correct structure
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  office_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  customer_id VARCHAR(100) UNIQUE NOT NULL,  -- This is the key field
  contract_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traffic_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL,  -- This must match customers.customer_id
  date DATE NOT NULL,
  traffic_volume INTEGER NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Create the correct foreign key constraint
-- This maps traffic_data.customer_id -> customers.customer_id (NOT customers.id)
ALTER TABLE traffic_data 
ADD CONSTRAINT traffic_data_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;

-- Step 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_traffic_customer_id ON traffic_data(customer_id);
CREATE INDEX IF NOT EXISTS idx_traffic_date ON traffic_data(date);

-- Step 5: Insert sample customers for testing
INSERT INTO customers (customer_name, office_name, service_type, customer_id, contract_id) VALUES
('TechCorp Solutions', 'Downtown Branch', 'Premium', 'TECH001', 'CONT2024001'),
('Global Industries', 'North Office', 'Standard', 'GLOB001', 'CONT2024002'),
('Innovation Labs', 'Tech Park', 'Enterprise', 'INNO001', 'CONT2024003'),
('Metro Services', 'Central Hub', 'Basic', 'METR001', 'CONT2024004'),
('Digital Dynamics', 'Silicon Valley', 'Premium', 'DIGI001', 'CONT2024005'),
('Test Company', 'Test Office', 'Test', 'TEST001', 'CONT2024006')
ON CONFLICT (customer_id) DO NOTHING;

-- Step 6: Disable RLS for development (enable for production)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_data DISABLE ROW LEVEL SECURITY;

-- Step 7: Verify the setup
SELECT 'Setup Complete' as status;

-- Step 8: Show the foreign key constraint details
SELECT
    tc.table_name,
    tc.constraint_name,
    kcu.column_name as local_column,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'traffic_data';

-- Step 9: Show created customers
SELECT customer_id, customer_name FROM customers ORDER BY customer_id;

-- Expected Output:
-- - Foreign key constraint: traffic_data.customer_id -> customers.customer_id
-- - 6 sample customers created
-- - Ready for traffic data import
