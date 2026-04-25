// views/field-officer/DistributionDetails.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { SearchInput } from '../../components/filters';
import { matchesArabicSearchMulti } from '../../utils/arabicTextUtils';

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

interface Family {
  id: string;
  headOfFamily: string; // Short name (head_of_family_name)
  headFirstName?: string;
  headFatherName?: string;
  headGrandfatherName?: string;
  headFamilyName?: string;
  phoneNumber?: string;
  totalMembersCount: number;
  currentHousing?: {
    campId?: string;
    unitNumber?: string;
  };
}

interface InventoryItem {
  id: string;
  name?: string;
  nameAr?: string;
  category?: string;
  unit?: string;
  unitAr?: string;
  quantityAvailable?: number;
  quantityReserved?: number;
  minStock?: number;
  maxStock?: number;
  minAlertThreshold?: number;
  expiryDate?: string;
  donor?: string;
  receivedDate?: string;
  notes?: string;
  isActive?: boolean;
  isDeleted?: boolean;
  deletedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DistributionRecord {
  id: string;
  familyId: string;
  familyName: string;
  familySize: number;
  distributedAt: string;
  quantity: number;
  notes?: string;
  otpCode?: string;
  signatureConfirmed: boolean;
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

const DistributionDetails: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<AidCampaign | null>(null);
  const [families, setFamilies] = useState<Family[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [distributionHistory, setDistributionHistory] = useState<DistributionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [currentCampId, setCurrentCampId] = useState<string>('');

  // Distribution modal state
  const [showDistributionModal, setShowDistributionModal] = useState(false);
  const [selectedFamily, setSelectedFamily] = useState<Family | null>(null);
  const [distributionForm, setDistributionForm] = useState({
    quantity: '',
    notes: '',
    otpCode: '',
    signatureConfirmed: false
  });

  // Undo confirmation modal state
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<{ distributionId: string; timestamp: number; campaignId: string; familyId: string; familyName?: string } | null>(null);
  const [isUndoing, setIsUndoing] = useState(false); // Prevent double-click

  // History modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Undo state
  const [lastDistribution, setLastDistribution] = useState<{ distributionId: string; timestamp: number; campaignId: string; familyId: string; quantity: number } | null>(null);

  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
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

  // Load campaign details
  const loadCampaign = useCallback(async () => {
    if (!campaignId) return;
    try {
      const campaigns = await realDataService.getAidCampaigns();
      const foundCampaign = campaigns.find(c => c.id === campaignId);
      if (!foundCampaign) {
        setToast({ message: 'الحملة غير موجودة', type: 'error' });
        setTimeout(() => navigate('/field/distribution'), 2000);
        return;
      }
      setCampaign(foundCampaign);
    } catch (err: any) {
      console.error('Error loading campaign:', err);
      setToast({ message: err.message || 'فشل تحميل تفاصيل الحملة', type: 'error' });
    }
  }, [campaignId, navigate]);

  // Load families
  const loadFamilies = useCallback(async () => {
    try {
      const allFamilies = await realDataService.getDPs();
      const campFamilies = allFamilies.filter(f => {
        const isInCamp =
          f.currentHousing?.campId === currentCampId ||
          (f as any).campId === currentCampId ||
          (f as any).camp_id === currentCampId;
        const isNotPending = f.registrationStatus !== 'قيد الانتظار';
        return isInCamp && isNotPending;
      }).map(f => ({
        id: f.id,
        headOfFamily: f.headOfFamily,
        headFirstName: f.headFirstName,
        headFatherName: f.headFatherName,
        headGrandfatherName: f.headGrandfatherName,
        headFamilyName: f.headFamilyName,
        phoneNumber: f.phoneNumber,
        totalMembersCount: f.totalMembersCount,
        currentHousing: f.currentHousing
      }));
      setFamilies(campFamilies);
    } catch (err: any) {
      console.error('Error loading families:', err);
      setToast({ message: err.message || 'فشل تحميل العائلات', type: 'error' });
    }
  }, [currentCampId]);

  // Load inventory items
  const loadInventoryItems = useCallback(async () => {
    try {
      // Add cache-busting timestamp to force fresh data from database
      const items = await realDataService.getInventoryItems(false, Date.now());
      setInventoryItems(items);
      return items;
    } catch (err: any) {
      console.error('Error loading inventory items:', err);
      setToast({ message: err.message || 'فشل تحميل عناصر المخزون', type: 'error' });
      return [];
    }
  }, []);

  // Load distribution history
  const loadDistributionHistory = useCallback(async () => {
    if (!campaignId) return;
    try {
      const distributions = await realDataService.getDistributionsByCampaign(campaignId);
      const formattedDistributions = distributions
        .filter(dist => !dist.is_deleted)
        .map((dist: any) => ({
          id: dist.id,
          familyId: dist.family_id,
          familyName: dist.family_name || 'غير معروف',
          familySize: dist.family_size || 0,
          campaignId: dist.campaign_id,
          campaignName: dist.campaign_name || '',
          aidType: dist.aid_type,
          aidCategory: dist.aid_category,
          quantity: dist.quantity,
          distributedAt: dist.distribution_date || dist.created_at,
          notes: dist.notes,
          otpCode: dist.otp_code,
          distributedBy: dist.distributed_by_user_id,
          isDeleted: dist.is_deleted || false
        }));
      setDistributionHistory(formattedDistributions);
    } catch (err: any) {
      console.error('Error loading distribution history:', err);
    }
  }, [campaignId]);

  useEffect(() => {
    if (currentCampId && campaignId) {
      Promise.all([
        loadCampaign(),
        loadFamilies(),
        loadInventoryItems(),
        loadDistributionHistory()
      ]).finally(() => setLoading(false));
    }
  }, [currentCampId, campaignId, loadCampaign, loadFamilies, loadInventoryItems, loadDistributionHistory]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showDistributionModal) setShowDistributionModal(false);
        if (showHistoryModal) setShowHistoryModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDistributionModal, showHistoryModal]);

  // Check if family already received aid
  const hasReceivedAid = (familyId: string): boolean => {
    return campaign?.distributedTo?.includes(familyId) || false;
  };

  // Get target families
  const getTargetFamilies = (): Family[] => {
    if (!campaign?.targetFamilies || campaign.targetFamilies.length === 0) {
      return families;
    }
    return families.filter(f => campaign.targetFamilies?.includes(f.id));
  };

  // Helper function to get full family head name
  const getFullHeadName = (family: Family): string => {
    const parts = [
      family.headFirstName,
      family.headFatherName,
      family.headGrandfatherName,
      family.headFamilyName
    ].filter(Boolean);

    return parts.length > 0 ? parts.join(' ') : family.headOfFamily;
  };

  // Helper function to get full name from distribution record
  const getFullHeadNameFromDistribution = (familyId: string): string => {
    const family = families.find(f => f.id === familyId);
    if (family) {
      return getFullHeadName(family);
    }
    return 'غير معروف';
  };

  // Filter families
  const getFilteredFamilies = () => {
    const targetFamilies = getTargetFamilies();
    return targetFamilies.filter(family => {
      const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
        family.headOfFamily,
        getFullHeadName(family),
        family.phoneNumber || ''
      ]);
      return matchesSearch;
    });
  };

  const handleOpenDistribution = (family: Family) => {
    setSelectedFamily(family);
    setDistributionForm({
      quantity: '',
      notes: '',
      otpCode: '',
      signatureConfirmed: false
    });
    setShowDistributionModal(true);
  };

  const handleDistributionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);

    try {
      if (!campaign || !selectedFamily) {
        setToast({ message: 'الرجاء اختيار الحملة والأسرة', type: 'warning' });
        setSaving(false);
        return;
      }

      if (!distributionForm.quantity || parseFloat(distributionForm.quantity) <= 0) {
        setToast({ message: 'الرجاء إدخال كمية صحيحة', type: 'warning' });
        setSaving(false);
        return;
      }

      if (!distributionForm.signatureConfirmed) {
        setToast({ message: 'يجب تأكيد التوقيع', type: 'warning' });
        setSaving(false);
        return;
      }

      const inventoryItemId = campaign.inventoryItemId;
      let inventoryItem = null;
      if (inventoryItemId) {
        inventoryItem = inventoryItems.find(item => item.id === inventoryItemId);
      }

      if (inventoryItemId && inventoryItem) {
        const distributionQuantity = parseFloat(distributionForm.quantity);
        const availableQty = parseFloat(inventoryItem.quantityAvailable?.toString() || '0');
        const reservedQty = parseFloat(inventoryItem.quantityReserved?.toString() || '0');
        const distributableQty = availableQty - reservedQty;

        if (distributionQuantity > availableQty) {
          setToast({ message: `الكمية المطلوبة أكبر من الكمية المتاحة (${availableQty})`, type: 'error' });
          setSaving(false);
          return;
        }

        if (distributionQuantity > distributableQty) {
          setToast({ message: `الكمية المطلوبة أكبر من الكمية القابلة للتوزيع (${distributableQty})`, type: 'error' });
          setSaving(false);
          return;
        }
      }

      const currentDistributedTo = campaign.distributedTo || [];
      if (!currentDistributedTo.includes(selectedFamily.id)) {
        await realDataService.updateAidCampaign(campaign.id, {
          distributedTo: [...currentDistributedTo, selectedFamily.id]
        });
      }

      const distributionQuantity = parseFloat(distributionForm.quantity);
      const distributionDate = new Date().toISOString();
      const receivedBySignatureText = distributionForm.signatureConfirmed ? 'نعم' : 'لا';

      const distributionData = {
        family_id: selectedFamily.id,
        campaign_id: campaign.id,
        aid_type: campaign.aidType || 'غير محدد',
        aid_category: campaign.aidCategory || 'أخرى',
        quantity: distributionQuantity,
        distribution_date: distributionDate,
        notes: distributionForm.notes || null,
        otp_code: distributionForm.otpCode || null,
        received_by_signature: receivedBySignatureText,
        status: 'تم التسليم'
      };

      const result = await realDataService.createDistribution(distributionData);
      const createdDistributionId = result?.id || result?.[0]?.id;

      if (createdDistributionId) {
        const undoData = {
          distributionId: createdDistributionId,
          timestamp: Date.now(),
          campaignId: campaign.id,
          familyId: selectedFamily.id,
          quantity: distributionQuantity
        };
        setLastDistribution(undoData);
        setTimeout(() => setLastDistribution(null), 30000);
      }

      setToast({ message: 'تم توزيع المساعدة بنجاح', type: 'success' });
      setShowDistributionModal(false);
      await loadCampaign();
      await new Promise(resolve => setTimeout(resolve, 200));
      await loadInventoryItems();
      await loadDistributionHistory();
    } catch (err: any) {
      console.error('Error creating distribution:', err);
      setToast({ message: err.message || 'فشل توزيع المساعدة', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUndoDistribution = async () => {
    const undoData = pendingUndo || lastDistribution;
    if (!undoData || !campaign || isUndoing) return;
    setIsUndoing(true);

    try {
      const distribution = await realDataService.getDistributionById(undoData.distributionId);
      if (!distribution) throw new Error('لم يتم العثور على سجل التوزيع');

      await realDataService.cancelDistribution(undoData.distributionId);
      const updatedDistributedTo = campaign.distributedTo?.filter(id => id !== undoData.familyId) || [];
      await realDataService.updateAidCampaign(undoData.campaignId, {
        distributedTo: updatedDistributedTo
      });

      setToast({ message: 'تم التراجع عن التوزيع بنجاح', type: 'success' });
      setLastDistribution(null);
      await new Promise(resolve => setTimeout(resolve, 500));
      await loadCampaign();
      await loadInventoryItems();
      await loadDistributionHistory();
    } catch (err: any) {
      console.error('Error undoing distribution:', err);
      setToast({ message: err.message || 'فشل التراجع عن التوزيع', type: 'error' });
    } finally {
      setIsUndoing(false);
      setShowUndoModal(false);
      setPendingUndo(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setDistributionForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSignatureToggle = () => {
    setDistributionForm(prev => ({ ...prev, signatureConfirmed: !prev.signatureConfirmed }));
  };

  const getProgress = (): number => {
    if (!campaign) return 0;
    const target = campaign.targetFamilies?.length || 0;
    const distributed = campaign.distributedTo?.length || 0;
    if (target === 0) return 0;
    return Math.round((distributed / target) * 100);
  };

  const filteredFamilies = getFilteredFamilies();
  const paginatedFamilies = filteredFamilies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) return <div className="p-8 text-center font-bold text-gray-500">جاري التحميل...</div>;
  if (!campaign) {
    return (
      <div className="bg-white rounded-[2rem] border shadow-sm p-12 text-center">
        <p className="text-gray-500 font-bold text-lg">الحملة غير موجودة</p>
        <Link to="/field/distribution" className="text-amber-600 font-bold mt-2 inline-block">العودة للقائمة</Link>
      </div>
    );
  }

  const progress = getProgress();
  const distributedCount = campaign.distributedTo?.length || 0;
  const targetCount = campaign.targetFamilies?.length || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Undo Banner */}
      {lastDistribution && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="font-black text-amber-800 text-sm">تم تسجيل التوزيع للتو</p>
            <p className="text-xs text-amber-700 font-bold">يمكنك التراجع خلال 30 ثانية</p>
          </div>
          <button
            onClick={() => {
              const family = families.find(f => f.id === lastDistribution?.familyId);
              setPendingUndo({ ...lastDistribution, familyName: family ? getFullHeadName(family) : 'الأسرة' });
              setShowUndoModal(true);
            }}
            className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm"
          >
            تراجع
          </button>
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {showUndoModal && pendingUndo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-6">
            <h3 className="text-lg font-black mb-4 text-gray-800">تأكيد التراجع عن التوزيع لـ {pendingUndo.familyName}</h3>
            <div className="flex gap-3">
              <button onClick={() => setShowUndoModal(false)} className="flex-1 px-6 py-3 bg-gray-100 rounded-xl font-bold">إلغاء</button>
              <button onClick={handleUndoDistribution} disabled={isUndoing} className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-black">
                {isUndoing ? 'جاري التراجع...' : 'تأكيد التراجع'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex items-start gap-4">
          <button onClick={() => navigate('/field/distribution')} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-800">{campaign.name}</h1>
            <p className="text-sm text-gray-600 font-bold mb-4">{campaign.description}</p>
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm font-bold text-gray-600 mb-2">
                <span>تم التوزيع: {distributedCount}</span>
                <span className="text-2xl font-black text-amber-600">{progress}%</span>
                <span>المتبقي: {targetCount - distributedCount}</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowHistoryModal(true)} className="px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-xl font-bold text-sm flex items-center gap-2">
            سجل التوزيعات ({distributionHistory.length})
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <SearchInput value={searchTerm} onChange={setSearchTerm} placeholder="ابحث عن أسرة..." iconColor="amber" />
        <p className="text-xs text-gray-500 font-bold mt-2">عرض {filteredFamilies.length} أسرة</p>
      </div>

      {/* Families List */}
      <div className="space-y-3">
        {paginatedFamilies.map((family) => {
          const received = hasReceivedAid(family.id);
          return (
            <div key={family.id} className={`p-4 rounded-xl border-2 ${received ? 'bg-gray-50 border-gray-200' : 'bg-white border-amber-200'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="font-black text-gray-800">{getFullHeadName(family)}</p>
                  <p className="text-sm text-gray-600 font-bold">{family.totalMembersCount} أفراد</p>
                </div>
                <button
                  onClick={() => handleOpenDistribution(family)}
                  disabled={received || campaign.status !== 'نشطة'}
                  className={`px-4 py-2 rounded-xl font-bold text-sm ${received ? 'bg-gray-100 text-gray-400' : 'bg-amber-600 text-white'}`}
                >
                  {received ? 'تم التوزيع' : 'توزيع'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {filteredFamilies.length > itemsPerPage && (
        <div className="flex justify-center gap-2">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 bg-gray-100 rounded-xl font-bold disabled:opacity-50">السابق</button>
          <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredFamilies.length / itemsPerPage)} className="px-4 py-2 bg-gray-100 rounded-xl font-bold disabled:opacity-50">التالي</button>
        </div>
      )}

      {/* Distribution Modal */}
      {showDistributionModal && selectedFamily && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-black mb-6">توزيع مساعدة لـ {getFullHeadName(selectedFamily)}</h2>
            <form onSubmit={handleDistributionSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-black mb-2">الكمية *</label>
                <input type="number" name="quantity" value={distributionForm.quantity} onChange={handleInputChange} className="w-full px-4 py-3 border-2 rounded-xl" required min="0.01" step="0.01" />
              </div>
              <div>
                <label className="block text-sm font-black mb-2">ملاحظات</label>
                <textarea name="notes" value={distributionForm.notes} onChange={handleInputChange} className="w-full px-4 py-3 border-2 rounded-xl" rows={3} />
              </div>
              <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer">
                <input type="checkbox" checked={distributionForm.signatureConfirmed} onChange={handleSignatureToggle} className="w-5 h-5" />
                <span className="font-black">تأكيد استلام المساعدة</span>
              </label>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowDistributionModal(false)} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold">إلغاء</button>
                <button type="submit" disabled={saving || !distributionForm.signatureConfirmed} className="flex-1 py-3 bg-amber-600 text-white rounded-xl font-black">
                  {saving ? 'جاري التوزيع...' : 'تأكيد التوزيع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl p-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-6">
              <h2 className="text-2xl font-black">سجل التوزيعات</h2>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-500 font-bold">إغلاق</button>
            </div>
            <div className="space-y-3">
              {distributionHistory.map((record) => (
                <div key={record.id} className="p-4 bg-gray-50 rounded-xl border">
                  <p className="font-black">{getFullHeadNameFromDistribution(record.familyId)}</p>
                  <p className="text-sm font-bold text-gray-600">{record.quantity} وحدة - {new Date(record.distributedAt).toLocaleDateString('ar-EG')}</p>
                </div>
              ))}
              {distributionHistory.length === 0 && <p className="text-center text-gray-500 font-bold">لا توجد توزيعات مسجلة</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributionDetails;
