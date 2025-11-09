import * as XLSX from 'xlsx';
import { Customer, TrafficData, ExcelUploadResult, ValidationError } from '../types';
import { supabase } from './supabase';

export const excelService = {
  // Parse Excel file for customer data
  parseCustomerExcel(file: File): Promise<ExcelUploadResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const { validData, errors } = excelService.validateCustomerData(jsonData);
          
          resolve({
            success: errors.length === 0,
            data: validData,
            errors: errors.length > 0 ? errors : undefined,
            message: errors.length === 0 
              ? `Successfully parsed ${validData.length} customer records`
              : `Parsed ${validData.length} valid records with ${errors.length} errors`
          });
        } catch (error) {
          resolve({
            success: false,
            message: 'Failed to parse Excel file',
            errors: ['Invalid Excel file format']
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read file',
          errors: ['File reading error']
        });
      };
      
      reader.readAsArrayBuffer(file);
    });
  },

  // Parse Excel file for traffic data
  parseTrafficExcel(file: File): Promise<ExcelUploadResult> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          const { validData, errors } = excelService.validateTrafficData(jsonData);
          
          resolve({
            success: errors.length === 0,
            data: validData,
            errors: errors.length > 0 ? errors : undefined,
            message: errors.length === 0 
              ? `Successfully parsed ${validData.length} traffic records`
              : `Parsed ${validData.length} valid records with ${errors.length} errors`
          });
        } catch (error) {
          resolve({
            success: false,
            message: 'Failed to parse Excel file',
            errors: ['Invalid Excel file format']
          });
        }
      };
      
      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read file',
          errors: ['File reading error']
        });
      };
      
      reader.readAsArrayBuffer(file);
    });
  },

  // Validate customer data from Excel - using exact column names as specified
  validateCustomerData(data: any[]): { validData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[]; errors: string[] } {
    const validData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const errors: string[] = [];

    // Required exact column names: 'Customer Name', 'Office Name', 'Service Type', 'Customer ID', 'Contract ID'

    // Track duplicate contract_id within the Excel file itself
    // Note: Multiple rows with same customer_id are allowed as long as contract_id is different
    const contractIdTracker = new Map<string, number[]>();

    data.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (accounting for header)
      const validationErrors: ValidationError[] = [];

      // Validate required fields using exact column names
      if (!row['Customer Name'] || String(row['Customer Name']).trim() === '') {
        validationErrors.push({ field: 'Customer Name', message: 'Customer Name is required' });
      }
      if (!row['Office Name'] || String(row['Office Name']).trim() === '') {
        validationErrors.push({ field: 'Office Name', message: 'Office Name is required' });
      }
      if (!row['Service Type'] || String(row['Service Type']).trim() === '') {
        validationErrors.push({ field: 'Service Type', message: 'Service Type is required' });
      }
      if (!row['Customer ID'] || String(row['Customer ID']).trim() === '') {
        validationErrors.push({ field: 'Customer ID', message: 'Customer ID is required' });
      }
      if (!row['Contract ID'] || String(row['Contract ID']).trim() === '') {
        validationErrors.push({ field: 'Contract ID', message: 'Contract ID is required' });
      }

      // Check for duplicate contract_id within the Excel file
      // Note: Same customer_id is allowed with different contract_id values
      const customerId = String(row['Customer ID'] || '').trim();
      const contractId = String(row['Contract ID'] || '').trim();

      if (contractId) {
        if (contractIdTracker.has(contractId)) {
          contractIdTracker.get(contractId)!.push(rowNumber);
        } else {
          contractIdTracker.set(contractId, [rowNumber]);
        }
      }

      if (validationErrors.length > 0) {
        errors.push(`Row ${rowNumber}: ${validationErrors.map(e => e.message).join(', ')}`);
      } else {
        validData.push({
          customerName: String(row['Customer Name']).trim(),
          officeName: String(row['Office Name']).trim(),
          serviceType: String(row['Service Type']).trim(),
          customerId: customerId,
          contractId: contractId
        });
      }
    });

    // Check for duplicate contract_id within the Excel file and add errors
    // Note: Multiple customer_id entries are allowed as long as contract_id is unique
    contractIdTracker.forEach((rows, contractId) => {
      if (rows.length > 1) {
        errors.push(`Duplicate Contract ID "${contractId}" found in Excel file at rows: ${rows.join(', ')}. Each contract must have a unique Contract ID.`);
      }
    });

    return { validData, errors };
  },

  // Check for duplicate Contract IDs in the database
  // Note: Multiple customer_id entries are allowed, but contract_id must be unique
  async checkDatabaseDuplicates(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<{ duplicateErrors: string[]; hasDuplicates: boolean }> {
    const duplicateErrors: string[] = [];

    try {
      // Extract all Contract IDs from the data (contract_id is the unique identifier)
      const contractIds = customerData.map(c => c.contractId);

      // Check for existing Contract IDs in database
      const { data: existingContractIds, error: contractError } = await supabase
        .from('customers')
        .select('contract_id, customer_id, customer_name')
        .in('contract_id', contractIds);

      if (contractError) {
        throw new Error(`Failed to check existing Contract IDs: ${contractError.message}`);
      }

      // Create set for faster lookup of existing contract IDs
      const existingContractIdSet = new Set(existingContractIds?.map((c: any) => c.contract_id) || []);

      // Check each customer record for duplicate contract IDs and identify row numbers
      customerData.forEach((customer, index) => {
        const rowNumber = index + 2; // Excel row number (accounting for header)

        if (existingContractIdSet.has(customer.contractId)) {
          // Find the existing contract details for better error message
          const existingContract = existingContractIds?.find((c: any) => c.contract_id === customer.contractId);
          duplicateErrors.push(`Row ${rowNumber}: Contract ID "${customer.contractId}" already exists in the system (Customer: ${existingContract?.customer_name || existingContract?.customer_id || 'Unknown'})`);
        }
      });

      return {
        duplicateErrors,
        hasDuplicates: duplicateErrors.length > 0
      };

    } catch (error) {
      console.error('Error checking database duplicates:', error);
      return {
        duplicateErrors: [`Database error: ${(error as Error).message}`],
        hasDuplicates: true
      };
    }
  },

  // Validate traffic data from Excel - using exact column names as specified
  validateTrafficData(data: any[]): { validData: Omit<TrafficData, 'id' | 'createdAt'>[]; errors: string[] } {
    const validData: Omit<TrafficData, 'id' | 'createdAt'>[] = [];
    const errors: string[] = [];

    // Required exact column names: 'Customer ID', 'Date', 'Traffic', 'Revenue', 'Service Type'

    // Track duplicates within the Excel file (Customer ID + Date combinations)
    const customerDateTracker = new Map<string, number[]>();

    data.forEach((row, index) => {
      const rowNumber = index + 2;
      const validationErrors: ValidationError[] = [];

      // Validate required fields using exact column names
      if (!row['Customer ID'] || String(row['Customer ID']).trim() === '') {
        validationErrors.push({ field: 'Customer ID', message: 'Customer ID is required' });
      }
      if (!row['Date']) {
        validationErrors.push({ field: 'Date', message: 'Date is required' });
      }

      // Check for Traffic - allow zero values
      const traffic = row['Traffic'];
      if (traffic === undefined || traffic === null || traffic === '' || isNaN(Number(traffic))) {
        validationErrors.push({ field: 'Traffic', message: 'Valid Traffic is required (zero is allowed)' });
      }

      // Check for Revenue - allow zero values
      const revenue = row['Revenue'];
      if (revenue === undefined || revenue === null || revenue === '' || isNaN(Number(revenue))) {
        validationErrors.push({ field: 'Revenue', message: 'Valid Revenue is required (zero is allowed)' });
      }

      if (!row['Service Type'] || String(row['Service Type']).trim() === '') {
        validationErrors.push({ field: 'Service Type', message: 'Service Type is required' });
      }

      // Process date and check for duplicates within Excel file
      const customerId = String(row['Customer ID'] || '').trim();
      const dateValue = row['Date'];
      let parsedDate: Date;

      if (dateValue) {
        if (typeof dateValue === 'number') {
          // Excel date serial number
          parsedDate = new Date((dateValue - 25569) * 86400 * 1000);
        } else {
          parsedDate = new Date(dateValue);
        }

        if (!isNaN(parsedDate.getTime()) && customerId) {
          // Create unique key for Customer ID + Date combination
          const dateString = parsedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          const customerDateKey = `${customerId}|${dateString}`;

          if (customerDateTracker.has(customerDateKey)) {
            customerDateTracker.get(customerDateKey)!.push(rowNumber);
          } else {
            customerDateTracker.set(customerDateKey, [rowNumber]);
          }
        }
      }

      if (validationErrors.length > 0) {
        errors.push(`Row ${rowNumber}: ${validationErrors.map(e => e.message).join(', ')}`);
      } else {
        if (typeof dateValue === 'number') {
          // Excel date serial number
          parsedDate = new Date((dateValue - 25569) * 86400 * 1000);
        } else {
          parsedDate = new Date(dateValue);
        }

        if (isNaN(parsedDate.getTime())) {
          errors.push(`Row ${rowNumber}: Invalid date format`);
        } else {
          validData.push({
            customerId: customerId,
            date: parsedDate,
            trafficVolume: Number(row['Traffic']),
            revenue: Number(row['Revenue']),
            serviceType: String(row['Service Type']).trim()
          });
        }
      }
    });

    // Check for duplicates within the Excel file (same Customer ID + Date)
    customerDateTracker.forEach((rows, customerDateKey) => {
      if (rows.length > 1) {
        const [customerId, date] = customerDateKey.split('|');
        errors.push(`Duplicate traffic entry for Customer ID "${customerId}" on date "${date}" found in Excel file at rows: ${rows.join(', ')}`);
      }
    });

    return { validData, errors };
  },

  // Check for duplicate traffic entries and validate Customer IDs in the database
  async checkTrafficDatabaseValidation(trafficData: Omit<TrafficData, 'id' | 'createdAt'>[]): Promise<{ validationErrors: string[]; hasErrors: boolean }> {
    const validationErrors: string[] = [];

    try {
      // Extract unique Customer IDs from the traffic data
      const uniqueCustomerIds = [...new Set(trafficData.map(t => t.customerId))];

      // Check if all Customer IDs exist in the customers table
      const { data: existingCustomers, error: customerError } = await supabase
        .from('customers')
        .select('customer_id')
        .in('customer_id', uniqueCustomerIds);

      if (customerError) {
        throw new Error(`Failed to check existing Customer IDs: ${customerError.message}`);
      }

      const existingCustomerIds = new Set(existingCustomers?.map((c: any) => c.customer_id) || []);

      // Check for non-existent Customer IDs
      trafficData.forEach((traffic, index) => {
        const rowNumber = index + 2; // Excel row number (accounting for header)

        if (!existingCustomerIds.has(traffic.customerId)) {
          validationErrors.push(`Row ${rowNumber}: Customer ID "${traffic.customerId}" does not exist in the customer table`);
        }
      });

      // If there are invalid Customer IDs, don't proceed with duplicate checking
      if (validationErrors.length > 0) {
        return {
          validationErrors,
          hasErrors: true
        };
      }

      // Check for existing traffic entries (Customer ID + Date combinations) in database
      const trafficChecks = trafficData.map(traffic => ({
        customer_id: traffic.customerId,
        date: traffic.date.toISOString().split('T')[0] // YYYY-MM-DD format
      }));

      // Build a query to check for existing Customer ID + Date combinations
      const existingTrafficPromises = trafficChecks.map(async (check) => {
        const { data, error } = await supabase
          .from('traffic_data')
          .select('customer_id, date')
          .eq('customer_id', check.customer_id)
          .eq('date', check.date)
          .limit(1);

        if (error) {
          throw new Error(`Failed to check existing traffic data: ${error.message}`);
        }

        return {
          customerDate: `${check.customer_id}|${check.date}`,
          exists: data && data.length > 0
        };
      });

      const existingTrafficResults = await Promise.all(existingTrafficPromises);
      const existingTrafficSet = new Set(
        existingTrafficResults
          .filter(result => result.exists)
          .map(result => result.customerDate)
      );

      // Check each traffic record for database duplicates
      trafficData.forEach((traffic, index) => {
        const rowNumber = index + 2; // Excel row number (accounting for header)
        const dateString = traffic.date.toISOString().split('T')[0];
        const customerDateKey = `${traffic.customerId}|${dateString}`;

        if (existingTrafficSet.has(customerDateKey)) {
          validationErrors.push(`Row ${rowNumber}: Traffic entry for Customer ID "${traffic.customerId}" on date "${dateString}" already exists in the system`);
        }
      });

      return {
        validationErrors,
        hasErrors: validationErrors.length > 0
      };

    } catch (error) {
      console.error('Error checking traffic database validation:', error);
      return {
        validationErrors: [`Database error: ${(error as Error).message}`],
        hasErrors: true
      };
    }
  },

  // Export data to Excel
  exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1'): void {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }
};
