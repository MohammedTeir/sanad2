// backend/routes/softDeletes.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction } = require('../middleware/auth');
const { getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

// Get soft deleted records (admin only)
router.get('/', ...authorizeResourceAction(['SYSTEM_ADMIN'], 'soft_deletes', 'read'), async (req, res, next) => {
  try {
    const { tableName, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('soft_deletes')
      .select('*')
      .order('deleted_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (tableName) {
      query = query.eq('table_name', tableName);
    }

    const { data: records, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(records);
  } catch (error) {
    console.error('Get soft deleted records error:', error);
    next(error);
  }
});

// Restore a soft deleted record (admin only)
router.post('/restore/:deleteRecordId', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { deleteRecordId } = req.params;
    const { restorationReason } = req.body;

    // Get the delete record to access the original data
    const { data: deleteRecord, error: fetchError } = await supabase
      .from('soft_deletes')
      .select('*')
      .eq('id', deleteRecordId)
      .single();

    if (fetchError || !deleteRecord) {
      return res.status(404).json({ error: 'Delete record not found' });
    }

    // Check if already restored
    if (deleteRecord.restored_at) {
      return res.status(400).json({ error: 'Record has already been restored' });
    }

    const tableName = deleteRecord.table_name;
    const recordId = deleteRecord.record_id;
    const deletedData = deleteRecord.deleted_data;

    // Prepare the restoration data (exclude system fields)
    const restoreData = { ...deletedData };
    delete restoreData.id; // Don't try to update the ID
    delete restoreData.created_at; // Keep original created_at
    delete restoreData.updated_at;
    delete restoreData.last_updated;
    delete restoreData.deleted_at;
    delete restoreData.is_deleted;

    // Restore based on table name
    let restoreError;
    let restoredRecord;

    if (tableName === 'families') {
      // Restore family record
      const { data, error } = await supabase
        .from('families')
        .update({
          ...restoreData,
          is_deleted: false,
          deleted_at: null,
          last_updated: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();
      restoredRecord = data;
      restoreError = error;
    } else if (tableName === 'individuals') {
      // Restore individual record
      const { data, error } = await supabase
        .from('individuals')
        .update({
          ...restoreData,
          is_deleted: false,
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();
      restoredRecord = data;
      restoreError = error;
    } else if (tableName === 'inventory_items') {
      // Restore inventory item record
      const { data, error } = await supabase
        .from('inventory_items')
        .update({
          ...restoreData,
          is_deleted: false,
          deleted_at: null,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();
      restoredRecord = data;
      restoreError = error;
    } else if (tableName === 'aids') {
      // Restore aid record
      const { data, error } = await supabase
        .from('aids')
        .update({
          ...restoreData,
          is_deleted: false,
          deleted_at: null,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', recordId)
        .select()
        .single();
      restoredRecord = data;
      restoreError = error;
    } else {
      return res.status(400).json({ error: `Unsupported table name: ${tableName}` });
    }

    if (restoreError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(restoreError) });
    }

    // Update the soft_deletes record with restoration info
    const { error: updateError } = await supabase
      .from('soft_deletes')
      .update({
        restored_at: new Date().toISOString(),
        restoration_reason: restorationReason || null
      })
      .eq('id', deleteRecordId);

    if (updateError) {
      console.error('Failed to update soft_deletes record:', updateError);
      // Don't fail the restoration if this fails
    }

    res.status(200).json({ 
      message: 'Record restored successfully',
      restoredRecord: restoredRecord,
      deleteRecordId: deleteRecordId
    });
  } catch (error) {
    console.error('Restore soft deleted record error:', error);
    next(error);
  }
});

module.exports = { softDeleteRoutes: router };