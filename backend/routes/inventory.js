// backend/routes/inventory.js
const express = require('express');
const { supabase } = require('../db/connection');
const { authenticateToken, authorizeRole, authorizeResourceAction } = require('../middleware/auth');
const { getMessage, getDatabaseErrorMessage } = require('../utils/arabicMessages');
const router = express.Router();

// Helper function to format inventory item data
const formatInventoryItem = (item) => ({
  id: item.id,
  campId: item.camp_id,
  name: item.name,
  nameAr: item.name,
  category: item.category,
  unit: item.unit,
  unitAr: item.unit,
  quantityAvailable: item.quantity_available,
  quantityReserved: item.quantity_reserved,
  minStock: item.min_stock,
  maxStock: item.max_stock,
  minAlertThreshold: item.min_alert_threshold,
  expiryDate: item.expiry_date,
  donor: item.donor,
  receivedDate: item.received_date,
  notes: item.notes,
  isActive: item.is_active,
  is_active: item.is_active,
  isDeleted: item.is_deleted,
  deletedAt: item.deleted_at,
  createdAt: item.created_at,
  updatedAt: item.updated_at
});

// Helper function to format transaction data
const formatTransaction = (tx) => {
  // Extract user info from nested structure
  const userInfo = tx.processed_by_user;
  const familyInfo = userInfo?.families?.[0] || userInfo?.families;

  // Native Arabic values from database are used directly
  const transactionType = tx.transaction_type;
  const relatedTo = tx.related_to;

  return {
    id: tx.id,
    itemId: tx.item_id,
    itemName: tx.inventory_items?.name || null,
    transactionType: transactionType,
    quantity: tx.quantity,
    relatedTo: relatedTo,
    relatedId: tx.related_id,
    notes: tx.notes,
    processedByUserId: tx.processed_by_user_id,
    processorName: userInfo ? `${userInfo.first_name || ''} ${userInfo.last_name || ''}`.trim() : null,
    processorNationalId: familyInfo?.head_of_family_national_id || null,
    processorRole: userInfo?.role || null,
    processedAt: tx.processed_at,
    createdAt: tx.created_at
  };
};

// Get all inventory items (with optional camp filter)
router.get('/', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER', 'FIELD_OFFICER'], 'inventory', 'read'), async (req, res, next) => {
  try {
    console.log('=== GET INVENTORY ITEMS ===');
    console.log('User role:', req.user.role);
    console.log('User campId:', req.user.campId);
    console.log('Query params:', req.query);
    console.log('Timestamp:', new Date().toISOString());

    // Check if user wants to include deleted records (admin only) or if we need to include referenced deleted items
    const { includeDeleted, includeReferencedDeleted, isActive, _t } = req.query; // _t is cache-busting timestamp
    const showDeleted = includeDeleted === 'true' && req.user.role === 'SYSTEM_ADMIN';
    const showReferencedDeleted = includeReferencedDeleted === 'true';

    let query = supabase.from('inventory_items').select('*');

    // Filter out soft-deleted and inactive records unless explicitly requested
    if (!showDeleted) {
      if (showReferencedDeleted) {
        // Get active campaigns that reference inventory items
        const { data: activeCampaigns } = await supabase
          .from('aid_campaigns')
          .select('inventory_item_id')
          .is('deleted_at', null)
          .not('inventory_item_id', 'is', null);

        const referencedItemIds = activeCampaigns
          ?.map(c => c.inventory_item_id)
          .filter(id => id !== null) || [];

        // Include active items OR deleted items that are referenced by active campaigns
        if (referencedItemIds.length > 0) {
          // Build filter: include items where is_deleted=false OR (is_deleted=true AND id in referencedItemIds)
          query = query.or(`is_deleted.eq.false,and(is_deleted.eq.true,id.in.(${referencedItemIds.join(',')}))`);
        } else {
          query = query.eq('is_deleted', false);
        }
        // Optionally filter by is_active if specified
        if (isActive !== undefined) {
          query = query.eq('is_active', isActive === 'true');
        }
      } else {
        // Standard behavior: only non-deleted items (include both active and inactive)
        query = query.eq('is_deleted', false);

        // Optionally filter by is_active if specified
        if (isActive !== undefined) {
          query = query.eq('is_active', isActive === 'true');
        }
      }
    }

    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER' || req.user.role === 'FIELD_OFFICER') {
      // Limit to inventory items for user's camp
      console.log('Filtering by camp_id:', req.user.campId);
      query = query.eq('camp_id', req.user.campId);
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Apply optional camp filter from query params
    const { campId } = req.query;
    if (campId && req.user.role === 'SYSTEM_ADMIN') {
      query = query.eq('camp_id', campId);
    }

    // Order by name for consistent display, but Supabase will return fresh data
    const { data: inventoryItems, error } = await query.order('name', { ascending: true });

    if (error) {
      console.error('Error fetching inventory items:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    console.log('[GET Inventory] Raw data from database:', inventoryItems.map(i => ({
      id: i.id,
      name: i.name,
      quantity_available: i.quantity_available,
      updated_at: i.updated_at
    })));

    console.log('Found', inventoryItems.length, 'inventory items');
    if (inventoryItems.length > 0) {
      console.log('Sample item:', {
        id: inventoryItems[0].id,
        name: inventoryItems[0].name,
        quantity_available: inventoryItems[0].quantity_available,
        updated_at: inventoryItems[0].updated_at
      });
      // Log ALL items for debugging
      console.log('All items:', inventoryItems.map(i => ({
        id: i.id,
        name: i.name,
        quantity_available: i.quantity_available,
        updated_at: i.updated_at
      })));
    }

    res.json(inventoryItems.map(formatInventoryItem));
  } catch (error) {
    console.error('Get inventory error:', error);
    next(error);
  }
});

// Get inventory transactions (ledger) - MUST be before /:itemId route
router.get('/transactions', authenticateToken, async (req, res, next) => {
  try {
    console.log('User role:', req.user.role);
    console.log('User campId:', req.user.campId);

    // Apply filters based on user role
    if (req.user.role === 'CAMP_MANAGER') {
      if (!req.user.campId) {
        console.error('CAMP_MANAGER without campId in token');
        return res.status(400).json({ error: 'Camp ID not found in token. Please log out and log in again.' });
      }

      // Get transactions for items in user's camp OR items without camp_id
      const { data: campTransactions, error: campError } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          inventory_items!left (
            id,
            name,
            camp_id
          ),
          processed_by_user:users!inventory_transactions_processed_by_user_id_fkey (
            id,
            first_name,
            last_name,
            role,
            family_id,
            families (
              id,
              head_of_family_national_id
            )
          )
        `)
        .eq('inventory_items.camp_id', req.user.campId)
        .order('processed_at', { ascending: false });

      const { data: nullCampTransactions, error: nullError } = await supabase
        .from('inventory_transactions')
        .select(`
          *,
          inventory_items!left (
            id,
            name,
            camp_id
          ),
          processed_by_user:users!inventory_transactions_processed_by_user_id_fkey (
            id,
            first_name,
            last_name,
            role,
            family_id,
            families (
              id,
              head_of_family_national_id
            )
          )
        `)
        .is('inventory_items.camp_id', null)
        .order('processed_at', { ascending: false });

      // Combine results
      let transactions = [];
      if (campTransactions && !campError) transactions = [...campTransactions];
      if (nullCampTransactions && !nullError) {
        // Filter out duplicates
        const existingIds = new Set(transactions.map(t => t.id));
        nullCampTransactions.forEach(t => {
          if (!existingIds.has(t.id)) transactions.push(t);
        });
      }

      if (campError && nullError) {
        console.error('Database errors:', campError, nullError);
        return res.status(500).json({ error: getDatabaseErrorMessage(campError || nullError) });
      }

      console.log('Transactions found:', transactions.length);
      res.json(transactions.map(formatTransaction));
      return;
    } else if (req.user.role === 'FIELD_OFFICER') {
      return res.status(403).json({ error: getMessage('inventory', 'fieldOfficersNoAccessLedger', 'Field officers cannot access inventory ledger') });
    } else if (req.user.role !== 'SYSTEM_ADMIN') {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // SYSTEM_ADMIN query
    let query = supabase.from('inventory_transactions').select(`
      *,
      inventory_items!left (
        id,
        name
      ),
      processed_by_user:users!inventory_transactions_processed_by_user_id_fkey (
        id,
        first_name,
        last_name,
        role,
        family_id,
        families (
          id,
          head_of_family_national_id
        )
      )
    `);

    // Apply optional filters from query params
    const { itemId, transactionType, relatedTo, startDate, endDate } = req.query;

    if (itemId) query = query.eq('item_id', itemId);
    if (transactionType) query = query.eq('transaction_type', transactionType);
    if (relatedTo) query = query.eq('related_to', relatedTo);
    if (startDate) query = query.gte('processed_at', startDate);
    if (endDate) query = query.lte('processed_at', endDate);

    const { data: transactions, error } = await query.order('processed_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    console.log('Transactions found:', transactions?.length || 0);
    res.json(transactions.map(formatTransaction));
  } catch (error) {
    console.error('Get inventory transactions error:', error);
    next(error);
  }
});

// Create inventory transaction - MUST be before /:itemId route
router.post('/transactions', authenticateToken, async (req, res, next) => {
  try {
    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    const { itemId, transactionType, quantity, relatedTo, relatedId, notes } = req.body;

    // Validate required fields
    if (!itemId || !transactionType || !quantity) {
      return res.status(400).json({ error: getMessage('inventory', 'transactionTypeRequired', 'Item ID, transaction type, and quantity are required') });
    }

    if (!['in', 'out', 'وارد', 'صادر'].includes(transactionType)) {
      return res.status(400).json({ error: getMessage('inventory', 'invalidTransactionType', 'Transaction type must be "in", "out", "وارد" or "صادر"') });
    }

    const validRelatedTo = ['purchase', 'donation', 'distribution', 'transfer', 'adjustment', 'damage', 'شراء', 'تبرع', 'توزيع', 'تحويل', 'تعديل', 'تلف'];
    if (!validRelatedTo.includes(relatedTo)) {
      return res.status(400).json({ error: getMessage('inventory', 'invalidRelatedTo', 'Invalid related_to value') });
    }

    // Verify item exists and belongs to user's camp
    // Fetch ALL quantity-related fields for proper validation
    const { data: item, error: itemError } = await supabase
      .from('inventory_items')
      .select('camp_id, quantity_available, quantity_reserved, min_stock, max_stock, min_alert_threshold')
      .eq('id', itemId)
      .single();

    if (itemError || !item) {
      return res.status(404).json({ error: getMessage('inventory', 'itemNotFound', 'Inventory item not found') });
    }

    // Check camp authorization for CAMP_MANAGER
    if (req.user.role === 'CAMP_MANAGER') {
      // If item has camp_id, it must match user's camp_id
      if (item.camp_id && item.camp_id !== req.user.campId) {
        return res.status(403).json({ error: getMessage('inventory', 'unauthorizedTransaction', 'Unauthorized to create transaction for this item') });
      }
      // If item.camp_id is NULL, allow CAMP_MANAGER to create transaction
      // This handles legacy items that don't have camp_id set yet
    }

    // For "out" transactions, perform comprehensive quantity validation
    if (transactionType === 'out' || transactionType === 'صادر') {
      const availableQty = parseFloat(item.quantity_available?.toString() || '0');
      const reservedQty = parseFloat(item.quantity_reserved?.toString() || '0');
      const minStock = parseFloat(item.min_stock?.toString() || '0');
      const maxStock = parseFloat(item.max_stock?.toString() || '0');
      const distributionQty = parseFloat(quantity);

      // Check 1: Cannot distribute more than available
      if (availableQty < distributionQty) {
        return res.status(400).json({
          error: getMessage('inventory', 'insufficientQuantity', 'Insufficient quantity available'),
          details: { available: availableQty, requested: distributionQty }
        });
      }

      // Check 2: Cannot distribute reserved quantity
      const distributableQty = availableQty - reservedQty;
      if (distributableQty < distributionQty) {
        return res.status(400).json({
          error: 'الكمية المطلوبة محجوزة ولا يمكن توزيعها',
          details: {
            available: availableQty,
            reserved: reservedQty,
            distributable: distributableQty,
            requested: distributionQty
          }
        });
      }

      // Check 3: Warn if distribution goes below minimum stock level (but allow with warning in response)
      const remainingAfterDistribution = availableQty - distributionQty;
      if (minStock > 0 && remainingAfterDistribution < minStock) {
        // Log warning but continue - this is a soft validation
        console.warn('[Inventory Warning] Distribution will go below minimum stock level:', {
          itemId,
          available: availableQty,
          minStock,
          remainingAfterDistribution,
          distributionQty
        });
        // Continue with transaction but include warning in response
      }

      // Check 4: Validate max_stock is not exceeded (for consistency, though this is 'out' transaction)
      if (maxStock > 0 && availableQty > maxStock) {
        console.warn('[Inventory Warning] Available quantity exceeds maximum stock:', {
          itemId,
          available: availableQty,
          maxStock
        });
      }
    }

    // For "in" transactions, validate max stock
    if (transactionType === 'in' || transactionType === 'وارد') {
      const availableQty = parseFloat(item.quantity_available?.toString() || '0');
      const maxStock = parseFloat(item.max_stock?.toString() || '0');
      const incomingQty = parseFloat(quantity);

      if (maxStock > 0 && (availableQty + incomingQty) > maxStock) {
        console.warn('[Inventory Warning] Incoming transaction will exceed maximum stock:', {
          itemId,
          available: availableQty,
          maxStock,
          incomingQty,
          newTotal: availableQty + incomingQty
        });
        // Continue with transaction but log warning
      }
    }

    // Create transaction
    // Map inputs to Arabic for database compatibility
    const transactionTypeArabic = (transactionType === 'in' || transactionType === 'وارد') ? 'وارد' : 'صادر';
    const relatedToArabic = {
      'purchase': 'شراء',
      'donation': 'تبرع',
      'distribution': 'توزيع',
      'transfer': 'تحويل',
      'adjustment': 'تعديل',
      'damage': 'تلف',
      'شراء': 'شراء',
      'تبرع': 'تبرع',
      'توزيع': 'توزيع',
      'تحويل': 'تحويل',
      'تعديل': 'تعديل',
      'تلف': 'تلف'
    }[relatedTo] || relatedTo;

    const transactionData = {
      item_id: itemId,
      transaction_type: transactionTypeArabic, // Convert to Arabic
      quantity: quantity,
      related_to: relatedToArabic, // Convert to Arabic
      related_id: relatedId || null,
      notes: notes || null,
      processed_by_user_id: req.user.userId,
      processed_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    console.log('[Inventory Transaction] Creating transaction with Arabic values:', {
      transaction_type: transactionTypeArabic,
      related_to: relatedToArabic,
      original_type: transactionType,
      original_related: relatedTo
    });

    const { data: transaction, error: txError } = await supabase
      .from('inventory_transactions')
      .insert([transactionData])
      .select()
      .single();

    if (txError) {
      console.error('[Inventory Transaction] Failed to create transaction:', txError);
      return res.status(500).json({ error: getDatabaseErrorMessage(txError) });
    }

    console.log('[Inventory Transaction] Transaction created successfully:', {
      transactionId: transaction.id,
      itemId,
      type: transactionType,
      quantity,
      relatedTo
    });

    // Update inventory item quantity - use parseFloat to ensure numeric handling
    const currentQty = parseFloat(item.quantity_available?.toString() || '0');
    const txQty = parseFloat(quantity);
    const newQuantity = (transactionType === 'in' || transactionType === 'وارد')
      ? currentQty + txQty
      : currentQty - txQty;

    console.log('[Inventory Update] Updating quantity:', {
      itemId,
      currentQty,
      transactionQty: txQty,
      transactionType,
      newQuantity
    });

    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        quantity_available: newQuantity,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (updateError) {
      console.error('[Inventory Update] Failed to update inventory item:', updateError);
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    console.log('[Inventory Update] Successfully updated inventory item:', {
      itemId,
      oldQuantity: currentQty,
      newQuantity
    });

    // Build response with warnings if any
    const responsePayload = formatTransaction(transaction);
    const warnings = [];

    if (transactionType === 'out' || transactionType === 'صادر') {
      const minStock = parseFloat(item.min_stock?.toString() || '0');
      const reservedQty = parseFloat(item.quantity_reserved?.toString() || '0');
      if (minStock > 0 && newQuantity < minStock) {
        warnings.push({
          code: 'BELOW_MIN_STOCK',
          message: `تحذير: الكمية المتبقية (${newQuantity}) أقل من الحد الأدنى (${minStock})`,
          remaining: newQuantity,
          minStock: minStock
        });
      }
      if (reservedQty > 0 && newQuantity < reservedQty) {
        warnings.push({
          code: 'BELOW_RESERVED',
          message: `تحذير: الكمية المتبقية (${newQuantity}) أقل من الكمية المحجوزة (${reservedQty})`,
          remaining: newQuantity,
          reserved: reservedQty
        });
      }
    }

    if (warnings.length > 0) {
      responsePayload.warnings = warnings;
    }

    res.status(201).json(responsePayload);
  } catch (error) {
    console.error('Create inventory transaction error:', error);
    next(error);
  }
});

// Get inventory item by ID - MUST be after /transactions routes
router.get('/:itemId', authenticateToken, async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const { data: item, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (error || !item) {
      return res.status(404).json({ error: getMessage('inventory', 'itemNotFound', 'Inventory item not found') });
    }

    // Check authorization
    if (req.user.role !== 'SYSTEM_ADMIN' && item.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('camps', 'accessDenied', 'Access denied') });
    }

    res.json(formatInventoryItem(item));
  } catch (error) {
    console.error('Get inventory item error:', error);
    next(error);
  }
});

// Create new inventory item
router.post('/', ...authorizeResourceAction(['SYSTEM_ADMIN', 'CAMP_MANAGER'], 'inventory', 'create'), async (req, res, next) => {
  try {
    // Check authorization (already enforced by authorizeResourceAction)
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    const {
      name,
      category,
      unit,
      minStock,
      min_stock,
      maxStock,
      max_stock,
      min_alert_threshold,
      minAlertThreshold,
      quantity_reserved,
      quantityReserved,
      expiry_date,
      expiryDate,
      donor,
      received_date,
      receivedDate,
      notes,
      is_active,
      isActive
    } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ error: getMessage('inventory', 'nameRequired', 'Name is required') });
    }

    if (!category) {
      return res.status(400).json({ error: getMessage('inventory', 'categoryRequired', 'Category is required') });
    }

    if (!unit) {
      return res.status(400).json({ error: getMessage('inventory', 'unitRequired', 'Unit is required') });
    }

    // Prepare item data
    const itemData = {
      name: name,
      category: category,
      unit: unit,
      min_stock: min_stock !== undefined ? min_stock : (minStock !== undefined ? minStock : (min_alert_threshold !== undefined ? min_alert_threshold : (minAlertThreshold || 0))),
      max_stock: max_stock !== undefined ? max_stock : (maxStock !== undefined ? maxStock : 0),
      min_alert_threshold: min_alert_threshold !== undefined ? min_alert_threshold : (minAlertThreshold || 0),
      quantity_reserved: quantity_reserved !== undefined ? quantity_reserved : (quantityReserved || 0),
      expiry_date: expiry_date || expiryDate || null,
      donor: donor || null,
      received_date: received_date || receivedDate || null,
      notes: notes,
      is_active: is_active !== undefined ? is_active : (isActive !== undefined ? isActive : true),
      camp_id: req.user.campId
    };

    const { data: item, error } = await supabase
      .from('inventory_items')
      .insert([itemData])
      .select()
      .single();

    if (error) {
      console.error('Create inventory item error:', error);
      return res.status(500).json({ error: getDatabaseErrorMessage(error) });
    }

    res.status(201).json(formatInventoryItem(item));
  } catch (error) {
    console.error('Create inventory item error:', error);
    next(error);
  }
});

// Update inventory item
router.put('/:itemId', authenticateToken, async (req, res, next) => {
  try {
    const { itemId } = req.params;

    console.log('=== UPDATE INVENTORY ITEM ===');
    console.log('Item ID:', itemId);
    console.log('Request body:', req.body);

    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Get the item to check camp association
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('camp_id')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return res.status(404).json({ error: getMessage('inventory', 'itemNotFound', 'Inventory item not found') });
    }

    // Verify user has access to this item's camp
    if (req.user.role !== 'SYSTEM_ADMIN' && item.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('camps', 'accessDenied', 'Access denied') });
    }

    const {
      name,
      category,
      unit,
      minStock,
      min_stock,
      maxStock,
      max_stock,
      min_alert_threshold,
      minAlertThreshold,
      quantity_reserved,
      quantityReserved,
      expiry_date,
      expiryDate,
      donor,
      received_date,
      receivedDate,
      notes,
      is_active,
      isActive
    } = req.body;

    console.log('Request body fields:', {
      name,
      category,
      unit,
      minStock,
      min_stock,
      maxStock,
      max_stock,
      min_alert_threshold,
      minAlertThreshold,
      quantity_reserved,
      quantityReserved,
      expiry_date,
      expiryDate,
      donor,
      received_date,
      receivedDate,
      notes,
      is_active,
      isActive
    });

    // Prepare updates
    const updates = {
      updated_at: new Date().toISOString()
    };

    if (name !== undefined) updates.name = name;
    if (category !== undefined) updates.category = category;
    if (unit !== undefined) updates.unit = unit;
    if (min_stock !== undefined) updates.min_stock = min_stock;
    if (minStock !== undefined) updates.min_stock = minStock;
    if (max_stock !== undefined) updates.max_stock = max_stock;
    if (maxStock !== undefined) updates.max_stock = maxStock;
    if (min_alert_threshold !== undefined) updates.min_alert_threshold = min_alert_threshold;
    if (minAlertThreshold !== undefined) updates.min_alert_threshold = minAlertThreshold;
    if (quantity_reserved !== undefined) updates.quantity_reserved = quantity_reserved;
    if (quantityReserved !== undefined) updates.quantity_reserved = quantityReserved;
    if (expiry_date !== undefined) updates.expiry_date = expiry_date;
    if (expiryDate !== undefined) updates.expiry_date = expiryDate;
    if (donor !== undefined) updates.donor = donor;
    if (received_date !== undefined) updates.received_date = received_date;
    if (receivedDate !== undefined) updates.received_date = receivedDate;
    if (notes !== undefined) updates.notes = notes;
    if (is_active !== undefined || isActive !== undefined) {
      updates.is_active = is_active !== undefined ? is_active : isActive;
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('Update inventory item error:', updateError);
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    res.json(formatInventoryItem(updatedItem));
  } catch (error) {
    console.error('Update inventory item error:', error);
    next(error);
  }
});

// Delete inventory item - Soft Delete
router.delete('/:itemId', authenticateToken, async (req, res, next) => {
  try {
    const { itemId } = req.params;

    // Check authorization
    if (!['SYSTEM_ADMIN', 'CAMP_MANAGER'].includes(req.user.role)) {
      return res.status(403).json({ error: getMessage('auth', 'insufficientPermissions', 'Insufficient permissions') });
    }

    // Get the item to check camp association
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return res.status(404).json({ error: getMessage('inventory', 'itemNotFound', 'Inventory item not found') });
    }

    // Verify user has access to this item's camp
    if (req.user.role !== 'SYSTEM_ADMIN' && item.camp_id !== req.user.campId) {
      return res.status(403).json({ error: getMessage('camps', 'accessDenied', 'Access denied') });
    }

    // Perform soft delete
    const { error: updateError } = await supabase
      .from('inventory_items')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (updateError) {
      return res.status(500).json({ error: getDatabaseErrorMessage(updateError) });
    }

    // Log the deletion to soft_deletes table
    try {
      await supabase.from('soft_deletes').insert({
        table_name: 'inventory_items',
        record_id: itemId,
        deleted_data: item,
        deleted_by_user_id: req.user.userId,
        deleted_at: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log soft delete to audit table:', logError);
      // Don't fail the delete if logging fails
    }

    res.status(200).json({
      message: getMessage('inventory', 'itemDeleted', 'تم حذف العنصر بنجاح'),
      itemId: itemId
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    next(error);
  }
});

// Restore a soft-deleted inventory item
router.put('/:itemId/restore', authenticateToken, async (req, res, next) => {
  const itemId = req.params.itemId;
  const { reason } = req.body;

  try {
    console.log(`=== RESTORE INVENTORY ITEM ===`);
    console.log(`Item ID: ${itemId}`);
    console.log(`Reason: ${reason}`);

    // Get current user info
    const currentUser = req.user;
    console.log(`Restored by: ${currentUser.userId} (${currentUser.role})`);

    // Fetch the item to verify it exists and is deleted
    const { data: item, error: fetchError } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError || !item) {
      return res.status(404).json({ error: getMessage('inventory', 'itemNotFound', 'العنصر غير موجود') });
    }

    if (!item.is_deleted) {
      return res.status(400).json({ error: getMessage('inventory', 'itemNotDeleted', 'العنصر ليس محذوفاً') });
    }

    // Restore the item
    const { data: updatedItem, error: updateError } = await supabase
      .from('inventory_items')
      .update({
        is_deleted: false,
        deleted_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to restore item:', updateError);
      return res.status(500).json({ error: getMessage('inventory', 'restoreFailed', 'فشل استعادة العنصر') });
    }

    // Log the restoration to audit_logs table
    try {
      await supabase.from('audit_logs').insert({
        action: 'RESTORE',
        entity_type: 'INVENTORY_ITEM',
        entity_id: itemId,
        user_id: currentUser.userId,
        changes: {
          restored_from_deleted: true,
          reason: reason
        },
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('Failed to log restoration to audit table:', logError);
      // Don't fail the restore if logging fails
    }

    res.status(200).json({
      message: getMessage('inventory', 'itemRestored', 'تم استعادة العنصر بنجاح'),
      item: updatedItem
    });
  } catch (error) {
    console.error('Restore inventory item error:', error);
    next(error);
  }
});

module.exports = { inventoryRoutes: router };