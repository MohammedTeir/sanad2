# نظام الإشعارات - Notification System Documentation

## نظرة عامة

نظام الإشعارات في منصة إدارة المخيمات يقوم بإرسال إشعارات تلقائية للمستفيدين بناءً على أحداث مختلفة في النظام.

---

## 📊 هيكلية جدول الإشعارات

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    family_id UUID REFERENCES families(id),
    notification_type VARCHAR(50),
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_id UUID,
    related_entity_type VARCHAR(50),
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### الحقول:

| الحقل | النوع | الوصف |
|------|------|------|
| `id` | UUID | المعرف الفريد للإشعار |
| `family_id` | UUID | معرف الأسرة المستلمة |
| `notification_type` | VARCHAR | نوع الإشعار (distribution, complaint_response, etc.) |
| `title` | VARCHAR | عنوان الإشعار |
| `message` | TEXT | نص الإشعار الكامل |
| `is_read` | BOOLEAN | حالة القراءة |
| `related_entity_id` | UUID | معرف الكيان المرتبط (الشكوى، الطلب، إلخ) |
| `related_entity_type` | VARCHAR | نوع الكيان المرتبط |
| `read_at` | TIMESTAMP | وقت قراءة الإشعار |
| `created_at` | TIMESTAMP | وقت إنشاء الإشعار |

---

## 🔔 أنواع الإشعارات

### 1. **توزيع (distribution)**
- **الحدث:** إطلاق حملة توزيع جديدة
- **المستلمون:** جميع الأسر الموافقة في المخيم
- **المحتوى:** اسم الحملة، نوع المساعدة، التاريخ

### 2. **رد على شكوى (complaint_response)**
- **الحدث:** إضافة رد على شكوى أو تغيير الحالة
- **المستلمون:** الأسرة صاحبة الشكوى
- **المحتوى:** موضوع الشكوى، حالة الرد

### 3. **تحديث انتقال (transfer_update)**
- **الحدث:** تغيير حالة طلب الانتقال
- **المستلمون:** الأسرة طالبة الانتقال
- **المحتوى:** الحالة الجديدة (موافق، مرفوض، تمت المعالجة)

### 4. **نظام (system)**
- **الأحداث:**
  - طلب مساعدة جديدة (للإدارة)
  - رد على طلب مساعدة
  - قبول تسجيل الأسرة
  - إشعارات عامة
- **المستلمون:** حسب الحدث
- **المحتوى:** تفاصيل الحدث

### 5. **تذكير تحديث (update_reminder)**
- **الحدث:** تذكير بتحديث البيانات
- **المستلمون:** الأسر المسجلة
- **المحتوى:** نوع التحديث المطلوب

---

## ⚙️ الزنادات التلقائية (Database Triggers)

### 1. **إشعار عند إطلاق حملة توزيع**
```sql
TRIGGER: notify_new_distribution
TABLE: aid_campaigns
EVENT: AFTER INSERT
```
**الوظيفة:**
- ينشئ إشعاراً لجميع الأسر الموافقة في المخيم
- يحتوي على اسم الحملة ونوع المساعدة

---

### 2. **إشعار عند الرد على شكوى**
```sql
TRIGGER: notify_complaint_response
TABLE: complaints
EVENT: AFTER UPDATE
```
**الوظيفة:**
- ينشئ إشعاراً عند إضافة رد أو تغيير الحالة
- فقط عند إضافة رد فعلي أو تغيير الحالة إلى "تم الرد" أو "مغلق"

---

### 3. **إشعار عند تحديث طلب الانتقال**
```sql
TRIGGER: notify_transfer_update
TABLE: transfer_requests
EVENT: AFTER UPDATE
```
**الوظيفة:**
- ينشئ إشعاراً عند تغيير حالة طلب الانتقال
- يوضح الحالة الجديدة (موافق، مرفوض، تمت المعالجة)

---

### 4. **إشعار عند الرد على طلب المساعدة**
```sql
TRIGGER: notify_special_assistance_response
TABLE: special_assistance_requests
EVENT: AFTER UPDATE
```
**الوظيفة:**
- ينشئ إشعاراً عند إضافة رد أو تغيير الحالة
- فقط عند الموافقة، الرفض، أو التنفيذ

---

### 5. **إشعار عند قبول الأسرة**
```sql
TRIGGER: notify_family_approval
TABLE: families
EVENT: AFTER UPDATE
```
**الوظيفة:**
- ينشئ إشعاراً عند تغيير حالة الأسرة إلى "موافق"
- يؤكد قبول التسجيل

---

## 📝 الإنشاء اليدوي للإشعارات

### من Backend Routes:

```javascript
// مثال: إنشاء إشعار عند تقديم طلب مساعدة
await supabase.from('notifications').insert([{
    family_id: familyId,
    notification_type: 'system',
    title: 'طلب مساعدة جديدة',
    message: `تم تقديم طلب مساعدة ${assistance_type} من الأسرة`,
    is_read: false,
    related_entity_id: newRequest.id,
    related_entity_type: 'special_assistance'
}]);
```

### من Frontend:
```typescript
// لا ينشئ frontend الإشعارات مباشرة
// يتم عبر API calls للـ backend
```

---

## 🎯 أحداث إنشاء الإشعارات

| الحدث | المصدر | النوع | المستلم |
|------|--------|------|---------|
| حملة توزيع جديدة | `aid_campaigns` INSERT | distribution | جميع الأسر |
| رد على شكوى | `complaints` UPDATE | complaint_response | الأسرة |
| تحديث الانتقال | `transfer_requests` UPDATE | transfer_update | الأسرة |
| طلب مساعدة جديد | `special_assistance` INSERT | system | الإدارة |
| رد على طلب المساعدة | `special_assistance` UPDATE | system | الأسرة |
| قبول الأسرة | `families` UPDATE | system | الأسرة |

---

## 📱 قراءة الإشعارات

### من DP Portal:

1. **علامة الإشعارات** في شريط التنقل
2. **قائمة الإشعارات** مرتبة حسب التاريخ
3. **تحديد كمقروء** فردي أو جماعي
4. **تمييز بصري** للإشعارات غير المقروءة

### API Endpoints:

```
GET    /api/dp/notifications          - جلب جميع الإشعارات
POST   /api/dp/notifications/:id/read - تحديد إشعار كمقروء
POST   /api/dp/notifications/mark-all-read - تحديد الكل كمقروء
```

---

## 🧹 الصيانة الدورية

### تنظيف الإشعارات القديمة:
```sql
-- حذف الإشعارات المقروءة الأقدم من 90 يوم
DELETE FROM notifications
WHERE is_read = TRUE
AND created_at < NOW() - INTERVAL '90 days';
```

**ملاحظة:** يمكن جدولة هذه العملية بشكل دوري.

---

## 🔐 الأمان والصلاحيات

### Row Level Security (RLS):

```sql
-- المستخدمون يرون إشعاراتهم فقط
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

-- المستخدمون يحدّثون إشعاراتهم فقط
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
```

---

## 📊 إحصائيات الإشعارات

### استعلامات مفيدة:

```sql
-- عدد الإشعارات غير المقروءة لكل أسرة
SELECT 
    f.head_of_family_name,
    COUNT(*) as unread_count
FROM notifications n
JOIN families f ON f.id = n.family_id
WHERE n.is_read = FALSE
GROUP BY f.id, f.head_of_family_name;

-- الإشعارات حسب النوع
SELECT 
    notification_type,
    COUNT(*) as count,
    SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count
FROM notifications
GROUP BY notification_type;

-- متوسط وقت القراءة
SELECT 
    notification_type,
    AVG(EXTRACT(EPOCH FROM (read_at - created_at)))/60 as avg_minutes_to_read
FROM notifications
WHERE is_read = TRUE
GROUP BY notification_type;
```

---

## 🚀 التطوير المستقبلي

### ميزات مقترحة:

1. **إشعارات Push للجوال**
   - تكامل مع Firebase Cloud Messaging
   - إشعارات فورية حتى مع إغلاق التطبيق

2. **إشعارات SMS**
   - للحالات الطارئة جداً
   - تكامل مع خدمات SMS المحلية

3. **إشعارات Email**
   - ملخص أسبوعي
   - إشعارات مهمة فقط

4. **تفضيلات الإشعارات**
   - اختيار أنواع الإشعارات المستلمة
   - اختيار وسيلة الاستلام (تطبيق، SMS، Email)

5. **قوالب الإشعارات**
   - قوالب جاهزة لكل نوع
   - دعم تعدد اللغات

---

## 📋 الاختبار

### اختبار الإشعارات:

```sql
-- إنشاء إشعار تجريبي
INSERT INTO notifications (
    family_id,
    notification_type,
    title,
    message,
    is_read,
    related_entity_id,
    related_entity_type
) VALUES (
    'family-uuid-here',
    'system',
    'إشعار تجريبي',
    'هذا إشعار تجريبي لاختبار النظام',
    FALSE,
    NULL,
    'test'
);

-- التحقق من الإنشاء
SELECT * FROM notifications 
WHERE notification_type = 'system'
ORDER BY created_at DESC
LIMIT 10;
```

---

**تاريخ الإنشاء:** 2026-03-16  
**الحالة:** ✅ مكتمل  
**المراجعة القادمة:** بعد 3 أشهر من التشغيل
