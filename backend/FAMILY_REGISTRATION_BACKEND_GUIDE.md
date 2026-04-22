# Family Registration - Backend Integration Guide

## Overview
This document explains how the family registration (تسجيل ملف الأسرة) feature integrates with the backend API and database.

## Registration Flow

### 1. Frontend (RegisterFamily.tsx)

**Location:** `/views/field-officer/RegisterFamily.tsx`

**Process:**
1. User fills out 3-step registration form
2. Form data is collected in `formData` state
3. On submit, data is transformed into `DPProfile` object
4. Vulnerability score is calculated via Gemini AI service
5. Profile is saved via `realDataService.saveDP()`

**Key Code:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // 1. Calculate vulnerability score
    const analysis = await geminiService.analyzeVulnerability(profile);
    profile.vulnerabilityScore = analysis.score;
    profile.vulnerabilityReason = analysis.reason;
    
    // 2. Save family to database
    await realDataService.saveDP(profile, 'self_reg', true);
    
    // 3. Show success screen
    setStep(4);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### 2. Service Layer (realDataServiceBackend.ts)

**Location:** `/services/realDataServiceBackend.ts`

**Process:**
1. Transforms `DPProfile` into database record format
2. Calls backend API endpoint `/public/families`
3. Saves family members as individual records

**Key Code:**
```typescript
async saveDP(dp: DPProfile, userId: string = 'system', isPublicRegistration: boolean = false) {
  // 1. Calculate vulnerability score
  const vulnerabilityResult = await vulnerabilityService.calculateVulnerabilityScore(dp);
  
  // 2. Prepare family record
  const familyRecord = {
    id: dp.id,
    camp_id: dp.currentHousing.campId,
    head_of_family_name: dp.headOfFamily,
    head_of_family_national_id: dp.nationalId,
    // ... more fields
    vulnerability_score: vulnerabilityResult.score,
    vulnerability_priority: vulnerabilityResult.priorityLevel,
  };
  
  // 3. Save to database via public endpoint
  if (isPublicRegistration) {
    const response = await fetch(`${BACKEND_API_URL}/public/families`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(familyRecord)
    });
  }
  
  // 4. Save family members as individuals
  for (const member of dp.members) {
    // Save each member...
  }
}
```

### 3. Backend API (public.js)

**Location:** `/backend/routes/public.js`

**Endpoint:** `POST /api/public/families`

**Process:**
1. Validates required fields
2. Checks if family already exists
3. Inserts family record into database
4. Creates head of family as individual record
5. Returns success response

**Key Code:**
```javascript
router.post('/families', async (req, res, next) => {
  try {
    // 1. Validate required fields
    const { id, camp_id, head_of_family_name, head_of_family_national_id } = req.body;
    
    if (!id || !camp_id || !head_of_family_name || !head_of_family_national_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // 2. Check if family exists
    const { data: existingFamily } = await serviceSupabase
      .from('families')
      .select('id')
      .eq('id', id)
      .single();
    
    if (existingFamily) {
      return res.status(409).json({ error: 'Family already exists' });
    }
    
    // 3. Insert family
    const { data: family } = await serviceSupabase
      .from('families')
      .insert([req.body])
      .select()
      .single();
    
    // 4. Create head of family as individual
    await serviceSupabase
      .from('individuals')
      .insert([{
        family_id: family.id,
        name: family.head_of_family_name,
        national_id: family.head_of_family_national_id,
        // ...
      }]);
    
    res.status(201).json({ id: family.id, message: 'Family registered successfully' });
  } catch (error) {
    next(error);
  }
});
```

### 4. Database Schema

**Table:** `families`

**Key Fields:**
```sql
CREATE TABLE families (
    id UUID PRIMARY KEY,
    camp_id UUID REFERENCES camps(id),
    head_of_family_name VARCHAR(255) NOT NULL,
    head_of_family_national_id VARCHAR(50) UNIQUE NOT NULL,
    head_of_family_gender VARCHAR(10),
    head_of_family_date_of_birth DATE,
    head_of_family_age INTEGER,
    head_of_family_marital_status VARCHAR(20),
    head_of_family_role VARCHAR(20),
    head_of_family_is_working BOOLEAN,
    head_of_family_job VARCHAR(255),
    head_of_family_phone_number VARCHAR(20),
    head_of_family_phone_secondary VARCHAR(20),
    head_of_family_disability_type VARCHAR(20),
    head_of_family_chronic_disease_type VARCHAR(20),
    head_of_family_war_injury_type VARCHAR(20),
    wife_name VARCHAR(255),
    wife_national_id VARCHAR(50),
    wife_is_pregnant BOOLEAN,
    total_members_count INTEGER,
    male_count INTEGER,
    female_count INTEGER,
    vulnerability_score NUMERIC(5, 2),
    vulnerability_priority VARCHAR(20),
    vulnerability_reason TEXT,
    original_address_governorate VARCHAR(100),
    current_housing_type VARCHAR(20),
    current_housing_camp_id UUID,
    current_housing_landmark VARCHAR(255),
    id_card_url TEXT,
    registered_date TIMESTAMP,
    last_updated TIMESTAMP
);
```

**Table:** `individuals`

**Key Fields:**
```sql
CREATE TABLE individuals (
    id UUID PRIMARY KEY,
    family_id UUID REFERENCES families(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    national_id VARCHAR(50),
    gender VARCHAR(10),
    date_of_birth DATE,
    age INTEGER,
    relation VARCHAR(20),
    phone_number VARCHAR(20),
    disability_type VARCHAR(20),
    chronic_disease_type VARCHAR(20)
);
```

## Testing the Registration

### Prerequisites

1. **Backend Server Running:**
```bash
cd backend
npm install
node server.js
```

2. **Database Connected:**
- Ensure Supabase credentials are configured in `.env`
- Database schema should be migrated

3. **Frontend Built:**
```bash
npm run build
```

### Manual Test Steps

1. **Navigate to Registration Page:**
   - URL: `http://localhost:5173/register-family` (or your deployed URL)

2. **Fill Step 1 - Head of Household:**
   - Name: أحمد محمد الحسن
   - ID: 123456789
   - Gender: Male
   - Date of Birth: 1985-01-15
   - Marital Status: Married
   - Role: Father
   - Working: Yes
   - Job: مدرس
   - Phone: 0599123456
   - Alternative Phone: 0599123457
   - Health: All "none"

3. **Fill Step 2 - Spouse:**
   - Name: فاطمة علي
   - ID: 987654321
   - Date of Birth: 1990-05-20
   - Pregnant: No
   - Health: All "none"

4. **Fill Step 3 - Housing:**
   - Governorate: شمال غزة
   - Region: جباليا
   - Neighborhood: المعسكر
   - Details: شارع الشهيد فهد محمد
   - Housing Type: خيمة
   - Current Governorate: شمال غزة
   - Area: جباليا
   - Camp: (Select from dropdown)
   - Upload ID: (Optional - skip for testing)

5. **Submit:**
   - Click "تأكيد وإرسال الطلب"
   - Wait for processing
   - Should show success screen

### Automated Test

Run the test script:
```bash
node test-family-registration.js
```

### Verify in Database

Query the database to verify:
```sql
-- Check family was created
SELECT id, head_of_family_name, head_of_family_national_id, 
       vulnerability_score, vulnerability_priority, registered_date
FROM families
ORDER BY registered_date DESC
LIMIT 1;

-- Check individual was created
SELECT i.name, i.national_id, i.relation, f.head_of_family_name
FROM individuals i
JOIN families f ON i.family_id = f.id
WHERE f.head_of_family_national_id = '123456789';
```

## Common Issues & Solutions

### 1. "Missing required fields"

**Error:**
```json
{
  "error": "Missing required fields for family registration: id, camp_id, head_of_family_name..."
}
```

**Solution:**
- Ensure all required fields are sent in the request
- Check that `camp_id` is valid UUID
- Verify form validation is working

### 2. "Family with this ID already exists"

**Error:**
```json
{
  "error": "Family with this ID already exists"
}
```

**Solution:**
- Each family must have unique ID
- Use UUID generator for new families
- Don't reuse national IDs

### 3. "Camp registration is pending approval"

**Error:**
```
حالة مخيمك قيد المراجعة
```

**Solution:**
- Camp must be approved before families can register
- Login as SYSTEM_ADMIN to approve camp
- Or use existing active camp

### 4. Vulnerability Score Not Calculating

**Issue:** Score remains 0 or default

**Solution:**
- Check Gemini API key is configured
- Verify `geminiService.analyzeVulnerability()` is called
- Check network connectivity to AI service

### 5. File Upload Fails

**Issue:** ID card or documents don't upload

**Solution:**
- Check Firebase storage credentials
- Verify bucket permissions
- Check file size limits (5MB for ID)

## Field Mapping

### Frontend → Backend

| Frontend Field | Backend Column | Type |
|----------------|----------------|------|
| `formData.headName` | `head_of_family_name` | VARCHAR |
| `formData.id` | `head_of_family_national_id` | VARCHAR |
| `formData.gender` | `head_of_family_gender` | VARCHAR |
| `formData.dob` | `head_of_family_date_of_birth` | DATE |
| `formData.maritalStatus` | `head_of_family_marital_status` | VARCHAR |
| `formData.headRole` | `head_of_family_role` | VARCHAR |
| `formData.isWorking` | `head_of_family_is_working` | BOOLEAN |
| `formData.job` | `head_of_family_job` | VARCHAR |
| `formData.phone` | `head_of_family_phone_number` | VARCHAR |
| `formData.phoneSecondary` | `head_of_family_phone_secondary` | VARCHAR |
| `formData.disability` | `head_of_family_disability_type` | VARCHAR |
| `formData.chronic` | `head_of_family_chronic_disease_type` | VARCHAR |
| `formData.warInjury` | `head_of_family_war_injury_type` | VARCHAR |
| `formData.wifeName` | `wife_name` | VARCHAR |
| `formData.wifeId` | `wife_national_id` | VARCHAR |
| `formData.wifeDob` | `wife_date_of_birth` | DATE |
| `formData.isPregnant` | `wife_is_pregnant` | BOOLEAN |
| `formData.origGov` | `original_address_governorate` | VARCHAR |
| `formData.origReg` | `original_address_region` | VARCHAR |
| `formData.origNeigh` | `original_address_neighborhood` | VARCHAR |
| `formData.origDetails` | `original_address_details` | TEXT |
| `formData.housingType` | `current_housing_type` | VARCHAR |
| `formData.preferredCamp` | `current_housing_camp_id` | UUID |
| `formData.landmark` | `current_housing_landmark` | VARCHAR |
| `formData.idCardUrl` | `id_card_url` | TEXT |

## Security Considerations

1. **Public Endpoint:**
   - No authentication required
   - Rate limiting recommended
   - Input validation critical

2. **Data Validation:**
   - National ID must be unique (9 digits)
   - Email format validation
   - Phone number format validation
   - Date validations (DOB, etc.)

3. **SQL Injection:**
   - Use parameterized queries
   - Supabase client handles this
   - Never concatenate user input into SQL

4. **XSS Prevention:**
   - Sanitize all text inputs
   - React escapes by default
   - Don't use `dangerouslySetInnerHTML`

## Performance Optimization

1. **Vulnerability Calculation:**
   - Currently done on every submission
   - Consider caching results
   - Move to background job

2. **File Uploads:**
   - Compress images before upload
   - Use CDN for storage
   - Implement retry logic

3. **Database Indexes:**
```sql
CREATE INDEX idx_families_camp_id ON families(camp_id);
CREATE INDEX idx_families_national_id ON families(head_of_family_national_id);
CREATE INDEX idx_families_registered_date ON families(registered_date);
CREATE INDEX idx_individuals_family_id ON individuals(family_id);
```

## Future Enhancements

1. **Email Notifications:**
   - Send confirmation email after registration
   - Notify camp manager of new family

2. **SMS Integration:**
   - Send SMS with registration confirmation
   - OTP verification for phone numbers

3. **Document Verification:**
   - OCR for ID cards
   - Automatic data extraction

4. **Batch Registration:**
   - CSV import for multiple families
   - Bulk registration campaigns

5. **Offline Support:**
   - PWA for offline registration
   - Sync when online

## Support

For issues or questions:
1. Check backend logs: `backend/logs/`
2. Check browser console for frontend errors
3. Verify database connection
4. Test API endpoints with Postman

---

**Last Updated:** 2026-02-18
**Version:** 1.0
