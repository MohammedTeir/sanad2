// backend/routes/transfers.js
const express = require('express');
const { supabase } = require('../db/connection');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const { authenticateToken, authorizeRole } = require('../middleware/auth');

const router = express.Router();

// Get transfer requests (with filtering)
router.get('/', authenticateToken, authorizeRole(['CAMP_MANAGER', 'SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    let { campId, type = 'all' } = req.query;

    // For CAMP_MANAGER, use campId from token if not provided
    if (!campId && req.user.role === 'CAMP_MANAGER') {
      campId = req.user.campId;
    }

    // If still no campId, return error
    if (!campId) {
      return res.status(400).json({
        error: getMessage('transfers', 'campIdRequired', 'معرف المخيم مطلوب')
      });
    }

    if (!['incoming', 'outgoing', 'all'].includes(type)) {
      return res.status(400).json({
        error: getMessage('transfers', 'invalidType', 'نوع الطلب غير صالح')
      });
    }

    let query = supabase
      .from('transfer_requests')
      .select(`
        *,
        from_camp:camps!from_camp_id(name),
        to_camp:camps!to_camp_id(name)
      `)
      .order('date', { ascending: false });

    // Filter based on type
    if (type === 'incoming' && campId) {
      query = query.eq('to_camp_id', campId);
    } else if (type === 'outgoing' && campId) {
      query = query.eq('from_camp_id', campId);
    } else if (campId) {
      // For 'all', show both incoming and outgoing for the camp
      query = query.or(`to_camp_id.eq.${campId},from_camp_id.eq.${campId}`);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Transform data for frontend
    const transformedData = data.map(request => ({
      id: request.id,
      dp_id: request.dp_id,
      dp_name: request.dp_name,
      dp_national_id: request.dp_national_id,
      dp_phone: request.dp_phone,
      from_camp_id: request.from_camp_id,
      from_camp_name: request.from_camp?.name || 'Unknown',
      to_camp_id: request.to_camp_id,
      to_camp_name: request.to_camp?.name || 'Unknown',
      status: request.status,
      request_date: request.date,
      reason: request.reason,
      additional_notes: request.notes,
      reviewed_by: request.reviewed_by_user_id,
      reviewed_at: request.reviewed_at,
      rejection_reason: request.resolution_notes,
      admin_notes: request.resolution_notes,
      family_members_count: request.family_members_count
    }));

    res.json(transformedData);
  } catch (error) {
    console.error('Get transfer requests error:', error);
    next(error);
  }
});

// Get single transfer request by ID
router.get('/:id', authenticateToken, authorizeRole(['CAMP_MANAGER', 'SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('transfer_requests')
      .select(`
        *,
        from_camp:camps!from_camp_id(name),
        to_camp:camps!to_camp_id(name)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({
        error: getMessage('transfers', 'transferRequestNotFound', 'طلب النقل غير موجود')
      });
    }

    // Check authorization
    if (req.user.role === 'CAMP_MANAGER' &&
        data.to_camp_id !== req.user.campId &&
        data.from_camp_id !== req.user.campId) {
      return res.status(403).json({
        error: getMessage('transfers', 'accessDenied', 'تم رفض الوصول')
      });
    }

    const transformedData = {
      id: data.id,
      dp_id: data.dp_id,
      dp_name: data.dp_name,
      dp_national_id: data.dp_national_id,
      dp_phone: data.dp_phone,
      from_camp_id: data.from_camp_id,
      from_camp_name: data.from_camp?.name || 'Unknown',
      to_camp_id: data.to_camp_id,
      to_camp_name: data.to_camp?.name || 'Unknown',
      status: data.status,
      request_date: data.date,
      reason: data.reason,
      additional_notes: data.notes,
      reviewed_by: data.reviewed_by_user_id,
      reviewed_at: data.reviewed_at,
      rejection_reason: data.resolution_notes,
      admin_notes: data.resolution_notes,
      family_members_count: data.family_members_count
    };

    res.json(transformedData);
  } catch (error) {
    console.error('Get transfer request by ID error:', error);
    next(error);
  }
});

// Create transfer request (for beneficiaries/field officers)
router.post('/', authenticateToken, async (req, res, next) => {
  try {
    const { dp_id, from_camp_id, to_camp_id, reason, additional_notes } = req.body;

    // Validate required fields
    if (!dp_id || !from_camp_id || !to_camp_id || !reason) {
      return res.status(400).json({ 
        error: getMessage('transfers', 'reasonRequired', 'جميع الحقول المطلوبة يجب تعبئتها') 
      });
    }

    // Get DP information
    const { data: dpData, error: dpError } = await supabase
      .from('families')
      .select('head_of_family_name, national_id, phone_number, camp_id, total_members_count')
      .eq('id', dp_id)
      .single();

    if (dpError || !dpData) {
      return res.status(404).json({ 
        error: getMessage('families', 'familyNotFound', 'العائلة غير موجودة') 
      });
    }

    // Check authorization - user can only request transfer for their own family
    if (req.user.role === 'BENEFICIARY' && dpData.camp_id !== from_camp_id) {
      return res.status(403).json({ 
        error: getMessage('transfers', 'accessDenied', 'تم رفض الوصول') 
      });
    }

    const { data, error } = await supabase
      .from('transfer_requests')
      .insert({
        dp_id,
        dp_name: dpData.head_of_family_name,
        dp_national_id: dpData.national_id,
        dp_phone: dpData.phone_number,
        from_camp_id,
        to_camp_id,
        reason,
        notes: additional_notes || null,
        status: 'قيد الانتظار',
        date: new Date().toISOString(),
        requested_by_user_id: req.user.id,
        family_members_count: dpData.total_members_count
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json({
      message: getMessage('transfers', 'transferRequestCreated', 'تم إنشاء طلب النقل بنجاح'),
      transfer: data
    });
  } catch (error) {
    console.error('Create transfer request error:', error);
    next(error);
  }
});

// Approve transfer request
router.patch('/:id/approve', authenticateToken, authorizeRole(['CAMP_MANAGER', 'SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    // Get the transfer request
    const { data: transfer, error: fetchError } = await supabase
      .from('transfer_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !transfer) {
      return res.status(404).json({ 
        error: getMessage('transfers', 'transferRequestNotFound', 'طلب النقل غير موجود') 
      });
    }

    // Check if already reviewed
    if (transfer.status !== 'قيد الانتظار') {
      return res.status(400).json({ 
        error: getMessage('transfers', 'alreadyReviewed', 'تمت مراجعة طلب النقل بالفعل') 
      });
    }

    // Check authorization - CAMP_MANAGER can only approve incoming requests
    if (req.user.role === 'CAMP_MANAGER' && transfer.to_camp_id !== req.user.campId) {
      return res.status(403).json({ 
        error: getMessage('transfers', 'unauthorizedApprove', 'غير مصرح بقبول طلب النقل هذا') 
      });
    }

    // Update transfer request status
    const { data, error } = await supabase
      .from('transfer_requests')
      .update({
        status: 'موافق',
        reviewed_by_user_id: req.user.id,
        reviewed_at: new Date().toISOString(),
        resolution_notes: notes || null
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({
      message: getMessage('transfers', 'transferRequestApproved', 'تم قبول طلب النقل بنجاح'),
      transfer: data
    });
  } catch (error) {
    console.error('Approve transfer request error:', error);
    next(error);
  }
});

// Reject transfer request
router.patch('/:id/reject', authenticateToken, authorizeRole(['CAMP_MANAGER', 'SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ 
        error: getMessage('transfers', 'reasonRequired', 'سبب الرفض مطلوب') 
      });
    }

    // Get the transfer request
    const { data: transfer, error: fetchError } = await supabase
      .from('transfer_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !transfer) {
      return res.status(404).json({ 
        error: getMessage('transfers', 'transferRequestNotFound', 'طلب النقل غير موجود') 
      });
    }

    // Check if already reviewed
    if (transfer.status !== 'قيد الانتظار') {
      return res.status(400).json({ 
        error: getMessage('transfers', 'alreadyReviewed', 'تمت مراجعة طلب النقل بالفعل') 
      });
    }

    // Check authorization - CAMP_MANAGER can only reject incoming requests
    if (req.user.role === 'CAMP_MANAGER' && transfer.to_camp_id !== req.user.campId) {
      return res.status(403).json({ 
        error: getMessage('transfers', 'unauthorizedReject', 'غير مصرح برفض طلب النقل هذا') 
      });
    }

    // Update transfer request status
    const { data, error } = await supabase
      .from('transfer_requests')
      .update({
        status: 'مرفوض',
        reviewed_by_user_id: req.user.id,
        reviewed_at: new Date().toISOString(),
        resolution_notes: reason
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({
      message: getMessage('transfers', 'transferRequestRejected', 'تم رفض طلب النقل'),
      transfer: data
    });
  } catch (error) {
    console.error('Reject transfer request error:', error);
    next(error);
  }
});

module.exports = { transferRoutes: router };
