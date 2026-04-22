import React, { useState, useEffect } from 'react';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';

interface VulnerabilityWeights {
  disabilityWeight: number;
  chronicDiseaseWeight: number;
  warInjuryWeight: number;
  pregnancyWeight: number;
  elderlyWeight: number;
  childrenWeight: number;
  femaleHeadWeight: number;
}

interface SystemConfig {
  geminiApiKey: string;
  publicRegistrationEnabled: boolean;
  autoSyncEnabled: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  backupFrequency: 'يومي' | 'أسبوعي' | 'شهري';
  maintenanceMode: boolean;
}

interface ConfigState {
  vulnerabilityWeights: VulnerabilityWeights;
  systemConfig: SystemConfig;
}

const SystemConfigurationHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'vulnerability' | 'security' | 'ai' | 'general'>('vulnerability');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [config, setConfig] = useState<ConfigState>({
    vulnerabilityWeights: {
      disabilityWeight: 25,
      chronicDiseaseWeight: 15,
      warInjuryWeight: 30,
      pregnancyWeight: 10,
      elderlyWeight: 20,
      childrenWeight: 15,
      femaleHeadWeight: 20
    },
    systemConfig: {
      geminiApiKey: '',
      publicRegistrationEnabled: true,
      autoSyncEnabled: true,
      sessionTimeout: 30,
      maxLoginAttempts: 5,
      backupFrequency: 'يومي',
      maintenanceMode: false
    }
  });

  const [showApiKey, setShowApiKey] = useState(false);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await makeAuthenticatedRequest('/config');

      // Load vulnerability weights
      if (data.vulnerability_weights?.value) {
        setConfig(prev => ({
          ...prev,
          vulnerabilityWeights: {
            disabilityWeight: data.vulnerability_weights.value.disabilityWeight || 25,
            chronicDiseaseWeight: data.vulnerability_weights.value.chronicDiseaseWeight || 15,
            warInjuryWeight: data.vulnerability_weights.value.warInjuryWeight || 30,
            pregnancyWeight: data.vulnerability_weights.value.pregnancyWeight || 10,
            elderlyWeight: data.vulnerability_weights.value.elderlyWeight || 20,
            childrenWeight: data.vulnerability_weights.value.childrenWeight || 15,
            femaleHeadWeight: data.vulnerability_weights.value.femaleHeadWeight || 20
          }
        }));
      }

      // Load security settings
      if (data.security_settings?.value) {
        setConfig(prev => ({
          ...prev,
          systemConfig: {
            ...prev.systemConfig,
            sessionTimeout: data.security_settings.value.sessionTimeout || 30,
            maxLoginAttempts: data.security_settings.value.maxLoginAttempts || 5,
            maintenanceMode: data.security_settings.value.maintenanceMode || false
          }
        }));
      }

      // Load AI settings
      if (data.ai_settings?.value) {
        setConfig(prev => ({
          ...prev,
          systemConfig: {
            ...prev.systemConfig,
            geminiApiKey: data.ai_settings.value.geminiApiKey || ''
          }
        }));
      }

      // Load general settings
      if (data.general_settings?.value) {
        setConfig(prev => ({
          ...prev,
          systemConfig: {
            ...prev.systemConfig,
            publicRegistrationEnabled: data.general_settings.value.publicRegistrationEnabled !== false,
            autoSyncEnabled: data.general_settings.value.autoSyncEnabled !== false,
            backupFrequency: data.general_settings.value.backupFrequency || 'يومي'
          }
        }));
      }
    } catch (err) {
      console.error('Error loading config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      // Determine which endpoint to call based on active tab
      let endpoint = '';
      let body = {};

      if (activeTab === 'vulnerability') {
        // Save vulnerability weights
        endpoint = 'vulnerability-weights';
        body = {
          disabilityWeight: config.vulnerabilityWeights.disabilityWeight,
          chronicDiseaseWeight: config.vulnerabilityWeights.chronicDiseaseWeight,
          warInjuryWeight: config.vulnerabilityWeights.warInjuryWeight,
          pregnancyWeight: config.vulnerabilityWeights.pregnancyWeight,
          elderlyWeight: config.vulnerabilityWeights.elderlyWeight,
          childrenWeight: config.vulnerabilityWeights.childrenWeight,
          femaleHeadWeight: config.vulnerabilityWeights.femaleHeadWeight
        };
      } else if (activeTab === 'security') {
        endpoint = 'security-settings';
        body = {
          sessionTimeout: config.systemConfig.sessionTimeout,
          maxLoginAttempts: config.systemConfig.maxLoginAttempts,
          maintenanceMode: config.systemConfig.maintenanceMode
        };
      } else if (activeTab === 'ai') {
        endpoint = 'ai-settings';
        body = {
          geminiApiKey: config.systemConfig.geminiApiKey
        };
      } else if (activeTab === 'general') {
        endpoint = 'general-settings';
        body = {
          publicRegistrationEnabled: config.systemConfig.publicRegistrationEnabled,
          autoSyncEnabled: config.systemConfig.autoSyncEnabled,
          backupFrequency: config.systemConfig.backupFrequency
        };
      }

      await makeAuthenticatedRequest(`/config/${endpoint}`, {
        method: 'PUT',
        body: JSON.stringify(body)
      });

      setSuccessMessage("تم حفظ إعدادات النظام بنجاح");
    } catch (err) {
      console.error('Error saving config:', err);
      setErrorMessage("خطأ في حفظ الإعدادات: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'vulnerability', label: 'معايير الهشاشة', icon: '📊' },
    { id: 'security', label: 'الأمان والصلاحيات', icon: '🔒' },
    { id: 'ai', label: 'الذكاء الاصطناعي', icon: '🤖' },
    { id: 'general', label: 'الإعدادات العامة', icon: '⚙️' }
  ];

  if (loading) return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 w-56 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-72 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="flex gap-2 overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-fit h-10 w-32 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>

      {/* Settings Sections Skeleton */}
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notifications */}
      {successMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 shadow-lg flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-black text-emerald-800 text-sm">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 shadow-lg flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-black text-red-800 text-sm">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              إعدادات النظام
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">تكوين وإدارة إعدادات المنصة العامة</p>
          </div>
          <button
            onClick={handleSaveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl font-black shadow-lg shadow-purple-200 hover:bg-purple-700 hover:shadow-xl transition-all disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
            </svg>
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mt-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'vulnerability' && (
        <div className="space-y-6">
          {/* Editable Weights Section */}
          <div className="bg-white rounded-[2rem] border shadow-sm p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-800">أوزان احتساب الهشاشة</h2>
                <p className="text-sm text-gray-500 font-bold mt-1">قم بتعديل الأوزان المستخدمة في احتساب درجة الهشاشة</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { key: 'disabilityWeight', label: 'الإعاقة', icon: '🦽', color: 'red' },
                { key: 'chronicDiseaseWeight', label: 'الأمراض المزمنة', icon: '💊', color: 'amber' },
                { key: 'warInjuryWeight', label: 'إصابات الحرب', icon: '🏥', color: 'orange' },
                { key: 'pregnancyWeight', label: 'الحمل', icon: '🤰', color: 'pink' },
                { key: 'elderlyWeight', label: 'كبار السن', icon: '👴', color: 'purple' },
                { key: 'childrenWeight', label: 'الأطفال', icon: '👶', color: 'blue' },
                { key: 'femaleHeadWeight', label: 'انعدام المعيل', icon: '👤', color: 'gray' }
              ].map((weight) => {
                const weightKey = weight.key as keyof VulnerabilityWeights;
                return (
                  <div key={weight.key} className={`bg-gradient-to-br from-${weight.color}-50 to-${weight.color}-100 rounded-2xl p-5 border-2 border-${weight.color}-200`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm">
                        {weight.icon}
                      </div>
                      <p className="font-black text-gray-800 text-sm">{weight.label}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={config.vulnerabilityWeights[weightKey]}
                        onChange={(e) => setConfig(prev => ({
                          ...prev,
                          vulnerabilityWeights: {
                            ...prev.vulnerabilityWeights,
                            [weightKey]: parseInt(e.target.value) || 0
                          }
                        }))}
                        className="w-20 px-3 py-2 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-black text-center"
                        min="0"
                        max="100"
                      />
                      <span className="text-sm font-bold text-gray-600">نقطة</span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
              <p className="text-sm font-bold text-purple-800">
                <span className="font-black">ملاحظة:</span> يتم حفظ التغييرات عند الضغط على زر "حفظ التغييرات" في الأعلى.
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-[2rem] border-2 border-emerald-200 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center flex-shrink-0">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-emerald-800 text-lg mb-2">احتساب تلقائي للهشاشة</h3>
                <p className="text-sm text-emerald-700 font-bold leading-relaxed mb-3">
                  يتم احتساب درجات الهشاشة للأسر تلقائياً بواسطة قاعدة البيانات عند إضافة أو تعديل أي أسرة أو فرد من أفرادها.
                  هذا يضمن دقة واتساق النتائج دون الحاجة للتدخل اليدوي.
                </p>
                <div className="flex flex-wrap gap-2 mt-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    احتساب فوري
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    دقة عالية
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    متسق دائماً
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Criteria Reference Cards */}
          <div className="bg-white rounded-[2rem] border shadow-sm p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-800">معايير احتساب الهشاشة</h2>
                <p className="text-sm text-gray-500 font-bold mt-1">الدرجات التفصيلية لكل معيار من معايير الهشاشة الإحدى عشر</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { 
                  label: 'الأطفال (< 12 سنة)', 
                  points: '3 نقاط لكل طفل', 
                  max: 'بحد أقصى 20 نقطة',
                  icon: '👶',
                  color: 'blue'
                },
                { 
                  label: 'كبار السن (> 60)', 
                  points: '2 نقاط لكل شخص', 
                  max: '',
                  icon: '👴',
                  color: 'purple'
                },
                { 
                  label: 'الإعاقات', 
                  points: '5 نقاط (أساسي)', 
                  max: '10 لرب الأسرة',
                  icon: '🦽',
                  color: 'red'
                },
                { 
                  label: 'الأمراض المزمنة', 
                  points: '4 نقاط', 
                  max: '6 للأمراض الخطيرة',
                  icon: '💊',
                  color: 'amber'
                },
                { 
                  label: 'إصابات الحرب', 
                  points: '6 نقاط', 
                  max: '9 للإصابات الخطيرة',
                  icon: '🏥',
                  color: 'orange'
                },
                { 
                  label: 'الحمل', 
                  points: '8 نقاط', 
                  max: '+5 للشهر 7+',
                  icon: '🤰',
                  color: 'pink'
                },
                { 
                  label: 'انعدام المعيل', 
                  points: '15 نقطة', 
                  max: 'أرملة/عاجز/بلا دخل',
                  icon: '👤',
                  color: 'gray'
                },
                { 
                  label: 'السكن', 
                  points: '10 نقاط', 
                  max: 'خيمة/ظروف سيئة',
                  icon: '🏠',
                  color: 'indigo'
                },
                { 
                  label: 'الدخل', 
                  points: '12 نقطة', 
                  max: 'بلا دخل',
                  icon: '💰',
                  color: 'green'
                },
                { 
                  label: 'الأيتام', 
                  points: '7 نقاط لكل يتيم', 
                  max: '',
                  icon: '🧒',
                  color: 'teal'
                }
              ].map((item, index) => (
                <div 
                  key={index} 
                  className={`bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-5 border-2 border-gray-200 hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-800 text-sm">{item.label}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-600 font-bold">
                      <span className="text-purple-600 font-black">{item.points}</span>
                    </p>
                    {item.max && (
                      <p className="text-xs text-gray-500 font-bold">
                        {item.max}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Levels */}
          <div className="bg-white rounded-[2rem] border shadow-sm p-6 md:p-8">
            <h3 className="text-lg font-black text-gray-800 mb-4">مستويات الأولوية</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { level: 'عالية جداً', score: '≥80', color: 'red', desc: 'أولوية قصوى' },
                { level: 'عالية', score: '≥60', color: 'orange', desc: 'أولوية مهمة' },
                { level: 'متوسطة', score: '≥40', color: 'yellow', desc: 'أولوية متوسطة' },
                { level: 'منخفضة', score: '<40', color: 'green', desc: 'أولوية عادية' }
              ].map((item, index) => (
                <div 
                  key={index}
                  className={`rounded-2xl p-4 border-2 bg-gradient-to-br from-${item.color}-50 to-${item.color}-100 border-${item.color}-200`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-black text-gray-800">{item.score}</span>
                    <span className={`w-3 h-3 bg-${item.color}-500 rounded-full`}></span>
                  </div>
                  <p className="font-black text-gray-800 text-sm">{item.level}</p>
                  <p className="text-xs text-gray-500 font-bold mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Formula */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-[2rem] border-2 border-purple-200 p-6 md:p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 21h5.172a2 2 0 001.414-.586l4.828-4.828a2 2 0 00.586-1.414V9a2 2 0 00-2-2H9a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-purple-800 mb-2">كيفية الاحتساب</h3>
                <p className="text-sm text-purple-700 font-bold leading-relaxed mb-3">
                  تُجمع نقاط جميع المعايير المتاحة للأسرة، مع وضع حد أقصى 100 نقطة. 
                  يتم تحديد مستوى الأولوية بناءً على الدرجة النهائية.
                </p>
                <div className="bg-white/60 rounded-xl p-4 mt-3">
                  <p className="text-xs text-purple-800 font-mono font-bold">
                    الدرجة النهائية = الأطفال + كبار السن + الإعاقات + الأمراض المزمنة + إصابات الحرب + الحمل + انعدام المعيل + السكن + الدخل + الأيتام
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="bg-white rounded-[2rem] border shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-black text-gray-800 mb-6">إعدادات الأمان والصلاحيات</h2>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">مهلة الجلسة</p>
                    <p className="text-xs text-gray-400 font-bold">الوقت قبل تسجيل الخروج التلقائي</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={config.sessionTimeout}
                    onChange={(e) => setConfig({...config, sessionTimeout: parseInt(e.target.value)})}
                    className="w-24 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold text-center"
                  />
                  <span className="text-sm font-bold text-gray-600">دقيقة</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">حد محاولات تسجيل الدخول</p>
                    <p className="text-xs text-gray-400 font-bold">عدد المحاولات قبل قفل الحساب</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={config.maxLoginAttempts}
                    onChange={(e) => setConfig({...config, maxLoginAttempts: parseInt(e.target.value)})}
                    className="w-24 px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold text-center"
                  />
                  <span className="text-sm font-bold text-gray-600">محاولات</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">وضع الصيانة</p>
                    <p className="text-xs text-gray-400 font-bold">تعطيل الوصول للمنصة مؤقتاً</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig({...config, maintenanceMode: !config.maintenanceMode})}
                  className={`w-16 h-8 rounded-full transition-colors relative ${
                    config.maintenanceMode ? 'bg-purple-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    config.maintenanceMode ? 'left-1' : 'right-1'
                  }`}></div>
                </button>
              </div>
              {config.maintenanceMode && (
                <div className="mt-4 bg-amber-50 border-2 border-amber-100 rounded-xl p-4">
                  <p className="text-sm text-amber-800 font-bold">
                    ⚠️ تحذير: تفعيل وضع الصيانة سيمنع جميع المستخدمين من الدخول except مديري النظام
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="bg-white rounded-[2rem] border shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-black text-gray-800 mb-6">تكامل الذكاء الاصطناعي</h2>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div>
                  <p className="font-black text-gray-800">Google Gemini API</p>
                  <p className="text-xs text-gray-400 font-bold">مفتاح التكامل مع نموذج الذكاء الاصطناعي</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={config.geminiApiKey}
                    onChange={(e) => setConfig({...config, geminiApiKey: e.target.value})}
                    placeholder="أدخل مفتاح API هنا..."
                    className="w-full px-4 py-4 pr-12 rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-mono text-sm"
                  />
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-600 transition-colors"
                  >
                    {showApiKey ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>

                <div className="bg-white/50 rounded-xl p-4">
                  <h4 className="font-black text-purple-800 mb-2 text-sm">استخدامات الذكاء الاصطناعي:</h4>
                  <ul className="space-y-2 text-xs text-purple-700 font-bold">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                      تحليل الهشاشة وتقديم مبررات توزيع المساعدات
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                      توليد تقارير ذكية للأسر الأكثر احتياجاً
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                      اقتراح أولويات التوزيع بناءً على البيانات
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 border-2 border-emerald-100 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-black text-emerald-800 mb-2">حالة التكامل</h3>
                  <p className="text-sm text-emerald-700 font-bold">
                    {config.geminiApiKey ? '✅ مفتاح API مُعد بشكل صحيح' : '⚠️ لم يتم إدخال مفتاح API بعد'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="bg-white rounded-[2rem] border shadow-sm p-6 md:p-8">
          <h2 className="text-xl font-black text-gray-800 mb-6">الإعدادات العامة</h2>

          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">التسجيل العام</p>
                    <p className="text-xs text-gray-400 font-bold">السماح للمخيمات بالتسجيل الذاتي</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig({...config, publicRegistrationEnabled: !config.publicRegistrationEnabled})}
                  className={`w-16 h-8 rounded-full transition-colors relative ${
                    config.publicRegistrationEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    config.publicRegistrationEnabled ? 'left-1' : 'right-1'
                  }`}></div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">المزامنة التلقائية</p>
                    <p className="text-xs text-gray-400 font-bold">مزامنة البيانات تلقائياً في الخلفية</p>
                  </div>
                </div>
                <button
                  onClick={() => setConfig({...config, autoSyncEnabled: !config.autoSyncEnabled})}
                  className={`w-16 h-8 rounded-full transition-colors relative ${
                    config.autoSyncEnabled ? 'bg-emerald-600' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                    config.autoSyncEnabled ? 'left-1' : 'right-1'
                  }`}></div>
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-black text-gray-800">تكرار النسخ الاحتياطي</p>
                    <p className="text-xs text-gray-400 font-bold">فترة النسخ الاحتياطي التلقائي</p>
                  </div>
                </div>
                <select
                  value={config.backupFrequency}
                  onChange={(e) => setConfig({...config, backupFrequency: e.target.value as any})}
                  className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all font-bold text-sm bg-white"
                >
                  <option value="daily">يومياً</option>
                  <option value="weekly">أسبوعياً</option>
                  <option value="monthly">شهرياً</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemConfigurationHub;
