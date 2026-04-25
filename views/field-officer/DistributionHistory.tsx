// views/field-officer/DistributionHistory.tsx
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
      setToast({ message: 'لم يتم تحديد المخيم. يرجى تسجيل الدخول كضابط ميداني.', type: 'error' });
    }
  }, []);

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      const data = await realDataService.getAidCampaigns(true);
      const campCampaigns = data.filter(c => c.campId === currentCampIdRef.current || !c.campId);
      setCampaigns(campCampaigns);
    } catch (err: any) {
      console.error('Error loading campaigns:', err);
    }
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
  }, []);

  // Load all distributions
  const loadDistributions = useCallback(async () => {
    try {
      if (!currentCampIdRef.current) return;

      let dists = await realDataService.getDistributionsByCamp(currentCampIdRef.current);
      
      if (!dists || dists.length === 0) {
        dists = await realDataService.getDistributions();
        if (dists && dists.length > 0) {
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

      allDistributions.sort((a, b) =>
        new Date(b.distributedAt).getTime() - new Date(a.distributedAt).getTime()
      );

      setDistributions(allDistributions);
    } catch (err: any) {
      console.error('[DistributionHistory] Error loading distributions:', err);
      setToast({ message: err.message || 'فشل تحميل سجل التوزيعات', type: 'error' });
    }
  }, []);

  useEffect(() => {
    if (currentCampId) {
      setLoading(true);
      loadDistributions().finally(() => setLoading(false));
      loadCampaigns();
      loadFamilies();
    }
  }, [currentCampId, loadDistributions, loadCampaigns, loadFamilies]);

  // Filter distributions
  const filteredDistributions = distributions.filter(dist => {
    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      dist.familyName,
      dist.campaignName,
      dist.aidType,
      dist.notes || ''
    ]);

    const matchesCampaign = filterCampaign === 'all' || dist.campaignId === filterCampaign;
    const distCategory = getCategoryLabel(dist.aidCategory);
    const matchesCategory = filterCategory === 'all' || dist.aidCategory === filterCategory || distCategory === filterCategory;
    const matchesAidType = filterAidType === 'all' || dist.aidType === filterAidType;
    const distDate = new Date(dist.distributedAt);
    const matchesStartDate = filterStartDate === '' || distDate >= new Date(filterStartDate);
    const matchesEndDate = filterEndDate === '' || distDate <= new Date(filterEndDate);
    const quantity = dist.quantity || 1;
    const matchesQuantityMin = filterQuantityMin === '' || quantity >= parseInt(filterQuantityMin);
    const matchesQuantityMax = filterQuantityMax === '' || quantity <= parseInt(filterQuantityMax);

    return matchesSearch && matchesCampaign && matchesCategory && matchesStartDate && matchesEndDate && matchesAidType && matchesQuantityMin && matchesQuantityMax;
  });

  const paginatedDistributions = filteredDistributions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div className="p-8 text-center font-bold text-gray-500">جاري التحميل...</div>;

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
              سجل التوزيعات الميداني
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">عرض جميع عمليات توزيع المساعدات المسجلة</p>
          </div>
          <Link to="/field/distribution" className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-bold text-sm">
            العودة للتوزيع
          </Link>
        </div>
      </div>

      {/* Filter Panel */}
      <FilterPanel title="تصفية السجل" onClearAll={() => { setSearchTerm(''); setFilterCampaign('all'); setFilterCategory('all'); setFilterAidType('all'); setFilterQuantityMin(''); setFilterQuantityMax(''); setFilterStartDate(''); setFilterEndDate(''); }} iconColor="blue">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-4"><SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="ابحث باسم الأسرة، الحملة..." iconColor="blue" /></div>
          <div>
            <label className="block text-sm font-black mb-2">الحملة</label>
            <select value={filterCampaign} onChange={(e) => setFilterCampaign(e.target.value)} className="w-full p-3 border-2 rounded-xl">
              <option value="all">جميع الحملات</option>
              {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </FilterPanel>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {paginatedDistributions.map((dist) => (
            <div key={dist.id} className="p-4 md:p-6 flex justify-between items-center">
              <div>
                <p className="font-black text-lg">{dist.familyName}</p>
                <p className="text-sm text-gray-600 font-bold">{dist.campaignName} • {dist.quantity} وحدة</p>
              </div>
              <div className="text-left">
                <p className="font-black">{new Date(dist.distributedAt).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>
          ))}
          {paginatedDistributions.length === 0 && <div className="p-12 text-center text-gray-500 font-bold">لا توجد توزيعات مطابقة</div>}
        </div>
      </div>

      {/* Pagination */}
      {filteredDistributions.length > itemsPerPage && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-gray-100 rounded-xl font-bold disabled:opacity-50">السابق</button>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredDistributions.length / itemsPerPage)} className="px-4 py-2 bg-gray-100 rounded-xl font-bold disabled:opacity-50">التالي</button>
        </div>
      )}
    </div>
  );
};

export default DistributionHistory;
