-- =====================================================
-- MIGRATION 025: CONVERT CATEGORY TO FEMININE FORMS
-- Purpose: Standardize aid and inventory categories to use feminine Arabic forms
-- Date: 2026-02-25
-- Note: Removed CHECK constraint from aids table to allow custom categories
-- =====================================================

-- =====================================================
-- STEP 0: DROP OLD CONSTRAINTS FIRST
-- =====================================================

-- Drop old constraints if they exist (for aids) - NO LONGER NEEDED FOR CUSTOM CATEGORIES
DO $$ BEGIN
    ALTER TABLE aids DROP CONSTRAINT IF EXISTS aids_category_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Drop old constraints if they exist (for inventory)
DO $$ BEGIN
    ALTER TABLE inventory DROP CONSTRAINT IF EXISTS inventory_category_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Drop old constraints if they exist (for aid_campaigns)
DO $$ BEGIN
    ALTER TABLE aid_campaigns DROP CONSTRAINT IF EXISTS aid_campaigns_aid_category_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Drop old constraints if they exist (for aid_distributions)
DO $$ BEGIN
    ALTER TABLE aid_distributions DROP CONSTRAINT IF EXISTS aid_distributions_aid_category_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- =====================================================
-- STEP 1: UPDATE EXISTING DATA FROM MASCULINE TO FEMININE
-- =====================================================

-- Update aids table category from masculine to feminine
UPDATE aids SET category = 'غذائية' WHERE category = 'غذاء';
UPDATE aids SET category = 'غير غذائية' WHERE category = 'غير غذائي';
UPDATE aids SET category = 'طبية' WHERE category = 'طبي';
UPDATE aids SET category = 'مائية' WHERE category = 'ماء';

-- Update inventory table category from masculine to feminine
UPDATE inventory SET category = 'غذائية' WHERE category = 'غذاء';
UPDATE inventory SET category = 'غير غذائية' WHERE category = 'غير غذائي';
UPDATE inventory SET category = 'طبية' WHERE category = 'طبي';
UPDATE inventory SET category = 'مائية' WHERE category = 'ماء';

-- Update aid_campaigns table aid_category from masculine to feminine
UPDATE aid_campaigns SET aid_category = 'غذائية' WHERE aid_category = 'غذاء';
UPDATE aid_campaigns SET aid_category = 'غير غذائية' WHERE aid_category = 'غير غذائي';
UPDATE aid_campaigns SET aid_category = 'طبية' WHERE aid_category = 'طبي';

-- Update aid_distributions table aid_category from masculine to feminine
UPDATE aid_distributions SET aid_category = 'غذائية' WHERE aid_category = 'غذاء';
UPDATE aid_distributions SET aid_category = 'غير غذائية' WHERE aid_category = 'غير غذائي';
UPDATE aid_distributions SET aid_category = 'طبية' WHERE aid_category = 'طبي';

-- =====================================================
-- STEP 2: ADD NEW CONSTRAINTS WITH FEMININE VALUES
-- Note: aids table does NOT have a constraint to allow custom categories
-- =====================================================

-- Inventory constraints - feminine forms
ALTER TABLE inventory ADD CONSTRAINT inventory_category_check
    CHECK (category IN ('غذائية', 'غير غذائية', 'طبية', 'مأوى', 'مائية', 'أخرى'));

-- Aid campaigns constraints - feminine forms (note: 'نقدية' kept for cash aid)
ALTER TABLE aid_campaigns ADD CONSTRAINT aid_campaigns_aid_category_check
    CHECK (aid_category IN ('غذائية', 'غير غذائية', 'طبية', 'نقدية', 'مأوى', 'مائية', 'أخرى'));

-- Aid distributions constraints - feminine forms (note: 'نقدية' kept for cash aid)
ALTER TABLE aid_distributions ADD CONSTRAINT aid_distributions_aid_category_check
    CHECK (aid_category IN ('غذائية', 'غير غذائية', 'طبية', 'نقدية', 'مأوى', 'مائية', 'أخرى'));

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
