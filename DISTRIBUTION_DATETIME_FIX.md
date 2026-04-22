# Distribution Date/Time Fix

## Issue
The distribution timestamp was not showing the correct date and time - it was only storing the date (YYYY-MM-DD) without the time component.

## Root Cause
The `distribution_date` column in both `aid_distributions` and `distributions` tables was defined as `DATE` type, which only stores the date without time information.

Additionally:
- Frontend was sending date-only format: `new Date().toISOString().split('T')[0]`
- Backend was converting to date-only: `dateObj.toISOString().split('T')[0]`
- Database trigger was using `NEW.distribution_date` directly, which had no time component

## Solution

### 1. Database Schema Changes

**Files Updated:**
- `backend/database/database_schema_unified.sql`
- `backend/database/database_schema_unified_with_if_not_exists.sql`

**Changes:**
```sql
-- Before
distribution_date DATE NOT NULL

-- After
distribution_date TIMESTAMP WITH TIME ZONE NOT NULL
```

### 2. Database Trigger Update

**Updated trigger function:** `update_inventory_on_distribution()`

```sql
-- Added transaction_time variable
DECLARE
  transaction_time TIMESTAMP WITH TIME ZONE;

-- Use distribution_date with fallback to NOW()
transaction_time := COALESCE(NEW.distribution_date, NOW());

-- Use transaction_time in INSERT
processed_at,
is_deleted
) VALUES (
  ...
  transaction_time,  -- Instead of NEW.distribution_date
  FALSE
);
```

### 3. Frontend Changes

**File:** `views/camp-manager/DistributionDetails.tsx`

```typescript
// Before
const distributionDate = new Date().toISOString().split('T')[0]; // DATE only

// After
const distributionDate = new Date().toISOString(); // Full ISO timestamp
```

### 4. Backend Changes

**File:** `backend/routes/aid.js`

```javascript
// Before
// Convert to DATE format (YYYY-MM-DD)
distributionData.distribution_date = dateObj.toISOString().split('T')[0];

// After
// Keep as full ISO timestamp (YYYY-MM-DDTHH:mm:ss.sssZ)
distributionData.distribution_date = dateObj.toISOString();
```

### 5. Migration File

**File:** `backend/db/migrations/045_fix_distribution_date_timestamp.sql`

```sql
-- Alter aid_distributions table
ALTER TABLE aid_distributions 
  ALTER COLUMN distribution_date TYPE TIMESTAMP WITH TIME ZONE 
  USING distribution_date::TIMESTAMP WITH TIME ZONE;

-- Alter distributions table (legacy)
ALTER TABLE distributions 
  ALTER COLUMN distribution_date TYPE TIMESTAMP WITH TIME ZONE 
  USING distribution_date::TIMESTAMP WITH TIME ZONE;
```

## How to Apply

### Option 1: Run Migration (Recommended for existing databases)

```bash
psql -U postgres -d your_database -f backend/db/migrations/045_fix_distribution_date_timestamp.sql
```

### Option 2: Recreate Database (For new installations)

The schema files already include the fix, so new databases will have the correct column types.

## Expected Behavior After Fix

### Distribution
- **Before:** `2026-03-22 00:00:00` (midnight)
- **After:** `2026-03-22 14:35:22.123` (actual time of distribution)

### Inventory Transaction Ledger
- Distribution transactions now show the exact time of distribution
- Undo transactions show the exact time of undo (already worked correctly)

### Distribution History
- Shows full date and time: `22/03/2026 2:35 PM` instead of just `22/03/2026`

## Files Modified

1. `backend/database/database_schema_unified.sql` - Updated column type and trigger
2. `backend/database/database_schema_unified_with_if_not_exists.sql` - Updated column type and trigger
3. `backend/db/migrations/045_fix_distribution_date_timestamp.sql` - New migration file
4. `backend/routes/aid.js` - Keep full ISO timestamp
5. `views/camp-manager/DistributionDetails.tsx` - Send full ISO timestamp

## Testing

1. **Create a new distribution** - Check that `distribution_date` includes time
2. **View inventory ledger** - Transaction should show correct timestamp
3. **View distribution history** - Should display date AND time
4. **Undo distribution** - Should still work correctly with proper timestamp
