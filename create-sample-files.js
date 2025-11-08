// Script to create sample Excel files with exact column names
import XLSX from 'xlsx';

// Create sample customer data with exact column names
const sampleCustomers = [
  {
    'Customer Name': 'Acme Corporation',
    'Office Name': 'New York Office',
    'Service Type': 'Premium',
    'Customer ID': 'ACME001',
    'Contract ID': 'CONT_ACME_001'
  },
  {
    'Customer Name': 'Global Tech Solutions',
    'Office Name': 'San Francisco Office',
    'Service Type': 'Standard',
    'Customer ID': 'GTS002',
    'Contract ID': 'CONT_GTS_002'
  },
  {
    'Customer Name': 'Enterprise Systems Inc',
    'Office Name': 'Chicago Office',
    'Service Type': 'Premium',
    'Customer ID': 'ESI003',
    'Contract ID': 'CONT_ESI_003'
  },
  {
    'Customer Name': 'Digital Innovations Ltd',
    'Office Name': 'Boston Office',
    'Service Type': 'Basic',
    'Customer ID': 'DIL004',
    'Contract ID': 'CONT_DIL_004'
  },
  {
    'Customer Name': 'Future Networks Co',
    'Office Name': 'Seattle Office',
    'Service Type': 'Premium',
    'Customer ID': 'FNC005',
    'Contract ID': 'CONT_FNC_005'
  }
];

// Create sample traffic data with exact column names
const sampleTraffic = [
  {
    'Customer ID': 'ACME001',
    'Date': '2024-01-15',
    'Traffic': 15000,
    'Revenue': 75000.00,
    'Service Type': 'Premium'
  },
  {
    'Customer ID': 'GTS002',
    'Date': '2024-01-15',
    'Traffic': 8500,
    'Revenue': 34000.00,
    'Service Type': 'Standard'
  },
  {
    'Customer ID': 'ESI003',
    'Date': '2024-01-15',
    'Traffic': 12000,
    'Revenue': 60000.00,
    'Service Type': 'Premium'
  },
  {
    'Customer ID': 'DIL004',
    'Date': '2024-01-15',
    'Traffic': 5000,
    'Revenue': 15000.00,
    'Service Type': 'Basic'
  },
  {
    'Customer ID': 'FNC005',
    'Date': '2024-01-15',
    'Traffic': 18000,
    'Revenue': 90000.00,
    'Service Type': 'Premium'
  },
  {
    'Customer ID': 'ACME001',
    'Date': '2024-01-16',
    'Traffic': 16500,
    'Revenue': 82500.00,
    'Service Type': 'Premium'
  },
  {
    'Customer ID': 'GTS002',
    'Date': '2024-01-16',
    'Traffic': 9200,
    'Revenue': 36800.00,
    'Service Type': 'Standard'
  }
];

// Create customer workbook
const customerWorkbook = XLSX.utils.book_new();
const customerWorksheet = XLSX.utils.json_to_sheet(sampleCustomers);
XLSX.utils.book_append_sheet(customerWorkbook, customerWorksheet, 'Customers');

// Create traffic workbook
const trafficWorkbook = XLSX.utils.book_new();
const trafficWorksheet = XLSX.utils.json_to_sheet(sampleTraffic);
XLSX.utils.book_append_sheet(trafficWorkbook, trafficWorksheet, 'Traffic Data');

// Write files
XLSX.writeFile(customerWorkbook, 'sample-customers.xlsx');
XLSX.writeFile(trafficWorkbook, 'sample-traffic.xlsx');

console.log('Sample Excel files created:');
console.log('- sample-customers.xlsx (with exact column names: Customer Name, Office Name, Service Type, Customer ID, Contract ID)');
console.log('- sample-traffic.xlsx (with exact column names: Customer ID, Date, Traffic, Revenue, Service Type)');
console.log('');
console.log('These files demonstrate the exact column names required for upload.');
