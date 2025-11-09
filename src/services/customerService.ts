import { supabase } from './supabase';
import { Customer, ApiResponse } from '../types';

const CUSTOMERS_TABLE = 'customers';

// Customer CRUD operations
export const customerService = {
  // Create a new customer (contract_id must be unique)
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Customer>> {
    try {
      // Check if contract_id already exists
      const { data: existingContract, error: checkError } = await supabase
        .from(CUSTOMERS_TABLE)
        .select('contract_id, customer_name')
        .eq('contract_id', customerData.contractId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
        throw checkError;
      }

      if (existingContract) {
        return {
          success: false,
          error: `Contract ID "${customerData.contractId}" already exists for customer "${existingContract.customer_name}"`
        };
      }

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

      // Check for existing Contract IDs in database (contract_id is the unique identifier)
      // Note: Multiple customer_id entries are allowed, but contract_id must be unique
      const contractIds = customerDataArray.map(c => c.contractId);

      // Check for existing Contract IDs
      const { data: existingContractIds, error: contractError } = await supabase
        .from(CUSTOMERS_TABLE)
        .select('contract_id, customer_id, customer_name')
        .in('contract_id', contractIds);

      if (contractError) {
        console.error('Error checking existing Contract IDs:', contractError);
        throw new Error(`Failed to check existing Contract IDs: ${contractError.message}`);
      }

      console.log('Existing Contract IDs found:', existingContractIds?.length || 0);

      // Create set for faster lookup of existing contract IDs
      const existingContractIdSet = new Set(existingContractIds?.map((c: any) => c.contract_id) || []);

      // Separate new contracts from existing ones
      const duplicateContractIds: string[] = [];
      const newCustomers: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>[] = [];

      customerDataArray.forEach(customer => {
        if (existingContractIdSet.has(customer.contractId)) {
          duplicateContractIds.push(customer.contractId);
        } else {
          newCustomers.push(customer);
        }
      });

      // If all contracts already exist, return skip message
      if (duplicateContractIds.length === customerDataArray.length) {
        const duplicateErrors = [`All Contract IDs already exist: ${duplicateContractIds.join(', ')}`];

        console.log('All contracts already exist, skipping insertion:', duplicateErrors);

        return {
          success: true,
          message: `Upload completed - all contracts already exist in the system. Skipped ${duplicateContractIds.length} duplicate contracts.`,
          data: {
            inserted: 0,
            skipped: customerDataArray.length,
            total: customerDataArray.length,
            duplicateErrors
          }
        };
      }

      // If some duplicates exist, proceed with inserting only new contracts
      if (duplicateContractIds.length > 0) {
        console.log(`Found ${duplicateContractIds.length} duplicate contracts, proceeding with ${newCustomers.length} new contracts`);
      }

      // Proceed with insertion of new contracts only
      console.log('Proceeding with insertion of', newCustomers.length, 'new contracts');

      // Prepare data for insertion (only new contracts)
      const insertData = newCustomers.map(customer => ({
        customer_name: customer.customerName,
        office_name: customer.officeName,
        service_type: customer.serviceType,
        customer_id: customer.customerId,
        contract_id: customer.contractId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      // Insert new customers with conflict resolution on contract_id
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

      // Prepare success message
      let message = `Successfully imported ${insertedCount} customers`;
      if (duplicateContractIds.length > 0) {
        message += ` (skipped ${duplicateContractIds.length} existing contracts)`;
      }

      return {
        success: true,
        data: { inserted: insertedCount, skipped: duplicateContractIds.length, total: customerDataArray.length },
        message
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
