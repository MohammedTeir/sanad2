// views/camp-manager/InventoryLedger.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { SearchInput, DateRangeFilter, MultiSelectFilter, FilterPanel } from '../../components/filters';
import { normalizeArabic, matchesArabicSearchMulti } from '../../utils/arabicTextUtils';

interface InventoryTransaction {
  id: string;
  itemId: string;
  itemName?: string;
  transactionType: 'وارد' | 'صادر';
  quantity: number;
  relatedTo: 'شراء' | 'تبرع' | 'توزيع' | 'تحويل' | 'تعديل' | 'تلف';
  relatedId?: string;
  notes?: string;
  processedByUserId?: string;
  processedAt: string;
  createdAt: string;
}

interface InventoryItem {
  id: string;
  name?: string;
  nameAr?: string;
  unit?: string;
  unitAr?: string;
  quantity_available?: number;
  quantityAvailable?: number;
}

const TRANSACTION_TYPES = {
  'وارد': { label: 'وارد', color: 'bg-emerald-100 text-emerald-700', icon: '⬇️' },
  'صادر': { label: 'صادر', color: 'bg-red-100 text-red-700', icon: '⬆️' }
};

const RELATED_TO_TYPES = {
  'شراء': { label: 'شراء', color: 'bg-blue-100 text-blue-700' },
  'تبرع': { label: 'تبرع', color: 'bg-purple-100 text-purple-700' },
  'توزيع': { label: 'توزيع', color: 'bg-green-100 text-green-700' },
  'تحويل': { label: 'نقل', color: 'bg-amber-100 text-amber-700' },
  'تعديل': { label: 'تسوية', color: 'bg-gray-100 text-gray-700' },
  'تلف': { label: 'تلف', color: 'bg-orange-100 text-orange-700' }
};

const InventoryLedger: React.FC = () => {
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'وارد' | 'صادر'>('all');
  const [filterRelatedTo, setFilterRelatedTo] = useState<string>('all');
  const [filterItemId, setFilterItemId] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [currentCampId, setCurrentCampId] = useState<string>('');

  // Enhanced filters
  const [filterQuantityMin, setFilterQuantityMin] = useState<string>('');
  const [filterQuantityMax, setFilterQuantityMax] = useState<string>('');
  const [filterItemCategory, setFilterItemCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    itemId: '',
    transactionType: 'وارد' as 'وارد' | 'صادر',
    quantity: '',
    relatedTo: 'تبرع' as 'شراء' | 'تبرع' | 'توزيع' | 'تحويل' | 'تعديل' | 'تلف',
    relatedId: '',
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
      setToast({ message: 'لم يتم تحديد المخيم. يرجى تسجيل الدخول كمدير مخيم.', type: 'error' });
    }
  }, []);

  // Load transactions
  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setToast(null);

      if (!currentCampId) {
        setTransactions([]);
        setLoading(false);
        return;
      }

      const filters: any = {};
      if (filterItemId !== 'all') filters.itemId = filterItemId;
      if (filterType !== 'all') filters.transactionType = filterType;
      if (filterRelatedTo !== 'all') filters.relatedTo = filterRelatedTo;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;

      console.log('Loading transactions with filters:', filters);
      const data = await realDataService.getInventoryTransactions(filters);
      console.log('Transactions loaded:', data);
      setTransactions(data);
    } catch (err: any) {
      console.error('Error loading transactions:', err);
      setToast({ message: err.message || 'فشل تحميل سجل المخزون', type: 'error' });
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, [currentCampId, filterItemId, filterType, filterRelatedTo, startDate, endDate]);

  // Load inventory items for dropdown
  const loadInventoryItems = useCallback(async () => {
    try {
      console.log('[InventoryLedger] Loading inventory items...');
      const items = await realDataService.getInventoryItems();
      console.log('[InventoryLedger] Inventory items loaded:', items);
      setInventoryItems(items);
    } catch (err: any) {
      console.error('Error loading inventory items:', err);
      setToast({ message: err.message || 'فشل تحميل عناصر المخزون', type: 'error' });
    }
  }, []);

  useEffect(() => {
    if (currentCampId) {
      loadInventoryItems();
    }
  }, [currentCampId, loadInventoryItems]);

  useEffect(() => {
    if (currentCampId) {
      loadTransactions();
    }
  }, [currentCampId, loadTransactions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      if (!formData.itemId || !formData.quantity) {
        setToast({ message: 'الرجاء إدخال جميع الحقول المطلوبة', type: 'warning' });
        setSaving(false);
        return;
      }

      await realDataService.createInventoryTransaction({
        itemId: formData.itemId,
        transactionType: formData.transactionType,
        quantity: parseFloat(formData.quantity),
        relatedTo: formData.relatedTo,
        relatedId: formData.relatedId || undefined,
        notes: formData.notes || undefined
      });

      setToast({ message: 'تم إضافة المعاملة بنجاح', type: 'success' });
      setFormData({
        itemId: '',
        transactionType: 'وارد',
        quantity: '',
        relatedTo: 'تبرع',
        relatedId: '',
        notes: ''
      });
      setShowForm(false);
      await loadTransactions();
      await loadInventoryItems(); // Reload to get updated quantities
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setToast({ message: err.message || 'فشل إضافة المعاملة', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setFormData({
      itemId: '',
      transactionType: 'وارد',
      quantity: '',
      relatedTo: 'تبرع',
      relatedId: '',
      notes: ''
    });
  };

  const filteredTransactions = transactions.map(tx => {
    // Use itemName from backend if available, otherwise lookup from inventoryItems
    const itemName = tx.itemName || (() => {
      const item = inventoryItems.find(i => i.id === tx.itemId);
      return item?.name;
    })() || 'Unknown';
    
    // Get item category for filtering
    const item = inventoryItems.find(i => i.id === tx.itemId);
    const itemCategory = item?.category || 'other';

    return {
      ...tx,
      itemName,
      itemCategory
    };
  }).filter(tx => {
    // Arabic-normalized search
    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      tx.itemName,
      tx.notes,
      TRANSACTION_TYPES[tx.transactionType as keyof typeof TRANSACTION_TYPES]?.label,
      RELATED_TO_TYPES[tx.relatedTo as keyof typeof RELATED_TO_TYPES]?.label
    ]);
    
    // Additional filters
    const matchesQuantityMin = filterQuantityMin === '' || tx.quantity >= parseInt(filterQuantityMin);
    const matchesQuantityMax = filterQuantityMax === '' || tx.quantity <= parseInt(filterQuantityMax);
    const matchesCategory = filterItemCategory === 'all' || tx.itemCategory === filterItemCategory;
    
    return matchesSearch && matchesQuantityMin && matchesQuantityMax && matchesCategory;
  });

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: transactions.length,
    totalIn: transactions.filter(t => t.transactionType === 'وارد').reduce((sum, t) => sum + t.quantity, 0),
    totalOut: transactions.filter(t => t.transactionType === 'صادر').reduce((sum, t) => sum + t.quantity, 0),
    thisMonth: transactions.filter(t => {
      const txDate = new Date(t.processedAt);
      const now = new Date();
      return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
    }).length
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-4 text-center">
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[...Array(7)].map((_, i) => (
                    <th key={i} className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              سجل المخزون
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">سجل حركات المخزون الواردة والصادرة</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-black hover:from-amber-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            معاملة جديدة
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-gray-700">{stats.total}</p>
            <p className="text-xs font-bold text-gray-600 mt-1">إجمالي الحركات</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">{stats.totalIn.toLocaleString()}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">وارد</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-red-600">{stats.totalOut.toLocaleString()}</p>
            <p className="text-xs font-bold text-red-700 mt-1">صادر</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-blue-600">{stats.thisMonth}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">هذا الشهر</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-amber-600">{inventoryItems.length}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">عنصر مخزون</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                إضافة معاملة جديدة
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">العنصر *</label>
                    <select
                      name="itemId"
                      value={formData.itemId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
                      required
                    >
                      <option value="">اختر العنصر...</option>
                      {inventoryItems.map(item => {
                        // Handle both snake_case and camelCase field names
                        const itemName = item.name || 'غير محدد';
                        const itemUnit = item.unit || '';
                        const itemQty = item.quantity_available ?? item.quantityAvailable ?? 0;
                        
                        return (
                          <option key={item.id} value={item.id}>
                            {itemName} (المتوفر: {itemQty} {itemUnit})
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">نوع الحركة *</label>
                    <select
                      name="transactionType"
                      value={formData.transactionType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
                      required
                    >
                      <option value="وارد">⬇️ وارد (إضافة للمخزون)</option>
                      <option value="صادر">⬆️ صادر (إخراج من المخزون)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">الكمية *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
                      placeholder="0"
                      min="0.01"
                      step="0.01"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">مرتبط بـ *</label>
                    <select
                      name="relatedTo"
                      value={formData.relatedTo}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
                      required
                    >
                      <option value="شراء">شراء</option>
                      <option value="تبرع">تبرع</option>
                      <option value="توزيع">توزيع</option>
                      <option value="تحويل">نقل</option>
                      <option value="تعديل">تسوية</option>
                      <option value="تلف">تلف</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">المعرف المرتبط</label>
                    <input
                      type="text"
                      name="relatedId"
                      value={formData.relatedId}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
                      placeholder="اختياري"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">ملاحظات</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
                      placeholder="ملاحظات إضافية..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-black hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                      'إضافة'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">بحث</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث باسم العنصر أو الملاحظات..."
              className="w-full px-3 md:px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-sm md:text-base"
            />
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">العنصر</label>
            <select
              value={filterItemId}
              onChange={(e) => setFilterItemId(e.target.value)}
              className="w-full px-3 md:px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-sm md:text-base"
            >
              <option value="all">جميع العناصر</option>
              {inventoryItems.map(item => (
                <option key={item.id} value={item.id}>{item.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">النوع</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 md:px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-sm md:text-base"
            >
              <option value="all">الجميع</option>
              <option value="وارد">وارد</option>
              <option value="صادر">صادر</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">مرتبط بـ</label>
            <select
              value={filterRelatedTo}
              onChange={(e) => setFilterRelatedTo(e.target.value)}
              className="w-full px-3 md:px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-sm md:text-base"
            >
              <option value="all">الجميع</option>
              {Object.entries(RELATED_TO_TYPES).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">من تاريخ</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 md:px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-sm md:text-base"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">العنصر</th>
                <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">النوع</th>
                <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">الكمية</th>
                <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">مرتبط بـ</th>
                <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">ملاحظات</th>
                <th className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">التاريخ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 md:px-6 py-12 md:py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold text-lg">لا توجد حركات مطابقة</p>
                        <p className="text-gray-400 text-sm font-bold mt-1">ابدأ بإضافة معاملة جديدة</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all">
                    <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4">
                      <p className="font-black text-gray-800 text-sm md:text-base">{tx.itemName}</p>
                    </td>
                    <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 md:px-3 py-1 md:py-1.5 rounded-full font-black text-xs border-2 ${TRANSACTION_TYPES[tx.transactionType as keyof typeof TRANSACTION_TYPES]?.color || 'bg-gray-100 text-gray-700'}`}>
                        <span>{TRANSACTION_TYPES[tx.transactionType as keyof typeof TRANSACTION_TYPES]?.icon}</span>
                        {TRANSACTION_TYPES[tx.transactionType as keyof typeof TRANSACTION_TYPES]?.label}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center">
                      <p className={`font-black ${tx.transactionType === 'وارد' ? 'text-emerald-600' : 'text-red-600'} text-base md:text-lg`}>
                        {tx.transactionType === 'وارد' ? '+' : '-'}{tx.quantity.toLocaleString()}
                      </p>
                    </td>
                    <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4">
                      <span className={`inline-block px-2 md:px-3 py-1 rounded-lg font-black text-xs border-2 ${RELATED_TO_TYPES[tx.relatedTo as keyof typeof RELATED_TO_TYPES]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {RELATED_TO_TYPES[tx.relatedTo as keyof typeof RELATED_TO_TYPES]?.label}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4">
                      <p className="text-xs md:text-sm text-gray-600 font-bold max-w-[120px] md:max-w-xs truncate">{tx.notes || '-'}</p>
                    </td>
                    <td className="px-3 md:px-4 lg:px-6 py-3 md:py-4 text-center">
                      <p className="text-xs md:text-sm font-bold text-gray-700">
                        {new Date(tx.processedAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </p>
                      <p className="text-xs text-gray-500 font-bold">
                        {new Date(tx.processedAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-[2rem] border shadow-sm p-4 md:p-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4">
            <p className="text-xs md:text-sm font-bold text-gray-600 text-center md:text-right">
              عرض {startIndex + 1} إلى {Math.min(startIndex + itemsPerPage, filteredTransactions.length)} من أصل {filteredTransactions.length} حركة
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
              >
                السابق
              </button>
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-xl font-bold transition-all text-sm md:text-base ${
                    currentPage === i + 1
                      ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                      : 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 md:px-4 md:py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm md:text-base"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-orange-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-amber-800 mb-2 text-lg">معلومات هامة</h3>
            <ul className="space-y-1 text-sm text-amber-700 font-bold">
              <li>• الحركات الواردة (⬇️) تزيد من كمية المخزون</li>
              <li>• الحركات الصادرة (⬆️) تنقص من كمية المخزون</li>
              <li>• لا يمكن إخراج كمية أكبر من المتوفر في المخزون</li>
              <li>• جميع الحركات مسجلة ومؤرخة للمراجعة والتدقيق</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryLedger;
