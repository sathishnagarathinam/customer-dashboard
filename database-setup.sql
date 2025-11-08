-- Customer Dashboard Database Setup
-- Run this script in your Supabase SQL Editor

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  office_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  customer_id VARCHAR(100) UNIQUE NOT NULL,
  contract_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create traffic_data table with proper foreign key mapping
CREATE TABLE IF NOT EXISTS traffic_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  traffic_volume INTEGER NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint separately to ensure proper mapping
-- This references customers.customer_id (not customers.id)
ALTER TABLE traffic_data
DROP CONSTRAINT IF EXISTS traffic_data_customer_id_fkey;

ALTER TABLE traffic_data
ADD CONSTRAINT traffic_data_customer_id_fkey
FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON customers(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_office ON customers(office_name);
CREATE INDEX IF NOT EXISTS idx_traffic_customer_id ON traffic_data(customer_id);
CREATE INDEX IF NOT EXISTS idx_traffic_date ON traffic_data(date);
CREATE INDEX IF NOT EXISTS idx_traffic_service_type ON traffic_data(service_type);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for customers table
DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Disable RLS for development (enable and configure for production)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_data DISABLE ROW LEVEL SECURITY;

-- Insert sample customers for testing (REQUIRED for traffic data foreign key)
INSERT INTO customers (customer_name, office_name, service_type, customer_id, contract_id) VALUES
('TechCorp Solutions', 'Downtown Branch', 'Premium', 'TECH001', 'CONT2024001'),
('Global Industries', 'North Office', 'Standard', 'GLOB001', 'CONT2024002'),
('Innovation Labs', 'Tech Park', 'Enterprise', 'INNO001', 'CONT2024003'),
('Metro Services', 'Central Hub', 'Basic', 'METR001', 'CONT2024004'),
('Digital Dynamics', 'Silicon Valley', 'Premium', 'DIGI001', 'CONT2024005'),
('Test Company', 'Test Office', 'Test', 'TEST001', 'CONT2024006')
ON CONFLICT (customer_id) DO NOTHING;

-- Insert sample traffic data
INSERT INTO traffic_data (customer_id, date, traffic_volume, revenue, service_type) VALUES
('TECH001', '2024-01-15', 15000, 7500.00, 'Premium'),
('GLOB001', '2024-01-15', 8000, 3200.00, 'Standard'),
('INNO001', '2024-01-15', 25000, 15000.00, 'Enterprise'),
('METR001', '2024-01-15', 5000, 1500.00, 'Basic'),
('DIGI001', '2024-01-15', 12000, 6000.00, 'Premium'),
('TECH001', '2024-01-16', 16500, 8250.00, 'Premium'),
('GLOB001', '2024-01-16', 7500, 3000.00, 'Standard'),
('INNO001', '2024-01-16', 28000, 16800.00, 'Enterprise'),
('METR001', '2024-01-16', 4800, 1440.00, 'Basic'),
('DIGI001', '2024-01-16', 13200, 6600.00, 'Premium')
ON CONFLICT DO NOTHING;

-- Verify the setup
SELECT 'Customers table created' as status, COUNT(*) as record_count FROM customers
UNION ALL
SELECT 'Traffic data table created' as status, COUNT(*) as record_count FROM traffic_data;
