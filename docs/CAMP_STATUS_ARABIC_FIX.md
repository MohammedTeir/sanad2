# Camp Status Arabic Values Fix

## Issue
The Edit Camp modal was using English status values (`active`, `pending`, `full`) in the dropdown options instead of Arabic values (`نشط`, `قيد الانتظار`, `ممتلئ`), even though the database schema and backend already support Arabic status values.

## Root Cause
- Database migration 024 (`024_complete_enum_to_arabic_migration.sql`) already converts camp status to Arabic
- Backend `/api/camps` routes return and accept Arabic status values
- Frontend `CampsManagement.tsx` Edit Camp modal was still using hardcoded English values in the dropdown

## Changes Made

### File: `views/admin/CampsManagement.tsx`

#### 1. Updated Edit Camp State Type
**Before:**
```typescript
const [editCamp, setEditCamp] = useState({
  // ... other fields
  status: 'active' as 'active' | 'pending' | 'full'
});
```

**After:**
```typescript
const [editCamp, setEditCamp] = useState({
  // ... other fields
  status: 'نشط' as 'نشط' | 'قيد الانتظار' | 'ممتلئ'
});
```

#### 2. Updated Edit Camp Modal Dropdown
**Before:**
```tsx
<select value={editCamp.status} onChange={...}>
  <option value="active">نشط</option>
  <option value="pending">معلق</option>
  <option value="full">ممتلئ</option>
</select>
```

**After:**
```tsx
<select value={editCamp.status} onChange={...}>
  <option value="نشط">نشط</option>
  <option value="قيد الانتظار">قيد الانتظار</option>
  <option value="ممتلئ">ممتلئ</option>
</select>
```

#### 3. Updated handleEditCamp Function
Added status mapping to handle both English and Arabic values from the backend:

```typescript
const handleEditCamp = (camp: Camp) => {
  setSelectedCamp(camp);
  
  // Map status from English to Arabic if needed
  let statusValue: 'نشط' | 'قيد الانتظار' | 'ممتلئ' = 'نشط';
  const campStatus = camp.status?.toLowerCase();
  
  if (campStatus === 'نشط' || campStatus === 'active') {
    statusValue = 'نشط';
  } else if (campStatus === 'قيد الانتظار' || campStatus === 'pending') {
    statusValue = 'قيد الانتظار';
  } else if (campStatus === 'ممتلئ' || campStatus === 'full') {
    statusValue = 'ممتلئ';
  }
  
  setEditCamp({
    name: camp.name,
    managerName: camp.managerName || camp.manager_name || '',
    capacity: camp.capacity,
    address: camp.location?.address || camp.location_address || '',
    governorate: (camp.location as any)?.governorate || camp.location_governorate || '',
    area: (camp.location as any)?.area || camp.location_area || '',
    status: statusValue
  });
  // ... rest of the function
};
```

## Database Schema Reference

From `024_complete_enum_to_arabic_migration.sql`:

```sql
-- Camps status (status): 'نشط', 'قيد الانتظار', 'ممتلئ' - DEFAULT: 'نشط'
UPDATE camps SET status = 'نشط' WHERE status = 'active';
UPDATE camps SET status = 'قيد الانتظار' WHERE status = 'pending';
UPDATE camps SET status = 'ممتلئ' WHERE status = 'full';

-- Add constraint
ALTER TABLE camps ADD CONSTRAINT camps_status_check
  CHECK (status IN ('نشط', 'قيد الانتظار', 'ممتلئ'));
```

## Testing Checklist

- [ ] Open Camps Management page as System Admin
- [ ] Click "Edit" on a camp with status "نشط" (Active)
- [ ] Verify dropdown shows "نشط" selected
- [ ] Change status to "قيد الانتظار" (Pending)
- [ ] Save and verify the change is persisted
- [ ] Edit the same camp again and verify "قيد الانتظار" is selected
- [ ] Test with "ممتلئ" (Full) status
- [ ] Verify View Camp modal displays status correctly in Arabic

## Related Files

- **Frontend**: `views/admin/CampsManagement.tsx`
- **Backend Routes**: `backend/routes/camps.js`
- **Database Migration**: `backend/database/migrations/024_complete_enum_to_arabic_migration.sql`
- **TypeScript Types**: `types.ts` (Camp interface)

## Impact

- ✅ Edit Camp modal now displays Arabic status values correctly
- ✅ Status selection uses Arabic values consistently
- ✅ Backend receives Arabic status values (already supported)
- ✅ Backward compatible with any existing English values in database
- ✅ Consistent with other Arabic enum values in the system

## Notes

- The View Camp modal was already displaying Arabic status correctly
- The Add Camp modal doesn't have a status dropdown (defaults to 'نشط')
- This fix ensures consistency across all camp management operations
