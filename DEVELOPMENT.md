# Development Guide

## Quick Start

Due to disk space limitations during initial setup, follow these steps to get the application running:

### 1. Install Dependencies (if not already done)

```bash
cd customer-dashboard
npm install
```

If you encounter disk space issues, try:
```bash
npm install --no-optional
# or
npm ci --production=false
```

### 2. Supabase Configuration

1. Follow the `SUPABASE_SETUP.md` guide to set up your Supabase project
2. Update `src/services/supabase.ts` with your Supabase configuration
3. Create the required database tables and set up RLS policies

### 3. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Features Implemented

### ✅ Completed Features

1. **Project Architecture**
   - React 18 with TypeScript
   - Vite build system
   - Tailwind CSS for styling
   - React Router for navigation
   - Proper folder structure

2. **Supabase Integration**
   - PostgreSQL database configuration
   - Supabase Storage setup
   - Service layer for data operations
   - TypeScript types for all data models

3. **Customer Management**
   - Complete CRUD operations
   - Search and filtering
   - Data validation
   - Excel export functionality

4. **Traffic & Revenue Data**
   - Time-series data management
   - Customer linking
   - Date range filtering
   - Revenue calculations

5. **Excel Import/Export**
   - File upload with drag & drop
   - Data validation and error reporting
   - Template download
   - Bulk import capabilities

6. **Dashboard & Analytics**
   - Key performance indicators
   - Summary statistics
   - Recent activity tracking
   - System status monitoring

7. **Reporting System**
   - Flexible filtering options
   - Data aggregation
   - Excel export
   - Summary visualizations

8. **Responsive UI**
   - Mobile-friendly design
   - Sidebar navigation
   - Modal dialogs
   - Loading states and error handling

## Testing the Application

### 1. Test Customer Management
- Add new customers using the form
- Edit existing customers
- Search and filter customers
- Export customer data

### 2. Test Traffic Data
- Add traffic data linked to customers
- Filter by date ranges
- View revenue calculations
- Export traffic data

### 3. Test Excel Import
- Download templates from the Upload page
- Fill in sample data
- Upload and preview data
- Import data to database

### 4. Test Reporting
- Set date range filters
- Filter by service type or office
- Generate comprehensive reports
- Export reports to Excel

## Sample Data

Use the sample data files in `sample-data/` directory:
- `customers.json` - Sample customer records
- `traffic-data.json` - Sample traffic and revenue data

You can manually add this data through the UI or create Excel files based on these samples.

## Development Tips

### 1. Supabase Debugging
- Check browser console for Supabase errors
- Verify RLS policies in Supabase Dashboard
- Test database connection with sample data

### 2. Excel File Format
- First row must contain column headers
- Use exact column names as shown in templates
- Ensure data types match (numbers for revenue/traffic)
- Date format should be YYYY-MM-DD

### 3. Common Issues
- **Build errors**: Check TypeScript types
- **Supabase connection**: Verify configuration
- **Excel upload**: Check file format and headers
- **Data not loading**: Check database tables and RLS policies

## Code Structure

### Services Layer
- `customerService.ts` - Customer CRUD operations
- `trafficService.ts` - Traffic data management
- `excelService.ts` - File processing and validation
- `supabase.ts` - Supabase configuration

### Components
- `Layout.tsx` - Main application layout
- Page components in `pages/` directory
- Reusable UI components (can be extended)

### Types
- Complete TypeScript definitions
- API response types
- Form validation types
- Chart data types

## Next Steps for Enhancement

### Immediate Improvements
1. Add authentication system
2. Implement real-time updates
3. Add data visualization charts
4. Enhance error handling
5. Add unit tests

### Advanced Features
1. PDF report generation
2. Advanced analytics dashboard
3. Data backup/restore
4. Multi-tenant support
5. API rate limiting

### Performance Optimizations
1. Implement data pagination
2. Add caching layer
3. Optimize bundle size
4. Add service worker for offline support

## Deployment

### Development Deployment
```bash
npm run build
npm run preview
```

### Production Deployment
1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or other hosting platforms
3. Update Supabase RLS policies for production
4. Set up environment variables for different stages

## Support

For development questions:
1. Check the browser console for errors
2. Verify Supabase configuration
3. Test with sample data first
4. Check network requests in DevTools

The application is designed to be production-ready with proper error handling, data validation, and responsive design.
