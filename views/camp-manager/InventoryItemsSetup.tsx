// views/camp-manager/InventoryItemsSetup.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { SearchInput, DateRangeFilter, FilterPanel } from '../../components/filters';
import { normalizeArabic, matchesArabicSearchMulti } from '../../utils/arabicTextUtils';

interface InventoryItem {
  id: string;
  name?: string;
  category: string;
  unit?: string;
  
  // Quantity fields
  minStock?: number;
  min_stock?: number;
  maxStock?: number;
  max_stock?: number;
  quantityAvailable?: number;
  quantity_available?: number;
  quantityReserved?: number;
  quantity_reserved?: number;
  quantityAllocated?: number;
  quantity_allocated?: number;
  
  // New fields from schema
  minAlertThreshold?: number;
  min_alert_threshold?: number;
  expiryDate?: string;
  expiry_date?: string;
  donor?: string;
  receivedDate?: string;
  received_date?: string;
  
  isActive?: boolean;
  is_active?: boolean;
  isDeleted?: boolean;
  is_deleted?: boolean;
  campId?: string;
  camp_id?: string;
  notes?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface AidType {
  id: string;
  name: string;
  category: string;
  unit: string;
  is_active: boolean;
}

const ITEM_CATEGORIES = [
  { value: 'غذائية', label: 'غذائية', labelEn: 'Food', color: 'bg-emerald-100 text-emerald-700', icon: 'M3.375 4.5C2.339 4.5 1.5 5.34 1.5 6.375V13.5h12V6.375c0-1.036-.84-1.875-1.875-1.875h-8.25zM1.5 15h12v-1.5a1.875 1.875 0 00-1.875-1.875H3.375A1.875 1.875 0 001.5 13.5V15zM15 9.75a3 3 0 11-6 0 3 3 0 016 0z' },
  { value: 'غير غذائية', label: 'غير غذائية', labelEn: 'Non-Food', color: 'bg-blue-100 text-blue-700', icon: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z' },
  { value: 'طبية', label: 'طبية', labelEn: 'Medical', color: 'bg-red-100 text-red-700', icon: 'M14.857 1.672c.615-1.08 2.24-1.08 2.854 0l4.688 8.2c.177.31.434.567.744.744l8.2 4.688c1.08.615 1.08 2.24 0 2.854l-8.2 4.688a2.25 2.25 0 00-.744.744l-4.688 8.2c-.615 1.08-2.24 1.08-2.854 0l-4.688-8.2a2.25 2.25 0 00-.744-.744l-8.2-4.688c-1.08-.615-1.08-2.24 0-2.854l8.2-4.688a2.25 2.25 0 00.744-.744l4.688-8.2zM12 8.25a3.75 3.75 0 100 7.5 3.75 3.75 0 000-7.5z' },
  { value: 'نظافة', label: 'نظافة', labelEn: 'Hygiene', color: 'bg-cyan-100 text-cyan-700', icon: 'M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z' },
  { value: 'مأوى', label: 'مأوى', labelEn: 'Shelter', color: 'bg-orange-100 text-orange-700', icon: 'M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25' },
  { value: 'مائية', label: 'مائية', labelEn: 'Water', color: 'bg-cyan-100 text-cyan-700', icon: 'M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12 7.5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5a.75.75 0 01.75-.75zm0 6a.75.75 0 01.75.75v.75a.75.75 0 01-1.5 0v-.75a.75.75 0 01.75-.75z' },
  { value: 'أخرى', label: 'أخرى...', labelEn: 'Other', color: 'bg-gray-100 text-gray-700', icon: 'M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z' }  // Custom option
];

// SVG Icon Component
const Icon: React.FC<{ path: string; className?: string }> = ({ path, className = 'w-6 h-6' }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d={path} />
  </svg>
);

const InventoryItemsSetup: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingItem, setViewingItem] = useState<InventoryItem | null>(null);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<InventoryItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [aidTypes, setAidTypes] = useState<AidType[]>([]);

  // Enhanced filters
  const [filterStockLevel, setFilterStockLevel] = useState<string>('all'); // low/normal/over
  const [filterQuantityMin, setFilterQuantityMin] = useState<string>('');
  const [filterQuantityMax, setFilterQuantityMax] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Refs to keep values updated for useCallback closures
  const currentCampIdRef = useRef<string>('');

  useEffect(() => {
    currentCampIdRef.current = currentCampId;
  }, [currentCampId]);

  const [formData, setFormData] = useState({
    name: '',
    category: 'غذائية' as InventoryItem['category'],
    unit: 'قطعة',
    minStock: '',
    maxStock: '',
    minAlertThreshold: '',
    quantityAvailable: '',
    quantityReserved: '',
    expiryDate: '',
    donor: '',
    receivedDate: '',
    notes: ''
  });

  // Load current user's camp ID on mount
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
    } else {
      setLoading(false);
      setError('لم يتم تحديد المخيم. يرجى تسجيل الدخول كمدير مخيم.');
    }
  }, []);

  // Load inventory items and aid types
  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setToast(null);

      if (!currentCampIdRef.current) {
        setItems([]);
        setAidTypes([]);
        setLoading(false);
        return;
      }

      // Load all non-deleted items (both active and inactive) - filtering is done client-side
      const [inventoryItems, aidTypesData] = await Promise.all([
        realDataService.getInventoryItems(),
        realDataService.getAidTypes()
      ]);

      setItems(inventoryItems);
      setAidTypes(aidTypesData.filter((t: AidType) => t.is_active)); // Only show active aid types
    } catch (err: any) {
      console.error('Error loading inventory items:', err);
      setToast({ message: err.message || 'فشل تحميل عناصر المخزون', type: 'error' });
      setItems([]);
      setAidTypes([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentCampId) {
      loadItems();
    }
  }, [currentCampId]);

  // Auto-clear toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      const itemData = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        minStock: parseInt(formData.minStock) || 0,
        maxStock: parseInt(formData.maxStock) || 0,
        minAlertThreshold: parseInt(formData.minAlertThreshold) || 0,
        quantityReserved: parseFloat(formData.quantityReserved) || 0,
        expiryDate: formData.expiryDate || undefined,
        donor: formData.donor || undefined,
        receivedDate: formData.receivedDate || undefined,
        notes: formData.notes,
        isActive: true
      };

      console.log('[Inventory] Creating item:', itemData);
      console.log('[Inventory] Initial quantity:', formData.quantityAvailable);

      if (editingItem) {
        await realDataService.updateInventoryItem(editingItem.id, itemData);
        setToast({ message: 'تم تحديث عنصر المخزون بنجاح', type: 'success' });
      } else {
        // Create the inventory item
        const newItem = await realDataService.createInventoryItem(itemData);
        console.log('[Inventory] Item created:', newItem);

        // If initial quantity is provided, create an IN transaction
        if (formData.quantityAvailable && parseFloat(formData.quantityAvailable) > 0) {
          console.log('[Inventory] Creating initial transaction for:', parseFloat(formData.quantityAvailable));
          const transaction = await realDataService.createInventoryTransaction({
            itemId: newItem.id,
            transactionType: 'in',
            quantity: parseFloat(formData.quantityAvailable),
            relatedTo: 'donation',  // Initial stock as donation
            relatedId: '',
            notes: `الرصيد الأولي عند إنشاء العنصر`
          });
          console.log('[Inventory] Transaction created:', transaction);
          setToast({ message: 'تم إضافة عنصر المخزون والرصيد الأولي بنجاح', type: 'success' });
        } else {
          setToast({ message: 'تم إضافة عنصر المخزون بنجاح', type: 'success' });
        }
      }

      await loadItems();
      handleCancel();
    } catch (err: any) {
      console.error('[Inventory] Error saving:', err);
      setToast({ message: `فشل حفظ عنصر المخزون: ${err.message || 'خطأ غير معروف'}`, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'غذائية',
      unit: item.unit || 'قطعة',
      minStock: (item.min_stock ?? item.minStock ?? 0).toString(),
      maxStock: (item.max_stock ?? item.maxStock ?? 0).toString(),
      minAlertThreshold: (item.min_alert_threshold ?? item.minAlertThreshold ?? 0).toString(),
      quantityAvailable: (item.quantity_available ?? item.quantityAvailable ?? 0).toString(),
      quantityReserved: (item.quantity_reserved ?? item.quantityReserved ?? 0).toString(),
      expiryDate: item.expiry_date ?? item.expiryDate ?? '',
      donor: item.donor || '',
      receivedDate: item.received_date ?? item.receivedDate ?? '',
      notes: item.notes || ''
    });
    setShowForm(true);
  };

  const handleView = (item: InventoryItem) => {
    setViewingItem(item);
    setShowViewModal(true);
  };

  const handleToggleActive = async (item: InventoryItem) => {
    try {
      const currentActive = item.is_active !== undefined ? item.is_active : item.isActive;
      await realDataService.toggleInventoryItemStatus(item.id, !currentActive);
      setToast({ message: currentActive ? 'تم إيقاف عنصر المخزون' : 'تم تنشيط عنصر المخزون', type: 'info' });
      await loadItems();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل تحديث حالة عنصر المخزون', type: 'error' });
      console.error('Error toggling active:', err);
    }
  };

  const handleDelete = async (item: InventoryItem) => {
    setDeletingItem(item);
  };

  const handleRestore = async (item: InventoryItem) => {
    try {
      await realDataService.restoreInventoryItem(item.id, 'تمت استعادة العنصر');
      setToast({ message: 'تم استعادة عنصر المخزون بنجاح', type: 'success' });
      await loadItems();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل استعادة عنصر المخزون', type: 'error' });
      console.error('Error restoring inventory item:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deletingItem) return;

    try {
      await realDataService.deleteInventoryItem(deletingItem.id);
      setToast({ message: 'تم حذف عنصر المخزون بنجاح', type: 'success' });
      await loadItems();
      setDeletingItem(null);
    } catch (err: any) {
      setToast({ message: err.message || 'فشل حذف عنصر المخزون', type: 'error' });
      console.error('Error deleting inventory item:', err);
    }
  };

  const cancelDelete = () => {
    setDeletingItem(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'غذائية',
      unit: 'قطعة',
      minStock: '',
      maxStock: '',
      minAlertThreshold: '',
      quantityAvailable: '',
      quantityReserved: '',
      expiryDate: '',
      donor: '',
      receivedDate: '',
      notes: ''
    });
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredItems = items.filter(item => {
    const name = item.name || '';
    const isActive = item.is_active !== undefined ? item.is_active : item.isActive;
    const campId = item.camp_id || item.campId;
    const qty = item.quantityAvailable ?? 0;
    const min = item.minStock ?? item.min_stock ?? 0;
    const max = item.maxStock ?? item.max_stock ?? Infinity;

    // Arabic-normalized search
    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      name,
      item.notes,
      ITEM_CATEGORIES.find(c => c.value === item.category)?.label || ''
    ]);
    
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'نشط' && isActive) ||
      (filterStatus === 'غير نشط' && !isActive);
    
    // Stock level filter
    const matchesStockLevel = filterStockLevel === 'all' ||
      (filterStockLevel === 'منخفض' && qty <= min && qty > 0) ||
      (filterStockLevel === 'طبيعي' && qty > min && qty <= max) ||
      (filterStockLevel === 'مرتفع' && qty > max);
    
    // Quantity range filters
    const matchesQuantityMin = filterQuantityMin === '' || qty >= parseInt(filterQuantityMin);
    const matchesQuantityMax = filterQuantityMax === '' || qty <= parseInt(filterQuantityMax);

    return matchesSearch && matchesCategory && matchesStatus && 
           matchesStockLevel && matchesQuantityMin && matchesQuantityMax;
  });

  const filteredAndSortedItems = filteredItems.sort((a, b) => {
    const aValue = a[sortBy as keyof InventoryItem] || '';
    const bValue = b[sortBy as keyof InventoryItem] || '';
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const stats = {
    total: items.length,
    active: items.filter(i => {
      const isActive = i.is_active !== undefined ? i.is_active : i.isActive;
      return isActive;
    }).length,
    inactive: items.filter(i => {
      const isActive = i.is_active !== undefined ? i.is_active : i.isActive;
      return !isActive;
    }).length,
    lowStock: items.filter(i => {
      const qty = i.quantity_available ?? i.quantityAvailable ?? 0;
      const min = i.min_stock ?? i.minStock ?? 0;
      return qty <= min && qty > 0;
    }).length,
    byCategory: ITEM_CATEGORIES.reduce((acc, cat) => {
      acc[cat.value] = items.filter(i => i.category === cat.value).length;
      return acc;
    }, {} as Record<string, number>)
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-12 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
              <div className="space-y-3">
                <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-[2rem] shadow-xl p-8 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
              <Icon path="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" className="w-10 h-10" />
              إدارة عناصر المخزون
            </h1>
            <p className="text-emerald-100 font-bold text-sm">
              قم بإضافة وتصنيف عناصر المخزون وتتبع مستويات المخزون
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white text-emerald-600 rounded-xl font-black hover:bg-emerald-50 transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            إضافة عنصر جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border-2 border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 mb-1">إجمالي العناصر</p>
              <p className="text-3xl font-black text-emerald-600">{stats.total}</p>
            </div>
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <Icon path="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border-2 border-blue-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 mb-1">العناصر النشطة</p>
              <p className="text-3xl font-black text-blue-600">{stats.active}</p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
              <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border-2 border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 mb-1">مخزون منخفض</p>
              <p className="text-3xl font-black text-red-600">{stats.lowStock}</p>
            </div>
            <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600">
              <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-gray-600 mb-1">غير نشطة</p>
              <p className="text-3xl font-black text-gray-600">{stats.inactive}</p>
            </div>
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-600">
              <Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-[2.5rem]">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-800">
                  {editingItem ? 'تعديل عنصر المخزون' : 'إضافة عنصر مخزون جديد'}
                </h2>
                <button
                  onClick={handleCancel}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    الاسم <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                    placeholder="مثال: طرود غذائية"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    الفئة <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const selectedCategory = e.target.value;
                      const selectedAidType = aidTypes.find(t => t.category === selectedCategory);
                      setFormData(prev => ({
                        ...prev,
                        category: selectedCategory as any,
                        // Auto-fill unit from aid type
                        unit: selectedAidType?.unit || 'قطعة',
                      }));
                    }}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                  >
                    {aidTypes.length > 0 ? (
                      <>
                        <option value="">-- اختر نوع المساعدة --</option>
                        {aidTypes.map(type => (
                          <option key={type.id} value={type.category}>
                            {type.name} ({type.unit})
                          </option>
                        ))}
                      </>
                    ) : (
                      ITEM_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))
                    )}
                  </select>
                  {aidTypes.length === 0 && (
                    <p className="text-xs text-amber-600 font-bold mt-2">
                      💡 ملاحظة: قم بإضافة أنواع المساعدات أولاً من صفحة "إدارة أنواع المساعدات"
                    </p>
                  )}
                  {/* Show selected unit as read-only - only show when aid type is selected */}
                  {formData.unit && formData.unit !== 'قطعة' && (
                    <p className="text-xs text-gray-500 font-bold mt-2">
                      وحدة القياس: <span className="text-emerald-600 font-black">{formData.unit}</span>
                    </p>
                  )}
                </div>

                {/* Show initial quantity field ONLY when creating new item (not editing) */}
                {!editingItem && (
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">
                      الكمية المتاحة الأولية
                    </label>
                    <input
                      type="number"
                      value={formData.quantityAvailable}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantityAvailable: e.target.value }))}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 font-bold mt-1">
                      اختياري: سيتم إنشاء معاملة وارد تلقائياً
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    الحد الأدنى للمخزون
                  </label>
                  <input
                    type="number"
                    value={formData.minStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, minStock: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    الحد الأقصى للمخزون
                  </label>
                  <input
                    type="number"
                    value={formData.maxStock}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxStock: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    حد التنبيه المنخفض
                  </label>
                  <input
                    type="number"
                    value={formData.minAlertThreshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, minAlertThreshold: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                    placeholder="0"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 font-bold mt-1">
                    التنبيه عند الوصول لهذا المستوى
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    الكمية المحجوزة
                  </label>
                  <input
                    type="number"
                    value={formData.quantityReserved}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantityReserved: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                    placeholder="0"
                    min="0"
                    step="0.01"
                  />
                </div>

                {/* Expiry Date - for perishable items */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    تاريخ الصلاحية
                  </label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expiryDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                  />
                  <p className="text-xs text-gray-500 font-bold mt-1">
                    اختياري: للمواد الغذائية والطبية
                  </p>
                </div>

                {/* Donor */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    الجهة المانحة
                  </label>
                  <input
                    type="text"
                    value={formData.donor}
                    onChange={(e) => setFormData(prev => ({ ...prev, donor: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                    placeholder="اسم الجهة المانحة"
                  />
                </div>

                {/* Received Date */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">
                    تاريخ الاستلام
                  </label>
                  <input
                    type="date"
                    value={formData.receivedDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, receivedDate: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold resize-none"
                  placeholder="أي ملاحظات إضافية..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جاري الحفظ...
                    </span>
                  ) : (
                    editingItem ? 'تحديث' : 'إضافة'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {showViewModal && viewingItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 p-6 rounded-t-[2.5rem]">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-800">
                  تفاصيل عنصر المخزون
                </h2>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                  {(() => {
                    const category = ITEM_CATEGORIES.find(c => c.value === viewingItem.category);
                    return category ? <Icon path={category.icon} /> : <Icon path="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-800">{viewingItem.name}</h3>
                  <p className="text-sm text-gray-600 font-bold">
                    {ITEM_CATEGORIES.find(c => c.value === viewingItem.category)?.label || viewingItem.category}
                  </p>
                </div>
              </div>

              {/* Basic Info */}
              <div>
                <h4 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                  <Icon path="M15 12a3 3 0 11-6 0 3 3 0 016 0z" className="w-5 h-5" />
                  المعلومات الأساسية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">الاسم بالعربية</p>
                    <p className="text-base font-black text-gray-800">{viewingItem.name || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">الفئة</p>
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs ${
                      ITEM_CATEGORIES.find(c => c.value === viewingItem.category)?.color || 'bg-gray-100 text-gray-700'
                    }`}>
                      {ITEM_CATEGORIES.find(c => c.value === viewingItem.category)?.label || viewingItem.category}
                    </span>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">الوحدة</p>
                    <p className="text-base font-black text-gray-800">{viewingItem.unit || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">الحالة</p>
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs ${
                      (viewingItem.is_active !== undefined ? viewingItem.is_active : viewingItem.isActive) ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {(viewingItem.is_active !== undefined ? viewingItem.is_active : viewingItem.isActive) ? 'نشط' : 'غير نشط'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Levels */}
              <div>
                <h4 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                  <Icon path="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" className="w-5 h-5" />
                  مستويات المخزون
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-100">
                    <p className="text-xs text-emerald-700 font-bold mb-1">الحد الأدنى</p>
                    <p className="text-2xl font-black text-emerald-900">{viewingItem.min_stock ?? viewingItem.minStock ?? 0}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl border-2 border-blue-100">
                    <p className="text-xs text-blue-700 font-bold mb-1">الحد الأقصى</p>
                    <p className="text-2xl font-black text-blue-900">{viewingItem.max_stock ?? viewingItem.maxStock ?? 0}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl border-2 border-purple-100">
                    <p className="text-xs text-purple-700 font-bold mb-1">الكمية المتاحة</p>
                    <p className={`text-2xl font-black ${(viewingItem.quantity_available ?? viewingItem.quantityAvailable ?? 0) <= (viewingItem.min_stock ?? viewingItem.minStock ?? 0) ? 'text-red-600' : 'text-purple-900'}`}>
                      {viewingItem.quantity_available ?? viewingItem.quantityAvailable ?? 'غير محدد'}
                    </p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-100">
                    <p className="text-xs text-amber-700 font-bold mb-1">الكمية المحجوزة</p>
                    <p className="text-2xl font-black text-amber-900">{viewingItem.quantity_reserved ?? viewingItem.quantityReserved ?? 0}</p>
                  </div>
                </div>
                
                {/* Alert Threshold */}
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-4 bg-red-50 rounded-xl border-2 border-red-100">
                    <p className="text-xs text-red-700 font-bold mb-1">حد التنبيه المنخفض</p>
                    <p className="text-2xl font-black text-red-900">{viewingItem.min_alert_threshold ?? viewingItem.minAlertThreshold ?? 0}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-gray-100">
                    <p className="text-xs text-gray-700 font-bold mb-1">تاريخ الصلاحية</p>
                    <p className="text-lg font-black text-gray-900">
                      {viewingItem.expiry_date ?? viewingItem.expiryDate 
                        ? new Date(viewingItem.expiry_date ?? viewingItem.expiryDate).toLocaleDateString('ar-EG')
                        : 'غير محدد'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <h4 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                  <Icon path="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" className="w-5 h-5" />
                  معلومات إضافية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">الجهة المانحة</p>
                    <p className="text-base font-black text-gray-800">{viewingItem.donor || '-'}</p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">تاريخ الاستلام</p>
                    <p className="text-sm font-black text-gray-800">
                      {viewingItem.received_date ?? viewingItem.receivedDate 
                        ? new Date(viewingItem.received_date ?? viewingItem.receivedDate).toLocaleDateString('ar-EG')
                        : '-'}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <p className="text-xs text-gray-500 font-bold mb-1">تاريخ الإنشاء</p>
                    <p className="text-sm font-black text-gray-800">
                      {viewingItem.created_at || viewingItem.createdAt ? new Date(viewingItem.created_at || viewingItem.createdAt).toLocaleDateString('ar-EG') : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {viewingItem.notes && (
                <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-100">
                  <p className="text-xs text-amber-700 font-bold mb-2">ملاحظات</p>
                  <p className="text-sm text-gray-700 font-bold">{viewingItem.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={() => {
                    setShowViewModal(false);
                    handleEdit(viewingItem);
                  }}
                  className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all"
                >
                  تعديل
                </button>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingItem}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف عنصر المخزون هذا؟"
        itemName={deletingItem?.name}
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Enhanced Filter Panel */}
      <FilterPanel
        title="تصفية عناصر المخزون"
        activeFilters={[
          ...(searchTerm ? [{ id: 'search', label: `بحث: "${searchTerm}"`, value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
          ...(filterCategory !== 'all' ? [{ id: 'category', label: `الفئة: ${ITEM_CATEGORIES.find(c => c.value === filterCategory)?.label || filterCategory}`, value: filterCategory, onRemove: () => setFilterCategory('all') }] : []),
          ...(filterStatus !== 'all' ? [{ id: 'status', label: `الحالة: ${filterStatus === 'نشط' ? 'نشط' : 'غير نشط'}`, value: filterStatus, onRemove: () => setFilterStatus('all') }] : []),
          ...(filterStockLevel !== 'all' ? [{ id: 'stockLevel', label: `المستوى: ${filterStockLevel}`, value: filterStockLevel, onRemove: () => setFilterStockLevel('all') }] : [])
        ]}
        onClearAll={() => {
          setSearchTerm('');
          setFilterCategory('all');
          setFilterStatus('all');
          setFilterStockLevel('all');
          setFilterQuantityMin('');
          setFilterQuantityMax('');
        }}
        defaultOpen={showFilters}
        iconColor="emerald"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search Input with Arabic Normalization */}
          <div className="lg:col-span-3">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="ابحث باسم العنصر، الملاحظات..."
              iconColor="emerald"
              showArabicHint
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">الفئة</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
            >
              <option value="all">جميع الفئات</option>
              {aidTypes.length > 0 ? (
                aidTypes.map(type => (
                  <option key={type.id} value={type.category}>{type.name}</option>
                ))
              ) : (
                ITEM_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))
              )}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
            >
              <option value="all">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="غير نشط">غير نشط</option>
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">مستوى المخزون</label>
            <select
              value={filterStockLevel}
              onChange={(e) => setFilterStockLevel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
            >
              <option value="all">جميع المستويات</option>
              <option value="منخفض">منخفض ⚠️</option>
              <option value="طبيعي">طبيعي ✅</option>
              <option value="مرتفع">مرتفع 📦</option>
            </select>
          </div>

          {/* Quantity Range */}
          <div className="grid grid-cols-2 gap-2 md:col-span-2">
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">الكمية (من)</label>
              <input
                type="number"
                value={filterQuantityMin}
                onChange={(e) => setFilterQuantityMin(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
              />
            </div>
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">الكمية (إلى)</label>
              <input
                type="number"
                value={filterQuantityMax}
                onChange={(e) => setFilterQuantityMax(e.target.value)}
                placeholder="∞"
                min="0"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
              />
            </div>
          </div>
        </div>
      </FilterPanel>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <tr>
                <th 
                  className="px-6 py-4 text-right text-sm font-black text-gray-700 cursor-pointer hover:bg-emerald-100 transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    العنصر
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                    </svg>
                  </div>
                </th>
                <th className="px-6 py-4 text-right text-sm font-black text-gray-700">الفئة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الوحدة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الكمية المتوفرة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">المخزون</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-bold text-lg">لا توجد عناصر مخزون مطابقة</p>
                      <p className="text-gray-400 text-sm">جرب تغيير معايير البحث أو الفلترة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedItems.map((item) => {
                  const name = item.name || '';
                  const unit = item.unit || '';
                  const minStock = item.min_stock ?? item.minStock ?? 0;
                  const maxStock = item.max_stock ?? item.maxStock ?? 0;
                  const isActive = item.is_active !== undefined ? item.is_active : item.isActive;
                  const quantityAvailable = item.quantity_available ?? item.quantityAvailable;
                  const isDeleted = item.is_deleted === true;

                  return (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${isDeleted ? 'bg-red-50 border-2 border-red-200' : ''}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className={`font-black text-gray-800 text-lg ${isDeleted ? 'line-through text-red-600' : ''}`}>{name}</p>
                        {isDeleted && (
                          <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-600 text-white text-xs font-black rounded">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            محذوف
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs border-2 ${
                        ITEM_CATEGORIES.find(c => c.value === item.category)?.color || 'bg-gray-100 text-gray-700'
                      } ${isDeleted ? 'opacity-50' : ''}`}>
                        <Icon path={ITEM_CATEGORIES.find(c => c.value === item.category)?.icon || ''} className="w-5 h-5" />
                        {ITEM_CATEGORIES.find(c => c.value === item.category)?.label || item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-4 py-2 rounded-xl font-bold text-sm ${isDeleted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-lg font-black ${
                            isDeleted ? 'text-red-400 line-through' :
                            quantityAvailable !== undefined && quantityAvailable <= minStock && quantityAvailable > 0
                              ? 'text-red-600'
                              : quantityAvailable === 0
                              ? 'text-red-700'
                              : 'text-emerald-700'
                          }`}>
                            {quantityAvailable ?? 0}
                          </span>
                          <span className={`text-xs font-bold ${isDeleted ? 'text-red-300' : 'text-gray-500'}`}>{unit}</span>
                        </div>
                        {quantityAvailable !== undefined && quantityAvailable <= minStock && quantityAvailable > 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-700 rounded-lg font-black text-xs animate-pulse">
                            <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" className="w-4 h-4" />
                            مخزون منخفض
                          </span>
                        )}
                        {quantityAvailable === 0 && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg font-black text-xs animate-pulse">
                            <Icon path="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" className="w-4 h-4" />
                            نفذت الكمية
                          </span>
                        )}
                        {quantityAvailable !== undefined && quantityAvailable > minStock && quantityAvailable <= maxStock && (
                          <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-black text-xs">
                            <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                            متاح
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">أدنى:</span>
                          <span className="text-sm font-black text-gray-800">{minStock}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-600">أقصى:</span>
                          <span className="text-sm font-black text-gray-800">{maxStock}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-4 py-2 rounded-xl font-bold text-xs ${
                        isActive
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isActive ? (
                          <span className="inline-flex items-center gap-1">
                            <Icon path="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" className="w-4 h-4" />
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1">
                            <Icon path="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" className="w-4 h-4" />
                            غير نشط
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isDeleted ? (
                          <button
                            onClick={() => handleRestore(item)}
                            className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-all"
                            title="استعادة"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleView(item)}
                              className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 hover:bg-blue-200 flex items-center justify-center transition-all"
                              title="عرض التفاصيل"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-all"
                              title="تعديل"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleToggleActive(item)}
                              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                item.is_active
                                  ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                                  : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                              }`}
                              title={item.is_active ? 'إيقاف' : 'تنشيط'}
                            >
                              {item.is_active ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="w-9 h-9 rounded-xl bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center transition-all"
                              title="حذف"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
          <Icon path="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" className="w-6 h-6" />
          توزيع العناصر حسب الفئة
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {ITEM_CATEGORIES.map(cat => (
            <div key={cat.value} className="p-4 bg-gray-50 rounded-2xl text-center">
              <div className="flex justify-center mb-2 text-gray-600">
                <Icon path={cat.icon} className="w-8 h-8" />
              </div>
              <p className="text-xs font-bold text-gray-600 mb-1">{cat.label}</p>
              <p className="text-2xl font-black text-gray-800">{stats.byCategory[cat.value]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InventoryItemsSetup;
