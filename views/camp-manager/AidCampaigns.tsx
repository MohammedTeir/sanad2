// views/camp-manager/AidCampaigns.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { SearchInput, DateRangeFilter, MultiSelectFilter, FilterPanel } from '../../components/filters';
import { normalizeArabic, matchesArabicSearchMulti } from '../../utils/arabicTextUtils';

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
  inventoryItemId?: string;  // Link to specific inventory item
  createdAt: string;
  updatedAt: string;
  // Soft delete fields
  isDeleted?: boolean;
  deletedAt?: string;
}

interface Family {
  id: string;
  head_of_family_name: string;
  head_of_family_national_id?: string;
  head_of_family_phone_number?: string;
  total_members_count: number;
  current_housing_camp_id?: string;
  // Vulnerability fields
  vulnerabilityScore?: number;
  vulnerabilityPriority?: 'عالي جداً' | 'عالي' | 'متوسط' | 'منخفض';
  vulnerabilityBreakdown?: {
    childPoints?: number;
    seniorPoints?: number;
    disabilityPoints?: number;
    chronicPoints?: number;
    warInjuryPoints?: number;
    pregnancyPoints?: number;
    absencePoints?: number;
    housingPoints?: number;
    incomePoints?: number;
    orphanPoints?: number;
  };
  childCount?: number;
  seniorCount?: number;
  orphanCount?: number;
  monthlyIncome?: number;
  isEmployed?: boolean;
  maritalStatus?: 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل' | 'أسرة هشة';
  housingType?: 'خيمة' | 'بيت إسمنتي' | 'شقة' | 'مشتركة' | 'أخرى';
  hasPoorSanitary?: boolean;
  pregnancyMonth?: number;
  // Head of family fields
  headHasDisability?: boolean;
  headDisabilityType?: 'جسدية' | 'بصرية' | 'سمعية' | 'نطق' | 'عقلية' | 'أخرى';
  headHasChronicDisease?: boolean;
  headChronicDiseaseType?: 'سكري' | 'ضغط' | 'سرطان' | 'فشل كلوي' | 'قلب' | 'تنفسية' | 'أخرى';
  headHasWarInjury?: boolean;
  headWarInjuryType?: 'بتر' | 'رأس/وجه' | 'عمود فقري' | 'أخرى';
  // Wife fields
  wifeHasDisability?: boolean;
  wifeDisabilityType?: 'جسدية' | 'بصرية' | 'سمعية' | 'نطق' | 'عقلية' | 'أخرى';
  wifeHasChronicDisease?: boolean;
  wifeChronicDiseaseType?: 'سكري' | 'ضغط' | 'سرطان' | 'فشل كلوي' | 'قلب' | 'تنفسية' | 'أخرى';
  wifeHasWarInjury?: boolean;
  wifeWarInjuryType?: 'بتر' | 'رأس/وجه' | 'عمود فقري' | 'أخرى';
  // All individuals aggregated fields
  individualsDisabilityCount?: number;
  individualsDisabilityTypes?: string[];
  individualsChronicCount?: number;
  individualsChronicTypes?: string[];
  individualsWarInjuryCount?: number;
  individualsWarInjuryTypes?: string[];
  // Combined flags for filtering
  hasDisability?: boolean;
  disabilityTypes?: string[];
  hasChronicDisease?: boolean;
  chronicDiseaseTypes?: string[];
  hasWarInjury?: boolean;
  warInjuryTypes?: string[];
  hasPregnancy?: boolean;
}

interface InventoryItem {
  id: string;
  name?: string;
  nameAr?: string;
  unit?: string;
  unitAr?: string;
  quantity_available?: number;
  quantityAvailable?: number;
  category: string;
  is_active?: boolean;
  isActive?: boolean;
}

const AID_CATEGORIES = [
  { value: 'غذائية', label: 'غذائية', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'غير غذائية', label: 'غير غذائية', color: 'bg-blue-100 text-blue-700' },
  { value: 'طبية', label: 'طبية', color: 'bg-red-100 text-red-700' },
  { value: 'نقدية', label: 'نقدية', color: 'bg-amber-100 text-amber-700' },
  { value: 'مأوى', label: 'مأوى', color: 'bg-orange-100 text-orange-700' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700' }
];

const STATUS_CONFIG = {
  'مخططة': { label: 'مخططة', color: 'bg-blue-100 text-blue-700' },
  'نشطة': { label: 'نشطة', color: 'bg-green-100 text-green-700' },
  'مكتملة': { label: 'مكتملة', color: 'bg-gray-100 text-gray-700' },
  'ملغاة': { label: 'ملغاة', color: 'bg-red-100 text-red-700' }
};

const VULNERABILITY_LEVELS = [
  { value: 'عالي جداً', label: 'عالي جداً', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'عالي', label: 'عالي', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'متوسط', label: 'متوسط', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'منخفض', label: 'منخفض', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
];

const DISABILITY_TYPES = [
  { value: 'جسدية', label: 'جسدية', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'بصرية', label: 'بصرية', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'سمعية', label: 'سمعية', color: 'bg-pink-50 text-pink-700 border-pink-200' },
  { value: 'نطق', label: 'نطق', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'عقلية', label: 'عقلية', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const CHRONIC_DISEASE_TYPES = [
  { value: 'سكري', label: 'سكري', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'ضغط', label: 'ضغط', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'سرطان', label: 'سرطان', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'فشل كلوي', label: 'فشل كلوي', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'قلب', label: 'قلب', color: 'bg-red-100 text-red-800 border-red-200' },
  { value: 'تنفسية', label: 'تنفسية', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const WAR_INJURY_TYPES = [
  { value: 'بتر', label: 'بتر', color: 'bg-red-50 text-red-700 border-red-200' },
  { value: 'رأس/وجه', label: 'رأس/وجه', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'عمود فقري', label: 'عمود فقري', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const HOUSING_TYPES = [
  { value: 'خيمة', label: 'خيمة', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'بيت إسمنتي', label: 'بيت إسمنتي', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'شقة', label: 'شقة', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'مشتركة', label: 'مشتركة', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'أخرى', label: 'أخرى', color: 'bg-gray-100 text-gray-700 border-gray-200' }
];

const MARITAL_STATUS_OPTIONS = [
  { value: 'أرملة', label: 'أرملة', color: 'bg-gray-50 text-gray-700 border-gray-200' },
  { value: 'مطلقة', label: 'مطلقة', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'حالة هشة', label: 'حالة هشة', color: 'bg-red-50 text-red-700 border-red-200' }
];

const AidCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<AidCampaign[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<AidCampaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<AidCampaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [currentCampId, setCurrentCampId] = useState<string>('');

  // Enhanced filters - simplified
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterInventoryItem, setFilterInventoryItem] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Ref to keep currentCampId updated for useCallback closures
  const currentCampIdRef = useRef<string>('');

  useEffect(() => {
    currentCampIdRef.current = currentCampId;
  }, [currentCampId]);

  // Family selection state
  const [showFamilySelector, setShowFamilySelector] = useState(false);
  const [familySearchTerm, setFamilySearchTerm] = useState('');
  const [selectedFamilyIds, setSelectedFamilyIds] = useState<string[]>([]);

  // Family filter state - enhanced with multiple filters
  const [filterFamiliesWithAid, setFilterFamiliesWithAid] = useState<'all' | 'withAid' | 'withoutAid'>('all');
  const [filterFamiliesCampaignStatus, setFilterFamiliesCampaignStatus] = useState<string[]>([]); // Multi-select: active, planned, completed
  const [filterFamiliesAidCategory, setFilterFamiliesAidCategory] = useState<string[]>([]); // Multi-select: food, non_food, medical, etc.
  const [filterFamiliesBenefitCount, setFilterFamiliesBenefitCount] = useState<'all' | 'حملة واحدة' | 'حملات متعددة'>('all'); // single or multiple campaigns
  const [filterFamilySizeMin, setFilterFamilySizeMin] = useState<string>('');
  const [filterFamilySizeMax, setFilterFamilySizeMax] = useState<string>('');
  
  // Vulnerability filters - Priority Levels
  const [filterVulnerabilityPriority, setFilterVulnerabilityPriority] = useState<string[]>([]); // Multi-select: very_high, high, medium, low
  const [filterVulnerabilityScoreMin, setFilterVulnerabilityScoreMin] = useState<string>('');
  const [filterVulnerabilityScoreMax, setFilterVulnerabilityScoreMax] = useState<string>('');
  
  // Children filter (count + age range)
  const [filterChildCountMin, setFilterChildCountMin] = useState<string>('');
  const [filterChildCountMax, setFilterChildCountMax] = useState<string>('');
  
  // Seniors filter (count + age range)
  const [filterSeniorCountMin, setFilterSeniorCountMin] = useState<string>('');
  const [filterSeniorCountMax, setFilterSeniorCountMax] = useState<string>('');
  
  // Disability filter (type + severity)
  const [filterHasDisability, setFilterHasDisability] = useState<boolean | null>(null); // Yes/No
  const [filterDisabilityType, setFilterDisabilityType] = useState<string[]>([]); // Multi-select: physical, visual, hearing, speech, mental, other
  
  // Chronic disease filter (type)
  const [filterHasChronicDisease, setFilterHasChronicDisease] = useState<boolean | null>(null); // Yes/No
  const [filterChronicDiseaseType, setFilterChronicDiseaseType] = useState<string[]>([]); // Multi-select: diabetes, hypertension, cancer, kidney_failure, heart, respiratory, other
  
  // War injury filter (type + severity)
  const [filterHasWarInjury, setFilterHasWarInjury] = useState<boolean | null>(null); // Yes/No
  const [filterWarInjuryType, setFilterWarInjuryType] = useState<string[]>([]); // Multi-select: amputation, head_face, spinal, other
  
  // Pregnancy filter (yes/no + month range)
  const [filterHasPregnancy, setFilterHasPregnancy] = useState<boolean | null>(null);
  const [filterPregnancyMonthMin, setFilterPregnancyMonthMin] = useState<string>(''); // 1-9
  
  // Income filter (range)
  const [filterIncomeMin, setFilterIncomeMin] = useState<string>('');
  const [filterIncomeMax, setFilterIncomeMax] = useState<string>('');
  
  // Housing filter (type + conditions)
  const [filterHousingType, setFilterHousingType] = useState<string[]>([]); // Multi-select: tent, concrete_house, apartment, shared, other
  const [filterHasPoorSanitary, setFilterHasPoorSanitary] = useState<boolean | null>(null); // Yes/No
  
  // Orphans filter (count)
  const [filterOrphanCountMin, setFilterOrphanCountMin] = useState<string>('');
  const [filterOrphanCountMax, setFilterOrphanCountMax] = useState<string>('');
  
  // Absence of provider (marital status + employment)
  const [filterMaritalStatus, setFilterMaritalStatus] = useState<string[]>([]); // Multi-select: widow, divorced, vulnerable
  const [filterIsEmployed, setFilterIsEmployed] = useState<boolean | null>(null); // Yes/No

  const [formData, setFormData] = useState({
    name: '',
    aidType: '',
    aidCategory: 'غذائية',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    description: '',
    notes: '',
    inventoryItemId: ''
  });

  // Load inventory items for dropdown
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Helper: Map category value - handles both Arabic and English for backward compatibility
  const mapCategoryToValue = (category: string): string => {
    const englishToArabic: Record<string, string> = {
      'food': 'غذائية',
      'non_food': 'غير غذائية',
      'medical': 'طبية',
      'cash': 'نقدية',
      'hygiene': 'نظافة',
      'shelter': 'مأوى',
      'other': 'أخرى'
    };
    
    // If it's English, map to Arabic
    if (englishToArabic[category]) {
      return englishToArabic[category];
    }
    // If it's already Arabic or custom, return as-is
    return category;
  };

  // Helper: Get category label for display (returns Arabic)
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
    
    // If it's a known English value, return Arabic label
    if (englishToArabic[categoryValue]) {
      return englishToArabic[categoryValue];
    }
    // If it's Arabic or custom, return as-is
    return categoryValue;
  };

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

  // Load families - Only show APPROVED families (not pending)
  const loadFamilies = useCallback(async () => {
    try {
      const allFamilies = await realDataService.getDPs();
      // Filter families by current camp AND exclude pending status
      const campFamilies = allFamilies.filter(f =>
        (f.currentHousing?.campId === currentCampIdRef.current || f.campId === currentCampIdRef.current) &&
        f.registrationStatus !== 'قيد الانتظار'  // Exclude pending families (using 'registrationStatus' field)
      ).map(f => {
        // Aggregate disability, chronic disease, and war injury from head, wife, and individuals
        const disabilityTypes: string[] = [];
        const chronicTypes: string[] = [];
        const warInjuryTypes: string[] = [];
        let individualsDisabilityCount = 0;
        let individualsChronicCount = 0;
        let individualsWarInjuryCount = 0;
        
        // Head of family
        if (f.headOfFamilyDisabilityType && f.headOfFamilyDisabilityType !== 'none' && f.headOfFamilyDisabilityType !== 'لا يوجد') {
          disabilityTypes.push(mapDisabilityType(f.headOfFamilyDisabilityType) || 'other');
          individualsDisabilityCount++;
        }
        if (f.headOfFamilyChronicDiseaseType && f.headOfFamilyChronicDiseaseType !== 'none' && f.headOfFamilyChronicDiseaseType !== 'لا يوجد') {
          chronicTypes.push(mapChronicDiseaseType(f.headOfFamilyChronicDiseaseType) || 'other');
          individualsChronicCount++;
        }
        if (f.headOfFamilyWarInjuryType && f.headOfFamilyWarInjuryType !== 'none' && f.headOfFamilyWarInjuryType !== 'لا يوجد') {
          warInjuryTypes.push(mapWarInjuryType(f.headOfFamilyWarInjuryType) || 'other');
          individualsWarInjuryCount++;
        }

        // Wife
        if (f.wifeDisabilityType && f.wifeDisabilityType !== 'none' && f.wifeDisabilityType !== 'لا يوجد') {
          disabilityTypes.push(mapDisabilityType(f.wifeDisabilityType) || 'other');
          individualsDisabilityCount++;
        }
        if (f.wifeChronicDiseaseType && f.wifeChronicDiseaseType !== 'none' && f.wifeChronicDiseaseType !== 'لا يوجد') {
          chronicTypes.push(mapChronicDiseaseType(f.wifeChronicDiseaseType) || 'other');
          individualsChronicCount++;
        }
        if (f.wifeWarInjuryType && f.wifeWarInjuryType !== 'none' && f.wifeWarInjuryType !== 'لا يوجد') {
          warInjuryTypes.push(mapWarInjuryType(f.wifeWarInjuryType) || 'other');
          individualsWarInjuryCount++;
        }
        
        // Other individuals (if members array exists)
        if (f.members && Array.isArray(f.members)) {
          f.members.forEach(member => {
            if (member.relation !== 'head_of_family' && member.relation !== 'wife') {
              if (member.disabilityType && member.disabilityType !== 'none' && member.disabilityType !== 'لا يوجد') {
                disabilityTypes.push(mapDisabilityType(member.disabilityType) || 'أخرى');
                individualsDisabilityCount++;
              }
              if (member.chronicDiseaseType && member.chronicDiseaseType !== 'none' && member.chronicDiseaseType !== 'لا يوجد') {
                chronicTypes.push(mapChronicDiseaseType(member.chronicDiseaseType) || 'أخرى');
                individualsChronicCount++;
              }
              if (member.warInjuryType && member.warInjuryType !== 'none' && member.warInjuryType !== 'لا يوجد') {
                warInjuryTypes.push(mapWarInjuryType(member.warInjuryType) || 'أخرى');
                individualsWarInjuryCount++;
              }
            }
          });
        }

        return {
          id: f.id,
          head_of_family_name: f.headOfFamily,
          head_of_family_national_id: f.nationalId,
          head_of_family_phone_number: f.phoneNumber,
          total_members_count: f.totalMembersCount,
          current_housing_camp_id: f.currentHousing?.campId,
          // Vulnerability fields
          vulnerabilityScore: f.vulnerabilityScore || 0,
          vulnerabilityPriority: f.vulnerabilityPriority || 'منخفض',
          vulnerabilityBreakdown: f.vulnerabilityBreakdown || {},
          childCount: f.childCount || 0,
          seniorCount: f.seniorCount || 0,
          orphanCount: f.headOfFamilyMaritalStatus === 'أرمل' ? f.childCount || 0 : 0,
          monthlyIncome: f.headOfFamilyMonthlyIncome || 0,
          isEmployed: f.headOfFamilyIsWorking || false,
          maritalStatus: f.headOfFamilyMaritalStatus as any || 'أعزب',
          housingType: f.currentHousingType as any || 'أخرى',
          hasPoorSanitary: f.currentHousingSanitaryFacilities === 'مشتركة' || f.currentHousingSanitaryConditions === 'سيئة',
          pregnancyMonth: f.wifePregnancyMonth || 0,
          // Head of family fields
          headHasDisability: f.headOfFamilyDisabilityType !== null && f.headOfFamilyDisabilityType !== 'none' && f.headOfFamilyDisabilityType !== 'لا يوجد',
          headDisabilityType: mapDisabilityType(f.headOfFamilyDisabilityType),
          headHasChronicDisease: f.headOfFamilyChronicDiseaseType !== null && f.headOfFamilyChronicDiseaseType !== 'none' && f.headOfFamilyChronicDiseaseType !== 'لا يوجد',
          headChronicDiseaseType: mapChronicDiseaseType(f.headOfFamilyChronicDiseaseType),
          headHasWarInjury: f.headOfFamilyWarInjuryType !== null && f.headOfFamilyWarInjuryType !== 'none' && f.headOfFamilyWarInjuryType !== 'لا يوجد',
          headWarInjuryType: mapWarInjuryType(f.headOfFamilyWarInjuryType),
          // Wife fields
          wifeHasDisability: f.wifeDisabilityType !== null && f.wifeDisabilityType !== 'none' && f.wifeDisabilityType !== 'لا يوجد',
          wifeDisabilityType: mapDisabilityType(f.wifeDisabilityType),
          wifeHasChronicDisease: f.wifeChronicDiseaseType !== null && f.wifeChronicDiseaseType !== 'none' && f.wifeChronicDiseaseType !== 'لا يوجد',
          wifeChronicDiseaseType: mapChronicDiseaseType(f.wifeChronicDiseaseType),
          wifeHasWarInjury: f.wifeWarInjuryType !== null && f.wifeWarInjuryType !== 'none' && f.wifeWarInjuryType !== 'لا يوجد',
          wifeWarInjuryType: mapWarInjuryType(f.wifeWarInjuryType),
          // All individuals aggregated fields
          individualsDisabilityCount,
          individualsDisabilityTypes: disabilityTypes,
          individualsChronicCount,
          individualsChronicTypes: chronicTypes,
          individualsWarInjuryCount,
          individualsWarInjuryTypes: warInjuryTypes,
          // Combined flags for filtering (includes head, wife, and all individuals)
          hasDisability: disabilityTypes.length > 0,
          disabilityTypes: [...new Set(disabilityTypes)], // Unique types
          hasChronicDisease: chronicTypes.length > 0,
          chronicDiseaseTypes: [...new Set(chronicTypes)], // Unique types
          hasWarInjury: warInjuryTypes.length > 0,
          warInjuryTypes: [...new Set(warInjuryTypes)], // Unique types
          hasPregnancy: f.wifeIsPregnant || false
        };
      });
      setFamilies(campFamilies);
    } catch (err: any) {
      console.error('Error loading families:', err);
      setToast({ message: err.message || 'فشل تحميل العائلات', type: 'error' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Helper functions to map types
  const mapDisabilityType = (type: string | null): 'جسدية' | 'بصرية' | 'سمعية' | 'نطق' | 'عقلية' | 'أخرى' | undefined => {
    if (!type || type === 'none' || type === 'لا يوجد') return undefined;
    const typeMap: Record<string, any> = {
      'physical': 'جسدية',
      'visual': 'بصرية',
      'hearing': 'سمعية',
      'speech': 'نطق',
      'mental': 'عقلية',
      'intellectual': 'عقلية',
      'جسدية': 'جسدية',
      'بصرية': 'بصرية',
      'سمعية': 'سمعية',
      'نطق': 'نطق',
      'عقلية': 'عقلية',
      'أخرى': 'أخرى'
    };
    return typeMap[type.toLowerCase()] || 'أخرى';
  };

  const mapChronicDiseaseType = (type: string | null): 'سكري' | 'ضغط' | 'سرطان' | 'فشل كلوي' | 'قلب' | 'تنفسية' | 'أخرى' | undefined => {
    if (!type || type === 'none' || type === 'لا يوجد') return undefined;
    const typeMap: Record<string, any> = {
      'diabetes': 'سكري',
      'hypertension': 'ضغط',
      'cancer': 'سرطان',
      'kidney_failure': 'فشل كلوي',
      'heart': 'قلب',
      'respiratory': 'تنفسية',
      'asthma': 'تنفسية',
      'سكري': 'سكري',
      'ضغط': 'ضغط',
      'سرطان': 'سرطان',
      'فشل كلوي': 'فشل كلوي',
      'قلب': 'قلب',
      'تنفسية': 'تنفسية',
      'أمراض نفسية': 'أخرى',
      'أخرى': 'أخرى'
    };
    return typeMap[type.toLowerCase()] || 'أخرى';
  };

  const mapWarInjuryType = (type: string | null): 'بتر' | 'رأس/وجه' | 'عمود فقري' | 'أخرى' | undefined => {
    if (!type || type === 'none' || type === 'لا يوجد') return undefined;
    const typeMap: Record<string, any> = {
      'amputation': 'بتر',
      'head_face': 'رأس/وجه',
      'spinal': 'عمود فقري',
      'burns': 'أخرى',
      'بتر': 'بتر',
      'رأس/وجه': 'رأس/وجه',
      'عمود فقري': 'عمود فقري',
      'أخرى': 'أخرى'
    };
    return typeMap[type.toLowerCase()] || 'أخرى';
  };

  // Load campaigns
  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      setToast(null);

      if (!currentCampIdRef.current) {
        setCampaigns([]);
        setLoading(false);
        return;
      }

      const data = await realDataService.getAidCampaigns(true); // Include soft-deleted campaigns to properly check family aid history
      setCampaigns(data);
    } catch (err: any) {
      console.error('Error loading campaigns:', err);
      setToast({ message: err.message || 'فشل تحميل حملات المساعدات', type: 'error' });
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load inventory items (include deleted items that are referenced by active campaigns)
  const loadInventoryItems = useCallback(async () => {
    try {
      const items = await realDataService.getInventoryItems(true); // includeReferencedDeleted = true
      console.log('[AidCampaigns] Loaded inventory items:', items);
      setInventoryItems(items);
    } catch (err: any) {
      console.error('Error loading inventory items:', err);
      setToast({ message: err.message || 'فشل تحميل عناصر المخزون', type: 'error' });
    }
  }, []);

  useEffect(() => {
    if (currentCampId) {
      loadFamilies();
      loadCampaigns();
      loadInventoryItems();
    }
  }, [currentCampId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFamilyToggle = (familyId: string) => {
    setSelectedFamilyIds(prev => 
      prev.includes(familyId) 
        ? prev.filter(id => id !== familyId)
        : [...prev, familyId]
    );
  };

  const handleSelectAllFamilies = () => {
    if (selectedFamilyIds.length === filteredFamilies.length) {
      setSelectedFamilyIds([]);
    } else {
      setSelectedFamilyIds(filteredFamilies.map(f => f.id));
    }
  };

  const handleSaveFamilies = () => {
    setShowFamilySelector(false);
    setFamilySearchTerm('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      if (editingCampaign) {
        await realDataService.updateAidCampaign(editingCampaign.id, {
          name: formData.name,
          aidType: formData.aidType,
          aidCategory: formData.aidCategory,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          description: formData.description || undefined,
          notes: formData.notes || undefined,
          targetFamilies: selectedFamilyIds,
          inventoryItemId: formData.inventoryItemId || undefined
        });
        setToast({ message: 'تم تحديث الحملة بنجاح', type: 'success' });
      } else {
        await realDataService.createAidCampaign({
          name: formData.name,
          aidType: formData.aidType,
          aidCategory: formData.aidCategory,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          description: formData.description || undefined,
          notes: formData.notes || undefined,
          targetFamilies: selectedFamilyIds,
          inventoryItemId: formData.inventoryItemId || undefined
        });
        setToast({ message: 'تم إنشاء الحملة بنجاح', type: 'success' });
      }

      setFormData({
        name: '',
        aidType: '',
        aidCategory: 'غذائية',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        description: '',
        notes: '',
        inventoryItemId: ''
      });
      setSelectedFamilyIds([]);
      setEditingCampaign(null);
      setShowForm(false);
      await loadCampaigns();
    } catch (err: any) {
      console.error('Error saving campaign:', err);
      setToast({ message: err.message || 'فشل حفظ الحملة', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (campaign: AidCampaign) => {
    setEditingCampaign(campaign);
    // Map category to English value if it's Arabic
    const categoryValue = mapCategoryToValue(campaign.aidCategory);
    console.log('[AidCampaigns] Edit campaign:', campaign);
    console.log('[AidCampaigns] Campaign inventoryItemId:', campaign.inventoryItemId);
    setFormData({
      name: campaign.name,
      aidType: campaign.aidType,
      aidCategory: categoryValue,
      startDate: campaign.startDate,
      endDate: campaign.endDate || '',
      description: campaign.description || '',
      notes: campaign.notes || '',
      inventoryItemId: campaign.inventoryItemId || ''
    });
    setSelectedFamilyIds(campaign.targetFamilies || []);
    setShowForm(true);
  };

  const handleDelete = (campaign: AidCampaign) => {
    setDeletingCampaign(campaign);
  };

  const handleStatusChange = async (campaignId: string, newStatus: AidCampaign['status']) => {
    try {
      await realDataService.updateAidCampaign(campaignId, {
        status: newStatus
      });
      setToast({ message: `تم تغيير حالة الحملة إلى ${STATUS_CONFIG[newStatus as keyof typeof STATUS_CONFIG]?.label}`, type: 'success' });
      await loadCampaigns();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل تغيير حالة الحملة', type: 'error' });
      console.error('Error changing status:', err);
    }
  };

  const confirmDelete = async () => {
    if (!deletingCampaign) return;

    console.log('[AidCampaigns] Confirming delete for campaign:', deletingCampaign.id, deletingCampaign.name);
    
    try {
      console.log('[AidCampaigns] Calling deleteAidCampaign API...');
      await realDataService.deleteAidCampaign(deletingCampaign.id);
      console.log('[AidCampaigns] Delete API call succeeded');
      
      setToast({ message: 'تم حذف الحملة بنجاح', type: 'success' });
      
      console.log('[AidCampaigns] Reloading campaigns...');
      await loadCampaigns();
      console.log('[AidCampaigns] Campaigns reloaded');
      
      setDeletingCampaign(null);
    } catch (err: any) {
      console.error('[AidCampaigns] Error deleting campaign:', err);
      setToast({ message: err.message || 'فشل حذف الحملة', type: 'error' });
    }
  };

  const cancelDelete = () => {
    setDeletingCampaign(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingCampaign(null);
    setFormData({
      name: '',
      aidType: '',
      aidCategory: 'غذائية',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      description: '',
      notes: ''
    });
    setSelectedFamilyIds([]);
  };

  const filteredFamilies = families.filter(family => {
    // Basic search filter with Arabic normalization
    const matchesSearch = !familySearchTerm || 
      normalizeArabic(family.head_of_family_name).includes(normalizeArabic(familySearchTerm));

    // Family size range filter
    const matchesFamilySize = 
      (filterFamilySizeMin === '' || family.total_members_count >= parseInt(filterFamilySizeMin)) &&
      (filterFamilySizeMax === '' || family.total_members_count <= parseInt(filterFamilySizeMax));

    // Vulnerability score range filter
    const familyScore = parseFloat(String(family.vulnerabilityScore || 0));
    const minScore = filterVulnerabilityScoreMin ? parseFloat(filterVulnerabilityScoreMin) : 0;
    const maxScore = filterVulnerabilityScoreMax ? parseFloat(filterVulnerabilityScoreMax) : 100;
    
    const matchesVulnerabilityScore = familyScore >= minScore && familyScore <= maxScore;

    // Debug: Log score range matching
    if (filterVulnerabilityScoreMin || filterVulnerabilityScoreMax) {
      console.log('[تصفية درجة الهشاشة]', {
        familyName: family.head_of_family_name,
        familyScore,
        filterMin: filterVulnerabilityScoreMin,
        filterMax: filterVulnerabilityScoreMax,
        parsedMin: minScore,
        parsedMax: maxScore,
        matches: matchesVulnerabilityScore
      });
    }

    // Vulnerability priority filter (multi-select)
    const matchesVulnerabilityPriority =
      filterVulnerabilityPriority.length === 0 ||
      (family.vulnerabilityPriority && filterVulnerabilityPriority.includes(family.vulnerabilityPriority));

    // Debug: Log vulnerability matching
    if (filterVulnerabilityPriority.length > 0) {
      console.log('[تصفية مستوى الهشاشة]', {
        familyName: family.head_of_family_name,
        familyPriority: family.vulnerabilityPriority,
        familyScore: family.vulnerabilityScore,
        selectedFilters: filterVulnerabilityPriority,
        matches: matchesVulnerabilityPriority
      });
    }

    // Children count filter
    const matchesChildCount = 
      (filterChildCountMin === '' || (family.childCount || 0) >= parseInt(filterChildCountMin)) &&
      (filterChildCountMax === '' || (family.childCount || 0) <= parseInt(filterChildCountMax));
    
    // Seniors count filter
    const matchesSeniorCount = 
      (filterSeniorCountMin === '' || (family.seniorCount || 0) >= parseInt(filterSeniorCountMin)) &&
      (filterSeniorCountMax === '' || (family.seniorCount || 0) <= parseInt(filterSeniorCountMax));
    
    // Disability filter (Yes/No + type) - includes head, wife, and all individuals
    const matchesDisability = 
      (filterHasDisability === null || 
        (filterHasDisability ? family.hasDisability : !family.hasDisability)) &&
      (filterDisabilityType.length === 0 || 
        (family.disabilityTypes && family.disabilityTypes.some(t => filterDisabilityType.includes(t as any))));
    
    // Chronic disease filter (Yes/No + type) - includes head, wife, and all individuals
    const matchesChronicDisease = 
      (filterHasChronicDisease === null || 
        (filterHasChronicDisease ? family.hasChronicDisease : !family.hasChronicDisease)) &&
      (filterChronicDiseaseType.length === 0 || 
        (family.chronicDiseaseTypes && family.chronicDiseaseTypes.some(t => filterChronicDiseaseType.includes(t as any))));
    
    // War injury filter (Yes/No + type) - includes head, wife, and all individuals
    const matchesWarInjury = 
      (filterHasWarInjury === null || 
        (filterHasWarInjury ? family.hasWarInjury : !family.hasWarInjury)) &&
      (filterWarInjuryType.length === 0 || 
        (family.warInjuryTypes && family.warInjuryTypes.some(t => filterWarInjuryType.includes(t as any))));
    
    // Pregnancy filter (Yes/No + month)
    const matchesPregnancy = 
      (filterHasPregnancy === null || 
        (filterHasPregnancy ? family.hasPregnancy : !family.hasPregnancy)) &&
      (filterPregnancyMonthMin === '' || 
        (family.pregnancyMonth || 0) >= parseInt(filterPregnancyMonthMin));
    
    // Income range filter
    const matchesIncome = 
      (filterIncomeMin === '' || (family.monthlyIncome || 0) >= parseInt(filterIncomeMin)) &&
      (filterIncomeMax === '' || (family.monthlyIncome || 999999) <= parseInt(filterIncomeMax));
    
    // Housing filter (type + sanitary)
    const matchesHousing = 
      (filterHousingType.length === 0 || 
        (family.housingType && filterHousingType.includes(family.housingType))) &&
      (filterHasPoorSanitary === null || 
        (filterHasPoorSanitary ? family.hasPoorSanitary : !family.hasPoorSanitary));
    
    // Orphan count filter
    const matchesOrphanCount = 
      (filterOrphanCountMin === '' || (family.orphanCount || 0) >= parseInt(filterOrphanCountMin)) &&
      (filterOrphanCountMax === '' || (family.orphanCount || 0) <= parseInt(filterOrphanCountMax));
    
    // Absence of provider filter (marital status + employment)
    const matchesAbsenceProvider = 
      (filterMaritalStatus.length === 0 || 
        (family.maritalStatus && filterMaritalStatus.includes(family.maritalStatus))) &&
      (filterIsEmployed === null || 
        (filterIsEmployed ? family.isEmployed : !family.isEmployed));

    // Aid inclusion/exclusion filter - check distributedTo (received aid), not targetFamilies
    let matchesAidFilter = true;
    if (filterFamiliesWithAid !== 'all') {
      // Check if family RECEIVED aid from ANY campaign (including soft-deleted)
      const hasReceivedAnyAid = campaigns.some(c =>
        c.distributedTo?.includes(family.id) &&
        (!editingCampaign || c.id !== editingCampaign.id)
      );

      // For "withAid" filter, we want families that RECEIVED aid from active/completed campaigns
      const hasReceivedActiveAid = campaigns.some(c =>
        !c.isDeleted && !c.deletedAt &&
        (c.status === 'نشطة' || c.status === 'مكتملة') &&
        c.distributedTo?.includes(family.id) &&
        (!editingCampaign || c.id !== editingCampaign.id)
      );

      if (filterFamiliesWithAid === 'withAid') {
        matchesAidFilter = hasReceivedActiveAid;
      } else if (filterFamiliesWithAid === 'withoutAid') {
        // Exclude families that RECEIVED aid from ANY campaign (including deleted)
        matchesAidFilter = !hasReceivedAnyAid;
      }
    }

    // Get all campaigns where family RECEIVED aid for further filtering
    const familyCampaigns = campaigns.filter(c =>
      c.distributedTo?.includes(family.id) &&
      (!editingCampaign || c.id !== editingCampaign.id)
    );

    // Campaign status filter (multi-select)
    let matchesCampaignStatus = true;
    if (filterFamiliesCampaignStatus.length > 0) {
      const hasMatchingStatus = familyCampaigns.some(c =>
        filterFamiliesCampaignStatus.includes(c.status)
      );
      matchesCampaignStatus = hasMatchingStatus;
    }

    // Aid category filter (multi-select)
    let matchesAidCategory = true;
    if (filterFamiliesAidCategory.length > 0) {
      const hasMatchingCategory = familyCampaigns.some(c =>
        filterFamiliesAidCategory.includes(c.aidCategory)
      );
      matchesAidCategory = hasMatchingCategory;
    }

    // Benefit count filter (single vs multiple)
    // Only count active/completed campaigns where family RECEIVED aid (not soft-deleted)
    let matchesBenefitCount = true;
    if (filterFamiliesBenefitCount !== 'all') {
      const campaignCount = familyCampaigns.filter(c =>
        !c.isDeleted && !c.deletedAt &&
        (c.status === 'نشطة' || c.status === 'مكتملة')
      ).length;

      if (filterFamiliesBenefitCount === 'حملة واحدة') {
        matchesBenefitCount = campaignCount === 1;
      } else if (filterFamiliesBenefitCount === 'حملات متعددة') {
        matchesBenefitCount = campaignCount >= 2;
      }
    }

    return matchesSearch && matchesFamilySize && matchesVulnerabilityScore && matchesVulnerabilityPriority &&
           matchesChildCount && matchesSeniorCount && matchesDisability && matchesChronicDisease &&
           matchesWarInjury && matchesPregnancy && matchesIncome && matchesHousing &&
           matchesOrphanCount && matchesAbsenceProvider &&
           matchesAidFilter && matchesCampaignStatus && matchesAidCategory && matchesBenefitCount;
  });

  const filteredCampaigns = campaigns.filter(campaign => {
    // Exclude soft-deleted campaigns from display
    // Backend now transforms snake_case to camelCase: is_deleted → isDeleted, deleted_at → deletedAt
    if (campaign.isDeleted || campaign.deletedAt) return false;

    // Arabic-normalized search across multiple fields
    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      campaign.name,
      campaign.description,
      campaign.notes,
      campaign.aidType,
      getCategoryLabel(campaign.aidCategory)
    ]);

    const matchesStatus = filterStatus === 'all' || campaign.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || campaign.aidCategory === filterCategory;

    // New enhanced filters
    const matchesStartDate = filterStartDate === '' ||
      new Date(campaign.startDate) >= new Date(filterStartDate);

    const matchesEndDate = filterEndDate === '' ||
      (campaign.endDate && new Date(campaign.endDate) <= new Date(filterEndDate));

    const matchesInventoryItem = filterInventoryItem === 'all' ||
      campaign.inventoryItemId === filterInventoryItem;

    return matchesSearch && matchesStatus && matchesCategory &&
           matchesStartDate && matchesEndDate && matchesInventoryItem;
  });

  const stats = {
    total: campaigns.length,
    planned: campaigns.filter(c => c.status === 'مخططة').length,
    active: campaigns.filter(c => c.status === 'نشطة').length,
    completed: campaigns.filter(c => c.status === 'مكتملة').length,
    food: campaigns.filter(c => c.aidCategory === 'غذائية' || c.aidCategory === 'food').length,
    medical: campaigns.filter(c => c.aidCategory === 'طبية' || c.aidCategory === 'medical').length
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-60 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-gray-100 rounded-2xl p-4 text-center">
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
                <div className="h-3 w-16 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(2)].map((_, i) => (
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
                  {[...Array(6)].map((_, i) => (
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingCampaign}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذه الحملة؟"
        itemName={deletingCampaign?.name}
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
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-600 to-teal-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              حملات المساعدات
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">إدارة ومتابعة حملات توزيع المساعدات في المخيم</p>
          </div>
          <button
            onClick={() => {
              setSelectedFamilyIds([]);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            حملة جديدة
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-gray-700">{stats.total}</p>
            <p className="text-xs font-bold text-gray-600 mt-1">الإجمالي</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-blue-600">{stats.planned}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">مخططة</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-green-600">{stats.active}</p>
            <p className="text-xs font-bold text-green-700 mt-1">نشطة</p>
          </div>
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-gray-600">{stats.completed}</p>
            <p className="text-xs font-bold text-gray-700 mt-1">مكتملة</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">{stats.food}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">غذائية</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-red-600">{stats.medical}</p>
            <p className="text-xs font-bold text-red-700 mt-1">طبية</p>
          </div>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-[2rem] w-full h-full md:w-full md:h-auto md:max-h-[90vh] md:max-w-3xl shadow-2xl overflow-y-auto">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-black text-gray-800 mb-6 flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                {editingCampaign ? 'تعديل الحملة' : 'إنشاء حملة جديدة'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">اسم الحملة *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      placeholder="مثال: حملة المساعدات الشتوية"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">عنصر المخزون المرتبط *</label>
                    <select
                      name="inventoryItemId"
                      value={formData.inventoryItemId || ''}
                      onChange={(e) => {
                        const selectedItemId = e.target.value;
                        const selectedItem = inventoryItems.find(item => item.id === selectedItemId);
                        const categoryValue = mapCategoryToValue(selectedItem?.category || 'other');
                        setFormData(prev => ({
                          ...prev,
                          inventoryItemId: selectedItemId,
                          // Auto-fill aidType and aidCategory from inventory item
                          aidType: selectedItem?.name || '',
                          aidCategory: categoryValue
                        }));
                      }}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      required
                    >
                      <option value="">اختر عنصراً من المخزون...</option>
                      {inventoryItems.length === 0 && (
                        <option disabled>جاري تحميل عناصر المخزون...</option>
                      )}
                      {inventoryItems
                        .filter(item => !item.isDeleted && !item.deletedAt) // Only show active items in dropdown
                        .map(item => {
                          // Handle both snake_case and camelCase field names
                          const itemName = item.name || 'غير محدد';
                          const itemUnit = item.unit || '';
                          const itemQty = item.quantity_available ?? item.quantityAvailable ?? 0;

                          console.log('[AidCampaigns] Rendering inventory item:', { id: item.id, name: itemName, hasSelection: formData.inventoryItemId === item.id });
                          return (
                            <option key={item.id} value={item.id}>
                              {itemName} (المتوفر: {itemQty} {itemUnit})
                            </option>
                          );
                        })}
                      {/* Show currently selected item even if deleted (for editing existing campaigns) */}
                      {formData.inventoryItemId && (() => {
                        const selectedItem = inventoryItems.find(item => item.id === formData.inventoryItemId);
                        if (selectedItem && (selectedItem.isDeleted || selectedItem.deletedAt)) {
                          const itemName = selectedItem.name || 'غير محدد';
                          const itemUnit = selectedItem.unit || '';
                          const itemQty = selectedItem.quantity_available ?? selectedItem.quantityAvailable ?? 0;
                          return (
                            <option key={selectedItem.id} value={selectedItem.id} className="text-red-600">
                              {itemName} (محذوف) - المتوفر: {itemQty} {itemUnit}
                            </option>
                          );
                        }
                        return null;
                      })()}
                    </select>
                    {/* Debug: Show form data */}
                    {formData.inventoryItemId && (
                      <div className={`mt-2 p-3 border-2 rounded-xl ${
                        (() => {
                          const selectedItem = inventoryItems.find(item => item.id === formData.inventoryItemId);
                          return selectedItem?.isDeleted || selectedItem?.deletedAt
                            ? 'bg-red-50 border-red-200'
                            : 'bg-emerald-50 border-emerald-200';
                        })()
                      }`}>
                        <div className={`flex items-center gap-2 text-sm font-bold ${
                          (() => {
                            const selectedItem = inventoryItems.find(item => item.id === formData.inventoryItemId);
                            return selectedItem?.isDeleted || selectedItem?.deletedAt
                              ? 'text-red-800'
                              : 'text-emerald-800';
                          })()
                        }`}>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>
                            {(() => {
                              const selectedItem = inventoryItems.find(item => item.id === formData.inventoryItemId);
                              return selectedItem?.isDeleted || selectedItem?.deletedAt
                                ? 'العنصر محذوف (للعرض فقط)'
                                : 'تم اختيار العنصر:';
                            })()}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs">
                          {(() => {
                            const selectedItem = inventoryItems.find(item => item.id === formData.inventoryItemId);
                            const itemName = selectedItem?.name || formData.aidType || '-';
                            const itemUnit = selectedItem?.unit || '';
                            const itemQty = selectedItem?.quantity_available ?? selectedItem?.quantityAvailable ?? 0;
                            return (
                              <>
                                <span className={`px-2 py-1 rounded-lg ${
                                  selectedItem?.isDeleted || selectedItem?.deletedAt
                                    ? 'bg-white text-red-700'
                                    : 'bg-white text-emerald-700'
                                }`}>
                                  الاسم: <span className="font-black">{itemName}</span>
                                </span>
                                {itemUnit && (
                                  <span className={`px-2 py-1 rounded-lg ${
                                    selectedItem?.isDeleted || selectedItem?.deletedAt
                                      ? 'bg-white text-red-700'
                                      : 'bg-white text-emerald-700'
                                  }`}>
                                    الوحدة: <span className="font-black">{itemUnit}</span>
                                  </span>
                                )}
                                <span className={`px-2 py-1 rounded-lg ${
                                  selectedItem?.isDeleted || selectedItem?.deletedAt
                                    ? 'bg-white text-red-700'
                                    : 'bg-white text-emerald-700'
                                }`}>
                                  المتوفر: <span className="font-black">{itemQty}</span>
                                </span>
                                <span className={`px-2 py-1 rounded-lg ${
                                  selectedItem?.isDeleted || selectedItem?.deletedAt
                                    ? 'bg-white text-red-700'
                                    : 'bg-white text-emerald-700'
                                }`}>
                                  الفئة: <span className="font-black">{getCategoryLabel(formData.aidCategory)}</span>
                                </span>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                    <p className={`text-xs font-bold mt-1 ${
                      formData.inventoryItemId && (() => {
                        const selectedItem = inventoryItems.find(item => item.id === formData.inventoryItemId);
                        return selectedItem?.isDeleted || selectedItem?.deletedAt;
                      })() ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {formData.inventoryItemId && (() => {
                        const selectedItem = inventoryItems.find(item => item.id === formData.inventoryItemId);
                        if (selectedItem?.isDeleted || selectedItem?.deletedAt) {
                          return '⚠️ العنصر محذوف - لن يظهر في القائمة ولكن يمكن استخدامه للحملة الحالية';
                        }
                        return 'سيتم استخدام فئة ووحدة العنصر المحدد تلقائياً';
                      })() || 'سيتم استخدام فئة ووحدة العنصر المحدد تلقائياً'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">تاريخ البدء *</label>
                    <input
                      type="date"
                      name="startDate"
                      value={formData.startDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">تاريخ الانتهاء</label>
                    <input
                      type="date"
                      name="endDate"
                      value={formData.endDate}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                    />
                  </div>

                  {/* Family Selection */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">الأسر المستهدفة</label>
                    <div className="border-2 border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-600">
                            تم اختيار {selectedFamilyIds.length} أسرة
                          </span>
                          {selectedFamilyIds.length > 0 && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-lg font-black">
                              {Math.round((selectedFamilyIds.length / families.length) * 100)}% من الأسر
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowFamilySelector(true)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-bold text-sm hover:from-emerald-700 hover:to-teal-700 transition-all flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          اختيار الأسر
                        </button>
                      </div>
                      {selectedFamilyIds.length > 0 ? (
                        <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                          {selectedFamilyIds.slice(0, 10).map(id => {
                            const family = families.find(f => f.id === id);
                            return family ? (
                              <span key={id} className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold">
                                {family.head_of_family_name}
                                <button
                                  type="button"
                                  onClick={() => handleFamilyToggle(id)}
                                  className="hover:text-emerald-900"
                                >
                                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </span>
                            ) : null;
                          })}
                          {selectedFamilyIds.length > 10 && (
                            <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-xs font-bold">
                              +{selectedFamilyIds.length - 10} أكثر
                            </span>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 font-bold text-center py-4">
                          لم يتم اختيار أي أسر بعد
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">الوصف</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      placeholder="وصف تفصيلي للحملة وأهدافها..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-black text-gray-700 mb-2">ملاحظات</label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
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
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
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
                      editingCampaign ? 'تحديث' : 'إنشاء'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Family Selector Modal */}
      {showFamilySelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4">
          <div className="bg-white rounded-none md:rounded-[2rem] w-full h-full md:w-full md:h-auto md:max-h-[85vh] md:max-w-4xl shadow-2xl flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  اختيار الأسر المستهدفة
                </h3>
                <button
                  onClick={() => setShowFamilySelector(false)}
                  className="w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-all"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* FilterPanel for Family Selection */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 overflow-y-auto flex-shrink-0 max-h-[40vh]">
              <FilterPanel
                title="تصفية الأسر المستهدفة"
                activeFilters={[
                  ...(familySearchTerm ? [{ id: 'search', label: `بحث: "${familySearchTerm}"`, onRemove: () => setFamilySearchTerm('') }] : []),
                  ...(filterFamiliesWithAid !== 'all' ? [{ id: 'aidStatus', label: filterFamiliesWithAid === 'withAid' ? 'مستفادة من حملات سابقة' : 'غير مستفادة', onRemove: () => setFilterFamiliesWithAid('all') }] : []),
                  ...(filterFamiliesCampaignStatus.length > 0 ? [{ id: 'campaignStatus', label: `حالة الحملات: ${filterFamiliesCampaignStatus.map(s => STATUS_CONFIG[s as keyof typeof STATUS_CONFIG]?.label).join('، ')}`, onRemove: () => setFilterFamiliesCampaignStatus([]) }] : []),
                  ...(filterFamiliesAidCategory.length > 0 ? [{ id: 'aidCategory', label: `فئات المساعدات: ${filterFamiliesAidCategory.map(c => AID_CATEGORIES.find(cat => cat.value === c)?.label).join('، ')}`, onRemove: () => setFilterFamiliesAidCategory([]) }] : []),
                  ...(filterFamiliesBenefitCount !== 'all' ? [{ id: 'benefitCount', label: `عدد الحملات: ${filterFamiliesBenefitCount}`, onRemove: () => setFilterFamiliesBenefitCount('all') }] : []),
                  ...(filterFamilySizeMin || filterFamilySizeMax ? [{ id: 'familySize', label: `حجم الأسرة: ${filterFamilySizeMin || '0'}-${filterFamilySizeMax || '∞'}`, onRemove: () => { setFilterFamilySizeMin(''); setFilterFamilySizeMax(''); } }] : []),
                  ...(filterVulnerabilityPriority.length > 0 ? [{ id: 'vulnPriority', label: `مستوى الهشاشة: ${filterVulnerabilityPriority.map(p => VULNERABILITY_LEVELS.find(v => v.value === p)?.label).join('، ')}`, onRemove: () => setFilterVulnerabilityPriority([]) }] : []),
                  ...(filterVulnerabilityScoreMin || filterVulnerabilityScoreMax ? [{ id: 'vulnScore', label: `درجة الهشاشة: ${filterVulnerabilityScoreMin || '0'}-${filterVulnerabilityScoreMax || '100'}`, onRemove: () => { setFilterVulnerabilityScoreMin(''); setFilterVulnerabilityScoreMax(''); } }] : []),
                  ...(filterChildCountMin || filterChildCountMax ? [{ id: 'childCount', label: `الأطفال: ${filterChildCountMin || '0'}-${filterChildCountMax || '∞'}`, onRemove: () => { setFilterChildCountMin(''); setFilterChildCountMax(''); } }] : []),
                  ...(filterSeniorCountMin || filterSeniorCountMax ? [{ id: 'seniorCount', label: `كبار السن: ${filterSeniorCountMin || '0'}-${filterSeniorCountMax || '∞'}`, onRemove: () => { setFilterSeniorCountMin(''); setFilterSeniorCountMax(''); } }] : []),
                  ...(filterHasDisability !== null ? [{ id: 'hasDisability', label: filterHasDisability ? 'لديها إعاقة' : 'بدون إعاقة', onRemove: () => setFilterHasDisability(null) }] : []),
                  ...(filterDisabilityType.length > 0 ? [{ id: 'disabilityType', label: `نوع الإعاقة: ${filterDisabilityType.map(t => DISABILITY_TYPES.find(d => d.value === t)?.label).join('، ')}`, onRemove: () => setFilterDisabilityType([]) }] : []),
                  ...(filterHasChronicDisease !== null ? [{ id: 'hasChronic', label: filterHasChronicDisease ? 'لديها مرض مزمن' : 'بدون مرض مزمن', onRemove: () => setFilterHasChronicDisease(null) }] : []),
                  ...(filterChronicDiseaseType.length > 0 ? [{ id: 'chronicType', label: `نوع المرض: ${filterChronicDiseaseType.map(t => CHRONIC_DISEASE_TYPES.find(d => d.value === t)?.label).join('، ')}`, onRemove: () => setFilterChronicDiseaseType([]) }] : []),
                  ...(filterHasWarInjury !== null ? [{ id: 'hasWarInjury', label: filterHasWarInjury ? 'لديها إصابة حرب' : 'بدون إصابة حرب', onRemove: () => setFilterHasWarInjury(null) }] : []),
                  ...(filterWarInjuryType.length > 0 ? [{ id: 'warInjuryType', label: `نوع الإصابة: ${filterWarInjuryType.map(t => WAR_INJURY_TYPES.find(d => d.value === t)?.label).join('، ')}`, onRemove: () => setFilterWarInjuryType([]) }] : []),
                  ...(filterHasPregnancy !== null ? [{ id: 'pregnancy', label: filterHasPregnancy ? 'حامل' : 'غير حامل', onRemove: () => setFilterHasPregnancy(null) }] : []),
                  ...(filterPregnancyMonthMin ? [{ id: 'pregnancyMonth', label: `شهر الحمل: ${filterPregnancyMonthMin}+`, onRemove: () => setFilterPregnancyMonthMin('') }] : []),
                  ...(filterIncomeMin || filterIncomeMax ? [{ id: 'income', label: `الدخل: ${filterIncomeMin || '0'}-${filterIncomeMax || '∞'}`, onRemove: () => { setFilterIncomeMin(''); setFilterIncomeMax(''); } }] : []),
                  ...(filterHousingType.length > 0 ? [{ id: 'housingType', label: `نوع السكن: ${filterHousingType.map(t => HOUSING_TYPES.find(h => h.value === t)?.label).join('، ')}`, onRemove: () => setFilterHousingType([]) }] : []),
                  ...(filterHasPoorSanitary !== null ? [{ id: 'poorSanitary', label: filterHasPoorSanitary ? 'مرافق سيئة' : 'مرافق جيدة', onRemove: () => setFilterHasPoorSanitary(null) }] : []),
                  ...(filterOrphanCountMin || filterOrphanCountMax ? [{ id: 'orphanCount', label: `الأيتام: ${filterOrphanCountMin || '0'}-${filterOrphanCountMax || '∞'}`, onRemove: () => { setFilterOrphanCountMin(''); setFilterOrphanCountMax(''); } }] : []),
                  ...(filterMaritalStatus.length > 0 ? [{ id: 'maritalStatus', label: `الحالة الاجتماعية: ${filterMaritalStatus.map(s => MARITAL_STATUS_OPTIONS.find(m => m.value === s)?.label).join('، ')}`, onRemove: () => setFilterMaritalStatus([]) }] : []),
                  ...(filterIsEmployed !== null ? [{ id: 'employed', label: filterIsEmployed ? 'يعمل' : 'لا يعمل', onRemove: () => setFilterIsEmployed(null) }] : [])
                ]}
                onClearAll={() => {
                  setFamilySearchTerm('');
                  setFilterFamiliesWithAid('all');
                  setFilterFamiliesCampaignStatus([]);
                  setFilterFamiliesAidCategory([]);
                  setFilterFamiliesBenefitCount('all');
                  setFilterFamilySizeMin('');
                  setFilterFamilySizeMax('');
                  setFilterVulnerabilityPriority([]);
                  setFilterVulnerabilityScoreMin('');
                  setFilterVulnerabilityScoreMax('');
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
                  setFilterHousingType([]);
                  setFilterHasPoorSanitary(null);
                  setFilterOrphanCountMin('');
                  setFilterOrphanCountMax('');
                  setFilterMaritalStatus([]);
                  setFilterIsEmployed(null);
                }}
                iconColor="emerald"
                variant="modal"
                defaultOpen={false}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search - Full Width */}
                  <div className="lg:col-span-3">
                    <SearchInput
                      value={familySearchTerm}
                      onChange={setFamilySearchTerm}
                      placeholder="ابحث باسم رب الأسرة، الرقم الوطني، رقم الهاتف..."
                      iconColor="emerald"
                      showArabicHint
                    />
                  </div>

                  {/* Aid Status Filter */}
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">حالة الاستفادة</label>
                    <select
                      value={filterFamiliesWithAid}
                      onChange={(e) => setFilterFamiliesWithAid(e.target.value as 'all' | 'withAid' | 'withoutAid')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                    >
                      <option value="all">جميع الأسر</option>
                      <option value="withAid">أسر مستفادة من حملات سابقة</option>
                      <option value="withoutAid">أسر غير مستفادة</option>
                    </select>
                  </div>

                  {/* Campaign Status Multi-Select */}
                  <div className="md:col-span-2">
                    <MultiSelectFilter
                      label="حالة الحملات المستفادة منها"
                      options={[
                        { value: 'نشطة', label: 'نشطة', color: 'bg-green-50 text-green-700 border-green-200' },
                        { value: 'مخططة', label: 'مخططة', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                        { value: 'مكتملة', label: 'مكتملة', color: 'bg-gray-50 text-gray-700 border-gray-200' }
                      ]}
                      value={filterFamiliesCampaignStatus}
                      onChange={setFilterFamiliesCampaignStatus}
                      placeholder="اختر حالات الحملات..."
                      iconColor="emerald"
                      searchable
                    />
                  </div>

                  {/* Aid Category Multi-Select */}
                  <div className="md:col-span-2">
                    <MultiSelectFilter
                      label="فئات المساعدات"
                      options={AID_CATEGORIES}
                      value={filterFamiliesAidCategory}
                      onChange={setFilterFamiliesAidCategory}
                      placeholder="اختر فئات المساعدات..."
                      iconColor="emerald"
                      searchable
                    />
                  </div>

                  {/* Benefit Count Filter */}
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">عدد الحملات المستفادة</label>
                    <select
                      value={filterFamiliesBenefitCount}
                      onChange={(e) => setFilterFamiliesBenefitCount(e.target.value as 'all' | 'حملة واحدة' | 'حملات متعددة')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                    >
                      <option value="all">الجميع</option>
                      <option value="حملة واحدة">حملة واحدة</option>
                      <option value="حملات متعددة">حملات متعددة (2+)</option>
                    </select>
                  </div>

                  {/* Family Size Range */}
                  <div className="grid grid-cols-2 gap-2 md:col-span-2">
                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-2">من</label>
                      <input
                        type="number"
                        value={filterFamilySizeMin}
                        onChange={(e) => setFilterFamilySizeMin(e.target.value)}
                        placeholder="0"
                        min="0"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
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
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
                      />
                    </div>
                  </div>

                  {/* Vulnerability Section Header */}
                  <div className="lg:col-span-3 mt-6 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 rounded-xl flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-gray-800">معايير الهشاشة (11 معيار)</h4>
                        <p className="text-xs text-gray-500 font-bold mt-0.5">فلاتر مخصصة لكل معيار حسب النوع والبيانات المتاحة</p>
                      </div>
                    </div>
                  </div>

                  {/* Vulnerability Priority & Score */}
                  <div className="md:col-span-2">
                    <MultiSelectFilter
                      label="مستوى الهشاشة"
                      options={VULNERABILITY_LEVELS}
                      value={filterVulnerabilityPriority}
                      onChange={setFilterVulnerabilityPriority}
                      placeholder="اختر مستويات الهشاشة..."
                      iconColor="purple"
                      searchable
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-2">درجة الهشاشة (من)</label>
                      <input
                        type="number"
                        value={filterVulnerabilityScoreMin}
                        onChange={(e) => setFilterVulnerabilityScoreMin(e.target.value)}
                        placeholder="0"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-black text-gray-700 mb-2">درجة الهشاشة (إلى)</label>
                      <input
                        type="number"
                        value={filterVulnerabilityScoreMax}
                        onChange={(e) => setFilterVulnerabilityScoreMax(e.target.value)}
                        placeholder="100"
                        min="0"
                        max="100"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold"
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

                  {/* Housing Filter */}
                  <div className="md:col-span-2">
                    <MultiSelectFilter
                      label="نوع السكن"
                      options={HOUSING_TYPES}
                      value={filterHousingType}
                      onChange={setFilterHousingType}
                      placeholder="اختر أنواع السكن..."
                      iconColor="purple"
                      searchable
                    />
                    <div className="mt-2">
                      <label className="block text-xs font-black text-gray-600 mb-1">مرافق صحية سيئة؟</label>
                      <select
                        value={filterHasPoorSanitary === null ? 'all' : filterHasPoorSanitary ? 'yes' : 'no'}
                        onChange={(e) => setFilterHasPoorSanitary(e.target.value === 'all' ? null : e.target.value === 'yes')}
                        className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-100 transition-all text-sm font-bold"
                      >
                        <option value="all">الجميع</option>
                        <option value="yes">نعم</option>
                        <option value="no">لا</option>
                      </select>
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

                  {/* Marital Status Filter */}
                  <div className="md:col-span-2">
                    <MultiSelectFilter
                      label="الحالة الاجتماعية (بدون معيل)"
                      options={MARITAL_STATUS_OPTIONS}
                      value={filterMaritalStatus}
                      onChange={setFilterMaritalStatus}
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

            {/* Select All and Counter */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0">
              <button
                onClick={handleSelectAllFamilies}
                className="px-4 py-2 bg-white border-2 border-gray-200 hover:border-emerald-500 text-gray-700 rounded-xl font-bold transition-all"
              >
                {selectedFamilyIds.length === filteredFamilies.length ? 'إلغاء الكل' : 'تحديد الكل'}
              </button>
              <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-black">
                المحدد: {selectedFamilyIds.length} من {filteredFamilies.length}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredFamilies.map(family => {
                  const isSelected = selectedFamilyIds.includes(family.id);

                  // Find campaigns where family actually RECEIVED aid (distributedTo), not just targeted
                  const allAidCampaigns = campaigns.filter(c =>
                    c.distributedTo?.includes(family.id) &&
                    (!editingCampaign || c.id !== editingCampaign.id)
                  );

                  // Find campaigns where family is only TARGETED (not yet distributed)
                  const targetedCampaigns = campaigns.filter(c =>
                    c.targetFamilies?.includes(family.id) &&
                    !c.distributedTo?.includes(family.id) &&
                    (!editingCampaign || c.id !== editingCampaign.id)
                  );

                  // Separate active/planned campaigns from soft-deleted ones (for received aid)
                  // Show ALL non-deleted campaigns regardless of status
                  const activeAidCampaigns = allAidCampaigns.filter(c =>
                    !c.isDeleted && !c.deletedAt
                  );
                  const deletedAidCampaigns = allAidCampaigns.filter(c =>
                    c.isDeleted || c.deletedAt
                  );

                  // Has received aid from ANY campaign (including deleted)
                  const hasReceivedAid = allAidCampaigns.length > 0;
                  // Has received aid from active campaigns
                  const hasActiveReceivedAid = activeAidCampaigns.length > 0;
                  // Is targeted but not yet received
                  const isTargetedNotDistributed = targetedCampaigns.length > 0 && !hasReceivedAid;

                  const aidCategories = [...new Set(activeAidCampaigns.map(c => c.aidCategory))];
                  const benefitCount = activeAidCampaigns.length;
                  const hasDeletedAid = deletedAidCampaigns.length > 0;

                  // Get actual aid type names for received aid from active campaigns
                  const aidTypeDetails = activeAidCampaigns.map(c => ({
                    campaignName: c.name,
                    aidTypeName: c.aidType,
                    aidCategory: c.aidCategory,
                    status: c.status
                  }));

                  // Group active campaigns by aid type for cleaner display
                  const activeCampaignsGroupedByAid = activeAidCampaigns.reduce((acc, campaign) => {
                    const key = campaign.aidType || 'غير محدد';
                    if (!acc[key]) {
                      acc[key] = [];
                    }
                    acc[key].push(campaign);
                    return acc;
                  }, {} as Record<string, typeof activeAidCampaigns>);

                  // Get aid details from deleted campaigns (to show what they actually benefited from)
                  const deletedAidDetails = deletedAidCampaigns.map(c => ({
                    campaignName: c.name,
                    aidTypeName: c.aidType,
                    aidCategory: c.aidCategory,
                    status: c.status
                  }));

                  // Get unique categories from deleted campaigns for badge display
                  const deletedAidCategories = [...new Set(deletedAidCampaigns.map(c => c.aidCategory))];

                  // Group deleted campaigns by aid type for cleaner display
                  const deletedCampaignsGroupedByAid = deletedAidCampaigns.reduce((acc, campaign) => {
                    const key = campaign.aidType || 'غير محدد';
                    if (!acc[key]) {
                      acc[key] = [];
                    }
                    acc[key].push(campaign);
                    return acc;
                  }, {} as Record<string, typeof deletedAidCampaigns>);

                  return (
                    <div
                      key={family.id}
                      onClick={() => handleFamilyToggle(family.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-50 shadow-md'
                          : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-black text-gray-800 mb-2">{family.head_of_family_name}</p>
                          {family.head_of_family_phone_number && (
                            <p className="text-xs text-gray-500 font-bold mt-1">{family.head_of_family_phone_number}</p>
                          )}
                        </div>
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>

                      {/* Family ID and members count */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        {family.head_of_family_national_id && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-200">
                            الهوية: {family.head_of_family_national_id}
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-black">
                          <span className="font-black">{family.total_members_count}</span> أفراد
                        </span>
                      </div>

                      {/* Aid status indicator */}
                      {hasReceivedAid && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          {/* Show received aid from active/non-deleted campaigns */}
                          {hasActiveReceivedAid && (
                            <div className="mb-2">
                              <div className="flex items-center gap-1 mb-2">
                                <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-black text-emerald-700">
                                  استلم من {benefitCount === 1 ? 'حملة واحدة' : `${benefitCount} حملات`}
                                </span>
                              </div>

                              {/* Show campaign names grouped by aid type from active campaigns */}
                              <div className="space-y-2 mb-2">
                                {Object.entries(activeCampaignsGroupedByAid).map(([aidType, campaigns]) => (
                                  <div key={aidType} className="text-[10px]">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="font-black text-gray-700">• {aidType}</span>
                                      {campaigns.length > 1 && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 text-emerald-700">
                                          {campaigns.length} حملات
                                        </span>
                                      )}
                                    </div>
                                    {/* List campaign names */}
                                    <div className="mr-4 space-y-0.5">
                                      {campaigns.map((campaign, idx) => (
                                        <div key={idx} className="flex items-center gap-1 text-gray-600">
                                          <span className="text-[9px]">⟨ {campaign.name}</span>
                                          {campaign.status && (
                                            <span className={`px-1 py-px rounded text-[8px] font-black ${STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-700'}`}>
                                              {STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.label}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Category badges */}
                              <div className="flex flex-wrap gap-1">
                                {aidCategories.map(category => {
                                  const catConfig = AID_CATEGORIES.find(c => c.value === category);
                                  return (
                                    <span
                                      key={category}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-black ${catConfig?.color || 'bg-gray-100 text-gray-700'}`}
                                    >
                                      {catConfig?.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Show deleted campaign aid indicator with actual aid details */}
                          {hasDeletedAid && (
                            <div className={`mt-2 pt-2 border-t ${hasActiveReceivedAid ? 'border-gray-100' : ''}`}>
                              <div className="flex items-center gap-1 mb-2">
                                <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span className="text-xs font-black text-gray-500">
                                  استفاد سابقاً من {deletedAidCampaigns.length === 1 ? 'حملة واحدة' : `${deletedAidCampaigns.length} حملات`} (محذوفة الآن)
                                </span>
                              </div>

                              {/* Show campaign names grouped by aid type from deleted campaigns */}
                              <div className="space-y-2 mb-2">
                                {Object.entries(deletedCampaignsGroupedByAid).map(([aidType, campaigns]) => (
                                  <div key={aidType} className="text-[10px]">
                                    <div className="flex items-center gap-1 mb-1">
                                      <span className="font-black text-gray-700">• {aidType}</span>
                                      {campaigns.length > 1 && (
                                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-gray-100 text-gray-600">
                                          {campaigns.length} حملات
                                        </span>
                                      )}
                                    </div>
                                    {/* List campaign names */}
                                    <div className="mr-4 space-y-0.5">
                                      {campaigns.map((campaign, idx) => (
                                        <div key={idx} className="flex items-center gap-1 text-gray-600">
                                          <span className="text-[9px]">⟨ {campaign.name}</span>
                                          {campaign.status && (
                                            <span className={`px-1 py-px rounded text-[8px] font-black ${STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-700'}`}>
                                              {STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.label}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Category badges from deleted campaigns */}
                              <div className="flex flex-wrap gap-1">
                                {deletedAidCategories.map(category => {
                                  const catConfig = AID_CATEGORIES.find(c => c.value === category);
                                  return (
                                    <span
                                      key={category}
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-black opacity-60 ${catConfig?.color || 'bg-gray-100 text-gray-700'}`}
                                    >
                                      {catConfig?.label}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show targeted but not yet distributed */}
                      {isTargetedNotDistributed && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-xs font-black text-blue-600">
                              مستهدف من {targetedCampaigns.length === 1 ? 'حملة واحدة' : `${targetedCampaigns.length} حملات`} (لم يتم التوزيع بعد)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Show "not beneficiary" only if family has NO aid history and not targeted */}
                      {!hasReceivedAid && !isTargetedNotDistributed && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <span className="text-xs font-black text-emerald-600">غير مستفيد من حملات أخرى</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {filteredFamilies.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-bold">لا توجد أسر مطابقة</p>
                  {filterFamiliesWithAid !== 'all' && (
                    <p className="text-sm text-gray-400 font-bold mt-2">حاول تغيير الفلتر</p>
                  )}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex-shrink-0">
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowFamilySelector(false);
                    setFamilySearchTerm('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  onClick={handleSaveFamilies}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg"
                >
                  تأكيد الاختيار ({selectedFamilyIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filter Panel */}
      <FilterPanel
        title="تصفية الحملات"
        activeFilters={[
          ...(searchTerm ? [{ id: 'search', label: `بحث: "${searchTerm}"`, value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
          ...(filterStatus !== 'all' ? [{ id: 'status', label: `الحالة: ${STATUS_CONFIG[filterStatus as keyof typeof STATUS_CONFIG]?.label}`, value: filterStatus, onRemove: () => setFilterStatus('all') }] : []),
          ...(filterCategory !== 'all' ? [{ id: 'category', label: `الفئة: ${AID_CATEGORIES.find(c => c.value === filterCategory)?.label}`, value: filterCategory, onRemove: () => setFilterCategory('all') }] : []),
          ...(filterInventoryItem !== 'all' ? [{ id: 'inventory', label: `العنصر: ${inventoryItems.find(i => i.id === filterInventoryItem)?.name || 'غير محدد'}`, value: filterInventoryItem, onRemove: () => setFilterInventoryItem('all') }] : []),
          ...(filterStartDate || filterEndDate ? [{ id: 'dateRange', label: `من ${filterStartDate || '...'} إلى ${filterEndDate || '...'}`, value: 'dateRange', onRemove: () => { setFilterStartDate(''); setFilterEndDate(''); } }] : [])
        ]}
        onClearAll={() => {
          setSearchTerm('');
          setFilterStatus('all');
          setFilterCategory('all');
          setFilterInventoryItem('all');
          setFilterStartDate('');
          setFilterEndDate('');
        }}
        defaultOpen={showFilters}
        iconColor="emerald"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search Input with Arabic Normalization - Full Width */}
          <div className="lg:col-span-3">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="ابحث باسم الحملة، الوصف، النوع، الملاحظات..."
              iconColor="emerald"
              showArabicHint
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
            >
              <option value="all">الجميع</option>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">الفئة</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
            >
              <option value="all">الجميع</option>
              {AID_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          {/* Inventory Item Filter */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">عنصر المخزون</label>
            <select
              value={filterInventoryItem}
              onChange={(e) => setFilterInventoryItem(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
            >
              <option value="all">الجميع</option>
              {inventoryItems.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range Filter - Full Width */}
          <div className="md:col-span-3">
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

      {/* Table */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
              <tr>
                <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">الحملة</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">النوع</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">الفترة</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">الحالة</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-right text-xs md:text-sm font-black text-gray-700 whitespace-nowrap hidden md:table-cell">ملاحظات</th>
                <th className="px-4 md:px-6 py-3 md:py-4 text-center text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400 rounded-full flex items-center justify-center">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-gray-500 font-bold text-lg">لا توجد حملات مطابقة</p>
                        <p className="text-gray-400 text-sm font-bold mt-1">ابدأ بإنشاء حملة جديدة</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCampaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 transition-all">
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div>
                        <p className="font-black text-gray-800 text-sm md:text-base">{campaign.name}</p>
                        {campaign.description && (
                          <p className="text-xs md:text-sm text-gray-500 font-bold mt-1 line-clamp-1">{campaign.description}</p>
                        )}
                        {campaign.targetFamilies && campaign.targetFamilies.length > 0 && (
                          <p className="text-xs text-emerald-600 font-bold mt-1">
                            {campaign.targetFamilies.length} أسرة مستهدفة
                            {campaign.distributedTo && campaign.distributedTo.length > 0 && (
                              <span className="text-gray-400 mr-2">
                                • تم التوزيع لـ {campaign.distributedTo.length} أسرة
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="space-y-1 md:space-y-2">
                        <p className="text-sm font-bold text-gray-800 truncate max-w-[150px] md:max-w-none">{campaign.aidType}</p>
                        <span className={`inline-block px-2 md:px-3 py-1 rounded-lg font-black text-xs border-2 ${AID_CATEGORIES.find(c => c.value === campaign.aidCategory)?.color || 'bg-gray-100 text-gray-700'}`}>
                          {getCategoryLabel(campaign.aidCategory)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <div className="space-y-1">
                        <p className="text-xs md:text-sm font-bold text-gray-700">{new Date(campaign.startDate).toLocaleDateString('ar-EG')}</p>
                        {campaign.endDate && (
                          <p className="text-xs text-gray-500 font-bold">إلى {new Date(campaign.endDate).toLocaleDateString('ar-EG')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 text-center">
                      <span className={`inline-block px-3 md:px-4 py-1 md:py-1.5 rounded-full font-black text-xs border-2 ${STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-100 text-gray-700'}`}>
                        {STATUS_CONFIG[campaign.status as keyof typeof STATUS_CONFIG]?.label}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4 hidden md:table-cell">
                      <p className="text-sm text-gray-600 font-bold max-w-xs truncate">{campaign.notes || '-'}</p>
                    </td>
                    <td className="px-4 md:px-6 py-3 md:py-4">
                      <div className="flex items-center justify-center gap-1 md:gap-2">
                        {/* Status Change Dropdown */}
                        <div className="relative">
                          <select
                            value={campaign.status}
                            onChange={(e) => handleStatusChange(campaign.id, e.target.value as AidCampaign['status'])}
                            className="px-2 md:px-3 py-1 md:py-1.5 text-xs font-black rounded-lg border-2 border-gray-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all cursor-pointer"
                            title="تغيير الحالة"
                          >
                            {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                              <option key={value} value={value}>{config.label}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          onClick={() => handleEdit(campaign)}
                          className="p-1.5 md:p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="تعديل"
                        >
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(campaign)}
                          className="p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف"
                        >
                          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-emerald-800 mb-2 text-lg">معلومات هامة</h3>
            <ul className="space-y-1 text-sm text-emerald-700 font-bold">
              <li>• حملات المساعدات خاصة بكل مخيم ولا يمكن إدارتها إلا من قبل مديري نفس المخيم</li>
              <li>• يمكنك إنشاء حملات جديدة وتحديث حالتها (مخططة، نشطة، مكتملة، ملغاة)</li>
              <li>• حدد الأسر المستهدفة لتسهيل عملية التوزيع والمتابعة</li>
              <li>• يمكن تعديل أو إلغاء الحملات المخططة فقط</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AidCampaigns;
