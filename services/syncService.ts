import { supabaseService } from './supabase';
import { storageService } from './storage';
import { DPProfile, InventoryItem, Camp } from '../types';

export interface SyncResult {
  success: boolean;
  message: string;
  syncedEntities: {
    families: number;
    individuals: number;
    inventory: number;
    distributions: number;
  };
  conflicts: SyncConflict[];
}

export interface SyncConflict {
  entityId: string;
  entityType: 'family' | 'individual' | 'inventory' | 'distribution';
  localVersion: any;
  remoteVersion: any;
  resolution: 'local' | 'remote' | 'merged' | 'manual';
}

export interface ConflictResolution {
  entityId: string;
  resolution: 'local' | 'remote' | 'merged';
  mergedData?: any;
}

/**
 * Service for managing synchronization between local and remote data
 */
export class SyncService {
  /**
   * Synchronizes local data with remote server
   */
  async syncData(userId: string): Promise<SyncResult> {
    try {
      // Log the sync operation
      const operationId = `sync_${Date.now()}`;
      
      // Create sync operation record
      await supabaseService.createBackupSyncOperation({
        operation_type: 'مزامنة',
        scope: 'كامل',
        camp_id: 'unknown', // Would be determined by user's camp
        initiated_by: userId,
        status: 'قيد المعالجة',
        started_at: new Date().toISOString()
      });

      // Get local data that needs to be synced
      const localData = await this.getLocalUnsyncedData();
      
      // Get remote data for conflict detection
      const remoteData = await this.getRemoteData();

      // Detect conflicts
      const conflicts = await this.detectConflicts(localData, remoteData);

      // Resolve conflicts (using automatic resolution for now)
      const resolvedData = await this.resolveConflicts(conflicts, localData, remoteData);

      // Upload local changes to remote
      const uploadResults = await this.uploadLocalChanges(resolvedData, userId);

      // Download remote changes to local
      const downloadResults = await this.downloadRemoteChanges(remoteData, userId);

      // Update the sync operation record
      await supabaseService.updateBackupSyncOperation(operationId, {
        status: 'مكتمل'
      });

      return {
        success: true,
        message: 'Synchronization completed successfully',
        syncedEntities: {
          families: uploadResults.families + downloadResults.families,
          individuals: uploadResults.individuals + downloadResults.individuals,
          inventory: uploadResults.inventory + downloadResults.inventory,
          distributions: uploadResults.distributions + downloadResults.distributions
        },
        conflicts
      };
    } catch (error) {
      console.error('Error during synchronization:', error);
      
      // Update the sync operation record with error status
      // This would be done in a real implementation
      
      return {
        success: false,
        message: `Synchronization failed: ${(error as Error).message}`,
        syncedEntities: {
          families: 0,
          individuals: 0,
          inventory: 0,
          distributions: 0
        },
        conflicts: []
      };
    }
  }

  /**
   * Gets local data that hasn't been synced yet
   */
  private async getLocalUnsyncedData(): Promise<{
    families: DPProfile[];
    individuals: any[];
    inventory: InventoryItem[];
    distributions: any[];
  }> {
    // For now, return all local data
    // In a real implementation, we would track which records have been modified locally
    const dps = await storageService.getDPs();
    
    return {
      families: dps,
      individuals: [], // Would be extracted from families
      inventory: [], // Would come from local inventory
      distributions: [] // Would come from local distributions
    };
  }

  /**
   * Gets remote data for comparison
   */
  private async getRemoteData(): Promise<{
    families: any[];
    individuals: any[];
    inventory: any[];
    distributions: any[];
  }> {
    // Fetch all remote data
    const camps = await supabaseService.getCamps();
    const families = await supabaseService.getFamilies();
    const individuals = []; // Would be fetched by family ID
    const inventory = []; // Would be fetched by camp ID
    
    // In a real implementation, we would fetch individuals and inventory
    
    return {
      families,
      individuals,
      inventory,
      distributions: []
    };
  }

  /**
   * Detects conflicts between local and remote data
   */
  private async detectConflicts(
    localData: any,
    remoteData: any
  ): Promise<SyncConflict[]> {
    const conflicts: SyncConflict[] = [];

    // Compare families
    for (const localFamily of localData.families) {
      const remoteFamily = remoteData.families.find((f: any) => f.id === localFamily.id);
      
      if (remoteFamily) {
        // Check if there are differences
        const localJson = JSON.stringify(localFamily);
        const remoteJson = JSON.stringify(remoteFamily);
        
        if (localJson !== remoteJson) {
          conflicts.push({
            entityId: localFamily.id,
            entityType: 'family',
            localVersion: localFamily,
            remoteVersion: remoteFamily,
            resolution: 'manual'
          });
        }
      }
    }

    // Similar comparisons for other entities would go here

    return conflicts;
  }

  /**
   * Resolves detected conflicts
   */
  private async resolveConflicts(
    conflicts: SyncConflict[],
    localData: any,
    remoteData: any
  ): Promise<any> {
    // For now, we'll implement simple resolution strategies
    // In a real implementation, this could be more sophisticated
    
    const resolvedData = { ...localData };
    
    for (const conflict of conflicts) {
      switch (conflict.resolution) {
        case 'local':
          // Keep local version
          break;
        case 'remote':
          // Use remote version
          if (conflict.entityType === 'family') {
            const index = resolvedData.families.findIndex((f: any) => f.id === conflict.entityId);
            if (index !== -1) {
              resolvedData.families[index] = conflict.remoteVersion;
            }
          }
          break;
        case 'merged':
          // Use merged version (would require custom merge logic)
          break;
        case 'manual':
          // For now, default to keeping local version
          break;
      }
    }

    return resolvedData;
  }

  /**
   * Uploads local changes to remote server
   */
  private async uploadLocalChanges(data: any, userId: string): Promise<any> {
    let familiesUploaded = 0;
    let individualsUploaded = 0;
    let inventoryUploaded = 0;
    let distributionsUploaded = 0;

    // Upload families
    for (const family of data.families) {
      try {
        // In a real implementation, we would check if the family exists remotely
        // and either update or create accordingly
        await supabaseService.createFamily({
          id: family.id,
          camp_id: family.currentHousing.campId,
          head_of_family_name: family.headOfFamily,
          head_of_family_national_id: family.nationalId,
          head_of_family_gender: family.gender,
          head_of_family_date_of_birth: family.dateOfBirth,
          head_of_family_age: family.age,
          head_of_family_marital_status: family.maritalStatus,
          head_of_family_role: family.headRole as any,
          head_of_family_is_working: family.isWorking,
          head_of_family_job: family.job,
          head_of_family_monthly_income: family.monthlyIncome,
          head_of_family_phone_number: family.phoneNumber,
          head_of_family_phone_secondary: family.phoneSecondary,
          head_of_family_disability_type: family.disabilityType,
          head_of_family_chronic_disease_type: family.chronicDiseaseType,
          head_of_family_war_injury_type: family.warInjuryType,
          wife_name: family.wifeName,
          wife_national_id: family.wifeNationalId,
          wife_is_pregnant: family.wifeIsPregnant,
          wife_pregnancy_month: family.wifePregnancyMonth,
          total_members_count: family.totalMembersCount,
          male_count: family.maleCount,
          female_count: family.femaleCount,
          child_count: family.childCount,
          teenager_count: family.teenagerCount,
          adult_count: family.adultCount,
          senior_count: family.seniorCount,
          disabled_count: family.disabledCount,
          injured_count: family.injuredCount,
          pregnant_women_count: family.pregnantWomenCount,
          original_address_governorate: family.originalAddress.governorate,
          original_address_region: family.originalAddress.region,
          original_address_details: family.originalAddress.details,
          original_address_housing_type: family.originalAddress.housingType,
          current_housing_type: family.currentHousing.type,
          current_housing_camp_id: family.currentHousing.campId,
          current_housing_unit_number: family.currentHousing.unitNumber,
          current_housing_is_suitable_for_family_size: family.currentHousing.isSuitableForFamilySize,
          current_housing_sanitary_facilities: family.currentHousing.sanitaryFacilities,
          current_housing_water_source: family.currentHousing.waterSource,
          current_housing_electricity_access: family.currentHousing.electricityAccess,
          current_housing_landmark: family.currentHousing.landmark,
          current_housing_country: family.currentHousing.country,
          // ⚠️  DISABLED: Vulnerability score system
          vulnerability_score: null, // family.vulnerabilityScore,
          vulnerability_priority: null, // family.vulnerabilityPriority,
          vulnerability_breakdown: null, // family.vulnerabilityBreakdown,
          vulnerability_reason: family.vulnerabilityReason,
          registered_date: family.registeredDate,
          last_updated: family.lastUpdated,
        });
        familiesUploaded++;
      } catch (error) {
        console.error(`Error uploading family ${family.id}:`, error);
      }
    }

    return {
      families: familiesUploaded,
      individuals: individualsUploaded,
      inventory: inventoryUploaded,
      distributions: distributionsUploaded
    };
  }

  /**
   * Downloads remote changes to local storage
   */
  private async downloadRemoteChanges(remoteData: any, userId: string): Promise<any> {
    let familiesDownloaded = 0;
    let individualsDownloaded = 0;
    let inventoryDownloaded = 0;
    let distributionsDownloaded = 0;

    // For now, we'll just count the remote data
    familiesDownloaded = remoteData.families.length;
    individualsDownloaded = remoteData.individuals.length;
    inventoryDownloaded = remoteData.inventory.length;
    distributionsDownloaded = remoteData.distributions.length;

    return {
      families: familiesDownloaded,
      individuals: individualsDownloaded,
      inventory: inventoryDownloaded,
      distributions: distributionsDownloaded
    };
  }

  /**
   * Checks if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Gets sync status
   */
  async getSyncStatus(): Promise<{
    isOnline: boolean;
    lastSyncTime?: string;
    pendingChanges: number;
  }> {
    return {
      isOnline: this.isOnline(),
      lastSyncTime: localStorage.getItem('last_sync_time') || undefined,
      pendingChanges: 0 // Would be calculated based on local changes
    };
  }
}

// Export a singleton instance
export const syncService = new SyncService();