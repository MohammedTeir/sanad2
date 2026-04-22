// backend/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, async (req, res, next) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone_number, is_active, created_at, last_login, camp_id, family_id')
      .eq('id', req.user.userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: getMessage('users', 'userNotFound', 'User not found') });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
});

// Get all users (admin only)
router.get('/', ...authorizeResourceAction(['SYSTEM_ADMIN'], 'users', 'read'), async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone_number, is_active, created_at, last_login, camp_id')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    next(error);
  }
});

// Get field officers for camp manager's camp
router.get('/camp/field-officers', authenticateToken, authorizeRole(['CAMP_MANAGER']), async (req, res, next) => {
  try {
    if (!req.user.campId) {
      return res.status(400).json({ error: getMessage('users', 'campIdNotFound', 'Camp ID not found in token') });
    }

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone_number, is_active, created_at, last_login, camp_id')
      .eq('role', 'FIELD_OFFICER')
      .eq('camp_id', req.user.campId)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Convert snake_case to camelCase for consistency
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      firstName: user.first_name,
      lastName: user.last_name,
      phoneNumber: user.phone_number,
      isActive: user.is_active,
      lastLogin: user.last_login,
      campId: user.camp_id,
      createdAt: user.created_at
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get field officers error:', error);
    next(error);
  }
});

// Get user by ID (admin only)
router.get('/:userId', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { userId } = req.params;

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, role, first_name, last_name, phone_number, is_active, created_at, last_login, camp_id, family_id')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: getMessage('users', 'userNotFound', 'User not found') });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    next(error);
  }
});

// Update user profile (users can update their own profile)
router.patch('/profile', authenticateToken, async (req, res, next) => {
  try {
    const updates = req.body;
    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updates.id;
    delete updates.email;
    delete updates.role;
    delete updates.password_hash;

    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', req.user.userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    next(error);
  }
});

// Update user (admin only OR user updating their own profile OR camp manager updating their staff)
router.put('/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Check authorization - allow SYSTEM_ADMIN, user updating their own profile, or CAMP_MANAGER updating their staff
    if (req.user.role !== 'SYSTEM_ADMIN' && req.user.userId !== userId) {
      // Check if CAMP_MANAGER trying to update FIELD_OFFICER in their camp
      if (req.user.role === 'CAMP_MANAGER') {
        // Verify the user being updated is a FIELD_OFFICER in the same camp
        const { data: targetUser, error: targetUserError } = await supabase
          .from('users')
          .select('role, camp_id')
          .eq('id', userId)
          .single();

        if (targetUserError || !targetUser) {
          return res.status(404).json({ error: getMessage('users', 'userNotFound', 'User not found') });
        }

        if (targetUser.role !== 'FIELD_OFFICER' || targetUser.camp_id !== req.user.campId) {
          return res.status(403).json({ error: getMessage('users', 'unauthorizedUpdateUser', 'Unauthorized to update this user') });
        }
      } else {
        return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Unauthorized to update this user') });
      }
    }

    // Prevent updating certain fields
    delete updates.id;
    delete updates.password_hash;

    // Only SYSTEM_ADMIN can change roles
    let roleUpdate = null;
    if (updates.role) {
      if (req.user.role !== 'SYSTEM_ADMIN') {
        return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Only SYSTEM_ADMIN can change user roles') });
      }

      // Validate role is a valid value
      const validRoles = ['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY', 'DONOR_OBSERVER'];
      if (!validRoles.includes(updates.role)) {
        return res.status(400).json({ error: getMessage('users', 'roleInvalid', 'Invalid role value') });
      }

      // If changing to CAMP_MANAGER or FIELD_OFFICER, ensure camp_id is provided
      if (['CAMP_MANAGER', 'FIELD_OFFICER'].includes(updates.role) && !updates.camp_id) {
        return res.status(400).json({ error: getMessage('users', 'campAssignmentRequired', 'Camp assignment is required for CAMP_MANAGER and FIELD_OFFICER roles') });
      }

      roleUpdate = updates.role;
      delete updates.role; // Remove from main updates, will be processed separately
    }

    // Only SYSTEM_ADMIN can update is_active for non-staff users
    if (updates.is_active !== undefined && req.user.role !== 'SYSTEM_ADMIN') {
      // CAMP_MANAGER can only update is_active for FIELD_OFFICERs in their camp
      const { data: targetUser, error: targetUserError } = await supabase
        .from('users')
        .select('role, camp_id')
        .eq('id', userId)
        .single();

      if (targetUserError || !targetUser || targetUser.role !== 'FIELD_OFFICER' || targetUser.camp_id !== req.user.campId) {
        delete updates.is_active;
      }
    }

    // Handle email update with uniqueness check
    let emailUpdate = null;
    if (updates.email) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({ error: getMessage('users', 'invalidEmailFormat', 'Invalid email format') });
      }

      // Check if this email is already taken by another user
      const { data: existingUser, error: existingUserError } = await supabase
        .from('users')
        .select('id')
        .eq('email', updates.email)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return res.status(409).json({ error: getMessage('users', 'emailAlreadyInUse', 'Email already in use by another user') });
      }

      emailUpdate = updates.email;
      delete updates.email;
    }

    // Handle password update with hashing
    let passwordUpdate = null;
    if (updates.password) {
      if (updates.password.length < 6) {
        return res.status(400).json({ error: getMessage('auth', 'passwordTooShort', 'Password must be at least 6 characters long') });
      }

      const saltRounds = 10;
      passwordUpdate = await bcrypt.hash(updates.password, saltRounds);
      delete updates.password;
    }

    // Add updated_at timestamp
    updates.updated_at = new Date().toISOString();

    // First, update the basic fields
    const { data: user, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // If role needs to be updated, do it separately
    if (roleUpdate) {
      const { error: roleError } = await supabase
        .from('users')
        .update({ role: roleUpdate, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (roleError) {
        return res.status(500).json({ error: getDatabaseErrorMessage(roleError) });
      }

      user.role = roleUpdate;
    }

    // If email needs to be updated, do it separately
    if (emailUpdate) {
      const { error: emailError } = await supabase
        .from('users')
        .update({ email: emailUpdate, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (emailError) {
        return res.status(500).json({ error: getDatabaseErrorMessage(emailError) });
      }

      user.email = emailUpdate;
    }

    // If password needs to be updated, do it separately
    if (passwordUpdate) {
      const { error: passwordError } = await supabase
        .from('users')
        .update({ password_hash: passwordUpdate, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (passwordError) {
        return res.status(500).json({ error: getDatabaseErrorMessage(passwordError) });
      }
    }

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    next(error);
  }
});

// Register user (public endpoint for camp managers registering their camps)
router.post('/register', async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, campId } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        error: getMessage('users', 'missingRequiredFields', 'Email, password, firstName, lastName, and role are required')
      });
    }

    // Validate role is appropriate for registration
    if (!['CAMP_MANAGER', 'FIELD_OFFICER'].includes(role)) {
      return res.status(400).json({
        error: getMessage('users', 'invalidRoleForRegistration', 'Invalid role for registration. Only CAMP_MANAGER and FIELD_OFFICER roles allowed.')
      });
    }

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: getMessage('users', 'emailInUse', 'User with this email already exists') });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData = {
      email,
      password_hash: passwordHash,
      role,
      first_name: firstName,
      last_name: lastName,
      is_active: true, // New registrations are active by default
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // If campId is provided, associate the user with the camp
    if (campId) {
      // Verify that the camp exists
      const { data: camp, error: campError } = await supabase
        .from('camps')
        .select('id')
        .eq('id', campId)
        .single();

      if (campError || !camp) {
        return res.status(400).json({ error: getMessage('camps', 'campNotFound', 'Invalid camp ID') });
      }

      userData.camp_id = campId;
    }

    // Insert the new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (insertError) {
      console.error('User registration error:', insertError);
      return res.status(500).json({ error: getDatabaseErrorMessage(insertError) });
    }

    // Return success response (without password hash)
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      isActive: newUser.is_active,
      campId: newUser.camp_id,
      createdAt: newUser.created_at
    });
  } catch (error) {
    console.error('User registration error:', error);
    next(error);
  }
});

// Create user (admin only - for SYSTEM_ADMIN to create other admins or field officers)
router.post('/', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { email, password, role, firstName, lastName, phoneNumber, campId, isActive } = req.body;

    // Validate required fields
    if (!email || !password || !role || !firstName) {
      return res.status(400).json({
        error: getMessage('users', 'emailPasswordRoleRequired', 'Email, password, role, and firstName are required')
      });
    }

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: getMessage('users', 'emailInUse', 'User with this email already exists') });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Prepare user data
    const userData = {
      email,
      password_hash: passwordHash,
      role,
      first_name: firstName,
      last_name: lastName || '',
      phone_number: phoneNumber || null,
      is_active: isActive !== undefined ? isActive : true,
      camp_id: campId || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (insertError) {
      console.error('User creation error:', insertError);
      return res.status(500).json({ error: getDatabaseErrorMessage(insertError) });
    }

    // Return success response (without password hash)
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      phoneNumber: newUser.phone_number,
      isActive: newUser.is_active,
      campId: newUser.camp_id,
      createdAt: newUser.created_at
    });
  } catch (error) {
    console.error('User creation error:', error);
    next(error);
  }
});

// Create field officer (for CAMP_MANAGER to create field officers in their camp)
router.post('/camp/field-officer', authenticateToken, authorizeRole(['CAMP_MANAGER']), async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, phoneNumber, isActive } = req.body;

    // Validate required fields
    if (!email || !password || !firstName) {
      return res.status(400).json({
        error: getMessage('users', 'emailPasswordRoleRequired', 'Email, password, and firstName are required')
      });
    }

    // Verify camp manager has a camp
    if (!req.user.campId) {
      return res.status(400).json({ error: getMessage('users', 'campIdNotFound', 'Camp ID not found in token') });
    }

    // Check if user already exists
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return res.status(409).json({ error: getMessage('users', 'emailInUse', 'User with this email already exists') });
    }

    // Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Prepare user data - force role to FIELD_OFFICER and camp_id to manager's camp
    const userData = {
      email,
      password_hash: passwordHash,
      role: 'FIELD_OFFICER',
      first_name: firstName,
      last_name: lastName || '',
      phone_number: phoneNumber || null,
      is_active: isActive !== undefined ? isActive : true,
      camp_id: req.user.campId, // Always use the camp manager's camp
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insert the new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (insertError) {
      console.error('Field officer creation error:', insertError);
      return res.status(500).json({ error: getDatabaseErrorMessage(insertError) });
    }

    // Return success response (without password hash)
    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.first_name,
      lastName: newUser.last_name,
      phoneNumber: newUser.phone_number,
      isActive: newUser.is_active,
      campId: newUser.camp_id,
      createdAt: newUser.created_at
    });
  } catch (error) {
    console.error('Field officer creation error:', error);
    next(error);
  }
});

// Delete user (admin only OR camp manager deleting their staff)
router.delete('/:userId', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;

    // Check authorization - allow SYSTEM_ADMIN or CAMP_MANAGER deleting their staff
    if (req.user.role === 'SYSTEM_ADMIN') {
      // Prevent SYSTEM_ADMIN from deleting themselves
      if (userId === req.user.userId) {
        return res.status(400).json({ error: getMessage('users', 'cannotDeleteOwnAccount', 'Cannot delete your own account') });
      }
    } else if (req.user.role === 'CAMP_MANAGER') {
      // CAMP_MANAGER can only delete FIELD_OFFICERs in their camp
      const { data: targetUser, error: targetUserError } = await supabase
        .from('users')
        .select('role, camp_id')
        .eq('id', userId)
        .single();

      if (targetUserError || !targetUser) {
        return res.status(404).json({ error: getMessage('users', 'userNotFound', 'User not found') });
      }

      if (targetUser.role !== 'FIELD_OFFICER' || targetUser.camp_id !== req.user.campId) {
        return res.status(403).json({ error: getMessage('users', 'unauthorizedDeleteUser', 'Unauthorized to delete this user') });
      }
    } else {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Unauthorized to delete users') });
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete user error:', error);
    next(error);
  }
});

// Reset password for a user (CAMP_MANAGER can reset FIELD_OFFICER passwords in their camp)
router.post('/:userId/reset-password', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    // Validate new password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: getMessage('auth', 'passwordTooShort', 'Password must be at least 6 characters long') });
    }

    // Check authorization
    if (req.user.role !== 'SYSTEM_ADMIN' && req.user.userId !== userId) {
      // Check if CAMP_MANAGER trying to reset FIELD_OFFICER password in their camp
      if (req.user.role === 'CAMP_MANAGER') {
        const { data: targetUser, error: targetUserError } = await supabase
          .from('users')
          .select('role, camp_id')
          .eq('id', userId)
          .single();

        if (targetUserError || !targetUser) {
          return res.status(404).json({ error: getMessage('users', 'userNotFound', 'User not found') });
        }

        if (targetUser.role !== 'FIELD_OFFICER' || targetUser.camp_id !== req.user.campId) {
          return res.status(403).json({ error: getMessage('users', 'unauthorizedResetPassword', 'Unauthorized to reset password for this user') });
        }
      } else {
        return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Unauthorized to reset password for this user') });
      }
    }

    // Hash the new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update the password
    const { data: user, error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('id, email, role, first_name, last_name, is_active, camp_id')
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // In a production environment, you would send an email with the new password
    // For now, we'll just return success (the frontend handles showing the password)
    res.json({
      message: getMessage('users', 'passwordResetSuccess', 'Password reset successfully'),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    });
  } catch (error) {
    console.error('Reset password error:', error);
    next(error);
  }
});

module.exports = { userRoutes: router };
