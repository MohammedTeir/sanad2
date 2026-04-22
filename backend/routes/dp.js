// backend/routes/dp.js
// DP (Beneficiary) specific routes for the beneficiary portal
// These routes are designed specifically for BENEFICIARY role users

const express = require('express');
const { supabase } = require('../db/connection');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Middleware to verify BENEFICIARY role
const requireBeneficiary = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: getMessage('auth', 'authenticationRequired', 'Authentication required') });
  }
  
  if (req.user.role !== 'BENEFICIARY') {
    return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'صلاحيات غير كافية') });
  }
  
  next();
};

// Apply authentication and beneficiary check to all DP routes
router.use(authenticateToken);
router.use(requireBeneficiary);

/**
 * GET /api/dp/profile
 * Get the authenticated beneficiary's family profile
 */
router.get('/profile', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;
    
    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }
    
    const { data: family, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
    
    if (error || !family) {
      return res.status(404).json({ error: 'العائلة غير موجودة' });
    }
    
    res.json(family);
  } catch (error) {
    console.error('Get DP profile error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/members
 * Get family members for the authenticated beneficiary
 */
router.get('/members', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const { data: members, error } = await supabase
      .from('individuals')
      .select('*')
      .eq('family_id', familyId)
      .eq('is_deleted', false)  // Filter out soft-deleted members
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(members || []);
  } catch (error) {
    console.error('Get DP members error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/aid-history
 * Get aid distribution history for the authenticated beneficiary
 */
router.get('/aid-history', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;
    
    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }
    
    const { data: distributions, error } = await supabase
      .from('aid_distributions')
      .select('*')
      .eq('family_id', familyId)
      .order('distribution_date', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }
    
    res.json(distributions || []);
  } catch (error) {
    console.error('Get DP aid history error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/transfer-requests
 * Get transfer requests for the authenticated beneficiary
 */
router.get('/transfer-requests', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;
    
    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }
    
    const { data: requests, error } = await supabase
      .from('transfer_requests')
      .select('*')
      .eq('dp_id', familyId)
      .order('date', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }
    
    res.json(requests || []);
  } catch (error) {
    console.error('Get DP transfer requests error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/complaints
 * Get complaints/feedback for the authenticated beneficiary
 */
router.get('/complaints', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const { data: complaints, error } = await supabase
      .from('complaints')
      .select('*')
      .eq('family_id', familyId)
      .eq('deleted', false)  // Filter out soft-deleted complaints
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(complaints || []);
  } catch (error) {
    console.error('Get DP complaints error:', error);
    next(error);
  }
});

/**
 * POST /api/dp/complaints
 * Submit a new complaint/feedback
 */
router.post('/complaints', async (req, res, next) => {
  try {
    const { subject, description, category, is_anonymous } = req.body;
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const { data: complaint, error } = await supabase
      .from('complaints')
      .insert({
        family_id: familyId,
        subject,
        description,
        category: category || 'عام',
        is_anonymous: is_anonymous || false
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json(complaint);
  } catch (error) {
    console.error('Submit DP complaint error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/emergency-reports
 * Get emergency reports for the authenticated beneficiary
 */
router.get('/emergency-reports', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const { data: reports, error } = await supabase
      .from('emergency_reports')
      .select('*')
      .eq('family_id', familyId)
      .eq('deleted', false)  // Filter out soft-deleted emergency reports
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(reports || []);
  } catch (error) {
    console.error('Get DP emergency reports error:', error);
    next(error);
  }
});

/**
 * POST /api/dp/emergency-reports
 * Submit a new emergency report
 */
router.post('/emergency-reports', async (req, res, next) => {
  try {
    const { emergency_type, description, urgency, location } = req.body;
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    if (!emergency_type || !description || !urgency) {
      return res.status(400).json({ error: 'البيانات المطلوبة غير مكتملة' });
    }

    const { data: report, error } = await supabase
      .from('emergency_reports')
      .insert({
        family_id: familyId,
        emergency_type,
        description,
        urgency,
        location: location || null
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json(report);
  } catch (error) {
    console.error('Submit DP emergency report error:', error);
    next(error);
  }
});

/**
 * PUT /api/dp/profile
 * Update beneficiary's phone numbers
 */
router.put('/profile', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;
    const { phone_number, phone_secondary } = req.body;
    
    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }
    
    const updateData = {
      updated_at: new Date().toISOString()
    };
    
    if (phone_number !== undefined) {
      updateData.phone_number = phone_number;
    }
    
    if (phone_secondary !== undefined) {
      updateData.phone_secondary = phone_secondary;
    }
    
    const { data: updatedFamily, error } = await supabase
      .from('families')
      .update(updateData)
      .eq('id', familyId)
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }
    
    res.json(updatedFamily);
  } catch (error) {
    console.error('Update DP profile error:', error);
    next(error);
  }
});

/**
 * PUT /api/dp/members/:id
 * Update family member for the authenticated beneficiary
 */
router.put('/members/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    // Verify the individual belongs to this family
    const { data: individual, error: fetchError } = await supabase
      .from('individuals')
      .select('family_id')
      .eq('id', id)
      .single();

    if (fetchError || !individual) {
      return res.status(404).json({ error: getMessage('individuals', 'individualNotFound', 'الفرد غير موجود') });
    }

    if (individual.family_id !== familyId) {
      return res.status(403).json({ error: getMessage('individuals', 'unauthorizedUpdate', 'غير مصرح بتحديث هذا الفرد') });
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
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    res.json(updatedIndividual);
  } catch (error) {
    console.error('Update DP member error:', error);
    next(error);
  }
});

/**
 * POST /api/dp/members
 * Create new family member for the authenticated beneficiary
 */
router.post('/members', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const memberData = {
      ...req.body,
      family_id: familyId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // If 4-part names provided, compute full name
    if (memberData.first_name && memberData.father_name && memberData.family_name) {
      memberData.name = `${memberData.first_name || ''} ${memberData.father_name || ''} ${memberData.grandfather_name || ''} ${memberData.family_name || ''}`.trim();
    }

    const { data: newMember, error } = await supabase
      .from('individuals')
      .insert([memberData])
      .select()
      .single();

    if (error) {
      console.error('Create DP member error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json(newMember);
  } catch (error) {
    console.error('Create DP member error:', error);
    next(error);
  }
});

// ============================================================================
// DELETE ROUTES FOR BENEFICIARIES
// ============================================================================

/**
 * DELETE /api/dp/complaints/:id
 * Soft delete a complaint (beneficiary can delete their own)
 */
router.delete('/complaints/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    // Verify ownership
    const { data: complaint } = await supabase
      .from('complaints')
      .select('family_id')
      .eq('id', id)
      .eq('family_id', familyId)
      .single();

    if (!complaint) {
      return res.status(404).json({ error: 'الشكوى غير موجودة' });
    }

    const updateData = {
      deleted: true,
      deleted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('complaints')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم حذف الشكوى بنجاح', data });
  } catch (error) {
    console.error('Delete DP complaint error:', error);
    next(error);
  }
});

/**
 * DELETE /api/dp/emergency-reports/:id
 * Soft delete an emergency report (beneficiary can delete their own)
 */
router.delete('/emergency-reports/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    // Verify ownership
    const { data: report } = await supabase
      .from('emergency_reports')
      .select('family_id')
      .eq('id', id)
      .eq('family_id', familyId)
      .single();

    if (!report) {
      return res.status(404).json({ error: 'البلاغ غير موجود' });
    }

    const updateData = {
      deleted: true,
      deleted_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('emergency_reports')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم حذف البلاغ بنجاح', data });
  } catch (error) {
    console.error('Delete DP emergency report error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/camp-info
 * Get camp information for the authenticated beneficiary's family
 */
router.get('/camp-info', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    // Get family with camp_id
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', familyId)
      .single();

    if (familyError || !family || !family.camp_id) {
      return res.status(404).json({ error: 'معلومات المخيم غير متوفرة' });
    }

    // Get camp details
    const { data: camp, error: campError } = await supabase
      .from('camps')
      .select('*')
      .eq('id', family.camp_id)
      .single();

    if (campError || !camp) {
      return res.status(404).json({ error: 'المخيم غير موجود' });
    }

    res.json({
      id: camp.id,
      name: camp.name,
      location: {
        governorate: camp.location_governorate || 'غير محدد',
        area: camp.location_area || 'غير محدد',
        address: camp.location_address || ''
      },
      managerName: camp.manager_name || 'غير محدد',
      managerContact: null, // Can be added later if needed
      status: camp.status
    });
  } catch (error) {
    console.error('Get camp info error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/distributions
 * Get distribution history for the authenticated beneficiary
 */
router.get('/distributions', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    // Get family's camp first
    const { data: family } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', familyId)
      .single();

    // Get distributions with campaign details
    // Use left join to include distributions even if campaign is soft-deleted
    const { data: distributions, error } = await supabase
      .from('aid_distributions')
      .select(`
        *,
        campaign:aid_campaigns (
          name,
          aid_type,
          aid_category
        )
      `)
      .eq('family_id', familyId)
      .order('distribution_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Transform data - always use distribution's aid_type first (stored at distribution time)
    // Fall back to campaign's aid_type if distribution doesn't have it
    const transformedDistributions = (distributions || []).map(dist => ({
      id: dist.id,
      family_id: dist.family_id,
      aid_type: dist.aid_type || dist.campaign?.aid_type,
      aid_category: dist.aid_category || dist.campaign?.aid_category,
      quantity: dist.quantity,
      distribution_date: dist.distribution_date,
      status: dist.status,
      notes: dist.notes,
      campaign_id: dist.campaign_id,
      campaign_name: dist.campaign?.name,
      camp_name: family?.camp_id || null,
      received_by_signature: dist.received_by_signature,
      received_by_biometric: dist.received_by_biometric,
      received_by_photo_url: dist.received_by_photo_url,
      otp_code: dist.otp_code,
      duplicate_check_passed: dist.duplicate_check_passed
    }));

    res.json(transformedDistributions);
  } catch (error) {
    console.error('Get distributions error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/notifications
 * Get notifications for the authenticated beneficiary
 */
router.get('/notifications', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('family_id', familyId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(notifications || []);
  } catch (error) {
    console.error('Get notifications error:', error);
    next(error);
  }
});

/**
 * POST /api/dp/notifications/:id/read
 * Mark notification as read
 */
router.post('/notifications/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    // Verify ownership
    const { data: notification } = await supabase
      .from('notifications')
      .select('family_id')
      .eq('id', id)
      .eq('family_id', familyId)
      .single();

    if (!notification) {
      return res.status(404).json({ error: 'الإشعار غير موجود' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم تحديد الإشعار كمقروء', data });
  } catch (error) {
    console.error('Mark notification read error:', error);
    next(error);
  }
});

/**
 * POST /api/dp/notifications/mark-all-read
 * Mark all notifications as read
 */
router.post('/notifications/mark-all-read', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true,
        read_at: new Date().toISOString()
      })
      .eq('family_id', familyId)
      .eq('is_read', false);

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ message: 'تم تحديد جميع الإشعارات كمقروءة' });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/special-assistance
 * Get special assistance requests for the authenticated beneficiary
 */
router.get('/special-assistance', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const { data: requests, error } = await supabase
      .from('special_assistance_requests')
      .select('*')
      .eq('family_id', familyId)
      .eq('deleted', false)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(requests || []);
  } catch (error) {
    console.error('Get special assistance error:', error);
    next(error);
  }
});

/**
 * POST /api/dp/special-assistance
 * Submit new special assistance request
 */
router.post('/special-assistance', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const { assistance_type, description, urgency } = req.body;

    if (!assistance_type || !description || !urgency) {
      return res.status(400).json({ error: 'يرجى ملء جميع الحقول المطلوبة' });
    }

    // Validate assistance_type is one of the Arabic values
    const validAssistanceTypes = ['طبية', 'مالية', 'سكنية', 'تعليمية', 'أخرى'];
    if (!validAssistanceTypes.includes(assistance_type)) {
      return res.status(400).json({ error: 'نوع المساعدة غير صالح' });
    }

    const requestData = {
      family_id: familyId,
      assistance_type,
      description,
      urgency,
      status: 'جديد'
    };

    const { data: newRequest, error } = await supabase
      .from('special_assistance_requests')
      .insert([requestData])
      .select()
      .single();

    if (error) {
      console.error('Create special assistance error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Create notification for camp manager
    await supabase.from('notifications').insert([{
      family_id: familyId,
      notification_type: 'system',
      title: 'طلب مساعدة جديدة',
      message: `تم تقديم طلب مساعدة ${assistance_type} من الأسرة`,
      is_read: false,
      related_entity_id: newRequest.id,
      related_entity_type: 'special_assistance'
    }]);

    res.status(201).json(newRequest);
  } catch (error) {
    console.error('Create special assistance error:', error);
    next(error);
  }
});

/**
 * GET /api/dp/vulnerability/breakdown
 * Get vulnerability score breakdown for the authenticated beneficiary
 */
router.get('/vulnerability/breakdown', async (req, res, next) => {
  try {
    const familyId = req.user.familyId;

    if (!familyId) {
      return res.status(400).json({ error: 'لا يوجد معرف عائلة' });
    }

    const { data: family, error } = await supabase
      .from('families')
      .select('vulnerability_breakdown')
      .eq('id', familyId)
      .single();

    if (error || !family || !family.vulnerability_breakdown) {
      return res.json({});
    }

    res.json(family.vulnerability_breakdown);
  } catch (error) {
    console.error('Get vulnerability breakdown error:', error);
    next(error);
  }
});

module.exports = { dpRoutes: router };
