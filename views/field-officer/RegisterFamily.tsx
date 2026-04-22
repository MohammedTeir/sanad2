
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import { DPProfile, Camp, MaritalStatus, Gender, DisabilityType, DisabilitySeverity, ChronicDiseaseType, WarInjuryType, HousingType, MonthlyIncomeRange, WidowReasonExpanded, SanitaryFacilitiesType, WaterSourceType, ElectricitySourceType, Role } from '../../types';
import { GAZA_LOCATIONS, getAreasByGovernorate } from '../../constants/gazaLocations';
import InputMask from '../../components/InputMask';
import FileUpload from '../../components/FileUpload';

const inputClass = "w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 text-sm font-bold";
const labelClass = "block text-xs font-black text-gray-700 mb-2 mr-1 uppercase tracking-wide";
const sectionTitle = "text-xl font-black text-emerald-800 mb-6 flex items-center gap-3 border-b-2 border-emerald-100 pb-4";

const calculateAge = (dob: string) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

const RegisterFamily = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isFieldOfficer, setIsFieldOfficer] = useState(false);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [filteredCamps, setFilteredCamps] = useState<Camp[]>([]);
  const [selectedGovernorate, setSelectedGovernorate] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [availableAreas, setAvailableAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);
  
  const [formData, setFormData] = useState({
    // رب الأسرة - 4-part name structure
    headFirstName: '', headFatherName: '', headGrandfatherName: '', headFamilyName: '',
    id: '', gender: 'ذكر' as Gender, dob: '',
    maritalStatus: 'أعزب' as MaritalStatus, headRole: '' as any,
    isWorking: false, job: '', monthlyIncome: 0, monthlyIncomeRange: 'بدون دخل' as MonthlyIncomeRange, phone: '', phoneSecondary: '',
    widowReason: 'وفاة طبيعية' as WidowReasonExpanded,

    // صحة رب الأسرة
    disability: 'لا يوجد' as DisabilityType, disabilitySeverity: 'متوسطة' as DisabilitySeverity,
    chronic: 'لا يوجد' as ChronicDiseaseType,
    warInjury: 'لا يوجد' as WarInjuryType,
    medicalFollowupRequired: false, medicalFollowupFrequency: '', medicalFollowupDetails: '',

    // الزوج/ة
    wifeName: '', wifeId: '', wifeDob: '',

    // السكن والنزوح
    origGov: 'محافظة شمال غزة', origReg: '', origDetails: '',
    origHousingType: 'إيجار' as 'ملك' | 'إيجار',
    housingType: 'خيمة' as HousingType, housingSharingStatus: 'سكن فردي' as 'سكن فردي' | 'سكن مشترك',
    housingDetailedType: 'خيمة فردية' as string, housingFurnished: false,
    preferredCamp: '', landmark: '',

    // ملفات
    idCardUrl: '', medicalReportUrl: '', signatureUrl: '',

    // إداري
    nomination: ''
  });

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check if user is field officer and auto-fill camp data
  useEffect(() => {
    const currentUser = sessionService.getCurrentUser();
    const isFO = currentUser?.role === Role.FIELD_OFFICER;
    setIsFieldOfficer(isFO);

    if (isFO && currentUser?.campId) {
      // Auto-fill camp ID for field officer
      setFormData(prev => ({ ...prev, preferredCamp: currentUser.campId }));
    }
  }, []);

  // Auto-fill governorate and area when camps are loaded for field officers
  useEffect(() => {
    if (isFieldOfficer && camps.length > 0) {
      const currentUser = sessionService.getCurrentUser();
      if (currentUser?.campId) {
        const camp = camps.find(c => c.id === currentUser.campId);
        if (camp) {
          setSelectedGovernorate(camp.location.governorate);
          setSelectedArea(camp.location.area);
          console.log('Field officer camp found:', camp.name, 'Governorate:', camp.location.governorate, 'Area:', camp.location.area);
        }
      }
    }
  }, [camps, isFieldOfficer]);

  useEffect(() => {
    // Auto-clear error after 5 seconds
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    // Load camps - use public endpoint for both beneficiaries and field officers
    realDataService.getCamps(true)
      .then(data => {
        console.log('Camps loaded:', data);
        setCamps(data);
        setFilteredCamps(data);
      })
      .catch(error => {
        console.error('Error loading camps:', error);
        setError('فشل في تحميل المخيمات. يرجى التحقق من الاتصال بالإنترنت.');
      });
  }, []);

  // Effect to handle area selection when governorate changes
  useEffect(() => {
    // This will trigger when formData.origGov changes, ensuring the area dropdown updates
    console.log('Original governorate changed to:', formData.origGov);
    const areas = getAreasByGovernorate(formData.origGov);
    setAvailableAreas(areas);
  }, [formData.origGov]);

  // Initialize areas for the default governorate when component mounts
  useEffect(() => {
    const areas = getAreasByGovernorate(formData.origGov);
    setAvailableAreas(areas);
  }, []); // Empty dependency array to run only once on mount

  // Function to handle governorate selection and filter camps
  const handleGovernorateChange = (gov: string) => {
    setSelectedGovernorate(gov);
    setSelectedArea(''); // Reset area selection when governorate changes
    if (gov === '') {
      // If no governorate selected (meaning "all governorates"), show all camps
      setFilteredCamps(camps);
    } else {
      // Filter camps by selected governorate
      const filtered = camps.filter(camp => camp.location.governorate === gov);
      setFilteredCamps(filtered);
      // Update available areas for the selected governorate
      const areas = getAreasByGovernorate(gov);
      setAvailableAreas(areas);
    }
  };

  // Function to handle area selection and further filter camps
  const handleAreaChange = (area: string) => {
    setSelectedArea(area);
    if (area === '') {
      // If no area selected, filter only by governorate
      if (selectedGovernorate === '') {
        setFilteredCamps(camps); // Show all camps if no governorate selected
      } else {
        const filtered = camps.filter(camp => camp.location.governorate === selectedGovernorate);
        setFilteredCamps(filtered);
      }
    } else {
      // Filter camps by both governorate and area
      let filtered = camps;
      if (selectedGovernorate !== '') {
        filtered = filtered.filter(camp => camp.location.governorate === selectedGovernorate);
      }
      filtered = filtered.filter(camp => camp.location.area === area);
      setFilteredCamps(filtered);
    }
  };

  // Function to handle disability selection
  const handleDisabilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDisability = e.target.value as DisabilityType;
    if (newDisability === 'لا يوجد') {
      setFormData(prev => ({
        ...prev,
        disability: newDisability,
        disabilitySeverity: undefined as any
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        disability: newDisability,
        disabilitySeverity: prev.disabilitySeverity || ('متوسطة' as DisabilitySeverity)
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const age = calculateAge(formData.dob);
      // Generate a proper ID for the record (UUID format) while keeping national ID separate
      const recordId = crypto.randomUUID ? crypto.randomUUID() : `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Validate 4-part name fields
      const firstName = formData.headFirstName?.trim() || '';
      const fatherName = formData.headFatherName?.trim() || '';
      const grandfatherName = formData.headGrandfatherName?.trim() || '';
      const familyName = formData.headFamilyName?.trim() || '';
      
      console.log('Validating name fields:', {
        headFirstName: formData.headFirstName,
        headFirstNameTrimmed: firstName,
        headFatherName: formData.headFatherName,
        headFatherNameTrimmed: fatherName,
        headGrandfatherName: formData.headGrandfatherName,
        headGrandfatherNameTrimmed: grandfatherName,
        headFamilyName: formData.headFamilyName,
        headFamilyNameTrimmed: familyName
      });

      console.log('Camp and location data:', {
        preferredCamp: formData.preferredCamp,
        selectedGovernorate: selectedGovernorate,
        selectedArea: selectedArea,
        isFieldOfficer: isFieldOfficer,
        campName: camps.find(c => c.id === formData.preferredCamp)?.name
      });
      
      if (!firstName || !fatherName || !familyName) {
        throw new Error(`الرجاء إدخال الاسم الأول، اسم الأب، واسم العائلة. القيم الحالية: "${firstName}", "${fatherName}", "${familyName}"`);
      }

      const profile: DPProfile = {
        id: recordId,
        // 4-part name structure
        headFirstName: formData.headFirstName,
        headFatherName: formData.headFatherName,
        headGrandfatherName: formData.headGrandfatherName,
        headFamilyName: formData.headFamilyName,
        headOfFamily: `${formData.headFirstName} ${formData.headFatherName} ${formData.headGrandfatherName} ${formData.headFamilyName}`.trim(),
        
        nationalId: formData.id || '',
        gender: formData.gender,
        dateOfBirth: formData.dob,
        age: age,
        maritalStatus: formData.maritalStatus,
        widowReason: formData.maritalStatus === 'أرمل' ? formData.widowReason : undefined,
        headRole: formData.maritalStatus !== 'أعزب' ? formData.headRole : undefined,
        isWorking: formData.isWorking,
        job: formData.isWorking ? formData.job : 'لا يعمل',
        monthlyIncome: formData.monthlyIncome || undefined,
        monthlyIncomeRange: formData.monthlyIncomeRange,
        phoneNumber: formData.phone,
        phoneSecondary: formData.phoneSecondary,

        disabilityType: formData.disability,
        disabilitySeverity: formData.disability !== 'لا يوجد' ? formData.disabilitySeverity : undefined,
        chronicDiseaseType: formData.chronic,
        warInjuryType: formData.warInjury,
        medicalFollowupRequired: formData.medicalFollowupRequired,
        medicalFollowupFrequency: formData.medicalFollowupRequired ? formData.medicalFollowupFrequency : '',
        medicalFollowupDetails: formData.medicalFollowupRequired ? formData.medicalFollowupDetails : '',

        wifeName: showWifeSection ? formData.wifeName : undefined,
        wifeNationalId: showWifeSection ? formData.wifeId : undefined,
        wifeDateOfBirth: showWifeSection ? formData.wifeDob : undefined,
        wifeIsPregnant: undefined,
        wifePregnancyMonth: undefined,
        wifePregnancySpecialNeeds: undefined,
        wifePregnancyFollowupDetails: undefined,
        wifeIsWorking: undefined,
        wifeOccupation: undefined,
        wifeDisabilityType: undefined,
        wifeDisabilitySeverity: undefined,
        wifeChronicDiseaseType: undefined,
        wifeWarInjuryType: undefined,
        wifeMedicalFollowupRequired: undefined,
        wifeMedicalFollowupFrequency: undefined,
        wifeMedicalFollowupDetails: undefined,

        originalAddress: {
          governorate: formData.origGov,
          region: formData.origReg,
          details: formData.origDetails,
          housingType: formData.origHousingType
        },
        currentHousing: {
          type: formData.housingType,
          campId: formData.preferredCamp || '',
          landmark: formData.landmark,
          governorate: selectedGovernorate,
          region: selectedArea,
          isSuitableForFamilySize: true, // Default value, will be updated by camp manager
          // Enhanced housing fields
          sharingStatus: formData.housingSharingStatus,
          detailedType: formData.housingDetailedType,
          furnished: formData.housingType === 'شقة' ? formData.housingFurnished : undefined,
          // Note: electricityAccess, sanitaryFacilities, waterSource will be set later by camp manager
        },
        nominationBody: formData.nomination,
        members: [],
        aidHistory: [],
        vulnerabilityScore: 50,
        vulnerabilityPriority: 'منخفض' as const,
        vulnerabilityBreakdown: {},
        totalMembersCount: 1,
        maleCount: formData.gender === 'ذكر' ? 1 : 0,
        femaleCount: formData.gender === 'أنثى' ? 1 : 0,
        childCount: 0,
        teenagerCount: 0,
        adultCount: 0,
        seniorCount: 0,
        disabledCount: 0,
        injuredCount: 0,
        pregnantWomenCount: 0,
        registeredDate: new Date().toISOString().split('T')[0],
        lastUpdated: new Date().toISOString(),
        idCardUrl: formData.idCardUrl,
        medicalReportUrl: formData.medicalReportUrl,
        signatureUrl: formData.signatureUrl
      };

      // Validate required fields before submission with specific error messages
      const profileNationalId = formData.id?.toString() || '';
      const trimmedNationalId = profileNationalId.trim();
      if (!trimmedNationalId || trimmedNationalId.length !== 9) {
        throw new Error(`حقل رقم الهوية مطلوب و يجب أن يتكون من 9 أرقام. القيمة الحالية: "${trimmedNationalId}", الطول: ${trimmedNationalId.length}`);
      }
      if (!profile.currentHousing.campId) {
        throw new Error(isFieldOfficer ? 'خطأ: لم يتم تحديد المخيم. يرجى تسجيل الدخول مرة أخرى.' : 'الرجاء اختيار المخيم المستهدف');
      }
      if (!profile.headOfFamily) {
        throw new Error('حقل اسم رب الأسرة مطلوب');
      }
      if (!profile.gender) {
        throw new Error('حقل الجنس مطلوب');
      }
      if (!profile.dateOfBirth) {
        throw new Error('حقل تاريخ الميلاد مطلوب');
      }

      // Check if national ID is already registered
      const existingFamily = await realDataService.lookupFamilyByNationalId(profile.nationalId);
      if (existingFamily) {
        throw new Error('رقم الهوية مسجل مسبقاً، يرجى التحقق من البيانات');
      }

      // Vulnerability score will be calculated by database trigger
      profile.vulnerabilityScore = 50; // Default score
      profile.vulnerabilityPriority = 'low';

      // Use different registration type based on user role
      const registrationType = isFieldOfficer ? 'field_officer' : 'self_reg';
      const isPublicRegistration = !isFieldOfficer;
      await realDataService.saveDP(profile, registrationType, isPublicRegistration);
      setStep(4);
    } catch (err) {
      console.error('Registration error:', err); // Log the actual error for debugging
      
      let errorMessage = 'فشل في حفظ البيانات. تأكد من جودة الاتصال بالسحابة.';
      
      if (err instanceof Error) {
        const errorMsg = err.message.toLowerCase();
        
        // Check for specific error types and show appropriate Arabic message
        if (errorMsg.includes('رقم الهوية مسجل')) {
          errorMessage = 'رقم الهوية مسجل مسبقاً، يرجى التحقق من البيانات';
        } else if (errorMsg.includes('العائلة مسجلة')) {
          errorMessage = 'العائلة مسجلة مسبقاً بنفس رقم الهوية';
        } else if (errorMsg.includes('duplicate') || errorMsg.includes('unique constraint')) {
          errorMessage = 'رقم الهوية مسجل مسبقاً، يرجى التحقق من البيانات';
        } else if (errorMsg.includes('fetch') || errorMsg.includes('network')) {
          errorMessage = 'فشل في حفظ البيانات. تأكد من جودة الاتصال بالإنترنت.';
        } else if (errorMsg.includes('constraint') || errorMsg.includes('violates')) {
          errorMessage = 'هناك خطأ في البيانات المدخلة. يرجى مراجعة الحقول والمحاولة مرة أخرى.';
        } else {
          errorMessage = err.message;
        }
      }
      
      setError(errorMessage);
    } finally { setLoading(false); }
  };

  const showWifeSection = (formData.maritalStatus === 'متزوج');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-4xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden border-2 border-emerald-100">
        <div className="p-10 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 blur-2xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h1 className="text-3xl font-black">تسجيل ملف الأسرة</h1>
            </div>
            <p className="text-emerald-100 font-bold text-sm">نظام "سند" - إدارة المساعدات والاحتياجات المركزية</p>
          </div>
        </div>

        <div className="p-10">
          {/* Progress Indicator */}
          <div className="flex gap-3 mb-10">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex-1 h-3 rounded-full transition-all duration-700 ${step >= i ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-200' : 'bg-gray-100'}`}></div>
            ))}
          </div>

          {/* Step Labels */}
          <div className="flex justify-between mb-8 text-xs font-black uppercase tracking-widest">
            <span className={step >= 1 ? 'text-emerald-700' : 'text-gray-400'}>بيانات رب الأسرة</span>
            <span className={step >= 2 ? 'text-emerald-700' : 'text-gray-400'}>بيانات الزوج/ة</span>
            <span className={step >= 3 ? 'text-emerald-700' : 'text-gray-400'}>السكن والنزوح</span>
          </div>

          {/* Error Toast */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top duration-300">
              <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-black text-red-800 text-sm">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-600 hover:text-red-800">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <h3 className={sectionTitle}>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                بيانات ربّ الأسرة
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      الاسم الأول *
                    </span>
                  </label>
                  <input type="text" value={formData.headFirstName} onChange={e => setFormData({...formData, headFirstName: e.target.value})} className={inputClass} placeholder="الاسم الأول" />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      اسم الأب *
                    </span>
                  </label>
                  <input type="text" value={formData.headFatherName} onChange={e => setFormData({...formData, headFatherName: e.target.value})} className={inputClass} placeholder="اسم الأب" />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      اسم الجد *
                    </span>
                  </label>
                  <input type="text" value={formData.headGrandfatherName} onChange={e => setFormData({...formData, headGrandfatherName: e.target.value})} className={inputClass} placeholder="اسم الجد" />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      اسم العائلة *
                    </span>
                  </label>
                  <input type="text" value={formData.headFamilyName} onChange={e => setFormData({...formData, headFamilyName: e.target.value})} className={inputClass} placeholder="اسم العائلة" />
                </div>
                <div className="md:col-span-4 mt-2">
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-3">
                    <p className="text-xs font-bold text-emerald-800">
                      <span className="text-emerald-600">✓</span> الاسم الكامل: 
                      <span className="font-black mr-2">
                        {formData.headFirstName || '...'} {formData.headFatherName || '...'} {formData.headGrandfatherName || '...'} {formData.headFamilyName || '...'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                      </svg>
                      رقم الهوية الوطنية
                    </span>
                  </label>
                  <InputMask
                    value={formData.id}
                    onChange={(value) => setFormData({...formData, id: value})}
                    mask="999999999"
                    placeholder="9 أرقام"
                    className={inputClass}
                    name="nationalId"
                  />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      تاريخ الميلاد
                    </span>
                  </label>
                  <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      الحالة الاجتماعية
                    </span>
                  </label>
                  <select value={formData.maritalStatus} onChange={e => setFormData({...formData, maritalStatus: e.target.value as any})} className={inputClass}>
                    <option value="أعزب">أعزب / عزباء</option>
                    <option value="متزوج">متزوج / متزوجة</option>
                    <option value="أرمل">أرمل / أرملة</option>
                    <option value="مطلق">مطلق / مطلقة</option>
                    <option value="أسرة هشة">أسرة هشة</option>
                  </select>
                </div>
                {formData.maritalStatus === 'أرمل' && (
                  <div>
                    <label className={labelClass}>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        سبب الوفاة
                      </span>
                    </label>
                    <select value={formData.widowReason} onChange={e => setFormData({...formData, widowReason: e.target.value as any})} className={inputClass}>
                      <option value="وفاة طبيعية">وفاة طبيعية</option>
                      <option value="شهيد">شهيد</option>
                      <option value="حادث">حادث</option>
                      <option value="مرض">مرض</option>
                      <option value="غير ذلك">غير ذلك</option>
                    </select>
                  </div>
                )}
                {formData.maritalStatus !== 'أعزب' && (
                  <div>
                    <label className={labelClass}>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        صفة ربّ الأسرة
                      </span>
                    </label>
                    <select value={formData.headRole} onChange={e => setFormData({...formData, headRole: e.target.value as any})} className={inputClass}>
                      <option value="">اختر الصفة</option>
                      <option value="أب">أب (مسؤول عن جميع الأفراد والزوجة)</option>
                      <option value="أم">أم (معيلة للأطفال أو أرملة)</option>
                      <option value="زوجة">زوجة (في حال عجز الزوج أو تعدد الزوجات)</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-6 rounded-3xl border-2 border-emerald-100 space-y-6">
                <h4 className="font-black text-emerald-800 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  معلومات التواصل والعمل
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-emerald-100">
                    <input type="checkbox" checked={formData.isWorking} onChange={e => setFormData({...formData, isWorking: e.target.checked})} className="w-6 h-6 accent-emerald-600 rounded-lg" />
                    <span className="font-black text-gray-700 text-sm">هل يعمل حالياً؟</span>
                  </div>
                  {formData.isWorking && (
                    <div>
                      <label className={labelClass}>المهنة</label>
                      <input type="text" placeholder="مثال: مدرس، نجار..." value={formData.job} onChange={e => setFormData({...formData, job: e.target.value})} className={inputClass} />
                    </div>
                  )}
                  {formData.isWorking && (
                    <div>
                      <label className={labelClass}>الدخل الشهري التقريبي (شيكل)</label>
                      <input type="number" placeholder="أدخل الدخل" value={formData.monthlyIncome || ''} onChange={e => setFormData({...formData, monthlyIncome: parseFloat(e.target.value) || 0})} className={inputClass} step="0.01" min="0" />
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>نطاق الدخل الشهري (شيكل)</label>
                    <select value={formData.monthlyIncomeRange} onChange={e => setFormData({...formData, monthlyIncomeRange: e.target.value as any})} className={inputClass}>
                      <option value="بدون دخل">بدون دخل</option>
                      <option value="أقل من 100">أقل من 100 شيكل</option>
                      <option value="100-300">100 - 300 شيكل</option>
                      <option value="300-500">300 - 500 شيكل</option>
                      <option value="أكثر من 500">أكثر من 500 شيكل</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClass}>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        رقم الهاتف الأساسي
                      </span>
                    </label>
                    <InputMask
                      value={formData.phone}
                      onChange={(value) => setFormData({...formData, phone: value})}
                      mask="9999999999"
                      placeholder="0599123456"
                      className={inputClass}
                      name="phoneNumber"
                    />
                  </div>
                  <div>
                    <label className={labelClass}>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        رقم الهاتف البديل
                      </span>
                    </label>
                    <InputMask
                      value={formData.phoneSecondary}
                      onChange={(value) => setFormData({...formData, phoneSecondary: value})}
                      mask="9999999999"
                      placeholder="0599123457"
                      className={inputClass}
                      name="phoneSecondary"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-3xl border-2 border-blue-100 space-y-6">
                <h4 className="font-black text-blue-800 text-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  الحالة الصحية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className={labelClass}>الإعاقة</label>
                    <select value={formData.disability} onChange={handleDisabilityChange} className={inputClass}>
                      <option value="لا يوجد">لا توجد</option>
                      <option value="حركية">حركية</option>
                      <option value="بصرية">بصرية</option>
                      <option value="سمعية">سمعية</option>
                      <option value="ذهنية">ذهنية</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                  {formData.disability !== 'لا يوجد' && (
                    <div>
                      <label className={labelClass}>درجة الإعاقة</label>
                      <select value={formData.disabilitySeverity} onChange={e => setFormData({...formData, disabilitySeverity: e.target.value as any})} className={inputClass}>
                        <option value="بسيطة">بسيطة</option>
                        <option value="متوسطة">متوسطة</option>
                        <option value="شديدة">شديدة</option>
                        <option value="كلية">كلية</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className={labelClass}>الأمراض المزمنة</label>
                    <select value={formData.chronic} onChange={e => setFormData({...formData, chronic: e.target.value as any})} className={inputClass}>
                      <option value="لا يوجد">لا يوجد</option>
                      <option value="سكري">سكري</option>
                      <option value="ضغط دم">ضغط</option>
                      <option value="قلب">قلب</option>
                      <option value="سرطان">سرطان</option>
                      <option value="ربو">ربو / أمراض صدر</option>
                      <option value="فشل كلوي">فشل كلوي</option>
                      <option value="مرض نفسي">أمراض نفسية</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>إصابة حرب</label>
                    <select value={formData.warInjury} onChange={e => setFormData({...formData, warInjury: e.target.value as any})} className={inputClass}>
                      <option value="لا يوجد">لا توجد</option>
                      <option value="بتر">بتر</option>
                      <option value="كسر">كسور</option>
                      <option value="شظية">شظايا</option>
                      <option value="حرق">حروق</option>
                      <option value="رأس/وجه">إصابة رأس أو وجه</option>
                      <option value="عمود فقري">إصابة عمود فقري</option>
                      <option value="أخرى">أخرى</option>
                    </select>
                  </div>
                </div>

                {/* Medical Follow-up Section */}
                <div className="pt-4 border-t-2 border-blue-200">
                  <div className="flex items-center gap-4 mb-4">
                    <input 
                      type="checkbox" 
                      checked={formData.medicalFollowupRequired} 
                      onChange={e => setFormData({...formData, medicalFollowupRequired: e.target.checked})} 
                      className="w-6 h-6 accent-blue-600 rounded-lg" 
                    />
                    <span className="font-black text-blue-800 text-sm">هل يحتاج متابعة طبية مستمرة؟</span>
                  </div>
                  {formData.medicalFollowupRequired && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={labelClass}>تكرار المتابعة</label>
                        <select value={formData.medicalFollowupFrequency} onChange={e => setFormData({...formData, medicalFollowupFrequency: e.target.value})} className={inputClass}>
                          <option value="يومي">يومي</option>
                          <option value="أسبوعي">أسبوعي</option>
                          <option value="شهري">شهري</option>
                          <option value="آخر">آخر</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className={labelClass}>نوع المتابعة (تفاصيل)</label>
                        <input 
                          type="text" 
                          value={formData.medicalFollowupDetails} 
                          onChange={e => setFormData({...formData, medicalFollowupDetails: e.target.value})} 
                          className={inputClass} 
                          placeholder="مثال: غسيل كلى، علاج طبيعي، زيارات دورية..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button onClick={() => setStep(2)} className="flex-1 min-w-[200px] py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-[1.5rem] font-black shadow-xl shadow-emerald-200 hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-2">
                  <span>متابعة</span>
                  <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <button onClick={() => navigate('/login')} className="px-6 py-5 bg-red-50 text-red-600 rounded-[1.5rem] font-black hover:bg-red-100 transition-all flex items-center gap-2 whitespace-nowrap">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <h3 className={sectionTitle}>
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 text-amber-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </div>
                بيانات الزوج/ة
              </h3>

              {showWifeSection ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className={labelClass}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          الاسم الرباعي
                        </span>
                      </label>
                      <input type="text" value={formData.wifeName} onChange={e => setFormData({...formData, wifeName: e.target.value})} className={inputClass} placeholder="كما في الهوية" />
                    </div>
                    <div>
                      <label className={labelClass}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                          </svg>
                          رقم الهوية
                        </span>
                      </label>
                      <input type="text" value={formData.wifeId} onChange={e => setFormData({...formData, wifeId: e.target.value})} className={inputClass} placeholder="9 أرقام" />
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        تاريخ الميلاد
                      </span>
                    </label>
                    <input type="date" value={formData.wifeDob} onChange={e => setFormData({...formData, wifeDob: e.target.value})} className={inputClass} />
                  </div>
                </div>
              ) : (
                <div className="p-10 bg-gray-50 rounded-[2rem] text-center border-2 border-dashed border-gray-200">
                  <div className="w-16 h-16 bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-bold text-sm">لا ينطبق قسم الزوج/ة على ملفك الحالي. يمكنك تخطي هذه المرحلة.</p>
                </div>
              )}

              <div className="flex flex-wrap gap-3 pt-4">
                <button onClick={() => setStep(3)} className="flex-1 min-w-[200px] py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-[1.5rem] font-black shadow-xl shadow-emerald-200 hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-2">
                  <span>متابعة</span>
                  <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <button onClick={() => setStep(1)} className="px-6 py-5 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black hover:bg-gray-200 transition-all flex items-center gap-2">
                  <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  رجوع
                </button>
                <button onClick={() => navigate('/login')} className="px-6 py-5 bg-red-50 text-red-600 rounded-[1.5rem] font-black hover:bg-red-100 transition-all flex items-center gap-2 whitespace-nowrap">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  إلغاء
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <h3 className={sectionTitle}>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                السكن والنزوح
              </h3>

              {/* Original Address Section */}
              <div className="bg-gradient-to-br from-slate-50 to-gray-50 p-6 rounded-[2rem] border-2 border-slate-100">
                <h4 className="font-black text-slate-800 text-sm mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  العنوان الأصلي
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      المحافظة الأصلية
                    </span>
                  </label>
                  <select value={formData.origGov} onChange={e => setFormData({...formData, origGov: e.target.value})} className={inputClass}>
                    {GAZA_LOCATIONS.map(gov => (
                      <option key={gov.name} value={gov.arabic_name}>{gov.arabic_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                      المنطقة / الحي
                    </span>
                  </label>
                  <select value={formData.origReg} onChange={e => setFormData({...formData, origReg: e.target.value})} className={inputClass}>
                    <option value="">اختر المنطقة</option>
                    {availableAreas.map(area => (
                      <option key={area.name} value={area.arabic_name}>{area.arabic_name}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      العنوان الأصلي بالتفصيل
                    </span>
                  </label>
                  <input type="text" value={formData.origDetails} onChange={e => setFormData({...formData, origDetails: e.target.value})} className={inputClass} placeholder="شارع، معلم معروف.." />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      نوع السكن الأصلي
                    </span>
                  </label>
                  <select value={formData.origHousingType} onChange={e => setFormData({...formData, origHousingType: e.target.value as 'ملك' | 'إيجار'})} className={inputClass}>
                    <option value="ملك">ملك</option>
                    <option value="إيجار">إيجار</option>
                  </select>
                </div>
              </div>
              </div>

              {/* Current Address Section */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 rounded-[2rem] border-2 border-amber-100">
                <h4 className="font-black text-amber-800 text-sm mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  العنوان الحالي
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className={labelClass}>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        نوع السكن الحالي
                      </span>
                    </label>
                    <select value={formData.housingType} onChange={e => setFormData({...formData, housingType: e.target.value as any})} className={inputClass}>
                      <option value="خيمة">خيمة</option>
                      <option value="بيت إسمنتي">بيت باطون</option>
                      <option value="شقة">شقة مستأجرة</option>
                      <option value="أخرى">غير ذلك</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        حالة المشاركة
                      </span>
                    </label>
                    <select value={formData.housingSharingStatus} onChange={e => setFormData({...formData, housingSharingStatus: e.target.value as any})} className={inputClass}>
                      <option value="سكن فردي">سكن فردي (خيمة/سكن خاص)</option>
                      <option value="سكن مشترك">سكن مشترك (أكثر من أسرة)</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        النوع المفصل
                      </span>
                    </label>
                    <select value={formData.housingDetailedType} onChange={e => setFormData({...formData, housingDetailedType: e.target.value})} className={inputClass}>
                      {formData.housingType === 'خيمة' && (
                        <>
                          <option value="خيمة فردية">خيمة فردية</option>
                          <option value="خيمة مشتركة">خيمة مشتركة</option>
                        </>
                      )}
                      {formData.housingType === 'بيت إسمنتي' && (
                        <>
                          <option value="منزل كامل">منزل كامل</option>
                          <option value="غرفة واحدة">غرفة واحدة</option>
                          <option value="أكثر من غرفة">أكثر من غرفة</option>
                        </>
                      )}
                      {formData.housingType === 'شقة' && (
                        <>
                          <option value="شقة مفروشة">شقة مفروشة</option>
                          <option value="شقة غير مفروشة">شقة غير مفروشة</option>
                        </>
                      )}
                      {formData.housingType === 'أخرى' && (
                        <>
                          <option value="كرفان / حاوية">كرفان / حاوية</option>
                          <option value="أخرى">غير ذلك</option>
                        </>
                      )}
                    </select>
                  </div>
                  {formData.housingType === 'apartment' && (
                    <div className="md:col-span-3">
                      <label className="flex items-center gap-3 p-4 bg-amber-50 border-2 border-amber-200 rounded-xl cursor-pointer">
                        <input type="checkbox" checked={formData.housingFurnished} onChange={e => setFormData({...formData, housingFurnished: e.target.checked})} className="w-5 h-5 accent-amber-600 rounded-lg" />
                        <span className="font-black text-amber-800 text-sm">الشقة مفروشة</span>
                      </label>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {isFieldOfficer ? (
                  <div className="md:col-span-3">
                    <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-black text-emerald-800 text-sm">المخيم المستهدف</p>
                        <p className="text-xs text-emerald-600 font-bold mt-1">
                          {camps.find(c => c.id === formData.preferredCamp)?.name || 'جاري التحميل...'}
                        </p>
                        <p className="text-xs text-emerald-500 font-bold mt-1">
                          {selectedGovernorate} - {selectedArea}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className={labelClass}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          المحافظة الحالية
                        </span>
                      </label>
                      <select value={selectedGovernorate} onChange={e => handleGovernorateChange(e.target.value)} className={inputClass}>
                        <option value="">-- كل المحافظات --</option>
                        {GAZA_LOCATIONS.map(gov => (
                          <option key={gov.arabic_name} value={gov.arabic_name}>{gov.arabic_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                          </svg>
                          المنطقة / الحي
                        </span>
                      </label>
                      <select value={selectedArea} onChange={e => handleAreaChange(e.target.value)} className={inputClass}>
                        <option value="">-- كل المناطق --</option>
                        {availableAreas.map(area => (
                          <option key={area.name} value={area.arabic_name}>{area.arabic_name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          المخيم المستهدف *
                        </span>
                      </label>
                      <select 
                        value={formData.preferredCamp} 
                        onChange={e => setFormData({...formData, preferredCamp: e.target.value})} 
                        className={inputClass}
                        required
                      >
                        <option value="">-- اختر المخيم --</option>
                        {filteredCamps.map(camp => (
                          <option key={camp.id} value={camp.id}>{camp.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                <div className="md:col-span-3">
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      عنوان السكن الحالي بالتفصيل
                    </span>
                  </label>
                  <input 
                    type="text" 
                    value={formData.landmark} 
                    onChange={e => setFormData({...formData, landmark: e.target.value})} 
                    className={inputClass} 
                    placeholder="شارع، معلم معروف، وصف للموقع..."
                  />
                </div>
              </div>
              </div>

              {/* File Upload Section */}
              <div className="pt-8 border-t-2 border-emerald-100">
                <h4 className="text-xl font-black text-emerald-800 mb-6 flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 rounded-2xl flex items-center justify-center text-xl shadow-lg">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  المستندات (اختياري)
                </h4>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className={labelClass}>صورة الهوية الشخصية</label>
                    <FileUpload
                      existingFileUrl={formData.idCardUrl}
                      onRemoveFile={() => setFormData({...formData, idCardUrl: ''})}
                      onFileUpload={(url, fileName) => setFormData({...formData, idCardUrl: url})}
                      allowedTypes={['.jpg', '.jpeg', '.png', '.pdf']}
                      maxSizeInMB={5}
                      bucketName="id-cards"
                      folderPath="registrations"
                      label=""
                      buttonLabel="رفع صورة الهوية (اختياري)"
                      optional={true}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4">
                <button type="submit" disabled={loading} className="flex-1 min-w-[200px] py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-[1.5rem] font-black shadow-xl shadow-emerald-200 hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جاري إرسال الطلب...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      تأكيد وإرسال الطلب
                    </>
                  )}
                </button>
                <button type="button" onClick={() => setStep(2)} className="px-6 py-5 bg-gray-100 text-gray-600 rounded-[1.5rem] font-black hover:bg-gray-200 transition-all flex items-center gap-2">
                  <svg className="w-5 h-5 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  رجوع
                </button>
                <button type="button" onClick={() => navigate('/login')} className="px-6 py-5 bg-red-50 text-red-600 rounded-[1.5rem] font-black hover:bg-red-100 transition-all flex items-center gap-2 whitespace-nowrap">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  إلغاء
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="text-center py-16 animate-in zoom-in">
              <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-emerald-200">
                <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-4xl font-black text-gray-800 mb-4">تم تقديم طلب تسجيل الملف بنجاح</h3>
              <div className="w-24 h-1 bg-emerald-500 mx-auto mb-8 rounded-full"></div>
              <div className="max-w-md mx-auto space-y-4">
                <p className="text-gray-600 font-bold text-sm leading-relaxed">
                  جاري مراجعة بياناتك الصحية والاجتماعية من قبل فريق العمل
                </p>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">ملاحظة مهمة</p>
                  <p className="text-sm text-emerald-600 font-bold">
                    سيتم تفعيل حسابك بعد الموافقة على الطلب والتحقق من البيانات. يمكنك تسجيل الدخول بعد الموافقة.
                  </p>
                </div>
              </div>
              <button onClick={() => navigate('/login')} className="mt-12 w-full py-5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-[1.5rem] font-black shadow-2xl shadow-emerald-200 hover:from-emerald-700 hover:to-emerald-800 transition-all flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                العودة للرئيسية
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterFamily;
