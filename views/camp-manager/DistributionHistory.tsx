// views/camp-manager/DistributionHistory.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import { SearchInput, DateRangeFilter, FilterPanel } from '../../components/filters';
import { matchesArabicSearchMulti } from '../../utils/arabicTextUtils';

interface DistributionRecord {
  id: string;
  familyId: string;
  familyName: string;
  familySize: number;
  campaignId: string;
  campaignName: string;
  aidType: string;
  aidCategory: string;
  quantity: number;
  distributedAt: string;
  notes?: string;
  otpCode?: string;
  distributedBy?: string;
}

interface AidCampaign {
  id: string;
  name: string;
  aidType: string;
  aidCategory: string;
}

interface Family {
  id: string;
  headOfFamily: string;
}

const AID_CATEGORIES = [
  { value: 'غذائية', label: 'غذائية', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'غير غذائية', label: 'غير غذائية', color: 'bg-blue-100 text-blue-700' },
  { value: 'طبية', label: 'طبية', color: 'bg-red-100 text-red-700' },
  { value: 'نقدية', label: 'نقدية', color: 'bg-amber-100 text-amber-700' },
  { value: 'نظافة', label: 'نظافة', color: 'bg-purple-100 text-purple-700' },
  { value: 'مأوى', label: 'مأوى', color: 'bg-orange-100 text-orange-700' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700' }
];

const getCategoryColor = (categoryValue: string): string => {
  const category = AID_CATEGORIES.find(c => c.value === categoryValue);
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

const DistributionHistory: React.FC = () => {
  const [distributions, setDistributions] = useState<DistributionRecord[]>([]);
  const [campaigns, setCampaigns] = useState<AidCampaign[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
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
  const [filterCampaign, setFilterCampaign] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterQuantityMin, setFilterQuantityMin] = useState<string>('');
  const [filterQuantityMax, setFilterQuantityMax] = useState<string>('');
  const [filterAidType, setFilterAidType] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(15);

  // Load current user's camp ID on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
    } else {
      setLoading(false);
      setToast({ message: 'لم يتم تحديد المخيم. يرجى تسجيل الدخول كمدير مخيم.', type: 'error' });
    }
  }, []);

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      // Include deleted campaigns for history page
      const data = await realDataService.getAidCampaigns(true);
      const campCampaigns = data.filter(c => c.campId === currentCampIdRef.current || !c.campId);
      setCampaigns(campCampaigns);
    } catch (err: any) {
      console.error('Error loading campaigns:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load families
  const loadFamilies = useCallback(async () => {
    try {
      const allFamilies = await realDataService.getDPs();
      const campFamilies = allFamilies.filter(f => {
        const isInCamp =
          f.currentHousing?.campId === currentCampIdRef.current ||
          (f as any).campId === currentCampIdRef.current ||
          (f as any).camp_id === currentCampIdRef.current;
        return isInCamp;
      }).map(f => ({
        id: f.id,
        headOfFamily: f.headOfFamily
      }));
      setFamilies(campFamilies);
    } catch (err: any) {
      console.error('Error loading families:', err);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load all distributions
  const loadDistributions = useCallback(async () => {
    try {
      console.log('[DistributionHistory] Loading distributions for camp:', currentCampIdRef.current);
      
      if (!currentCampIdRef.current) {
        console.warn('[DistributionHistory] No camp ID available');
        return;
      }

      // Load all distributions for the current camp directly
      console.log('[DistributionHistory] Calling getDistributionsByCamp...');
      let dists = await realDataService.getDistributionsByCamp(currentCampIdRef.current);
      
      console.log('[DistributionHistory] Raw distributions from API:', dists);
      console.log('[DistributionHistory] API response count:', dists?.length);

      // Fallback: if getDistributionsByCamp returns empty, try the general getDistributions
      if (!dists || dists.length === 0) {
        console.log('[DistributionHistory] No distributions from camp endpoint, trying general endpoint...');
        dists = await realDataService.getDistributions();
        console.log('[DistributionHistory] Distributions from general endpoint:', dists?.length);
        
        // Filter by camp on the client side
        if (dists && dists.length > 0) {
          // We need to get families to filter by camp
          const allFamilies = await realDataService.getDPs();
          const campFamilyIds = new Set(
            allFamilies
              .filter(f => 
                f.currentHousing?.campId === currentCampIdRef.current ||
                f.campId === currentCampIdRef.current ||
                f.camp_id === currentCampIdRef.current
              )
              .map(f => f.id)
          );
          dists = dists.filter(d => campFamilyIds.has(d.family_id));
          console.log('[DistributionHistory] Filtered by camp families:', dists.length);
        }
      }

      const allDistributions: DistributionRecord[] = (dists || []).map((d: any) => ({
        id: d.id,
        familyId: d.family_id,
        familyName: d.family_name || 'غير معروف',
        familySize: d.family_size || 0,
        campaignId: d.campaign_id,
        campaignName: d.campaign_name || d.campaignName || 'غير معروف',
        aidType: d.aid_type || '-',
        aidCategory: d.aid_category || '',
        quantity: d.quantity,
        distributedAt: d.distribution_date || d.created_at,
        notes: d.notes,
        otpCode: d.otp_code,
        distributedBy: d.distributed_by_user_id
      }));

      // Sort by date (newest first)
      allDistributions.sort((a, b) =>
        new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime()
      );

      console.log('[DistributionHistory] Loaded distributions:', allDistributions);
      console.log('[DistributionHistory] Total count:', allDistributions.length);
      setDistributions(allDistributions);
    } catch (err: any) {
      console.error('[DistributionHistory] Error loading distributions:', err);
      console.error('[DistributionHistory] Error details:', err.message, err.status, err.data);
      setToast({ message: err.message || 'فشل تحميل سجل التوزيعات', type: 'error' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    console.log('[DistributionHistory] useEffect triggered, currentCampId:', currentCampId);
    if (currentCampId) {
      setLoading(true);
      loadDistributions().finally(() => {
        setLoading(false);
      });
      loadCampaigns();
      loadFamilies();
    }
  }, [currentCampId, loadDistributions, loadCampaigns, loadFamilies]);

  // Filter distributions
  const filteredDistributions = distributions.filter(dist => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      dist.familyName,
      dist.campaignName,
      dist.aidType,
      dist.notes || ''
    ]);

    // Campaign filter
    const matchesCampaign = filterCampaign === 'all' || dist.campaignId === filterCampaign;

    // Category filter
    const distCategory = getCategoryLabel(dist.aidCategory);
    const matchesCategory = filterCategory === 'all' || 
      dist.aidCategory === filterCategory || 
      distCategory === filterCategory;

    // Aid type filter
    const matchesAidType = filterAidType === 'all' || dist.aidType === filterAidType;

    // Date range filter
    const distDate = new Date(dist.distributedAt);
    const matchesStartDate = filterStartDate === '' || distDate >= new Date(filterStartDate);
    const matchesEndDate = filterEndDate === '' || distDate <= new Date(filterEndDate);

    // Quantity filters
    const quantity = dist.quantity || 1;
    const matchesQuantityMin = filterQuantityMin === '' || quantity >= parseInt(filterQuantityMin);
    const matchesQuantityMax = filterQuantityMax === '' || quantity <= parseInt(filterQuantityMax);

    return matchesSearch && matchesCampaign && matchesCategory && matchesStartDate && matchesEndDate && matchesAidType && matchesQuantityMin && matchesQuantityMax;
  });

  // Paginate
  const paginatedDistributions = filteredDistributions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Calculate statistics
  const stats = {
    totalDistributions: distributions.length,
    totalFamiliesServed: new Set(distributions.map(d => d.familyId)).size,
    totalQuantity: distributions.reduce((sum, d) => sum + (d.quantity || 1), 0),
    thisMonthDistributions: distributions.filter(d => {
      const distDate = new Date(d.distributedAt);
      const now = new Date();
      return distDate.getMonth() === now.getMonth() && distDate.getFullYear() === now.getFullYear();
    }).length
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
                <div className="h-8 w-56 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            <div className="h-12 w-40 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>
          
          {/* Statistics Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center">
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Filter Panel Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <div className="h-5 w-40 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-5 w-20 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="h-5 w-24 bg-gray-200 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-left">
                      <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mb-1"></div>
                      <div className="h-5 w-28 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              سجل التوزيعات الشامل
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">عرض جميع عمليات توزيع المساعدات</p>
          </div>
          <Link
            to="/manager/distribution"
            className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold text-sm hover:from-amber-700 hover:to-orange-700 transition-all shadow-md flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            إدارة التوزيع
          </Link>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-blue-600">{stats.totalDistributions}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">إجمالي التوزيعات</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">{stats.totalFamiliesServed}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">أسر مستفيدة</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-amber-600">{stats.totalQuantity}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">وحدة موزعة</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-purple-600">{stats.thisMonthDistributions}</p>
            <p className="text-xs font-bold text-purple-700 mt-1">هذا الشهر</p>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel
        title="تصفية السجل"
        activeFilters={[
          ...(searchTerm ? [{ id: 'search', label: `بحث: "${searchTerm}"`, value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
          ...(filterCampaign !== 'all' ? [{ id: 'campaign', label: `الحملة: ${campaigns.find(c => c.id === filterCampaign)?.name || 'غير معروف'}`, value: filterCampaign, onRemove: () => setFilterCampaign('all') }] : []),
          ...(filterCategory !== 'all' ? [{ id: 'category', label: `الفئة: ${getCategoryLabel(filterCategory)}`, value: filterCategory, onRemove: () => setFilterCategory('all') }] : []),
          ...(filterAidType !== 'all' ? [{ id: 'aidType', label: `نوع المساعدة: ${filterAidType}`, value: filterAidType, onRemove: () => setFilterAidType('all') }] : []),
          ...(filterQuantityMin || filterQuantityMax ? [{ id: 'quantity', label: `الكمية: ${filterQuantityMin || '0'} - ${filterQuantityMax || '∞'}`, value: 'quantity', onRemove: () => { setFilterQuantityMin(''); setFilterQuantityMax(''); } }] : []),
          ...(filterStartDate || filterEndDate ? [{ id: 'dateRange', label: `من ${filterStartDate || '...'} إلى ${filterEndDate || '...'}`, value: 'dateRange', onRemove: () => { setFilterStartDate(''); setFilterEndDate(''); } }] : [])
        ]}
        onClearAll={() => {
          setSearchTerm('');
          setFilterCampaign('all');
          setFilterCategory('all');
          setFilterAidType('all');
          setFilterQuantityMin('');
          setFilterQuantityMax('');
          setFilterStartDate('');
          setFilterEndDate('');
        }}
        defaultOpen={showFilters}
        iconColor="blue"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-4">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="ابحث باسم الأسرة، الحملة، النوع، الملاحظات..."
              iconColor="blue"
              showArabicHint
            />
          </div>
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">الحملة</label>
            <select
              value={filterCampaign}
              onChange={(e) => setFilterCampaign(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
            >
              <option value="all">جميع الحملات</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>{campaign.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">الفئة</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
            >
              <option value="all">جميع الفئات</option>
              {AID_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">نوع المساعدة</label>
            <select
              value={filterAidType}
              onChange={(e) => setFilterAidType(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
            >
              <option value="all">الجميع</option>
              {Array.from(new Set(distributions.map(d => d.aidType).filter(Boolean))).map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">الكمية (من)</label>
              <input
                type="number"
                value={filterQuantityMin}
                onChange={(e) => setFilterQuantityMin(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
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
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
              />
            </div>
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <DateRangeFilter
              label="فترة التوزيع"
              startDate={filterStartDate}
              endDate={filterEndDate}
              onChange={(start, end) => {
                setFilterStartDate(start);
                setFilterEndDate(end);
              }}
              presetRanges={[
                { label: 'اليوم', value: 'today' },
                { label: 'هذا الأسبوع', value: 'thisWeek' },
                { label: 'هذا الشهر', value: 'thisMonth' },
                { label: 'آخر 3 أشهر', value: 'last3months' }
              ]}
            />
          </div>
        </div>
      </FilterPanel>

      {/* Distribution Records Table */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              سجل التوزيعات
            </h3>
            <p className="text-sm text-gray-500 font-bold">
              عرض {paginatedDistributions.length} من {filteredDistributions.length} توزيع
            </p>
          </div>
        </div>

        {paginatedDistributions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 font-bold text-lg">لا توجد توزيعات مطابقة</p>
            <p className="text-gray-400 text-sm font-bold mt-1">جرب تغيير معايير التصفية</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {paginatedDistributions.map((dist, index) => (
              <div key={dist.id || index} className="p-4 md:p-6 hover:bg-gray-50 transition-all">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <p className="font-black text-gray-800 text-lg">{dist.familyName}</p>
                      <span className={`px-3 py-1 rounded-full font-black text-xs border-2 ${getCategoryColor(dist.aidCategory)}`}>
                        {getCategoryLabel(dist.aidCategory)}
                      </span>
                      <span className="px-3 py-1 rounded-full font-black text-xs border-2 bg-gray-100 text-gray-700">
                        {dist.aidType || '-'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 font-bold">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {dist.familySize} أفراد
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        {dist.quantity} وحدة
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {dist.campaignName}
                      </span>
                    </div>
                    {dist.notes && (
                      <p className="text-xs text-gray-500 font-bold mt-2 bg-gray-100 inline-block px-3 py-1 rounded-lg">
                        {dist.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-4 md:text-left">
                    <div>
                      <p className="text-xs text-gray-500 font-bold">تاريخ التوزيع</p>
                      <p className="font-black text-gray-800">
                        {new Date(dist.distributedAt).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p className="text-xs text-gray-500 font-bold">
                        {new Date(dist.distributedAt).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <Link
                      to={`/manager/distribution/${dist.campaignId}`}
                      className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {filteredDistributions.length > itemsPerPage && (
          <div className="p-6 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-600">
                عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, filteredDistributions.length)} من أصل {filteredDistributions.length}
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredDistributions.length / itemsPerPage)))}
                  disabled={currentPage >= Math.ceil(filteredDistributions.length / itemsPerPage)}
                  className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  التالي
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Export Actions */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <h3 className="font-black text-gray-800 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          تصدير البيانات
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200 hover:border-blue-400 transition-all flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm">تصدير PDF</p>
              <p className="text-xs text-gray-500 font-bold">تقرير شامل</p>
            </div>
          </button>
          <button className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border-2 border-emerald-200 hover:border-emerald-400 transition-all flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm">تصدير Excel</p>
              <p className="text-xs text-gray-500 font-bold">جداول بيانات</p>
            </div>
          </button>
          <button className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 hover:border-amber-400 transition-all flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-gray-800 text-sm">طباعة</p>
              <p className="text-xs text-gray-500 font-bold">نسخة ورقية</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistributionHistory;
