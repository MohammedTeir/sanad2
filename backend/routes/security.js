// backend/routes/security.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction } = require('../middleware/auth');
const router = express.Router();

// Log a security event (internal use, typically called by other services)
router.post('/log-event', authenticateToken, async (req, res, next) => {
  try {
    // Only system services should be able to log security events directly
    // For now, allowing authorized users to log events
    const eventData = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    // Add user context if available
    eventData.user_id = req.user.userId;
    
    const { data: event, error } = await supabase
      .from('security_logs')
      .insert([eventData])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Log security event error:', error);
    next(error);
  }
});

// Get security events (admin only)
router.get('/', ...authorizeResourceAction(['SYSTEM_ADMIN'], 'security_logs', 'read'), async (req, res, next) => {
  try {
    const { eventType, severity, fromDate, toDate, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('security_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (severity) {
      query = query.eq('severity', severity);
    }

    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }

    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    const { data: events, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(events);
  } catch (error) {
    console.error('Get security events error:', error);
    next(error);
  }
});

// Get security events by user ID (admin only)
router.get('/user/:userId', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const { data: events, error } = await supabase
      .from('security_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(events);
  } catch (error) {
    console.error('Get security events by user error:', error);
    next(error);
  }
});

// Get failed login attempts
router.get('/failed-attempts', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { ipAddress, limit = 50, offset = 0 } = req.query;
    
    let query = supabase
      .from('failed_login_attempts')
      .select('*')
      .order('attempted_at', { ascending: false })
      .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

    if (ipAddress) {
      query = query.eq('ip_address', ipAddress);
    }

    const { data: attempts, error } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(attempts);
  } catch (error) {
    console.error('Get failed login attempts error:', error);
    next(error);
  }
});

// Log a failed login attempt (public endpoint, no auth required)
router.post('/log-failed-attempt', async (req, res, next) => {
  try {
    const attemptData = {
      ...req.body,
      attempted_at: new Date().toISOString()
    };
    
    const { data: attempt, error } = await supabase
      .from('failed_login_attempts')
      .insert([attemptData])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json(attempt);
  } catch (error) {
    console.error('Log failed login attempt error:', error);
    next(error);
  }
});

module.exports = { securityRoutes: router };