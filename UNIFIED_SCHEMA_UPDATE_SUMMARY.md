# Unified Schema Update Summary

## Overview
Updated both unified database schema files to include the 4-part Arabic name structure and all missing fields from migrations 015 and 016.

## Files Updated

### 1. `/backend/database/database_schema_unified_with_if_not_exists.sql`
### 2. `/backend/database/database_schema_unified.sql`

---

## Changes Made

### Families Table

#### 4-Part Name Structure (Migration 015)
Added 4 new columns for Arabic name structure:
- `head_first_name VARCHAR(100)` - الاسم الأول
- `head_father_name VARCHAR(100)` - اسم الأب
- `head_grandfather_name VARCHAR(100)` - اسم الجد
- `head_family_name VARCHAR(100)` - اسم العائلة

**Note:** The existing `head_of_family_name` column is kept for backward compatibility and computed full-name storage.

#### Pregnancy Special Needs (Migration 016)
- `wife_pregnancy_special_needs BOOLEAN DEFAULT FALSE` - Does she need special pregnancy follow-up
- `wife_pregnancy_followup_details TEXT` - Special pregnancy follow-up details

#### Enhanced Housing Fields (Migration 016)
- `current_housing_sharing_status VARCHAR(20)` - Housing sharing status: 'individual' (خيمة/سكن فردي) or 'shared' (خيمة/سكن مشترك)
- `current_housing_detailed_type VARCHAR(50)` - Detailed housing type: tent_individual, tent_shared, house_full, house_room, apartment_furnished, apartment_unfurnished, caravan, other
- `current_housing_furnished BOOLEAN` - Furnished/unfurnished for apartments

---

### Individuals Table

#### 4-Part Name Structure (Migration 015)
Added 4 new columns for Arabic name structure:
- `first_name VARCHAR(100)` - الاسم الأول
- `father_name VARCHAR(100)` - اسم الأب
- `grandfather_name VARCHAR(100)` - اسم الجد
- `family_name VARCHAR(100)` - اسم العائلة

**Note:** The existing `name` column is kept for backward compatibility and computed full-name storage.

#### Enhanced Fields (Migration 016)
The following fields were already present in the unified schema but are part of Migration 016:
- `is_studying BOOLEAN DEFAULT FALSE` - Is studying
- `education_stage VARCHAR(20)` - Education stage
- `is_working BOOLEAN DEFAULT FALSE` - Is working
- `occupation VARCHAR(255)` - Occupation
- `marital_status VARCHAR(20)` - Marital status
- `phone_number VARCHAR(20)` - Individual phone number
- `disability_severity VARCHAR(20)` - Disability severity
- `disability_details TEXT` - Disability details
- `chronic_disease_details TEXT` - Chronic disease details
- `war_injury_details TEXT` - War injury details
- `medical_followup_frequency VARCHAR(50)` - Medical follow-up frequency
- `medical_followup_details TEXT` - Medical follow-up details

---

## Indexes Added

### Families Table Indexes
```sql
-- Migration 015: 4-Part Name Indexes
CREATE INDEX IF NOT EXISTS idx_families_head_first_name ON families(head_first_name);
CREATE INDEX IF NOT EXISTS idx_families_head_father_name ON families(head_father_name);
CREATE INDEX IF NOT EXISTS idx_families_head_family_name ON families(head_family_name);

-- Migration 016: New Field Indexes
CREATE INDEX IF NOT EXISTS idx_families_housing_sharing ON families(current_housing_sharing_status);
CREATE INDEX IF NOT EXISTS idx_families_wife_pregnant_special_needs ON families(wife_pregnancy_special_needs);
```

### Individuals Table Indexes
```sql
-- Migration 015: 4-Part Name Indexes
CREATE INDEX IF NOT EXISTS idx_individuals_first_name ON individuals(first_name);
CREATE INDEX IF NOT EXISTS idx_individuals_father_name ON individuals(father_name);
CREATE INDEX IF NOT EXISTS idx_individuals_family_name ON individuals(family_name);

-- Migration 016: New Field Indexes
CREATE INDEX IF NOT EXISTS idx_individuals_is_working ON individuals(is_working);
CREATE INDEX IF NOT EXISTS idx_individuals_marital_status ON individuals(marital_status);
```

---

## Backward Compatibility

Both schema files maintain backward compatibility by:
1. **Keeping existing columns**: The `head_of_family_name` and `name` columns remain in place
2. **Allowing NULL for new name columns**: The 4-part name columns are nullable to allow gradual migration
3. **Computed full names**: Backend routes will compute the full name from parts and store in the existing columns

---

## Migration Strategy

### For Existing Databases
Use the migration files:
- `015_migrate_to_4part_names.sql` - Adds 4-part name columns and backfills data
- `016_add_missing_family_fields.sql` - Adds all missing fields with proper defaults

### For New Databases
Use the updated unified schema files directly - they include all columns from both migrations.

---

## Related Files

### Migration Files
- `/backend/db/migrations/015_migrate_to_4part_names.sql`
- `/backend/db/migrations/016_add_missing_family_fields.sql`

### Backend Routes
- `/backend/routes/families.js` - Updated with 4-part name validation and computation
- `/backend/routes/individuals.js` - Updated with name computation

### Frontend
- `/views/field-officer/RegisterFamily.tsx` - Updated with 4 name inputs and new fields
- `/types.ts` - Updated DPProfile and FamilyMember interfaces

---

## Testing Checklist

- [ ] Create new database using updated unified schema
- [ ] Run migrations on existing database
- [ ] Verify all new columns exist in families table
- [ ] Verify all new columns exist in individuals table
- [ ] Test 4-part name insertion via API
- [ ] Test backward compatibility with full name queries
- [ ] Verify indexes are created properly
- [ ] Test RegisterFamily form with new fields
- [ ] Test pregnancy special needs conditional display
- [ ] Test housing sharing dropdown functionality

---

## Schema Differences

### `database_schema_unified_with_if_not_exists.sql`
- Uses `CREATE TABLE IF NOT EXISTS` syntax
- Includes `IF NOT EXISTS` clauses in all CREATE INDEX statements
- Suitable for idempotent deployment (can run multiple times safely)

### `database_schema_unified.sql`
- Uses standard `CREATE TABLE` syntax
- For fresh database installations
- More concise (no IF NOT EXISTS checks)

Both files now have identical column structures and indexes.

---

## Next Steps

1. ✅ Update unified schema files (DONE)
2. Update remaining frontend components:
   - DPDetails.tsx
   - DPManagement.tsx
   - FieldOfficerDashboard.tsx
   - DistributionScannerMode.tsx
   - DPPortal.tsx
3. Update realDataServiceBackend.ts for API compatibility
4. Update constants.tsx mock data
5. Run database migrations on test database
6. End-to-end testing

---

**Date:** February 23, 2026  
**Status:** Schema files updated successfully ✅
