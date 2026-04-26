// views/camp-manager/DPManagement.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { GAZA_LOCATIONS, getAreasByGovernorate } from '../../constants/gazaLocations';
import { SearchInput, DateRangeFilter, MultiSelectFilter, FilterPanel } from '../../components/filters';
import { normalizeArabic, matchesArabicSearchMulti } from '../../utils/arabicTextUtils';
import BulkFieldPermissionsModal from './BulkFieldPermissionsModal';

interface DPProfile {
  id: string;
  // 4-part name structure (Migration 015)
  headFirstName?: string;
  headFatherName?: string;
  headGrandfatherName?: string;
  headFamilyName?: string;
  headOfFamily: string; // Computed full name for backward compatibility
  nationalId: string;
  gender: 'ذكر' | 'أنثى';
  dateOfBirth: string;
  age: number;
  maritalStatus: string;
  phoneNumber: string;
  phoneSecondary?: string;
  totalMembersCount: number;
  campId?: string;
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
  // Pregnancy special needs (Migration 016)
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
  currentHousingSanitaryFacilities?: 'private' | 'shared';
  currentHousingWaterSource?: 'public_network' | 'tanker' | 'well' | 'other';
  currentHousingElectricityAccess?: 'public_grid' | 'generator' | 'solar' | 'none' | 'other';
  currentHousingGovernorate?: string;
  currentHousingRegion?: string;
  currentHousingLandmark?: string;
  // Enhanced housing (Migration 016)
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
  orphanCount?: number; // Added: Number of orphans
  pregnantWomenCount?: number;
  headOfFamilyIsWorking?: boolean; // Added: Employment status
  headOfFamilyMonthlyIncome?: number; // Added: Monthly income
  adminNotes?: string;
  nominationBody?: string;
  members?: any[];
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

// Additional filter type arrays for comprehensive vulnerability filtering
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkFieldPermissionsModal, setShowBulkFieldPermissionsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'قيد الانتظار' | 'موافق' | 'مرفوض'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'قيد الانتظار' | 'موافق'>('all');

  // Enhanced filters
  const [filterGovernorate, setFilterGovernorate] = useState<string>('all');
  const [filterRegion, setFilterRegion] = useState<string>('all');
  const [filterFamilySizeMin, setFilterFamilySizeMin] = useState<string>('');
  const [filterFamilySizeMax, setFilterFamilySizeMax] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // ⚠️  DISABLED: Vulnerability filters - Vulnerability score system disabled
  // Comprehensive Vulnerability Filters (from AidCampaigns)
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

  const [formData, setFormData] = useState({
    // 4-Part Name Structure (Migration 015)
    headFirstName: '',
    headFatherName: '',
    headGrandfatherName: '',
    headFamilyName: '',
    headOfFamily: '', // Computed field for backward compatibility

    // Head of Family - Primary Fields
    nationalId: '',
    gender: 'ذكر' as 'ذكر' | 'أنثى',
    dateOfBirth: '',
    maritalStatus: 'أعزب' as 'أعزب' | 'متزوج' | 'أرمل' | 'مطلق' | 'أسرة هشة',
    phoneNumber: '',
    headRole: '' as 'أب' | 'أم' | 'زوجة',
    widowReason: 'وفاة طبيعية' as 'شهيد' | 'وفاة طبيعية' | 'حادث' | 'مرض' | 'غير ذلك',

    // Location (matching RegisterFamily - Original Address)
    originalAddressGovernorate: 'محافظة شمال غزة',
    originalAddressRegion: '',
    originalAddressLandmark: '',
    originalAddressHousingType: 'إيجار' as 'ملك' | 'إيجار',

    // Location (matching RegisterFamily - Current Housing)
    currentHousingGovernorate: '',
    currentHousingRegion: '',
    currentAddressLandmark: '',
    currentHousingType: 'خيمة' as 'خيمة' | 'بيت إسمنتي' | 'شقة' | 'أخرى',

    // Enhanced Housing (Migration 016)
    currentHousingSharingStatus: 'سكن فردي' as 'سكن فردي' | 'سكن مشترك',
    currentHousingDetailedType: '',
    currentHousingFurnished: false
  });

  // For location dropdowns - Original Address
  const [selectedOrigGovernorate, setSelectedOrigGovernorate] = useState<string>('');
  const [selectedOrigArea, setSelectedOrigArea] = useState<string>('');
  const [availableOrigAreas, setAvailableOrigAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);

  // For location dropdowns - Current Housing
  const [selectedCurrentGovernorate, setSelectedCurrentGovernorate] = useState<string>('');
  const [selectedCurrentArea, setSelectedCurrentArea] = useState<string>('');
  const [availableCurrentAreas, setAvailableCurrentAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);

  // Update available areas when original governorate changes
  useEffect(() => {
    if (formData.originalAddressGovernorate) {
      const areas = getAreasByGovernorate(formData.originalAddressGovernorate);
      setAvailableOrigAreas(areas);
      setSelectedOrigArea(''); // Reset area when governorate changes
    }
  }, [formData.originalAddressGovernorate]);

  // Update available areas when current housing governorate changes
  useEffect(() => {
    if (formData.currentHousingGovernorate) {
      const areas = getAreasByGovernorate(formData.currentHousingGovernorate);
      setAvailableCurrentAreas(areas);
      setSelectedCurrentArea(''); // Reset area when governorate changes
    }
  }, [formData.currentHousingGovernorate]);

  // Ref to keep track of currentCampId without causing re-renders
  const currentCampIdRef = useRef<string>('');

  // Keep currentCampIdRef updated
  useEffect(() => {
    currentCampIdRef.current = currentCampId;
  }, [currentCampId]);

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

  // Load DPs
  const loadDPs = useCallback(async () => {
    try {
      setLoading(true);

      if (!currentCampIdRef.current) {
        setDps([]);
        setLoading(false);
        return;
      }

      const data = await realDataService.getDPs(currentCampIdRef.current);
      setDps(data);
    } catch (err: any) {
      console.error('Error loading DPs:', err);
      setToast({ message: err.message || 'فشل تحميل بيانات العائلات', type: 'error' });
      setDps([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentCampId) {
      loadDPs();
    }
  }, [currentCampId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setShowForm(false);
    // Reset form to default values
    setFormData({
      headFirstName: '',
      headFatherName: '',
      headGrandfatherName: '',
      headFamilyName: '',
      headOfFamily: '',
      nationalId: '',
      gender: 'ذكر',
      dateOfBirth: '',
      maritalStatus: 'أعزب',
      phoneNumber: '',
      headRole: '',
      widowReason: 'وفاة طبيعية',
      originalAddressGovernorate: 'محافظة شمال غزة',
      originalAddressRegion: '',
      originalAddressLandmark: '',
      originalAddressHousingType: 'إيجار',
      currentHousingGovernorate: '',
      currentHousingRegion: '',
      currentAddressLandmark: '',
      currentHousingType: 'خيمة',
      currentHousingSharingStatus: 'سكن فردي',
      currentHousingDetailedType: '',
      currentHousingFurnished: false
    });
    setSelectedOrigGovernorate('');
    setSelectedOrigArea('');
    setSelectedCurrentGovernorate('');
    setSelectedCurrentArea('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validate 4-part name fields
      if (!formData.headFirstName || !formData.headFatherName || !formData.headFamilyName || !formData.nationalId || !formData.phoneNumber) {
        setToast({ message: 'الرجاء إدخال جميع الحقول المطلوبة', type: 'error' });
        setSaving(false);
        return;
      }

      // Compute full name from 4 parts
      const computedFullName = `${formData.headFirstName} ${formData.headFatherName} ${formData.headGrandfatherName} ${formData.headFamilyName}`.trim();

      // Validate headRole for non-single marital status
      if (formData.maritalStatus !== 'single' && !formData.headRole) {
        setToast({ message: 'الرجاء اختيار صفة رب الأسرة', type: 'error' });
        setSaving(false);
        return;
      }

      const familyData = {
        // 4-Part Name Structure (Migration 015)
        head_first_name: formData.headFirstName,
        head_father_name: formData.headFatherName,
        head_grandfather_name: formData.headGrandfatherName,
        head_family_name: formData.headFamilyName,
        head_of_family_name: computedFullName, // Computed full name

        // Head of Family - Primary Fields
        head_of_family_national_id: formData.nationalId,
        head_of_family_gender: formData.gender,
        head_of_family_date_of_birth: formData.dateOfBirth,
        head_of_family_marital_status: formData.maritalStatus,
        head_of_family_widow_reason: formData.maritalStatus === 'أرمل' ? formData.widowReason : null,
        head_of_family_role: formData.maritalStatus !== 'أعزب' ? formData.headRole : null,
        head_of_family_phone_number: formData.phoneNumber,

        // Camp & Housing
        camp_id: currentCampId,

        // Current Housing Camp (Section 5.2)
        current_housing_camp_id: currentCampId,

        // Original Address
        original_address_governorate: formData.originalAddressGovernorate,
        original_address_region: formData.originalAddressRegion,
        original_address_details: formData.originalAddressLandmark,
        original_address_housing_type: formData.originalAddressHousingType,

        // Current Housing
        current_housing_type: formData.currentHousingType,
        current_housing_governorate: formData.currentHousingGovernorate,
        current_housing_region: formData.currentHousingRegion,
        current_housing_landmark: formData.currentAddressLandmark,

        // Enhanced Housing (Migration 016)
        current_housing_sharing_status: formData.currentHousingSharingStatus,
        current_housing_detailed_type: formData.currentHousingDetailedType,
        current_housing_furnished: formData.currentHousingFurnished,

        status: 'قيد الانتظار' as const
      };

      await realDataService.createDP(familyData);
      setToast({ message: 'تم إضافة العائلة بنجاح', type: 'success' });

      // Reset form
      setFormData({
        headFirstName: '',
        headFatherName: '',
        headGrandfatherName: '',
        headFamilyName: '',
        headOfFamily: '',
        nationalId: '',
        gender: 'ذكر',
        dateOfBirth: '',
        maritalStatus: 'أعزب',
        phoneNumber: '',
        headRole: '',
        widowReason: 'وفاة طبيعية',
        originalAddressGovernorate: 'محافظة شمال غزة',
        originalAddressRegion: '',
        originalAddressLandmark: '',
        originalAddressHousingType: 'إيجار',
        currentHousingGovernorate: '',
        currentHousingRegion: '',
        currentAddressLandmark: '',
        currentHousingType: 'خيمة',
        currentHousingSharingStatus: 'سكن فردي',
        currentHousingDetailedType: '',
        currentHousingFurnished: false
      });
      setShowForm(false);
      await loadDPs();
    } catch (err: any) {
      console.error('Error saving DP:', err);
      setToast({ message: err.message || 'فشل حفظ بيانات العائلة', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (dp: DPProfile) => {
    try {
      console.log('[DP] Approving DP:', dp.id);
      // Use the dedicated approve endpoint
      await realDataService.approveDP(dp.id);
      console.log('[DP] Approval successful');
      setToast({ message: 'تم قبول التسجيل بنجاح', type: 'success' });
      await loadDPs();
    } catch (err: any) {
      console.error('[DP] Approval error:', err);
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
      // Use the dedicated reject endpoint with a default reason
      await realDataService.rejectDP(rejectingDP.id, 'رفض من قبل مدير المخيم');
      setToast({ message: 'تم رفض التسجيل', type: 'success' });
      await loadDPs();
    } catch (err: any) {
      setToast({ message: `فشل رفض التسجيل: ${err.message || 'خطأ غير معروف'}`, type: 'error' });
    } finally {
      setRejectingDP(null);
    }
  };

  const cancelReject = () => setRejectingDP(null);

  const handleView = (dp: DPProfile) => navigate(`/manager/dp-details/${dp.id}`);

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

  // Helper function to get full name from 4-part structure
  const getFullName = (dp: DPProfile): string => {
    if (dp.headFirstName && dp.headFatherName && dp.headGrandfatherName && dp.headFamilyName) {
      return `${dp.headFirstName} ${dp.headFatherName} ${dp.headGrandfatherName} ${dp.headFamilyName}`;
    }
    return dp.headOfFamily;
  };

  const filteredDPs = dps.filter(dp => {
    const fullName = getFullName(dp);

    // Arabic-normalized search across multiple fields
    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      fullName,
      dp.nationalId,
      dp.phoneNumber,
      dp.phoneSecondary,
      dp.currentHousingLandmark,
      dp.originalAddressRegion,
      dp.currentHousingRegion
    ]);

    // Comprehensive vulnerability filters
    const matchesVulnerabilityPriority = filterVulnerabilityPriority.length === 0 ||
      (dp.vulnerabilityPriority && filterVulnerabilityPriority.includes(dp.vulnerabilityPriority));

    const matchesMaritalStatus = filterMaritalStatusMulti.length === 0 ||
      (dp.maritalStatus && filterMaritalStatusMulti.includes(dp.maritalStatus));

    const matchesStatus = filterStatus === 'all' || dp.registrationStatus === filterStatus;
    const matchesTab = 
      activeTab === 'all' || 
      (activeTab === 'قيد الانتظار' && dp.registrationStatus === 'قيد الانتظار') ||
      (activeTab === 'موافق' && dp.registrationStatus === 'موافق');

    // Geographic filters
    const matchesGovernorate = filterGovernorate === 'all' ||
      dp.currentHousingGovernorate === filterGovernorate ||
      dp.originalAddressGovernorate === filterGovernorate;

    const matchesRegion = filterRegion === 'all' ||
      dp.currentHousingRegion === filterRegion ||
      dp.originalAddressRegion === filterRegion;

    // Family size filters
    const matchesFamilySizeMin = filterFamilySizeMin === '' ||
      dp.totalMembersCount >= parseInt(filterFamilySizeMin);

    const matchesFamilySizeMax = filterFamilySizeMax === '' ||
      dp.totalMembersCount <= parseInt(filterFamilySizeMax);

    // ⚠️  DISABLED: Vulnerability score filter
    // const matchesVulnerabilityScore =
    //   (filterVulnerabilityScoreMin === '' || (dp.vulnerabilityScore || 0) >= parseFloat(filterVulnerabilityScoreMin)) &&
    //   (filterVulnerabilityScoreMax === '' || (dp.vulnerabilityScore || 0) <= parseFloat(filterVulnerabilityScoreMax));
    const matchesVulnerabilityScore = true;

    // Disability filters
    const matchesHasDisability = filterHasDisability === null ||
      (filterHasDisability ? (dp.disabilityType && dp.disabilityType !== 'لا يوجد') : (!dp.disabilityType || dp.disabilityType === 'لا يوجد'));

    const matchesDisabilityType = filterDisabilityType.length === 0 ||
      (dp.disabilityType && filterDisabilityType.includes(dp.disabilityType));

    // Chronic disease filters
    const matchesHasChronicDisease = filterHasChronicDisease === null ||
      (filterHasChronicDisease ? (dp.chronicDiseaseType && dp.chronicDiseaseType !== 'لا يوجد') : (!dp.chronicDiseaseType || dp.chronicDiseaseType === 'لا يوجد'));

    const matchesChronicDiseaseType = filterChronicDiseaseType.length === 0 ||
      (dp.chronicDiseaseType && filterChronicDiseaseType.includes(dp.chronicDiseaseType));

    // War injury filters
    const matchesHasWarInjury = filterHasWarInjury === null ||
      (filterHasWarInjury ? (dp.warInjuryType && dp.warInjuryType !== 'لا يوجد') : (!dp.warInjuryType || dp.warInjuryType === 'لا يوجد'));

    const matchesWarInjuryType = filterWarInjuryType.length === 0 ||
      (dp.warInjuryType && filterWarInjuryType.includes(dp.warInjuryType));

    // Pregnancy filters
    const matchesHasPregnancy = filterHasPregnancy === null ||
      (filterHasPregnancy ? dp.wifeIsPregnant : !dp.wifeIsPregnant);

    const matchesPregnancyMonthMin = filterPregnancyMonthMin === '' ||
      (dp.wifePregnancyMonth && dp.wifePregnancyMonth >= parseInt(filterPregnancyMonthMin));

    // Income filters
    const matchesIncomeMin = filterIncomeMin === '' ||
      (dp.headOfFamilyMonthlyIncome && dp.headOfFamilyMonthlyIncome >= parseFloat(filterIncomeMin));

    const matchesIncomeMax = filterIncomeMax === '' ||
      (dp.headOfFamilyMonthlyIncome && dp.headOfFamilyMonthlyIncome <= parseFloat(filterIncomeMax));

    // Housing filters
    const matchesHousingTypes = filterHousingTypes.length === 0 ||
      (dp.currentHousingType && filterHousingTypes.includes(dp.currentHousingType));

    const matchesHasPoorSanitary = filterHasPoorSanitary === null ||
      (filterHasPoorSanitary ? 
        (dp.currentHousingSanitaryFacilities === 'لا (مرافق مشتركة)' || dp.currentHousingSanitaryFacilities === 'shared') : 
        (dp.currentHousingSanitaryFacilities === 'نعم (دورة مياه خاصة)' || dp.currentHousingSanitaryFacilities === 'private'));

    // Orphan count filters
    const matchesOrphanCountMin = filterOrphanCountMin === '' ||
      (dp.orphanCount && dp.orphanCount >= parseInt(filterOrphanCountMin));

    const matchesOrphanCountMax = filterOrphanCountMax === '' ||
      (dp.orphanCount && dp.orphanCount <= parseInt(filterOrphanCountMax));

    // Employment filter
    const matchesIsEmployed = filterIsEmployed === null ||
      (filterIsEmployed ? dp.headOfFamilyIsWorking : !dp.headOfFamilyIsWorking);

    // Child count filters
    const matchesChildCountMin = filterChildCountMin === '' ||
      dp.childCount >= parseInt(filterChildCountMin);

    const matchesChildCountMax = filterChildCountMax === '' ||
      dp.childCount <= parseInt(filterChildCountMax);

    // Senior count filters
    const matchesSeniorCountMin = filterSeniorCountMin === '' ||
      dp.seniorCount >= parseInt(filterSeniorCountMin);

    const matchesSeniorCountMax = filterSeniorCountMax === '' ||
      dp.seniorCount <= parseInt(filterSeniorCountMax);

    // Date range filter (using registeredDate if available)
    const matchesDateRange = true; // TODO: Implement when registration date field is available

    return matchesSearch && matchesVulnerabilityPriority && matchesMaritalStatus &&
           matchesStatus && matchesTab && matchesGovernorate && matchesRegion &&
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
           matchesSeniorCountMin && matchesSeniorCountMax &&
           matchesDateRange;
  });

  // Pagination
  const totalPages = Math.ceil(filteredDPs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentDPs = filteredDPs.slice(startIndex, startIndex + itemsPerPage);

  const stats = {
    total: dps.length,
    male: dps.filter(d => d.gender === 'ذكر').length,
    female: dps.filter(d => d.gender === 'أنثى').length,
    highVulnerability: dps.filter(d => d.vulnerabilityPriority === 'عالي جداً' || d.vulnerabilityPriority === 'عالي').length,
    avgFamilySize: dps.length > 0 ? Math.round(dps.reduce((sum, d) => sum + d.totalMembersCount, 0) / dps.length) : 0,
    pending: dps.filter(d => d.registrationStatus === 'قيد الانتظار').length,
    approved: dps.filter(d => d.registrationStatus === 'موافق').length
  };

  if (loading && dps.length === 0) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
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
                  {[...Array(8)].map((_, i) => (
                    <th key={i} className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {[...Array(8)].map((_, j) => (
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
      {/* Toast Notifications */}
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
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              إدارة العائلات النازحة
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">سجل العائلات المسجلة في المخيم</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowBulkFieldPermissionsModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-black hover:from-purple-700 hover:to-purple-800 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>صلاحيات الحقول</span>
            </button>
            <button
            onClick={() => {
              setFormData({
                headFirstName: '',
                headFatherName: '',
                headGrandfatherName: '',
                headFamilyName: '',
                headOfFamily: '',
                nationalId: '',
                gender: 'ذكر',
                dateOfBirth: '',
                maritalStatus: 'أعزب',
                phoneNumber: '',
                headRole: '',
                widowReason: 'وفاة طبيعية',
                originalAddressGovernorate: 'محافظة شمال غزة',
                originalAddressRegion: '',
                originalAddressLandmark: '',
                originalAddressHousingType: 'إيجار',
                currentHousingGovernorate: '',
                currentHousingRegion: '',
                currentAddressLandmark: '',
                currentHousingType: 'خيمة',
                currentHousingSharingStatus: 'سكن فردي',
                currentHousingDetailedType: '',
                currentHousingFurnished: false
              });
              setSelectedOrigGovernorate('');
              setSelectedOrigArea('');
              setSelectedCurrentGovernorate('');
              setSelectedCurrentArea('');
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl w-full sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>عائلة جديدة</span>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-gray-700">{stats.total}</p>
            <p className="text-xs font-bold text-gray-600 mt-1">إجمالي العائلات</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-blue-600">{stats.male}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">رب أسرة ذكر</p>
          </div>
          <div className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-pink-600">{stats.female}</p>
            <p className="text-xs font-bold text-pink-700 mt-1">رب أسرة أنثى</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-amber-600">{stats.pending}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">قيد الانتظار</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">{stats.avgFamilySize}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">متوسط الحجم</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                إضافة عائلة جديدة
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Section 1: Head of Family - Primary Fields */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    بيانات رب الأسرة
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 4-Part Name Structure */}
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">الاسم الأول *</label>
                      <input
                        type="text"
                        value={formData.headFirstName}
                        onChange={(e) => setFormData({...formData, headFirstName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                        placeholder="الاسم الأول"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">اسم الأب *</label>
                      <input
                        type="text"
                        value={formData.headFatherName}
                        onChange={(e) => setFormData({...formData, headFatherName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                        placeholder="اسم الأب"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">اسم الجد</label>
                      <input
                        type="text"
                        value={formData.headGrandfatherName}
                        onChange={(e) => setFormData({...formData, headGrandfatherName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                        placeholder="اسم الجد"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">اسم العائلة *</label>
                      <input
                        type="text"
                        value={formData.headFamilyName}
                        onChange={(e) => setFormData({...formData, headFamilyName: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                        placeholder="اسم العائلة"
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-3">
                        <p className="text-xs font-bold text-blue-800">
                          <span className="text-blue-600">✓</span> الاسم الكامل:
                          <span className="font-black mr-2">
                            {formData.headFirstName || '...'} {formData.headFatherName || '...'} {formData.headGrandfatherName || '...'} {formData.headFamilyName || '...'}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">الرقم الوطني *</label>
                      <input
                        type="text"
                        name="nationalId"
                        value={formData.nationalId}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                        placeholder="9 أرقام"
                        pattern="[0-9]{9}"
                        maxLength={9}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">رقم الهاتف *</label>
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                        placeholder="059xxxxxxx"
                        pattern="[0-9]{10}"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">الجنس</label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                      >
                        <option value="ذكر">ذكر</option>
                        <option value="أنثى">أنثى</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">تاريخ الميلاد</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-gray-700 mb-2">الحالة الاجتماعية *</label>
                      <select
                        name="maritalStatus"
                        value={formData.maritalStatus}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                        required
                      >
                        <option value="أعزب">أعزب / عزباء</option>
                        <option value="متزوج">متزوج / متزوجة</option>
                        <option value="أرمل">أرمل / أرملة</option>
                        <option value="مطلق">مطلق / مطلقة</option>
                        <option value="أسرة هشة">أسرة هشة</option>
                      </select>
                    </div>

                    {/* Show widow reason only when widow is selected */}
                    {formData.maritalStatus === 'أرمل' && (
                      <div>
                        <label className="block text-xs font-black text-gray-700 mb-2">سبب الوفاة</label>
                        <select
                          name="widowReason"
                          value={formData.widowReason}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                        >
                          <option value="وفاة طبيعية">وفاة طبيعية</option>
                          <option value="شهيد">شهيد</option>
                          <option value="حادث">حادث</option>
                          <option value="مرض">مرض</option>
                          <option value="غير ذلك">غير ذلك</option>
                        </select>
                      </div>
                    )}

                    {/* Show head role only when NOT single */}
                    {formData.maritalStatus !== 'أعزب' && (
                      <div>
                        <label className="block text-xs font-black text-gray-700 mb-2">صفة ربّ الأسرة *</label>
                        <select
                          name="headRole"
                          value={formData.headRole}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                          required
                        >
                          <option value="">اختر الصفة</option>
                          <option value="أب">أب (مسؤول عن جميع الأفراد والزوجة)</option>
                          <option value="أم">أم (معيلة للأطفال أو أرملة)</option>
                          <option value="زوجة">زوجة (في حال عجز الزوج أو تعدد الزوجات)</option>
                        </select>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section 2: Location (matching RegisterFamily) */}
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    السكن والنزوح
                  </h3>
                  
                  {/* Original Address Subsection */}
                  <div className="mb-6">
                    <h4 className="text-sm font-black text-gray-600 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-black">1</span>
                      العنوان الأصلي
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-gray-700 mb-2">المحافظة الأصلية</label>
                        <select
                          name="originalAddressGovernorate"
                          value={formData.originalAddressGovernorate}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, originalAddressGovernorate: e.target.value }));
                            setSelectedOrigGovernorate(e.target.value);
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all font-bold"
                        >
                          <option value="">اختر المحافظة</option>
                          {GAZA_LOCATIONS && GAZA_LOCATIONS.map((gov) => (
                            <option key={gov.arabic_name} value={gov.arabic_name}>{gov.arabic_name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-gray-700 mb-2">المنطقة / الحي</label>
                        <select
                          name="originalAddressRegion"
                          value={formData.originalAddressRegion}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, originalAddressRegion: e.target.value }));
                            setSelectedOrigArea(e.target.value);
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all font-bold"
                          disabled={!formData.originalAddressGovernorate}
                        >
                          <option value="">اختر المنطقة</option>
                          {availableOrigAreas && availableOrigAreas.map((area) => (
                            <option key={area.arabic_name} value={area.arabic_name}>{area.arabic_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-black text-gray-700 mb-2">العنوان الأصلي بالتفصيل</label>
                        <input
                          type="text"
                          name="originalAddressLandmark"
                          value={formData.originalAddressLandmark}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all font-bold"
                          placeholder="شارع، معلم معروف.."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-black text-gray-700 mb-2">نوع السكن الأصلي</label>
                        <select
                          name="originalAddressHousingType"
                          value={formData.originalAddressHousingType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all font-bold"
                        >
                          <option value="ملك">ملك</option>
                          <option value="إيجار">إيجار</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Current Housing Subsection */}
                  <div className="border-t-2 border-gray-200 pt-4">
                    <h4 className="text-sm font-black text-gray-600 mb-3 flex items-center gap-2">
                      <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-black">2</span>
                      السكن الحالي
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-gray-700 mb-2">المحافظة الحالية</label>
                        <select
                          name="currentHousingGovernorate"
                          value={formData.currentHousingGovernorate}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, currentHousingGovernorate: e.target.value }));
                            setSelectedCurrentGovernorate(e.target.value);
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all font-bold"
                        >
                          <option value="">اختر المحافظة</option>
                          {GAZA_LOCATIONS && GAZA_LOCATIONS.map((gov) => (
                            <option key={gov.arabic_name} value={gov.arabic_name}>{gov.arabic_name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-black text-gray-700 mb-2">المنطقة / الحي</label>
                        <select
                          name="currentHousingRegion"
                          value={formData.currentHousingRegion}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, currentHousingRegion: e.target.value }));
                            setSelectedCurrentArea(e.target.value);
                          }}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all font-bold"
                          disabled={!formData.currentHousingGovernorate}
                        >
                          <option value="">اختر المنطقة</option>
                          {availableCurrentAreas && availableCurrentAreas.map((area) => (
                            <option key={area.arabic_name} value={area.arabic_name}>{area.arabic_name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-black text-gray-700 mb-2">عنوان السكن الحالي بالتفصيل</label>
                        <input
                          type="text"
                          name="currentAddressLandmark"
                          value={formData.currentAddressLandmark}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all font-bold"
                          placeholder="شارع، معلم معروف، وصف للموقع..."
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-xs font-black text-gray-700 mb-2">نوع السكن الحالي</label>
                        <select
                          name="currentHousingType"
                          value={formData.currentHousingType}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-gray-500 focus:ring-4 focus:ring-gray-100 transition-all font-bold"
                        >
                          <option value="خيمة">خيمة</option>
                          <option value="بيت إسمنتي">بيت باطون</option>
                          <option value="شقة">شقة مستأجرة</option>
                          <option value="أخرى">غير ذلك</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t-2 border-gray-200">
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-black hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                      'حفظ العائلة'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal for Reject */}
      <ConfirmModal
        isOpen={!!rejectingDP}
        title="تأكيد الرفض"
        message="هل أنت متأكد من رفض هذا التسجيل؟"
        itemName={rejectingDP?.headOfFamily}
        confirmText="ارفض"
        cancelText="إلغاء"
        type="warning"
        onConfirm={confirmReject}
        onCancel={cancelReject}
      />

      {/* Change Status Modal */}
      <ConfirmModal
        isOpen={!!changingStatusDP}
        title="تغيير حالة التسجيل"
        message={`هل أنت متأكد من تغيير حالة تسجيل "${changingStatusDP?.headOfFamily}" إلى قيد الانتظار؟`}
        itemName={changingStatusDP?.headOfFamily}
        confirmText="تغيير"
        cancelText="إلغاء"
        type="info"
        onConfirm={confirmChangeStatus}
        onCancel={cancelChangeStatus}
      />

      {/* Filters */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'all'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
            }`}
          >
            جميع العائلات ({stats.total})
          </button>
          <button
            onClick={() => { setActiveTab('موافق'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'موافق'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            المعتمدة ({stats.approved})
          </button>
          <button
            onClick={() => { setActiveTab('قيد الانتظار'); setCurrentPage(1); }}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'قيد الانتظار'
                ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg'
                : 'bg-gray-50 text-gray-700 border-2 border-gray-200 hover:bg-gray-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            قيد الانتظار ({stats.pending})
          </button>
        </div>
        
        {/* Enhanced Filter Panel */}
        <FilterPanel
          title="تصفية النتائج"
          activeFilters={[
            ...(searchTerm ? [{ id: 'search', label: `بحث: "${searchTerm}"`, value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
            ...(filterGovernorate !== 'all' ? [{ id: 'governorate', label: `المحافظة: ${filterGovernorate}`, value: filterGovernorate, onRemove: () => setFilterGovernorate('all') }] : []),
            ...(filterRegion !== 'all' ? [{ id: 'region', label: `المنطقة: ${filterRegion}`, value: filterRegion, onRemove: () => setFilterRegion('all') }] : []),
            ...(filterStatus !== 'all' ? [{ id: 'status', label: `حالة التسجيل: ${filterStatus}`, value: filterStatus, onRemove: () => setFilterStatus('all') }] : []),
            ...(filterFamilySizeMin || filterFamilySizeMax ? [{ id: 'familySize', label: `حجم الأسرة: ${filterFamilySizeMin || '0'}-${filterFamilySizeMax || '∞'}`, value: 'familySize', onRemove: () => { setFilterFamilySizeMin(''); setFilterFamilySizeMax(''); } }] : [])
          ]}
          onClearAll={() => {
            setSearchTerm('');
            setFilterGovernorate('all');
            setFilterRegion('all');
            setFilterStatus('all');
            setFilterVulnerabilityPriority([]);
            setFilterFamilySizeMin('');
            setFilterFamilySizeMax('');
            setFilterChildCountMin('');
            setFilterChildCountMax('');
            setFilterSeniorCountMin('');
            setFilterSeniorCountMax('');
            setFilterHasDisability(null);
            setFilterDisabilityType([]);
            setFilterHasChronicDisease(null);
            setFilterChronicDiseaseType([]);
            setFilterHasWarInjury(null);
            setFilterWarInjuryType([]);
            setFilterHasPregnancy(null);
            setFilterPregnancyMonthMin('');
            setFilterIncomeMin('');
            setFilterIncomeMax('');
            setFilterOrphanCountMin('');
            setFilterOrphanCountMax('');
            setFilterMaritalStatusMulti([]);
            setFilterIsEmployed(null);
          }}
          defaultOpen={showFilters}
          iconColor="blue"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search Input with Arabic Normalization */}
            <div className="lg:col-span-3">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="ابحث باسم رب الأسرة، الرقم الوطني، رقم الهاتف، المنطقة..."
                iconColor="blue"
                showArabicHint
              />
            </div>

            {/* Governorate Filter */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">المحافظة</label>
              <select
                value={filterGovernorate}
                onChange={(e) => setFilterGovernorate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
              >
                <option value="all">جميع المحافظات</option>
                {GAZA_LOCATIONS.map((gov) => (
                  <option key={gov.arabic_name} value={gov.arabic_name}>{gov.arabic_name}</option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">المنطقة</label>
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
              >
                <option value="all">جميع المناطق</option>
                {GAZA_LOCATIONS.flatMap(gov => gov.areas).map((area) => (
                  <option key={area.arabic_name} value={area.arabic_name}>{area.arabic_name}</option>
                ))}
              </select>
            </div>

            {/* Family Size Range */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">من</label>
                <input
                  type="number"
                  value={filterFamilySizeMin}
                  onChange={(e) => setFilterFamilySizeMin(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">إلى</label>
                <input
                  type="number"
                  value={filterFamilySizeMax}
                  onChange={(e) => setFilterFamilySizeMax(e.target.value)}
                  placeholder="∞"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                />
              </div>
            </div>

            {/* Children Filter */}
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">عدد الأطفال (من)</label>
                <input
                  type="number"
                  value={filterChildCountMin}
                  onChange={(e) => setFilterChildCountMin(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">عدد الأطفال (إلى)</label>
                <input
                  type="number"
                  value={filterChildCountMax}
                  onChange={(e) => setFilterChildCountMax(e.target.value)}
                  placeholder="∞"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-bold"
                />
              </div>
            </div>

            {/* Seniors Filter */}
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">كبار السن 60+ (من)</label>
                <input
                  type="number"
                  value={filterSeniorCountMin}
                  onChange={(e) => setFilterSeniorCountMin(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">كبار السن 60+ (إلى)</label>
                <input
                  type="number"
                  value={filterSeniorCountMax}
                  onChange={(e) => setFilterSeniorCountMax(e.target.value)}
                  placeholder="∞"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-bold"
                />
              </div>
            </div>

            {/* Disability Filter */}
            <div className="md:col-span-2">
              <MultiSelectFilter
                label="نوع الإعاقة"
                options={DISABILITY_TYPES}
                value={filterDisabilityType}
                onChange={setFilterDisabilityType}
                placeholder="اختر أنواع الإعاقة..."
                iconColor="purple"
                searchable
              />
              <div className="mt-2">
                <label className="block text-xs font-black text-gray-600 mb-1">هل لديها إعاقة؟</label>
                <select
                  value={filterHasDisability === null ? 'all' : filterHasDisability ? 'yes' : 'no'}
                  onChange={(e) => setFilterHasDisability(e.target.value === 'all' ? null : e.target.value === 'yes')}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm font-bold"
                >
                  <option value="all">الجميع</option>
                  <option value="yes">نعم</option>
                  <option value="no">لا</option>
                </select>
              </div>
            </div>

            {/* Chronic Disease Filter */}
            <div className="md:col-span-2">
              <MultiSelectFilter
                label="نوع المرض المزمن"
                options={CHRONIC_DISEASE_TYPES}
                value={filterChronicDiseaseType}
                onChange={setFilterChronicDiseaseType}
                placeholder="اختر أنواع الأمراض المزمنة..."
                iconColor="purple"
                searchable
              />
              <div className="mt-2">
                <label className="block text-xs font-black text-gray-600 mb-1">هل لديها مرض مزمن؟</label>
                <select
                  value={filterHasChronicDisease === null ? 'all' : filterHasChronicDisease ? 'yes' : 'no'}
                  onChange={(e) => setFilterHasChronicDisease(e.target.value === 'all' ? null : e.target.value === 'yes')}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm font-bold"
                >
                  <option value="all">الجميع</option>
                  <option value="yes">نعم</option>
                  <option value="no">لا</option>
                </select>
              </div>
            </div>

            {/* War Injury Filter */}
            <div className="md:col-span-2">
              <MultiSelectFilter
                label="نوع إصابة الحرب"
                options={WAR_INJURY_TYPES}
                value={filterWarInjuryType}
                onChange={setFilterWarInjuryType}
                placeholder="اختر أنواع إصابات الحرب..."
                iconColor="purple"
                searchable
              />
              <div className="mt-2">
                <label className="block text-xs font-black text-gray-600 mb-1">هل لديها إصابة حرب؟</label>
                <select
                  value={filterHasWarInjury === null ? 'all' : filterHasWarInjury ? 'yes' : 'no'}
                  onChange={(e) => setFilterHasWarInjury(e.target.value === 'all' ? null : e.target.value === 'yes')}
                  className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm font-bold"
                >
                  <option value="all">الجميع</option>
                  <option value="yes">نعم</option>
                  <option value="no">لا</option>
                </select>
              </div>
            </div>

            {/* Pregnancy Filter */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">حالة الحمل</label>
              <select
                value={filterHasPregnancy === null ? 'all' : filterHasPregnancy ? 'yes' : 'no'}
                onChange={(e) => setFilterHasPregnancy(e.target.value === 'all' ? null : e.target.value === 'yes')}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold"
              >
                <option value="all">الجميع</option>
                <option value="yes">حامل</option>
                <option value="no">غير حامل</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">شهر الحمل (من)</label>
              <input
                type="number"
                value={filterPregnancyMonthMin}
                onChange={(e) => setFilterPregnancyMonthMin(e.target.value)}
                placeholder="1"
                min="1"
                max="9"
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold"
              />
            </div>

            {/* Income Filter */}
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">الدخل الشهري (من)</label>
                <input
                  type="number"
                  value={filterIncomeMin}
                  onChange={(e) => setFilterIncomeMin(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">الدخل الشهري (إلى)</label>
                <input
                  type="number"
                  value={filterIncomeMax}
                  onChange={(e) => setFilterIncomeMax(e.target.value)}
                  placeholder="∞"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-bold"
                />
              </div>
            </div>

            {/* Orphan Count Filter */}
            <div className="grid grid-cols-2 gap-2 md:col-span-2">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">عدد الأيتام (من)</label>
                <input
                  type="number"
                  value={filterOrphanCountMin}
                  onChange={(e) => setFilterOrphanCountMin(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">عدد الأيتام (إلى)</label>
                <input
                  type="number"
                  value={filterOrphanCountMax}
                  onChange={(e) => setFilterOrphanCountMax(e.target.value)}
                  placeholder="∞"
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all font-bold"
                />
              </div>
            </div>

            {/* Marital Status Multi-Select */}
            <div className="md:col-span-2">
              <MultiSelectFilter
                label="الحالة الاجتماعية (بدون معيل)"
                options={MARITAL_STATUS_OPTIONS}
                value={filterMaritalStatusMulti}
                onChange={setFilterMaritalStatusMulti}
                placeholder="اختر الحالات الاجتماعية..."
                iconColor="purple"
                searchable
              />
            </div>

            {/* Employment Filter */}
            <div>
              <label className="block text-sm font-black text-gray-700 mb-2">التوظيف</label>
              <select
                value={filterIsEmployed === null ? 'all' : filterIsEmployed ? 'yes' : 'no'}
                onChange={(e) => setFilterIsEmployed(e.target.value === 'all' ? null : e.target.value === 'yes')}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold"
              >
                <option value="all">الجميع</option>
                <option value="yes">يعمل</option>
                <option value="no">لا يعمل</option>
              </select>
            </div>
          </div>
        </FilterPanel>
      </div>

      {/* Mobile Card View (hidden on lg screens) */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm lg:hidden">
        {currentDPs.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 font-bold text-lg">لا توجد عائلات مطابقة</p>
                <p className="text-gray-400 text-sm font-bold mt-1">ابدأ بإضافة عائلة جديدة</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4 p-4">
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
                    <p className="text-xs text-gray-500 font-bold" dir="ltr">{dp.nationalId}</p>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* Gender */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-bold mb-1">الجنس</p>
                    <span className={`inline-block px-2 py-1 rounded-lg font-black text-xs border-2 ${dp.gender === 'ذكر' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200'}`}>
                      {GENDER_LABELS[dp.gender]}
                    </span>
                  </div>

                  {/* Marital Status */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-bold mb-1">الحالة</p>
                    <span className={`inline-block px-2 py-1 rounded-lg font-black text-xs border-2 ${MARITAL_STATUS[dp.maritalStatus as keyof typeof MARITAL_STATUS]?.color || 'bg-gray-100 text-gray-700'}`}>
                      {dp.maritalStatus || '-'}
                    </span>
                  </div>

                  {/* Family Size */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-bold mb-1">عدد الأفراد</p>
                    <p className="font-black text-gray-700 text-sm">{dp.totalMembersCount}</p>
                  </div>

                  {/* Phone */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-bold mb-1">الهاتف</p>
                    <p className="text-xs md:text-sm font-bold text-gray-700" dir="ltr">{dp.phoneNumber}</p>
                    {dp.phoneSecondary && (
                      <p className="text-xs text-gray-500 font-bold mt-0.5" dir="ltr">{dp.phoneSecondary}</p>
                    )}
                  </div>

                  {/* Unit Number */}
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs text-gray-500 font-bold mb-1">الوحدة</p>
                    <p className="text-sm font-bold text-gray-700">{dp.unitNumber || '-'}</p>
                  </div>

                  {/* Registration Status */}
                  <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                    <p className="text-xs text-gray-500 font-bold mb-1">حالة التسجيل</p>
                    <span className={`inline-block px-2 py-1 rounded-lg font-black text-xs border-2 ${
                      dp.registrationStatus === 'قيد الانتظار' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      dp.registrationStatus === 'موافق' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {dp.registrationStatus === 'قيد الانتظار' ? 'قيد الانتظار' :
                       dp.registrationStatus === 'موافق' ? 'موافق' : 'مرفوض'}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                  {dp.registrationStatus === 'قيد الانتظار' ? (
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
                      <button
                        onClick={() => handleView(dp)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-black hover:bg-blue-100 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        عرض
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleView(dp)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-700 rounded-xl font-black hover:bg-blue-100 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        عرض
                      </button>
                      <button
                        onClick={() => handleChangeStatus(dp)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 text-white rounded-xl font-black hover:bg-amber-600 transition-all"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        تغيير
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop Table View (hidden on mobile, shown on lg screens) */}
      <div className="hidden lg:block bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-sm font-black text-gray-700 whitespace-nowrap">العائلة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700 whitespace-nowrap">الجنس</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700 whitespace-nowrap">الحالة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700 whitespace-nowrap">الأفراد</th>
                <th className="px-6 py-4 text-right text-sm font-black text-gray-700 whitespace-nowrap">الهاتف</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700 whitespace-nowrap">الوحدة</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700 whitespace-nowrap">التسجيل</th>
                <th className="px-6 py-4 text-center text-sm font-black text-gray-700 whitespace-nowrap">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {currentDPs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold text-lg">لا توجد عائلات مطابقة</p>
                        <p className="text-gray-400 text-sm font-bold mt-1">ابدأ بإضافة عائلة جديدة</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                currentDPs.map((dp) => (
                  <tr key={dp.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-black text-gray-800 text-base">{getFullName(dp)}</p>
                        <p className="text-xs text-gray-500 font-bold mt-0.5" dir="ltr">{dp.nationalId}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-black text-xs border-2 ${dp.gender === 'ذكر' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200'}`}>
                        {GENDER_LABELS[dp.gender]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-black text-xs border-2 ${MARITAL_STATUS[dp.maritalStatus as keyof typeof MARITAL_STATUS]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {dp.maritalStatus || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="font-black text-gray-700 text-base">{dp.totalMembersCount}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-sm font-bold text-gray-700" dir="ltr">{dp.phoneNumber}</p>
                      {dp.phoneSecondary && (
                        <p className="text-xs text-gray-500 font-bold mt-0.5" dir="ltr">{dp.phoneSecondary}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <p className="text-sm font-bold text-gray-700">{dp.unitNumber || '-'}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full font-black text-xs border-2 ${
                        dp.registrationStatus === 'قيد الانتظار' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        dp.registrationStatus === 'موافق' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {dp.registrationStatus === 'قيد الانتظار' ? 'قيد الانتظار' :
                         dp.registrationStatus === 'موافق' ? 'موافق' : 'مرفوض'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {dp.registrationStatus === 'قيد الانتظار' ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleApprove(dp)}
                            className="p-2 bg-emerald-100 text-emerald-700 border-2 border-emerald-200 rounded-lg font-bold text-xs hover:bg-emerald-200 transition-all"
                            title="قبول"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleReject(dp)}
                            className="p-2 bg-red-100 text-red-700 border-2 border-red-200 rounded-lg font-bold text-xs hover:bg-red-200 transition-all"
                            title="رفض"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleView(dp)}
                            className="p-2 bg-blue-100 text-blue-700 border-2 border-blue-200 rounded-lg font-bold text-xs hover:bg-blue-200 transition-all"
                            title="عرض"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleView(dp)}
                            className="p-2 bg-blue-100 text-blue-700 border-2 border-blue-200 rounded-lg font-bold text-xs hover:bg-blue-200 transition-all"
                            title="عرض"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleChangeStatus(dp)}
                            className="p-2 bg-amber-100 text-amber-700 border-2 border-amber-200 rounded-lg font-bold text-xs hover:bg-amber-200 transition-all"
                            title="تغيير الحالة"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          </button>
                        </div>
                      )}
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
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 md:p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs md:text-sm font-bold text-gray-600 text-center sm:text-right">
              عرض {startIndex + 1} إلى {Math.min(startIndex + itemsPerPage, filteredDPs.length)} من أصل {filteredDPs.length} عائلة
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 md:px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-xs md:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                السابق
              </button>
              <div className="flex items-center gap-1 md:gap-2">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 md:w-10 md:h-10 rounded-xl font-bold text-xs md:text-sm transition-all ${
                      currentPage === i + 1
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                        : 'border-2 border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 md:px-4 py-2 rounded-xl border-2 border-gray-200 font-bold text-xs md:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                التالي
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Field Permissions Modal */}
      {showBulkFieldPermissionsModal && (
        <BulkFieldPermissionsModal
          onClose={() => setShowBulkFieldPermissionsModal(false)}
        />
      )}
    </div>
  </div>
  );
};

export default DPManagement;
