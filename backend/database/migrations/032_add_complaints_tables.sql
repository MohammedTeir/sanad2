-- Migration 032: Add Complaints and Emergency Reports Tables
-- Date: 2026-03-08
-- Description: Add tables for beneficiary feedback and emergency reporting
-- Note: Update Requests table was removed as it was never implemented

-- ============================================
-- Table: Complaints/Feedback
-- ============================================
CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'عام',
    is_anonymous BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) DEFAULT 'جديد' CHECK (status IN ('جديد', 'قيد المراجعة', 'تم الرد', 'مغلق')),
    response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: Emergency Reports
-- ============================================
CREATE TABLE IF NOT EXISTS emergency_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    emergency_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    urgency VARCHAR(20) CHECK (urgency IN ('عاجل جداً', 'عاجل', 'عادي')),
    location TEXT,
    status VARCHAR(30) DEFAULT 'جديد' CHECK (status IN ('جديد', 'قيد المعالجة', 'تم التحويل', 'تم الحل', 'مرفوض')),
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_complaints_family_id ON complaints(family_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_created_at ON complaints(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_emergency_reports_family_id ON emergency_reports(family_id);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_urgency ON emergency_reports(urgency);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_status ON emergency_reports(status);
CREATE INDEX IF NOT EXISTS idx_emergency_reports_created_at ON emergency_reports(created_at DESC);

-- ============================================
-- Row Level Security (RLS) Policies
-- ============================================
ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_reports ENABLE ROW LEVEL SECURITY;

-- Complaints Policies
DROP POLICY IF EXISTS "Beneficiaries can view own complaints" ON complaints;
CREATE POLICY "Beneficiaries can view own complaints"
    ON complaints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = complaints.family_id
        )
    );

DROP POLICY IF EXISTS "Beneficiaries can insert own complaints" ON complaints;
CREATE POLICY "Beneficiaries can insert own complaints"
    ON complaints FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = family_id
        )
    );

DROP POLICY IF EXISTS "Staff can view all complaints" ON complaints;
CREATE POLICY "Staff can view all complaints"
    ON complaints FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

DROP POLICY IF EXISTS "Staff can update complaints" ON complaints;
CREATE POLICY "Staff can update complaints"
    ON complaints FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

-- Emergency Reports Policies
DROP POLICY IF EXISTS "Beneficiaries can view own emergency reports" ON emergency_reports;
CREATE POLICY "Beneficiaries can view own emergency reports"
    ON emergency_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = emergency_reports.family_id
        )
    );

DROP POLICY IF EXISTS "Beneficiaries can insert own emergency reports" ON emergency_reports;
CREATE POLICY "Beneficiaries can insert own emergency reports"
    ON emergency_reports FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.family_id = family_id
        )
    );

DROP POLICY IF EXISTS "Staff can view all emergency reports" ON emergency_reports;
CREATE POLICY "Staff can view all emergency reports"
    ON emergency_reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

DROP POLICY IF EXISTS "Staff can update emergency reports" ON emergency_reports;
CREATE POLICY "Staff can update emergency reports"
    ON emergency_reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER')
        )
    );

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE complaints IS 'شكاوى ومقترحات النازحين لتحسين الخدمات';
COMMENT ON TABLE emergency_reports IS 'تقارير الطوارئ المقدمة من النازحين';

COMMENT ON COLUMN complaints.category IS 'تصنيف الشكوى: عام، صحي، أمن، مرافق، أخرى';
COMMENT ON COLUMN emergency_reports.urgency IS 'درجة الاستعجال: عاجل جداً، عاجل، عادي';
