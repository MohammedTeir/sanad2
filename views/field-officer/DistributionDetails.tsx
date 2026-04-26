// views/field-officer/DistributionDetails.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { SearchInput, MultiSelectFilter, FilterPanel } from '../../components/filters';
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

interface Camp {
  id: string;
  name: string;
  location?: {
    governorate?: string;
    area?: string;
    address?: string;
  };
}

interface Family {
  id: string;
  headOfFamily: string; // Short name (head_of_family_name)
  headFirstName?: string;
  headFatherName?: string;
  headGrandfatherName?: string;
  headFamilyName?: string;
  phoneNumber?: string;
  nationalId?: string;
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
  const [camps, setCamps] = useState<Camp[]>([]);
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

  // Family details modal state
  const [showFamilyDetailsModal, setShowFamilyDetailsModal] = useState(false);
  const [selectedFamilyForDetails, setSelectedFamilyForDetails] = useState<Family | null>(null);

  // Undo state
  const [lastDistribution, setLastDistribution] = useState<{ distributionId: string; timestamp: number; campaignId: string; familyId: string; quantity: number } | null>(null);

  // Search and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Enhanced filters
  const [activeTab, setActiveTab] = useState<'all' | 'not_received' | 'received'>('all');
  const [filterFamilySizeMin, setFilterFamilySizeMin] = useState<string>('');
  const [filterFamilySizeMax, setFilterFamilySizeMax] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

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
        nationalId: f.nationalId || (f as any).national_id || (f as any).head_of_family_national_id,
        totalMembersCount: f.totalMembersCount,
        currentHousing: f.currentHousing
      }));
      setFamilies(campFamilies);
    } catch (err: any) {
      console.error('Error loading families:', err);
      setToast({ message: err.message || 'فشل تحميل العائلات', type: 'error' });
    }
  }, [currentCampId]);

  // Load camps
  const loadCamps = useCallback(async () => {
    try {
      const loadedCamps = await realDataService.getCamps();
      setCamps(loadedCamps);
    } catch (err: any) {
      console.error('Error loading camps:', err);
    }
  }, []);

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
        loadCamps(),
        loadInventoryItems(),
        loadDistributionHistory()
      ]).finally(() => setLoading(false));
    }
  }, [currentCampId, campaignId, loadCampaign, loadFamilies, loadCamps, loadInventoryItems, loadDistributionHistory]);

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

  // Helper function to get camp name
  const getCampName = (campId?: string): string => {
    if (!campId) return 'غير محدد';
    const camp = camps.find(c => 
      c.id === campId || 
      (c as any).camp_id === campId ||
      c.id?.toLowerCase() === campId.toLowerCase() ||
      (c as any).camp_id?.toLowerCase() === campId.toLowerCase()
    );
    
    if (camp) return camp.name || (camp as any).camp_name || camp.id;
    return campId;
  };

  // Helper function to get camp details
  const getCampDetails = (campId?: string) => {
    if (!campId) return null;
    return camps.find(c => 
      c.id === campId || 
      (c as any).camp_id === campId ||
      c.id?.toLowerCase() === campId.toLowerCase() ||
      (c as any).camp_id?.toLowerCase() === campId.toLowerCase()
    );
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
      const received = hasReceivedAid(family.id);

      const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
        family.headOfFamily,
        getFullHeadName(family),
        family.phoneNumber || '',
        family.nationalId || ''
      ]);

      const matchesTab = 
        activeTab === 'all' || 
        (activeTab === 'received' && received) || 
        (activeTab === 'not_received' && !received);

      const matchesFamilySizeMin = filterFamilySizeMin === '' || family.totalMembersCount >= parseInt(filterFamilySizeMin);
      const matchesFamilySizeMax = filterFamilySizeMax === '' || family.totalMembersCount <= parseInt(filterFamilySizeMax);

      return matchesSearch && matchesTab && matchesFamilySizeMin && matchesFamilySizeMax;
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

      // Update campaign distributedTo array
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

      let createdDistributionId = null;
      try {
        const result = await realDataService.createDistribution(distributionData);
        createdDistributionId = result?.id || result?.[0]?.id;
      } catch (distError) {
        console.error('Error creating distribution record:', distError);
      }

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

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="flex-1">
              <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border-2 border-gray-100 p-4 h-20 animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

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
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-amber-800 text-sm">تم تسجيل التوزيع للتو</p>
              <p className="text-xs text-amber-700 font-bold">يمكنك التراجع خلال 30 ثانية</p>
            </div>
          </div>
          <button
            onClick={() => {
              const family = families.find(f => f.id === lastDistribution?.familyId);
              setPendingUndo({ ...lastDistribution, familyName: family ? getFullHeadName(family) : 'الأسرة' });
              setShowUndoModal(true);
            }}
            className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold text-sm hover:bg-amber-700 transition-all shadow-md"
          >
            تراجع
          </button>
        </div>
      )}

      {/* Undo Confirmation Modal */}
      {showUndoModal && pendingUndo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 overflow-hidden">
            <div className="p-6 bg-gradient-to-br from-amber-500 to-orange-500 text-white">
              <h3 className="text-lg font-black">تأكيد التراجع</h3>
              <p className="text-amber-100 text-xs font-bold mt-1">هل أنت متأكد من التراجع عن التوزيع لـ {pendingUndo.familyName}؟</p>
            </div>
            <div className="p-6 flex gap-3">
              <button onClick={() => setShowUndoModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all">إلغاء</button>
              <button onClick={handleUndoDistribution} disabled={isUndoing} className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black hover:from-red-700 hover:to-red-800 transition-all shadow-lg">
                {isUndoing ? 'جاري التراجع...' : 'نعم، تراجع'}
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
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-2xl font-black text-gray-800">{campaign.name}</h1>
              <span className={`px-3 py-1 rounded-full font-black text-xs border-2 ${STATUS_CONFIG[campaign.status]?.color || 'bg-gray-100 text-gray-700'}`}>
                {STATUS_CONFIG[campaign.status]?.label || campaign.status}
              </span>
              <span className={`px-3 py-1 rounded-full font-black text-xs border-2 ${getCategoryColor(campaign.aidCategory)}`}>
                {getCategoryLabel(campaign.aidCategory)}
              </span>
            </div>
            {campaign.description && (
              <p className="text-sm text-gray-600 font-bold mb-4">{campaign.description}</p>
            )}
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm font-bold text-gray-600 mb-2">
                <span>تم التوزيع: {distributedCount}</span>
                <span className="text-2xl font-black text-amber-600">{progress}%</span>
                <span>المتبقي: {targetCount - distributedCount}</span>
              </div>
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowHistoryModal(true)} className="px-6 py-3 bg-white border-2 border-blue-500 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-all flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            سجل التوزيعات ({distributionHistory.length})
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
            }`}
          >
            الكل ({getTargetFamilies().length})
          </button>
          <button
            onClick={() => {
              setActiveTab('not_received');
              setCurrentPage(1);
            }}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'not_received'
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'not_received' ? 'bg-white' : 'bg-red-500'}`}></div>
            لم يستلم ({getTargetFamilies().filter(f => !hasReceivedAid(f.id)).length})
          </button>
          <button
            onClick={() => {
              setActiveTab('received');
              setCurrentPage(1);
            }}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'received'
                ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg'
                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${activeTab === 'received' ? 'bg-white' : 'bg-emerald-500'}`}></div>
            تم الاستلام ({getTargetFamilies().filter(f => hasReceivedAid(f.id)).length})
          </button>
        </div>

        <FilterPanel
          title="تصفية المستفيدين"
          activeFilters={[
            ...(searchTerm ? [{ id: 'search', label: `بحث: "${searchTerm}"`, value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
            ...(filterFamilySizeMin || filterFamilySizeMax ? [{ id: 'familySize', label: `حجم الأسرة: ${filterFamilySizeMin || '0'}-${filterFamilySizeMax || '∞'}`, value: 'familySize', onRemove: () => { setFilterFamilySizeMin(''); setFilterFamilySizeMax(''); } }] : [])
          ]}
          onClearAll={() => {
            setSearchTerm('');
            setFilterFamilySizeMin('');
            setFilterFamilySizeMax('');
            setActiveTab('all');
          }}
          defaultOpen={showFilters}
          iconColor="amber"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="ابحث باسم رب الأسرة، رقم الهوية، رقم الهاتف..."
                iconColor="amber"
                showArabicHint
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2">حجم الأسرة (من)</label>
                <input
                  type="number"
                  value={filterFamilySizeMin}
                  onChange={(e) => setFilterFamilySizeMin(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2">حجم الأسرة (إلى)</label>
                <input
                  type="number"
                  value={filterFamilySizeMax}
                  onChange={(e) => setFilterFamilySizeMax(e.target.value)}
                  placeholder="∞"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold"
                />
              </div>
            </div>
          </div>
        </FilterPanel>

        <p className="text-xs text-gray-500 font-bold mt-4">
          عرض {filteredFamilies.length} من أصل {getTargetFamilies().length} أسرة مستهدفة
        </p>
      </div>

      {/* Families List */}
      <div className="space-y-3">
        {paginatedFamilies.map((family) => {
          const received = hasReceivedAid(family.id);
          const isEnabled = !received && (campaign.status === 'نشطة' || campaign.status === 'مخططة');
          return (
            <div key={family.id} className={`p-4 rounded-xl border-2 transition-all ${received ? 'bg-gray-50 border-gray-200' : 'bg-white border-amber-200 hover:border-amber-400 hover:shadow-md'}`}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <p className="font-black text-gray-800">
                      {getFullHeadName(family)}
                      {family.nationalId && (
                        <span className="text-gray-400 font-bold text-xs mr-2" dir="ltr">({family.nationalId})</span>
                      )}
                    </p>
                    {received && (
                      <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        تم التوزيع
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-bold mt-1">{family.totalMembersCount} أفراد • {family.phoneNumber || 'لا يوجد هاتف'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedFamilyForDetails(family);
                      setShowFamilyDetailsModal(true);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="تفاصيل الأسرة"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleOpenDistribution(family)}
                    disabled={!isEnabled}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${!isEnabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:from-amber-700 hover:to-orange-700 shadow-md hover:shadow-lg'}`}
                  >
                    {received ? 'تم التوزيع' : 'توزيع'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {filteredFamilies.length > itemsPerPage && (
        <div className="bg-white rounded-[2rem] border shadow-sm p-6 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-600">عرض {(currentPage - 1) * itemsPerPage + 1} إلى {Math.min(currentPage * itemsPerPage, filteredFamilies.length)}</p>
          <div className="flex gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold disabled:opacity-50 transition-all">السابق</button>
            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= Math.ceil(filteredFamilies.length / itemsPerPage)} className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold disabled:opacity-50 transition-all">التالي</button>
          </div>
        </div>
      )}

      {/* Distribution Modal */}
      {showDistributionModal && selectedFamily && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
            <div className="p-8">
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                توزيع مساعدة لـ {getFullHeadName(selectedFamily)}
              </h2>

              <form onSubmit={handleDistributionSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">الكمية *</label>
                    <input type="number" name="quantity" value={distributionForm.quantity} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold" required min="0.01" step="0.01" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">كود التحقق OTP (اختياري)</label>
                    <input type="text" name="otpCode" value={distributionForm.otpCode} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold" placeholder="أدخل كود التحقق إذا توفر" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">ملاحظات</label>
                    <textarea name="notes" value={distributionForm.notes} onChange={handleInputChange} className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold" rows={3} />
                  </div>
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-amber-300">
                      <input type="checkbox" checked={distributionForm.signatureConfirmed} onChange={handleSignatureToggle} className="w-5 h-5 rounded-lg border-2 border-gray-300 text-amber-600 focus:ring-amber-500" />
                      <div className="flex-1">
                        <p className="font-black text-gray-800">تأكيد استلام المساعدة</p>
                        <p className="text-xs text-gray-500 font-bold">أؤكد أن الأسرة قد استلمت المساعدة المذكورة أعلاه</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-6 border-t border-gray-100">
                  <button type="button" onClick={() => setShowDistributionModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all">إلغاء</button>
                  <button type="submit" disabled={saving || !distributionForm.signatureConfirmed} className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-black hover:from-amber-700 hover:to-orange-700 transition-all disabled:opacity-50 shadow-lg">
                    {saving ? 'جاري التوزيع...' : 'تأكيد التوزيع'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  سجل التوزيعات
                </h2>
                <button onClick={() => setShowHistoryModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3">
                {distributionHistory.map((record) => (
                  <div key={record.id} className="p-4 bg-gray-50 rounded-xl border border-gray-200 flex justify-between items-center">
                    <div>
                      <p className="font-black text-gray-800">{getFullHeadNameFromDistribution(record.familyId)}</p>
                      <p className="text-sm font-bold text-gray-600">{record.quantity} وحدة • {new Date(record.distributedAt).toLocaleDateString('ar-EG')}</p>
                    </div>
                  </div>
                ))}
                {distributionHistory.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500 font-bold">لا توجد توزيعات مسجلة بعد</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Family Details Modal */}
      {showFamilyDetailsModal && selectedFamilyForDetails && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  تفاصيل الأسرة
                </h2>
                <button
                  onClick={() => setShowFamilyDetailsModal(false)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                    <p className="text-xs text-gray-500 font-bold mb-1">اسم رب الأسرة</p>
                    <p className="font-black text-gray-800 text-lg">{getFullHeadName(selectedFamilyForDetails)}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                    <p className="text-xs text-gray-500 font-bold mb-1">رقم الهوية</p>
                    <p className="font-black text-gray-800 text-lg dir-ltr">{selectedFamilyForDetails.nationalId || 'غير متوفر'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                    <p className="text-xs text-gray-500 font-bold mb-1">رقم الهاتف</p>
                    <p className="font-black text-gray-800 text-lg dir-ltr">{selectedFamilyForDetails.phoneNumber || 'غير متوفر'}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl border-2 border-gray-100">
                    <p className="text-xs text-gray-500 font-bold mb-1">عدد أفراد الأسرة</p>
                    <p className="font-black text-gray-800 text-lg">{selectedFamilyForDetails.totalMembersCount} أفراد</p>
                  </div>
                  {selectedFamilyForDetails.currentHousing && (
                    <div className="md:col-span-2 bg-amber-50 p-4 rounded-2xl border-2 border-amber-100">
                      <p className="text-xs text-amber-600 font-bold mb-3">معلومات الموقع الحالي</p>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">المخيم</p>
                          <p className="font-black text-amber-900">{getCampName(selectedFamilyForDetails.currentHousing.campId)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">رقم الوحدة</p>
                          <p className="font-black text-amber-900">{selectedFamilyForDetails.currentHousing.unitNumber || 'غير محدد'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">المحافظة</p>
                          <p className="font-black text-amber-900">
                            {getCampDetails(selectedFamilyForDetails.currentHousing.campId)?.location?.governorate || 
                             (getCampDetails(selectedFamilyForDetails.currentHousing.campId) as any)?.governorate || 
                             (getCampDetails(selectedFamilyForDetails.currentHousing.campId) as any)?.location_governorate ||
                             'غير محدد'}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">المنطقة</p>
                          <p className="font-black text-amber-900">
                            {getCampDetails(selectedFamilyForDetails.currentHousing.campId)?.location?.area || 
                             (getCampDetails(selectedFamilyForDetails.currentHousing.campId) as any)?.area || 
                             (getCampDetails(selectedFamilyForDetails.currentHousing.campId) as any)?.location_area ||
                             'غير محدد'}
                          </p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">العنوان التفصيلي</p>
                          <p className="font-black text-amber-900">
                            {getCampDetails(selectedFamilyForDetails.currentHousing.campId)?.location?.address || 
                             (getCampDetails(selectedFamilyForDetails.currentHousing.campId) as any)?.address || 
                             (getCampDetails(selectedFamilyForDetails.currentHousing.campId) as any)?.location_address ||
                             'غير محدد'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8 pt-6 border-t border-gray-100">
                  <button
                    onClick={() => setShowFamilyDetailsModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                  >
                    إغلاق
                  </button>
                  <Link
                    to={`/field/dp-details/${selectedFamilyForDetails.id}`}
                    className="flex-[2] px-6 py-3 bg-blue-600 text-white rounded-xl font-black text-center hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
                  >
                    عرض الملف الكامل
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributionDetails;
