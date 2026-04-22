// scripts/deletePermissions.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const deleteDefaultPermissions = async () => {
  console.log('Deleting all permissions...');

  try {
    const { data, error } = await supabase
      .from('permissions')
      .delete()
      .not('id', 'is.null'); // Explicitly delete all rows by checking for non-null 'id', satisfying WHERE clause requirement.

    if (error) {
      console.error('Error deleting permissions:', error);
    } else {
      console.log('All permissions deleted successfully!', data);
    }
  } catch (error) {
    console.error('An unexpected error occurred during permission deletion:', error);
  }
};

// Run the deletion
deleteDefaultPermissions()
  .then(() => console.log('Deletion complete'))
  .catch(err => console.error('Deletion failed:', err));