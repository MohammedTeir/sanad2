// backend/routes/config.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

// Get all configuration (admin only)
router.get('/', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { data: configs, error } = await supabase
      .from('global_config')
      .select('*')
      .order('config_key', { ascending: true });

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Convert array to object for easier access
    const configObject = {};
    configs.forEach(config => {
      configObject[config.config_key] = {
        value: config.config_value,
        isEncrypted: config.is_encrypted,
        updatedAt: config.updated_at,
        description: config.description
      };
    });

    res.json(configObject);
  } catch (error) {
    console.error('Get config error:', error);
    next(error);
  }
});

// Get specific configuration by key
router.get('/:key', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { key } = req.params;

    const { data: config, error } = await supabase
      .from('global_config')
      .select('*')
      .eq('config_key', key)
      .single();

    if (error || !config) {
      return res.status(404).json({ error: getMessage('config', 'configurationNotFound', 'Configuration not found') });
    }

    res.json({
      key: config.config_key,
      value: config.config_value,
      isEncrypted: config.is_encrypted,
      updatedAt: config.updated_at,
      description: config.description
    });
  } catch (error) {
    console.error('Get config by key error:', error);
    next(error);
  }
});

// ⚠️  DISABLED: Vulnerability weights endpoint - System disabled
// Update vulnerability weights
router.put('/vulnerability-weights', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    // ⚠️  DISABLED: Return deprecation warning
    return res.status(410).json({ 
      error: 'Vulnerability score system has been disabled. This endpoint is deprecated.',
      deprecated: true,
      message: 'نظام درجة الهشاشة معطل. هذه النقطة النهائية ملغاة'
    });
    
    // Original code kept for potential re-enablement:
    const weights = req.body;

    // Validate weights structure
    const requiredWeights = [
      'disabilityWeight',
      'chronicDiseaseWeight',
      'warInjuryWeight',
      'pregnancyWeight',
      'elderlyWeight',
      'childrenWeight',
      'femaleHeadWeight'
    ];

    for (const weight of requiredWeights) {
      if (!(weight in weights)) {
        return res.status(400).json({ error: getMessage('config', 'missingWeight', `Missing weight: ${weight}`) });
      }
      if (typeof weights[weight] !== 'number' || weights[weight] < 0 || weights[weight] > 100) {
        return res.status(400).json({ error: getMessage('config', 'invalidWeightValue', `Invalid weight value for: ${weight}`) });
      }
    }

    const { data: config, error } = await supabase
      .from('global_config')
      .update({
        config_value: weights,
        updated_at: new Date().toISOString(),
        updated_by: req.user.userId
      })
      .eq('config_key', 'vulnerability_weights')
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({
      message: 'Vulnerability weights updated successfully',
      value: config.config_value
    });
  } catch (error) {
    console.error('Update vulnerability weights error:', error);
    next(error);
  }
});

// Update security settings
router.put('/security-settings', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const settings = req.body;

    // Validate security settings
    if (settings.sessionTimeout !== undefined) {
      if (typeof settings.sessionTimeout !== 'number' || settings.sessionTimeout < 1) {
        return res.status(400).json({ error: getMessage('config', 'invalidSessionTimeout', 'Invalid session timeout value') });
      }
    }

    if (settings.maxLoginAttempts !== undefined) {
      if (typeof settings.maxLoginAttempts !== 'number' || settings.maxLoginAttempts < 1) {
        return res.status(400).json({ error: getMessage('config', 'invalidMaxLoginAttempts', 'Invalid max login attempts value') });
      }
    }

    const { data: existingConfig } = await supabase
      .from('global_config')
      .select('config_value')
      .eq('config_key', 'security_settings')
      .single();

    const mergedSettings = {
      ...(existingConfig?.config_value || {}),
      ...settings
    };

    const { data: config, error } = await supabase
      .from('global_config')
      .update({
        config_value: mergedSettings,
        updated_at: new Date().toISOString(),
        updated_by: req.user.userId
      })
      .eq('config_key', 'security_settings')
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({
      message: 'Security settings updated successfully',
      value: config.config_value
    });
  } catch (error) {
    console.error('Update security settings error:', error);
    next(error);
  }
});

// Update AI settings (with encryption for API key)
router.put('/ai-settings', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const settings = req.body;
    const crypto = require('crypto');

    // Get existing config
    const { data: existingConfig } = await supabase
      .from('global_config')
      .select('config_value')
      .eq('config_key', 'ai_settings')
      .single();

    const mergedSettings = {
      ...(existingConfig?.config_value || {}),
      ...settings
    };

    // Encrypt API key if present
    if (mergedSettings.geminiApiKey && mergedSettings.geminiApiKey.trim() !== '') {
      const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
      const cipher = crypto.createCipher('aes-256-cbc', encryptionKey);
      let encrypted = cipher.update(mergedSettings.geminiApiKey, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      mergedSettings.geminiApiKey = encrypted;
    }

    const { data: config, error } = await supabase
      .from('global_config')
      .update({
        config_value: mergedSettings,
        updated_at: new Date().toISOString(),
        updated_by: req.user.userId,
        is_encrypted: true
      })
      .eq('config_key', 'ai_settings')
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    // Return without the encrypted key
    const returnValue = { ...config.config_value };
    if (returnValue.geminiApiKey) {
      returnValue.geminiApiKey = '••••••••••••••••';
    }

    res.json({
      message: 'AI settings updated successfully',
      value: returnValue
    });
  } catch (error) {
    console.error('Update AI settings error:', error);
    next(error);
  }
});

// Update general settings
router.put('/general-settings', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const settings = req.body;

    // Validate general settings
    if (settings.backupFrequency !== undefined) {
      if (!['daily', 'weekly', 'monthly'].includes(settings.backupFrequency)) {
        return res.status(400).json({ error: getMessage('config', 'invalidBackupFrequency', 'Invalid backup frequency') });
      }
    }

    const { data: existingConfig } = await supabase
      .from('global_config')
      .select('config_value')
      .eq('config_key', 'general_settings')
      .single();

    const mergedSettings = {
      ...(existingConfig?.config_value || {}),
      ...settings
    };

    const { data: config, error } = await supabase
      .from('global_config')
      .update({
        config_value: mergedSettings,
        updated_at: new Date().toISOString(),
        updated_by: req.user.userId
      })
      .eq('config_key', 'general_settings')
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.json({
      message: 'General settings updated successfully',
      value: config.config_value
    });
  } catch (error) {
    console.error('Update general settings error:', error);
    next(error);
  }
});

// Helper function to decrypt API key
const decryptApiKey = (encryptedKey) => {
  try {
    const crypto = require('crypto');
    const encryptionKey = process.env.ENCRYPTION_KEY || 'default-key-change-in-production';
    const decipher = crypto.createDecipher('aes-256-cbc', encryptionKey);
    let decrypted = decipher.update(encryptedKey, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decrypt API key error:', error);
    return null;
  }
};

// Get decrypted AI settings (for internal use)
router.get('/ai-settings/decrypted', authenticateToken, authorizeRole(['SYSTEM_ADMIN']), async (req, res, next) => {
  try {
    const { data: config } = await supabase
      .from('global_config')
      .select('config_value')
      .eq('config_key', 'ai_settings')
      .single();

    if (!config) {
      return res.status(404).json({ error: getMessage('config', 'aiSettingsNotFound', 'AI settings not found') });
    }

    const decryptedSettings = { ...config.config_value };
    
    if (decryptedSettings.geminiApiKey) {
      decryptedSettings.geminiApiKey = decryptApiKey(decryptedSettings.geminiApiKey);
    }

    res.json(decryptedSettings);
  } catch (error) {
    console.error('Get decrypted AI settings error:', error);
    next(error);
  }
});

module.exports = { configRoutes: router };
