// backend/middleware/maintenance.js
const { supabase } = require('../db/connection');

/**
 * Maintenance Mode Middleware
 * - Checks if maintenance mode is enabled
 * - Allows SYSTEM_ADMIN to bypass
 * - Blocks other users with 503 Service Unavailable
 */
const checkMaintenanceMode = async (req, res, next) => {
  try {
    // Skip maintenance check for auth endpoints and health check
    const skipPaths = [
      '/api/auth/login',
      '/api/auth/refresh',
      '/health',
      '/api/config'
    ];
    
    if (skipPaths.some(path => req.path.startsWith(path))) {
      return next();
    }

    // Get maintenance mode status from database
    const { data: config } = await supabase
      .from('global_config')
      .select('config_value')
      .eq('config_key', 'general_settings')
      .single();

    const generalSettings = config?.config_value || {};
    const isMaintenanceMode = generalSettings.maintenanceMode || false;

    if (isMaintenanceMode) {
      // Check if user is SYSTEM_ADMIN (allow bypass)
      if (req.user && req.user.role === 'SYSTEM_ADMIN') {
        // Add header to inform frontend that maintenance mode is active
        res.setHeader('X-Maintenance-Mode', 'true');
        return next();
      }

      // Block non-admin users
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'النظام في وضع الصيانة حالياً. يرجى المحاولة لاحقاً.',
        maintenanceMode: true,
        retryAfter: 3600 // Suggest retry after 1 hour
      });
    }

    next();
  } catch (error) {
    console.error('Maintenance mode check error:', error);
    // If we can't check maintenance mode, allow the request
    next();
  }
};

module.exports = { checkMaintenanceMode };
