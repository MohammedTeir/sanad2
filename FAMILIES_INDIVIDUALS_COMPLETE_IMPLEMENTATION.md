# Families and Individuals Model - Complete Implementation

## Overview
This document describes the complete implementation of the Families and Individuals data model based on the specified requirements document (نموذج البيانات: الأسرة والأفراد).

## Implementation Status: ✅ COMPLETE

All required fields and features have been implemented across the database schema and frontend components.

---

## 1. Database Schema Updates

### Migration File: `009_complete_family_individuals_model.sql`

Located at: `/backend/db/migrations/009_complete_family_individuals_model.sql`

### 1.1 Families Table - New Fields

#### Wife/Spouse Work Information
- `wife_is_working` BOOLEAN DEFAULT FALSE - هل الزوجة تعمل؟
- `wife_occupation` VARCHAR(255) - مهنة الزوجة

#### Monthly Income Range (Enum)
- `head_of_family_monthly_income_range` VARCHAR(20)
- Values: `no_income`, `under_100`, `100_to_300`, `300_to_500`, `over_500`
- Translation: لا دخل، أقل من 100 دولار، 100-300 دولار، 300-500 دولار، أكثر من 500 دولار

#### Disability Severity (Head of Family & Wife)
- `head_of_family_disability_severity` VARCHAR(20)
- `wife_disability_severity` VARCHAR(20)
- Values: `simple`, `moderate`, `severe`, `total`
- Translation: بسيطة، متوسطة، شديدة، كلية

#### Expanded Chronic Disease Types
- `head_of_family_chronic_disease_type_expanded` VARCHAR(30)
- `wife_chronic_disease_type_expanded` VARCHAR(30)
- New values added: `asthma`, `kidney_failure`, `mental_disease`
- Translation: ربو/أمراض صدر، فشل كلوي، أمراض نفسية

#### Expanded War Injury Types
- `head_of_family_war_injury_type_expanded` VARCHAR(30)
- `wife_war_injury_type_expanded` VARCHAR(30)
- New values added: `head_face`, `spinal`
- Translation: إصابة رأس أو وجه، إصابة عمود فقري

#### Medical Follow-up Details
- `head_of_family_medical_followup_details` TEXT
- `wife_medical_followup_details` TEXT
- Details about the type of medical follow-up required

#### Expanded Widow Reason
- `head_of_family_widow_reason_expanded` VARCHAR(20)
- New values added: `accident`, `disease`
- Translation: حادث، مرض

### 1.2 Individuals Table - New Fields

#### Education Details
- `is_studying` BOOLEAN DEFAULT FALSE - هل يدرس/تدرس؟
- `education_stage` VARCHAR(20) - المرحلة الدراسية
- Values: `none`, `primary`, `secondary`, `university`, `other`
- Translation: ابتدائي، إعدادي، ثانوي/جامعي، آخر

#### Expanded Relation Types
- New values added: `husband`, `grandfather`, `grandmother`, `grandson`, `granddaughter`, `uncle`, `aunt`, `nephew`, `niece`, `cousin`
- Translation: زوج، جد، جدة، حفيد، حفيدة، عم، عمة/خالة، ابن أخ، ابنة أخ/أخت، ابن عم

#### Disability Severity
- `disability_severity` VARCHAR(20)
- Values: `simple`, `moderate`, `severe`, `total`

#### Expanded Chronic Disease & War Injury Types
- Same expansions as families table

#### Medical Follow-up Details
- `medical_followup_details` TEXT

---

## 2. Frontend Updates

### 2.1 Types (`types.ts`)

#### New Type Definitions
```typescript
export type DisabilitySeverity = 'simple' | 'moderate' | 'severe' | 'total';
export type MonthlyIncomeRange = 'no_income' | 'under_100' | '100_to_300' | '300_to_500' | 'over_500';
export type WidowReasonExpanded = 'martyr' | 'natural' | 'accident' | 'disease' | 'other';
export type EducationStage = 'none' | 'primary' | 'secondary' | 'university' | 'other';
```

#### Updated Interfaces
- `FamilyMember`: Added `disabilitySeverity`, `isStudying`, `educationStage`, `medicalFollowupDetails`
- `DPProfile`: Added `monthlyIncomeRange`, `disabilitySeverity`, `medicalFollowupDetails`, `wifeIsWorking`, `wifeOccupation`, `wifeDisabilitySeverity`, `wifeMedicalFollowupDetails`

### 2.2 Register Family Component (`views/field-officer/RegisterFamily.tsx`)

#### Step 1: Head of Family Data
✅ **Work Information Section**
- Added monthly income range dropdown with 5 options
- Options: لا دخل، أقل من 100 دولار، 100-300 دولار، 300-500 دولار، أكثر من 500 دولار

✅ **Health Section - Enhanced**
- Disability severity dropdown (appears when disability != 'none')
- Expanded chronic disease options (asthma, kidney_failure, mental_disease, other)
- Expanded war injury options (burn, head_face, spinal, other)
- Medical follow-up section with:
  - Checkbox: "هل يحتاج متابعة طبية مستمرة؟"
  - Frequency dropdown: يومي، أسبوعي، شهري، آخر
  - Details text field for follow-up type

✅ **Widow Reason**
- Added accident and disease options

#### Step 2: Wife/Spouse Data
✅ **Health Section - Enhanced**
- Same expansions as head of family:
  - Disability severity
  - Expanded chronic diseases
  - Expanded war injuries
  - Medical follow-up details

✅ **New Work Information Section**
- Checkbox: "هل تعمل حالياً؟"
- Occupation text field (appears when working)

### 2.3 DPPortal Component (`views/beneficiary/DPPortal.tsx`)

✅ **Individual Member Modal - Enhanced**
- Expanded relation types (17 options including extended family)
- Disability severity dropdown
- Expanded chronic disease options (9 options)
- Education section:
  - "هل يدرس؟" dropdown (نعم/لا)
  - Education stage dropdown (appears when studying)
  - Options: ابتدائي، إعدادي، ثانوي/جامعي، آخر

---

## 3. Data Model Compliance

### 4.1 Head of Family Data ✅

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| National ID (unique) | `head_of_family_national_id` | ✅ |
| Full Name (4 parts) | `head_of_family_name` | ✅ |
| Date of Birth | `head_of_family_date_of_birth` | ✅ |
| Age (auto-calculated) | `head_of_family_age` | ✅ |
| Gender | `head_of_family_gender` | ✅ |
| Marital Status (5 options) | `head_of_family_marital_status` | ✅ |
| Widow Reason (5 options) | `head_of_family_widow_reason_expanded` | ✅ |
| Head Role (3 options) | `head_of_family_role` | ✅ |
| Is Working | `head_of_family_is_working` | ✅ |
| Occupation | `head_of_family_job` | ✅ |
| Monthly Income Range | `head_of_family_monthly_income_range` | ✅ |
| Phone Numbers (2) | `head_of_family_phone_number`, `head_of_family_phone_secondary` | ✅ |
| Disability (type + severity) | `head_of_family_disability_type`, `head_of_family_disability_severity` | ✅ |
| Chronic Disease (expanded) | `head_of_family_chronic_disease_type_expanded` | ✅ |
| War Injury (expanded) | `head_of_family_war_injury_type_expanded` | ✅ |
| Medical Follow-up | `head_of_family_medical_followup_required`, `frequency`, `details` | ✅ |

### 4.2 Wife/Spouse Data ✅

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| Full Name | `wife_name` | ✅ |
| National ID | `wife_national_id` | ✅ |
| Date of Birth | `wife_date_of_birth` | ✅ |
| Age (auto-calculated) | Calculated from DOB | ✅ |
| Pregnancy Status | `wife_is_pregnant` | ✅ |
| Pregnancy Month | `wife_pregnancy_month` | ✅ |
| Is Working | `wife_is_working` | ✅ |
| Occupation | `wife_occupation` | ✅ |
| Disability (type + severity) | `wife_disability_type`, `wife_disability_severity` | ✅ |
| Chronic Disease (expanded) | `wife_chronic_disease_type_expanded` | ✅ |
| War Injury (expanded) | `wife_war_injury_type_expanded` | ✅ |
| Medical Follow-up | `wife_medical_followup_required`, `frequency`, `details` | ✅ |

### 4.3 Family Statistics (Auto-calculated) ✅

| Statistic | Implementation | Status |
|-----------|---------------|--------|
| Total Members | `total_members_count` | ✅ |
| Male Count | `male_count` | ✅ |
| Female Count | `female_count` | ✅ |
| Children (<12) | `child_count` | ✅ |
| Teenagers (12-18) | `teenager_count` | ✅ |
| Adults (18-60) | `adult_count` | ✅ |
| Seniors (>60) | `senior_count` | ✅ |
| Disabled Count | `disabled_count` | ✅ |
| Injured Count | `injured_count` | ✅ |
| Pregnant Women | `pregnant_women_count` | ✅ |

**Note:** Auto-calculation is handled by database triggers (see migration `005_add_family_counts_trigger.sql`)

### 4.4 Individual Family Members ✅

| Requirement | Implementation | Status |
|-------------|---------------|--------|
| Full Name | `name` | ✅ |
| National ID | `national_id` | ✅ |
| Date of Birth | `date_of_birth` | ✅ |
| Age (auto-calculated) | `age` | ✅ |
| Gender | `gender` | ✅ |
| Relation (17 options) | `relation` (expanded) | ✅ |
| Is Studying | `is_studying` | ✅ |
| Education Stage | `education_stage` | ✅ |
| Occupation | `occupation` | ✅ |
| Phone Number | `phone_number` | ✅ |
| Marital Status | `marital_status` | ✅ |
| Disability (type + severity) | `disability_type`, `disability_severity` | ✅ |
| Chronic Disease (expanded) | `chronic_disease_type` (expanded) | ✅ |
| War Injury (expanded) | `war_injury_type` (expanded) | ✅ |
| Medical Follow-up | `medical_followup_required`, `frequency`, `details` | ✅ |

---

## 4. Health Model - Unified Structure ✅

The unified health model is now fully implemented for:
- Head of Family
- Wife/Spouse
- All Individual Family Members

### Components:
1. **Disability**
   - Type: none, motor, visual, hearing, mental, other
   - Severity: simple, moderate, severe, total
   - Details: TEXT field for additional information

2. **Chronic Disease**
   - Types: diabetes, blood_pressure, heart, cancer, asthma, kidney_failure, mental_disease, other
   - Details: TEXT field

3. **War Injury**
   - Types: amputation, fracture, shrapnel, burn, head_face, spinal, other
   - Details: TEXT field

4. **Medical Follow-up**
   - Required: BOOLEAN
   - Frequency: daily, weekly, monthly, other
   - Details: TEXT field describing type of follow-up

---

## 5. Running the Migration

To apply the database changes:

```bash
# Navigate to backend directory
cd backend

# Run the migration
psql -U your_username -d your_database -f db/migrations/009_complete_family_individuals_model.sql
```

Or if using Supabase:
```bash
# Run in Supabase SQL Editor or via CLI
supabase db push
```

---

## 6. Testing Checklist

### Frontend Testing
- [ ] RegisterFamily Step 1: Verify all new fields appear correctly
- [ ] RegisterFamily Step 2: Verify wife work section appears
- [ ] RegisterFamily Step 2: Verify expanded health options
- [ ] DPPortal: Verify expanded relation types in dropdown
- [ ] DPPortal: Verify education section (isStudying + educationStage)
- [ ] DPPortal: Verify disability severity appears when disability selected

### Backend Testing
- [ ] Verify migration runs without errors
- [ ] Verify triggers still work correctly
- [ ] Verify family counts are calculated correctly
- [ ] Test API endpoints with new fields

### Data Validation
- [ ] Test with existing data (backward compatibility)
- [ ] Verify NULL handling for optional fields
- [ ] Test enum constraints

---

## 7. Backward Compatibility

All changes are backward compatible:
- New columns use `ADD COLUMN IF NOT EXISTS`
- Existing data is preserved
- Default values are set where appropriate
- Old enum values are maintained, new ones are added

---

## 8. Files Modified

1. **Database**
   - `backend/db/migrations/009_complete_family_individuals_model.sql` (NEW)

2. **TypeScript Types**
   - `types.ts`

3. **Frontend Components**
   - `views/field-officer/RegisterFamily.tsx`
   - `views/beneficiary/DPPortal.tsx`

---

## 9. Summary

The implementation is now **100% complete** according to the specified data model requirements. All fields from the نموذج البيانات: الأسرة والأفراد document have been implemented in both the database schema and frontend components.

### Key Achievements:
✅ Complete health model with severity levels
✅ Wife/spouse work information
✅ Expanded chronic disease and war injury types
✅ Medical follow-up details
✅ Education tracking for individuals
✅ Extended family relations
✅ Monthly income ranges
✅ Expanded widow reasons
