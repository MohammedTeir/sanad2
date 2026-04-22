// backend/routes/camps.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction, authorizeRoleOnly } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

// Get all camps (accessible to authorized users)
router.get('/', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'camps', 'read'), async (req, res, next) => {
  try {
    let query = supabase.from('camps').select('*');

    // If user is not SYSTEM_ADMIN, limit to their assigned camp
    if (req.user.role !== 'SYSTEM_ADMIN') {
      if (req.user.campId) {
        query = query.eq('id', req.user.campId);
      } else {
        return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'Access denied') });
      }
    }

    const { data: camps, error } = await query.order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(camps);
  } catch (error) {
    console.error('Get camps error:', error);
    next(error);
  }
});

// Get user's camp information (MUST be before /:campId route)
router.get('/my-camp', authenticateToken, authorizeRoleOnly(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER']), async (req, res, next) => {
  try {
    console.log('[/api/camps/my-camp] User:', req.user);
    console.log('[/api/camps/my-camp] User campId:', req.user?.campId);

    // Only camp managers and field officers should have a camp_id associated with their account
    if (!req.user.campId) {
      console.log('[/api/camps/my-camp] No campId in user token');
      return res.status(404).json({ error: getMessage('camps', 'noCampAssociated', 'No camp associated with this user') });
    }

    const { data: camp, error } = await supabase
      .from('camps')
      .select('*')
      .eq('id', req.user.campId)
      .single();

    if (error || !camp) {
      console.log('[/api/camps/my-camp] Camp not found:', error);
      return res.status(404).json({ error: getMessage('camps', 'campNotFound', 'Camp not found') });
    }

    console.log('[/api/camps/my-camp] Camp found:', camp.id);
    res.json(camp);
  } catch (error) {
    console.error('Get user camp error:', error);
    next(error);
  }
});

// Get camp by ID
router.get('/:campId', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'camps', 'read'), async (req, res, next) => {
  try {
    const { campId } = req.params;

    // Check authorization
    if (req.user.role !== 'SYSTEM_ADMIN' && req.user.campId !== campId) {
      return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'Access denied') });
    }

    const { data: camp, error } = await supabase
      .from('camps')
      .select('*')
      .eq('id', campId)
      .single();

    if (error || !camp) {
      return res.status(404).json({ error: getMessage('camps', 'campNotFound', 'Camp not found') });
    }

    res.json(camp);
  } catch (error) {
    console.error('Get camp error:', error);
    next(error);
  }
});


// Create new camp (admin only)
router.post('/', ...authorizeResourceAction(['SYSTEM_ADMIN'], 'camps', 'create'), async (req, res, next) => {
  try {
    // Only SYSTEM_ADMIN can create camps (already enforced by authorizeResourceAction)
    const campData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: camp, error } = await supabase
      .from('camps')
      .insert([campData])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json(camp);
  } catch (error) {
    console.error('Create camp error:', error);
    next(error);
  }
});

// Update camp (admin or camp manager)
router.put('/:campId', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER'], 'camps', 'update'), async (req, res, next) => {
  try {
    const { campId } = req.params;

    // Check authorization
    if (req.user.role !== 'SYSTEM_ADMIN' && req.user.campId !== campId) {
      return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'Access denied') });
    }

    const updates = {
      ...req.body,
      updated_at: new Date().toISOString()
    };

    // Ensure status cannot be changed from 'قيد الانتظار' to 'نشط' without proper authorization
    // Only SYSTEM_ADMIN can change status from 'قيد الانتظار' to 'نشط'
    if (req.user.role !== 'SYSTEM_ADMIN' && req.body.status && req.body.status !== 'قيد الانتظار') {
      // Remove status from updates to prevent unauthorized status changes
      delete updates.status;
    }

    const { data: camp, error } = await supabase
      .from('camps')
      .update(updates)
      .eq('id', campId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(camp);
  } catch (error) {
    console.error('Update camp error:', error);
    next(error);
  }
});

// Delete camp (admin only)
router.delete('/:campId', ...authorizeResourceAction(['SYSTEM_ADMIN'], 'camps', 'delete'), async (req, res, next) => {
  try {
    // Only SYSTEM_ADMIN can delete camps (already enforced by authorizeResourceAction)
    const { campId } = req.params;

    const { error } = await supabase
      .from('camps')
      .delete()
      .eq('id', campId);

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete camp error:', error);
    next(error);
  }
});

module.exports = { campRoutes: router };
