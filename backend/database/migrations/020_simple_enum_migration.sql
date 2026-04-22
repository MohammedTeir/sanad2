-- =====================================================
-- SIMPLE ENUM TO ARABIC MIGRATION
-- Run this FIRST to convert data, then add constraints
-- =====================================================

-- =====================================================
-- FAMILIES TABLE
-- =====================================================

-- Gender
UPDATE families SET head_of_family_gender = 'ذكر' WHERE head_of_family_gender = 'male';
UPDATE families SET head_of_family_gender = 'أنثى' WHERE head_of_family_gender = 'female';

-- Marital Status
UPDATE families SET head_of_family_marital_status = 'أعزب' WHERE head_of_family_marital_status = 'single';
UPDATE families SET head_of_family_marital_status = 'متزوج' WHERE head_of_family_marital_status = 'married';
UPDATE families SET head_of_family_marital_status = 'أرمل' WHERE head_of_family_marital_status = 'widow';
UPDATE families SET head_of_family_marital_status = 'مطلق' WHERE head_of_family_marital_status = 'divorced';
UPDATE families SET head_of_family_marital_status = 'أسرة هشة' WHERE head_of_family_marital_status = 'vulnerable';

-- Widow Reason
UPDATE families SET head_of_family_widow_reason = 'شهيد' WHERE head_of_family_widow_reason = 'martyr';
UPDATE families SET head_of_family_widow_reason = 'وفاة طبيعية' WHERE head_of_family_widow_reason = 'natural';
UPDATE families SET head_of_family_widow_reason = 'حادث' WHERE head_of_family_widow_reason = 'accident';
UPDATE families SET head_of_family_widow_reason = 'مرض' WHERE head_of_family_widow_reason = 'disease';
UPDATE families SET head_of_family_widow_reason = 'غير ذلك' WHERE head_of_family_widow_reason = 'other';

-- Head Role
UPDATE families SET head_of_family_role = 'أب' WHERE head_of_family_role = 'father';
UPDATE families SET head_of_family_role = 'أم' WHERE head_of_family_role = 'mother';
UPDATE families SET head_of_family_role = 'زوجة' WHERE head_of_family_role = 'wife_head';

-- Disability Type
UPDATE families SET head_of_family_disability_type = 'لا يوجد' WHERE head_of_family_disability_type = 'none';
UPDATE families SET head_of_family_disability_type = 'حركية' WHERE head_of_family_disability_type = 'motor';
UPDATE families SET head_of_family_disability_type = 'بصرية' WHERE head_of_family_disability_type = 'visual';
UPDATE families SET head_of_family_disability_type = 'سمعية' WHERE head_of_family_disability_type = 'hearing';
UPDATE families SET head_of_family_disability_type = 'ذهنية' WHERE head_of_family_disability_type = 'mental';
UPDATE families SET head_of_family_disability_type = 'أخرى' WHERE head_of_family_disability_type = 'other';

-- Disability Severity
UPDATE families SET head_of_family_disability_severity = 'بسيطة' WHERE head_of_family_disability_severity = 'simple';
UPDATE families SET head_of_family_disability_severity = 'متوسطة' WHERE head_of_family_disability_severity = 'moderate';
UPDATE families SET head_of_family_disability_severity = 'شديدة' WHERE head_of_family_disability_severity = 'severe';
UPDATE families SET head_of_family_disability_severity = 'كلية' WHERE head_of_family_disability_severity = 'total';

-- Chronic Disease
UPDATE families SET head_of_family_chronic_disease_type = 'لا يوجد' WHERE head_of_family_chronic_disease_type = 'none';
UPDATE families SET head_of_family_chronic_disease_type = 'سكري' WHERE head_of_family_chronic_disease_type = 'diabetes';
UPDATE families SET head_of_family_chronic_disease_type = 'ضغط دم' WHERE head_of_family_chronic_disease_type = 'blood_pressure';
UPDATE families SET head_of_family_chronic_disease_type = 'قلب' WHERE head_of_family_chronic_disease_type = 'heart';
UPDATE families SET head_of_family_chronic_disease_type = 'سرطان' WHERE head_of_family_chronic_disease_type = 'cancer';
UPDATE families SET head_of_family_chronic_disease_type = 'ربو' WHERE head_of_family_chronic_disease_type = 'asthma';
UPDATE families SET head_of_family_chronic_disease_type = 'فشل كلوي' WHERE head_of_family_chronic_disease_type = 'kidney_failure';
UPDATE families SET head_of_family_chronic_disease_type = 'مرض نفسي' WHERE head_of_family_chronic_disease_type = 'mental_disease';
UPDATE families SET head_of_family_chronic_disease_type = 'أخرى' WHERE head_of_family_chronic_disease_type = 'other';

-- War Injury
UPDATE families SET head_of_family_war_injury_type = 'لا يوجد' WHERE head_of_family_war_injury_type = 'none';
UPDATE families SET head_of_family_war_injury_type = 'بتر' WHERE head_of_family_war_injury_type = 'amputation';
UPDATE families SET head_of_family_war_injury_type = 'كسر' WHERE head_of_family_war_injury_type = 'fracture';
UPDATE families SET head_of_family_war_injury_type = 'شظية' WHERE head_of_family_war_injury_type = 'shrapnel';
UPDATE families SET head_of_family_war_injury_type = 'حرق' WHERE head_of_family_war_injury_type = 'burn';
UPDATE families SET head_of_family_war_injury_type = 'رأس/وجه' WHERE head_of_family_war_injury_type = 'head_face';
UPDATE families SET head_of_family_war_injury_type = 'عمود فقري' WHERE head_of_family_war_injury_type = 'spinal';
UPDATE families SET head_of_family_war_injury_type = 'أخرى' WHERE head_of_family_war_injury_type = 'other';

-- Housing Type
UPDATE families SET original_address_housing_type = 'ملك' WHERE original_address_housing_type = 'owned';
UPDATE families SET original_address_housing_type = 'إيجار' WHERE original_address_housing_type = 'rented';

-- Current Housing
UPDATE families SET current_housing_type = 'خيمة' WHERE current_housing_type = 'tent';
UPDATE families SET current_housing_type = 'بيت إسمنتي' WHERE current_housing_type = 'concrete_house';
UPDATE families SET current_housing_type = 'شقة' WHERE current_housing_type = 'apartment';
UPDATE families SET current_housing_type = 'أخرى' WHERE current_housing_type = 'other';

-- Housing Sharing
UPDATE families SET current_housing_sharing_status = 'سكن فردي' WHERE current_housing_sharing_status = 'individual';
UPDATE families SET current_housing_sharing_status = 'سكن مشترك' WHERE current_housing_sharing_status = 'shared';

-- Sanitary
UPDATE families SET current_housing_sanitary_facilities = 'نعم (دورة مياه خاصة)' WHERE current_housing_sanitary_facilities = 'private';
UPDATE families SET current_housing_sanitary_facilities = 'لا (مرافق مشتركة)' WHERE current_housing_sanitary_facilities = 'shared';

-- Water
UPDATE families SET current_housing_water_source = 'شبكة عامة' WHERE current_housing_water_source = 'public_network';
UPDATE families SET current_housing_water_source = 'صهاريج' WHERE current_housing_water_source = 'tanker';
UPDATE families SET current_housing_water_source = 'آبار' WHERE current_housing_water_source = 'well';
UPDATE families SET current_housing_water_source = 'آخر' WHERE current_housing_water_source = 'other';

-- Electricity
UPDATE families SET current_housing_electricity_access = 'شبكة عامة' WHERE current_housing_electricity_access = 'public_grid';
UPDATE families SET current_housing_electricity_access = 'مولد' WHERE current_housing_electricity_access = 'generator';
UPDATE families SET current_housing_electricity_access = 'طاقة شمسية' WHERE current_housing_electricity_access = 'solar';
UPDATE families SET current_housing_electricity_access = 'لا يوجد' WHERE current_housing_electricity_access = 'none';
UPDATE families SET current_housing_electricity_access = 'آخر' WHERE current_housing_electricity_access = 'other';

-- Residence
UPDATE families SET refugee_resident_abroad_residence_type = 'لاجئ' WHERE refugee_resident_abroad_residence_type = 'refugee';
UPDATE families SET refugee_resident_abroad_residence_type = 'مقيم نظامي' WHERE refugee_resident_abroad_residence_type = 'legal_resident';
UPDATE families SET refugee_resident_abroad_residence_type = 'أخرى' WHERE refugee_resident_abroad_residence_type = 'other';

-- Vulnerability
UPDATE families SET vulnerability_priority = 'عالي جداً' WHERE vulnerability_priority = 'very_high';
UPDATE families SET vulnerability_priority = 'عالي' WHERE vulnerability_priority = 'high';
UPDATE families SET vulnerability_priority = 'متوسط' WHERE vulnerability_priority = 'medium';
UPDATE families SET vulnerability_priority = 'منخفض' WHERE vulnerability_priority = 'low';

-- Status
UPDATE families SET status = 'قيد الانتظار' WHERE status = 'pending';
UPDATE families SET status = 'موافق' WHERE status = 'approved';
UPDATE families SET status = 'مرفوض' WHERE status = 'rejected';

-- Income Range
UPDATE families SET head_of_family_monthly_income_range = 'بدون دخل' WHERE head_of_family_monthly_income_range = 'no_income';
UPDATE families SET head_of_family_monthly_income_range = 'أقل من 100' WHERE head_of_family_monthly_income_range = 'under_100';
UPDATE families SET head_of_family_monthly_income_range = '100-300' WHERE head_of_family_monthly_income_range = '100_to_300';
UPDATE families SET head_of_family_monthly_income_range = '300-500' WHERE head_of_family_monthly_income_range = '300_to_500';
UPDATE families SET head_of_family_monthly_income_range = 'أكثر من 500' WHERE head_of_family_monthly_income_range = 'over_500';

-- Wife Disability
UPDATE families SET wife_disability_type = 'لا يوجد' WHERE wife_disability_type = 'none';
UPDATE families SET wife_disability_type = 'حركية' WHERE wife_disability_type = 'motor';
UPDATE families SET wife_disability_type = 'بصرية' WHERE wife_disability_type = 'visual';
UPDATE families SET wife_disability_type = 'سمعية' WHERE wife_disability_type = 'hearing';
UPDATE families SET wife_disability_type = 'ذهنية' WHERE wife_disability_type = 'mental';
UPDATE families SET wife_disability_type = 'أخرى' WHERE wife_disability_type = 'other';

-- Wife Disability Severity
UPDATE families SET wife_disability_severity = 'بسيطة' WHERE wife_disability_severity = 'simple';
UPDATE families SET wife_disability_severity = 'متوسطة' WHERE wife_disability_severity = 'moderate';
UPDATE families SET wife_disability_severity = 'شديدة' WHERE wife_disability_severity = 'severe';
UPDATE families SET wife_disability_severity = 'كلية' WHERE wife_disability_severity = 'total';

-- Wife Chronic
UPDATE families SET wife_chronic_disease_type = 'لا يوجد' WHERE wife_chronic_disease_type = 'none';
UPDATE families SET wife_chronic_disease_type = 'سكري' WHERE wife_chronic_disease_type = 'diabetes';
UPDATE families SET wife_chronic_disease_type = 'ضغط دم' WHERE wife_chronic_disease_type = 'blood_pressure';
UPDATE families SET wife_chronic_disease_type = 'قلب' WHERE wife_chronic_disease_type = 'heart';
UPDATE families SET wife_chronic_disease_type = 'سرطان' WHERE wife_chronic_disease_type = 'cancer';
UPDATE families SET wife_chronic_disease_type = 'ربو' WHERE wife_chronic_disease_type = 'asthma';
UPDATE families SET wife_chronic_disease_type = 'فشل كلوي' WHERE wife_chronic_disease_type = 'kidney_failure';
UPDATE families SET wife_chronic_disease_type = 'مرض نفسي' WHERE wife_chronic_disease_type = 'mental_disease';
UPDATE families SET wife_chronic_disease_type = 'أخرى' WHERE wife_chronic_disease_type = 'other';

-- Wife War Injury
UPDATE families SET wife_war_injury_type = 'لا يوجد' WHERE wife_war_injury_type = 'none';
UPDATE families SET wife_war_injury_type = 'بتر' WHERE wife_war_injury_type = 'amputation';
UPDATE families SET wife_war_injury_type = 'كسر' WHERE wife_war_injury_type = 'fracture';
UPDATE families SET wife_war_injury_type = 'شظية' WHERE wife_war_injury_type = 'shrapnel';
UPDATE families SET wife_war_injury_type = 'حرق' WHERE wife_war_injury_type = 'burn';
UPDATE families SET wife_war_injury_type = 'رأس/وجه' WHERE wife_war_injury_type = 'head_face';
UPDATE families SET wife_war_injury_type = 'عمود فقري' WHERE wife_war_injury_type = 'spinal';
UPDATE families SET wife_war_injury_type = 'أخرى' WHERE wife_war_injury_type = 'other';

-- =====================================================
-- INDIVIDUALS TABLE
-- =====================================================

-- Gender
UPDATE individuals SET gender = 'ذكر' WHERE gender = 'male';
UPDATE individuals SET gender = 'أنثى' WHERE gender = 'female';

-- Relation
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

-- Education
UPDATE individuals SET education_stage = 'لا يدرس' WHERE education_stage = 'none';
UPDATE individuals SET education_stage = 'ابتدائي' WHERE education_stage = 'primary';
UPDATE individuals SET education_stage = 'إعدادي/ثانوي' WHERE education_stage = 'secondary';
UPDATE individuals SET education_stage = 'جامعي' WHERE education_stage = 'university';
UPDATE individuals SET education_stage = 'أخرى' WHERE education_stage = 'other';

UPDATE individuals SET education_level = 'لا يدرس' WHERE education_level = 'none';
UPDATE individuals SET education_level = 'ابتدائي' WHERE education_level = 'primary';
UPDATE individuals SET education_level = 'إعدادي/ثانوي' WHERE education_level = 'secondary';
UPDATE individuals SET education_level = 'جامعي' WHERE education_level = 'university';
UPDATE individuals SET education_level = 'أخرى' WHERE education_level = 'other';

-- Marital Status
UPDATE individuals SET marital_status = 'أعزب/عزباء' WHERE marital_status = 'single';
UPDATE individuals SET marital_status = 'متزوج/ة' WHERE marital_status = 'married';
UPDATE individuals SET marital_status = 'أرمل/ة' WHERE marital_status = 'widow';
UPDATE individuals SET marital_status = 'مطلق/ة' WHERE marital_status = 'divorced';
UPDATE individuals SET marital_status = 'حالة خاصة' WHERE marital_status = 'vulnerable';

-- Disability
UPDATE individuals SET disability_type = 'لا يوجد' WHERE disability_type = 'none';
UPDATE individuals SET disability_type = 'حركية' WHERE disability_type = 'motor';
UPDATE individuals SET disability_type = 'بصرية' WHERE disability_type = 'visual';
UPDATE individuals SET disability_type = 'سمعية' WHERE disability_type = 'hearing';
UPDATE individuals SET disability_type = 'ذهنية' WHERE disability_type = 'mental';
UPDATE individuals SET disability_type = 'أخرى' WHERE disability_type = 'other';

-- Disability Severity
UPDATE individuals SET disability_severity = 'بسيطة' WHERE disability_severity = 'simple';
UPDATE individuals SET disability_severity = 'متوسطة' WHERE disability_severity = 'moderate';
UPDATE individuals SET disability_severity = 'شديدة' WHERE disability_severity = 'severe';
UPDATE individuals SET disability_severity = 'كلية' WHERE disability_severity = 'total';

-- Chronic Disease
UPDATE individuals SET chronic_disease_type = 'لا يوجد' WHERE chronic_disease_type = 'none';
UPDATE individuals SET chronic_disease_type = 'سكري' WHERE chronic_disease_type = 'diabetes';
UPDATE individuals SET chronic_disease_type = 'ضغط دم' WHERE chronic_disease_type = 'blood_pressure';
UPDATE individuals SET chronic_disease_type = 'قلب' WHERE chronic_disease_type = 'heart';
UPDATE individuals SET chronic_disease_type = 'سرطان' WHERE chronic_disease_type = 'cancer';
UPDATE individuals SET chronic_disease_type = 'ربو' WHERE chronic_disease_type = 'asthma';
UPDATE individuals SET chronic_disease_type = 'فشل كلوي' WHERE chronic_disease_type = 'kidney_failure';
UPDATE individuals SET chronic_disease_type = 'مرض نفسي' WHERE chronic_disease_type = 'mental_disease';
UPDATE individuals SET chronic_disease_type = 'أخرى' WHERE chronic_disease_type = 'other';

-- War Injury
UPDATE individuals SET war_injury_type = 'لا يوجد' WHERE war_injury_type = 'none';
UPDATE individuals SET war_injury_type = 'بتر' WHERE war_injury_type = 'amputation';
UPDATE individuals SET war_injury_type = 'كسر' WHERE war_injury_type = 'fracture';
UPDATE individuals SET war_injury_type = 'شظية' WHERE war_injury_type = 'shrapnel';
UPDATE individuals SET war_injury_type = 'حرق' WHERE war_injury_type = 'burn';
UPDATE individuals SET war_injury_type = 'رأس/وجه' WHERE war_injury_type = 'head_face';
UPDATE individuals SET war_injury_type = 'عمود فقري' WHERE war_injury_type = 'spinal';
UPDATE individuals SET war_injury_type = 'أخرى' WHERE war_injury_type = 'other';

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check remaining English values in families
SELECT 'FAMILIES WITH ENGLISH VALUES: ' || COUNT(*) as check_families
FROM families 
WHERE head_of_family_gender IN ('male', 'female')
   OR head_of_family_marital_status IN ('single', 'married', 'widow', 'divorced', 'vulnerable')
   OR head_of_family_role IN ('father', 'mother', 'wife_head')
   OR head_of_family_disability_type IN ('none', 'motor', 'visual', 'hearing', 'mental', 'other')
   OR head_of_family_chronic_disease_type IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other')
   OR head_of_family_war_injury_type IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other')
   OR current_housing_type IN ('tent', 'concrete_house', 'apartment', 'other')
   OR status IN ('pending', 'approved', 'rejected');

-- Check remaining English values in individuals
SELECT 'INDIVIDUALS WITH ENGLISH VALUES: ' || COUNT(*) as check_individuals
FROM individuals 
WHERE gender IN ('male', 'female')
   OR relation IN ('father', 'mother', 'wife', 'husband', 'son', 'daughter', 'brother', 'sister', 'grandfather', 'grandmother', 'grandson', 'granddaughter', 'uncle', 'aunt', 'nephew', 'niece', 'cousin', 'other')
   OR marital_status IN ('single', 'married', 'widow', 'divorced', 'vulnerable')
   OR disability_type IN ('none', 'motor', 'visual', 'hearing', 'mental', 'other')
   OR chronic_disease_type IN ('none', 'diabetes', 'blood_pressure', 'heart', 'cancer', 'asthma', 'kidney_failure', 'mental_disease', 'other')
   OR war_injury_type IN ('none', 'amputation', 'fracture', 'shrapnel', 'burn', 'head_face', 'spinal', 'other');
