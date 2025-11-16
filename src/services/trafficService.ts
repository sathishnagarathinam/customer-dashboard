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

  // Get the last upload batch information
  async getLastUploadBatch(): Promise<ApiResponse<{ batchId: string; count: number; uploadedAt: Date } | null>> {
    try {
      // Get the most recent batch_id and its upload time
      const { data, error } = await supabase
        .from(TRAFFIC_TABLE)
        .select('batch_id, created_at')
        .not('batch_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { success: true, data: null };
      }

      const batchId = data[0].batch_id;
      const uploadedAt = new Date(data[0].created_at);

      // Count records in this batch
      const { count, error: countError } = await supabase
        .from(TRAFFIC_TABLE)
        .select('*', { count: 'exact', head: true })
        .eq('batch_id', batchId);

      if (countError) throw countError;

      return {
        success: true,
        data: {
          batchId,
          count: count || 0,
          uploadedAt
        }
      };
    } catch (error) {
      console.error('Error getting last upload batch:', error);
      return { success: false, error: 'Failed to get last upload batch information' };
    }
  },

  // Revert the last upload batch
  async revertLastUpload(): Promise<ApiResponse<{ deleted: number; batchId: string }>> {
    try {
      // Get the last batch info first
      const lastBatchResponse = await this.getLastUploadBatch();

      if (!lastBatchResponse.success || !lastBatchResponse.data) {
        return {
          success: false,
          error: 'No recent upload found to revert',
          message: 'No recent upload found to revert'
        };
      }

      const { batchId, count } = lastBatchResponse.data;

      // Delete all records with this batch_id
      const { error } = await supabase
        .from(TRAFFIC_TABLE)
        .delete()
        .eq('batch_id', batchId);

      if (error) throw error;

      return {
        success: true,
        data: { deleted: count, batchId },
        message: `Successfully reverted upload: deleted ${count} traffic records`
      };
    } catch (error) {
      console.error('Error reverting last upload:', error);
      return {
        success: false,
        error: `Failed to revert last upload: ${(error as Error).message}`,
        message: `Failed to revert last upload: ${(error as Error).message}`
      };
    }
  },

  // Bulk create traffic data (for Excel imports) - with enhanced validation for duplicates and Customer IDs
  async bulkCreateTrafficData(trafficDataArray: Omit<TrafficData, 'id' | 'createdAt'>[]): Promise<ApiResponse<{ inserted: number; failed: number; total: number; validationErrors?: string[]; batchId?: string }>> {
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

      // Generate a unique batch ID for this upload
      const batchId = `batch_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      console.log('Generated batch ID:', batchId);

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
            batch_id: batchId, // Add batch_id to track this upload
            created_at: new Date().toISOString()
          };

          return record;
        } catch (recordError) {
          console.error(`Error processing record ${index}:`, recordError, data);
          throw recordError;
        }
      });

      console.log('Inserting traffic data to Supabase:', insertData.length, 'records with batch_id:', batchId);

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
        data: { inserted: insertedCount, failed: 0, total: trafficDataArray.length, batchId },
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

      // Track orphaned records (traffic without matching customers)
      const orphanedRecords: { contractId: string; count: number; totalTraffic: number }[] = [];
      const orphanedContractIds = new Map<string, { count: number; totalTraffic: number }>();

      // Join traffic data with customers and apply customer-based filters
      const trafficDataWithCustomers = filteredTrafficData
        .map(trafficRow => {
          const customer = customersByContractId.get(trafficRow.contract_id);
          if (!customer) {
            // Track orphaned record
            const existing = orphanedContractIds.get(trafficRow.contract_id) || { count: 0, totalTraffic: 0 };
            existing.count += 1;
            existing.totalTraffic += trafficRow.traffic_volume || 0;
            orphanedContractIds.set(trafficRow.contract_id, existing);
            return null; // Skip if no matching customer found
          }

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

      // Log warning if orphaned records found
      if (orphanedContractIds.size > 0) {
        orphanedContractIds.forEach((stats, contractId) => {
          orphanedRecords.push({ contractId, count: stats.count, totalTraffic: stats.totalTraffic });
        });

        const totalOrphaned = orphanedRecords.reduce((sum, r) => sum + r.count, 0);
        const totalOrphanedTraffic = orphanedRecords.reduce((sum, r) => sum + r.totalTraffic, 0);

        console.warn(
          `⚠️ WARNING: ${totalOrphaned} traffic records excluded from report (no matching customer). ` +
          `Total traffic volume excluded: ${totalOrphanedTraffic}. ` +
          `Affected Contract IDs:`,
          orphanedRecords
        );
      }

      return { success: true, data: trafficDataWithCustomers };
    } catch (error) {
      console.error('Error fetching traffic data with customers:', error);
      return { success: false, error: 'Failed to fetch traffic data with customer information' };
    }
  }
};
