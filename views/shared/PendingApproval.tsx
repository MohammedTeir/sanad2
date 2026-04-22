// views/shared/PendingApproval.tsx
// Professional Pending Approval Page - سند System
// Enhanced with modern UI components and better UX

import React from 'react';
import { Link } from 'react-router-dom';
import { GradientCard, ProfessionalCard } from '../../components/ui';

const PendingApproval = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-800/20 rounded-full blur-3xl"></div>
      <div className="absolute top-[20%] right-[-5%] w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl"></div>

      {/* Main Card */}
      <div className="max-w-lg w-full relative z-10">
        {/* Logo Section */}
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

        {/* Main Content Card */}
        <ProfessionalCard className="!p-8 md:!p-10 text-center">
          {/* Icon with Animation */}
          <div className="relative mb-6">
            <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-200/50">
              <svg className="w-12 h-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            {/* Animated Rings */}
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-amber-300 animate-ping" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full border-2 border-amber-200 animate-ping" style={{ animationDuration: '2s', animationDelay: '0.5s' }}></div>
          </div>

          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-50 border-2 border-amber-200 rounded-full mb-6">
            <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-black text-amber-700 uppercase tracking-wide">قيد الانتظار</span>
          </div>

          {/* Main Heading */}
          <h2 className="text-2xl md:text-3xl font-black text-gray-800 mb-4">
            الحساب قيد الانتظار
          </h2>

          {/* Description */}
          <div className="space-y-3 mb-8">
            <p className="text-gray-600 leading-relaxed font-bold text-sm md:text-base">
              تم استلام طلب تسجيل مخيمك بنجاح. يُرجى الانتظار حتى يقوم مديرو المنظومة بمراجعة بيانات مخيمك والموافقة عليه.
            </p>
            <p className="text-gray-600 leading-relaxed font-bold text-sm md:text-base">
              سيتم إعلامك عبر البريد الإلكتروني عند اكتمال عملية المراجعة.
            </p>
          </div>

          {/* Info Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <ProfessionalCard className="!p-4 bg-emerald-50 border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500">الوقت المتوقع</p>
                  <p className="text-sm font-black text-emerald-700">٢٤-٤٨ ساعة</p>
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

          {/* Timeline Steps */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="text-sm font-black text-gray-700 mb-4 text-center">مراحل المراجعة</h3>
            <div className="space-y-4">
              <StepItem 
                number={1}
                title="تم إرسال الطلب"
                description="تم استلام طلبك بنجاح"
                status="مكتمل"
              />
              <StepItem 
                number={2}
                title="مراجعة البيانات"
                description="جاري مراجعة بيانات المخيم"
                status="نشط"
              />
              <StepItem 
                number={3}
                title="الموافقة النهائية"
                description="سيتم إشعارك عند الموافقة"
                status="قيد الانتظار"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/login"
              className="block w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-black hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg shadow-emerald-200"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                العودة لتسجيل الدخول
              </div>
            </Link>

            <Link
              to="/register-camp"
              className="block w-full py-4 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition-all border-2 border-gray-200"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                تعديل معلومات التسجيل
              </div>
            </Link>
          </div>

          {/* Help Text */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-xs text-gray-500 font-bold mb-2">تحتاج مساعدة؟</p>
            <p className="text-xs text-gray-400 font-bold">
              للتواصل مع الدعم الفني:{' '}
              <a href="mailto:support@sand.ps" className="text-emerald-600 hover:underline font-black">
                support@sand.ps
              </a>
            </p>
          </div>
        </ProfessionalCard>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-white/60 font-bold">
            © 2024 سند System. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};

// Step Item Component
const StepItem = ({ 
  number, 
  title, 
  description, 
  status 
}: { 
  number: number; 
  title: string; 
  description: string;
  status: 'مكتمل' | 'نشط' | 'قيد الانتظار';
}) => {
  const statusStyles = {
    'مكتمل': 'bg-emerald-500 text-white border-emerald-500',
    'نشط': 'bg-amber-500 text-white border-amber-500 animate-pulse',
    'قيد الانتظار': 'bg-gray-200 text-gray-400 border-gray-200'
  };

  const lineStyles = {
    'مكتمل': 'bg-emerald-500',
    'نشط': 'bg-amber-500',
    'قيد الانتظار': 'bg-gray-200'
  };

  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black flex-shrink-0 border-2 ${statusStyles[status]}`}>
        {status === 'مكتمل' ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <div className="flex-1 text-right">
        <p className={`text-sm font-black ${status === 'نشط' ? 'text-amber-700' : status === 'مكتمل' ? 'text-emerald-700' : 'text-gray-400'}`}>
          {title}
        </p>
        <p className="text-xs text-gray-500 font-bold mt-0.5">{description}</p>
      </div>
    </div>
  );
};

export default PendingApproval;
