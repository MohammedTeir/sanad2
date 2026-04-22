-- Migration 015: Migrate to 4-Part Name Structure
-- This migration adds 4-part name columns to families and individuals tables
-- and backfills existing data by splitting full names

-- =====================================================
-- PART 1: Families Table - Head of Family Names
-- =====================================================

-- Add 4-part name columns to families table
ALTER TABLE families
  ADD COLUMN IF NOT EXISTS head_first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS head_father_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS head_grandfather_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS head_family_name VARCHAR(100);

-- Backfill data: split existing full names into 4 parts
-- Strategy: Use split_part() function for better PostgreSQL compatibility
-- Handle cases with fewer than 4 parts by using fallback logic
UPDATE families
SET
  head_first_name = COALESCE(NULLIF(split_part(head_of_family_name, ' ', 1), ''), head_of_family_name),
  head_father_name = CASE
    WHEN split_part(head_of_family_name, ' ', 2) != '' THEN split_part(head_of_family_name, ' ', 2)
    ELSE head_first_name
  END,
  head_grandfather_name = CASE
    WHEN split_part(head_of_family_name, ' ', 3) != '' THEN split_part(head_of_family_name, ' ', 3)
    ELSE head_first_name
  END,
  head_family_name = CASE
    WHEN split_part(head_of_family_name, ' ', 4) != '' THEN split_part(head_of_family_name, ' ', 4)
    WHEN split_part(head_of_family_name, ' ', 3) != '' THEN split_part(head_of_family_name, ' ', 3)
    ELSE head_first_name
  END
WHERE head_first_name IS NULL;

-- =====================================================
-- PART 2: Individuals Table - Member Names
-- =====================================================

-- Add 4-part name columns to individuals table
ALTER TABLE individuals
  ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS father_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS grandfather_name VARCHAR(100),
  ADD COLUMN IF NOT EXISTS family_name VARCHAR(100);

-- Backfill data for individuals
UPDATE individuals
SET
  first_name = COALESCE(NULLIF(split_part(name, ' ', 1), ''), name),
  father_name = CASE
    WHEN split_part(name, ' ', 2) != '' THEN split_part(name, ' ', 2)
    ELSE first_name
  END,
  grandfather_name = CASE
    WHEN split_part(name, ' ', 3) != '' THEN split_part(name, ' ', 3)
    ELSE first_name
  END,
  family_name = CASE
    WHEN split_part(name, ' ', 4) != '' THEN split_part(name, ' ', 4)
    WHEN split_part(name, ' ', 3) != '' THEN split_part(name, ' ', 3)
    ELSE first_name
  END
WHERE first_name IS NULL;

-- =====================================================
-- PART 3: Create Indexes for Performance
-- =====================================================

-- Add indexes for search optimization
CREATE INDEX IF NOT EXISTS idx_families_head_first_name ON families(head_first_name);
CREATE INDEX IF NOT EXISTS idx_families_head_father_name ON families(head_father_name);
CREATE INDEX IF NOT EXISTS idx_families_head_family_name ON families(head_family_name);
CREATE INDEX IF NOT EXISTS idx_individuals_first_name ON individuals(first_name);
CREATE INDEX IF NOT EXISTS idx_individuals_father_name ON individuals(father_name);
CREATE INDEX IF NOT EXISTS idx_individuals_family_name ON individuals(family_name);

-- =====================================================
-- PART 4: Create Comments for Documentation
-- =====================================================

COMMENT ON COLUMN families.head_first_name IS 'الاسم الأول - First name';
COMMENT ON COLUMN families.head_father_name IS 'اسم الأب - Father''s name';
COMMENT ON COLUMN families.head_grandfather_name IS 'اسم الجد - Grandfather''s name';
COMMENT ON COLUMN families.head_family_name IS 'اسم العائلة - Family name';

COMMENT ON COLUMN individuals.first_name IS 'الاسم الأول - First name';
COMMENT ON COLUMN individuals.father_name IS 'اسم الأب - Father''s name';
COMMENT ON COLUMN individuals.grandfather_name IS 'اسم الجد - Grandfather''s name';
COMMENT ON COLUMN individuals.family_name IS 'اسم العائلة - Family name';

-- =====================================================
-- Migration Complete
-- =====================================================
