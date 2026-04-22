# Field Permissions Implementation Guide

## Overview
This implementation allows Camp Managers to control which fields each family can edit in the beneficiary portal. The system uses a whitelist approach - **no fields are editable by default** until explicitly enabled by the Camp Manager.

---

## What's Been Implemented

### ✅ 1. Database Schema
**File:** `backend/database/migrations/036_add_field_permissions.sql`

Created `family_field_permissions` table:
- `family_id`: UUID reference to families table
- `field_name`: Snake_case field name (e.g., `head_first_name`)
- `is_editable`: Boolean flag
- `updated_by`: User who modified the permission
- `updated_at`: Timestamp

### ✅ 2. Backend API Routes
**File:** `backend/routes/families.js`

Added 3 new endpoints:

#### GET `/api/families/:familyId/field-permissions`
Returns all field permissions for a family.

#### PUT `/api/families/:familyId/field-permissions`
Update a single field permission.
```json
{
  "field_name": "phone_number",
  "is_editable": true
}
```

#### POST `/api/families/:familyId/field-permissions/bulk`
Bulk update multiple field permissions.
```json
{
  "permissions": [
    {"field_name": "phone_number", "is_editable": true},
    {"field_name": "head_first_name", "is_editable": false}
  ]
}
```

**Security Features:**
- Whitelist validation of field names
- Camp association verification
- Role-based authorization (SYSTEM_ADMIN, CAMP_MANAGER only)

### ✅ 3. Frontend Service Methods
**File:** `services/realDataServiceBackend.ts`

Added 3 methods:
- `getFieldPermissions(familyId)`
- `updateFieldPermission(familyId, fieldName, isEditable)`
- `bulkUpdateFieldPermissions(familyId, permissions)`

### ✅ 4. Field Permissions Modal
**File:** `views/camp-manager/FieldPermissionsModal.tsx`

Features:
- **10 field groups** (Basic Info, Contact, Work, Health-Head, Health-Wife, Housing, etc., **Family Members**)
- Toggle switches for each field
- Group-level select all/none buttons
- Search functionality
- Visual indicators (all/some/none selected)
- Save/Cancel actions
- **SVG icons** for professional appearance
- **Family Members group**: Controls ability to add/edit/delete family members (individuals)

### ✅ 5. DPDetails.tsx Integration
**File:** `views/camp-manager/DPDetails.tsx`

Added:
- "صلاحيات الحقول" button in header
- Opens FieldPermissionsModal
- Only visible when NOT in edit mode
- Purple button with lock icon

### ✅ 6. DPPortal.tsx Integration
**File:** `views/beneficiary/DPPortal.tsx`

Added:
- `fieldPermissions` state
- `loadingPermissions` state
- `loadFieldPermissions()` function
- `isFieldEditable(fieldName)` helper function
- Permission filtering in `handleSave()`
- UI protection for all 59 fields with `isFieldEditable()` pattern
- **Family Members permission**: Controls ability to add/edit/delete family members
  - "إضافة فرد" button only visible when `isFieldEditable('family_members')` is true
  - Edit/Delete buttons for existing members protected by permission
  - View button always accessible (read-only)
  - Locked indicator shown when permission is disabled

---

## ✅ New: Family Members Permission

### Field Name: `family_members`

A special permission that controls whether beneficiaries can manage family members (individuals):

**When Enabled:**
- Beneficiaries can add new family members
- Beneficiaries can edit existing family members
- Beneficiaries can delete family members

**When Disabled:**
- "إضافة فرد" (Add Member) button is hidden
- Edit/Delete buttons are hidden for all members
- View button remains accessible (read-only mode)
- Locked indicator (🔒) is shown

**Implementation:**
```typescript
// Add Member Button
{isEditMode && isFieldEditable('family_members') && (
  <button onClick={openAddMemberModal}>إضافة فرد</button>
)}

// Edit/Delete Buttons
{isEditMode && isFieldEditable('family_members') && (
  <>
    <button onClick={() => openEditMemberModal(index)}>تعديل</button>
    <button onClick={() => deleteMember(index)}>حذف</button>
  </>
)}
```

---

## Remaining Work: Update All Fields in DPPortal.tsx

The pattern has been established. You need to apply it to all remaining fields.

### Pattern to Apply

**For each field in edit mode, wrap with isFieldEditable check:**

```typescript
{isEditMode && editableData ? (
  isFieldEditable('field_name_snake_case') ? (
    <input
      type="text"
      value={editableData.fieldName}
      onChange={(e) => handleFieldChange('fieldName', e.target.value)}
      className="..."
    />
  ) : (
    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border-2 border-gray-100">
      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      <span className="text-gray-500 font-bold">{editableData.fieldName || '-'}</span>
    </div>
  )
) : (
  <span>{dp.fieldName}</span>
)}
```

### Fields to Update (59 total)

#### 1. Basic Information (10 fields)
- ✅ `head_first_name` - DONE
- ✅ `head_father_name` - DONE
- [ ] `head_grandfather_name` - اسم الجد
- [ ] `head_family_name` - اسم العائلة
- [ ] `head_of_family_national_id` - الرقم الوطني
- [ ] `head_of_family_gender` - الجنس
- [ ] `head_of_family_date_of_birth` - تاريخ الميلاد
- [ ] `head_of_family_marital_status` - الحالة الاجتماعية
- [ ] `head_of_family_widow_reason` - سبب الوفاة
- [ ] `head_of_family_role` - صفة رب الأسرة

#### 2. Contact Information (2 fields)
- [ ] `head_of_family_phone_number` - رقم الهاتف
- [ ] `head_of_family_phone_secondary` - رقم الهاتف البديل

#### 3. Work & Income (4 fields)
- [ ] `head_of_family_is_working` - يعمل حالياً (checkbox/toggle)
- [ ] `head_of_family_job` - الوظيفة
- [ ] `head_of_family_monthly_income` - الدخل الشهري
- [ ] `head_of_family_monthly_income_range` - نطاق الدخل

#### 4. Health - Head of Family (10 fields)
- [ ] `head_of_family_disability_type` - نوع الإعاقة
- [ ] `head_of_family_disability_severity` - درجة الإعاقة
- [ ] `head_of_family_disability_details` - تفاصيل الإعاقة
- [ ] `head_of_family_chronic_disease_type` - المرض المزمن
- [ ] `head_of_family_chronic_disease_details` - تفاصيل المرض
- [ ] `head_of_family_war_injury_type` - إصابة الحرب
- [ ] `head_of_family_war_injury_details` - تفاصيل الإصابة
- [ ] `head_of_family_medical_followup_required` - المتابعة الطبية (checkbox)
- [ ] `head_of_family_medical_followup_frequency` - تكرار المتابعة
- [ ] `head_of_family_medical_followup_details` - تفاصيل المتابعة

#### 5. Health - Wife (10 fields) ✨ NEW
- [ ] `wife_disability_type` - نوع إعاقة الزوجة
- [ ] `wife_disability_severity` - درجة إعاقة الزوجة
- [ ] `wife_disability_details` - تفاصيل إعاقة الزوجة
- [ ] `wife_chronic_disease_type` - المرض المزمن للزوجة
- [ ] `wife_chronic_disease_details` - تفاصيل المرض المزمن للزوجة
- [ ] `wife_war_injury_type` - إصابة حرب الزوجة
- [ ] `wife_war_injury_details` - تفاصيل إصابة حرب الزوجة
- [ ] `wife_medical_followup_required` - المتابعة الطبية للزوجة (checkbox)
- [ ] `wife_medical_followup_frequency` - تكرار المتابعة الطبية للزوجة
- [ ] `wife_medical_followup_details` - تفاصيل المتابعة الطبية للزوجة

#### 6. Housing - Current (12 fields)
- [ ] `current_housing_type` - نوع السكن
- [ ] `current_housing_detailed_type` - النوع المفصل
- [ ] `current_housing_governorate` - محافظة السكن
- [ ] `current_housing_region` - منطقة السكن
- [ ] `current_housing_landmark` - علامة مميزة
- [ ] `current_housing_unit_number` - رقم الوحدة
- [ ] `current_housing_is_suitable_for_family_size` - مناسب للعائلة
- [ ] `current_housing_sanitary_facilities` - المرافق الصحية
- [ ] `current_housing_water_source` - مصدر المياه
- [ ] `current_housing_electricity_access` - الكهرباء
- [ ] `current_housing_sharing_status` - حالة المشاركة
- [ ] `current_housing_furnished` - مفروش

#### 7. Housing - Original (4 fields)
- [ ] `original_address_governorate` - محافظة الأصل
- [ ] `original_address_region` - منطقة الأصل
- [ ] `original_address_details` - تفاصيل العنوان
- [ ] `original_address_housing_type` - نوع السكن الأصلي

#### 8. Refugee Abroad (4 fields)
- [ ] `is_resident_abroad` - لاجئ/مقيم بالخارج (toggle)
- [ ] `refugee_resident_abroad_country` - الدولة
- [ ] `refugee_resident_abroad_city` - المدينة
- [ ] `refugee_resident_abroad_residence_type` - نوع الإقامة

#### 9. Documents (3 fields)
- [ ] `id_card_url` - البطاقة الشخصية (file upload)
- [ ] `medical_report_url` - التقرير الطبي (file upload)
- [ ] `signature_url` - التوقيع (file upload)

---

## Testing Checklist

### Camp Manager Flow
1. [ ] Login as Camp Manager
2. [ ] Open DPDetails for a family
3. [ ] Click "صلاحيات الحقول" button
4. [ ] Modal opens with all field groups
5. [ ] Enable some fields (e.g., phone_number, job)
6. [ ] Save permissions
7. [ ] Verify success toast

### Beneficiary Flow
1. [ ] Login as beneficiary for the family
2. [ ] Click "تعديل البيانات" button
3. [ ] Verify enabled fields show as inputs
4. [ ] Verify disabled fields show as locked text with 🔒 icon
5. [ ] Try to modify an enabled field
6. [ ] Save changes
7. [ ] Verify success
8. [ ] Verify changes saved in database

### Security Testing
1. [ ] Try to modify non-editable field via browser DevTools
2. [ ] Verify backend rejects the change
3. [ ] Check browser console for error
4. [ ] Verify no changes in database

### Edge Cases
1. [ ] New family with no permissions (nothing editable)
2. [ ] All fields enabled (all inputs editable)
3. [ ] No fields enabled (all locked)
4. [ ] Camp Manager disables field while beneficiary is editing
5. [ ] System Admin modifies permissions for any camp

---

## Deployment Steps

### 1. Run Database Migration
```bash
cd backend
npm run migrate
# Or manually run:
psql -U postgres -d your_database -f backend/database/migrations/036_add_field_permissions.sql
```

### 2. Verify Migration
```sql
-- Check table exists
\dt family_field_permissions

-- Check structure
\d family_field_permissions
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Test Locally
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `npm run dev`
3. Follow testing checklist above

### 5. Deploy to Production
1. Backup database
2. Run migration on production
3. Deploy backend code
4. Deploy frontend code
5. Test in production with test account

---

## Troubleshooting

### Issue: Permissions not loading
**Check:**
- Backend API endpoint is running
- User has valid auth token
- Family ID is correct
- Browser console for errors

### Issue: Fields still editable after disabling
**Check:**
- Browser cache (hard refresh)
- fieldPermissions state is updating
- isFieldEditable function returning correct value
- Backend is actually saving permissions

### Issue: Save fails with permission error
**Check:**
- User role is CAMP_MANAGER or SYSTEM_ADMIN
- Family belongs to user's camp
- Field names are in whitelist
- Request format is correct

---

## Future Enhancements

1. **Templates**: Allow Camp Managers to save permission templates for quick application
2. **Audit Log**: Track who changed permissions and when
3. **Bulk Apply**: Apply permissions to multiple families at once
4. **Field Groups**: Allow enabling/disabling entire groups with one click
5. **Permissions Report**: Show which families have which permissions
6. **Auto-expiry**: Set permissions to expire after a date

---

## Support

For issues or questions:
1. Check this documentation
2. Review the code comments
3. Check browser console for errors
4. Review backend logs
5. Test API endpoints directly with Postman/curl

---

**Last Updated:** 2026-03-13
**Version:** 1.2.0
**Status:** ✅ Complete - Family Members permission added

## Current Status Summary

### ✅ Fully Complete (Backend + Modal + Frontend)
- Database schema and migration
- All 3 API endpoints (GET, PUT, POST bulk)
- Field permissions modal with **10 groups** and **60 fields** (including `family_members`)
- SVG icons for professional appearance
- Wife's health fields added
- Security: Whitelist validation, camp association, role-based auth
- Camp Manager can toggle permissions per family
- Select All / Deselect All working correctly
- **Family Members permission**: Controls add/edit/delete of family members (individuals)
- **Husband fields added**: All `husband_*` fields now included for female-headed households

### ✅ Frontend Implementation (DPPortal.tsx)
- Permission loading implemented
- `isFieldEditable()` helper function created
- Save filtering implemented (prevents non-editable fields from being saved)
- **All profile fields** have UI protection with `isFieldEditable()` pattern
- **Family Members section** protected with permission check:
  - "إضافة فرد" button protected
  - Edit/Delete buttons protected
  - View button always accessible (read-only)
  - Locked indicators shown when permissions disabled
- **Pregnancy fields moved**: Now in "صحة رب الأسرة" tab (not Basic Info tab)
- **Gender-specific spouse fields**: 
  - Male heads see wife fields
  - Female heads see husband fields

### 🎯 Field Groups (12 Total)
1. **المعلومات الأساسية** (Basic Info) - 10 fields
2. **معلومات الاتصال** (Contact) - 2 fields
3. **العمل والدخل** (Work & Income) - 4 fields
4. **الصحة - رب الأسرة** (Health - Head) - 10 fields
5. **بيانات الزوج/ة** (Spouse Basic) - 6 fields (3 wife + 3 husband)
6. **العمل - الزوج/ة** (Spouse Work) - 4 fields (2 wife + 2 husband)
7. **الصحة - الزوجة** (Wife Health) - 14 fields (includes pregnancy)
8. **الصحة - الزوج** (Husband Health) - 10 fields
9. **السكن الحالي** (Current Housing) - 12 fields
10. **العنوان الأصلي** (Original Address) - 4 fields
11. **لاجئ/مقيم بالخارج** (Refugee Abroad) - 4 fields
12. **الوثائق** (Documents) - 3 fields
13. **الأفراد (أعضاء الأسرة)** (Family Members) - 1 permission

**Total:** 73 profile fields + 1 family members permission = 74 fields
