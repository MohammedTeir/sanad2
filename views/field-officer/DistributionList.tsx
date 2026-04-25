// views/field-officer/DistributionList.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import { SearchInput, DateRangeFilter, FilterPanel } from '../../components/filters';
import { matchesArabicSearchMulti, normalizeArabic } from '../../utils/arabicTextUtils';

interface AidCampaign {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: 'مخططة' | 'نشطة' | 'مكتملة' | 'ملغاة';
  aidType: string;
  aidCategory: string;
  targetFamilies?: string[];
  distributedTo?: string[];
  coordinatorUserId?: string;
  notes?: string;
  campId?: string;
  inventoryItemId?: string;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG = {
  'مخططة': { label: 'مخططة', color: 'bg-blue-100 text-blue-700' },
  'نشطة': { label: 'نشطة', color: 'bg-emerald-100 text-emerald-700' },
  'مكتملة': { label: 'مكتملة', color: 'bg-gray-100 text-gray-700' },
  'ملغاة': { label: 'ملغاة', color: 'bg-red-100 text-red-700' }
};

const AID_CATEGORIES = [
  { value: 'غذائية', label: 'غذائية', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'غير غذائية', label: 'غير غذائية', color: 'bg-blue-100 text-blue-700' },
  { value: 'طبية', label: 'طبية', color: 'bg-red-100 text-red-700' },
  { value: 'نقدية', label: 'نقدية', color: 'bg-amber-100 text-amber-700' },
  { value: 'نظافة', label: 'نظافة', color: 'bg-purple-100 text-purple-700' },
  { value: 'مأوى', label: 'مأوى', color: 'bg-orange-100 text-orange-700' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700' }
];

const PROGRESS_RANGES = [
  { value: '0', label: 'لم يبدأ' },
  { value: '1-25', label: '1-25%' },
  { value: '26-50', label: '26-50%' },
  { value: '51-75', label: '51-75%' },
  { value: '76-99', label: '76-99%' },
  { value: '100', label: '100%' }
];

const getCategoryColor = (categoryValue: string): string => {
  const englishToArabic: Record<string, string> = {
    'food': 'غذائية',
    'non_food': 'غير غذائية',
    'medical': 'طبية',
    'cash': 'نقدية',
    'hygiene': 'نظافة',
    'shelter': 'مأوى',
    'other': 'أخرى'
  };
  const arabicValue = englishToArabic[categoryValue] || categoryValue;
  const category = AID_CATEGORIES.find(c => c.value === arabicValue || c.value === categoryValue);
  return category?.color || 'bg-gray-100 text-gray-700';
};

const getCategoryLabel = (categoryValue: string): string => {
  const englishToArabic: Record<string, string> = {
    'food': 'غذائية',
    'non_food': 'غير غذائية',
    'medical': 'طبية',
    'cash': 'نقدية',
    'hygiene': 'نظافة',
    'shelter': 'مأوى',
    'other': 'أخرى'
  };
  if (englishToArabic[categoryValue]) {
    return englishToArabic[categoryValue];
  }
  return categoryValue;
};

const getProgressRange = (progress: number): string => {
  if (progress === 0) return '0';
  if (progress === 100) return '100';
  if (progress <= 25) return '1-25';
  if (progress <= 50) return '26-50';
  if (progress <= 75) return '51-75';
  return '76-99';
};

const DistributionList: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AidCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [currentCampId, setCurrentCampId] = useState<string>('');

  // Ref to keep currentCampId updated for useCallback closures
  const currentCampIdRef = useRef<string>('');

  useEffect(() => {
    currentCampIdRef.current = currentCampId;
  }, [currentCampId]);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'مخططة' | 'نشطة' | 'مكتملة' | 'ملغاة'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterProgress, setFilterProgress] = useState<string>('all');
  const [filterAidType, setFilterAidType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load current user's camp ID on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
    } else {
      setLoading(false);
      setToast({ message: 'لم يتم تحديد المخيم. يرجى تسجيل الدخول كضابط ميداني.', type: 'error' });
    }
  }, []);

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      const data = await realDataService.getAidCampaigns();
      const campCampaigns = data.filter(c => c.campId === currentCampIdRef.current || !c.campId);
      setCampaigns(campCampaigns);
    } catch (err: any) {
      console.error('Error loading campaigns:', err);
      setToast({ message: err.message || 'فشل تحميل حملات المساعدات', type: 'error' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentCampId) {
      loadCampaigns().finally(() => setLoading(false));
    }
  }, [currentCampId]);

  // Get unique aid types for filter
  const uniqueAidTypes = Array.from(new Set(campaigns.map(c => c.aidType).filter(Boolean)));

  // Calculate progress for a campaign
  const getProgress = (campaign: AidCampaign): number => {
    const target = campaign.targetFamilies?.length || 0;
    const distributed = campaign.distributedTo?.length || 0;
    if (target === 0) return 0;
    return Math.round((distributed / target) * 100);
  };

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      campaign.name,
      campaign.description,
      campaign.aidType,
      campaign.notes,
      getCategoryLabel(campaign.aidCategory)
    ]);

    const campaignCategory = getCategoryLabel(campaign.aidCategory);
    const matchesCategory = filterCategory === 'all' || campaign.aidCategory === filterCategory || campaignCategory === filterCategory;
    const matchesStartDate = filterStartDate === '' || new Date(campaign.startDate) >= new Date(filterStartDate);
    const matchesEndDate = filterEndDate === '' || (campaign.endDate && new Date(campaign.endDate) <= new Date(filterEndDate));
    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;

    // Progress filter
    const progress = getProgress(campaign);
    const progressRange = getProgressRange(progress);
    const matchesProgress = filterProgress === 'all' || progressRange === filterProgress;

    // Aid type filter
    const matchesAidType = filterAidType === 'all' || campaign.aidType === filterAidType;

    return matchesSearch && matchesCategory && matchesStartDate && matchesEndDate && matchesStatus && matchesProgress && matchesAidType;
  });

  // Paginate
  const paginatedCampaigns = filteredCampaigns.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const stats = {
    totalCampaigns: campaigns.length,
    plannedCampaigns: campaigns.filter(c => c.status === 'مخططة').length,
    activeCampaigns: campaigns.filter(c => c.status === 'نشطة').length,
    completedCampaigns: campaigns.filter(c => c.status === 'مكتملة').length,
    totalTargetFamilies: campaigns.reduce((sum, c) => sum + (c.targetFamilies?.length || 0), 0),
    totalServedFamilies: campaigns.reduce((sum, c) => sum + (c.distributedTo?.length || 0), 0)
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div>
                <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-12 w-36 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
          
          {/* Statistics Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center">
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Panel Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Campaign Cards Skeleton */}
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-6 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="text-left">
                      <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
                    </div>
                  </div>
                </div>
                <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-gray-300 animate-pulse" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(4)].map((_, j) => (
                    <div key={j} className="bg-gray-50 rounded-xl p-4">
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
                      <div className="h-5 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              قائمة التوزيعات الميدانية
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">عرض ومتابعة حملات توزيع المساعدات في الميدان</p>
          </div>
          {/* Field officers typically don't create campaigns, so we hide the button or remove it */}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-blue-600">{stats.plannedCampaigns}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">مخططة</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">{stats.activeCampaigns}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">نشطة</p>
          </div>
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-gray-600">{stats.completedCampaigns}</p>
            <p className="text-xs font-bold text-gray-700 mt-1">مكتملة</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-purple-600">{stats.totalServedFamilies}</p>
            <p className="text-xs font-bold text-purple-700 mt-1">أسر مستفيدة</p>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        title="تصفية الحملات"
        activeFilters={[
          ...(searchTerm ? [{ id: 'search', label: `بحث: "${searchTerm}"`, value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
          ...(filterStatus !== 'all' ? [{ id: 'status', label: `الحالة: ${filterStatus}`, value: filterStatus, onRemove: () => setFilterStatus('all') }] : []),
          ...(filterCategory !== 'all' ? [{ id: 'category', label: `الفئة: ${getCategoryLabel(filterCategory)}`, value: filterCategory, onRemove: () => setFilterCategory('all') }] : []),
          ...(filterProgress !== 'all' ? [{ id: 'progress', label: `نسبة الإنجاز: ${PROGRESS_RANGES.find(p => p.value === filterProgress)?.label}`, value: filterProgress, onRemove: () => setFilterProgress('all') }] : []),
          ...(filterAidType !== 'all' ? [{ id: 'aidType', label: `نوع المساعدة: ${filterAidType}`, value: filterAidType, onRemove: () => setFilterAidType('all') }] : []),
          ...(filterStartDate || filterEndDate ? [{ id: 'dateRange', label: `من ${filterStartDate || '...'} إلى ${filterEndDate || '...'}`, value: 'dateRange', onRemove: () => { setFilterStartDate(''); setFilterEndDate(''); } }] : [])
        ]}
        onClearAll={() => {
          setSearchTerm('');
          setFilterStatus('all');
          setFilterCategory('all');
          setFilterProgress('all');
          setFilterAidType('all');
          setFilterStartDate('');
          setFilterEndDate('');
        }}
        defaultOpen={showFilters}
        iconColor="amber"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="ابحث باسم الحملة، الوصف، النوع، الملاحظات..."
              iconColor="amber"
              showArabicHint
            />
          </div>
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
            >
              <option value="all">الجميع</option>
              <option value="مخططة">مخططة</option>
              <option value="نشطة">نشطة</option>
              <option value="مكتملة">مكتملة</option>
              <option value="ملغاة">ملغاة</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">الفئة</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
            >
              <option value="all">جميع الفئات</option>
              {AID_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">نسبة الإنجاز</label>
            <select
              value={filterProgress}
              onChange={(e) => setFilterProgress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
            >
              <option value="all">الجميع</option>
              {PROGRESS_RANGES.map(range => (
                <option key={range.value} value={range.value}>{range.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">نوع المساعدة</label>
            <select
              value={filterAidType}
              onChange={(e) => setFilterAidType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
            >
              <option value="all">الجميع</option>
              {uniqueAidTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <DateRangeFilter
              label="فترة الحملة"
              startDate={filterStartDate}
              endDate={filterEndDate}
              onChange={(start, end) => {
                setFilterStartDate(start);
                setFilterEndDate(end);
              }}
              presetRanges={[
                { label: 'هذا الشهر', value: 'thisMonth' },
                { label: 'الشهر الماضي', value: 'lastMonth' },
                { label: 'آخر 3 أشهر', value: 'last3months' },
                { label: 'هذا العام', value: 'thisYear' }
              ]}
            />
          </div>
        </div>
      </FilterPanel>

      {/* Campaign Cards */}
      <div className="space-y-6">
        {paginatedCampaigns.length === 0 ? (
          <div className="bg-white rounded-[2rem] border shadow-sm p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p className="text-gray-500 font-bold text-lg">لا توجد حملات تطابق التصفية</p>
            <p className="text-gray-400 text-sm font-bold mt-1">جرب تغيير معايير التصفية</p>
          </div>
        ) : (
          paginatedCampaigns.map((campaign) => {
            const progress = getProgress(campaign);
            const distributedCount = campaign.distributedTo?.length || 0;
            const targetCount = campaign.targetFamilies?.length || 0;

            return (
              <div key={campaign.id} className="bg-white rounded-[2rem] border shadow-sm overflow-hidden hover:shadow-md transition-all">
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-amber-100">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <h3 className="text-xl font-black text-gray-800">{campaign.name}</h3>
                        <span className={`px-3 py-1 rounded-full font-black text-xs border-2 ${STATUS_CONFIG[campaign.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                          {STATUS_CONFIG[campaign.status]?.label || campaign.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full font-black text-xs border-2 ${getCategoryColor(campaign.aidCategory)}`}>
                          {getCategoryLabel(campaign.aidCategory)}
                        </span>
                        {campaign.aidType && (
                          <span className={`px-3 py-1 rounded-full font-black text-xs border-2 ${getCategoryColor(campaign.aidCategory)}`}>
                            {campaign.aidType}
                          </span>
                        )}
                      </div>
                      {campaign.description && (
                        <p className="text-sm text-gray-600 font-bold">{campaign.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <Link
                        to={`/field/distribution/${campaign.id}`}
                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold text-sm hover:from-amber-700 hover:to-orange-700 transition-all shadow-md flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        إدارة التوزيع
                      </Link>
                      <div className="text-left">
                        <p className="text-2xl font-black text-amber-600">{progress}%</p>
                        <p className="text-xs text-gray-500 font-bold">نسبة الإنجاز</p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm font-bold text-gray-600 mb-2">
                      <span>تم التوزيع: {distributedCount}</span>
                      <span>المتبقي: {targetCount - distributedCount}</span>
                      <span>الإجمالي: {targetCount}</span>
                    </div>
                    <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Campaign Info */}
                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 font-bold mb-1">تاريخ البداية</p>
                      <p className="font-black text-gray-800">{new Date(campaign.startDate).toLocaleDateString('ar-EG')}</p>
                    </div>
                    {campaign.endDate && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-500 font-bold mb-1">تاريخ النهاية</p>
                        <p className="font-black text-gray-800">{new Date(campaign.endDate).toLocaleDateString('ar-EG')}</p>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 font-bold mb-1">الحالة</p>
                      <p className={`font-black ${STATUS_CONFIG[campaign.status]?.color || 'text-gray-700'}`}>
                        {STATUS_CONFIG[campaign.status]?.label || campaign.status}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <p className="text-xs text-gray-500 font-bold mb-1">عدد الأسر</p>
                      <p className="font-black text-gray-800">{targetCount} أسرة</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {filteredCampaigns.length > itemsPerPage && (
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-gray-600">
              عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, filteredCampaigns.length)} من أصل {filteredCampaigns.length}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                السابق
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredCampaigns.length / itemsPerPage)))}
                disabled={currentPage >= Math.ceil(filteredCampaigns.length / itemsPerPage)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          إجراءات سريعة
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/field/distribution-history"
            className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm">سجل التوزيعات</p>
              <p className="text-xs text-gray-500 font-bold">عرض جميع التوزيعات</p>
            </div>
          </Link>
          <Link
            to="/field/search"
            className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm">بحث عن أسرة</p>
              <p className="text-xs text-gray-500 font-bold">البحث في قاعدة البيانات</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DistributionList;
