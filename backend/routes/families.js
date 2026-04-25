// backend/routes/families.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
// ⚠️  DISABLED: Vulnerability score system
// const { ensureVulnerabilityScore, ensureVulnerabilityScores } = require('../utils/vulnerabilityHelper');
const router = express.Router();

// Get all families (with optional camp filter)
router.get('/', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'families', 'read'), async (req, res, next) => {
  try {
    console.log('=== GET FAMILIES ===');
    console.log('User role:', req.user.role);
    console.log('User campId:', req.user.campId);

    // Check if user wants to include deleted records (admin only)
    const { includeDeleted } = req.query;
    const showDeleted = includeDeleted === 'true' && req.user.role === 'SYSTEM_ADMIN';

    let query = supabase.from('families').select('*');

    // Filter out soft-deleted records unless explicitly requested
    if (!showDeleted) {
      query = query.eq('is_deleted', false);
    }

    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER') {
      if (req.user.campId) {
        console.log('Filtering by camp_id:', req.user.campId);
        query = query.eq('camp_id', req.user.campId);
        // CAMP_MANAGER sees all families in their camp (including pending)
      }
    } else if (req.user.role === 'FIELD_OFFICER') {
      if (req.user.campId) {
        query = query.eq('camp_id', req.user.campId);
        // FIELD_OFFICER sees all families in their camp (including pending/rejected)
      }
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Apply optional camp filter from query params
    const { campId } = req.query;
    if (campId && req.user.role === 'SYSTEM_ADMIN') {
      query = query.eq('camp_id', campId);
    }

    const { data: families, error } = await query.order('head_of_family_name', { ascending: true });

    if (error) {
      console.error('Error fetching families:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    console.log('Found', families.length, 'families');
    if (families.length > 0) {
      console.log('Sample family status:', families[0].status);
      console.log('Status distribution:', {
        pending: families.filter(f => f.status === 'قيد الانتظار').length,
        approved: families.filter(f => f.status === 'موافق').length,
        rejected: families.filter(f => f.status === 'مرفوض').length
      });

      // ⚠️  DISABLED: Vulnerability score calculation
      // const familiesWithScores = await ensureVulnerabilityScores(families);
      // return res.json(familiesWithScores);
      return res.json(families);
    }

    res.json(families);
  } catch (error) {
    console.error('Get families error:', error);
    next(error);
  }
});

// Get family by ID
router.get('/:familyId', authenticateToken, async (req, res, next) => {
  try {
    const { familyId } = req.params;

    // Check authorization
    const { data: family, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .eq('is_deleted', false)
      .single();

    if (error || !family) {
      return res.status(404).json({ error: getMessage('families', 'familyNotFound', 'Family not found') });
    }

    // Additional authorization check based on user's role and camp assignment
    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'Access denied') });
    }

    // ⚠️  DISABLED: Vulnerability score calculation
    // const { ensureVulnerabilityScore } = require('../utils/vulnerabilityHelper');
    // const familyWithScore = await ensureVulnerabilityScore(family, false);

    res.json(family);
  } catch (error) {
    console.error('Get family error:', error);
    next(error);
  }
});

// Create new family
router.post('/', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'families', 'create'), async (req, res, next) => {
  try {
    // Check authorization (already enforced by authorizeResourceAction)
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Validate 4-part name fields
    const { head_first_name, head_father_name, head_family_name } = req.body;
    if (!head_first_name || !head_father_name || !head_family_name) {
      return res.status(400).json({
        error: getMessage('families', 'missingNameFields', 'الرجاء إدخال الاسم الأول، اسم الأب، واسم العائلة')
      });
    }

    // ⚠️  DISABLED: Vulnerability score calculation
    // let vulnerabilityScore = null;
    // let vulnerabilityBreakdown = null;
    // let vulnerabilityPriority = null;
    // try {
    //   const { calculateVulnerabilityScore } = require('../services/vulnerabilityService');
    //   const scoreResult = await calculateVulnerabilityScore(req.body);
    //   vulnerabilityScore = scoreResult.score;
    //   vulnerabilityBreakdown = scoreResult.breakdown;
    //   vulnerabilityPriority = scoreResult.priorityLevel;
    //   console.log('Vulnerability score calculated:', vulnerabilityScore, 'Priority:', vulnerabilityPriority);
    // } catch (scoreError) {
    //   console.error('Error calculating vulnerability score:', scoreError.message);
    //   // Continue without failing the request - score will be calculated on next update
    // }

    const familyData = {
      ...req.body,
      // Compute full name from 4 parts for backward compatibility
      head_of_family_name: `${head_first_name || ''} ${head_father_name || ''} ${req.body.head_grandfather_name || ''} ${head_family_name || ''}`.trim(),
      registered_date: new Date().toISOString(),
      last_updated: new Date().toISOString()
      // ⚠️  DISABLED: Vulnerability score fields removed
      // vulnerability_score: vulnerabilityScore,
      // vulnerability_priority: vulnerabilityPriority,
      // vulnerability_breakdown: vulnerabilityBreakdown
      // Note: created_at column doesn't exist in schema, using registered_date instead
    };

    // If user is not SYSTEM_ADMIN, ensure they can only add to their assigned camp
    if (req.user.role !== 'SYSTEM_ADMIN') {
      if (!familyData.camp_id || familyData.camp_id !== req.user.campId) {
        familyData.camp_id = req.user.campId;
      }
      // Also set current_housing_camp_id to ensure family is assigned to camp
      if (!familyData.current_housing_camp_id || familyData.current_housing_camp_id !== req.user.campId) {
        familyData.current_housing_camp_id = req.user.campId;
      }
    }

    const { data: family, error } = await supabase
      .from('families')
      .insert([familyData])
      .select()
      .single();

    if (error) {
      console.error('Family creation error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json(family);
  } catch (error) {
    console.error('Create family error:', error);
    next(error);
  }
});

// Update family
router.put('/:familyId', authenticateToken, async (req, res, next) => {
  try {
    const { familyId } = req.params;

    console.log('[Families API] Update request received:', {
      familyId,
      userId: req.user?.userId,
      role: req.user?.role,
      updateKeys: Object.keys(req.body),
      updateData: req.body
    });

    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Get the family to check camp association and ownership
    const { data: family, error: fetchError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', familyId)
      .single();

    if (fetchError || !family) {
      return res.status(404).json({ error: getMessage('families', 'familyNotFound', 'Family not found') });
    }

    // Verify user has access to this family
    if (req.user.role === 'SYSTEM_ADMIN') {
      // SYSTEM_ADMIN can update any family
    } else if (req.user.role === 'BENEFICIARY') {
      // BENEFICIARY can only update their own family
      if (req.user.familyId !== familyId) {
        return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'Access denied') });
      }
    } else {
      // CAMP_MANAGER and FIELD_OFFICER can only update families in their camp
      if (family.camp_id !== req.user.campId) {
        return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'Access denied') });
      }
    }

    // ⚠️  DISABLED: Vulnerability score calculation on update
    // let vulnerabilityScore = null;
    // let vulnerabilityBreakdown = null;
    // let vulnerabilityPriority = null;
    // Check if any vulnerability-related fields are being updated
    // const vulnerabilityFields = [
    //   // Family composition counts
    //   'child_count', 'senior_count', 'disabled_count', 'chronic_count', 'injured_count',
    //   'pregnant_women_count', 'orphan_count', 'displacement_count',
    //   // Head of family fields
    //   'head_of_family_age', 'head_of_family_date_of_birth',
    //   'head_of_family_disability_type', 'head_of_family_disability_severity', 'head_of_family_disability_details',
    //   'head_of_family_chronic_disease_type', 'head_of_family_chronic_disease_details',
    //   'head_of_family_war_injury_type', 'head_of_family_war_injury_details',
    //   'head_of_family_marital_status', 'head_of_family_widow_reason',
    //   'head_of_family_is_working', 'head_of_family_job',
    //   'head_of_family_monthly_income', 'head_of_family_monthly_income_range',
    //   'head_of_family_medical_followup_required', 'head_of_family_medical_followup_frequency',
    //   // Wife fields
    //   'wife_age', 'wife_date_of_birth',
    //   'wife_disability_type', 'wife_disability_severity', 'wife_disability_details',
    //   'wife_chronic_disease_type', 'wife_chronic_disease_details',
    //   'wife_war_injury_type', 'wife_war_injury_details',
    //   'wife_is_pregnant', 'wife_pregnancy_month', 'wife_pregnancy_special_needs',
    //   'wife_is_working', 'wife_occupation',
    //   'wife_medical_followup_required',
    //   // Husband fields (for female-headed households)
    //   'husband_age', 'husband_date_of_birth',
    //   'husband_disability_type', 'husband_disability_severity', 'husband_disability_details',
    //   'husband_chronic_disease_type', 'husband_chronic_disease_details',
    //   'husband_war_injury_type', 'husband_war_injury_details',
    //   'husband_is_working', 'husband_occupation',
    //   'husband_medical_followup_required',
    //   // Housing fields
    //   'current_housing_type', 'current_housing_is_suitable_for_family_size',
    //   'current_housing_sanitary_facilities', 'current_housing_water_source',
    //   'current_housing_electricity_access',
    //   'current_housing_detailed_type', 'current_housing_sharing_status',
    //   // Other vulnerability factors
    //   'vulnerability_reason'
    // ];
    // const hasVulnerabilityUpdates = vulnerabilityFields.some(field => req.body[field] !== undefined);
    // if (hasVulnerabilityUpdates) {
    //   try {
    //     const familyDataForCalculation = { ...family, ...req.body };
    //     const { calculateVulnerabilityScore } = require('../services/vulnerabilityService');
    //     const scoreResult = await calculateVulnerabilityScore(familyDataForCalculation);
    //     vulnerabilityScore = scoreResult.score;
    //     vulnerabilityBreakdown = scoreResult.breakdown;
    //     vulnerabilityPriority = scoreResult.priorityLevel;
    //     console.log('Vulnerability score recalculated:', vulnerabilityScore, 'Priority:', vulnerabilityPriority);
    //   } catch (scoreError) {
    //     console.error('Error recalculating vulnerability score:', scoreError.message);
    //     // Continue without failing the request
    //   }
    // }

    const updates = {
      ...req.body,
      last_updated: new Date().toISOString()
      // ⚠️  DISABLED: Vulnerability score updates removed
      // ...(vulnerabilityScore !== null && {
      //   vulnerability_score: vulnerabilityScore,
      //   vulnerability_priority: vulnerabilityPriority,
      //   vulnerability_breakdown: vulnerabilityBreakdown
      // })
    };

    // If updating 4-part names, recompute full name
    if (updates.head_first_name || updates.head_father_name || updates.head_grandfather_name || updates.head_family_name) {
      updates.head_of_family_name = `${updates.head_first_name || ''} ${updates.head_father_name || ''} ${updates.head_grandfather_name || ''} ${updates.head_family_name || ''}`.trim();
    }

    console.log('[Families API] Prepared updates:', updates);

    const { data: updatedFamily, error: updateError } = await supabase
      .from('families')
      .update(updates)
      .eq('id', familyId)
      .select()
      .single();

    if (updateError) {
      console.error('[Families API] Update error:', {
        error: updateError,
        message: updateError.message,
        details: updateError.details,
        hint: updateError.hint,
        code: updateError.code,
        constraint: updateError.constraint
      });
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    console.log('[Families API] Update successful:', updatedFamily);
    res.json(updatedFamily);
  } catch (error) {
    console.error('[Families API] Update family error:', error);
    next(error);
  }
});

// Delete family (admin only) - Soft Delete
router.delete('/:familyId', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { familyId } = req.params;

    // Get the family data before soft deleting
    const { data: family, error: fetchError } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();

    if (fetchError || !family) {
      return res.status(404).json({ error: getMessage('families', 'familyNotFound', 'Family not found') });
    }

    // Perform soft delete
    const { error: updateError } = await supabase
      .from('families')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      })
      .eq('id', familyId);

    if (updateError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    // Log the deletion to soft_deletes table
    try {
      await supabase.from('soft_deletes').insert({
        table_name: 'families',
        record_id: familyId,
        deleted_data: family,
        deleted_by_user_id: req.user.userId,
        deleted_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log soft delete to audit table:', logError);
      // Don't fail the delete if logging fails
    }

    res.status(200).json({ 
      message: getMessage('families', 'familyDeleted', 'تم حذف العائلة بنجاح'),
      familyId: familyId 
    });
  } catch (error) {
    console.error('Delete family error:', error);
    next(error);
  }
});

// Approve family (CAMP_MANAGER only for their camp)
router.put('/:familyId/approve', authenticateToken, authorizeRole(['CAMP_MANAGER', 'SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { familyId } = req.params;
    const { admin_notes } = req.body;

    // Get the family to check camp association
    const { data: family, error: fetchError } = await supabase
      .from('families')
      .select('camp_id, id')
      .eq('id', familyId)
      .single();

    if (fetchError || !family) {
      return res.status(404).json({ error: getMessage('families', 'familyNotFound', 'Family not found') });
    }

    // Check authorization - CAMP_MANAGER can only approve families in their camp
    if (req.user.role === 'CAMP_MANAGER' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('families', 'unauthorizedApprove', 'Unauthorized to approve this family') });
    }

    // Update family status to approved
    const { data: updatedFamily, error } = await supabase
      .from('families')
      .update({
        status: 'موافق',
        admin_notes: admin_notes || null,
        last_updated: new Date().toISOString()
      })
      .eq('id', familyId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({
      message: getMessage('families', 'familyApproved', 'تم قبول العائلة بنجاح'),
      family: updatedFamily
    });
  } catch (error) {
    console.error('Approve family error:', error);
    next(error);
  }
});

// Reject family (CAMP_MANAGER only for their camp)
router.put('/:familyId/reject', authenticateToken, authorizeRole(['CAMP_MANAGER', 'SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { familyId } = req.params;
    const { rejection_reason } = req.body;

    if (!rejection_reason || !rejection_reason.trim()) {
      return res.status(400).json({ error: getMessage('families', 'rejectionReasonRequired', 'سبب الرفض مطلوب') });
    }

    // Get the family to check camp association
    const { data: family, error: fetchError } = await supabase
      .from('families')
      .select('camp_id, id')
      .eq('id', familyId)
      .single();

    if (fetchError || !family) {
      return res.status(404).json({ error: getMessage('families', 'familyNotFound', 'Family not found') });
    }

    // Check authorization - CAMP_MANAGER can only reject families in their camp
    if (req.user.role === 'CAMP_MANAGER' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('families', 'unauthorizedReject', 'Unauthorized to reject this family') });
    }

    // Update family status to rejected
    const { data: updatedFamily, error } = await supabase
      .from('families')
      .update({
        status: 'مرفوض',
        admin_notes: rejection_reason,
        last_updated: new Date().toISOString()
      })
      .eq('id', familyId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({
      message: getMessage('families', 'familyRejected', 'تم رفض العائلة'),
      family: updatedFamily
    });
  } catch (error) {
    console.error('Reject family error:', error);
    next(error);
  }
});

// Get global family statistics (SYSTEM_ADMIN only)
router.get('/stats/global', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    console.log('=== GET GLOBAL FAMILY STATS ===');

    // Get total families and members (excluding deleted)
    const { count: totalFamilies } = await supabase.from('families').select('*', { count: 'exact', head: true }).eq('is_deleted', false);

    // Get families by status
    const { data: familiesByStatus } = await supabase
      .from('families')
      .select('status')
      .eq('is_deleted', false)
      .not('status', 'is', null);
    
    const byStatus = {
      pending: familiesByStatus?.filter(f => f.status === 'قيد الانتظار').length || 0,
      approved: familiesByStatus?.filter(f => f.status === 'موافق').length || 0,
      rejected: familiesByStatus?.filter(f => f.status === 'مرفوض').length || 0
    };
    
    // Get families by vulnerability priority
    const { data: familiesByVuln } = await supabase
      .from('families')
      .select('vulnerability_priority')
      .eq('is_deleted', false)
      .not('vulnerability_priority', 'is', null);
    
    const byVulnerability = {
      very_high: familiesByVuln?.filter(f => f.vulnerability_priority === 'عالي جداً').length || 0,
      high: familiesByVuln?.filter(f => f.vulnerability_priority === 'عالي').length || 0,
      medium: familiesByVuln?.filter(f => f.vulnerability_priority === 'متوسط').length || 0,
      low: familiesByVuln?.filter(f => f.vulnerability_priority === 'منخفض').length || 0
    };
    
    // Get average family size
    const { data: familySizes } = await supabase.from('families').select('total_members_count').eq('is_deleted', false);
    const avgFamilySize = familySizes && familySizes.length > 0
      ? Math.round(familySizes.reduce((sum, f) => sum + (f.total_members_count || 0), 0) / familySizes.length)
      : 0;

    // Get total members
    const totalMembers = familySizes?.reduce((sum, f) => sum + (f.total_members_count || 0), 0) || 0;

    // Get stats by camp
    const { data: camps } = await supabase.from('camps').select('id, name');
    const byCamp = await Promise.all(
      (camps || []).map(async (camp) => {
        const { count } = await supabase
          .from('families')
          .select('*', { count: 'exact', head: true })
          .eq('camp_id', camp.id)
          .eq('is_deleted', false);
        return {
          campId: camp.id,
          campName: camp.name,
          familyCount: count || 0
        };
      })
    );
    
    res.json({
      totalFamilies: totalFamilies || 0,
      totalMembers,
      byStatus,
      byVulnerability,
      byCamp,
      avgFamilySize
    });
  } catch (error) {
    console.error('Get global stats error:', error);
    next(error);
  }
});

// Get per-camp family statistics (SYSTEM_ADMIN only)
router.get('/camp/:campId/stats', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { campId } = req.params;
    console.log('=== GET CAMP FAMILY STATS ===');
    console.log('Camp ID:', campId);

    // Get camp info
    const { data: camp } = await supabase
      .from('camps')
      .select('id, name')
      .eq('id', campId)
      .single();

    if (!camp) {
      return res.status(404).json({ error: 'المخيم غير موجود' });
    }

    // Get total families (excluding deleted)
    const { count: totalFamilies } = await supabase
      .from('families')
      .select('*', { count: 'exact', head: true })
      .eq('camp_id', campId)
      .eq('is_deleted', false);

    // Get families by status
    const { data: familiesByStatus } = await supabase
      .from('families')
      .select('status')
      .eq('camp_id', campId)
      .eq('is_deleted', false);
    
    const byStatus = {
      pending: familiesByStatus?.filter(f => f.status === 'قيد الانتظار').length || 0,
      approved: familiesByStatus?.filter(f => f.status === 'موافق').length || 0,
      rejected: familiesByStatus?.filter(f => f.status === 'مرفوض').length || 0
    };
    
    // Get families by vulnerability
    const { data: familiesByVuln } = await supabase
      .from('families')
      .select('vulnerability_priority')
      .eq('camp_id', campId)
      .eq('is_deleted', false);

    const byVulnerability = {
      very_high: familiesByVuln?.filter(f => f.vulnerability_priority === 'عالي جداً').length || 0,
      high: familiesByVuln?.filter(f => f.vulnerability_priority === 'عالي').length || 0,
      medium: familiesByVuln?.filter(f => f.vulnerability_priority === 'متوسط').length || 0,
      low: familiesByVuln?.filter(f => f.vulnerability_priority === 'منخفض').length || 0
    };

    // Get average family size
    const { data: familySizes } = await supabase.from('families').select('total_members_count').eq('camp_id', campId).eq('is_deleted', false);
    const avgFamilySize = familySizes && familySizes.length > 0
      ? Math.round(familySizes.reduce((sum, f) => sum + (f.total_members_count || 0), 0) / familySizes.length)
      : 0;
    
    // Get total members
    const totalMembers = familySizes?.reduce((sum, f) => sum + (f.total_members_count || 0), 0) || 0;
    
    res.json({
      campId: camp.id,
      campName: camp.name,
      totalFamilies: totalFamilies || 0,
      totalMembers,
      byStatus,
      byVulnerability,
      avgFamilySize
    });
  } catch (error) {
    console.error('Get camp stats error:', error);
    next(error);
  }
});

// Transfer family to another camp (SYSTEM_ADMIN only)
router.post('/:familyId/transfer', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { familyId } = req.params;
    const { targetCampId, reason, adminNotes } = req.body;
    
    console.log('=== TRANSFER FAMILY ===');
    console.log('Family ID:', familyId);
    console.log('Target Camp ID:', targetCampId);
    console.log('Reason:', reason);
    
    if (!targetCampId) {
      return res.status(400).json({ error: 'الرجاء تحديد المخيم الهدف' });
    }
    
    // Verify target camp exists
    const { data: targetCamp } = await supabase
      .from('camps')
      .select('id, name')
      .eq('id', targetCampId)
      .single();
    
    if (!targetCamp) {
      return res.status(404).json({ error: 'المخيم الهدف غير موجود' });
    }
    
    // Get current family data
    const { data: currentFamily } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
    
    if (!currentFamily) {
      return res.status(404).json({ error: 'العائلة غير موجودة' });
    }
    
    // Update family with new camp
    const updateData = {
      camp_id: targetCampId,
      current_housing_camp_id: targetCampId,
      admin_notes: adminNotes || currentFamily.admin_notes,
      last_updated: new Date().toISOString()
    };
    
    const { data: updatedFamily, error } = await supabase
      .from('families')
      .update(updateData)
      .eq('id', familyId)
      .select()
      .single();
    
    if (error) {
      console.error('Transfer error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }
    
    // Create audit log entry
    try {
      await supabase.from('audit_logs').insert({
        action: 'family_transferred',
        entity_type: 'family',
        entity_id: familyId,
        user_id: req.user.userId,
        details: {
          familyName: currentFamily.head_of_family_name,
          fromCamp: currentFamily.camp_id,
          toCamp: targetCampId,
          toCampName: targetCamp.name,
          reason: reason || 'نقل من قبل الإدارة المركزية'
        }
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the transfer if audit log fails
    }
    
    res.json({
      message: 'تم نقل العائلة بنجاح',
      family: updatedFamily,
      targetCamp: targetCamp.name
    });
  } catch (error) {
    console.error('Transfer family error:', error);
    next(error);
  }
});

// Override family decision (SYSTEM_ADMIN only)
router.post('/:familyId/override-decision', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { familyId } = req.params;
    const { newStatus, reason, adminNotes } = req.body;
    
    console.log('=== OVERRIDE FAMILY DECISION ===');
    console.log('Family ID:', familyId);
    console.log('New Status:', newStatus);
    console.log('Reason:', reason);
    
    // Validate status is in Arabic
    const validStatuses = ['قيد الانتظار', 'موافق', 'مرفوض'];
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'الحالة غير صحيحة. يجب أن تكون: قيد الانتظار، موافق، أو مرفوض' });
    }
    
    // Get current family data
    const { data: currentFamily } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .single();
    
    if (!currentFamily) {
      return res.status(404).json({ error: 'العائلة غير موجودة' });
    }
    
    // Update family status
    const updateData = {
      status: newStatus,
      admin_notes: adminNotes || currentFamily.admin_notes,
      last_updated: new Date().toISOString()
    };
    
    const { data: updatedFamily, error } = await supabase
      .from('families')
      .update(updateData)
      .eq('id', familyId)
      .select()
      .single();
    
    if (error) {
      console.error('Override error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }
    
    // Create audit log entry
    try {
      await supabase.from('audit_logs').insert({
        action: 'family_decision_overridden',
        entity_type: 'family',
        entity_id: familyId,
        user_id: req.user.userId,
        details: {
          familyName: currentFamily.head_of_family_name,
          previousStatus: currentFamily.status,
          newStatus: newStatus,
          reason: reason || 'قرار من الإدارة المركزية'
        }
      });
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
      // Don't fail the override if audit log fails
    }

    res.json({
      message: 'تم تغيير حالة العائلة بنجاح',
      family: updatedFamily,
      previousStatus: currentFamily.status,
      newStatus: newStatus
    });
  } catch (error) {
    console.error('Override family decision error:', error);
    next(error);
  }
});

// ============================================================================
// FIELD PERMISSIONS ROUTES
// ============================================================================

/**
 * GET /api/families/:familyId/field-permissions
 * Get field permissions for a family
 */
router.get('/:familyId/field-permissions', authenticateToken, async (req, res, next) => {
  try {
    const { familyId } = req.params;

    // BENEFICIARY can only read their own family's permissions
    if (req.user.role === 'BENEFICIARY') {
      // Verify the beneficiary is requesting their own family
      if (req.user.familyId !== familyId) {
        return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'ليس لديك صلاحية الوصول لهذه العائلة') });
      }
      // BENEFICIARY can read their own permissions
    } else if (['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'].includes(req.user.role)) {
      // Staff roles need camp association check
      // Get the family to check camp association
      const { data: family, error: fetchError } = await supabase
        .from('families')
        .select('camp_id')
        .eq('id', familyId)
        .single();

      if (fetchError || !family) {
        return res.status(404).json({ error: getMessage('families', 'familyNotFound', 'العائلة غير موجودة') });
      }

      // Verify user has access to this family's camp
      if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
        return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'ليس لديك صلاحية الوصول لهذه العائلة') });
      }
    } else {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'صلاحيات غير كافية') });
    }

    // Get field permissions
    const { data: permissions, error } = await supabase
      .from('family_field_permissions')
      .select('field_name, is_editable, updated_at')
      .eq('family_id', familyId);

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(permissions || []);
  } catch (error) {
    console.error('Get field permissions error:', error);
    next(error);
  }
});

/**
 * PUT /api/families/:familyId/field-permissions
 * Update a single field permission
 */
router.put('/:familyId/field-permissions', authenticateToken, authorizeRole(['SYSTEM_ADMIN', 'CAMP_MANAGER']), async (req, res, next) => {
  try {
    const { familyId } = req.params;
    const { field_name, is_editable } = req.body;

    if (!field_name) {
      return res.status(400).json({ error: 'اسم الحقل مطلوب' });
    }

    if (typeof is_editable !== 'boolean') {
      return res.status(400).json({ error: 'يجب تحديد قيمة is_editable (true/false)' });
    }

    // Get the family to check camp association
    const { data: family, error: fetchError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', familyId)
      .single();

    if (fetchError || !family) {
      return res.status(404).json({ error: getMessage('families', 'familyNotFound', 'العائلة غير موجودة') });
    }

    // Verify user has access to this family's camp
    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'ليس لديك صلاحية الوصول لهذه العائلة') });
    }

    // Validate field name (whitelist approach)
    const validFields = [
      // Basic info
      'head_first_name', 'head_father_name', 'head_grandfather_name', 'head_family_name',
      'head_of_family_national_id', 'head_of_family_gender', 'head_of_family_date_of_birth',
      'head_of_family_marital_status', 'head_of_family_widow_reason', 'head_of_family_role',
      // Contact
      'head_of_family_phone_number', 'head_of_family_phone_secondary',
      // Work & Income
      'head_of_family_is_working', 'head_of_family_job', 'head_of_family_monthly_income', 'head_of_family_monthly_income_range',
      // Spouse Basic Info (gender-neutral, uses wife_* and husband_* fields in database)
      'wife_name', 'wife_national_id', 'wife_date_of_birth',
      'husband_name', 'husband_national_id', 'husband_date_of_birth',
      // Spouse Work
      'wife_is_working', 'wife_occupation',
      'husband_is_working', 'husband_occupation',
      // Health - Head
      'head_of_family_disability_type', 'head_of_family_disability_severity', 'head_of_family_disability_details',
      'head_of_family_chronic_disease_type', 'head_of_family_chronic_disease_details',
      'head_of_family_war_injury_type', 'head_of_family_war_injury_details',
      'head_of_family_medical_followup_required', 'head_of_family_medical_followup_frequency', 'head_of_family_medical_followup_details',
      // Health - Spouse (Wife + Pregnancy - gender-neutral labels)
      'wife_disability_type', 'wife_disability_severity', 'wife_disability_details',
      'wife_chronic_disease_type', 'wife_chronic_disease_details',
      'wife_war_injury_type', 'wife_war_injury_details',
      'wife_medical_followup_required', 'wife_medical_followup_frequency', 'wife_medical_followup_details',
      'wife_is_pregnant', 'wife_pregnancy_month', 'wife_pregnancy_special_needs', 'wife_pregnancy_followup_details',
      // Health - Husband
      'husband_disability_type', 'husband_disability_severity', 'husband_disability_details',
      'husband_chronic_disease_type', 'husband_chronic_disease_details',
      'husband_war_injury_type', 'husband_war_injury_details',
      'husband_medical_followup_required', 'husband_medical_followup_frequency', 'husband_medical_followup_details',
      // Housing - Current
      'current_housing_type', 'current_housing_detailed_type', 'current_housing_governorate', 'current_housing_region',
      'current_housing_landmark', 'current_housing_unit_number', 'current_housing_is_suitable_for_family_size',
      'current_housing_sanitary_facilities', 'current_housing_water_source', 'current_housing_electricity_access',
      'current_housing_sharing_status', 'current_housing_furnished',
      // Housing - Original
      'original_address_governorate', 'original_address_region', 'original_address_details', 'original_address_housing_type',
      // Refugee Abroad
      'is_resident_abroad', 'refugee_resident_abroad_country', 'refugee_resident_abroad_city', 'refugee_resident_abroad_residence_type',
      // Documents
      'id_card_url', 'medical_report_url', 'signature_url',
      // Family Members
      'family_members'
    ];

    if (!validFields.includes(field_name)) {
      return res.status(400).json({ error: `اسم الحقل "${field_name}" غير صالح` });
    }

    // Upsert the permission
    const { data: permission, error: upsertError } = await supabase
      .from('family_field_permissions')
      .upsert({
        family_id: familyId,
        field_name,
        is_editable,
        updated_by: req.user.id, // Use req.user.id instead of userId
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (upsertError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(upsertError) });
    }

    res.json(permission);
  } catch (error) {
    console.error('Update field permission error:', error);
    next(error);
  }
});

/**
 * POST /api/families/:familyId/field-permissions/bulk
 * Bulk update multiple field permissions
 */
router.post('/:familyId/field-permissions/bulk', authenticateToken, authorizeRole(['SYSTEM_ADMIN', 'CAMP_MANAGER']), async (req, res, next) => {
  try {
    const { familyId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ error: 'يجب أن تكون الصلاحيات على شكل مصفوفة' });
    }

    // Get the family to check camp association
    const { data: family, error: fetchError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', familyId)
      .single();

    if (fetchError || !family) {
      return res.status(404).json({ error: getMessage('families', 'familyNotFound', 'العائلة غير موجودة') });
    }

    // Verify user has access to this family's camp
    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('auth', 'accessDenied', 'ليس لديك صلاحية الوصول لهذه العائلة') });
    }

    // Validate all field names
    const validFields = [
      // Basic info
      'head_first_name', 'head_father_name', 'head_grandfather_name', 'head_family_name',
      'head_of_family_national_id', 'head_of_family_gender', 'head_of_family_date_of_birth',
      'head_of_family_marital_status', 'head_of_family_widow_reason', 'head_of_family_role',
      // Contact
      'head_of_family_phone_number', 'head_of_family_phone_secondary',
      // Work & Income
      'head_of_family_is_working', 'head_of_family_job', 'head_of_family_monthly_income', 'head_of_family_monthly_income_range',
      // Spouse Basic Info (gender-neutral, uses wife_* and husband_* fields in database)
      'wife_name', 'wife_national_id', 'wife_date_of_birth',
      'husband_name', 'husband_national_id', 'husband_date_of_birth',
      // Spouse Work
      'wife_is_working', 'wife_occupation',
      'husband_is_working', 'husband_occupation',
      // Health - Head
      'head_of_family_disability_type', 'head_of_family_disability_severity', 'head_of_family_disability_details',
      'head_of_family_chronic_disease_type', 'head_of_family_chronic_disease_details',
      'head_of_family_war_injury_type', 'head_of_family_war_injury_details',
      'head_of_family_medical_followup_required', 'head_of_family_medical_followup_frequency', 'head_of_family_medical_followup_details',
      // Health - Spouse (Wife + Pregnancy - gender-neutral labels)
      'wife_disability_type', 'wife_disability_severity', 'wife_disability_details',
      'wife_chronic_disease_type', 'wife_chronic_disease_details',
      'wife_war_injury_type', 'wife_war_injury_details',
      'wife_medical_followup_required', 'wife_medical_followup_frequency', 'wife_medical_followup_details',
      'wife_is_pregnant', 'wife_pregnancy_month', 'wife_pregnancy_special_needs', 'wife_pregnancy_followup_details',
      // Health - Husband
      'husband_disability_type', 'husband_disability_severity', 'husband_disability_details',
      'husband_chronic_disease_type', 'husband_chronic_disease_details',
      'husband_war_injury_type', 'husband_war_injury_details',
      'husband_medical_followup_required', 'husband_medical_followup_frequency', 'husband_medical_followup_details',
      // Housing - Current
      'current_housing_type', 'current_housing_detailed_type', 'current_housing_governorate', 'current_housing_region',
      'current_housing_landmark', 'current_housing_unit_number', 'current_housing_is_suitable_for_family_size',
      'current_housing_sanitary_facilities', 'current_housing_water_source', 'current_housing_electricity_access',
      'current_housing_sharing_status', 'current_housing_furnished',
      // Housing - Original
      'original_address_governorate', 'original_address_region', 'original_address_details', 'original_address_housing_type',
      // Refugee Abroad
      'is_resident_abroad', 'refugee_resident_abroad_country', 'refugee_resident_abroad_city', 'refugee_resident_abroad_residence_type',
      // Documents
      'id_card_url', 'medical_report_url', 'signature_url',
      // Family Members
      'family_members'
    ];

    // Validate each permission
    for (const perm of permissions) {
      if (!perm.field_name) {
        return res.status(400).json({ error: 'كل صلاحية يجب أن تحتوي على field_name' });
      }
      if (typeof perm.is_editable !== 'boolean') {
        return res.status(400).json({ error: `is_editable يجب أن تكون boolean للحقل "${perm.field_name}"` });
      }
      if (!validFields.includes(perm.field_name)) {
        return res.status(400).json({ error: `اسم الحقل "${perm.field_name}" غير صالح` });
      }
    }

    // Bulk upsert
    const upsertData = permissions.map(perm => ({
      family_id: familyId,
      field_name: perm.field_name,
      is_editable: perm.is_editable,
      updated_by: req.user.id, // Use req.user.id instead of userId
      updated_at: new Date().toISOString()
    }));

    const { data: result, error: upsertError } = await supabase
      .from('family_field_permissions')
      .upsert(upsertData, { onConflict: 'family_id,field_name' })
      .select();

    if (upsertError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(upsertError) });
    }

    res.json({
      message: 'تم تحديث الصلاحيات بنجاح',
      permissions: result
    });
  } catch (error) {
    console.error('Bulk update field permissions error:', error);
    next(error);
  }
});

module.exports = { familyRoutes: router };
