// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

// Login endpoint
router.post('/login', async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ 
        error: getMessage('auth', 'emailPasswordRoleRequired', 'Email, password, and role are required') 
      });
    }

    // Fetch user from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: getMessage('auth', 'invalidEmailOrPassword', 'Invalid email or password') });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: getMessage('auth', 'invalidEmailOrPassword', 'Invalid email or password') });
    }

    // Verify role matches
    if (user.role !== role) {
      return res.status(403).json({ error: getMessage('auth', 'roleMismatch', 'Role mismatch') });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(403).json({ error: getMessage('auth', 'accountInactive', 'Account is inactive') });
    }

    // For camp managers, check if their camp is in pending status
    if (user.role === 'CAMP_MANAGER' && user.camp_id) {
      const { data: camp, error: campError } = await supabase
        .from('camps')
        .select('status')
        .eq('id', user.camp_id)
        .single();

      if (campError || !camp) {
        return res.status(500).json({ error: getMessage('camps', 'errorVerifyingCampStatus', 'Error verifying camp status') });
      }

      if (camp.status === 'قيد الانتظار') {
        return res.status(403).json({ error: getMessage('auth', 'campPendingApproval', 'Camp registration is pending approval. Please contact administrators.') });
      }
    }

    // Generate JWT with user information
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        campId: user.camp_id,
        familyId: user.family_id,
        // Add any other claims you need
      },
      JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h', // Token expires in 24 hours
        issuer: 'snd-system',
        audience: 'snd-users'
      }
    );

    // Update last login time
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating last login:', updateError);
    }

    // Return token and updated user info (without sensitive data)
    res.json({
      token,
      user: {
        id: (updatedUser || user).id,
        email: (updatedUser || user).email,
        role: (updatedUser || user).role,
        firstName: (updatedUser || user).first_name,
        lastName: (updatedUser || user).last_name,
        isActive: (updatedUser || user).is_active,
        campId: (updatedUser || user).camp_id,
        familyId: (updatedUser || user).family_id,
        last_login: (updatedUser || user).last_login
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    next(error);
  }
});

// Verify token endpoint
router.post('/verify-token', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Refresh token endpoint (simplified - in a real system you'd use refresh tokens)
router.post('/refresh', authenticateToken, (req, res) => {
  const { userId, email, role, campId, familyId } = req.user;

  // Generate a new token with extended validity
  const newToken = jwt.sign(
    { userId, email, role, campId, familyId },
    JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'snd-system',
      audience: 'snd-users'
    }
  );

  res.json({ token: newToken });
});

// Change password endpoint
router.post('/change-password', authenticateToken, async (req, res, next) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ error: getMessage('users', 'emailPasswordRoleRequired', 'User ID, current password, and new password are required') });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({ error: getMessage('auth', 'passwordTooShort', 'New password must be at least 6 characters long') });
    }

    // Verify user has permission to change this password
    if (req.user.userId !== userId && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'unauthorizedChangePassword', 'Unauthorized to change this password') });
    }

    // Get user from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: getMessage('users', 'userNotFound', 'User not found') });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: getMessage('auth', 'incorrectCurrentPassword', 'Current password is incorrect') });
    }

    // Hash new password
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database with updated_at timestamp
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: newPasswordHash,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('Password update error:', updateError);
      return res.status(500).json({ error: getMessage('auth', 'failedUpdatePassword', 'Failed to update password') });
    }

    console.log('Password changed successfully for user:', userId);
    res.json({ success: true, message: getMessage('auth', 'passwordChanged', 'Password changed successfully') });
  } catch (error) {
    console.error('Change password error:', error);
    next(error);
  }
});

// Update last login endpoint
router.post('/update-last-login', authenticateToken, async (req, res, next) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: getMessage('users', 'userIdRequired', 'User ID is required') });
    }

    // Verify user has permission to update this login time
    if (req.user.userId !== userId && req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'unauthorized', 'Unauthorized') });
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId)
      .select('id, last_login')
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({ success: true, last_login: updatedUser.last_login });
  } catch (error) {
    console.error('Update last login error:', error);
    next(error);
  }
});

// DP (Beneficiary) login endpoint - authenticates using national ID
router.post('/dp-login', async (req, res, next) => {
  try {
    const { national_id } = req.body;

    if (!national_id) {
      return res.status(400).json({
        error: getMessage('auth', 'nationalIdRequired', 'National ID is required')
      });
    }

    // Validate national ID format (should be 9 digits)
    if (!/^\d{9}$/.test(national_id)) {
      return res.status(400).json({
        error: getMessage('auth', 'invalidNationalId', 'National ID must be 9 digits')
      });
    }

    // Fetch family from Supabase using head_of_family_national_id
    const { data: family, error } = await supabase
      .from('families')
      .select('*')
      .eq('head_of_family_national_id', national_id)
      .single();

    if (error || !family) {
      return res.status(401).json({
        error: getMessage('auth', 'invalidNationalId', 'Invalid national ID')
      });
    }

    // Check if family is approved (using Arabic status values)
    if (family.status !== 'موافق') {
      if (family.status === 'قيد الانتظار') {
        return res.status(403).json({
          error: getMessage('auth', 'familyPendingApproval', 'Family registration is pending approval')
        });
      } else if (family.status === 'مرفوض') {
        return res.status(403).json({
          error: getMessage('auth', 'familyRejected', 'Family registration has been rejected')
        });
      } else {
        return res.status(403).json({
          error: getMessage('auth', 'familyNotApproved', 'Family is not approved for login')
        });
      }
    }

    // Generate JWT token for the family
    const token = jwt.sign(
      {
        userId: family.id,
        role: 'BENEFICIARY',
        familyId: family.id,
        nationalId: family.head_of_family_national_id,
        campId: family.camp_id
      },
      JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h',
        issuer: 'snd-system',
        audience: 'snd-users'
      }
    );

    // Return token and family info
    res.json({
      token,
      family: {
        id: family.id,
        national_id: family.head_of_family_national_id,
        name: family.name || family.head_of_family_name,
        status: family.status,
        camp_id: family.camp_id
      }
    });
  } catch (error) {
    console.error('DP login error:', error);
    next(error);
  }
});

module.exports = { authRoutes: router };