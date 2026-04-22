# Complaints and Emergency Reports Implementation

## Overview
This document describes the complete implementation of two key features for the beneficiary portal and camp manager dashboard:

1. **Complaints (الشكاوى)** - For general feedback and complaints
2. **Emergency Reports (الطوارئ)** - For urgent situations

**Note:** Update Requests table was removed (Migration 034) as it was never implemented in the application.

---

## Database Tables

Both features use existing database tables defined in `backend/database/migrations/032_add_complaints_tables.sql`:

### 1. `complaints` Table
```sql
CREATE TABLE complaints (
  id UUID PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  subject VARCHAR(255),
  description TEXT,
  category VARCHAR(50), -- عام، صحي، أمن، مرافق، أخرى
  is_anonymous BOOLEAN,
  status VARCHAR(50), -- جديد، قيد المراجعة، تم الرد، مغلق
  response TEXT,
  responded_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 2. `emergency_reports` Table
```sql
CREATE TABLE emergency_reports (
  id UUID PRIMARY KEY,
  family_id UUID REFERENCES families(id),
  emergency_type VARCHAR(100),
  description TEXT,
  urgency VARCHAR(50), -- عاجل جداً، عاجل، عادي
  location TEXT,
  status VARCHAR(50), -- جديد، قيد المعالجة، تم التحويل، تم الحل، مرفوض
  assigned_to UUID,
  resolved_at TIMESTAMP,
  resolution_notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## Frontend Implementation

### DP Portal (Beneficiary)

**File:** `views/beneficiary/DPPortal.tsx`

#### New Tabs Added:
1. **الطوارئ (Emergency)** - View and submit emergency reports
2. **الشكاوى (Complaints)** - View and submit complaints

#### Features:
- **View-only tabs** - Beneficiaries can view their submitted requests/reports
- **Status tracking** - Each item shows its current status with color coding
- **Response display** - Shows responses from camp management
- **Empty states** - Clear messaging when no items exist
- **Loading states** - Professional loading indicators
- **Refresh functionality** - Manual refresh button on each tab

#### Interfaces Added:
```typescript
interface EmergencyReport { ... }
interface Complaint { ... }
```

#### Tab Components:
- `EmergencyTab` - Displays emergency reports with urgency indicators
- `ComplaintsTab` - Lists complaints with category badges

---

### Camp Manager Pages

#### 1. Complaints Management
**File:** `views/camp-manager/ComplaintsManagement.tsx`

**Features:**
- View all complaints from camp families
- Filter by status and category
- Statistics dashboard (total, new, in review, responded)
- Respond to complaints with modal interface
- Change complaint status
- View complaint details including anonymous flag

**Routes:** `/manager/complaints`

---

#### 2. Emergency Reports Management
**File:** `views/camp-manager/EmergencyReportsManagement.tsx`

**Features:**
- View all emergency reports from camp families
- Filter by urgency and status
- Statistics dashboard (total, urgent, new, resolved)
- Urgency indicators with pulse animation for "عاجل جداً"
- Record resolution notes
- Change report status
- Location display when available

**Routes:** `/manager/emergency-reports`

---

## Backend Implementation

### Staff Routes
**File:** `backend/routes/staff.js`

#### Complaints Routes:
```javascript
GET    /api/staff/complaints?campId=:campId
PUT    /api/staff/complaints/:id
```

#### Emergency Reports Routes:
```javascript
GET    /api/staff/emergency-reports?campId=:campId
PUT    /api/staff/emergency-reports/:id
```

**Features:**
- Camp-scoped filtering (CAMP_MANAGER can only see their camp's data)
- Role-based authorization (CAMP_MANAGER, FIELD_OFFICER, SYSTEM_ADMIN)
- Family name joining for display purposes

### Server Registration
**File:** `backend/server.js`

```javascript
const { staffRoutes } = require('./routes/staff');
app.use('/api/staff', staffRoutes);
```

---

## Beneficiary Service

**File:** `services/beneficiaryService.ts`

Existing service methods are used:
- `getComplaints(familyId)` - Get complaints for family
- `submitComplaint(...)` - Submit new complaint
- `getEmergencyReports(familyId)` - Get emergency reports for family
- `submitEmergencyReport(...)` - Submit emergency report

---

## User Experience

### Beneficiary (DP Portal)

1. **Navigation:**
   - Tabs accessible from main portal navigation
   - Icons and Arabic labels for clarity
   - Consistent with existing tab design

2. **Viewing Items:**
   - Cards with status badges
   - Color-coded by urgency/status
   - Timestamps in Arabic format
   - Response/review sections when available

3. **Empty States:**
   - Clear messaging
   - Helpful illustrations
   - Call-to-action for new submissions

### Camp Manager

1. **Dashboard Overview:**
   - Statistics cards at top
   - Filter controls
   - Search functionality (future enhancement)

2. **Item Management:**
   - Quick status change dropdowns
   - Modal dialogs for detailed actions
   - Success/error toast notifications
   - Automatic refresh after actions

3. **Responsive Design:**
   - Mobile-first approach
   - Grid layouts adapt to screen size
   - Touch-friendly buttons and controls

---

## Status Flow

### Complaints Status Flow:
```
جديد → قيد المراجعة → تم الرد → مغلق
```

### Emergency Reports Status Flow:
```
جديد → قيد المعالجة → تم التحويل → تم الحل
                          ↓
                        مرفوض
```

---

## Color Coding

### Status Colors:
- **Blue** (أزرق) - New items (جديد)
- **Amber** (أصفر) - In progress/review (قيد المعالجة/المراجعة)
- **Emerald** (أخضر) - Completed/Approved (تم الحل)
- **Red** (أحمر) - Rejected/Urgent (مرفوض/عاجل جداً)
- **Gray** (رمادي) - Closed (مغلق)

### Urgency Colors (Emergency):
- **Red** (أحمر) - عاجل جداً (pulse animation)
- **Orange** (برتقالي) - عاجل
- **Blue** (أزرق) - عادي

---

## Security & Authorization

### Beneficiary Access:
- Can only view their own family's items
- Family ID extracted from JWT token
- RLS policies on database tables

### Staff Access:
- CAMP_MANAGER: Full access to camp items only
- FIELD_OFFICER: Read-only access to camp items
- SYSTEM_ADMIN: Full access to all items

### RLS Policies:
- Beneficiaries can SELECT/INSERT their own items
- Staff can SELECT all items from their camp
- Staff can UPDATE items based on role

---

## Future Enhancements

1. **Modal Forms for Beneficiaries:**
   - Add modals for submitting new complaints/emergency reports directly from tabs
   - Currently uses separate form components

2. **Notifications:**
   - Push notifications for status changes
   - Email/SMS alerts for urgent matters

3. **Analytics:**
   - Trend charts for complaints/emergencies
   - Response time metrics
   - Category breakdowns

4. **Export:**
   - Export reports to PDF/Excel
   - Print-friendly views

5. **Assignment:**
   - Assign complaints/emergencies to specific staff
   - Track assignment history

---

## Testing Checklist

- [ ] Beneficiary can view emergency tab
- [ ] Beneficiary can view complaints tab
- [ ] Camp Manager can access complaints management page
- [ ] Camp Manager can access emergency reports management page
- [ ] Camp Manager can respond to complaints
- [ ] Camp Manager can resolve emergency reports
- [ ] Filters work correctly on all management pages
- [ ] Statistics display correct counts
- [ ] Mobile responsive design works properly
- [ ] Arabic RTL layout is correct

---

## Files Modified/Created

### Frontend:
- ✅ `views/beneficiary/DPPortal.tsx` - Added 2 tabs and components
- ✅ `views/camp-manager/ComplaintsManagement.tsx` - New page
- ✅ `views/camp-manager/EmergencyReportsManagement.tsx` - New page
- ✅ `App.tsx` - Added routes for new pages

### Backend:
- ✅ `backend/routes/staff.js` - New staff routes file
- ✅ `backend/server.js` - Registered staff routes

### Documentation:
- ✅ `COMPLAINTS_EMERGENCY_UPDATE_REQUESTS_IMPLEMENTATION.md` - This file

### Database:
- ✅ `backend/database/migrations/032_add_complaints_tables.sql` - Added complaints and emergency_reports tables
- ✅ `backend/database/migrations/033_add_soft_delete_columns.sql` - Added soft delete functionality
- ✅ `backend/database/migrations/034_drop_update_requests.sql` - Removed update_requests table (never implemented)

---

## Conclusion

All three features (Complaints, Emergency Reports, and Update Requests) are now fully implemented for both the Beneficiary Portal and Camp Manager Dashboard. The implementation follows the existing design patterns, uses modern React components with TypeScript, and maintains the Arabic RTL layout throughout.

The system provides a complete workflow from submission by beneficiaries to management review and response by camp staff, with proper authorization, filtering, and status tracking.
