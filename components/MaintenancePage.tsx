import React, { useState, useEffect } from 'react';

interface MaintenancePageProps {
  onLogout?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-[3rem] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-8 text-white text-center">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-3xl font-black mb-2">النظام في وضع الصيانة</h1>
          <p className="text-amber-100 font-bold">Service Under Maintenance</p>
        </div>

        {/* Content */}
        <div className="p-8 md:p-12">
          <div className="text-center space-y-6">
            <div className="space-y-2">
              <p className="text-gray-800 font-black text-xl leading-relaxed">
                نعتذر عن الإزعاج، النظام حالياً في وضع الصيانة الدورية
              </p>
              <p className="text-gray-500 font-bold text-sm">
                We're currently performing scheduled maintenance to improve our services
              </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-6">
              <div className="flex items-center justify-center gap-3 mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-amber-800 font-black">الوقت المتوقع للعودة</p>
              </div>
              <p className="text-amber-600 font-bold text-sm">
                Expected return time: Within 1 hour
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-gray-600">تحديثات</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-gray-600">تحسينات</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-gray-600">إصلاحات</p>
              </div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="mt-6 px-8 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all"
              >
                تسجيل الخروج
              </button>
            )}

            <p className="text-xs text-gray-400 font-bold pt-4">
              If you believe this is an error, please contact the system administrator
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenancePage;
