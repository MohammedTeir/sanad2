// Script to seed a system admin user with a real password (Node.js compatible)
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Load environment variables using dotenv
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

// Get Supabase config from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY) in your .env file');
  console.error('💡 You can get the Service Role Key from: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/settings/api');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const seedSystemAdmin = async () => {
  try {
    console.log('Seeding system admin user...');

    // Hash a real password - using "admin123" as the default password
    const password = "admin123";
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if system admin already exists
    const { data: existingAdmins, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('role', 'SYSTEM_ADMIN');

    if (fetchError) {
      console.error('Error fetching existing admins:', fetchError);

      // If the table doesn't exist, suggest creating it
      if (fetchError.code === '42P01' || fetchError.message.includes('does not exist')) {
        console.error('\n❌ The "users" table does not exist in your Supabase database.');
        console.error('💡 Please run the database schema SQL to create the tables first.');
        console.error('📋 You can run the SQL commands from database_schema.sql in your Supabase SQL Editor.');
        console.error('🔗 Access it via: https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql');
      }
      return;
    }

    if (existingAdmins && existingAdmins.length > 0) {
      console.log('System admin already exists, updating password...');
      
      // Update the existing admin user with the new password hash
      const { data, error } = await supabase
        .from('users')
        .update({ 
          password_hash: passwordHash,
          updated_at: new Date().toISOString()
        })
        .eq('email', 'admin@snd.local')
        .select()
        .single();

      if (error) {
        console.error('Error updating admin password:', error);
        return;
      }
      
      console.log('Admin password updated successfully!');
      console.log('Email: admin@snd.local');
      console.log('Password: admin123');
      return;
    }

    // Create a new system admin user
    const adminUserData = {
      email: 'admin@snd.local',
      password_hash: passwordHash,
      role: 'SYSTEM_ADMIN',
      first_name: 'System',
      last_name: 'Administrator',
      phone_number: '+972599999999',
      is_active: true,
      camp_id: null,
      family_id: null,
    };

    const { data, error } = await supabase
      .from('users')
      .insert([adminUserData])
      .select()
      .single();

    if (error) {
      console.error('Error creating system admin:', error);
      return;
    }

    console.log('System admin created successfully!');
    console.log('Email: admin@snd.local');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error seeding system admin:', error);
  }
};

// Run the seeding function
seedSystemAdmin();