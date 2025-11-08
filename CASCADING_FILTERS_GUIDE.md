# 🔄 Cascading Filters System - Reports Page

## Overview

The Reports page now features an advanced cascading filter system that allows users to progressively narrow down data by applying filters in a logical sequence. The filters work together to provide a seamless and intuitive filtering experience.

## Filter Order and Functionality

### 1. **Start Date & End Date**
- **Purpose**: Define the time range for the report
- **Behavior**: Standard date range selection
- **Default**: First day of current month to today

### 2. **Office Name Dropdown Filter** 🏢
- **Purpose**: Filter data by office location
- **Options**: "All Offices" + all unique office names from customer data
- **Source**: `office_name` field from customers table
- **Cascading Effect**: When changed, automatically resets and updates BOTH the Service Type and Customer Name dropdowns

### 3. **Service Type Dropdown Filter** 🛠️
- **Purpose**: Filter by service type
- **Options**: "All Service Types" + service types available in selected office
- **Source**: `service_type` field from both customers and traffic_data tables
- **Cascading Behavior**:
  - Shows ALL service types when "All Offices" is selected
  - Shows ONLY service types used by customers in selected office
  - Automatically resets when office selection changes

### 4. **Customer Name Dropdown Filter** 👥
- **Purpose**: Filter by specific customer
- **Options**: "All Customers" + filtered customer list
- **Cascading Behavior**: 
  - Shows ALL customers when "All Offices" is selected
  - Shows ONLY customers from selected office when an office is chosen
  - Displays helpful text indicating current filter state
- **Reset Trigger**: Automatically resets when office selection changes

### 5. **Top Customers Limit Dropdown** 🏆
- **Purpose**: Limit results to top-performing customers by total revenue
- **Options**:
  - "All Customers" (no limit)
  - "Top 10", "Top 20", "Top 30", "Top 50"
- **Ranking Criteria**: **Total Revenue Amount Only** (sum of all revenue values per customer)
- **Ranking Method**:
  - Calculates total revenue by summing all revenue entries for each customer
  - Sorts customers in descending order by total revenue (highest first)
  - Selects top N customers based purely on this total revenue ranking
  - **Does NOT use** revenue per traffic, average revenue, or any derived metrics
- **Behavior**: Applied after all other filters, shows top N customers by absolute revenue contribution

## Technical Implementation

### Key Functions

#### `getFilteredCustomers()`
```typescript
// Returns customers filtered by selected office
// If no office selected, returns all customers
const getFilteredCustomers = () => {
  if (!filters.officeName) {
    return customers; // Show all customers
  }
  return customers.filter(customer => customer.officeName === filters.officeName);
};
```

#### `getFilteredServiceTypes()`
```typescript
// Returns service types filtered by selected office
// If no office selected, returns all service types
const getFilteredServiceTypes = () => {
  let filteredCustomers = customers;
  let filteredTrafficData = trafficData;

  // Filter by selected office if one is chosen
  if (filters.officeName) {
    filteredCustomers = customers.filter(customer => customer.officeName === filters.officeName);
    const officeCustomerIds = filteredCustomers.map(c => c.customerId);
    filteredTrafficData = trafficData.filter(traffic => officeCustomerIds.includes(traffic.customerId));
  }

  const customerServiceTypes = getUniqueValues(filteredCustomers, 'serviceType');
  const trafficServiceTypes = getUniqueValues(filteredTrafficData, 'serviceType');
  return [...new Set([...customerServiceTypes, ...trafficServiceTypes])].filter(Boolean).sort();
};
```

#### `handleOfficeChange(officeName: string)`
```typescript
// Handles office selection and resets dependent filters
const handleOfficeChange = (officeName: string) => {
  setFilters({
    ...filters,
    officeName,
    serviceType: '', // Reset service type selection when office changes
    customerId: '' // Reset customer selection when office changes
  });
};
```

#### `applyTopCustomersLimit(data: ReportData)`
```typescript
// Applies top customers limit based on TOTAL REVENUE RANKING ONLY
const applyTopCustomersLimit = (data: ReportData): ReportData => {
  // Calculate total revenue per customer by summing all their revenue values
  const customerRevenues = new Map<string, number>();
  data.trafficData.forEach(item => {
    const currentTotal = customerRevenues.get(item.customerId) || 0;
    // Sum up all revenue amounts for each customer (pure total revenue, no derived metrics)
    customerRevenues.set(item.customerId, currentTotal + item.revenue);
  });

  // Sort customers by total revenue in descending order (highest revenue first)
  const sortedCustomersByRevenue = Array.from(customerRevenues.entries())
    .sort((a, b) => b[1] - a[1]) // b[1] - a[1] = descending by revenue amount
    .slice(0, limitNumber); // Take only the top N customers

  // Maintain revenue-based ordering in filtered results
  const filteredCustomers = data.customers
    .filter(customer => topCustomerIds.includes(customer.customerId))
    .sort((a, b) => {
      // Sort customers by their revenue ranking (highest revenue first)
      const orderA = customerOrderMap.get(a.customerId) || 0;
      const orderB = customerOrderMap.get(b.customerId) || 0;
      return orderA - orderB;
    });

  // Returns filtered data with customers ordered by total revenue (highest first)
};
```

### Data Flow

1. **User selects office** → Service Type dropdown updates → Customer dropdown updates → Both selections reset
2. **User selects service type** → Works within office constraint (if any)
3. **User selects customer** → Works within office constraint (if any)
4. **User selects top limit** → Applied to final filtered results
5. **Generate Report** → All filters applied in sequence → Top limit applied last

### Bug Fix: Service Type Cascading

**Previous Issue**: Service Type dropdown always showed all service types regardless of office selection.

**Fixed Behavior**:
- When "All Offices" selected → Shows all service types
- When specific office selected → Shows only service types used by customers in that office
- Service type selection resets when office changes

## User Experience Features

### Visual Feedback
- **Helper text** under Customer dropdown shows current office filter state
- **Helper text** under Top Customers dropdown explains ranking criteria
- **Dynamic options** in Customer dropdown based on office selection

### Filter State Management
- **Automatic reset** of dependent filters when parent filter changes
- **Preserved selections** for independent filters
- **Clear indication** of applied filters in the UI

## Usage Examples

### Example 1: Office-Specific Analysis
1. Select "NYC Office" from Office Name dropdown
2. Customer dropdown automatically shows only NYC customers
3. Select specific customer or leave as "All Customers"
4. Choose "Top 10" to see top 10 customers from NYC office
5. Generate report

### Example 2: Service Type Analysis
1. Leave Office as "All Offices"
2. Select "Premium" from Service Type dropdown
3. Customer dropdown shows all customers (not office-filtered)
4. Choose "Top 20" to see top 20 Premium service customers
5. Generate report

### Example 3: Comprehensive Filtering
1. Select specific office (e.g., "LA Office")
2. Select specific service type (e.g., "Standard")
3. Customer dropdown shows only LA Office customers with Standard service
4. Select specific customer or use "Top 5"
5. Generate detailed report

## Benefits

### For Users
- **Intuitive workflow**: Filters guide users through logical data exploration
- **Reduced cognitive load**: Only relevant options shown at each step
- **Flexible analysis**: Can drill down from broad to specific views
- **Performance insights**: Top customers ranking helps identify key accounts

### For Data Analysis
- **Progressive filtering**: Each filter narrows the dataset logically
- **Consistent results**: Cascading ensures data integrity across filters
- **Revenue-based ranking**: Top customers filter uses meaningful business metric
- **Comprehensive coverage**: All major data dimensions covered

## Technical Notes

### Performance Considerations
- Filters are applied client-side for responsive UI
- Database queries use the comprehensive `getTrafficDataWithCustomers` method
- Top customers calculation performed on filtered dataset

### Data Integrity
- Foreign key relationships maintained through cascading
- Customer-office relationships preserved in filtering logic
- Revenue calculations accurate across all filter combinations

### Extensibility
- Filter system designed for easy addition of new filter types
- Cascading logic can be extended to other dependent relationships
- Top customers logic can be adapted for other ranking criteria (traffic volume, etc.)

## Revenue Sorting & Export Features 📊

### Revenue-Based Data Sorting
- **Report Display**: All traffic data in reports is sorted by revenue (highest first)
- **Visual Indicator**: Revenue column header shows "Revenue ↓" to indicate descending sort
- **Consistent Ordering**: Both report display and Excel export use the same revenue-based sorting

### Excel Export Enhancements
- **Revenue-Sorted Data**: All exported data sorted by revenue (highest first) for better analysis
- **Month/Year Date Format**: Dates displayed as "January 2024" format for cleaner exports
- **Comprehensive Data**: Includes summary statistics and detailed traffic data
- **Customer Information**: Full customer details joined with traffic data
- **Calculated Metrics**: Revenue per traffic ratios included
- **Professional Format**: Clean, business-ready Excel format

### Date Formatting in Excel Export
```typescript
// Excel export uses month/year format
'Date': item.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
// Results in: "January 2024", "February 2024", etc.
```

### Benefits of Revenue Sorting
- **Priority Focus**: Highest revenue transactions appear first
- **Business Value**: Immediately identifies most valuable data points
- **Analysis Efficiency**: Key revenue drivers are prominently displayed
- **Decision Support**: Facilitates revenue-focused business decisions

## Testing

Use the `test-cascading-filters.html` file to:
- Test cascading logic with sample data
- Verify filter interactions
- Simulate report generation with various filter combinations
- Validate data integrity across filter states

Use the `test-revenue-sorting.html` file to:
- Test revenue-based sorting functionality
- Verify date formatting for Excel export
- Simulate Excel export with revenue sorting
- Validate sorting order and data integrity

The cascading filter system provides a powerful and user-friendly way to explore customer and traffic data, enabling users to quickly drill down from high-level overviews to specific customer insights. The revenue-based sorting enhancement ensures that the most valuable data points are always prominently displayed, supporting data-driven business decision making.
