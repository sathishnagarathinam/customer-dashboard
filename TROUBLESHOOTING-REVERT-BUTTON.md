# Troubleshooting: "Revert Last Upload" Button Not Showing

## Why the Button Isn't Visible

The "Revert Last Upload" button will **ONLY** appear when **ALL** of these conditions are met:

### ✅ Checklist:

1. **You're on the correct tab**
   - Must be on "Traffic & Revenue Data" tab (NOT "Customer Data")
   
2. **Database migration has been run**
   - The `batch_id` column must exist in the `traffic_data` table
   
3. **You've uploaded traffic data AFTER the migration**
   - Old uploads (before adding batch_id column) won't have a batch_id
   - You need to upload NEW traffic data after running the migration

## Step-by-Step Fix

### Step 1: Check if Migration Was Run

Run this SQL in Supabase SQL Editor:

```sql
-- Check if batch_id column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'traffic_data' 
  AND column_name = 'batch_id';
```

**Expected Result:**
- If you see 1 row with `batch_id | character varying | YES` → ✅ Migration done
- If you see 0 rows → ❌ Need to run migration

### Step 2: Run Migration (if needed)

If the column doesn't exist, run this SQL:

```sql
-- Add batch_id column
ALTER TABLE traffic_data 
ADD COLUMN IF NOT EXISTS batch_id VARCHAR(100);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_traffic_data_batch_id ON traffic_data(batch_id);
CREATE INDEX IF NOT EXISTS idx_traffic_data_created_at ON traffic_data(created_at);
```

### Step 3: Upload New Traffic Data

1. Go to Upload page
2. Select "Traffic & Revenue Data" tab
3. Upload a traffic Excel file
4. Wait for success message
5. The "Revert Last Upload" button should now appear!

### Step 4: Check Browser Console

Open browser DevTools (F12) and look for these console messages:

**When you switch to "Traffic & Revenue Data" tab:**
```
Loading last upload info...
Last upload batch response: {success: true, data: {...}}
Setting last upload info: {batchId: "...", count: X, uploadedAt: ...}
```

**If no upload exists:**
```
Loading last upload info...
Last upload batch response: {success: true, data: null}
No last upload found or error: undefined
```

## Common Issues

### Issue 1: "No recent upload found" message shows
**Cause:** No traffic data has been uploaded with a batch_id

**Solution:** Upload new traffic data (after running the migration)

### Issue 2: Button doesn't appear after upload
**Cause:** Upload might have failed or batch_id wasn't saved

**Solution:** 
1. Check browser console for errors
2. Verify the upload was successful
3. Check database to see if records have batch_id:
   ```sql
   SELECT batch_id, COUNT(*) 
   FROM traffic_data 
   WHERE batch_id IS NOT NULL
   GROUP BY batch_id
   ORDER BY MAX(created_at) DESC
   LIMIT 5;
   ```

### Issue 3: Error in console about batch_id column
**Cause:** Migration wasn't run or failed

**Solution:** Run the migration SQL again (it's safe to run multiple times)

### Issue 4: Old uploads don't show revert button
**Cause:** Old uploads don't have a batch_id (uploaded before migration)

**Solution:** This is expected behavior. Only NEW uploads (after migration) can be reverted.

## Verify Everything is Working

### Test 1: Check Database
```sql
-- See all batches
SELECT 
    batch_id,
    COUNT(*) as record_count,
    MIN(created_at) as uploaded_at
FROM traffic_data 
WHERE batch_id IS NOT NULL
GROUP BY batch_id
ORDER BY MIN(created_at) DESC;
```

### Test 2: Check UI
1. Open Upload page
2. Select "Traffic & Revenue Data"
3. You should see either:
   - **"Revert Last Upload (X records)"** button (if uploads exist)
   - **"No recent upload found. Upload traffic data to enable revert."** message (if no uploads)

### Test 3: Upload and Revert
1. Upload a small test traffic file (5-10 rows)
2. Button should appear: "Revert Last Upload (X records)"
3. Click the button
4. Confirm the dialog
5. Records should be deleted
6. Button should disappear or show previous batch

## Still Not Working?

### Check These:

1. **Browser cache:** Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Code changes:** Make sure latest code is pulled from GitHub
3. **Dev server:** Restart the dev server (`npm run dev`)
4. **Supabase connection:** Check if other features work (Reports, etc.)

### Debug Mode

The page now shows debug information:
- When on "Traffic & Revenue Data" tab with no uploads, you'll see:
  > "No recent upload found. Upload traffic data to enable revert."

- Check browser console for detailed logs about:
  - When `loadLastUploadInfo()` is called
  - What response is received from the API
  - Whether `lastUploadInfo` state is being set

## Quick Test

Want to quickly test if everything works?

1. **Run migration** (Step 2 above)
2. **Create a test Excel file** with these columns:
   - Contract ID
   - Date
   - Traffic Volume
   - Revenue
   - Service Type
3. **Add 2-3 test rows**
4. **Upload the file**
5. **Button should appear immediately**

## Need More Help?

Check these files for more information:
- `SETUP-REVERT-FEATURE.md` - Setup instructions
- `REVERT-UPLOAD-FEATURE.md` - Full feature documentation
- `add-batch-id-column.sql` - Complete migration script with verification

