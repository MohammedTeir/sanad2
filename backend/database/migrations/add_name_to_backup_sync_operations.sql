-- Migration: Add name field to backup_sync_operations table
-- This allows users to give custom names to their backups

-- Add the name column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'backup_sync_operations' 
        AND column_name = 'name'
    ) THEN
        ALTER TABLE public.backup_sync_operations 
        ADD COLUMN name VARCHAR(255);
        
        -- Add index for faster searching by name
        CREATE INDEX IF NOT EXISTS idx_backup_sync_name ON public.backup_sync_operations(name);
        
        RAISE NOTICE 'Added name column to backup_sync_operations table';
    ELSE
        RAISE NOTICE 'Column name already exists in backup_sync_operations table';
    END IF;
END $$;

-- Add comment to document the column
COMMENT ON COLUMN public.backup_sync_operations.name IS 'Custom name given to the backup by the user';
