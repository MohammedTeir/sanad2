// backend/routes/aid.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

// Get aid types for current camp (CAMP_MANAGER) or all types (SYSTEM_ADMIN)
router.get('/types', authenticateToken, async (req, res, next) => {
  try {
    // Check if user wants to include deleted/inactive records (admin only)
    const { includeDeleted } = req.query;
    const showDeleted = includeDeleted === 'true' && req.user.role === 'SYSTEM_ADMIN';

    let query;

    if (req.user.role === 'CAMP_MANAGER' || req.user.role === 'FIELD_OFFICER') {
      // Both CAMP_MANAGER and FIELD_OFFICER can see aid types in their camp
      if (!req.user.campId) {
        return res.status(400).json({ error: getMessage('aid', 'campIdNotFound', 'Camp ID not found in token') });
      }

      query = supabase
        .from('aids')
        .select('*')
        .eq('camp_id', req.user.campId)
        .eq('is_active', true);

      // Note: is_deleted column may not exist in older databases - skip this filter if column doesn't exist
      // if (!showDeleted) {
      //   query = query.eq('is_deleted', false);
      // }

      const { data: aids, error } = await query.order('name', { ascending: true });

      if (error) {
        return res.status(500).json({ error: getDatabaseErrorMessage(error) });
      }

      res.json(aids || []);
    } else if (req.user.role === 'SYSTEM_ADMIN') {
      // SYSTEM_ADMIN can see all aid types
      query = supabase
        .from('aids')
        .select('*')
        .eq('is_active', true);

      // Note: is_deleted column may not exist in older databases - skip this filter if column doesn't exist
      // if (!showDeleted) {
      //   query = query.eq('is_deleted', false);
      // }

      const { data: aids, error } = await query.order('name', { ascending: true });

      if (error) {
        return res.status(500).json({ error: getDatabaseErrorMessage(error) });
      }

      res.json(aids || []);
    } else {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }
  } catch (error) {
    console.error('Get aids error:', error);
    next(error);
  }
});

// Create aid type (CAMP_MANAGER for their camp, SYSTEM_ADMIN for global)
router.post('/types', authenticateToken, async (req, res, next) => {
  try {
    const { name, category, description, unit, is_active, isActive } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: getMessage('aid', 'nameRequired', 'Name is required') });
    }

    if (!category) {
      return res.status(400).json({ error: getMessage('aid', 'categoryRequired', 'Category is required') });
    }

    if (!unit) {
      return res.status(400).json({ error: getMessage('aid', 'unitRequired', 'Unit is required') });
    }

    // Determine camp_id based on user role
    let campId = null;
    if (req.user.role === 'CAMP_MANAGER') {
      if (!req.user.campId) {
        return res.status(400).json({ error: getMessage('aid', 'campIdNotFound', 'Camp ID not found in token') });
      }
      campId = req.user.campId;
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('aid', 'insufficientPermissionsCreateAidTypes', 'Insufficient permissions to create aid types') });
    }

    // Prepare data
    const aidData = {
      name: name,
      category: category,
      unit: unit,
      description: description || null,
      is_active: is_active !== undefined ? is_active : (isActive !== undefined ? isActive : true),
      camp_id: campId
    };

    // Insert the new aid type
    const { data: newAid, error: insertError } = await supabase
      .from('aids')
      .insert([aidData])
      .select()
      .single();

    if (insertError) {
      console.error('Create aid type error:', insertError);
      return res.status(500).json({ error: getDatabaseErrorMessage(insertError) });
    }

    res.status(201).json(newAid);
  } catch (error) {
    console.error('Create aid type error:', error);
    next(error);
  }
});

// Update aid type
router.put('/types/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, category, description, unit, is_active, isActive } = req.body;

    // Check if aid type exists and user has permission
    const { data: existingAid, error: fetchError } = await supabase
      .from('aids')
      .select('camp_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingAid) {
      return res.status(404).json({ error: getMessage('aid', 'aidTypeNotFound', 'Aid type not found') });
    }

    // Check authorization
    if (req.user.role === 'CAMP_MANAGER') {
      if (!req.user.campId || existingAid.camp_id !== req.user.campId) {
        return res.status(403).json({ error: getMessage('aid', 'unauthorizedUpdateAidType', 'Unauthorized to update this aid type') });
      }
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Prepare updates
    const updates = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (description !== undefined) updates.description = description;
    if (unit !== undefined) updates.unit = unit;
    if (is_active !== undefined || isActive !== undefined) {
      updates.is_active = is_active !== undefined ? is_active : isActive;
    }

    // Update the aid type
    const { data: updatedAid, error: updateError } = await supabase
      .from('aids')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update aid type error:', updateError);
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    res.json(updatedAid);
  } catch (error) {
    console.error('Update aid type error:', error);
    next(error);
  }
});

// Delete aid type - Soft Delete
router.delete('/types/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if aid type exists and user has permission
    const { data: existingAid, error: fetchError } = await supabase
      .from('aids')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingAid) {
      return res.status(404).json({ error: getMessage('aid', 'aidTypeNotFound', 'Aid type not found') });
    }

    // Check authorization
    if (req.user.role === 'CAMP_MANAGER') {
      if (!req.user.campId || existingAid.camp_id !== req.user.campId) {
        return res.status(403).json({ error: getMessage('aid', 'unauthorizedDeleteAidType', 'Unauthorized to delete this aid type') });
      }
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Perform soft delete (set is_active to false and mark as deleted)
    const { error: updateError } = await supabase
      .from('aids')
      .update({
        is_active: false,
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Delete aid type error:', updateError);
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    // Log the deletion to soft_deletes table
    try {
      await supabase.from('soft_deletes').insert({
        table_name: 'aids',
        record_id: id,
        deleted_data: existingAid,
        deleted_by_user_id: req.user.userId,
        deleted_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log soft delete to audit table:', logError);
      // Don't fail the delete if logging fails
    }

    res.status(200).json({ 
      message: getMessage('aid', 'aidTypeDeleted', 'تم حذف نوع المساعدة بنجاح'),
      aidId: id 
    });
  } catch (error) {
    console.error('Delete aid type error:', error);
    next(error);
  }
});

// Get all aid distributions
router.get('/distributions', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'distributions', 'read'), async (req, res, next) => {
  try {
    const { includeDeleted } = req.query;
    
    let query = supabase.from('aid_distributions').select(`
      *,
      families!inner (
        head_of_family_name,
        camp_id
      )
    `);

    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER') {
      query = query.eq('families.camp_id', req.user.campId);
    } else if (req.user.role === 'FIELD_OFFICER') {
      query = query.eq('families.camp_id', req.user.campId);
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // By default, exclude soft-deleted records unless includeDeleted=true (admin only)
    const showDeleted = includeDeleted === 'true' && req.user.role === 'SYSTEM_ADMIN';
    if (!showDeleted) {
      query = query.eq('is_deleted', false).is('deleted_at', null);
    }

    const { data: distributions, error } = await query.order('distribution_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Format the response to remove nested families object
    const formattedDistributions = distributions.map(dist => ({
      id: dist.id,
      family_id: dist.family_id,
      campaign_id: dist.campaign_id,
      aid_type: dist.aid_type,
      aid_category: dist.aid_category,
      quantity: dist.quantity,
      distribution_date: dist.distribution_date,
      distributed_by_user_id: dist.distributed_by_user_id,
      notes: dist.notes,
      received_by_signature: dist.received_by_signature,
      received_by_biometric: dist.received_by_biometric,
      received_by_photo_url: dist.received_by_photo_url,
      otp_code: dist.otp_code,
      duplicate_check_passed: dist.duplicate_check_passed,
      status: dist.status,
      created_at: dist.created_at,
      updated_at: dist.updated_at,
      family_name: dist.families?.head_of_family_name
    }));

    res.json(formattedDistributions);
  } catch (error) {
    console.error('Get aid distributions error:', error);
    next(error);
  }
});

// Get aid distributions by camp ID
router.get('/distributions/camp/:campId', authenticateToken, async (req, res, next) => {
  try {
    const { campId, includeDeleted } = req.params;
    const showDeleted = req.query.includeDeleted === 'true' && req.user.role === 'SYSTEM_ADMIN';

    // Check authorization: CAMP_MANAGER can only access their own camp
    if (req.user.role === 'CAMP_MANAGER' && req.user.campId !== campId) {
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    // FIELD_OFFICER can only access their own camp
    if (req.user.role === 'FIELD_OFFICER' && req.user.campId !== campId) {
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    // Only SYSTEM_ADMIN, CAMP_MANAGER, or FIELD_OFFICER can access
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    let query = supabase
      .from('aid_distributions')
      .select(`
        *,
        families!inner (
          head_of_family_name,
          total_members_count
        ),
        aid_campaigns!inner (
          name,
          aid_type,
          aid_category
        )
      `)
      .eq('families.camp_id', campId)
      .order('distribution_date', { ascending: false });

    // By default, exclude soft-deleted records unless includeDeleted=true (admin only)
    if (!showDeleted) {
      query = query.eq('is_deleted', false).is('deleted_at', null);
    }

    const { data: distributions, error } = await query;

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Format the response to include family name and campaign details
    const formattedDistributions = distributions.map(dist => ({
      id: dist.id,
      family_id: dist.family_id,
      family_name: dist.families?.head_of_family_name || 'غير معروف',
      family_size: dist.families?.total_members_count || 0,
      campaign_id: dist.campaign_id,
      campaign_name: dist.aid_campaigns?.name || 'غير معروف',
      aid_type: dist.aid_type || dist.aid_campaigns?.aid_type,
      aid_category: dist.aid_category || dist.aid_campaigns?.aid_category,
      quantity: dist.quantity,
      distribution_date: dist.distribution_date,
      distributed_by_user_id: dist.distributed_by_user_id,
      notes: dist.notes,
      received_by_signature: dist.received_by_signature,
      otp_code: dist.otp_code,
      status: dist.status,
      created_at: dist.created_at,
      updated_at: dist.updated_at
    }));

    res.json(formattedDistributions);
  } catch (error) {
    console.error('Get aid distributions by camp error:', error);
    next(error);
  }
});

// Get aid distributions by family ID
router.get('/distributions/family/:familyId', authenticateToken, async (req, res, next) => {
  try {
    const { familyId } = req.params;

    // Check authorization
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', familyId)
      .single();

    if (familyError || !family) {
      return res.status(404).json({ error: getMessage('aid', 'familyNotFound', 'Family not found') });
    }

    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    const { data: distributions, error } = await supabase
      .from('aid_distributions')
      .select('*')
      .eq('family_id', familyId)
      .order('distribution_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(distributions);
  } catch (error) {
    console.error('Get aid distributions by family error:', error);
    next(error);
  }
});

// Get aid distributions by campaign ID
router.get('/distributions/campaign/:campaignId', authenticateToken, async (req, res, next) => {
  try {
    const { campaignId } = req.params;

    // Check authorization for the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('aid_campaigns')
      .select('coordinator_user_id, camp_id')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      return res.status(404).json({ error: getMessage('aid', 'campaignNotFound', 'Campaign not found') });
    }

    // Check authorization: SYSTEM_ADMIN, campaign coordinator, or CAMP_MANAGER/FIELD_OFFICER of the campaign's camp
    const isSystemAdmin = req.user.role === 'SYSTEM_ADMIN';
    const isCoordinator = req.user.userId === campaign.coordinator_user_id;
    const isCampManager = req.user.role === 'CAMP_MANAGER' && req.user.campId === campaign.camp_id;
    const isFieldOfficer = req.user.role === 'FIELD_OFFICER' && req.user.campId === campaign.camp_id;

    if (!isSystemAdmin && !isCoordinator && !isCampManager && !isFieldOfficer) {
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    const { data: distributions, error } = await supabase
      .from('aid_distributions')
      .select(`
        *,
        families!inner (
          head_of_family_name,
          total_members_count
        )
      `)
      .eq('campaign_id', campaignId)
      .eq('is_deleted', false) // Filter out soft-deleted (undone) distributions
      .order('distribution_date', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Format the response to include family name
    const formattedDistributions = distributions.map(dist => ({
      id: dist.id,
      family_id: dist.family_id,
      family_name: dist.families?.head_of_family_name || 'غير معروف',
      family_size: dist.families?.total_members_count || 0,
      campaign_id: dist.campaign_id,
      aid_type: dist.aid_type,
      aid_category: dist.aid_category,
      quantity: dist.quantity,
      distribution_date: dist.distribution_date,
      distributed_by_user_id: dist.distributed_by_user_id,
      notes: dist.notes,
      received_by_signature: dist.received_by_signature,
      otp_code: dist.otp_code,
      status: dist.status,
      created_at: dist.created_at,
      updated_at: dist.updated_at
    }));

    res.json(formattedDistributions);
  } catch (error) {
    console.error('Get aid distributions by campaign error:', error);
    next(error);
  }
});

// Get single aid distribution by ID
router.get('/distributions/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get the distribution
    const { data: distribution, error } = await supabase
      .from('aid_distributions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !distribution) {
      return res.status(404).json({ error: getMessage('aid', 'distributionNotFound', 'Distribution not found') });
    }

    // Verify user has access to the family's camp
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', distribution.family_id)
      .single();

    if (familyError || !family) {
      return res.status(404).json({ error: getMessage('aid', 'familyNotFound', 'Family not found') });
    }

    // Check authorization
    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    res.json(distribution);
  } catch (error) {
    console.error('Get aid distribution by ID error:', error);
    next(error);
  }
});

// Create new aid distribution
router.post('/distributions', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'distributions', 'create'), async (req, res, next) => {
  try {
    // Check authorization (already enforced by authorizeResourceAction)
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Normalize and validate distribution data before inserting
    const distributionData = {
      ...req.body,
      distributed_by_user_id: req.user.userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Data type normalization for database compatibility
    // Fix: Convert received_by_signature from boolean/string to TEXT ('نعم'/'لا')
    if (typeof distributionData.received_by_signature === 'boolean') {
      distributionData.received_by_signature = distributionData.received_by_signature ? 'نعم' : 'لا';
    }

    // Fix: Keep distribution_date as full ISO timestamp to preserve time component
    // This ensures the inventory transaction ledger shows the correct timestamp
    if (distributionData.distribution_date) {
      const dateObj = new Date(distributionData.distribution_date);
      if (!isNaN(dateObj.getTime())) {
        // Keep as full ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
        distributionData.distribution_date = dateObj.toISOString();
      }
    }

    // Log the normalized data for debugging
    console.log('[Distribution] Normalized distribution data:', {
      ...distributionData,
      received_by_signature: distributionData.received_by_signature,
      distribution_date: distributionData.distribution_date
    });

    // Verify user has access to the family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', distributionData.family_id)
      .single();

    if (familyError || !family) {
      return res.status(404).json({ error: getMessage('aid', 'familyNotFound', 'Family not found') });
    }

    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    // Get the campaign to find the inventory item
    const { data: campaign, error: campaignError } = await supabase
      .from('aid_campaigns')
      .select('inventory_item_id, name')
      .eq('id', distributionData.campaign_id)
      .single();

    if (campaignError) {
      console.error('Error fetching campaign:', campaignError);
    }

    const { data: distribution, error } = await supabase
      .from('aid_distributions')
      .insert([distributionData])
      .select()
      .single();

    if (error) {
      console.error('[Distribution] Database insert error:', error);
      console.error('[Distribution] Error details:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Note: Inventory transaction is now handled automatically by database trigger
    // (update_inventory_trigger on aid_distributions table)
    // No need to create inventory transaction manually - it would cause double updates

    res.status(201).json(distribution);
  } catch (error) {
    console.error('Create aid distribution error:', error);
    next(error);
  }
});

// Update aid distribution (e.g., cancel/soft delete)
router.put('/distributions/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, otp_code, received_by_signature } = req.body;

    // Check if distribution exists
    const { data: existingDistribution, error: fetchError } = await supabase
      .from('aid_distributions')
      .select('family_id, campaign_id')
      .eq('id', id)
      .single();

    if (fetchError || !existingDistribution) {
      return res.status(404).json({ error: getMessage('aid', 'distributionNotFound', 'Distribution not found') });
    }

    // Verify user has access to the family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', existingDistribution.family_id)
      .single();

    if (familyError || !family) {
      return res.status(404).json({ error: getMessage('aid', 'familyNotFound', 'Family not found') });
    }

    // Check authorization
    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    // Prepare updates
    const updates = {
      updated_at: new Date().toISOString()
    };

    if (status !== undefined) updates.status = status;
    if (notes !== undefined) updates.notes = notes;
    if (otp_code !== undefined) updates.otp_code = otp_code;
    if (received_by_signature !== undefined) updates.received_by_signature = received_by_signature;

    // Update the distribution
    const { data: updatedDistribution, error: updateError } = await supabase
      .from('aid_distributions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Update distribution error:', updateError);
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    res.json(updatedDistribution);
  } catch (error) {
    console.error('Update aid distribution error:', error);
    next(error);
  }
});

// Delete aid distribution (Soft Delete)
router.delete('/distributions/:id', authenticateToken, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if distribution exists (get full record including campaign_id and quantity)
    const { data: existingDistribution, error: fetchError } = await supabase
      .from('aid_distributions')
      .select('family_id, campaign_id, quantity, notes, distributed_by_user_id, distribution_date')
      .eq('id', id)
      .single();

    if (fetchError || !existingDistribution) {
      return res.status(404).json({ error: getMessage('aid', 'distributionNotFound', 'Distribution not found') });
    }

    // Verify user has access to the family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .select('camp_id')
      .eq('id', existingDistribution.family_id)
      .single();

    if (familyError || !family) {
      return res.status(404).json({ error: getMessage('aid', 'familyNotFound', 'Family not found') });
    }

    // Check authorization
    if (req.user.role !== 'SYSTEM_ADMIN' && family.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    // Get the campaign to find the inventory item
    const { data: campaign, error: campaignError } = await supabase
      .from('aid_campaigns')
      .select('inventory_item_id, name')
      .eq('id', existingDistribution.campaign_id)
      .single();

    if (campaignError) {
      console.error('Error fetching campaign:', campaignError);
    }

    // Perform soft delete
    const { error: updateError } = await supabase
      .from('aid_distributions')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        deleted_by: req.user.userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      console.error('Delete distribution error:', updateError);
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    // Note: Inventory restoration is now handled automatically by database trigger
    // (update_inventory_trigger on aid_distributions table)
    // No need to create inventory transaction manually - it would cause double updates

    // Log the deletion to soft_deletes table
    try {
      await supabase.from('soft_deletes').insert({
        table_name: 'aid_distributions',
        record_id: id,
        deleted_data: existingDistribution,
        deleted_by_user_id: req.user.userId,
        deleted_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log soft delete to audit table:', logError);
      // Don't fail the delete if logging fails
    }

    res.status(200).json({
      message: getMessage('aid', 'distributionDeleted', 'تم حذف التوزيع بنجاح'),
      distributionId: id
    });
  } catch (error) {
    console.error('Delete aid distribution error:', error);
    next(error);
  }
});

// Helper function to format campaign data
const formatCampaign = (campaign) => ({
  id: campaign.id,
  campId: campaign.camp_id,
  name: campaign.name,
  description: campaign.description,
  startDate: campaign.start_date,
  endDate: campaign.end_date,
  status: campaign.status,
  aidType: campaign.aid_type,
  aidCategory: campaign.aid_category,
  targetFamilies: campaign.target_families,
  distributedTo: campaign.distributed_to,
  coordinatorUserId: campaign.coordinator_user_id,
  notes: campaign.notes,
  inventoryItemId: campaign.inventory_item_id,
  isDeleted: campaign.is_deleted,
  deletedAt: campaign.deleted_at,
  createdAt: campaign.created_at,
  updatedAt: campaign.updated_at
});

// Get all aid campaigns (filtered by camp for CAMP_MANAGER)
router.get('/campaigns', authenticateToken, async (req, res, next) => {
  try {
    const { includeDeleted } = req.query;

    console.log('[GET Campaigns] includeDeleted param:', includeDeleted);
    console.log('[GET Campaigns] User role:', req.user.role, 'Camp ID:', req.user.campId);

    let query = supabase.from('aid_campaigns').select('*');

    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER' || req.user.role === 'FIELD_OFFICER') {
      // Both CAMP_MANAGER and FIELD_OFFICER can only see campaigns in their camp
      if (!req.user.campId) {
        return res.status(400).json({ error: getMessage('aid', 'campIdNotFound', 'Camp ID not found in token') });
      }
      query = query.eq('camp_id', req.user.campId);
      console.log(`[GET Campaigns] Filtering by camp_id for ${req.user.role}:`, req.user.campId);
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // By default, exclude deleted campaigns unless includeDeleted=true is passed
    if (includeDeleted !== 'true') {
      console.log('[GET Campaigns] Filtering out deleted campaigns (deleted_at IS NULL)');
      query = query.is('deleted_at', null);
    } else {
      console.log('[GET Campaigns] Including deleted campaigns');
    }

    const { data: campaigns, error } = await query.order('start_date', { ascending: false });

    if (error) {
      console.error('[GET Campaigns] Error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    console.log('[GET Campaigns] Returning', campaigns?.length || 0, 'campaigns');
    if (campaigns && campaigns.length > 0) {
      console.log('[GET Campaigns] Sample campaign:', { 
        id: campaigns[0].id, 
        name: campaigns[0].name, 
        is_deleted: campaigns[0].is_deleted, 
        deleted_at: campaigns[0].deleted_at 
      });
    }

    res.json(campaigns.map(formatCampaign) || []);
  } catch (error) {
    console.error('[GET Campaigns] Unexpected error:', error);
    next(error);
  }
});

// Get aid campaign by ID
router.get('/campaigns/:campaignId', authenticateToken, async (req, res, next) => {
  try {
    const { campaignId } = req.params;

    const { data: campaign, error } = await supabase
      .from('aid_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (error || !campaign) {
      return res.status(404).json({ error: getMessage('aid', 'campaignNotFound', 'Campaign not found') });
    }

    // Check authorization: SYSTEM_ADMIN, campaign coordinator, or CAMP_MANAGER/FIELD_OFFICER of same camp
    const isSystemAdmin = req.user.role === 'SYSTEM_ADMIN';
    const isCoordinator = req.user.userId === campaign.coordinator_user_id;
    const isCampManager = req.user.role === 'CAMP_MANAGER' && req.user.campId === campaign.camp_id;
    const isFieldOfficer = req.user.role === 'FIELD_OFFICER' && req.user.campId === campaign.camp_id;

    if (!isSystemAdmin && !isCoordinator && !isCampManager && !isFieldOfficer) {
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Get aid campaign error:', error);
    next(error);
  }
});

// Create new aid campaign
router.post('/campaigns', authenticateToken, async (req, res, next) => {
  try {
    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    const { name, aidType, aidCategory, startDate, endDate, description, notes, targetFamilies, distributedTo, inventoryItemId } = req.body;

    // Validate required fields
    if (!name || !aidType || !startDate) {
      return res.status(400).json({ error: getMessage('aid', 'nameAidTypeStartDateRequired', 'Name, aid type, and start date are required') });
    }

    if (endDate && new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ error: getMessage('aid', 'endDateAfterStartDate', 'End date must be after start date') });
    }

    const campaignData = {
      name,
      aid_type: aidType,
      aid_category: aidCategory || 'other',
      start_date: startDate,
      end_date: endDate || null,
      description: description || null,
      notes: notes || null,
      target_families: targetFamilies || [],
      distributed_to: distributedTo || [],
      status: 'مخططة',
      coordinator_user_id: req.user.userId,
      camp_id: req.user.role === 'CAMP_MANAGER' ? req.user.campId : null,
      inventory_item_id: inventoryItemId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: campaign, error } = await supabase
      .from('aid_campaigns')
      .insert([campaignData])
      .select()
      .single();

    if (error) {
      console.error('Create aid campaign error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json(formatCampaign(campaign));
  } catch (error) {
    console.error('Create aid campaign error:', error);
    next(error);
  }
});

// Update aid campaign
router.put('/campaigns/:campaignId', authenticateToken, async (req, res, next) => {
  try {
    const { campaignId } = req.params;

    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Get the campaign to check camp association and coordinator
    const { data: campaign, error: fetchError } = await supabase
      .from('aid_campaigns')
      .select('coordinator_user_id, camp_id')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      return res.status(404).json({ error: getMessage('aid', 'campaignNotFound', 'Campaign not found') });
    }

    // Check authorization: SYSTEM_ADMIN or coordinator or CAMP_MANAGER/FIELD_OFFICER of same camp
    if (req.user.role === 'CAMP_MANAGER' || req.user.role === 'FIELD_OFFICER') {
      if (!req.user.campId || campaign.camp_id !== req.user.campId) {
        return res.status(403).json({ error: getMessage('aid', 'unauthorizedUpdateCampaign', 'Unauthorized to update this campaign - not in your camp') });
      }
    } else if (req.user.role !== 'SYSTEM_ADMIN' && campaign.coordinator_user_id !== req.user.userId) {
      return res.status(403).json({ error: getMessage('aid', 'notCoordinator', 'Access denied - not the coordinator') });
    }

    const { name, aidType, aidCategory, startDate, endDate, description, notes, status, targetFamilies, distributedTo, inventoryItemId } = req.body;

    const updates = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name;
    if (aidType !== undefined) updates.aid_type = aidType;
    if (aidCategory !== undefined) updates.aid_category = aidCategory;
    if (startDate !== undefined) updates.start_date = startDate;
    if (endDate !== undefined) updates.end_date = endDate;
    if (description !== undefined) updates.description = description;
    if (notes !== undefined) updates.notes = notes;
    if (status !== undefined) updates.status = status;
    if (targetFamilies !== undefined) updates.target_families = targetFamilies;
    if (distributedTo !== undefined) updates.distributed_to = distributedTo;
    if (inventoryItemId !== undefined) updates.inventory_item_id = inventoryItemId;

    const { data: updatedCampaign, error: updateError } = await supabase
      .from('aid_campaigns')
      .update(updates)
      .eq('id', campaignId)
      .select()
      .single();

    if (updateError) {
      console.error('Update aid campaign error:', updateError);
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    res.json(formatCampaign(updatedCampaign));
  } catch (error) {
    console.error('Update aid campaign error:', error);
    next(error);
  }
});

// Delete aid campaign (Soft Delete)
router.delete('/campaigns/:campaignId', authenticateToken, async (req, res, next) => {
  try {
    const { campaignId } = req.params;

    console.log('[DELETE Campaign] Attempting to delete campaign:', campaignId);
    console.log('[DELETE Campaign] User role:', req.user.role, 'Camp ID:', req.user.campId);

    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER'].includes(req.user.role)) {
      console.log('[DELETE Campaign] Unauthorized - role not allowed:', req.user.role);
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Get the campaign to check camp association
    const { data: campaign, error: fetchError } = await supabase
      .from('aid_campaigns')
      .select('coordinator_user_id, camp_id')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      console.log('[DELETE Campaign] Campaign not found:', campaignId, fetchError);
      return res.status(404).json({ error: getMessage('aid', 'campaignNotFound', 'Campaign not found') });
    }

    console.log('[DELETE Campaign] Found campaign:', campaign);

    // Check authorization: SYSTEM_ADMIN or CAMP_MANAGER of same camp
    if (req.user.role === 'CAMP_MANAGER') {
      if (!req.user.campId || campaign.camp_id !== req.user.campId) {
        console.log('[DELETE Campaign] Unauthorized - camp mismatch. User camp:', req.user.campId, 'Campaign camp:', campaign.camp_id);
        return res.status(403).json({ error: getMessage('aid', 'unauthorizedDeleteCampaign', 'Unauthorized to delete this campaign - not in your camp') });
      }
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      console.log('[DELETE Campaign] Unauthorized - not SYSTEM_ADMIN:', req.user.role);
      return res.status(403).json({ error: getMessage('aid', 'accessDenied', 'Access denied') });
    }

    // Perform soft delete (set is_deleted to true and mark deleted_at)
    console.log('[DELETE Campaign] Performing soft delete...');
    const { data: updateData, error: updateError } = await supabase
      .from('aid_campaigns')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select();

    if (updateError) {
      console.error('[DELETE Campaign] Update error:', updateError);
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    console.log('[DELETE Campaign] Soft delete successful:', updateData);
    
    // Verify the update actually happened
    if (!updateData || updateData.length === 0) {
      console.error('[DELETE Campaign] WARNING: Update returned no rows! The campaign may not exist or columns may be missing.');
      // Try to get the campaign to see its current state
      const { data: currentCampaign } = await supabase
        .from('aid_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();
      console.log('[DELETE Campaign] Current campaign state:', currentCampaign);
    }

    // Log the deletion to soft_deletes table
    try {
      await supabase.from('soft_deletes').insert({
        table_name: 'aid_campaigns',
        record_id: campaignId,
        user_id: req.user.userId,
        deleted_at: new Date().toISOString()
      });
      console.log('[DELETE Campaign] Logged to soft_deletes table');
    } catch (logError) {
      console.error('[DELETE Campaign] Failed to log soft delete to audit table:', logError);
      // Don't fail the delete if logging fails
    }

    console.log('[DELETE Campaign] Returning 204 success');
    res.status(204).send();
  } catch (error) {
    console.error('[DELETE Campaign] Unexpected error:', error);
    next(error);
  }
});

module.exports = { aidRoutes: router };