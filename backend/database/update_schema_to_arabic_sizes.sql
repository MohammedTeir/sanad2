-- =====================================================
-- UPDATE SCHEMA FILES TO ARABIC VARCHAR SIZES
-- Run this on schema files, not production database
-- =====================================================

-- This is a sed/replace script for updating schema files
-- Manual replacements needed:

-- database_schema_unified.sql & database_schema_unified_with_if_not_exists.sql

-- Camps
VARCHAR(20) DEFAULT 'نشط' → VARCHAR(30) DEFAULT 'نشط'

-- Families  
head_of_family_gender VARCHAR(10) → VARCHAR(20)
head_of_family_marital_status VARCHAR(20) → VARCHAR(30)
head_of_family_widow_reason VARCHAR(20) → VARCHAR(30)
head_of_family_role VARCHAR(20) → VARCHAR(30)
head_of_family_disability_type VARCHAR(20) → VARCHAR(30)
head_of_family_disability_severity VARCHAR(20) → VARCHAR(20) (no change needed)
head_of_family_chronic_disease_type VARCHAR(20) → VARCHAR(30)
head_of_family_war_injury_type VARCHAR(20) → VARCHAR(30)
original_address_housing_type VARCHAR(20) → VARCHAR(30)
current_housing_type VARCHAR(20) → VARCHAR(30)
current_housing_sharing_status VARCHAR(20) → VARCHAR(30)
current_housing_sanitary_facilities VARCHAR(20) → VARCHAR(50)
current_housing_water_source VARCHAR(20) → VARCHAR(30)
current_housing_electricity_access VARCHAR(20) → VARCHAR(30)
refugee_resident_abroad_residence_type VARCHAR(20) → VARCHAR(30)
vulnerability_priority VARCHAR(20) → VARCHAR(30)
status VARCHAR(20) → VARCHAR(30)
head_of_family_monthly_income_range VARCHAR(20) → VARCHAR(30)
wife_disability_type VARCHAR(20) → VARCHAR(30)
wife_disability_severity VARCHAR(20) → VARCHAR(20) (no change)
wife_chronic_disease_type VARCHAR(20) → VARCHAR(30)
wife_war_injury_type VARCHAR(20) → VARCHAR(30)

-- Individuals
gender VARCHAR(10) → VARCHAR(20)
relation VARCHAR(20) → VARCHAR(30)
education_stage VARCHAR(20) → VARCHAR(30)
education_level VARCHAR(20) → VARCHAR(30)
marital_status VARCHAR(20) → VARCHAR(30)
disability_type VARCHAR(20) → VARCHAR(30)
disability_severity VARCHAR(20) → VARCHAR(20) (no change)
chronic_disease_type VARCHAR(20) → VARCHAR(30)
war_injury_type VARCHAR(20) → VARCHAR(30)

-- Aids
category VARCHAR(50) → VARCHAR(30)

-- Distributions
status VARCHAR(20) → VARCHAR(30)

-- Distribution Records
status VARCHAR(20) → VARCHAR(30)

-- Inventory
category VARCHAR(50) → VARCHAR(30)

-- Import/Export Operations
operation_type VARCHAR(10) → VARCHAR(30)
status VARCHAR(20) → VARCHAR(30)

-- Backup/Sync Operations
operation_type VARCHAR(10) → VARCHAR(30)
scope VARCHAR(20) → VARCHAR(30)
status VARCHAR(20) → VARCHAR(30)

-- Aid Campaigns
status VARCHAR(20) → VARCHAR(30)
aid_category VARCHAR(50) → VARCHAR(30)

-- Aid Distributions
status VARCHAR(20) → VARCHAR(30)
aid_category VARCHAR(50) → VARCHAR(30)

-- Inventory Items
category VARCHAR(50) → VARCHAR(30)

-- Security Logs (already correct)
severity VARCHAR(20) - NO CHANGE NEEDED (already 20)
