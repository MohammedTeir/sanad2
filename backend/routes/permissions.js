// backend/routes/permissions.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction } = require('../middleware/auth');
const router = express.Router();

// Get permissions for a specific role
router.get('/role/:role', authenticateToken, async (req, res, next) => {
  try {
    const { role } = req.params;
    
    // Check authorization - only admin can view all permissions
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('role', role);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(permissions);
  } catch (error) {
    console.error('Get permissions by role error:', error);
    next(error);
  }
});

// Get all permissions
router.get('/', ...authorizeResourceAction(['SYSTEM_ADMIN'], 'permissions', 'read'), async (req, res, next) => {
  try {
    const { data: permissions, error } = await supabase
      .from('permissions')
      .select('*')
      .order('role', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(permissions);
  } catch (error) {
    console.error('Get all permissions error:', error);
    next(error);
  }
});

// Create a new permission (admin only)
router.post('/', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const permissionData = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    const { data: permission, error } = await supabase
      .from('permissions')
      .insert([permissionData])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(permission);
  } catch (error) {
    console.error('Create permission error:', error);
    next(error);
  }
});

// Delete a permission (admin only)
router.delete('/:permissionId', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { permissionId } = req.params;
    
    const { error } = await supabase
      .from('permissions')
      .delete()
      .eq('id', permissionId);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete permission error:', error);
    next(error);
  }
});

module.exports = { permissionRoutes: router };