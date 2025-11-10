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
        customerId: filters.customerId
      });

      if (!trafficWithCustomersResponse.success || !trafficWithCustomersResponse.data) {
        throw new Error(trafficWithCustomersResponse.error || 'Failed to fetch report data');
      }

      const trafficWithCustomers = trafficWithCustomersResponse.data;

      // Group data by month for month-wise reporting
      const monthlyData = new Map();
      trafficWithCustomers.forEach(item => {
        const monthKey = new Date(item.date).toISOString().slice(0, 7); // YYYY-MM format
        if (!monthlyData.has(monthKey)) {
          monthlyData.set(monthKey, []);
        }
        monthlyData.get(monthKey).push(item);
      });

      // Extract unique customers from the traffic data
      const customerMap = new Map();
      trafficWithCustomers.forEach(item => {
        if (!customerMap.has(item.customer.customerId)) {
          customerMap.set(item.customer.customerId, item.customer);
        }
      });
      const uniqueCustomers = Array.from(customerMap.values());

      // Calculate summary statistics
      const totalRevenue = trafficWithCustomers.reduce((sum, item) => sum + item.revenue, 0);
      const totalTraffic = trafficWithCustomers.reduce((sum, item) => sum + item.trafficVolume, 0);
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

      // Apply top customers limit if specified and add month-wise breakdown
      const finalReport = applyTopCustomersLimit(report);
      // Add monthly breakdown to the report
      (finalReport as any).monthlyBreakdown = Array.from(monthlyData.entries()).map(([month, data]) => ({
        month,
        totalRevenue: data.reduce((sum: number, item: any) => sum + item.revenue, 0),
        totalTraffic: data.reduce((sum: number, item: any) => sum + item.trafficVolume, 0),
        customerCount: new Set(data.map((item: any) => item.customer.customerId)).size,
        records: data.length
      })).sort((a, b) => a.month.localeCompare(b.month));

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
        customerId: filters.customerId
      });

      if (!trafficWithCustomersResponse.success || !trafficWithCustomersResponse.data) {
        throw new Error(trafficWithCustomersResponse.error || 'Failed to fetch report data');
      }

      const trafficWithCustomers = trafficWithCustomersResponse.data;

      // Consolidate data by customer (sum all their records across the period)
      const consolidatedData = new Map();
      trafficWithCustomers.forEach(item => {
        const customerId = item.customer.customerId;
        if (!consolidatedData.has(customerId)) {
          consolidatedData.set(customerId, {
            customer: item.customer,
            totalRevenue: 0,
            totalTraffic: 0,
            recordCount: 0,
            firstDate: item.date,
            lastDate: item.date
          });
        }
        const existing = consolidatedData.get(customerId);
        existing.totalRevenue += item.revenue;
        existing.totalTraffic += item.trafficVolume;
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

      // Extract unique customers
      const uniqueCustomers = consolidatedArray.map(item => item.customer);

      // Calculate summary statistics
      const totalRevenue = consolidatedArray.reduce((sum, item) => sum + item.totalRevenue, 0);
      const totalTraffic = consolidatedArray.reduce((sum, item) => sum + item.totalTraffic, 0);
      const averageRevenuePerCustomer = uniqueCustomers.length > 0 ? totalRevenue / uniqueCustomers.length : 0;

      const report: ReportData = {
        customers: uniqueCustomers,
        trafficData: trafficWithCustomers, // Keep original data for export
        summary: {
          totalCustomers: uniqueCustomers.length,
          totalRevenue,
          totalTraffic,
          averageRevenuePerCustomer
        }
      };

      // Add consolidated breakdown to the report
      (report as any).consolidatedData = consolidatedArray.slice(0, parseInt(filters.topCustomersLimit || '10'));
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
      // Create comprehensive report with customer and traffic data joined
      const summaryData = [{
        'Report Type': 'Summary',
        'Total Customers': reportData.summary.totalCustomers,
        'Total Revenue': reportData.summary.totalRevenue,
        'Total Traffic': reportData.summary.totalTraffic,
        'Average Revenue per Customer': reportData.summary.averageRevenuePerCustomer.toFixed(2),
        'Report Generated': new Date().toLocaleDateString()
      }];

      // Calculate customer total revenues for proper sorting
      const customerTotalRevenues = new Map<string, number>();
      reportData.trafficData.forEach(item => {
        const customerId = item.customer.customerId; // Get customerId from joined customer data
        const currentTotal = customerTotalRevenues.get(customerId) || 0;
        customerTotalRevenues.set(customerId, currentTotal + item.revenue);
      });

      // Comprehensive traffic data with full customer information, sorted by customer total revenue (highest first)
      const comprehensiveData = reportData.trafficData
        .map(item => {
          // For the new joined data structure, customer info is already available
          const customer = (item as any).customer;
          const customerId = customer?.customerId || 'Unknown';
          return {
            'Date': `${item.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`, // Month and Year format
            'Customer Name': customer?.customerName || 'Unknown',
            'Customer ID': customerId,
            'Office Name': customer?.officeName || 'Unknown',
            'Contract ID': item.contractId || customer?.contractId || 'Unknown', // Use contractId from traffic data
            'Service Type': item.serviceType,
            'Payment Type': customer?.paymentType || 'Advance', // Added payment type to export
            'Traffic Volume': item.trafficVolume,
            'Revenue': item.revenue,
            'Revenue per Traffic': item.trafficVolume > 0 ? (item.revenue / item.trafficVolume).toFixed(2) : '0',
            // Add customer total revenue for sorting
            _customerTotalRevenue: customerTotalRevenues.get(customerId) || 0,
            _individualRevenue: item.revenue
          };
        })
        .sort((a, b) => {
          // Primary sort: by customer total revenue (descending)
          if (a._customerTotalRevenue !== b._customerTotalRevenue) {
            return b._customerTotalRevenue - a._customerTotalRevenue;
          }
          // Secondary sort: by individual record revenue (descending)
          return b._individualRevenue - a._individualRevenue;
        })
        .map(item => {
          // Remove the sorting fields from export
          const { _customerTotalRevenue, _individualRevenue, ...exportItem } = item;
          return exportItem;
        });

      // Export comprehensive data including summary
      const exportData = [...summaryData, ...comprehensiveData];
      excelService.exportToExcel(exportData, 'comprehensive-report', 'Report');
    }
  };

  const getUniqueValues = (array: any[], key: string) => {
    return [...new Set(array.map(item => item[key]))].filter(Boolean);
  };

  // Get filtered customers based on selected office and payment type
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

    // Calculate total revenue per customer by summing all their revenue values
    // Note: Traffic data now uses contractId, but we group by customer.customerId for customer-level reporting
    const customerRevenues = new Map<string, number>();
    data.trafficData.forEach(item => {
      const customerId = item.customer.customerId; // Get customerId from the joined customer data
      const currentTotal = customerRevenues.get(customerId) || 0;
      // Sum up all revenue amounts for each customer (pure total revenue, no derived metrics)
      customerRevenues.set(customerId, currentTotal + item.revenue);
    });

    // Sort customers by total revenue in descending order (highest revenue first)
    // This ensures top customers are ranked purely by their absolute revenue contribution
    const sortedCustomersByRevenue = Array.from(customerRevenues.entries())
      .sort((a, b) => b[1] - a[1]) // b[1] - a[1] = descending by revenue amount
      .slice(0, limitNumber); // Take only the top N customers

    // Extract customer IDs in revenue-ranked order
    const topCustomerIds = sortedCustomersByRevenue.map(([customerId]) => customerId);

    // Create a map for maintaining revenue-based ordering
    const customerOrderMap = new Map<string, number>();
    topCustomerIds.forEach((customerId, index) => {
      customerOrderMap.set(customerId, index);
    });

    // Filter customers and maintain revenue-based ordering
    const filteredCustomers = data.customers
      .filter(customer => topCustomerIds.includes(customer.customerId))
      .sort((a, b) => {
        // Sort customers by their revenue ranking (highest revenue first)
        const orderA = customerOrderMap.get(a.customerId) || 0;
        const orderB = customerOrderMap.get(b.customerId) || 0;
        return orderA - orderB;
      });

    // Filter traffic data for top customers only
    const filteredTrafficData = data.trafficData.filter(item =>
      topCustomerIds.includes(item.customer.customerId) // Use customer.customerId from joined data
    );

    // Recalculate summary statistics for the top customers
    const totalRevenue = filteredTrafficData.reduce((sum, item) => sum + item.revenue, 0);
    const totalTraffic = filteredTrafficData.reduce((sum, item) => sum + item.trafficVolume, 0);
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
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
              onChange={(e) => setFilters({ ...filters, startDate: new Date(e.target.value) })}
            />
          </div>

          <div>
            <label className="form-label">End Date</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate?.toISOString().split('T')[0] || ''}
              onChange={(e) => setFilters({ ...filters, endDate: new Date(e.target.value) })}
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

          {/* Customer Name Dropdown Filter (Cascading) */}
          <div>
            <label className="form-label">Customer Name</label>
            <select
              className="form-input"
              value={filters.customerId || ''}
              onChange={(e) => setFilters({ ...filters, customerId: e.target.value })}
            >
              <option value="">All Customers</option>
              {getFilteredCustomers().map((customer) => (
                <option key={customer.id} value={customer.customerId}>
                  {customer.customerName} ({customer.customerId})
                </option>
              ))}
            </select>
            {(filters.officeName || filters.paymentType) && (
              <p className="text-xs text-gray-500 mt-1">
                Showing customers filtered by {[
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

          {/* Month-wise or Consolidated Breakdown */}
          {((reportData as any).monthlyBreakdown || (reportData as any).consolidatedData) && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">
                  {(reportData as any).isConsolidated ? 'Consolidated Customer Summary' : 'Monthly Breakdown'}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {(reportData as any).isConsolidated
                    ? 'Total performance by customer across the selected period'
                    : 'Revenue and traffic data grouped by month'}
                </p>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="table">
                  <thead className="table-header">
                    <tr>
                      {(reportData as any).isConsolidated ? (
                        <>
                          <th>Rank</th>
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
                          <th>Month</th>
                          <th>Revenue</th>
                          <th>Traffic</th>
                          <th>Customers</th>
                          <th>Records</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {(reportData as any).isConsolidated
                      ? (reportData as any).consolidatedData?.map((item: any, index: number) => (
                          <tr key={item.customer.customerId} className="table-row">
                            <td className="font-medium" style={{ color: '#831843' }}>#{index + 1}</td>
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
                      : (reportData as any).monthlyBreakdown?.map((month: any) => (
                          <tr key={month.month} className="table-row">
                            <td className="font-medium" style={{ color: '#831843' }}>
                              {new Date(month.month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                            </td>
                            <td className="font-semibold" style={{ color: '#be185d' }}>
                              {formatCurrency(month.totalRevenue)}
                            </td>
                            <td>{formatNumber(month.totalTraffic)}</td>
                            <td>{month.customerCount}</td>
                            <td>{month.records}</td>
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
