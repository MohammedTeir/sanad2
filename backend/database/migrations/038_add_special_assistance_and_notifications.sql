-- Migration: Add Special Assistance Requests and Notifications Tables
-- Created for DP Portal Features Enhancement

-- ============================================
-- Table: Special Assistance Requests
-- ============================================
CREATE TABLE IF NOT EXISTS special_assistance_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    assistance_type VARCHAR(50) NOT NULL CHECK (assistance_type IN ('طبية', 'مالية', 'سكنية', 'تعليمية', 'أخرى')),
    description TEXT NOT NULL,
    urgency VARCHAR(20) CHECK (urgency IN ('عاجل جداً', 'عاجل', 'عادي')),
    status VARCHAR(30) DEFAULT 'جديد' CHECK (status IN ('جديد', 'قيد المراجعة', 'تمت الموافقة', 'مرفوض', 'تم التنفيذ')),
    response TEXT,
    responded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMP WITH TIME ZONE,
    deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Table: Notifications
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    -- Base notification types (will be extended by migration 040)
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN (
        -- Family-facing notifications
        'توزيع', 
        'شكوى_رد', 
        'انتقال_تحديث', 
        'نظام',
        'تحديث_تذكير',
        'توزيع_جاهز',
        'توزيع_تذكير',
        'حملة_حالة',
        'حملة_قرب_انتهاء',
        'مساعدة_خاصة_رد',
        'أسرة_موافقة',
        'أسرة_حالة',
        'بيانات_تحديث_مطلوب',
        'تأكيد_مطلوب',
        -- Staff-facing notifications
        'شكوى_جديدة',
        'طوارئ_بلاغ',
        'انتقال_طلب_جديد',
        'مساعدة_خاصة_طلب_جديد',
        'توزيع_حملة_جديدة',
        'مخزون_منخفض_تنبيه',
        'مخزون_جديد_وصل',
        'صلاحية_انتهاء_تنبيه',
        -- System notifications
        'أمني_تنبيه',
        'دخول_فاشل_تنبيه',
        'صيانة'
    )),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_special_assistance_family_id ON special_assistance_requests(family_id);
CREATE INDEX IF NOT EXISTS idx_special_assistance_status ON special_assistance_requests(status);
CREATE INDEX IF NOT EXISTS idx_special_assistance_created_at ON special_assistance_requests(created_at);

CREATE INDEX IF NOT EXISTS idx_notifications_family_id ON notifications(family_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(notification_type);

-- ============================================
-- Trigger to Update Timestamps
-- ============================================
CREATE TRIGGER update_special_assistance_requests_updated_at
    BEFORE UPDATE ON special_assistance_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE special_assistance_requests IS 'طلبات المساعدة الخاصة المقدمة من المستفيدين (طبية، مالية، سكنية، تعليمية)';
COMMENT ON COLUMN special_assistance_requests.assistance_type IS 'نوع المساعدة: طبية، مالية، سكنية، تعليمية، أخرى';
COMMENT ON COLUMN special_assistance_requests.urgency IS 'مستوى الأهمية: عاجل جداً، عاجل، عادي';
COMMENT ON COLUMN special_assistance_requests.status IS 'حالة الطلب: جديد، قيد المراجعة، تمت الموافقة، مرفوض، تم التنفيذ';

COMMENT ON TABLE notifications IS 'إشعارات النظام للمستفيدين حول التوزيعات والشكاوى والانتقالات وغيرها';
COMMENT ON COLUMN notifications.notification_type IS 'نوع الإشعار: توزيع، شكوى_رد، انتقال_تحديث، نظام، تحديث_تذكير، وغيرها';
COMMENT ON COLUMN notifications.related_entity_id IS 'معرف الكيان المرتبط (معرف الشكوى، معرف الانتقال، معرف التوزيع، إلخ)';
COMMENT ON COLUMN notifications.related_entity_type IS 'نوع الكيان المرتبط: شكوى، انتقال، توزيع، إلخ';

-- ============================================
-- RLS Policies (Row Level Security)
-- ============================================
-- Enable RLS
ALTER TABLE special_assistance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own special assistance requests
CREATE POLICY "Users can view own special assistance requests"
    ON special_assistance_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM families f
            INNER JOIN users u ON u.family_id = f.id
            WHERE f.id = special_assistance_requests.family_id
            AND u.id = auth.uid()
        )
    );

-- Policy: Users can insert their own special assistance requests
CREATE POLICY "Users can insert own special assistance requests"
    ON special_assistance_requests
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM families f
            INNER JOIN users u ON u.family_id = f.id
            WHERE f.id = special_assistance_requests.family_id
            AND u.id = auth.uid()
        )
    );

-- Policy: Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM families f
            INNER JOIN users u ON u.family_id = f.id
            WHERE f.id = notifications.family_id
            AND u.id = auth.uid()
        )
    );

-- Policy: Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM families f
            INNER JOIN users u ON u.family_id = f.id
            WHERE f.id = notifications.family_id
            AND u.id = auth.uid()
        )
    );

-- Policy: Camp Managers can view special assistance requests for their camp
CREATE POLICY "Camp managers can view requests for their camp"
    ON special_assistance_requests
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM families f
            INNER JOIN users u ON u.camp_id = f.camp_id
            WHERE f.id = special_assistance_requests.family_id
            AND u.id = auth.uid()
            AND u.role = 'CAMP_MANAGER'
        )
    );

-- Policy: Camp Managers can update special assistance requests for their camp
CREATE POLICY "Camp managers can update requests for their camp"
    ON special_assistance_requests
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM families f
            INNER JOIN users u ON u.camp_id = f.camp_id
            WHERE f.id = special_assistance_requests.family_id
            AND u.id = auth.uid()
            AND u.role = 'CAMP_MANAGER'
        )
    );

-- Policy: System can insert notifications (for triggers, etc.)
-- This is handled by backend code, not RLS
