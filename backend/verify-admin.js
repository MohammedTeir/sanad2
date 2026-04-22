// Script to verify the admin user in the database
import { createClient } from '@supabase/supabase-js';

// Load environment variables using dotenv
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Get Supabase config from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY; // Use anon key for read operations

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const verifyAdminUser = async () => {
  try {
    console.log('Verifying admin user in database...');

    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, password_hash, is_active')
      .eq('email', 'admin@snd.local')
      .single();

    if (error) {
      console.error('Error fetching admin user:', error);
      return;
    }

    if (!data) {
      console.log('Admin user does not exist in the database');
      return;
    }

    console.log('Admin user found:');
    console.log('- ID:', data.id);
    console.log('- Email:', data.email);
    console.log('- Role:', data.role);
    console.log('- Is Active:', data.is_active);
    console.log('- Password Hash Length:', data.password_hash?.length || 0);
    console.log('- Password Hash Preview:', data.password_hash?.substring(0, 20) + '...');
  } catch (error) {
    console.error('Error verifying admin user:', error);
  }
};

verifyAdminUser();