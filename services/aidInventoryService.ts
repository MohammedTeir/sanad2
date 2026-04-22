import {
  AidCampaign,
  AidTransaction,
  InventoryItem,
  InventoryTransaction,
  InventoryAudit,
  DPProfile
} from '../types';
import { realDataService } from './realDataServiceBackend';

/**
 * Service for managing aid and inventory operations
 */
export class AidInventoryService {
  /**
   * Creates a new aid campaign
   */
  async createAidCampaign(campaign: {
    name: string;
    aidType: string;
    aidCategory: string;
    startDate: string;
    endDate?: string;
    description?: string;
    notes?: string;
    targetFamilies?: string[];
    inventoryItemId?: string;
  }): Promise<AidCampaign> {
    return await realDataService.createAidCampaign(campaign);
  }

  /**
   * Gets all aid campaigns
   */
  async getAidCampaigns(): Promise<AidCampaign[]> {
    return await realDataService.getAidCampaigns();
  }

  /**
   * Updates an aid campaign
   */
  async updateAidCampaign(id: string, updates: Partial<AidCampaign>): Promise<AidCampaign> {
    return await realDataService.updateAidCampaign(id, updates);
  }

  /**
   * Distributes aid to a family
   */
  async distributeAid(
    dpProfile: DPProfile,
    aidType: string,
    aidCategory: 'غذائية' | 'غير غذائية' | 'طبية' | 'مالية' | 'أخرى',
    quantity: number,
    distributedBy: string,
    campaignId?: string,
    verificationMethod?: {
      signature?: string;
      biometric?: string;
      photo?: string;
      otp?: string;
    }
  ): Promise<AidTransaction> {
    // Check for duplicates if campaign ID is provided
    let duplicateCheckPassed = true;
    if (campaignId) {
      duplicateCheckPassed = await this.checkDuplicateAid(dpProfile.id, aidType, campaignId);
    }

    // Create the aid distribution record
    const distributionData: Omit<AidTransaction, 'id' | 'date'> = {
      dpId: dpProfile.id,
      campaignId: campaignId,
      aidType: aidType,
      aidCategory: aidCategory,
      quantity: quantity,
      distributedBy: distributedBy,
      notes: `Aid distribution for family ${dpProfile.headOfFamily}`,
      receivedBySignature: verificationMethod?.signature,
      receivedByBiometric: verificationMethod?.biometric,
      receivedByPhoto: verificationMethod?.photo,
      otpCode: verificationMethod?.otp,
      duplicateCheckPassed: duplicateCheckPassed,
      status: 'تم التسليم',
    };

    const distributionRecord = await realDataService.createAidDistribution(distributionData, distributedBy);

    // Update inventory if applicable
    if (aidCategory !== 'مالية') {
      await this.reduceInventory(aidType, quantity);
    }

    // Update the campaign's distributedTo array if campaign ID is provided
    if (campaignId) {
      const campaign = await this.getAidCampaignById(campaignId);
      if (campaign) {
        const updatedDistributedTo = [...campaign.distributedTo, dpProfile.id];
        await this.updateAidCampaign(campaignId, {
          distributedTo: updatedDistributedTo
        });
      }
    }

    return distributionRecord;
  }

  /**
   * Checks if a family has already received the same aid in the specified period
   */
  async checkDuplicateAid(familyId: string, aidType: string, campaignId: string, periodDays: number = 30): Promise<boolean> {
    // In a real implementation, this would check if the family received the same aid
    // within the specified period. For now, we'll just return true.
    // Note: The realDataService doesn't have a method to get distributions by family ID yet
    // We'll need to get all distributions and filter on the client side
    const allDistributions = await realDataService.getAidDistributions();

    // Filter for distributions to this family
    const familyDistributions = allDistributions.filter(dist => dist.dpId === familyId);

    // Find distributions of the same aid type in the last periodDays days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - periodDays);

    const recentDistributions = familyDistributions.filter(dist =>
      dist.aidType === aidType &&
      new Date(dist.date) > cutoffDate
    );

    // Return false if duplicate found, true otherwise
    return recentDistributions.length === 0;
  }

  /**
   * Adds new inventory item
   */
  async addInventoryItem(item: {
    name: string;
    nameAr?: string;
    category: string;
    unit: string;
    unitAr?: string;
    quantityAvailable: number;
    quantityReserved?: number;
    minStock?: number;
    maxStock?: number;
    minAlertThreshold?: number;
    expiryDate?: string;
    donor?: string;
    receivedDate?: string;
    notes?: string;
    is_active?: boolean;
    camp_id?: string;
  }): Promise<InventoryItem> {
    return await realDataService.createInventoryItem(item);
  }

  /**
   * Gets all inventory items
   */
  async getInventoryItems(campId: string = 'all'): Promise<InventoryItem[]> {
    return await realDataService.getInventory(campId);
  }

  /**
   * Gets inventory item by ID
   */
  async getInventoryItemById(id: string): Promise<InventoryItem | null> {
    return await realDataService.getInventoryItemById(id);
  }

  /**
   * Updates inventory item
   */
  async updateInventoryItem(id: string, updates: Partial<InventoryItem>): Promise<InventoryItem> {
    const currentItem = await this.getInventoryItemById(id);
    if (!currentItem) {
      throw new Error(`Inventory item with ID ${id} not found`);
    }

    const updatedItem: InventoryItem = {
      ...currentItem,
      ...updates
    };

    return await realDataService.saveInventoryItem(updatedItem, updatedItem.campId || 'unknown', 'system');
  }

  /**
   * Reduces inventory by specified quantity
   */
  async reduceInventory(itemName: string, quantity: number, userId: string = 'system'): Promise<boolean> {
    const items = await this.getInventoryItems();
    const item = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());

    if (!item) {
      console.error(`Item ${itemName} not found in inventory`);
      return false;
    }

    if (item.quantityAvailable < quantity) {
      console.error(`Insufficient inventory for ${itemName}. Available: ${item.quantityAvailable}, Requested: ${quantity}`);
      return false;
    }

    await this.updateInventoryItem(item.id, {
      quantityAvailable: item.quantityAvailable - quantity
    });

    const transaction: Omit<InventoryTransaction, 'id' | 'createdAt' | 'processedAt'> = {
      itemId: item.id,
      transactionType: 'صادر',
      quantity: quantity,
      relatedTo: 'توزيع',
      notes: undefined,
      relatedId: undefined,
      processedBy: userId
    };

    await realDataService.createInventoryTransaction(transaction, userId);

    return true;
  }

  /**
   * Increases inventory by specified quantity
   */
  async increaseInventory(itemName: string, quantity: number, userId: string = 'system', donor?: string): Promise<boolean> {
    const items = await this.getInventoryItems();
    const item = items.find(i => i.name.toLowerCase() === itemName.toLowerCase());

    if (!item) {
      console.error(`Item ${itemName} not found in inventory`);
      return false;
    }

    await this.updateInventoryItem(item.id, {
      quantityAvailable: item.quantityAvailable + quantity
    });

    const transaction: Omit<InventoryTransaction, 'id' | 'createdAt' | 'processedAt'> = {
      itemId: item.id,
      transactionType: 'وارد',
      quantity: quantity,
      relatedTo: 'تبرع',
      notes: donor ? `Donor: ${donor}` : undefined,
      relatedId: undefined,
      processedBy: userId
    };

    await realDataService.createInventoryTransaction(transaction, userId);

    return true;
  }

  /**
   * Performs inventory audit
   */
  async performInventoryAudit(
    itemId: string,
    physicalCount: number,
    auditedBy: string,
    reason: 'نقص' | 'فائض' | 'سرقة' | 'تلف' | 'خطأ عد' | 'أخرى',
    notes?: string
  ): Promise<InventoryAudit> {
    const item = await this.getInventoryItemById(itemId);
    if (!item) {
      throw new Error(`Item with ID ${itemId} not found`);
    }

    const systemCount = item.quantityAvailable;
    const difference = physicalCount - systemCount;

    const auditData: Omit<InventoryAudit, 'id' | 'createdAt' | 'auditedAt'> = {
      itemId: itemId,
      physicalCount: physicalCount,
      systemCount: systemCount,
      difference: difference,
      reason: reason,
      notes: notes || '',
      auditedBy: auditedBy
    };

    const auditRecord = await realDataService.createInventoryAudit(auditData, auditedBy);

    await this.updateInventoryItem(itemId, {
      quantityAvailable: physicalCount
    });

    return auditRecord;
  }

  /**
   * Gets low stock alerts
   */
  async getLowStockAlerts(): Promise<InventoryItem[]> {
    const items = await this.getInventoryItems();
    return items.filter(item => item.quantityAvailable <= item.minAlertThreshold);
  }

  /**
   * Gets inventory transactions for an item
   */
  async getInventoryTransactions(itemId: string): Promise<InventoryTransaction[]> {
    return await realDataService.getInventoryTransactions({ itemId });
  }

  // Note: Mapping methods removed as they reference undefined types
  // The service now works directly with the types from realDataService
}

export const aidInventoryService = new AidInventoryService();