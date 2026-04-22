-- Migration: Add Notification Triggers for All DP Events
-- Automatically creates notifications for all DP-related events
-- Note: Run this BEFORE 040_enhance_notification_triggers.sql

-- ============================================
-- Function: Create notification for new distribution campaign
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_for_distribution()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for all families in the camp
    INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
    SELECT
        f.id,
        'توزيع'::VARCHAR(50),
        'توزيع مساعدات جديد',
        'تم إطلاق حملة توزيع جديدة: ' || COALESCE(NEW.name, 'حملة جديدة') || ' - ' || COALESCE(NEW.aid_type, 'مساعدات'),
        FALSE,
        NEW.id,
        'حملة_مساعدات'
    FROM families f
    WHERE f.camp_id = NEW.camp_id
    AND f.status = 'موافق';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for new distribution campaigns
DROP TRIGGER IF EXISTS notify_new_distribution ON aid_campaigns;
CREATE TRIGGER notify_new_distribution
    AFTER INSERT ON aid_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_distribution();

-- ============================================
-- Function: Create notification for distribution status change
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_for_distribution_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if status changed to completed
    IF OLD.status != NEW.status AND NEW.status = 'مكتمل' THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        SELECT
            d.family_id,
            'توزيع'::VARCHAR(50),
            'اكتمل التوزيع',
            'تم اكتمال توزيع المساعدات: ' || COALESCE(c.name, 'حملة التوزيع'),
            FALSE,
            NEW.id,
            'توزيع_مساعدات'
        FROM aid_distributions d
        LEFT JOIN aid_campaigns c ON c.id = NEW.campaign_id
        WHERE d.id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for distribution status changes
DROP TRIGGER IF EXISTS notify_distribution_status ON aid_distributions;
CREATE TRIGGER notify_distribution_status
    AFTER UPDATE ON aid_distributions
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_distribution_status();

-- ============================================
-- Function: Create notification for complaint response
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_for_complaint_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if response was added/updated or status changed
    IF (NEW.response IS NOT NULL AND NEW.response != OLD.response AND NEW.response != '') OR
       (NEW.status != OLD.status AND NEW.status IN ('تم الرد', 'مغلق')) THEN

        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.family_id,
            'شكوى_رد'::VARCHAR(50),
            'رد على شكواك',
            'تم الرد على شكواك: ' || COALESCE(NEW.subject, 'شكوى'),
            FALSE,
            NEW.id,
            'شكوى'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for complaint responses
DROP TRIGGER IF EXISTS notify_complaint_response ON complaints;
CREATE TRIGGER notify_complaint_response
    AFTER UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_complaint_response();

-- ============================================
-- Function: Create notification for emergency report response
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_for_emergency_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if status changed or resolution added
    IF (NEW.status != OLD.status AND NEW.status IN ('قيد المعالجة', 'تم التحويل', 'تم الحل', 'مرفوض')) OR
       (NEW.resolution_notes IS NOT NULL AND NEW.resolution_notes != OLD.resolution_notes AND NEW.resolution_notes != '') THEN

        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.family_id,
            'نظام'::VARCHAR(50),
            'تحديث بلاغ الطوارئ',
            'تم تحديث حالة بلاغ الطوارئ: ' || COALESCE(NEW.emergency_type, 'بلاغ طوارئ'),
            FALSE,
            NEW.id,
            'بلاغ_طوارئ'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for emergency report responses
DROP TRIGGER IF EXISTS notify_emergency_response ON emergency_reports;
CREATE TRIGGER notify_emergency_response
    AFTER UPDATE ON emergency_reports
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_emergency_response();

-- ============================================
-- Function: Create notification for transfer request update
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_for_transfer_update()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if status changed
    -- Fixed: Use NEW.dp_id directly instead of unnecessary SELECT
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.dp_id,
            'انتقال_تحديث'::VARCHAR(50),
            'تحديث طلب الانتقال',
            'تم تحديث حالة طلب الانتقال: ' ||
            CASE
                WHEN NEW.status = 'موافق' THEN 'تمت الموافقة على طلب الانتقال'
                WHEN NEW.status = 'مرفوض' THEN 'تم رفض طلب الانتقال'
                WHEN NEW.status = 'تمت المعالجة' THEN 'تمت معالجة طلب الانتقال'
                ELSE 'تم تحديث حالة طلب الانتقال'
            END,
            FALSE,
            NEW.id,
            'طلب_انتقال'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for transfer request updates
DROP TRIGGER IF EXISTS notify_transfer_update ON transfer_requests;
CREATE TRIGGER notify_transfer_update
    AFTER UPDATE ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_transfer_update();

-- ============================================
-- Function: Create notification for special assistance response
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_for_special_assistance_response()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if response was added or status changed
    IF (NEW.response IS NOT NULL AND NEW.response != OLD.response AND NEW.response != '') OR
       (NEW.status != OLD.status AND NEW.status IN ('تمت الموافقة', 'مرفوض', 'تم التنفيذ')) THEN

        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.family_id,
            'نظام'::VARCHAR(50),
            'رد على طلب المساعدة',
            'تم ' ||
            CASE
                WHEN NEW.status = 'تمت الموافقة' THEN 'الموافقة على طلب المساعدة'
                WHEN NEW.status = 'مرفوض' THEN 'رفض طلب المساعدة'
                WHEN NEW.status = 'تم التنفيذ' THEN 'تنفيذ طلب المساعدة'
                ELSE 'تحديث حالة طلب المساعدة'
            END,
            FALSE,
            NEW.id,
            'مساعدة_خاصة'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for special assistance responses
DROP TRIGGER IF EXISTS notify_special_assistance_response ON special_assistance_requests;
CREATE TRIGGER notify_special_assistance_response
    AFTER UPDATE ON special_assistance_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_special_assistance_response();

-- ============================================
-- Function: Create notification for family approval
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_for_family_approval()
RETURNS TRIGGER AS $$
BEGIN
    -- Only create notification if status changed to approved
    IF OLD.status != NEW.status AND NEW.status = 'موافق' THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.id,
            'نظام'::VARCHAR(50),
            'تم قبول تسجيل الأسرة',
            'تم قبول طلب تسجيل أسرتكم في النظام',
            FALSE,
            NEW.id,
            'أسرة'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for family approval
DROP TRIGGER IF EXISTS notify_family_approval ON families;
CREATE TRIGGER notify_family_approval
    AFTER UPDATE ON families
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_family_approval();

-- ============================================
-- Function: Create notification for family status change (any)
-- ============================================
CREATE OR REPLACE FUNCTION create_notification_for_family_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Create notification for any status change (except to approved, which is handled separately)
    IF OLD.status != NEW.status AND NEW.status != 'موافق' AND NEW.status != 'قيد الانتظار' THEN
        INSERT INTO notifications (family_id, notification_type, title, message, is_read, related_entity_id, related_entity_type)
        VALUES (
            NEW.id,
            'نظام'::VARCHAR(50),
            'تحديث حالة التسجيل',
            'تم تحديث حالة تسجيل أسرتكم إلى: ' || NEW.status,
            FALSE,
            NEW.id,
            'أسرة_حالة'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for family status changes
DROP TRIGGER IF EXISTS notify_family_status ON families;
CREATE TRIGGER notify_family_status
    AFTER UPDATE ON families
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_family_status();

-- ============================================
-- Function: Cleanup old notifications (optional maintenance)
-- ============================================
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
    -- Delete notifications older than 90 days that are already read
    DELETE FROM notifications
    WHERE is_read = TRUE
    AND created_at < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON FUNCTION create_notification_for_distribution IS 'ينشئ إشعارات لجميع الأسر الموافقة عند إنشاء حملة توزيع جديدة';
COMMENT ON FUNCTION create_notification_for_distribution_status IS 'ينشئ إشعاراً عند تغيير حالة التوزيع إلى مكتمل';
COMMENT ON FUNCTION create_notification_for_complaint_response IS 'ينشئ إشعاراً عند الرد على شكوى أو تغيير حالتها';
COMMENT ON FUNCTION create_notification_for_emergency_response IS 'ينشئ إشعاراً عند تغيير حالة بلاغ الطوارئ أو إضافة حل';
COMMENT ON FUNCTION create_notification_for_transfer_update IS 'ينشئ إشعاراً عند تغيير حالة طلب الانتقال';
COMMENT ON FUNCTION create_notification_for_special_assistance_response IS 'ينشئ إشعاراً عند الرد على طلب مساعدة خاصة';
COMMENT ON FUNCTION create_notification_for_family_approval IS 'ينشئ إشعاراً عند الموافقة على تسجيل الأسرة';
COMMENT ON FUNCTION create_notification_for_family_status IS 'ينشئ إشعاراً عند تغيير حالة الأسرة';
COMMENT ON FUNCTION cleanup_old_notifications IS 'يحذف الإشعارات المقروءة الأقدم من 90 يوماً';
