# Campaign Soft Delete Fix

## Problem
When deleting an aid campaign, the campaign was being soft-deleted correctly (logged to `soft_deletes` table, `is_deleted=true`, `deleted_at` timestamp set), but it was still appearing in the main campaigns table in the UI.

## Root Cause
The backend's `formatCampaign()` function in `/backend/routes/aid.js` was **not including** the soft delete fields (`is_deleted` and `deleted_at`) in the transformed response sent to the frontend.

The frontend's filter in `AidCampaigns.tsx` was checking for these fields:
```typescript
if (campaign.is_deleted || campaign.deleted_at || campaign.deletedAt) return false;
```

But since the backend wasn't sending them, the filter always evaluated to `false` and deleted campaigns were displayed.

## Solution

### 1. Backend Fix (`/backend/routes/aid.js`)
Updated the `formatCampaign()` function to include the soft delete fields:

```javascript
const formatCampaign = (campaign) => ({
  // ... existing fields ...
  isDeleted: campaign.is_deleted,      // Added
  deletedAt: campaign.deleted_at,      // Added
  createdAt: campaign.created_at,
  updatedAt: campaign.updated_at
});
```

### 2. Frontend Fix (`/views/camp-manager/AidCampaigns.tsx`)

#### a. Updated TypeScript Interface
```typescript
interface AidCampaign {
  // ... existing fields ...
  isDeleted?: boolean;    // Changed from is_deleted
  deletedAt?: string;     // Kept as deletedAt
}
```

#### b. Updated All Filter Checks
Changed all occurrences from checking snake_case to camelCase:
- `!c.is_deleted && !c.deleted_at && !c.deletedAt` → `!c.isDeleted && !c.deletedAt`
- `c.is_deleted || c.deleted_at || c.deletedAt` → `c.isDeleted || c.deletedAt`

This was applied to:
- Main campaigns table filter (line 889)
- Family aid filter (line 825)
- Benefit count filter (line 868)
- Active/deleted campaign separation (lines 1916-1921)
- Inventory item checks (multiple locations)

## Files Changed
1. `/backend/routes/aid.js` - Added `isDeleted` and `deletedAt` to `formatCampaign()`
2. `/views/camp-manager/AidCampaigns.tsx` - Updated interface and all filter checks

## Testing
After restarting the backend server:
1. Delete a campaign
2. Verify the campaign does NOT appear in the main campaigns table
3. Verify the campaign DOES appear when filtering with `includeDeleted=true` (for family aid history checks)
4. Verify deleted campaigns are still logged to the `soft_deletes` table

## Notes
- The backend transforms snake_case (database format) to camelCase (frontend format)
- Inventory items already had this transformation, so their checks were also updated for consistency
- The fix maintains backward compatibility by checking both field name formats during transition
