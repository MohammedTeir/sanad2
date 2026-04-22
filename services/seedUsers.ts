import { supabaseService } from './supabase';

// Function to seed a system admin user
export const seedSystemAdmin = async () => {
  try {
    console.log('Seeding system admin user...');
    
    // Check if system admin already exists
    const { data: existingAdmins, error: fetchError } = await supabaseService.client
      .from('users')
      .select('*')
      .eq('role', 'SYSTEM_ADMIN');
    
    if (fetchError) {
      console.error('Error fetching existing admins:', fetchError);
      return;
    }
    
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('System admin already exists, skipping seeding.');
      return;
    }
    
    // Create a default system admin user
    const adminUserData = {
      email: 'admin@snd.local',
      password_hash: '$2a$10$default_password_hash', // This is just a placeholder
      role: 'SYSTEM_ADMIN',
      first_name: 'System',
      last_name: 'Administrator',
      phone_number: '+972599999999',
      is_active: true,
      camp_id: null,
      family_id: null,
    };
    
    const { data, error } = await supabaseService.client
      .from('users')
      .insert([adminUserData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating system admin:', error);
      return;
    }
    
    console.log('System admin created successfully:', data);
    console.log('Email: admin@snd.local');
    console.log('Note: This is a placeholder password hash. In a real system, you would need to implement proper password hashing.');
  } catch (error) {
    console.error('Error seeding system admin:', error);
  }
};

// Function to seed a camp manager user
export const seedCampManager = async (campId: string) => {
  try {
    console.log(`Seeding camp manager for camp ${campId}...`);
    
    // Check if camp manager already exists for this camp
    const { data: existingManagers, error: fetchError } = await supabaseService.client
      .from('users')
      .select('*')
      .eq('role', 'CAMP_MANAGER')
      .eq('camp_id', campId);
    
    if (fetchError) {
      console.error('Error fetching existing camp managers:', fetchError);
      return;
    }
    
    if (existingManagers && existingManagers.length > 0) {
      console.log('Camp manager already exists for this camp, skipping seeding.');
      return;
    }
    
    // Create a default camp manager user
    const managerUserData = {
      email: `manager-${campId}@snd.local`,
      password_hash: '$2a$10$default_password_hash', // This is just a placeholder
      role: 'CAMP_MANAGER',
      first_name: 'Camp',
      last_name: 'Manager',
      phone_number: '+972599999999',
      is_active: true,
      camp_id: campId,
      family_id: null,
    };
    
    const { data, error } = await supabaseService.client
      .from('users')
      .insert([managerUserData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating camp manager:', error);
      return;
    }
    
    console.log('Camp manager created successfully:', data);
    console.log(`Email: manager-${campId}@snd.local`);
  } catch (error) {
    console.error('Error seeding camp manager:', error);
  }
};

// Function to seed a field officer user
export const seedFieldOfficer = async (campId: string) => {
  try {
    console.log(`Seeding field officer for camp ${campId}...`);
    
    // Create a default field officer user
    const officerUserData = {
      email: `officer-${campId}@snd.local`,
      password_hash: '$2a$10$default_password_hash', // This is just a placeholder
      role: 'FIELD_OFFICER',
      first_name: 'Field',
      last_name: 'Officer',
      phone_number: '+972599999999',
      is_active: true,
      camp_id: campId,
      family_id: null,
    };
    
    const { data, error } = await supabaseService.client
      .from('users')
      .insert([officerUserData])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating field officer:', error);
      return;
    }
    
    console.log('Field officer created successfully:', data);
    console.log(`Email: officer-${campId}@snd.local`);
  } catch (error) {
    console.error('Error seeding field officer:', error);
  }
};

// Function to seed all default users
export const seedDefaultUsers = async () => {
  console.log('Seeding default users...');
  
  // First, seed the system admin
  await seedSystemAdmin();
  
  // Then, seed users for each camp
  const camps = await supabaseService.getCamps();
  for (const camp of camps) {
    await seedCampManager(camp.id);
    await seedFieldOfficer(camp.id);
  }
  
  console.log('Default users seeding completed.');
};