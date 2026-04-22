# Backend & Frontend Updates for Soft Delete

## Summary

After applying migrations 040 and 041, the backend code has been updated to use soft delete for all aid-related tables.

## Backend Changes Completed

### 1. Routes Updated (`backend/routes/aid.js`)

#### ✅ Delete Endpoints - Now Using Soft Delete

| Endpoint | Table | Status |
|----------|-------|--------|
| `DELETE /aid/types/:id` | `aids` | ✅ Already had soft delete |
| `DELETE /aid/campaigns/:id` | `aid_campaigns` | ✅ Updated (Migration 040) |
| `DELETE /aid/distributions/:id` | `aid_distributions` | ✅ Updated (Migration 041) |

#### ✅ GET Endpoints - Filter Soft-Deleted Records

| Endpoint | Filter Added | Notes |
|----------|--------------|-------|
| `GET /aid/distributions` | ✅ `is_deleted=false` | Excludes deleted by default |
| `GET /aid/distributions/camp/:campId` | ✅ `is_deleted=false` | Excludes deleted by default |
| `GET /aid/distributions/family/:familyId` | ⚠️ Needs update | Family-specific, may keep as-is |
| `GET /aid/distributions/campaign/:campaignId` | ⚠️ Needs update | Campaign-specific, may keep as-is |
| `GET /aid/campaigns` | ✅ `deleted_at IS NULL` | Supports `includeDeleted=true` |

### 2. Routes That May Need Updates

The following endpoints might need soft delete support if they're used:

- `distributions` (legacy table) - No delete endpoint exists
- `distribution_records` (legacy table) - No delete endpoint exists
- `inventory` (legacy table) - Has soft delete columns, check if delete endpoint exists
- `inventory_transactions` - No delete endpoint exists
- `inventory_audits` - No delete endpoint exists

### 3. Frontend Changes

#### ✅ No Major Changes Required

The frontend service methods automatically benefit from backend soft delete:

```typescript
// services/realDataServiceBackend.ts
async getDistributions(): Promise<any[]> {
  const response = await makeAuthenticatedRequest('/aid/distributions');
  return response || [];
}

async getDistributionsByCamp(campId: string): Promise<any[]> {
  const response = await makeAuthenticatedRequest(`/aid/distributions/camp/${campId}`);
  return response || [];
}
```

These methods now automatically exclude soft-deleted records by default.

#### ✅ History Pages Include Deleted Records

```typescript
// views/camp-manager/DistributionHistory.tsx
const loadCampaigns = useCallback(async () => {
  // Include deleted campaigns for history page
  const data = await realDataService.getAidCampaigns(true); // includeDeleted=true
  // ...
}, []);
```

## Testing Checklist

After applying migrations and deploying:

1. **Test Distribution History Page**:
   - [ ] Verify distributions load correctly
   - [ ] Verify campaigns (including deleted) show in filter dropdown
   - [ ] Create a distribution, then delete it
   - [ ] Verify deleted distribution doesn't show in normal view
   - [ ] Verify deleted distribution still shows in history page

2. **Test Campaign Deletion**:
   - [ ] Create a campaign
   - [ ] Delete the campaign
   - [ ] Verify campaign is soft-deleted (check database)
   - [ ] Verify campaign doesn't show in normal dropdown
   - [ ] Verify campaign shows when `includeDeleted=true`

3. **Test Distribution Deletion**:
   - [ ] Create a distribution
   - [ ] Delete the distribution
   - [ ] Verify `is_deleted=true` and `deleted_at` is set
   - [ ] Verify distribution doesn't show in normal queries

## Database Migration Required

**Run these migrations in order:**

1. `040_add_soft_delete_to_aid_campaigns.sql`
2. `041_add_soft_delete_to_all_aid_tables.sql`

See `SOFT_DELETE_AID_INVENTORY_README.md` for detailed migration instructions.

## Files Modified

### Backend
- `backend/routes/aid.js` - Updated delete and get endpoints
- `backend/database/database_schema_unified.sql` - Added soft delete columns
- `backend/database/database_schema_unified_with_if_not_exists.sql` - Added soft delete columns

### Frontend
- `services/realDataServiceBackend.ts` - Added `includeDeleted` parameter support
- `views/camp-manager/DistributionHistory.tsx` - Uses `includeDeleted=true` for campaigns

### Migrations
- `backend/database/migrations/040_add_soft_delete_to_aid_campaigns.sql`
- `backend/database/migrations/041_add_soft_delete_to_all_aid_tables.sql`
- `backend/database/migrations/SOFT_DELETE_AID_INVENTORY_README.md`

## Remaining Work (Optional)

If you want complete soft delete coverage:

1. **Update legacy table endpoints** (if they're still used):
   - Add soft delete to `distributions` table delete endpoint
   - Add soft delete to `distribution_records` table delete endpoint
   - Add soft delete to `inventory` table delete endpoint (legacy)
   - Add soft delete to `inventory_transactions` table delete endpoint
   - Add soft delete to `inventory_audits` table delete endpoint

2. **Add includeDeleted support to more endpoints**:
   - `GET /aid/distributions/family/:familyId` - Add `includeDeleted` query param
   - `GET /aid/distributions/campaign/:campaignId` - Add `includeDeleted` query param

3. **Update inventory routes** (`backend/routes/inventory.js`):
   - Verify `GET /inventory` endpoints filter deleted records
   - Add soft delete to transaction and audit delete endpoints (if they exist)
