// views/field-officer/FamilySearch.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import { DPProfile } from '../../types';
import Toast from '../../components/Toast';
import { SearchInput, MultiSelectFilter } from '../../components/filters';
import { normalizeArabic, matchesArabicSearchMulti } from '../../utils/arabicTextUtils';
import { GAZA_LOCATIONS, getAreasByGovernorate } from '../../constants/gazaLocations';

interface SearchFilters {
  searchQuery: string;
  status: 'all' | 'قيد الانتظار' | 'موافق' | 'مرفوض';
  vulnerabilityPriority: string[];
  governorate: string;
  region: string;
  familySizeMin: string;
  familySizeMax: string;
  vulnerabilityScoreMin: string;
  vulnerabilityScoreMax: string;
  childCountMin: string;
  childCountMax: string;
  seniorCountMin: string;
  seniorCountMax: string;
  hasDisability: boolean | null;
  disabilityType: string[];
  hasChronicDisease: boolean | null;
  chronicDiseaseType: string[];
  hasWarInjury: boolean | null;
  warInjuryType: string[];
  hasPregnancy: boolean | null;
  pregnancyMonthMin: string;
  incomeMin: string;
  incomeMax: string;
  housingTypes: string[];
  hasPoorSanitary: boolean | null;
  orphanCountMin: string;
  orphanCountMax: string;
  maritalStatusMulti: string[];
  isEmployed: boolean | null;
}

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

const HOUSING_TYPES = [
  { value: 'خيمة', label: 'خيمة' },
  { value: 'بيت إسمنتي', label: 'بيت إسمنتي' },
  { value: 'شقة', label: 'شقة' },
  { value: 'أخرى', label: 'أخرى' }
];

// Arabic translations for vulnerability breakdown keys
const VULNERABILITY_TRANSLATIONS: Record<string, string> = {
  income: 'الدخل',
  orphans: 'الأيتام',
  seniors: 'كبار السن',
  children: 'الأطفال',
  pregnancy: 'الحمل',
  disabilities: 'الإعاقات',
  housing_type: 'نوع السكن',
  war_injuries: 'إصابات الحرب',
  chronic_diseases: 'الأمراض المزمنة',
  absence_of_provider: 'انعدام المعيل'
};

const FamilySearch = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [families, setFamilies] = useState<DPProfile[]>([]);
  const [selectedFamily, setSelectedFamily] = useState<DPProfile | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const [selectedOrigGovernorate, setSelectedOrigGovernorate] = useState<string>('all');
  const [selectedOrigArea, setSelectedOrigArea] = useState<string>('all');
  const [availableOrigAreas, setAvailableOrigAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    searchQuery: '',
    status: 'all',
    vulnerabilityPriority: [],
    governorate: 'all',
    region: 'all',
    familySizeMin: '',
    familySizeMax: '',
    vulnerabilityScoreMin: '',
    vulnerabilityScoreMax: '',
    childCountMin: '',
    childCountMax: '',
    seniorCountMin: '',
    seniorCountMax: '',
    hasDisability: null,
    disabilityType: [],
    hasChronicDisease: null,
    chronicDiseaseType: [],
    hasWarInjury: null,
    warInjuryType: [],
    hasPregnancy: null,
    pregnancyMonthMin: '',
    incomeMin: '',
    incomeMax: '',
    housingTypes: [],
    hasPoorSanitary: null,
    orphanCountMin: '',
    orphanCountMax: '',
    maritalStatusMulti: [],
    isEmployed: null
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
    } else {
      setToast({ message: 'لم يتم تحديد المخيم.', type: 'error' });
    }
  }, []);

  useEffect(() => {
    if (filters.governorate !== 'all') {
      const areas = getAreasByGovernorate(filters.governorate);
      setAvailableOrigAreas(areas);
      setSelectedOrigArea('all');
    }
  }, [filters.governorate]);

  const loadFamilies = useCallback(async () => {
    try {
      setLoading(true);
      if (!currentCampId) return;

      const loadedFamilies = await realDataService.getDPs(currentCampId);
      setFamilies(loadedFamilies || []);
    } catch (err: any) {
      console.error('Error loading families:', err);
      setToast({ message: 'فشل تحميل قائمة الأسر', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentCampId]);

  useEffect(() => {
    if (currentCampId) {
      loadFamilies();
    }
  }, [currentCampId, loadFamilies]);

  const getFullName = (family: DPProfile): string => {
    if (family.headFirstName && family.headFatherName && family.headGrandfatherName && family.headFamilyName) {
      return `${family.headFirstName} ${family.headFatherName} ${family.headGrandfatherName} ${family.headFamilyName}`;
    }
    return family.headOfFamily || '';
  };

  const filteredFamilies = families.filter(family => {
    const fullName = getFullName(family);

    const matchesSearch = filters.searchQuery === '' || matchesArabicSearchMulti(filters.searchQuery, [
      fullName,
      family.nationalId,
      family.phoneNumber,
      family.phoneSecondary,
      family.currentHousingLandmark,
      family.originalAddressRegion,
      family.currentHousingRegion
    ]);

    const matchesStatus = filters.status === 'all' || family.registrationStatus === filters.status;

    const matchesVulnerabilityPriority = filters.vulnerabilityPriority.length === 0 ||
      (family.vulnerabilityPriority && filters.vulnerabilityPriority.includes(family.vulnerabilityPriority));

    const matchesGovernorate = filters.governorate === 'all' ||
      family.currentHousingGovernorate === filters.governorate ||
      family.originalAddressGovernorate === filters.governorate;

    const matchesRegion = filters.region === 'all' ||
      family.currentHousingRegion === filters.region ||
      family.originalAddressRegion === filters.region;

    const matchesFamilySizeMin = filters.familySizeMin === '' ||
      family.totalMembersCount >= parseInt(filters.familySizeMin);

    const matchesFamilySizeMax = filters.familySizeMax === '' ||
      family.totalMembersCount <= parseInt(filters.familySizeMax);

    const matchesVulnerabilityScore =
      (filters.vulnerabilityScoreMin === '' || (family.vulnerabilityScore || 0) >= parseFloat(filters.vulnerabilityScoreMin)) &&
      (filters.vulnerabilityScoreMax === '' || (family.vulnerabilityScore || 0) <= parseFloat(filters.vulnerabilityScoreMax));

    const matchesChildCountMin = filters.childCountMin === '' ||
      (family.childCount || 0) >= parseInt(filters.childCountMin);

    const matchesChildCountMax = filters.childCountMax === '' ||
      (family.childCount || 0) <= parseInt(filters.childCountMax);

    const matchesSeniorCountMin = filters.seniorCountMin === '' ||
      (family.seniorCount || 0) >= parseInt(filters.seniorCountMin);

    const matchesSeniorCountMax = filters.seniorCountMax === '' ||
      (family.seniorCount || 0) <= parseInt(filters.seniorCountMax);

    const matchesHasDisability = filters.hasDisability === null ||
      (filters.hasDisability ? (family.disabilityType && family.disabilityType !== 'لا يوجد') : (!family.disabilityType || family.disabilityType === 'لا يوجد'));

    const matchesDisabilityType = filters.disabilityType.length === 0 ||
      (family.disabilityType && filters.disabilityType.includes(family.disabilityType));

    const matchesHasChronicDisease = filters.hasChronicDisease === null ||
      (filters.hasChronicDisease ? (family.chronicDiseaseType && family.chronicDiseaseType !== 'لا يوجد') : (!family.chronicDiseaseType || family.chronicDiseaseType === 'لا يوجد'));

    const matchesChronicDiseaseType = filters.chronicDiseaseType.length === 0 ||
      (family.chronicDiseaseType && filters.chronicDiseaseType.includes(family.chronicDiseaseType));

    const matchesHasWarInjury = filters.hasWarInjury === null ||
      (filters.hasWarInjury ? (family.warInjuryType && family.warInjuryType !== 'لا يوجد') : (!family.warInjuryType || family.warInjuryType === 'لا يوجد'));

    const matchesWarInjuryType = filters.warInjuryType.length === 0 ||
      (family.warInjuryType && filters.warInjuryType.includes(family.warInjuryType));

    const matchesHasPregnancy = filters.hasPregnancy === null ||
      (filters.hasPregnancy ? family.wifeIsPregnant : !family.wifeIsPregnant);

    const matchesPregnancyMonthMin = filters.pregnancyMonthMin === '' ||
      (family.wifePregnancyMonth && family.wifePregnancyMonth >= parseInt(filters.pregnancyMonthMin));

    const matchesIncomeMin = filters.incomeMin === '' ||
      (family.monthlyIncome && family.monthlyIncome >= parseFloat(filters.incomeMin));

    const matchesIncomeMax = filters.incomeMax === '' ||
      (family.monthlyIncome && family.monthlyIncome <= parseFloat(filters.incomeMax));

    const matchesHousingTypes = filters.housingTypes.length === 0 ||
      (family.currentHousingType && filters.housingTypes.includes(family.currentHousingType));

    const matchesHasPoorSanitary = filters.hasPoorSanitary === null ||
      (filters.hasPoorSanitary ?
        (family.currentHousingSanitaryFacilities === 'مشتركة' || family.currentHousingSanitaryFacilities === 'لا (مرافق مشتركة)') :
        (family.currentHousingSanitaryFacilities === 'خاصة' || family.currentHousingSanitaryFacilities === 'نعم (دورة مياه خاصة)'));

    const matchesOrphanCountMin = filters.orphanCountMin === '' ||
      (family.orphanCount && family.orphanCount >= parseInt(filters.orphanCountMin));

    const matchesOrphanCountMax = filters.orphanCountMax === '' ||
      (family.orphanCount && family.orphanCount <= parseInt(filters.orphanCountMax));

    const matchesMaritalStatus = filters.maritalStatusMulti.length === 0 ||
      (family.maritalStatus && filters.maritalStatusMulti.includes(family.maritalStatus));

    const matchesIsEmployed = filters.isEmployed === null ||
      (filters.isEmployed ? family.isWorking : !family.isWorking);

    return matchesSearch && matchesStatus && matchesVulnerabilityPriority &&
           matchesGovernorate && matchesRegion &&
           matchesFamilySizeMin && matchesFamilySizeMax &&
           matchesVulnerabilityScore &&
           matchesChildCountMin && matchesChildCountMax &&
           matchesSeniorCountMin && matchesSeniorCountMax &&
           matchesHasDisability && matchesDisabilityType &&
           matchesHasChronicDisease && matchesChronicDiseaseType &&
           matchesHasWarInjury && matchesWarInjuryType &&
           matchesHasPregnancy && matchesPregnancyMonthMin &&
           matchesIncomeMin && matchesIncomeMax &&
           matchesHousingTypes && matchesHasPoorSanitary &&
           matchesOrphanCountMin && matchesOrphanCountMax &&
           matchesMaritalStatus && matchesIsEmployed;
  });

  const handleViewFamily = (family: DPProfile) => {
    setSelectedFamily(family);
    setShowModal(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'عالي جداً': return 'bg-red-100 text-red-700 border-red-200';
      case 'عالي': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'متوسط': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'منخفض': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'موافق': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'قيد الانتظار': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'مرفوض': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '', status: 'all', vulnerabilityPriority: [],
      governorate: 'all', region: 'all',
      familySizeMin: '', familySizeMax: '',
      vulnerabilityScoreMin: '', vulnerabilityScoreMax: '',
      childCountMin: '', childCountMax: '',
      seniorCountMin: '', seniorCountMax: '',
      hasDisability: null, disabilityType: [],
      hasChronicDisease: null, chronicDiseaseType: [],
      hasWarInjury: null, warInjuryType: [],
      hasPregnancy: null, pregnancyMonthMin: '',
      incomeMin: '', incomeMax: '',
      housingTypes: [], hasPoorSanitary: null,
      orphanCountMin: '', orphanCountMax: '',
      maritalStatusMulti: [], isEmployed: null
    });
    setSelectedOrigGovernorate('all');
    setSelectedOrigArea('all');
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-[2rem] p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black mb-1">بحث عن أسرة</h1>
            <p className="text-blue-100 font-bold text-sm">البحث والاستعلام عن الأسر المسجلة</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6 space-y-4">
        {/* Search Input with Arabic Support */}
        <div>
          <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              بحث
            </span>
          </label>
          <SearchInput
            value={filters.searchQuery}
            onChange={(value) => setFilters({ ...filters, searchQuery: value })}
            placeholder="ابحث بالاسم، رقم الهوية، الهاتف، الموقع..."
            debounceMs={300}
            showArabicHint={true}
            iconColor="blue"
          />
        </div>

        {/* Quick Filters Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                حالة التسجيل
              </span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as any })}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm font-bold"
            >
              <option value="all">الكل</option>
              <option value="قيد الانتظار">قيد الانتظار</option>
              <option value="موافق">موافق</option>
              <option value="مرفوض">مرفوض</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                الأولوية
              </span>
            </label>
            <MultiSelectFilter
              options={VULNERABILITY_LEVELS}
              value={filters.vulnerabilityPriority}
              onChange={(values) => setFilters({ ...filters, vulnerabilityPriority: values })}
              placeholder="اختر الأولوية"
              iconColor="blue"
            />
          </div>
        </div>

        {/* Toggle Advanced Filters */}
        <div className="pt-4 border-t border-gray-100">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-sm font-black text-blue-600 hover:text-blue-700 transition-colors"
          >
            <svg 
              className={`w-5 h-5 transition-transform ${showFilters ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            {showFilters ? 'إخفاء الفلاتر المتقدمة' : 'إظهار الفلاتر المتقدمة'}
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showFilters && (
          <div className="pt-4 border-t border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Geographic Filters */}
            <div>
              <h3 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                الموقع الجغرافي
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">المحافظة</label>
                  <select
                    value={filters.governorate}
                    onChange={(e) => setFilters({ ...filters, governorate: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold"
                  >
                    <option value="all">الكل</option>
                    {GAZA_LOCATIONS.map(gov => (
                      <option key={gov.name} value={gov.arabic_name}>{gov.arabic_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">المنطقة</label>
                  <select
                    value={filters.region}
                    onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                    className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold"
                    disabled={filters.governorate === 'all'}
                  >
                    <option value="all">الكل</option>
                    {availableOrigAreas.map(area => (
                      <option key={area.name} value={area.arabic_name}>{area.arabic_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Family Size & Demographics */}
            <div>
              <h3 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                حجم الأسرة والأفراد
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">عدد الأفراد (أدنى)</label>
                  <input type="number" value={filters.familySizeMin} onChange={(e) => setFilters({ ...filters, familySizeMin: e.target.value })} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">عدد الأفراد (أقصى)</label>
                  <input type="number" value={filters.familySizeMax} onChange={(e) => setFilters({ ...filters, familySizeMax: e.target.value })} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold" placeholder="20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">عدد الأطفال (أدنى)</label>
                  <input type="number" value={filters.childCountMin} onChange={(e) => setFilters({ ...filters, childCountMin: e.target.value })} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">كبار السن (أدنى)</label>
                  <input type="number" value={filters.seniorCountMin} onChange={(e) => setFilters({ ...filters, seniorCountMin: e.target.value })} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold" placeholder="0" />
                </div>
              </div>
            </div>

            {/* Vulnerability Score */}
            <div>
              <h3 className="text-sm font-black text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                درجة الهشاشة
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">الدرجة (أدنى)</label>
                  <input type="number" value={filters.vulnerabilityScoreMin} onChange={(e) => setFilters({ ...filters, vulnerabilityScoreMin: e.target.value })} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold" placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 mb-2">الدرجة (أقصى)</label>
                  <input type="number" value={filters.vulnerabilityScoreMax} onChange={(e) => setFilters({ ...filters, vulnerabilityScoreMax: e.target.value })} className="w-full p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold" placeholder="100" />
                </div>
              </div>
            </div>

            {/* Disability, Chronic Disease, War Injury */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-black text-gray-700 mb-3">الإعاقة</h3>
                <MultiSelectFilter
                  options={DISABILITY_TYPES.filter(t => t.value !== 'لا يوجد')}
                  value={filters.disabilityType}
                  onChange={(values) => setFilters({ ...filters, disabilityType: values })}
                  placeholder="نوع الإعاقة"
                  iconColor="purple"
                />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-700 mb-3">الأمراض المزمنة</h3>
                <MultiSelectFilter
                  options={CHRONIC_DISEASE_TYPES.filter(t => t.value !== 'لا يوجد')}
                  value={filters.chronicDiseaseType}
                  onChange={(values) => setFilters({ ...filters, chronicDiseaseType: values })}
                  placeholder="نوع المرض"
                  iconColor="red"
                />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-700 mb-3">إصابات الحرب</h3>
                <MultiSelectFilter
                  options={WAR_INJURY_TYPES.filter(t => t.value !== 'لا يوجد')}
                  value={filters.warInjuryType}
                  onChange={(values) => setFilters({ ...filters, warInjuryType: values })}
                  placeholder="نوع الإصابة"
                  iconColor="amber"
                />
              </div>
            </div>

            {/* Housing & Income */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-black text-gray-700 mb-3">نوع السكن</h3>
                <MultiSelectFilter
                  options={HOUSING_TYPES}
                  value={filters.housingTypes}
                  onChange={(values) => setFilters({ ...filters, housingTypes: values })}
                  placeholder="نوع السكن"
                  iconColor="emerald"
                />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-700 mb-3">الدخل الشهري</h3>
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={filters.incomeMin} onChange={(e) => setFilters({ ...filters, incomeMin: e.target.value })} className="p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold" placeholder="أدنى" />
                  <input type="number" value={filters.incomeMax} onChange={(e) => setFilters({ ...filters, incomeMax: e.target.value })} className="p-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none transition-all focus:bg-white focus:border-blue-500 text-sm font-bold" placeholder="أقصى" />
                </div>
              </div>
            </div>

            {/* Reset Filters Button */}
            <div className="pt-4 border-t border-gray-100">
              <button onClick={resetFilters} className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                إعادة تعيين جميع الفلاتر
              </button>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm font-bold text-gray-600">
            عدد النتائج: <span className="text-blue-600 font-black">{filteredFamilies.length}</span> من أصل {families.length}
          </p>
          {filteredFamilies.length !== families.length && (
            <button onClick={resetFilters} className="text-xs font-black text-blue-600 hover:text-blue-700">
              مسح الفلاتر
            </button>
          )}
        </div>
      </div>

      {/* Results List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gray-200 rounded-2xl"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 bg-gray-200 rounded"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-black text-gray-800 mb-2">لا توجد نتائج</h3>
          <p className="text-gray-500 font-bold mb-4">جرب تغيير معايير البحث أو الفلاتر</p>
          <button onClick={resetFilters} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all">
            إعادة تعيين الفلاتر
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFamilies.map((family) => (
            <div key={family.id} className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleViewFamily(family)}>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-black text-gray-800 text-lg truncate">{getFullName(family)}</h3>
                    <StatusBadge status={family.registrationStatus || 'قيد الانتظار'} />
                    <span className={`px-3 py-1 rounded-full text-xs font-black border ${getPriorityColor(family.vulnerabilityPriority || 'منخفض')}`}>
                      {family.vulnerabilityPriority || 'منخفض'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="text-gray-500 font-bold"><span className="text-gray-400">الهوية:</span> {family.nationalId || '-'}</div>
                    <div className="text-gray-500 font-bold"><span className="text-gray-400">الهاتف:</span> {family.phoneNumber || '-'}</div>
                    <div className="text-gray-500 font-bold"><span className="text-gray-400">الأفراد:</span> {family.totalMembersCount || 0}</div>
                    <div className="text-gray-500 font-bold"><span className="text-gray-400">الهشاشة:</span> {family.vulnerabilityScore || 0}%</div>
                  </div>
                </div>
                <div className="text-gray-400">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Family Details Modal */}
      {showModal && selectedFamily && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-black text-gray-800">تفاصيل الأسرة</h2>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl p-4">
                <h3 className="font-black text-emerald-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  بيانات رب الأسرة
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-gray-500">الاسم:</span><span className="font-black text-gray-800 mr-2">{getFullName(selectedFamily)}</span></div>
                  <div><span className="text-gray-500">رقم الهوية:</span><span className="font-black text-gray-800 mr-2">{selectedFamily.nationalId || '-'}</span></div>
                  <div><span className="text-gray-500">الهاتف:</span><span className="font-black text-gray-800 mr-2">{selectedFamily.phoneNumber || '-'}</span></div>
                  <div><span className="text-gray-500">الحالة:</span><StatusBadge status={selectedFamily.registrationStatus || 'قيد الانتظار'} /></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-500 font-bold mb-1">إجمالي الأفراد</p>
                  <p className="text-2xl font-black text-gray-800">{selectedFamily.totalMembersCount || 0}</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-500 font-bold mb-1">درجة الهشاشة</p>
                  <p className="text-2xl font-black text-gray-800">{selectedFamily.vulnerabilityScore || 0}%</p>
                </div>
                <div className="bg-gray-50 rounded-2xl p-4 text-center">
                  <p className="text-xs text-gray-500 font-bold mb-1">الأولوية</p>
                  <p className={`text-lg font-black ${selectedFamily.vulnerabilityPriority === 'عالي جداً' ? 'text-red-600' : selectedFamily.vulnerabilityPriority === 'عالي' ? 'text-orange-600' : selectedFamily.vulnerabilityPriority === 'متوسط' ? 'text-amber-600' : 'text-emerald-600'}`}>{selectedFamily.vulnerabilityPriority || 'منخفض'}</p>
                </div>
              </div>

              {selectedFamily.vulnerabilityBreakdown && Object.keys(selectedFamily.vulnerabilityBreakdown).length > 0 && (
                <div className="bg-gray-50 rounded-2xl p-4">
                  <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    تفصيل الهشاشة
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(selectedFamily.vulnerabilityBreakdown)
                      .filter(([key, value]) => key !== 'weights' && typeof value !== 'object')
                      .map(([key, value]: [string, any]) => (
                        <div key={key} className="flex justify-between items-center text-sm">
                          <span className="text-gray-600 font-bold">{VULNERABILITY_TRANSLATIONS[key] || key}</span>
                          <span className="text-gray-800 font-black">{value} نقاط</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="bg-gray-50 rounded-2xl p-4">
                <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  توزيع الأفراد
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">ذكور:</span><span className="font-black text-gray-800">{selectedFamily.maleCount || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">إناث:</span><span className="font-black text-gray-800">{selectedFamily.femaleCount || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">أطفال:</span><span className="font-black text-gray-800">{selectedFamily.childCount || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">مراهقين:</span><span className="font-black text-gray-800">{selectedFamily.teenagerCount || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">بالغين:</span><span className="font-black text-gray-800">{selectedFamily.adultCount || 0}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">كبار السن:</span><span className="font-black text-gray-800">{selectedFamily.seniorCount || 0}</span></div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setShowModal(false)} className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all">
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'موافق': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'قيد الانتظار': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'مرفوض': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  return <span className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusStyles()}`}>{status}</span>;
};

export default FamilySearch;
