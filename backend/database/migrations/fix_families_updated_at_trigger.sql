-- Fix: Drop the update_updated_at trigger from families table
-- The families table uses 'last_updated' instead of 'updated_at'

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS update_families_updated_at ON public.families;

-- Optionally, create a new trigger that updates last_updated instead
CREATE OR REPLACE FUNCTION update_families_last_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_families_last_updated
BEFORE UPDATE ON public.families
FOR EACH ROW
EXECUTE FUNCTION update_families_last_updated();

-- Add comment
COMMENT ON FUNCTION update_families_last_updated() IS 'Automatically update last_updated timestamp on families table';
