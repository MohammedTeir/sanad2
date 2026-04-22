// backend/routes/staff.js
// Staff routes for Camp Manager to manage complaints, emergency reports, and update requests

const express = require('express');
const { supabase } = require('../db/connection');
const { getDatabaseErrorMessage } = require('../utils/arabicMessages');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to verify staff role (CAMP_MANAGER or FIELD_OFFICER)
const requireStaff = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول' });
  }

  if (!['CAMP_MANAGER', 'FIELD_OFFICER', 'SYSTEM_ADMIN'].includes(req.user.role)) {
    return res.status(403).json({ error: 'صلاحيات غير كافية' });
  }

  next();
};

// Apply authentication and staff check to all routes
router.use(authenticateToken);
router.use(requireStaff);

// ============================================================================
// COMPLAINTS ROUTES
// ============================================================================

/**
 * GET /api/staff/complaints
 * Get all complaints for the camp (filtered by camp_id for CAMP_MANAGER)
 */
router.get('/complaints', async (req, res, next) => {
  try {
    const { campId, includeDeleted } = req.query;
    const showDeleted = includeDeleted === 'true' && req.user.role === 'SYSTEM_ADMIN';

    if (!campId && req.user.role === 'CAMP_MANAGER') {
      return res.status(400).json({ error: 'معرف المخيم مطلوب' });
    }

    let query = supabase
      .from('complaints')
      .select(`
        *,
        families!inner(
          id,
          head_of_family_name,
          head_first_name,
          head_father_name,
          head_grandfather_name,
          head_family_name,
          head_of_family_national_id,
          camp_id
        )
      `)
      .order('created_at', { ascending: false });

    // Filter by camp_id for CAMP_MANAGER
    if (req.user.role === 'CAMP_MANAGER' && campId) {
      query = query.eq('families.camp_id', campId);
    } else if (req.user.role === 'FIELD_OFFICER' && campId) {
      query = query.eq('families.camp_id', campId);
    }

    // Filter out deleted records unless explicitly requested (SYSTEM_ADMIN only)
    if (!showDeleted) {
      query = query.eq('deleted', false);
    }

    const { data: complaints, error } = await query;

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Format the data - convert snake_case to camelCase
    const formattedComplaints = complaints.map(c => ({
      id: c.id,
      familyId: c.family_id,
      familyName: c.families.head_first_name && c.families.head_father_name && c.families.head_grandfather_name && c.families.head_family_name
        ? `${c.families.head_first_name} ${c.families.head_father_name} ${c.families.head_grandfather_name} ${c.families.head_family_name}`
        : c.families.head_of_family_name,
      headOfFamilyNationalId: c.families.head_of_family_national_id,
      subject: c.subject,
      description: c.description,
      category: c.category,
      isAnonymous: c.is_anonymous,
      status: c.status,
      response: c.response,
      respondedAt: c.responded_at,
      createdAt: c.created_at,
      updatedAt: c.updated_at,
      deleted: c.deleted,
      deletedAt: c.deleted_at,
      deletedBy: c.deleted_by,
      restorationReason: c.restoration_reason
    }));

    res.json(formattedComplaints);
  } catch (error) {
    console.error('Get staff complaints error:', error);
    next(error);
  }
});

/**
 * PUT /api/staff/complaints/:id
 * Update a complaint (respond or change status)
 */
router.put('/complaints/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response, status } = req.body;

    // Debug logging
    console.log('[PUT /api/staff/complaints/:id] Request body:', { response, status });
    console.log('[PUT /api/staff/complaints/:id] Status type:', typeof status);
    console.log('[PUT /api/staff/complaints/:id] Status length:', status ? status.length : 'N/A');
    console.log('[PUT /api/staff/complaints/:id] Status char codes:', status ? Array.from(status).map(c => ({ char: c, code: c.charCodeAt(0), hex: c.charCodeAt(0).toString(16) })) : 'N/A');

    // Valid status values for complaints
    const VALID_STATUSES = ['جديد', 'قيد المراجعة', 'تم الرد', 'مغلق'];

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (response !== undefined) {
      updateData.response = response;
      updateData.responded_at = new Date().toISOString();
    }

    if (status !== undefined) {
      // Validate status before sending to database
      const trimmedStatus = status.trim();
      console.log('[PUT /api/staff/complaints/:id] Trimmed status:', trimmedStatus);
      
      if (!VALID_STATUSES.includes(trimmedStatus)) {
        console.error('Invalid status value:', status, '(trimmed):', trimmedStatus);
        return res.status(400).json({
          error: 'حالة غير صالحة',
          details: `القيمة المرسلة: "${status}", القيم المسموحة: ${VALID_STATUSES.join(', ')}`
        });
      }
      updateData.status = trimmedStatus;
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update complaint error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(complaint);
  } catch (error) {
    console.error('Update complaint error:', error);
    next(error);
  }
});

// ============================================================================
// EMERGENCY REPORTS ROUTES
// ============================================================================

/**
 * GET /api/staff/emergency-reports
 * Get all emergency reports for the camp (filtered by camp_id for CAMP_MANAGER)
 */
router.get('/emergency-reports', async (req, res, next) => {
  try {
    const { campId, includeDeleted } = req.query;
    const showDeleted = includeDeleted === 'true' && req.user.role === 'SYSTEM_ADMIN';

    if (!campId && req.user.role === 'CAMP_MANAGER') {
      return res.status(400).json({ error: 'معرف المخيم مطلوب' });
    }

    let query = supabase
      .from('emergency_reports')
      .select(`
        *,
        families!inner(
          id,
          head_of_family_name,
          head_first_name,
          head_father_name,
          head_grandfather_name,
          head_family_name,
          head_of_family_national_id,
          camp_id
        )
      `)
      .order('created_at', { ascending: false });

    // Filter out deleted records unless explicitly requested (SYSTEM_ADMIN only)
    if (!showDeleted) {
      query = query.eq('deleted', false);
    }

    // Filter by camp_id for CAMP_MANAGER
    if (req.user.role === 'CAMP_MANAGER' && campId) {
      query = query.eq('families.camp_id', campId);
    } else if (req.user.role === 'FIELD_OFFICER' && campId) {
      query = query.eq('families.camp_id', campId);
    }

    const { data: reports, error } = await query;

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Format the data - convert snake_case to camelCase
    const formattedReports = reports.map(r => ({
      id: r.id,
      familyId: r.family_id,
      familyName: r.families.head_first_name && r.families.head_father_name && r.families.head_grandfather_name && r.families.head_family_name
        ? `${r.families.head_first_name} ${r.families.head_father_name} ${r.families.head_grandfather_name} ${r.families.head_family_name}`
        : r.families.head_of_family_name,
      headOfFamilyNationalId: r.families.head_of_family_national_id,
      emergencyType: r.emergency_type,
      description: r.description,
      urgency: r.urgency,
      location: r.location,
      status: r.status,
      assignedTo: r.assigned_to,
      resolvedAt: r.resolved_at,
      resolutionNotes: r.resolution_notes,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      deleted: r.deleted,
      deletedAt: r.deleted_at,
      deletedBy: r.deleted_by,
      restorationReason: r.restoration_reason
    }));

    res.json(formattedReports);
  } catch (error) {
    console.error('Get staff emergency reports error:', error);
    next(error);
  }
});

/**
 * PUT /api/staff/emergency-reports/:id
 * Update an emergency report (resolve or change status)
 */
router.put('/emergency-reports/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, resolutionNotes, resolvedAt, assignedTo } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) {
      updateData.status = status;
    }

    if (resolutionNotes !== undefined) {
      updateData.resolution_notes = resolutionNotes;
    }

    if (resolvedAt !== undefined) {
      updateData.resolved_at = resolvedAt;
    }

    if (assignedTo !== undefined) {
      updateData.assigned_to = assignedTo;
    }

    const { data: report, error } = await supabase
      .from('emergency_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(report);
  } catch (error) {
    console.error('Update emergency report error:', error);
    next(error);
  }
});

// ============================================================================
// DELETE ROUTES
// ============================================================================

/**
 * DELETE /api/staff/complaints/:id
 * Soft delete a complaint
 */
router.delete('/complaints/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only CAMP_MANAGER and SYSTEM_ADMIN can delete
    if (!['CAMP_MANAGER', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'صلاحيات غير كافية' });
    }

    const updateData = {
      deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: req.user.userId
    };

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم حذف الشكوى بنجاح', data: complaint });
  } catch (error) {
    console.error('Delete complaint error:', error);
    next(error);
  }
});

/**
 * DELETE /api/staff/emergency-reports/:id
 * Soft delete an emergency report
 */
router.delete('/emergency-reports/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only CAMP_MANAGER and SYSTEM_ADMIN can delete
    if (!['CAMP_MANAGER', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'صلاحيات غير كافية' });
    }

    const updateData = {
      deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: req.user.userId
    };

    const { data: report, error } = await supabase
      .from('emergency_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم حذف البلاغ بنجاح', data: report });
  } catch (error) {
    console.error('Delete emergency report error:', error);
    next(error);
  }
});

// ============================================================================
// RESTORE ROUTES
// ============================================================================

/**
 * POST /api/staff/complaints/:id/restore
 * Restore a soft-deleted complaint
 */
router.post('/complaints/:id/restore', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Only SYSTEM_ADMIN can restore
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'صلاحيات غير كافية' });
    }

    const updateData = {
      deleted: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updateData.restoration_reason = reason;
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم استعادة الشكوى بنجاح', data: complaint });
  } catch (error) {
    console.error('Restore complaint error:', error);
    next(error);
  }
});

/**
 * POST /api/staff/emergency-reports/:id/restore
 * Restore a soft-deleted emergency report
 */
router.post('/emergency-reports/:id/restore', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Only SYSTEM_ADMIN can restore
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'صلاحيات غير كافية' });
    }

    const updateData = {
      deleted: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updateData.restoration_reason = reason;
    }

    const { data: report, error } = await supabase
      .from('emergency_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم استعادة البلاغ بنجاح', data: report });
  } catch (error) {
    console.error('Restore emergency report error:', error);
    next(error);
  }
});

// ============================================================================
// SPECIAL ASSISTANCE REQUESTS ROUTES
// ============================================================================

/**
 * GET /api/staff/special-assistance
 * Get all special assistance requests for the camp (filtered by camp_id for CAMP_MANAGER)
 */
router.get('/special-assistance', async (req, res, next) => {
  try {
    const { campId } = req.query;

    if (!campId && req.user.role === 'CAMP_MANAGER') {
      return res.status(400).json({ error: 'معرف المخيم مطلوب' });
    }

    let query = supabase
      .from('special_assistance_requests')
      .select(`
        *,
        families!inner(
          id,
          head_of_family_name,
          head_first_name,
          head_father_name,
          head_grandfather_name,
          head_family_name,
          head_of_family_national_id,
          head_of_family_phone_number,
          camp_id
        )
      `)
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    // Filter by camp_id for CAMP_MANAGER and FIELD_OFFICER
    if (req.user.role === 'CAMP_MANAGER' && campId) {
      query = query.eq('families.camp_id', campId);
    } else if (req.user.role === 'FIELD_OFFICER' && campId) {
      query = query.eq('families.camp_id', campId);
    }

    const { data: requests, error } = await query;

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Format the data - convert snake_case to camelCase with family info
    const formattedRequests = requests.map(r => ({
      id: r.id,
      family_id: r.family_id,
      family_name: r.families.head_first_name && r.families.head_father_name && r.families.head_grandfather_name && r.families.head_family_name
        ? `${r.families.head_first_name} ${r.families.head_father_name} ${r.families.head_grandfather_name} ${r.families.head_family_name}`
        : r.families.head_of_family_name,
      family_phone: r.families.head_of_family_phone_number,
      assistance_type: r.assistance_type,
      description: r.description,
      urgency: r.urgency,
      status: r.status,
      response: r.response,
      responded_by: r.responded_by,
      responded_at: r.responded_at,
      created_at: r.created_at,
      updated_at: r.updated_at,
      deleted: r.deleted,
      deleted_at: r.deleted_at,
      deleted_by: r.deleted_by,
      restoration_reason: r.restoration_reason
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Get staff special assistance error:', error);
    next(error);
  }
});

/**
 * PUT /api/staff/special-assistance/:id
 * Update a special assistance request (respond or change status)
 */
router.put('/special-assistance/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, response, responded_by, responded_at } = req.body;

    // Valid status values for special assistance
    const VALID_STATUSES = ['جديد', 'قيد المراجعة', 'تمت الموافقة', 'مرفوض', 'تم التنفيذ'];

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (response !== undefined) {
      updateData.response = response;
    }

    if (responded_by !== undefined) {
      updateData.responded_by = responded_by;
    }

    if (status !== undefined) {
      // Validate status before sending to database
      const trimmedStatus = status.trim();

      if (!VALID_STATUSES.includes(trimmedStatus)) {
        console.error('Invalid status value:', status, '(trimmed):', trimmedStatus);
        return res.status(400).json({
          error: 'حالة غير صالحة',
          details: `القيمة المرسلة: "${status}", القيم المسموحة: ${VALID_STATUSES.join(', ')}`
        });
      }
      updateData.status = trimmedStatus;
    }

    if (responded_at === undefined && (response !== undefined || status !== undefined)) {
      updateData.responded_at = new Date().toISOString();
    } else if (responded_at !== undefined) {
      updateData.responded_at = responded_at;
    }

    const { data: request, error } = await supabase
      .from('special_assistance_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update special assistance error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(request);
  } catch (error) {
    console.error('Update special assistance error:', error);
    next(error);
  }
});

/**
 * DELETE /api/staff/special-assistance/:id
 * Soft delete a special assistance request
 */
router.delete('/special-assistance/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only CAMP_MANAGER and SYSTEM_ADMIN can delete
    if (!['CAMP_MANAGER', 'SYSTEM_ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ error: 'صلاحيات غير كافية' });
    }

    const updateData = {
      deleted: true,
      deleted_at: new Date().toISOString(),
      deleted_by: req.user.userId
    };

    const { data: request, error } = await supabase
      .from('special_assistance_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم حذف طلب المساعدة بنجاح', data: request });
  } catch (error) {
    console.error('Delete special assistance error:', error);
    next(error);
  }
});

/**
 * POST /api/staff/special-assistance/:id/restore
 * Restore a soft-deleted special assistance request
 */
router.post('/special-assistance/:id/restore', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    // Only SYSTEM_ADMIN can restore
    if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: 'صلاحيات غير كافية' });
    }

    const updateData = {
      deleted: false,
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updateData.restoration_reason = reason;
    }

    const { data: request, error } = await supabase
      .from('special_assistance_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم استعادة طلب المساعدة بنجاح', data: request });
  } catch (error) {
    console.error('Restore special assistance error:', error);
    next(error);
  }
});

module.exports = { staffRoutes: router };
