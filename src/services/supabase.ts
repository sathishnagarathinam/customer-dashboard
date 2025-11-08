import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// Note: Replace these with your actual Supabase config values
const supabaseUrl = 'https://dsnfnjhuixkpllnyixmi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzbmZuamh1aXhrcGxsbnlpeG1pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI1NzkzOTMsImV4cCI6MjA3ODE1NTM5M30.JrFtG4tSyUWZ4JlbT2ZY1E6Wj5Z9r15_evzCaU14cHo';

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
