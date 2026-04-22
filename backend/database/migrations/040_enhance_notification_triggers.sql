-- Migration: Enhance Notification Triggers
-- Adds comprehensive notification coverage for all DP events
-- Includes: family-facing, staff-facing, and system maintenance notifications

-- ============================================
-- Part 1: Schema Updates
-- ============================================

-- Add priority column for notification urgency levels (Arabic values)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'عادي' 
CHECK (priority IN ('منخفض', 'عادي', 'عالي', 'عاجل جداً'));

-- Add channel column for notification delivery method (Arabic values)
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS channel VARCHAR(50) DEFAULT 'تطبيق' 
CHECK (channel IN ('تطبيق', 'رسالة_نصية', 'بريد_إلكتروني', 'إشعار_دفع'));

-- Add is_processed flag for queued notifications
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS is_processed BOOLEAN DEFAULT TRUE;

-- Update notification_type constraint to include new types (Arabic values)
-- Note: We need to drop and recreate the constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_notification_type_check;
ALTER TABLE notifications 
ADD CONSTRAINT notifications_notification_type_check 
CHECK (notification_type IN (
    -- Family-facing notifications (عائلة)
    'توزيع', 
    'توزيع_جاهز',
    'توزيع_تذكير',
    'حملة_حالة',
    'حملة_قرب_انتهاء',
    'شكوى_رد', 
    'انتقال_تحديث', 
    'مساعدة_خاصة_رد',
    'أسرة_موافقة',
    'أسرة_حالة',
    'بيانات_تحديث_مطلوب',
    'تأكيد_مطلوب',
    -- Staff-facing notifications (موظفين)
    'شكوى_جديدة',
    'طوارئ_بلاغ',
    'انتقال_طلب_جديد',
    'مساعدة_خاصة_طلب_جديد',
    'توزيع_حملة_جديدة',
    'مخزون_منخفض_تنبيه',
    'مخزون_جديد_وصل',
    'صلاحية_انتهاء_تنبيه',
    -- System notifications (نظام)
    'نظام', 
    'تحديث_تذكير',
    'أمني_تنبيه',
    'دخول_فاشل_تنبيه',
    'صيانة'
));

-- Add index for priority-based filtering
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);

-- Add index for channel-based filtering
CREATE INDEX IF NOT EXISTS idx_notifications_channel ON notifications(channel);

-- Add index for related_entity_type (was missing)
CREATE INDEX IF NOT EXISTS idx_notifications_related_entity_type ON notifications(related_entity_type);

-- Add composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_notifications_family_unread ON notifications(family_id, is_read) WHERE is_read = FALSE;

-- Add composite index for priority + created_at (for sorting)
CREATE INDEX IF NOT EXISTS idx_notifications_priority_created ON notifications(priority DESC, created_at DESC);

-- ============================================
-- Part 2: Helper Functions
-- ============================================

-- Function to check for recent duplicate notifications (deduplication)
CREATE OR REPLACE FUNCTION has_recent_notification(
    p_family_id UUID,
    p_notification_type VARCHAR(50),
    p_related_entity_id UUID,
    p_hours INTEGER DEFAULT 24
)
RETURNS BOOLEAN AS $$
DECLARE
    exists_flag BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM notifications
        WHERE family_id = p_family_id
        AND notification_type = p_notification_type
        AND related_entity_id = p_related_entity_id
        AND created_at > NOW() - (p_hours || ' hours')::INTERVAL
    ) INTO exists_flag;
    
    RETURN exists_flag;
END;
$$ LANGUAGE plpgsql;

-- Function to get camp managers for a given camp
CREATE OR REPLACE FUNCTION get_camp_managers(p_camp_id UUID)
RETURNS TABLE(user_id UUID, family_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.family_id
    FROM users u
    WHERE u.camp_id = p_camp_id
    AND u.role = 'CAMP_MANAGER'
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to get all camp staff (managers + field officers)
CREATE OR REPLACE FUNCTION get_camp_staff(p_camp_id UUID)
RETURNS TABLE(user_id UUID, family_id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.family_id
    FROM users u
    WHERE u.camp_id = p_camp_id
    AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
    AND u.is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Part 3: Family-Facing Notification Triggers
-- ============================================

-- --------------------------------------------
-- Helper Function: Get Family Full Name (4-part structure)
-- Returns the concatenated 4-part Arabic name or falls back to head_of_family_name
-- --------------------------------------------
CREATE OR REPLACE FUNCTION get_family_full_name(family_id_param UUID)
RETURNS TEXT AS $$
DECLARE
    full_name TEXT;
BEGIN
    SELECT 
      CASE 
        WHEN head_first_name IS NOT NULL AND head_father_name IS NOT NULL 
             AND head_grandfather_name IS NOT NULL AND head_family_name IS NOT NULL
        THEN TRIM(head_first_name || ' ' || head_father_name || ' ' || head_grandfather_name || ' ' || head_family_name)
        WHEN head_first_name IS NOT NULL AND head_father_name IS NOT NULL AND head_family_name IS NOT NULL
        THEN TRIM(head_first_name || ' ' || head_father_name || ' ' || head_family_name)
        WHEN head_first_name IS NOT NULL AND head_family_name IS NOT NULL
        THEN TRIM(head_first_name || ' ' || head_family_name)
        ELSE COALESCE(NULLIF(TRIM(head_of_family_name), ''), 'عزيزي المستفيد')
      END INTO full_name
    FROM families
    WHERE id = family_id_param;
    
    RETURN COALESCE(full_name, 'عزيزي المستفيد');
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- Trigger: New Aid Distribution Assigned (Ready for Pickup)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_notification_for_distribution_assigned()
RETURNS TRIGGER AS $$
DECLARE
    family_name VARCHAR(255);
    campaign_name VARCHAR(255);
BEGIN
    -- Get family name using 4-part structure helper function
    SELECT get_family_full_name(NEW.family_id) INTO family_name;
    
    -- Get campaign name if exists
    SELECT name INTO campaign_name FROM aid_campaigns WHERE id = NEW.campaign_id;
    
    -- Create notification for the assigned family
    INSERT INTO notifications (
        family_id, 
        notification_type, 
        priority,
        title, 
        message, 
        is_read, 
        related_entity_id, 
        related_entity_type
    )
    VALUES (
        NEW.family_id,
        'توزيع_جاهز',
        'عالي',
        'مساعدات جاهزة للاستلام',
        'أهلاً ' || COALESCE(family_name, 'عزيزي المستفيد') || '. المساعدات الخاصة بـ ' || 
        COALESCE(campaign_name, 'حملة التوزيع') || ' جاهزة للاستلام. يرجى المراجعة خلال الفترة المحددة.',
        FALSE,
        NEW.id,
        'توزيع_مساعدات'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_distribution_assigned ON aid_distributions;
CREATE TRIGGER notify_distribution_assigned
    AFTER INSERT ON aid_distributions
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_distribution_assigned();

-- --------------------------------------------
-- Trigger: Campaign Status Change
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_notification_for_campaign_status()
RETURNS TRIGGER AS $$
DECLARE
    family_rec RECORD;
    title_text VARCHAR(255);
    message_text TEXT;
    priority_val VARCHAR(20) := 'عادي';
BEGIN
    -- Only create notification for significant status changes
    IF OLD.status != NEW.status THEN
        -- Determine notification content based on new status
        CASE NEW.status
            WHEN 'نشطة' THEN
                title_text := 'بدأ التوزيع';
                message_text := 'بدأ توزيع مساعدات: ' || COALESCE(NEW.name, 'حملة التوزيع') || 
                               '. يرجى مراجعة موقع التوزيع.';
                priority_val := 'عالي';
            WHEN 'مكتملة' THEN
                title_text := 'انتهى التوزيع';
                message_text := 'انتهى توزيع مساعدات: ' || COALESCE(NEW.name, 'حملة التوزيع');
                priority_val := 'عادي';
            WHEN 'ملغاة' THEN
                title_text := 'إلغاء حملة التوزيع';
                message_text := 'تم إلغاء حملة التوزيع: ' || COALESCE(NEW.name, 'حملة التوزيع') || 
                               '. نعتذر عن الإزعاج.';
                priority_val := 'عاجل جداً';
            WHEN 'مخططة' THEN
                title_text := 'تأجيل حملة التوزيع';
                message_text := 'تم تأجيل حملة التوزيع: ' || COALESCE(NEW.name, 'حملة التوزيع') || 
                               ' إلى تاريخ لاحق.';
                priority_val := 'عادي';
            ELSE
                RETURN NEW;
        END CASE;
        
        -- Create notification for all families in the camp
        FOR family_rec IN (
            SELECT f.id, get_family_full_name(f.id) AS family_name
            FROM families f
            WHERE f.camp_id = NEW.camp_id
            AND f.status = 'موافق'
        ) LOOP
            -- Skip if recent duplicate exists
            IF NOT has_recent_notification(family_rec.id, 'حملة_حالة', NEW.id, 48) THEN
                INSERT INTO notifications (
                    family_id, 
                    notification_type, 
                    priority,
                    title, 
                    message, 
                    is_read, 
                    related_entity_id, 
                    related_entity_type
                )
                VALUES (
                    family_rec.id,
                    'حملة_حالة',
                    priority_val,
                    title_text,
                    message_text,
                    FALSE,
                    NEW.id,
                    'حملة_مساعدات'
                );
            END IF;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_campaign_status ON aid_campaigns;
CREATE TRIGGER notify_campaign_status
    AFTER UPDATE ON aid_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_campaign_status();

-- --------------------------------------------
-- Trigger: Distribution Reminder (OTP/Biometric Required)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_notification_for_verification_required()
RETURNS TRIGGER AS $$
BEGIN
    -- Only if OTP or biometric verification is set
    IF (NEW.otp_code IS NOT NULL OR NEW.received_by_biometric IS NOT NULL) 
    AND NEW.status = 'قيد الانتظار' THEN
        
        INSERT INTO notifications (
            family_id, 
            notification_type, 
            priority,
            title, 
            message, 
            is_read, 
            related_entity_id, 
            related_entity_type
        )
        VALUES (
            NEW.family_id,
            'تأكيد_مطلوب',
            'عالي',
            'مطلوب تأكيد استلام المساعدات',
            'يرجى إحضار رمز التحقق أو البصمة لاستلام مساعداتك.',
            FALSE,
            NEW.id,
            'توزيع_مساعدات'
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_verification_required ON aid_distributions;
CREATE TRIGGER notify_verification_required
    AFTER INSERT ON aid_distributions
    FOR EACH ROW
    EXECUTE FUNCTION create_notification_for_verification_required();

-- ============================================
-- Part 4: Staff-Facing Notification Triggers
-- ============================================

-- --------------------------------------------
-- Trigger: New Complaint Submitted
-- --------------------------------------------
CREATE OR REPLACE FUNCTION notify_staff_new_complaint()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
BEGIN
    -- Get camp managers for the family's camp
    FOR manager_rec IN (
        SELECT u.id, u.family_id, u.camp_id
        FROM users u
        INNER JOIN families f ON f.camp_id = u.camp_id
        WHERE f.id = NEW.family_id
        AND u.role = 'CAMP_MANAGER'
        AND u.is_active = TRUE
    ) LOOP
        INSERT INTO notifications (
            family_id, 
            notification_type, 
            priority,
            title, 
            message, 
            is_read, 
            related_entity_id, 
            related_entity_type
        )
        VALUES (
            manager_rec.family_id,
            'شكوى_جديدة',
            CASE 
                WHEN NEW.category = 'طوارئ' THEN 'عاجل جداً'
                ELSE 'عالي'
            END,
            'شكوى جديدة',
            'تم تقديم شكوى جديدة من أسرة في المخيم. الموضوع: ' || COALESCE(NEW.subject, 'بدون عنوان'),
            FALSE,
            NEW.id,
            'شكوى'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_staff_new_complaint ON complaints;
CREATE TRIGGER notify_staff_new_complaint
    AFTER INSERT ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION notify_staff_new_complaint();

-- --------------------------------------------
-- Trigger: New Emergency Report (Urgent)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION notify_staff_new_emergency()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
    urgency_level VARCHAR(20);
BEGIN
    -- Determine priority based on urgency
    CASE NEW.urgency
        WHEN 'عاجل جداً' THEN urgency_level := 'عاجل جداً';
        WHEN 'عاجل' THEN urgency_level := 'عالي';
        ELSE urgency_level := 'عادي';
    END CASE;
    
    -- Get all camp staff for immediate notification
    FOR manager_rec IN (
        SELECT u.id, u.family_id
        FROM users u
        INNER JOIN families f ON f.camp_id = u.camp_id
        WHERE f.id = NEW.family_id
        AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
        AND u.is_active = TRUE
    ) LOOP
        INSERT INTO notifications (
            family_id, 
            notification_type, 
            priority,
            channel,
            title, 
            message, 
            is_read, 
            related_entity_id, 
            related_entity_type
        )
        VALUES (
            manager_rec.family_id,
            'طوارئ_بلاغ',
            urgency_level,
            'رسالة_نصية', -- Emergency goes via SMS
            'بلاغ طوارئ جديد - ' || COALESCE(NEW.urgency, 'عادي'),
            'نوع الطارئ: ' || COALESCE(NEW.emergency_type, 'غير محدد') || 
            '. الموقع: ' || COALESCE(NEW.location, 'غير محدد') ||
            '. يرجى التدخل العاجل.',
            FALSE,
            NEW.id,
            'بلاغ_طوارئ'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_staff_new_emergency ON emergency_reports;
CREATE TRIGGER notify_staff_new_emergency
    AFTER INSERT ON emergency_reports
    FOR EACH ROW
    EXECUTE FUNCTION notify_staff_new_emergency();

-- --------------------------------------------
-- Trigger: New Transfer Request
-- --------------------------------------------
CREATE OR REPLACE FUNCTION notify_staff_new_transfer()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
BEGIN
    -- Notify managers from both camps
    FOR manager_rec IN (
        SELECT u.id, u.family_id
        FROM users u
        WHERE u.camp_id IN (NEW.from_camp_id, NEW.to_camp_id)
        AND u.role = 'CAMP_MANAGER'
        AND u.is_active = TRUE
    ) LOOP
        INSERT INTO notifications (
            family_id, 
            notification_type, 
            priority,
            title, 
            message, 
            is_read, 
            related_entity_id, 
            related_entity_type
        )
        VALUES (
            manager_rec.family_id,
            'انتقال_طلب_جديد',
            'عادي',
            'طلب انتقال جديد',
            'تم تقديم طلب انتقال جديد من: ' || COALESCE(NEW.dp_name, 'مستفيد') || 
            '. يرجى المراجعة والموافقة.',
            FALSE,
            NEW.id,
            'طلب_انتقال'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_staff_new_transfer ON transfer_requests;
CREATE TRIGGER notify_staff_new_transfer
    AFTER INSERT ON transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_staff_new_transfer();

-- --------------------------------------------
-- Trigger: New Special Assistance Request
-- --------------------------------------------
CREATE OR REPLACE FUNCTION notify_staff_new_special_assistance()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
    urgency_level VARCHAR(20);
BEGIN
    -- Determine priority based on urgency
    CASE NEW.urgency
        WHEN 'عاجل جداً' THEN urgency_level := 'عاجل جداً';
        WHEN 'عاجل' THEN urgency_level := 'عالي';
        ELSE urgency_level := 'عادي';
    END CASE;
    
    -- Get camp managers
    FOR manager_rec IN (
        SELECT u.id, u.family_id
        FROM users u
        INNER JOIN families f ON f.camp_id = u.camp_id
        WHERE f.id = NEW.family_id
        AND u.role = 'CAMP_MANAGER'
        AND u.is_active = TRUE
    ) LOOP
        INSERT INTO notifications (
            family_id, 
            notification_type, 
            priority,
            title, 
            message, 
            is_read, 
            related_entity_id, 
            related_entity_type
        )
        VALUES (
            manager_rec.family_id,
            'مساعدة_خاصة_طلب_جديد',
            urgency_level,
            'طلب مساعدة جديدة - ' || COALESCE(NEW.assistance_type, 'عام'),
            'تم تقديم طلب مساعدة جديدة من أسرة في المخيم. النوع: ' || 
            COALESCE(NEW.assistance_type, 'غير محدد') || 
            '. الأهمية: ' || COALESCE(NEW.urgency, 'عادي'),
            FALSE,
            NEW.id,
            'مساعدة_خاصة'
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_staff_new_special_assistance ON special_assistance_requests;
CREATE TRIGGER notify_staff_new_special_assistance
    AFTER INSERT ON special_assistance_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_staff_new_special_assistance();

-- ============================================
-- Part 5: System Maintenance Triggers
-- ============================================

-- --------------------------------------------
-- Function: Low Stock Alert (Called by backend or scheduled job)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_low_stock_notifications()
RETURNS VOID AS $$
DECLARE
    item_rec RECORD;
    manager_rec RECORD;
BEGIN
    -- Find items below minimum stock threshold
    FOR item_rec IN (
        SELECT i.*, c.name as camp_name
        FROM inventory_items i
        LEFT JOIN camps c ON c.id = i.camp_id
        WHERE i.is_active = TRUE
        AND i.quantity_available <= i.min_stock
        AND i.quantity_available > 0
    ) LOOP
        -- Get camp managers
        FOR manager_rec IN (
            SELECT u.id, u.family_id
            FROM users u
            WHERE u.camp_id = item_rec.camp_id
            AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
            AND u.is_active = TRUE
        ) LOOP
            -- Skip if recent alert exists
            IF NOT has_recent_notification(manager_rec.family_id, 'مخزون_منخفض_تنبيه', item_rec.id, 24) THEN
                INSERT INTO notifications (
                    family_id, 
                    notification_type, 
                    priority,
                    title, 
                    message, 
                    is_read, 
                    related_entity_id, 
                    related_entity_type
                )
                VALUES (
                    manager_rec.family_id,
                    'مخزون_منخفض_تنبيه',
                    'عالي',
                    'تنبيه: مخزون منخفض',
                    'الصنف "' || item_rec.name || '" في مخيم ' || 
                    COALESCE(item_rec.camp_name, 'الرئيسي') || 
                    ' وصل إلى الحد الأدنى. الكمية المتبقية: ' || 
                    item_rec.quantity_available || ' ' || item_rec.unit,
                    FALSE,
                    item_rec.id,
                    'صنف_مخزون'
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- Function: Expiry Warning (Called by backend or scheduled job)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_expiry_warning_notifications(p_days_ahead INTEGER DEFAULT 7)
RETURNS VOID AS $$
DECLARE
    item_rec RECORD;
    manager_rec RECORD;
    days_until_expiry INTEGER;
BEGIN
    -- Find items expiring soon
    FOR item_rec IN (
        SELECT i.*, c.name as camp_name,
               (i.expiry_date - CURRENT_DATE) as days_left
        FROM inventory_items i
        LEFT JOIN camps c ON c.id = i.camp_id
        WHERE i.is_active = TRUE
        AND i.expiry_date IS NOT NULL
        AND i.expiry_date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
        AND i.expiry_date >= CURRENT_DATE
    ) LOOP
        days_until_expiry := item_rec.days_left;
        
        -- Get camp managers
        FOR manager_rec IN (
            SELECT u.id, u.family_id
            FROM users u
            WHERE u.camp_id = item_rec.camp_id
            AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
            AND u.is_active = TRUE
        ) LOOP
            -- Skip if recent alert exists
            IF NOT has_recent_notification(manager_rec.family_id, 'صلاحية_انتهاء_تنبيه', item_rec.id, 48) THEN
                INSERT INTO notifications (
                    family_id, 
                    notification_type, 
                    priority,
                    title, 
                    message, 
                    is_read, 
                    related_entity_id, 
                    related_entity_type
                )
                VALUES (
                    manager_rec.family_id,
                    'صلاحية_انتهاء_تنبيه',
                    CASE 
                        WHEN days_until_expiry <= 2 THEN 'عاجل جداً'
                        WHEN days_until_expiry <= 5 THEN 'عالي'
                        ELSE 'عادي'
                    END,
                    'تنبيه: انتهاء صلاحية قريبة',
                    'الصنف "' || item_rec.name || '" في مخيم ' || 
                    COALESCE(item_rec.camp_name, 'الرئيسي') || 
                    ' تنتهي صلاحيته خلال ' || days_until_expiry || ' يوم. ' ||
                    'تاريخ الانتهاء: ' || item_rec.expiry_date,
                    FALSE,
                    item_rec.id,
                    'صنف_مخزون'
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- Function: Campaign Ending Soon Reminder (Called by scheduled job)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_campaign_ending_soon_notifications(p_days_ahead INTEGER DEFAULT 2)
RETURNS VOID AS $$
DECLARE
    campaign_rec RECORD;
    family_rec RECORD;
BEGIN
    -- Find campaigns ending soon
    FOR campaign_rec IN (
        SELECT *
        FROM aid_campaigns
        WHERE status = 'نشطة'
        AND end_date IS NOT NULL
        AND end_date <= CURRENT_DATE + (p_days_ahead || ' days')::INTERVAL
        AND end_date >= CURRENT_DATE
    ) LOOP
        -- Notify families in the camp
        FOR family_rec IN (
            SELECT f.id, get_family_full_name(f.id) AS family_name
            FROM families f
            WHERE f.camp_id = campaign_rec.camp_id
            AND f.status = 'موافق'
        ) LOOP
            -- Skip if recent notification exists
            IF NOT has_recent_notification(family_rec.id, 'حملة_قرب_انتهاء', campaign_rec.id, 48) THEN
                INSERT INTO notifications (
                    family_id, 
                    notification_type, 
                    priority,
                    title, 
                    message, 
                    is_read, 
                    related_entity_id, 
                    related_entity_type
                )
                VALUES (
                    family_rec.id,
                    'حملة_قرب_انتهاء',
                    'عالي',
                    'تذكير: انتهاء حملة التوزيع قريباً',
                    'حملة التوزيع "' || COALESCE(campaign_rec.name, 'حملة التوزيع') || 
                    '" تنتهي خلال ' || p_days_ahead || ' أيام. ' ||
                    'يرجى مراجعة موقع التوزيع قبل الإغلاق.',
                    FALSE,
                    campaign_rec.id,
                    'حملة_مساعدات'
                );
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- Function: Failed Login Alert (Called by authentication system)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION create_failed_login_alert(p_username VARCHAR(255), p_ip_address INET, p_attempt_count INTEGER)
RETURNS VOID AS $$
DECLARE
    admin_rec RECORD;
BEGIN
    -- Only alert if threshold reached (e.g., 5 attempts)
    IF p_attempt_count >= 5 THEN
        -- Get all admin users
        FOR admin_rec IN (
            SELECT u.id, u.family_id
            FROM users u
            WHERE u.role IN ('SYSTEM_ADMIN', 'CAMP_MANAGER')
            AND u.is_active = TRUE
        ) LOOP
            INSERT INTO notifications (
                family_id, 
                notification_type, 
                priority,
                channel,
                title, 
                message, 
                is_read, 
                related_entity_id, 
                related_entity_type
            )
            VALUES (
                admin_rec.family_id,
                'دخول_فاشل_تنبيه',
                'عالي',
                'تطبيق',
                'تنبيه أمني: محاولات دخول فاشلة',
                'تم رصد ' || p_attempt_count || ' محاولات دخول فاشلة للحساب: ' || 
                COALESCE(p_username, 'غير معروف') || 
                ' من العنوان IP: ' || COALESCE(p_ip_address::TEXT, 'غير معروف'),
                FALSE,
                NULL,
                'أمن'
            );
        END LOOP;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- --------------------------------------------
-- Function: New Inventory Received (Called by backend)
-- --------------------------------------------
CREATE OR REPLACE FUNCTION notify_new_inventory_received()
RETURNS TRIGGER AS $$
DECLARE
    manager_rec RECORD;
BEGIN
    -- Only on initial creation (quantity was 0 or item is new)
    IF NEW.quantity_available > 0 AND (TG_OP = 'INSERT' OR 
        (OLD.quantity_available = 0 AND NEW.quantity_available > 0)) THEN
        
        -- Get camp managers
        FOR manager_rec IN (
            SELECT u.id, u.family_id
            FROM users u
            WHERE u.camp_id = NEW.camp_id
            AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER')
            AND u.is_active = TRUE
        ) LOOP
            INSERT INTO notifications (
                family_id, 
                notification_type, 
                priority,
                title, 
                message, 
                is_read, 
                related_entity_id, 
                related_entity_type
            )
            VALUES (
                manager_rec.family_id,
                'مخزون_جديد_وصل',
                'عادي',
                'وصل مخزون جديد',
                'تم استلام صنف جديد: "' || NEW.name || '" (' || 
                NEW.quantity_available || ' ' || NEW.unit || ')',
                FALSE,
                NEW.id,
                'صنف_مخزون'
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_new_inventory_received ON inventory_items;
CREATE TRIGGER notify_new_inventory_received
    AFTER INSERT ON inventory_items
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_inventory_received();

-- ============================================
-- Part 6: Updated Cleanup Function
-- ============================================

CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS VOID AS $$
BEGIN
    -- Delete read notifications older than 90 days (normal priority)
    DELETE FROM notifications
    WHERE is_read = TRUE
    AND priority = 'عادي'
    AND created_at < NOW() - INTERVAL '90 days';
    
    -- Delete read notifications older than 180 days (high priority)
    DELETE FROM notifications
    WHERE is_read = TRUE
    AND priority = 'عالي'
    AND created_at < NOW() - INTERVAL '180 days';
    
    -- Delete read notifications older than 365 days (low priority)
    DELETE FROM notifications
    WHERE is_read = TRUE
    AND priority = 'منخفض'
    AND created_at < NOW() - INTERVAL '365 days';
    
    -- Keep urgent notifications for 1 year regardless of read status
    DELETE FROM notifications
    WHERE is_read = TRUE
    AND priority = 'عاجل جداً'
    AND created_at < NOW() - INTERVAL '365 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Part 7: Comments and Documentation
-- ============================================

COMMENT ON FUNCTION has_recent_notification IS 'يتحقق مما إذا تم إنشاء إشعار مماثل مؤخراً (لمنع التكرار)';
COMMENT ON FUNCTION get_camp_managers IS 'يعيد جميع مديري المخيم لمخيم معين';
COMMENT ON FUNCTION get_camp_staff IS 'يعيد جميع موظفي المخيم (مديرين + متطوعين) لمخيم معين';
COMMENT ON FUNCTION create_notification_for_distribution_assigned IS 'يخطر العائلة عندما تكون توزيع المساعدات جاهز للاستلام';
COMMENT ON FUNCTION create_notification_for_campaign_status IS 'يخطر العائلات عند تغيير حالة الحملة (بدأ، اكتمل، ألغي، أرجئ)';
COMMENT ON FUNCTION create_notification_for_verification_required IS 'يخطر العائلة عندما يكون مطلوباً تأكيد OTP/بصمة';
COMMENT ON FUNCTION notify_staff_new_complaint IS 'يخطر مديري المخيم عند تقديم شكوى جديدة';
COMMENT ON FUNCTION notify_staff_new_emergency IS 'يخطر موظفي المخيم فوراً عند تقديم بلاغ طوارئ (عبر رسالة نصية)';
COMMENT ON FUNCTION notify_staff_new_transfer IS 'يخطر مديري المخيمين عند تقديم طلب انتقال';
COMMENT ON FUNCTION notify_staff_new_special_assistance IS 'يخطر مديري المخيم عند تقديم طلب مساعدة خاصة (الأولوية حسب الأهمية)';
COMMENT ON FUNCTION create_low_stock_notifications IS 'ينشئ تنبيهات للأصناف التي وصلت للحد الأدنى (يُستدعى من مهمة مجدولة)';
COMMENT ON FUNCTION create_expiry_warning_notifications IS 'ينشئ تنبيهات للأصناف التي تقترب من الانتهاء (يُستدعى من مهمة مجدولة)';
COMMENT ON FUNCTION create_campaign_ending_soon_notifications IS 'يذكر العائلات عندما تنتهي الحملة قريباً (يُستدعى من مهمة مجدولة)';
COMMENT ON FUNCTION create_failed_login_alert IS 'يخطر المديرين من نشاط دخول مشبوه (يُستدعى من نظام المصادقة)';
COMMENT ON FUNCTION notify_new_inventory_received IS 'يخطر المديرين عند استلام مخزون جديد';
COMMENT ON FUNCTION cleanup_old_notifications IS 'يحذف الإشعارات المقروءة القديمة حسب الأولوية (90 يوم عادي، 180 عالي، 365 منخفض/عاجل جداً)';

-- ============================================
-- Part 8: Usage Examples (as comments)
-- ============================================

-- Run low stock alerts (e.g., daily cron job):
-- SELECT create_low_stock_notifications();

-- Run expiry warnings (e.g., daily cron job):
-- SELECT create_expiry_warning_notifications(7); -- 7 days ahead

-- Run campaign ending reminders (e.g., daily cron job):
-- SELECT create_campaign_ending_soon_notifications(2); -- 2 days ahead

-- Call failed login alert from backend authentication:
-- SELECT create_failed_login_alert('username', '192.168.1.1'::INET, 5);

-- ============================================
-- Migration Info
-- ============================================
-- This migration enhances the notification system with:
-- 1. New columns: priority (عربي), channel (عربي), is_processed
-- 2. New notification types for comprehensive coverage (Arabic values)
-- 3. Family-facing: توزيع_جاهز, حملة_حالة, تأكيد_مطلوب
-- 4. Staff-facing: شكوى_جديدة, طوارئ_بلاغ, انتقال_طلب_جديد, مساعدة_خاصة_طلب_جديد, مخزون_منخفض_تنبيه, مخزون_جديد_وصل
-- 5. System: صلاحية_انتهاء_تنبيه, حملة_قرب_انتهاء, دخول_فاشل_تنبيه
-- 6. Helper functions for deduplication and staff lookup
-- 7. Enhanced cleanup based on priority (Arabic values)
