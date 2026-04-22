# إصلاح خطأ "القيمة غير صالحة" عند حفظ DP Details

## المشكلة
عند محاولة حفظ تغييرات في صفحة DP Details، كان يظهر خطأ:
```
[DPDetails] Error saving changes: {"status":500,"data":{"error":"القيمة غير صالحة"}}
```

هذا الخطأ هو CHECK constraint violation من قاعدة البيانات.

## الأسباب المحتملة
1. **قاعدة البيانات غير محدثة** - عمود `wife_date_of_birth` أو بعض قيود CHECK قد تكون قديمة
2. **مسافات زائدة في القيم العربية** - بعض الحقول تحتوي على مسافات زائدة تسبب عدم تطابق مع CHECK constraints
3. **عدم تطابق القيم** - القيم المرسلة لا تطابق تماماً القيم المسموحة في قاعدة البيانات

## الإصلاحات المنفذة

### 1. Migration جديد لقاعدة البيانات
**الملف:** `/backend/database/migrations/028_fix_wife_date_and_constraints.sql`

هذا الـ migration يقوم بـ:
- إضافة عمود `wife_date_of_birth` إذا لم يكن موجوداً
- حذف جميع قيود CHECK القديمة
- إعادة إنشاء قيود CHECK بقيم عربية صحيحة
- جعل بعض القيود تقبل NULL لتجنب الأخطاء

**كيفية التطبيق:**
```bash
# Connect to your Supabase database and run:
psql -h <host> -U postgres -d postgres -f backend/database/migrations/028_fix_wife_date_and_constraints.sql
```

أو من خلال Supabase Dashboard > SQL Editor

### 2. إضافة Trim للقيم العربية في Frontend
**الملف:** `/views/admin/DPDetails.tsx`

تم إضافة دالة `trimArabicString()` التي:
- تزيل المسافات الزائدة من بداية ونهاية النص
- تحول المسافات المتعددة إلى مسافة واحدة
- تطبق على جميع الحقول العربية قبل الإرسال

```typescript
const trimArabicString = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) return null;
  return value.trim().replace(/\s+/g, ' ');
};
```

### 3. تحسين رسائل الخطأ في Backend
**الملف:** `/backend/utils/arabicMessages.js`

تم تحسين دالة `getDatabaseErrorMessage()` لتوفير رسائل خطأ أكثر تفصيلاً:
- عرض اسم الـ constraint الذي تسبب في الخطأ
- توفير رسائل مخصصة لكل constraint
- تسجيل تفاصيل الخطأ في الـ console للمساعدة في الـ debugging

**مثال على الرسائل الجديدة:**
- "قيمة إعاقة الزوجة غير صحيحة. القيم المسموحة: لا يوجد، حركية، بصرية، سمعية، ذهنية، أخرى"
- "قيمة نوع السكن غير صحيحة. القيم المسموحة: خيمة، بيت إسمنتي، شقة، أخرى"

### 4. تحسين Logging في Backend API
**الملف:** `/backend/routes/families.js`

تم إضافة logging إضافي في endpoint تحديث العائلة:
- تسجيل البيانات المرسلة
- تسجيل تفاصيل الخطأ الكاملة
- تسجيل اسم الـ constraint الذي فشل

## كيفية الاستخدام

### الخطوة 1: تطبيق Migration
```sql
-- Run the migration file in your Supabase SQL Editor
-- File: backend/database/migrations/028_fix_wife_date_and_constraints.sql
```

### الخطوة 2: تحديث Backend
تأكد من أن ملفات Backend محدثة:
- `/backend/utils/arabicMessages.js`
- `/backend/routes/families.js`

### الخطوة 3: اختبار الحفظ
1. افتح صفحة DP Details
2. قم بتعديل بعض الحقول
3. اضغط حفظ
4. تحقق من Console للرؤية تفاصيل العملية

## القيم المسموحة لكل حقل

### حالة الزواج (head_of_family_marital_status)
- أعزب
- متزوج ← **هذا هو المستخدم حالياً**
- أرمل
- مطلق
- أسرة هشة

### دور رب العائلة (head_of_family_role)
- أب ← **هذا هو المستخدم حالياً**
- أم
- زوجة

### نوع السكن الحالي (current_housing_type)
- خيمة ← **هذا هو المستخدم حالياً**
- بيت إسمنتي
- شقة
- أخرى

### حالة المشاركة في السكن (current_housing_sharing_status)
- سكن فردي ← **هذا هو المستخدم حالياً**
- سكن مشترك

### المرافق الصحية (current_housing_sanitary_facilities)
- نعم (دورة مياه خاصة) ← **هذا هو المستخدم حالياً**
- لا (مرافق مشتركة)

### إعاقة الزوجة (wife_disability_type)
- لا يوجد ← **هذا هو المستخدم حالياً**
- حركية
- بصرية
- سمعية
- ذهنية
- أخرى

### المرض المزمن للزوجة (wife_chronic_disease_type)
- لا يوجد ← **هذا هو المستخدم حالياً**
- سكري
- ضغط دم
- قلب
- سرطان
- ربو
- فشل كلوي
- مرض نفسي
- أخرى

### إصابة الحرب للزوجة (wife_war_injury_type)
- لا يوجد ← **هذا هو المستخدم حالياً**
- بتر
- كسر
- شظية
- حرق
- رأس/وجه
- عمود فقري
- أخرى

## استكشاف الأخطاء

### إذا استمر الخطأ:
1. **تحقق من Console Backend** - سترى رسالة خطأ مفصلة مع اسم الـ constraint
2. **تحقق من البيانات المرسلة** - تأكد من أن القيم تطابق القيم المسموحة أعلاه
3. **تحقق من تطبيق Migration** - تأكد من أن جميع القيود قد تم تحديثها

### للحصول على مساعدة إضافية:
- راجع سجلات Console في المتصفح
- راجع سجلات Backend
- تحقق من قاعدة البيانات للتأكد من تطبيق القيود

## الملفات المعدلة
1. `/backend/database/migrations/028_fix_wife_date_and_constraints.sql` (جديد)
2. `/views/admin/DPDetails.tsx` - إضافة trimArabicString()
3. `/backend/utils/arabicMessages.js` - تحسين رسائل الخطأ
4. `/backend/routes/families.js` - تحسين logging

## الاختبار
بعد تطبيق الإصلاحات:
```bash
# 1. Start backend
cd backend && npm run dev

# 2. Open browser to DP Details page
# 3. Edit some fields
# 4. Save and verify no errors
```

## ملاحظات مهمة
- **البيانات العربية:** يجب أن تكون بالضبط كما هي في القيود (بدون مسافات زائدة)
- **NULL values:** بعض الحقول تقبل NULL، لكن يفضل إرسال القيم الصحيحة
- **التحديثات التلقائية:** بعض الحقول مثل `vulnerability_score` يتم حسابها تلقائياً بواسطة Triggers
