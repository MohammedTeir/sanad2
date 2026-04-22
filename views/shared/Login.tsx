// views/shared/Login.tsx
// Professional Login Page - سند System
// Enhanced with modern UI components while preserving all functionality

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Role } from '../../types';
import { realDataService } from '../../services/realDataServiceBackend';
import { GradientCard, ProfessionalCard } from '../../components/ui';
import Toast from '../../components/Toast';

interface LoginProps {
  onLogin: (role: Role, id?: string) => void;
}

const inputClass = "w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 text-sm font-bold";
const labelClass = "block text-xs font-black text-gray-700 mb-2 mr-1 uppercase tracking-wide";

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [tab, setTab] = useState<'dp' | 'staff' | 'staff_login'>('dp');
  const [staffRole, setStaffRole] = useState<Role | null>(null);
  const [id, setId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorType, setErrorType] = useState<'error' | 'warning' | 'info'>('error');
  const [showPassword, setShowPassword] = useState(false);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError('');
        setErrorType('error');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDPLogin = async () => {
    if (!/^\d{9}$/.test(id)) {
      setError('يرجى إدخال رقم هوية صحيح (9 أرقام)');
      setErrorType('error');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const familyInfo = await realDataService.lookupFamilyByNationalId(id);

      if (!familyInfo) {
        setError('رقم الهوية غير مسجل في النظام. يرجى إنشاء حساب جديد.');
        setErrorType('error');
        setLoading(false);
        return;
      }

      if (familyInfo.status === 'قيد الانتظار') {
        setError('حالة طلبك قيد المراجعة. سيتم إشعارك عند الموافقة على طلبك.');
        setErrorType('warning');
        setLoading(false);
        return;
      }

      if (familyInfo.status === 'مرفوض') {
        setError('تم رفض طلب التسجيل. يرجى التواصل مع إدارة المخيم للمزيد من المعلومات.');
        setErrorType('error');
        setLoading(false);
        return;
      }

      if (familyInfo.status === 'موافق') {
        // Authenticate the DP to get a JWT token
        await realDataService.authenticateDP(id);
        onLogin(Role.BENEFICIARY, id);
      } else {
        setError('رقم الهوية غير مسجل في النظام. يرجى إنشاء حساب جديد.');
        setErrorType('error');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('حدث خطأ أثناء التحقق من البيانات. حاول مرة أخرى.');
      setErrorType('error');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (role: Role) => {
    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const userData = await realDataService.authenticateUser(email, password, role);
      onLogin(userData.role, userData.id);
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage.includes('Camp registration is pending approval')) {
        setError('حالة مخيمك قيد المراجعة. لا يمكن تسجيل الدخول حتى تتم الموافقة على الحساب.');
      } else {
        setError('بيانات تسجيل الدخول غير صحيحة. يرجى التحقق من البريد الإلكتروني وكلمة المرور.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (tab === 'dp') {
        handleDPLogin();
      } else if (tab === 'staff_login' && staffRole) {
        handleStaffLogin(staffRole);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-800/20 rounded-full blur-3xl"></div>

      {/* Toast Notification */}
      {error && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <Toast
            message={error}
            type={errorType === 'warning' ? 'warning' : errorType === 'info' ? 'info' : 'error'}
            onClose={() => setError('')}
          />
        </div>
      )}

      {/* Login Card */}
      <div className="max-w-md w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden relative z-10 border border-emerald-800/10">
        {/* Hero Header */}
        <GradientCard variant="emerald" className="!rounded-b-[3rem] !p-8 md:!p-10">
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] mx-auto flex items-center justify-center text-4xl font-black mb-4 border border-white/20 shadow-xl">
              <span>س</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-1">سند</h1>
            <p className="text-emerald-100 font-bold text-xs md:text-sm opacity-90 text-center">
              نظام إدارة مخيمات غزة المركزي
            </p>
          </div>
        </GradientCard>

        <div className="p-6 md:p-10">
          {/* Tab Switcher */}
          <div className="flex gap-2 p-1.5 bg-gray-100 rounded-[1.5rem] mb-8 border border-gray-200/50">
            <button
              onClick={() => { setTab('dp'); setError(''); }}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all ${
                tab === 'dp' 
                  ? 'bg-white shadow-lg shadow-emerald-200 text-emerald-700' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              بوابة النازحين
            </button>
            <button
              onClick={() => { setTab('staff'); setError(''); }}
              className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs transition-all ${
                tab === 'staff' 
                  ? 'bg-white shadow-lg shadow-emerald-200 text-emerald-700' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              دخول الموظفين
            </button>
          </div>

          {/* DP Login */}
          {tab === 'dp' && (
            <div className="space-y-6">
              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                    </svg>
                    رقم الهوية
                  </span>
                </label>
                <input
                  type="text"
                  value={id}
                  maxLength={9}
                  onChange={(e) => setId(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="٩ أرقام"
                  className={`${inputClass} text-center text-lg tracking-wider`}
                  autoFocus
                />
              </div>

              <button
                onClick={handleDPLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-5 rounded-[1.5rem] font-black hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl shadow-emerald-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    دخول سريع
                  </>
                )}
              </button>

              <div className="pt-6 border-t border-gray-100 text-center">
                <p className="text-[10px] text-gray-400 mb-3 font-black uppercase tracking-widest">عائلة جديدة؟</p>
                <Link
                  to="/register-family"
                  className="inline-flex items-center gap-2 text-emerald-700 font-black hover:text-emerald-900 transition-all hover:scale-105 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  سجّل عائلتك الآن واحصل على مساعدة
                </Link>
              </div>
            </div>
          )}

          {/* Staff Login Form */}
          {tab === 'staff_login' && staffRole && (
            <div className="space-y-6" onKeyPress={handleKeyPress}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  {staffRole === Role.CAMP_MANAGER && (
                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  )}
                  {staffRole === Role.FIELD_OFFICER && (
                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  )}
                  {staffRole === Role.SYSTEM_ADMIN && (
                    <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-lg font-black text-gray-800">
                  {staffRole === Role.CAMP_MANAGER && 'تسجيل دخول مدير المخيم'}
                  {staffRole === Role.FIELD_OFFICER && 'تسجيل دخول موظف الميدان'}
                  {staffRole === Role.SYSTEM_ADMIN && 'تسجيل دخول المشرف العام'}
                </h3>
                <p className="text-gray-500 text-sm mt-1">الرجاء إدخال معلومات تسجيل الدخول الخاصة بك</p>
              </div>

              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    البريد الإلكتروني
                  </span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className={inputClass}
                  autoFocus
                />
              </div>

              <div>
                <label className={labelClass}>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    كلمة المرور
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`${inputClass} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
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

              <button
                onClick={() => handleStaffLogin(staffRole)}
                disabled={loading}
                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-5 rounded-[1.5rem] font-black hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-xl shadow-emerald-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري التحقق...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    تسجيل الدخول
                  </>
                )}
              </button>

              <div className="pt-4 text-center">
                <button
                  onClick={() => setTab('staff')}
                  className="text-emerald-700 font-black hover:text-emerald-900 transition-colors text-sm flex items-center justify-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  العودة إلى اختيار الدور
                </button>
              </div>
            </div>
          )}

          {/* Staff Role Selection */}
          {tab === 'staff' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <ProfessionalCard hover className="!p-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50" onClick={() => {setTab('staff_login'); setStaffRole(Role.CAMP_MANAGER);}}>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-black text-gray-700 uppercase">مدير مخيم</span>
                  </div>
                </ProfessionalCard>

                <ProfessionalCard hover className="!p-4 cursor-pointer hover:border-emerald-500 hover:bg-emerald-50" onClick={() => {setTab('staff_login'); setStaffRole(Role.FIELD_OFFICER);}}>
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <span className="text-[10px] font-black text-gray-700 uppercase">موظف ميدان</span>
                  </div>
                </ProfessionalCard>
              </div>

              <ProfessionalCard 
                hover 
                className="!p-4 cursor-pointer !bg-emerald-900 !border-emerald-800 hover:!bg-emerald-800"
                onClick={() => {setTab('staff_login'); setStaffRole(Role.SYSTEM_ADMIN);}}
              >
                <div className="flex items-center justify-center gap-3">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span className="text-xs font-black text-white uppercase tracking-widest">دخول المشرف العام</span>
                </div>
              </ProfessionalCard>

              <div className="text-center pt-6 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 mb-2 font-black uppercase">تسجيل مؤسسة جديدة؟</p>
                <Link
                  to="/register-camp"
                  className="text-emerald-700 font-black hover:text-emerald-900 transition-colors text-sm"
                >
                  تقديم طلب انضمام مخيم للمنصة
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
