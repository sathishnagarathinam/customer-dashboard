-- ============================================================================
-- ADD BATCH_ID COLUMN TO TRAFFIC_DATA TABLE
-- ============================================================================
-- This script adds a batch_id column to track upload batches for revert functionality

-- Step 1: Check current traffic_data table structure
SELECT 'CURRENT TRAFFIC_DATA TABLE STRUCTURE' as step;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'traffic_data' 
ORDER BY ordinal_position;

-- Step 2: Add batch_id column
SELECT 'ADDING BATCH_ID COLUMN' as step;

-- Add the batch_id column (nullable to support existing records)
ALTER TABLE traffic_data 
ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100);

-- Create an index for better query performance when filtering by batch_id
CREATE INDEX IF NOT EXISTS idx_traffic_data_batch_id ON traffic_data(batch_id);

-- Create an index on created_at for faster "last upload" queries
CREATE INDEX IF NOT EXISTS idx_traffic_data_created_at ON traffic_data(created_at);

-- Step 3: Verify the changes
SELECT 'VERIFICATION - AFTER ADDING BATCH_ID' as step;

-- Check updated table structure
SELECT 'Updated traffic_data table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'traffic_data' 
ORDER BY ordinal_position;

-- Check indexes
SELECT 'Traffic data indexes:' as info;
SELECT indexname, indexdef
FROM pg_indexes 
WHERE tablename = 'traffic_data'
ORDER BY indexname;

-- Check if there are any records with batch_id
SELECT 'Batch ID distribution:' as info;
SELECT 
    CASE 
        WHEN batch_id IS NULL THEN 'No Batch ID (Old Records)'
        ELSE 'Has Batch ID'
    END as batch_status,
    COUNT(*) as record_count
FROM traffic_data 
GROUP BY batch_status
ORDER BY batch_status;

SELECT 'BATCH_ID COLUMN ADDED SUCCESSFULLY!' as status,
       'New uploads will be tracked with batch_id for revert functionality' as details;

