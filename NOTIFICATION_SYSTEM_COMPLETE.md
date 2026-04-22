# نظام الإشعارات - Notification System

## نظرة عامة | Overview

نظام إشعارات شامل يغطي جميع الأحداث في نظام إدارة المخيمات، مع دعم كامل للغة العربية.

A comprehensive notification system covering all events in the camp management system, with full Arabic language support.

---

## هيكلية قاعدة البيانات | Database Schema

### جدول الإشعارات | Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    family_id UUID REFERENCES families(id),
    notification_type VARCHAR(50) NOT NULL,  -- أنواع عربية
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    priority VARCHAR(20) DEFAULT 'عادي',     -- منخفض، عادي، عالي، عاجل جداً
    channel VARCHAR(50) DEFAULT 'تطبيق',     -- تطبيق، رسالة_نصية، بريد_إلكتروني، إشعار_دفع
    is_processed BOOLEAN DEFAULT TRUE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### أولويات الإشعارات | Priority Levels

| الأولوية | Priority | الاستخدام | Usage |
|---------|----------|----------|-------|
| منخفض | Low | تذكيرات روتينية | Routine reminders |
| عادي | Normal | إشعارات عادية | Normal notifications |
| عالي | High | أحداث مهمة | Important events |
| عاجل جداً | Urgent | طوارئ، أحداث حرجة | Emergencies, critical events |

### قنوات الإشعارات | Notification Channels

| القناة | Channel | الاستخدام | Usage |
|-------|---------|----------|-------|
| تطبيق | In-App | جميع الإشعارات | All notifications |
| رسالة_نصية | SMS | طوارئ، أحداث عاجلة | Emergencies, urgent events |
| بريد_إلكتروني | Email | إشعارات رسمية | Formal notifications |
| إشعار_دفع | Push | إشعارات فورية | Instant notifications |

---

## أنواع الإشعارات | Notification Types

### 1. إشعارات موجهة للعائلات | Family-Facing Notifications

| النوع | Type | الوصف | Description | المصدر | Source |
|------|------|------|----------|--------|--------|
| `توزيع` | Distribution | توزيع مساعدات جديد | New aid distribution | aid_campaigns (INSERT) |
| `توزيع_جاهز` | Distribution Assigned | مساعدات جاهزة للاستلام | Aid ready for pickup | aid_distributions (INSERT) |
| `توزيع_تذكير` | Distribution Reminder | تذكير بالتوزيع | Distribution reminder | aid_distributions (UPDATE) |
| `حملة_حالة` | Campaign Status | تغيير حالة الحملة | Campaign status change | aid_campaigns (UPDATE) |
| `حملة_قرب_انتهاء` | Campaign Ending Soon | حملة تنتهي قريباً | Campaign ending soon | Scheduled job |
| `شكوى_رد` | Complaint Response | رد على شكوى | Complaint response | complaints (UPDATE) |
| `انتقال_تحديث` | Transfer Update | تحديث طلب الانتقال | Transfer request update | transfer_requests (UPDATE) |
| `مساعدة_خاصة_رد` | Special Assistance Response | رد على مساعدة خاصة | Special assistance response | special_assistance_requests (UPDATE) |
| `أسرة_موافقة` | Family Approval | موافقة على تسجيل الأسرة | Family registration approved | families (UPDATE) |
| `أسرة_حالة` | Family Status | تغيير حالة الأسرة | Family status change | families (UPDATE) |
| `بيانات_تحديث_مطلوب` | Data Update Required | مطلوب تحديث البيانات | Data update required | Scheduled job |
| `تأكيد_مطلوب` | Verification Required | مطلوب تأكيد (OTP/بصمة) | Verification required (OTP/Biometric) | aid_distributions (INSERT) |

### 2. إشعارات موجهة للموظفين | Staff-Facing Notifications

| النوع | Type | الوصف | Description | المصدر | Source |
|------|------|------|----------|--------|--------|
| `شكوى_جديدة` | New Complaint | شكوى جديدة | New complaint submitted | complaints (INSERT) |
| `طوارئ_بلاغ` | Emergency Report | بلاغ طوارئ جديد | New emergency report | emergency_reports (INSERT) |
| `انتقال_طلب_جديد` | New Transfer Request | طلب انتقال جديد | New transfer request | transfer_requests (INSERT) |
| `مساعدة_خاصة_طلب_جديد` | New Special Assistance | طلب مساعدة خاصة جديد | New special assistance request | special_assistance_requests (INSERT) |
| `توزيع_حملة_جديدة` | New Distribution Campaign | حملة توزيع جديدة | New distribution campaign | aid_campaigns (INSERT) |
| `مخزون_منخفض_تنبيه` | Low Stock Alert | تنبيه مخزون منخفض | Low stock alert | Scheduled job |
| `مخزون_جديد_وصل` | New Inventory Received | وصول مخزون جديد | New inventory received | inventory_items (INSERT) |
| `صلاحية_انتهاء_تنبيه` | Expiry Warning | تنبيه انتهاء صلاحية | Expiry date warning | Scheduled job |

### 3. إشعارات النظام | System Notifications

| النوع | Type | الوصف | Description | المصدر | Source |
|------|------|------|----------|--------|--------|
| `نظام` | System | إشعارات عامة | General notifications | Various |
| `تحديث_تذكير` | Update Reminder | تذكير بتحديث البيانات | Data update reminder | Scheduled job |
| `أمني_تنبيه` | Security Alert | تنبيه أمني | Security alert | Security system |
| `دخول_فاشل_تنبيه` | Failed Login Alert | محاولات دخول فاشلة | Failed login attempts | Authentication |
| `صيانة` | Maintenance | إشعارات صيانة | Maintenance notifications | System |

---

## المشغلات (Triggers) | Database Triggers

###Migration 039: الإشعارات الأساسية | Base Notifications

```
📦 backend/database/migrations/039_add_notification_triggers.sql
```

#### المشغلات المتوفرة | Available Triggers:

1. **notify_new_distribution** - عند إنشاء حملة توزيع جديدة
2. **notify_distribution_status** - عند اكتمال التوزيع
3. **notify_complaint_response** - عند الرد على شكوى
4. **notify_emergency_response** - عند تحديث بلاغ طوارئ
5. **notify_transfer_update** - عند تحديث طلب الانتقال ⚠️ **تم الإصلاح: استخدام NEW.dp_id مباشرة**
6. **notify_special_assistance_response** - عند الرد على مساعدة خاصة
7. **notify_family_approval** - عند موافقة على أسرة
8. **notify_family_status** - عند تغيير حالة أسرة

### Migration 040: إشعارات محسنة | Enhanced Notifications

```
📦 backend/database/migrations/040_enhance_notification_triggers.sql
```

#### مشغلات إضافية | Additional Triggers:

**للعائلات | For Families:**
- `notify_distribution_assigned` - مساعدات جاهزة للاستلام
- `notify_campaign_status` - تغيير حالة الحملة
- `notify_verification_required` - مطلوب تأكيد OTP/بصمة

**للموظفين | For Staff:**
- `notify_staff_new_complaint` - شكوى جديدة
- `notify_staff_new_emergency` - بلاغ طوارئ (عبر SMS)
- `notify_staff_new_transfer` - طلب انتقال جديد
- `notify_staff_new_special_assistance` - طلب مساعدة خاصة

**صيانة النظام | System Maintenance:**
- `create_low_stock_notifications()` - مخزون منخفض
- `create_expiry_warning_notifications()` - انتهاء صلاحية
- `create_campaign_ending_soon_notifications()` - حملة تنتهي قريباً
- `create_failed_login_alert()` - محاولات دخول فاشلة
- `notify_new_inventory_received` - وصول مخزون جديد

---

## دوال مساعدة | Helper Functions

### 1. منع التكرار | Deduplication

```sql
-- التحقق من وجود إشعار مماثل مؤخراً
SELECT has_recent_notification(
    p_family_id := '...',
    p_notification_type := 'حملة_حالة',
    p_related_entity_id := '...',
    p_hours := 24  -- خلال 24 ساعة
);
```

### 2. البحث عن موظفي المخيم | Find Camp Staff

```sql
-- الحصول على مديري المخيم
SELECT * FROM get_camp_managers(p_camp_id := '...');

-- الحصول على جميع موظفي المخيم
SELECT * FROM get_camp_staff(p_camp_id := '...');
```

---

## مهام مجدولة | Scheduled Jobs

### تشغيل يومي | Daily Execution

```sql
-- 1. تنبيهات المخزون المنخفض
SELECT create_low_stock_notifications();

-- 2. تنبيهات انتهاء الصلاحية (خلال 7 أيام)
SELECT create_expiry_warning_notifications(7);

-- 3. تذكير الحملات المنتهية قريباً (خلال يومين)
SELECT create_campaign_ending_soon_notifications(2);
```

### عند حدوث حدث | On Event

```sql
-- تنبيه محاولات الدخول الفاشلة (من نظام المصادقة)
SELECT create_failed_login_alert(
    p_username := 'user@example.com',
    p_ip_address := '192.168.1.1'::INET,
    p_attempt_count := 5
);
```

---

## تنظيف الإشعارات | Notification Cleanup

### دالة التنظيف | Cleanup Function

```sql
-- حذف الإشعارات القديمة المقروءة
SELECT cleanup_old_notifications();
```

### سياسة الاحتفاظ | Retention Policy

| الأولوية | المدة | Priority | Duration |
|---------|------|----------|----------|
| منخفض | 365 يوم | Low | 365 days |
| عادي | 90 يوم | Normal | 90 days |
| عالي | 180 يوم | High | 180 days |
| عاجل جداً | 365 يوم | Urgent | 365 days |

---

## فهرس قواعد البيانات | Database Indexes

```sql
-- فهارس أساسية
CREATE INDEX idx_notifications_family_id ON notifications(family_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
CREATE INDEX idx_notifications_type ON notifications(notification_type);

-- فهارس محسنة
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_channel ON notifications(channel);
CREATE INDEX idx_notifications_related_entity_type ON notifications(related_entity_type);
CREATE INDEX idx_notifications_family_unread ON notifications(family_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_priority_created ON notifications(priority DESC, created_at DESC);
```

---

## تسلسل الترحيل | Migration Sequence

```
1. 038_add_special_assistance_and_notifications.sql  ← إنشاء الجدول
   ↓
2. 039_add_notification_triggers.sql                 ← المشغلات الأساسية
   ↓
3. 040_enhance_notification_triggers.sql             ← مشغلات محسنة + أعمدة إضافية
```

### تشغيل الترحيلات | Run Migrations

```bash
# 1. إنشاء جدول الإشعارات
psql -f backend/database/migrations/038_add_special_assistance_and_notifications.sql

# 2. إضافة المشغلات الأساسية
psql -f backend/database/migrations/039_add_notification_triggers.sql

# 3. إضافة المشغلات المحسنة
psql -f backend/database/migrations/040_enhance_notification_triggers.sql
```

---

## أمثلة الاستخدام | Usage Examples

### 1. إشعار عائلة بتوزيع جديد

```sql
-- تلقائي عبر Trigger عند INSERT على aid_campaigns
INSERT INTO aid_campaigns (name, camp_id, aid_type, ...)
VALUES ('حملة الشتاء', '...', 'مساعدات غذائية', ...);
```

### 2. إشعار موظف بشكوى جديدة

```sql
-- تلقائي عبر Trigger عند INSERT على complaints
INSERT INTO complaints (family_id, subject, description, ...)
VALUES ('...', 'شكوى مهمة', 'التفاصيل...', ...);
```

### 3. تنبيه مخزون منخفض (يدوي)

```sql
-- تشغيل يدوي أو عبر مهمة مجدولة
SELECT create_low_stock_notifications();
-- النتيجة: إشعارات لمديري المخيم للأصناف التي وصلت للحد الأدنى
```

### 4.查询未读通知

```sql
-- الحصول على إشعارات غير مقروءة لعائلة
SELECT 
    id,
    notification_type,
    title,
    message,
    priority,
    created_at
FROM notifications
WHERE family_id = '...'
AND is_read = FALSE
ORDER BY priority DESC, created_at DESC;
```

### 5. تعليم إشعار كمقروء

```sql
UPDATE notifications
SET 
    is_read = TRUE,
    read_at = NOW()
WHERE id = '...'
AND family_id = '...';
```

---

## أفضل الممارسات | Best Practices

### 1. منع التكرار | Prevent Duplication

```sql
-- استخدم has_recent_notification() لمنع الإشعارات المتكررة
IF NOT has_recent_notification(family_id, 'حملة_حالة', campaign_id, 48) THEN
    INSERT INTO notifications ...
END IF;
```

### 2. تحديد الأولويات | Set Priorities

```sql
-- طوارئ = عاجل جداً
-- أحداث مهمة = عالي
-- إشعارات عادية = عادي
-- تذكيرات = منخفض
INSERT INTO notifications (..., priority)
VALUES (..., 'عالي');
```

### 3. اختيار القناة المناسبة | Choose Appropriate Channel

```sql
-- طوارئ → رسالة_نصية
-- إشعارات رسمية → بريد_إلكتروني
-- إشعارات فورية → إشعار_دفع
-- افتراضي → تطبيق
INSERT INTO notifications (..., channel)
VALUES (..., 'رسالة_نصية');
```

### 4. أدوار المستخدمين | User Roles

The system uses **English role values** in the database:

| الدور | Role | الوصف | Description |
|------|------|------|----------|
| مدير النظام | `SYSTEM_ADMIN` | مدير عام للنظام | System administrator |
| مدير المخيم | `CAMP_MANAGER` | يدير مخيم معين | Manages a specific camp |
| موظف ميداني | `FIELD_OFFICER` | موظف في المخيم | Field officer in the camp |
| مستفيد | `BENEFICIARY` | أسرة مستفيدة | Beneficiary family |
| مراقب مانح | `DONOR_OBSERVER` | مراقب من جهة مانحة | Donor organization observer |

```sql
-- مثال: الحصول على جميع مديري المخيمات
SELECT * FROM users WHERE role = 'CAMP_MANAGER';

-- مثال: الحصول على موظفي مخيم معين
SELECT * FROM users WHERE camp_id = '...' 
AND role IN ('CAMP_MANAGER', 'FIELD_OFFICER');
```

### 5. تنظيف دوري | Regular Cleanup

```sql
-- تشغيل أسبوعي
SELECT cleanup_old_notifications();
```

### 6. استكشاف الأخطاء | Troubleshooting

### مشكلة: إشعارات مكررة

**الحل:** استخدم `has_recent_notification()` للتحقق من التكرار

### مشكلة: إشعارات لا تصل للموظفين

**الحل:** تأكد من:
1. وجود مستخدمين برول `'CAMP_MANAGER'` أو `'FIELD_OFFICER'` في المخيم
2. `u.is_active = TRUE`
3. ربط العائلة بالمخيم الصحيح

```sql
-- تحقق من وجود موظفين في المخيم
SELECT u.email, u.role, u.is_active
FROM users u
WHERE u.camp_id = '...'
AND u.role IN ('CAMP_MANAGER', 'FIELD_OFFICER');
```

### مشكلة: تنبيهات المخزون لا تعمل

**الحل:** 
```sql
-- تحقق من وجود أصناف تحت الحد الأدنى
SELECT name, quantity_available, min_stock
FROM inventory_items
WHERE quantity_available <= min_stock
AND is_active = TRUE;

-- شغّل الدالة يدوياً
SELECT create_low_stock_notifications();
```

---

## المراجع | References

- [Migration 038](../migrations/038_add_special_assistance_and_notifications.sql) - إنشاء الجدول
- [Migration 039](../migrations/039_add_notification_triggers.sql) - المشغلات الأساسية
- [Migration 040](../migrations/040_enhance_notification_triggers.sql) - المشغلات المحسنة
- [Schema](../database_schema_unified.sql) - هيكل قاعدة البيانات الموحد

---

**آخر تحديث:** 2026-03-16
**الإصدار:** 1.0
