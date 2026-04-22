// services/offlineService.ts
import { DPProfile, Camp, InventoryItem, TransferRequest, AidCampaign, AidTransaction, InventoryTransaction, InventoryAudit } from '../types';

export interface OfflineData {
  dps: DPProfile[];
  camps: Camp[];
  inventory: InventoryItem[];
  transfers: TransferRequest[];
  aidCampaigns: AidCampaign[];
  aidDistributions: AidTransaction[];
  inventoryItems: InventoryItem[];
  inventoryTransactions: InventoryTransaction[];
  inventoryAudits: InventoryAudit[];
  lastSync: Date;
}

class OfflineService {
  private dbName = 'CampManagementDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create object stores for different data types
        if (!db.objectStoreNames.contains('dps')) {
          const dpStore = db.createObjectStore('dps', { keyPath: 'id' });
          dpStore.createIndex('campId', 'currentCampId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('camps')) {
          db.createObjectStore('camps', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('inventory')) {
          db.createObjectStore('inventory', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('transfers')) {
          db.createObjectStore('transfers', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('aid_campaigns')) {
          db.createObjectStore('aid_campaigns', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('aid_distributions')) {
          db.createObjectStore('aid_distributions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('inventory_items')) {
          db.createObjectStore('inventory_items', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('inventory_transactions')) {
          db.createObjectStore('inventory_transactions', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('inventory_audits')) {
          db.createObjectStore('inventory_audits', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('syncInfo')) {
          db.createObjectStore('syncInfo', { keyPath: 'key' });
        }
      };
    });
  }

  async saveDPs(dps: DPProfile[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['dps'], 'readwrite');
    const store = transaction.objectStore('dps');

    // Clear existing records
    store.clear();

    // Add new records
    for (const dp of dps) {
      // Transform the DPProfile to match the IndexedDB structure if needed
      const transformedDP = {
        ...dp,
        // Ensure all new fields are properly handled
        nationalId: dp.nationalId || '',
        monthlyIncome: dp.monthlyIncome || null,
        disabilityDetails: dp.disabilityDetails || '',
        chronicDiseaseDetails: dp.chronicDiseaseDetails || '',
        warInjuryDetails: dp.warInjuryDetails || '',
        medicalFollowupRequired: dp.medicalFollowupRequired || false,
        medicalFollowupFrequency: dp.medicalFollowupFrequency || '',
        wifeMedicalFollowupRequired: dp.wifeMedicalFollowupRequired || false,
        wifeMedicalFollowupFrequency: dp.wifeMedicalFollowupFrequency || '',
        childCount: dp.childCount || 0,
        teenagerCount: dp.teenagerCount || 0,
        adultCount: dp.adultCount || 0,
        seniorCount: dp.seniorCount || 0,
        disabledCount: dp.disabledCount || 0,
        injuredCount: dp.injuredCount || 0,
        pregnantWomenCount: dp.pregnantWomenCount || 0,
        // ⚠️  DISABLED: Vulnerability score system
        vulnerabilityScore: 0, // dp.vulnerabilityScore || 0,
        vulnerabilityPriority: null, // dp.vulnerabilityPriority || 'low',
        vulnerabilityBreakdown: null, // dp.vulnerabilityBreakdown || {},
        originalAddress: {
          ...dp.originalAddress,
          housingType: dp.originalAddress.housingType || 'owned'
        },
        currentHousing: {
          ...dp.currentHousing,
          unitNumber: dp.currentHousing.unitNumber || '',
          isSuitableForFamilySize: dp.currentHousing.isSuitableForFamilySize || false,
          sanitaryConditions: dp.currentHousing.sanitaryConditions || '',
          waterSource: dp.currentHousing.waterSource || '',
          electricityAccess: dp.currentHousing.electricityAccess || ''
        },
      };
      store.add(transformedDP);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getDPs(): Promise<DPProfile[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['dps'], 'readonly');
    const store = transaction.objectStore('dps');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveCamps(camps: Camp[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['camps'], 'readwrite');
    const store = transaction.objectStore('camps');

    // Clear existing records
    store.clear();

    // Add new records
    for (const camp of camps) {
      store.add(camp);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getCamps(): Promise<Camp[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['camps'], 'readonly');
    const store = transaction.objectStore('camps');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveInventory(inventory: InventoryItem[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['inventory'], 'readwrite');
    const store = transaction.objectStore('inventory');

    // Clear existing records
    store.clear();

    // Add new records
    for (const item of inventory) {
      store.add(item);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getInventory(): Promise<InventoryItem[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['inventory'], 'readonly');
    const store = transaction.objectStore('inventory');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveTransfers(transfers: TransferRequest[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['transfers'], 'readwrite');
    const store = transaction.objectStore('transfers');

    // Clear existing records
    store.clear();

    // Add new records
    for (const transfer of transfers) {
      store.add(transfer);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async saveAidCampaigns(campaigns: AidCampaign[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['aid_campaigns'], 'readwrite');
    const store = transaction.objectStore('aid_campaigns');

    // Clear existing records
    store.clear();

    // Add new records
    for (const campaign of campaigns) {
      store.add(campaign);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAidCampaigns(): Promise<AidCampaign[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['aid_campaigns'], 'readonly');
    const store = transaction.objectStore('aid_campaigns');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveAidDistributions(distributions: AidTransaction[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['aid_distributions'], 'readwrite');
    const store = transaction.objectStore('aid_distributions');

    // Clear existing records
    store.clear();

    // Add new records
    for (const distribution of distributions) {
      store.add(distribution);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getAidDistributions(): Promise<AidTransaction[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['aid_distributions'], 'readonly');
    const store = transaction.objectStore('aid_distributions');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveInventoryItems(items: InventoryItem[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['inventory_items'], 'readwrite');
    const store = transaction.objectStore('inventory_items');

    // Clear existing records
    store.clear();

    // Add new records
    for (const item of items) {
      store.add(item);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getInventoryItems(): Promise<InventoryItem[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['inventory_items'], 'readonly');
    const store = transaction.objectStore('inventory_items');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveInventoryTransactions(transactions: InventoryTransaction[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['inventory_transactions'], 'readwrite');
    const store = transaction.objectStore('inventory_transactions');

    // Clear existing records
    store.clear();

    // Add new records
    for (const transactionItem of transactions) {
      store.add(transactionItem);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getInventoryTransactions(): Promise<InventoryTransaction[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['inventory_transactions'], 'readonly');
    const store = transaction.objectStore('inventory_transactions');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveInventoryAudits(audits: InventoryAudit[]): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['inventory_audits'], 'readwrite');
    const store = transaction.objectStore('inventory_audits');

    // Clear existing records
    store.clear();

    // Add new records
    for (const audit of audits) {
      store.add(audit);
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async getInventoryAudits(): Promise<InventoryAudit[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['inventory_audits'], 'readonly');
    const store = transaction.objectStore('inventory_audits');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTransfers(): Promise<TransferRequest[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['transfers'], 'readonly');
    const store = transaction.objectStore('transfers');
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async saveLastSync(date: Date): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['syncInfo'], 'readwrite');
    const store = transaction.objectStore('syncInfo');

    const syncInfo = {
      key: 'lastSync',
      value: date.toISOString()
    };

    const request = store.put(syncInfo);

    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getLastSync(): Promise<Date | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const transaction = this.db.transaction(['syncInfo'], 'readonly');
    const store = transaction.objectStore('syncInfo');
    const request = store.get('lastSync');

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? new Date(result.value) : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async isOnline(): Promise<boolean> {
    return navigator.onLine;
  }

  async syncWithServer(): Promise<void> {
    // This would typically call the Supabase service to get fresh data
    // For now, we'll just update the last sync timestamp
    await this.saveLastSync(new Date());
  }
}

export const offlineService = new OfflineService();