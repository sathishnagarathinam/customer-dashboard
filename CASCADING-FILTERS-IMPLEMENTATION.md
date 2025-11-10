# Cascading Filters Implementation

## Overview
Updated the Reports page to implement cascading filters where each filter depends on the previous selections:

**Filter Order:**
1. **Office Name** → Filters customers by office
2. **Payment Type** → Filters customers by payment type (from office-filtered customers)
3. **Service Type** → Filters service types based on both office name AND payment type
4. **Customer Name** → Filters customers based on all previous selections

## Implementation Details

### 1. Updated Filter Logic

#### `getFilteredCustomers()` Function
```typescript
const getFilteredCustomers = () => {
  let filteredCustomers = customers;
  
  // Filter by office name if selected
  if (filters.officeName) {
    filteredCustomers = filteredCustomers.filter(customer => customer.officeName === filters.officeName);
  }
  
  // Filter by payment type if selected
  if (filters.paymentType) {
    filteredCustomers = filteredCustomers.filter(customer => customer.paymentType === filters.paymentType);
  }
  
  return filteredCustomers;
};
```

#### `getFilteredServiceTypes()` Function
```typescript
const getFilteredServiceTypes = () => {
  let filteredCustomers = customers;
  let filteredTrafficData = trafficData;

  // Filter by selected office if one is chosen
  if (filters.officeName) {
    filteredCustomers = filteredCustomers.filter(customer => customer.officeName === filters.officeName);
  }

  // Filter by selected payment type if one is chosen
  if (filters.paymentType) {
    filteredCustomers = filteredCustomers.filter(customer => customer.paymentType === filters.paymentType);
  }

  // Filter traffic data to match the filtered customers
  if (filters.officeName || filters.paymentType) {
    const filteredCustomerIds = filteredCustomers.map(c => c.customerId);
    filteredTrafficData = trafficData.filter(traffic =>
      filteredCustomerIds.includes(traffic.customer?.customerId || '')
    );
  }

  const customerServiceTypes = getUniqueValues(filteredCustomers, 'serviceType');
  const trafficServiceTypes = getUniqueValues(filteredTrafficData, 'serviceType');
  return [...new Set([...customerServiceTypes, ...trafficServiceTypes])].filter(Boolean).sort();
};
```

### 2. Filter Change Handlers

#### Office Name Change Handler
```typescript
const handleOfficeChange = (officeName: string) => {
  setFilters({
    ...filters,
    officeName,
    serviceType: '', // Reset service type selection when office changes
    customerId: '' // Reset customer selection when office changes
  });
};
```

#### Payment Type Change Handler (NEW)
```typescript
const handlePaymentTypeChange = (paymentType: string) => {
  setFilters({
    ...filters,
    paymentType,
    serviceType: '', // Reset service type selection when payment type changes
    customerId: '' // Reset customer selection when payment type changes
  });
};
```

### 3. UI Updates

#### Payment Type Dropdown
- Uses `handlePaymentTypeChange` instead of direct state update
- Shows helper text when office is selected
- Resets dependent filters when changed

#### Service Type Dropdown
- Updated helper text to show both office and payment type filtering
- Displays: "Showing service types for office: Main Office, payment type: Advance"

#### Customer Name Dropdown
- Updated helper text to show both office and payment type filtering
- Displays: "Showing customers filtered by office: Main Office, payment type: Advance"

## Filter Behavior

### Cascading Logic
1. **Select Office Name** → Payment Type options remain the same, but Service Type and Customer Name get filtered
2. **Select Payment Type** → Service Type and Customer Name get further filtered based on both Office and Payment Type
3. **Select Service Type** → Customer Name gets filtered based on Office, Payment Type, and Service Type
4. **Select Customer Name** → Final filter applied

### Reset Behavior
- **Office Name change** → Resets Service Type and Customer Name
- **Payment Type change** → Resets Service Type and Customer Name
- **Service Type change** → Resets Customer Name only
- **Customer Name change** → No resets needed

### Helper Text
- **Payment Type**: Shows "Showing payment types for {office}" when office is selected
- **Service Type**: Shows "Showing service types for office: {office}, payment type: {paymentType}"
- **Customer Name**: Shows "Showing customers filtered by office: {office}, payment type: {paymentType}"

## User Experience

### Expected Workflow
1. User selects an office → Service types and customers are filtered to that office
2. User selects a payment type → Service types and customers are further filtered
3. User selects a service type → Customers are filtered to match all criteria
4. User selects a specific customer → Final filter applied

### Visual Feedback
- Helper text under each dropdown shows what filters are currently applied
- Dropdowns automatically update their options based on previous selections
- Dependent filters are automatically reset when parent filters change

## Testing Scenarios

1. **Select Office Only**: Verify Service Type and Customer dropdowns show only options for that office
2. **Select Office + Payment Type**: Verify Service Type shows only types for customers matching both criteria
3. **Change Office**: Verify Payment Type selection is preserved, but Service Type and Customer are reset
4. **Change Payment Type**: Verify Service Type and Customer are reset and re-filtered
5. **Full Filter Chain**: Select Office → Payment Type → Service Type → Customer and verify each step filters correctly

## Files Modified
- `src/pages/Reports.tsx` - Updated cascading filter logic and UI
- `CASCADING-FILTERS-IMPLEMENTATION.md` (NEW) - This documentation

## Benefits
- **Intuitive UX**: Users can progressively narrow down their search
- **Data Consistency**: Ensures all filter combinations are valid
- **Performance**: Reduces irrelevant options in dropdowns
- **Clear Feedback**: Helper text shows current filter state
