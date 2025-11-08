# Customer Dashboard Testing Guide

## 🚀 Dashboard is Running!

Your Customer Dashboard is now live at: **http://localhost:3000**

## 📱 Responsiveness Fixes Applied

✅ **Mobile Navigation**: Hamburger menu for mobile devices  
✅ **Responsive Layout**: Better breakpoints (lg: instead of md:)  
✅ **Mobile-Friendly Upload**: Stacked buttons on mobile  
✅ **Improved Spacing**: Better padding and margins for mobile  

## 🧪 Testing the Upload Functionality

### Step 1: Set Up Database (If Not Done)
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/dsnfnjhuixkpllnyixmi/sql)
2. Copy and paste the contents of `database-setup.sql`
3. Click "Run" to create tables and sample data

### Step 2: Test Excel Upload
I've created sample Excel files for you to test:

**Files Created:**
- `sample-customers.xlsx` - Sample customer data
- `sample-traffic.xlsx` - Sample traffic data

**To Test Upload:**
1. Go to **Upload Data** page in the dashboard
2. Select "Customer Data" tab
3. Click "Choose File" or drag & drop `sample-customers.xlsx`
4. You should see:
   - File processing message
   - Preview of data (first 10 rows)
   - Success/error messages in console (F12 Developer Tools)

### Step 3: Check Console for Debugging
Open browser Developer Tools (F12) and check Console tab for:
- File processing logs
- Any error messages
- Upload progress information

## 🔧 Expected Excel Format

### Customer Data Excel Columns:
- **Customer Name**: Text (e.g., "TechCorp Solutions")
- **Office Name**: Text (e.g., "Downtown Branch")  
- **Service Type**: Text (e.g., "Premium", "Standard", "Enterprise", "Basic")
- **Customer ID**: Text (e.g., "TECH001")
- **Contract ID**: Text (e.g., "CONT2024001")

### Traffic Data Excel Columns:
- **Customer ID**: Text (must match existing customer)
- **Date**: Date (YYYY-MM-DD format)
- **Traffic Volume**: Number
- **Revenue**: Number (decimal)
- **Service Type**: Text

## 🐛 Troubleshooting

### Upload Not Working?
1. **Check Console**: Open F12 → Console tab for error messages
2. **File Format**: Ensure file is .xlsx or .xls
3. **Column Names**: Must match exactly (case-sensitive)
4. **Database**: Ensure Supabase tables are created

### Responsiveness Issues?
1. **Test Different Screen Sizes**: Use browser dev tools device emulation
2. **Check Mobile Menu**: Hamburger menu should appear on mobile
3. **Button Layout**: Upload buttons should stack on mobile

### Database Connection Issues?
1. **Test Connection**: Use the `test-connection.html` file I created
2. **Check Credentials**: Verify Supabase URL and key in `src/services/supabase.ts`
3. **RLS Policies**: Ensure Row Level Security is disabled for development

## 📊 Features to Test

### ✅ Dashboard Overview
- Statistics cards
- Charts and graphs
- Responsive layout

### ✅ Customer Management
- Add/Edit/Delete customers
- Search functionality
- Mobile-friendly forms

### ✅ Traffic Data
- Add traffic records
- Filter by date/customer
- Mobile table scrolling

### ✅ Excel Import/Export
- Upload customer data
- Upload traffic data
- Download templates
- Export reports

### ✅ Reports
- Generate filtered reports
- Export to Excel/PDF
- Mobile-friendly tables

## 🎯 Next Steps

1. **Test Upload**: Try uploading the sample Excel files
2. **Check Mobile**: Test on different screen sizes
3. **Verify Database**: Ensure data is being saved to Supabase
4. **Test All Features**: Navigate through all pages and test functionality

## 📞 Need Help?

If you encounter any issues:
1. Check the browser console (F12) for error messages
2. Verify database setup in Supabase
3. Test the connection using `test-connection.html`
4. Let me know what specific error you're seeing!
