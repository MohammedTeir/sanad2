// scripts/runInitPermissions.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const initializeDefaultPermissions = async () => {
  console.log('Initializing default permissions...');

  // Define default permissions for each role
  const defaultPermissions = [
    // System Admin permissions
    { role: 'SYSTEM_ADMIN', resource: 'camps', action: 'read' },
    { role: 'SYSTEM_ADMIN', resource: 'camps', action: 'create' },
    { role: 'SYSTEM_ADMIN', resource: 'camps', action: 'update' },
    { role: 'SYSTEM_ADMIN', resource: 'camps', action: 'delete' },
    { role: 'SYSTEM_ADMIN', resource: 'families', action: 'read' },
    { role: 'SYSTEM_ADMIN', resource: 'families', action: 'create' },
    { role: 'SYSTEM_ADMIN', resource: 'families', action: 'update' },
    { role: 'SYSTEM_ADMIN', resource: 'families', action: 'delete' },
    { role: 'SYSTEM_ADMIN', resource: 'individuals', action: 'read' },
    { role: 'SYSTEM_ADMIN', resource: 'individuals', action: 'create' },
    { role: 'SYSTEM_ADMIN', resource: 'individuals', action: 'update' },
    { role: 'SYSTEM_ADMIN', resource: 'individuals', action: 'delete' },
    { role: 'SYSTEM_ADMIN', resource: 'inventory', action: 'read' },
    { role: 'SYSTEM_ADMIN', resource: 'inventory', action: 'create' },
    { role: 'SYSTEM_ADMIN', resource: 'inventory', action: 'update' },
    { role: 'SYSTEM_ADMIN', resource: 'inventory', action: 'delete' },
    { role: 'SYSTEM_ADMIN', resource: 'distributions', action: 'read' },
    { role: 'SYSTEM_ADMIN', resource: 'distributions', action: 'create' },
    { role: 'SYSTEM_ADMIN', resource: 'distributions', action: 'update' },
    { role: 'SYSTEM_ADMIN', resource: 'distributions', action: 'delete' },
    { role: 'SYSTEM_ADMIN', resource: 'users', action: 'read' },
    { role: 'SYSTEM_ADMIN', resource: 'users', action: 'create' },
    { role: 'SYSTEM_ADMIN', resource: 'users', action: 'update' },
    { role: 'SYSTEM_ADMIN', resource: 'users', action: 'delete' },
    { role: 'SYSTEM_ADMIN', resource: 'reports', action: 'read' },
    { role: 'SYSTEM_ADMIN', resource: 'reports', action: 'create' },

    // Camp Manager permissions
    { role: 'CAMP_MANAGER', resource: 'families', action: 'read' },
    { role: 'CAMP_MANAGER', resource: 'families', action: 'create' },
    { role: 'CAMP_MANAGER', resource: 'families', action: 'update' },
    { role: 'CAMP_MANAGER', resource: 'individuals', action: 'read' },
    { role: 'CAMP_MANAGER', resource: 'individuals', action: 'create' },
    { role: 'CAMP_MANAGER', resource: 'individuals', action: 'update' },
    { role: 'CAMP_MANAGER', resource: 'inventory', action: 'read' },
    { role: 'CAMP_MANAGER', resource: 'inventory', action: 'create' },
    { role: 'CAMP_MANAGER', resource: 'inventory', action: 'update' },
    { role: 'CAMP_MANAGER', resource: 'distributions', action: 'read' },
    { role: 'CAMP_MANAGER', resource: 'distributions', action: 'create' },
    { role: 'CAMP_MANAGER', resource: 'distributions', action: 'update' },
    { role: 'CAMP_MANAGER', resource: 'reports', action: 'read' },
    { role: 'CAMP_MANAGER', resource: 'reports', action: 'create' },

    // Field Officer permissions
    { role: 'FIELD_OFFICER', resource: 'families', action: 'read' },
    { role: 'FIELD_OFFICER', resource: 'families', action: 'create' },
    { role: 'FIELD_OFFICER', resource: 'individuals', action: 'read' },
    { role: 'FIELD_OFFICER', resource: 'individuals', action: 'create' },
    { role: 'FIELD_OFFICER', resource: 'distributions', action: 'read' },
    { role: 'FIELD_OFFICER', resource: 'distributions', action: 'create' },

    // Beneficiary permissions
    { role: 'BENEFICIARY', resource: 'profile', action: 'read' },
    { role: 'BENEFICIARY', resource: 'profile', action: 'update' },
    { role: 'BENEFICIARY', resource: 'aid_history', action: 'read' },

    // Donor/Observer permissions
    { role: 'DONOR_OBSERVER', resource: 'reports', action: 'read' },
    { role: 'DONOR_OBSERVER', resource: 'statistics', action: 'read' },
    { role: 'DONOR_OBSERVER', resource: 'audit_logs', action: 'read' },
  ];

  // Check if permissions already exist to avoid duplicates
  const { data: existingPermissions, error: fetchError } = await supabase
    .from('permissions')
    .select('*');

  if (fetchError) {
    console.error('Error fetching existing permissions:', fetchError);
    return;
  }

  if (existingPermissions.length > 0) {
    console.log('Permissions already exist, skipping initialization.');
    return;
  }

  // Insert all default permissions
  for (const perm of defaultPermissions) {
    try {
      const { error } = await supabase
        .from('permissions')
        .insert([{
          role: perm.role,
          resource: perm.resource,
          action: perm.action,
          created_at: new Date().toISOString()
        }]);
      
      if (error) {
        console.error(`Failed to create permission: ${perm.role} - ${perm.resource} - ${perm.action}`, error);
      } else {
        console.log(`Created permission: ${perm.role} - ${perm.resource} - ${perm.action}`);
      }
    } catch (error) {
      console.error(`Failed to create permission: ${perm.role} - ${perm.resource} - ${perm.action}`, error);
    }
  }

  console.log('Default permissions initialized successfully!');
};

// Run the initialization
initializeDefaultPermissions()
  .then(() => console.log('Initialization complete'))
  .catch(err => console.error('Initialization failed:', err));