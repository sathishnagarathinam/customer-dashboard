# Fix Customer Upload Error - Missing payment_type Column

## Error Message
```
Upload Failed
Failed to bulk import customers: Could not find the 'payment_type' column of 'customers' in the schema cache
```

## Problem
The `payment_type` column is missing from your `customers` table in the Supabase database.

## Solution

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run the SQL Script
Copy and paste the following SQL script into the SQL Editor:

```sql
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
```

### Step 3: Click "Run" Button
Click the **Run** button in the SQL Editor to execute the script.

### Step 4: Verify Success
You should see a success message: "Payment type column added successfully!"

### Step 5: Try Upload Again
Go back to your Customer Dashboard application and try uploading the customer data again. The upload should now work!

## Alternative: Use the Pre-made Script
You can also use the pre-made SQL file:
- Open `customer-dashboard/quick-fix-payment-type.sql`
- Copy the entire contents
- Paste into Supabase SQL Editor
- Click Run

## What This Does
- Adds a `payment_type` column to the `customers` table
- Sets the default value to `'Advance'` for all customers
- Allows only two values: `'Advance'` or `'BNPL'`
- Updates all existing customers to have `payment_type = 'Advance'`
- Creates an index for better performance

## After Running the Script
Your customer upload should work normally. The `payment_type` field in your Excel file is optional:
- If you include it in the Excel file, it will use the value from the file
- If you don't include it, it will default to `'Advance'`

