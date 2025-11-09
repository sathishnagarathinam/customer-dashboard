# Customer Dashboard

A comprehensive React dashboard application for managing customer data, traffic metrics, and revenue analytics with Supabase backend integration. Features advanced Excel upload validation, contract-based duplicate prevention, and cumulative revenue-based customer rankings.

## 🚀 Latest Updates

### Contract ID Validation System (v2.0)
- **🔐 Contract-Based Uniqueness**: Uses `contract_id` as primary unique identifier instead of `customer_id`
- **📋 Multiple Contracts per Customer**: Supports customers with multiple service contracts
- **🛡️ Enhanced Validation**: Prevents duplicate contracts while allowing multiple services per customer
- **📊 Revenue-Based Rankings**: Customers ranked by total cumulative revenue across all contracts

### Top Customers Report Enhancement
- **📈 Cumulative Revenue Ranking**: Shows customers ranked by total revenue across selected date range
- **🏆 Clear Visual Hierarchy**: Displays rank numbers and total revenue amounts
- **📋 Individual Transaction View**: Shows monthly records from top customers
- **📤 Consistent Export Logic**: Excel exports maintain same ranking as UI display

## Features

### Core Functionality
- **Customer Database Management**: Complete CRUD operations for customer records with contract support
- **Traffic & Revenue Data**: Manage time-series data linked to customers via customer_id
- **Excel Import/Export**: Bulk data import and export capabilities with contract-based validation
- **Comprehensive Reporting**: Generate filtered reports with cumulative revenue-based customer rankings
- **Contract Management**: Handle multiple service contracts per customer with unique contract IDs
- **Cascading Filters**: Smart filter dependencies in reporting system
- **Responsive Design**: Mobile and desktop optimized interface

### Advanced Features ✨
- **Contract ID Validation**: Prevents duplicate contract IDs while allowing multiple contracts per customer
- **Cumulative Revenue Ranking**: Customers ranked by total revenue across all their contracts
- **Enhanced Excel Processing**: Comprehensive validation with detailed error messages and row numbers
- **Graceful Duplicate Handling**: Skips existing contracts, inserts new ones with detailed reporting
- **Customer ID Validation**: Ensures all traffic data references existing customers
- **Professional Export Formatting**: Month/year formatting and revenue-based sorting in Excel exports

### Technical Features
- **React 18** with TypeScript
- **Supabase Integration** (PostgreSQL + Storage)
- **Tailwind CSS** for styling
- **Excel Processing** with XLSX library
- **Data Validation** and error handling
- **Real-time Updates** with Supabase
- **Responsive Navigation** with React Router

## Project Structure

```
customer-dashboard/
├── src/
│   ├── components/          # Reusable UI components
│   │   └── Layout.tsx       # Main layout with navigation
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Main dashboard with stats
│   │   ├── Customers.tsx    # Customer management
│   │   ├── Traffic.tsx      # Traffic & revenue data
│   │   ├── Upload.tsx       # Excel file upload
│   │   └── Reports.tsx      # Report generation
│   ├── services/            # API and business logic
│   │   ├── supabase.ts      # Supabase configuration
│   │   ├── customerService.ts
│   │   ├── trafficService.ts
│   │   └── excelService.ts
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   ├── App.tsx              # Main app component
│   ├── main.tsx             # App entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json             # Dependencies and scripts
└── README.md               # This file
```

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Supabase account

### 1. Clone and Install Dependencies

```bash
cd customer-dashboard
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [Supabase](https://supabase.com/)
2. Create the required database tables
3. Get your project URL and API key
4. Update `src/services/supabase.ts` with your config:

```typescript
const supabaseUrl = 'https://your-project-id.supabase.co';
const supabaseAnonKey = 'your-anon-key';
```

**📖 For detailed setup instructions, see [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)**

### 3. Database Tables

The application requires two main tables:
- `customers` - Customer information
- `traffic_data` - Traffic and revenue data

See the setup guide for complete SQL schema.

### 4. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage Guide

### Customer Management
1. Navigate to "Customers" page
2. Add new customers using the "Add Customer" button
3. Edit existing customers by clicking the edit icon
4. Export customer data to Excel using the "Export" button
5. Search and filter customers using the search bar

### Traffic & Revenue Data
1. Go to "Traffic & Revenue" page
2. Add traffic data entries linked to existing customers
3. Filter data by customer or date range
4. Export traffic data for analysis

### Excel Import
1. Visit the "Upload Data" page
2. Choose between Customer Data or Traffic Data
3. Download the template for correct format
4. Upload your Excel file
5. Preview and confirm the import

### Reports
1. Access the "Reports" page
2. Set filters (date range, service type, office, customer)
3. Generate comprehensive reports
4. Export reports to Excel format
5. View summary statistics and data tables

## Data Schema

### Customer Fields
- Customer Name (string, required)
- Office Name (string, required)
- Service Type (string, required)
- Customer ID (string, required) - Can have duplicates for multiple contracts
- Contract ID (string, required, unique) - Primary unique identifier

### Traffic Data Fields
- Customer ID (string, required, must exist)
- Date (date, required)
- Traffic Volume (number, required)
- Revenue (number, required)
- Service Type (string, required)

## Excel Templates

The application provides Excel templates with the correct column headers:

### Customer Template
| Customer Name | Office Name | Service Type | Customer ID | Contract ID |
|---------------|-------------|--------------|-------------|-------------|
| Example Corp  | Main Office | Premium      | CUST001     | CONT001     |

### Traffic Data Template
| Customer ID | Date       | Traffic Volume | Revenue | Service Type |
|-------------|------------|----------------|---------|--------------|
| CUST001     | 2024-01-01 | 1000          | 5000.00 | Premium      |

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features
1. Create new components in `src/components/`
2. Add new pages in `src/pages/`
3. Extend services in `src/services/`
4. Update types in `src/types/`
5. Add routes in `App.tsx`

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel (Recommended)
```bash
npm install -g vercel
vercel
```

### Deploy to Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

## 📚 Documentation

### Comprehensive Guides
- **[CONTRACT_ID_VALIDATION_GUIDE.md](./CONTRACT_ID_VALIDATION_GUIDE.md)** - Complete guide to contract ID validation system
- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Detailed database setup instructions
- **[TOP_CUSTOMERS_REVENUE_RANKING.md](./TOP_CUSTOMERS_REVENUE_RANKING.md)** - Revenue ranking methodology
- **[CASCADING_FILTERS_GUIDE.md](./CASCADING_FILTERS_GUIDE.md)** - Filter system documentation

### Database Migration
- **[database-migration-contract-id.sql](./database-migration-contract-id.sql)** - Migration script for contract ID system
- **[database-setup.sql](./database-setup.sql)** - Complete database schema

### Testing Tools
- **[test-contract-id-validation.html](./test-contract-id-validation.html)** - Contract ID validation testing
- **[test-revenue-sorting.html](./test-revenue-sorting.html)** - Revenue sorting validation
- **Sample Data Files**: `sample-customer-data-contract-id.csv`, `sample-customer-data-with-errors.csv`

## 🧪 Testing

### Contract ID Validation Testing
Open `test-contract-id-validation.html` in your browser to test:
- Contract ID validation logic
- Multiple customers with same ID
- Duplicate contract ID detection
- Database constraint behavior

### Revenue Ranking Testing
Use the Reports page to verify:
- Customers ranked by total cumulative revenue
- Proper sorting in both UI and Excel exports
- Correct handling of multiple contracts per customer

## Troubleshooting

### Common Issues
1. **Supabase Connection**: Ensure your project URL and API key are correct
2. **Excel Upload**: Check file format and column headers match exactly
3. **Contract ID Errors**: Ensure contract IDs are unique across all customers
4. **Data Not Loading**: Verify database tables exist and RLS policies are configured
5. **Build Errors**: Check TypeScript types and imports

### Database Migration
If upgrading from customer_id-based system:
1. Backup your database
2. Run `database-migration-contract-id.sql`
3. Test with sample data files
4. Verify constraints using test tools

### Support
For issues and questions:
1. Check browser console for error messages
2. Use the testing HTML files to validate functionality
3. Review the comprehensive documentation guides
4. Ensure all dependencies are properly installed

## License

This project is licensed under the MIT License.
