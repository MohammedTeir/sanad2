
import { Camp, DPProfile, InventoryItem, TransferRequest } from '../types';
import { INITIAL_CAMPS, INITIAL_DPS, INITIAL_INVENTORY, INITIAL_TRANSFERS } from './mockData';

const STORAGE_KEYS = {
  CAMPS: 'sanad_camps',
  DPS: 'sanad_dps',
  INVENTORY: 'sanad_inventory',
  LOGS: 'sanad_logs',
  TRANSFERS: 'sanad_transfers'
};

const delay = (ms: number = 300) => new Promise(res => setTimeout(res, ms));

export const storageService = {
  async init() {
    if (!localStorage.getItem(STORAGE_KEYS.CAMPS)) {
      localStorage.setItem(STORAGE_KEYS.CAMPS, JSON.stringify(INITIAL_CAMPS));
      localStorage.setItem(STORAGE_KEYS.DPS, JSON.stringify(INITIAL_DPS));
      localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(INITIAL_INVENTORY));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify([]));
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(INITIAL_TRANSFERS));
    }
  },

  async logAction(userId: string, action: string, details: string) {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.LOGS) || '[]');
    logs.push({
      id: Date.now().toString(),
      user_id: userId,
      action,
      details,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  async getDPs(campId?: string): Promise<DPProfile[]> {
    await delay();
    const dps: DPProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DPS) || '[]');
    if (campId) {
      return dps.filter(d => d.currentHousing.campId === campId);
    }
    // ⚠️  DISABLED: Sort by vulnerability score descending
    // return dps.sort((a, b) => (b.vulnerabilityScore || 0) - (a.vulnerabilityScore || 0));
    return dps;
  },

  async getDPById(id: string): Promise<DPProfile | null> {
    await delay();
    const dps: DPProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DPS) || '[]');
    return dps.find(d => d.id === id) || null;
  },

  async saveDP(dp: DPProfile, officerId: string = 'system') {
    await delay();
    const dps: DPProfile[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.DPS) || '[]');
    const index = dps.findIndex(d => d.id === dp.id);
    if (index > -1) dps[index] = dp;
    else dps.push(dp);
    localStorage.setItem(STORAGE_KEYS.DPS, JSON.stringify(dps));
    await this.logAction(officerId, 'SAVE_DP', `ID: ${dp.id}`);
  },

  async getCamps(): Promise<Camp[]> {
    await delay();
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.CAMPS) || '[]');
  },

  async updateCamp(camp: Camp, userId: string = 'system') {
    await delay();
    const camps: Camp[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CAMPS) || '[]');
    const index = camps.findIndex(c => c.id === camp.id);
    if (index > -1) camps[index] = camp;
    else camps.push(camp);
    localStorage.setItem(STORAGE_KEYS.CAMPS, JSON.stringify(camps));
  },

  async getInventory(campId: string): Promise<InventoryItem[]> {
    await delay();
    const allInv = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '{}');
    return allInv[campId] || [];
  },

  async saveInventoryItem(item: InventoryItem, campId: string) {
    await delay();
    const allInv = JSON.parse(localStorage.getItem(STORAGE_KEYS.INVENTORY) || '{}');
    if (!allInv[campId]) allInv[campId] = [];
    const index = allInv[campId].findIndex((i: any) => i.id === item.id);
    if (index > -1) allInv[campId][index] = item;
    else allInv[campId].push(item);
    localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(allInv));
  },

  async getTransferRequests(campId: string): Promise<TransferRequest[]> {
    await delay();
    const transfers: TransferRequest[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSFERS) || '[]');
    return transfers.filter(t => t.toCampId === campId || t.fromCampId === campId);
  },

  async updateTransferStatus(id: string, status: 'موافق' | 'مرفوض') {
    await delay();
    const transfers: TransferRequest[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSFERS) || '[]');
    const index = transfers.findIndex(t => t.id === id);
    if (index > -1) {
      transfers[index].status = status;
      // If approved, you would normally move the DP here in a real app logic
      localStorage.setItem(STORAGE_KEYS.TRANSFERS, JSON.stringify(transfers));
    }
  },

  exportTo(data: any[], filename: string) {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => Object.values(obj).map(val => {
      if (typeof val === 'object') return JSON.stringify(val);
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','));
    const csvContent = "\uFEFF" + [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
