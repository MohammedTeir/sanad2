// views/camp-manager/AidTypesConfig.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { SearchInput, FilterPanel } from '../../components/filters';
import { normalizeArabic, matchesArabicSearchMulti } from '../../utils/arabicTextUtils';

interface AidType {
  id: string;
  name: string;
  category: string;
  unit: string;
  description?: string;
  is_active: boolean;
  camp_id?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

const AID_CATEGORIES = [
  { value: 'غذائية', label: 'غذائية', labelEn: 'Food', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'غير غذائية', label: 'غير غذائية', labelEn: 'Non-Food', color: 'bg-blue-100 text-blue-700' },
  { value: 'طبية', label: 'طبية', labelEn: 'Medical', color: 'bg-red-100 text-red-700' },
  { value: 'مأوى', label: 'مأوى', labelEn: 'Shelter', color: 'bg-orange-100 text-orange-700' },
  { value: 'مائية', label: 'مائية', labelEn: 'Water', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'أخرى', label: 'أخرى...', labelEn: 'Other', color: 'bg-gray-100 text-gray-700' }  // Custom option
];

const UNITS = [
  { value: 'قطعة', label: 'قطعة', labelEn: 'Piece' },
  { value: 'كيلوغرام', label: 'كيلوغرام', labelEn: 'Kg' },
  { value: 'لتر', label: 'لتر', labelEn: 'Liter' },
  { value: 'علبة', label: 'علبة', labelEn: 'Box' },
  { value: 'كيس', label: 'كيس', labelEn: 'Bag' },
  { value: 'أخرى', label: 'أخرى...', labelEn: 'Other' }  // Custom option
];

const AidTypesConfig: React.FC = () => {
  const [aidTypes, setAidTypes] = useState<AidType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingType, setEditingType] = useState<AidType | null>(null);
  const [deletingType, setDeletingType] = useState<AidType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentCampId, setCurrentCampId] = useState<string>('');

  // Ref to keep currentCampId updated for useCallback closures
  const currentCampIdRef = useRef<string>('');

  useEffect(() => {
    currentCampIdRef.current = currentCampId;
  }, [currentCampId]);

  // Enhanced filters
  const [filterStatus, setFilterStatus] = useState<string>('all'); // active/inactive
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'غذائية' as AidType['category'],
    customCategory: '',
    description: '',
    unit: 'قطعة',
    customUnit: ''
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

  // Load aid types
  const loadAidTypes = useCallback(async () => {
    try {
      setLoading(true);
      setToast(null);

      if (!currentCampIdRef.current) {
        setAidTypes([]);
        setLoading(false);
        return;
      }

      const types = await realDataService.getAidTypes();
      setAidTypes(types);
    } catch (err: any) {
      console.error('Error loading aid types:', err);
      setToast({ message: err.message || 'فشل تحميل أنواع المساعدات', type: 'error' });
      setAidTypes([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentCampId) {
      loadAidTypes();
    }
  }, [currentCampId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      // Determine the category and unit to use
      const selectedCategory = formData.category === 'أخرى' ? formData.customCategory : formData.category;
      const selectedUnit = formData.unit === 'أخرى' ? formData.customUnit : formData.unit;
      
      if (editingType) {
        // Update existing aid type
        await realDataService.updateAidType(editingType.id, {
          name: formData.name,
          category: selectedCategory,
          unit: selectedUnit,
          description: formData.description || undefined
        });
        setToast({ message: 'تم تحديث نوع المساعدة بنجاح', type: 'success' });
      } else {
        // Create new aid type
        await realDataService.createAidType({
          name: formData.name,
          category: selectedCategory,
          unit: selectedUnit,
          description: formData.description || undefined,
          isActive: true
        });
        setToast({ message: 'تم إضافة نوع المساعدة بنجاح', type: 'success' });
      }

      // Reset form and close modal
      setFormData({
        name: '',
        category: 'غذائية',
        customCategory: '',
        description: '',
        unit: 'قطعة',
        customUnit: ''
      });
      setEditingType(null);
      setShowForm(false);

      // Reload list
      await loadAidTypes();
    } catch (err: any) {
      console.error('Error saving aid type:', err);
      setToast({ message: err.message || 'فشل حفظ نوع المساعدة', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (type: AidType) => {
    setEditingType(type);
    
    // Check if category or unit are custom (not in predefined lists)
    const isCustomCategory = !AID_CATEGORIES.find(c => c.value === type.category);
    const isCustomUnit = !UNITS.find(u => u.value === type.unit);

    setFormData({
      name: type.name,
      category: isCustomCategory ? 'أخرى' : type.category,
      customCategory: isCustomCategory ? type.category : '',
      description: type.description || '',
      unit: isCustomUnit ? 'أخرى' : type.unit,
      customUnit: isCustomUnit ? type.unit : ''
    });
    setShowForm(true);
  };

  const handleToggleActive = async (type: AidType) => {
    try {
      await realDataService.toggleAidTypeStatus(type.id, !type.is_active);
      setToast({ message: type.is_active ? 'تم إيقاف نوع المساعدة' : 'تم تنشيط نوع المساعدة', type: 'info' });
      await loadAidTypes();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل تحديث حالة نوع المساعدة', type: 'error' });
      console.error('Error toggling active:', err);
    }
  };

  const handleDelete = (type: AidType) => {
    setDeletingType(type);
  };

  const confirmDelete = async () => {
    if (!deletingType) return;
    
    try {
      await realDataService.deleteAidType(deletingType.id);
      setToast({ message: 'تم حذف نوع المساعدة بنجاح', type: 'success' });
      await loadAidTypes();
      setDeletingType(null);
    } catch (err: any) {
      setToast({ message: err.message || 'فشل حذف نوع المساعدة', type: 'error' });
      console.error('Error deleting aid type:', err);
    }
  };

  const cancelDelete = () => {
    setDeletingType(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingType(null);
    setFormData({
      name: '',
      category: 'غذائية',
      description: '',
      unit: 'قطعة'
    });
  };

  const filteredTypes = aidTypes.filter(type => {
    // Arabic-normalized search across multiple fields
    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      type.name,
      type.name,
      type.description,
      AID_CATEGORIES.find(c => c.value === type.category)?.label || ''
    ]);
    
    const matchesCategory = filterCategory === 'all' || type.category === filterCategory;
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'نشط' && type.is_active) ||
      (filterStatus === 'غير نشط' && !type.is_active);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const stats = {
    total: aidTypes.length,
    active: aidTypes.filter(t => t.is_active).length,
    food: aidTypes.filter(t => t.category === 'غذائية').length,
    nonFood: aidTypes.filter(t => t.category === 'غير غذائية').length,
    medical: aidTypes.filter(t => t.category === 'طبية').length,
    cash: aidTypes.filter(t => t.category === 'نقدية').length
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="space-y-2">
                <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-60 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="w-40 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Statistics Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-6 border-t">
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
            </div>
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['اسم المساعدة', 'الفئة', 'وحدة القياس', 'الحالة', 'تاريخ الإنشاء', 'الإجراءات'].map((header, i) => (
                    <th key={i} className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse mx-auto"></div>
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingType}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف نوع المساعدة هذا؟"
        itemName={deletingType?.name}
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Header */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              أنواع المساعدات
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">قم بتعريف أنواع المساعدات المتاحة في مخيمك</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة نوع مساعدة
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-6 border-t">
          <div className="bg-gray-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-gray-600">{stats.total}</p>
            <p className="text-xs font-bold text-gray-700 mt-1">الإجمالي</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-600">{stats.active}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">نشط</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-600">{stats.food}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">غذائية</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-blue-600">{stats.nonFood}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">غير غذائية</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-red-600">{stats.medical}</p>
            <p className="text-xs font-bold text-red-700 mt-1">طبية</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{stats.cash}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">نقدية</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                {editingType ? 'تعديل نوع المساعدة' : 'إضافة نوع مساعدة جديدة'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">الاسم *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      placeholder="مثال: سلة غذائية"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">الفئة *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      required
                    >
                      {AID_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label} - {cat.labelEn}</option>
                      ))}
                    </select>
                    {/* Show custom category input when "أخرى" is selected OR value is custom */}
                    {(formData.category === 'أخرى' || !AID_CATEGORIES.find(c => c.value === formData.category)) && (
                      <input
                        type="text"
                        value={formData.customCategory || (formData.category === 'أخرى' ? '' : formData.category)}
                        onChange={(e) => setFormData(prev => ({ ...prev, customCategory: e.target.value, category: 'أخرى' }))}
                        className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                        placeholder="أدخل الفئة..."
                        required
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">وحدة القياس *</label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      required
                    >
                      {UNITS.map(unit => (
                        <option key={unit.value} value={unit.value}>{unit.label} - {unit.labelEn}</option>
                      ))}
                    </select>
                    {/* Show custom unit input when "أخرى" is selected OR value is custom */}
                    {(formData.unit === 'أخرى' || !UNITS.find(u => u.value === formData.unit)) && (
                      <input
                        type="text"
                        value={formData.customUnit || (formData.unit === 'أخرى' ? '' : formData.unit)}
                        onChange={(e) => setFormData(prev => ({ ...prev, customUnit: e.target.value, unit: 'أخرى' }))}
                        className="w-full mt-2 px-4 py-3 rounded-xl border-2 border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                        placeholder="أدخل وحدة القياس..."
                        required
                      />
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">الوصف</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      placeholder="وصف تفصيلي لنوع المساعدة..."
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t">
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
                      editingType ? 'تحديث' : 'إضافة'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filter Panel */}
      <FilterPanel
        title="تصفية أنواع المساعدات"
        activeFilters={[
          ...(searchTerm ? [{ id: 'search', label: `بحث: "${searchTerm}"`, value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
          ...(filterCategory !== 'all' ? [{ id: 'category', label: `الفئة: ${AID_CATEGORIES.find(c => c.value === filterCategory)?.label}`, value: filterCategory, onRemove: () => setFilterCategory('all') }] : []),
          ...(filterStatus !== 'all' ? [{ id: 'status', label: `الحالة: ${filterStatus === 'نشط' ? 'نشط' : 'غير نشط'}`, value: filterStatus, onRemove: () => setFilterStatus('all') }] : [])
        ]}
        onClearAll={() => {
          setSearchTerm('');
          setFilterCategory('all');
          setFilterStatus('all');
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
              placeholder="ابحث باسم نوع المساعدة، الوصف..."
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
              {AID_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
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
        </div>
      </FilterPanel>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-black text-gray-700">نوع المساعدة</th>
                <th className="px-6 py-4 text-right text-sm font-black text-gray-700">الفئة</th>
                <th className="px-6 py-4 text-right text-sm font-black text-gray-700">الوصف</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">وحدة القياس</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTypes.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-bold">لا توجد أنواع مساعدات مطابقة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-black text-gray-800">{type.name}</p>
                        <p className="text-sm text-gray-500 font-bold">{type.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs border-2 ${AID_CATEGORIES.find(c => c.value === type.category)?.color || 'bg-gray-100 text-gray-700'}`}>
                        {AID_CATEGORIES.find(c => c.value === type.category)?.label || type.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 font-bold max-w-xs truncate">{type.description}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-lg font-bold text-xs">
                        {type.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActive(type)}
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                          type.is_active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full ${type.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                        {type.is_active ? 'نشط' : 'متوقف'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(type)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(type)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-emerald-800 mb-2">معلومات هامة</h3>
            <ul className="space-y-1 text-sm text-emerald-700 font-bold">
              <li>• أنواع المساعدات خاصة بكل مخيم ولا يمكن مشاركتها بين المخيمات</li>
              <li>• يمكنك تفعيل أو إيقاف نوع المساعدة دون حذفه</li>
              <li>• لا يمكن حذف نوع المساعدة إذا كان مرتبطاً بحملات توزيع قائمة</li>
              <li>• تأكد من تحديد وحدة القياس المناسبة لكل نوع مساعدة</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AidTypesConfig;