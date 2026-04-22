# 🔧 Inventory Quantity Still 0 - Debug & Fix

**Date:** 2026-02-19  
**Issue:** الكمية المتاحة still shows 0 after update

---

## 🐛 Problem

From your log output:
```javascript
{
  id: 'c92fcbaa-1a8f-4b62-b787-76930b71164b',
  name_ar: 'سلة رمضانية',
  quantity_available: 0,  // ❌ Still 0!
  min_stock: 5,
  max_stock: 130
}
```

---

## 🔍 Root Cause

The item was created **before** we added the initial quantity field, OR the transaction creation failed silently.

**How Inventory Works:**
```
1. Create Item → quantity_available = 0 (default)
2. Create IN Transaction (+100) → quantity_available = 100 ✅
3. Create OUT Transaction (-20) → quantity_available = 80 ✅
```

**Your Item:**
```
1. Created item → quantity_available = 0
2. Transaction NOT created → quantity_available = 0 ❌
```

---

## ✅ Solution 1: Manually Add Transaction (Quick Fix)

### Via Inventory Ledger Page

1. Go to **Inventory Ledger** page (سجل المخزون)
2. Click **"معاملة جديدة"**
3. Fill in:
   - **العنصر**: سلة رمضانية
   - **نوع الحركة**: ⬇️ وارد (إضافة للمخزون)
   - **الكمية**: 50 (or whatever initial qty you want)
   - **مرتبط بـ**: تبرع
   - **ملاحظات**: الرصيد الأولي
4. Click **"إضافة"**
5. ✅ Quantity should update to 50

---

## ✅ Solution 2: Recalculate from Transactions (If They Exist)

If you have transactions but quantity is still 0, run this SQL in Supabase:

```sql
-- Recalculate quantity_available from transactions
UPDATE inventory_items ii
SET quantity_available = (
  SELECT COALESCE(
    (SELECT SUM(quantity) FROM inventory_transactions 
     WHERE item_id = ii.id AND transaction_type = 'in') -
    (SELECT SUM(quantity) FROM inventory_transactions 
     WHERE item_id = ii.id AND transaction_type = 'out'),
    0
  )
)
WHERE camp_id = '0453e97c-d648-4cb9-8553-8a4d2f7bec61';
```

---

## ✅ Solution 3: Test New Item with Initial Quantity

### Create New Item (With Latest Code)

1. Build latest code: `npm run build`
2. Go to **Inventory Items** page
3. Click **"إضافة عنصر جديد"**
4. Fill in:
   - **الاسم العربي**: طحين
   - **الفئة**: غذائية
   - **الوحدة**: كيلوغرام
   - **الكمية المتاحة الأولية**: 500 ← **NEW FIELD**
   - **الحد الأدنى**: 100
   - **الحد الأقصى**: 1000
5. Click **"إضافة"**
6. Check console logs:
   ```
   [Inventory] Creating item: {...}
   [Inventory] Item created: {...}
   [Inventory] Creating initial transaction for: 500
   [Inventory] Transaction created: {...}
   ```
7. ✅ Should show: "تم إضافة عنصر المخزون والرصيد الأولي بنجاح"
8. ✅ Quantity should be 500

---

## 🔍 Debug Steps

### Step 1: Check if Transactions Exist

Go to Inventory Ledger page and filter by the item:
- If you see transactions → Quantity should be calculated
- If no transactions → That's the problem!

### Step 2: Check Console Logs

When creating a new item with initial quantity, you should see:

```javascript
[Inventory] Creating item: { nameAr: '...', ... }
[Inventory] Initial quantity: '500'
[Inventory] Item created: { id: '...', ... }
[Inventory] Creating initial transaction for: 500
[Inventory] Transaction created: { id: '...', ... }
```

If you DON'T see the transaction log, the creation is failing.

### Step 3: Check Backend Logs

Backend should show:
```
=== GET INVENTORY ITEMS ===
User role: CAMP_MANAGER
User campId: 0453e97c-d648-4cb9-8553-8a4d2f7bec61
Filtering by camp_id: 0453e97c-d648-4cb9-8553-8a4d2f7bec61
Found 1 inventory items
Sample item: {
  id: 'c92fcbaa-...',
  name_ar: 'سلة رمضانية',
  quantity_available: 0,  // ← This should be updated after transaction
  ...
}
```

---

## 📝 Why This Happened

### Before Our Fix

```
Inventory Items Page:
- No quantity field in form
- Quantity always starts at 0
- Must manually create transaction via Ledger page
```

### After Our Fix (Latest Code)

```
Inventory Items Page:
- ✅ Has "الكمية المتاحة الأولية" field
- ✅ Auto-creates IN transaction
- ✅ Quantity updates automatically
```

**Your item was created BEFORE the fix, so it has quantity = 0**

---

## 🚀 Recommended Actions

### For Existing Items (Like سلة رمضانية)

**Option A: Manual Transaction (Easiest)**
1. Go to Inventory Ledger
2. Create IN transaction for the item
3. Quantity will update

**Option B: SQL Update (Fast for Multiple Items)**
```sql
-- Update specific item
UPDATE inventory_items 
SET quantity_available = 50 
WHERE id = 'c92fcbaa-1a8f-4b62-b787-76930b71164b';
```

### For New Items

1. Use the latest code with initial quantity field
2. Enter initial quantity when creating item
3. Transaction auto-created ✅

---

## 🧪 Test the Fix

### Create Item with Initial Quantity

```bash
# 1. Build latest code
npm run build

# 2. Open browser DevTools (F12)
# 3. Go to Console tab

# 4. Create new inventory item with initial qty: 500
# 5. Check console logs:
[Inventory] Creating item: {...}
[Inventory] Creating initial transaction for: 500
[Inventory] Transaction created: {...}

# 6. Check quantity in UI → Should be 500 ✅
```

---

## 📊 Database Schema

```sql
-- inventory_items table
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY,
  name_ar TEXT,
  quantity_available INTEGER DEFAULT 0,  -- ← Updated by transactions
  ...
);

-- inventory_transactions table
CREATE TABLE inventory_transactions (
  id UUID PRIMARY KEY,
  item_id UUID REFERENCES inventory_items(id),
  transaction_type TEXT,  -- 'in' or 'out'
  quantity INTEGER,
  ...
);
```

**Flow:**
```
INSERT INTO inventory_items → quantity_available = 0
    ↓
INSERT INTO inventory_transactions (type='in', qty=500)
    ↓
UPDATE inventory_items SET quantity_available = 500
```

---

## ✅ Summary

| Issue | Cause | Solution |
|-------|-------|----------|
| Quantity = 0 | No transactions created | Create IN transaction manually |
| Field not in form | Old code | Update to latest code |
| Transaction not created | Silent failure | Check console logs |

**Quick Fix:** Go to Inventory Ledger → Create IN transaction → Done! ✅

---

**Updated:** 2026-02-19  
**Build Required:** Yes (`npm run build`)  
**Debug Logs:** Added to frontend
