import { supabase } from './supabase';
import { TrafficData, TrafficDataWithCustomer, ApiResponse } from '../types';

const TRAFFIC_TABLE = 'traffic_data';

export const trafficService = {
  // Create traffic data entry
  async createTrafficData(trafficData: Omit<TrafficData, 'id' | 'createdAt'>): Promise<ApiResponse<TrafficData>> {
    try {
      const { data, error } = await supabase
        .from(TRAFFIC_TABLE)
        .insert([{
          contract_id: trafficData.contractId, // Changed from customer_id to contract_id
          date: trafficData.date.toISOString().split('T')[0], // Store as date string
          traffic_volume: trafficData.trafficVolume,
          revenue: trafficData.revenue,
          service_type: trafficData.serviceType,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      const newTrafficData: TrafficData = {
        id: data.id,
        contractId: data.contract_id, // Changed from customerId to contractId
        date: new Date(data.date),
        trafficVolume: data.traffic_volume,
        revenue: data.revenue,
        serviceType: data.service_type,
        createdAt: new Date(data.created_at)
      };

      return { success: true, data: newTrafficData };
    } catch (error) {
      console.error('Error creating traffic data:', error);
      return { success: false, error: 'Failed to create traffic data' };
    }
  },

  // Get all traffic data
  async getAllTrafficData(): Promise<ApiResponse<TrafficData[]>> {
    try {
      const { data, error } = await supabase
        .from(TRAFFIC_TABLE)
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const trafficData: TrafficData[] = data.map(row => ({
        id: row.id,
        contractId: row.contract_id, // Changed from customerId to contractId
        date: new Date(row.date),
        trafficVolume: row.traffic_volume,
        revenue: row.revenue,
        serviceType: row.service_type,
        createdAt: new Date(row.created_at)
      }));

      return { success: true, data: trafficData };
    } catch (error) {
      console.error('Error fetching traffic data:', error);
      return { success: false, error: 'Failed to fetch traffic data' };
    }
  },

  // Get traffic data by contract ID
  async getTrafficDataByContractId(contractId: string): Promise<ApiResponse<TrafficData[]>> {
    try {
      const { data, error } = await supabase
        .from(TRAFFIC_TABLE)
        .select('*')
        .eq('contract_id', contractId) // Changed from customer_id to contract_id
        .order('date', { ascending: false });

      if (error) throw error;

      const trafficData: TrafficData[] = data.map(row => ({
        id: row.id,
        contractId: row.contract_id, // Changed from customerId to contractId
        date: new Date(row.date),
        trafficVolume: row.traffic_volume,
        revenue: row.revenue,
        serviceType: row.service_type,
        createdAt: new Date(row.created_at)
      }));

      return { success: true, data: trafficData };
    } catch (error) {
      console.error('Error fetching traffic data by contract ID:', error);
      return { success: false, error: 'Failed to fetch traffic data' };
    }
  },

  // Get traffic data by customer ID (across all their contracts)
  async getTrafficDataByCustomerId(customerId: string): Promise<ApiResponse<TrafficData[]>> {
    try {
      // Join with customers table to get all contracts for this customer
      const { data, error } = await supabase
        .from(TRAFFIC_TABLE)
        .select(`
          *,
          customers!inner(customer_id)
        `)
        .eq('customers.customer_id', customerId)
        .order('date', { ascending: false });

      if (error) throw error;

      const trafficData: TrafficData[] = data.map(row => ({
        id: row.id,
        contractId: row.contract_id,
        date: new Date(row.date),
        trafficVolume: row.traffic_volume,
        revenue: row.revenue,
        serviceType: row.service_type,
        createdAt: new Date(row.created_at)
      }));

      return { success: true, data: trafficData };
    } catch (error) {
      console.error('Error fetching traffic data by customer ID:', error);
      return { success: false, error: 'Failed to fetch traffic data' };
    }
  },

  // Get traffic data by date range
  async getTrafficDataByDateRange(startDate: Date, endDate: Date): Promise<ApiResponse<TrafficData[]>> {
    try {
      const { data, error } = await supabase
        .from(TRAFFIC_TABLE)
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      const trafficData: TrafficData[] = data.map(row => ({
        id: row.id,
        contractId: row.contract_id, // Changed from customerId to contractId
        date: new Date(row.date),
        trafficVolume: row.traffic_volume,
        revenue: row.revenue,
        serviceType: row.service_type,
        createdAt: new Date(row.created_at)
      }));

      return { success: true, data: trafficData };
    } catch (error) {
      console.error('Error fetching traffic data by date range:', error);
      return { success: false, error: 'Failed to fetch traffic data' };
    }
  },

  // Update traffic data
  async updateTrafficData(id: string, updates: Partial<Omit<TrafficData, 'id' | 'createdAt'>>): Promise<ApiResponse<void>> {
    try {
      const updateData: any = {};

      if (updates.contractId) updateData.contract_id = updates.contractId; // Changed from customerId to contractId
      if (updates.date) updateData.date = updates.date.toISOString().split('T')[0];
      if (updates.trafficVolume !== undefined) updateData.traffic_volume = updates.trafficVolume;
      if (updates.revenue !== undefined) updateData.revenue = updates.revenue;
      if (updates.serviceType) updateData.service_type = updates.serviceType;

      const { error } = await supabase
        .from(TRAFFIC_TABLE)
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error updating traffic data:', error);
      return { success: false, error: 'Failed to update traffic data' };
    }
  },

  // Delete traffic data
  async deleteTrafficData(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from(TRAFFIC_TABLE)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error deleting traffic data:', error);
      return { success: false, error: 'Failed to delete traffic data' };
    }
  },

  // Bulk create traffic data (for Excel imports) - with enhanced validation for duplicates and Customer IDs
  async bulkCreateTrafficData(trafficDataArray: Omit<TrafficData, 'id' | 'createdAt'>[]): Promise<ApiResponse<{ inserted: number; failed: number; total: number; validationErrors?: string[] }>> {
    try {
      console.log('Bulk creating traffic data:', trafficDataArray.length, 'records');
      console.log('Sample data:', trafficDataArray[0]);

      // Import the excelService to use the validation method
      const { excelService } = await import('./excelService');

      // Perform comprehensive validation (Customer ID existence + duplicate checking)
      const { validationErrors, hasErrors } = await excelService.checkTrafficDatabaseValidation(trafficDataArray);

      // If validation errors found, prevent upload and return detailed errors
      if (hasErrors) {
        console.log('Validation errors found, preventing upload:', validationErrors);

        // Separate Customer ID errors from duplicate errors for better messaging
        const customerIdErrors = validationErrors.filter(error => error.includes('does not exist in the customer table'));
        const duplicateErrors = validationErrors.filter(error => error.includes('already exists in the system'));

        let errorMessage = 'Upload prevented due to validation errors:';
        if (customerIdErrors.length > 0) {
          errorMessage += ` ${customerIdErrors.length} invalid Customer ID(s) found.`;
        }
        if (duplicateErrors.length > 0) {
          errorMessage += ` ${duplicateErrors.length} duplicate traffic entry(ies) found.`;
        }

        return {
          success: false,
          error: errorMessage,
          message: `Traffic data upload prevented: ${validationErrors.length} validation error(s) found. Please correct the Excel file and retry.`,
          data: { inserted: 0, failed: trafficDataArray.length, total: trafficDataArray.length, validationErrors }
        };
      }

      // No validation errors found, proceed with insertion
      console.log('No validation errors found, proceeding with insertion of', trafficDataArray.length, 'traffic records');

      // Process all traffic data (validation already passed)
      const insertData = trafficDataArray.map((data, index) => {
        try {
          // Handle date conversion more safely
          let dateString: string;
          if (data.date instanceof Date) {
            dateString = data.date.toISOString().split('T')[0];
          } else {
            // If it's already a string, try to parse it
            const parsedDate = new Date(data.date);
            if (isNaN(parsedDate.getTime())) {
              throw new Error(`Invalid date at index ${index}: ${data.date}`);
            }
            dateString = parsedDate.toISOString().split('T')[0];
          }

          const record = {
            contract_id: data.contractId, // Changed from customer_id to contract_id
            date: dateString,
            traffic_volume: Number(data.trafficVolume) || 0,
            revenue: Number(data.revenue) || 0,
            service_type: data.serviceType,
            created_at: new Date().toISOString()
          };

          return record;
        } catch (recordError) {
          console.error(`Error processing record ${index}:`, recordError, data);
          throw recordError;
        }
      });

      console.log('Inserting traffic data to Supabase:', insertData.length, 'records');

      const { data, error } = await supabase
        .from(TRAFFIC_TABLE)
        .insert(insertData)
        .select();

      if (error) {
        console.error('Supabase insert error:', error);
        throw error;
      }

      const insertedCount = data?.length || 0;
      console.log('Successfully inserted:', insertedCount, 'records');

      return {
        success: true,
        data: { inserted: insertedCount, failed: 0, total: trafficDataArray.length },
        message: `Successfully imported all ${insertedCount} traffic records. No duplicates or invalid Customer IDs found.`
      };
    } catch (error) {
      console.error('Error bulk creating traffic data:', error);
      return {
        success: false,
        error: `Failed to bulk import traffic data: ${(error as Error).message}`,
        message: `Failed to bulk import traffic data: ${(error as Error).message}`,
        data: { inserted: 0, failed: trafficDataArray.length, total: trafficDataArray.length }
      };
    }
  },

  // Get comprehensive traffic data with customer information for reporting
  async getTrafficDataWithCustomers(filters?: {
    startDate?: Date;
    endDate?: Date;
    serviceType?: string;
    officeName?: string;
    customerId?: string;
    contractId?: string; // Add contractId filter
    paymentType?: string; // Add paymentType filter
  }): Promise<ApiResponse<TrafficDataWithCustomer[]>> {
    try {
      // First get all traffic data
      const { data: trafficData, error: trafficError } = await supabase
        .from(TRAFFIC_TABLE)
        .select('*')
        .order('date', { ascending: false });

      if (trafficError) throw trafficError;

      // Then get all customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*');

      if (customersError) throw customersError;

      // Create a map of customers by contract_id for efficient lookup
      const customersByContractId = new Map();
      customersData?.forEach(customer => {
        customersByContractId.set(customer.contract_id, customer);
      });

      // Filter traffic data and join with customers
      let filteredTrafficData = trafficData || [];

      // Apply traffic data filters
      if (filters?.startDate) {
        const startDateStr = filters.startDate.toISOString().split('T')[0];
        filteredTrafficData = filteredTrafficData.filter(item => item.date >= startDateStr);
      }
      if (filters?.endDate) {
        const endDateStr = filters.endDate.toISOString().split('T')[0];
        filteredTrafficData = filteredTrafficData.filter(item => item.date <= endDateStr);
      }
      if (filters?.serviceType) {
        filteredTrafficData = filteredTrafficData.filter(item => item.service_type === filters.serviceType);
      }
      if (filters?.contractId) {
        filteredTrafficData = filteredTrafficData.filter(item => item.contract_id === filters.contractId);
      }

      // Join traffic data with customers and apply customer-based filters
      const trafficDataWithCustomers = filteredTrafficData
        .map(trafficRow => {
          const customer = customersByContractId.get(trafficRow.contract_id);
          if (!customer) return null; // Skip if no matching customer found

          return {
            id: trafficRow.id,
            contractId: trafficRow.contract_id,
            date: new Date(trafficRow.date),
            trafficVolume: trafficRow.traffic_volume,
            revenue: trafficRow.revenue,
            serviceType: trafficRow.service_type,
            createdAt: new Date(trafficRow.created_at),
            customer: {
              id: customer.id,
              customerName: customer.customer_name,
              officeName: customer.office_name,
              serviceType: customer.service_type,
              customerId: customer.customer_id,
              contractId: customer.contract_id,
              paymentType: customer.payment_type || 'Advance',
              createdAt: new Date(customer.created_at),
              updatedAt: new Date(customer.updated_at)
            }
          };
        })
        .filter(item => item !== null) // Remove items without matching customers
        .filter(item => {
          // Apply customer-based filters
          if (filters?.customerId && item!.customer.customerId !== filters.customerId) return false;
          if (filters?.officeName && item!.customer.officeName !== filters.officeName) return false;
          if (filters?.paymentType && item!.customer.paymentType !== filters.paymentType) return false;
          return true;
        }) as TrafficDataWithCustomer[];

      return { success: true, data: trafficDataWithCustomers };
    } catch (error) {
      console.error('Error fetching traffic data with customers:', error);
      return { success: false, error: 'Failed to fetch traffic data with customer information' };
    }
  }
};
