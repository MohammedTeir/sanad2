# 🔄 Complete System Flow Example

## Scenario: Ramadan 2026 Food Distribution Campaign

This document walks through a **complete end-to-end flow** demonstrating how all 5 modules in the سند system work together.

---

## 📋 Prerequisites

**User:** Camp Manager (مدير المخيم)  
**Camp:** مخيم الأمل (Hope Camp)  
**Goal:** Distribute food parcels to 100 families for Ramadan

---

## Step 1: Define Aid Types 🏷️

**Module:** `AidTypesConfig.tsx`  
**Purpose:** Define what types of aid exist in your camp

### Action: Create Food Parcel Aid Type

**User fills the form:**
```
الاسم بالعربية: طرد غذائي
الفئة: food (غذائية)
وحدة القياس: box (صندوق)
الوصف: طرد غذائية تحتوي على مواد أساسية للعائلة
```

### Backend API Call:
```javascript
POST /aid/types
{
  "name": "Food Parcel",
  "nameAr": "طرد غذائي",
  "category": "food",
  "unit": "box",
  "unitAr": "صندوق",
  "description": "Basic food supplies for family",
  "isActive": true,
  "campId": "camp_hope_001"
}
```

### Database Record Created:
```sql
INSERT INTO aid_types (
  id, name, name_ar, category, unit, unit_ar, 
  description, is_active, camp_id, created_at
) VALUES (
  'aid_type_food_001',
  'Food Parcel',
  'طرد غذائي',
  'food',
  'box',
  'صندوق',
  'Basic food supplies for family',
  true,
  'camp_hope_001',
  '2026-02-19 10:00:00'
);
```

### UI Feedback:
```
✅ Toast Notification: "تم إضافة نوع المساعدة بنجاح"
   (Aid type added successfully)
```

---

## Step 2: Create Aid Campaign 📋

**Module:** `AidCampaigns.tsx`  
**Purpose:** Plan when and how much to distribute

### Action: Create Ramadan 2026 Campaign

**User fills the form:**
```
اسم الحملة: حملة رمضان 2026
نوع المساعدة: طرد غذائي
الفئة: food (غذائية)
تاريخ البدء: 2026-03-01
تاريخ الانتهاء: 2026-03-30
الوصف: توزيع طرود غذائية على الأسر المحتاجة في رمضان
الأسر المستهدفة: [Select 100 families from selector]
```

### Family Selector Modal:
```
Total families in camp: 250
Selected: 100 families
Search: "أحمد" → Filter results
Click: "تحديد الكل" (Select All) → Select 100 families
```

### Backend API Call:
```javascript
POST /aid/campaigns
{
  "name": "حملة رمضان 2026",
  "aidType": "طرد غذائي",
  "aidCategory": "food",
  "startDate": "2026-03-01",
  "endDate": "2026-03-30",
  "description": "توزيع طرود غذائية على الأسر المحتاجة في رمضان",
  "targetFamilies": [
    "family_001",
    "family_002",
    "family_003",
    // ... 97 more families
  ],
  "campId": "camp_hope_001"
}
```

### Database Record Created:
```sql
INSERT INTO aid_campaigns (
  id, name, aid_type, aid_category, 
  start_date, end_date, status, target_families,
  camp_id, created_at
) VALUES (
  'campaign_ramadan_2026',
  'حملة رمضان 2026',
  'طرد غذائي',
  'food',
  '2026-03-01',
  '2026-03-30',
  'active',
  ARRAY['family_001', 'family_002', ...],
  'camp_hope_001',
  '2026-02-19 10:15:00'
);
```

### UI Feedback:
```
✅ Toast Notification: "تم إنشاء الحملة بنجاح"
   (Campaign created successfully)

Campaign Card Shows:
┌─────────────────────────────────────┐
│ حملة رمضان 2026                     │
│ [food] [طرد غذائي]                  │
│                                     │
│ Progress: [=====>..........] 0%     │
│ تم التوزيع: 0    المتبقي: 100      │
└─────────────────────────────────────┘
```

---

## Step 3: Stock Inventory 📦

**Module:** `InventoryItemsSetup.tsx`  
**Purpose:** Add physical items to warehouse

### Action: Add Flour to Inventory

**Note:** Category dropdown shows aid types:
```
-- اختر نوع المساعدة --
طرود غذائية (box)  ← Auto-selects unit
```

**User fills the form:**
```
الاسم العربي: طحين
الفئة: food (selected from aid types)
الوحدة: kg (كيلوغرام)
اسم الوحدة بالعربية: كيلوغرام
الحد الأدنى للمخزون: 100
الحد الأقصى للمخزون: 1000
ملاحظات: طحين قمح عالي الجودة
```

### Backend API Call:
```javascript
POST /inventory
{
  "nameAr": "طحين",
  "category": "food",
  "unit": "kg",
  "unitAr": "كيلوغرام",
  "minStock": 100,
  "maxStock": 1000,
  "notes": "طحين قمح عالي الجودة",
  "isActive": true,
  "campId": "camp_hope_001"
}
```

### Database Record Created:
```sql
INSERT INTO inventory_items (
  id, name_ar, category, unit, unit_ar,
  min_stock, max_stock, quantity_available,
  camp_id, created_at
) VALUES (
  'inv_flour_001',
  'طحين',
  'food',
  'kg',
  'كيلوغرام',
  100,
  1000,
  0,  -- Starting with 0
  'camp_hope_001',
  '2026-02-19 10:30:00'
);
```

### UI Feedback:
```
✅ Toast Notification: "تم إضافة عنصر المخزون بنجاح"
   (Inventory item added successfully)

Item Card Shows:
┌─────────────────────────────────────┐
│ 📦 طحين                              │
│ الفئة: غذائية                        │
│ الوحدة: كيلوغرام                     │
│ المخزون: 0 / 1000                    │
│ ⚠️ مخزون منخفض (below minimum)      │
└─────────────────────────────────────┘
```

---

## Step 3.5: Add Inventory Stock (Incoming Transaction) 📥

**Module:** `InventoryLedger.tsx`  
**Purpose:** Record stock entering warehouse

### Action: Record Purchase of 500kg Flour

**User clicks:** "إضافة عنصر مخزون جديد" → "معاملة جديدة"

**User fills the form:**
```
العنصر: طحين (المتوفر: 0 كيلوغرام)
نوع الحركة: ⬇️ وارد (إضافة للمخزون)
الكمية: 500
مرتبط بـ: شراء
المعرف المرتبط: PO-2026-001
ملاحظات: شراء من مطحنة الأمل
```

### Backend API Call:
```javascript
POST /inventory/transactions
{
  "itemId": "inv_flour_001",
  "transactionType": "in",
  "quantity": 500,
  "relatedTo": "purchase",
  "relatedId": "PO-2026-001",
  "notes": "شراء من مطحنة الأمل"
}
```

### Database Records Created:
```sql
-- 1. Create transaction record
INSERT INTO inventory_transactions (
  id, item_id, transaction_type, quantity,
  related_to, related_id, notes,
  processed_at
) VALUES (
  'txn_001',
  'inv_flour_001',
  'in',
  500,
  'purchase',
  'PO-2026-001',
  'شراء من مطحنة الأمل',
  '2026-02-19 10:45:00'
);

-- 2. Update inventory quantity
UPDATE inventory_items
SET quantity_available = quantity_available + 500
WHERE id = 'inv_flour_001';

-- Result: quantity_available = 500
```

### UI Feedback:
```
✅ Toast Notification: "تم إضافة المعاملة بنجاح"
   (Transaction added successfully)

Ledger Table Shows:
┌──────────────────────────────────────────────────┐
│ العنصر  │ النوع │ الكمية │ مرتبط بـ │ التاريخ    │
├──────────────────────────────────────────────────┤
│ طحين    │ ⬇️ وارد│ +500   │ شراء      │ 2026-02-19 │
└──────────────────────────────────────────────────┘

Inventory Updated:
طحين: 500 / 1000 كيلوغرام ✅ (above minimum)
```

---

## Step 4: Distribute to Family 🚚

**Module:** `DistributionManagement.tsx`  
**Purpose:** Execute actual distribution to families

### Action: Distribute to Family #001

**User sees campaign card:**
```
حملة رمضان 2026
Progress: [=====>..........] 0%
تم التوزيع: 0    المتبقي: 100
```

**User scrolls to families list:**
```
┌─────────────────────────────────────────┐
│ أحمد محمد                               │
│ 👨‍👩‍👧‍👦 5 أفراد  |  📞 059-1234567       │
│ [لم يتم التوزيع]  [توزيع] ◀── Click    │
└─────────────────────────────────────────┘
```

### Distribution Modal Opens:

**Modal shows:**
```
┌─────────────────────────────────────────┐
│ 📦 توزيع مساعدة                         │
│                                         │
│ 👤 أحمد محمد                            │
│    5 أفراد                              │
│                                         │
│ الحملة: حملة رمضان 2026                 │
│                                         │
│ الكمية *                                │
│ [__________] كيلوغرام                   │
│                                         │
│ كود التحقق OTP (اختياري)                │
│ [__________]                            │
│                                         │
│ ملاحظات                                 │
│ [_________________________]             │
│                                         │
│ ☐ تأكيد استلام المساعدة                 │
│   أؤكد أن الأسرة قد استلمت المساعدة     │
│                                         │
│ [إلغاء]  [تأكيد التوزيع]                │
└─────────────────────────────────────────┘
```

**User fills:**
```
الكمية: 10
كود التحقق OTP: 1234
ملاحظات: تم التوزيع في المستودع
☑️ تأكيد استلام المساعدة (checked)
```

### Backend API Calls (2 calls):

**Call 1: Create Inventory Transaction**
```javascript
POST /inventory/transactions
{
  "itemId": "inv_flour_001",
  "transactionType": "out",
  "quantity": 10,
  "relatedTo": "distribution",
  "relatedId": "campaign_ramadan_2026",
  "notes": "توزيع للأسرة أحمد محمد - حملة حملة رمضان 2026"
}
```

**Call 2: Update Campaign Progress**
```javascript
PUT /aid/campaigns/campaign_ramadan_2026
{
  "distributedTo": ["family_001"]  // Add to array
}
```

### Database Changes:
```sql
-- 1. Create outgoing transaction
INSERT INTO inventory_transactions (
  id, item_id, transaction_type, quantity,
  related_to, related_id, notes,
  processed_at
) VALUES (
  'txn_002',
  'inv_flour_001',
  'out',
  10,
  'distribution',
  'campaign_ramadan_2026',
  'توزيع للأسرة أحمد محمد - حملة حملة رمضان 2026',
  '2026-02-19 11:00:00'
);

-- 2. Update inventory quantity
UPDATE inventory_items
SET quantity_available = quantity_available - 10
WHERE id = 'inv_flour_001';

-- Result: quantity_available = 490

-- 3. Update campaign progress
UPDATE aid_campaigns
SET distributed_to = array_append(distributed_to, 'family_001')
WHERE id = 'campaign_ramadan_2026';
```

### UI Feedback:
```
✅ Toast Notification: "تم توزيع المساعدة بنجاح"
   (Distribution successful)

Campaign Card Updates:
┌─────────────────────────────────────┐
│ حملة رمضان 2026                     │
│ Progress: [█=>...........] 1%       │
│ تم التوزيع: 1    المتبقي: 99       │
└─────────────────────────────────────┘

Family Row Updates:
┌─────────────────────────────────────────┐
│ أحمد محمد ✅                            │
│ [تم التوزيع] (disabled, gray)          │
└─────────────────────────────────────────┘

Inventory Updates:
طحين: 490 / 1000 كيلوغرام
```

---

## Step 5: View Ledger History 📝

**Module:** `InventoryLedger.tsx`  
**Purpose:** Audit trail of all movements

### User Opens Ledger Page:

**Statistics Show:**
```
┌─────────────────────────────────────────┐
│ إجمالي الحركات: 2                       │
│ وارد: +500                              │
│ صادر: -10                               │
│ هذا الشهر: 2                            │
└─────────────────────────────────────────┘
```

**Transaction Table:**
```
┌────────────────────────────────────────────────────────────┐
│ العنصر  │ النوع  │ الكمية  │ مرتبط بـ    │ ملاحظات        │
├────────────────────────────────────────────────────────────┤
│ طحين    │ ⬇️ وارد│ +500    │ شراء        │ شراء من مطحنة  │
│         │        │         │             │ الأمل          │
├────────────────────────────────────────────────────────────┤
│ طحين    │ ⬆️ صادر│ -10     │ توزيع       │ توزيع للأسرة   │
│         │        │         │             │ أحمد محمد      │
└────────────────────────────────────────────────────────────┘
```

**Filters Applied:**
```
العنصر: طحين
النوع: الجميع
مرتبط بـ: الجميع
من تاريخ: 2026-02-01
إلى تاريخ: 2026-02-28
```

**Filtered Results:** 2 transactions match

---

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Step 1: Define Aid Type                  │
│  AidTypesConfig.tsx → POST /aid/types → aid_types table    │
│  Result: "طرد غذائي" (food, box) created                    │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Step 2: Create Campaign                   │
│  AidCampaigns.tsx → POST /aid/campaigns → aid_campaigns    │
│  Result: "حملة رمضان 2026" targeting 100 families           │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Step 3: Stock Inventory                   │
│  InventoryItemsSetup.tsx → POST /inventory → inventory_items│
│  Result: "طحين" item created (0 kg)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Step 3.5: Add Stock (IN Transaction)         │
│  InventoryLedger.tsx → POST /inventory/transactions         │
│  Result: +500 kg flour added, inventory = 500 kg            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│              Step 4: Distribute to Family                   │
│  DistributionManagement.tsx →                                │
│    1. POST /inventory/transactions (OUT: -10 kg)            │
│    2. PUT /aid/campaigns (update distributedTo array)       │
│  Result: inventory = 490 kg, campaign progress = 1%         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                Step 5: View Audit Trail                     │
│  InventoryLedger.tsx → GET /inventory/transactions          │
│  Result: Shows all IN/OUT transactions with details         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📈 Final System State

### Aid Types:
```json
{
  "id": "aid_type_food_001",
  "name_ar": "طرد غذائي",
  "category": "food",
  "unit": "box",
  "is_active": true
}
```

### Aid Campaigns:
```json
{
  "id": "campaign_ramadan_2026",
  "name": "حملة رمضان 2026",
  "status": "active",
  "targetFamilies": ["family_001", "family_002", ...],
  "distributedTo": ["family_001"],
  "progress": "1%"
}
```

### Inventory Items:
```json
{
  "id": "inv_flour_001",
  "name_ar": "طحين",
  "quantity_available": 490,
  "min_stock": 100,
  "max_stock": 1000,
  "status": "✅ Above minimum"
}
```

### Inventory Transactions:
```json
[
  {
    "id": "txn_001",
    "item_id": "inv_flour_001",
    "type": "in",
    "quantity": 500,
    "related_to": "purchase"
  },
  {
    "id": "txn_002",
    "item_id": "inv_flour_001",
    "type": "out",
    "quantity": 10,
    "related_to": "distribution"
  }
]
```

### Distribution Records:
```json
{
  "campaign_id": "campaign_ramadan_2026",
  "family_001": {
    "family_name": "أحمد محمد",
    "distributed_at": "2026-02-19 11:00:00",
    "quantity": 10,
    "item": "طحين",
    "verified": true
  }
}
```

---

## 🎯 Key Integration Points

### 1. Campaign → Inventory Link
**Current Implementation:** Name-based matching
```javascript
// DistributionManagement.tsx line ~200
const inventoryItem = inventoryItems.find(item =>
  item.name_ar.includes(selectedCampaign.aidType) ||
  selectedCampaign.aidType.includes(item.name_ar)
);
```
**⚠️ Issue:** Fragile if names don't match exactly

**Recommended Fix:** Store explicit `inventoryItemId` in campaign

### 2. Distribution → Ledger Auto-Creation
**Every distribution automatically creates:**
- ✅ OUT transaction in ledger
- ✅ Updates inventory quantity
- ✅ Updates campaign progress

### 3. Campaign → Family Tracking
**Target families are stored as array:**
```json
"targetFamilies": ["family_001", "family_002", ...]
"distributedTo": ["family_001"]  // Subset of targets
```

**Progress calculation:**
```javascript
progress = (distributedTo.length / targetFamilies.length) * 100
```

---

## 🔍 Real-World Example Numbers

### After 1 Week of Distribution:

**Campaign Progress:**
```
حملة رمضان 2026
Progress: [█████████=>......] 65%
تم التوزيع: 65    المتبقي: 35
```

**Inventory Status:**
```
طحين: 150 / 1000 كيلوغرام
⚠️ تحذير: المخزون يقترب من الحد الأدنى (100)
```

**Ledger Summary:**
```
Total Transactions: 66
- IN (purchase): 1 transaction, +500 kg
- OUT (distribution): 65 transactions, -350 kg
Net: 150 kg remaining
```

**Next Action Required:**
```
📦 Reorder Alert: Order 500 kg more flour to avoid stockout
```

---

## 📱 Mobile Experience

All steps work on mobile devices:

1. **Aid Types:** Tap "+" → Fill form → Save
2. **Campaigns:** Tap "حملة جديدة" → Select families → Save
3. **Inventory:** Tap "إضافة عنصر مخزون" → Fill details → Save
4. **Distribution:** Tap "توزيع" next to family → Confirm → Done
5. **Ledger:** Scroll table → Apply filters → View details

**Touch-friendly features:**
- Large buttons (min 44x44px)
- Swipe to search
- Pull to refresh
- Bottom sheet modals on small screens

---

## 🎓 Summary

This flow demonstrates how the 5 modules work together seamlessly:

1. **Aid Types** define WHAT exists (طرد غذائي)
2. **Campaigns** plan WHEN and WHO (Ramadan, 100 families)
3. **Inventory** tracks WHAT'S AVAILABLE (500 kg flour)
4. **Distribution** executes GIVING (10 kg to Family X)
5. **Ledger** records EVERY MOVEMENT (audit trail)

**Result:** Complete transparency, accountability, and efficiency in aid distribution! 🎉

---

**Document Created:** 2026-02-19  
**Example Scenario:** Ramadan 2026 Food Distribution  
**Modules Demonstrated:** All 5 core modules
