-- Simple Migration: Add Soft Delete Columns
-- Run this in your Supabase SQL Editor or PostgreSQL client
-- Note: Update Requests section removed as the table was never implemented

-- Add columns to complaints (ignore errors if columns exist)
DO $$ BEGIN
    ALTER TABLE complaints ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE complaints ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE complaints ADD COLUMN deleted_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Add columns to emergency_reports
DO $$ BEGIN
    ALTER TABLE emergency_reports ADD COLUMN deleted BOOLEAN DEFAULT FALSE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE emergency_reports ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE emergency_reports ADD COLUMN deleted_by UUID;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create indexes (ignore errors if they exist)
DO $$ BEGIN
    CREATE INDEX idx_complaints_deleted ON complaints(deleted);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;

DO $$ BEGIN
    CREATE INDEX idx_emergency_reports_deleted ON emergency_reports(deleted);
EXCEPTION WHEN duplicate_table THEN NULL;
END $$;
