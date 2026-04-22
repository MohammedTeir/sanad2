// backend/functions/duplicateLogic.js

/**
 * Server-Side Duplicate Detection Logic
 * Prevents duplicate aid distributions and registrations
 */

// Import database client (in a real implementation, this would be your DB client)
// const { createClient } = require('@supabase/supabase-js');

/**
 * Checks if a distribution record already exists for the same family and aid type
 * within a specified time period
 */
async function checkDuplicateDistribution(familyId, aidType, campaignId, dbClient, timeWindowHours = 24) {
  try {
    // Calculate the time threshold
    const timeThreshold = new Date();
    timeThreshold.setHours(timeThreshold.getHours() - timeWindowHours);
    
    // Query to check for duplicate distributions
    const result = await dbClient.query(
      `SELECT id FROM aid_distributions 
       WHERE family_id = $1 
       AND aid_type = $2 
       AND distribution_date > $3
       AND ($4 IS NULL OR campaign_id = $4)
       LIMIT 1`,
      [familyId, aidType, timeThreshold.toISOString(), campaignId || null]
    );
    
    return {
      isDuplicate: result.rows.length > 0,
      duplicateId: result.rows.length > 0 ? result.rows[0].id : null
    };
  } catch (error) {
    console.error('Error checking duplicate distribution:', error);
    throw error;
  }
}

/**
 * Checks if a family registration already exists based on national ID
 */
async function checkDuplicateFamily(nationalId, dbClient) {
  try {
    const result = await dbClient.query(
      'SELECT id FROM families WHERE head_of_family_national_id = $1 LIMIT 1',
      [nationalId]
    );
    
    return {
      isDuplicate: result.rows.length > 0,
      duplicateId: result.rows.length > 0 ? result.rows[0].id : null
    };
  } catch (error) {
    console.error('Error checking duplicate family:', error);
    throw error;
  }
}

/**
 * Checks if an individual already exists based on name and date of birth
 */
async function checkDuplicateIndividual(name, dateOfBirth, familyId, dbClient) {
  try {
    const result = await dbClient.query(
      `SELECT id FROM individuals 
       WHERE name = $1 
       AND date_of_birth = $2 
       AND family_id = $3
       LIMIT 1`,
      [name, dateOfBirth, familyId]
    );
    
    return {
      isDuplicate: result.rows.length > 0,
      duplicateId: result.rows.length > 0 ? result.rows[0].id : null
    };
  } catch (error) {
    console.error('Error checking duplicate individual:', error);
    throw error;
  }
}

/**
 * Comprehensive duplicate check for aid distribution
 * Includes multiple checks to prevent various types of duplicates
 */
async function comprehensiveDuplicateCheck(distributionData, dbClient) {
  try {
    const results = {
      isDuplicate: false,
      checks: {}
    };
    
    // Check 1: Same family, same aid type, same campaign within time window
    const distCheck = await checkDuplicateDistribution(
      distributionData.familyId, 
      distributionData.aidType, 
      distributionData.campaignId, 
      dbClient
    );
    results.checks.distribution = distCheck;
    
    // Check 2: Same family, same aid category within time window
    const categoryCheck = await dbClient.query(
      `SELECT id FROM aid_distributions 
       WHERE family_id = $1 
       AND aid_category = $2 
       AND distribution_date > $3
       AND ($4 IS NULL OR campaign_id = $4)
       LIMIT 1`,
      [
        distributionData.familyId, 
        distributionData.aidCategory, 
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 24 hours ago
        distributionData.campaignId || null
      ]
    );
    
    results.checks.category = {
      isDuplicate: categoryCheck.rows.length > 0,
      duplicateId: categoryCheck.rows.length > 0 ? categoryCheck.rows[0].id : null
    };
    
    // Check 3: Same recipient with same OTP code (if OTP is used)
    if (distributionData.otpCode) {
      const otpCheck = await dbClient.query(
        `SELECT id FROM aid_distributions 
         WHERE family_id = $1 
         AND otp_code = $2 
         AND status = 'تم التسليم'
         LIMIT 1`,
        [distributionData.familyId, distributionData.otpCode]
      );
      
      results.checks.otp = {
        isDuplicate: otpCheck.rows.length > 0,
        duplicateId: otpCheck.rows.length > 0 ? otpCheck.rows[0].id : null
      };
    }
    
    // Check 4: Same recipient with same signature (if signature is used)
    if (distributionData.receivedBySignature) {
      const signatureCheck = await dbClient.query(
        `SELECT id FROM aid_distributions 
         WHERE family_id = $1 
         AND received_by_signature = $2 
         AND status = 'تم التسليم'
         LIMIT 1`,
        [distributionData.familyId, distributionData.receivedBySignature]
      );
      
      results.checks.signature = {
        isDuplicate: signatureCheck.rows.length > 0,
        duplicateId: signatureCheck.rows.length > 0 ? signatureCheck.rows[0].id : null
      };
    }
    
    // Determine if any check indicates a duplicate
    results.isDuplicate = Object.values(results.checks).some(check => check.isDuplicate);
    
    return results;
  } catch (error) {
    console.error('Error in comprehensive duplicate check:', error);
    throw error;
  }
}

/**
 * Function to handle duplicate detection before creating a new distribution
 */
async function handleDistributionWithDuplicateCheck(distributionData, dbClient) {
  try {
    // Perform comprehensive duplicate check
    const duplicateCheck = await comprehensiveDuplicateCheck(distributionData, dbClient);
    
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        error: 'Duplicate distribution detected',
        duplicateCheck
      };
    }
    
    // If no duplicates, proceed with creating the distribution
    // This would typically be handled by the transactional integrity function
    return {
      success: true,
      message: 'No duplicates found, proceeding with distribution'
    };
  } catch (error) {
    console.error('Error handling distribution with duplicate check:', error);
    throw error;
  }
}

/**
 * Function to handle family registration with duplicate check
 */
async function handleFamilyRegistrationWithDuplicateCheck(familyData, dbClient) {
  try {
    // Check for duplicate family
    const duplicateCheck = await checkDuplicateFamily(familyData.nationalId, dbClient);
    
    if (duplicateCheck.isDuplicate) {
      return {
        success: false,
        error: 'Family with this national ID already exists',
        duplicateId: duplicateCheck.duplicateId
      };
    }
    
    // Check for duplicate individuals within the family
    const duplicateIndividuals = [];
    for (const member of familyData.members) {
      const dupCheck = await checkDuplicateIndividual(
        member.name, 
        member.dateOfBirth, 
        familyData.id, 
        dbClient
      );
      
      if (dupCheck.isDuplicate) {
        duplicateIndividuals.push({
          name: member.name,
          duplicateId: dupCheck.duplicateId
        });
      }
    }
    
    if (duplicateIndividuals.length > 0) {
      return {
        success: false,
        error: 'One or more family members already exist',
        duplicateIndividuals
      };
    }
    
    return {
      success: true,
      message: 'No duplicates found, proceeding with registration'
    };
  } catch (error) {
    console.error('Error handling family registration with duplicate check:', error);
    throw error;
  }
}

module.exports = {
  checkDuplicateDistribution,
  checkDuplicateFamily,
  checkDuplicateIndividual,
  comprehensiveDuplicateCheck,
  handleDistributionWithDuplicateCheck,
  handleFamilyRegistrationWithDuplicateCheck
};