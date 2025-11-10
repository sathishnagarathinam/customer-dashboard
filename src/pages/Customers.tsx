import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, Download } from 'lucide-react';
import { customerService } from '../services/customerService';
import { excelService } from '../services/excelService';
import { Customer } from '../types';

const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOfficeName, setFilterOfficeName] = useState('');
  const [filterServiceType, setFilterServiceType] = useState('');
  const [filterPaymentType, setFilterPaymentType] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    officeName: '',
    serviceType: '',
    customerId: '',
    contractId: '',
    paymentType: 'Advance' as 'Advance' | 'BNPL' // Added payment type with default
  });

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchTerm, filterOfficeName, filterServiceType, filterPaymentType]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const response = await customerService.getAllCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error('Error loading customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Search term filter
    if (searchTerm) {
      filtered = filtered.filter(customer =>
        customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.officeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.serviceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contractId.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Office name filter
    if (filterOfficeName) {
      filtered = filtered.filter(customer => customer.officeName === filterOfficeName);
    }

    // Service type filter
    if (filterServiceType) {
      filtered = filtered.filter(customer => customer.serviceType === filterServiceType);
    }

    // Payment type filter
    if (filterPaymentType) {
      filtered = filtered.filter(customer => customer.paymentType === filterPaymentType);
    }

    setFilteredCustomers(filtered);
  };

  // Helper functions to get unique values for filter dropdowns
  const getUniqueOfficeNames = () => {
    return [...new Set(customers.map(customer => customer.officeName))].filter(Boolean).sort();
  };

  const getUniqueServiceTypes = () => {
    return [...new Set(customers.map(customer => customer.serviceType))].filter(Boolean).sort();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCustomer) {
        const response = await customerService.updateCustomer(editingCustomer.id, formData);
        if (response.success) {
          await loadCustomers();
          setEditingCustomer(null);
        }
      } else {
        const response = await customerService.createCustomer(formData);
        if (response.success) {
          await loadCustomers();
          setShowAddModal(false);
        }
      }
      
      setFormData({
        customerName: '',
        officeName: '',
        serviceType: '',
        customerId: '',
        contractId: '',
        paymentType: 'Advance' // Added payment type reset
      });
    } catch (error) {
      console.error('Error saving customer:', error);
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      customerName: customer.customerName,
      officeName: customer.officeName,
      serviceType: customer.serviceType,
      customerId: customer.customerId,
      contractId: customer.contractId,
      paymentType: customer.paymentType || 'Advance' // Added payment type with fallback
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const response = await customerService.deleteCustomer(id);
        if (response.success) {
          await loadCustomers();
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const handleExport = () => {
    const exportData = customers.map(customer => ({
      'Customer Name': customer.customerName,
      'Office Name': customer.officeName,
      'Service Type': customer.serviceType,
      'Customer ID': customer.customerId,
      'Contract ID': customer.contractId,
      'Payment Type': customer.paymentType, // Added payment type to export
      'Created At': customer.createdAt.toLocaleDateString()
    }));
    
    excelService.exportToExcel(exportData, 'customers', 'Customers');
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      officeName: '',
      serviceType: '',
      customerId: '',
      contractId: '',
      paymentType: 'Advance' // Added payment type reset
    });
    setEditingCustomer(null);
    setShowAddModal(false);
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
            <h1 className="text-3xl font-bold text-gray-900">Customers</h1>
            <p className="mt-2 text-gray-600">Manage your customer database</p>
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
              Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search customers..."
            className="form-input pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div>
          <select
            className="form-input"
            value={filterOfficeName}
            onChange={(e) => setFilterOfficeName(e.target.value)}
          >
            <option value="">All Offices</option>
            {getUniqueOfficeNames().map((office) => (
              <option key={office} value={office}>{office}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            className="form-input"
            value={filterServiceType}
            onChange={(e) => setFilterServiceType(e.target.value)}
          >
            <option value="">All Service Types</option>
            {getUniqueServiceTypes().map((serviceType) => (
              <option key={serviceType} value={serviceType}>{serviceType}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            className="form-input"
            value={filterPaymentType}
            onChange={(e) => setFilterPaymentType(e.target.value)}
          >
            <option value="">All Payment Types</option>
            <option value="Advance">Advance</option>
            <option value="BNPL">BNPL</option>
          </select>
        </div>

        <div>
          <button
            onClick={() => {
              setSearchTerm('');
              setFilterOfficeName('');
              setFilterServiceType('');
              setFilterPaymentType('');
            }}
            className="btn btn-secondary w-full"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th>Customer Name</th>
                <th>Office Name</th>
                <th>Service Type</th>
                <th>Payment Type</th>
                <th>Customer ID</th>
                <th>Contract ID</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="font-medium">{customer.customerName}</td>
                  <td>{customer.officeName}</td>
                  <td>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {customer.serviceType}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${
                      customer.paymentType === 'Advance'
                        ? 'badge-advance'
                        : 'badge-bnpl'
                    }`}>
                      {customer.paymentType || 'Advance'}
                    </span>
                  </td>
                  <td>{customer.customerId}</td>
                  <td>{customer.contractId}</td>
                  <td>{customer.createdAt.toLocaleDateString()}</td>
                  <td>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
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
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No customers found
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
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Office Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.officeName}
                    onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                    required
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
                
                <div>
                  <label className="form-label">Customer ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.customerId}
                    onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                    required
                  />
                </div>
                
                <div>
                  <label className="form-label">Contract ID</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.contractId}
                    onChange={(e) => setFormData({ ...formData, contractId: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Payment Type</label>
                  <select
                    className="form-input"
                    value={formData.paymentType}
                    onChange={(e) => setFormData({ ...formData, paymentType: e.target.value as 'Advance' | 'BNPL' })}
                    required
                  >
                    <option value="Advance">Advance</option>
                    <option value="BNPL">BNPL</option>
                  </select>
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
                    {editingCustomer ? 'Update' : 'Create'}
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

export default Customers;
