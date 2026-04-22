// backend/functions/transactionalIntegrity.js

/**
 * Transactional Integrity Functions
 * Ensures atomic operations for inventory and distribution records
 */

// Import database client (in a real implementation, this would be your DB client)
// const { createClient } = require('@supabase/supabase-js');

/**
 * Creates a distribution record and reduces inventory in a single transaction
 * This ensures that if one operation fails, both are rolled back
 */
async function createDistributionWithInventoryReduction(distributionData, dbClient) {
  // In a real implementation, this would use database transactions
  // For now, we'll simulate the process
  
  try {
    // Start transaction
    await dbClient.query('BEGIN');
    
    // 1. Check if there's enough inventory
    const inventoryCheck = await dbClient.query(
      'SELECT quantity_available FROM inventory_items WHERE id = $1',
      [distributionData.itemId]
    );
    
    if (inventoryCheck.rows.length === 0) {
      throw new Error(`Item with ID ${distributionData.itemId} not found`);
    }
    
    const availableQuantity = inventoryCheck.rows[0].quantity_available;
    
    if (availableQuantity < distributionData.quantity) {
      throw new Error(`Insufficient inventory. Available: ${availableQuantity}, Requested: ${distributionData.quantity}`);
    }
    
    // 2. Insert distribution record
    const distributionResult = await dbClient.query(
      `INSERT INTO aid_distributions (
        family_id, 
        campaign_id, 
        aid_type, 
        aid_category, 
        quantity, 
        distribution_date, 
        distributed_by_user_id, 
        notes, 
        received_by_signature, 
        received_by_biometric, 
        received_by_photo_url, 
        otp_code, 
        duplicate_check_passed, 
        status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING id`,
      [
        distributionData.familyId,
        distributionData.campaignId,
        distributionData.aidType,
        distributionData.aidCategory,
        distributionData.quantity,
        distributionData.date,
        distributionData.distributedBy,
        distributionData.notes,
        distributionData.receivedBySignature,
        distributionData.receivedByBiometric,
        distributionData.receivedByPhoto,
        distributionData.otpCode,
        distributionData.duplicateCheckPassed,
        distributionData.status
      ]
    );
    
    // 3. Reduce inventory quantity
    await dbClient.query(
      `UPDATE inventory_items 
       SET quantity_available = quantity_available - $1, 
           updated_at = NOW()
       WHERE id = $2`,
      [distributionData.quantity, distributionData.itemId]
    );
    
    // 4. Create inventory transaction record
    await dbClient.query(
      `INSERT INTO inventory_transactions (
        item_id, 
        transaction_type, 
        quantity, 
        related_to, 
        related_id, 
        notes, 
        processed_by_user_id, 
        processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        distributionData.itemId,
        'out', // Outgoing transaction
        distributionData.quantity,
        'distribution',
        distributionResult.rows[0].id, // Link to the distribution record
        `Distribution to family ${distributionData.familyId}`,
        distributionData.distributedBy,
        new Date().toISOString()
      ]
    );
    
    // Commit transaction
    await dbClient.query('COMMIT');
    
    return {
      success: true,
      distributionId: distributionResult.rows[0].id,
      message: 'Distribution recorded and inventory reduced successfully'
    };
  } catch (error) {
    // Rollback transaction on error
    await dbClient.query('ROLLBACK');
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Updates inventory and creates transaction record in a single transaction
 */
async function updateInventoryWithTransaction(itemId, quantityChange, transactionType, relatedTo, relatedId, processedBy, notes, dbClient) {
  try {
    // Start transaction
    await dbClient.query('BEGIN');
    
    // Get current inventory
    const inventoryCheck = await dbClient.query(
      'SELECT quantity_available FROM inventory_items WHERE id = $1',
      [itemId]
    );
    
    if (inventoryCheck.rows.length === 0) {
      throw new Error(`Item with ID ${itemId} not found`);
    }
    
    // Update inventory
    await dbClient.query(
      `UPDATE inventory_items 
       SET quantity_available = quantity_available + $1, 
           updated_at = NOW()
       WHERE id = $2`,
      [quantityChange, itemId]
    );
    
    // Create transaction record
    await dbClient.query(
      `INSERT INTO inventory_transactions (
        item_id, 
        transaction_type, 
        quantity, 
        related_to, 
        related_id, 
        notes, 
        processed_by_user_id, 
        processed_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        itemId,
        transactionType,
        Math.abs(quantityChange), // Always positive for the transaction record
        relatedTo,
        relatedId,
        notes,
        processedBy,
        new Date().toISOString()
      ]
    );
    
    // Commit transaction
    await dbClient.query('COMMIT');
    
    return {
      success: true,
      message: 'Inventory updated successfully'
    };
  } catch (error) {
    // Rollback transaction on error
    await dbClient.query('ROLLBACK');
    
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Processes multiple inventory adjustments in a single transaction
 */
async function processBulkInventoryAdjustments(adjustments, processedBy, dbClient) {
  try {
    // Start transaction
    await dbClient.query('BEGIN');
    
    for (const adjustment of adjustments) {
      // Get current inventory
      const inventoryCheck = await dbClient.query(
        'SELECT quantity_available FROM inventory_items WHERE id = $1',
        [adjustment.itemId]
      );
      
      if (inventoryCheck.rows.length === 0) {
        throw new Error(`Item with ID ${adjustment.itemId} not found`);
      }
      
      // Check for sufficient inventory if reducing
      if (adjustment.quantityChange < 0) {
        const availableQuantity = inventoryCheck.rows[0].quantity_available;
        if (availableQuantity < Math.abs(adjustment.quantityChange)) {
          throw new Error(`Insufficient inventory for item ${adjustment.itemId}. Available: ${availableQuantity}, Requested: ${Math.abs(adjustment.quantityChange)}`);
        }
      }
      
      // Update inventory
      await dbClient.query(
        `UPDATE inventory_items 
         SET quantity_available = quantity_available + $1, 
             updated_at = NOW()
         WHERE id = $2`,
        [adjustment.quantityChange, adjustment.itemId]
      );
      
      // Create transaction record
      await dbClient.query(
        `INSERT INTO inventory_transactions (
          item_id, 
          transaction_type, 
          quantity, 
          related_to, 
          related_id, 
          notes, 
          processed_by_user_id, 
          processed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          adjustment.itemId,
          adjustment.quantityChange > 0 ? 'in' : 'out',
          Math.abs(adjustment.quantityChange),
          adjustment.relatedTo,
          adjustment.relatedId,
          adjustment.notes,
          processedBy,
          new Date().toISOString()
        ]
      );
    }
    
    // Commit transaction
    await dbClient.query('COMMIT');
    
    return {
      success: true,
      message: `${adjustments.length} inventory adjustments processed successfully`
    };
  } catch (error) {
    // Rollback transaction on error
    await dbClient.query('ROLLBACK');
    
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  createDistributionWithInventoryReduction,
  updateInventoryWithTransaction,
  processBulkInventoryAdjustments
};