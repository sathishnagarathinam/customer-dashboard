# Supabase Setup Guide

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com/)
2. Click "Start your project" or "Sign up"
3. Create an account or sign in
4. Click "New project"
5. Choose your organization
6. Enter project details:
   - Name: `customer-dashboard`
   - Database Password: Create a strong password (save this!)
   - Region: Choose closest to your users
7. Click "Create new project"
8. Wait for the project to be ready (2-3 minutes)

## Step 2: Get Project Configuration

1. In your Supabase dashboard, go to Settings → API
2. Copy the following values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon public key** (starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

## Step 3: Update Application Configuration

Replace the configuration in `src/services/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase values
const supabaseUrl = 'https://dsnfnjhuixkpllnyixmi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbmZuamh1aXhrcGxsbnlpeG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NzkzOTMsImV4cCI6MjA3ODE1NTM5M30.JrFtG4tSyUWZ4JlbT2ZY1E6Wj5Z9r15_evzCaU14cHo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
export default supabase;
```

## Step 4: Create Database Tables

Go to your Supabase dashboard → SQL Editor and run these SQL commands:

### Create Customers Table
```sql
-- Create customers table
CREATE TABLE customers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_name VARCHAR(255) NOT NULL,
  office_name VARCHAR(255) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  customer_id VARCHAR(100) UNIQUE NOT NULL,
  contract_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster searches
CREATE INDEX idx_customers_customer_id ON customers(customer_id);
CREATE INDEX idx_customers_name ON customers(customer_name);
CREATE INDEX idx_customers_office ON customers(office_name);
```

### Create Traffic Data Table
```sql
-- Create traffic_data table
CREATE TABLE traffic_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id VARCHAR(100) NOT NULL,
  date DATE NOT NULL,
  traffic_volume INTEGER NOT NULL,
  revenue DECIMAL(10,2) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_traffic_customer_id ON traffic_data(customer_id);
CREATE INDEX idx_traffic_date ON traffic_data(date);
CREATE INDEX idx_traffic_service_type ON traffic_data(service_type);
```

### Create Updated At Trigger (Optional)
```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for customers table
CREATE TRIGGER update_customers_updated_at 
    BEFORE UPDATE ON customers 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Step 5: Set Row Level Security (RLS) Policies

For development, you can disable RLS or set permissive policies:

```sql
-- Disable RLS for development (NOT recommended for production)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_data DISABLE ROW LEVEL SECURITY;
```

Or set up basic policies:

```sql
-- Enable RLS
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_data ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (customize for production)
CREATE POLICY "Allow all operations on customers" ON customers
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on traffic_data" ON traffic_data
  FOR ALL USING (true) WITH CHECK (true);
```

## Step 6: Test the Connection

1. Install dependencies:
```bash
cd customer-dashboard
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open the browser console and check for any connection errors
4. Try adding a test customer to verify the setup

## Step 7: Insert Sample Data (Optional)

You can insert some sample data to test the application:

```sql
-- Insert sample customers
INSERT INTO customers (customer_name, office_name, service_type, customer_id, contract_id) VALUES
('TechCorp Solutions', 'Downtown Branch', 'Premium', 'TECH001', 'CONT2024001'),
('Global Industries', 'North Office', 'Standard', 'GLOB001', 'CONT2024002'),
('Innovation Labs', 'Tech Park', 'Enterprise', 'INNO001', 'CONT2024003'),
('Metro Services', 'Central Hub', 'Basic', 'METR001', 'CONT2024004'),
('Digital Dynamics', 'Silicon Valley', 'Premium', 'DIGI001', 'CONT2024005');

-- Insert sample traffic data
INSERT INTO traffic_data (customer_id, date, traffic_volume, revenue, service_type) VALUES
('TECH001', '2024-01-15', 15000, 7500.00, 'Premium'),
('GLOB001', '2024-01-15', 8000, 3200.00, 'Standard'),
('INNO001', '2024-01-15', 25000, 15000.00, 'Enterprise'),
('METR001', '2024-01-15', 5000, 1500.00, 'Basic'),
('DIGI001', '2024-01-15', 12000, 6000.00, 'Premium');
```

## Production Considerations

### Security
1. **Enable RLS**: Always enable Row Level Security in production
2. **Custom Policies**: Create specific policies based on your authentication needs
3. **API Keys**: Use service role key only on the server side
4. **Environment Variables**: Store keys in environment variables

### Performance
1. **Indexes**: Add appropriate indexes for your query patterns
2. **Connection Pooling**: Configure connection pooling for high traffic
3. **Caching**: Implement caching strategies for frequently accessed data

### Backup
1. **Point-in-time Recovery**: Enable automatic backups
2. **Export Data**: Regular data exports for additional safety

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check your project URL and API key
2. **Table Not Found**: Ensure you've created the tables with correct names
3. **Permission Denied**: Check RLS policies and table permissions
4. **Foreign Key Constraint**: Ensure customer exists before adding traffic data

### Debugging Tips

1. Check the Supabase dashboard logs
2. Use browser developer tools to inspect network requests
3. Test queries directly in the SQL Editor
4. Verify table structure in the Table Editor

## Supabase Dashboard URLs

- Project Dashboard: `https://supabase.com/dashboard/project/your-project-id`
- Table Editor: `https://supabase.com/dashboard/project/your-project-id/editor`
- SQL Editor: `https://supabase.com/dashboard/project/your-project-id/sql`
- API Settings: `https://supabase.com/dashboard/project/your-project-id/settings/api`

## Benefits of Supabase over Firebase

1. **Cost-Effective**: More generous free tier and predictable pricing
2. **SQL Database**: Full PostgreSQL with complex queries and joins
3. **Real-time**: Built-in real-time subscriptions
4. **Open Source**: Self-hostable and transparent
5. **Developer Experience**: Excellent tooling and documentation
6. **Performance**: Generally faster for complex queries

## Next Steps

After completing the setup:
1. Test all CRUD operations
2. Upload Excel files to test import functionality
3. Generate reports to verify data relationships
4. Set up proper authentication if needed
5. Configure production security policies
