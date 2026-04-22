// backend/routes/individuals.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

// Get all individuals (with optional family filter)
router.get('/', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'individuals', 'read'), async (req, res, next) => {
  try {
    // Check if user wants to include deleted records (admin only)
    const { includeDeleted } = req.query;
    const showDeleted = includeDeleted === 'true' && req.user.role === 'SYSTEM_ADMIN';

    let query = supabase.from('individuals').select('*');

    // Filter out soft-deleted records unless explicitly requested
    if (!showDeleted) {
      query = query.eq('is_deleted', false);
    }

    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER') {
      // Limit to individuals in families from user's camp
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('id')
        .eq('camp_id', req.user.campId)
        .eq('is_deleted', false);

      if (familiesError) {
        return res.status(500).json({ error: getDatabaseErrorMessage(familiesError) });
      }

      const familyIds = families.map(f => f.id);
      if (familyIds.length > 0) {
        query = query.in('family_id', familyIds);
      } else {
        return res.json([]);
      }
    } else if (req.user.role === 'FIELD_OFFICER') {
      // Limit to individuals in families from user's camp
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('id')
        .eq('camp_id', req.user.campId)
        .eq('is_deleted', false);

      if (familiesError) {
        return res.status(500).json({ error: getDatabaseErrorMessage(familiesError) });
      }

      const familyIds = families.map(f => f.id);
      if (familyIds.length > 0) {
        query = query.in('family_id', familyIds);
      } else {
        return res.json([]);
      }
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Apply optional family filter from query params
    const { familyId } = req.query;
    if (familyId) {
      query = query.eq('family_id', familyId);
    }

    const { data: individuals, error } = await query.order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(individuals);
  } catch (error) {
    console.error('Get individuals error:', error);
    next(error);
  }
});

// Bulk get individuals by multiple family IDs (to solve N+1 query problem)
router.post('/bulk', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'individuals', 'read'), async (req, res, next) => {
  try {
    const { familyIds } = req.body;

    // Validate input
    if (!Array.isArray(familyIds) || familyIds.length === 0) {
      return res.status(400).json({ error: 'familyIds must be a non-empty array' });
    }

    let query = supabase.from('individuals').select('*');

    // Filter out soft-deleted records
    query = query.eq('is_deleted', false);

    // Check permissions for CAMP_MANAGER and FIELD_OFFICER
    if (req.user.role === 'CAMP_MANAGER' || req.user.role === 'FIELD_OFFICER') {
      // Verify all families belong to user's camp
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('id, camp_id')
        .in('id', familyIds)
        .eq('is_deleted', false);

      if (familiesError) {
        return res.status(500).json({ error: getDatabaseErrorMessage(familiesError) });
      }

      // Filter to only families in user's camp
      const campFamilyIds = families.filter(f => f.camp_id === req.user.campId).map(f => f.id);

      if (campFamilyIds.length === 0) {
        return res.json([]);
      }

      query = query.in('family_id', campFamilyIds);
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    } else {
      // SYSTEM_ADMIN - no restrictions
      query = query.in('family_id', familyIds);
    }

    const { data: individuals, error } = await query;

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }
    
    res.json(individuals || []);
  } catch (error) {
    console.error('Bulk get individuals error:', error);
    next(error);
  }
});

// Get individual by ID
router.get('/:individualId', authenticateToken, async (req, res, next) => {
  try {
    const { individualId } = req.params;

    const { data: individual, error } = await supabase
      .from('individuals')
      .select('*')
      .eq('id', individualId)
      .eq('is_deleted', false)
      .single();

    if (error || !individual) {
      return res.status(404).json({ error: getMessage('individuals', 'individualNotFound', 'Individual not found') });
    }

    // Check if user has access to this individual's family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', individual.family_id)
      .single();

    if (familyError || !family) {
      return res.status(404).json({ error: getMessage('individuals', 'associatedFamilyNotFound', 'Associated family not found') });
    }

    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'Access denied') });
    }

    res.json(individual);
  } catch (error) {
    console.error('Get individual error:', error);
    next(error);
  }
});

// Create new individual
router.post('/', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'individuals', 'create'), async (req, res, next) => {
  try {
    // Check authorization (already enforced by authorizeResourceAction)
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Validate 4-part name fields if provided
    const { first_name, father_name, family_name } = req.body;
    if (first_name && father_name && family_name) {
      // Compute full name from 4 parts for backward compatibility
      req.body.name = `${first_name || ''} ${father_name || ''} ${req.body.grandfather_name || ''} ${family_name || ''}`.trim();
    }

    const individualData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Verify user has access to the family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', individualData.family_id)
      .single();

    if (familyError || !family) {
      return res.status(404).json({ error: getMessage('individuals', 'familyNotFound', 'Family not found') });
    }

    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('individuals', 'unauthorizedCreate', 'Access denied') });
    }

    const { data: individual, error } = await supabase
      .from('individuals')
      .insert([individualData])
      .select()
      .single();

    if (error) {
      console.error('Individual creation error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json(individual);
  } catch (error) {
    console.error('Create individual error:', error);
    next(error);
  }
});

// Update individual
router.put('/:individualId', authenticateToken, async (req, res, next) => {
  try {
    const { individualId } = req.params;

    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Get the individual to check family association
    const { data: individual, error: fetchError } = await supabase
      .from('individuals')
      .select('family_id')
      .eq('id', individualId)
      .single();

    if (fetchError || !individual) {
      return res.status(404).json({ error: getMessage('individuals', 'individualNotFound', 'Individual not found') });
    }

    // Verify user has access to this individual's family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', individual.family_id)
      .single();

    if (familyError || !family) {
      return res.status(404).json({ error: getMessage('individuals', 'associatedFamilyNotFound', 'Associated family not found') });
    }

    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'Access denied') });
    }

    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    // If updating 4-part names, recompute full name
    if (updates.first_name || updates.father_name || updates.grandfather_name || updates.family_name) {
      updates.name = `${updates.first_name || ''} ${updates.father_name || ''} ${updates.grandfather_name || ''} ${updates.family_name || ''}`.trim();
    }

    const { data: updatedIndividual, error: updateError } = await supabase
      .from('individuals')
      .update(updates)
      .eq('id', individualId)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    res.json(updatedIndividual);
  } catch (error) {
    console.error('Update individual error:', error);
    next(error);
  }
});

// Delete individual (beneficiary - own family member only) - Soft Delete
router.delete('/:individualId/family-member', authenticateToken, async (req, res, next) => {
  try {
    const { individualId } = req.params;
    const user = req.user;

    // Only beneficiaries (BENEFICIARY role) can delete their own family members
    if (user.role !== 'BENEFICIARY') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'صلاحيات غير كافية') });
    }

    if (!user.familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة للمستخدم' });
    }

    // Get the individual to verify it belongs to user's family
    const { data: individual, error: fetchError } = await supabase
      .from('individuals')
      .select('*')
      .eq('id', individualId)
      .single();

    if (fetchError || !individual) {
      return res.status(404).json({ error: getMessage('individuals', 'individualNotFound', 'الفرد غير موجود') });
    }

    // Verify the individual belongs to the user's family
    if (individual.family_id !== user.familyId) {
      return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'لا يمكنك حذف فرد من عائلة أخرى') });
    }

    // Perform soft delete
    const { error: updateError } = await supabase
      .from('individuals')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', individualId);

    if (updateError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    // Log the deletion to soft_deletes table
    try {
      await supabase.from('soft_deletes').insert({
        table_name: 'individuals',
        record_id: individualId,
        deleted_data: individual,
        deleted_by_user_id: user.userId,
        deleted_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log soft delete to audit table:', logError);
    }

    res.status(200).json({
      message: getMessage('individuals', 'individualDeleted', 'تم حذف الفرد بنجاح'),
      individualId: individualId
    });
  } catch (error) {
    console.error('Delete family member error:', error);
    next(error);
  }
});

// Delete individual (admin or camp manager) - Soft Delete
router.delete('/:individualId', authenticateToken, async (req, res, next) => {
  try {
    const { individualId } = req.params;

    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Get the individual to check family association
    const { data: individual, error: fetchError } = await supabase
      .from('individuals')
      .select('*')
      .eq('id', individualId)
      .single();

    if (fetchError || !individual) {
      return res.status(404).json({ error: getMessage('individuals', 'individualNotFound', 'Individual not found') });
    }

    // Verify user has access to this individual's family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', individual.family_id)
      .single();

    if (familyError || !family) {
      return res.status(404).json({ error: getMessage('individuals', 'associatedFamilyNotFound', 'Associated family not found') });
    }

    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'Access denied') });
    }

    // Perform soft delete
    const { error: updateError } = await supabase
      .from('individuals')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', individualId);

    if (updateError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    // Log the deletion to soft_deletes table
    try {
      await supabase.from('soft_deletes').insert({
        table_name: 'individuals',
        record_id: individualId,
        deleted_data: individual,
        deleted_by_user_id: req.user.userId,
        deleted_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log soft delete to audit table:', logError);
      // Don't fail the delete if logging fails
    }

    res.status(200).json({ 
      message: getMessage('individuals', 'individualDeleted', 'تم حذف الفرد بنجاح'),
      individualId: individualId 
    });
  } catch (error) {
    console.error('Delete individual error:', error);
    next(error);
  }
});

module.exports = { individualRoutes: router };
