// views/shared/profile/SecuritySettings.tsx
import React from 'react';

interface SecuritySettingsProps {
  onChangePasswordClick: () => void;
  gradientFrom: string;
  gradientTo: string;
  lastLogin?: string;
}

export const SecuritySettings: React.FC<SecuritySettingsProps> = ({
  onChangePasswordClick,
  gradientFrom,
  gradientTo,
  lastLogin
}) => {
  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return 'لم يسبق الدخول';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* Change Password Card */}
      <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-6 hover:border-emerald-300 transition-colors">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 md:gap-4 flex-1">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-500 text-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-gray-800 text-sm md:text-base mb-1">كلمة المرور</h3>
              <p className="text-gray-600 text-xs md:text-sm font-bold mb-3">
                قم بتغيير كلمة المرور الخاصة بحسابك لزيادة الأمان
              </p>
              <button
                onClick={onChangePasswordClick}
                className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-emerald-500 text-white rounded-xl font-black text-xs md:text-sm hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                تغيير كلمة المرور
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Last Login Card */}
      {lastLogin && (
        <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 md:p-6">
          <div className="flex items-start gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-black text-gray-800 text-sm md:text-base mb-1">آخر دخول</h3>
              <p className="text-gray-700 font-bold text-xs md:text-sm font-mono">
                {formatLastLogin(lastLogin)}
              </p>
              <p className="text-gray-500 text-xs mt-1">
                تاريخ ووقت آخر دخول لحسابك
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Security Tips Card */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-4 md:p-6">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="font-black text-emerald-800 text-sm md:text-base mb-3">نصائح أمنية</h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-xs md:text-sm text-gray-700 font-bold">
                <span className="w-5 h-5 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">✓</span>
                استخدم كلمة مرور قوية تتكون من 8 أحرف على الأقل
              </li>
              <li className="flex items-start gap-2 text-xs md:text-sm text-gray-700 font-bold">
                <span className="w-5 h-5 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">✓</span>
                غيّر كلمة المرور بشكل دوري كل 3 أشهر
              </li>
              <li className="flex items-start gap-2 text-xs md:text-sm text-gray-700 font-bold">
                <span className="w-5 h-5 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">✓</span>
                لا تشارك كلمة المرور مع أي شخص
              </li>
              <li className="flex items-start gap-2 text-xs md:text-sm text-gray-700 font-bold">
                <span className="w-5 h-5 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] mt-0.5">✓</span>
                تأكد من تسجيل الخروج عند استخدام جهاز عام
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
