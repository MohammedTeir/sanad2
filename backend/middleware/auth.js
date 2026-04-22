// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const httpErrors = require('http-errors');
const { supabase } = require('../db/connection');
const { getMessage } = require('../utils/arabicMessages');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(httpErrors(401, getMessage('auth', 'tokenRequired', 'Access token required')));
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return next(httpErrors(403, getMessage('auth', 'tokenExpired', 'Token expired')));
      }
      return next(httpErrors(403, getMessage('auth', 'invalidToken', 'Invalid token')));
    }

    req.user = user;
    next();
  });
};

const optionalAuthenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      // Proceed without user if token is invalid or expired
      return next();
    }

    req.user = user;
    next();
  });
};

// Middleware to check user role
const authorizeRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(httpErrors(401, getMessage('auth', 'authenticationRequired', 'Authentication required')));
    }

    if (req.user.role !== 'SYSTEM_ADMIN' && !roles.includes(req.user.role)) {
      return next(httpErrors(403, getMessage('auth', 'insufficientPermissions', 'Insufficient permissions: Role check failed')));
    }

    next();
  };
};

// Granular permission check middleware
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    if (!req.user) {
      return next(httpErrors(401, getMessage('auth', 'authenticationRequired', 'Authentication required')));
    }

    // SYSTEM_ADMIN bypasses granular permission checks
    if (req.user.role === 'SYSTEM_ADMIN') {
      return next();
    }

    try {
      // Check if the user's role has permission for this resource and action
      const { data: permission, error } = await supabase
        .from('permissions')
        .select('*')
        .eq('role', req.user.role)
        .eq('resource', resource)
        .eq('action', action)
        .single();

      if (error || !permission) {
        return next(httpErrors(403, getMessage('auth', 'insufficientPermissions', 'Insufficient permissions')));
      }

      next();
    } catch (err) {
      console.error('Permission check error:', err);
      return next(httpErrors(500, getMessage('database', 'genericError', 'Permission check failed')));
    }
  };
};

// Hybrid permission check that first checks role, then granular permission
const authorizeResourceAction = (roles, resource, action) => {
  return [
    authenticateToken,
    (req, res, next) => {
      if (!req.user) {
        return next(httpErrors(401, getMessage('auth', 'authenticationRequired', 'Authentication required')));
      }

      // First check if user has the required role (SYSTEM_ADMIN is always allowed)
      if (req.user.role !== 'SYSTEM_ADMIN' && !roles.includes(req.user.role)) {
        return next(httpErrors(403, getMessage('auth', 'insufficientPermissions', 'Insufficient permissions: Role check failed')));
      }

      next();
    },
    // Then check if the role has permission for the specific resource-action
    checkPermission(resource, action)
  ];
};

// Simple role check without granular permission check (for simpler operations)
const authorizeRoleOnly = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(httpErrors(401, getMessage('auth', 'authenticationRequired', 'Authentication required')));
    }

    if (req.user.role !== 'SYSTEM_ADMIN' && !roles.includes(req.user.role)) {
      return next(httpErrors(403, getMessage('auth', 'insufficientPermissions', 'Insufficient permissions: Role check failed')));
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  optionalAuthenticateToken,
  authorizeRole,
  checkPermission,
  authorizeResourceAction,
  authorizeRoleOnly
};