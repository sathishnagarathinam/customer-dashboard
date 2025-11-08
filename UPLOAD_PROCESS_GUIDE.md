# 📊 Customer Dashboard Upload Process Guide

## 🎯 Overview

This guide explains the redesigned customer and traffic data upload processes that ensure data integrity and seamless database operations.

## 📋 Customer Data Upload Process

### Required Excel Columns (Exact Names)
Your Excel file must contain these exact column headers:

1. **Customer Name** - Full name of the customer company
2. **Office Name** - Name of the customer's office location  
3. **Service Type** - Type of service (e.g., Premium, Standard, Basic)
4. **Customer ID** - Unique identifier for the customer
5. **Contract ID** - Contract reference number

### Features
- ✅ **Duplicate Prevention**: Validates Customer IDs and Contract IDs to prevent duplicates before upload
- ✅ **Data Validation**: Validates all required fields and checks for duplicates within Excel file
- ✅ **Clear Error Messages**: Shows specific row numbers and duplicate IDs that need correction
- ✅ **Upload Prevention**: Stops upload process when duplicates are detected to maintain data integrity

### Sample Data Format
```
Customer Name          | Office Name      | Service Type | Customer ID | Contract ID
Acme Corporation      | New York Office  | Premium      | ACME001     | CONT_ACME_001
Global Tech Solutions | SF Office        | Standard     | GTS002      | CONT_GTS_002
```

## 🚦 Traffic Data Upload Process

### Required Excel Columns (Exact Names)
Your Excel file must contain these exact column headers:

1. **Customer ID** - Must match an existing Customer ID in the customers table
2. **Date** - Date in YYYY-MM-DD format
3. **Traffic** - Traffic volume (numeric, zero allowed)
4. **Revenue** - Revenue amount (numeric, zero allowed)
5. **Service Type** - Type of service

### Features
- ✅ **Foreign Key Validation**: Ensures Customer ID exists before allowing upload
- ✅ **Clear Error Messages**: Shows exactly which Customer IDs are missing
- ✅ **Data Integrity**: Maintains referential integrity between customers and traffic data
- ✅ **Comprehensive Feedback**: Detailed success/failure reporting

### Sample Data Format
```
Customer ID | Date       | Traffic | Revenue  | Service Type
ACME001     | 2024-01-15 | 15000   | 75000.00 | Premium
GTS002      | 2024-01-15 | 8500    | 34000.00 | Standard
```

## 🔄 Upload Process Flow

### For Customer Data:
1. Upload Excel file with exact column names
2. System validates all required fields
3. System checks for existing Customer IDs
4. New customers are inserted, existing ones are skipped
5. Clear summary shows inserted vs skipped records

### For Traffic Data:
1. Upload Excel file with exact column names
2. System validates all required fields
3. System verifies all Customer IDs exist in customers table
4. If missing Customer IDs found, upload fails with clear error message
5. If all Customer IDs valid, traffic data is inserted successfully

## ⚠️ Important Requirements

### Data Integrity Rules
- **Traffic data can only be uploaded AFTER customer data exists**
- **Customer ID in traffic data must exactly match Customer ID in customers table**
- **All column names must be exactly as specified (case-sensitive)**

### Upload Order
1. **First**: Upload customer data
2. **Second**: Upload traffic data (only after customers exist)

## 📈 Enhanced Reporting

The reporting system now provides:
- **Comprehensive Joins**: Automatically joins customer and traffic data
- **Complete Customer Information**: Shows customer name, office, contract details alongside traffic data
- **Enhanced Export**: Excel exports include full customer context with traffic data
- **Better Filtering**: Filter by customer, office, service type, and date ranges

## 🛠️ Sample Files

Use the provided sample files to understand the exact format:
- `sample-customers.xlsx` - Example customer data with correct column names
- `sample-traffic.xlsx` - Example traffic data with correct column names

## 💡 Tips for Success

1. **Use Exact Column Names**: Copy column headers from templates exactly
2. **Upload Order Matters**: Always upload customers before traffic data
3. **Check Customer IDs**: Ensure traffic data references existing Customer IDs
4. **Remove Empty Rows**: Clean up Excel files before upload
5. **Use Templates**: Download templates from the upload page for correct format

## 🚨 Common Issues & Solutions

### Issue: "Customer ID not found"
**Solution**: Upload customer data first, or verify Customer IDs exist in customers table

### Issue: "Column not found" 
**Solution**: Use exact column names as specified (case-sensitive)

### Issue: "Customer ID [ID] already exists in the system"
**Solution**: Remove or change the duplicate Customer ID in your Excel file before retrying upload

### Issue: "Contract ID [ID] already exists in the system"
**Solution**: Remove or change the duplicate Contract ID in your Excel file before retrying upload

### Issue: "Duplicate Customer ID found in Excel file"
**Solution**: Check your Excel file for duplicate Customer IDs within the same file and remove duplicates

### Issue: "Invalid date format"
**Solution**: Use YYYY-MM-DD format for dates (e.g., 2024-01-15)

## 📞 Support

If you encounter issues:
1. Check this guide first
2. Verify column names match exactly
3. Ensure upload order (customers first, then traffic)
4. Use provided sample files as reference
