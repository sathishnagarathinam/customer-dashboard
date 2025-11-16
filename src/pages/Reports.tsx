import React, { useState, useEffect } from 'react';
import { Download, Calendar, Filter, BarChart3, PieChart, TrendingUp } from 'lucide-react';
import { customerService } from '../services/customerService';
import { trafficService } from '../services/trafficService';
import { excelService } from '../services/excelService';
import { Customer, TrafficDataWithCustomer, ReportFilter, ReportData } from '../types';

const Reports: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [trafficData, setTrafficData] = useState<TrafficDataWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingConsolidated, setGeneratingConsolidated] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  
  const [filters, setFilters] = useState<ReportFilter>({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1), // First day of current month
    endDate: new Date(), // Today
    officeName: '',
    serviceType: '',
    paymentType: '', // Added payment type filter
    customerId: '',
    contractId: '', // Added contract ID filter
    topCustomersLimit: 'All Customers'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [customersResponse, trafficResponse] = await Promise.all([
        customerService.getAllCustomers(),
        trafficService.getTrafficDataWithCustomers()
      ]);

      if (customersResponse.success && customersResponse.data) {
        setCustomers(customersResponse.data);
      }

      if (trafficResponse.success && trafficResponse.data) {
        setTrafficData(trafficResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthWiseReport = async () => {
    setGenerating(true);

    try {
      // Use the new comprehensive reporting method that joins customers and traffic data
      const trafficWithCustomersResponse = await trafficService.getTrafficDataWithCustomers({
        startDate: filters.startDate,
        endDate: filters.endDate,
        serviceType: filters.serviceType,
        officeName: filters.officeName,
        paymentType: filters.paymentType,
        customerId: filters.customerId,
        contractId: filters.contractId
      });

      if (!trafficWithCustomersResponse.success || !trafficWithCustomersResponse.data) {
        throw new Error(trafficWithCustomersResponse.error || 'Failed to fetch report data');
      }

      const trafficWithCustomers = trafficWithCustomersResponse.data;

      // Group data by contract ID and month for month-wise reporting (contracts as rows, months as columns)
      const customerMonthlyData = new Map();
      const allMonths = new Set();

      trafficWithCustomers.forEach(item => {
        const contractId = item.customer.contractId;
        const monthKey = new Date(item.date).toISOString().slice(0, 7); // YYYY-MM format
        allMonths.add(monthKey);

        if (!customerMonthlyData.has(contractId)) {
          customerMonthlyData.set(contractId, {
            customer: item.customer,
            months: new Map()
          });
        }

        const customerData = customerMonthlyData.get(contractId);
        if (!customerData.months.has(monthKey)) {
          customerData.months.set(monthKey, {
            traffic: 0,
            revenue: 0,
            records: 0
          });
        }

        const monthData = customerData.months.get(monthKey);
        monthData.traffic += item.trafficVolume || 0; // Handle null/undefined
        monthData.revenue += item.revenue || 0; // Handle null/undefined
        monthData.records += 1;
      });

      // Sort months chronologically
      const sortedMonths = Array.from(allMonths).sort();

      // Extract unique contracts from the traffic data
      const customerMap = new Map();
      trafficWithCustomers.forEach(item => {
        if (!customerMap.has(item.customer.contractId)) {
          customerMap.set(item.customer.contractId, item.customer);
        }
      });
      const uniqueCustomers = Array.from(customerMap.values());

      // Calculate summary statistics
      const totalRevenue = trafficWithCustomers.reduce((sum, item) => sum + (item.revenue || 0), 0);
      const totalTraffic = trafficWithCustomers.reduce((sum, item) => sum + (item.trafficVolume || 0), 0);
      const averageRevenuePerCustomer = uniqueCustomers.length > 0 ? totalRevenue / uniqueCustomers.length : 0;

      const report: ReportData = {
        customers: uniqueCustomers,
        trafficData: trafficWithCustomers,
        summary: {
          totalCustomers: uniqueCustomers.length,
          totalRevenue,
          totalTraffic,
          averageRevenuePerCustomer
        }
      };

      // Apply top customers limit if specified and add month-wise matrix
      const finalReport = applyTopCustomersLimit(report);
      // Add month-wise matrix data (customers as rows, months as columns)
      (finalReport as any).monthlyMatrix = {
        customers: Array.from(customerMonthlyData.values()),
        months: sortedMonths
      };

      setReportData(finalReport);
    } catch (error) {
      console.error('Error generating month-wise report:', error);
    } finally {
      setGenerating(false);
    }
  };

  const generateConsolidatedReport = async () => {
    setGeneratingConsolidated(true);

    try {
      // Use the new comprehensive reporting method that joins customers and traffic data
      const trafficWithCustomersResponse = await trafficService.getTrafficDataWithCustomers({
        startDate: filters.startDate,
        endDate: filters.endDate,
        serviceType: filters.serviceType,
        officeName: filters.officeName,
        paymentType: filters.paymentType,
        customerId: filters.customerId,
        contractId: filters.contractId
      });

      if (!trafficWithCustomersResponse.success || !trafficWithCustomersResponse.data) {
        throw new Error(trafficWithCustomersResponse.error || 'Failed to fetch report data');
      }

      const trafficWithCustomers = trafficWithCustomersResponse.data;

      // Consolidate data by contract ID (sum all their records across the period)
      const consolidatedData = new Map();
      trafficWithCustomers.forEach(item => {
        const contractId = item.customer.contractId;
        if (!consolidatedData.has(contractId)) {
          consolidatedData.set(contractId, {
            customer: item.customer,
            totalRevenue: 0,
            totalTraffic: 0,
            recordCount: 0,
            firstDate: item.date,
            lastDate: item.date
          });
        }
        const existing = consolidatedData.get(contractId);
        existing.totalRevenue += item.revenue || 0; // Handle null/undefined
        existing.totalTraffic += item.trafficVolume || 0; // Handle null/undefined
        existing.recordCount += 1;
        if (new Date(item.date) < new Date(existing.firstDate)) {
          existing.firstDate = item.date;
        }
        if (new Date(item.date) > new Date(existing.lastDate)) {
          existing.lastDate = item.date;
        }
      });

      // Convert consolidated data to array and sort by total revenue
      const consolidatedArray = Array.from(consolidatedData.values())
        .sort((a, b) => b.totalRevenue - a.totalRevenue);

      // Apply top customers limit to consolidated data
      let limitedConsolidatedArray = consolidatedArray;
      if (filters.topCustomersLimit && filters.topCustomersLimit !== 'All Customers') {
        const limitNumber = parseInt(filters.topCustomersLimit.replace('Top ', ''));
        limitedConsolidatedArray = consolidatedArray.slice(0, limitNumber);
      }

      // Extract unique customers from limited data
      const uniqueCustomers = limitedConsolidatedArray.map(item => item.customer);

      // Calculate summary statistics from limited data
      const totalRevenue = limitedConsolidatedArray.reduce((sum, item) => sum + item.totalRevenue, 0);
      const totalTraffic = limitedConsolidatedArray.reduce((sum, item) => sum + item.totalTraffic, 0);
      const averageRevenuePerCustomer = uniqueCustomers.length > 0 ? totalRevenue / uniqueCustomers.length : 0;

      // Filter traffic data to only include data from limited contracts
      const limitedContractIds = new Set(uniqueCustomers.map(customer => customer.contractId));
      const limitedTrafficData = trafficWithCustomers.filter(item =>
        limitedContractIds.has(item.customer.contractId)
      );

      const report: ReportData = {
        customers: uniqueCustomers, // Now contains only limited customers
        trafficData: limitedTrafficData, // Only traffic data for limited customers
        summary: {
          totalCustomers: uniqueCustomers.length,
          totalRevenue,
          totalTraffic,
          averageRevenuePerCustomer
        }
      };

      // Add consolidated breakdown to the report
      (report as any).consolidatedData = limitedConsolidatedArray;
      (report as any).isConsolidated = true;

      setReportData(report);
    } catch (error) {
      console.error('Error generating consolidated report:', error);
    } finally {
      setGeneratingConsolidated(false);
    }
  };

  const exportReport = (format: 'excel' | 'pdf') => {
    if (!reportData) return;

    if (format === 'excel') {
      // Determine report type
      const isConsolidated = (reportData as any).isConsolidated;

      // Create comprehensive report with customer and traffic data joined
      const summaryData = [{
        'Report Type': isConsolidated ? 'Consolidated Summary' : 'Month-wise Summary',
        'Total Customers': reportData.summary.totalCustomers,
        'Total Revenue': reportData.summary.totalRevenue,
        'Total Traffic': reportData.summary.totalTraffic,
        'Average Revenue per Customer': reportData.summary.averageRevenuePerCustomer.toFixed(2),
        'Report Generated': new Date().toLocaleDateString()
      }];

      let comprehensiveData;

      if (isConsolidated) {
        // For consolidated reports: Include both consolidated summary AND detailed customer-wise records
        const consolidatedData = (reportData as any).consolidatedData || [];

        // Apply top customers limit to consolidated data
        const limitedConsolidatedData = applyTopCustomersLimitToExport(consolidatedData);

        // First, create the consolidated summary (aggregated totals per customer) - matching attachment format
        const consolidatedSummary = limitedConsolidatedData.map((item: any, index: number) => ({
          'SL No': index + 1,
          'Contract ID': item.customer.contractId,
          'Customer Name': item.customer.customerName,
          'Service Type': item.customer.serviceType,
          'Customer ID': item.customer.customerId,
          'Office Name': item.customer.officeName,
          'Total Revenue': item.totalRevenue,
          'Total Traffic': item.totalTraffic
        }));

        // Then, create detailed customer records directly from the limited consolidated data
        const detailedRecords = limitedConsolidatedData.map((item: any, index: number) => {
          return {
            'SL No': index + 1,
            'Contract ID': item.customer.contractId,
            'Customer Name': item.customer.customerName,
            'Service Type': item.customer.serviceType,
            'Customer ID': item.customer.customerId,
            'Office Name': item.customer.officeName,
            'Total Revenue': item.totalRevenue,
            'Total Traffic': item.totalTraffic
          };
        });

        // Combine both: consolidated summary first, then customer summaries by contract
        comprehensiveData = [...consolidatedSummary, ...detailedRecords];
      } else {
        // For month-wise reports: Show matrix format (customers as rows, months as columns)
        const monthlyMatrix = (reportData as any).monthlyMatrix;
        if (monthlyMatrix) {
          // Apply top customers limit to monthly matrix data
          const limitedCustomers = applyTopCustomersLimitToMonthlyMatrix(monthlyMatrix.customers);

          comprehensiveData = limitedCustomers.map((customerData: any, index: number) => {
            const exportRow: any = {
              'SL No': index + 1,
              'Contract ID': customerData.customer.contractId,
              'Customer Name': customerData.customer.customerName,
              'Service Type': customerData.customer.serviceType,
              'Customer ID': customerData.customer.customerId,
              'Office Name': customerData.customer.officeName,
              'Payment Type': customerData.customer.paymentType || 'Advance'
            };

            // Add columns for each month (Traffic and Revenue)
            monthlyMatrix.months.forEach((month: string) => {
              const monthData = customerData.months.get(month);
              const monthLabel = new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

              exportRow[`${monthLabel} Traffic`] = monthData ? monthData.traffic : 0;
              exportRow[`${monthLabel} Revenue`] = monthData ? monthData.revenue : 0;
            });

            // Add total columns
            let totalTraffic = 0;
            let totalRevenue = 0;
            customerData.months.forEach((monthData: any) => {
              totalTraffic += monthData.traffic;
              totalRevenue += monthData.revenue;
            });

            exportRow['Total Traffic'] = totalTraffic;
            exportRow['Total Revenue'] = totalRevenue;

            return exportRow;
          });
        } else {
          comprehensiveData = [];
        }
      }

      // Export comprehensive data including summary
      const reportType = isConsolidated ? 'consolidated-report' : 'monthwise-report';
      const exportData = [...summaryData, ...comprehensiveData];
      excelService.exportToExcel(exportData, reportType, 'Report');
    }
  };

  const getUniqueValues = (array: any[], key: string) => {
    return [...new Set(array.map(item => item[key]))].filter(Boolean);
  };

  // Get unique office names
  const getUniqueOffices = () => {
    return getUniqueValues(customers, 'officeName').sort();
  };

  // Get unique service types filtered by selected office and payment type
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
        filteredCustomerIds.includes(traffic.customer?.customerId || '') // Use customer.customerId from joined data
      );
    }

    const customerServiceTypes = getUniqueValues(filteredCustomers, 'serviceType');
    const trafficServiceTypes = getUniqueValues(filteredTrafficData, 'serviceType');
    return [...new Set([...customerServiceTypes, ...trafficServiceTypes])].filter(Boolean).sort();
  };

  // Handle office change and reset dependent filters
  const handleOfficeChange = (officeName: string) => {
    setFilters({
      ...filters,
      officeName,
      serviceType: '', // Reset service type selection when office changes
      customerId: '' // Reset customer selection when office changes
    });
  };

  // Handle payment type change and reset dependent filters
  const handlePaymentTypeChange = (paymentType: string) => {
    setFilters({
      ...filters,
      paymentType,
      serviceType: '', // Reset service type selection when payment type changes
      customerId: '' // Reset customer selection when payment type changes
    });
  };

  // Apply top customers limit to report data based on total revenue ranking
  const applyTopCustomersLimit = (data: ReportData): ReportData => {
    if (!filters.topCustomersLimit || filters.topCustomersLimit === 'All Customers') {
      return data;
    }

    const limitNumber = parseInt(filters.topCustomersLimit.replace('Top ', ''));

    // Calculate total revenue per contract by summing all their revenue values
    const contractRevenues = new Map<string, number>();
    data.trafficData.forEach(item => {
      const contractId = item.customer.contractId; // Get contractId from the joined customer data
      const currentTotal = contractRevenues.get(contractId) || 0;
      // Sum up all revenue amounts for each contract (pure total revenue, no derived metrics)
      contractRevenues.set(contractId, currentTotal + item.revenue);
    });

    // Sort contracts by total revenue in descending order (highest revenue first)
    // This ensures top contracts are ranked purely by their absolute revenue contribution
    const sortedContractsByRevenue = Array.from(contractRevenues.entries())
      .sort((a, b) => b[1] - a[1]) // b[1] - a[1] = descending by revenue amount
      .slice(0, limitNumber); // Take only the top N contracts

    // Extract contract IDs in revenue-ranked order
    const topContractIds = sortedContractsByRevenue.map(([contractId]) => contractId);

    // Create a map for maintaining revenue-based ordering
    const contractOrderMap = new Map<string, number>();
    topContractIds.forEach((contractId, index) => {
      contractOrderMap.set(contractId, index);
    });

    // Filter contracts and maintain revenue-based ordering
    const filteredCustomers = data.customers
      .filter(customer => topContractIds.includes(customer.contractId))
      .sort((a, b) => {
        // Sort contracts by their revenue ranking (highest revenue first)
        const orderA = contractOrderMap.get(a.contractId) || 0;
        const orderB = contractOrderMap.get(b.contractId) || 0;
        return orderA - orderB;
      });

    // Filter traffic data for top contracts only
    const filteredTrafficData = data.trafficData.filter(item =>
      topContractIds.includes(item.customer.contractId) // Use customer.contractId from joined data
    );

    // Recalculate summary statistics for the top contracts
    const totalRevenue = filteredTrafficData.reduce((sum, item) => sum + (item.revenue || 0), 0);
    const totalTraffic = filteredTrafficData.reduce((sum, item) => sum + (item.trafficVolume || 0), 0);
    const averageRevenuePerCustomer = filteredCustomers.length > 0 ? totalRevenue / filteredCustomers.length : 0;

    return {
      customers: filteredCustomers, // Ordered by total revenue (highest first)
      trafficData: filteredTrafficData,
      summary: {
        totalCustomers: filteredCustomers.length,
        totalRevenue,
        totalTraffic,
        averageRevenuePerCustomer
      }
    };
  };

  // Helper function to apply top customers limit to consolidated export data
  const applyTopCustomersLimitToExport = (consolidatedData: any[]) => {
    if (!filters.topCustomersLimit || filters.topCustomersLimit === 'All Customers') {
      return consolidatedData;
    }

    const limitNumber = parseInt(filters.topCustomersLimit.replace('Top ', ''));
    return consolidatedData.slice(0, limitNumber);
  };

  // Helper function to apply top customers limit to monthly matrix export data
  const applyTopCustomersLimitToMonthlyMatrix = (customers: any[]) => {
    if (!filters.topCustomersLimit || filters.topCustomersLimit === 'All Customers') {
      return customers;
    }

    const limitNumber = parseInt(filters.topCustomersLimit.replace('Top ', ''));

    // Sort customers by total revenue (highest first) and take the top N
    const sortedCustomers = customers.sort((a, b) => {
      let totalRevenueA = 0;
      let totalRevenueB = 0;

      a.months.forEach((monthData: any) => {
        totalRevenueA += monthData.revenue;
      });

      b.months.forEach((monthData: any) => {
        totalRevenueB += monthData.revenue;
      });

      return totalRevenueB - totalRevenueA; // Descending order
    });

    return sortedCustomers.slice(0, limitNumber);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatNumber = (num: number | null | undefined) => {
    if (num === null || num === undefined || isNaN(num)) {
      return '-';
    }
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <p className="mt-2 text-gray-600">Generate comprehensive reports and analytics</p>
      </div>

      {/* Filters */}
      <div className="card mb-8">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Report Filters
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Date Filters */}
          <div>
            <label className="form-label">Start Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                e.preventDefault();
                const dateValue = e.target.value;
                if (dateValue && dateValue.length === 10) {
                  // Only update when we have a complete date (YYYY-MM-DD format)
                  const newDate = new Date(dateValue);
                  if (!isNaN(newDate.getTime())) {
                    setFilters({ ...filters, startDate: newDate });
                  }
                }
              }}
              onBlur={(e) => {
                // Update on blur as well to catch any manual edits
                const dateValue = e.target.value;
                if (dateValue && dateValue.length === 10) {
                  const newDate = new Date(dateValue);
                  if (!isNaN(newDate.getTime())) {
                    setFilters({ ...filters, startDate: newDate });
                  }
                }
              }}
            />
          </div>

          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => {
                e.preventDefault();
                const dateValue = e.target.value;
                if (dateValue && dateValue.length === 10) {
                  // Only update when we have a complete date (YYYY-MM-DD format)
                  const newDate = new Date(dateValue);
                  if (!isNaN(newDate.getTime())) {
                    setFilters({ ...filters, endDate: newDate });
                  }
                }
              }}
              onBlur={(e) => {
                // Update on blur as well to catch any manual edits
                const dateValue = e.target.value;
                if (dateValue && dateValue.length === 10) {
                  const newDate = new Date(dateValue);
                  if (!isNaN(newDate.getTime())) {
                    setFilters({ ...filters, endDate: newDate });
                  }
                }
              }}
            />
          </div>

          {/* Office Name Dropdown Filter */}
          <div>
            <label className="form-label">Office Name</label>
            <select
              className="form-input"
              value={filters.officeName || ''}
              onChange={(e) => handleOfficeChange(e.target.value)}
            >
              <option value="">All Offices</option>
              {getUniqueOffices().map((office) => (
                <option key={office} value={office}>{office}</option>
              ))}
            </select>
          </div>

          {/* Payment Type Dropdown Filter */}
          <div>
            <label className="form-label">Payment Type</label>
            <select
              className="form-input"
              value={filters.paymentType || ''}
              onChange={(e) => handlePaymentTypeChange(e.target.value)}
            >
              <option value="">All Payment Types</option>
              <option value="Advance">Advance</option>
              <option value="BNPL">BNPL</option>
            </select>
            {filters.officeName && (
              <p className="text-xs text-gray-500 mt-1">
                Showing payment types for {filters.officeName}
              </p>
            )}
          </div>

          {/* Service Type Dropdown Filter */}
          <div>
            <label className="form-label">Service Type</label>
            <select
              className="form-input"
              value={filters.serviceType || ''}
              onChange={(e) => setFilters({ ...filters, serviceType: e.target.value })}
            >
              <option value="">All Service Types</option>
              {getFilteredServiceTypes().map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            {(filters.officeName || filters.paymentType) && (
              <p className="text-xs text-gray-500 mt-1">
                Showing service types for {[
                  filters.officeName && `office: ${filters.officeName}`,
                  filters.paymentType && `payment type: ${filters.paymentType}`
                ].filter(Boolean).join(', ')}
              </p>
            )}
          </div>

          {/* Top Customers Limit Dropdown */}
          <div>
            <label className="form-label">Top Customers Limit</label>
            <select
              className="form-input"
              value={filters.topCustomersLimit || 'All Customers'}
              onChange={(e) => setFilters({ ...filters, topCustomersLimit: e.target.value })}
            >
              <option value="All Customers">All Customers</option>
              <option value="Top 10">Top 10</option>
              <option value="Top 20">Top 20</option>
              <option value="Top 30">Top 30</option>
              <option value="Top 50">Top 50</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Based on total revenue
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <button
              onClick={generateMonthWiseReport}
              disabled={generating || generatingConsolidated}
              className="btn-primary w-full"
            >
              {generating ? 'Generating...' : 'Generate Report Month-wise'}
            </button>
            <button
              onClick={generateConsolidatedReport}
              disabled={generating || generatingConsolidated}
              className="btn-secondary w-full"
              style={{
                background: 'linear-gradient(135deg, #f9a8d4 0%, #ec4899 100%)',
                color: 'white',
                border: 'none'
              }}
            >
              {generatingConsolidated ? 'Generating...' : 'Generate Consolidated Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="card">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalCustomers)}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.totalRevenue)}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <PieChart className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Traffic</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(reportData.summary.totalTraffic)}</p>
                </div>
              </div>
            </div>
            
            <div className="card">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg Revenue/Customer</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(reportData.summary.averageRevenuePerCustomer)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Month-wise Matrix or Consolidated Breakdown */}
          {((reportData as any).monthlyMatrix || (reportData as any).consolidatedData) && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  {(reportData as any).isConsolidated ? 'Consolidated Customer Summary' : 'Month-wise Customer Performance'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {(reportData as any).isConsolidated
                    ? 'Total performance by customer across the selected period'
                    : 'Traffic and revenue data by customer and month'}
                </p>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      {(reportData as any).isConsolidated ? (
                        <>
                          <th>Rank</th>
                          <th>Contract ID</th>
                          <th>Customer</th>
                          <th>Office</th>
                          <th>Payment Type</th>
                          <th>Total Revenue</th>
                          <th>Total Traffic</th>
                          <th>Records</th>
                          <th>Period</th>
                        </>
                      ) : (
                        <>
                          <th>SL No</th>
                          <th>Contract ID</th>
                          <th>Customer Name</th>
                          <th>Service Type</th>
                          <th>Customer ID</th>
                          {(reportData as any).monthlyMatrix?.months.map((month: string) => (
                            <React.Fragment key={month}>
                              <th className="text-center" style={{ color: '#831843' }}>
                                {new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}
                              </th>
                              <th className="text-center text-xs" style={{ color: '#be185d' }}>
                                Revenue
                              </th>
                            </React.Fragment>
                          ))}
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData as any).isConsolidated
                      ? (reportData as any).consolidatedData?.map((item: any, index: number) => (
                          <tr key={item.customer.contractId} className="table-row">
                            <td className="font-medium" style={{ color: '#831843' }}>#{index + 1}</td>
                            <td className="font-medium">{item.customer.contractId}</td>
                            <td className="font-medium">{item.customer.customerName}</td>
                            <td>{item.customer.officeName}</td>
                            <td>
                              <span className={`badge ${
                                item.customer.paymentType === 'Advance' ? 'badge-advance' : 'badge-bnpl'
                              }`}>
                                {item.customer.paymentType || 'Advance'}
                              </span>
                            </td>
                            <td className="font-semibold" style={{ color: '#be185d' }}>
                              {formatCurrency(item.totalRevenue)}
                            </td>
                            <td>{formatNumber(item.totalTraffic)}</td>
                            <td>{item.recordCount}</td>
                            <td className="text-sm text-gray-600">
                              {new Date(item.firstDate).toLocaleDateString()} - {new Date(item.lastDate).toLocaleDateString()}
                            </td>
                          </tr>
                        ))
                      : (reportData as any).monthlyMatrix?.customers.map((customerData: any, index: number) => (
                          <tr key={customerData.customer.contractId} className="table-row">
                            <td className="font-medium" style={{ color: '#831843' }}>{index + 1}</td>
                            <td className="font-medium">{customerData.customer.contractId}</td>
                            <td className="font-medium">{customerData.customer.customerName}</td>
                            <td>{customerData.customer.serviceType}</td>
                            <td>{customerData.customer.customerId}</td>
                            {(reportData as any).monthlyMatrix?.months.map((month: string) => {
                              const monthData = customerData.months.get(month);
                              return (
                                <React.Fragment key={`${customerData.customer.contractId}-${month}`}>
                                  <td className="text-center">
                                    {monthData ? formatNumber(monthData.traffic) : '-'}
                                  </td>
                                  <td className="text-center font-semibold" style={{ color: '#be185d' }}>
                                    {monthData ? formatCurrency(monthData.revenue) : '-'}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                          </tr>
                        ))
                    }
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Export Report</h3>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => exportReport('excel')}
                className="btn-primary flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </button>
              <button
                onClick={() => exportReport('pdf')}
                className="btn-secondary flex items-center"
                disabled
              >
                <Download className="h-4 w-4 mr-2" />
                Export to PDF (Coming Soon)
              </button>
            </div>
          </div>

          {/* Data Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Customers by Total Revenue */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  {filters.topCustomersLimit && filters.topCustomersLimit !== 'All Customers'
                    ? `${filters.topCustomersLimit} by Total Revenue`
                    : `Top Customers by Total Revenue (${reportData.customers.length})`}
                </h3>
                <p className="text-sm text-gray-500 mt-1">Ranked by cumulative revenue across selected date range</p>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th>Rank</th>
                      <th>Contract ID</th>
                      <th>Customer</th>
                      <th>Office</th>
                      <th>Total Revenue ↓</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {(() => {
                      // Calculate total revenue per customer for ranking display
                      const customerTotalRevenues = new Map<string, number>();
                      reportData.trafficData.forEach(item => {
                        const customerId = item.customer?.customerId || '';
                        const currentTotal = customerTotalRevenues.get(customerId) || 0;
                        customerTotalRevenues.set(customerId, currentTotal + item.revenue);
                      });

                      // Create customer ranking with total revenue
                      return reportData.customers
                        .map(customer => ({
                          ...customer,
                          totalRevenue: customerTotalRevenues.get(customer.customerId) || 0
                        }))
                        .sort((a, b) => b.totalRevenue - a.totalRevenue) // Sort by total revenue descending
                        .slice(0, 10)
                        .map((customer, index) => (
                          <tr key={customer.id}>
                            <td className="font-bold text-blue-600">#{index + 1}</td>
                            <td className="font-medium">{customer.contractId}</td>
                            <td className="font-medium">{customer.customerName}</td>
                            <td>{customer.officeName}</td>
                            <td className="font-bold text-green-600">{formatCurrency(customer.totalRevenue)}</td>
                          </tr>
                        ));
                    })()}
                  </tbody>
                </table>
                {reportData.customers.length > 10 && (
                  <p className="text-sm text-gray-500 p-4">
                    Showing top 10 of {reportData.customers.length} customers by total revenue
                  </p>
                )}
              </div>
            </div>

            {/* Individual Transaction Records */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Individual Transaction Records ({reportData.trafficData.length})</h3>
                <p className="text-sm text-gray-500 mt-1">Individual monthly records from top customers</p>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      <th>Date</th>
                      <th>Contract ID</th>
                      <th>Customer</th>
                      <th>Office</th>
                      <th>Service</th>
                      <th>Traffic</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="table-body">
                    {(() => {
                      // Calculate customer total revenues for sorting
                      const customerTotalRevenues = new Map<string, number>();
                      reportData.trafficData.forEach(item => {
                        const customerId = item.customer?.customerId || '';
                        const currentTotal = customerTotalRevenues.get(customerId) || 0;
                        customerTotalRevenues.set(customerId, currentTotal + item.revenue);
                      });

                      // Sort traffic data by customer's total revenue (not individual record revenue)
                      return reportData.trafficData
                        .sort((a, b) => {
                          const customerIdA = a.customer?.customerId || '';
                          const customerIdB = b.customer?.customerId || '';
                          const totalRevenueA = customerTotalRevenues.get(customerIdA) || 0;
                          const totalRevenueB = customerTotalRevenues.get(customerIdB) || 0;
                          // Primary sort: by customer total revenue (descending)
                          if (totalRevenueA !== totalRevenueB) {
                            return totalRevenueB - totalRevenueA;
                          }
                          // Secondary sort: by individual record revenue (descending)
                          return b.revenue - a.revenue;
                        })
                        .slice(0, 10)
                        .map((item) => {
                          // Handle the new joined data structure
                          const customer = (item as any).customer;
                          return (
                            <tr key={item.id}>
                              <td>{item.date.toLocaleDateString()}</td>
                              <td className="font-medium">{customer?.contractId || 'Unknown'}</td>
                              <td className="font-medium">{customer?.customerName || customer?.customerId || 'Unknown'}</td>
                              <td>{customer?.officeName || 'Unknown'}</td>
                              <td>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {item.serviceType}
                                </span>
                              </td>
                              <td>{formatNumber(item.trafficVolume)}</td>
                              <td className="font-medium text-green-600">{formatCurrency(item.revenue)}</td>
                            </tr>
                          );
                        });
                    })()}
                  </tbody>
                </table>
                {reportData.trafficData.length > 10 && (
                  <p className="text-sm text-gray-500 p-4">
                    Showing first 10 of {reportData.trafficData.length} records from top customers
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
