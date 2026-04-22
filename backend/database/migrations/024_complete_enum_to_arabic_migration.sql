-- =====================================================
-- COMPLETE ENUM TO ARABIC MIGRATION
-- Migration 024: Final Complete Migration
-- This script updates CHECK constraints and converts all existing data
-- Based on schema: database_schema_unified_with_if_not_exists.sql
-- =====================================================

-- =====================================================
-- STEP 0: INCREASE COLUMN SIZES FOR ARABIC TEXT
-- =====================================================

-- Families table - increase VARCHAR sizes for Arabic text
ALTER TABLE families ALTER COLUMN head_of_family_marital_status TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN head_of_family_widow_reason TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN head_of_family_disability_type TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN head_of_family_disability_severity TYPE VARCHAR(20);
ALTER TABLE families ALTER COLUMN head_of_family_chronic_disease_type TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN head_of_family_war_injury_type TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN current_housing_type TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN current_housing_sharing_status TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN current_housing_sanitary_facilities TYPE VARCHAR(50);
ALTER TABLE families ALTER COLUMN current_housing_water_source TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN current_housing_electricity_access TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN refugee_resident_abroad_residence_type TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN vulnerability_priority TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN head_of_family_monthly_income_range TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN wife_disability_type TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN wife_disability_severity TYPE VARCHAR(20);
ALTER TABLE families ALTER COLUMN wife_chronic_disease_type TYPE VARCHAR(30);
ALTER TABLE families ALTER COLUMN wife_war_injury_type TYPE VARCHAR(30);

-- Individuals table - increase VARCHAR sizes for Arabic text
ALTER TABLE individuals ALTER COLUMN relation TYPE VARCHAR(30);
ALTER TABLE individuals ALTER COLUMN education_stage TYPE VARCHAR(30);
ALTER TABLE individuals ALTER COLUMN education_level TYPE VARCHAR(30);
ALTER TABLE individuals ALTER COLUMN marital_status TYPE VARCHAR(30);
ALTER TABLE individuals ALTER COLUMN disability_type TYPE VARCHAR(30);
ALTER TABLE individuals ALTER COLUMN disability_severity TYPE VARCHAR(20);
ALTER TABLE individuals ALTER COLUMN chronic_disease_type TYPE VARCHAR(30);
ALTER TABLE individuals ALTER COLUMN war_injury_type TYPE VARCHAR(30);

-- Camps table
ALTER TABLE camps ALTER COLUMN status TYPE VARCHAR(30);

-- Distributions table
ALTER TABLE distributions ALTER COLUMN status TYPE VARCHAR(30);

-- Distribution records table
ALTER TABLE distribution_records ALTER COLUMN status TYPE VARCHAR(30);

-- Inventory table
ALTER TABLE inventory ALTER COLUMN category TYPE VARCHAR(30);

-- Aid campaigns table
ALTER TABLE aid_campaigns ALTER COLUMN status TYPE VARCHAR(30);
ALTER TABLE aid_campaigns ALTER COLUMN aid_category TYPE VARCHAR(30);

-- Aid distributions table
ALTER TABLE aid_distributions ALTER COLUMN status TYPE VARCHAR(30);
ALTER TABLE aid_distributions ALTER COLUMN aid_category TYPE VARCHAR(30);

-- Aids table
ALTER TABLE aids ALTER COLUMN category TYPE VARCHAR(30);

-- Inventory items table
ALTER TABLE inventory_items ALTER COLUMN category TYPE VARCHAR(30);

-- Import/export operations table
ALTER TABLE import_export_operations ALTER COLUMN operation_type TYPE VARCHAR(30);
ALTER TABLE import_export_operations ALTER COLUMN status TYPE VARCHAR(30);

-- Backup/sync operations table
ALTER TABLE backup_sync_operations ALTER COLUMN operation_type TYPE VARCHAR(30);
ALTER TABLE backup_sync_operations ALTER COLUMN scope TYPE VARCHAR(30);
ALTER TABLE backup_sync_operations ALTER COLUMN status TYPE VARCHAR(30);

-- Security logs table
ALTER TABLE security_logs ALTER COLUMN severity TYPE VARCHAR(20);

-- =====================================================
-- STEP 1: DROP ALL EXISTING CHECK CONSTRAINTS
-- =====================================================

-- Families constraints
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

-- Individuals constraints
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_gender_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_relation_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_education_stage_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_education_level_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_marital_status_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_disability_type_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_disability_severity_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_chronic_disease_type_check;
ALTER TABLE individuals DROP CONSTRAINT IF EXISTS individuals_war_injury_type_check;

-- Camps constraints
ALTER TABLE camps DROP CONSTRAINT IF EXISTS camps_status_check;

-- Distributions constraints
ALTER TABLE distributions DROP CONSTRAINT IF EXISTS distributions_status_check;

-- Distribution records constraints
ALTER TABLE distribution_records DROP CONSTRAINT IF EXISTS distribution_records_status_check;

-- Inventory constraints
ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_category_check;

-- Aid campaigns constraints
ALTER TABLE aid_campaigns DROP CONSTRAINT IF EXISTS aid_campaigns_status_check;
ALTER TABLE aid_campaigns DROP CONSTRAINT IF EXISTS aid_campaigns_aid_category_check;

-- Aid distributions constraints
ALTER TABLE aid_distributions DROP CONSTRAINT IF EXISTS aid_distributions_status_check;
ALTER TABLE aid_distributions DROP CONSTRAINT IF EXISTS aid_distributions_aid_category_check;

-- Aids (Aid Types) constraints
ALTER TABLE aids DROP CONSTRAINT IF EXISTS aids_category_check;

-- Inventory items constraints
ALTER TABLE inventory_items DROP CONSTRAINT IF EXISTS inventory_items_category_check;

-- Import/export operations constraints
ALTER TABLE import_export_operations DROP CONSTRAINT IF EXISTS import_export_operations_operation_type_check;
ALTER TABLE import_export_operations DROP CONSTRAINT IF EXISTS import_export_operations_status_check;

-- Backup/sync operations constraints
ALTER TABLE backup_sync_operations DROP CONSTRAINT IF EXISTS backup_sync_operations_operation_type_check;
ALTER TABLE backup_sync_operations DROP CONSTRAINT IF EXISTS backup_sync_operations_scope_check;
ALTER TABLE backup_sync_operations DROP CONSTRAINT IF EXISTS backup_sync_operations_status_check;

-- Security logs constraints
ALTER TABLE security_logs DROP CONSTRAINT IF EXISTS security_logs_severity_check;

-- Users constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

-- Permissions constraints
ALTER TABLE permissions DROP CONSTRAINT IF EXISTS permissions_role_check;

-- =====================================================
-- STEP 2: UPDATE FAMILIES DATA - Convert English to Arabic
-- =====================================================

-- Extra safety: Drop vulnerability_priority constraint again if it exists
ALTER TABLE families DROP CONSTRAINT IF EXISTS families_vulnerability_priority_check;

-- Gender (head_of_family_gender): 'ذكر', 'أنثى'
UPDATE families SET head_of_family_gender = 'ذكر' WHERE head_of_family_gender = 'male';
UPDATE families SET head_of_family_gender = 'أنثى' WHERE head_of_family_gender = 'female';

-- Marital Status (head_of_family_marital_status): 'أعزب', 'متزوج', 'أرمل', 'مطلق', 'أسرة هشة'
UPDATE families SET head_of_family_marital_status = 'أعزب' WHERE head_of_family_marital_status = 'single';
UPDATE families SET head_of_family_marital_status = 'متزوج' WHERE head_of_family_marital_status = 'married';
UPDATE families SET head_of_family_marital_status = 'أرمل' WHERE head_of_family_marital_status = 'widow';
UPDATE families SET head_of_family_marital_status = 'مطلق' WHERE head_of_family_marital_status = 'divorced';
UPDATE families SET head_of_family_marital_status = 'أسرة هشة' WHERE head_of_family_marital_status = 'vulnerable';

-- Widow Reason (head_of_family_widow_reason): 'شهيد', 'وفاة طبيعية', 'حادث', 'مرض', 'غير ذلك'
UPDATE families SET head_of_family_widow_reason = 'شهيد' WHERE head_of_family_widow_reason = 'martyr';
UPDATE families SET head_of_family_widow_reason = 'وفاة طبيعية' WHERE head_of_family_widow_reason = 'natural';
UPDATE families SET head_of_family_widow_reason = 'حادث' WHERE head_of_family_widow_reason = 'accident';
UPDATE families SET head_of_family_widow_reason = 'مرض' WHERE head_of_family_widow_reason = 'disease';
UPDATE families SET head_of_family_widow_reason = 'غير ذلك' WHERE head_of_family_widow_reason = 'other';

-- Role (head_of_family_role): 'أب', 'أم', 'زوجة'
UPDATE families SET head_of_family_role = 'أب' WHERE head_of_family_role = 'father';
UPDATE families SET head_of_family_role = 'أم' WHERE head_of_family_role = 'mother';
UPDATE families SET head_of_family_role = 'زوجة' WHERE head_of_family_role = 'wife_head';

-- Disability Type (head_of_family_disability_type): 'لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'
UPDATE families SET head_of_family_disability_type = 'لا يوجد' WHERE head_of_family_disability_type = 'none';
UPDATE families SET head_of_family_disability_type = 'حركية' WHERE head_of_family_disability_type = 'motor';
UPDATE families SET head_of_family_disability_type = 'بصرية' WHERE head_of_family_disability_type = 'visual';
UPDATE families SET head_of_family_disability_type = 'سمعية' WHERE head_of_family_disability_type = 'hearing';
UPDATE families SET head_of_family_disability_type = 'ذهنية' WHERE head_of_family_disability_type = 'mental';
UPDATE families SET head_of_family_disability_type = 'أخرى' WHERE head_of_family_disability_type = 'other';

-- Disability Severity (head_of_family_disability_severity): 'بسيطة', 'متوسطة', 'شديدة', 'كلية'
UPDATE families SET head_of_family_disability_severity = 'بسيطة' WHERE head_of_family_disability_severity = 'simple';
UPDATE families SET head_of_family_disability_severity = 'متوسطة' WHERE head_of_family_disability_severity = 'moderate';
UPDATE families SET head_of_family_disability_severity = 'شديدة' WHERE head_of_family_disability_severity = 'severe';
UPDATE families SET head_of_family_disability_severity = 'كلية' WHERE head_of_family_disability_severity = 'total';

-- Chronic Disease Type (head_of_family_chronic_disease_type): 'لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'
UPDATE families SET head_of_family_chronic_disease_type = 'لا يوجد' WHERE head_of_family_chronic_disease_type = 'none';
UPDATE families SET head_of_family_chronic_disease_type = 'سكري' WHERE head_of_family_chronic_disease_type = 'diabetes';
UPDATE families SET head_of_family_chronic_disease_type = 'ضغط دم' WHERE head_of_family_chronic_disease_type = 'blood_pressure';
UPDATE families SET head_of_family_chronic_disease_type = 'قلب' WHERE head_of_family_chronic_disease_type = 'heart';
UPDATE families SET head_of_family_chronic_disease_type = 'سرطان' WHERE head_of_family_chronic_disease_type = 'cancer';
UPDATE families SET head_of_family_chronic_disease_type = 'ربو' WHERE head_of_family_chronic_disease_type = 'asthma';
UPDATE families SET head_of_family_chronic_disease_type = 'فشل كلوي' WHERE head_of_family_chronic_disease_type = 'kidney_failure';
UPDATE families SET head_of_family_chronic_disease_type = 'مرض نفسي' WHERE head_of_family_chronic_disease_type = 'mental_disease';
UPDATE families SET head_of_family_chronic_disease_type = 'أخرى' WHERE head_of_family_chronic_disease_type = 'other';

-- War Injury Type (head_of_family_war_injury_type): 'لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'
UPDATE families SET head_of_family_war_injury_type = 'لا يوجد' WHERE head_of_family_war_injury_type = 'none';
UPDATE families SET head_of_family_war_injury_type = 'بتر' WHERE head_of_family_war_injury_type = 'amputation';
UPDATE families SET head_of_family_war_injury_type = 'كسر' WHERE head_of_family_war_injury_type = 'fracture';
UPDATE families SET head_of_family_war_injury_type = 'شظية' WHERE head_of_family_war_injury_type = 'shrapnel';
UPDATE families SET head_of_family_war_injury_type = 'حرق' WHERE head_of_family_war_injury_type = 'burn';
UPDATE families SET head_of_family_war_injury_type = 'رأس/وجه' WHERE head_of_family_war_injury_type = 'head_face';
UPDATE families SET head_of_family_war_injury_type = 'عمود فقري' WHERE head_of_family_war_injury_type = 'spinal';
UPDATE families SET head_of_family_war_injury_type = 'أخرى' WHERE head_of_family_war_injury_type = 'other';

-- Original Housing Type (original_address_housing_type): 'ملك', 'إيجار'
UPDATE families SET original_address_housing_type = 'ملك' WHERE original_address_housing_type = 'owned';
UPDATE families SET original_address_housing_type = 'إيجار' WHERE original_address_housing_type = 'rented';

-- Current Housing Type (current_housing_type): 'خيمة', 'بيت إسمنتي', 'شقة', 'أخرى'
UPDATE families SET current_housing_type = 'خيمة' WHERE current_housing_type = 'tent';
UPDATE families SET current_housing_type = 'بيت إسمنتي' WHERE current_housing_type = 'concrete_house';
UPDATE families SET current_housing_type = 'شقة' WHERE current_housing_type = 'apartment';
UPDATE families SET current_housing_type = 'أخرى' WHERE current_housing_type = 'other';

-- Housing Sharing Status (current_housing_sharing_status): 'سكن فردي', 'سكن مشترك'
UPDATE families SET current_housing_sharing_status = 'سكن فردي' WHERE current_housing_sharing_status = 'individual';
UPDATE families SET current_housing_sharing_status = 'سكن مشترك' WHERE current_housing_sharing_status = 'shared';

-- Sanitary Facilities (current_housing_sanitary_facilities): 'نعم (دورة مياه خاصة)', 'لا (مرافق مشتركة)'
UPDATE families SET current_housing_sanitary_facilities = 'نعم (دورة مياه خاصة)' WHERE current_housing_sanitary_facilities = 'private';
UPDATE families SET current_housing_sanitary_facilities = 'لا (مرافق مشتركة)' WHERE current_housing_sanitary_facilities = 'shared';

-- Water Source (current_housing_water_source): 'شبكة عامة', 'صهاريج', 'آبار', 'آخر'
UPDATE families SET current_housing_water_source = 'شبكة عامة' WHERE current_housing_water_source = 'public_network';
UPDATE families SET current_housing_water_source = 'صهاريج' WHERE current_housing_water_source = 'tanker';
UPDATE families SET current_housing_water_source = 'آبار' WHERE current_housing_water_source = 'well';
UPDATE families SET current_housing_water_source = 'آخر' WHERE current_housing_water_source = 'other';

-- Electricity Access (current_housing_electricity_access): 'شبكة عامة', 'مولد', 'طاقة شمسية', 'لا يوجد', 'آخر'
UPDATE families SET current_housing_electricity_access = 'شبكة عامة' WHERE current_housing_electricity_access = 'public_grid';
UPDATE families SET current_housing_electricity_access = 'مولد' WHERE current_housing_electricity_access = 'generator';
UPDATE families SET current_housing_electricity_access = 'طاقة شمسية' WHERE current_housing_electricity_access = 'solar';
UPDATE families SET current_housing_electricity_access = 'لا يوجد' WHERE current_housing_electricity_access = 'none';
UPDATE families SET current_housing_electricity_access = 'آخر' WHERE current_housing_electricity_access = 'other';

-- Refugee/Resident Residence Type (refugee_resident_abroad_residence_type): 'لاجئ', 'مقيم نظامي', 'أخرى'
UPDATE families SET refugee_resident_abroad_residence_type = 'لاجئ' WHERE refugee_resident_abroad_residence_type = 'refugee';
UPDATE families SET refugee_resident_abroad_residence_type = 'مقيم نظامي' WHERE refugee_resident_abroad_residence_type = 'legal_resident';
UPDATE families SET refugee_resident_abroad_residence_type = 'أخرى' WHERE refugee_resident_abroad_residence_type = 'other';

-- Vulnerability Priority (vulnerability_priority): 'عالي جداً', 'عالي', 'متوسط', 'منخفض'
-- First handle NULL and empty strings
UPDATE families SET vulnerability_priority = 'منخفض' WHERE vulnerability_priority IS NULL OR vulnerability_priority = '' OR TRIM(vulnerability_priority) = '';
-- Then convert English to Arabic
UPDATE families SET vulnerability_priority = 'عالي جداً' WHERE vulnerability_priority = 'very_high';
UPDATE families SET vulnerability_priority = 'عالي' WHERE vulnerability_priority = 'high';
UPDATE families SET vulnerability_priority = 'متوسط' WHERE vulnerability_priority = 'medium';
UPDATE families SET vulnerability_priority = 'منخفض' WHERE vulnerability_priority = 'low';
-- Final catch-all for any remaining invalid values
UPDATE families SET vulnerability_priority = 'منخفض' WHERE vulnerability_priority NOT IN ('عالي جداً', 'عالي', 'متوسط', 'منخفض');

-- Family Status (status): 'قيد الانتظار', 'موافق', 'مرفوض'
UPDATE families SET status = 'قيد الانتظار' WHERE status = 'pending';
UPDATE families SET status = 'موافق' WHERE status = 'approved';
UPDATE families SET status = 'مرفوض' WHERE status = 'rejected';

-- Monthly Income Range (head_of_family_monthly_income_range): 'بدون دخل', 'أقل من 100', '100-300', '300-500', 'أكثر من 500'
UPDATE families SET head_of_family_monthly_income_range = 'بدون دخل' WHERE head_of_family_monthly_income_range = 'no_income';
UPDATE families SET head_of_family_monthly_income_range = 'أقل من 100' WHERE head_of_family_monthly_income_range = 'under_100';
UPDATE families SET head_of_family_monthly_income_range = '100-300' WHERE head_of_family_monthly_income_range = '100_to_300';
UPDATE families SET head_of_family_monthly_income_range = '300-500' WHERE head_of_family_monthly_income_range = '300_to_500';
UPDATE families SET head_of_family_monthly_income_range = 'أكثر من 500' WHERE head_of_family_monthly_income_range = 'over_500';

-- Wife Disability Type (wife_disability_type): 'لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'
UPDATE families SET wife_disability_type = 'لا يوجد' WHERE wife_disability_type = 'none';
UPDATE families SET wife_disability_type = 'حركية' WHERE wife_disability_type = 'motor';
UPDATE families SET wife_disability_type = 'بصرية' WHERE wife_disability_type = 'visual';
UPDATE families SET wife_disability_type = 'سمعية' WHERE wife_disability_type = 'hearing';
UPDATE families SET wife_disability_type = 'ذهنية' WHERE wife_disability_type = 'mental';
UPDATE families SET wife_disability_type = 'أخرى' WHERE wife_disability_type = 'other';

-- Wife Disability Severity (wife_disability_severity): 'بسيطة', 'متوسطة', 'شديدة', 'كلية'
UPDATE families SET wife_disability_severity = 'بسيطة' WHERE wife_disability_severity = 'simple';
UPDATE families SET wife_disability_severity = 'متوسطة' WHERE wife_disability_severity = 'moderate';
UPDATE families SET wife_disability_severity = 'شديدة' WHERE wife_disability_severity = 'severe';
UPDATE families SET wife_disability_severity = 'كلية' WHERE wife_disability_severity = 'total';

-- Wife Chronic Disease Type (wife_chronic_disease_type): 'لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'
UPDATE families SET wife_chronic_disease_type = 'لا يوجد' WHERE wife_chronic_disease_type = 'none';
UPDATE families SET wife_chronic_disease_type = 'سكري' WHERE wife_chronic_disease_type = 'diabetes';
UPDATE families SET wife_chronic_disease_type = 'ضغط دم' WHERE wife_chronic_disease_type = 'blood_pressure';
UPDATE families SET wife_chronic_disease_type = 'قلب' WHERE wife_chronic_disease_type = 'heart';
UPDATE families SET wife_chronic_disease_type = 'سرطان' WHERE wife_chronic_disease_type = 'cancer';
UPDATE families SET wife_chronic_disease_type = 'ربو' WHERE wife_chronic_disease_type = 'asthma';
UPDATE families SET wife_chronic_disease_type = 'فشل كلوي' WHERE wife_chronic_disease_type = 'kidney_failure';
UPDATE families SET wife_chronic_disease_type = 'مرض نفسي' WHERE wife_chronic_disease_type = 'mental_disease';
UPDATE families SET wife_chronic_disease_type = 'أخرى' WHERE wife_chronic_disease_type = 'other';

-- Wife War Injury Type (wife_war_injury_type): 'لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'
UPDATE families SET wife_war_injury_type = 'لا يوجد' WHERE wife_war_injury_type = 'none';
UPDATE families SET wife_war_injury_type = 'بتر' WHERE wife_war_injury_type = 'amputation';
UPDATE families SET wife_war_injury_type = 'كسر' WHERE wife_war_injury_type = 'fracture';
UPDATE families SET wife_war_injury_type = 'شظية' WHERE wife_war_injury_type = 'shrapnel';
UPDATE families SET wife_war_injury_type = 'حرق' WHERE wife_war_injury_type = 'burn';
UPDATE families SET wife_war_injury_type = 'رأس/وجه' WHERE wife_war_injury_type = 'head_face';
UPDATE families SET wife_war_injury_type = 'عمود فقري' WHERE wife_war_injury_type = 'spinal';
UPDATE families SET wife_war_injury_type = 'أخرى' WHERE wife_war_injury_type = 'other';

-- =====================================================
-- STEP 3: CATCH-ALL UPDATES FOR FAMILIES (handle NULL/unmapped values)
-- Using DEFAULT values from schema or first enum value
-- =====================================================

-- Gender - default: 'ذكر' (no DEFAULT in schema, use first enum value)
UPDATE families SET head_of_family_gender = 'ذكر' WHERE head_of_family_gender NOT IN ('ذكر', 'أنثى') OR head_of_family_gender IS NULL;

-- Marital Status - default: none specified, use 'أعزب' (first enum value)
UPDATE families SET head_of_family_marital_status = 'أعزب' WHERE head_of_family_marital_status NOT IN ('أعزب', 'متزوج', 'أرمل', 'مطلق', 'أسرة هشة') OR head_of_family_marital_status IS NULL;

-- Widow Reason - default: none specified, use 'غير ذلك' (last enum value - most generic)
UPDATE families SET head_of_family_widow_reason = 'غير ذلك' WHERE head_of_family_widow_reason NOT IN ('شهيد', 'وفاة طبيعية', 'حادث', 'مرض', 'غير ذلك') OR head_of_family_widow_reason IS NULL;

-- Role - default: NULL allowed, use 'أب' (first enum value)
UPDATE families SET head_of_family_role = 'أب' WHERE head_of_family_role NOT IN ('أب', 'أم', 'زوجة') OR head_of_family_role IS NULL;

-- Disability Type - default: none specified, use 'لا يوجد' (first enum value)
UPDATE families SET head_of_family_disability_type = 'لا يوجد' WHERE head_of_family_disability_type NOT IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى') OR head_of_family_disability_type IS NULL;

-- Disability Severity - default: none specified, use 'بسيطة' (first enum value)
UPDATE families SET head_of_family_disability_severity = 'بسيطة' WHERE head_of_family_disability_severity NOT IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية') OR head_of_family_disability_severity IS NULL;

-- Chronic Disease Type - default: none specified, use 'لا يوجد' (first enum value)
UPDATE families SET head_of_family_chronic_disease_type = 'لا يوجد' WHERE head_of_family_chronic_disease_type NOT IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى') OR head_of_family_chronic_disease_type IS NULL;

-- War Injury Type - default: none specified, use 'لا يوجد' (first enum value)
UPDATE families SET head_of_family_war_injury_type = 'لا يوجد' WHERE head_of_family_war_injury_type NOT IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى') OR head_of_family_war_injury_type IS NULL;

-- Original Housing Type - default: none specified, use 'ملك' (first enum value)
UPDATE families SET original_address_housing_type = 'ملك' WHERE original_address_housing_type NOT IN ('ملك', 'إيجار') OR original_address_housing_type IS NULL;

-- Current Housing Type - default: none specified, use 'خيمة' (first enum value)
UPDATE families SET current_housing_type = 'خيمة' WHERE current_housing_type NOT IN ('خيمة', 'بيت إسمنتي', 'شقة', 'أخرى') OR current_housing_type IS NULL;

-- Current Housing Detailed Type - Convert English to Arabic
UPDATE families SET current_housing_detailed_type = 'خيمة فردية' WHERE current_housing_detailed_type = 'tent_individual';
UPDATE families SET current_housing_detailed_type = 'خيمة مشتركة' WHERE current_housing_detailed_type = 'tent_shared';
UPDATE families SET current_housing_detailed_type = 'بيت كامل' WHERE current_housing_detailed_type = 'house_full';
UPDATE families SET current_housing_detailed_type = 'غرفة في بيت' WHERE current_housing_detailed_type = 'house_room';
UPDATE families SET current_housing_detailed_type = 'شقة مفروشة' WHERE current_housing_detailed_type = 'apartment_furnished';
UPDATE families SET current_housing_detailed_type = 'شقة غير مفروشة' WHERE current_housing_detailed_type = 'apartment_unfurnished';
UPDATE families SET current_housing_detailed_type = 'كارافان' WHERE current_housing_detailed_type = 'caravan';
UPDATE families SET current_housing_detailed_type = 'أخرى' WHERE current_housing_detailed_type = 'other';

-- Housing Sharing Status - default: none specified, use 'سكن فردي' (first enum value)
UPDATE families SET current_housing_sharing_status = 'سكن فردي' WHERE current_housing_sharing_status NOT IN ('سكن فردي', 'سكن مشترك') OR current_housing_sharing_status IS NULL;

-- Sanitary Facilities - default: none specified, use 'نعم (دورة مياه خاصة)' (first enum value)
UPDATE families SET current_housing_sanitary_facilities = 'نعم (دورة مياه خاصة)' WHERE current_housing_sanitary_facilities NOT IN ('نعم (دورة مياه خاصة)', 'لا (مرافق مشتركة)') OR current_housing_sanitary_facilities IS NULL;

-- Water Source - default: none specified, use 'شبكة عامة' (first enum value)
UPDATE families SET current_housing_water_source = 'شبكة عامة' WHERE current_housing_water_source NOT IN ('شبكة عامة', 'صهاريج', 'آبار', 'آخر') OR current_housing_water_source IS NULL;

-- Electricity Access - default: none specified, use 'شبكة عامة' (first enum value)
UPDATE families SET current_housing_electricity_access = 'شبكة عامة' WHERE current_housing_electricity_access NOT IN ('شبكة عامة', 'مولد', 'طاقة شمسية', 'لا يوجد', 'آخر') OR current_housing_electricity_access IS NULL;

-- Refugee/Resident Residence Type - default: none specified, use 'لاجئ' (first enum value)
UPDATE families SET refugee_resident_abroad_residence_type = 'لاجئ' WHERE refugee_resident_abroad_residence_type NOT IN ('لاجئ', 'مقيم نظامي', 'أخرى') OR refugee_resident_abroad_residence_type IS NULL;

-- Vulnerability Priority - DEFAULT: 'منخفض' (from schema)
UPDATE families SET vulnerability_priority = 'منخفض' WHERE vulnerability_priority NOT IN ('عالي جداً', 'عالي', 'متوسط', 'منخفض') OR vulnerability_priority IS NULL;

-- Family Status - DEFAULT: 'قيد الانتظار' (from schema)
UPDATE families SET status = 'قيد الانتظار' WHERE status NOT IN ('قيد الانتظار', 'موافق', 'مرفوض') OR status IS NULL;

-- Monthly Income Range - default: none specified, use 'بدون دخل' (first enum value)
UPDATE families SET head_of_family_monthly_income_range = 'بدون دخل' WHERE head_of_family_monthly_income_range NOT IN ('بدون دخل', 'أقل من 100', '100-300', '300-500', 'أكثر من 500') OR head_of_family_monthly_income_range IS NULL;

-- Wife Disability Type - default: none specified, use 'لا يوجد' (first enum value)
UPDATE families SET wife_disability_type = 'لا يوجد' WHERE wife_disability_type NOT IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى') OR wife_disability_type IS NULL;

-- Wife Disability Severity - default: none specified, use 'بسيطة' (first enum value)
UPDATE families SET wife_disability_severity = 'بسيطة' WHERE wife_disability_severity NOT IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية') OR wife_disability_severity IS NULL;

-- Wife Chronic Disease Type - default: none specified, use 'لا يوجد' (first enum value)
UPDATE families SET wife_chronic_disease_type = 'لا يوجد' WHERE wife_chronic_disease_type NOT IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى') OR wife_chronic_disease_type IS NULL;

-- Wife War Injury Type - default: none specified, use 'لا يوجد' (first enum value)
UPDATE families SET wife_war_injury_type = 'لا يوجد' WHERE wife_war_injury_type NOT IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى') OR wife_war_injury_type IS NULL;

-- =====================================================
-- STEP 4: UPDATE INDIVIDUALS DATA - Convert English to Arabic
-- =====================================================

-- Gender (gender): 'ذكر', 'أنثى'
UPDATE individuals SET gender = 'ذكر' WHERE gender = 'male';
UPDATE individuals SET gender = 'أنثى' WHERE gender = 'female';

-- Relation (relation): 'الأب', 'الأم', 'الزوجة', 'الزوج', 'الابن', 'البنت', 'الأخ', 'الأخت', 'الجد', 'الجدة', 'الحفيد', 'الحفيدة', 'العم', 'العمة', 'ابن الأخ', 'ابنة الأخ', 'ابن العم', 'أخرى'
UPDATE individuals SET relation = 'الأب' WHERE relation = 'father';
UPDATE individuals SET relation = 'الأم' WHERE relation = 'mother';
UPDATE individuals SET relation = 'الزوجة' WHERE relation = 'wife';
UPDATE individuals SET relation = 'الزوج' WHERE relation = 'husband';
UPDATE individuals SET relation = 'الابن' WHERE relation = 'son';
UPDATE individuals SET relation = 'البنت' WHERE relation = 'daughter';
UPDATE individuals SET relation = 'الأخ' WHERE relation = 'brother';
UPDATE individuals SET relation = 'الأخت' WHERE relation = 'sister';
UPDATE individuals SET relation = 'الجد' WHERE relation = 'grandfather';
UPDATE individuals SET relation = 'الجدة' WHERE relation = 'grandmother';
UPDATE individuals SET relation = 'الحفيد' WHERE relation = 'grandson';
UPDATE individuals SET relation = 'الحفيدة' WHERE relation = 'granddaughter';
UPDATE individuals SET relation = 'العم' WHERE relation = 'uncle';
UPDATE individuals SET relation = 'العمة' WHERE relation = 'aunt';
UPDATE individuals SET relation = 'ابن الأخ' WHERE relation = 'nephew';
UPDATE individuals SET relation = 'ابنة الأخ' WHERE relation = 'niece';
UPDATE individuals SET relation = 'ابن العم' WHERE relation = 'cousin';
UPDATE individuals SET relation = 'أخرى' WHERE relation = 'other';

-- Education Stage (education_stage): 'لا يدرس', 'ابتدائي', 'إعدادي/ثانوي', 'جامعي', 'أخرى'
UPDATE individuals SET education_stage = 'لا يدرس' WHERE education_stage = 'none';
UPDATE individuals SET education_stage = 'ابتدائي' WHERE education_stage = 'primary';
UPDATE individuals SET education_stage = 'إعدادي/ثانوي' WHERE education_stage = 'secondary';
UPDATE individuals SET education_stage = 'جامعي' WHERE education_stage = 'university';
UPDATE individuals SET education_stage = 'أخرى' WHERE education_stage = 'other';

-- Education Level (education_level): 'لا يدرس', 'ابتدائي', 'إعدادي/ثانوي', 'جامعي', 'أخرى'
UPDATE individuals SET education_level = 'لا يدرس' WHERE education_level = 'none';
UPDATE individuals SET education_level = 'ابتدائي' WHERE education_level = 'primary';
UPDATE individuals SET education_level = 'إعدادي/ثانوي' WHERE education_level = 'secondary';
UPDATE individuals SET education_level = 'جامعي' WHERE education_level = 'university';
UPDATE individuals SET education_level = 'أخرى' WHERE education_level = 'other';

-- Marital Status (marital_status): 'أعزب/عزباء', 'متزوج/ة', 'أرمل/ة', 'مطلق/ة', 'حالة خاصة'
UPDATE individuals SET marital_status = 'أعزب/عزباء' WHERE marital_status = 'single';
UPDATE individuals SET marital_status = 'متزوج/ة' WHERE marital_status = 'married';
UPDATE individuals SET marital_status = 'أرمل/ة' WHERE marital_status = 'widow';
UPDATE individuals SET marital_status = 'مطلق/ة' WHERE marital_status = 'divorced';
UPDATE individuals SET marital_status = 'حالة خاصة' WHERE marital_status = 'vulnerable';

-- Disability Type (disability_type): 'لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'
UPDATE individuals SET disability_type = 'لا يوجد' WHERE disability_type = 'none';
UPDATE individuals SET disability_type = 'حركية' WHERE disability_type = 'motor';
UPDATE individuals SET disability_type = 'بصرية' WHERE disability_type = 'visual';
UPDATE individuals SET disability_type = 'سمعية' WHERE disability_type = 'hearing';
UPDATE individuals SET disability_type = 'ذهنية' WHERE disability_type = 'mental';
UPDATE individuals SET disability_type = 'أخرى' WHERE disability_type = 'other';

-- Disability Severity (disability_severity): 'بسيطة', 'متوسطة', 'شديدة', 'كلية'
UPDATE individuals SET disability_severity = 'بسيطة' WHERE disability_severity = 'simple';
UPDATE individuals SET disability_severity = 'متوسطة' WHERE disability_severity = 'moderate';
UPDATE individuals SET disability_severity = 'شديدة' WHERE disability_severity = 'severe';
UPDATE individuals SET disability_severity = 'كلية' WHERE disability_severity = 'total';

-- Chronic Disease Type (chronic_disease_type): 'لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'
UPDATE individuals SET chronic_disease_type = 'لا يوجد' WHERE chronic_disease_type = 'none';
UPDATE individuals SET chronic_disease_type = 'سكري' WHERE chronic_disease_type = 'diabetes';
UPDATE individuals SET chronic_disease_type = 'ضغط دم' WHERE chronic_disease_type = 'blood_pressure';
UPDATE individuals SET chronic_disease_type = 'قلب' WHERE chronic_disease_type = 'heart';
UPDATE individuals SET chronic_disease_type = 'سرطان' WHERE chronic_disease_type = 'cancer';
UPDATE individuals SET chronic_disease_type = 'ربو' WHERE chronic_disease_type = 'asthma';
UPDATE individuals SET chronic_disease_type = 'فشل كلوي' WHERE chronic_disease_type = 'kidney_failure';
UPDATE individuals SET chronic_disease_type = 'مرض نفسي' WHERE chronic_disease_type = 'mental_disease';
UPDATE individuals SET chronic_disease_type = 'أخرى' WHERE chronic_disease_type = 'other';

-- War Injury Type (war_injury_type): 'لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'
UPDATE individuals SET war_injury_type = 'لا يوجد' WHERE war_injury_type = 'none';
UPDATE individuals SET war_injury_type = 'بتر' WHERE war_injury_type = 'amputation';
UPDATE individuals SET war_injury_type = 'كسر' WHERE war_injury_type = 'fracture';
UPDATE individuals SET war_injury_type = 'شظية' WHERE war_injury_type = 'shrapnel';
UPDATE individuals SET war_injury_type = 'حرق' WHERE war_injury_type = 'burn';
UPDATE individuals SET war_injury_type = 'رأس/وجه' WHERE war_injury_type = 'head_face';
UPDATE individuals SET war_injury_type = 'عمود فقري' WHERE war_injury_type = 'spinal';
UPDATE individuals SET war_injury_type = 'أخرى' WHERE war_injury_type = 'other';

-- =====================================================
-- STEP 5: CATCH-ALL UPDATES FOR INDIVIDUALS (handle NULL/unmapped values)
-- Using DEFAULT values from schema or first enum value
-- =====================================================

-- Gender - default: none specified, use 'ذكر' (first enum value)
UPDATE individuals SET gender = 'ذكر' WHERE gender NOT IN ('ذكر', 'أنثى') OR gender IS NULL;

-- Relation - default: none specified, use 'الأب' (first enum value)
UPDATE individuals SET relation = 'الأب' WHERE relation NOT IN ('الأب', 'الأم', 'الزوجة', 'الزوج', 'الابن', 'البنت', 'الأخ', 'الأخت', 'الجد', 'الجدة', 'الحفيد', 'الحفيدة', 'العم', 'العمة', 'ابن الأخ', 'ابنة الأخ', 'ابن العم', 'أخرى') OR relation IS NULL;

-- Education Stage - default: none specified, use 'لا يدرس' (first enum value)
UPDATE individuals SET education_stage = 'لا يدرس' WHERE education_stage NOT IN ('لا يدرس', 'ابتدائي', 'إعدادي/ثانوي', 'جامعي', 'أخرى') OR education_stage IS NULL;

-- Education Level - default: none specified, use 'لا يدرس' (first enum value)
UPDATE individuals SET education_level = 'لا يدرس' WHERE education_level NOT IN ('لا يدرس', 'ابتدائي', 'إعدادي/ثانوي', 'جامعي', 'أخرى') OR education_level IS NULL;

-- Marital Status - default: none specified, use 'أعزب/عزباء' (first enum value)
UPDATE individuals SET marital_status = 'أعزب/عزباء' WHERE marital_status NOT IN ('أعزب/عزباء', 'متزوج/ة', 'أرمل/ة', 'مطلق/ة', 'حالة خاصة') OR marital_status IS NULL;

-- Disability Type - default: none specified, use 'لا يوجد' (first enum value)
UPDATE individuals SET disability_type = 'لا يوجد' WHERE disability_type NOT IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى') OR disability_type IS NULL;

-- Disability Severity - default: none specified, use 'بسيطة' (first enum value)
UPDATE individuals SET disability_severity = 'بسيطة' WHERE disability_severity NOT IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية') OR disability_severity IS NULL;

-- Chronic Disease Type - default: none specified, use 'لا يوجد' (first enum value)
UPDATE individuals SET chronic_disease_type = 'لا يوجد' WHERE chronic_disease_type NOT IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى') OR chronic_disease_type IS NULL;

-- War Injury Type - default: none specified, use 'لا يوجد' (first enum value)
UPDATE individuals SET war_injury_type = 'لا يوجد' WHERE war_injury_type NOT IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى') OR war_injury_type IS NULL;

-- =====================================================
-- STEP 6: UPDATE OTHER TABLES DATA - Convert English to Arabic
-- =====================================================

-- Camps status (status): 'نشط', 'قيد الانتظار', 'ممتلئ' - DEFAULT: 'نشط'
UPDATE camps SET status = 'نشط' WHERE status = 'active';
UPDATE camps SET status = 'قيد الانتظار' WHERE status = 'pending';
UPDATE camps SET status = 'ممتلئ' WHERE status = 'full';

-- Distributions status (status): 'قيد الانتظار', 'نشط', 'مكتمل' - DEFAULT: 'قيد الانتظار'
UPDATE distributions SET status = 'قيد الانتظار' WHERE status = 'pending';
UPDATE distributions SET status = 'نشط' WHERE status = 'active';
UPDATE distributions SET status = 'مكتمل' WHERE status = 'completed';

-- Distribution records status (status): 'تم التسليم', 'قيد الانتظار' - DEFAULT: 'تم التسليم'
UPDATE distribution_records SET status = 'تم التسليم' WHERE status = 'delivered';
UPDATE distribution_records SET status = 'قيد الانتظار' WHERE status = 'pending';

-- Inventory category (category): 'غذاء', 'طبي', 'مأوى', 'ماء', 'أخرى' - DEFAULT: 'أخرى'
UPDATE inventory SET category = 'غذاء' WHERE category = 'food';
UPDATE inventory SET category = 'طبي' WHERE category = 'medical';
UPDATE inventory SET category = 'مأوى' WHERE category = 'shelter';
UPDATE inventory SET category = 'ماء' WHERE category = 'water';
UPDATE inventory SET category = 'أخرى' WHERE category = 'other';

-- Aid campaigns status (status): 'مخططة', 'نشطة', 'مكتملة', 'ملغاة' - DEFAULT: 'مخططة'
UPDATE aid_campaigns SET status = 'مخططة' WHERE status = 'planned';
UPDATE aid_campaigns SET status = 'نشطة' WHERE status = 'active';
UPDATE aid_campaigns SET status = 'مكتملة' WHERE status = 'completed';
UPDATE aid_campaigns SET status = 'ملغاة' WHERE status = 'cancelled';

-- Aid campaigns aid_category (aid_category): No CHECK constraint (flexible)
UPDATE aid_campaigns SET aid_category = 'غذاء' WHERE aid_category = 'food';
UPDATE aid_campaigns SET aid_category = 'غير غذائية' WHERE aid_category = 'non_food';
UPDATE aid_campaigns SET aid_category = 'طبي' WHERE aid_category = 'medical';
UPDATE aid_campaigns SET aid_category = 'نقدية' WHERE aid_category = 'cash';
UPDATE aid_campaigns SET aid_category = 'أخرى' WHERE aid_category = 'other';

-- Aid distributions status (status): 'تم التسليم', 'قيد الانتظار' - DEFAULT: 'قيد الانتظار'
UPDATE aid_distributions SET status = 'تم التسليم' WHERE status = 'delivered';
UPDATE aid_distributions SET status = 'قيد الانتظار' WHERE status = 'pending';

-- Aid distributions aid_category (aid_category): No CHECK constraint (flexible)
UPDATE aid_distributions SET aid_category = 'غذاء' WHERE aid_category = 'food';
UPDATE aid_distributions SET aid_category = 'غير غذائية' WHERE aid_category = 'non_food';
UPDATE aid_distributions SET aid_category = 'طبي' WHERE aid_category = 'medical';
UPDATE aid_distributions SET aid_category = 'نقدية' WHERE aid_category = 'cash';
UPDATE aid_distributions SET aid_category = 'أخرى' WHERE aid_category = 'other';

-- Aids (Aid Types) category (category): 'غذاء', 'غير غذائي', 'طبي', 'مأوى', 'ماء', 'أخرى' - DEFAULT: 'أخرى'
UPDATE aids SET category = 'غذاء' WHERE category = 'food';
UPDATE aids SET category = 'غير غذائي' WHERE category = 'non_food';
UPDATE aids SET category = 'طبي' WHERE category = 'medical';
UPDATE aids SET category = 'مأوى' WHERE category = 'shelter';
UPDATE aids SET category = 'ماء' WHERE category = 'water';
UPDATE aids SET category = 'أخرى' WHERE category = 'other';

-- Inventory items category (category): 'غذائية', 'غير غذائية', 'طبية', 'نظافة', 'مأوى', 'مائية', 'أخرى' - DEFAULT: 'أخرى'
UPDATE inventory_items SET category = 'غذائية' WHERE category = 'food';
UPDATE inventory_items SET category = 'غير غذائية' WHERE category = 'non_food';
UPDATE inventory_items SET category = 'طبية' WHERE category = 'medical';
UPDATE inventory_items SET category = 'نظافة' WHERE category = 'hygiene';
UPDATE inventory_items SET category = 'مأوى' WHERE category = 'shelter';
UPDATE inventory_items SET category = 'مائية' WHERE category = 'water';
UPDATE inventory_items SET category = 'أخرى' WHERE category = 'other';

-- Import/export operations operation_type (operation_type): 'استيراد', 'تصدير' - DEFAULT: 'قيد المعالجة' for status
UPDATE import_export_operations SET operation_type = 'استيراد' WHERE operation_type = 'import';
UPDATE import_export_operations SET operation_type = 'تصدير' WHERE operation_type = 'export';

-- Import/export operations status (status): 'قيد المعالجة', 'مكتمل', 'فشل' - DEFAULT: 'قيد المعالجة'
UPDATE import_export_operations SET status = 'قيد المعالجة' WHERE status = 'pending';
UPDATE import_export_operations SET status = 'مكتمل' WHERE status = 'completed';
UPDATE import_export_operations SET status = 'فشل' WHERE status = 'failed';

-- Backup/sync operations operation_type (operation_type): 'نسخة احتياطية', 'مزامنة', 'استعادة' - DEFAULT: 'نسخة احتياطية'
UPDATE backup_sync_operations SET operation_type = 'نسخة احتياطية' WHERE operation_type = 'backup';
UPDATE backup_sync_operations SET operation_type = 'مزامنة' WHERE operation_type = 'sync';
UPDATE backup_sync_operations SET operation_type = 'استعادة' WHERE operation_type = 'restore';

-- Backup/sync operations scope (scope): 'كامل', 'جزئي', 'خاص بالمخيم' - DEFAULT: 'كامل'
UPDATE backup_sync_operations SET scope = 'كامل' WHERE scope = 'full';
UPDATE backup_sync_operations SET scope = 'جزئي' WHERE scope = 'incremental';
UPDATE backup_sync_operations SET scope = 'خاص بالمخيم' WHERE scope = 'camp_specific';

-- Backup/sync operations status (status): 'قيد المعالجة', 'مكتمل', 'فشل' - DEFAULT: 'قيد المعالجة'
UPDATE backup_sync_operations SET status = 'قيد المعالجة' WHERE status = 'pending';
UPDATE backup_sync_operations SET status = 'مكتمل' WHERE status = 'completed';
UPDATE backup_sync_operations SET status = 'فشل' WHERE status = 'failed';

-- Security logs severity (severity): 'منخفض', 'متوسط', 'عالي', 'حرج' - no DEFAULT specified
UPDATE security_logs SET severity = 'منخفض' WHERE severity = 'low';
UPDATE security_logs SET severity = 'متوسط' WHERE severity = 'medium';
UPDATE security_logs SET severity = 'عالي' WHERE severity = 'high';
UPDATE security_logs SET severity = 'حرج' WHERE severity = 'critical';

-- Users role (role): 'SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY', 'DONOR_OBSERVER' - Keep in English (role identifiers)
-- No conversion needed - roles are in English

-- Permissions role (role): 'SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY', 'DONOR_OBSERVER' - Keep in English (role identifiers)
-- No conversion needed - roles are in English

-- =====================================================
-- STEP 7: CATCH-ALL UPDATES FOR OTHER TABLES (handle NULL/unmapped values)
-- Using DEFAULT values from schema or first enum value
-- =====================================================

-- Camps status - DEFAULT: 'نشط' (from schema)
UPDATE camps SET status = 'نشط' WHERE status NOT IN ('نشط', 'قيد الانتظار', 'ممتلئ') OR status IS NULL;

-- Distributions status - DEFAULT: 'قيد الانتظار' (from schema)
UPDATE distributions SET status = 'قيد الانتظار' WHERE status NOT IN ('قيد الانتظار', 'نشط', 'مكتمل') OR status IS NULL;

-- Distribution records status - DEFAULT: 'تم التسليم' (from schema)
UPDATE distribution_records SET status = 'تم التسليم' WHERE status NOT IN ('تم التسليم', 'قيد الانتظار') OR status IS NULL;

-- Inventory category - DEFAULT: 'أخرى' (from schema)
UPDATE inventory SET category = 'أخرى' WHERE category NOT IN ('غذائية', 'غير غذائية', 'طبية', 'مأوى', 'مائية', 'أخرى') OR category IS NULL;

-- Aid campaigns status - DEFAULT: 'مخططة' (from schema)
UPDATE aid_campaigns SET status = 'مخططة' WHERE status NOT IN ('مخططة', 'نشطة', 'مكتملة', 'ملغاة') OR status IS NULL;

-- Aid campaigns aid_category - DEFAULT: 'أخرى' (from schema)
UPDATE aid_campaigns SET aid_category = 'أخرى' WHERE aid_category NOT IN ('غذائية', 'غير غذائية', 'طبية', 'نقدية', 'أخرى') OR aid_category IS NULL;

-- Aid distributions status - DEFAULT: 'قيد الانتظار' (from schema)
UPDATE aid_distributions SET status = 'قيد الانتظار' WHERE status NOT IN ('تم التسليم', 'قيد الانتظار') OR status IS NULL;

-- Aid distributions aid_category - DEFAULT: 'أخرى' (from schema)
UPDATE aid_distributions SET aid_category = 'أخرى' WHERE aid_category NOT IN ('غذائية', 'غير غذائية', 'طبية', 'نقدية', 'أخرى') OR aid_category IS NULL;

-- Aids (Aid Types) category - DEFAULT: 'other' (keep English for compatibility)
UPDATE aids SET category = 'أخرى' WHERE category NOT IN ('غذائية', 'غير غذائية', 'طبية', 'مأوى', 'مائية', 'أخرى') OR category IS NULL;

-- Inventory items category - DEFAULT: 'أخرى' (from schema)
UPDATE inventory_items SET category = 'أخرى' WHERE category NOT IN ('غذائية', 'غير غذائية', 'طبية', 'نظافة', 'مأوى', 'مائية', 'أخرى') OR category IS NULL;

-- Import/export operations operation_type - no DEFAULT, use 'استيراد' (first enum value)
UPDATE import_export_operations SET operation_type = 'استيراد' WHERE operation_type NOT IN ('استيراد', 'تصدير') OR operation_type IS NULL;

-- Import/export operations status - DEFAULT: 'قيد المعالجة' (from schema)
UPDATE import_export_operations SET status = 'قيد المعالجة' WHERE status NOT IN ('قيد المعالجة', 'مكتمل', 'فشل') OR status IS NULL;

-- Backup/sync operations operation_type - no DEFAULT, use 'نسخة احتياطية' (first enum value)
UPDATE backup_sync_operations SET operation_type = 'نسخة احتياطية' WHERE operation_type NOT IN ('نسخة احتياطية', 'مزامنة', 'استعادة') OR operation_type IS NULL;

-- Backup/sync operations scope - DEFAULT: 'كامل' (from schema)
UPDATE backup_sync_operations SET scope = 'كامل' WHERE scope NOT IN ('كامل', 'جزئي', 'خاص بالمخيم') OR scope IS NULL;

-- Backup/sync operations status - DEFAULT: 'قيد المعالجة' (from schema)
UPDATE backup_sync_operations SET status = 'قيد المعالجة' WHERE status NOT IN ('قيد المعالجة', 'مكتمل', 'فشل') OR status IS NULL;

-- Security logs severity - no DEFAULT, use 'متوسط' (middle value)
UPDATE security_logs SET severity = 'متوسط' WHERE severity NOT IN ('منخفض', 'متوسط', 'عالي', 'حرج') OR severity IS NULL;

-- Users role - DEFAULT: 'FIELD_OFFICER' (common role), keep in English
UPDATE users SET role = 'FIELD_OFFICER' WHERE role NOT IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY', 'DONOR_OBSERVER') OR role IS NULL;

-- Permissions role - no DEFAULT, use 'FIELD_OFFICER' (common role), keep in English
UPDATE permissions SET role = 'FIELD_OFFICER' WHERE role NOT IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY', 'DONOR_OBSERVER') OR role IS NULL;

-- =====================================================
-- STEP 8: RECREATE CHECK CONSTRAINTS WITH ARABIC VALUES
-- =====================================================

-- Families constraints
ALTER TABLE families ADD CONSTRAINT families_head_of_family_gender_check
    CHECK (head_of_family_gender IN ('ذكر', 'أنثى'));

ALTER TABLE families ADD CONSTRAINT families_head_of_family_marital_status_check
    CHECK (head_of_family_marital_status IN ('أعزب', 'متزوج', 'أرمل', 'مطلق', 'أسرة هشة'));

ALTER TABLE families ADD CONSTRAINT families_head_of_family_widow_reason_check
    CHECK (head_of_family_widow_reason IN ('شهيد', 'وفاة طبيعية', 'حادث', 'مرض', 'غير ذلك'));

ALTER TABLE families ADD CONSTRAINT families_head_of_family_role_check
    CHECK (head_of_family_role IN ('أب', 'أم', 'زوجة'));

ALTER TABLE families ADD CONSTRAINT families_head_of_family_disability_type_check
    CHECK (head_of_family_disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'));

ALTER TABLE families ADD CONSTRAINT families_head_of_family_disability_severity_check
    CHECK (head_of_family_disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية'));

ALTER TABLE families ADD CONSTRAINT families_head_of_family_chronic_disease_type_check
    CHECK (head_of_family_chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'));

ALTER TABLE families ADD CONSTRAINT families_head_of_family_war_injury_type_check
    CHECK (head_of_family_war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'));

ALTER TABLE families ADD CONSTRAINT families_original_address_housing_type_check
    CHECK (original_address_housing_type IN ('ملك', 'إيجار'));

ALTER TABLE families ADD CONSTRAINT families_current_housing_type_check
    CHECK (current_housing_type IN ('خيمة', 'بيت إسمنتي', 'شقة', 'أخرى'));

ALTER TABLE families ADD CONSTRAINT families_current_housing_sharing_status_check
    CHECK (current_housing_sharing_status IN ('سكن فردي', 'سكن مشترك'));

ALTER TABLE families ADD CONSTRAINT families_current_housing_sanitary_facilities_check
    CHECK (current_housing_sanitary_facilities IN ('نعم (دورة مياه خاصة)', 'لا (مرافق مشتركة)'));

ALTER TABLE families ADD CONSTRAINT families_current_housing_water_source_check
    CHECK (current_housing_water_source IN ('شبكة عامة', 'صهاريج', 'آبار', 'آخر'));

ALTER TABLE families ADD CONSTRAINT families_current_housing_electricity_access_check
    CHECK (current_housing_electricity_access IN ('شبكة عامة', 'مولد', 'طاقة شمسية', 'لا يوجد', 'آخر'));

ALTER TABLE families ADD CONSTRAINT families_refugee_resident_abroad_residence_type_check
    CHECK (refugee_resident_abroad_residence_type IN ('لاجئ', 'مقيم نظامي', 'أخرى'));

ALTER TABLE families ADD CONSTRAINT families_vulnerability_priority_check
    CHECK (vulnerability_priority IN ('عالي جداً', 'عالي', 'متوسط', 'منخفض'));

ALTER TABLE families ADD CONSTRAINT families_status_check
    CHECK (status IN ('قيد الانتظار', 'موافق', 'مرفوض'));

ALTER TABLE families ADD CONSTRAINT families_head_of_family_monthly_income_range_check
    CHECK (head_of_family_monthly_income_range IN ('بدون دخل', 'أقل من 100', '100-300', '300-500', 'أكثر من 500'));

ALTER TABLE families ADD CONSTRAINT families_wife_disability_type_check
    CHECK (wife_disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'));

ALTER TABLE families ADD CONSTRAINT families_wife_disability_severity_check
    CHECK (wife_disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية'));

ALTER TABLE families ADD CONSTRAINT families_wife_chronic_disease_type_check
    CHECK (wife_chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'));

ALTER TABLE families ADD CONSTRAINT families_wife_war_injury_type_check
    CHECK (wife_war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'));

-- Individuals constraints
ALTER TABLE individuals ADD CONSTRAINT individuals_gender_check
    CHECK (gender IN ('ذكر', 'أنثى'));

ALTER TABLE individuals ADD CONSTRAINT individuals_relation_check
    CHECK (relation IN ('الأب', 'الأم', 'الزوجة', 'الزوج', 'الابن', 'البنت', 'الأخ', 'الأخت', 'الجد', 'الجدة', 'الحفيد', 'الحفيدة', 'العم', 'العمة', 'ابن الأخ', 'ابنة الأخ', 'ابن العم', 'أخرى'));

ALTER TABLE individuals ADD CONSTRAINT individuals_education_stage_check
    CHECK (education_stage IN ('لا يدرس', 'ابتدائي', 'إعدادي/ثانوي', 'جامعي', 'أخرى'));

ALTER TABLE individuals ADD CONSTRAINT individuals_education_level_check
    CHECK (education_level IN ('لا يدرس', 'ابتدائي', 'إعدادي/ثانوي', 'جامعي', 'أخرى'));

ALTER TABLE individuals ADD CONSTRAINT individuals_marital_status_check
    CHECK (marital_status IN ('أعزب/عزباء', 'متزوج/ة', 'أرمل/ة', 'مطلق/ة', 'حالة خاصة'));

ALTER TABLE individuals ADD CONSTRAINT individuals_disability_type_check
    CHECK (disability_type IN ('لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'));

ALTER TABLE individuals ADD CONSTRAINT individuals_disability_severity_check
    CHECK (disability_severity IN ('بسيطة', 'متوسطة', 'شديدة', 'كلية'));

ALTER TABLE individuals ADD CONSTRAINT individuals_chronic_disease_type_check
    CHECK (chronic_disease_type IN ('لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'));

ALTER TABLE individuals ADD CONSTRAINT individuals_war_injury_type_check
    CHECK (war_injury_type IN ('لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'));

-- Camps constraints
ALTER TABLE camps ADD CONSTRAINT camps_status_check
    CHECK (status IN ('نشط', 'قيد الانتظار', 'ممتلئ'));

-- Distributions constraints
ALTER TABLE distributions ADD CONSTRAINT distributions_status_check
    CHECK (status IN ('قيد الانتظار', 'نشط', 'مكتمل'));

-- Distribution records constraints
ALTER TABLE distribution_records ADD CONSTRAINT distribution_records_status_check
    CHECK (status IN ('تم التسليم', 'قيد الانتظار'));

-- Inventory constraints
ALTER TABLE inventory ADD CONSTRAINT inventory_category_check
    CHECK (category IN ('غذائية', 'غير غذائية', 'طبية', 'مأوى', 'مائية', 'أخرى'));

-- Aid campaigns constraints
ALTER TABLE aid_campaigns ADD CONSTRAINT aid_campaigns_status_check
    CHECK (status IN ('مخططة', 'نشطة', 'مكتملة', 'ملغاة'));

ALTER TABLE aid_campaigns ADD CONSTRAINT aid_campaigns_aid_category_check
    CHECK (aid_category IN ('غذائية', 'غير غذائية', 'طبية', 'نقدية', 'مأوى', 'مائية', 'أخرى'));

-- Aid distributions constraints
ALTER TABLE aid_distributions ADD CONSTRAINT aid_distributions_status_check
    CHECK (status IN ('تم التسليم', 'قيد الانتظار'));

ALTER TABLE aid_distributions ADD CONSTRAINT aid_distributions_aid_category_check
    CHECK (aid_category IN ('غذائية', 'غير غذائية', 'طبية', 'نقدية', 'مأوى', 'مائية', 'أخرى'));

-- Aids (Aid Types) constraints - NO CONSTRAINT to allow custom categories
-- ALTER TABLE aids ADD CONSTRAINT aids_category_check
--     CHECK (category IN ('غذائية', 'غير غذائية', 'طبية', 'مأوى', 'مائية', 'أخرى'));

-- Inventory items constraints
ALTER TABLE inventory_items ADD CONSTRAINT inventory_items_category_check
    CHECK (category IN ('غذائية', 'غير غذائية', 'طبية', 'نظافة', 'مأوى', 'مائية', 'أخرى'));

-- Import/export operations constraints
ALTER TABLE import_export_operations ADD CONSTRAINT import_export_operations_operation_type_check
    CHECK (operation_type IN ('استيراد', 'تصدير'));

ALTER TABLE import_export_operations ADD CONSTRAINT import_export_operations_status_check
    CHECK (status IN ('قيد المعالجة', 'مكتمل', 'فشل'));

-- Backup/sync operations constraints
ALTER TABLE backup_sync_operations ADD CONSTRAINT backup_sync_operations_operation_type_check
    CHECK (operation_type IN ('نسخة احتياطية', 'مزامنة', 'استعادة'));

ALTER TABLE backup_sync_operations ADD CONSTRAINT backup_sync_operations_scope_check
    CHECK (scope IN ('كامل', 'جزئي', 'خاص بالمخيم'));

ALTER TABLE backup_sync_operations ADD CONSTRAINT backup_sync_operations_status_check
    CHECK (status IN ('قيد المعالجة', 'مكتمل', 'فشل'));

-- Security logs constraints
ALTER TABLE security_logs ADD CONSTRAINT security_logs_severity_check
    CHECK (severity IN ('منخفض', 'متوسط', 'عالي', 'حرج'));

-- Users constraints
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY', 'DONOR_OBSERVER'));

-- Permissions constraints
ALTER TABLE permissions ADD CONSTRAINT permissions_role_check
    CHECK (role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER', 'BENEFICIARY', 'DONOR_OBSERVER'));

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
