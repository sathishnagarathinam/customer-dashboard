import XLSX from 'xlsx';

// Create sample customer data
const customerData = [
  {
    'Customer Name': 'TechCorp Solutions',
    'Office Name': 'Downtown Branch',
    'Service Type': 'Premium',
    'Customer ID': 'TECH001',
    'Contract ID': 'CONT2024001'
  },
  {
    'Customer Name': 'Global Industries',
    'Office Name': 'North Office',
    'Service Type': 'Standard',
    'Customer ID': 'GLOB001',
    'Contract ID': 'CONT2024002'
  },
  {
    'Customer Name': 'Innovation Labs',
    'Office Name': 'Tech Park',
    'Service Type': 'Enterprise',
    'Customer ID': 'INNO001',
    'Contract ID': 'CONT2024003'
  },
  {
    'Customer Name': 'Metro Services',
    'Office Name': 'Central Hub',
    'Service Type': 'Basic',
    'Customer ID': 'METR001',
    'Contract ID': 'CONT2024004'
  },
  {
    'Customer Name': 'Digital Dynamics',
    'Office Name': 'Silicon Valley',
    'Service Type': 'Premium',
    'Customer ID': 'DIGI001',
    'Contract ID': 'CONT2024005'
  }
];

// Create sample traffic data (including zero values for testing)
const trafficData = [
  {
    'Customer ID': 'TECH001',
    'Date': '2024-01-15',
    'Traffic Volume': 15000,
    'Revenue': 7500.00,
    'Service Type': 'Premium'
  },
  {
    'Customer ID': 'GLOB001',
    'Date': '2024-01-15',
    'Traffic Volume': 8000,
    'Revenue': 3200.00,
    'Service Type': 'Standard'
  },
  {
    'Customer ID': 'INNO001',
    'Date': '2024-01-15',
    'Traffic Volume': 25000,
    'Revenue': 15000.00,
    'Service Type': 'Enterprise'
  },
  {
    'Customer ID': 'METR001',
    'Date': '2024-01-15',
    'Traffic Volume': 0,
    'Revenue': 0.00,
    'Service Type': 'Basic'
  },
  {
    'Customer ID': 'DIGI001',
    'Date': '2024-01-15',
    'Traffic Volume': 12000,
    'Revenue': 0.00,
    'Service Type': 'Premium'
  },
  {
    'Customer ID': 'TECH001',
    'Date': '2024-01-16',
    'Traffic Volume': 0,
    'Revenue': 2500.00,
    'Service Type': 'Premium'
  }
];

// Create workbooks
const customerWorkbook = XLSX.utils.book_new();
const customerWorksheet = XLSX.utils.json_to_sheet(customerData);
XLSX.utils.book_append_sheet(customerWorkbook, customerWorksheet, 'Customers');

const trafficWorkbook = XLSX.utils.book_new();
const trafficWorksheet = XLSX.utils.json_to_sheet(trafficData);
XLSX.utils.book_append_sheet(trafficWorkbook, trafficWorksheet, 'Traffic Data');

// Write files
XLSX.writeFile(customerWorkbook, 'sample-customers.xlsx');
XLSX.writeFile(trafficWorkbook, 'sample-traffic.xlsx');

console.log('Sample Excel files created:');
console.log('- sample-customers.xlsx');
console.log('- sample-traffic.xlsx');
