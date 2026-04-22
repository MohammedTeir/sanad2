# Soft Delete Implementation for Aid and Inventory Tables

## Overview

This migration adds soft delete functionality to all aid-related and inventory tables to preserve historical records and maintain complete audit trails.

## Migrations

### Migration 040: `aid_campaigns`
- **File**: `040_add_soft_delete_to_aid_campaigns.sql`
- **Tables**: `aid_campaigns`
- **Columns Added**:
  - `is_deleted` BOOLEAN DEFAULT FALSE
  - `deleted_at` TIMESTAMP WITH TIME ZONE
  - `deleted_by` UUID REFERENCES users(id)

### Migration 041: All Aid and Inventory Tables
- **File**: `041_add_soft_delete_to_all_aid_tables.sql`
- **Tables**:
  - `distributions` (distribution campaigns)
  - `distribution_records` (individual distribution records)
  - `inventory` (legacy inventory table)
  - `inventory_transactions` (inventory movement records)
  - `inventory_audits` (inventory audit records)
  - `aid_distributions` (aid distribution transactions)
- **Columns Added** (to each table):
  - `is_deleted` BOOLEAN DEFAULT FALSE
  - `deleted_at` TIMESTAMP WITH TIME ZONE
  - `deleted_by` UUID REFERENCES users(id)

## Tables with Soft Delete

After applying these migrations, the following tables will have soft delete support:

| Table | Already Had Soft Delete | Migration Added |
|-------|------------------------|-----------------|
| `families` | ✅ Yes | - |
| `individuals` | ✅ Yes | - |
| `aids` | ✅ Yes | - |
| `inventory_items` | ✅ Yes | - |
| `aid_campaigns` | ❌ No | 040 |
| `distributions` | ❌ No | 041 |
| `distribution_records` | ❌ No | 041 |
| `inventory` | ❌ No | 041 |
| `inventory_transactions` | ❌ No | 041 |
| `inventory_audits` | ❌ No | 041 |
| `aid_distributions` | ❌ No | 041 |

## Backend Implementation

### Delete Endpoints Updated

All delete endpoints now perform soft deletes instead of hard deletes:

1. **DELETE /aid/campaigns/:id** - Sets `is_deleted=true`, `deleted_at=NOW()`
2. **DELETE /aid/distributions/:id** - Sets `is_deleted=true`, `deleted_at=NOW()`
3. **DELETE /inventory/:id** - Sets `is_deleted=true`, `deleted_at=NOW()`
4. **DELETE /inventory-items/:id** - Already had soft delete

### Query Filters

By default, queries exclude soft-deleted records:

```sql
-- Example: Get all active campaigns
SELECT * FROM aid_campaigns 
WHERE deleted_at IS NULL OR deleted_at IS NULL;

-- Example: Get all campaigns including deleted (for history pages)
SELECT * FROM aid_campaigns 
WHERE includeDeleted = true; -- Backend handles this
```

## Frontend Implementation

### History Pages Include Deleted Records

Pages that show historical data (like Distribution History) now fetch records including soft-deleted ones:

```typescript
// DistributionHistory.tsx
const campaigns = await realDataService.getAidCampaigns(true); // includeDeleted=true
```

## Applying the Migrations

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Migration 040: aid_campaigns
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE aid_campaigns ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_deleted ON aid_campaigns(is_deleted);
CREATE INDEX IF NOT EXISTS idx_aid_campaigns_deleted_at ON aid_campaigns(deleted_at);

-- Migration 041: All other tables
-- (See 041_add_soft_delete_to_all_aid_tables.sql for full SQL)
```

## Rollback

If you need to rollback, each migration file includes rollback instructions at the bottom.

## Best Practices

1. **Never hard delete** aid-related data - always use soft delete
2. **History pages** should include deleted records (use `includeDeleted=true`)
3. **Regular views** should exclude deleted records by default
4. **Audit trails** are preserved - deleted records maintain their `deleted_by` and `deleted_at` fields
5. **Foreign keys** are preserved - soft-deleted parent records still maintain referential integrity

## Related Files

- `backend/routes/aid.js` - Updated delete endpoints
- `services/realDataServiceBackend.ts` - Updated service methods
- `views/camp-manager/DistributionHistory.tsx` - Example of history page with deleted records
