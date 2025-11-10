// Customer data types
export interface Customer {
  id: string;
  customerName: string;
  officeName: string;
  serviceType: string;
  customerId: string;
  contractId: string;
  paymentType: 'Advance' | 'BNPL'; // Added payment type field
  createdAt: Date;
  updatedAt: Date;
}

// Traffic and Revenue data types
export interface TrafficData {
  id: string;
  contractId: string; // Changed from customerId to contractId
  date: Date;
  trafficVolume: number;
  revenue: number;
  serviceType: string;
  createdAt: Date;
}

// Report types
export interface ReportFilter {
  startDate?: Date;
  endDate?: Date;
  officeName?: string;
  serviceType?: string;
  paymentType?: string; // Added payment type filter
  customerId?: string; // Keep customerId for customer-level filtering
  contractId?: string; // Add contractId for contract-level filtering
  topCustomersLimit?: string;
}

export interface ReportData {
  customers: Customer[];
  trafficData: TrafficData[];
  summary: {
    totalCustomers: number;
    totalRevenue: number;
    totalTraffic: number;
    averageRevenuePerCustomer: number;
  };
}

// Excel upload types
export interface ExcelUploadResult {
  success: boolean;
  message: string;
  data?: any[];
  errors?: string[];
}

// Chart data types
export interface ChartData {
  name: string;
  value: number;
  date?: string;
}

// Dashboard stats
export interface DashboardStats {
  totalCustomers: number;
  totalRevenue: number;
  totalTraffic: number;
  monthlyGrowth: number;
}

// Form validation
export interface ValidationError {
  field: string;
  message: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
