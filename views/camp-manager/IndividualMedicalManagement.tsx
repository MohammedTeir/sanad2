// views/camp-manager/IndividualMedicalManagement.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import { SearchInput } from '../../components/filters';
import { matchesArabicSearchMulti } from '../../utils/arabicTextUtils';
import LoadingSkeleton from '../../components/LoadingSkeleton';

interface IndividualMedicalRecord {
  id: string; // Unique ID (member.id or `${dp.id}_head` or `${dp.id}_wife`)
  familyId: string;
  name: string;
  nationalId: string;
  gender: string;
  age: number;
  relation: string;
  phoneNumber?: string;
  
  // Medical data
  disabilityType: string;
  disabilityDetails?: string;
  chronicDiseaseType: string;
  chronicDiseaseDetails?: string;
  hasWarInjury: boolean;
  warInjuryType: string;
  warInjuryDetails?: string;
  medicalFollowupRequired: boolean;
  medicalFollowupFrequency?: string;
}

const Icons = {
  Medical: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  Disability: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
  Injury: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  Refresh: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Search: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  Users: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
};

const IndividualMedicalManagement: React.FC = () => {
  const [individuals, setIndividuals] = useState<IndividualMedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'chronic' | 'injury' | 'disability'>('chronic');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = sessionService.getCurrentUser();
      const campId = currentUser?.campId;

      if (!campId) {
        setToast({ message: 'معرف المخيم غير موجود', type: 'error' });
        return;
      }

      const families = await realDataService.getDPs(campId);
      
      const allIndividuals: IndividualMedicalRecord[] = [];

      families.forEach(dp => {
        // 1. Add Head of Family
        if (dp.chronicDiseaseType !== 'لا يوجد' || dp.hasWarInjury || (dp.disabilityType && dp.disabilityType !== 'لا يوجد')) {
          allIndividuals.push({
            id: `${dp.id}_head`,
            familyId: dp.id,
            name: dp.headOfFamily,
            nationalId: dp.nationalId,
            gender: dp.gender,
            age: dp.age,
            relation: 'رب الأسرة',
            phoneNumber: dp.phoneNumber,
            disabilityType: dp.disabilityType || 'لا يوجد',
            disabilityDetails: dp.disabilityDetails,
            chronicDiseaseType: dp.chronicDiseaseType || 'لا يوجد',
            chronicDiseaseDetails: dp.chronicDiseaseDetails,
            hasWarInjury: !!dp.hasWarInjury,
            warInjuryType: dp.warInjuryType || 'لا يوجد',
            warInjuryDetails: dp.warInjuryDetails,
            medicalFollowupRequired: !!dp.medicalFollowupRequired,
            medicalFollowupFrequency: dp.medicalFollowupFrequency
          });
        }

        // 2. Add Wife (if applicable and has medical issues)
        if (dp.wifeName && (dp.wifeChronicDiseaseType !== 'لا يوجد' || dp.wifeWarInjuryType !== 'لا يوجد' || (dp.wifeDisabilityType && dp.wifeDisabilityType !== 'لا يوجد'))) {
          allIndividuals.push({
            id: `${dp.id}_wife`,
            familyId: dp.id,
            name: dp.wifeName,
            nationalId: dp.wifeNationalId || '',
            gender: 'أنثى',
            age: dp.wifeAge || 0,
            relation: 'الزوجة',
            disabilityType: dp.wifeDisabilityType || 'لا يوجد',
            disabilityDetails: dp.wifeDisabilityDetails,
            chronicDiseaseType: dp.wifeChronicDiseaseType || 'لا يوجد',
            chronicDiseaseDetails: dp.wifeChronicDiseaseDetails,
            hasWarInjury: dp.wifeWarInjuryType !== 'لا يوجد',
            warInjuryType: dp.wifeWarInjuryType || 'لا يوجد',
            warInjuryDetails: dp.wifeWarInjuryDetails,
            medicalFollowupRequired: !!dp.wifeMedicalFollowupRequired,
            medicalFollowupFrequency: dp.wifeMedicalFollowupFrequency
          });
        }

        // 3. Add Husband (if applicable - for female-headed households)
        if (dp.husbandName && (dp.husbandChronicDiseaseType !== 'لا يوجد' || dp.husbandWarInjuryType !== 'لا يوجد' || (dp.husbandDisabilityType && dp.husbandDisabilityType !== 'لا يوجد'))) {
          allIndividuals.push({
            id: `${dp.id}_husband`,
            familyId: dp.id,
            name: dp.husbandName,
            nationalId: dp.husbandNationalId || '',
            gender: 'ذكر',
            age: dp.husbandAge || 0,
            relation: 'الزوج',
            disabilityType: dp.husbandDisabilityType || 'لا يوجد',
            disabilityDetails: dp.husbandDisabilityDetails,
            chronicDiseaseType: dp.husbandChronicDiseaseType || 'لا يوجد',
            chronicDiseaseDetails: dp.husbandChronicDiseaseDetails,
            hasWarInjury: dp.husbandWarInjuryType !== 'لا يوجد',
            warInjuryType: dp.husbandWarInjuryType || 'لا يوجد',
            warInjuryDetails: dp.husbandWarInjuryDetails,
            medicalFollowupRequired: !!dp.husbandMedicalFollowupRequired,
            medicalFollowupFrequency: dp.husbandMedicalFollowupFrequency
          });
        }

        // 4. Add Family Members
        if (dp.members && Array.isArray(dp.members)) {
          dp.members.forEach(member => {
            if (member.chronicDiseaseType !== 'لا يوجد' || member.hasWarInjury || (member.disabilityType && member.disabilityType !== 'لا يوجد')) {
              allIndividuals.push({
                id: member.id,
                familyId: dp.id,
                name: member.name,
                nationalId: member.nationalId || '',
                gender: member.gender,
                age: member.age,
                relation: member.relation,
                phoneNumber: member.phoneNumber,
                disabilityType: member.disabilityType || 'لا يوجد',
                disabilityDetails: member.disabilityDetails,
                chronicDiseaseType: member.chronicDiseaseType || 'لا يوجد',
                chronicDiseaseDetails: member.chronicDiseaseDetails,
                hasWarInjury: !!member.hasWarInjury,
                warInjuryType: member.warInjuryType || 'لا يوجد',
                warInjuryDetails: member.warInjuryDetails,
                medicalFollowupRequired: !!member.medicalFollowupRequired,
                medicalFollowupFrequency: member.medicalFollowupFrequency
              });
            }
          });
        }
      });

      setIndividuals(allIndividuals);
    } catch (error: any) {
      console.error('Error loading medical data:', error);
      setToast({ message: 'فشل تحميل البيانات الصحية', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredIndividuals = useMemo(() => {
    return individuals.filter(ind => {
      // Tab filter
      if (activeTab === 'chronic' && ind.chronicDiseaseType === 'لا يوجد') return false;
      if (activeTab === 'injury' && !ind.hasWarInjury) return false;
      if (activeTab === 'disability' && ind.disabilityType === 'لا يوجد') return false;

      // Search filter
      if (searchTerm === '') return true;
      return matchesArabicSearchMulti(searchTerm, [
        ind.name,
        ind.nationalId,
        ind.chronicDiseaseType,
        ind.warInjuryType,
        ind.disabilityType,
        ind.relation
      ]);
    });
  }, [individuals, activeTab, searchTerm]);

  const stats = useMemo(() => {
    return {
      chronic: individuals.filter(ind => ind.chronicDiseaseType !== 'لا يوجد').length,
      injury: individuals.filter(ind => ind.hasWarInjury).length,
      disability: individuals.filter(ind => ind.disabilityType !== 'لا يوجد').length,
    };
  }, [individuals]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/20">
              <Icons.Medical className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800">المتابعة الصحية للأفراد</h1>
              <p className="text-gray-500 font-bold text-sm">عرض المرضى، الجرحى، وذوي الإعاقة بشكل فردي</p>
            </div>
          </div>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <Icons.Refresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            تحديث البيانات
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <button
          onClick={() => setActiveTab('chronic')}
          className={`p-6 rounded-[2rem] border-2 transition-all text-right group ${
            activeTab === 'chronic' 
              ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 translate-y-[-4px]' 
              : 'bg-white border-gray-100 text-gray-600 hover:border-blue-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeTab === 'chronic' ? 'bg-white/20' : 'bg-blue-50'}`}>
              <Icons.Medical className={`w-6 h-6 ${activeTab === 'chronic' ? 'text-white' : 'text-blue-600'}`} />
            </div>
            <span className={`text-3xl font-black ${activeTab === 'chronic' ? 'text-white' : 'text-blue-600'}`}>{stats.chronic}</span>
          </div>
          <p className="font-black text-xl mb-1">الأمراض المزمنة</p>
          <p className={`text-sm font-bold ${activeTab === 'chronic' ? 'text-blue-100' : 'text-gray-400'}`}>عرض جميع المصابين بأمراض مزمنة</p>
        </button>

        <button
          onClick={() => setActiveTab('injury')}
          className={`p-6 rounded-[2rem] border-2 transition-all text-right group ${
            activeTab === 'injury' 
              ? 'bg-red-600 border-red-600 text-white shadow-xl shadow-red-200 translate-y-[-4px]' 
              : 'bg-white border-gray-100 text-gray-600 hover:border-red-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeTab === 'injury' ? 'bg-white/20' : 'bg-red-50'}`}>
              <Icons.Injury className={`w-6 h-6 ${activeTab === 'injury' ? 'text-white' : 'text-red-600'}`} />
            </div>
            <span className={`text-3xl font-black ${activeTab === 'injury' ? 'text-white' : 'text-red-600'}`}>{stats.injury}</span>
          </div>
          <p className="font-black text-xl mb-1">جرحى الحرب</p>
          <p className={`text-sm font-bold ${activeTab === 'injury' ? 'text-red-100' : 'text-gray-400'}`}>عرض جميع المصابين بجروح حرب</p>
        </button>

        <button
          onClick={() => setActiveTab('disability')}
          className={`p-6 rounded-[2rem] border-2 transition-all text-right group ${
            activeTab === 'disability' 
              ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-200 translate-y-[-4px]' 
              : 'bg-white border-gray-100 text-gray-600 hover:border-purple-200'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${activeTab === 'disability' ? 'bg-white/20' : 'bg-purple-50'}`}>
              <Icons.Disability className={`w-6 h-6 ${activeTab === 'disability' ? 'text-white' : 'text-purple-600'}`} />
            </div>
            <span className={`text-3xl font-black ${activeTab === 'disability' ? 'text-white' : 'text-purple-600'}`}>{stats.disability}</span>
          </div>
          <p className="font-black text-xl mb-1">ذوي الإعاقة</p>
          <p className={`text-sm font-bold ${activeTab === 'disability' ? 'text-purple-100' : 'text-gray-400'}`}>عرض جميع الأفراد من ذوي الإعاقة</p>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-100 p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative group">
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Icons.Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="ابحث بالاسم، رقم الهوية، نوع المرض أو الإعاقة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-12 pl-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:bg-white focus:border-blue-500 focus:outline-none font-bold transition-all text-lg"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 space-y-4">
            <LoadingSkeleton count={5} />
          </div>
        ) : filteredIndividuals.length === 0 ? (
          <div className="p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Icons.Users className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-black text-gray-800 mb-2">لا توجد نتائج مطابقة</h3>
            <p className="text-gray-400 font-bold">جرب تغيير معايير البحث أو اختيار تبويب آخر</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="bg-gray-50 border-b-2 border-gray-100">
                  <th className="px-6 py-5 font-black text-gray-700">الاسم</th>
                  <th className="px-6 py-5 font-black text-gray-700">الصلة</th>
                  <th className="px-6 py-5 font-black text-gray-700">البيانات الأساسية</th>
                  <th className="px-6 py-5 font-black text-gray-700">التفاصيل الصحية</th>
                  <th className="px-6 py-5 font-black text-gray-700">متابعة طبية</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-gray-50">
                {filteredIndividuals.map((ind) => (
                  <tr key={ind.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-gray-800 text-lg">{ind.name}</span>
                        <span className="text-xs text-gray-400 font-bold mt-1">رقم الهوية: {ind.nationalId || 'غير متوفر'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                        ind.relation === 'رب الأسرة' ? 'bg-blue-100 text-blue-700' :
                        ind.relation === 'الزوجة' || ind.relation === 'الزوج' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {ind.relation}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-gray-600">{ind.gender} • {ind.age} عام</span>
                        <span className="text-xs text-gray-400 font-bold">{ind.phoneNumber || 'لا يوجد هاتف'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        {activeTab === 'chronic' && (
                          <div className="flex flex-col">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-black self-start mb-1">
                              {ind.chronicDiseaseType}
                            </span>
                            {ind.chronicDiseaseDetails && (
                              <span className="text-xs text-gray-500 font-bold max-w-[200px] truncate" title={ind.chronicDiseaseDetails}>
                                {ind.chronicDiseaseDetails}
                              </span>
                            )}
                          </div>
                        )}
                        {activeTab === 'injury' && (
                          <div className="flex flex-col">
                            <span className="px-3 py-1 bg-red-50 text-red-700 rounded-lg text-xs font-black self-start mb-1">
                              {ind.warInjuryType}
                            </span>
                            {ind.warInjuryDetails && (
                              <span className="text-xs text-gray-500 font-bold max-w-[200px] truncate" title={ind.warInjuryDetails}>
                                {ind.warInjuryDetails}
                              </span>
                            )}
                          </div>
                        )}
                        {activeTab === 'disability' && (
                          <div className="flex flex-col">
                            <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-black self-start mb-1">
                              {ind.disabilityType}
                            </span>
                            {ind.disabilityDetails && (
                              <span className="text-xs text-gray-500 font-bold max-w-[200px] truncate" title={ind.disabilityDetails}>
                                {ind.disabilityDetails}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      {ind.medicalFollowupRequired ? (
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1.5 text-emerald-600 font-black text-sm">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            مطلوب
                          </span>
                          <span className="text-xs text-gray-400 font-bold">{ind.medicalFollowupFrequency || 'غير محدد'}</span>
                        </div>
                      ) : (
                        <span className="text-gray-300 font-bold text-sm italic">غير مطلوب</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default IndividualMedicalManagement;
