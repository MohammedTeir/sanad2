# Test Script for Distribution Fix

## Quick Test (5 minutes)

### Prerequisites
- Backend server running (`npm run dev` in backend folder)
- Logged in as CAMP_MANAGER
- Have at least:
  - 1 inventory item with quantity > 0
  - 1 aid campaign linked to that inventory item
  - 1 registered family in the camp

### Test Steps

#### 1. Initial State Check
Before creating a distribution:

**Inventory Ledger**:
- Go to Inventory Ledger page
- Note the current quantity of the inventory item
- Check if there are any existing transactions

**Distribution History**:
- Go to Distribution History page
- Note the current number of distributions

**Browser Console**:
- Open browser DevTools (F12)
- Go to Console tab
- Clear console

#### 2. Create Distribution

**DistributionDetails Page**:
```
1. Go to Distribution Management → Select a campaign → Distribution Details
2. Click "توزيع" (Distribute) on a family
3. Fill in the form:
   - Quantity: 1
   - Signature: Confirmed
4. Submit
```

**Expected Console Logs**:
```
[Distribution] Distribution data: { quantity: 1, family_id: '...' }
[Distribution] Distribution record created successfully with ID: '...'
[Distribution] Waiting 200ms for database commit...
[Distribution] Inventory transaction created successfully
```

**Expected Backend Logs**:
```
[Distribution] Creating inventory transaction for distribution: {
  distributionId: '...',
  itemId: '...',
  quantity: 1,
  campaignName: '...'
}
[Distribution] Inventory transaction created successfully
```

#### 3. Verify Distribution History

**Immediately After Distribution**:
```
1. Go to Distribution History page
2. Refresh if needed
3. Look for the new distribution
```

**Expected Console Logs**:
```
[DistributionHistory] Loading distributions for camp: '...'
[DistributionHistory] Calling getDistributionsByCamp...
[DistributionHistory] Raw distributions from API: [...]
[DistributionHistory] API response count: 1 (or more)
[DistributionHistory] Loaded distributions: [...]
```

**Expected Result**:
- ✅ New distribution appears in the table
- ✅ Shows correct family name
- ✅ Shows correct campaign name
- ✅ Shows correct quantity
- ✅ Shows correct date/time

#### 4. Verify Inventory Ledger

**Check Ledger**:
```
1. Go to Inventory Ledger page
2. Look for new transaction
```

**Expected Console Logs**:
```
Loading transactions with filters: {}
Transactions loaded: [...]
```

**Expected Result**:
- ✅ New transaction appears with type "صادر" (out)
- ✅ Related to: "توزيع" (distribution)
- ✅ Quantity matches the distribution
- ✅ Processed by current user

#### 5. Verify Inventory Quantity

**Check Quantity**:
```
1. Go to Inventory page
2. Find the item
3. Check quantity
```

**Expected Result**:
- ✅ Quantity reduced by distribution amount
- Example: If initial was 100 and distributed 1, now shows 99

#### 6. Undo Distribution

**Undo**:
```
1. Go back to Distribution History
2. Find the distribution you just created
3. Click the undo button (trash icon)
4. Confirm the undo
```

**Expected Console Logs**:
```
[Undo] === UNDO STARTED ===
[Undo] Fetching distribution by ID: '...'
[Undo] Distribution fetched: {...}
[Undo] Distribution record deleted: '...'
[Undo] Campaign distributedTo updated
[Undo] Reloading campaign, inventory, and distribution history...
```

**Expected Backend Logs**:
```
[Undo Distribution] Creating inventory transaction to restore inventory: {
  distributionId: '...',
  itemId: '...',
  quantity: 1,
  campaignName: '...'
}
[Undo Distribution] Inventory restoration transaction created successfully
```

#### 7. Verify Undo in Ledger

**Check Ledger Again**:
```
1. Go to Inventory Ledger
2. Refresh if needed
3. Look for the reversal transaction
```

**Expected Result**:
- ✅ New transaction appears with type "وارد" (in)
- ✅ Related to: "توزيع" (distribution)
- ✅ Quantity matches the original distribution
- ✅ Now shows 2 transactions:
  - Original: صادر (out)
  - Reversal: وارد (in)

#### 8. Verify Inventory Quantity Restored

**Check Quantity**:
```
1. Go to Inventory page
2. Find the same item
3. Check quantity
```

**Expected Result**:
- ✅ Quantity restored to original value
- Example: If was 99 after distribution, now back to 100

## Troubleshooting

### Distribution Not Appearing in History

**Check 1**: Verify distribution was created
```sql
SELECT * FROM aid_distributions 
ORDER BY distribution_date DESC 
LIMIT 5;
```

**Check 2**: Verify camp ID matches
```sql
SELECT 
  d.id,
  d.family_id,
  d.campaign_id,
  f.camp_id as family_camp_id,
  c.camp_id as campaign_camp_id
FROM aid_distributions d
JOIN families f ON d.family_id = f.id
JOIN aid_campaigns c ON d.campaign_id = c.id
ORDER BY d.distribution_date DESC;
```

### Inventory Transaction Not Appearing

**Check 1**: Verify transaction was created
```sql
SELECT 
  it.*,
  ii.name as item_name
FROM inventory_transactions it
LEFT JOIN inventory_items ii ON it.item_id = ii.id
ORDER BY it.processed_at DESC 
LIMIT 10;
```

**Check 2**: Check backend logs for errors
```bash
# Look for these patterns:
[Distribution] Creating inventory transaction
[Distribution] Failed to create inventory transaction
```

**Check 3**: Verify trigger exists
```sql
SELECT * FROM information_schema.triggers 
WHERE trigger_name = 'update_inventory_trigger' 
AND event_object_table = 'aid_distributions';
```

Expected: 3 rows (INSERT, UPDATE, DELETE)

### Quantity Not Updating

**Check 1**: Manual quantity check
```sql
-- Get current quantity
SELECT id, name, quantity_available 
FROM inventory_items 
WHERE camp_id = 'YOUR_CAMP_ID';

-- Get recent distributions
SELECT 
  d.id,
  d.quantity,
  d.distribution_date,
  c.name as campaign_name,
  ii.name as item_name,
  ii.inventory_item_id
FROM aid_distributions d
JOIN aid_campaigns c ON d.campaign_id = c.id
LEFT JOIN inventory_items ii ON c.inventory_item_id = ii.id
WHERE d.is_deleted = false
ORDER BY d.distribution_date DESC
LIMIT 10;
```

**Check 2**: Calculate expected quantity
```sql
-- For a specific inventory item
SELECT 
  ii.id,
  ii.name,
  ii.quantity_available as current_qty,
  (
    SELECT COALESCE(SUM(it.quantity), 0) 
    FROM inventory_transactions it 
    WHERE it.item_id = ii.id 
    AND it.transaction_type = 'وارد' 
    AND it.is_deleted = false
  ) as total_in,
  (
    SELECT COALESCE(SUM(it.quantity), 0) 
    FROM inventory_transactions it 
    WHERE it.item_id = ii.id 
    AND it.transaction_type = 'صادر' 
    AND it.is_deleted = false
  ) as total_out,
  ii.quantity_available + 
  (
    SELECT COALESCE(SUM(it.quantity), 0) 
    FROM inventory_transactions it 
    WHERE it.item_id = ii.id 
    AND it.transaction_type = 'وارد' 
    AND it.is_deleted = false
  ) - 
  (
    SELECT COALESCE(SUM(it.quantity), 0) 
    FROM inventory_transactions it 
    WHERE it.item_id = ii.id 
    AND it.transaction_type = 'صادر' 
    AND it.is_deleted = false
  ) as calculated_qty
FROM inventory_items ii
WHERE ii.camp_id = 'YOUR_CAMP_ID';
```

## Success Criteria

All of these must be true:

- [ ] Distribution created successfully
- [ ] Distribution appears in DistributionHistory
- [ ] Inventory transaction created (type: صادر)
- [ ] Transaction appears in InventoryLedger
- [ ] Inventory quantity reduced
- [ ] Undo distribution works
- [ ] Reversal transaction created (type: وارد)
- [ ] Reversal appears in InventoryLedger
- [ ] Inventory quantity restored

## Next Steps After Successful Test

1. **Monitor Production**: Watch for any errors in backend logs
2. **User Feedback**: Ask users if they see the distributions and ledger entries
3. **Performance**: Check if the additional INSERT query causes any slowdown
4. **Database Cleanup**: If there were any orphaned records, clean them up

## Rollback Plan

If something goes wrong:

1. **Stop Backend**: `Ctrl+C` in backend terminal
2. **Revert Code**: 
   ```bash
   git checkout backend/routes/aid.js
   ```
3. **Restart Backend**: `npm run dev`
4. **Check Data**: Verify no duplicate transactions were created

## Contact

If you encounter any issues not covered here, check:
- Backend logs for error messages
- Browser console for client-side errors
- Database logs for trigger errors
- `DISTRIBUTION_HISTORY_LEDGER_FIX.md` for detailed documentation
