-- Migration: Add Current Housing Geographic Location Fields
-- Date: 2026-02-22
-- Description: 
--   - Adds governorate and region fields to current_housing
--   - Matches the geographic location structure of original_address (5.1)

-- =====================================================
-- PART 1: Add new geographic location columns
-- =====================================================

-- Add governorate field
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS current_housing_governorate VARCHAR(100);

-- Add region field
ALTER TABLE families 
  ADD COLUMN IF NOT EXISTS current_housing_region VARCHAR(100);

-- =====================================================
-- PART 2: Create indexes for new columns
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_families_current_housing_governorate 
  ON families(current_housing_governorate);

CREATE INDEX IF NOT EXISTS idx_families_current_housing_region 
  ON families(current_housing_region);

-- =====================================================
-- PART 3: Add comments for documentation
-- =====================================================

COMMENT ON COLUMN families.current_housing_governorate IS '5.2 السكن الحالي: المحافظة الحالية';
COMMENT ON COLUMN families.current_housing_region IS '5.2 السكن الحالي: المنطقة';
COMMENT ON COLUMN families.current_housing_landmark IS '5.2 السكن الحالي: أقرب معلم معروف';

-- =====================================================
-- PART 4: Note on usage
-- =====================================================

-- These fields match the geographic location structure of Section 5.1 (Original Housing)
-- allowing for consistent location tracking for both original and current housing.

-- Governorate (المحافظة): Main governorate/province
-- Region (المنطقة): District/area within governorate
-- Landmark (أقرب معلم): Nearest known landmark (school, mosque, hospital, etc.)
