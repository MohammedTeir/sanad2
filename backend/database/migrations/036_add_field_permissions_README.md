# Migration 036: Field-Level Permissions

## Overview
This migration adds field-level permissions to control which fields beneficiaries can edit in their portal.

## What Changed

### New Table: `family_field_permissions`
- **Purpose**: Store which fields each family can edit
- **Key Fields**:
  - `family_id`: Reference to families table
  - `field_name`: Field name in snake_case (e.g., `phone_number`, `head_first_name`)
  - `is_editable`: Boolean flag (false = read-only, true = editable)
  - `updated_by`: User who last modified the permission
  - `updated_at`: Timestamp of last modification

## Security Model

### Default State
- **All fields are LOCKED by default** (no records = not editable)
- Camp Managers must explicitly enable editable fields per family
- This ensures maximum security - nothing is editable unless explicitly allowed

### Who Can Modify Permissions
- **SYSTEM_ADMIN**: Can modify permissions for any family
- **CAMP_MANAGER**: Can only modify permissions for families in their camp
- **FIELD_OFFICER**: Cannot modify permissions
- **BENEFICIARY**: Cannot modify their own permissions (read-only access)

## Available Fields for Permissions

Fields are grouped into sections:

### 1. Basic Information
- `head_first_name` - الاسم الأول
- `head_father_name` - اسم الأب
- `head_grandfather_name` - اسم الجد
- `head_family_name` - اسم العائلة
- `head_of_family_national_id` - الرقم الوطني
- `head_of_family_gender` - الجنس
- `head_of_family_date_of_birth` - تاريخ الميلاد
- `head_of_family_marital_status` - الحالة الاجتماعية
- `head_of_family_widow_reason` - سبب الوفاة
- `head_of_family_role` - صفة رب الأسرة

### 2. Contact Information
- `head_of_family_phone_number` - رقم الهاتف
- `head_of_family_phone_secondary` - رقم الهاتف البديل

### 3. Work & Income
- `head_of_family_is_working` - يعمل حالياً
- `head_of_family_job` - الوظيفة
- `head_of_family_monthly_income` - الدخل الشهري
- `head_of_family_monthly_income_range` - نطاق الدخل

### 4. Health - Head of Family
- `head_of_family_disability_type` - نوع الإعاقة
- `head_of_family_disability_severity` - درجة الإعاقة
- `head_of_family_disability_details` - تفاصيل الإعاقة
- `head_of_family_chronic_disease_type` - المرض المزمن
- `head_of_family_chronic_disease_details` - تفاصيل المرض
- `head_of_family_war_injury_type` - إصابة الحرب
- `head_of_family_war_injury_details` - تفاصيل الإصابة
- `head_of_family_medical_followup_required` - المتابعة الطبية
- `head_of_family_medical_followup_frequency` - تكرار المتابعة
- `head_of_family_medical_followup_details` - تفاصيل المتابعة

### 5. Housing - Current
- `current_housing_type` - نوع السكن
- `current_housing_detailed_type` - النوع المفصل
- `current_housing_governorate` - محافظة السكن
- `current_housing_region` - منطقة السكن
- `current_housing_landmark` - علامة مميزة
- `current_housing_unit_number` - رقم الوحدة
- `current_housing_is_suitable_for_family_size` - مناسب للعائلة
- `current_housing_sanitary_facilities` - المرافق الصحية
- `current_housing_water_source` - مصدر المياه
- `current_housing_electricity_access` - الكهرباء
- `current_housing_sharing_status` - حالة المشاركة
- `current_housing_furnished` - مفروش

### 6. Housing - Original
- `original_address_governorate` - محافظة الأصل
- `original_address_region` - منطقة الأصل
- `original_address_details` - تفاصيل العنوان الأصلي
- `original_address_housing_type` - نوع السكن الأصلي

### 7. Refugee/Resident Abroad
- `is_resident_abroad` - لاجئ/مقيم بالخارج
- `refugee_resident_abroad_country` - الدولة
- `refugee_resident_abroad_city` - المدينة
- `refugee_resident_abroad_residence_type` - نوع الإقامة

### 8. Documents
- `id_card_url` - البطاقة الشخصية
- `medical_report_url` - التقرير الطبي
- `signature_url` - التوقيع

## API Endpoints

### GET /api/families/:familyId/field-permissions
Returns all field permissions for a family.

**Response:**
```json
[
  {
    "field_name": "phone_number",
    "is_editable": true,
    "updated_at": "2026-03-10T12:00:00Z"
  },
  {
    "field_name": "head_first_name",
    "is_editable": false,
    "updated_at": "2026-03-10T12:00:00Z"
  }
]
```

### PUT /api/families/:familyId/field-permissions
Update a single field permission.

**Request:**
```json
{
  "field_name": "phone_number",
  "is_editable": true
}
```

### POST /api/families/:familyId/field-permissions/bulk
Bulk update multiple field permissions.

**Request:**
```json
{
  "permissions": [
    {"field_name": "phone_number", "is_editable": true},
    {"field_name": "phone_secondary", "is_editable": true},
    {"field_name": "head_first_name", "is_editable": false}
  ]
}
```

## Usage Flow

1. **Camp Manager** opens DPDetails for a family
2. Clicks "صلاحيات الحقول" (Field Permissions) button
3. Modal opens showing all fields grouped by section
4. Toggles fields to enable/disable editing
5. Saves changes
6. **Beneficiary** logs in and can only edit enabled fields

## Rollback

To rollback this migration:

```sql
DROP TABLE IF EXISTS family_field_permissions CASCADE;
```

## Testing

1. Run migration: `npm run migrate`
2. Login as Camp Manager
3. Open DPDetails for any family
4. Click "صلاحيات الحقول"
5. Enable some fields, save
6. Login as beneficiary for that family
7. Try to edit - only enabled fields should be editable
