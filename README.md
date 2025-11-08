# Customer Dashboard

A comprehensive React dashboard application for managing customer data, traffic metrics, and revenue analytics with Supabase backend integration. Features advanced Excel upload validation, duplicate prevention, and revenue-based sorting.

## Features

### Core Functionality
- **Customer Database Management**: Complete CRUD operations for customer records
- **Traffic & Revenue Data**: Manage time-series data linked to customers
- **Excel Import/Export**: Bulk data import and export capabilities with advanced validation
- **Comprehensive Reporting**: Generate filtered reports with analytics and revenue-based sorting
- **Duplicate Prevention**: Advanced validation to prevent duplicate customer and traffic entries
- **Cascading Filters**: Smart filter dependencies in reporting system
- **Responsive Design**: Mobile and desktop optimized interface

### Advanced Features ✨
- **Strict Duplicate Validation**: Prevents duplicate Customer IDs, Contract IDs, and traffic entries
- **Revenue-Based Sorting**: Automatic sorting by revenue (highest first) in reports and exports
- **Enhanced Excel Processing**: Comprehensive validation with detailed error messages and row numbers
- **Upload Prevention Logic**: Blocks uploads entirely when validation errors are detected
- **Customer ID Validation**: Ensures all traffic data references existing customers
- **Date Formatting**: Professional month/year formatting in Excel exports

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
- Customer ID (string, required, unique)
- Contract ID (string, required)

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

## Troubleshooting

### Common Issues
1. **Supabase Connection**: Ensure your project URL and API key are correct
2. **Excel Upload**: Check file format and column headers
3. **Data Not Loading**: Verify database tables exist and RLS policies
4. **Build Errors**: Check TypeScript types and imports

### Support
For issues and questions, check the console for error messages and ensure all dependencies are properly installed.

## License

This project is licensed under the MIT License.
