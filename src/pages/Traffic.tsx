import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Download, Filter } from 'lucide-react';
import { trafficService } from '../services/trafficService';
import { customerService } from '../services/customerService';
import { excelService } from '../services/excelService';
import { TrafficData, Customer } from '../types';

const Traffic: React.FC = () => {
  const [trafficData, setTrafficData] = useState<TrafficData[]>([]);
  const [filteredData, setFilteredData] = useState<TrafficData[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomerId, setFilterCustomerId] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingData, setEditingData] = useState<TrafficData | null>(null);
  const [formData, setFormData] = useState({
    customerId: '',
    date: '',
    trafficVolume: '',
    revenue: '',
    serviceType: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [trafficData, searchTerm, filterCustomerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [trafficResponse, customersResponse] = await Promise.all([
        trafficService.getAllTrafficData(),
        customerService.getAllCustomers()
      ]);
      
      if (trafficResponse.success && trafficResponse.data) {
        setTrafficData(trafficResponse.data);
      }
      
      if (customersResponse.success && customersResponse.data) {
        setCustomers(customersResponse.data);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = trafficData;
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.serviceType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterCustomerId) {
      filtered = filtered.filter(item => item.customerId === filterCustomerId);
    }
    
    setFilteredData(filtered);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        customerId: formData.customerId,
        date: new Date(formData.date),
        trafficVolume: Number(formData.trafficVolume),
        revenue: Number(formData.revenue),
        serviceType: formData.serviceType
      };
      
      if (editingData) {
        const response = await trafficService.updateTrafficData(editingData.id, data);
        if (response.success) {
          await loadData();
          setEditingData(null);
        }
      } else {
        const response = await trafficService.createTrafficData(data);
        if (response.success) {
          await loadData();
          setShowAddModal(false);
        }
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving traffic data:', error);
    }
  };

  const handleEdit = (data: TrafficData) => {
    setEditingData(data);
    setFormData({
      customerId: data.customerId,
      date: data.date.toISOString().split('T')[0],
      trafficVolume: data.trafficVolume.toString(),
      revenue: data.revenue.toString(),
      serviceType: data.serviceType
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this traffic data?')) {
      try {
        const response = await trafficService.deleteTrafficData(id);
        if (response.success) {
          await loadData();
        }
      } catch (error) {
        console.error('Error deleting traffic data:', error);
      }
    }
  };

  const handleExport = () => {
    const exportData = filteredData.map(item => ({
      'Customer ID': item.customerId,
      'Date': item.date.toLocaleDateString(),
      'Traffic Volume': item.trafficVolume,
      'Revenue': item.revenue,
      'Service Type': item.serviceType
    }));
    
    excelService.exportToExcel(exportData, 'traffic-data', 'Traffic Data');
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      date: '',
      trafficVolume: '',
      revenue: '',
      serviceType: ''
    });
    setEditingData(null);
    setShowAddModal(false);
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.customerId === customerId);
    return customer ? customer.customerName : customerId;
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
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Traffic & Revenue</h1>
            <p className="mt-2 text-gray-600">Manage traffic and revenue data</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleExport}
              className="btn-secondary flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Data
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search by Customer ID or Service Type..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            className="form-input pl-10"
            value={filterCustomerId}
            onChange={(e) => setFilterCustomerId(e.target.value)}
          >
            <option value="">All Customers</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.customerId}>
                {customer.customerName} ({customer.customerId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Traffic Data Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Customer</th>
                <th>Date</th>
                <th>Traffic Volume</th>
                <th>Revenue</th>
                <th>Service Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredData.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div>
                      <div className="font-medium">{getCustomerName(item.customerId)}</div>
                      <div className="text-sm text-gray-500">{item.customerId}</div>
                    </div>
                  </td>
                  <td>{item.date.toLocaleDateString()}</td>
                  <td>{formatNumber(item.trafficVolume)}</td>
                  <td className="font-medium text-green-600">{formatCurrency(item.revenue)}</td>
                  <td>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {item.serviceType}
                    </span>
                  </td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No traffic data found
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingData ? 'Edit Traffic Data' : 'Add New Traffic Data'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Customer</label>
                  <select
                    className="form-input"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((customer) => (
                      <option key={customer.id} value={customer.customerId}>
                        {customer.customerName} ({customer.customerId})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Traffic Volume</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.trafficVolume}
                    onChange={(e) => setFormData({ ...formData, trafficVolume: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="form-label">Revenue ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    value={formData.revenue}
                    onChange={(e) => setFormData({ ...formData, revenue: e.target.value })}
                    required
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="form-label">Service Type</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.serviceType}
                    onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingData ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Traffic;
