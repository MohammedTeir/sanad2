-- Global Configuration Table for System Settings
-- Stores vulnerability weights, AI keys, security settings, and general config

CREATE TABLE IF NOT EXISTS global_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(255) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_global_config_key ON global_config(config_key);

-- Insert default configuration values
INSERT INTO global_config (config_key, config_value, description, is_encrypted) VALUES
    (
        'vulnerability_weights',
        '{
            "disabilityWeight": 25,
            "chronicDiseaseWeight": 15,
            "warInjuryWeight": 30,
            "pregnancyWeight": 10,
            "elderlyWeight": 20,
            "childrenWeight": 15,
            "femaleHeadWeight": 20
        }'::jsonb,
        'أوزان احتساب الهشاشة - Vulnerability calculation weights',
        false
    ),
    (
        'security_settings',
        '{
            "sessionTimeout": 30,
            "maxLoginAttempts": 5,
            "maintenanceMode": false,
            "passwordMinLength": 6,
            "requireSpecialChars": false
        }'::jsonb,
        'إعدادات الأمان - Security and authentication settings',
        false
    ),
    (
        'ai_settings',
        '{
            "geminiApiKey": "",
            "enabled": true,
            "model": "gemini-pro"
        }'::jsonb,
        'إعدادات الذكاء الاصطناعي - AI integration settings',
        true
    ),
    (
        'general_settings',
        '{
            "publicRegistrationEnabled": true,
            "autoSyncEnabled": true,
            "backupFrequency": "daily",
            "timezone": "Asia/Gaza",
            "language": "ar"
        }'::jsonb,
        'الإعدادات العامة - General system settings',
        false
    ),
    (
        'notification_settings',
        '{
            "emailEnabled": false,
            "smsEnabled": false,
            "pushEnabled": true
        }'::jsonb,
        'إعدادات الإشعارات - Notification settings',
        false
    )
ON CONFLICT (config_key) DO NOTHING;

-- Add comments to table and columns
COMMENT ON TABLE global_config IS 'إعدادات النظام العامة - Global system configuration stored as key-value pairs';
COMMENT ON COLUMN global_config.config_key IS 'مفتاح الإعداد - Unique identifier for the configuration';
COMMENT ON COLUMN global_config.config_value IS 'قيمة الإعداد (JSON) - Configuration value in JSON format';
COMMENT ON COLUMN global_config.is_encrypted IS 'هل القيمة مشفرة - Whether the value is encrypted (for sensitive data like API keys)';
