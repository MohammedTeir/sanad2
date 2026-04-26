// views/admin/DPDetails.tsx - System Admin Family Details
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import FileUpload from '../../components/FileUpload';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import { GAZA_LOCATIONS, getAreasByGovernorate } from '../../constants/gazaLocations';
import type { FamilyMember } from '../../types';
import FieldPermissionsModal from '../camp-manager/FieldPermissionsModal';

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
  age: number; // Auto-calculated from dateOfBirth - READ ONLY
  maritalStatus: string;
  widowReason?: string;
  headRole?: 'أب' | 'أم' | 'زوجة';
  phoneNumber: string;
  phoneSecondary?: string;
  totalMembersCount: number; // Auto-calculated - READ ONLY
  campId?: string;
  unitNumber?: string;
  registrationStatus?: 'قيد الانتظار' | 'موافق' | 'مرفوض';
  vulnerabilityPriority?: 'عالي جداً' | 'عالي' | 'متوسط' | 'منخفض'; // Auto-calculated - READ ONLY
  vulnerabilityScore?: number; // Auto-calculated - READ ONLY
  vulnerabilityBreakdown?: { [key: string]: number }; // Auto-calculated - READ ONLY
  vulnerabilityReason?: string;
  disabilityType?: string;
  disabilitySeverity?: string;
  disabilityDetails?: string;
  chronicDiseaseType?: string;
  chronicDiseaseDetails?: string;
  warInjuryType?: string;
  warInjuryDetails?: string;
  medicalFollowupRequired?: boolean;
  medicalFollowupFrequency?: string;
  medicalFollowupDetails?: string;
  
  // Head of family work and income (from schema)
  isWorking?: boolean;
  job?: string;
  monthlyIncome?: number;
  monthlyIncomeRange?: string;
  
  wifeName?: string;
  wifeNationalId?: string;
  wifeDateOfBirth?: string;
  wifeAge?: number; // Auto-calculated - READ ONLY
  wifeIsPregnant?: boolean;
  wifePregnancyMonth?: number;
  // Pregnancy special needs (Migration 016)
  wifePregnancySpecialNeeds?: boolean;
  wifePregnancyFollowupDetails?: string;
  wifeIsWorking?: boolean;
  wifeOccupation?: string;
  wifeMedicalFollowupRequired?: boolean;
  wifeMedicalFollowupFrequency?: string;
  wifeMedicalFollowupDetails?: string;
  wifeDisabilityType?: string;
  wifeDisabilitySeverity?: string;
  wifeDisabilityDetails?: string;
  wifeChronicDiseaseType?: string;
  wifeChronicDiseaseDetails?: string;
  wifeWarInjuryType?: string;
  wifeWarInjuryDetails?: string;
  
  // Husband fields (for female-headed households - if applicable)
  husbandName?: string;
  husbandNationalId?: string;
  husbandDateOfBirth?: string;
  husbandAge?: number; // Auto-calculated - READ ONLY
  husbandIsWorking?: boolean;
  husbandOccupation?: string;
  husbandMedicalFollowupRequired?: boolean;
  husbandMedicalFollowupFrequency?: string;
  husbandMedicalFollowupDetails?: string;
  husbandDisabilityType?: string;
  husbandDisabilitySeverity?: string;
  husbandChronicDiseaseType?: string;
  husbandWarInjuryType?: string;
  
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
  currentHousingSharingStatus?: 'individual' | 'shared';
  currentHousingDetailedType?: string;
  currentHousingFurnished?: boolean;

  isResidentAbroad?: boolean;
  refugeeResidentAbroadCountry?: string;
  refugeeResidentAbroadCity?: string;
  refugeeResidentAbroadResidenceType?: string;

  // Auto-calculated counts - READ ONLY
  maleCount?: number;
  femaleCount?: number;
  childCount?: number;
  teenagerCount?: number;
  adultCount?: number;
  seniorCount?: number;
  disabledCount?: number;
  injuredCount?: number;
  pregnantWomenCount?: number;
  
  adminNotes?: string;
  nominationBody?: string;
  
  registeredDate?: string;
  lastUpdated?: string;
  members?: any[];
  aidHistory?: any[];
}

const MARITAL_STATUS = {
  'أعزب': { label: 'أعزب', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  'متزوج': { label: 'متزوج', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'مطلق': { label: 'مطلق', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'أرمل': { label: 'أرمل', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  'أسرة هشة': { label: 'أسرة هشة', color: 'bg-purple-50 text-purple-700 border-purple-200' }
};

// ⚠️  DISABLED: VULNERABILITY_LEVELS - Vulnerability score system disabled
// @deprecated Vulnerability score system is disabled
const VULNERABILITY_LEVELS = {
  'عالي جداً': { label: 'عالي جداً', color: 'bg-red-50 text-red-700 border-red-200' },
  'عالي': { label: 'عالي', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  'متوسط': { label: 'متوسط', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  'منخفض': { label: 'منخفض', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
};

const GENDER_LABELS = {
  'ذكر': 'ذكر',
  'أنثى': 'أنثى'
};

const HOUSING_TYPES = {
  'خيمة': 'خيمة',
  'بيت إسمنتي': 'بيت إسمنتي',
  'شقة': 'شقة',
  'أخرى': 'أخرى'
};

const RELATION_TRANSLATIONS: Record<string, string> = {
  'الأب': 'الأب',
  'الأم': 'الأم',
  'الزوجة': 'الزوجة',
  'الزوج': 'الزوج',
  'الابن': 'الابن',
  'البنت': 'البنت',
  'الأخ': 'الأخ',
  'الأخت': 'الأخت',
  'الجد': 'الجد',
  'الجدة': 'الجدة',
  'الحفيد': 'الحفيد',
  'الحفيدة': 'الحفيدة',
  'العم': 'العم',
  'العمة': 'العمة',
  'الخال': 'الخال',
  'الخالة': 'الخالة',
  'ابن الأخ': 'ابن الأخ',
  'ابنة الأخ': 'ابنة الأخ',
  'ابن العم': 'ابن العم',
  'أخرى': 'أخرى'
};

const translateRelation = (relation: string): string => {
  return RELATION_TRANSLATIONS[relation] || relation;
};

const DISABILITY_TYPES: Record<string, string> = {
  'لا يوجد': 'لا يوجد',
  'حركية': 'حركية',
  'بصرية': 'بصرية',
  'سمعية': 'سمعية',
  'ذهنية': 'ذهنية',
  'أخرى': 'أخرى'
};

const DISABILITY_SEVERITY: Record<string, string> = {
  'بسيطة': 'بسيطة',
  'متوسطة': 'متوسطة',
  'شديدة': 'شديدة',
  'كلية': 'كلية'
};

const CHRONIC_DISEASE_TYPES: Record<string, string> = {
  'لا يوجد': 'لا يوجد',
  'سكري': 'سكري',
  'ضغط دم': 'ضغط دم',
  'قلب': 'قلب',
  'سرطان': 'سرطان',
  'ربو': 'ربو',
  'فشل كلوي': 'فشل كلوي',
  'مرض نفسي': 'مرض نفسي',
  'أخرى': 'أخرى'
};

const WAR_INJURY_TYPES: Record<string, string> = {
  'لا يوجد': 'لا يوجد',
  'بتر': 'بتر',
  'كسر': 'كسر',
  'شظية': 'شظية',
  'حرق': 'حرق',
  'رأس/وجه': 'رأس/وجه',
  'عمود فقري': 'عمود فقري',
  'أخرى': 'أخرى'
};

const SANITARY_FACILITIES = {
  'نعم (دورة مياه خاصة)': 'نعم (دورة مياه خاصة)',
  'لا (مرافق مشتركة)': 'لا (مرافق مشتركة)'
};

const WATER_SOURCES = {
  'شبكة عامة': 'شبكة عامة',
  'صهاريج': 'صهاريج',
  'آبار': 'آبار',
  'آخر': 'آخر'
};

const ELECTRICITY_ACCESS = {
  'شبكة عامة': 'شبكة عامة',
  'مولد': 'مولد',
  'طاقة شمسية': 'طاقة شمسية',
  'لا يوجد': 'لا يوجد',
  'آخر': 'آخر'
};

const RESIDENCE_TYPES = {
  'لاجئ': 'لاجئ',
  'مقيم نظامي': 'مقيم نظامي',
  'أخرى': 'أخرى'
};

const HOUSING_DETAILED_TYPES: { [key: string]: string } = {
  'خيمة فردية': 'خيمة فردية',
  'خيمة مشتركة': 'خيمة مشتركة',
  'بيت كامل': 'بيت كامل',
  'منزل كامل': 'منزل كامل',
  'غرفة واحدة': 'غرفة واحدة',
  'أكثر من غرفة': 'أكثر من غرفة',
  'غرفة في بيت': 'غرفة في بيت',
  'شقة مفروشة': 'شقة مفروشة',
  'شقة غير مفروشة': 'شقة غير مفروشة',
  'كرفان / حاوية': 'كرفان / حاوية',
  'كارافان': 'كارافان',
  'أخرى': 'أخرى',
  // Backward compatibility with English values
  'tent_individual': 'خيمة فردية',
  'tent_shared': 'خيمة مشتركة',
  'house_full': 'بيت كامل',
  'house_room': 'غرفة في بيت',
  'apartment_furnished': 'شقة مفروشة',
  'apartment_unfurnished': 'شقة غير مفروشة',
  'caravan': 'كارافان',
  'other': 'أخرى'
};

const HOUSING_SHARING_STATUS: { [key: string]: string } = {
  'سكن فردي': 'سكن فردي',
  'سكن مشترك': 'سكن مشترك'
};

const INCOME_RANGES: { [key: string]: string } = {
  'بدون دخل': 'بدون دخل',
  'أقل من 100': 'أقل من 100',
  '100-300': '100-300',
  '300-500': '300-500',
  'أكثر من 500': 'أكثر من 500'
};

const WIDOW_REASONS: { [key: string]: string } = {
  'شهيد': 'شهيد',
  'وفاة طبيعية': 'وفاة طبيعية',
  'حادث': 'حادث',
  'مرض': 'مرض',
  'غير ذلك': 'غير ذلك'
};

const HEAD_ROLES: { [key: string]: string } = {
  'أب': 'أب (مسؤول عن جميع الأفراد والزوجة)',
  'أم': 'أم (معيلة للأطفال أو أرملة)',
  'زوجة': 'زوجة (في حال عجز الزوج أو تعدد الزوجات)'
};

const EDUCATION_STAGES: { [key: string]: string } = {
  'لا يدرس': 'لا يدرس',
  'ابتدائي': 'ابتدائي',
  'إعدادي/ثانوي': 'إعدادي/ثانوي',
  'جامعي': 'جامعي',
  'أخرى': 'أخرى'
};

const MEDICAL_FOLLOWUP_FREQUENCIES: { [key: string]: string } = {
  'يومي': 'يومي',
  'أسبوعي': 'أسبوعي',
  'شهري': 'شهري'
};

// Helper function to get full name from 4-part structure
const getFullName = (dp: DPProfile): string => {
  if (dp.headFirstName && dp.headFatherName && dp.headGrandfatherName && dp.headFamilyName) {
    return `${dp.headFirstName} ${dp.headFatherName} ${dp.headGrandfatherName} ${dp.headFamilyName}`;
  }
  return dp.headOfFamily;
};

// Helper functions to determine if head is female or male
const isFemaleHead = (headRole?: string, gender?: string) => {
  return headRole === 'أم' || headRole === 'زوجة' || gender === 'أنثى';
};

const isMaleHead = (headRole?: string, gender?: string) => {
  return headRole === 'أب' || gender === 'ذكر';
};

const DPDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [dp, setDp] = useState<DPProfile | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'basic' | 'family' | 'housing' | 'health' | 'spouse' | 'documents'>('basic');
  
  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editableData, setEditableData] = useState<DPProfile | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [editableFamilyMembers, setEditableFamilyMembers] = useState<FamilyMember[]>([]);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberIndex, setEditingMemberIndex] = useState<number | null>(null);
  const [tempMember, setTempMember] = useState<Partial<FamilyMember>>({});
  const [viewingMemberIndex, setViewingMemberIndex] = useState<number | null>(null);
  const [showViewMemberModal, setShowViewMemberModal] = useState(false);
  
  // Transfer and Override states
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [showFieldPermissionsModal, setShowFieldPermissionsModal] = useState(false);
  const [transferData, setTransferData] = useState({ targetCampId: '', reason: '', adminNotes: '' });
  const [overrideData, setOverrideData] = useState({ newStatus: 'قيد الانتظار' as 'قيد الانتظار' | 'موافق' | 'مرفوض', reason: '', adminNotes: '' });
  const [camps, setCamps] = useState<Array<{ id: string; name: string }>>([]);
  const [loadingCamps, setLoadingCamps] = useState(false);
  
  // Housing dropdown states - Original Address
  const [selectedOrigGovernorate, setSelectedOrigGovernorate] = useState<string>('');
  const [selectedOrigArea, setSelectedOrigArea] = useState<string>('');
  const [availableOrigAreas, setAvailableOrigAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);
  
  // Housing dropdown states - Current Housing
  const [selectedCurrentGovernorate, setSelectedCurrentGovernorate] = useState<string>('');
  const [selectedCurrentArea, setSelectedCurrentArea] = useState<string>('');
  const [availableCurrentAreas, setAvailableCurrentAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);

    if (id) {
      loadDP();
      loadFamilyMembers();
    }
  }, [id]);

  // Update available areas when original governorate changes
  useEffect(() => {
    if (editableData?.originalAddressGovernorate) {
      const areas = getAreasByGovernorate(editableData.originalAddressGovernorate);
      setAvailableOrigAreas(areas);
      setSelectedOrigArea(''); // Reset area when governorate changes
    }
  }, [editableData?.originalAddressGovernorate]);

  // Update available areas when current housing governorate changes
  useEffect(() => {
    if (editableData?.currentHousingGovernorate) {
      const areas = getAreasByGovernorate(editableData.currentHousingGovernorate);
      setAvailableCurrentAreas(areas);
      setSelectedCurrentArea(''); // Reset area when governorate changes
    }
  }, [editableData?.currentHousingGovernorate]);

  // Keyboard shortcuts for edit mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S or Cmd+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (isEditMode && !isSaving) {
          handleSave();
        }
      }
      // Escape to cancel
      if (e.key === 'Escape') {
        if (showMemberModal) {
          setShowMemberModal(false);
        } else if (isEditMode && hasUnsavedChanges) {
          handleCancel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditMode, isSaving, hasUnsavedChanges, showMemberModal]);

  const loadDP = async () => {
    try {
      setLoading(true);
      console.log('[DPDetails] Loading DP:', id);

      // Try dedicated getDPById method first
      let foundDP = await realDataService.getDPById(id);

      // Fallback: if getDPById returns null, try fetching from getAllDPs list
      if (!foundDP) {
        console.log('[DPDetails] getDPById returned null, trying fallback method...');
        const allDps = await realDataService.getAllDPs();
        foundDP = allDps.find(d => d.id === id);
        if (foundDP) {
          console.log('[DPDetails] DP found via fallback method:', foundDP.headOfFamily);
        }
      }

      if (foundDP) {
        console.log('[DPDetails] DP loaded successfully:', foundDP.headOfFamily);
        console.log('[DPDetails] Husband data:', {
          husbandName: foundDP.husbandName,
          husbandNationalId: foundDP.husbandNationalId,
          husbandDateOfBirth: foundDP.husbandDateOfBirth,
          headRole: foundDP.headRole,
          gender: foundDP.gender
        });
        setDp(foundDP);
      } else {
        console.error('[DPDetails] DP not found with ID:', id);
        setToast({ message: 'العائلة غير موجودة', type: 'error' });
      }
    } catch (err: any) {
      console.error('[DPDetails] Error loading DP:', err);
      setToast({ message: err.message || 'فشل تحميل بيانات العائلة', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      console.log('[DPDetails] Loading family members for:', id);
      const members = await makeAuthenticatedRequest(`/individuals?familyId=${id}`);
      console.log('[DPDetails] Family members loaded:', Array.isArray(members) ? members.length : 0);
      
      // Transform snake_case to camelCase
      const transformedMembers: FamilyMember[] = Array.isArray(members) ? members.map((member: any) => ({
        id: member.id,
        firstName: member.first_name || '',
        fatherName: member.father_name || '',
        grandfatherName: member.grandfather_name || '',
        familyName: member.family_name || '',
        name: member.name || '',
        nationalId: member.national_id || '',
        gender: member.gender || 'ذكر',
        dateOfBirth: member.date_of_birth || '',
        age: member.age || 0,
        relation: member.relation || 'الابن',
        isStudying: member.is_studying || false,
        isWorking: member.is_working || false,
        educationStage: member.education_stage || 'لا يدرس',
        educationLevel: member.education_level || 'لا يدرس',
        occupation: member.occupation || '',
        phoneNumber: member.phone_number || '',
        maritalStatus: member.marital_status || 'أعزب/عزباء',
        disabilityType: member.disability_type || 'لا يوجد',
        disabilitySeverity: member.disability_severity,
        disabilityDetails: member.disability_details,
        chronicDiseaseType: member.chronic_disease_type || 'لا يوجد',
        chronicDiseaseDetails: member.chronic_disease_details,
        hasWarInjury: member.has_war_injury || false,
        warInjuryType: member.war_injury_type || 'لا يوجد',
        warInjuryDetails: member.war_injury_details,
        medicalFollowupRequired: member.medical_followup_required || false,
        medicalFollowupFrequency: member.medical_followup_frequency,
        medicalFollowupDetails: member.medical_followup_details,
        isDeleted: member.is_deleted || false,
        deletedAt: member.deleted_at
      })) : [];
      
      setFamilyMembers(transformedMembers);
    } catch (err: any) {
      console.error('[DPDetails] Error loading family members:', err);
      // Don't show error toast for family members, just log it
      setFamilyMembers([]);
    }
  };

  const loadCamps = async () => {
    try {
      setLoadingCamps(true);
      const loadedCamps = await realDataService.getCamps();
      setCamps(loadedCamps);
    } catch (err: any) {
      console.error('Error loading camps:', err);
    } finally {
      setLoadingCamps(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferData.targetCampId || !id) return;
    
    setIsSaving(true);
    try {
      await realDataService.transferFamily(id, transferData.targetCampId, transferData.reason, transferData.adminNotes);
      setToast({ message: 'تم نقل العائلة بنجاح', type: 'success' });
      setShowTransferModal(false);
      setTransferData({ targetCampId: '', reason: '', adminNotes: '' });
      loadDP();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل نقل العائلة', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverride = async () => {
    if (!overrideData.newStatus || !id) return;
    
    setIsSaving(true);
    try {
      await realDataService.overrideFamilyDecision(id, overrideData.newStatus, overrideData.reason, overrideData.adminNotes);
      setToast({ message: 'تم تغيير حالة العائلة بنجاح', type: 'success' });
      setShowOverrideModal(false);
      setOverrideData({ newStatus: 'قيد الانتظار', reason: '', adminNotes: '' });
      loadDP();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل تغيير حالة العائلة', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Check if user can edit
  const canEdit = () => {
    const currentUser = sessionService.getCurrentUser();
    return currentUser?.role === 'SYSTEM_ADMIN';
  };

  // Clean wife data - clear fields that are inconsistent with checkboxes
  const cleanWifeData = (data: DPProfile): DPProfile => {
    const cleaned = { ...data };
    
    // If wife doesn't exist (no name), clear all wife fields
    if (!cleaned.wifeName || cleaned.wifeName.trim() === '') {
      cleaned.wifeIsPregnant = false;
      cleaned.wifePregnancyMonth = 0;
      cleaned.wifePregnancySpecialNeeds = false;
      cleaned.wifePregnancyFollowupDetails = '';
      cleaned.wifeIsWorking = false;
      cleaned.wifeOccupation = '';
      cleaned.wifeDisabilityType = 'لا يوجد';
      cleaned.wifeDisabilitySeverity = null; // Set to null for CHECK constraint
      cleaned.wifeDisabilityDetails = '';
      cleaned.wifeChronicDiseaseType = 'لا يوجد';
      cleaned.wifeChronicDiseaseDetails = '';
      cleaned.wifeWarInjuryType = 'لا يوجد';
      cleaned.wifeWarInjuryDetails = '';
      cleaned.wifeMedicalFollowupRequired = false;
      cleaned.wifeMedicalFollowupFrequency = '';
      cleaned.wifeMedicalFollowupDetails = '';
    } else {
      // Clear pregnancy fields if not pregnant
      if (!cleaned.wifeIsPregnant) {
        cleaned.wifePregnancyMonth = 0;
        cleaned.wifePregnancySpecialNeeds = false;
        cleaned.wifePregnancyFollowupDetails = '';
      }
      // Clear work fields if not working
      if (cleaned.wifeIsWorking === false || cleaned.wifeIsWorking === null) {
        cleaned.wifeOccupation = '';
      }
      // Normalize and clear disability fields if no disability
      const wifeDisabilityType = cleaned.wifeDisabilityType?.trim() || '';
      if (wifeDisabilityType === 'لا يوجد' || wifeDisabilityType === 'لا توجد إعاقة') {
        cleaned.wifeDisabilityType = 'لا يوجد'; // Normalize
        cleaned.wifeDisabilitySeverity = null; // Set to null for CHECK constraint
        cleaned.wifeDisabilityDetails = '';
      }
      // Clear chronic disease fields if no chronic disease
      const wifeChronicType = cleaned.wifeChronicDiseaseType?.trim() || '';
      if (wifeChronicType === 'لا يوجد' || wifeChronicType === 'لا يوجد مرض') {
        cleaned.wifeChronicDiseaseType = 'لا يوجد'; // Normalize
        cleaned.wifeChronicDiseaseDetails = '';
      }
      // Clear war injury fields if no war injury
      const wifeWarInjuryType = cleaned.wifeWarInjuryType?.trim() || '';
      if (wifeWarInjuryType === 'لا يوجد' || wifeWarInjuryType === 'لا توجد إصابة') {
        cleaned.wifeWarInjuryType = 'لا يوجد'; // Normalize
        cleaned.wifeWarInjuryDetails = '';
      }
      // Clear medical followup fields if not required
      if (!cleaned.wifeMedicalFollowupRequired) {
        cleaned.wifeMedicalFollowupFrequency = '';
        cleaned.wifeMedicalFollowupDetails = '';
      }
    }
    
    return cleaned;
  };

  // Clean husband data - clear fields that are inconsistent with checkboxes
  const cleanHusbandData = (data: DPProfile): DPProfile => {
    const cleaned = { ...data };

    // If husband doesn't exist (no name), clear all husband fields
    if (!cleaned.husbandName || cleaned.husbandName.trim() === '') {
      cleaned.husbandIsWorking = false;
      cleaned.husbandOccupation = '';
      cleaned.husbandDisabilityType = 'لا يوجد';
      cleaned.husbandDisabilitySeverity = null; // Set to null for CHECK constraint
      cleaned.husbandDisabilityDetails = '';
      cleaned.husbandChronicDiseaseType = 'لا يوجد';
      cleaned.husbandChronicDiseaseDetails = '';
      cleaned.husbandWarInjuryType = 'لا يوجد';
      cleaned.husbandWarInjuryDetails = '';
      cleaned.husbandMedicalFollowupRequired = false;
      cleaned.husbandMedicalFollowupFrequency = '';
      cleaned.husbandMedicalFollowupDetails = '';
    } else {
      // Clear work fields if not working
      if (cleaned.husbandIsWorking === false || cleaned.husbandIsWorking === null) {
        cleaned.husbandOccupation = '';
      }
      // Normalize and clear disability fields if no disability
      const husbandDisabilityType = cleaned.husbandDisabilityType?.trim() || '';
      if (husbandDisabilityType === 'لا يوجد' || husbandDisabilityType === 'لا توجد إعاقة') {
        cleaned.husbandDisabilityType = 'لا يوجد'; // Normalize
        cleaned.husbandDisabilitySeverity = null; // Set to null for CHECK constraint
        cleaned.husbandDisabilityDetails = '';
      }
      // Clear chronic disease fields if no chronic disease
      const husbandChronicType = cleaned.husbandChronicDiseaseType?.trim() || '';
      if (husbandChronicType === 'لا يوجد' || husbandChronicType === 'لا يوجد مرض') {
        cleaned.husbandChronicDiseaseType = 'لا يوجد'; // Normalize
        cleaned.husbandChronicDiseaseDetails = '';
      }
      // Clear war injury fields if no war injury
      const husbandWarInjuryType = cleaned.husbandWarInjuryType?.trim() || '';
      if (husbandWarInjuryType === 'لا يوجد' || husbandWarInjuryType === 'لا توجد إصابة') {
        cleaned.husbandWarInjuryType = 'لا يوجد'; // Normalize
        cleaned.husbandWarInjuryDetails = '';
      }
      // Clear medical followup fields if not required
      if (!cleaned.husbandMedicalFollowupRequired) {
        cleaned.husbandMedicalFollowupFrequency = '';
        cleaned.husbandMedicalFollowupDetails = '';
      }
    }

    return cleaned;
  };

  // Clean head of family health data
  const cleanHealthData = (data: DPProfile): DPProfile => {
    const cleaned = { ...data };

    // Normalize disability type variations and clear fields if no disability
    const disabilityType = cleaned.disabilityType?.trim() || '';
    if (disabilityType === 'لا يوجد' || disabilityType === 'لا توجد إعاقة') {
      cleaned.disabilityType = 'لا يوجد'; // Normalize to standard value
      cleaned.disabilitySeverity = null; // Set to null for CHECK constraint
      cleaned.disabilityDetails = '';
    }
    // Clear chronic disease fields if no chronic disease
    const chronicType = cleaned.chronicDiseaseType?.trim() || '';
    if (chronicType === 'لا يوجد' || chronicType === 'لا يوجد مرض') {
      cleaned.chronicDiseaseType = 'لا يوجد'; // Normalize
      cleaned.chronicDiseaseDetails = '';
    }
    // Clear war injury fields if no war injury
    const warInjuryType = cleaned.warInjuryType?.trim() || '';
    if (warInjuryType === 'لا يوجد' || warInjuryType === 'لا توجد إصابة') {
      cleaned.warInjuryType = 'لا يوجد'; // Normalize
      cleaned.warInjuryDetails = '';
    }
    // Clear medical followup fields if not required
    if (!cleaned.medicalFollowupRequired) {
      cleaned.medicalFollowupFrequency = '';
      cleaned.medicalFollowupDetails = '';
    }
    // Clear work fields if not working
    if (cleaned.isWorking === false || cleaned.isWorking === null) {
      cleaned.job = '';
      cleaned.monthlyIncome = 0;
      cleaned.monthlyIncomeRange = null;
    }

    return cleaned;
  };

  // Clean individual family member data
  const cleanIndividualData = (member: FamilyMember): FamilyMember => {
    const cleaned = { ...member };

    // Normalize and clear disability fields if no disability
    const disabilityType = cleaned.disabilityType?.trim() || '';
    if (disabilityType === 'لا يوجد' || disabilityType === 'لا توجد إعاقة') {
      cleaned.disabilityType = 'لا يوجد' as any; // Normalize
      cleaned.disabilitySeverity = undefined;
      cleaned.disabilityDetails = undefined;
    }

    // Clear chronic disease fields if no chronic disease
    const chronicType = cleaned.chronicDiseaseType?.trim() || '';
    if (chronicType === 'لا يوجد' || chronicType === 'لا يوجد مرض') {
      cleaned.chronicDiseaseType = 'لا يوجد' as any; // Normalize
      cleaned.chronicDiseaseDetails = undefined;
    }

    // Clear war injury fields if no war injury
    if (!cleaned.hasWarInjury || cleaned.warInjuryType === 'لا يوجد') {
      cleaned.hasWarInjury = false;
      cleaned.warInjuryType = 'لا يوجد' as any; // Normalize
      cleaned.warInjuryDetails = undefined;
    }

    // Clear medical followup fields if not required
    if (!cleaned.medicalFollowupRequired) {
      cleaned.medicalFollowupFrequency = undefined;
      cleaned.medicalFollowupDetails = undefined;
    }

    // Clear education fields if not studying
    if (cleaned.isStudying === false || cleaned.isStudying === null) {
      cleaned.educationStage = undefined;
      cleaned.educationLevel = undefined;
    }

    // Clear work fields if not working
    if (cleaned.isWorking === false || cleaned.isWorking === null) {
      cleaned.occupation = undefined;
    }

    return cleaned;
  };

  // Enter edit mode
  const enterEditMode = () => {
    if (dp) {
      // Clean inconsistent data before editing
      let cleanedData = cleanHealthData(dp);
      cleanedData = cleanWifeData(cleanedData);
      cleanedData = cleanHusbandData(cleanedData);

      setEditableData(cleanedData);
      setEditableFamilyMembers([...familyMembers]);
      setValidationErrors({});
      setIsEditMode(true);
      setHasUnsavedChanges(false);
    }
  };

  // Exit edit mode
  const exitEditMode = () => {
    setIsEditMode(false);
    setEditableData(null);
    setEditableFamilyMembers([]);
    setValidationErrors({});
    setHasUnsavedChanges(false);
    setShowCancelConfirm(false);
  };

  // Handle field change
  const handleFieldChange = (field: string, value: any) => {
    if (editableData) {
      let newData = {
        ...editableData,
        [field]: value
      };
      
      // Clear related fields when setting to "لا يوجد"
      if (field === 'disabilityType' && value === 'لا يوجد') {
        newData.disabilitySeverity = '';
        newData.disabilityDetails = '';
      } else if (field === 'chronicDiseaseType' && value === 'لا يوجد') {
        newData.chronicDiseaseDetails = '';
      } else if (field === 'warInjuryType' && value === 'لا يوجد') {
        newData.warInjuryDetails = '';
      }
      // Wife's health fields
      else if (field === 'wifeDisabilityType' && value === 'لا يوجد') {
        newData.wifeDisabilitySeverity = '';
        newData.wifeDisabilityDetails = '';
      } else if (field === 'wifeChronicDiseaseType' && value === 'لا يوجد') {
        newData.wifeChronicDiseaseDetails = '';
      } else if (field === 'wifeWarInjuryType' && value === 'لا يوجد') {
        newData.wifeWarInjuryDetails = '';
      }
      // Clear pregnancy fields when unchecked
      else if (field === 'wifeIsPregnant' && value === false) {
        newData.wifePregnancyMonth = 0;
        newData.wifePregnancySpecialNeeds = false;
        newData.wifePregnancyFollowupDetails = '';
      }
      // Clear work fields when unchecked
      else if (field === 'wifeIsWorking' && value === false) {
        newData.wifeOccupation = '';
      }
      else if (field === 'isWorking' && value === false) {
        newData.job = '';
        newData.monthlyIncome = 0;
        newData.monthlyIncomeRange = null; // Set to null instead of empty string (DB constraint)
      }
      // Clear medical followup fields when unchecked
      else if (field === 'medicalFollowupRequired' && value === false) {
        newData.medicalFollowupFrequency = '';
        newData.medicalFollowupDetails = '';
      }
      else if (field === 'wifeMedicalFollowupRequired' && value === false) {
        newData.wifeMedicalFollowupFrequency = '';
        newData.wifeMedicalFollowupDetails = '';
      }
      
      setEditableData(newData);
      setHasUnsavedChanges(true);
      // Clear validation error for this field
      if (validationErrors[field]) {
        setValidationErrors({
          ...validationErrors,
          [field]: ''
        });
      }

      // Sync governorate values with dropdown states
      if (field === 'originalAddressGovernorate') {
        setSelectedOrigGovernorate(value);
        setSelectedOrigArea('');
      } else if (field === 'currentHousingGovernorate') {
        setSelectedCurrentGovernorate(value);
        setSelectedCurrentArea('');
      } else if (field === 'originalAddressRegion') {
        setSelectedOrigArea(value);
      } else if (field === 'currentHousingRegion') {
        setSelectedCurrentArea(value);
      }
    }
  };

  // Handle nested field change (for objects like currentHousing, originalAddress)
  const handleNestedFieldChange = (parentField: string, field: string, value: any) => {
    if (editableData) {
      setEditableData({
        ...editableData,
        [parentField]: {
          ...(editableData[parentField as keyof DPProfile] as any),
          [field]: value
        }
      });
      setHasUnsavedChanges(true);
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!editableData) return false;

    // Required fields
    if (!editableData.headFirstName?.trim()) errors.headFirstName = 'الاسم الأول مطلوب';
    if (!editableData.headFatherName?.trim()) errors.headFatherName = 'اسم الأب مطلوب';
    if (!editableData.headGrandfatherName?.trim()) errors.headGrandfatherName = 'اسم الجد مطلوب';
    if (!editableData.headFamilyName?.trim()) errors.headFamilyName = 'اسم العائلة مطلوب';
    if (!editableData.nationalId?.trim()) errors.nationalId = 'رقم الهوية مطلوب';
    if (!editableData.gender) errors.gender = 'الجنس مطلوب';
    if (!editableData.dateOfBirth) errors.dateOfBirth = 'تاريخ الميلاد مطلوب';
    if (!editableData.maritalStatus) errors.maritalStatus = 'الحالة الاجتماعية مطلوبة';
    if (!editableData.phoneNumber?.trim()) errors.phoneNumber = 'رقم الهاتف مطلوب';

    // National ID format validation (should be numeric)
    if (editableData.nationalId && !/^\d+$/.test(editableData.nationalId)) {
      errors.nationalId = 'رقم الهوية يجب أن يحتوي على أرقام فقط';
    }

    // Phone number validation
    if (editableData.phoneNumber && !/^[\d+\-\s()]+$/.test(editableData.phoneNumber)) {
      errors.phoneNumber = 'رقم الهاتف غير صحيح';
    }

    // Date validation (not in future)
    if (editableData.dateOfBirth && new Date(editableData.dateOfBirth) > new Date()) {
      errors.dateOfBirth = 'تاريخ الميلاد لا يمكن أن يكون في المستقبل';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Helper function to trim Arabic strings and normalize values
  // Converts empty strings to null to prevent CHECK constraint violations
  const trimArabicString = (value: string | null | undefined): string | null => {
    if (value === null || value === undefined || value.trim() === '') return null;
    // Trim whitespace and normalize Arabic characters
    return value.trim().replace(/\s+/g, ' ');
  };

  // Handle save
  const handleSave = async () => {
    if (!validateForm() || !editableData) return;

    setIsSaving(true);
    try {
      // Clean health data to ensure disability/chronic/war injury fields are properly cleared
      // when "لا يوجد" is selected (handles timing issues with state updates)
      let cleanedData = cleanHealthData(editableData);
      cleanedData = cleanWifeData(cleanedData);
      cleanedData = cleanHusbandData(cleanedData);

      console.log('[DPDetails] Saving changes...', cleanedData);

      // Prepare update data with snake_case field names matching database schema
      // EXCLUDING auto-calculated fields (updated by database triggers)
      // All string values are trimmed to prevent CHECK constraint violations
      const updateData: any = {
        // Head of family 4-part name
        head_first_name: trimArabicString(cleanedData.headFirstName),
        head_father_name: trimArabicString(cleanedData.headFatherName),
        head_grandfather_name: trimArabicString(cleanedData.headGrandfatherName),
        head_family_name: trimArabicString(cleanedData.headFamilyName),
        head_of_family_national_id: cleanedData.nationalId?.trim(),
        head_of_family_gender: cleanedData.gender,
        head_of_family_date_of_birth: cleanedData.dateOfBirth,
        // Calculate age from date of birth (frontend calculation for reliability)
        head_of_family_age: cleanedData.dateOfBirth ? calculateAge(cleanedData.dateOfBirth) : 0,
        head_of_family_marital_status: trimArabicString(cleanedData.maritalStatus),
        head_of_family_widow_reason: trimArabicString(cleanedData.widowReason),
        head_of_family_role: trimArabicString(cleanedData.headRole),
        head_of_family_phone_number: cleanedData.phoneNumber?.trim(),
        head_of_family_phone_secondary: cleanedData.phoneSecondary?.trim(),
        head_of_family_disability_type: trimArabicString(cleanedData.disabilityType),
        head_of_family_disability_severity: trimArabicString(cleanedData.disabilitySeverity),
        head_of_family_disability_details: trimArabicString(cleanedData.disabilityDetails),
        head_of_family_chronic_disease_type: trimArabicString(cleanedData.chronicDiseaseType),
        head_of_family_chronic_disease_details: trimArabicString(cleanedData.chronicDiseaseDetails),
        head_of_family_war_injury_type: trimArabicString(cleanedData.warInjuryType),
        head_of_family_war_injury_details: trimArabicString(cleanedData.warInjuryDetails),
        head_of_family_medical_followup_required: cleanedData.medicalFollowupRequired,
        head_of_family_medical_followup_frequency: trimArabicString(cleanedData.medicalFollowupFrequency),
        head_of_family_medical_followup_details: trimArabicString(cleanedData.medicalFollowupDetails),
        head_of_family_is_working: cleanedData.isWorking,
        head_of_family_job: trimArabicString(cleanedData.job),
        head_of_family_monthly_income: cleanedData.monthlyIncome,
        head_of_family_monthly_income_range: cleanedData.monthlyIncomeRange ? trimArabicString(cleanedData.monthlyIncomeRange) : null,

        // Wife information
        wife_name: trimArabicString(cleanedData.wifeName),
        wife_national_id: cleanedData.wifeNationalId?.trim(),
        wife_date_of_birth: cleanedData.wifeDateOfBirth,
        // Note: wife_age is NOT a database column - it's calculated dynamically in triggers
        wife_is_pregnant: cleanedData.wifeIsPregnant,
        wife_pregnancy_month: cleanedData.wifePregnancyMonth,
        wife_pregnancy_special_needs: cleanedData.wifePregnancySpecialNeeds,
        wife_pregnancy_followup_details: trimArabicString(cleanedData.wifePregnancyFollowupDetails),
        wife_is_working: cleanedData.wifeIsWorking,
        wife_occupation: trimArabicString(cleanedData.wifeOccupation),
        wife_medical_followup_required: cleanedData.wifeMedicalFollowupRequired,
        wife_medical_followup_frequency: trimArabicString(cleanedData.wifeMedicalFollowupFrequency),
        wife_medical_followup_details: trimArabicString(cleanedData.wifeMedicalFollowupDetails),
        wife_disability_type: trimArabicString(cleanedData.wifeDisabilityType),
        wife_disability_severity: trimArabicString(cleanedData.wifeDisabilitySeverity),
        wife_disability_details: trimArabicString(cleanedData.wifeDisabilityDetails),
        wife_chronic_disease_type: trimArabicString(cleanedData.wifeChronicDiseaseType),
        wife_chronic_disease_details: trimArabicString(cleanedData.wifeChronicDiseaseDetails),
        wife_war_injury_type: trimArabicString(cleanedData.wifeWarInjuryType),
        wife_war_injury_details: trimArabicString(cleanedData.wifeWarInjuryDetails),

        // Husband information (for female-headed households)
        husband_name: trimArabicString(cleanedData.husbandName),
        husband_national_id: cleanedData.husbandNationalId?.trim(),
        husband_date_of_birth: cleanedData.husbandDateOfBirth,
        husband_is_working: cleanedData.husbandIsWorking,
        husband_occupation: trimArabicString(cleanedData.husbandOccupation),
        husband_medical_followup_required: cleanedData.husbandMedicalFollowupRequired,
        husband_medical_followup_frequency: trimArabicString(cleanedData.husbandMedicalFollowupFrequency),
        husband_medical_followup_details: trimArabicString(cleanedData.husbandMedicalFollowupDetails),
        husband_disability_type: trimArabicString(cleanedData.husbandDisabilityType),
        husband_disability_severity: trimArabicString(cleanedData.husbandDisabilitySeverity),
        husband_disability_details: trimArabicString(cleanedData.husbandDisabilityDetails),
        husband_chronic_disease_type: trimArabicString(cleanedData.husbandChronicDiseaseType),
        husband_chronic_disease_details: trimArabicString(cleanedData.husbandChronicDiseaseDetails),
        husband_war_injury_type: trimArabicString(cleanedData.husbandWarInjuryType),
        husband_war_injury_details: trimArabicString(cleanedData.husbandWarInjuryDetails),

        // Family counts - AUTO-CALCULATED BY TRIGGERS - EXCLUDED
        // total_members_count, male_count, female_count, child_count, etc.

        // Original housing
        original_address_governorate: trimArabicString(editableData.originalAddressGovernorate),
        original_address_region: trimArabicString(editableData.originalAddressRegion),
        original_address_details: trimArabicString(editableData.originalAddressDetails),
        original_address_housing_type: trimArabicString(editableData.originalAddressHousingType),

        // Current housing
        current_housing_type: trimArabicString(editableData.currentHousingType),
        current_housing_sharing_status: trimArabicString(editableData.currentHousingSharingStatus),
        current_housing_detailed_type: trimArabicString(editableData.currentHousingDetailedType),
        current_housing_furnished: editableData.currentHousingFurnished,
        current_housing_unit_number: editableData.unitNumber?.trim(),
        current_housing_is_suitable_for_family_size: editableData.currentHousingIsSuitable,
        current_housing_sanitary_facilities: trimArabicString(editableData.currentHousingSanitaryFacilities),
        current_housing_water_source: trimArabicString(editableData.currentHousingWaterSource),
        current_housing_electricity_access: trimArabicString(editableData.currentHousingElectricityAccess),
        current_housing_governorate: trimArabicString(editableData.currentHousingGovernorate),
        current_housing_region: trimArabicString(editableData.currentHousingRegion),
        current_housing_landmark: trimArabicString(editableData.currentHousingLandmark),

        // Refugee/resident abroad
        is_resident_abroad: editableData.isResidentAbroad ?? false,
        refugee_resident_abroad_country: trimArabicString(editableData.refugeeResidentAbroadCountry),
        refugee_resident_abroad_city: trimArabicString(editableData.refugeeResidentAbroadCity),
        refugee_resident_abroad_residence_type: trimArabicString(editableData.refugeeResidentAbroadResidenceType),

        // Vulnerability - AUTO-CALCULATED BY TRIGGERS - EXCLUDED
        // vulnerability_score, vulnerability_priority
        vulnerability_reason: trimArabicString(editableData.vulnerabilityReason),

        // Admin fields
        admin_notes: trimArabicString(editableData.adminNotes),
        nomination_body: trimArabicString(editableData.nominationBody),

        // Document URLs
        id_card_url: editableData.idCardUrl,
        medical_report_url: editableData.medicalReportUrl,
        signature_url: editableData.signatureUrl
      };

      // Remove undefined/null fields to avoid overwriting with null
      // BUT keep empty strings for disability/chronic/war injury fields and boolean false for checkboxes
      const healthFields = [
        // Head of family - disability/chronic/war injury
        'head_of_family_disability_type', 'head_of_family_disability_severity', 'head_of_family_disability_details',
        'head_of_family_chronic_disease_type', 'head_of_family_chronic_disease_details',
        'head_of_family_war_injury_type', 'head_of_family_war_injury_details',
        'head_of_family_medical_followup_frequency', 'head_of_family_medical_followup_details',
        // Head of family - work fields
        'head_of_family_job',
        // Head of family - checkboxes
        'head_of_family_medical_followup_required', 'head_of_family_is_working',
        // Wife - disability/chronic/war injury
        'wife_disability_type', 'wife_disability_severity', 'wife_disability_details',
        'wife_chronic_disease_type', 'wife_chronic_disease_details',
        'wife_war_injury_type', 'wife_war_injury_details',
        'wife_medical_followup_frequency', 'wife_medical_followup_details',
        // Wife - work fields
        'wife_occupation',
        // Wife - checkboxes
        'wife_is_pregnant', 'wife_pregnancy_special_needs', 'wife_is_working', 'wife_medical_followup_required',
        // Husband - disability/chronic/war injury
        'husband_disability_type', 'husband_disability_severity', 'husband_disability_details',
        'husband_chronic_disease_type', 'husband_chronic_disease_details',
        'husband_war_injury_type', 'husband_war_injury_details',
        'husband_medical_followup_frequency', 'husband_medical_followup_details',
        // Husband - work fields
        'husband_occupation',
        // Husband - checkboxes
        'husband_is_working', 'husband_medical_followup_required'
      ];

      // Fields that must keep null value (not convert to empty string)
      // These fields have CHECK constraints that require NULL instead of empty string
      const nullFields = [
        // Income range
        'head_of_family_monthly_income_range',
        // Disability severity (enum values: 'بسيطة', 'متوسطة', 'شديدة', 'كلية')
        'head_of_family_disability_severity',
        'wife_disability_severity',
        'husband_disability_severity'
      ];

      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined || updateData[key] === null) {
          // Keep health-related fields but convert null to empty string for proper DB update
          if (healthFields.includes(key) || nullFields.includes(key)) {
            // Convert null/undefined to empty string for string fields to ensure DB is updated
            // Boolean fields (like is_working, is_pregnant, etc.) should keep their false value
            const booleanFields = [
              'head_of_family_medical_followup_required', 'head_of_family_is_working',
              'wife_is_pregnant', 'wife_pregnancy_special_needs', 'wife_is_working', 'wife_medical_followup_required',
              'husband_is_working', 'husband_medical_followup_required'
            ];
            if (nullFields.includes(key)) {
              updateData[key] = null; // Keep as null for CHECK constraint fields
            } else if (!booleanFields.includes(key)) {
              updateData[key] = ''; // Convert null to empty string for health string fields
            }
          } else {
            delete updateData[key];
          }
        }
      });

      console.log('[DPDetails] Update data (final):', updateData);
      console.log('[DPDetails] Head disability fields being sent:', {
        disability_type: updateData.head_of_family_disability_type,
        disability_severity: updateData.head_of_family_disability_severity,
        disability_details: updateData.head_of_family_disability_details
      });
      console.log('[DPDetails] Wife disability fields being sent:', {
        disability_type: updateData.wife_disability_type,
        disability_severity: updateData.wife_disability_severity,
        disability_details: updateData.wife_disability_details
      });
      console.log('[DPDetails] Head work fields being sent:', {
        is_working: updateData.head_of_family_is_working,
        job: updateData.head_of_family_job,
        monthly_income: updateData.head_of_family_monthly_income,
        monthly_income_range: updateData.head_of_family_monthly_income_range
      });
      console.log('[DPDetails] Wife work fields being sent:', {
        is_working: updateData.wife_is_working,
        occupation: updateData.wife_occupation
      });

      // Update family profile
      await realDataService.updateDP(id!, updateData);

      setToast({ message: 'تم حفظ التغييرات بنجاح', type: 'success' });
      exitEditMode();
      loadDP(); // Reload the data
    } catch (err: any) {
      console.error('[DPDetails] Error saving changes:', err);
      setToast({ message: err.message || 'فشل حفظ التغييرات', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (hasUnsavedChanges) {
      setShowCancelConfirm(true);
    } else {
      exitEditMode();
    }
  };

  const confirmCancel = () => {
    exitEditMode();
    setToast({ message: 'تم إلغاء التغييرات', type: 'info' });
  };

  // Helper function to calculate age from date of birth
  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Family member management
  const openAddMemberModal = () => {
    setTempMember({
      id: `temp_${Date.now()}`,
      firstName: '',
      fatherName: '',
      grandfatherName: '',
      familyName: '',
      name: '',
      nationalId: '',
      gender: 'ذكر',
      dateOfBirth: '',
      age: 0,
      relation: 'الابن',
      disabilityType: 'لا يوجد',
      chronicDiseaseType: 'لا يوجد',
      hasWarInjury: false,
      warInjuryType: 'لا يوجد',
      medicalFollowupRequired: false,
      maritalStatus: 'أعزب/عزباء',
      isDeleted: false
    });
    setEditingMemberIndex(null);
    setShowMemberModal(true);
  };

  const openEditMemberModal = (index: number) => {
    setTempMember({ ...editableFamilyMembers[index] });
    setEditingMemberIndex(index);
    setShowMemberModal(true);
  };

  const openViewMemberModal = (index: number) => {
    setViewingMemberIndex(index);
    setShowViewMemberModal(true);
  };

  const saveMember = async () => {
    // Validation
    if (!tempMember.firstName || !tempMember.fatherName || !tempMember.familyName ||
        !tempMember.gender || !tempMember.dateOfBirth || !tempMember.relation) {
      setToast({ message: 'يرجى ملء جميع الحقول المطلوبة', type: 'error' });
      return;
    }

    if (!tempMember.nationalId) {
      setToast({ message: 'رقم الهوية مطلوب', type: 'error' });
      return;
    }

    // Validate national ID format (8-9 digits)
    const nationalIdRegex = /^\d{8,9}$/;
    if (!nationalIdRegex.test(tempMember.nationalId)) {
      setToast({ message: 'رقم الهوية يجب أن يتكون من 8-9 أرقام', type: 'error' });
      return;
    }

    // Calculate age from date of birth
    const calculatedAge = calculateAge(tempMember.dateOfBirth);
    const memberToSave = {
      ...tempMember,
      age: calculatedAge,
      // Compute full name from 4 parts
      name: `${tempMember.firstName || ''} ${tempMember.fatherName || ''} ${tempMember.grandfatherName || ''} ${tempMember.familyName || ''}`.trim()
    };

    try {
      if (editingMemberIndex !== null) {
        // Update existing member
        const existingMember = editableFamilyMembers[editingMemberIndex];

        if (existingMember.id && !existingMember.id.startsWith('temp_')) {
          // Clean member data before saving
          const cleanedMember = cleanIndividualData(memberToSave);

          // Save to backend
          setIsSaving(true);

          // Normalize values
          const disabilityTypeValue = cleanedMember.disabilityType || 'لا يوجد';
          const chronicDiseaseTypeValue = cleanedMember.chronicDiseaseType || 'لا يوجد';
          const warInjuryTypeValue = cleanedMember.warInjuryType || 'لا يوجد';

          // Transform camelCase to snake_case for API - send null to clear from DB
          const snakeCaseMember = {
            first_name: cleanedMember.firstName,
            father_name: cleanedMember.fatherName,
            grandfather_name: cleanedMember.grandfatherName,
            family_name: cleanedMember.familyName,
            name: cleanedMember.name,
            national_id: cleanedMember.nationalId,
            gender: cleanedMember.gender,
            date_of_birth: cleanedMember.dateOfBirth,
            age: cleanedMember.age,
            relation: cleanedMember.relation,
            is_studying: cleanedMember.isStudying || false,
            is_working: cleanedMember.isWorking || false,
            education_stage: cleanedMember.isStudying ? (cleanedMember.educationStage || null) : null,
            education_level: cleanedMember.isStudying ? (cleanedMember.educationLevel || null) : null,
            occupation: cleanedMember.isWorking ? (cleanedMember.occupation || null) : null,
            phone_number: cleanedMember.phoneNumber || null,
            marital_status: cleanedMember.maritalStatus || null,
            disability_type: disabilityTypeValue,
            disability_severity: disabilityTypeValue === 'لا يوجد' ? null : (cleanedMember.disabilitySeverity || null),
            disability_details: disabilityTypeValue === 'لا يوجد' ? null : (cleanedMember.disabilityDetails || null),
            chronic_disease_type: chronicDiseaseTypeValue,
            chronic_disease_details: chronicDiseaseTypeValue === 'لا يوجد' ? null : (cleanedMember.chronicDiseaseDetails || null),
            has_war_injury: cleanedMember.hasWarInjury || false,
            war_injury_type: (!cleanedMember.hasWarInjury || warInjuryTypeValue === 'لا يوجد') ? 'لا يوجد' : warInjuryTypeValue,
            war_injury_details: (!cleanedMember.hasWarInjury || warInjuryTypeValue === 'لا يوجد') ? null : (cleanedMember.warInjuryDetails || null),
            medical_followup_required: cleanedMember.medicalFollowupRequired || false,
            medical_followup_frequency: cleanedMember.medicalFollowupRequired ? (cleanedMember.medicalFollowupFrequency || null) : null,
            medical_followup_details: cleanedMember.medicalFollowupRequired ? (cleanedMember.medicalFollowupDetails || null) : null,
            updated_at: new Date().toISOString()
          };

          const response = await makeAuthenticatedRequest(
            `/individuals/${existingMember.id}`,
            {
              method: 'PUT',
              body: JSON.stringify(snakeCaseMember)
            }
          );

          if ((response as any).error) {
            throw new Error((response as any).error);
          }

          // Update local state with response from backend
          const updated = [...editableFamilyMembers];
          updated[editingMemberIndex] = {
            ...cleanedMember,
            id: existingMember.id
          };
          setEditableFamilyMembers(updated);
          setToast({ message: 'تم تعديل بيانات الفرد بنجاح', type: 'success' });
          setIsSaving(false);
        } else {
          // Local only (temp member)
          const updated = [...editableFamilyMembers];
          updated[editingMemberIndex] = memberToSave as FamilyMember;
          setEditableFamilyMembers(updated);
          setToast({ message: 'تم تعديل بيانات الفرد', type: 'success' });
        }
      } else {
        // Add new member
        if (id) {
          // Clean member data before saving
          const cleanedMember = cleanIndividualData(memberToSave);

          setIsSaving(true);

          // Normalize values
          const disabilityTypeValue = cleanedMember.disabilityType || 'لا يوجد';
          const chronicDiseaseTypeValue = cleanedMember.chronicDiseaseType || 'لا يوجد';
          const warInjuryTypeValue = cleanedMember.warInjuryType || 'لا يوجد';

          // Transform camelCase to snake_case for API - send null to clear from DB
          const snakeCaseMember = {
            family_id: id,
            first_name: cleanedMember.firstName,
            father_name: cleanedMember.fatherName,
            grandfather_name: cleanedMember.grandfatherName,
            family_name: cleanedMember.familyName,
            name: cleanedMember.name,
            national_id: cleanedMember.nationalId,
            gender: cleanedMember.gender,
            date_of_birth: cleanedMember.dateOfBirth,
            age: cleanedMember.age,
            relation: cleanedMember.relation,
            is_studying: cleanedMember.isStudying || false,
            is_working: cleanedMember.isWorking || false,
            education_stage: cleanedMember.isStudying ? (cleanedMember.educationStage || null) : null,
            education_level: cleanedMember.isStudying ? (cleanedMember.educationLevel || null) : null,
            occupation: cleanedMember.isWorking ? (cleanedMember.occupation || null) : null,
            phone_number: cleanedMember.phoneNumber || null,
            marital_status: cleanedMember.maritalStatus || null,
            disability_type: disabilityTypeValue,
            disability_severity: disabilityTypeValue === 'لا يوجد' ? null : (cleanedMember.disabilitySeverity || null),
            disability_details: disabilityTypeValue === 'لا يوجد' ? null : (cleanedMember.disabilityDetails || null),
            chronic_disease_type: chronicDiseaseTypeValue,
            chronic_disease_details: chronicDiseaseTypeValue === 'لا يوجد' ? null : (cleanedMember.chronicDiseaseDetails || null),
            has_war_injury: cleanedMember.hasWarInjury || false,
            war_injury_type: (!cleanedMember.hasWarInjury || warInjuryTypeValue === 'لا يوجد') ? 'لا يوجد' : warInjuryTypeValue,
            war_injury_details: (!cleanedMember.hasWarInjury || warInjuryTypeValue === 'لا يوجد') ? null : (cleanedMember.warInjuryDetails || null),
            medical_followup_required: cleanedMember.medicalFollowupRequired || false,
            medical_followup_frequency: cleanedMember.medicalFollowupRequired ? (cleanedMember.medicalFollowupFrequency || null) : null,
            medical_followup_details: cleanedMember.medicalFollowupRequired ? (cleanedMember.medicalFollowupDetails || null) : null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const response = await makeAuthenticatedRequest(
            '/individuals',
            {
              method: 'POST',
              body: JSON.stringify(snakeCaseMember)
            }
          );

          if ((response as any).error) {
            throw new Error((response as any).error);
          }

          // Add to local state with backend ID
          const newMember: FamilyMember = {
            ...cleanedMember,
            id: (response as any).id || `temp_${Date.now()}`
          } as FamilyMember;

          setEditableFamilyMembers([...editableFamilyMembers, newMember]);
          setToast({ message: 'تم إضافة الفرد بنجاح', type: 'success' });
          setIsSaving(false);
        } else {
          // No family ID, just add locally
          const cleanedMember = cleanIndividualData(memberToSave);
          setEditableFamilyMembers([...editableFamilyMembers, cleanedMember as FamilyMember]);
          setToast({ message: 'تم إضافة الفرد', type: 'success' });
        }
      }

      setShowMemberModal(false);
      setHasUnsavedChanges(true);
    } catch (error: any) {
      console.error('Save member error:', error);
      setToast({
        message: error.message || 'حدث خطأ أثناء حفظ البيانات',
        type: 'error'
      });
      setIsSaving(false);
    }
  };

  const deleteMember = async (index: number) => {
    const memberToDelete = editableFamilyMembers[index];
    
    try {
      if (memberToDelete.id && !memberToDelete.id.startsWith('temp_')) {
        // Delete from backend
        setIsSaving(true);
        await makeAuthenticatedRequest(
          `/individuals/${memberToDelete.id}`,
          {
            method: 'DELETE'
          }
        );

        setToast({ message: 'تم حذف الفرد بنجاح', type: 'success' });
        setIsSaving(false);
      }

      // Remove from local state
      const updated = [...editableFamilyMembers];
      updated.splice(index, 1);
      setEditableFamilyMembers(updated);
      setHasUnsavedChanges(true);
      
      if (editingMemberIndex !== null) {
        setShowMemberModal(false);
        setEditingMemberIndex(null);
      }
    } catch (error: any) {
      console.error('Delete member error:', error);
      setToast({ 
        message: error.message || 'حدث خطأ أثناء حذف الفرد', 
        type: 'error' 
      });
      setIsSaving(false);
    }
  };

  const handleMemberChange = (field: string, value: any) => {
    const updated = {
      ...tempMember,
      [field]: value
    };

    // Auto-calculate age when date of birth changes
    if (field === 'dateOfBirth' && value) {
      updated.age = calculateAge(value);
    }

    // Clear related fields when setting to "لا يوجد"
    if (field === 'disabilityType' && value === 'لا يوجد') {
      updated.disabilitySeverity = undefined;
      updated.disabilityDetails = undefined;
    } else if (field === 'chronicDiseaseType' && value === 'لا يوجد') {
      updated.chronicDiseaseDetails = undefined;
    } else if (field === 'warInjuryType' && value === 'لا يوجد') {
      updated.warInjuryDetails = undefined;
    }

    setTempMember(updated);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <div className="animate-pulse flex items-center gap-4">
            <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>

        {/* Banner Skeleton */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-6">
          <div className="animate-pulse grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-4 bg-white/30 rounded w-1/2"></div>
              <div className="h-8 bg-white/30 rounded w-3/4"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-white/30 rounded w-1/2"></div>
              <div className="h-8 bg-white/30 rounded w-3/4"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-white/30 rounded w-1/2"></div>
              <div className="h-8 bg-white/30 rounded w-3/4"></div>
            </div>
          </div>
        </div>

        {/* Tab Navigation Skeleton */}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-2">
          <div className="animate-pulse flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 bg-gray-200 rounded-xl flex-1"></div>
            ))}
          </div>
        </div>

        {/* Content Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <div key={j} className="h-4 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!dp) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 text-center">
          <p className="text-gray-500 font-bold">العائلة غير موجودة</p>
          <button
            onClick={() => navigate('/admin/dp-management')}
            className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700"
          >
            العودة للإدارة المركزية
          </button>
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
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <button
              onClick={() => navigate('/admin/dp-management')}
              className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all flex-shrink-0"
              title="العودة للإدارة المركزية"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-black text-gray-800 flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <span className="truncate">{isEditMode ? 'تعديل بيانات العائلة' : 'تفاصيل العائلة'}</span>
              </h1>
              <p className="text-gray-500 text-xs sm:text-sm font-bold mt-1 truncate">{dp && getFullName(dp)}</p>
            </div>
          </div>

          {/* Edit Mode Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end flex-shrink-0">
            {isEditMode ? (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-3 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 text-sm sm:text-base rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span className="hidden sm:inline">إلغاء</span>
                  <span className="sm:hidden">إلغاء</span>
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white text-sm sm:text-base rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-1 sm:gap-2 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isSaving ? (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{isSaving ? 'جاري الحفظ...' : 'حفظ'}</span>
                  <span className="sm:hidden">{isSaving ? 'حفظ...' : 'حفظ'}</span>
                </button>
              </>
            ) : (
              <>
                {/* SYSTEM_ADMIN only buttons */}
                {canEdit() && (
                  <button
                    onClick={() => setShowFieldPermissionsModal(true)}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white text-sm sm:text-base rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-1 sm:gap-2 flex-shrink-0"
                    title="صلاحيات الحقول"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="hidden sm:inline">صلاحيات الحقول</span>
                  </button>
                )}
                {canEdit() && dp?.registrationStatus !== 'موافق' && (
                  <button
                    onClick={() => {
                      setOverrideData({ newStatus: dp.registrationStatus === 'قيد الانتظار' ? 'موافق' : 'قيد الانتظار', reason: '', adminNotes: '' });
                      setShowOverrideModal(true);
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 text-white text-sm sm:text-base rounded-xl font-bold hover:bg-purple-700 transition-all flex items-center gap-1 sm:gap-2 flex-shrink-0"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="hidden sm:inline">تغيير الحالة</span>
                  </button>
                )}
                {canEdit() && (
                  <button
                    onClick={() => {
                      loadCamps();
                      setShowTransferModal(true);
                    }}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-orange-600 text-white text-sm sm:text-base rounded-xl font-bold hover:bg-orange-700 transition-all flex items-center gap-1 sm:gap-2 flex-shrink-0"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    <span className="hidden sm:inline">نقل</span>
                  </button>
                )}
                {canEdit() && (
                  <button
                    onClick={enterEditMode}
                    className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white text-sm sm:text-base rounded-xl font-bold hover:bg-blue-700 transition-all flex items-center gap-1 sm:gap-2 flex-shrink-0"
                  >
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    <span className="hidden sm:inline">تعديل</span>
                    <span className="sm:hidden">تعديل</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Unsaved changes indicator */}
        {isEditMode && hasUnsavedChanges && (
          <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-amber-700 font-bold text-xs sm:text-sm">توجد تغييرات غير محفوظة. يرجى الحفظ قبل الخروج.</span>
          </div>
        )}
      </div>

      {/* Name and National ID Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-[2rem] p-6 text-white shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-blue-100 font-bold text-sm mb-2">رب الأسرة</p>
            <p className="text-2xl font-black">{dp && getFullName(dp)}</p>
          </div>
          <div>
            <p className="text-blue-100 font-bold text-sm mb-2">رقم الهوية</p>
            <p className="text-2xl font-black tracking-wider">{dp.nationalId}</p>
          </div>
          <div>
            <p className="text-blue-100 font-bold text-sm mb-2">حالة التسجيل</p>
            <span className={`inline-block px-4 py-2 rounded-full font-black text-sm ${
              dp.registrationStatus === 'قيد الانتظار' ? 'bg-amber-100 text-amber-700' :
              dp.registrationStatus === 'موافق' ? 'bg-emerald-100 text-emerald-700' :
              'bg-red-100 text-red-700'
            }`}>
              {dp.registrationStatus === 'قيد الانتظار' ? 'قيد الانتظار' :
               dp.registrationStatus === 'موافق' ? 'موافق' : 'مرفوض'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-2">
        <div className="flex flex-wrap gap-1 sm:gap-2 justify-center">
          <button
            onClick={() => setActiveTab('basic')}
            className={`flex-1 min-w-[110px] sm:min-w-[140px] px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'basic'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="whitespace-nowrap">المعلومات الأساسية</span>
          </button>
          <button
            onClick={() => setActiveTab('family')}
            className={`flex-1 min-w-[110px] sm:min-w-[140px] px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'family'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="whitespace-nowrap">أفراد العائلة ({familyMembers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('housing')}
            className={`flex-1 min-w-[110px] sm:min-w-[140px] px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'housing'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="whitespace-nowrap">السكن والمرافق</span>
          </button>
          {/* <button
            onClick={() => setActiveTab('health')}
            className={`flex-1 min-w-[110px] sm:min-w-[140px] px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'health'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="whitespace-nowrap">الهشاشة</span>
          </button> */}
          {/* Spouse Tab - Show if married (not single) */}
          {(() => {
            const isEdit = isEditMode && editableData;
            const currentHeadRole = isEdit ? editableData.headRole : dp.headRole;
            const currentGender = isEdit ? editableData.gender : dp.gender;
            const maritalStatusValue = isEdit ? editableData.maritalStatus : dp.maritalStatus;
            
            // Show spouse tab if married (not single) OR if spouse name exists
            const showSpouseTab = (maritalStatusValue && maritalStatusValue !== 'أعزب' && maritalStatusValue !== 'أعزب/عزباء') ||
              (isMaleHead(currentHeadRole, currentGender) && dp.wifeName) ||
              (isFemaleHead(currentHeadRole, currentGender) && dp.husbandName);

            if (!showSpouseTab) return null;
            
            const isWife = isMaleHead(isEditMode && editableData ? editableData.headRole : dp.headRole, isEditMode && editableData ? editableData.gender : dp.gender);
            
            return (
              <button
                onClick={() => setActiveTab('spouse')}
                className={`flex-1 min-w-[110px] sm:min-w-[140px] px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
                  activeTab === 'spouse'
                    ? isWife
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="whitespace-nowrap">{isWife ? 'الزوجة' : 'الزوج'}</span>
              </button>
            );
          })()}
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex-1 min-w-[110px] sm:min-w-[140px] px-2 sm:px-4 py-2.5 sm:py-3 rounded-xl font-bold text-[10px] sm:text-sm transition-all flex items-center justify-center gap-1 sm:gap-2 ${
              activeTab === 'documents'
                ? 'bg-purple-600 text-white shadow-md'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
          >
            <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="whitespace-nowrap">الوثائق</span>
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {/* Basic Tab */}
      {activeTab === 'basic' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              معلومات رب الأسرة
            </h3>
            {isEditMode && editableData ? (
              <div className="space-y-3">
                {/* 4-part name fields */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الأول</label>
                  <input
                    type="text"
                    value={editableData.headFirstName || ''}
                    onChange={(e) => handleFieldChange('headFirstName', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                      validationErrors.headFirstName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="الاسم الأول"
                  />
                  {validationErrors.headFirstName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.headFirstName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">اسم الأب</label>
                  <input
                    type="text"
                    value={editableData.headFatherName || ''}
                    onChange={(e) => handleFieldChange('headFatherName', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                      validationErrors.headFatherName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="اسم الأب"
                  />
                  {validationErrors.headFatherName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.headFatherName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">اسم الجد</label>
                  <input
                    type="text"
                    value={editableData.headGrandfatherName || ''}
                    onChange={(e) => handleFieldChange('headGrandfatherName', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                      validationErrors.headGrandfatherName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="اسم الجد"
                  />
                  {validationErrors.headGrandfatherName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.headGrandfatherName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">اسم العائلة</label>
                  <input
                    type="text"
                    value={editableData.headFamilyName || ''}
                    onChange={(e) => handleFieldChange('headFamilyName', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                      validationErrors.headFamilyName ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="اسم العائلة"
                  />
                  {validationErrors.headFamilyName && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.headFamilyName}</p>
                  )}
                </div>

                {/* National ID */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهوية *</label>
                  <input
                    type="text"
                    value={editableData.nationalId || ''}
                    onChange={(e) => handleFieldChange('nationalId', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none dir-ltr ${
                      validationErrors.nationalId ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="9 أرقام"
                    pattern="[0-9]{9}"
                    maxLength={9}
                    dir="ltr"
                  />
                  {validationErrors.nationalId && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.nationalId}</p>
                  )}
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الجنس</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange('gender', 'ذكر')}
                      className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                        editableData.gender === 'ذكر'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      ذكر
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange('gender', 'أنثى')}
                      className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                        editableData.gender === 'أنثى'
                          ? 'bg-pink-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      أنثى
                    </button>
                  </div>
                  {validationErrors.gender && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.gender}</p>
                  )}
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الميلاد</label>
                  <input
                    type="date"
                    value={editableData.dateOfBirth || ''}
                    onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                      validationErrors.dateOfBirth ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                  />
                  {validationErrors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.dateOfBirth}</p>
                  )}
                </div>

                {/* Marital Status */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الحالة الاجتماعية *</label>
                  <select
                    value={editableData.maritalStatus || ''}
                    onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                      validationErrors.maritalStatus ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                  >
                    <option value="أعزب">أعزب / عزباء</option>
                    <option value="متزوج">متزوج / متزوجة</option>
                    <option value="أرمل">أرمل / أرملة</option>
                    <option value="مطلق">مطلق / مطلقة</option>
                    <option value="أسرة هشة">أسرة هشة</option>
                  </select>
                  {validationErrors.maritalStatus && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.maritalStatus}</p>
                  )}
                </div>

                {/* Widow Reason - Show only when widow is selected */}
                {editableData.maritalStatus === 'أرمل' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">سبب الوفاة</label>
                    <select
                      value={editableData.widowReason || ''}
                      onChange={(e) => handleFieldChange('widowReason', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    >
                      <option value="شهيد">شهيد</option>
                      <option value="وفاة طبيعية">وفاة طبيعية</option>
                      <option value="حادث">حادث</option>
                      <option value="مرض">مرض</option>
                      <option value="غير ذلك">غير ذلك</option>
                    </select>
                  </div>
                )}

                {/* Head Role - Show only when NOT single */}
                {editableData.maritalStatus && editableData.maritalStatus !== 'أعزب' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">صفة ربّ الأسرة *</label>
                    <select
                      value={editableData.headRole || ''}
                      onChange={(e) => handleFieldChange('headRole', e.target.value)}
                      className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none ${
                        validationErrors.headRole ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                      }`}
                    >
                      <option value="">اختر الصفة</option>
                      <option value="أب">أب (مسؤول عن جميع الأفراد والزوجة)</option>
                      <option value="أم">أم (معيلة للأطفال أو أرملة)</option>
                      <option value="زوجة">زوجة (في حال عجز الزوج أو تعدد الزوجات)</option>
                    </select>
                    {validationErrors.headRole && (
                      <p className="text-red-500 text-xs mt-1">{validationErrors.headRole}</p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-bold text-sm">الجنس</span>
                  <span className="font-black text-gray-800">{GENDER_LABELS[dp.gender]}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-bold text-sm">تاريخ الميلاد</span>
                  <span className="font-black text-gray-800">{dp.dateOfBirth || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-bold text-sm">العمر</span>
                  <span className="font-black text-gray-800">{dp.dateOfBirth ? calculateAge(dp.dateOfBirth) : dp.age || '-'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-bold text-sm">الحالة الاجتماعية</span>
                  <span className={`px-3 py-1 rounded-full font-black text-sm ${MARITAL_STATUS[dp.maritalStatus as keyof typeof MARITAL_STATUS]?.color || 'bg-gray-200 text-gray-700'}`}>
                    {MARITAL_STATUS[dp.maritalStatus as keyof typeof MARITAL_STATUS]?.label}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              معلومات الاتصال
            </h3>
            {isEditMode && editableData ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف الأساسي</label>
                  <input
                    type="tel"
                    value={editableData.phoneNumber || ''}
                    onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none dir-ltr ${
                      validationErrors.phoneNumber ? 'border-red-500 focus:border-red-500' : 'border-gray-200 focus:border-blue-500'
                    }`}
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                  {validationErrors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف الثانوي</label>
                  <input
                    type="tel"
                    value={editableData.phoneSecondary || ''}
                    onChange={(e) => handleFieldChange('phoneSecondary', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-bold text-sm">رقم الهاتف الأساسي</span>
                  <span className="font-black text-gray-800 dir-ltr">{dp.phoneNumber}</span>
                </div>
                {dp.phoneSecondary && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">رقم الهاتف الثانوي</span>
                    <span className="font-black text-gray-800 dir-ltr">{dp.phoneSecondary}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Work Information */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              العمل والدخل
            </h3>
            {isEditMode && editableData ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isWorking"
                    checked={editableData.isWorking || false}
                    onChange={(e) => handleFieldChange('isWorking', e.target.checked)}
                    className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  />
                  <label htmlFor="isWorking" className="text-sm font-bold text-gray-700">يعمل حالياً</label>
                </div>
                {editableData.isWorking && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">الوظيفة</label>
                      <input
                        type="text"
                        value={editableData.job || ''}
                        onChange={(e) => handleFieldChange('job', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="المهنة"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">الدخل الشهري التقريبي</label>
                      <input
                        type="number"
                        value={editableData.monthlyIncome || ''}
                        onChange={(e) => handleFieldChange('monthlyIncome', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="0"
                        step="0.01"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">نطاق الدخل الشهري</label>
                      <select
                        value={editableData.monthlyIncomeRange || ''}
                        onChange={(e) => handleFieldChange('monthlyIncomeRange', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">اختر النطاق</option>
                        <option value="بدون دخل">بدون دخل</option>
                        <option value="أقل من 100">أقل من 100 شيكل</option>
                        <option value="100-300">100 - 300 شيكل</option>
                        <option value="300-500">300 - 500 شيكل</option>
                        <option value="أكثر من 500">أكثر من 500 شيكل</option>
                      </select>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {dp.isWorking !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">يعمل حالياً</span>
                    <span className={`px-3 py-1 rounded-full font-black text-sm ${dp.isWorking ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-700'}`}>
                      {dp.isWorking ? 'نعم' : 'لا'}
                    </span>
                  </div>
                )}
                {dp.isWorking && dp.job && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">الوظيفة</span>
                    <span className="font-black text-gray-800">{dp.job}</span>
                  </div>
                )}
                {dp.isWorking && dp.monthlyIncome !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">الدخل الشهري</span>
                    <span className="font-black text-gray-800">{dp.monthlyIncome} شيكل</span>
                  </div>
                )}
                {dp.isWorking && dp.monthlyIncomeRange && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">نطاق الدخل</span>
                    <span className="font-black text-gray-800">
                      {dp.monthlyIncomeRange === 'no_income' || dp.monthlyIncomeRange === 'بدون دخل' ? 'بدون دخل' :
                       dp.monthlyIncomeRange === 'under_100' || dp.monthlyIncomeRange === 'أقل من 100' ? 'أقل من 100 شيكل' :
                       dp.monthlyIncomeRange === '100_to_300' || dp.monthlyIncomeRange === '100-300' ? '100 - 300 شيكل' :
                       dp.monthlyIncomeRange === '300_to_500' || dp.monthlyIncomeRange === '300-500' ? '300 - 500 شيكل' :
                       dp.monthlyIncomeRange === 'over_500' || dp.monthlyIncomeRange === 'أكثر من 500' ? 'أكثر من 500 شيكل' :
                       dp.monthlyIncomeRange}
                    </span>
                  </div>
                )}
                {!dp.isWorking && (
                  <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد بيانات العمل</p>
                )}
              </div>
            )}
          </div>

          {/* Health Information - Head of Family */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              صحة رب الأسرة
            </h3>
            {isEditMode && editableData ? (
              <div className="space-y-3">
                {/* Disability */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الإعاقة</label>
                  <select
                    value={editableData.disabilityType || 'لا يوجد'}
                    onChange={(e) => handleFieldChange('disabilityType', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="لا يوجد">لا توجد إعاقة</option>
                    <option value="حركية">حركية</option>
                    <option value="بصرية">بصرية</option>
                    <option value="سمعية">سمعية</option>
                    <option value="ذهنية">ذهنية</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                {editableData.disabilityType && editableData.disabilityType !== 'لا يوجد' && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">درجة الإعاقة</label>
                      <select
                        value={editableData.disabilitySeverity || ''}
                        onChange={(e) => handleFieldChange('disabilitySeverity', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">اختر الدرجة</option>
                        <option value="بسيطة">بسيطة</option>
                        <option value="متوسطة">متوسطة</option>
                        <option value="شديدة">شديدة</option>
                        <option value="كلية">كلية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإعاقة</label>
                      <textarea
                        value={editableData.disabilityDetails || ''}
                        onChange={(e) => handleFieldChange('disabilityDetails', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        rows={2}
                        placeholder="وصف الإعاقة..."
                      />
                    </div>
                  </>
                )}

                {/* Chronic Disease */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الأمراض المزمنة</label>
                  <select
                    value={editableData.chronicDiseaseType || 'لا يوجد'}
                    onChange={(e) => handleFieldChange('chronicDiseaseType', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="لا يوجد">لا يوجد</option>
                    <option value="سكري">سكري</option>
                    <option value="ضغط دم">ضغط دم</option>
                    <option value="قلب">قلب</option>
                    <option value="سرطان">سرطان</option>
                    <option value="ربو">ربو</option>
                    <option value="فشل كلوي">فشل كلوي</option>
                    <option value="مرض نفسي">مرض نفسي</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                {editableData.chronicDiseaseType && editableData.chronicDiseaseType !== 'لا يوجد' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المرض المزمن</label>
                    <textarea
                      value={editableData.chronicDiseaseDetails || ''}
                      onChange={(e) => handleFieldChange('chronicDiseaseDetails', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      rows={2}
                      placeholder="وصف المرض..."
                    />
                  </div>
                )}

                {/* War Injury */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">إصابات الحرب</label>
                  <select
                    value={editableData.warInjuryType || 'لا يوجد'}
                    onChange={(e) => handleFieldChange('warInjuryType', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="لا يوجد">لا يوجد</option>
                    <option value="بتر">بتر</option>
                    <option value="كسر">كسر</option>
                    <option value="شظية">شظية</option>
                    <option value="حرق">حرق</option>
                    <option value="رأس/وجه">رأس/وجه</option>
                    <option value="عمود فقري">عمود فقري</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                {editableData.warInjuryType && editableData.warInjuryType !== 'لا يوجد' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإصابة</label>
                    <textarea
                      value={editableData.warInjuryDetails || ''}
                      onChange={(e) => handleFieldChange('warInjuryDetails', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      rows={2}
                      placeholder="وصف الإصابة..."
                    />
                  </div>
                )}

                {/* Medical Follow-up */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="medicalFollowupRequired"
                    checked={editableData.medicalFollowupRequired || false}
                    onChange={(e) => handleFieldChange('medicalFollowupRequired', e.target.checked)}
                    className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                  />
                  <label htmlFor="medicalFollowupRequired" className="text-sm font-bold text-gray-700">يحتاج متابعة طبية</label>
                </div>
                {editableData.medicalFollowupRequired && (
                  <>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تكرار المتابعة</label>
                      <input
                        type="text"
                        value={editableData.medicalFollowupFrequency || ''}
                        onChange={(e) => handleFieldChange('medicalFollowupFrequency', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="مثال: أسبوعياً، شهرياً..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                      <textarea
                        value={editableData.medicalFollowupDetails || ''}
                        onChange={(e) => handleFieldChange('medicalFollowupDetails', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        rows={2}
                        placeholder="تفاصيل إضافية..."
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {dp.disabilityType && dp.disabilityType.trim() !== 'لا يوجد' && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">نوع الإعاقة</span>
                      <span className="font-black text-gray-800">{dp.disabilityType}</span>
                    </div>
                    {dp.disabilitySeverity && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500 font-bold text-sm">درجة الإعاقة</span>
                        <span className="font-black text-gray-800">{dp.disabilitySeverity}</span>
                      </div>
                    )}
                    {dp.disabilityDetails && (
                      <div className="py-2">
                        <span className="text-gray-500 font-bold text-sm block mb-1">تفاصيل الإعاقة</span>
                        <span className="font-black text-gray-800">{dp.disabilityDetails}</span>
                      </div>
                    )}
                  </>
                )}
                {dp.chronicDiseaseType && dp.chronicDiseaseType.trim() !== 'لا يوجد' && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">المرض المزمن</span>
                    <span className="font-black text-gray-800">{dp.chronicDiseaseType}</span>
                  </div>
                )}
                {dp.chronicDiseaseDetails && (
                  <div className="py-2">
                    <span className="text-gray-500 font-bold text-sm block mb-1">تفاصيل المرض</span>
                    <span className="font-black text-gray-800">{dp.chronicDiseaseDetails}</span>
                  </div>
                )}
                {dp.warInjuryType && dp.warInjuryType.trim() !== 'لا يوجد' && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">إصابة الحرب</span>
                    <span className="font-black text-gray-800">{dp.warInjuryType}</span>
                  </div>
                )}
                {dp.warInjuryDetails && (
                  <div className="py-2">
                    <span className="text-gray-500 font-bold text-sm block mb-1">تفاصيل الإصابة</span>
                    <span className="font-black text-gray-800">{dp.warInjuryDetails}</span>
                  </div>
                )}
                {dp.medicalFollowupRequired && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">المتابعة الطبية</span>
                      <span className="px-3 py-1 rounded-full font-black text-sm bg-red-100 text-red-700">مطلوبة</span>
                    </div>
                    {dp.medicalFollowupFrequency && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500 font-bold text-sm">تكرار المتابعة</span>
                        <span className="font-black text-gray-800">{dp.medicalFollowupFrequency}</span>
                      </div>
                    )}
                    {dp.medicalFollowupDetails && (
                      <div className="py-2">
                        <span className="text-gray-500 font-bold text-sm block mb-1">تفاصيل المتابعة</span>
                        <span className="font-black text-gray-800">{dp.medicalFollowupDetails}</span>
                      </div>
                    )}
                  </>
                )}
                {!dp.disabilityType && !dp.chronicDiseaseType && !dp.warInjuryType && !dp.medicalFollowupRequired && (
                  <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد بيانات صحية</p>
                )}
              </div>
            )}
          </div>

          {/* Female Head Pregnancy - Basic Tab */}
          {isFemaleHead(editableData?.headRole ?? dp?.headRole, editableData?.gender ?? dp?.gender) && (
            <div className="bg-pink-50 border-2 border-pink-200 rounded-[2rem] p-6">
              <h3 className="text-lg font-black text-pink-800 mb-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-pink-100 text-pink-600 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                معلومات الحمل (رب أسرة أنثى)
              </h3>
              {isEditMode && editableData ? (
                <div className="bg-white rounded-xl p-4 border border-pink-100">
                  <h4 className="font-black text-pink-700 mb-3">معلومات الحمل</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="wifeIsPregnant"
                        checked={editableData.wifeIsPregnant || false}
                        onChange={(e) => handleFieldChange('wifeIsPregnant', e.target.checked)}
                        className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                      />
                      <label htmlFor="wifeIsPregnant" className="text-sm font-bold text-gray-700">حامل</label>
                    </div>
                    {editableData.wifeIsPregnant && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">شهر الحمل</label>
                          <input
                            type="number"
                            value={editableData.wifePregnancyMonth || ''}
                            onChange={(e) => handleFieldChange('wifePregnancyMonth', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none"
                            placeholder="شهر الحمل"
                            min="1"
                            max="9"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="wifePregnancySpecialNeeds"
                            checked={editableData.wifePregnancySpecialNeeds || false}
                            onChange={(e) => handleFieldChange('wifePregnancySpecialNeeds', e.target.checked)}
                            className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                          />
                          <label htmlFor="wifePregnancySpecialNeeds" className="text-sm font-bold text-gray-700">احتياجات خاصة</label>
                        </div>
                        {editableData.wifePregnancySpecialNeeds && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                            <textarea
                              value={editableData.wifePregnancyFollowupDetails || ''}
                              onChange={(e) => handleFieldChange('wifePregnancyFollowupDetails', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-pink-500 focus:outline-none"
                              placeholder="تفاصيل المتابعة الخاصة بالحمل"
                              rows={2}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-pink-100">
                  <h4 className="font-black text-pink-700 mb-3">معلومات الحمل</h4>
                  <div className="space-y-2">
                    {dp.wifeIsPregnant && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500 font-bold text-sm">حامل</span>
                        <span className="px-3 py-1 rounded-full font-black text-sm bg-pink-100 text-pink-700">نعم</span>
                      </div>
                    )}
                    {dp.wifePregnancyMonth && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-gray-500 font-bold text-sm">شهر الحمل</span>
                        <span className="font-black text-gray-800">{dp.wifePregnancyMonth} أشهر</span>
                      </div>
                    )}
                    {dp.wifePregnancySpecialNeeds && (
                      <>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm">احتياجات خاصة</span>
                          <span className="px-3 py-1 rounded-full font-black text-sm bg-pink-100 text-pink-700">نعم</span>
                        </div>
                        {dp.wifePregnancyFollowupDetails && (
                          <div className="py-2">
                            <span className="text-gray-500 font-bold text-sm block mb-1">تفاصيل المتابعة</span>
                            <span className="font-black text-gray-800">{dp.wifePregnancyFollowupDetails}</span>
                          </div>
                        )}
                      </>
                    )}
                    {!dp.wifeIsPregnant && (
                      <p className="text-gray-500 font-bold text-sm text-center py-4">لا توجد بيانات حمل</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Family Composition */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              تركيب الأسرة
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-500 font-bold text-sm">عدد الأفراد</span>
                <span className="font-black text-gray-800 text-lg">{dp.totalMembersCount}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-gray-500 font-bold text-xs mb-1">ذكور</p>
                  <p className="font-black text-blue-700 text-xl">{dp.maleCount || 0}</p>
                </div>
                <div className="bg-pink-50 rounded-xl p-3 text-center">
                  <p className="text-gray-500 font-bold text-xs mb-1">إناث</p>
                  <p className="font-black text-pink-700 text-xl">{dp.femaleCount || 0}</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-2">
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-gray-500 font-bold text-xs">أطفال</p>
                  <p className="font-black text-gray-800">{dp.childCount || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-gray-500 font-bold text-xs">مراهقين</p>
                  <p className="font-black text-gray-800">{dp.teenagerCount || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-gray-500 font-bold text-xs">بالغين</p>
                  <p className="font-black text-gray-800">{dp.adultCount || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-gray-500 font-bold text-xs">كبار سن</p>
                  <p className="font-black text-gray-800">{dp.seniorCount || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-gray-500 font-bold text-xs">ذوي إعاقة</p>
                  <p className="font-black text-gray-800">{dp.disabledCount || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-2 text-center">
                  <p className="text-gray-500 font-bold text-xs">مصابين</p>
                  <p className="font-black text-gray-800">{dp.injuredCount || 0}</p>
                </div>
              </div>
              {dp.unitNumber && (
                <div className="flex justify-between items-center py-2 border-t border-gray-100 pt-3">
                  <span className="text-gray-500 font-bold text-sm">رقم الوحدة/الخيمة</span>
                  <span className="font-black text-gray-800">{dp.unitNumber}</span>
                </div>
              )}
            </div>
          </div>

          {/* Refugee/Resident Outside Country */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              لاجئ / مقيم بالخارج
            </h3>
            {isEditMode && editableData ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isResidentAbroad"
                    checked={editableData.isResidentAbroad || false}
                    onChange={(e) => handleFieldChange('isResidentAbroad', e.target.checked)}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isResidentAbroad" className="text-sm font-bold text-gray-700">لاجئ / مقيم بالخارج</label>
                </div>
                {editableData.isResidentAbroad && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">الدولة</label>
                      <input
                        type="text"
                        value={editableData.refugeeResidentAbroadCountry || ''}
                        onChange={(e) => handleFieldChange('refugeeResidentAbroadCountry', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="اسم الدولة"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المدينة</label>
                      <input
                        type="text"
                        value={editableData.refugeeResidentAbroadCity || ''}
                        onChange={(e) => handleFieldChange('refugeeResidentAbroadCity', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="اسم المدينة"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإقامة</label>
                      <select
                        value={editableData.refugeeResidentAbroadResidenceType || ''}
                        onChange={(e) => handleFieldChange('refugeeResidentAbroadResidenceType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      >
                        <option value="">اختر النوع</option>
                        <option value="لاجئ">لاجئ</option>
                        <option value="مقيم نظامي">مقيم نظامي</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                  </div>
                )}
                {!editableData.isResidentAbroad && (
                  <p className="text-gray-500 text-sm font-bold text-center py-4">الفرد مقيم في فلسطين</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Status Badge */}
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-black text-gray-800">حالة الإقامة بالخارج</span>
                  </div>
                  {dp.isResidentAbroad ? (
                    <span className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-full">
                      نعم - لاجئ / مقيم بالخارج
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded-full">
                      لا - مقيم في فلسطين
                    </span>
                  )}
                </div>

                {/* Detail fields - only shown when isResidentAbroad is true */}
                {dp.isResidentAbroad && (
                  <>
              {dp.refugeeResidentAbroadCountry && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-bold text-sm">الدولة</span>
                  <span className="font-black text-gray-800">{dp.refugeeResidentAbroadCountry}</span>
                </div>
              )}
              {dp.refugeeResidentAbroadCity && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-bold text-sm">المدينة</span>
                  <span className="font-black text-gray-800">{dp.refugeeResidentAbroadCity}</span>
                </div>
              )}
              {dp.refugeeResidentAbroadResidenceType && (
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-bold text-sm">نوع الإقامة</span>
                  <span className="font-black text-gray-800">
                    {RESIDENCE_TYPES[dp.refugeeResidentAbroadResidenceType as keyof typeof RESIDENCE_TYPES] || dp.refugeeResidentAbroadResidenceType}
                  </span>
                </div>
              )}
                </>
              )}
              {!dp.isResidentAbroad && (
                <p className="text-gray-500 font-bold text-sm text-center py-4">الفرد مقيم في فلسطين - لا توجد بيانات خارجية</p>
              )}
            </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6 lg:col-span-2">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              ملاحظات الإدارة
            </h3>
            {isEditMode && editableData ? (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">أضف ملاحظات الإدارة</label>
                <textarea
                  value={editableData.adminNotes || ''}
                  onChange={(e) => handleFieldChange('adminNotes', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  placeholder="اكتب ملاحظات الإدارة هنا..."
                  rows={4}
                />
                <p className="text-gray-500 text-xs mt-2">اختياري - يمكن تركه فارغاً</p>
              </div>
            ) : (
              dp.adminNotes ? (
                <p className="text-gray-700 font-bold whitespace-pre-wrap">{dp.adminNotes}</p>
              ) : (
                <p className="text-gray-500 font-bold text-sm">لا توجد ملاحظات إدارة</p>
              )
            )}
          </div>
        </div>
      )}

      {/* Family Tab */}
      {activeTab === 'family' && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              أفراد العائلة ({isEditMode ? editableFamilyMembers.length : familyMembers.length})
            </h3>
            {isEditMode && (
              <button
                onClick={openAddMemberModal}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                إضافة فرد
              </button>
            )}
          </div>
          {(isEditMode ? editableFamilyMembers : familyMembers).length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b-2 border-gray-200">
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">#</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">الاسم الكامل</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">رقم الهوية</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">الجنس</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">تاريخ الميلاد</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">العمر</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">الصلة</th>
                    <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">الحالة الصحية</th>
                    {isEditMode && (
                      <th className="px-4 py-3 text-right text-xs font-black text-gray-500 uppercase">إجراءات</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(isEditMode ? editableFamilyMembers : familyMembers).map((member, index) => (
                    <tr key={member.id} className="hover:bg-gray-50 transition-all">
                      <td className="px-4 py-3 text-sm font-black text-gray-800">{index + 1}</td>
                      <td className="px-4 py-3 text-sm font-black text-gray-800">{member.name || `${member.firstName} ${member.fatherName} ${member.grandfatherName} ${member.familyName}`.trim()}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-600 dir-ltr">{member.nationalId || '-'}</td>
                      <td className="px-4 py-3 text-sm font-black text-gray-800">
                        <span className={`px-2 py-1 rounded-lg text-xs ${
                          member.gender === 'ذكر' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'
                        }`}>
                          {member.gender === 'ذكر' ? 'ذكر' : 'أنثى'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-600">{member.dateOfBirth || '-'}</td>
                      <td className="px-4 py-3 text-sm font-black text-gray-800">{member.age || '-'}</td>
                      <td className="px-4 py-3 text-sm font-bold text-gray-600">
                        {translateRelation(member.relation)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {member.disabilityType && member.disabilityType.trim() !== 'لا يوجد' && (
                            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold">
                              إعاقة
                            </span>
                          )}
                          {member.chronicDiseaseType && member.chronicDiseaseType.trim() !== 'لا يوجد' && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-lg text-xs font-bold">
                              مرض مزمن
                            </span>
                          )}
                          {member.hasWarInjury && member.warInjuryType && member.warInjuryType.trim() !== 'لا يوجد' && (
                            <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-lg text-xs font-bold">
                              إصابة حرب
                            </span>
                          )}
                          {member.medicalFollowupRequired && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-bold">
                              متابعة طبية
                            </span>
                          )}
                          {!member.disabilityType && member.disabilityType.trim() !== 'لا يوجد' && !member.chronicDiseaseType && member.chronicDiseaseType.trim() !== 'لا يوجد' && !member.hasWarInjury && !member.medicalFollowupRequired && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                              سليم
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex gap-2">
                          {/* View Button - Always Visible */}
                          <button
                            onClick={() => openViewMemberModal(index)}
                            className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-all"
                            title="عرض"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          
                          {/* Edit & Delete Buttons - Only in Edit Mode */}
                          {isEditMode && (
                            <>
                              <button
                                onClick={() => openEditMemberModal(index)}
                                className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
                                title="تعديل"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => deleteMember(index)}
                                className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-all"
                                title="حذف"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-gray-500 font-bold text-sm">لا توجد بيانات أفراد العائلة</p>
              {isEditMode && (
                <button
                  onClick={openAddMemberModal}
                  className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
                >
                  إضافة فرد جديد
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Housing Tab */}
      {activeTab === 'housing' && (
        <div className="space-y-6">
          {/* Original Address */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 text-gray-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              السكن الأصلي
            </h3>
            {isEditMode && editableData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المحافظة</label>
                  <select
                    value={editableData.originalAddressGovernorate || ''}
                    onChange={(e) => handleFieldChange('originalAddressGovernorate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر المحافظة</option>
                    {GAZA_LOCATIONS && GAZA_LOCATIONS.map((gov) => (
                      <option key={gov.arabic_name} value={gov.arabic_name}>{gov.arabic_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المنطقة / الحي</label>
                  <select
                    value={editableData.originalAddressRegion || ''}
                    onChange={(e) => handleFieldChange('originalAddressRegion', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    disabled={!editableData.originalAddressGovernorate}
                  >
                    <option value="">اختر المنطقة</option>
                    {availableOrigAreas && availableOrigAreas.map((area) => (
                      <option key={area.arabic_name} value={area.arabic_name}>{area.arabic_name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">العنوان بالتفصيل</label>
                  <textarea
                    value={editableData.originalAddressDetails || ''}
                    onChange={(e) => handleFieldChange('originalAddressDetails', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="العنوان بالتفصيل"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">نوع السكن</label>
                  <select
                    value={editableData.originalAddressHousingType || ''}
                    onChange={(e) => handleFieldChange('originalAddressHousingType', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر النوع</option>
                    <option value="ملك">ملك</option>
                    <option value="إيجار">إيجار</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {dp.originalAddressGovernorate && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">المحافظة</span>
                    <span className="font-black text-gray-800">{dp.originalAddressGovernorate}</span>
                  </div>
                )}
                {dp.originalAddressRegion && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">المنطقة</span>
                    <span className="font-black text-gray-800">{dp.originalAddressRegion}</span>
                  </div>
                )}
                {dp.originalAddressDetails && (
                  <div className="py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm block mb-1">العنوان بالتفصيل</span>
                    <span className="font-black text-gray-800">{dp.originalAddressDetails}</span>
                  </div>
                )}
                {dp.originalAddressHousingType && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">نوع السكن</span>
                    <span className="font-black text-gray-800">
                      {dp.originalAddressHousingType}
                    </span>
                  </div>
                )}
                {!dp.originalAddressGovernorate && !dp.originalAddressDetails && (
                  <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد بيانات السكن الأصلي</p>
                )}
              </div>
            )}
          </div>

          {/* Current Housing */}
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              السكن الحالي والمرافق
            </h3>
            {isEditMode && editableData ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">نوع السكن</label>
                  <select
                    value={editableData.currentHousingType || ''}
                    onChange={(e) => handleFieldChange('currentHousingType', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر النوع</option>
                    <option value="خيمة">خيمة</option>
                    <option value="بيت إسمنتي">بيت إسمنتي</option>
                    <option value="شقة">شقة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">حالة مشاركة السكن</label>
                  <select
                    value={editableData.currentHousingSharingStatus || ''}
                    onChange={(e) => handleFieldChange('currentHousingSharingStatus', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر الحالة</option>
                    <option value="سكن فردي">سكن فردي</option>
                    <option value="سكن مشترك">سكن مشترك</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">النوع المفصل للسكن</label>
                  <select
                    value={editableData.currentHousingDetailedType || ''}
                    onChange={(e) => handleFieldChange('currentHousingDetailedType', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر النوع</option>
                    <option value="خيمة فردية">خيمة فردية</option>
                    <option value="خيمة مشتركة">خيمة مشتركة</option>
                    <option value="منزل كامل">منزل كامل</option>
                    <option value="غرفة في منزل">غرفة في منزل</option>
                    <option value="شقة مفروشة">شقة مفروشة</option>
                    <option value="شقة غير مفروشة">شقة غير مفروشة</option>
                    <option value="كارافان">كارافان</option>
                    <option value="آخر">آخر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">مفروش</label>
                  <select
                    value={editableData.currentHousingFurnished !== undefined ? (editableData.currentHousingFurnished ? 'نعم' : 'لا') : ''}
                    onChange={(e) => handleFieldChange('currentHousingFurnished', e.target.value === 'نعم')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر</option>
                    <option value="نعم">نعم</option>
                    <option value="لا">لا</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">رقم الوحدة/الخيمة</label>
                  <input
                    type="text"
                    value={editableData.unitNumber || ''}
                    onChange={(e) => handleFieldChange('unitNumber', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="رقم الوحدة"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">مناسب للعائلة</label>
                  <select
                    value={editableData.currentHousingIsSuitable !== undefined ? (editableData.currentHousingIsSuitable ? 'نعم' : 'لا') : ''}
                    onChange={(e) => handleFieldChange('currentHousingIsSuitable', e.target.value === 'نعم')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر</option>
                    <option value="نعم">نعم</option>
                    <option value="لا">لا</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المرافق الصحية</label>
                  <select
                    value={editableData.currentHousingSanitaryFacilities || ''}
                    onChange={(e) => handleFieldChange('currentHousingSanitaryFacilities', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر النوع</option>
                    <option value="نعم (دورة مياه خاصة)">نعم (دورة مياه خاصة)</option>
                    <option value="لا (مرافق مشتركة)">لا (مرافق مشتركة)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">مصدر المياه</label>
                  <select
                    value={editableData.currentHousingWaterSource || ''}
                    onChange={(e) => handleFieldChange('currentHousingWaterSource', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر المصدر</option>
                    <option value="شبكة عامة">شبكة عامة</option>
                    <option value="صهاريج">صهاريج</option>
                    <option value="آبار">آبار</option>
                    <option value="آخر">آخر</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">مصدر الكهرباء</label>
                  <select
                    value={editableData.currentHousingElectricityAccess || ''}
                    onChange={(e) => handleFieldChange('currentHousingElectricityAccess', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر المصدر</option>
                    <option value="شبكة عامة">شبكة عامة</option>
                    <option value="مولد">مولد</option>
                    <option value="طاقة شمسية">طاقة شمسية</option>
                    <option value="لا يوجد">لا يوجد</option>
                    <option value="آخر">آخر</option>
                  </select>
                </div>
                {/* Geographic Location */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المحافظة الحالية</label>
                  <select
                    value={editableData.currentHousingGovernorate || ''}
                    onChange={(e) => handleFieldChange('currentHousingGovernorate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">اختر المحافظة</option>
                    {GAZA_LOCATIONS && GAZA_LOCATIONS.map((gov) => (
                      <option key={gov.arabic_name} value={gov.arabic_name}>{gov.arabic_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المنطقة / الحي</label>
                  <select
                    value={editableData.currentHousingRegion || ''}
                    onChange={(e) => handleFieldChange('currentHousingRegion', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    disabled={!editableData.currentHousingGovernorate}
                  >
                    <option value="">اختر المنطقة</option>
                    {availableCurrentAreas && availableCurrentAreas.map((area) => (
                      <option key={area.arabic_name} value={area.arabic_name}>{area.arabic_name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">أقرب معلم معروف</label>
                  <input
                    type="text"
                    value={editableData.currentHousingLandmark || ''}
                    onChange={(e) => handleFieldChange('currentHousingLandmark', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    placeholder="شارع، معلم معروف، وصف للموقع..."
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dp.currentHousingType && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">نوع السكن</span>
                    <span className="font-black text-gray-800">{HOUSING_TYPES[dp.currentHousingType as keyof typeof HOUSING_TYPES] || dp.currentHousingType}</span>
                  </div>
                )}
                {dp.currentHousingSharingStatus && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">حالة مشاركة السكن</span>
                    <span className="font-black text-gray-800">{HOUSING_SHARING_STATUS[dp.currentHousingSharingStatus] || dp.currentHousingSharingStatus}</span>
                  </div>
                )}
                {dp.currentHousingDetailedType && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">النوع المفصل للسكن</span>
                    <span className="font-black text-gray-800">{HOUSING_DETAILED_TYPES[dp.currentHousingDetailedType] || dp.currentHousingDetailedType}</span>
                  </div>
                )}
                {dp.currentHousingFurnished !== undefined && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">مفروش</span>
                    <span className="font-black text-gray-800">{dp.currentHousingFurnished ? 'نعم' : 'لا'}</span>
                  </div>
                )}
                {dp.unitNumber && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">رقم الوحدة</span>
                    <span className="font-black text-gray-800">{dp.unitNumber}</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-gray-500 font-bold text-sm">مناسب للعائلة</span>
                  <span className="font-black text-gray-800">{dp.currentHousingIsSuitable ? 'نعم' : 'لا'}</span>
                </div>
                {dp.currentHousingSanitaryFacilities && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">المرافق الصحية</span>
                    <span className="font-black text-gray-800">{SANITARY_FACILITIES[dp.currentHousingSanitaryFacilities as keyof typeof SANITARY_FACILITIES]}</span>
                  </div>
                )}
                {dp.currentHousingWaterSource && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">مصدر المياه</span>
                    <span className="font-black text-gray-800">{WATER_SOURCES[dp.currentHousingWaterSource as keyof typeof WATER_SOURCES]}</span>
                  </div>
                )}
                {dp.currentHousingElectricityAccess && (
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">مصدر الكهرباء</span>
                    <span className="font-black text-gray-800">{ELECTRICITY_ACCESS[dp.currentHousingElectricityAccess as keyof typeof ELECTRICITY_ACCESS]}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Health Tab - DISABLED */}
      {/* {activeTab === 'health' && (
        <div className="space-y-6">
          <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
            <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                </svg>
              </div>
              الهشاشة (معطل)
            </h3>
            
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-6 text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h4 className="font-black text-gray-800 mb-2">
                نظام درجة الهشاشة معطل حالياً
              </h4>
              <p className="text-gray-600 font-bold text-sm mb-4">
                Vulnerability Score System is Currently Disabled
              </p>
              <p className="text-gray-500 text-xs italic">
                تم تعطيل احتساب درجات الهشاشة في جميع أنحاء النظام. الحقول ذات الصلة بالهشاشة لا تزال موجودة في قاعدة البيانات للاستخدام المستقبلي.
              </p>
            </div>
          </div>
        </div>
      )} */}

      {/* Spouse Tab */}
      {activeTab === 'spouse' && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isMaleHead(isEditMode && editableData ? editableData.headRole : dp.headRole, isEditMode && editableData ? editableData.gender : dp.gender) ? 'bg-pink-100 text-pink-600' : 'bg-blue-100 text-blue-600'}`}>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            {isMaleHead(isEditMode && editableData ? editableData.headRole : dp.headRole, isEditMode && editableData ? editableData.gender : dp.gender) ? 'بيانات الزوجة' : 'بيانات الزوج'}
          </h3>
          {isEditMode && editableData ? (
            <div className="space-y-6">
              {/* Conditional rendering based on head gender */}
              {isMaleHead(editableData.headRole, editableData.gender) ? (
                // WIFE INFORMATION (Male-headed household)
                <div className="bg-pink-50 border-2 border-pink-100 rounded-xl p-4">
                  <h4 className="font-black text-pink-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    بيانات الزوجة
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">اسم الزوجة</label>
                      <input
                        type="text"
                        value={editableData.wifeName || ''}
                        onChange={(e) => handleFieldChange('wifeName', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="اسم الزوجة"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهوية للزوجة</label>
                      <input
                        type="text"
                        value={editableData.wifeNationalId || ''}
                        onChange={(e) => handleFieldChange('wifeNationalId', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="رقم الهوية"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ ميلاد الزوجة</label>
                      <input
                        type="date"
                        value={editableData.wifeDateOfBirth || ''}
                        onChange={(e) => handleFieldChange('wifeDateOfBirth', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">عمر الزوجة</label>
                      <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-black">
                        {dp.wifeDateOfBirth ? calculateAge(dp.wifeDateOfBirth) : dp.wifeAge || '-'}
                        <span className="text-gray-500 text-xs font-bold mr-2">(يتم الاحتساب تلقائياً)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // HUSBAND INFORMATION (Female-headed household)
                <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                  <h4 className="font-black text-blue-800 mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    بيانات الزوج
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">اسم الزوج</label>
                      <input
                        type="text"
                        value={editableData.husbandName || ''}
                        onChange={(e) => handleFieldChange('husbandName', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="اسم الزوج"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهوية للزوج</label>
                      <input
                        type="text"
                        value={editableData.husbandNationalId || ''}
                        onChange={(e) => handleFieldChange('husbandNationalId', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="رقم الهوية"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ ميلاد الزوج</label>
                      <input
                        type="date"
                        value={editableData.husbandDateOfBirth || ''}
                        onChange={(e) => handleFieldChange('husbandDateOfBirth', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">عمر الزوج</label>
                      <div className="px-4 py-3 bg-gray-100 rounded-xl text-gray-700 font-black">
                        {dp.husbandDateOfBirth ? calculateAge(dp.husbandDateOfBirth) : dp.husbandAge || '-'}
                        <span className="text-gray-500 text-xs font-bold mr-2">(يتم الاحتساب تلقائياً)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Pregnancy Information (for wife only - male-headed household) */}
              {isMaleHead(editableData.headRole, editableData.gender) && editableData.wifeName && (
                <div className="border-t pt-4">
                  <h4 className="font-black text-pink-700 mb-3">معلومات الحمل</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="wifeIsPregnant"
                        checked={editableData.wifeIsPregnant || false}
                        onChange={(e) => handleFieldChange('wifeIsPregnant', e.target.checked)}
                        className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                      />
                      <label htmlFor="wifeIsPregnant" className="text-sm font-bold text-gray-700">حامل</label>
                    </div>
                    {editableData.wifeIsPregnant && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">شهر الحمل</label>
                          <input
                            type="number"
                            value={editableData.wifePregnancyMonth || ''}
                            onChange={(e) => handleFieldChange('wifePregnancyMonth', parseInt(e.target.value) || 0)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            placeholder="شهر الحمل"
                            min="1"
                            max="9"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="wifePregnancySpecialNeeds"
                            checked={editableData.wifePregnancySpecialNeeds || false}
                            onChange={(e) => handleFieldChange('wifePregnancySpecialNeeds', e.target.checked)}
                            className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                          />
                          <label htmlFor="wifePregnancySpecialNeeds" className="text-sm font-bold text-gray-700">احتياجات خاصة</label>
                        </div>
                        {editableData.wifePregnancySpecialNeeds && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                            <textarea
                              value={editableData.wifePregnancyFollowupDetails || ''}
                              onChange={(e) => handleFieldChange('wifePregnancyFollowupDetails', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="تفاصيل المتابعة الخاصة بالحمل"
                              rows={2}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* Work Information */}
              <div className="border-t pt-4">
                <h4 className={`font-black mb-3 ${isMaleHead(editableData.headRole, editableData.gender) ? 'text-pink-700' : 'text-blue-700'}`}>معلومات العمل</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {isMaleHead(editableData.headRole, editableData.gender) ? (
                    // Wife work information
                    editableData.wifeName && (
                      <>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="wifeIsWorking"
                            checked={editableData.wifeIsWorking || false}
                            onChange={(e) => handleFieldChange('wifeIsWorking', e.target.checked)}
                            className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                          />
                          <label htmlFor="wifeIsWorking" className="text-sm font-bold text-gray-700">الزوجة تعمل</label>
                        </div>
                        {editableData.wifeIsWorking && (
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">وظيفة الزوجة</label>
                            <input
                              type="text"
                              value={editableData.wifeOccupation || ''}
                              onChange={(e) => handleFieldChange('wifeOccupation', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="الوظيفة"
                            />
                          </div>
                        )}
                      </>
                    )
                  ) : (
                    // Husband work information
                    <>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="husbandIsWorking"
                          checked={editableData.husbandIsWorking || false}
                          onChange={(e) => handleFieldChange('husbandIsWorking', e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="husbandIsWorking" className="text-sm font-bold text-gray-700">الزوج يعمل</label>
                      </div>
                      {editableData.husbandIsWorking && (
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">وظيفة الزوج</label>
                          <input
                            type="text"
                            value={editableData.husbandOccupation || ''}
                            onChange={(e) => handleFieldChange('husbandOccupation', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            placeholder="الوظيفة"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Health Information */}
              <div className="border-t pt-4">
                <h4 className={`font-black mb-3 ${isMaleHead(editableData.headRole, editableData.gender) ? 'text-pink-700' : 'text-blue-700'}`}>الحالة الصحية</h4>
                <div className="space-y-4">
                  {isMaleHead(editableData.headRole, editableData.gender) ? (
                    // Wife health information
                    editableData.wifeName && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">إعاقة الزوجة</label>
                          <select
                            value={editableData.wifeDisabilityType || 'لا يوجد'}
                            onChange={(e) => handleFieldChange('wifeDisabilityType', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          >
                            <option value="لا يوجد">لا يوجد</option>
                            <option value="حركية">حركية</option>
                            <option value="بصرية">بصرية</option>
                            <option value="سمعية">سمعية</option>
                            <option value="ذهنية">ذهنية</option>
                            <option value="أخرى">أخرى</option>
                          </select>
                        </div>
                        {editableData.wifeDisabilityType && editableData.wifeDisabilityType !== 'لا يوجد' && (
                          <>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">شدة الإعاقة</label>
                              <select
                                value={editableData.wifeDisabilitySeverity || ''}
                                onChange={(e) => handleFieldChange('wifeDisabilitySeverity', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              >
                                <option value="">اختر الشدة</option>
                                <option value="بسيطة">بسيطة</option>
                                <option value="متوسطة">متوسطة</option>
                                <option value="شديدة">شديدة</option>
                                <option value="كلية">كلية</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإعاقة</label>
                              <textarea
                                value={editableData.wifeDisabilityDetails || ''}
                                onChange={(e) => handleFieldChange('wifeDisabilityDetails', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                placeholder="تفاصيل الإعاقة"
                                rows={2}
                              />
                            </div>
                          </>
                        )}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">مرض مزمن</label>
                          <select
                            value={editableData.wifeChronicDiseaseType || 'لا يوجد'}
                            onChange={(e) => handleFieldChange('wifeChronicDiseaseType', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          >
                            <option value="لا يوجد">لا يوجد</option>
                            <option value="سكري">سكري</option>
                            <option value="ضغط دم">ضغط دم</option>
                            <option value="قلب">قلب</option>
                            <option value="سرطان">سرطان</option>
                            <option value="ربو">ربو</option>
                            <option value="فشل كلوي">فشل كلوي</option>
                            <option value="مرض نفسي">مرض نفسي</option>
                            <option value="أخرى">أخرى</option>
                          </select>
                        </div>
                        {editableData.wifeChronicDiseaseType && editableData.wifeChronicDiseaseType !== 'لا يوجد' && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المرض المزمن</label>
                            <textarea
                              value={editableData.wifeChronicDiseaseDetails || ''}
                              onChange={(e) => handleFieldChange('wifeChronicDiseaseDetails', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="تفاصيل المرض المزمن"
                              rows={2}
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">إصابة حرب</label>
                          <select
                            value={editableData.wifeWarInjuryType || 'لا يوجد'}
                            onChange={(e) => handleFieldChange('wifeWarInjuryType', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          >
                            <option value="لا يوجد">لا يوجد</option>
                            <option value="بتر">بتر</option>
                            <option value="كسر">كسر</option>
                            <option value="شظية">شظية</option>
                            <option value="حرق">حرق</option>
                            <option value="رأس/وجه">رأس/وجه</option>
                            <option value="عمود فقري">عمود فقري</option>
                            <option value="أخرى">أخرى</option>
                          </select>
                        </div>
                        {editableData.wifeWarInjuryType && editableData.wifeWarInjuryType !== 'لا يوجد' && (
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإصابة الحربية</label>
                            <textarea
                              value={editableData.wifeWarInjuryDetails || ''}
                              onChange={(e) => handleFieldChange('wifeWarInjuryDetails', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="تفاصيل الإصابة الحربية"
                              rows={2}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="wifeMedicalFollowupRequired"
                            checked={editableData.wifeMedicalFollowupRequired || false}
                            onChange={(e) => handleFieldChange('wifeMedicalFollowupRequired', e.target.checked)}
                            className="w-5 h-5 text-pink-600 rounded focus:ring-pink-500"
                          />
                          <label htmlFor="wifeMedicalFollowupRequired" className="text-sm font-bold text-gray-700">تحتاج متابعة طبية</label>
                        </div>
                        {editableData.wifeMedicalFollowupRequired && (
                          <>
                            <div>
                              <label className="block text-sm font-bold text-gray-700 mb-2">تكرار المتابعة</label>
                              <input
                                type="text"
                                value={editableData.wifeMedicalFollowupFrequency || ''}
                                onChange={(e) => handleFieldChange('wifeMedicalFollowupFrequency', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                placeholder="مثال: شهرياً"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                              <textarea
                                value={editableData.wifeMedicalFollowupDetails || ''}
                                onChange={(e) => handleFieldChange('wifeMedicalFollowupDetails', e.target.value)}
                                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                                placeholder="تفاصيل المتابعة الطبية"
                                rows={2}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    )
                  ) : (
                    // Husband health information
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">إعاقة الزوج</label>
                        <select
                          value={editableData.husbandDisabilityType || 'لا يوجد'}
                          onChange={(e) => handleFieldChange('husbandDisabilityType', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        >
                          <option value="لا يوجد">لا يوجد</option>
                          <option value="حركية">حركية</option>
                          <option value="بصرية">بصرية</option>
                          <option value="سمعية">سمعية</option>
                          <option value="ذهنية">ذهنية</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                      </div>
                      {editableData.husbandDisabilityType && editableData.husbandDisabilityType !== 'لا يوجد' && (
                        <>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">شدة الإعاقة</label>
                            <select
                              value={editableData.husbandDisabilitySeverity || ''}
                              onChange={(e) => handleFieldChange('husbandDisabilitySeverity', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">اختر الشدة</option>
                              <option value="بسيطة">بسيطة</option>
                              <option value="متوسطة">متوسطة</option>
                              <option value="شديدة">شديدة</option>
                              <option value="كلية">كلية</option>
                            </select>
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإعاقة</label>
                            <textarea
                              value={editableData.husbandDisabilityDetails || ''}
                              onChange={(e) => handleFieldChange('husbandDisabilityDetails', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="تفاصيل الإعاقة"
                              rows={2}
                            />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">مرض مزمن</label>
                        <select
                          value={editableData.husbandChronicDiseaseType || 'لا يوجد'}
                          onChange={(e) => handleFieldChange('husbandChronicDiseaseType', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        >
                          <option value="لا يوجد">لا يوجد</option>
                          <option value="سكري">سكري</option>
                          <option value="ضغط دم">ضغط دم</option>
                          <option value="قلب">قلب</option>
                          <option value="سرطان">سرطان</option>
                          <option value="ربو">ربو</option>
                          <option value="فشل كلوي">فشل كلوي</option>
                          <option value="مرض نفسي">مرض نفسي</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                      </div>
                      {editableData.husbandChronicDiseaseType && editableData.husbandChronicDiseaseType !== 'لا يوجد' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المرض المزمن</label>
                          <textarea
                            value={editableData.husbandChronicDiseaseDetails || ''}
                            onChange={(e) => handleFieldChange('husbandChronicDiseaseDetails', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            placeholder="تفاصيل المرض المزمن"
                            rows={2}
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">إصابة حرب</label>
                        <select
                          value={editableData.husbandWarInjuryType || 'لا يوجد'}
                          onChange={(e) => handleFieldChange('husbandWarInjuryType', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        >
                          <option value="لا يوجد">لا يوجد</option>
                          <option value="بتر">بتر</option>
                          <option value="كسر">كسر</option>
                          <option value="شظية">شظية</option>
                          <option value="حرق">حرق</option>
                          <option value="رأس/وجه">رأس/وجه</option>
                          <option value="عمود فقري">عمود فقري</option>
                          <option value="أخرى">أخرى</option>
                        </select>
                      </div>
                      {editableData.husbandWarInjuryType && editableData.husbandWarInjuryType !== 'لا يوجد' && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإصابة الحربية</label>
                          <textarea
                            value={editableData.husbandWarInjuryDetails || ''}
                            onChange={(e) => handleFieldChange('husbandWarInjuryDetails', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            placeholder="تفاصيل الإصابة الحربية"
                            rows={2}
                          />
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="husbandMedicalFollowupRequired"
                          checked={editableData.husbandMedicalFollowupRequired || false}
                          onChange={(e) => handleFieldChange('husbandMedicalFollowupRequired', e.target.checked)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="husbandMedicalFollowupRequired" className="text-sm font-bold text-gray-700">يحتاج متابعة طبية</label>
                      </div>
                      {editableData.husbandMedicalFollowupRequired && (
                        <>
                          <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">تكرار المتابعة</label>
                            <input
                              type="text"
                              value={editableData.husbandMedicalFollowupFrequency || ''}
                              onChange={(e) => handleFieldChange('husbandMedicalFollowupFrequency', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="مثال: شهرياً"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                            <textarea
                              value={editableData.husbandMedicalFollowupDetails || ''}
                              onChange={(e) => handleFieldChange('husbandMedicalFollowupDetails', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                              placeholder="تفاصيل المتابعة الطبية"
                              rows={2}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Conditional rendering based on head gender - View Mode */}
              {isMaleHead(dp.headRole, dp.gender) ? (
                // WIFE DATA (Male-headed household)
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">اسم الزوجة</span>
                    <span className="font-black text-gray-800">{dp.wifeName || '-'}</span>
                  </div>
                  {dp.wifeNationalId && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">رقم الهوية</span>
                      <span className="font-black text-gray-800">{dp.wifeNationalId}</span>
                    </div>
                  )}
                  {dp.wifeDateOfBirth && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">تاريخ الميلاد</span>
                      <span className="font-black text-gray-800">{dp.wifeDateOfBirth}</span>
                    </div>
                  )}
                  {(dp.wifeDateOfBirth || dp.wifeAge) && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">العمر</span>
                      <span className="font-black text-gray-800">{dp.wifeDateOfBirth ? calculateAge(dp.wifeDateOfBirth) : dp.wifeAge}</span>
                    </div>
                  )}
                  {dp.wifeIsPregnant && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">الحمل</span>
                      <span className="px-3 py-1 rounded-full font-black text-sm bg-pink-200 text-pink-700">
                        شهر {dp.wifePregnancyMonth}
                      </span>
                    </div>
                  )}
                  {/* Pregnancy Special Needs (Migration 016) */}
                  {dp.wifePregnancySpecialNeeds && (
                    <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-4 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-5 h-5 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-black text-pink-700 text-sm">احتياجات خاصة للحمل</span>
                      </div>
                      {dp.wifePregnancyFollowupDetails && (
                        <p className="text-gray-700 text-sm font-bold pr-4">
                          {dp.wifePregnancyFollowupDetails}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Health Information */}
                  {((dp.wifeDisabilityType && dp.wifeDisabilityType !== 'لا يوجد') ||
                   (dp.wifeChronicDiseaseType && dp.wifeChronicDiseaseType !== 'لا يوجد') ||
                   (dp.wifeWarInjuryType && dp.wifeWarInjuryType !== 'لا يوجد') ||
                   dp.wifeMedicalFollowupRequired) && (
                    <div className="mt-4 pt-4 border-t-2 border-pink-100">
                      <h4 className="font-black text-pink-700 text-sm mb-3">الحالة الصحية</h4>

                      {(dp.wifeDisabilityType && dp.wifeDisabilityType !== 'لا يوجد') && (
                        <div className="py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm block mb-1">نوع الإعاقة</span>
                          <span className="font-black text-gray-800">{dp.wifeDisabilityType}</span>
                          {dp.wifeDisabilitySeverity && (
                            <span className="block mt-1 text-xs text-gray-600">الشدة: {dp.wifeDisabilitySeverity}</span>
                          )}
                          {dp.wifeDisabilityDetails && (
                            <p className="mt-1 text-sm text-gray-700 font-bold">{dp.wifeDisabilityDetails}</p>
                          )}
                        </div>
                      )}

                      {(dp.wifeChronicDiseaseType && dp.wifeChronicDiseaseType !== 'لا يوجد') && (
                        <div className="py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm block mb-1">المرض المزمن</span>
                          <span className="font-black text-gray-800">{dp.wifeChronicDiseaseType}</span>
                          {dp.wifeChronicDiseaseDetails && (
                            <p className="mt-1 text-sm text-gray-700 font-bold">{dp.wifeChronicDiseaseDetails}</p>
                          )}
                        </div>
                      )}

                      {(dp.wifeWarInjuryType && dp.wifeWarInjuryType !== 'لا يوجد') && (
                        <div className="py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm block mb-1">إصابة الحرب</span>
                          <span className="font-black text-gray-800">{dp.wifeWarInjuryType}</span>
                          {dp.wifeWarInjuryDetails && (
                            <p className="mt-1 text-sm text-gray-700 font-bold">{dp.wifeWarInjuryDetails}</p>
                          )}
                        </div>
                      )}

                      {dp.wifeMedicalFollowupRequired && (
                        <div className="py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm block mb-1">المتابعة الطبية</span>
                          <span className="font-black text-gray-800">مطلوب</span>
                          {dp.wifeMedicalFollowupFrequency && (
                            <p className="text-gray-600 text-sm mt-1">{dp.wifeMedicalFollowupFrequency}</p>
                          )}
                          {dp.wifeMedicalFollowupDetails && (
                            <p className="text-gray-600 text-sm mt-1">{dp.wifeMedicalFollowupDetails}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Work Information */}
                  {dp.wifeIsWorking && (
                    <div className="mt-4 pt-4 border-t-2 border-pink-100">
                      <h4 className="font-black text-pink-700 text-sm mb-3">معلومات العمل</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm">الزوجة تعمل</span>
                          <span className="px-3 py-1 rounded-full font-black text-sm bg-emerald-200 text-emerald-700">
                            نعم
                          </span>
                        </div>
                        {dp.wifeOccupation && (
                          <div className="py-2">
                            <span className="text-gray-500 font-bold text-sm block mb-1">الوظيفة</span>
                            <span className="font-black text-gray-800">{dp.wifeOccupation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {!dp.wifeName && (
                    <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد بيانات الزوجة</p>
                  )}
                </>
              ) : (
                // HUSBAND DATA (Female-headed household)
                <>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-500 font-bold text-sm">اسم الزوج</span>
                    <span className="font-black text-gray-800">{dp.husbandName || '-'}</span>
                  </div>
                  {dp.husbandNationalId && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">رقم الهوية</span>
                      <span className="font-black text-gray-800">{dp.husbandNationalId}</span>
                    </div>
                  )}
                  {dp.husbandDateOfBirth && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">تاريخ الميلاد</span>
                      <span className="font-black text-gray-800">{dp.husbandDateOfBirth}</span>
                    </div>
                  )}
                  {(dp.husbandDateOfBirth || dp.husbandAge) && (
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-500 font-bold text-sm">العمر</span>
                      <span className="font-black text-gray-800">{dp.husbandDateOfBirth ? calculateAge(dp.husbandDateOfBirth) : dp.husbandAge}</span>
                    </div>
                  )}

                  {/* Health Information */}
                  {((dp.husbandDisabilityType && dp.husbandDisabilityType !== 'لا يوجد') ||
                   (dp.husbandChronicDiseaseType && dp.husbandChronicDiseaseType !== 'لا يوجد') ||
                   (dp.husbandWarInjuryType && dp.husbandWarInjuryType !== 'لا يوجد') ||
                   dp.husbandMedicalFollowupRequired) && (
                    <div className="mt-4 pt-4 border-t-2 border-blue-100">
                      <h4 className="font-black text-blue-700 text-sm mb-3">الحالة الصحية</h4>

                      {(dp.husbandDisabilityType && dp.husbandDisabilityType !== 'لا يوجد') && (
                        <div className="py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm block mb-1">نوع الإعاقة</span>
                          <span className="font-black text-gray-800">{dp.husbandDisabilityType}</span>
                          {dp.husbandDisabilitySeverity && (
                            <span className="block mt-1 text-xs text-gray-600">الشدة: {dp.husbandDisabilitySeverity}</span>
                          )}
                          {dp.husbandDisabilityDetails && (
                            <p className="mt-1 text-sm text-gray-700 font-bold">{dp.husbandDisabilityDetails}</p>
                          )}
                        </div>
                      )}

                      {(dp.husbandChronicDiseaseType && dp.husbandChronicDiseaseType !== 'لا يوجد') && (
                        <div className="py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm block mb-1">المرض المزمن</span>
                          <span className="font-black text-gray-800">{dp.husbandChronicDiseaseType}</span>
                          {dp.husbandChronicDiseaseDetails && (
                            <p className="mt-1 text-sm text-gray-700 font-bold">{dp.husbandChronicDiseaseDetails}</p>
                          )}
                        </div>
                      )}

                      {(dp.husbandWarInjuryType && dp.husbandWarInjuryType !== 'لا يوجد') && (
                        <div className="py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm block mb-1">إصابة الحرب</span>
                          <span className="font-black text-gray-800">{dp.husbandWarInjuryType}</span>
                          {dp.husbandWarInjuryDetails && (
                            <p className="mt-1 text-sm text-gray-700 font-bold">{dp.husbandWarInjuryDetails}</p>
                          )}
                        </div>
                      )}

                      {dp.husbandMedicalFollowupRequired && (
                        <div className="py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm block mb-1">المتابعة الطبية</span>
                          <span className="font-black text-gray-800">مطلوب</span>
                          {dp.husbandMedicalFollowupFrequency && (
                            <p className="text-gray-600 text-sm mt-1">{dp.husbandMedicalFollowupFrequency}</p>
                          )}
                          {dp.husbandMedicalFollowupDetails && (
                            <p className="text-gray-600 text-sm mt-1">{dp.husbandMedicalFollowupDetails}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Work Information */}
                  {dp.husbandIsWorking && (
                    <div className="mt-4 pt-4 border-t-2 border-blue-100">
                      <h4 className="font-black text-blue-700 text-sm mb-3">معلومات العمل</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                          <span className="text-gray-500 font-bold text-sm">الزوج يعمل</span>
                          <span className="px-3 py-1 rounded-full font-black text-sm bg-emerald-200 text-emerald-700">
                            نعم
                          </span>
                        </div>
                        {dp.husbandOccupation && (
                          <div className="py-2">
                            <span className="text-gray-500 font-bold text-sm block mb-1">الوظيفة</span>
                            <span className="font-black text-gray-800">{dp.husbandOccupation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {!dp.husbandName && (
                    <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد بيانات الزوج</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <h3 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            الوثائق والمستندات
          </h3>
          {isEditMode && editableData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Card URL - FileUpload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">البطاقة الشخصية</label>
                <FileUpload
                  existingFileUrl={editableData.idCardUrl}
                  onRemoveFile={() => handleFieldChange('idCardUrl', '')}
                  onFileUpload={(url) => handleFieldChange('idCardUrl', url)}
                  allowedTypes={['.jpg', '.jpeg', '.png', '.pdf']}
                  maxSizeInMB={5}
                  bucketName="id-cards"
                  folderPath="dp-documents"
                  label=""
                  buttonLabel="رفع البطاقة الشخصية"
                  optional={true}
                />
              </div>

              {/* Medical Report URL - FileUpload */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">التقرير الطبي</label>
                <FileUpload
                  existingFileUrl={editableData.medicalReportUrl}
                  onRemoveFile={() => handleFieldChange('medicalReportUrl', '')}
                  onFileUpload={(url) => handleFieldChange('medicalReportUrl', url)}
                  allowedTypes={['.jpg', '.jpeg', '.png', '.pdf']}
                  maxSizeInMB={5}
                  bucketName="medical-reports"
                  folderPath="dp-documents"
                  label=""
                  buttonLabel="رفع التقرير الطبي"
                  optional={true}
                />
              </div>

              {/* Signature URL - FileUpload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">التوقيع</label>
                <FileUpload
                  existingFileUrl={editableData.signatureUrl}
                  onRemoveFile={() => handleFieldChange('signatureUrl', '')}
                  onFileUpload={(url) => handleFieldChange('signatureUrl', url)}
                  allowedTypes={['.jpg', '.jpeg', '.png', '.pdf']}
                  maxSizeInMB={5}
                  bucketName="signatures"
                  folderPath="dp-documents"
                  label=""
                  buttonLabel="رفع التوقيع"
                  optional={true}
                />
              </div>

              <div className="md:col-span-2 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-black text-amber-800 text-sm">ملاحظة مهمة</p>
                    <p className="text-amber-700 text-sm mt-1">
                      يرجى رفع صور واضحة. الحد الأقصى لحجم الملف هو 5 ميغابايت. الأنواع المسموحة: JPG, PNG, PDF.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 font-bold text-sm mb-3">البطاقة الشخصية</p>
                {dp.idCardUrl ? (
                  <img
                    src={dp.idCardUrl}
                    alt="البطاقة الشخصية"
                    className="w-full h-auto object-contain rounded-2xl border-4 border-dashed border-purple-400 shadow-lg bg-white p-2"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-white to-gray-100 rounded-2xl border-4 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-gray-500 font-bold text-sm">لا توجد بطاقة شخصية</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {dp.medicalReportUrl ? (
                  <a
                    href={dp.medicalReportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all border border-blue-200"
                  >
                    <div className="w-12 h-12 bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-black text-blue-800">التقرير الطبي</p>
                      <p className="text-blue-600 text-sm font-bold">اضغط للعرض</p>
                    </div>
                  </a>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                    <p className="text-gray-500 font-bold text-sm">لا يوجد تقرير طبي</p>
                  </div>
                )}
                {dp.signatureUrl ? (
                  <a
                    href={dp.signatureUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all border border-green-200"
                  >
                    <div className="w-12 h-12 bg-green-200 text-green-600 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732a1 1 0 011.414 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-black text-green-800">التوقيع</p>
                      <p className="text-green-600 text-sm font-bold">اضغط للعرض</p>
                    </div>
                  </a>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200 text-center">
                    <p className="text-gray-500 font-bold text-sm">لا يوجد توقيع</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">تأكيد الإلغاء</h3>
              <p className="text-gray-600 font-bold">هل أنت متأكد من إلغاء التغييرات؟ سيتم فقدان جميع التغييرات غير المحفوظة.</p>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                تراجع
              </button>
              <button
                onClick={confirmCancel}
                className="flex-1 px-4 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all"
              >
                نعم، إلغاء التغييرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Family Member Modal */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800">
                {editingMemberIndex !== null ? 'تعديل بيانات الفرد' : 'إضافة فرد جديد'}
              </h3>
              <button
                onClick={() => setShowMemberModal(false)}
                disabled={isSaving}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all disabled:opacity-50"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
              {/* Section 1: Basic Information (المعلومات الأساسية) */}
              <div className="bg-blue-50 rounded-xl p-4">
                <h4 className="font-black text-blue-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  المعلومات الأساسية
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 4-Part Name Fields */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الأول *</label>
                    <input
                      type="text"
                      value={tempMember.firstName || ''}
                      onChange={(e) => handleMemberChange('firstName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="الاسم الأول"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم الأب *</label>
                    <input
                      type="text"
                      value={tempMember.fatherName || ''}
                      onChange={(e) => handleMemberChange('fatherName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="اسم الأب"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم الجد</label>
                    <input
                      type="text"
                      value={tempMember.grandfatherName || ''}
                      onChange={(e) => handleMemberChange('grandfatherName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="اسم الجد"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">اسم العائلة *</label>
                    <input
                      type="text"
                      value={tempMember.familyName || ''}
                      onChange={(e) => handleMemberChange('familyName', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="اسم العائلة"
                    />
                  </div>

                  {/* National ID */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهوية *</label>
                    <input
                      type="text"
                      value={tempMember.nationalId || ''}
                      onChange={(e) => handleMemberChange('nationalId', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="أدخل رقم الهوية (8-9 أرقام)"
                      dir="ltr"
                    />
                  </div>

                  {/* Gender */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الجنس *</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleMemberChange('gender', 'ذكر')}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                          tempMember.gender === 'ذكر'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ذكر
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMemberChange('gender', 'أنثى')}
                        className={`flex-1 px-4 py-3 rounded-xl font-bold transition-all ${
                          tempMember.gender === 'أنثى'
                            ? 'bg-pink-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        أنثى
                      </button>
                    </div>
                  </div>

                  {/* Date of Birth & Age */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الميلاد *</label>
                    <input
                      type="date"
                      value={tempMember.dateOfBirth || ''}
                      onChange={(e) => handleMemberChange('dateOfBirth', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">العمر</label>
                    <input
                      type="number"
                      value={tempMember.age || ''}
                      readOnly
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-600 focus:outline-none"
                      placeholder="يتم الحساب تلقائياً"
                    />
                    <p className="text-xs text-gray-500 mt-1">يتم حساب العمر تلقائياً من تاريخ الميلاد</p>
                  </div>

                  {/* Relation to Head */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">الصلة برأس العائلة *</label>
                    <select
                      value={tempMember.relation || ''}
                      onChange={(e) => handleMemberChange('relation', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">اختر الصلة</option>
                      <option value="الابن">الابن</option>
                      <option value="البنت">البنت</option>
                      <option value="الجد">الجد</option>
                      <option value="الجدة">الجدة</option>
                      <option value="الحفيد">الحفيد</option>
                      <option value="الحفيدة">الحفيدة</option>
                      <option value="العم">العم</option>
                      <option value="العمة">العمة</option>
                      <option value="الخال">الخال</option>
                      <option value="الخالة">الخالة</option>
                      <option value="ابن الأخ">ابن الأخ</option>
                      <option value="ابنة الأخ">ابنة الأخ</option>
                      <option value="ابن العم">ابن العم</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Education & Work (التعليم والعمل) */}
              <div className="bg-green-50 rounded-xl p-4">
                <h4 className="font-black text-green-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  التعليم والعمل
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Is Studying */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isStudying"
                      checked={tempMember.isStudying || false}
                      onChange={(e) => handleMemberChange('isStudying', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <label htmlFor="isStudying" className="text-sm font-bold text-gray-700">هل يدرس؟</label>
                  </div>

                  {/* Education Stage */}
                  {tempMember.isStudying && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المرحلة الدراسية</label>
                      <select
                        value={tempMember.educationStage || 'لا يدرس'}
                        onChange={(e) => handleMemberChange('educationStage', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      >
                        <option value="لا يدرس">لا يدرس</option>
                        <option value="ابتدائي">ابتدائي</option>
                        <option value="إعدادي/ثانوي">إعدادي/ثانوي</option>
                        <option value="جامعي">جامعي</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                  )}

                  {/* Is Working */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isWorking"
                      checked={tempMember.isWorking || false}
                      onChange={(e) => handleMemberChange('isWorking', e.target.checked)}
                      className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                    />
                    <label htmlFor="isWorking" className="text-sm font-bold text-gray-700">هل يعمل؟</label>
                  </div>

                  {/* Occupation */}
                  {tempMember.isWorking && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المهنة</label>
                      <input
                        type="text"
                        value={tempMember.occupation || ''}
                        onChange={(e) => handleMemberChange('occupation', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="المهنة"
                      />
                    </div>
                  )}

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهاتف</label>
                    <input
                      type="tel"
                      value={tempMember.phoneNumber || ''}
                      onChange={(e) => handleMemberChange('phoneNumber', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      placeholder="05xxxxxxxx"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Marital Status (الحالة الاجتماعية) */}
              <div className="bg-purple-50 rounded-xl p-4">
                <h4 className="font-black text-purple-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  الحالة الاجتماعية
                </h4>
                
                <div>
                  <select
                    value={tempMember.maritalStatus || 'أعزب/عزباء'}
                    onChange={(e) => handleMemberChange('maritalStatus', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                  >
                    <option value="أعزب/عزباء">أعزب/عزباء</option>
                    <option value="متزوج/ة">متزوج/ة</option>
                    <option value="أرمل/ة">أرمل/ة</option>
                    <option value="مطلق/ة">مطلق/ة</option>
                    <option value="حالة خاصة">حالة خاصة</option>
                  </select>
                </div>
              </div>

              {/* Section 4: Health Status (الحالة الصحية) */}
              <div className="bg-amber-50 rounded-xl p-4">
                <h4 className="font-black text-amber-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  الحالة الصحية
                </h4>

                <div className="space-y-4">
                  {/* Disability */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإعاقة</label>
                      <select
                        value={tempMember.disabilityType || 'لا يوجد'}
                        onChange={(e) => handleMemberChange('disabilityType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      >
                        <option value="لا يوجد">لا يوجد</option>
                        <option value="حركية">حركية</option>
                        <option value="بصرية">بصرية</option>
                        <option value="سمعية">سمعية</option>
                        <option value="ذهنية">ذهنية</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                    {tempMember.disabilityType && tempMember.disabilityType !== 'لا يوجد' && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">درجة الإعاقة</label>
                        <select
                          value={tempMember.disabilitySeverity || ''}
                          onChange={(e) => handleMemberChange('disabilitySeverity', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">اختر الشدة</option>
                          <option value="بسيطة">بسيطة</option>
                          <option value="متوسطة">متوسطة</option>
                          <option value="شديدة">شديدة</option>
                          <option value="كلية">كلية</option>
                        </select>
                      </div>
                    )}
                  </div>
                  {tempMember.disabilityType && tempMember.disabilityType !== 'لا يوجد' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإعاقة</label>
                      <textarea
                        value={tempMember.disabilityDetails || ''}
                        onChange={(e) => handleMemberChange('disabilityDetails', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="اكتب تفاصيل الإعاقة..."
                        rows={2}
                      />
                    </div>
                  )}

                  {/* Chronic Disease */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">المرض المزمن</label>
                      <select
                        value={tempMember.chronicDiseaseType || 'لا يوجد'}
                        onChange={(e) => handleMemberChange('chronicDiseaseType', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                      >
                        <option value="لا يوجد">لا يوجد</option>
                        <option value="سكري">سكري</option>
                        <option value="ضغط دم">ضغط دم</option>
                        <option value="قلب">قلب</option>
                        <option value="سرطان">سرطان</option>
                        <option value="ربو">ربو</option>
                        <option value="فشل كلوي">فشل كلوي</option>
                        <option value="مرض نفسي">مرض نفسي</option>
                        <option value="أخرى">أخرى</option>
                      </select>
                    </div>
                  </div>
                  {tempMember.chronicDiseaseType && tempMember.chronicDiseaseType !== 'لا يوجد' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المرض المزمن</label>
                      <textarea
                        value={tempMember.chronicDiseaseDetails || ''}
                        onChange={(e) => handleMemberChange('chronicDiseaseDetails', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                        placeholder="اكتب تفاصيل المرض المزمن..."
                        rows={2}
                      />
                    </div>
                  )}

                  {/* War Injury */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="checkbox"
                        id="hasWarInjury"
                        checked={tempMember.hasWarInjury || false}
                        onChange={(e) => handleMemberChange('hasWarInjury', e.target.checked)}
                        className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                      />
                      <label htmlFor="hasWarInjury" className="text-sm font-bold text-gray-700">إصابة حرب</label>
                    </div>
                    {tempMember.hasWarInjury && (
                      <>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">نوع الإصابة</label>
                          <select
                            value={tempMember.warInjuryType || 'لا يوجد'}
                            onChange={(e) => handleMemberChange('warInjuryType', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          >
                            <option value="لا يوجد">لا يوجد</option>
                            <option value="بتر">بتر</option>
                            <option value="كسر">كسر</option>
                            <option value="شظية">شظية</option>
                            <option value="حرق">حرق</option>
                            <option value="رأس/وجه">رأس/وجه</option>
                            <option value="عمود فقري">عمود فقري</option>
                            <option value="أخرى">أخرى</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل الإصابة</label>
                          <textarea
                            value={tempMember.warInjuryDetails || ''}
                            onChange={(e) => handleMemberChange('warInjuryDetails', e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                            placeholder="اكتب تفاصيل الإصابة..."
                            rows={2}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 5: Medical Follow-up (المتابعة الطبية) */}
              <div className="bg-red-50 rounded-xl p-4">
                <h4 className="font-black text-red-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                  </svg>
                  المتابعة الطبية
                </h4>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="medicalFollowupRequired"
                      checked={tempMember.medicalFollowupRequired || false}
                      onChange={(e) => handleMemberChange('medicalFollowupRequired', e.target.checked)}
                      className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                    />
                    <label htmlFor="medicalFollowupRequired" className="text-sm font-bold text-gray-700">يحتاج متابعة طبية</label>
                  </div>

                  {tempMember.medicalFollowupRequired && (
                    <>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">تكرار المتابعة</label>
                        <input
                          type="text"
                          value={tempMember.medicalFollowupFrequency || ''}
                          onChange={(e) => handleMemberChange('medicalFollowupFrequency', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          placeholder="مثال: شهرياً، أسبوعياً..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                        <textarea
                          value={tempMember.medicalFollowupDetails || ''}
                          onChange={(e) => handleMemberChange('medicalFollowupDetails', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none"
                          placeholder="اكتب تفاصيل المتابعة الطبية..."
                          rows={2}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 pt-4 border-t">
              {editingMemberIndex !== null && (
                <button
                  onClick={() => deleteMember(editingMemberIndex)}
                  disabled={isSaving}
                  className="px-4 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-all disabled:opacity-50"
                >
                  حذف
                </button>
              )}
              <button
                onClick={() => setShowMemberModal(false)}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={saveMember}
                disabled={isSaving}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري الحفظ...
                  </>
                ) : (
                  editingMemberIndex !== null ? 'حفظ التعديلات' : 'إضافة'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Individual Modal */}
      {showViewMemberModal && viewingMemberIndex !== null && (isEditMode ? editableFamilyMembers : familyMembers)[viewingMemberIndex] && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                عرض بيانات الفرد
              </h3>
              <button
                onClick={() => setShowViewMemberModal(false)}
                className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6 max-h-[70vh] overflow-y-auto p-2">
              {(() => {
                const member = (isEditMode ? editableFamilyMembers : familyMembers)[viewingMemberIndex];
                return (
                  <>
                    {/* Section 1: Basic Information */}
                    <div className="bg-blue-50 rounded-xl p-4">
                      <h4 className="font-black text-blue-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        المعلومات الأساسية
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">الاسم الكامل</p>
                          <p className="font-black text-gray-800">{member.name || `${member.firstName} ${member.fatherName} ${member.grandfatherName} ${member.familyName}`.trim()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">رقم الهوية</p>
                          <p className="font-black text-gray-800 dir-ltr">{member.nationalId || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">الجنس</p>
                          <p className="font-black text-gray-800">{member.gender === 'ذكر' ? 'ذكر' : 'أنثى'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">تاريخ الميلاد</p>
                          <p className="font-black text-gray-800">{member.dateOfBirth || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">العمر</p>
                          <p className="font-black text-gray-800">{member.age || '-'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">الصلة</p>
                          <p className="font-black text-gray-800">{translateRelation(member.relation)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Section 2: Education & Work */}
                    <div className="bg-green-50 rounded-xl p-4">
                      <h4 className="font-black text-green-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        التعليم والعمل
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">هل يدرس؟</p>
                          <p className="font-black text-gray-800">{member.isStudying ? 'نعم' : 'لا'}</p>
                        </div>
                        {member.isStudying && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">المرحلة الدراسية</p>
                            <p className="font-black text-gray-800">{member.educationStage || '-'}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-gray-500 text-xs font-bold mb-1">هل يعمل؟</p>
                          <p className="font-black text-gray-800">{member.isWorking ? 'نعم' : 'لا'}</p>
                        </div>
                        {member.isWorking && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">المهنة</p>
                            <p className="font-black text-gray-800">{member.occupation || '-'}</p>
                          </div>
                        )}
                        {member.phoneNumber && (
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">رقم الهاتف</p>
                            <p className="font-black text-gray-800 dir-ltr">{member.phoneNumber}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Section 3: Marital Status */}
                    <div className="bg-purple-50 rounded-xl p-4">
                      <h4 className="font-black text-purple-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        الحالة الاجتماعية
                      </h4>
                      <div>
                        <p className="text-gray-500 text-xs font-bold mb-1">الحالة الاجتماعية</p>
                        <p className="font-black text-gray-800">
                          {member.maritalStatus || '-'}
                        </p>
                      </div>
                    </div>

                    {/* Section 4: Health Status */}
                    <div className="bg-amber-50 rounded-xl p-4">
                      <h4 className="font-black text-amber-800 mb-4 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        الحالة الصحية
                      </h4>
                      <div className="space-y-4">
                        {/* Disability */}
                        {member.disabilityType && member.disabilityType !== 'لا يوجد' && (
                          <div className="border border-red-200 rounded-lg p-3 bg-red-50">
                            <p className="font-black text-red-800 mb-2">الإعاقة</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <p className="text-gray-500 text-xs font-bold mb-1">النوع</p>
                                <p className="font-black text-gray-800">{member.disabilityType}</p>
                              </div>
                              {member.disabilitySeverity && (
                                <div>
                                  <p className="text-gray-500 text-xs font-bold mb-1">الدرجة</p>
                                  <p className="font-black text-gray-800">{member.disabilitySeverity}</p>
                                </div>
                              )}
                            </div>
                            {member.disabilityDetails && (
                              <div className="mt-2">
                                <p className="text-gray-500 text-xs font-bold mb-1">التفاصيل</p>
                                <p className="text-gray-700 text-sm">{member.disabilityDetails}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Chronic Disease */}
                        {member.chronicDiseaseType && member.chronicDiseaseType !== 'لا يوجد' && (
                          <div className="border border-orange-200 rounded-lg p-3 bg-orange-50">
                            <p className="font-black text-orange-800 mb-2">المرض المزمن</p>
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">النوع</p>
                              <p className="font-black text-gray-800">{member.chronicDiseaseType}</p>
                            </div>
                            {member.chronicDiseaseDetails && (
                              <div className="mt-2">
                                <p className="text-gray-500 text-xs font-bold mb-1">التفاصيل</p>
                                <p className="text-gray-700 text-sm">{member.chronicDiseaseDetails}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* War Injury */}
                        {member.hasWarInjury && member.warInjuryType && member.warInjuryType !== 'لا يوجد' && (
                          <div className="border border-purple-200 rounded-lg p-3 bg-purple-50">
                            <p className="font-black text-purple-800 mb-2">إصابة حرب</p>
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">النوع</p>
                              <p className="font-black text-gray-800">{member.warInjuryType}</p>
                            </div>
                            {member.warInjuryDetails && (
                              <div className="mt-2">
                                <p className="text-gray-500 text-xs font-bold mb-1">التفاصيل</p>
                                <p className="text-gray-700 text-sm">{member.warInjuryDetails}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* No conditions */}
                        {(!member.disabilityType || member.disabilityType === 'لا يوجد') &&
                         (!member.chronicDiseaseType || member.chronicDiseaseType === 'لا يوجد') &&
                         (!member.hasWarInjury || !member.warInjuryType || member.warInjuryType === 'لا يوجد') && (
                          <p className="text-gray-500 text-sm font-bold text-center py-4">لا توجد حالات صحية</p>
                        )}
                      </div>
                    </div>

                    {/* Section 5: Medical Follow-up */}
                    {member.medicalFollowupRequired && (
                      <div className="bg-red-50 rounded-xl p-4">
                        <h4 className="font-black text-red-800 mb-4 flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                          </svg>
                          المتابعة الطبية
                        </h4>
                        <div className="space-y-3">
                          <div>
                            <p className="text-gray-500 text-xs font-bold mb-1">تكرار المتابعة</p>
                            <p className="font-black text-gray-800">{member.medicalFollowupFrequency || '-'}</p>
                          </div>
                          {member.medicalFollowupDetails && (
                            <div>
                              <p className="text-gray-500 text-xs font-bold mb-1">تفاصيل المتابعة</p>
                              <p className="text-gray-700 text-sm">{member.medicalFollowupDetails}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="flex justify-end mt-6 pt-4 border-t">
              <button
                onClick={() => setShowViewMemberModal(false)}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="flex justify-center pb-6">
        <button
          onClick={() => navigate('/admin/dp-management')}
          className="px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          العودة للإدارة المركزية
        </button>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                نقل عائلة إلى مخيم آخر
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">المخيم الهدف *</label>
                  <select
                    value={transferData.targetCampId}
                    onChange={(e) => setTransferData({ ...transferData, targetCampId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all font-bold"
                    disabled={loadingCamps}
                  >
                    <option value="">اختر المخيم</option>
                    {camps.map(camp => (
                      <option key={camp.id} value={camp.id}>{camp.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">سبب النقل</label>
                  <textarea
                    value={transferData.reason}
                    onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all font-bold"
                    placeholder="اكتب سبب النقل..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات الإدارة</label>
                  <textarea
                    value={transferData.adminNotes}
                    onChange={(e) => setTransferData({ ...transferData, adminNotes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all font-bold"
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleTransfer}
                  disabled={isSaving || !transferData.targetCampId}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-xl font-bold hover:from-orange-700 hover:to-orange-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'جاري النقل...' : 'نقل العائلة'}
                </button>
                <button
                  onClick={() => setShowTransferModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Override Decision Modal */}
      {showOverrideModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl">
            <div className="p-6">
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                تغيير حالة العائلة - قرار الإدارة المركزية
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">الحالة الجديدة *</label>
                  <select
                    value={overrideData.newStatus}
                    onChange={(e) => setOverrideData({ ...overrideData, newStatus: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold"
                  >
                    <option value="قيد الانتظار">قيد الانتظار</option>
                    <option value="موافق">موافق</option>
                    <option value="مرفوض">مرفوض</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">سبب التغيير</label>
                  <textarea
                    value={overrideData.reason}
                    onChange={(e) => setOverrideData({ ...overrideData, reason: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold"
                    placeholder="اكتب سبب تغيير الحالة..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">ملاحظات الإدارة</label>
                  <textarea
                    value={overrideData.adminNotes}
                    onChange={(e) => setOverrideData({ ...overrideData, adminNotes: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold"
                    placeholder="ملاحظات إضافية..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={handleOverride}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-bold hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'جاري التغيير...' : 'تغيير الحالة'}
                </button>
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Permissions Modal */}
      {showFieldPermissionsModal && dp?.id && (
        <FieldPermissionsModal
          familyId={dp.id}
          onClose={() => setShowFieldPermissionsModal(false)}
        />
      )}
    </div>
  );
};

export default DPDetails;
