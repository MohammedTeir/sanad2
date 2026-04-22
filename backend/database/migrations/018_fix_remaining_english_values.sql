-- =====================================================
-- FIX ALL REMAINING ENGLISH VALUES IN FAMILIES TABLE
-- Run this BEFORE the schema constraints are applied
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
-- INDIVIDUALS TABLE - Enum Value Conversions
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
