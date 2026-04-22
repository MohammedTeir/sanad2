// views/shared/CampOnboarding.tsx
// Professional Camp Onboarding Page - سند System
// Enhanced with modern UI components and better UX

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { makePublicRequest } from '../../utils/apiUtils';
import { GAZA_LOCATIONS, getAreasByGovernorate } from '../../constants/gazaLocations';
import { GradientCard, ProfessionalCard } from '../../components/ui';
import Toast from '../../components/Toast';
import { formatFullCoordinateString } from '../../utils/geoUtils';

const inputClass = "w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 font-bold text-sm";
const labelClass = "block text-xs font-black text-gray-700 mb-2 mr-1 uppercase tracking-wide";

const CampOnboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    manager: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    governorate: '',
    area: '',
    location_lat: 31.5,
    location_lng: 34.4
  });

  const [isLocationCaptured, setIsLocationCaptured] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setError('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }

    setCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        setFormData(prev => ({
          ...prev,
          location_lat: latitude,
          location_lng: longitude
        }));
        setIsLocationCaptured(true);
        setCapturingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMsg = 'تعذر تحديد الموقع. يرجى تفعيل الـ GPS.';
        if (err.code === 1) errorMsg = 'يرجى منح صلاحية الوصول للموقع الجغرافي.';
        setError(errorMsg);
        setCapturingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const [availableAreas, setAvailableAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);

  const handleGovernorateChange = (governorate: string) => {
    setFormData({...formData, governorate, area: ''});
    const areas = getAreasByGovernorate(governorate);
    setAvailableAreas(areas);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('كلمة المرور وتأكيد كلمة المرور غير متطابقين');
      return;
    }

    if (formData.password.length < 6) {
      setError('يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل');
      return;
    }

    setLoading(true);

    try {
      await makePublicRequest('/public/camps/register', {
        method: 'POST',
        body: JSON.stringify({
          name: formData.name,
          manager_name: formData.manager,
          email: formData.email,
          password: formData.password,
          status: 'قيد الانتظار',
          location_lat: formData.location_lat,
          location_lng: formData.location_lng,
          location_address: formData.address,
          location_governorate: formData.governorate,
          location_area: formData.area
        })
      });

      setSuccess(true);
    } catch (err) {
      console.error('Camp registration error:', err);
      setError('حدث خطأ في إرسال الطلب: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Determine current step for progress indicator
  const currentStep = success ? 2 : 1;

  if (success) {
    return <SuccessPage onGoHome={() => navigate('/login')} currentStep={currentStep} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 py-12 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-800/20 rounded-full blur-3xl"></div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-2xl border border-white/20">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
              <span className="text-xl font-black text-emerald-700">س</span>
            </div>
            <div className="text-right">
              <h1 className="text-lg font-black text-white">سند</h1>
              <p className="text-[10px] font-bold text-emerald-100">نظام إدارة مخيمات غزة</p>
            </div>
          </div>
        </div>

        {/* Main Form Card */}
        <ProfessionalCard className="!p-8 md:!p-10">
          {/* Header Section */}
          <div className="mb-8 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-black text-gray-800">تسجيل مخيم جديد</h2>
                <p className="text-gray-500 text-sm font-bold mt-0.5">انضم للمنظومة المركزية لإدارة الإغاثة في غزة</p>
              </div>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center gap-2 mt-6">
              <StepDot number={1} active label="تعبئة البيانات" />
              <div className="flex-1 h-1 bg-gray-200 rounded-full">
                <div className="h-1 bg-emerald-500 rounded-full w-0 transition-all duration-500"></div>
              </div>
              <StepDot number={2} label="تأكيد الطلب" />
            </div>
          </div>

          {/* Error Toast */}
          {error && (
            <Toast message={error} type="error" onClose={() => setError('')} />
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center text-xs">1</span>
                المعلومات الأساسية
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="اسم المخيم"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  }
                  value={formData.name}
                  onChange={(v) => setFormData({...formData, name: v})}
                  placeholder="مثال: مخيم فرسان الشمال"
                  required
                />

                <FormField
                  label="اسم المدير المسؤول"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                  value={formData.manager}
                  onChange={(v) => setFormData({...formData, manager: v})}
                  placeholder="الاسم الكامل"
                  required
                />
              </div>
            </div>

            {/* Contact Info Section */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center text-xs">2</span>
                معلومات التواصل
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="البريد الإلكتروني"
                  type="email"
                  icon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  }
                  value={formData.email}
                  onChange={(v) => setFormData({...formData, email: v})}
                  placeholder="name@example.com"
                  required
                />

              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center text-xs">3</span>
                الموقع الجغرافي
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      المحافظة
                    </span>
                  </label>
                  <select required value={formData.governorate} onChange={e => handleGovernorateChange(e.target.value)} className={inputClass}>
                    <option value="">اختر المحافظة</option>
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
                      المنطقة / القطاع
                    </span>
                  </label>
                  <select required value={formData.area} onChange={e => setFormData({...formData, area: e.target.value})} className={inputClass}>
                    <option value="">اختر المنطقة</option>
                    {availableAreas.map(area => (
                      <option key={area.name} value={area.arabic_name}>{area.arabic_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    العنوان التفصيلي
                  </span>
                </label>
                <textarea 
                  required 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  placeholder="وصف دقيق للموقع..." 
                  className={`${inputClass} h-24 resize-none`} 
                />
              </div>

              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={capturingLocation}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md ${
                    isLocationCaptured 
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200 shadow-emerald-100' 
                      : 'bg-blue-50 text-blue-700 border-2 border-blue-100 hover:bg-blue-100 shadow-blue-100'
                  }`}
                >
                  {capturingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      جاري التحديد...
                    </>
                  ) : isLocationCaptured ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      تم تحديد الموقع بنجاح
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      تحديد موقعي الحالي (GPS)
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Security Section */}
            <div className="space-y-4 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-black text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center text-xs">🔐</span>
                الأمان
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PasswordInput
                  label="كلمة المرور"
                  value={formData.password}
                  onChange={(v) => setFormData({...formData, password: v})}
                  showPassword={showPassword}
                  onToggle={() => setShowPassword(!showPassword)}
                  required
                />

                <PasswordInput
                  label="تأكيد كلمة المرور"
                  value={formData.confirmPassword}
                  onChange={(v) => setFormData({...formData, confirmPassword: v})}
                  showPassword={showConfirmPassword}
                  onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                  required
                />
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="pt-6 flex gap-4">
              <button 
                disabled={loading} 
                type="submit" 
                className="flex-1 py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-black hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
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
                    تقديم طلب الانضمام
                  </>
                )}
              </button>
              <Link 
                to="/login" 
                className="px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                إلغاء
              </Link>
            </div>
          </form>
        </ProfessionalCard>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-white/60 font-bold">
            © 2024 سند System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

// Success Page Component
const SuccessPage = ({ onGoHome, currentStep }: { onGoHome: () => void; currentStep: number }) => (
  <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
    <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-800/20 rounded-full blur-3xl"></div>

    <div className="max-w-lg w-full relative z-10">
      <ProfessionalCard className="!p-10 text-center">
        {/* Progress Steps - Step 2 Active */}
        <div className="flex items-center gap-2 mb-8">
          <StepDot number={1} active label="تعبئة البيانات" />
          <div className="flex-1 h-1 bg-gray-200 rounded-full">
            <div className="h-1 bg-emerald-500 rounded-full w-full transition-all duration-500"></div>
          </div>
          <StepDot number={2} active label="تأكيد الطلب" />
        </div>
        {/* Success Icon */}
        <div className="relative mb-6">
          <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-200/50">
            <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-emerald-300 animate-ping" style={{ animationDuration: '2s' }}></div>
        </div>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border-2 border-emerald-200 rounded-full mb-6">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-black text-emerald-700 uppercase tracking-wide">تم الإرسال بنجاح</span>
        </div>

        <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-4">
          تم استلام طلبك بنجاح
        </h2>

        <div className="space-y-3 mb-8">
          <p className="text-gray-600 leading-relaxed font-bold text-sm">
            شكراً لتسجيل مخيمك في منظومة سند المركزية
          </p>
          <p className="text-gray-500 leading-relaxed font-bold text-sm">
            سيقوم مديرو المنظومة بمراجعة طلبك والتواصل معك عبر البريد الإلكتروني لتفعيل الحساب خلال 24-48 ساعة
          </p>
        </div>

        {/* Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <ProfessionalCard className="!p-4 bg-amber-50 border-amber-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500">الوقت المتوقع</p>
                <p className="text-sm font-black text-amber-700">٢٤-٤٨ ساعة</p>
              </div>
            </div>
          </ProfessionalCard>

          <ProfessionalCard className="!p-4 bg-blue-50 border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500">التواصل</p>
                <p className="text-sm font-black text-blue-700">عبر البريد</p>
              </div>
            </div>
          </ProfessionalCard>
        </div>

        {/* Important Note */}
        <div className="p-4 bg-emerald-50 rounded-2xl border-2 border-emerald-100 mb-8">
          <p className="text-xs font-black text-emerald-700 uppercase tracking-widest mb-2">ملاحظة مهمة</p>
          <p className="text-sm text-emerald-600 font-bold">
            يرجى التحقق من بريدك الإلكتروني بانتظام لمتابعة حالة الطلب. يمكنك تسجيل الدخول بعد الموافقة.
          </p>
        </div>

        <button
          onClick={onGoHome}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-black hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-200"
        >
          <div className="flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            العودة للرئيسية
          </div>
        </button>
      </ProfessionalCard>
    </div>
  </div>
);

// Form Field Component
const FormField = ({ label, icon, value, onChange, placeholder, type = 'text', required = false }: any) => (
  <div>
    <label className={labelClass}>
      <span className="flex items-center gap-2">
        {icon}
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
    </label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className={inputClass}
    />
  </div>
);

// Password Input Component
const PasswordInput = ({ label, value, onChange, showPassword, onToggle, required = false }: any) => (
  <div>
    <label className={labelClass}>
      <span className="flex items-center gap-2">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {label}
        {required && <span className="text-red-500">*</span>}
      </span>
    </label>
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="••••••••"
        required={required}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-emerald-600 transition-colors p-1"
      >
        {showPassword ? (
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
  </div>
);

// Progress Step Dot
const StepDot = ({ number, active, label }: { number: number; active?: boolean; label?: string }) => (
  <div className="flex flex-col items-center gap-1">
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
      active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' : 'bg-gray-200 text-gray-400'
    }`}>
      {active && number === 2 ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
      ) : number}
    </div>
    {label && <span className={`text-[10px] font-bold ${active ? 'text-emerald-600' : 'text-gray-400'}`}>{label}</span>}
  </div>
);

export default CampOnboarding;
