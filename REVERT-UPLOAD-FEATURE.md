# Traffic Upload Revert Feature

## Overview
Added a "Revert Last Upload" feature that allows users to undo the most recent traffic data upload. This is useful when incorrect data is uploaded or when you need to re-upload corrected data.

## How It Works

### 1. Batch Tracking
Every traffic data upload is now assigned a unique `batch_id` that tracks all records uploaded together:
- Format: `batch_[timestamp]_[random]` (e.g., `batch_1699876543210_abc123`)
- Stored in the `batch_id` column of the `traffic_data` table
- Allows grouping and reverting entire upload batches

### 2. User Interface
When viewing the Upload page with "Traffic & Revenue Data" selected:
- If there's a recent upload, a **"Revert Last Upload"** button appears in the top-right
- The button shows the number of records in the last upload
- Hovering over the button shows the upload timestamp

### 3. Revert Process
1. Click the "Revert Last Upload" button
2. A confirmation dialog appears showing:
   - Number of records to be deleted
   - Upload timestamp
   - Warning that the action cannot be undone
3. Click "OK" to confirm or "Cancel" to abort
4. All records from that batch are deleted from the database
5. Success message is displayed
6. The button updates to show the next most recent upload (if any)

## Database Changes

### New Column: `batch_id`
- **Table:** `traffic_data`
- **Type:** `VARCHAR(100)`
- **Nullable:** Yes (to support existing records)
- **Indexed:** Yes (for fast batch queries)

### Migration Script
Run the SQL script `add-batch-id-column.sql` in Supabase SQL Editor:

```sql
-- Add batch_id column
ALTER TABLE traffic_data 
ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_traffic_data_batch_id ON traffic_data(batch_id);
CREATE INDEX IF NOT EXISTS idx_traffic_data_created_at ON traffic_data(created_at);
```

## Code Changes

### 1. Traffic Service (`src/services/trafficService.ts`)

#### New Methods:
- **`getLastUploadBatch()`** - Retrieves information about the most recent upload batch
- **`revertLastUpload()`** - Deletes all records from the last upload batch

#### Updated Method:
- **`bulkCreateTrafficData()`** - Now generates and assigns a `batch_id` to all uploaded records

### 2. Upload Page (`src/pages/Upload.tsx`)

#### New State:
- `lastUploadInfo` - Stores information about the last upload (batch ID, count, timestamp)
- `reverting` - Tracks whether a revert operation is in progress

#### New Functions:
- `loadLastUploadInfo()` - Fetches the last upload batch information
- `handleRevertLastUpload()` - Handles the revert operation with confirmation

#### UI Changes:
- Added "Revert Last Upload" button (only visible for traffic uploads when a batch exists)
- Button shows record count and is disabled during revert operation
- Automatically reloads last upload info after successful upload or revert

## Usage Example

### Scenario: Uploaded Wrong Data
1. User uploads traffic data Excel file with 100 records
2. Realizes the data is incorrect
3. Clicks "Revert Last Upload (100 records)" button
4. Confirms the action in the dialog
5. All 100 records are deleted
6. User can now upload the corrected data

### Scenario: Multiple Uploads
1. User uploads Batch A (50 records) on Monday
2. User uploads Batch B (75 records) on Tuesday
3. "Revert Last Upload" shows Batch B (75 records)
4. After reverting Batch B, button updates to show Batch A (50 records)
5. User can continue reverting previous batches if needed

## Important Notes

### ⚠️ Limitations
- **Only works for traffic data uploads** (not customer uploads)
- **Cannot revert individual records** - entire batch is reverted
- **Action is permanent** - deleted records cannot be recovered (unless you have a database backup)
- **Old records without batch_id** - Records uploaded before this feature was added cannot be reverted using this feature

### ✅ Best Practices
1. **Verify data before uploading** - Use the preview feature to check data
2. **Keep backup Excel files** - In case you need to re-upload after reverting
3. **Revert immediately** - If you notice an error, revert before uploading more data
4. **Check the timestamp** - Make sure you're reverting the correct upload

## Technical Details

### Batch ID Generation
```typescript
const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
```
- Uses current timestamp for uniqueness and chronological ordering
- Adds random suffix to prevent collisions if multiple uploads happen simultaneously

### Database Query for Last Batch
```sql
SELECT batch_id, created_at, COUNT(*) as count
FROM traffic_data
WHERE batch_id IS NOT NULL
GROUP BY batch_id, created_at
ORDER BY created_at DESC
LIMIT 1;
```

### Delete Query
```sql
DELETE FROM traffic_data
WHERE batch_id = '[batch_id]';
```

## Future Enhancements
Potential improvements for future versions:
- View history of all upload batches
- Revert specific batches (not just the last one)
- Batch comparison before revert
- Export batch data before reverting
- Undo revert functionality (restore from soft delete)

