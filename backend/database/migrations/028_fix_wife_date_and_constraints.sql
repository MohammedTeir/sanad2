-- Migration 028: Fix wife_date_of_birth column and CHECK constraints
-- This migration ensures the wife_date_of_birth column exists and all CHECK constraints are up to date

-- Step 1: Add wife_date_of_birth column if it doesn't exist
ALTER TABLE families 
ADD COLUMN IF NOT EXISTS wife_date_of_birth DATE;

-- Step 2: Drop old CHECK constraints to recreate them with correct values
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_head_of_family_gender_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_head_of_family_marital_status_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_head_of_family_widow_reason_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_head_of_family_role_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_head_of_family_disability_type_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_head_of_family_disability_severity_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_head_of_family_chronic_disease_type_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_head_of_family_war_injury_type_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_original_address_housing_type_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_current_housing_type_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_current_housing_sharing_status_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_current_housing_sanitary_facilities_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_current_housing_water_source_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_current_housing_electricity_access_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_refugee_resident_abroad_residence_type_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_vulnerability_priority_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_status_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_head_of_family_monthly_income_range_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_wife_disability_type_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_wife_disability_severity_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_wife_chronic_disease_type_check;
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_wife_war_injury_type_check;

-- Step 3: Recreate CHECK constraints with correct Arabic values

-- Head of family gender
ALTER TABLE families ADD CONSTRAINT families_head_of_family_gender_check
    CHECK (head_of_family_gender IN ('ذكر', 'أنثى'));

-- Head of family marital status
ALTER TABLE families ADD CONSTRAINT families_head_of_family_marital_status_check
    CHECK (head_of_family_marital_status IN ('أعزب', 'متزوج', 'أرمل', 'مطلق', 'أسرة هشة'));

-- Head of family widow reason
ALTER TABLE families ADD CONSTRAINT families_head_of_family_widow_reason_check
    CHECK (head_of_family_widow_reason IN ('شهيد', 'وفاة طبيعية', 'حادث', 'مرض', 'غير ذلك'));

-- Head of family role (nullable)
ALTER TABLE families ADD CONSTRAINT families_head_of_family_role_check
    CHECK (head_of_family_role IS NULL OR head_of_family_role IN ('أب', 'أم', 'زوجة'));

-- Head of family disability type
ALTER TABLE families ADD CONSTRAINT families_head_of_family_disability_type_check
    CHECK (head_of_family_disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'));

-- Head of family disability severity
ALTER TABLE families ADD CONSTRAINT families_head_of_family_disability_severity_check
    CHECK (head_of_family_disability_severity IS NULL OR head_of_family_disability_severity = '' OR head_of_family_disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية'));

-- Head of family chronic disease type
ALTER TABLE families ADD CONSTRAINT families_head_of_family_chronic_disease_type_check
    CHECK (head_of_family_chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'));

-- Head of family war injury type
ALTER TABLE families ADD CONSTRAINT families_head_of_family_war_injury_type_check
    CHECK (head_of_family_war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'));

-- Original address housing type
ALTER TABLE families ADD CONSTRAINT families_original_address_housing_type_check
    CHECK (original_address_housing_type IS NULL OR original_address_housing_type IN ('ملك', 'إيجار'));

-- Current housing type
ALTER TABLE families ADD CONSTRAINT families_current_housing_type_check
    CHECK (current_housing_type IN ('خيمة', 'بيت إسمنتي', 'شقة', 'أخرى'));

-- Current housing sharing status
ALTER TABLE families ADD CONSTRAINT families_current_housing_sharing_status_check
    CHECK (current_housing_sharing_status IS NULL OR current_housing_sharing_status IN ('سكن فردي', 'سكن مشترك'));

-- Current housing sanitary facilities
ALTER TABLE families ADD CONSTRAINT families_current_housing_sanitary_facilities_check
    CHECK (current_housing_sanitary_facilities IS NULL OR current_housing_sanitary_facilities IN ('نعم (دورة مياه خاصة)', 'لا (مرافق مشتركة)'));

-- Current housing water source
ALTER TABLE families ADD CONSTRAINT families_current_housing_water_source_check
    CHECK (current_housing_water_source IS NULL OR current_housing_water_source IN ('شبكة عامة', 'صهاريج', 'آبار', 'آخر'));

-- Current housing electricity access
ALTER TABLE families ADD CONSTRAINT families_current_housing_electricity_access_check
    CHECK (current_housing_electricity_access IS NULL OR current_housing_electricity_access IN ('شبكة عامة', 'مولد', 'طاقة شمسية', 'لا يوجد', 'آخر'));

-- Refugee resident abroad residence type
ALTER TABLE families ADD CONSTRAINT families_refugee_resident_abroad_residence_type_check
    CHECK (refugee_resident_abroad_residence_type IS NULL OR refugee_resident_abroad_residence_type IN ('لاجئ', 'مقيم نظامي', 'أخرى'));

-- Vulnerability priority
ALTER TABLE families ADD CONSTRAINT families_vulnerability_priority_check
    CHECK (vulnerability_priority IS NULL OR vulnerability_priority IN ('عالي جداً', 'عالي', 'متوسط', 'منخفض'));

-- Status
ALTER TABLE families ADD CONSTRAINT families_status_check
    CHECK (status IN ('قيد الانتظار', 'موافق', 'مرفوض'));

-- Head of family monthly income range
ALTER TABLE families ADD CONSTRAINT families_head_of_family_monthly_income_range_check
    CHECK (head_of_family_monthly_income_range IS NULL OR head_of_family_monthly_income_range IN ('بدون دخل', 'أقل من 100', '100-300', '300-500', 'أكثر من 500'));

-- Wife disability type
ALTER TABLE families ADD CONSTRAINT families_wife_disability_type_check
    CHECK (wife_disability_type IS NULL OR wife_disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'));

-- Wife disability severity
ALTER TABLE families ADD CONSTRAINT families_wife_disability_severity_check
    CHECK (wife_disability_severity IS NULL OR wife_disability_severity = '' OR wife_disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية'));

-- Wife chronic disease type
ALTER TABLE families ADD CONSTRAINT families_wife_chronic_disease_type_check
    CHECK (wife_chronic_disease_type IS NULL OR wife_chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'));

-- Wife war injury type
ALTER TABLE families ADD CONSTRAINT families_wife_war_injury_type_check
    CHECK (wife_war_injury_type IS NULL OR wife_war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'));

-- Add comment to document this migration
COMMENT ON COLUMN families.wife_date_of_birth IS 'تاريخ ميلاد الزوجة - يضاف في Migration 028';

-- Note: Migration applied successfully if no errors above
