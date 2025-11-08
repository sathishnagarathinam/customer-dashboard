import React, { useState, useEffect } from 'react';
import { Users, IndianRupee, TrendingUp, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { customerService } from '../services/customerService';
import { trafficService } from '../services/trafficService';
import { DashboardStats } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    totalRevenue: 0,
    totalTraffic: 0,
    monthlyGrowth: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load customers
      const customersResponse = await customerService.getAllCustomers();
      const customers = customersResponse.data || [];
      
      // Load traffic data
      const trafficResponse = await trafficService.getAllTrafficData();
      const trafficData = trafficResponse.data || [];
      
      // Calculate stats
      const totalRevenue = trafficData.reduce((sum, item) => sum + item.revenue, 0);
      const totalTraffic = trafficData.reduce((sum, item) => sum + item.trafficVolume, 0);
      
      // Calculate monthly growth (simplified - comparing last 30 days vs previous 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
      
      const recentRevenue = trafficData
        .filter(item => item.date >= thirtyDaysAgo)
        .reduce((sum, item) => sum + item.revenue, 0);
      
      const previousRevenue = trafficData
        .filter(item => item.date >= sixtyDaysAgo && item.date < thirtyDaysAgo)
        .reduce((sum, item) => sum + item.revenue, 0);
      
      const monthlyGrowth = previousRevenue > 0 
        ? ((recentRevenue - previousRevenue) / previousRevenue) * 100 
        : 0;
      
      setStats({
        totalCustomers: customers.length,
        totalRevenue,
        totalTraffic,
        monthlyGrowth
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Welcome SARAN</h1>
        <p className="mt-2 text-gray-600">Overview of your customer data and performance metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalCustomers)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <IndianRupee className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Traffic</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(stats.totalTraffic)}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className={`h-8 w-8 ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Growth</p>
              <p className={`text-2xl font-bold ${stats.monthlyGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/customers')}
              className="btn-primary w-full text-left hover:bg-blue-700 transition-colors"
            >
              Add New Customer
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="btn-secondary w-full text-left hover:bg-gray-300 transition-colors"
            >
              Upload Traffic Data
            </button>
            <button
              onClick={() => navigate('/reports')}
              className="btn-secondary w-full text-left hover:bg-gray-300 transition-colors"
            >
              Generate Report
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <p>• New customer added: ABC Corp</p>
            <p>• Traffic data uploaded for Q4</p>
            <p>• Monthly report generated</p>
            <p>• 5 customers updated</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Online
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Available
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Backup</span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                Scheduled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
