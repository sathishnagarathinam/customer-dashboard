# Setup Guide: Traffic Upload Revert Feature

## Quick Setup (2 Steps)

### Step 1: Run Database Migration
You need to add the `batch_id` column to your `traffic_data` table in Supabase.

1. **Open Supabase SQL Editor:**
   - Go to your Supabase project dashboard
   - Click **SQL Editor** in the left sidebar
   - Click **New Query**

2. **Run this SQL:**
   ```sql
   -- Add batch_id column for upload tracking
   ALTER TABLE traffic_data 
   ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100);

   -- Create indexes for performance
   CREATE INDEX IF NOT EXISTS idx_traffic_data_batch_id ON traffic_data(batch_id);
   CREATE INDEX IF NOT EXISTS idx_traffic_data_created_at ON traffic_data(created_at);
   ```

3. **Click "Run"** to execute the migration

### Step 2: Test the Feature
1. Go to the Upload page in your application
2. Select "Traffic & Revenue Data"
3. Upload a traffic data Excel file
4. After successful upload, you should see a **"Revert Last Upload"** button appear
5. Click the button to test reverting the upload

## That's It! 🎉

The revert feature is now ready to use.

## What You Can Do Now

### Revert an Upload
1. Navigate to **Upload** page
2. Select **Traffic & Revenue Data** tab
3. If there's a recent upload, you'll see: **"Revert Last Upload (X records)"**
4. Click the button
5. Confirm the action in the dialog
6. All records from that upload will be deleted

### Upload New Data
- All new traffic uploads will automatically be tracked with a batch_id
- You can revert any upload made after this migration
- Old uploads (before migration) cannot be reverted

## Troubleshooting

### "No recent upload found to revert"
- This means there are no traffic records with a batch_id
- Upload new traffic data to create a tracked batch

### Button doesn't appear
- Make sure you're on the "Traffic & Revenue Data" tab (not "Customer Data")
- Check that you've run the database migration
- Verify that you have uploaded traffic data after the migration

### Error during revert
- Check browser console for error messages
- Verify database connection
- Ensure the batch_id column exists in traffic_data table

## Alternative: Use Pre-made Script

Instead of copying the SQL above, you can use the pre-made migration script:

1. Open `add-batch-id-column.sql` file in this repository
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click Run

This script includes additional verification queries to confirm the migration was successful.

## Need Help?

See the full documentation in `REVERT-UPLOAD-FEATURE.md` for:
- Detailed feature explanation
- Usage examples
- Technical details
- Best practices

