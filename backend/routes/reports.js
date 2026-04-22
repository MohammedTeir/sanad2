// backend/routes/reports.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction, optionalAuthenticateToken } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

// Get vulnerability reports
router.get('/vulnerability', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'reports', 'read'), async (req, res, next) => {
  try {
    let query = supabase.from('families').select(`
      id,
      head_of_family_name,
      vulnerability_score,
      vulnerability_priority,
      vulnerability_breakdown,
      vulnerability_reason,
      camp_id,
      total_members_count,
      disabled_count,
      injured_count,
      pregnant_women_count,
      current_population
    `);
    
    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER') {
      query = query.eq('camp_id', req.user.campId);
    } else if (req.user.role === 'FIELD_OFFICER') {
      query = query.eq('camp_id', req.user.campId);
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('reports', 'insufficientPermissions', 'Insufficient permissions') });
    }

    const { data: families, error } = await query.gt('vulnerability_score', 0).order('vulnerability_score', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(families);
  } catch (error) {
    console.error('Get vulnerability reports error:', error);
    next(error);
  }
});

// Get aid distribution reports
router.get('/aid-distribution', authenticateToken, async (req, res, next) => {
  try {
    let query = supabase.from('aid_distributions').select(`
      *,
      families!inner (
        head_of_family_name,
        camp_id
      ),
      aid_campaigns (
        name,
        start_date,
        end_date
      )
    `);
    
    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER') {
      query = query.eq('families.camp_id', req.user.campId);
    } else if (req.user.role === 'FIELD_OFFICER') {
      query = query.eq('families.camp_id', req.user.campId);
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('reports', 'insufficientPermissions', 'Insufficient permissions') });
    }

    const { data: distributions, error } = await query.order('distribution_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Format the response
    const formattedDistributions = distributions.map(dist => ({
      id: dist.id,
      familyId: dist.family_id,
      familyName: dist.families?.head_of_family_name,
      campId: dist.families?.camp_id,
      campaignName: dist.aid_campaigns?.name,
      campaignStartDate: dist.aid_campaigns?.start_date,
      campaignEndDate: dist.aid_campaigns?.end_date,
      aidType: dist.aid_type,
      aidCategory: dist.aid_category,
      quantity: dist.quantity,
      distributionDate: dist.distribution_date,
      distributedBy: dist.distributed_by_user_id,
      notes: dist.notes,
      status: dist.status,
      receivedBySignature: dist.received_by_signature,
      receivedByBiometric: dist.received_by_biometric,
      receivedByPhotoUrl: dist.received_by_photo_url,
      otpCode: dist.otp_code,
      duplicateCheckPassed: dist.duplicate_check_passed,
      createdAt: dist.created_at,
      updatedAt: dist.updated_at
    }));

    res.json(formattedDistributions);
  } catch (error) {
    console.error('Get aid distribution reports error:', error);
    next(error);
  }
});

// Get camp occupancy reports
router.get('/camp-occupancy', authenticateToken, async (req, res, next) => {
  try {
    let query = supabase.from('camps').select(`
      id,
      name,
      manager_name,
      status,
      families (
        count
      )
    `);
    
    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER') {
      query = query.eq('id', req.user.campId);
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('reports', 'insufficientPermissions', 'Insufficient permissions') });
    }

    const { data: camps, error } = await query;

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Format the response
    const formattedCamps = camps.map(camp => ({
      id: camp.id,
      name: camp.name,
      managerName: camp.manager_name,
      status: camp.status,
      familyCount: camp.families?.[0]?.count || 0
    }));

    res.json(formattedCamps);
  } catch (error) {
    console.error('Get camp occupancy reports error:', error);
    next(error);
  }
});

// Get health status reports
router.get('/health-status', authenticateToken, async (req, res, next) => {
  try {
    let familiesQuery = supabase.from('families').select(`
      id,
      head_of_family_name,
      camp_id,
      disabled_count,
      injured_count,
      pregnant_women_count,
      head_of_family_disability_type,
      head_of_family_chronic_disease_type,
      head_of_family_war_injury_type,
      wife_disability_type,
      wife_chronic_disease_type,
      wife_war_injury_type
    `);
    
    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER') {
      familiesQuery = familiesQuery.eq('camp_id', req.user.campId);
    } else if (req.user.role === 'FIELD_OFFICER') {
      familiesQuery = familiesQuery.eq('camp_id', req.user.campId);
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('reports', 'insufficientPermissions', 'Insufficient permissions') });
    }

    const { data: families, error: familiesError } = await familiesQuery;

    if (familiesError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(familiesError) });
    }

    // Get individuals with health conditions
    let individualsQuery = supabase.from('individuals').select(`
      id,
      name,
      family_id,
      disability_type,
      chronic_disease_type,
      war_injury_type
    `).in('disability_type', ['motor', 'visual', 'hearing', 'mental', 'other'])
      .or('chronic_disease_type.neq.none,war_injury_type.neq.none');
    
    if (req.user.role === 'CAMP_MANAGER') {
      // Need to filter individuals by families in the user's camp
      const familyIds = families.map(f => f.id);
      if (familyIds.length > 0) {
        individualsQuery = individualsQuery.in('family_id', familyIds);
      } else {
        return res.json({ families, individuals: [] });
      }
    } else if (req.user.role === 'FIELD_OFFICER') {
      // Need to filter individuals by families in the user's camp
      const familyIds = families.map(f => f.id);
      if (familyIds.length > 0) {
        individualsQuery = individualsQuery.in('family_id', familyIds);
      } else {
        return res.json({ families, individuals: [] });
      }
    }
    
    const { data: individuals, error: individualsError } = await individualsQuery;

    if (individualsError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(individualsError) });
    }

    res.json({ families, individuals });
  } catch (error) {
    console.error('Get health status reports error:', error);
    next(error);
  }
});

// Get inventory reports
router.get('/inventory', authenticateToken, async (req, res, next) => {
  try {
    let query = supabase.from('inventory_items').select(`
      id,
      name,
      category,
      unit,
      quantity_available,
      quantity_reserved,
      min_alert_threshold,
      expiry_date,
      donor,
      received_date
    `);

    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER') {
      query = query.eq('camp_id', req.user.campId);
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('reports', 'insufficientPermissions', 'Insufficient permissions') });
    }

    const { data: inventoryItems, error } = await query.order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Add calculated fields
    const formattedItems = inventoryItems.map(item => ({
      ...item,
      quantityAvailable: parseFloat(item.quantity_available?.toString() || '0'),
      quantityReserved: parseFloat(item.quantity_reserved?.toString() || '0'),
      minAlertThreshold: parseFloat(item.min_alert_threshold?.toString() || '0'),
      isLowStock: item.quantity_available < item.min_alert_threshold,
      isExpiringSoon: item.expiry_date &&
        new Date(item.expiry_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Within 7 days
    }));

    res.json(formattedItems);
  } catch (error) {
    console.error('Get inventory reports error:', error);
    next(error);
  }
});

// Get system operations audit logs
router.get('/system-operations', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    // Query system operations log table for audit logs
    let query = supabase.from('system_operations_log').select(`
      id,
      user_id,
      operation_type,
      resource_type,
      resource_id,
      old_values,
      new_values,
      ip_address,
      user_agent,
      created_at
    `).order('created_at', { ascending: false });

    // Apply pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    // Apply filters if provided
    if (req.query.action) {
      query = query.ilike('operation_type', `%${req.query.action}%`);
    }

    if (req.query.resource_type) {
      query = query.ilike('resource_type', `%${req.query.resource_type}%`);
    }

    if (req.query.start_date) {
      query = query.gte('created_at', req.query.start_date);
    }

    if (req.query.end_date) {
      query = query.lte('created_at', req.query.end_date);
    }

    const { data: auditLogs, error } = await query;

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Get all user IDs from logs
    const userIds = [...new Set(auditLogs.map(log => log.user_id).filter(Boolean))];
    
    // Fetch user details separately
    let usersMap = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, role')
        .in('id', userIds);
      
      if (users) {
        usersMap = Object.fromEntries(users.map(u => [u.id, u]));
      }
    }

    // Get total count for pagination metadata
    const { count, error: countError } = await supabase
      .from('system_operations_log')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.warn('Could not get audit log count:', getDatabaseErrorMessage(countError));
    }

    // Format logs to match frontend expectations and normalize operation types
    const formattedLogs = auditLogs.map(log => {
      console.log('Raw log:', JSON.stringify(log, null, 2)); // Debug log
      
      // Map database operation types to frontend-friendly types
      let normalizedOperationType = 'UNKNOWN';
      if (log.operation_type) {
        switch(log.operation_type.toUpperCase()) {
          case 'INSERT':
            normalizedOperationType = 'CREATE';
            break;
          case 'UPDATE':
            normalizedOperationType = 'UPDATE';
            break;
          case 'DELETE':
            normalizedOperationType = 'DELETE';
            break;
          default:
            normalizedOperationType = log.operation_type.toUpperCase();
        }
      }

      // Get user data from our pre-fetched map
      const userData = log.user_id ? usersMap[log.user_id] : null;
      
      console.log('User data for', log.user_id, ':', userData); // Debug log
      
      return {
        id: log.id,
        userId: log.user_id || 'system',
        userName: userData ? `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.email : 'System',
        userRole: userData?.role || 'Unknown',
        userEmail: userData?.email || '',
        operationType: normalizedOperationType,
        resourceType: log.resource_type || 'unknown',
        resourceId: log.resource_id || '',
        oldValues: log.old_values,
        newValues: log.new_values,
        ipAddress: log.ip_address || 'N/A',
        userAgent: log.user_agent || '',
        createdAt: log.created_at || log.timestamp || new Date().toISOString(),
        timestamp: log.created_at || log.timestamp || new Date().toISOString()
      };
    });

    console.log('Formatted audit logs:', formattedLogs.length);

    res.json({
      data: formattedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    console.error('Get system operations audit logs error:', error);
    next(error);
  }
});

// Log an operation (captures IP and user agent from request)
// Authentication is optional - allows logging from public endpoints
router.post('/log-operation', optionalAuthenticateToken, async (req, res, next) => {
  try {
    const { operation_type, resource_type, resource_id, old_values, new_values, details, user_id } = req.body;

    // Get real IP address from request
    const ipAddress = req.ip ||
                     req.headers['x-forwarded-for']?.split(',')[0] ||
                     req.headers['x-real-ip'] ||
                     'unknown';

    // Get user agent from request
    const userAgent = req.headers['user-agent'] || 'unknown';

    // UUID validation regex
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Determine user ID (prefer token, then body if valid UUID, else null)
    let userId = null;
    if (req.user && req.user.userId && uuidRegex.test(req.user.userId)) {
      userId = req.user.userId;
    } else if (user_id && uuidRegex.test(user_id)) {
      userId = user_id;
    }

    // Validate resource_id as UUID or null
    const validResourceId = (resource_id && uuidRegex.test(resource_id)) ? resource_id : null;

    // Insert log entry
    const { data, error } = await supabase
      .from('system_operations_log')
      .insert([{
        user_id: userId,
        operation_type: operation_type || 'UNKNOWN',
        resource_type: resource_type || 'unknown',
        resource_id: validResourceId,
        old_values: old_values || null,
        new_values: new_values || null,
        ip_address: ipAddress,
        user_agent: userAgent,
        created_at: new Date().toISOString()
      }]);

    if (error) {
      console.error('Error logging operation:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.error('Log operation error:', error);
    next(error);
  }
});

module.exports = { reportsRoutes: router };