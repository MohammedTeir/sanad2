// backend/routes/public.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
const { supabase: serviceSupabase } = require('../db/connection'); // Keep for internal operations
const { calculateVulnerabilityScore } = require('../services/vulnerabilityService');
const router = express.Router();

// Public endpoint to get active camps (for registration forms)
router.get('/camps', async (req, res, next) => {
  try {
    // Only return active camps for public view
    // Using serviceSupabase which has full access (bypasses RLS)
    const { data: camps, error } = await serviceSupabase
      .from('camps')
      .select(`
        id,
        name,
        location_lat,
        location_lng,
        location_address,
        location_governorate,
        location_area,
        manager_name,
        status
      `)
      .eq('status', 'نشط')
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json(camps);
  } catch (error) {
    console.error('Get public camps error:', error);
    next(error);
  }
});

// Public endpoint for new camp registration (creates pending camps and associated user account)
router.post('/camps/register', async (req, res, next) => {
  try {
    // Validate required fields for camp registration
    const { name, manager_name, location_address, email, password } = req.body;

    if (!name || !manager_name || !location_address || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, manager_name, location_address, email, password' });
    }

    // Extract first and last name from manager_name
    const nameParts = manager_name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await serviceSupabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Create new camp with pending status
    const campData = {
      name: req.body.name,
      manager_name: req.body.manager_name,
      location_lat: req.body.location_lat || 31.5, // Use default if not provided
      location_lng: req.body.location_lng || 34.4, // Use default if not provided
      location_address: req.body.location_address,
      location_governorate: req.body.location_governorate || 'Unknown', // Governorate/Province
      location_area: req.body.location_area || 'Unknown',               // Area/Neighborhood/District
      status: 'قيد الانتظار',  // Force pending status for public registrations
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the new camp
    const { data: camp, error: campError } = await serviceSupabase
      .from('camps')
      .insert([campData])
      .select()
      .single();

    if (campError) {
      console.error('Create camp error:', campError);
      return res.status(500).json({ error: campError.message });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user account for the camp manager
    const userData = {
      email: email,
      password_hash: passwordHash,
      role: 'CAMP_MANAGER',
      first_name: firstName,
      last_name: lastName,
      is_active: true, // New registrations are active by default
      camp_id: camp.id, // Associate user with the newly created camp
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the new user
    const { data: newUser, error: userError } = await serviceSupabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (userError) {
      console.error('User creation error:', userError);

      // Rollback: delete the camp if user creation fails
      await serviceSupabase.from('camps').delete().eq('id', camp.id);

      return res.status(500).json({ error: userError.message });
    }

    // Return success response with both camp and user info (without password hash)
    res.status(201).json({
      camp: {
        id: camp.id,
        name: camp.name,
        manager_name: camp.manager_name,
        location_lat: camp.location_lat,
        location_lng: camp.location_lng,
        location_address: camp.location_address,
        status: camp.status,
        created_at: camp.created_at
      },
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.first_name,
        lastName: newUser.last_name,
        isActive: newUser.is_active,
        campId: newUser.camp_id,
        createdAt: newUser.created_at
      }
    });
  } catch (error) {
    console.error('Create camp and user error:', error);
    next(error);
  }
});

// Public endpoint to lookup family by national ID (for login)
router.get('/families/lookup', async (req, res, next) => {
  try {
    const { national_id } = req.query;

    if (!national_id) {
      return res.status(400).json({ error: 'رقم الهوية مطلوب' });
    }

    // Lookup family by national ID
    const { data: family, error } = await serviceSupabase
      .from('families')
      .select('id, head_of_family_name, head_of_family_national_id, status, camp_id')
      .eq('head_of_family_national_id', national_id)
      .single();

    if (error || !family) {
      return res.status(404).json({ error: 'رقم الهوية غير مسجل في النظام. يرجى إنشاء حساب جديد.' });
    }

    // Return family info (without sensitive data)
    res.json({
      id: family.id,
      national_id: family.head_of_family_national_id,
      name: family.head_of_family_name,
      status: family.status,
      camp_id: family.camp_id
    });
  } catch (error) {
    console.error('Family lookup error:', error);
    next(error);
  }
});

// Public endpoint for new family registration (for self-registration)
router.post('/families', async (req, res, next) => {
  try {
    // Validate required fields for family registration
    const { id, camp_id, head_of_family_name, head_of_family_national_id, head_of_family_gender, head_of_family_date_of_birth } = req.body;

    if (!id || !camp_id || !head_of_family_name || !head_of_family_national_id || !head_of_family_gender || !head_of_family_date_of_birth) {
      return res.status(400).json({ error: 'Missing required fields for family registration: id, camp_id, head_of_family_name, head_of_family_national_id, head_of_family_gender, head_of_family_date_of_birth' });
    }

    // Check if family already exists by ID
    const { data: existingFamily, error: existingFamilyError } = await serviceSupabase
      .from('families')
      .select('id')
      .eq('id', id)
      .single();

    if (existingFamily) {
      return res.status(409).json({ error: 'العائلة مسجلة مسبقاً بنفس رقم الهوية' });
    }

    // Check if national ID already exists (unique constraint)
    const { data: existingNationalId, error: nationalIdError } = await serviceSupabase
      .from('families')
      .select('id')
      .eq('head_of_family_national_id', head_of_family_national_id)
      .single();

    if (existingNationalId) {
      return res.status(409).json({ error: 'رقم الهوية مسجل مسبقاً، يرجى التحقق من البيانات' });
    }

    // Calculate vulnerability score on backend before saving
    let vulnerabilityScore = null;
    let vulnerabilityBreakdown = null;
    let vulnerabilityPriority = null;

    try {
      const scoreResult = await calculateVulnerabilityScore(req.body);
      vulnerabilityScore = scoreResult.score;
      vulnerabilityBreakdown = scoreResult.breakdown;
      vulnerabilityPriority = scoreResult.priorityLevel;
      console.log('Vulnerability score calculated for registration:', vulnerabilityScore);
    } catch (scoreError) {
      console.error('Error calculating vulnerability score:', scoreError.message);
      // Continue without failing the request
    }

    // Add family record with vulnerability score calculated by backend
    const familyData = {
      ...req.body,
      // Normalize empty enum fields to null to satisfy CHECK constraints
      current_housing_sanitary_facilities: req.body.current_housing_sanitary_facilities || null,
      current_housing_water_source: req.body.current_housing_water_source || null,
      current_housing_electricity_access: req.body.current_housing_electricity_access || null,
      vulnerability_score: vulnerabilityScore,
      vulnerability_priority: vulnerabilityPriority,
      vulnerability_breakdown: vulnerabilityBreakdown,
      status: 'قيد الانتظار' // New families start as pending until approved by camp manager
    };

    // Ensure current_housing_camp_id is set to match camp_id if not explicitly provided
    if (familyData.camp_id && !familyData.current_housing_camp_id) {
      familyData.current_housing_camp_id = familyData.camp_id;
    }

    // Insert the new family
    const { data: family, error: familyError } = await serviceSupabase
      .from('families')
      .insert([familyData])
      .select()
      .single();

    if (familyError) {
      console.error('Create family error:', familyError);

      // Check for unique constraint violation (duplicate national ID)
      if (familyError.code === '23505' || (familyError.details && familyError.details.includes('head_of_family_national_id_key'))) {
        return res.status(409).json({ error: 'رقم الهوية مسجل مسبقاً، يرجى التحقق من البيانات' });
      }

      return res.status(500).json({ error: familyError.message });
    }

    // Note: We do NOT create the head of family as an individual record.
    // The head of family data is stored in the families table (head_of_family_name, etc.)
    // The individuals table should only contain additional family members (spouse, children, etc.)
    // This is handled by the frontend when saving additional members via saveDP()

    // Return success response (vulnerability score is now available via the returned family object)
    res.status(201).json({
      id: family.id,
      vulnerability_score: family.vulnerability_score,
      vulnerability_priority: family.vulnerability_priority,
      message: 'Family registered successfully'
    });
  } catch (error) {
    console.error('Create family error:', error);
    next(error);
  }
});

module.exports = { publicRoutes: router };