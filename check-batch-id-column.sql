-- Quick check to see if batch_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'traffic_data' 
  AND column_name = 'batch_id';

-- If the above query returns 0 rows, the column doesn't exist yet
-- Run the migration from add-batch-id-column.sql

