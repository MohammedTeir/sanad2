// backend/api/batchSyncEndpoint.js

/**
 * Batch Sync Endpoint for Offline Mode
 * Handles bulk uploads of records when device comes back online
 */

// Import required modules
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * POST /api/sync/batch
 * Accepts a batch of records to sync from offline mode
 */
router.post('/', async (req, res) => {
  try {
    const { records, userId, timestamp } = req.body;
    
    // Validate input
    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({ 
        error: 'Records array is required and cannot be empty' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ 
        error: 'User ID is required' 
      });
    }
    
    // Process records in batches to avoid timeouts
    const batchSize = 50;
    const results = {
      success: [],
      failed: [],
      errors: []
    };
    
    // Process records in batches
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      // Process each record in the batch
      for (const record of batch) {
        try {
          let result;
          
          switch (record.type) {
            case 'family':
              result = await syncFamilyRecord(record.data, userId);
              break;
            case 'individual':
              result = await syncIndividualRecord(record.data, userId);
              break;
            case 'distribution':
              result = await syncDistributionRecord(record.data, userId);
              break;
            case 'inventory_transaction':
              result = await syncInventoryTransactionRecord(record.data, userId);
              break;
            case 'aid_campaign':
              result = await syncAidCampaignRecord(record.data, userId);
              break;
            default:
              throw new Error(`Unknown record type: ${record.type}`);
          }
          
          results.success.push({
            originalId: record.id,
            syncedId: result.id,
            type: record.type
          });
        } catch (error) {
          results.failed.push({
            originalId: record.id,
            type: record.type,
            error: error.message
          });
          results.errors.push(error.message);
        }
      }
    }
    
    // Return sync results
    res.status(200).json({
      message: `Batch sync completed. ${results.success.length} records synced successfully, ${results.failed.length} failed.`,
      results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Batch sync error:', error);
    res.status(500).json({ 
      error: 'Internal server error during batch sync' 
    });
  }
});

/**
 * Sync a family record
 */
async function syncFamilyRecord(familyData, userId) {
  // Check if family already exists (based on national ID or internal ID)
  const { data: existingFamily, error: fetchError } = await supabase
    .from('families')
    .select('*')
    .eq('id', familyData.id)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
    throw fetchError;
  }
  
  if (existingFamily) {
    // Update existing family
    const { data, error } = await supabase
      .from('families')
      .update({
        ...familyData,
        last_updated: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', familyData.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert new family
    const { data, error } = await supabase
      .from('families')
      .insert([{
        ...familyData,
        created_by: userId,
        last_updated: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

/**
 * Sync an individual record
 */
async function syncIndividualRecord(individualData, userId) {
  // Check if individual already exists
  const { data: existingIndividual, error: fetchError } = await supabase
    .from('individuals')
    .select('*')
    .eq('id', individualData.id)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }
  
  if (existingIndividual) {
    // Update existing individual
    const { data, error } = await supabase
      .from('individuals')
      .update({
        ...individualData,
        last_updated: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', individualData.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert new individual
    const { data, error } = await supabase
      .from('individuals')
      .insert([{
        ...individualData,
        created_by: userId,
        last_updated: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

/**
 * Sync a distribution record
 */
async function syncDistributionRecord(distributionData, userId) {
  // Check if distribution already exists
  const { data: existingDistribution, error: fetchError } = await supabase
    .from('aid_distributions')
    .select('*')
    .eq('id', distributionData.id)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }
  
  if (existingDistribution) {
    // Update existing distribution
    const { data, error } = await supabase
      .from('aid_distributions')
      .update({
        ...distributionData,
        last_updated: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', distributionData.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert new distribution
    const { data, error } = await supabase
      .from('aid_distributions')
      .insert([{
        ...distributionData,
        created_by: userId,
        last_updated: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

/**
 * Sync an inventory transaction record
 */
async function syncInventoryTransactionRecord(transactionData, userId) {
  // Check if transaction already exists
  const { data: existingTransaction, error: fetchError } = await supabase
    .from('inventory_transactions')
    .select('*')
    .eq('id', transactionData.id)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }
  
  if (existingTransaction) {
    // Update existing transaction
    const { data, error } = await supabase
      .from('inventory_transactions')
      .update({
        ...transactionData,
        last_updated: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', transactionData.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert new transaction
    const { data, error } = await supabase
      .from('inventory_transactions')
      .insert([{
        ...transactionData,
        created_by: userId,
        last_updated: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

/**
 * Sync an aid campaign record
 */
async function syncAidCampaignRecord(campaignData, userId) {
  // Check if campaign already exists
  const { data: existingCampaign, error: fetchError } = await supabase
    .from('aid_campaigns')
    .select('*')
    .eq('id', campaignData.id)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    throw fetchError;
  }
  
  if (existingCampaign) {
    // Update existing campaign
    const { data, error } = await supabase
      .from('aid_campaigns')
      .update({
        ...campaignData,
        last_updated: new Date().toISOString(),
        updated_by: userId
      })
      .eq('id', campaignData.id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } else {
    // Insert new campaign
    const { data, error } = await supabase
      .from('aid_campaigns')
      .insert([{
        ...campaignData,
        created_by: userId,
        last_updated: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
}

module.exports = router;