-- Unified Database Schema for Camp Management System
-- Combines schema definitions and security/performance extensions

-- Table 1: Camps
CREATE TABLE IF NOT EXISTS camps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),
    location_address TEXT,
    location_governorate VARCHAR(255) DEFAULT 'خان يونس',
    location_area VARCHAR(255) DEFAULT 'عبسان الكبيرة',
    manager_name VARCHAR(255),
    capacity INTEGER DEFAULT 0,
    current_population INTEGER DEFAULT 0,
    status VARCHAR(30) DEFAULT 'نشط' CHECK (status IN ('نشط', 'قيد الانتظار', 'ممتلئ')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2: Families
CREATE TABLE IF NOT EXISTS families (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camp_id UUID REFERENCES camps(id) ON DELETE SET NULL,
    -- 4-Part Name Structure (Migration 015)
    head_first_name VARCHAR(100), -- الاسم الأول - First name
    head_father_name VARCHAR(100), -- اسم الأب - Father's name
    head_grandfather_name VARCHAR(100), -- اسم الجد - Grandfather's name
    head_family_name VARCHAR(100), -- اسم العائلة - Family name
    head_of_family_name VARCHAR(255) NOT NULL, -- Full name (computed/backward compatibility)
    head_of_family_national_id VARCHAR(50) UNIQUE NOT NULL, -- Added: رقم الهوية (مطلوب، فريد)
    head_of_family_gender VARCHAR(20) CHECK (head_of_family_gender IN ('ذكر', 'أنثى')),
    head_of_family_date_of_birth DATE,
    head_of_family_age INTEGER,
    head_of_family_marital_status VARCHAR(30) CHECK (head_of_family_marital_status IN ('أعزب', 'متزوج', 'أرمل', 'مطلق', 'أسرة هشة')),
    head_of_family_widow_reason VARCHAR(30) CHECK (head_of_family_widow_reason IN ('شهيد', 'وفاة طبيعية', 'حادث', 'مرض', 'غير ذلك')),
    head_of_family_role VARCHAR(30) NULL CHECK (head_of_family_role IN ('أب', 'أم', 'زوجة')),
    head_of_family_is_working BOOLEAN DEFAULT FALSE,
    head_of_family_job VARCHAR(255),
    head_of_family_monthly_income NUMERIC(10, 2), -- Added: الدخل الشهري التقريبي
    head_of_family_monthly_income_range VARCHAR(20) CHECK (head_of_family_monthly_income_range IN ('بدون دخل', 'أقل من 100', '100-300', '300-500', 'أكثر من 500')), -- Added: نطاق الدخل الشهري
    head_of_family_phone_number VARCHAR(20),
    head_of_family_phone_secondary VARCHAR(20),
    head_of_family_disability_type VARCHAR(30) CHECK (head_of_family_disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى')),
    head_of_family_disability_severity VARCHAR(20) CHECK (head_of_family_disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية')), -- Added: درجة الإعاقة
    head_of_family_disability_details TEXT, -- Added: More detailed disability info
    head_of_family_chronic_disease_type VARCHAR(30) CHECK (head_of_family_chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى')), -- Expanded chronic disease types
    head_of_family_chronic_disease_details TEXT, -- Added: More detailed chronic disease info
    head_of_family_war_injury_type VARCHAR(30) CHECK (head_of_family_war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى')), -- Expanded war injury types
    head_of_family_war_injury_details TEXT, -- Added: More detailed injury info
    head_of_family_medical_followup_required BOOLEAN DEFAULT FALSE, -- Added: المتابعة الطبية: الحاجة
    head_of_family_medical_followup_frequency VARCHAR(50), -- Added: المتابعة الطبية: تكرارها
    head_of_family_medical_followup_details TEXT, -- Added: المتابعة الطبية: التفاصيل
    wife_name VARCHAR(255),
    wife_national_id VARCHAR(50),
    wife_date_of_birth DATE,
    wife_is_pregnant BOOLEAN DEFAULT FALSE,
    wife_pregnancy_month INTEGER,
    wife_pregnancy_special_needs BOOLEAN DEFAULT FALSE, -- Migration 016: Pregnancy special needs
    wife_pregnancy_followup_details TEXT, -- Migration 016: Pregnancy follow-up details
    wife_is_working BOOLEAN DEFAULT FALSE, -- Added: هل الزوجة تعمل
    wife_occupation VARCHAR(255), -- Added: مهنة الزوجة
    wife_medical_followup_required BOOLEAN DEFAULT FALSE, -- Added: المتابعة الطبية للزوجة
    wife_medical_followup_frequency VARCHAR(50), -- Added: تكرار المتابعة للزوجة
    wife_medical_followup_details TEXT, -- Added: تفاصيل المتابعة الطبية للزوجة
    wife_disability_type VARCHAR(20) CHECK (wife_disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى')),
    wife_disability_severity VARCHAR(20) CHECK (wife_disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية')), -- Added: درجة إعاقة الزوجة
    wife_disability_details TEXT, -- Added: More detailed disability info for wife
    wife_chronic_disease_type VARCHAR(20) CHECK (wife_chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى')), -- Expanded chronic disease types for wife
    wife_chronic_disease_details TEXT, -- Added: More detailed chronic disease info for wife
    wife_war_injury_type VARCHAR(20) CHECK (wife_war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى')), -- Expanded war injury types for wife
    wife_war_injury_details TEXT, -- Added: More detailed injury info for wife
    -- Husband fields (for female-headed households)
    husband_name VARCHAR(255),
    husband_national_id VARCHAR(50),
    husband_date_of_birth DATE,
    husband_age INTEGER,
    husband_is_working BOOLEAN DEFAULT FALSE,
    husband_occupation VARCHAR(255),
    husband_medical_followup_required BOOLEAN DEFAULT FALSE,
    husband_medical_followup_frequency VARCHAR(50),
    husband_medical_followup_details TEXT,
    husband_disability_type VARCHAR(20) CHECK (husband_disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى')),
    husband_disability_severity VARCHAR(20) CHECK (husband_disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية')),
    husband_disability_details TEXT,
    husband_chronic_disease_type VARCHAR(20) CHECK (husband_chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى')),
    husband_chronic_disease_details TEXT,
    husband_war_injury_type VARCHAR(20) CHECK (husband_war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى')),
    husband_war_injury_details TEXT,
    total_members_count INTEGER DEFAULT 0,
    male_count INTEGER DEFAULT 0,
    female_count INTEGER DEFAULT 0,
    child_count INTEGER DEFAULT 0, -- Added: تصنيف العمري: أطفال
    teenager_count INTEGER DEFAULT 0, -- Added: تصنيف العمري: مراهقين
    adult_count INTEGER DEFAULT 0, -- Added: تصنيف العمري: بالغين
    senior_count INTEGER DEFAULT 0, -- Added: تصنيف العمري: كبار سن
    disabled_count INTEGER DEFAULT 0, -- Added: إحصائيات الصحة: عدد المعاقين
    chronic_count INTEGER DEFAULT 0, -- Added: إحصائيات الصحة: عدد المصابين بأمراض مزمنة
    injured_count INTEGER DEFAULT 0, -- Added: إحصائيات الصحة: المصابين
    medical_followup_count INTEGER DEFAULT 0, -- Added: إحصائيات الصحة: عدد الذين يحتاجون متابعة طبية
    pregnant_women_count INTEGER DEFAULT 0, -- Added: إحصائيات الصحة: الحوامل
    -- 5.1 Original Housing (Before Displacement)
    original_address_governorate VARCHAR(100), -- المحافظة الأصلية
    original_address_region VARCHAR(100), -- المنطقة / المديرية
    original_address_details TEXT, -- العنوان بالتفصيل
    original_address_housing_type VARCHAR(30) CHECK (original_address_housing_type IN ('ملك', 'إيجار')), -- نوع السكن (ملك، إيجار)
    -- 5.2 Current Housing (In Camp)
    current_housing_type VARCHAR(30) CHECK (current_housing_type IN ('خيمة', 'بيت إسمنتي', 'شقة', 'أخرى')), -- نوع السكن الحالي
    current_housing_sharing_status VARCHAR(30) CHECK (current_housing_sharing_status IN ('سكن فردي', 'سكن مشترك')), -- Migration 016: Housing sharing status
    current_housing_detailed_type VARCHAR(50), -- Migration 016: tent_individual, tent_shared, house_full, house_room, apartment_furnished, apartment_unfurnished, caravan, other
    current_housing_furnished BOOLEAN, -- Migration 016: Furnished/unfurnished for apartments
    current_housing_camp_id UUID REFERENCES camps(id) ON DELETE SET NULL, -- المخيم الحالي
    current_housing_unit_number VARCHAR(20), -- رقم الخيمة/الوحدة
    current_housing_is_suitable_for_family_size BOOLEAN DEFAULT FALSE, -- هل السكن مناسب لعدد الأفراد؟
    current_housing_sanitary_facilities VARCHAR(50) CHECK (current_housing_sanitary_facilities IN ('نعم (دورة مياه خاصة)', 'لا (مرافق مشتركة)')), -- المرافق الصحية (private=نعم دورة مياه خاصة, shared=لا مرافق مشتركة)
    current_housing_sanitary_conditions TEXT, -- المرافق الصحية (legacy text field for backward compatibility)
    current_housing_water_source VARCHAR(30) CHECK (current_housing_water_source IN ('شبكة عامة', 'صهاريج', 'آبار', 'آخر')), -- مصدر المياه
    current_housing_electricity_access VARCHAR(30) CHECK (current_housing_electricity_access IN ('شبكة عامة', 'مولد', 'طاقة شمسية', 'لا يوجد', 'آخر')), -- مصدر الكهرباء
    -- 5.2 Geographic Location (الموقع الجغرافي)
    current_housing_governorate VARCHAR(100), -- المحافظة الحالية
    current_housing_region VARCHAR(100), -- المنطقة
    current_housing_landmark VARCHAR(255), -- أقرب معلم معروف
    -- 5.3 Refugee/Resident Outside Country (لاجئ / مقيم بالخارج)
    is_resident_abroad BOOLEAN DEFAULT FALSE, -- Migration 017: Flag for refugees/residents abroad
    refugee_resident_abroad_country VARCHAR(100), -- اسم الدولة
    refugee_resident_abroad_city VARCHAR(100), -- المدينة
    refugee_resident_abroad_residence_type VARCHAR(30) CHECK (refugee_resident_abroad_residence_type IN ('لاجئ', 'مقيم نظامي', 'أخرى')), -- نوع الإقامة
    vulnerability_score NUMERIC(5, 2) DEFAULT 0.00,
    vulnerability_priority VARCHAR(30) CHECK (vulnerability_priority IN ('عالي جداً', 'عالي', 'متوسط', 'منخفض')) DEFAULT 'منخفض', -- Auto-calculated priority level
    vulnerability_breakdown JSONB, -- Detailed breakdown of vulnerability score calculation
    vulnerability_reason TEXT,
    nomination_body VARCHAR(255),
    admin_notes TEXT,
    id_card_url TEXT, -- URL to ID card document
    medical_report_url TEXT, -- URL to medical report document
    signature_url TEXT, -- URL to signature document
    status VARCHAR(30) DEFAULT 'قيد الانتظار' CHECK (status IN ('قيد الانتظار', 'موافق', 'مرفوض')) NOT NULL, -- Approval status
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag
    deleted_at TIMESTAMP WITH TIME ZONE, -- When the record was soft deleted
    registered_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2a: Users (must exist before family_field_permissions and all other FK references)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY', 'DONOR_OBSERVER')),
    camp_id UUID REFERENCES camps(id) ON DELETE SET NULL,
    family_id UUID REFERENCES families(id) ON DELETE SET NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone_number VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 2b: Family Field Permissions (Controls which fields each family can edit in beneficiary portal)
CREATE TABLE IF NOT EXISTS family_field_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL, -- Snake_case field name (e.g., head_first_name, phone_number)
    is_editable BOOLEAN DEFAULT FALSE, -- Whether this field can be edited by the beneficiary
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who last modified the permission
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(family_id, field_name) -- One permission entry per field per family
);

-- Indexes for family_field_permissions
CREATE INDEX IF NOT EXISTS idx_family_permissions_family_id ON family_field_permissions(family_id);
CREATE INDEX IF NOT EXISTS idx_family_permissions_editable ON family_field_permissions(family_id, is_editable);

-- Comment for documentation
COMMENT ON TABLE family_field_permissions IS 'Controls which fields each family can edit in the beneficiary portal. Camp Managers toggle field-level permissions per family.';
COMMENT ON COLUMN family_field_permissions.field_name IS 'Field name in snake_case format (e.g., head_first_name, head_of_family_phone_number)';
COMMENT ON COLUMN family_field_permissions.is_editable IS 'Whether this field can be edited by the beneficiary (true=editable, false=read-only)';

-- Table 3: Individuals (Family Members)
CREATE TABLE IF NOT EXISTS individuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    -- 4-Part Name Structure (Migration 015)
    first_name VARCHAR(100), -- الاسم الأول - First name
    father_name VARCHAR(100), -- اسم الأب - Father's name
    grandfather_name VARCHAR(100), -- اسم الجد - Grandfather's name
    family_name VARCHAR(100), -- اسم العائلة - Family name
    name VARCHAR(255) NOT NULL, -- Full name (computed/backward compatibility)
    national_id VARCHAR(50), -- Added: رقم الهوية
    gender VARCHAR(20) CHECK (gender IN ('ذكر', 'أنثى')),
    date_of_birth DATE,
    age INTEGER,
    relation VARCHAR(30) CHECK (relation IN ('الابن', 'البنت', 'الجد', 'الجدة', 'الحفيد', 'الحفيدة', 'العم', 'العمة', 'الخال', 'الخالة', 'ابن الأخ', 'ابنة الأخ', 'ابن العم', 'أخرى')), -- Expanded relation types (removed الأب، الأم، الزوج، الزوجة، الأخ، الأخت as they are covered by head_of_family and wife fields)
    is_studying BOOLEAN DEFAULT FALSE, -- Added: هل يدرس
    is_working BOOLEAN DEFAULT FALSE, -- Added: هل يعمل/تعمل؟
    education_stage VARCHAR(30) CHECK (education_stage IN ('لا يدرس', 'ابتدائي', 'إعدادي/ثانوي', 'جامعي', 'أخرى')), -- Added: المرحلة الدراسية
    education_level VARCHAR(30) CHECK (education_level IN ('لا يدرس', 'ابتدائي', 'إعدادي/ثانوي', 'جامعي', 'أخرى')), -- Added: التعليم/العمل: المرحلة الدراسية للأطفال
    occupation VARCHAR(255), -- Added: التعليم/العمل: المهنة للبالغين
    phone_number VARCHAR(20),
    marital_status VARCHAR(30) CHECK (marital_status IN ('أعزب/عزباء', 'متزوج/ة', 'أرمل/ة', 'مطلق/ة', 'حالة خاصة')),
    disability_type VARCHAR(30) CHECK (disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى')),
    disability_severity VARCHAR(20) CHECK (disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية')), -- Added: درجة الإعاقة
    disability_details TEXT, -- Added: More detailed disability info
    chronic_disease_type VARCHAR(30) CHECK (chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى')), -- Expanded chronic disease types
    chronic_disease_details TEXT, -- Added: More detailed chronic disease info
    has_war_injury BOOLEAN DEFAULT FALSE,
    war_injury_type VARCHAR(30) CHECK (war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى')), -- Expanded war injury types
    war_injury_details TEXT, -- Added: More detailed injury info
    medical_followup_required BOOLEAN DEFAULT FALSE, -- Added: المتابعة الطبية: الحاجة
    medical_followup_frequency VARCHAR(50), -- Added: المتابعة الطبية: تكرارها
    medical_followup_details TEXT, -- Added: المتابعة الطبية: التفاصيل
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag
    deleted_at TIMESTAMP WITH TIME ZONE, -- When the record was soft deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 4: Aids (Types of Aid)
CREATE TABLE IF NOT EXISTS aids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL, -- Item name (Arabic primary)
    description TEXT,
    category VARCHAR(30) DEFAULT 'أخرى', -- No constraint to allow flexible custom categories
    unit VARCHAR(50) NOT NULL, -- Measurement unit (قطعة, كيلوغرام, etc.) - supports custom values
    camp_id UUID REFERENCES camps(id) ON DELETE SET NULL, -- NULL for global aid types
    is_active BOOLEAN DEFAULT true, -- Soft delete/deactivation
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag
    deleted_at TIMESTAMP WITH TIME ZONE, -- Soft delete timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster filtering by camp
CREATE INDEX IF NOT EXISTS idx_aids_camp_id ON aids(camp_id);

-- Index for filtering by category
CREATE INDEX IF NOT EXISTS idx_aids_category ON aids(category);

-- Index for filtering active aids
CREATE INDEX IF NOT EXISTS idx_aids_is_active ON aids(is_active);

-- Index for filtering deleted aids
CREATE INDEX IF NOT EXISTS idx_aids_is_deleted ON aids(is_deleted);

-- Table 5: Distributions (Distribution Campaigns)
CREATE TABLE IF NOT EXISTS distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_name VARCHAR(255) NOT NULL,
    aid_id UUID REFERENCES aids(id) ON DELETE SET NULL,
    camp_id UUID REFERENCES camps(id) ON DELETE SET NULL,
    distribution_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Changed from DATE to TIMESTAMP (Migration 045)
    status VARCHAR(30) DEFAULT 'قيد الانتظار' CHECK (status IN ('قيد الانتظار', 'نشط', 'مكتمل')),
    total_beneficiaries INTEGER DEFAULT 0,
    total_quantity_distributed NUMERIC(10, 2),
    created_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag (Migration 041)
    deleted_at TIMESTAMP WITH TIME ZONE, -- When soft deleted (Migration 041)
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who deleted (Migration 041)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 6: Distribution Records (Individual Distribution Records)
CREATE TABLE IF NOT EXISTS distribution_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    distribution_id UUID REFERENCES distributions(id) ON DELETE CASCADE,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    individual_id UUID REFERENCES individuals(id) ON DELETE SET NULL,
    quantity_received NUMERIC(10, 2),
    status VARCHAR(30) DEFAULT 'تم التسليم' CHECK (status IN ('تم التسليم', 'قيد الانتظار')),
    received_by VARCHAR(255),
    confirmation_code VARCHAR(50),
    delivery_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag (Migration 041)
    deleted_at TIMESTAMP WITH TIME ZONE, -- When soft deleted (Migration 041)
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who deleted (Migration 041)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 7: Inventory
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camp_id UUID REFERENCES camps(id) ON DELETE CASCADE,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(30) CHECK (category IN ('غذائية', 'غير غذائية', 'طبية', 'مأوى', 'مائية', 'أخرى')),
    quantity_available INTEGER DEFAULT 0,
    quantity_reserved INTEGER DEFAULT 0,
    quantity_allocated INTEGER DEFAULT 0,
    unit VARCHAR(20),
    expiry_date DATE,
    supplier VARCHAR(255),
    received_date DATE,
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag (Migration 041)
    deleted_at TIMESTAMP WITH TIME ZONE, -- When soft deleted (Migration 041)
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who deleted (Migration 041)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 9: Global Configuration (System Settings)
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
        '{"disabilityWeight": 25, "chronicDiseaseWeight": 15, "warInjuryWeight": 30, "pregnancyWeight": 10, "elderlyWeight": 20, "childrenWeight": 15, "femaleHeadWeight": 20}'::jsonb,
        'أوزان احتساب الهشاشة - Vulnerability calculation weights',
        false
    ),
    (
        'security_settings',
        '{"sessionTimeout": 30, "maxLoginAttempts": 5, "maintenanceMode": false, "passwordMinLength": 6, "requireSpecialChars": false}'::jsonb,
        'إعدادات الأمان - Security and authentication settings',
        false
    ),
    (
        'ai_settings',
        '{"geminiApiKey": "", "enabled": true, "model": "gemini-pro"}'::jsonb,
        'إعدادات الذكاء الاصطناعي - AI integration settings',
        true
    ),
    (
        'general_settings',
        '{"publicRegistrationEnabled": true, "autoSyncEnabled": true, "backupFrequency": "daily", "timezone": "Asia/Gaza", "language": "ar"}'::jsonb,
        'الإعدادات العامة - General system settings',
        false
    ),
    (
        'notification_settings',
        '{"emailEnabled": false, "smsEnabled": false, "pushEnabled": true}'::jsonb,
        'إعدادات الإشعارات - Notification settings',
        false
    )
ON CONFLICT (config_key) DO NOTHING;

-- Table 10: Roles & Permissions (Permissions mapping)
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role VARCHAR(50) NOT NULL CHECK (role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY', 'DONOR_OBSERVER')),
    resource VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 10: Import/Export Operations
CREATE TABLE IF NOT EXISTS import_export_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(30) CHECK (operation_type IN ('استيراد', 'تصدير')) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'families', 'individuals', 'camps', etc.
    file_name VARCHAR(255),
    file_url TEXT,
    status VARCHAR(30) DEFAULT 'قيد المعالجة' CHECK (status IN ('قيد المعالجة', 'مكتمل', 'فشل')),
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_log TEXT,
    initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Table 11: Backup/Sync Operations
CREATE TABLE IF NOT EXISTS backup_sync_operations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(30) CHECK (operation_type IN ('نسخة احتياطية', 'مزامنة', 'استعادة')) NOT NULL,
    scope VARCHAR(30) DEFAULT 'كامل' CHECK (scope IN ('كامل', 'جزئي', 'خاص بالمخيم')),
    camp_id UUID REFERENCES camps(id) ON DELETE SET NULL,
    name VARCHAR(255),
    file_name VARCHAR(255),
    file_url TEXT,
    status VARCHAR(30) DEFAULT 'قيد المعالجة' CHECK (status IN ('قيد المعالجة', 'مكتمل', 'فشل')),
    size_bytes BIGINT,
    initiated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 12: System Operations Log (Audit Trail)
CREATE TABLE IF NOT EXISTS system_operations_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    operation_type VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 10a: Inventory Items (must exist before aid_campaigns references it)
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camp_id UUID REFERENCES camps(id) ON DELETE SET NULL, -- Link to camp
    name VARCHAR(255) NOT NULL, -- Item name (Arabic primary)
    category VARCHAR(30) DEFAULT 'أخرى', -- No constraint to allow flexible custom categories
    unit VARCHAR(50) NOT NULL, -- Measurement unit (قطعة, كيلوغرام, etc.) - supports custom values
    quantity_available NUMERIC(10, 2) DEFAULT 0,
    quantity_reserved NUMERIC(10, 2) DEFAULT 0, -- Quantity reserved for campaigns
    min_stock NUMERIC(10, 2) DEFAULT 0, -- Minimum stock threshold (reorder point)
    max_stock NUMERIC(10, 2) DEFAULT 0, -- Maximum stock capacity
    min_alert_threshold NUMERIC(10, 2) DEFAULT 0, -- Threshold for low stock alerts
    expiry_date DATE, -- Expiry date for perishable items
    donor VARCHAR(255), -- Donor organization
    received_date DATE DEFAULT CURRENT_DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true, -- Soft delete/deactivation
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag
    deleted_at TIMESTAMP WITH TIME ZONE, -- When the record was soft deleted
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_items_camp_id ON inventory_items(camp_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_active ON inventory_items(is_active);
CREATE INDEX IF NOT EXISTS idx_inventory_items_low_stock ON inventory_items(quantity_available, min_stock) WHERE quantity_available <= min_stock;

-- Table 10b: Aid Campaigns
CREATE TABLE IF NOT EXISTS aid_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    camp_id UUID REFERENCES camps(id) ON DELETE SET NULL, -- Camp association for CAMP_MANAGER
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(30) CHECK (status IN ('مخططة', 'نشطة', 'مكتملة', 'ملغاة')) DEFAULT 'مخططة',
    aid_type VARCHAR(255) NOT NULL,
    aid_category VARCHAR(30) DEFAULT 'أخرى', -- No constraint to allow flexible categories from inventory items
    target_families UUID[], -- Array of family IDs
    distributed_to UUID[], -- Array of family IDs that received aid
    coordinator_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL, -- Link to specific inventory item
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag (Migration 040)
    deleted_at TIMESTAMP WITH TIME ZONE, -- When the campaign was soft deleted (Migration 040)
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who deleted the campaign (Migration 040)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster filtering by camp
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_camp_id ON aid_campaigns(camp_id);

-- Index for faster joins and lookups by inventory item
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_inventory_item_id ON aid_campaigns(inventory_item_id);

-- Table 11: Aid Distributions (Transactions)
CREATE TABLE IF NOT EXISTS aid_distributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES aid_campaigns(id) ON DELETE SET NULL,
    aid_type VARCHAR(255) NOT NULL,
    aid_category VARCHAR(30) DEFAULT 'أخرى', -- No constraint to allow flexible categories
    quantity NUMERIC(10, 2) NOT NULL,
    distribution_date TIMESTAMP WITH TIME ZONE NOT NULL, -- Changed from DATE to TIMESTAMP (Migration 045)
    distributed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    received_by_signature TEXT, -- For signature verification
    received_by_biometric TEXT, -- For biometric verification
    received_by_photo_url TEXT, -- For photo verification
    otp_code VARCHAR(10), -- For OTP verification
    duplicate_check_passed BOOLEAN DEFAULT TRUE, -- Track if duplicate check passed
    status VARCHAR(30) CHECK (status IN ('تم التسليم', 'قيد الانتظار')) DEFAULT 'قيد الانتظار',
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag (Migration 041)
    deleted_at TIMESTAMP WITH TIME ZONE, -- When soft deleted (Migration 041)
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who deleted (Migration 041)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 13: Inventory Transactions
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    transaction_type VARCHAR(10) CHECK (transaction_type IN ('وارد', 'صادر')) NOT NULL, -- in for incoming, out for outgoing
    quantity NUMERIC(10, 2) NOT NULL,
    related_to VARCHAR(20) CHECK (related_to IN ('شراء', 'تبرع', 'توزيع', 'تحويل', 'تعديل', 'تلف')) NOT NULL,
    related_id UUID, -- ID of related entity (campaign, transfer, etc.)
    notes TEXT,
    processed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Added by migration 044a
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag (Migration 041)
    deleted_at TIMESTAMP WITH TIME ZONE, -- When soft deleted (Migration 041)
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who deleted (Migration 041)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 14: Inventory Audits
CREATE TABLE IF NOT EXISTS inventory_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
    physical_count NUMERIC(10, 2) NOT NULL, -- Actual count during audit
    system_count NUMERIC(10, 2) NOT NULL, -- Count in system before audit
    difference NUMERIC(10, 2) NOT NULL, -- Difference (physical - system)
    reason VARCHAR(20) CHECK (reason IN ('نقص', 'فائض', 'سرقة', 'تلف', 'خطأ عد', 'أخرى')) NOT NULL,
    notes TEXT,
    audited_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    audited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE, -- Soft delete flag (Migration 041)
    deleted_at TIMESTAMP WITH TIME ZONE, -- When soft deleted (Migration 041)
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL, -- User who deleted (Migration 041)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 15: Transfer Requests
CREATE TABLE IF NOT EXISTS transfer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dp_id UUID REFERENCES families(id) ON DELETE CASCADE, -- Reference to the family requesting transfer
    dp_name VARCHAR(255) NOT NULL, -- Name of the head of family (denormalized for performance)
    from_camp_id UUID REFERENCES camps(id) ON DELETE SET NULL, -- Source camp
    to_camp_id UUID REFERENCES camps(id) ON DELETE SET NULL, -- Destination camp
    status VARCHAR(20) DEFAULT 'قيد الانتظار' CHECK (status IN ('قيد الانتظار', 'موافق', 'مرفوض', 'تمت المعالجة')) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- Date of request
    reason TEXT, -- Reason for transfer request
    notes TEXT, -- Additional notes
    requested_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who submitted the request
    reviewed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- User who reviewed the request
    reviewed_at TIMESTAMP WITH TIME ZONE, -- When the request was reviewed
    resolution_notes TEXT, -- Notes about the decision
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 16: Soft Deleted Records (for tracking soft deletes)
CREATE TABLE IF NOT EXISTS soft_deletes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    deleted_data JSONB NOT NULL, -- Stores the full record data at time of deletion
    deleted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    restored_at TIMESTAMP WITH TIME ZONE,
    restoration_reason TEXT
);

-- Table 17: Security Logs
CREATE TABLE IF NOT EXISTS security_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- Type of security event
    severity VARCHAR(20) CHECK (severity IN ('منخفض', 'متوسط', 'عالي', 'حرج')) DEFAULT 'متوسط',
    description TEXT NOT NULL,
    ip_address INET, -- Store IP address
    user_agent TEXT, -- Store user agent string
    details JSONB, -- Additional event-specific details
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table 18: Failed Login Attempts
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255),
    ip_address INET NOT NULL,
    user_agent TEXT,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    blocked_until TIMESTAMP WITH TIME ZONE -- When the IP/user is unblocked
);

-- Table 19: Encryption key management table
CREATE TABLE IF NOT EXISTS encryption_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key_name VARCHAR(100) UNIQUE NOT NULL,
    encrypted_key BYTEA NOT NULL, -- Encrypted encryption key
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- ============================================
-- Table 20: Complaints/Feedback (Migration 032)
-- ============================================
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'عام',
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'جديد' CHECK (status IN ('جديد', 'قيد المراجعة', 'تم الرد', 'مغلق')),
    response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    restoration_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table 21: Emergency Reports (Migration 032)
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    emergency_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    urgency VARCHAR(20) CHECK (urgency IN ('عاجل جداً', 'عاجل', 'عادي')),
    location TEXT,
    status VARCHAR(30) DEFAULT 'جديد' CHECK (status IN ('جديد', 'قيد المعالجة', 'تم التحويل', 'تم الحل', 'مرفوض')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID REFERENCES users(id) ON DELETE SET NULL,
    restoration_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table 22: Special Assistance Requests
-- ============================================
CREATE TABLE IF NOT EXISTS special_assistance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    assistance_type VARCHAR(50) NOT NULL CHECK (assistance_type IN ('طبية', 'مالية', 'سكنية', 'تعليمية', 'أخرى')),
    description TEXT NOT NULL,
    urgency VARCHAR(20) CHECK (urgency IN ('عاجل جداً', 'عاجل', 'عادي')),
    status VARCHAR(30) DEFAULT 'جديد' CHECK (status IN ('جديد', 'قيد المراجعة', 'تمت الموافقة', 'مرفوض', 'تم التنفيذ')),
    response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table 23: Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    -- Notification type (Arabic values from migrations 038, 039, 040)
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        -- Family-facing notifications
        'توزيع', 
        'شكوى_رد', 
        'انتقال_تحديث', 
        'نظام',
        'تحديث_تذكير',
        'توزيع_جاهز',
        'توزيع_تذكير',
        'حملة_حالة',
        'حملة_قرب_انتهاء',
        'مساعدة_خاصة_رد',
        'أسرة_موافقة',
        'أسرة_حالة',
        'بيانات_تحديث_مطلوب',
        'تأكيد_مطلوب',
        -- Staff-facing notifications
        'شكوى_جديدة',
        'طوارئ_بلاغ',
        'انتقال_طلب_جديد',
        'مساعدة_خاصة_طلب_جديد',
        'توزيع_حملة_جديدة',
        'مخزون_منخفض_تنبيه',
        'مخزون_جديد_وصل',
        'صلاحية_انتهاء_تنبيه',
        -- System notifications
        'أمني_تنبيه',
        'دخول_فاشل_تنبيه',
        'صيانة'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    -- Enhanced fields from migration 040
    priority VARCHAR(20) DEFAULT 'عادي' CHECK (priority IN ('منخفض', 'عادي', 'عالي', 'عاجل جداً')),
    channel VARCHAR(50) DEFAULT 'تطبيق' CHECK (channel IN ('تطبيق', 'رسالة_نصية', 'بريد_إلكتروني', 'إشعار_دفع')),
    is_processed BOOLEAN DEFAULT TRUE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_families_camp_id ON families(camp_id);
CREATE INDEX IF NOT EXISTS idx_individuals_family_id ON individuals(family_id);
CREATE INDEX IF NOT EXISTS idx_distributions_camp_id ON distributions(camp_id);
CREATE INDEX IF NOT EXISTS idx_inventory_camp_id ON inventory(camp_id);
CREATE INDEX IF NOT EXISTS idx_users_camp_id ON users(camp_id);
CREATE INDEX IF NOT EXISTS idx_system_operations_user_id ON system_operations_log(user_id);
CREATE INDEX IF NOT EXISTS idx_system_operations_created_at ON system_operations_log(created_at);
CREATE INDEX IF NOT EXISTS idx_special_assistance_family_id ON special_assistance_requests(family_id);
CREATE INDEX IF NOT EXISTS idx_special_assistance_status ON special_assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_special_assistance_created_at ON special_assistance_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_family_id ON notifications(family_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);
-- Additional indexes from migration 040
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity_type ON notifications(related_entity_type);
CREATE INDEX IF NOT EXISTS idx_notifications_family_unread ON notifications(family_id, is_read) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_priority_created ON notifications(priority DESC, created_at DESC);

-- Triggers to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables that have updated_at columns
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_camps_updated_at'
  ) THEN 
    CREATE TRIGGER update_camps_updated_at 
    BEFORE UPDATE ON camps 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF;
END $$;

-- Create trigger for families table (uses last_updated instead of updated_at)
CREATE OR REPLACE FUNCTION update_families_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_families_last_updated'
  ) THEN
    CREATE TRIGGER update_families_last_updated
    BEFORE UPDATE ON families
    FOR EACH ROW EXECUTE FUNCTION update_families_last_updated();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_individuals_updated_at'
  ) THEN
    CREATE TRIGGER update_individuals_updated_at
    BEFORE UPDATE ON individuals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_aids_updated_at'
  ) THEN 
    CREATE TRIGGER update_aids_updated_at 
    BEFORE UPDATE ON aids 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_distributions_updated_at'
  ) THEN 
    CREATE TRIGGER update_distributions_updated_at 
    BEFORE UPDATE ON distributions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_distribution_records_updated_at'
  ) THEN 
    CREATE TRIGGER update_distribution_records_updated_at 
    BEFORE UPDATE ON distribution_records 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_inventory_updated_at'
  ) THEN 
    CREATE TRIGGER update_inventory_updated_at 
    BEFORE UPDATE ON inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_users_updated_at'
  ) THEN 
    CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_permissions_updated_at'
  ) THEN 
    CREATE TRIGGER update_permissions_updated_at 
    BEFORE UPDATE ON permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_import_export_operations_updated_at'
  ) THEN 
    CREATE TRIGGER update_import_export_operations_updated_at 
    BEFORE UPDATE ON import_export_operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_backup_sync_operations_updated_at'
  ) THEN 
    CREATE TRIGGER update_backup_sync_operations_updated_at 
    BEFORE UPDATE ON backup_sync_operations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_system_operations_log_updated_at'
  ) THEN 
    CREATE TRIGGER update_system_operations_log_updated_at 
    BEFORE UPDATE ON system_operations_log 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_aid_campaigns_updated_at'
  ) THEN 
    CREATE TRIGGER update_aid_campaigns_updated_at 
    BEFORE UPDATE ON aid_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_aid_distributions_updated_at'
  ) THEN 
    CREATE TRIGGER update_aid_distributions_updated_at 
    BEFORE UPDATE ON aid_distributions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_inventory_items_updated_at'
  ) THEN 
    CREATE TRIGGER update_inventory_items_updated_at 
    BEFORE UPDATE ON inventory_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_inventory_transactions_updated_at'
  ) THEN 
    CREATE TRIGGER update_inventory_transactions_updated_at 
    BEFORE UPDATE ON inventory_transactions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_inventory_audits_updated_at'
  ) THEN 
    CREATE TRIGGER update_inventory_audits_updated_at 
    BEFORE UPDATE ON inventory_audits 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_transfer_requests_updated_at'
  ) THEN 
    CREATE TRIGGER update_transfer_requests_updated_at 
    BEFORE UPDATE ON transfer_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_soft_deletes_updated_at'
  ) THEN 
    CREATE TRIGGER update_soft_deletes_updated_at 
    BEFORE UPDATE ON soft_deletes 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_security_logs_updated_at'
  ) THEN 
    CREATE TRIGGER update_security_logs_updated_at 
    BEFORE UPDATE ON security_logs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_failed_login_attempts_updated_at'
  ) THEN 
    CREATE TRIGGER update_failed_login_attempts_updated_at 
    BEFORE UPDATE ON failed_login_attempts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column(); 
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_encryption_keys_updated_at'
  ) THEN
    CREATE TRIGGER update_encryption_keys_updated_at
    BEFORE UPDATE ON encryption_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Migration 032 tables triggers
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_complaints_updated_at'
  ) THEN
    CREATE TRIGGER update_complaints_updated_at
    BEFORE UPDATE ON complaints
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_emergency_reports_updated_at'
  ) THEN
    CREATE TRIGGER update_emergency_reports_updated_at
    BEFORE UPDATE ON emergency_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_special_assistance_requests_updated_at'
  ) THEN
    CREATE TRIGGER update_special_assistance_requests_updated_at
    BEFORE UPDATE ON special_assistance_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Ensure notifications table has updated_at column for the trigger
  ALTER TABLE notifications ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_notifications_updated_at'
  ) THEN
    CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Comments for notifications table
COMMENT ON TABLE notifications IS 'إشعارات النظام للمستفيدين حول التوزيعات والشكاوى والانتقالات وغيرها';
COMMENT ON COLUMN notifications.notification_type IS 'نوع الإشعار: توزيع، شكوى_رد، انتقال_تحديث، نظام، وغيرها (قيم عربية)';
COMMENT ON COLUMN notifications.priority IS 'أولوية الإشعار: منخفض، عادي، عالي، عاجل جداً';
COMMENT ON COLUMN notifications.channel IS 'قناة الإشعار: تطبيق، رسالة_نصية، بريد_إلكتروني، إشعار_دفع';
COMMENT ON COLUMN notifications.related_entity_id IS 'معرف الكيان المرتبط (معرف الشكوى، معرف الانتقال، معرف التوزيع، إلخ)';
COMMENT ON COLUMN notifications.related_entity_type IS 'نوع الكيان المرتبط: شكوى، انتقال، توزيع، إلخ';

-- Performance indexes for families table
CREATE INDEX IF NOT EXISTS idx_families_national_id ON families(head_of_family_national_id);
CREATE INDEX IF NOT EXISTS idx_families_name ON families USING gin(to_tsvector('arabic', head_of_family_name));
CREATE INDEX IF NOT EXISTS idx_families_vulnerability_score ON families(vulnerability_score DESC);
CREATE INDEX IF NOT EXISTS idx_families_camp_id ON families(camp_id);
CREATE INDEX IF NOT EXISTS idx_families_disability_type ON families(head_of_family_disability_type);
CREATE INDEX IF NOT EXISTS idx_families_disability_severity ON families(head_of_family_disability_severity); -- Added: درجة الإعاقة
CREATE INDEX IF NOT EXISTS idx_families_chronic_disease ON families(head_of_family_chronic_disease_type);
CREATE INDEX IF NOT EXISTS idx_families_income_range ON families(head_of_family_monthly_income_range); -- Added: نطاق الدخل
CREATE INDEX IF NOT EXISTS idx_families_registered_date ON families(registered_date DESC);
CREATE INDEX IF NOT EXISTS idx_families_last_updated ON families(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_families_is_deleted ON families(is_deleted);
CREATE INDEX IF NOT EXISTS idx_families_is_resident_abroad ON families(is_resident_abroad);
CREATE INDEX IF NOT EXISTS idx_families_housing_sharing ON families(current_housing_sharing_status);
CREATE INDEX IF NOT EXISTS idx_families_housing_detailed_type ON families(current_housing_detailed_type);

-- Performance indexes for individuals table
CREATE INDEX IF NOT EXISTS idx_individuals_family_id ON individuals(family_id);
CREATE INDEX IF NOT EXISTS idx_individuals_name ON individuals USING gin(to_tsvector('arabic', name));
CREATE INDEX IF NOT EXISTS idx_individuals_disability_type ON individuals(disability_type);
CREATE INDEX IF NOT EXISTS idx_individuals_disability_severity ON individuals(disability_severity); -- Added: درجة الإعاقة
CREATE INDEX IF NOT EXISTS idx_individuals_chronic_disease ON individuals(chronic_disease_type);
CREATE INDEX IF NOT EXISTS idx_individuals_is_studying ON individuals(is_studying); -- Added: هل يدرس
CREATE INDEX IF NOT EXISTS idx_individuals_education_stage ON individuals(education_stage); -- Added: المرحلة الدراسية
CREATE INDEX IF NOT EXISTS idx_individuals_is_deleted ON individuals(is_deleted);

-- Performance indexes for inventory_items table
CREATE INDEX IF NOT EXISTS idx_inventory_items_camp_id ON inventory_items(camp_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_quantity ON inventory_items(quantity_available);
CREATE INDEX IF NOT EXISTS idx_inventory_items_is_deleted ON inventory_items(is_deleted);

-- Performance indexes for aid_distributions table
CREATE INDEX IF NOT EXISTS idx_aid_distributions_family_id ON aid_distributions(family_id);
CREATE INDEX IF NOT EXISTS idx_aid_distributions_campaign_id ON aid_distributions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_aid_distributions_date ON aid_distributions(distribution_date DESC);
CREATE INDEX IF NOT EXISTS idx_aid_distributions_aid_type ON aid_distributions(aid_type);

-- Performance indexes for camps table
CREATE INDEX IF NOT EXISTS idx_camps_location_gov ON camps(location_governorate);
CREATE INDEX IF NOT EXISTS idx_camps_status ON camps(status);

-- Performance indexes for Migration 032 tables
CREATE INDEX IF NOT EXISTS idx_complaints_family_id ON complaints(family_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_reports_family_id ON emergency_reports(family_id);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_urgency ON emergency_reports(urgency);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_created_at ON emergency_reports(created_at DESC);

-- Filter indexes for dashboard queries
CREATE INDEX IF NOT EXISTS idx_families_camp_vulnerability ON families(camp_id, vulnerability_score DESC);
CREATE INDEX IF NOT EXISTS idx_families_camp_disability ON families(camp_id, head_of_family_disability_type);
CREATE INDEX IF NOT EXISTS idx_families_camp_chronic ON families(camp_id, head_of_family_chronic_disease_type);
CREATE INDEX IF NOT EXISTS idx_families_camp_pregnant ON families(camp_id, wife_is_pregnant);
CREATE INDEX IF NOT EXISTS idx_families_camp_children ON families(camp_id, child_count);
CREATE INDEX IF NOT EXISTS idx_families_camp_seniors ON families(camp_id, senior_count);
CREATE INDEX IF NOT EXISTS idx_families_camp_disabled ON families(camp_id, disabled_count);
CREATE INDEX IF NOT EXISTS idx_families_camp_injured ON families(camp_id, injured_count);
CREATE INDEX IF NOT EXISTS idx_families_camp_pregnant_women ON families(camp_id, pregnant_women_count);

-- Indexes for wife fields (query optimization)
CREATE INDEX IF NOT EXISTS idx_families_wife_pregnant ON families(wife_is_pregnant) WHERE wife_is_pregnant = true;
CREATE INDEX IF NOT EXISTS idx_families_wife_pregnant_special_needs ON families(wife_pregnancy_special_needs) WHERE wife_pregnancy_special_needs = true;
CREATE INDEX IF NOT EXISTS idx_families_wife_working ON families(wife_is_working) WHERE wife_is_working = true;
CREATE INDEX IF NOT EXISTS idx_families_wife_disability ON families(wife_disability_type) WHERE wife_disability_type != 'لا يوجد';
CREATE INDEX IF NOT EXISTS idx_families_wife_chronic ON families(wife_chronic_disease_type) WHERE wife_chronic_disease_type != 'لا يوجد';
CREATE INDEX IF NOT EXISTS idx_families_wife_war_injury ON families(wife_war_injury_type) WHERE wife_war_injury_type != 'لا يوجد';

-- Indexes for husband fields (query optimization for female-headed households)
CREATE INDEX IF NOT EXISTS idx_families_husband_working ON families(husband_is_working) WHERE husband_is_working = true;
CREATE INDEX IF NOT EXISTS idx_families_husband_disability ON families(husband_disability_type) WHERE husband_disability_type != 'لا يوجد';
CREATE INDEX IF NOT EXISTS idx_families_husband_chronic ON families(husband_chronic_disease_type) WHERE husband_chronic_disease_type != 'لا يوجد';
CREATE INDEX IF NOT EXISTS idx_families_husband_war_injury ON families(husband_war_injury_type) WHERE husband_war_injury_type != 'لا يوجد';
CREATE INDEX IF NOT EXISTS idx_families_husband_medical_followup ON families(husband_medical_followup_required) WHERE husband_medical_followup_required = true;

-- Enhanced Database Schema with Security and Performance Features

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE camps ENABLE ROW LEVEL SECURITY;
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE individuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE aids ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE distribution_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_export_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_sync_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_operations_log ENABLE ROW LEVEL SECURITY;

-- Enable RLS on new tables
ALTER TABLE aid_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE aid_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE soft_deletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on Migration 032 tables
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "System admins can manage all users" ON public.users;
CREATE POLICY "System admins can manage all users" ON users
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'SYSTEM_ADMIN'
  ));

-- Create policies for camps table
DROP POLICY IF EXISTS "Camp managers can access assigned camp" ON public.camps;
CREATE POLICY "Camp managers can access assigned camp" ON camps
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'CAMP_MANAGER' OR users.role = 'SYSTEM_ADMIN')
      AND (users.camp_id = id OR users.role = 'SYSTEM_ADMIN')
    )
  );

-- Create policies for families table
DROP POLICY IF EXISTS "Camp managers can access families in their camp" ON public.families;
CREATE POLICY "Camp managers can access families in their camp" ON families
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'CAMP_MANAGER' OR users.role = 'SYSTEM_ADMIN')
      AND (users.camp_id = camp_id OR users.role = 'SYSTEM_ADMIN')
    )
  );

DROP POLICY IF EXISTS "Field officers can access families in their camp" ON public.families;
CREATE POLICY "Field officers can access families in their camp" ON families
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'FIELD_OFFICER'
      AND users.camp_id = camp_id
    )
  );

-- Create policies for inventory table
DROP POLICY IF EXISTS "Camp managers can access inventory for their camp" ON public.inventory;
CREATE POLICY "Camp managers can access inventory for their camp" ON inventory
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'CAMP_MANAGER' OR users.role = 'SYSTEM_ADMIN')
      AND (users.camp_id = camp_id OR users.role = 'SYSTEM_ADMIN')
    )
  );

-- Create policies for aid_campaigns table
DROP POLICY IF EXISTS "Users can access campaigns for their camp" ON public.aid_campaigns;
CREATE POLICY "Users can access campaigns for their camp" ON aid_campaigns
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'CAMP_MANAGER' OR users.role = 'SYSTEM_ADMIN')
      AND (users.camp_id IS NULL OR users.role = 'SYSTEM_ADMIN')
    )
  );

-- Create policies for aid_distributions table
DROP POLICY IF EXISTS "Users can access distributions for their camp" ON public.aid_distributions;
CREATE POLICY "Users can access distributions for their camp" ON aid_distributions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users, families
      WHERE users.id = auth.uid()
      AND families.id = family_id
      AND (users.role = 'CAMP_MANAGER' OR users.role = 'SYSTEM_ADMIN')
      AND (users.camp_id = families.camp_id OR users.role = 'SYSTEM_ADMIN')
    )
  );

-- Create policies for inventory_items table
DROP POLICY IF EXISTS "Users can access inventory items for their camp" ON public.inventory_items;
CREATE POLICY "Users can access inventory items for their camp" ON inventory_items
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'CAMP_MANAGER' OR users.role = 'SYSTEM_ADMIN')
      AND users.role != 'FIELD_OFFICER'
    )
  );

-- Create policies for system operations log
DROP POLICY IF EXISTS "System admins can view all logs" ON public.system_operations_log;
CREATE POLICY "System admins can view all logs" ON system_operations_log
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SYSTEM_ADMIN'
    )
  );

-- Create policies for backup_sync_operations
DROP POLICY IF EXISTS "SYSTEM_ADMIN can manage all backups" ON public.backup_sync_operations;
CREATE POLICY "SYSTEM_ADMIN can manage all backups" ON backup_sync_operations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SYSTEM_ADMIN'
    )
  );

DROP POLICY IF EXISTS "CAMP_MANAGER can manage camp backups" ON public.backup_sync_operations;
CREATE POLICY "CAMP_MANAGER can manage camp backups" ON backup_sync_operations
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'CAMP_MANAGER'
      AND (camp_id IS NULL OR camp_id = users.camp_id)
    )
  );

-- Create policies for security logs
DROP POLICY IF EXISTS "System admins can view security logs" ON public.security_logs;
CREATE POLICY "System admins can view security logs" ON security_logs
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'SYSTEM_ADMIN'
    )
  );

-- Comprehensive Performance Indexes for All Tables

-- Indexes for camps table
CREATE INDEX IF NOT EXISTS idx_camps_manager ON camps(manager_name);
CREATE INDEX IF NOT EXISTS idx_camps_location ON camps(location_lat, location_lng);
CREATE INDEX IF NOT EXISTS idx_camps_status ON camps(status);
CREATE INDEX IF NOT EXISTS idx_camps_capacity ON camps(capacity);
CREATE INDEX IF NOT EXISTS idx_camps_current_population ON camps(current_population);

-- Indexes for families table
CREATE INDEX IF NOT EXISTS idx_families_camp_vulnerability ON families(camp_id, vulnerability_score DESC);
CREATE INDEX IF NOT EXISTS idx_families_last_updated ON families(last_updated);
CREATE INDEX IF NOT EXISTS idx_families_head_name ON families(head_of_family_name);
CREATE INDEX IF NOT EXISTS idx_families_national_id ON families(head_of_family_national_id);
CREATE INDEX IF NOT EXISTS idx_families_vulnerability_score ON families(vulnerability_score);
CREATE INDEX IF NOT EXISTS idx_families_vulnerability_priority ON families(vulnerability_priority);
CREATE INDEX IF NOT EXISTS idx_families_registration_date ON families(registered_date);
CREATE INDEX IF NOT EXISTS idx_families_current_housing_camp ON families(current_housing_camp_id);
CREATE INDEX IF NOT EXISTS idx_families_disability_severity ON families(head_of_family_disability_severity); -- Added: درجة الإعاقة
CREATE INDEX IF NOT EXISTS idx_families_income_range ON families(head_of_family_monthly_income_range); -- Added: نطاق الدخل
-- Migration 015: 4-Part Name Indexes
CREATE INDEX IF NOT EXISTS idx_families_head_first_name ON families(head_first_name);
CREATE INDEX IF NOT EXISTS idx_families_head_father_name ON families(head_father_name);
CREATE INDEX IF NOT EXISTS idx_families_head_family_name ON families(head_family_name);
-- Migration 016: New Field Indexes
CREATE INDEX IF NOT EXISTS idx_families_housing_sharing ON families(current_housing_sharing_status);
CREATE INDEX IF NOT EXISTS idx_families_wife_pregnant_special_needs ON families(wife_pregnancy_special_needs);

-- Indexes for individuals table
CREATE INDEX IF NOT EXISTS idx_individuals_family_id ON individuals(family_id);
CREATE INDEX IF NOT EXISTS idx_individuals_name ON individuals(name);
CREATE INDEX IF NOT EXISTS idx_individuals_national_id ON individuals(national_id);
CREATE INDEX IF NOT EXISTS idx_individuals_relation ON individuals(relation);
CREATE INDEX IF NOT EXISTS idx_individuals_gender ON individuals(gender);
CREATE INDEX IF NOT EXISTS idx_individuals_age ON individuals(age);
CREATE INDEX IF NOT EXISTS idx_individuals_date_of_birth ON individuals(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_individuals_disability_type ON individuals(disability_type);
CREATE INDEX IF NOT EXISTS idx_individuals_disability_severity ON individuals(disability_severity); -- Added: درجة الإعاقة
CREATE INDEX IF NOT EXISTS idx_individuals_chronic_disease_type ON individuals(chronic_disease_type);
CREATE INDEX IF NOT EXISTS idx_individuals_war_injury_type ON individuals(war_injury_type);
CREATE INDEX IF NOT EXISTS idx_individuals_is_studying ON individuals(is_studying); -- Added: هل يدرس
CREATE INDEX IF NOT EXISTS idx_individuals_education_stage ON individuals(education_stage); -- Added: المرحلة الدراسية
-- Migration 015: 4-Part Name Indexes
CREATE INDEX IF NOT EXISTS idx_individuals_first_name ON individuals(first_name);
CREATE INDEX IF NOT EXISTS idx_individuals_father_name ON individuals(father_name);
CREATE INDEX IF NOT EXISTS idx_individuals_family_name ON individuals(family_name);
-- Migration 016: New Field Indexes
CREATE INDEX IF NOT EXISTS idx_individuals_is_working ON individuals(is_working);
CREATE INDEX IF NOT EXISTS idx_individuals_marital_status ON individuals(marital_status);

-- Indexes for aids table
CREATE INDEX IF NOT EXISTS idx_aids_category ON aids(category);
CREATE INDEX IF NOT EXISTS idx_aids_name ON aids(name);

-- Indexes for distributions table
CREATE INDEX IF NOT EXISTS idx_distributions_camp_date ON distributions(camp_id, distribution_date DESC);
CREATE INDEX IF NOT EXISTS idx_distributions_aid_id ON distributions(aid_id);
CREATE INDEX IF NOT EXISTS idx_distributions_campaign_name ON distributions(campaign_name);
CREATE INDEX IF NOT EXISTS idx_distributions_status ON distributions(status);
CREATE INDEX IF NOT EXISTS idx_distributions_created_by ON distributions(created_by);

-- Indexes for distribution_records table
CREATE INDEX IF NOT EXISTS idx_distribution_records_distribution_id ON distribution_records(distribution_id);
CREATE INDEX IF NOT EXISTS idx_distribution_records_family_id ON distribution_records(family_id);
CREATE INDEX IF NOT EXISTS idx_distribution_records_individual_id ON distribution_records(individual_id);
CREATE INDEX IF NOT EXISTS idx_distribution_records_status ON distribution_records(status);
CREATE INDEX IF NOT EXISTS idx_distribution_records_delivery_date ON distribution_records(delivery_date);

-- Indexes for inventory table
CREATE INDEX IF NOT EXISTS idx_inventory_camp_item ON inventory(camp_id, item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON inventory(item_name);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity_available ON inventory(quantity_available);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity_reserved ON inventory(quantity_reserved);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_camp_role ON users(camp_id, role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_family_id ON users(family_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login);

-- Indexes for permissions table
CREATE INDEX IF NOT EXISTS idx_permissions_role ON permissions(role);
CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON permissions(resource, action);

-- Indexes for import_export_operations table
CREATE INDEX IF NOT EXISTS idx_import_export_entity_type ON import_export_operations(entity_type);
CREATE INDEX IF NOT EXISTS idx_import_export_operation_type ON import_export_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_import_export_status ON import_export_operations(status);
CREATE INDEX IF NOT EXISTS idx_import_export_initiated_by ON import_export_operations(initiated_by);
CREATE INDEX IF NOT EXISTS idx_import_export_started_at ON import_export_operations(started_at);

-- Indexes for backup_sync_operations table
CREATE INDEX IF NOT EXISTS idx_backup_sync_operation_type ON backup_sync_operations(operation_type);
CREATE INDEX IF NOT EXISTS idx_backup_sync_scope ON backup_sync_operations(scope);
CREATE INDEX IF NOT EXISTS idx_backup_sync_camp_id ON backup_sync_operations(camp_id);
CREATE INDEX IF NOT EXISTS idx_backup_sync_name ON backup_sync_operations(name);
CREATE INDEX IF NOT EXISTS idx_backup_sync_status ON backup_sync_operations(status);
CREATE INDEX IF NOT EXISTS idx_backup_sync_initiated_by ON backup_sync_operations(initiated_by);
CREATE INDEX IF NOT EXISTS idx_backup_sync_started_at ON backup_sync_operations(started_at);

-- Indexes for system_operations_log table
CREATE INDEX IF NOT EXISTS idx_system_operations_user_time ON system_operations_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_operations_resource_type ON system_operations_log(resource_type);
CREATE INDEX IF NOT EXISTS idx_system_operations_operation_type ON system_operations_log(operation_type);
CREATE INDEX IF NOT EXISTS idx_system_operations_resource_id ON system_operations_log(resource_id);
CREATE INDEX IF NOT EXISTS idx_system_operations_created_at ON system_operations_log(created_at);

-- Indexes for aid_campaigns table
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_status ON aid_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_category ON aid_campaigns(aid_category);
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_start_date ON aid_campaigns(start_date);
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_end_date ON aid_campaigns(end_date);
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_coordinator ON aid_campaigns(coordinator_user_id);

-- Indexes for aid_distributions table
CREATE INDEX IF NOT EXISTS idx_aid_distributions_family_date ON aid_distributions(family_id, distribution_date DESC);
CREATE INDEX IF NOT EXISTS idx_aid_distributions_campaign_id ON aid_distributions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_aid_distributions_aid_type ON aid_distributions(aid_type);
CREATE INDEX IF NOT EXISTS idx_aid_distributions_aid_category ON aid_distributions(aid_category);
CREATE INDEX IF NOT EXISTS idx_aid_distributions_status ON aid_distributions(status);
CREATE INDEX IF NOT EXISTS idx_aid_distributions_distributed_by ON aid_distributions(distributed_by_user_id);

-- Indexes for inventory_items table
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_inventory_items_name ON inventory_items(name);
CREATE INDEX IF NOT EXISTS idx_inventory_items_quantity_available ON inventory_items(quantity_available);
CREATE INDEX IF NOT EXISTS idx_inventory_items_min_alert_threshold ON inventory_items(min_alert_threshold);
CREATE INDEX IF NOT EXISTS idx_inventory_items_expiry_date ON inventory_items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_items_donor ON inventory_items(donor);

-- Indexes for inventory_transactions table
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_item_date ON inventory_transactions(item_id, processed_at DESC);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_related_to ON inventory_transactions(related_to);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_processed_by ON inventory_transactions(processed_by_user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transactions_processed_at ON inventory_transactions(processed_at);

-- Indexes for inventory_audits table
CREATE INDEX IF NOT EXISTS idx_inventory_audits_item_id ON inventory_audits(item_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_reason ON inventory_audits(reason);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_audited_by ON inventory_audits(audited_by_user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_audits_audited_at ON inventory_audits(audited_at);

-- Indexes for soft_deletes table
CREATE INDEX IF NOT EXISTS idx_soft_deletes_table_name ON soft_deletes(table_name);
CREATE INDEX IF NOT EXISTS idx_soft_deletes_record_id ON soft_deletes(record_id);
CREATE INDEX IF NOT EXISTS idx_soft_deletes_deleted_by ON soft_deletes(deleted_by_user_id);
CREATE INDEX IF NOT EXISTS idx_soft_deletes_deleted_at ON soft_deletes(deleted_at);

-- Indexes for security_logs table
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_event_type ON security_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_ip_address ON security_logs(ip_address);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);

-- Indexes for failed_login_attempts table
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_username ON failed_login_attempts(username);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_ip_address ON failed_login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_attempted_at ON failed_login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempts_blocked_until ON failed_login_attempts(blocked_until);

-- =====================================================
-- VULNERABILITY SCORE COLUMNS
-- =====================================================
-- Note: Vulnerability scores are now calculated by the backend Node.js service
-- NOT by database triggers. The backend calculates scores on family CREATE/UPDATE
-- and stores them in these columns.
--
-- Backend service: backend/services/vulnerabilityService.js
-- Backend routes: backend/routes/families.js, backend/routes/public.js
-- Documentation: backend/VULNERABILITY_BACKEND_IMPLEMENTATION.md
--
-- Columns:
-- - vulnerability_score: NUMERIC(5, 2) - Calculated score (0-100)
-- - vulnerability_priority: VARCHAR(30) - Priority level (عالي جداً, عالي, متوسط, منخفض)
-- - vulnerability_breakdown: JSONB - Detailed breakdown of score calculation
--
-- Weights are configurable via global_config table:
-- SELECT config_value FROM global_config WHERE config_key = 'vulnerability_weights';
--
-- Removed in migration 031:
-- - calculate_vulnerability_score() function (now in Node.js)
-- - auto_calculate_vulnerability_trigger() function
-- - recalculate_family_vulnerability_on_individual_change() function
-- - auto_calculate_vulnerability_on_family_change trigger
-- - auto_calculate_vulnerability_on_individual_change trigger

-- Index for performance (keeping for query optimization)
CREATE INDEX IF NOT EXISTS idx_families_vulnerability_priority ON families(vulnerability_priority);
CREATE INDEX IF NOT EXISTS idx_families_vulnerability_score ON families(vulnerability_score);
CREATE INDEX IF NOT EXISTS idx_families_camp_vulnerability ON families(camp_id, vulnerability_score DESC);

-- Function to update family counts from individuals and wife data
-- Note: Does NOT update last_updated to avoid triggering other triggers and infinite recursion
CREATE OR REPLACE FUNCTION update_family_counts()
RETURNS TRIGGER AS $$
DECLARE
  family_uuid UUID;
  new_total INTEGER;
  new_male INTEGER;
  new_female INTEGER;
  new_child INTEGER;
  new_teen INTEGER;
  new_adult INTEGER;
  new_senior INTEGER;
  new_disabled INTEGER;
  new_chronic INTEGER;
  new_injured INTEGER;
  new_pregnant INTEGER;
  v_head_age INTEGER;
  v_wife_age INTEGER;
BEGIN
  -- Determine which family to update
  IF TG_TABLE_NAME = 'individuals' THEN
    family_uuid := COALESCE(NEW.family_id, OLD.family_id);
  ELSE
    family_uuid := NEW.id;
  END IF;

  -- Calculate head and wife ages from date of birth
  SELECT 
    CASE 
      WHEN f.head_of_family_date_of_birth IS NOT NULL 
      THEN EXTRACT(YEAR FROM AGE(f.head_of_family_date_of_birth))::INTEGER
      ELSE f.head_of_family_age
    END,
    CASE 
      WHEN f.wife_date_of_birth IS NOT NULL 
      THEN EXTRACT(YEAR FROM AGE(f.wife_date_of_birth))::INTEGER
      ELSE NULL
    END
  INTO v_head_age, v_wife_age
  FROM families f WHERE id = family_uuid;

  -- Calculate new counts
  SELECT
    1 +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND is_deleted = FALSE), 0) +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END,
    CASE WHEN f.head_of_family_gender = 'ذكر' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND gender = 'ذكر' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_gender = 'أنثى' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_name IS NOT NULL AND f.wife_name != '' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND gender = 'أنثى' AND is_deleted = FALSE), 0),
    -- Child count (under 12): includes head, wife, and individuals
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age < 12 AND is_deleted = FALSE), 0) +
    CASE WHEN v_head_age IS NOT NULL AND v_head_age < 12 THEN 1 ELSE 0 END +
    CASE WHEN v_wife_age IS NOT NULL AND v_wife_age < 12 THEN 1 ELSE 0 END,
    -- Teenager count (12-18): includes head, wife, and individuals
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age >= 12 AND age <= 18 AND is_deleted = FALSE), 0) +
    CASE WHEN v_head_age IS NOT NULL AND v_head_age >= 12 AND v_head_age <= 18 THEN 1 ELSE 0 END +
    CASE WHEN v_wife_age IS NOT NULL AND v_wife_age >= 12 AND v_wife_age <= 18 THEN 1 ELSE 0 END,
    -- Adult count (19-60): includes head, wife, and individuals
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 18 AND age <= 60 AND is_deleted = FALSE), 0) +
    CASE WHEN v_head_age IS NOT NULL AND v_head_age > 18 AND v_head_age <= 60 THEN 1 ELSE 0 END +
    CASE WHEN v_wife_age IS NOT NULL AND v_wife_age > 18 AND v_wife_age <= 60 THEN 1 ELSE 0 END,
    -- Senior count (over 60): includes head, wife, and individuals
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND age > 60 AND is_deleted = FALSE), 0) +
    CASE WHEN v_head_age IS NOT NULL AND v_head_age > 60 THEN 1 ELSE 0 END +
    CASE WHEN v_wife_age IS NOT NULL AND v_wife_age > 60 THEN 1 ELSE 0 END,
    CASE WHEN f.head_of_family_disability_type IS NOT NULL AND f.head_of_family_disability_type != 'لا يوجد' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_disability_type IS NOT NULL AND f.wife_disability_type != 'لا يوجد' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND disability_type IS NOT NULL AND disability_type != 'لا يوجد' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_chronic_disease_type IS NOT NULL AND f.head_of_family_chronic_disease_type != 'لا يوجد' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_chronic_disease_type IS NOT NULL AND f.wife_chronic_disease_type != 'لا يوجد' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND chronic_disease_type IS NOT NULL AND chronic_disease_type != 'لا يوجد' AND is_deleted = FALSE), 0),
    CASE WHEN f.head_of_family_war_injury_type IS NOT NULL AND f.head_of_family_war_injury_type != 'لا يوجد' THEN 1 ELSE 0 END +
    CASE WHEN f.wife_war_injury_type IS NOT NULL AND f.wife_war_injury_type != 'لا يوجد' THEN 1 ELSE 0 END +
    COALESCE((SELECT COUNT(*) FROM individuals WHERE family_id = family_uuid AND has_war_injury = TRUE AND is_deleted = FALSE), 0),
    CASE WHEN f.wife_is_pregnant = TRUE THEN 1 ELSE 0 END
  INTO new_total, new_male, new_female, new_child, new_teen, new_adult, new_senior, new_disabled, new_chronic, new_injured, new_pregnant
  FROM families f WHERE id = family_uuid;

  -- Only update if values changed (to avoid infinite recursion)
  UPDATE families f SET
    total_members_count = new_total,
    male_count = new_male,
    female_count = new_female,
    child_count = new_child,
    teenager_count = new_teen,
    adult_count = new_adult,
    senior_count = new_senior,
    disabled_count = new_disabled,
    chronic_count = new_chronic,
    injured_count = new_injured,
    pregnant_women_count = new_pregnant
  WHERE id = family_uuid
    AND (
      total_members_count IS DISTINCT FROM new_total
      OR male_count IS DISTINCT FROM new_male
      OR female_count IS DISTINCT FROM new_female
    );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist (to allow re-running)
DROP TRIGGER IF EXISTS update_family_counts_after_individual_change ON individuals;
DROP TRIGGER IF EXISTS update_family_counts_after_family_change ON families;

-- Trigger on individuals table
CREATE TRIGGER update_family_counts_after_individual_change
  AFTER INSERT OR UPDATE OR DELETE ON individuals
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

-- Trigger on families table (for wife updates)
CREATE TRIGGER update_family_counts_after_family_change
  AFTER INSERT OR UPDATE ON families
  FOR EACH ROW EXECUTE FUNCTION update_family_counts();

-- Function to update inventory when aid is distributed or deleted
CREATE OR REPLACE FUNCTION update_inventory_on_distribution()
RETURNS TRIGGER AS $$
DECLARE
  item_id_var UUID;
  transaction_time TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Get the inventory_item_id from the campaign
  SELECT inventory_item_id INTO item_id_var
  FROM aid_campaigns
  WHERE id = COALESCE(NEW.campaign_id, OLD.campaign_id)
  LIMIT 1;

  -- If found, update inventory based on operation
  IF item_id_var IS NOT NULL THEN
    IF TG_OP = 'INSERT' THEN
      -- Use distribution_date as the transaction time (now includes full timestamp)
      transaction_time := COALESCE(NEW.distribution_date, NOW());

      -- Reduce inventory on new distribution
      UPDATE inventory_items
      SET quantity_available = quantity_available - NEW.quantity,
          updated_at = NOW()
      WHERE id = item_id_var
      AND quantity_available >= NEW.quantity;

      -- Create inventory transaction record (صادر - out)
      INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity,
        related_to,
        related_id,
        notes,
        processed_by_user_id,
        processed_at,
        is_deleted
      ) VALUES (
        item_id_var,
        'صادر',
        NEW.quantity,
        'توزيع',
        NEW.id,
        COALESCE(NEW.notes, 'توزيع مساعدة'),
        NEW.distributed_by_user_id,
        transaction_time,
        FALSE
      );
    ELSIF TG_OP = 'DELETE' THEN
      -- Restore inventory on hard delete
      UPDATE inventory_items
      SET quantity_available = quantity_available + OLD.quantity,
          updated_at = NOW()
      WHERE id = item_id_var;

      -- Create inventory transaction record for undo (وارد - in)
      INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity,
        related_to,
        related_id,
        notes,
        processed_by_user_id,
        processed_at,
        is_deleted
      ) VALUES (
        item_id_var,
        'وارد',
        OLD.quantity,
        'توزيع',
        OLD.id,
        COALESCE(OLD.notes, 'تراجع عن توزيع'),
        OLD.distributed_by_user_id,
        NOW(),
        FALSE
      );
    ELSIF TG_OP = 'UPDATE' AND OLD.is_deleted = FALSE AND NEW.is_deleted = TRUE THEN
      -- Restore inventory on soft delete (undo operation)
      UPDATE inventory_items
      SET quantity_available = quantity_available + OLD.quantity,
          updated_at = NOW()
      WHERE id = item_id_var;

      -- Create inventory transaction record for undo (وارد - in)
      INSERT INTO inventory_transactions (
        item_id,
        transaction_type,
        quantity,
        related_to,
        related_id,
        notes,
        processed_by_user_id,
        processed_at,
        is_deleted
      ) VALUES (
        item_id_var,
        'وارد',
        OLD.quantity,
        'توزيع',
        OLD.id,
        COALESCE(OLD.notes, 'تراجع عن توزيع'),
        OLD.distributed_by_user_id,
        NOW(),
        FALSE
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for inventory update on aid distribution (INSERT reduces, DELETE/UPDATE restores on soft delete)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_inventory_trigger'
  ) THEN
    CREATE TRIGGER update_inventory_trigger
      AFTER INSERT OR UPDATE OR DELETE ON aid_distributions
      FOR EACH ROW
      EXECUTE FUNCTION update_inventory_on_distribution();
  END IF;
END $$;

-- Function to log all operations
CREATE OR REPLACE FUNCTION log_operation()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into system operations log
  INSERT INTO system_operations_log (
    user_id,
    operation_type,
    resource_type,
    resource_id,
    old_values,
    new_values,
    ip_address,
    user_agent
  ) VALUES (
    auth.uid(),
    TG_OP, -- Operation type (INSERT, UPDATE, DELETE)
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP = 'UPDATE' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END,
    current_setting('request.header.x-forwarded-for', true)::INET,
    current_setting('request.header.user-agent', true)
  );

  RETURN CASE
    WHEN TG_OP = 'DELETE' THEN OLD
    ELSE NEW
  END;
END;
$$ LANGUAGE plpgsql;

-- Apply logging trigger to important tables
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'log_families_changes'
  ) THEN 
    CREATE TRIGGER log_families_changes
      AFTER INSERT OR UPDATE OR DELETE ON families
      FOR EACH ROW
      EXECUTE FUNCTION log_operation();
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'log_users_changes'
  ) THEN 
    CREATE TRIGGER log_users_changes
      AFTER INSERT OR UPDATE OR DELETE ON users
      FOR EACH ROW
      EXECUTE FUNCTION log_operation();
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'log_inventory_changes'
  ) THEN 
    CREATE TRIGGER log_inventory_changes
      AFTER INSERT OR UPDATE OR DELETE ON inventory_items
      FOR EACH ROW
      EXECUTE FUNCTION log_operation();
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'log_aid_distributions_changes'
  ) THEN 
    CREATE TRIGGER log_aid_distributions_changes
      AFTER INSERT OR UPDATE OR DELETE ON aid_distributions
      FOR EACH ROW
      EXECUTE FUNCTION log_operation();
  END IF; 
END $$;

-- Function to prevent duplicate aid distributions
CREATE OR REPLACE FUNCTION prevent_duplicate_distribution()
RETURNS TRIGGER AS $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  -- Check if the same family received the same aid type in the last 30 days
  SELECT COUNT(*) INTO duplicate_count
  FROM aid_distributions
  WHERE family_id = NEW.family_id
    AND aid_type = NEW.aid_type
    AND distribution_date > CURRENT_DATE - INTERVAL '30 days';

  -- If duplicate found and duplicate check is required
  IF duplicate_count > 0 AND NEW.duplicate_check_passed = false THEN
    RAISE EXCEPTION 'Duplicate aid distribution detected within 30 days';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for duplicate prevention
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'prevent_duplicate_trigger'
  ) THEN 
    CREATE TRIGGER prevent_duplicate_trigger
      BEFORE INSERT ON aid_distributions
      FOR EACH ROW
      EXECUTE FUNCTION prevent_duplicate_distribution();
  END IF; 
END $$;

-- Performance monitoring views
-- View for slow queries analysis
CREATE OR REPLACE VIEW performance_monitoring_view AS
SELECT
  schemaname,
  relname AS tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  n_tup_ins,
  n_tup_upd,
  n_tup_del,
  n_tup_hot_upd
FROM pg_stat_user_tables
ORDER BY seq_scan DESC;

-- View for tracking most accessed records
CREATE OR REPLACE VIEW frequently_accessed_records AS
SELECT
  resource_type,
  resource_id,
  COUNT(*) as access_count
FROM system_operations_log
WHERE created_at > CURRENT_DATE - INTERVAL '30 days'
GROUP BY resource_type, resource_id
ORDER BY access_count DESC
LIMIT 100;

-- Function to anonymize data for compliance
CREATE OR REPLACE FUNCTION anonymize_deleted_record()
RETURNS TRIGGER AS $$
BEGIN
  -- Store the original data in soft_deletes before actual deletion
  INSERT INTO soft_deletes (
    table_name,
    record_id,
    deleted_data,
    deleted_by_user_id
  ) VALUES (
    TG_TABLE_NAME,
    OLD.id,
    row_to_json(OLD),
    auth.uid()
  );

  -- Return the old record for the trigger
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply anonymization trigger to sensitive tables
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'anonymize_families_delete'
  ) THEN 
    CREATE TRIGGER anonymize_families_delete
      BEFORE DELETE ON families
      FOR EACH ROW
      EXECUTE FUNCTION anonymize_deleted_record();
  END IF; 
END $$;

DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'anonymize_individuals_delete'
  ) THEN 
    CREATE TRIGGER anonymize_individuals_delete
      BEFORE DELETE ON individuals
      FOR EACH ROW
      EXECUTE FUNCTION anonymize_deleted_record();
  END IF; 
END $$;

-- Security function to prevent unauthorized access escalation
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent users from updating their own role or other users' roles unless they are system admins
  IF (NEW.role != OLD.role OR NEW.role != TG_ARGV[0]) AND auth.role() != 'service_role' THEN
    -- Allow service role (backend) to change roles, but not regular users
    RAISE EXCEPTION 'Only system administrators can change user roles';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply role escalation prevention
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'prevent_role_escalation_trigger'
  ) THEN
    CREATE TRIGGER prevent_role_escalation_trigger
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION prevent_role_escalation();
  END IF;
END $$;

-- ============================================
-- RLS Policies for Migration 032 Tables
-- ============================================

-- Complaints Policies
DROP POLICY IF EXISTS "Beneficiaries can view own complaints" ON complaints;
CREATE POLICY "Beneficiaries can view own complaints"
    ON complaints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.family_id = complaints.family_id
        )
    );

DROP POLICY IF EXISTS "Beneficiaries can insert own complaints" ON complaints;
CREATE POLICY "Beneficiaries can insert own complaints"
    ON complaints FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.family_id = family_id
        )
    );

DROP POLICY IF EXISTS "Staff can view all complaints" ON complaints;
CREATE POLICY "Staff can view all complaints"
    ON complaints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

DROP POLICY IF EXISTS "Staff can update complaints" ON complaints;
CREATE POLICY "Staff can update complaints"
    ON complaints FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

-- Emergency Reports Policies
DROP POLICY IF EXISTS "Beneficiaries can view own emergency reports" ON emergency_reports;
CREATE POLICY "Beneficiaries can view own emergency reports"
    ON emergency_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.family_id = emergency_reports.family_id
        )
    );

DROP POLICY IF EXISTS "Beneficiaries can insert own emergency reports" ON emergency_reports;
CREATE POLICY "Beneficiaries can insert own emergency reports"
    ON emergency_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.family_id = family_id
        )
    );

DROP POLICY IF EXISTS "Staff can view all emergency reports" ON emergency_reports;
CREATE POLICY "Staff can view all emergency reports"
    ON emergency_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

DROP POLICY IF EXISTS "Staff can update emergency reports" ON emergency_reports;
CREATE POLICY "Staff can update emergency reports"
    ON emergency_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE complaints IS 'شكاوى ومقترحات النازحين لتحسين الخدمات';
COMMENT ON TABLE emergency_reports IS 'تقارير الطوارئ المقدمة من النازحين';

COMMENT ON COLUMN complaints.category IS 'تصنيف الشكوى: عام، صحي، أمن، مرافق، أخرى';
COMMENT ON COLUMN emergency_reports.urgency IS 'درجة الاستعجال: عاجل جداً، عاجل، عادي';

-- ============================================
-- NOTIFICATION TRIGGERS (from migrations 039, 040)
-- ============================================

-- --------------------------------------------
-- Helper Functions (from migration 040)
-- --------------------------------------------

-- Function to check for recent duplicate notifications (deduplication)
CREATE OR REPLACE FUNCTION has_recent_notification(
    p_family_id UUID,
    p_notification_type VARCHAR(50),
    p_related_entity_id UUID,
    p_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
    exists_flag BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM notifications
        WHERE family_id = p_family_id
        AND notification_type = p_notification_type
        AND related_entity_id = p_related_entity_id
        AND created_at > NOW() - (p_hours || ' hours')::INTERVAL
    ) INTO exists_flag;
    
    RETURN exists_flag;
END;
$$ LANGUAGE plpgsql;

-- Function to get camp managers for a given camp
CREATE OR REPLACE FUNCTION get_camp_managers(p_camp_id UUID)
RETURNS TABLE(user_id UUID, family_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.family_id
    FROM users u
    WHERE u.camp_id = p_camp_id
    AND u.role = 'CAMP_MANAGER'
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all camp staff (managers + field officers)
CREATE OR REPLACE FUNCTION get_camp_staff(p_camp_id UUID)
RETURNS TABLE(user_id UUID, family_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.family_id
    FROM users u
    WHERE u.camp_id = p_camp_id
    AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- Migration 039: Base Notification Triggers (8 triggers)
-- --------------------------------------------

-- Trigger 1: New distribution campaign
CREATE OR REPLACE FUNCTION create_notification_for_distribution()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
    SELECT
        f.id,
        'توزيع'::VARCHAR(50),
        'توزيع مساعدات جديد',
        'تم إطلاق حملة توزيع جديدة: ' || COALESCE(NEW.name, 'حملة جديدة') || ' - ' || COALESCE(NEW.aid_type, 'مساعدات'),
        FALSE,
        NEW.id,
        'حملة_مساعدات'
    FROM families f
    WHERE f.camp_id = NEW.camp_id
    AND f.status = 'موافق';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_new_distribution ON aid_campaigns;
CREATE TRIGGER notify_new_distribution
    AFTER INSERT ON aid_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_distribution();

-- Trigger 2: Distribution status change to completed
CREATE OR REPLACE FUNCTION create_notification_for_distribution_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status AND NEW.status = 'مكتمل' THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        SELECT
            d.family_id,
            'توزيع'::VARCHAR(50),
            'اكتمل التوزيع',
            'تم اكتمال توزيع المساعدات: ' || COALESCE(c.name, 'حملة التوزيع'),
            FALSE,
            NEW.id,
            'توزيع_مساعدات'
        FROM aid_distributions d
        LEFT JOIN aid_campaigns c ON c.id = NEW.campaign_id
        WHERE d.id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_distribution_status ON aid_distributions;
CREATE TRIGGER notify_distribution_status
    AFTER UPDATE ON aid_distributions
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_distribution_status();

-- Trigger 3: Complaint response
CREATE OR REPLACE FUNCTION create_notification_for_complaint_response()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.response IS NOT NULL AND NEW.response != OLD.response AND NEW.response != '') OR
       (NEW.status != OLD.status AND NEW.status IN ('تم الرد', 'مغلق')) THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.family_id,
            'شكوى_رد'::VARCHAR(50),
            'رد على شكواك',
            'تم الرد على شكواك: ' || COALESCE(NEW.subject, 'شكوى'),
            FALSE,
            NEW.id,
            'شكوى'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_complaint_response ON complaints;
CREATE TRIGGER notify_complaint_response
    AFTER UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_complaint_response();

-- Trigger 4: Emergency report response
CREATE OR REPLACE FUNCTION create_notification_for_emergency_response()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.status != OLD.status AND NEW.status IN ('قيد المعالجة', 'تم التحويل', 'تم الحل', 'مرفوض')) OR
       (NEW.resolution_notes IS NOT NULL AND NEW.resolution_notes != OLD.resolution_notes AND NEW.resolution_notes != '') THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.family_id,
            'نظام'::VARCHAR(50),
            'تحديث بلاغ الطوارئ',
            'تم تحديث حالة بلاغ الطوارئ: ' || COALESCE(NEW.emergency_type, 'بلاغ طوارئ'),
            FALSE,
            NEW.id,
            'بلاغ_طوارئ'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_emergency_response ON emergency_reports;
CREATE TRIGGER notify_emergency_response
    AFTER UPDATE ON emergency_reports
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_emergency_response();

-- Trigger 5: Transfer request update
CREATE OR REPLACE FUNCTION create_notification_for_transfer_update()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.dp_id,
            'انتقال_تحديث'::VARCHAR(50),
            'تحديث طلب الانتقال',
            'تم تحديث حالة طلب الانتقال: ' ||
            CASE
                WHEN NEW.status = 'موافق' THEN 'تمت الموافقة على طلب الانتقال'
                WHEN NEW.status = 'مرفوض' THEN 'تم رفض طلب الانتقال'
                WHEN NEW.status = 'تمت المعالجة' THEN 'تمت معالجة طلب الانتقال'
                ELSE 'تم تحديث حالة طلب الانتقال'
            END,
            FALSE,
            NEW.id,
            'طلب_انتقال'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_transfer_update ON transfer_requests;
CREATE TRIGGER notify_transfer_update
    AFTER UPDATE ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_transfer_update();

-- Trigger 6: Special assistance response
CREATE OR REPLACE FUNCTION create_notification_for_special_assistance_response()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.response IS NOT NULL AND NEW.response != OLD.response AND NEW.response != '') OR
       (NEW.status != OLD.status AND NEW.status IN ('تمت الموافقة', 'مرفوض', 'تم التنفيذ')) THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.family_id,
            'نظام'::VARCHAR(50),
            'رد على طلب المساعدة',
            'تم ' ||
            CASE
                WHEN NEW.status = 'تمت الموافقة' THEN 'الموافقة على طلب المساعدة'
                WHEN NEW.status = 'مرفوض' THEN 'رفض طلب المساعدة'
                WHEN NEW.status = 'تم التنفيذ' THEN 'تنفيذ طلب المساعدة'
                ELSE 'تحديث حالة طلب المساعدة'
            END,
            FALSE,
            NEW.id,
            'مساعدة_خاصة'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_special_assistance_response ON special_assistance_requests;
CREATE TRIGGER notify_special_assistance_response
    AFTER UPDATE ON special_assistance_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_special_assistance_response();

-- Trigger 7: Family approval
CREATE OR REPLACE FUNCTION create_notification_for_family_approval()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status AND NEW.status = 'موافق' THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.id,
            'نظام'::VARCHAR(50),
            'تم قبول تسجيل الأسرة',
            'تم قبول طلب تسجيل أسرتكم في النظام',
            FALSE,
            NEW.id,
            'أسرة'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_family_approval ON families;
CREATE TRIGGER notify_family_approval
    AFTER UPDATE ON families
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_family_approval();

-- Trigger 8: Family status change
CREATE OR REPLACE FUNCTION create_notification_for_family_status()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status != NEW.status AND NEW.status != 'موافق' AND NEW.status != 'قيد الانتظار' THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.id,
            'نظام'::VARCHAR(50),
            'تحديث حالة التسجيل',
            'تم تحديث حالة تسجيل أسرتكم إلى: ' || NEW.status,
            FALSE,
            NEW.id,
            'أسرة_حالة'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_family_status ON families;
CREATE TRIGGER notify_family_status
    AFTER UPDATE ON families
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_family_status();

-- --------------------------------------------
-- Migration 040: Enhanced Notification Triggers (8+ triggers)
-- --------------------------------------------

-- --------------------------------------------
-- Helper Function: Get Family Full Name (4-part structure)
-- Returns the concatenated 4-part Arabic name or falls back to head_of_family_name
-- --------------------------------------------
CREATE OR REPLACE FUNCTION get_family_full_name(family_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    full_name TEXT;
BEGIN
    SELECT 
      CASE 
        WHEN head_first_name IS NOT NULL AND head_father_name IS NOT NULL 
             AND head_grandfather_name IS NOT NULL AND head_family_name IS NOT NULL
        THEN TRIM(head_first_name || ' ' || head_father_name || ' ' || head_grandfather_name || ' ' || head_family_name)
        WHEN head_first_name IS NOT NULL AND head_father_name IS NOT NULL AND head_family_name IS NOT NULL
        THEN TRIM(head_first_name || ' ' || head_father_name || ' ' || head_family_name)
        WHEN head_first_name IS NOT NULL AND head_family_name IS NOT NULL
        THEN TRIM(head_first_name || ' ' || head_family_name)
        ELSE COALESCE(NULLIF(TRIM(head_of_family_name), ''), 'عزيزي المستفيد')
      END INTO full_name
    FROM families
    WHERE id = family_id_param;
    
    RETURN COALESCE(full_name, 'عزيزي المستفيد');
END;
$$ LANGUAGE plpgsql;

-- Trigger 9: Distribution assigned (ready for pickup)
CREATE OR REPLACE FUNCTION create_notification_for_distribution_assigned()
RETURNS TRIGGER AS $$
DECLARE
    family_name VARCHAR(255);
    campaign_name VARCHAR(255);
BEGIN
    SELECT get_family_full_name(NEW.family_id) INTO family_name;
    SELECT name INTO campaign_name FROM aid_campaigns WHERE id = NEW.campaign_id;
    
    INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
    VALUES (
        NEW.family_id,
        'توزيع_جاهز',
        'عالي',
        'مساعدات جاهزة للاستلام',
        'أهلاً ' || COALESCE(family_name, 'عزيزي المستفيد') || '. المساعدات الخاصة بـ ' || 
        COALESCE(campaign_name, 'حملة التوزيع') || ' جاهزة للاستلام. يرجى المراجعة خلال الفترة المحددة.',
        FALSE,
        NEW.id,
        'توزيع_مساعدات'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_distribution_assigned ON aid_distributions;
CREATE TRIGGER notify_distribution_assigned
    AFTER INSERT ON aid_distributions
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_distribution_assigned();

-- Trigger 10: Campaign status change
CREATE OR REPLACE FUNCTION create_notification_for_campaign_status()
RETURNS TRIGGER AS $$
DECLARE
    family_rec RECORD;
    title_text VARCHAR(255);
    message_text TEXT;
    priority_val VARCHAR(20) := 'عادي';
BEGIN
    IF OLD.status != NEW.status THEN
        CASE NEW.status
            WHEN 'نشطة' THEN
                title_text := 'بدأ التوزيع';
                message_text := 'بدأ توزيع مساعدات: ' || COALESCE(NEW.name, 'حملة التوزيع') || '. يرجى مراجعة موقع التوزيع.';
                priority_val := 'عالي';
            WHEN 'مكتملة' THEN
                title_text := 'انتهى التوزيع';
                message_text := 'انتهى توزيع مساعدات: ' || COALESCE(NEW.name, 'حملة التوزيع');
                priority_val := 'عادي';
            WHEN 'ملغاة' THEN
                title_text := 'إلغاء حملة التوزيع';
                message_text := 'تم إلغاء حملة التوزيع: ' || COALESCE(NEW.name, 'حملة التوزيع') || '. نعتذر عن الإزعاج.';
                priority_val := 'عاجل جداً';
            WHEN 'مخططة' THEN
                title_text := 'تأجيل حملة التوزيع';
                message_text := 'تم تأجيل حملة التوزيع: ' || COALESCE(NEW.name, 'حملة التوزيع') || ' إلى تاريخ لاحق.';
                priority_val := 'عادي';
            ELSE
                RETURN NEW;
        END CASE;
        
        FOR family_rec IN (
            SELECT f.id, get_family_full_name(f.id) AS family_name
            FROM families f
            WHERE f.camp_id = NEW.camp_id AND f.status = 'موافق'
        ) LOOP
            IF NOT has_recent_notification(family_rec.id, 'حملة_حالة', NEW.id, 48) THEN
                INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
                VALUES (
                    family_rec.id,
                    'حملة_حالة',
                    priority_val,
                    title_text,
                    message_text,
                    FALSE,
                    NEW.id,
                    'حملة_مساعدات'
                );
            END IF;
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_campaign_status ON aid_campaigns;
CREATE TRIGGER notify_campaign_status
    AFTER UPDATE ON aid_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_campaign_status();

-- Trigger 11: Verification required (OTP/Biometric)
CREATE OR REPLACE FUNCTION create_notification_for_verification_required()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.otp_code IS NOT NULL OR NEW.received_by_biometric IS NOT NULL) 
    AND NEW.status = 'قيد الانتظار' THEN
        INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.family_id,
            'تأكيد_مطلوب',
            'عالي',
            'مطلوب تأكيد استلام المساعدات',
            'يرجى إحضار رمز التحقق أو البصمة لاستلام مساعداتك.',
            FALSE,
            NEW.id,
            'توزيع_مساعدات'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_verification_required ON aid_distributions;
CREATE TRIGGER notify_verification_required
    AFTER INSERT ON aid_distributions
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_verification_required();

-- Trigger 12: Staff notification for new complaint
CREATE OR REPLACE FUNCTION notify_staff_new_complaint()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
BEGIN
    FOR manager_rec IN (
        SELECT u.id, u.family_id, u.camp_id
        FROM users u
        INNER JOIN families f ON f.camp_id = u.camp_id
        WHERE f.id = NEW.family_id
        AND u.role = 'CAMP_MANAGER'
        AND u.is_active = TRUE
    ) LOOP
        INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            manager_rec.family_id,
            'شكوى_جديدة',
            CASE WHEN NEW.category = 'طوارئ' THEN 'عاجل جداً' ELSE 'عالي' END,
            'شكوى جديدة',
            'تم تقديم شكوى جديدة من أسرة في المخيم. الموضوع: ' || COALESCE(NEW.subject, 'بدون عنوان'),
            FALSE,
            NEW.id,
            'شكوى'
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_staff_new_complaint ON complaints;
CREATE TRIGGER notify_staff_new_complaint
    AFTER INSERT ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION notify_staff_new_complaint();

-- Trigger 13: Staff notification for new emergency (SMS)
CREATE OR REPLACE FUNCTION notify_staff_new_emergency()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
    urgency_level VARCHAR(20);
BEGIN
    CASE NEW.urgency
        WHEN 'عاجل جداً' THEN urgency_level := 'عاجل جداً';
        WHEN 'عاجل' THEN urgency_level := 'عالي';
        ELSE urgency_level := 'عادي';
    END CASE;
    
    FOR manager_rec IN (
        SELECT u.id, u.family_id
        FROM users u
        INNER JOIN families f ON f.camp_id = u.camp_id
        WHERE f.id = NEW.family_id
        AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
        AND u.is_active = TRUE
    ) LOOP
        INSERT INTO notifications (family_id, notification_type, priority, channel, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            manager_rec.family_id,
            'طوارئ_بلاغ',
            urgency_level,
            'رسالة_نصية',
            'بلاغ طوارئ جديد - ' || COALESCE(NEW.urgency, 'عادي'),
            'نوع الطارئ: ' || COALESCE(NEW.emergency_type, 'غير محدد') || 
            '. الموقع: ' || COALESCE(NEW.location, 'غير محدد') ||
            '. يرجى التدخل العاجل.',
            FALSE,
            NEW.id,
            'بلاغ_طوارئ'
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_staff_new_emergency ON emergency_reports;
CREATE TRIGGER notify_staff_new_emergency
    AFTER INSERT ON emergency_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_staff_new_emergency();

-- Trigger 14: Staff notification for new transfer request
CREATE OR REPLACE FUNCTION notify_staff_new_transfer()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
BEGIN
    FOR manager_rec IN (
        SELECT u.id, u.family_id
        FROM users u
        WHERE u.camp_id IN (NEW.from_camp_id, NEW.to_camp_id)
        AND u.role = 'CAMP_MANAGER'
        AND u.is_active = TRUE
    ) LOOP
        INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            manager_rec.family_id,
            'انتقال_طلب_جديد',
            'عادي',
            'طلب انتقال جديد',
            'تم تقديم طلب انتقال جديد من: ' || COALESCE(NEW.dp_name, 'مستفيد') || '. يرجى المراجعة والموافقة.',
            FALSE,
            NEW.id,
            'طلب_انتقال'
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_staff_new_transfer ON transfer_requests;
CREATE TRIGGER notify_staff_new_transfer
    AFTER INSERT ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_staff_new_transfer();

-- Trigger 15: Staff notification for new special assistance
CREATE OR REPLACE FUNCTION notify_staff_new_special_assistance()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
    urgency_level VARCHAR(20);
BEGIN
    CASE NEW.urgency
        WHEN 'عاجل جداً' THEN urgency_level := 'عاجل جداً';
        WHEN 'عاجل' THEN urgency_level := 'عالي';
        ELSE urgency_level := 'عادي';
    END CASE;
    
    FOR manager_rec IN (
        SELECT u.id, u.family_id
        FROM users u
        INNER JOIN families f ON f.camp_id = u.camp_id
        WHERE f.id = NEW.family_id
        AND u.role = 'CAMP_MANAGER'
        AND u.is_active = TRUE
    ) LOOP
        INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            manager_rec.family_id,
            'مساعدة_خاصة_طلب_جديد',
            urgency_level,
            'طلب مساعدة جديدة - ' || COALESCE(NEW.assistance_type, 'عام'),
            'تم تقديم طلب مساعدة جديدة من أسرة في المخيم. النوع: ' || 
            COALESCE(NEW.assistance_type, 'غير محدد') || 
            '. الأهمية: ' || COALESCE(NEW.urgency, 'عادي'),
            FALSE,
            NEW.id,
            'مساعدة_خاصة'
        );
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_staff_new_special_assistance ON special_assistance_requests;
CREATE TRIGGER notify_staff_new_special_assistance
    AFTER INSERT ON special_assistance_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_staff_new_special_assistance();

-- Trigger 16: New inventory received
CREATE OR REPLACE FUNCTION notify_new_inventory_received()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
BEGIN
    IF NEW.quantity_available > 0 AND (TG_OP = 'INSERT' OR 
        (OLD.quantity_available = 0 AND NEW.quantity_available > 0)) THEN
        FOR manager_rec IN (
            SELECT u.id, u.family_id
            FROM users u
            WHERE u.camp_id = NEW.camp_id
            AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
            AND u.is_active = TRUE
        ) LOOP
            INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
            VALUES (
                manager_rec.family_id,
                'مخزون_جديد_وصل',
                'عادي',
                'وصل مخزون جديد',
                'تم استلام صنف جديد: "' || NEW.name || '" (' || 
                NEW.quantity_available || ' ' || NEW.unit || ')',
                FALSE,
                NEW.id,
                'صنف_مخزون'
            );
        END LOOP;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_new_inventory_received ON inventory_items;
CREATE TRIGGER notify_new_inventory_received
    AFTER INSERT ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_inventory_received();

-- --------------------------------------------
-- Scheduled Functions (call from backend/cron)
-- --------------------------------------------

-- Function: Low stock alerts (call daily)
CREATE OR REPLACE FUNCTION create_low_stock_notifications()
RETURNS VOID AS $$
DECLARE
    item_rec RECORD;
    manager_rec RECORD;
BEGIN
    FOR item_rec IN (
        SELECT i.*, c.name as camp_name
        FROM inventory_items i
        LEFT JOIN camps c ON c.id = i.camp_id
        WHERE i.is_active = TRUE
        AND i.quantity_available <= i.min_stock
        AND i.quantity_available > 0
    ) LOOP
        FOR manager_rec IN (
            SELECT u.id, u.family_id
            FROM users u
            WHERE u.camp_id = item_rec.camp_id
            AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
            AND u.is_active = TRUE
        ) LOOP
            IF NOT has_recent_notification(manager_rec.family_id, 'مخزون_منخفض_تنبيه', item_rec.id, 24) THEN
                INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
                VALUES (
                    manager_rec.family_id,
                    'مخزون_منخفض_تنبيه',
                    'عالي',
                    'تنبيه: مخزون منخفض',
                    'الصنف "' || item_rec.name || '" في مخيم ' || 
                    COALESCE(item_rec.camp_name, 'الرئيسي') || 
                    ' وصل إلى الحد الأدنى. الكمية المتبقية: ' || 
                    item_rec.quantity_available || ' ' || item_rec.unit,
                    FALSE,
                    item_rec.id,
                    'صنف_مخزون'
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Expiry warnings (call daily)
CREATE OR REPLACE FUNCTION create_expiry_warning_notifications(p_days_ahead INTEGER DEFAULT 7)
RETURNS VOID AS $$
DECLARE
    item_rec RECORD;
    manager_rec RECORD;
    days_until_expiry INTEGER;
BEGIN
    FOR item_rec IN (
        SELECT i.*, c.name as camp_name,
               (i.expiry_date - CURRENT_DATE) as days_left
        FROM inventory_items i
        LEFT JOIN camps c ON c.id = i.camp_id
        WHERE i.is_active = TRUE
        AND i.expiry_date IS NOT NULL
        AND i.expiry_date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
        AND i.expiry_date >= CURRENT_DATE
    ) LOOP
        days_until_expiry := item_rec.days_left;
        
        FOR manager_rec IN (
            SELECT u.id, u.family_id
            FROM users u
            WHERE u.camp_id = item_rec.camp_id
            AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
            AND u.is_active = TRUE
        ) LOOP
            IF NOT has_recent_notification(manager_rec.family_id, 'صلاحية_انتهاء_تنبيه', item_rec.id, 48) THEN
                INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
                VALUES (
                    manager_rec.family_id,
                    'صلاحية_انتهاء_تنبيه',
                    CASE 
                        WHEN days_until_expiry <= 2 THEN 'عاجل جداً'
                        WHEN days_until_expiry <= 5 THEN 'عالي'
                        ELSE 'عادي'
                    END,
                    'تنبيه: انتهاء صلاحية قريبة',
                    'الصنف "' || item_rec.name || '" في مخيم ' || 
                    COALESCE(item_rec.camp_name, 'الرئيسي') || 
                    ' تنتهي صلاحيته خلال ' || days_until_expiry || ' يوم. ' ||
                    'تاريخ الانتهاء: ' || item_rec.expiry_date,
                    FALSE,
                    item_rec.id,
                    'صنف_مخزون'
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Campaign ending soon (call daily)
CREATE OR REPLACE FUNCTION create_campaign_ending_soon_notifications(p_days_ahead INTEGER DEFAULT 2)
RETURNS VOID AS $$
DECLARE
    campaign_rec RECORD;
    family_rec RECORD;
BEGIN
    FOR campaign_rec IN (
        SELECT *
        FROM aid_campaigns
        WHERE status = 'نشطة'
        AND end_date IS NOT NULL
        AND end_date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
        AND end_date >= CURRENT_DATE
    ) LOOP
        FOR family_rec IN (
            SELECT f.id, get_family_full_name(f.id) AS family_name
            FROM families f
            WHERE f.camp_id = campaign_rec.camp_id
            AND f.status = 'موافق'
        ) LOOP
            IF NOT has_recent_notification(family_rec.id, 'حملة_قرب_انتهاء', campaign_rec.id, 48) THEN
                INSERT INTO notifications (family_id, notification_type, priority, title, message, is_read, related_entity_id, related_entity_type)
                VALUES (
                    family_rec.id,
                    'حملة_قرب_انتهاء',
                    'عالي',
                    'تذكير: انتهاء حملة التوزيع قريباً',
                    'حملة التوزيع "' || COALESCE(campaign_rec.name, 'حملة التوزيع') || 
                    '" تنتهي خلال ' || p_days_ahead || ' أيام. ' ||
                    'يرجى مراجعة موقع التوزيع قبل الإغلاق.',
                    FALSE,
                    campaign_rec.id,
                    'حملة_مساعدات'
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function: Failed login alert (call from auth system)
CREATE OR REPLACE FUNCTION create_failed_login_alert(p_username VARCHAR(255), p_ip_address INET, p_attempt_count INTEGER)
RETURNS VOID AS $$
DECLARE
    admin_rec RECORD;
BEGIN
    IF p_attempt_count >= 5 THEN
        FOR admin_rec IN (
            SELECT u.id, u.family_id
            FROM users u
            WHERE u.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER')
            AND u.is_active = TRUE
        ) LOOP
            INSERT INTO notifications (family_id, notification_type, priority, channel, title, message, is_read, related_entity_id, related_entity_type)
            VALUES (
                admin_rec.family_id,
                'دخول_فاشل_تنبيه',
                'عالي',
                'تطبيق',
                'تنبيه أمني: محاولات دخول فاشلة',
                'تم رصد ' || p_attempt_count || ' محاولات دخول فاشلة للحساب: ' || 
                COALESCE(p_username, 'غير معروف') || 
                ' من العنوان IP: ' || COALESCE(p_ip_address::TEXT, 'غير معروف'),
                FALSE,
                NULL,
                'أمن'
            );
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- Updated Cleanup Function
-- --------------------------------------------

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
    -- Delete read notifications by priority
    DELETE FROM notifications WHERE is_read = TRUE AND priority = 'عادي' AND created_at < NOW() - INTERVAL '90 days';
    DELETE FROM notifications WHERE is_read = TRUE AND priority = 'عالي' AND created_at < NOW() - INTERVAL '180 days';
    DELETE FROM notifications WHERE is_read = TRUE AND priority = 'منخفض' AND created_at < NOW() - INTERVAL '365 days';
    DELETE FROM notifications WHERE is_read = TRUE AND priority = 'عاجل جداً' AND created_at < NOW() - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;

-- Comments for all functions
COMMENT ON FUNCTION has_recent_notification IS 'يتحقق من وجود إشعار مماثل مؤخراً (لمنع التكرار)';
COMMENT ON FUNCTION get_camp_managers IS 'يعيد جميع مديري المخيم لمخيم معين';
COMMENT ON FUNCTION get_camp_staff IS 'يعيد جميع موظفي المخيم (مديرين + موظفين ميدانيين) لمخيم معين';
COMMENT ON FUNCTION create_notification_for_distribution IS 'ينشئ إشعارات لجميع الأسر الموافقة عند إنشاء حملة توزيع جديدة';
COMMENT ON FUNCTION create_notification_for_distribution_status IS 'ينشئ إشعاراً عند تغيير حالة التوزيع إلى مكتمل';
COMMENT ON FUNCTION create_notification_for_complaint_response IS 'ينشئ إشعاراً عند الرد على شكوى أو تغيير حالتها';
COMMENT ON FUNCTION create_notification_for_emergency_response IS 'ينشئ إشعاراً عند تغيير حالة بلاغ الطوارئ أو إضافة حل';
COMMENT ON FUNCTION create_notification_for_transfer_update IS 'ينشئ إشعاراً عند تغيير حالة طلب الانتقال';
COMMENT ON FUNCTION create_notification_for_special_assistance_response IS 'ينشئ إشعاراً عند الرد على طلب مساعدة خاصة';
COMMENT ON FUNCTION create_notification_for_family_approval IS 'ينشئ إشعاراً عند الموافقة على تسجيل الأسرة';
COMMENT ON FUNCTION create_notification_for_family_status IS 'ينشئ إشعاراً عند تغيير حالة الأسرة';
COMMENT ON FUNCTION create_notification_for_distribution_assigned IS 'يخطر العائلة عندما تكون المساعدات جاهزة للاستلام';
COMMENT ON FUNCTION create_notification_for_campaign_status IS 'يخطر العائلات عند تغيير حالة الحملة';
COMMENT ON FUNCTION create_notification_for_verification_required IS 'يخطر العائلة عندما يكون مطلوباً تأكيد OTP/بصمة';
COMMENT ON FUNCTION notify_staff_new_complaint IS 'يخطر مديري المخيم عند تقديم شكوى جديدة';
COMMENT ON FUNCTION notify_staff_new_emergency IS 'يخطر موظفي المخيم فوراً عند تقديم بلاغ طوارئ (عبر رسالة نصية)';
COMMENT ON FUNCTION notify_staff_new_transfer IS 'يخطر مديري المخيمين عند تقديم طلب انتقال';
COMMENT ON FUNCTION notify_staff_new_special_assistance IS 'يخطر مديري المخيم عند تقديم طلب مساعدة خاصة';
COMMENT ON FUNCTION notify_new_inventory_received IS 'يخطر المديرين عند استلام مخزون جديد';
COMMENT ON FUNCTION create_low_stock_notifications IS 'ينشئ تنبيهات للأصناف التي وصلت للحد الأدنى (يُستدعى من مهمة مجدولة)';
COMMENT ON FUNCTION create_expiry_warning_notifications IS 'ينشئ تنبيهات للأصناف التي تقترب من الانتهاء (يُستدعى من مهمة مجدولة)';
COMMENT ON FUNCTION create_campaign_ending_soon_notifications IS 'يذكر العائلات عندما تنتهي الحملة قريباً (يُستدعى من مهمة مجدولة)';
COMMENT ON FUNCTION create_failed_login_alert IS 'يخطر المديرين من نشاط دخول مشبوه (يُستدعى من نظام المصادقة)';
COMMENT ON FUNCTION cleanup_old_notifications IS 'يحذف الإشعارات المقروءة القديمة حسب الأولوية';
