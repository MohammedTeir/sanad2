// views/admin/DPManagement.tsx - System Admin Family Management
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { GAZA_LOCATIONS, getAreasByGovernorate } from '../../constants/gazaLocations';
import { SearchInput, DateRangeFilter, MultiSelectFilter, FilterPanel } from '../../components/filters';
import { normalizeArabic, matchesArabicSearchMulti } from '../../utils/arabicTextUtils';

interface DPProfile {
  id: string;
  headFirstName?: string;
  headFatherName?: string;
  headGrandfatherName?: string;
  headFamilyName?: string;
  headOfFamily: string;
  nationalId: string;
  gender: 'ذكر' | 'أنثى';
  dateOfBirth: string;
  age: number;
  maritalStatus: string;
  phoneNumber: string;
  phoneSecondary?: string;
  totalMembersCount: number;
  campId?: string;
  campName?: string;
  unitNumber?: string;
  registrationStatus?: 'قيد الانتظار' | 'موافق' | 'مرفوض';
  vulnerabilityPriority?: 'عالي جداً' | 'عالي' | 'متوسط' | 'منخفض';
  vulnerabilityScore?: number;
  disabilityType?: string;
  disabilityDetails?: string;
  chronicDiseaseType?: string;
  chronicDiseaseDetails?: string;
  warInjuryType?: string;
  warInjuryDetails?: string;
  medicalFollowupRequired?: boolean;
  medicalFollowupFrequency?: string;
  wifeName?: string;
  wifeNationalId?: string;
  wifeDateOfBirth?: string;
  wifeAge?: number;
  wifeIsPregnant?: boolean;
  wifePregnancyMonth?: number;
  wifePregnancySpecialNeeds?: boolean;
  wifePregnancyFollowupDetails?: string;
  idCardUrl?: string;
  medicalReportUrl?: string;
  signatureUrl?: string;
  originalAddressGovernorate?: string;
  originalAddressRegion?: string;
  originalAddressDetails?: string;
  originalAddressHousingType?: string;
  currentHousingType?: string;
  currentHousingIsSuitable?: boolean;
  currentHousingSanitaryFacilities?: 'خاصة' | 'مشتركة';
  currentHousingWaterSource?: 'شبكة عامة' | 'صهاريج' | 'آبار' | 'آخر';
  currentHousingElectricityAccess?: 'شبكة عامة' | 'مولد' | 'طاقة شمسية' | 'لا يوجد' | 'آخر';
  currentHousingGovernorate?: string;
  currentHousingRegion?: string;
  currentHousingLandmark?: string;
  currentHousingSharingStatus?: 'سكن فردي' | 'سكن مشترك';
  currentHousingDetailedType?: string;
  currentHousingFurnished?: boolean;
  refugeeResidentAbroadCountry?: string;
  refugeeResidentAbroadCity?: string;
  refugeeResidentAbroadResidenceType?: string;
  maleCount?: number;
  femaleCount?: number;
  childCount?: number;
  teenagerCount?: number;
  adultCount?: number;
  seniorCount?: number;
  disabledCount?: number;
  chronicCount?: number;
  injuredCount?: number;
  orphanCount?: number;
  pregnantWomenCount?: number;
  headOfFamilyIsWorking?: boolean;
  headOfFamilyMonthlyIncome?: number;
  adminNotes?: string;
  nominationBody?: string;
  members?: any[];
}

interface Camp {
  id: string;
  name: string;
  governorate: string;
  area: string;
}

const MARITAL_STATUS = {
  'أعزب': { label: 'أعزب', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'متزوج': { label: 'متزوج', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'مطلق': { label: 'مطلق', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'أرمل': { label: 'أرمل', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  'أسرة هشة': { label: 'أسرة هشة', color: 'bg-red-50 text-red-700 border-red-200' }
};

// ⚠️  DISABLED: VULNERABILITY_LEVELS - Vulnerability score system disabled
// @deprecated Vulnerability score system is disabled
const VULNERABILITY_LEVELS = [
  { value: 'عالي جداً', label: 'عالي جداً', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'عالي', label: 'عالي', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'متوسط', label: 'متوسط', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'منخفض', label: 'منخفض', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
];

const DISABILITY_TYPES = [
  { value: 'لا يوجد', label: 'لا يوجد', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'حركية', label: 'حركية', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'بصرية', label: 'بصرية', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'سمعية', label: 'سمعية', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'ذهنية', label: 'ذهنية', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const CHRONIC_DISEASE_TYPES = [
  { value: 'لا يوجد', label: 'لا يوجد', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'سكري', label: 'سكري', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'ضغط دم', label: 'ضغط دم', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'قلب', label: 'قلب', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'سرطان', label: 'سرطان', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'ربو', label: 'ربو', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'فشل كلوي', label: 'فشل كلوي', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'مرض نفسي', label: 'مرض نفسي', color: 'bg-gray-100 text-gray-700 border-gray-200' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const WAR_INJURY_TYPES = [
  { value: 'لا يوجد', label: 'لا يوجد', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'بتر', label: 'بتر', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'كسر', label: 'كسر', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'شظية', label: 'شظية', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'حرق', label: 'حرق', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'رأس/وجه', label: 'رأس/وجه', color: 'bg-orange-100 text-orange-800 border-orange-200' },
  { value: 'عمود فقري', label: 'عمود فقري', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'أرمل', label: 'أرمل/ة', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'مطلق', label: 'مطلق/ة', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'أسرة هشة', label: 'أسرة هشة', color: 'bg-red-50 text-red-700 border-red-200' }
];

const GENDER_LABELS = {
  'ذكر': 'ذكر',
  'أنثى': 'أنثى'
};

const DPManagement: React.FC = () => {
  const navigate = useNavigate();
  const [dps, setDps] = useState<DPProfile[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'قيد الانتظار' | 'موافق' | 'مرفوض'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<'all' | 'قيد الانتظار'>('all');

  // Enhanced filters
  const [filterCamp, setFilterCamp] = useState<string>('all');
  const [filterGovernorate, setFilterGovernorate] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterFamilySizeMin, setFilterFamilySizeMin] = useState<string>('');
  const [filterFamilySizeMax, setFilterFamilySizeMax] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // ⚠️  DISABLED: Vulnerability filters - Vulnerability score system disabled
  // Comprehensive Vulnerability Filters
  // const [filterVulnerabilityPriority, setFilterVulnerabilityPriority] = useState<string[]>([]);
  // const [filterVulnerabilityScoreMin, setFilterVulnerabilityScoreMin] = useState<string>('');
  // const [filterVulnerabilityScoreMax, setFilterVulnerabilityScoreMax] = useState<string>('');
  const filterVulnerabilityPriority: string[] = [];
  const filterVulnerabilityScoreMin = '';
  const filterVulnerabilityScoreMax = '';
  const [filterChildCountMin, setFilterChildCountMin] = useState<string>('');
  const [filterChildCountMax, setFilterChildCountMax] = useState<string>('');
  const [filterSeniorCountMin, setFilterSeniorCountMin] = useState<string>('');
  const [filterSeniorCountMax, setFilterSeniorCountMax] = useState<string>('');
  const [filterHasDisability, setFilterHasDisability] = useState<boolean | null>(null);
  const [filterDisabilityType, setFilterDisabilityType] = useState<string[]>([]);
  const [filterHasChronicDisease, setFilterHasChronicDisease] = useState<boolean | null>(null);
  const [filterChronicDiseaseType, setFilterChronicDiseaseType] = useState<string[]>([]);
  const [filterHasWarInjury, setFilterHasWarInjury] = useState<boolean | null>(null);
  const [filterWarInjuryType, setFilterWarInjuryType] = useState<string[]>([]);
  const [filterHasPregnancy, setFilterHasPregnancy] = useState<boolean | null>(null);
  const [filterPregnancyMonthMin, setFilterPregnancyMonthMin] = useState<string>('');
  const [filterIncomeMin, setFilterIncomeMin] = useState<string>('');
  const [filterIncomeMax, setFilterIncomeMax] = useState<string>('');
  const [filterHousingTypes, setFilterHousingTypes] = useState<string[]>([]);
  const [filterHasPoorSanitary, setFilterHasPoorSanitary] = useState<boolean | null>(null);
  const [filterOrphanCountMin, setFilterOrphanCountMin] = useState<string>('');
  const [filterOrphanCountMax, setFilterOrphanCountMax] = useState<string>('');
  const [filterMaritalStatusMulti, setFilterMaritalStatusMulti] = useState<string[]>([]);
  const [filterIsEmployed, setFilterIsEmployed] = useState<boolean | null>(null);

  // Confirmation modal state
  const [rejectingDP, setRejectingDP] = useState<DPProfile | null>(null);
  const [changingStatusDP, setChangingStatusDP] = useState<DPProfile | null>(null);

  // Soft delete state
  const [showDeleted, setShowDeleted] = useState(false);
  const [restoringDP, setRestoringDP] = useState<DPProfile | null>(null);
  const [restoreReason, setRestoreReason] = useState('');

  // Global stats state
  const [globalStats, setGlobalStats] = useState<{
    totalFamilies: number;
    totalMembers: number;
    byStatus: { 'قيد الانتظار': number; 'موافق': number; 'مرفوض': number };
    byVulnerability: { 'عالي جداً': number; 'عالي': number; 'متوسط': number; 'منخفض': number };
    byCamp: Array<{ campId: string; campName: string; familyCount: number }>;
    avgFamilySize: number;
  } | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    loadCamps();
    loadGlobalStats();
  }, []);

  const loadGlobalStats = async () => {
    try {
      setLoadingStats(true);
      const stats = await realDataService.getGlobalFamilyStats();
      setGlobalStats(stats);
    } catch (err: any) {
      console.error('Error loading global stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadCamps = async () => {
    try {
      const loadedCamps = await realDataService.getCamps();
      setCamps(loadedCamps);
    } catch (err: any) {
      console.error('Error loading camps:', err);
    }
  };

  const loadDPs = useCallback(async () => {
    try {
      setLoading(true);
      // SYSTEM_ADMIN can fetch all families without camp filter
      let data;
      if (showDeleted) {
        // Fetch deleted families when toggle is enabled
        data = await realDataService.getDeletedFamilies();
      } else {
        data = await realDataService.getAllDPs();
      }
      setDps(data);
    } catch (err: any) {
      console.error('Error loading DPs:', err);
      setToast({ message: err.message || 'فشل تحميل بيانات العائلات', type: 'error' });
      setDps([]);
    } finally {
      setLoading(false);
    }
  }, [showDeleted]);

  useEffect(() => {
    loadDPs();
  }, [loadDPs]);

  const handleApprove = async (dp: DPProfile) => {
    try {
      await realDataService.approveDP(dp.id);
      setToast({ message: 'تم قبول التسجيل بنجاح', type: 'success' });
      await loadDPs();
    } catch (err: any) {
      setToast({
        message: `فشل قبول التسجيل: ${err.message || 'خطأ غير معروف'}`,
        type: 'error'
      });
    }
  };

  const handleReject = (dp: DPProfile) => setRejectingDP(dp);

  const confirmReject = async () => {
    if (!rejectingDP) return;
    try {
      await realDataService.rejectDP(rejectingDP.id, 'رفض من قبل الإدارة المركزية');
      setToast({ message: 'تم رفض التسجيل', type: 'success' });
      await loadDPs();
    } catch (err: any) {
      setToast({ message: `فشل رفض التسجيل: ${err.message || 'خطأ غير معروف'}`, type: 'error' });
    } finally {
      setRejectingDP(null);
    }
  };

  const cancelReject = () => setRejectingDP(null);

  const handleView = (dp: DPProfile) => navigate(`/admin/dp-details/${dp.id}`);

  const handleChangeStatus = (dp: DPProfile) => setChangingStatusDP(dp);

  const confirmChangeStatus = async () => {
    if (!changingStatusDP) return;
    try {
      await realDataService.updateDP(changingStatusDP.id, {
        status: 'قيد الانتظار'
      });
      setToast({ message: 'تم تغيير حالة التسجيل إلى قيد الانتظار', type: 'success' });
      await loadDPs();
    } catch (err: any) {
      setToast({ message: `فشل تغيير حالة التسجيل: ${err.message || 'خطأ غير معروف'}`, type: 'error' });
    } finally {
      setChangingStatusDP(null);
    }
  };

  const cancelChangeStatus = () => setChangingStatusDP(null);

  // Restore handlers
  const handleRestore = (dp: DPProfile) => {
    setRestoringDP(dp);
    setRestoreReason('');
  };

  const confirmRestore = async () => {
    if (!restoringDP) return;
    try {
      await realDataService.restoreFamily(restoringDP.id, restoreReason || 'استعادة من قبل الإدارة المركزية');
      setToast({ message: 'تم استعادة العائلة بنجاح', type: 'success' });
      await loadDPs();
      setRestoringDP(null);
      setRestoreReason('');
    } catch (err: any) {
      setToast({ message: `فشل استعادة العائلة: ${err.message || 'خطأ غير معروف'}`, type: 'error' });
    }
  };

  const cancelRestore = () => {
    setRestoringDP(null);
    setRestoreReason('');
  };

  const getFullName = (dp: DPProfile): string => {
    if (dp.headFirstName && dp.headFatherName && dp.headGrandfatherName && dp.headFamilyName) {
      return `${dp.headFirstName} ${dp.headFatherName} ${dp.headGrandfatherName} ${dp.headFamilyName}`;
    }
    return dp.headOfFamily;
  };

  const getCampName = (campId: string): string => {
    const camp = camps.find(c => c.id === campId);
    return camp ? camp.name : 'غير محدد';
  };

  const filteredDPs = dps.filter(dp => {
    const fullName = getFullName(dp);

    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      fullName,
      dp.nationalId,
      dp.phoneNumber,
      dp.phoneSecondary,
      dp.currentHousingLandmark,
      dp.originalAddressRegion,
      dp.currentHousingRegion
    ]);

    const matchesVulnerabilityPriority = filterVulnerabilityPriority.length === 0 ||
      (dp.vulnerabilityPriority && filterVulnerabilityPriority.includes(dp.vulnerabilityPriority));

    const matchesMaritalStatus = filterMaritalStatusMulti.length === 0 ||
      (dp.maritalStatus && filterMaritalStatusMulti.includes(dp.maritalStatus));

    const matchesStatus = filterStatus === 'all' || dp.registrationStatus === filterStatus;
    const matchesTab = activeTab === 'all' || dp.registrationStatus === 'قيد الانتظار';

    const matchesCamp = filterCamp === 'all' || dp.campId === filterCamp;

    const matchesGovernorate = filterGovernorate === 'all' ||
      dp.currentHousingGovernorate === filterGovernorate ||
      dp.originalAddressGovernorate === filterGovernorate;

    const matchesRegion = filterRegion === 'all' ||
      dp.currentHousingRegion === filterRegion ||
      dp.originalAddressRegion === filterRegion;

    const matchesFamilySizeMin = filterFamilySizeMin === '' ||
      dp.totalMembersCount >= parseInt(filterFamilySizeMin);

    const matchesFamilySizeMax = filterFamilySizeMax === '' ||
      dp.totalMembersCount <= parseInt(filterFamilySizeMax);

    // ⚠️  DISABLED: Vulnerability score filter
    // const matchesVulnerabilityScore =
    //   (filterVulnerabilityScoreMin === '' || (dp.vulnerabilityScore || 0) >= parseFloat(filterVulnerabilityScoreMin)) &&
    //   (filterVulnerabilityScoreMax === '' || (dp.vulnerabilityScore || 0) <= parseFloat(filterVulnerabilityScoreMax));
    const matchesVulnerabilityScore = true;

    const matchesHasDisability = filterHasDisability === null ||
      (filterHasDisability ? (dp.disabilityType && dp.disabilityType !== 'لا يوجد') : (!dp.disabilityType || dp.disabilityType === 'لا يوجد'));

    const matchesDisabilityType = filterDisabilityType.length === 0 ||
      (dp.disabilityType && filterDisabilityType.includes(dp.disabilityType));

    const matchesHasChronicDisease = filterHasChronicDisease === null ||
      (filterHasChronicDisease ? (dp.chronicDiseaseType && dp.chronicDiseaseType !== 'لا يوجد') : (!dp.chronicDiseaseType || dp.chronicDiseaseType === 'لا يوجد'));

    const matchesChronicDiseaseType = filterChronicDiseaseType.length === 0 ||
      (dp.chronicDiseaseType && filterChronicDiseaseType.includes(dp.chronicDiseaseType));

    const matchesHasWarInjury = filterHasWarInjury === null ||
      (filterHasWarInjury ? (dp.warInjuryType && dp.warInjuryType !== 'لا يوجد') : (!dp.warInjuryType || dp.warInjuryType === 'لا يوجد'));

    const matchesWarInjuryType = filterWarInjuryType.length === 0 ||
      (dp.warInjuryType && filterWarInjuryType.includes(dp.warInjuryType));

    const matchesHasPregnancy = filterHasPregnancy === null ||
      (filterHasPregnancy ? dp.wifeIsPregnant : !dp.wifeIsPregnant);

    const matchesPregnancyMonthMin = filterPregnancyMonthMin === '' ||
      (dp.wifePregnancyMonth && dp.wifePregnancyMonth >= parseInt(filterPregnancyMonthMin));

    const matchesIncomeMin = filterIncomeMin === '' ||
      (dp.headOfFamilyMonthlyIncome && dp.headOfFamilyMonthlyIncome >= parseFloat(filterIncomeMin));

    const matchesIncomeMax = filterIncomeMax === '' ||
      (dp.headOfFamilyMonthlyIncome && dp.headOfFamilyMonthlyIncome <= parseFloat(filterIncomeMax));

    const matchesHousingTypes = filterHousingTypes.length === 0 ||
      (dp.currentHousingType && filterHousingTypes.includes(dp.currentHousingType));

    const matchesHasPoorSanitary = filterHasPoorSanitary === null ||
      (filterHasPoorSanitary ?
        (dp.currentHousingSanitaryFacilities === 'لا (مرافق مشتركة)') :
        (dp.currentHousingSanitaryFacilities === 'نعم (دورة مياه خاصة)'));

    const matchesOrphanCountMin = filterOrphanCountMin === '' ||
      (dp.orphanCount && dp.orphanCount >= parseInt(filterOrphanCountMin));

    const matchesOrphanCountMax = filterOrphanCountMax === '' ||
      (dp.orphanCount && dp.orphanCount <= parseInt(filterOrphanCountMax));

    const matchesIsEmployed = filterIsEmployed === null ||
      (filterIsEmployed ? dp.headOfFamilyIsWorking : !dp.headOfFamilyIsWorking);

    const matchesChildCountMin = filterChildCountMin === '' ||
      dp.childCount >= parseInt(filterChildCountMin);

    const matchesChildCountMax = filterChildCountMax === '' ||
      dp.childCount <= parseInt(filterChildCountMax);

    const matchesSeniorCountMin = filterSeniorCountMin === '' ||
      dp.seniorCount >= parseInt(filterSeniorCountMin);

    const matchesSeniorCountMax = filterSeniorCountMax === '' ||
      dp.seniorCount <= parseInt(filterSeniorCountMax);

    return matchesSearch && matchesVulnerabilityPriority && matchesMaritalStatus &&
           matchesStatus && matchesTab && matchesCamp && matchesGovernorate && matchesRegion &&
           matchesFamilySizeMin && matchesFamilySizeMax &&
           // ⚠️  DISABLED: matchesVulnerabilityScore always true
           // matchesVulnerabilityScore &&
           true &&
           matchesHasDisability && matchesDisabilityType &&
           matchesHasChronicDisease && matchesChronicDiseaseType &&
           matchesHasWarInjury && matchesWarInjuryType &&
           matchesHasPregnancy && matchesPregnancyMonthMin &&
           matchesIncomeMin && matchesIncomeMax &&
           matchesHousingTypes && matchesHasPoorSanitary &&
           matchesOrphanCountMin && matchesOrphanCountMax &&
           matchesIsEmployed &&
           matchesChildCountMin && matchesChildCountMax &&
           matchesSeniorCountMin && matchesSeniorCountMax;
  });

  const totalPages = Math.ceil(filteredDPs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDPs = filteredDPs.slice(startIndex, startIndex + itemsPerPage);

  // Use global stats from API if available, otherwise calculate from local data
  const stats = globalStats || {
    total: dps.length,
    totalMembers: dps.reduce((sum, d) => sum + d.totalMembersCount, 0),
    byStatus: {
      'قيد الانتظار': dps.filter(d => d.registrationStatus === 'قيد الانتظار').length,
      'موافق': dps.filter(d => d.registrationStatus === 'موافق').length,
      'مرفوض': dps.filter(d => d.registrationStatus === 'مرفوض').length
    },
    byVulnerability: {
      'عالي جداً': dps.filter(d => d.vulnerabilityPriority === 'عالي جداً').length,
      'عالي': dps.filter(d => d.vulnerabilityPriority === 'عالي').length,
      'متوسط': dps.filter(d => d.vulnerabilityPriority === 'متوسط').length,
      'منخفض': dps.filter(d => d.vulnerabilityPriority === 'منخفض').length
    },
    avgFamilySize: dps.length > 0 ? Math.round(dps.reduce((sum, d) => sum + d.totalMembersCount, 0) / dps.length) : 0,
    totalCamps: camps.length
  };

  if (loading && dps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-4 text-center">
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[...Array(9)].map((_, i) => (
                    <th key={i} className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {[...Array(9)].map((_, j) => (
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
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              الإدارة المركزية للعائلات
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">سجل العائلات المركزي عبر جميع المخيمات</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-gray-700">{stats.total || stats.totalFamilies || 0}</p>
            <p className="text-xs font-bold text-gray-600 mt-1">إجمالي العائلات</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-blue-600">{stats.totalMembers || 0}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">إجمالي الأفراد</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-amber-600">{stats.byStatus?.['قيد الانتظار'] || stats.pending || 0}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">قيد الانتظار</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">{stats.byStatus?.['موافق'] || 0}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">موافق</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">{stats.avgFamilySize || 0}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">متوسط الحجم</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-purple-600">{stats.totalCamps || stats.byCamp?.length || 0}</p>
            <p className="text-xs font-bold text-purple-700 mt-1">عدد المخيمات</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-800">تصفية البيانات</h2>
            <div className="flex items-center gap-3">
              {/* Show Deleted Toggle - SYSTEM_ADMIN only */}
              <label className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl font-bold cursor-pointer hover:bg-red-100 transition-all border-2 border-red-200">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <span>إظهار العائلات المحذوفة</span>
              </label>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showFilters ? 'إخفاء' : 'إظهار'} الفلاتر المتقدمة
              </button>
            </div>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="ابحث بالاسم، الرقم الوطني، رقم الهاتف..."
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-black text-gray-700 mb-2">المخيم</label>
              <select
                value={filterCamp}
                onChange={(e) => setFilterCamp(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
              >
                <option value="all">جميع المخيمات</option>
                {camps.map(camp => (
                  <option key={camp.id} value={camp.id}>{camp.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-2">الحالة</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
              >
                <option value="all">جميع الحالات</option>
                <option value="قيد الانتظار">قيد الانتظار</option>
                <option value="موافق">موافق</option>
                <option value="مرفوض">مرفوض</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-2">المحافظة</label>
              <select
                value={filterGovernorate}
                onChange={(e) => setFilterGovernorate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
              >
                <option value="all">جميع المحافظات</option>
                {GAZA_LOCATIONS.map(gov => (
                  <option key={gov.arabic_name} value={gov.arabic_name}>{gov.arabic_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-700 mb-2">المنطقة</label>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
              >
                <option value="all">جميع المناطق</option>
                {filterGovernorate !== 'all' && getAreasByGovernorate(filterGovernorate).map(area => (
                  <option key={area.arabic_name} value={area.arabic_name}>{area.arabic_name}</option>
                ))}
              </select>
            </div>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
              <div>
                <label className="block text-xs font-black text-gray-700 mb-2">عدد الأفراد (من)</label>
                <input
                  type="number"
                  value={filterFamilySizeMin}
                  onChange={(e) => setFilterFamilySizeMin(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-gray-700 mb-2">عدد الأفراد (إلى)</label>
                <input
                  type="number"
                  value={filterFamilySizeMax}
                  onChange={(e) => setFilterFamilySizeMax(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                  placeholder="20"
                />
              </div>

              {/* ⚠️  DISABLED: Vulnerability priority filter - Vulnerability score system disabled */}
              {/* <div>
                <label className="block text-xs font-black text-gray-700 mb-2">مستوى الهشاشة</label>
                <select
                  value={filterVulnerabilityPriority[0] || ''}
                  onChange={(e) => setFilterVulnerabilityPriority(e.target.value ? [e.target.value] : [])}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                >
                  <option value="">جميع المستويات</option>
                  {VULNERABILITY_LEVELS.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div> */}

              <div>
                <label className="block text-xs font-black text-gray-700 mb-2">الحالة الاجتماعية</label>
                <select
                  value={filterMaritalStatusMulti[0] || ''}
                  onChange={(e) => setFilterMaritalStatusMulti(e.target.value ? [e.target.value] : [])}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                >
                  <option value="">جميع الحالات</option>
                  {MARITAL_STATUS_OPTIONS.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`flex-1 px-6 py-4 font-black transition-all ${
              activeTab === 'all'
                ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-500'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            جميع العائلات ({dps.length})
          </button>
          <button
            onClick={() => { setActiveTab('قيد الانتظار'); setCurrentPage(1); }}
            className={`flex-1 px-6 py-4 font-black transition-all flex items-center justify-center gap-2 ${
              activeTab === 'قيد الانتظار'
                ? 'bg-amber-50 text-amber-700 border-b-2 border-amber-500'
                : 'text-gray-500 hover:bg-gray-50'
            }`}
          >
            قيد الانتظار
            {stats.pending > 0 && (
              <span className="px-2 py-1 bg-amber-500 text-white text-xs font-black rounded-full">
                {stats.pending}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Card View (hidden on lg screens) */}
        <div className="lg:hidden">
          {currentDPs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <p className="text-gray-500 font-bold">لا توجد عائلات مطابقة</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 px-4">
              {currentDPs.map((dp) => (
                <div key={dp.id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg flex-shrink-0 ${
                      dp.gender === 'ذكر'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-pink-100 text-pink-700'
                    }`}>
                      {getFullName(dp).charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 text-lg truncate">{getFullName(dp)}</p>
                      <p className="text-xs text-gray-500 font-bold">{dp.currentHousingRegion || dp.originalAddressRegion || 'غير محدد'}</p>
                    </div>
                  </div>

                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {/* National ID */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-bold mb-1">الرقم الوطني</p>
                      <p className="font-black text-gray-800 text-sm" dir="ltr">{dp.nationalId}</p>
                    </div>

                    {/* Camp */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-bold mb-1">المخيم</p>
                      <p className="font-bold text-gray-700 text-sm">{getCampName(dp.campId || '')}</p>
                    </div>

                    {/* Family Size */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-bold mb-1">عدد الأفراد</p>
                      <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-black bg-white text-gray-700 border border-gray-200">
                        {dp.totalMembersCount} أفراد
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-bold mb-1">الهاتف</p>
                      <p className="font-bold text-gray-700 text-sm" dir="ltr">{dp.phoneNumber}</p>
                    </div>

                    {/* Vulnerability */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-bold mb-1">الهشاشة</p>
                      {dp.vulnerabilityPriority ? (
                        <span className={`inline-flex items-center px-2 py-1 rounded-lg text-xs font-black border-2 ${
                          dp.vulnerabilityPriority === 'عالي جداً' ? 'bg-red-50 text-red-700 border-red-200' :
                          dp.vulnerabilityPriority === 'عالي' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          dp.vulnerabilityPriority === 'متوسط' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {dp.vulnerabilityPriority}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold text-sm">-</span>
                      )}
                    </div>

                    {/* Status */}
                    <div className="bg-gray-50 rounded-xl p-3">
                      <p className="text-xs text-gray-500 font-bold mb-1">الحالة</p>
                      {dp.registrationStatus === 'قيد الانتظار' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-black bg-amber-50 text-amber-700 border-2 border-amber-200">
                          قيد الانتظار
                        </span>
                      ) : dp.registrationStatus === 'موافق' ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-black bg-emerald-50 text-emerald-700 border-2 border-emerald-200">
                          موافق
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-black bg-red-50 text-red-700 border-2 border-red-200">
                          مرفوض
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleView(dp)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 text-emerald-700 rounded-xl font-black hover:bg-emerald-100 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      عرض
                    </button>
                    {dp.registrationStatus === 'قيد الانتظار' && (
                      <>
                        <button
                          onClick={() => handleApprove(dp)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          قبول
                        </button>
                        <button
                          onClick={() => handleReject(dp)}
                          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500 text-white rounded-xl font-black hover:bg-red-600 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          رفض
                        </button>
                      </>
                    )}
                    {dp.registrationStatus === 'مرفوض' && (
                      <button
                        onClick={() => handleChangeStatus(dp)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl font-black hover:bg-amber-600 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        انتظار
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Desktop Table View (hidden on mobile, shown on lg screens) */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-right font-black text-gray-700">العائلة</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">الرقم الوطني</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">المخيم</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">عدد الأفراد</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">الهشاشة</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">الحالة</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">الهاتف</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentDPs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-bold">لا توجد عائلات مطابقة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentDPs.map((dp) => {
                  const isDeleted = dp.is_deleted === true;
                  return (
                    <tr key={dp.id} className={`hover:bg-gray-50 transition-colors ${isDeleted ? 'bg-red-50 border-2 border-red-200' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm ${
                          dp.gender === 'ذكر'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-pink-100 text-pink-700'
                        }`}>
                          {getFullName(dp).charAt(0)}
                        </div>
                        <div>
                          <p className={`font-black text-gray-800 ${isDeleted ? 'line-through text-red-600' : ''}`}>{getFullName(dp)}</p>
                          <p className="text-xs text-gray-500 font-bold">{dp.currentHousingRegion || dp.originalAddressRegion}</p>
                          {isDeleted && (
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-600 text-white text-xs font-black rounded">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              محذوف
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${isDeleted ? 'text-red-600 line-through' : 'text-gray-700'}`}>{dp.nationalId}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${isDeleted ? 'text-red-400' : 'text-gray-600'}`}>{getCampName(dp.campId || '')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-black ${isDeleted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                        {dp.totalMembersCount} أفراد
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {dp.vulnerabilityPriority ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border-2 ${
                          dp.vulnerabilityPriority === 'عالي جداً' ? 'bg-red-50 text-red-700 border-red-200' :
                          dp.vulnerabilityPriority === 'عالي' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          dp.vulnerabilityPriority === 'متوسط' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        } ${isDeleted ? 'opacity-50' : ''}`}>
                          {dp.vulnerabilityPriority}
                        </span>
                      ) : (
                        <span className="text-gray-400 font-bold">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {dp.registrationStatus === 'قيد الانتظار' ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-700 border-2 border-amber-200 ${isDeleted ? 'opacity-50' : ''}`}>
                          قيد الانتظار
                        </span>
                      ) : dp.registrationStatus === 'موافق' ? (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border-2 border-emerald-200 ${isDeleted ? 'opacity-50' : ''}`}>
                          موافق
                        </span>
                      ) : (
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-red-50 text-red-700 border-2 border-red-200 ${isDeleted ? 'opacity-50' : ''}`}>
                          مرفوض
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`font-bold ${isDeleted ? 'text-red-400' : 'text-gray-600'}`} dir="ltr">{dp.phoneNumber}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {isDeleted ? (
                          <button
                            onClick={() => handleRestore(dp)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="استعادة"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleView(dp)}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="عرض التفاصيل"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            </button>
                            {dp.registrationStatus === 'قيد الانتظار' && (
                              <>
                                <button
                                  onClick={() => handleApprove(dp)}
                                  className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="قبول"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => handleReject(dp)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="رفض"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </>
                            )}
                            {dp.registrationStatus === 'مرفوض' && (
                              <button
                                onClick={() => handleChangeStatus(dp)}
                                className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="إعادة للانتظار"
                              >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                              </button>
                            )}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm font-bold text-gray-600">
              عرض {startIndex + 1} إلى {Math.min(startIndex + itemsPerPage, filteredDPs.length)} من {filteredDPs.length} عائلة
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                السابق
              </button>
              <span className="px-4 py-2 font-black text-gray-800">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Reject Modal */}
      {rejectingDP && (
        <ConfirmModal
          title="تأكيد الرفض"
          message={`هل أنت متأكد من رفض تسجيل عائلة "${getFullName(rejectingDP)}"؟`}
          confirmText="رفض"
          cancelText="إلغاء"
          onConfirm={confirmReject}
          onCancel={cancelReject}
          type="danger"
        />
      )}

      {/* Confirm Change Status Modal */}
      {changingStatusDP && (
        <ConfirmModal
          title="تأكيد تغيير الحالة"
          message={`هل أنت متأكد من إعادة حالة عائلة "${getFullName(changingStatusDP)}" إلى قيد الانتظار؟`}
          confirmText="تأكيد"
          cancelText="إلغاء"
          onConfirm={confirmChangeStatus}
          onCancel={cancelChangeStatus}
          type="warning"
        />
      )}

      {/* Restore Modal */}
      {restoringDP && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">استعادة عائلة محذوفة</h3>
              <p className="text-gray-600 font-bold text-sm mb-4">
                هل أنت متأكد من استعادة عائلة "{getFullName(restoringDP)}"؟
              </p>
              <div className="text-right">
                <label className="block text-sm font-black text-gray-700 mb-2">
                  سبب الاستعادة
                </label>
                <textarea
                  value={restoreReason}
                  onChange={(e) => setRestoreReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold resize-none"
                  rows={3}
                  placeholder="أدخل سبب الاستعادة..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelRestore}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={confirmRestore}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-800 transition-all shadow-lg"
              >
                استعادة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DPManagement;
