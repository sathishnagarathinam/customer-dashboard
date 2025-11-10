import React, { useState } from 'react';
import { Upload as UploadIcon, FileSpreadsheet, AlertCircle, CheckCircle, X } from 'lucide-react';
import { excelService } from '../services/excelService';
import { customerService } from '../services/customerService';
import { trafficService } from '../services/trafficService';
import { ExcelUploadResult } from '../types';

const Upload: React.FC = () => {
  const [uploadType, setUploadType] = useState<'customers' | 'traffic'>('customers');
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ExcelUploadResult | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    console.log('Processing file:', file.name, file.type, file.size);

    if (!file.name.match(/\.(xlsx|xls)$/)) {
      setUploadResult({
        success: false,
        message: 'Please upload a valid Excel file (.xlsx or .xls)',
        errors: ['Invalid file format']
      });
      return;
    }

    setUploading(true);
    setUploadResult(null);
    setPreviewData([]);
    setShowPreview(false);

    try {
      console.log('Starting file processing for type:', uploadType);
      let result: ExcelUploadResult;

      if (uploadType === 'customers') {
        result = await excelService.parseCustomerExcel(file);
      } else {
        result = await excelService.parseTrafficExcel(file);
      }

      console.log('Processing result:', result);
      setUploadResult(result);

      if (result.success && result.data) {
        setPreviewData(result.data.slice(0, 10)); // Show first 10 rows for preview
        setShowPreview(true);
      }
    } catch (error) {
      console.error('File processing error:', error);
      setUploadResult({
        success: false,
        message: 'Error processing file: ' + (error as Error).message,
        errors: ['Failed to parse Excel file: ' + (error as Error).message]
      });
    } finally {
      setUploading(false);
    }
  };

  const handleImport = async () => {
    if (!uploadResult?.data) return;

    setUploading(true);

    try {
      if (uploadType === 'customers') {
        // Import customers using bulk method with duplicate handling
        console.log('Starting bulk import of customer data:', uploadResult.data);
        const response = await customerService.bulkCreateCustomers(uploadResult.data);
        console.log('Bulk customer import response:', response);

        // Update the upload result with detailed information
        if (response.success && response.data) {
          setUploadResult({
            success: true,
            message: response.message || `Successfully imported ${response.data.inserted} customers`,
            data: uploadResult.data,
            errors: response.data.skipped > 0 ? [`${response.data.skipped} customers were skipped (already exist)`] : undefined
          });
        } else {
          // Handle duplicate validation errors with detailed feedback
          const errorMessages = [response.error || 'Failed to import customers'];

          // Add duplicate error details if present
          if (response.data?.duplicateErrors && response.data.duplicateErrors.length > 0) {
            errorMessages.push(''); // Empty line for separation
            errorMessages.push('Duplicate ID Details:');
            errorMessages.push(...response.data.duplicateErrors);
            errorMessages.push(''); // Empty line for separation
            errorMessages.push('Please correct the Excel file by:');
            errorMessages.push('• Removing duplicate Customer IDs and Contract IDs');
            errorMessages.push('• Using unique IDs for each customer record');
            errorMessages.push('• Checking existing customers in the system before upload');
          }

          setUploadResult({
            success: false,
            message: response.message || 'Upload prevented due to duplicate IDs',
            errors: errorMessages
          });
        }
      } else {
        // Import traffic data in bulk with foreign key validation
        console.log('Starting bulk import of traffic data:', uploadResult.data);
        const response = await trafficService.bulkCreateTrafficData(uploadResult.data);
        console.log('Bulk traffic import response:', response);

        // Update the upload result with detailed information
        if (response.success && response.data) {
          setUploadResult({
            success: true,
            message: response.message || `Successfully imported ${response.data.inserted} traffic records`,
            data: uploadResult.data
          });
        } else {
          // Handle validation errors with detailed feedback
          const errorMessages = [response.error || 'Failed to import traffic data'];

          // Add validation error details if present
          if (response.data?.validationErrors && response.data.validationErrors.length > 0) {
            errorMessages.push(''); // Empty line for separation
            errorMessages.push('Validation Error Details:');
            errorMessages.push(...response.data.validationErrors);
            errorMessages.push(''); // Empty line for separation
            errorMessages.push('Please correct the Excel file by:');
            errorMessages.push('• Ensuring all Customer IDs exist in the customer table');
            errorMessages.push('• Removing duplicate traffic entries (same Customer ID + Date)');
            errorMessages.push('• Verifying all dates are valid and properly formatted');
          }

          setUploadResult({
            success: false,
            message: response.message || 'Upload prevented due to validation errors',
            errors: errorMessages
          });
        }
      }

      setShowPreview(false);
      setPreviewData([]);
    } catch (error) {
      console.error('Import error:', error);
      setUploadResult({
        success: false,
        message: 'Error importing data: ' + (error as Error).message,
        errors: ['Failed to import data to database: ' + (error as Error).message]
      });
    } finally {
      setUploading(false);
    }
  };

  const downloadTemplate = () => {
    if (uploadType === 'customers') {
      const template = [{
        'Customer Name': 'Example Corp',
        'Office Name': 'Main Office',
        'Service Type': 'Premium',
        'Customer ID': 'CUST001',
        'Contract ID': 'CONT001',
        'Payment Type': 'Advance' // Added payment type to template
      }];
      excelService.exportToExcel(template, 'customer-template', 'Template');
    } else {
      const template = [{
        'Contract ID': 'CONT001', // Changed from 'Customer ID' to 'Contract ID'
        'Date': '2024-01-01',
        'Traffic': 1000,
        'Revenue': 5000.00,
        'Service Type': 'Premium'
      }];
      excelService.exportToExcel(template, 'traffic-template', 'Template');
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Upload Data</h1>
        <p className="mt-2 text-sm lg:text-base text-gray-600">Import customer and traffic data from Excel files</p>
      </div>

      {/* Upload Type Selection */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => setUploadType('customers')}
            className={`px-4 py-3 sm:py-2 rounded-lg font-medium text-sm lg:text-base transition-colors ${
              uploadType === 'customers'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Customer Data
          </button>
          <button
            onClick={() => setUploadType('traffic')}
            className={`px-4 py-3 sm:py-2 rounded-lg font-medium text-sm lg:text-base transition-colors ${
              uploadType === 'traffic'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Traffic & Revenue Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">
              Upload {uploadType === 'customers' ? 'Customer' : 'Traffic & Revenue'} Data
            </h3>
          </div>

          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop your Excel file here
            </p>
            <p className="text-gray-600 mb-4">or</p>
            <label className="btn-primary cursor-pointer">
              <UploadIcon className="h-4 w-4 mr-2" />
              Choose File
              <input
                type="file"
                className="hidden"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
              />
            </label>
            <p className="text-sm text-gray-500 mt-4">
              Supports .xlsx and .xls files
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={downloadTemplate}
              className="btn-secondary w-full"
            >
              Download Template
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Instructions</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">
                {uploadType === 'customers' ? 'Customer Data Format' : 'Traffic Data Format'}
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Your Excel file should contain the following columns:
              </p>
              
              {uploadType === 'customers' ? (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Customer Name</strong> (required)</li>
                  <li>• <strong>Office Name</strong> (required)</li>
                  <li>• <strong>Service Type</strong> (required)</li>
                  <li>• <strong>Customer ID</strong> (required, unique)</li>
                  <li>• <strong>Contract ID</strong> (required)</li>
                  <li>• <strong>Payment Type</strong> (optional, "Advance" or "BNPL", defaults to "Advance")</li>
                </ul>
              ) : (
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>Contract ID</strong> (required, must exist in customers)</li>
                  <li>• <strong>Date</strong> (required, format: YYYY-MM-DD)</li>
                  <li>• <strong>Traffic</strong> (required, number)</li>
                  <li>• <strong>Revenue</strong> (required, number)</li>
                  <li>• <strong>Service Type</strong> (required)</li>
                </ul>
              )}
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-2">Tips</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Use the first row for column headers with <strong>exact names</strong></li>
                <li>• Ensure all required fields are filled</li>
                <li>• Download the template for the correct format</li>
                <li>• Remove any empty rows</li>
                {uploadType === 'customers' && (
                  <li>• Duplicate Customer IDs will be skipped automatically</li>
                )}
                {uploadType === 'traffic' && (
                  <li>• Upload customer data first before traffic data</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="mt-8">
          <div className={`card ${uploadResult.success ? 'border-green-200' : 'border-red-200'}`}>
            <div className="flex items-start">
              {uploadResult.success ? (
                <CheckCircle className="h-6 w-6 text-green-600 mt-1" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 mt-1" />
              )}
              <div className="ml-3 flex-1">
                <h3 className={`text-lg font-medium ${uploadResult.success ? 'text-green-900' : 'text-red-900'}`}>
                  {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                </h3>
                <p className={`mt-1 ${uploadResult.success ? 'text-green-700' : 'text-red-700'}`}>
                  {uploadResult.message}
                </p>
                
                {uploadResult.errors && uploadResult.errors.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-medium text-red-900">Errors:</h4>
                    <ul className="mt-1 text-sm text-red-700 space-y-1">
                      {uploadResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}


              </div>
              <button
                onClick={() => setUploadResult(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Data Preview */}
      {showPreview && previewData.length > 0 && (
        <div className="mt-8">
          <div className="card">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Data Preview</h3>
              <div className="space-x-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleImport}
                  disabled={uploading}
                  className="btn-primary"
                >
                  {uploading ? 'Importing...' : 'Import Data'}
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="table">
                <thead className="table-header">
                  <tr>
                    {Object.keys(previewData[0] || {}).map((key) => (
                      <th key={key}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="table-body">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value: any, cellIndex) => (
                        <td key={cellIndex}>
                          {value instanceof Date ? value.toLocaleDateString() : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {uploadResult?.data && uploadResult.data.length > 10 && (
              <p className="text-sm text-gray-600 mt-4">
                Showing first 10 rows of {uploadResult.data.length} total records
              </p>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {uploading && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center space-x-4">
            <div className="spinner"></div>
            <span className="text-gray-900">Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Upload;
