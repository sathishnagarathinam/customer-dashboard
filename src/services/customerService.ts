import { supabase } from './supabase';
import { Customer, ApiResponse } from '../types';

const CUSTOMERS_TABLE = 'customers';

// Customer CRUD operations
export const customerService = {
  // Create a new customer
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await supabase
        .from(CUSTOMERS_TABLE)
        .insert([{
          customer_name: customerData.customerName,
          office_name: customerData.officeName,
          service_type: customerData.serviceType,
          customer_id: customerData.customerId,
          contract_id: customerData.contractId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const customer: Customer = {
        id: data.id,
        customerName: data.customer_name,
        officeName: data.office_name,
        serviceType: data.service_type,
        customerId: data.customer_id,
        contractId: data.contract_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: customer };
    } catch (error) {
      console.error('Error creating customer:', error);
      return { success: false, error: 'Failed to create customer' };
    }
  },

  // Get all customers
  async getAllCustomers(): Promise<ApiResponse<Customer[]>> {
    try {
      const { data, error } = await supabase
        .from(CUSTOMERS_TABLE)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customers: Customer[] = data.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        officeName: row.office_name,
        serviceType: row.service_type,
        customerId: row.customer_id,
        contractId: row.contract_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      return { success: true, data: customers };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return { success: false, error: 'Failed to fetch customers' };
    }
  },

  // Get customer by ID
  async getCustomerById(id: string): Promise<ApiResponse<Customer>> {
    try {
      const { data, error } = await supabase
        .from(CUSTOMERS_TABLE)
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { success: false, error: 'Customer not found' };
        }
        throw error;
      }

      const customer: Customer = {
        id: data.id,
        customerName: data.customer_name,
        officeName: data.office_name,
        serviceType: data.service_type,
        customerId: data.customer_id,
        contractId: data.contract_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: customer };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return { success: false, error: 'Failed to fetch customer' };
    }
  },

  // Update customer
  async updateCustomer(id: string, updates: Partial<Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ApiResponse<Customer>> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.customerName) updateData.customer_name = updates.customerName;
      if (updates.officeName) updateData.office_name = updates.officeName;
      if (updates.serviceType) updateData.service_type = updates.serviceType;
      if (updates.customerId) updateData.customer_id = updates.customerId;
      if (updates.contractId) updateData.contract_id = updates.contractId;

      const { data, error } = await supabase
        .from(CUSTOMERS_TABLE)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const customer: Customer = {
        id: data.id,
        customerName: data.customer_name,
        officeName: data.office_name,
        serviceType: data.service_type,
        customerId: data.customer_id,
        contractId: data.contract_id,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      return { success: true, data: customer };
    } catch (error) {
      console.error('Error updating customer:', error);
      return { success: false, error: 'Failed to update customer' };
    }
  },

  // Delete customer
  async deleteCustomer(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(CUSTOMERS_TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return { success: false, error: 'Failed to delete customer' };
    }
  },

  // Search customers
  async searchCustomers(searchTerm: string): Promise<ApiResponse<Customer[]>> {
    try {
      const { data, error } = await supabase
        .from(CUSTOMERS_TABLE)
        .select('*')
        .or(`customer_name.ilike.%${searchTerm}%,office_name.ilike.%${searchTerm}%,service_type.ilike.%${searchTerm}%,customer_id.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const customers: Customer[] = data.map(row => ({
        id: row.id,
        customerName: row.customer_name,
        officeName: row.office_name,
        serviceType: row.service_type,
        customerId: row.customer_id,
        contractId: row.contract_id,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at)
      }));

      return { success: true, data: customers };
    } catch (error) {
      console.error('Error searching customers:', error);
      return { success: false, error: 'Failed to search customers' };
    }
  },

  // Bulk create customers (for Excel imports) - prevents duplicates with validation
  async bulkCreateCustomers(customerDataArray: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<ApiResponse<{ inserted: number; skipped: number; total: number; duplicateErrors?: string[] }>> {
    try {
      console.log('Bulk creating customers:', customerDataArray.length, 'records');

      // Check for existing Customer IDs and Contract IDs in database
      const customerIds = customerDataArray.map(c => c.customerId);
      const contractIds = customerDataArray.map(c => c.contractId);

      // Check for existing Customer IDs
      const { data: existingCustomerIds, error: customerError } = await supabase
        .from(CUSTOMERS_TABLE)
        .select('customer_id')
        .in('customer_id', customerIds);

      if (customerError) {
        console.error('Error checking existing Customer IDs:', customerError);
        throw new Error(`Failed to check existing Customer IDs: ${customerError.message}`);
      }

      // Check for existing Contract IDs
      const { data: existingContractIds, error: contractError } = await supabase
        .from(CUSTOMERS_TABLE)
        .select('contract_id, customer_id')
        .in('contract_id', contractIds);

      if (contractError) {
        console.error('Error checking existing Contract IDs:', contractError);
        throw new Error(`Failed to check existing Contract IDs: ${contractError.message}`);
      }

      // Create sets for faster lookup
      const existingCustomerIdSet = new Set(existingCustomerIds?.map(c => c.customer_id) || []);
      const existingContractIdSet = new Set(existingContractIds?.map(c => c.contract_id) || []);

      // Check for duplicates and collect error messages
      const duplicateErrors: string[] = [];
      customerDataArray.forEach((customer, index) => {
        const rowNumber = index + 2; // Excel row number (accounting for header)

        if (existingCustomerIdSet.has(customer.customerId)) {
          duplicateErrors.push(`Row ${rowNumber}: Customer ID "${customer.customerId}" already exists in the system`);
        }

        if (existingContractIdSet.has(customer.contractId)) {
          duplicateErrors.push(`Row ${rowNumber}: Contract ID "${customer.contractId}" already exists in the system`);
        }
      });

      // If duplicates found, prevent upload and return error
      if (duplicateErrors.length > 0) {
        console.log('Duplicates found, preventing upload:', duplicateErrors);
        return {
          success: false,
          data: { inserted: 0, skipped: 0, total: customerDataArray.length, duplicateErrors },
          error: `Upload prevented due to duplicate IDs. Please correct the following issues and retry:`,
          message: `Upload prevented: ${duplicateErrors.length} duplicate ID(s) found. Please correct the Excel file and retry.`
        };
      }

      // No duplicates found, proceed with insertion
      console.log('No duplicates found, proceeding with insertion of', customerDataArray.length, 'customers');

      // Prepare data for insertion
      const insertData = customerDataArray.map(customer => ({
        customer_name: customer.customerName,
        office_name: customer.officeName,
        service_type: customer.serviceType,
        customer_id: customer.customerId,
        contract_id: customer.contractId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert all customers (no duplicates to worry about)
      const { data, error } = await supabase
        .from(CUSTOMERS_TABLE)
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      const insertedCount = data?.length || 0;
      console.log('Successfully inserted:', insertedCount, 'customers');

      return {
        success: true,
        data: { inserted: insertedCount, skipped: 0, total: customerDataArray.length },
        message: `Successfully imported all ${insertedCount} customers. No duplicates found.`
      };
    } catch (error) {
      console.error('Error bulk creating customers:', error);
      return {
        success: false,
        error: `Failed to bulk import customers: ${(error as Error).message}`,
        message: `Failed to bulk import customers: ${(error as Error).message}`
      };
    }
  }
};
