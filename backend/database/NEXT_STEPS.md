# ✅ Storage Setup - Next Steps

You created the **id-cards** bucket. Great! 🎉

## 📋 What's Left

### ✅ Done:
- [x] Created bucket: `id-cards`

### ⏳ Remaining:
- [ ] Create bucket: `medical-reports`
- [ ] Create bucket: `signatures`
- [ ] Run policies SQL script

---

## 🎯 Step-by-Step Instructions

### **Step 1: Create medical-reports Bucket**

1. Go to **Storage** in Supabase Dashboard
2. Click **"Create bucket"**
3. Enter these values:

**Bucket name:**
```
medical-reports
```

**Public bucket:** ✅ **Check this box**

**Restrict file size:** ✅ **Check this box**
```
5 MB
```

**Allowed MIME types:** ✅ **Check this box**
```
image/jpeg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

4. Click **"Create bucket"**

---

### **Step 2: Create signatures Bucket**

1. Go to **Storage** in Supabase Dashboard
2. Click **"Create bucket"**
3. Enter these values:

**Bucket name:**
```
signatures
```

**Public bucket:** ✅ **Check this box**

**Restrict file size:** ✅ **Check this box**
```
2 MB
```

**Allowed MIME types:** ✅ **Check this box**
```
image/jpeg,image/png,image/gif,image/webp,image/svg+xml
```

4. Click **"Create bucket"**

---

### **Step 3: Run Policies SQL Script**

After creating all 3 buckets:

1. Go to **SQL Editor** (left sidebar)
2. Click **"New Query"**
3. Open the file: `backend/database/supabase-storage-policies-only.sql`
4. Copy all contents
5. Paste into SQL Editor
6. Click **"Run"** or press `Ctrl+Enter`

**Expected Result:**
```
✅ 12 policies created
```

---

## ✅ Verification Checklist

After completing all steps:

- [ ] Bucket `id-cards` exists (Public, 5MB)
- [ ] Bucket `medical-reports` exists (Public, 5MB)
- [ ] Bucket `signatures` exists (Public, 2MB)
- [ ] 12 policies created (run SQL query in script)
- [ ] Restart dev server: `npm run dev`
- [ ] Test file upload in registration form
- [ ] Console shows: `✅ Supabase storage configured`

---

## 🧪 Test File Upload

1. **Restart server:**
   ```bash
   npm run dev
   ```

2. **Go to:**
   ```
   http://localhost:5173/register-family
   ```

3. **Fill Step 1:**
   - Head of family name
   - National ID (9 digits)
   - Phone numbers (10 digits)

4. **Upload ID card:**
   - Scroll to "الوثائق والمستندات"
   - Click "اختر ملف"
   - Select an image
   - Should show: "تم رفع الملف بنجاح"

5. **Check console:**
   ```
   ✅ Supabase storage configured: https://...
   ```

---

## 📊 Summary

| Bucket | Status | Public | Size | MIME Types |
|--------|--------|--------|------|------------|
| `id-cards` | ✅ Created | ✅ Yes | 5MB | image/jpeg, image/png, application/pdf |
| `medical-reports` | ⏳ Pending | - | 5MB | image/*, application/pdf, application/msword |
| `signatures` | ⏳ Pending | - | 2MB | image/jpeg, image/png, image/gif, image/webp, image/svg+xml |

---

## 🆘 Troubleshooting

### Error: "Bucket already exists"
- ✅ This is OK! Bucket already created
- Skip to next bucket or run policies script

### Error: "Permission denied"
- Make sure you're logged in as project owner
- Or use manual bucket creation (which you're doing)

### File upload fails
- Check all 3 buckets are created
- Verify policies script ran successfully
- Restart dev server
- Check console for errors

---

## 📚 Documentation

- **Policies Script:** `backend/database/supabase-storage-policies-only.sql`
- **Full Guide:** `backend/STORAGE_SETUP_GUIDE.md`
- **MIME Types:** `backend/database/COMPLETE_MIME_TYPES.md`
- **Database README:** `backend/database/README.md`

---

**Create the remaining 2 buckets, then run the policies script, and you're done!** 🎉
