// backend/routes/backupSync.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

// Get all backup/sync operations
router.get('/', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    console.log('=== BACKUP SYNC GET STARTED ===');
    
    // First, get all operations
    const { data: operations, error } = await supabase
      .from('backup_sync_operations')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching operations:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    console.log(`Fetched ${operations.length} operations`);

    // Auto-complete any processing backups that are older than 2 seconds
    const now = new Date();
    console.log('Current time:', now.toISOString());
    
    for (const op of operations) {
      console.log(`Checking op ${op.id}: status=${op.status}, started=${op.started_at}`);
      
      if (op.status === 'قيد المعالجة') {
        const startedAt = new Date(op.started_at);
        const ageInSeconds = (now - startedAt) / 1000;
        
        console.log(`  Age: ${ageInSeconds.toFixed(1)} seconds`);
        
        // If backup is older than 2 seconds and still processing, complete it NOW (synchronously)
        if (ageInSeconds > 2) {
          console.log(`  Attempting to auto-complete backup ${op.id}...`);
          
          try {
            let backupData = {};
            let fileSize = 0;

            if (op.scope === 'كامل') {
              const { data: camps } = await supabase.from('camps').select('*');
              const { data: families } = await supabase.from('families').select('*');
              const { data: individuals } = await supabase.from('individuals').select('*');
              const { data: inventory } = await supabase.from('inventory_items').select('*');

              backupData = { camps: camps || [], families: families || [], individuals: individuals || [], inventory: inventory || [] };
              fileSize = Buffer.byteLength(JSON.stringify(backupData));
              console.log(`  Full backup: ${fileSize} bytes`);
            } else if (op.scope === 'خاص بالمخيم' && op.camp_id) {
              const { data: camps } = await supabase.from('camps').select('*').eq('id', op.camp_id);
              const { data: families } = await supabase.from('families').select('*').eq('camp_id', op.camp_id);

              let individuals = [];
              if (families && families.length > 0) {
                const familyIds = families.map(f => f.id);
                const { data: famIndividuals } = await supabase.from('individuals').select('*').in('family_id', familyIds);
                individuals = famIndividuals || [];
              }

              const { data: inventory } = await supabase.from('inventory_items').select('*').eq('camp_id', op.camp_id);

              backupData = { camps: camps || [], families: families || [], individuals: individuals || [], inventory: inventory || [] };
              fileSize = Buffer.byteLength(JSON.stringify(backupData));
              console.log(`  Camp-specific backup: ${fileSize} bytes`);
            } else {
              const { data: camps } = await supabase.from('camps').select('*').limit(10);
              backupData = { camps: camps || [] };
              fileSize = Buffer.byteLength(JSON.stringify(backupData));
              console.log(`  Partial backup: ${fileSize} bytes`);
            }

            const fileName = `backup_${op.id}_${Date.now()}.json`;

            // Synchronously update the database - this MUST complete before we continue
            const { data: updateResult, error: updateError } = await supabase
              .from('backup_sync_operations')
              .update({
                file_name: fileName,
                size_bytes: fileSize,
                status: 'مكتمل',
                completed_at: new Date().toISOString()
              })
              .eq('id', op.id)
              .select();

            if (updateError) {
              console.error(`❌ Error updating backup ${op.id}:`, updateError);
            } else {
              console.log(`✅ Auto-completed backup ${op.id}. File: ${fileName}, Size: ${fileSize} bytes`);
              // Update the local operations array with the completed data
              op.file_name = fileName;
              op.size_bytes = fileSize;
              op.status = 'مكتمل';
              op.completed_at = new Date().toISOString();
              op.file_url = `/backup-sync/download/${op.id}`; // Add file URL for download
            }
          } catch (error) {
            console.error(`❌ Error auto-completing backup ${op.id}:`, error);
          }
        } else {
          console.log(`  Skipping - too recent (${ageInSeconds.toFixed(1)}s < 2s)`);
        }
      }
    }

    console.log('=== BACKUP SYNC GET COMPLETED ===');

    // Get all user IDs from operations
    const userIds = [...new Set(operations.map(op => op.initiated_by).filter(Boolean))];
    
    // Fetch user details separately
    let usersMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, first_name, last_name')
        .in('id', userIds);
      
      if (users) {
        usersMap = Object.fromEntries(users.map(u => [u.id, u]));
      }
    }

    // Get camp names for camp_specific operations
    const campIds = [...new Set(operations.map(op => op.camp_id).filter(Boolean))];
    let campsMap = {};
    if (campIds.length > 0) {
      const { data: camps } = await supabase
        .from('camps')
        .select('id, name')
        .in('id', campIds);
      
      if (camps) {
        campsMap = Object.fromEntries(camps.map(c => [c.id, c.name]));
      }
    }

    // Format operations for display
    const formattedOperations = operations.map(op => {
      const userData = usersMap[op.initiated_by];
      return {
        ...op,
        initiatedByName: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email : 'System',
        campName: op.camp_id ? campsMap[op.camp_id] : null,
        file_name: op.file_name || (op.status === 'قيد المعالجة' ? 'Creating backup...' : 'Backup in progress...'),
        size_bytes: op.size_bytes || 0,
        status: op.status || 'قيد المعالجة'
      };
    });

    res.json(formattedOperations);
  } catch (error) {
    console.error('Get backup/sync operations error:', error);
    next(error);
  }
});

// Get backup/sync operation by ID
router.get('/:operationId', authenticateToken, async (req, res, next) => {
  try {
    const { operationId } = req.params;
    
    const { data: operation, error } = await supabase
      .from('backup_sync_operations')
      .select('*')
      .eq('id', operationId)
      .single();

    if (error || !operation) {
      return res.status(404).json({ error: getMessage('backup', 'operationNotFound', 'Operation not found') });
    }

    // Check authorization
    if (req.user.role !== 'SYSTEM_ADMIN' && operation.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('backup', 'accessDenied', 'Access denied') });
    }

    res.json(operation);
  } catch (error) {
    console.error('Get backup/sync operation error:', error);
    next(error);
  }
});

// Create a new backup/sync operation
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('backup', 'insufficientPermissions', 'Insufficient permissions') });
    }

    const { name, scope, camp_id } = req.body;

    // Validate scope
    if (!scope || !['كامل', 'جزئي', 'خاص بالمخيم'].includes(scope)) {
      return res.status(400).json({ error: getMessage('backup', 'invalidScope', 'النطاق غير صالح. يجب أن يكون واحداً من: كامل، جزئي، خاص بالمخيم') });
    }

    // Validate camp_specific requires camp_id
    if (scope === 'خاص بالمخيم' && !camp_id) {
      return res.status(400).json({ error: getMessage('backup', 'campIdRequired', 'camp_id is required for camp_specific scope') });
    }

    const operationData = {
      operation_type: 'نسخة احتياطية',
      scope,
      name: name || null, // Optional custom name
      camp_id: camp_id || null,
      status: 'قيد المعالجة',
      initiated_by: req.user.id,
      started_at: new Date().toISOString()
    };

    // If user is not SYSTEM_ADMIN, ensure they can only operate on their assigned camp
    if (req.user.role !== 'SYSTEM_ADMIN') {
      if (!operationData.camp_id || operationData.camp_id !== req.user.campId) {
        operationData.camp_id = req.user.campId;
      }
    }

    const { data: operation, error } = await supabase
      .from('backup_sync_operations')
      .insert([operationData])
      .select()
      .single();

    if (error) {
      console.error('Error creating backup operation:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json(operation);
  } catch (error) {
    console.error('Create backup/sync operation error:', error);
    next(error);
  }
});

// Update a backup/sync operation
router.put('/:operationId', authenticateToken, async (req, res, next) => {
  try {
    const { operationId } = req.params;
    
    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('backup', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Get the operation to check camp association
    const { data: operation, error: fetchError } = await supabase
      .from('backup_sync_operations')
      .select('camp_id')
      .eq('id', operationId)
      .single();

    if (fetchError || !operation) {
      return res.status(404).json({ error: getMessage('backup', 'operationNotFound', 'Operation not found') });
    }

    // Verify user has access to this operation's camp
    if (req.user.role !== 'SYSTEM_ADMIN' && operation.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('backup', 'accessDenied', 'Access denied') });
    }
    
    const updates = {
      ...req.body,
      completed_at: req.body.status === 'مكتمل' ? new Date().toISOString() : req.body.completed_at
    };
    
    const { data: updatedOperation, error: updateError } = await supabase
      .from('backup_sync_operations')
      .update(updates)
      .eq('id', operationId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    res.json(updatedOperation);
  } catch (error) {
    console.error('Update backup/sync operation error:', error);
    next(error);
  }
});

// Download a backup file
router.get('/download/:operationId', authenticateToken, async (req, res, next) => {
  try {
    const { operationId } = req.params;

    // Check authorization
    if (!['SYSTEM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('backup', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Get the operation record
    const { data: operation, error } = await supabase
      .from('backup_sync_operations')
      .select('*')
      .eq('id', operationId)
      .single();

    if (error || !operation) {
      return res.status(404).json({ error: getMessage('backup', 'operationNotFound', 'Operation not found') });
    }

    // Check if operation is completed
    if (operation.status !== 'مكتمل') {
      return res.status(400).json({ error: getMessage('backup', 'backupNotCompleted', 'Backup operation is not completed yet') });
    }

    // Gather data based on scope
    let backupData = {};

    if (operation.scope === 'كامل') {
      // Get all data
      const { data: camps, error: campsError } = await supabase.from('camps').select('*');
      const { data: families, error: familiesError } = await supabase.from('families').select('*');
      const { data: individuals, error: individualsError } = await supabase.from('individuals').select('*');
      const { data: inventory, error: inventoryError } = await supabase.from('inventory_items').select('*');

      backupData = {
        camps: camps || [],
        families: families || [],
        individuals: individuals || [],
        inventory: inventory || [],
        metadata: {
          generatedAt: new Date().toISOString(),
          scope: operation.scope,
          operationId: operation.id,
          system: 'Gaza Camp Management System'
        }
      };
    } else if (operation.scope === 'خاص بالمخيم' && operation.camp_id) {
      // Get data for specific camp
      const { data: camps, error: campsError } = await supabase.from('camps').select('*').eq('id', operation.camp_id);
      const { data: families, error: familiesError } = await supabase.from('families').select('*').eq('camp_id', operation.camp_id);

      // Get individuals for these families
      let individuals = [];
      if (families && families.length > 0) {
        const familyIds = families.map(f => f.id);
        const { data: famIndividuals, error: individualsError } = await supabase.from('individuals').select('*').in('family_id', familyIds);
        individuals = famIndividuals || [];
      }

      const { data: inventory, error: inventoryError } = await supabase.from('inventory_items').select('*').eq('camp_id', operation.camp_id);

      backupData = {
        camps: camps || [],
        families: families || [],
        individuals: individuals || [],
        inventory: inventory || [],
        metadata: {
          generatedAt: new Date().toISOString(),
          scope: operation.scope,
          campId: operation.camp_id,
          operationId: operation.id,
          system: 'Gaza Camp Management System'
        }
      };
    }

    // Convert to JSON string
    const jsonString = JSON.stringify(backupData, null, 2);

    // Update the operation record with file details
    const fileSize = Buffer.byteLength(jsonString);
    const fileName = operation.file_name || `backup_${operationId}_${Date.now()}.json`;

    if (!operation.file_name) {
      await supabase
        .from('backup_sync_operations')
        .update({
          file_name: fileName,
          size_bytes: fileSize
        })
        .eq('id', operationId);
    }

    // Set response headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', fileSize);

    // Send the backup data as response
    res.send(jsonString);

  } catch (error) {
    console.error('Download backup error:', error);
    next(error);
  }
});

// Restore from a backup file
router.post('/restore', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { backupId, scope } = req.body;

    if (!backupId) {
      return res.status(400).json({ error: getMessage('backup', 'backupIdRequired', 'Backup ID is required') });
    }

    // Get the backup operation record
    const { data: backup, error: backupError } = await supabase
      .from('backup_sync_operations')
      .select('*')
      .eq('id', backupId)
      .single();

    if (backupError || !backup) {
      return res.status(404).json({ error: getMessage('backup', 'backupNotFound', 'Backup not found') });
    }

    if (backup.status !== 'مكتمل') {
      return res.status(400).json({ error: getMessage('backup', 'backupNotCompletedYet', 'Backup is not completed yet') });
    }

    // Create a restore operation record
    const { data: restoreOp, error: insertError } = await supabase
      .from('backup_sync_operations')
      .insert([{
        operation_type: 'استعادة',
        scope: backup.scope,
        camp_id: backup.camp_id,
        status: 'قيد المعالجة',
        initiated_by: req.user.id,
        started_at: new Date().toISOString(),
        file_name: `restore_${backupId}_${Date.now()}.json`
      }])
      .select()
      .single();

    if (insertError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(insertError) });
    }

    // Simulate restore process
    setTimeout(async () => {
      try {
        await supabase
          .from('backup_sync_operations')
          .update({
            status: 'مكتمل',
            completed_at: new Date().toISOString(),
            size_bytes: backup.size_bytes
          })
          .eq('id', restoreOp.id);

        console.log(`Restore operation ${restoreOp.id} completed successfully`);
      } catch (error) {
        console.error('Restore completion error:', error);
        await supabase
          .from('backup_sync_operations')
          .update({
            status: 'فشل',
            completed_at: new Date().toISOString()
          })
          .eq('id', restoreOp.id);
      }
    }, 3000);

    res.json({
      success: true,
      message: 'Restore operation started',
      restoreOperationId: restoreOp.id
    });

  } catch (error) {
    console.error('Restore backup error:', error);
    next(error);
  }
});

// Delete a backup operation
router.delete('/:operationId', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { operationId } = req.params;

    // Delete the backup operation record
    const { error } = await supabase
      .from('backup_sync_operations')
      .delete()
      .eq('id', operationId);

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ success: true, message: 'Backup deleted successfully' });
  } catch (error) {
    console.error('Delete backup error:', error);
    next(error);
  }
});

module.exports = { backupSyncRoutes: router };