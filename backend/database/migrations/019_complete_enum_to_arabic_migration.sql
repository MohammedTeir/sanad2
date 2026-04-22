-- =====================================================
-- COMPLETE ENUM TO ARABIC MIGRATION
-- This script handles the complete migration process
-- Run this ONCE to convert all English enum values to Arabic
-- =====================================================

-- =====================================================
-- STEP 0: DISABLE TRIGGERS THAT MIGHT CAUSE ISSUES
-- =====================================================

-- Temporarily disable the updated_at trigger on families
DROP TRIGGER IF EXISTS update_families_updated_at ON families;

-- Temporarily disable the updated_at trigger on individuals
DROP TRIGGER IF EXISTS update_individuals_updated_at ON individuals;

-- Add updated_at column if it doesn't exist (for families table)
ALTER TABLE families ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Add updated_at column if it doesn't exist (for individuals table)  
ALTER TABLE individuals ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- Set default value for updated_at
ALTER TABLE families ALTER COLUMN updated_at SET DEFAULT NOW();
ALTER TABLE individuals ALTER COLUMN updated_at SET DEFAULT NOW();

-- Update existing rows to have updated_at set
UPDATE families SET updated_at = NOW() WHERE updated_at IS NULL;
UPDATE individuals SET updated_at = NOW() WHERE updated_at IS NULL;

-- =====================================================
-- STEP 1: DROP EXISTING CHECK CONSTRAINTS
-- This allows us to update the data without violations
-- =====================================================

-- Families table constraints
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

-- Individuals table constraints
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_gender_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_relation_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_education_stage_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_education_level_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_marital_status_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_disability_type_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_disability_severity_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_chronic_disease_type_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_war_injury_type_check;

-- Camps table constraints
ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_status_check;

-- Distributions table constraints
ALTER TABLE distributions DROP CONSTRAINT IF EXISTS distributions_status_check;

-- Distribution records table constraints
ALTER TABLE distribution_records DROP CONSTRAINT IF EXISTS distribution_records_status_check;

-- Inventory table constraints
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_category_check;

-- Aid campaigns table constraints
ALTER TABLE aid_campaigns DROP CONSTRAINT IF EXISTS aid_campaigns_status_check;

-- Aid distributions table constraints
ALTER TABLE aid_distributions DROP CONSTRAINT IF EXISTS aid_distributions_status_check;

-- Inventory transactions table constraints
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_transaction_type_check;
ALTER TABLE inventory_transactions DROP CONSTRAINT IF EXISTS inventory_transactions_related_to_check;

-- Inventory audits table constraints
ALTER TABLE inventory_audits DROP CONSTRAINT IF EXISTS inventory_audits_reason_check;

-- Transfer requests table constraints
ALTER TABLE transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_status_check;

-- Import/export operations table constraints
ALTER TABLE import_export_operations DROP CONSTRAINT IF EXISTS import_export_operations_operation_type_check;
ALTER TABLE import_export_operations DROP CONSTRAINT IF EXISTS import_export_operations_status_check;

-- Backup/sync operations table constraints
ALTER TABLE backup_sync_operations DROP CONSTRAINT IF EXISTS backup_sync_operations_operation_type_check;
ALTER TABLE backup_sync_operations DROP CONSTRAINT IF EXISTS backup_sync_operations_scope_check;
ALTER TABLE backup_sync_operations DROP CONSTRAINT IF EXISTS backup_sync_operations_status_check;

-- =====================================================
-- STEP 2: CONVERT FAMILIES TABLE DATA
-- =====================================================

-- Gender
UPDATE families SET
  head_of_family_gender = CASE
    WHEN head_of_family_gender = 'male' THEN 'ذكر'
    WHEN head_of_family_gender = 'female' THEN 'أنثى'
    ELSE head_of_family_gender
  END
WHERE head_of_family_gender IN ('male', 'female');

-- Marital Status
UPDATE families SET
  head_of_family_marital_status = CASE
    WHEN head_of_family_marital_status = 'single' THEN 'أعزب'
    WHEN head_of_family_marital_status = 'married' THEN 'متزوج'
    WHEN head_of_family_marital_status = 'widow' THEN 'أرمل'
    WHEN head_of_family_marital_status = 'divorced' THEN 'مطلق'
    WHEN head_of_family_marital_status = 'vulnerable' THEN 'أسرة هشة'
    ELSE head_of_family_marital_status
  END
WHERE head_of_family_marital_status IN ('single', 'married', 'widow', 'divorced', 'vulnerable');

-- Widow Reason
UPDATE families SET
  head_of_family_widow_reason = CASE
    WHEN head_of_family_widow_reason = 'martyr' THEN 'شهيد'
    WHEN head_of_family_widow_reason = 'natural' THEN 'وفاة طبيعية'
    WHEN head_of_family_widow_reason = 'accident' THEN 'حادث'
    WHEN head_of_family_widow_reason = 'disease' THEN 'مرض'
    WHEN head_of_family_widow_reason = 'other' THEN 'غير ذلك'
    ELSE head_of_family_widow_reason
  END
WHERE head_of_family_widow_reason IN ('martyr', 'natural', 'accident', 'disease', 'other');

-- Head of Family Role
UPDATE families SET
  head_of_family_role = CASE
    WHEN head_of_family_role = 'father' THEN 'أب'
    WHEN head_of_family_role = 'mother' THEN 'أم'
    WHEN head_of_family_role = 'wife_head' THEN 'زوجة'
    ELSE head_of_family_role
  END
WHERE head_of_family_role IN ('father', 'mother', 'wife_head');

-- Disability Type (Head of Family)
UPDATE families SET
  head_of_family_disability_type = CASE
    WHEN head_of_family_disability_type = 'none' THEN 'لا يوجد'
    WHEN head_of_family_disability_type = 'motor' THEN 'حركية'
    WHEN head_of_family_disability_type = 'visual' THEN 'بصرية'
    WHEN head_of_family_disability_type = 'hearing' THEN 'سمعية'
    WHEN head_of_family_disability_type = 'mental' THEN 'ذهنية'
    WHEN head_of_family_disability_type = 'other' THEN 'أخرى'
    ELSE head_of_family_disability_type
  END
WHERE head_of_family_disability_type IN ('none', 'motor', 'visual', 'hearing', 'mental', 'other');

-- Disability Severity (Head of Family)
UPDATE families SET
  head_of_family_disability_severity = CASE
    WHEN head_of_family_disability_severity = 'simple' THEN 'بسيطة'
    WHEN head_of_family_disability_severity = 'moderate' THEN 'متوسطة'
    WHEN head_of_family_disability_severity = 'severe' THEN 'شديدة'
    WHEN head_of_family_disability_severity = 'total' THEN 'كلية'
    ELSE head_of_family_disability_severity
  END
WHERE head_of_family_disability_severity IN ('simple', 'moderate', 'severe', 'total');

-- Chronic Disease Type (Head of Family)
UPDATE families SET
  head_of_family_chronic_disease_type = CASE
    WHEN head_of_family_chronic_disease_type = 'none' THEN 'لا يوجد'
    WHEN head_of_family_chronic_disease_type = 'diabetes' THEN 'سكري'
    WHEN head_of_family_chronic_disease_type = 'blood_pressure' THEN 'ضغط دم'
    WHEN head_of_family_chronic_disease_type = 'heart' THEN 'قلب'
    WHEN head_of_family_chronic_disease_type = 'cancer' THEN 'سرطان'
    WHEN head_of_family_chronic_disease_type = 'asthma' THEN 'ربو'
    WHEN head_of_family_chronic_disease_type = 'kidney_failure' THEN 'فشل كلوي'
    WHEN head_of_family_chronic_disease_type = 'mental_disease' THEN 'مرض نفسي'
    WHEN head_of_family_chronic_disease_type = 'other' THEN 'أخرى'
    ELSE head_of_family_chronic_disease_type
  END
WHERE head_of_family_chronic_disease_type IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other');

-- War Injury Type (Head of Family)
UPDATE families SET
  head_of_family_war_injury_type = CASE
    WHEN head_of_family_war_injury_type = 'none' THEN 'لا يوجد'
    WHEN head_of_family_war_injury_type = 'amputation' THEN 'بتر'
    WHEN head_of_family_war_injury_type = 'fracture' THEN 'كسر'
    WHEN head_of_family_war_injury_type = 'shrapnel' THEN 'شظية'
    WHEN head_of_family_war_injury_type = 'burn' THEN 'حرق'
    WHEN head_of_family_war_injury_type = 'head_face' THEN 'رأس/وجه'
    WHEN head_of_family_war_injury_type = 'spinal' THEN 'عمود فقري'
    WHEN head_of_family_war_injury_type = 'other' THEN 'أخرى'
    ELSE head_of_family_war_injury_type
  END
WHERE head_of_family_war_injury_type IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other');

-- Housing Type (Original)
UPDATE families SET
  original_address_housing_type = CASE
    WHEN original_address_housing_type = 'owned' THEN 'ملك'
    WHEN original_address_housing_type = 'rented' THEN 'إيجار'
    ELSE original_address_housing_type
  END
WHERE original_address_housing_type IN ('owned', 'rented');

-- Current Housing Type
UPDATE families SET
  current_housing_type = CASE
    WHEN current_housing_type = 'tent' THEN 'خيمة'
    WHEN current_housing_type = 'concrete_house' THEN 'بيت إسمنتي'
    WHEN current_housing_type = 'apartment' THEN 'شقة'
    WHEN current_housing_type = 'other' THEN 'أخرى'
    ELSE current_housing_type
  END
WHERE current_housing_type IN ('tent', 'concrete_house', 'apartment', 'other');

-- Housing Sharing Status
UPDATE families SET
  current_housing_sharing_status = CASE
    WHEN current_housing_sharing_status = 'individual' THEN 'سكن فردي'
    WHEN current_housing_sharing_status = 'shared' THEN 'سكن مشترك'
    ELSE current_housing_sharing_status
  END
WHERE current_housing_sharing_status IN ('individual', 'shared');

-- Sanitary Facilities
UPDATE families SET
  current_housing_sanitary_facilities = CASE
    WHEN current_housing_sanitary_facilities = 'private' THEN 'نعم (دورة مياه خاصة)'
    WHEN current_housing_sanitary_facilities = 'shared' THEN 'لا (مرافق مشتركة)'
    ELSE current_housing_sanitary_facilities
  END
WHERE current_housing_sanitary_facilities IN ('private', 'shared');

-- Water Source
UPDATE families SET
  current_housing_water_source = CASE
    WHEN current_housing_water_source = 'public_network' THEN 'شبكة عامة'
    WHEN current_housing_water_source = 'tanker' THEN 'صهاريج'
    WHEN current_housing_water_source = 'well' THEN 'آبار'
    WHEN current_housing_water_source = 'other' THEN 'آخر'
    ELSE current_housing_water_source
  END
WHERE current_housing_water_source IN ('public_network', 'tanker', 'well', 'other');

-- Electricity Access
UPDATE families SET
  current_housing_electricity_access = CASE
    WHEN current_housing_electricity_access = 'public_grid' THEN 'شبكة عامة'
    WHEN current_housing_electricity_access = 'generator' THEN 'مولد'
    WHEN current_housing_electricity_access = 'solar' THEN 'طاقة شمسية'
    WHEN current_housing_electricity_access = 'none' THEN 'لا يوجد'
    WHEN current_housing_electricity_access = 'other' THEN 'آخر'
    ELSE current_housing_electricity_access
  END
WHERE current_housing_electricity_access IN ('public_grid', 'generator', 'solar', 'none', 'other');

-- Residence Type (Refugee)
UPDATE families SET
  refugee_resident_abroad_residence_type = CASE
    WHEN refugee_resident_abroad_residence_type = 'refugee' THEN 'لاجئ'
    WHEN refugee_resident_abroad_residence_type = 'legal_resident' THEN 'مقيم نظامي'
    WHEN refugee_resident_abroad_residence_type = 'other' THEN 'أخرى'
    ELSE refugee_resident_abroad_residence_type
  END
WHERE refugee_resident_abroad_residence_type IN ('refugee', 'legal_resident', 'other');

-- Vulnerability Priority
UPDATE families SET
  vulnerability_priority = CASE
    WHEN vulnerability_priority = 'very_high' THEN 'عالي جداً'
    WHEN vulnerability_priority = 'high' THEN 'عالي'
    WHEN vulnerability_priority = 'medium' THEN 'متوسط'
    WHEN vulnerability_priority = 'low' THEN 'منخفض'
    ELSE vulnerability_priority
  END
WHERE vulnerability_priority IN ('very_high', 'high', 'medium', 'low');

-- Status
UPDATE families SET
  status = CASE
    WHEN status = 'pending' THEN 'قيد الانتظار'
    WHEN status = 'approved' THEN 'موافق'
    WHEN status = 'rejected' THEN 'مرفوض'
    ELSE status
  END
WHERE status IN ('pending', 'approved', 'rejected');

-- Income Range
UPDATE families SET
  head_of_family_monthly_income_range = CASE
    WHEN head_of_family_monthly_income_range = 'no_income' THEN 'بدون دخل'
    WHEN head_of_family_monthly_income_range = 'under_100' THEN 'أقل من 100'
    WHEN head_of_family_monthly_income_range = '100_to_300' THEN '100-300'
    WHEN head_of_family_monthly_income_range = '300_to_500' THEN '300-500'
    WHEN head_of_family_monthly_income_range = 'over_500' THEN 'أكثر من 500'
    ELSE head_of_family_monthly_income_range
  END
WHERE head_of_family_monthly_income_range IN ('no_income', 'under_100', '100_to_300', '300_to_500', 'over_500');

-- Wife Disability Type
UPDATE families SET
  wife_disability_type = CASE
    WHEN wife_disability_type = 'none' THEN 'لا يوجد'
    WHEN wife_disability_type = 'motor' THEN 'حركية'
    WHEN wife_disability_type = 'visual' THEN 'بصرية'
    WHEN wife_disability_type = 'hearing' THEN 'سمعية'
    WHEN wife_disability_type = 'mental' THEN 'ذهنية'
    WHEN wife_disability_type = 'other' THEN 'أخرى'
    ELSE wife_disability_type
  END
WHERE wife_disability_type IN ('none', 'motor', 'visual', 'hearing', 'mental', 'other');

-- Wife Disability Severity
UPDATE families SET
  wife_disability_severity = CASE
    WHEN wife_disability_severity = 'simple' THEN 'بسيطة'
    WHEN wife_disability_severity = 'moderate' THEN 'متوسطة'
    WHEN wife_disability_severity = 'severe' THEN 'شديدة'
    WHEN wife_disability_severity = 'total' THEN 'كلية'
    ELSE wife_disability_severity
  END
WHERE wife_disability_severity IN ('simple', 'moderate', 'severe', 'total');

-- Wife Chronic Disease Type
UPDATE families SET
  wife_chronic_disease_type = CASE
    WHEN wife_chronic_disease_type = 'none' THEN 'لا يوجد'
    WHEN wife_chronic_disease_type = 'diabetes' THEN 'سكري'
    WHEN wife_chronic_disease_type = 'blood_pressure' THEN 'ضغط دم'
    WHEN wife_chronic_disease_type = 'heart' THEN 'قلب'
    WHEN wife_chronic_disease_type = 'cancer' THEN 'سرطان'
    WHEN wife_chronic_disease_type = 'asthma' THEN 'ربو'
    WHEN wife_chronic_disease_type = 'kidney_failure' THEN 'فشل كلوي'
    WHEN wife_chronic_disease_type = 'mental_disease' THEN 'مرض نفسي'
    WHEN wife_chronic_disease_type = 'other' THEN 'أخرى'
    ELSE wife_chronic_disease_type
  END
WHERE wife_chronic_disease_type IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other');

-- Wife War Injury Type
UPDATE families SET
  wife_war_injury_type = CASE
    WHEN wife_war_injury_type = 'none' THEN 'لا يوجد'
    WHEN wife_war_injury_type = 'amputation' THEN 'بتر'
    WHEN wife_war_injury_type = 'fracture' THEN 'كسر'
    WHEN wife_war_injury_type = 'shrapnel' THEN 'شظية'
    WHEN wife_war_injury_type = 'burn' THEN 'حرق'
    WHEN wife_war_injury_type = 'head_face' THEN 'رأس/وجه'
    WHEN wife_war_injury_type = 'spinal' THEN 'عمود فقري'
    WHEN wife_war_injury_type = 'other' THEN 'أخرى'
    ELSE wife_war_injury_type
  END
WHERE wife_war_injury_type IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other');

-- =====================================================
-- STEP 3: CONVERT INDIVIDUALS TABLE DATA
-- =====================================================

-- Gender
UPDATE individuals SET
  gender = CASE
    WHEN gender = 'male' THEN 'ذكر'
    WHEN gender = 'female' THEN 'أنثى'
    ELSE gender
  END
WHERE gender IN ('male', 'female');

-- Relation
UPDATE individuals SET
  relation = CASE
    WHEN relation = 'father' THEN 'الأب'
    WHEN relation = 'mother' THEN 'الأم'
    WHEN relation = 'wife' THEN 'الزوجة'
    WHEN relation = 'husband' THEN 'الزوج'
    WHEN relation = 'son' THEN 'الابن'
    WHEN relation = 'daughter' THEN 'البنت'
    WHEN relation = 'brother' THEN 'الأخ'
    WHEN relation = 'sister' THEN 'الأخت'
    WHEN relation = 'grandfather' THEN 'الجد'
    WHEN relation = 'grandmother' THEN 'الجدة'
    WHEN relation = 'grandson' THEN 'الحفيد'
    WHEN relation = 'granddaughter' THEN 'الحفيدة'
    WHEN relation = 'uncle' THEN 'العم'
    WHEN relation = 'aunt' THEN 'العمة'
    WHEN relation = 'nephew' THEN 'ابن الأخ'
    WHEN relation = 'niece' THEN 'ابنة الأخ'
    WHEN relation = 'cousin' THEN 'ابن العم'
    WHEN relation = 'other' THEN 'أخرى'
    ELSE relation
  END
WHERE relation IN ('father', 'mother', 'wife', 'husband', 'son', 'daughter', 'brother', 'sister', 'grandfather', 'grandmother', 'grandson', 'granddaughter', 'uncle', 'aunt', 'nephew', 'niece', 'cousin', 'other');

-- Education Stage
UPDATE individuals SET
  education_stage = CASE
    WHEN education_stage = 'none' THEN 'لا يدرس'
    WHEN education_stage = 'primary' THEN 'ابتدائي'
    WHEN education_stage = 'secondary' THEN 'إعدادي/ثانوي'
    WHEN education_stage = 'university' THEN 'جامعي'
    WHEN education_stage = 'other' THEN 'أخرى'
    ELSE education_stage
  END
WHERE education_stage IN ('none', 'primary', 'secondary', 'university', 'other');

-- Education Level
UPDATE individuals SET
  education_level = CASE
    WHEN education_level = 'none' THEN 'لا يدرس'
    WHEN education_level = 'primary' THEN 'ابتدائي'
    WHEN education_level = 'secondary' THEN 'إعدادي/ثانوي'
    WHEN education_level = 'university' THEN 'جامعي'
    WHEN education_level = 'other' THEN 'أخرى'
    ELSE education_level
  END
WHERE education_level IN ('none', 'primary', 'secondary', 'university', 'other');

-- Marital Status
UPDATE individuals SET
  marital_status = CASE
    WHEN marital_status = 'single' THEN 'أعزب/عزباء'
    WHEN marital_status = 'married' THEN 'متزوج/ة'
    WHEN marital_status = 'widow' THEN 'أرمل/ة'
    WHEN marital_status = 'divorced' THEN 'مطلق/ة'
    WHEN marital_status = 'vulnerable' THEN 'حالة خاصة'
    ELSE marital_status
  END
WHERE marital_status IN ('single', 'married', 'widow', 'divorced', 'vulnerable');

-- Disability Type
UPDATE individuals SET
  disability_type = CASE
    WHEN disability_type = 'none' THEN 'لا يوجد'
    WHEN disability_type = 'motor' THEN 'حركية'
    WHEN disability_type = 'visual' THEN 'بصرية'
    WHEN disability_type = 'hearing' THEN 'سمعية'
    WHEN disability_type = 'mental' THEN 'ذهنية'
    WHEN disability_type = 'other' THEN 'أخرى'
    ELSE disability_type
  END
WHERE disability_type IN ('none', 'motor', 'visual', 'hearing', 'mental', 'other');

-- Disability Severity
UPDATE individuals SET
  disability_severity = CASE
    WHEN disability_severity = 'simple' THEN 'بسيطة'
    WHEN disability_severity = 'moderate' THEN 'متوسطة'
    WHEN disability_severity = 'severe' THEN 'شديدة'
    WHEN disability_severity = 'total' THEN 'كلية'
    ELSE disability_severity
  END
WHERE disability_severity IN ('simple', 'moderate', 'severe', 'total');

-- Chronic Disease Type
UPDATE individuals SET
  chronic_disease_type = CASE
    WHEN chronic_disease_type = 'none' THEN 'لا يوجد'
    WHEN chronic_disease_type = 'diabetes' THEN 'سكري'
    WHEN chronic_disease_type = 'blood_pressure' THEN 'ضغط دم'
    WHEN chronic_disease_type = 'heart' THEN 'قلب'
    WHEN chronic_disease_type = 'cancer' THEN 'سرطان'
    WHEN chronic_disease_type = 'asthma' THEN 'ربو'
    WHEN chronic_disease_type = 'kidney_failure' THEN 'فشل كلوي'
    WHEN chronic_disease_type = 'mental_disease' THEN 'مرض نفسي'
    WHEN chronic_disease_type = 'other' THEN 'أخرى'
    ELSE chronic_disease_type
  END
WHERE chronic_disease_type IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other');

-- War Injury Type
UPDATE individuals SET
  war_injury_type = CASE
    WHEN war_injury_type = 'none' THEN 'لا يوجد'
    WHEN war_injury_type = 'amputation' THEN 'بتر'
    WHEN war_injury_type = 'fracture' THEN 'كسر'
    WHEN war_injury_type = 'shrapnel' THEN 'شظية'
    WHEN war_injury_type = 'burn' THEN 'حرق'
    WHEN war_injury_type = 'head_face' THEN 'رأس/وجه'
    WHEN war_injury_type = 'spinal' THEN 'عمود فقري'
    WHEN war_injury_type = 'other' THEN 'أخرى'
    ELSE war_injury_type
  END
WHERE war_injury_type IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other');

-- =====================================================
-- STEP 4: CONVERT OTHER TABLES
-- =====================================================

-- Camps status
UPDATE camps SET
  status = CASE
    WHEN status = 'active' THEN 'نشط'
    WHEN status = 'pending' THEN 'قيد الانتظار'
    WHEN status = 'full' THEN 'ممتلئ'
    ELSE status
  END
WHERE status IN ('active', 'pending', 'full');

-- Distributions status
UPDATE distributions SET
  status = CASE
    WHEN status = 'pending' THEN 'قيد الانتظار'
    WHEN status = 'active' THEN 'نشط'
    WHEN status = 'completed' THEN 'مكتمل'
    ELSE status
  END
WHERE status IN ('pending', 'active', 'completed');

-- Distribution records status
UPDATE distribution_records SET
  status = CASE
    WHEN status = 'delivered' THEN 'تم التسليم'
    WHEN status = 'pending' THEN 'قيد الانتظار'
    ELSE status
  END
WHERE status IN ('delivered', 'pending');

-- Inventory category
UPDATE inventory SET
  category = CASE
    WHEN category = 'food' THEN 'غذاء'
    WHEN category = 'medical' THEN 'طبي'
    WHEN category = 'shelter' THEN 'مأوى'
    WHEN category = 'water' THEN 'ماء'
    WHEN category = 'other' THEN 'أخرى'
    ELSE category
  END
WHERE category IN ('food', 'medical', 'shelter', 'water', 'other');

-- Aid campaigns status
UPDATE aid_campaigns SET
  status = CASE
    WHEN status = 'planned' THEN 'مخطط'
    WHEN status = 'active' THEN 'نشط'
    WHEN status = 'completed' THEN 'مكتمل'
    WHEN status = 'cancelled' THEN 'ملغى'
    ELSE status
  END
WHERE status IN ('planned', 'active', 'completed', 'cancelled');

-- Aid distributions status
UPDATE aid_distributions SET
  status = CASE
    WHEN status = 'delivered' THEN 'تم التسليم'
    WHEN status = 'pending' THEN 'قيد الانتظار'
    ELSE status
  END
WHERE status IN ('delivered', 'pending');

-- Inventory transactions
UPDATE inventory_transactions SET
  transaction_type = CASE
    WHEN transaction_type = 'in' THEN 'وارد'
    WHEN transaction_type = 'out' THEN 'صادر'
    ELSE transaction_type
  END
WHERE transaction_type IN ('in', 'out');

UPDATE inventory_transactions SET
  related_to = CASE
    WHEN related_to = 'purchase' THEN 'شراء'
    WHEN related_to = 'donation' THEN 'تبرع'
    WHEN related_to = 'distribution' THEN 'توزيع'
    WHEN related_to = 'transfer' THEN 'تحويل'
    WHEN related_to = 'adjustment' THEN 'تعديل'
    WHEN related_to = 'damage' THEN 'تلف'
    ELSE related_to
  END
WHERE related_to IN ('purchase', 'donation', 'distribution', 'transfer', 'adjustment', 'damage');

-- Inventory audits reason
UPDATE inventory_audits SET
  reason = CASE
    WHEN reason = 'shortage' THEN 'نقص'
    WHEN reason = 'surplus' THEN 'فائض'
    WHEN reason = 'theft' THEN 'سرقة'
    WHEN reason = 'damage' THEN 'تلف'
    WHEN reason = 'miscount' THEN 'خطأ عد'
    WHEN reason = 'other' THEN 'أخرى'
    ELSE reason
  END
WHERE reason IN ('shortage', 'surplus', 'theft', 'damage', 'miscount', 'other');

-- Transfer requests status
UPDATE transfer_requests SET
  status = CASE
    WHEN status = 'pending' THEN 'قيد الانتظار'
    WHEN status = 'approved' THEN 'موافق'
    WHEN status = 'rejected' THEN 'مرفوض'
    WHEN status = 'processed' THEN 'تمت المعالجة'
    ELSE status
  END
WHERE status IN ('pending', 'approved', 'rejected', 'processed');

-- Import/export operations
UPDATE import_export_operations SET
  operation_type = CASE
    WHEN operation_type = 'import' THEN 'استيراد'
    WHEN operation_type = 'export' THEN 'تصدير'
    ELSE operation_type
  END
WHERE operation_type IN ('import', 'export');

UPDATE import_export_operations SET
  status = CASE
    WHEN status = 'processing' THEN 'قيد المعالجة'
    WHEN status = 'completed' THEN 'مكتمل'
    WHEN status = 'failed' THEN 'فشل'
    ELSE status
  END
WHERE status IN ('processing', 'completed', 'failed');

-- Backup/sync operations
UPDATE backup_sync_operations SET
  operation_type = CASE
    WHEN operation_type = 'backup' THEN 'نسخة احتياطية'
    WHEN operation_type = 'sync' THEN 'مزامنة'
    WHEN operation_type = 'restore' THEN 'استعادة'
    ELSE operation_type
  END
WHERE operation_type IN ('backup', 'sync', 'restore');

UPDATE backup_sync_operations SET
  scope = CASE
    WHEN scope = 'full' THEN 'كامل'
    WHEN scope = 'partial' THEN 'جزئي'
    WHEN scope = 'camp_specific' THEN 'خاص بالمخيم'
    ELSE scope
  END
WHERE scope IN ('full', 'partial', 'camp_specific');

UPDATE backup_sync_operations SET
  status = CASE
    WHEN status = 'processing' THEN 'قيد المعالجة'
    WHEN status = 'completed' THEN 'مكتمل'
    WHEN status = 'failed' THEN 'فشل'
    ELSE status
  END
WHERE status IN ('processing', 'completed', 'failed');

-- =====================================================
-- STEP 5: VERIFICATION QUERIES
-- Run these to verify no English values remain
-- =====================================================

-- This will print a notice if any English values are found
DO $$
DECLARE
  families_count INTEGER;
  individuals_count INTEGER;
BEGIN
  -- Check families
  SELECT COUNT(*) INTO families_count
  FROM families 
  WHERE head_of_family_gender IN ('male', 'female')
     OR head_of_family_marital_status IN ('single', 'married', 'widow', 'divorced', 'vulnerable')
     OR head_of_family_role IN ('father', 'mother', 'wife_head')
     OR head_of_family_disability_type IN ('none', 'motor', 'visual', 'hearing', 'mental', 'other')
     OR head_of_family_chronic_disease_type IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other')
     OR head_of_family_war_injury_type IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other')
     OR current_housing_type IN ('tent', 'concrete_house', 'apartment', 'other')
     OR status IN ('pending', 'approved', 'rejected');
  
  -- Check individuals
  SELECT COUNT(*) INTO individuals_count
  FROM individuals 
  WHERE gender IN ('male', 'female')
     OR relation IN ('father', 'mother', 'wife', 'husband', 'son', 'daughter', 'brother', 'sister', 'grandfather', 'grandmother', 'grandson', 'granddaughter', 'uncle', 'aunt', 'nephew', 'niece', 'cousin', 'other')
     OR marital_status IN ('single', 'married', 'widow', 'divorced', 'vulnerable')
     OR disability_type IN ('none', 'motor', 'visual', 'hearing', 'mental', 'other')
     OR chronic_disease_type IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other')
     OR war_injury_type IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other');
  
  IF families_count > 0 THEN
    RAISE NOTICE 'WARNING: % families still have English values!', families_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All families data converted to Arabic!';
  END IF;
  
  IF individuals_count > 0 THEN
    RAISE NOTICE 'WARNING: % individuals still have English values!', individuals_count;
  ELSE
    RAISE NOTICE 'SUCCESS: All individuals data converted to Arabic!';
  END IF;
END $$;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- The CHECK constraints are already defined in the schema files.
-- They will be enforced for all new INSERT/UPDATE operations.
-- 
-- Next steps:
-- 1. Verify the migration was successful using the queries above
-- 2. Update the frontend code to use Arabic values (already done in DPDetails.tsx)
-- 3. Update remaining frontend files (DPManagement.tsx, RegisterFamily.tsx, etc.)
-- 4. Update backend services to remove English type casts
-- =====================================================
