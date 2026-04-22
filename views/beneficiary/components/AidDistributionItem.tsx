// views/beneficiary/components/AidDistributionItem.tsx
import React from 'react';
import type { AidTransaction } from '../../types';

interface AidDistributionItemProps {
  distribution: AidTransaction;
}

const AidDistributionItem: React.FC<AidDistributionItemProps> = ({ distribution }) => {
  const statusConfig = {
    'تم التسليم': { label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    'قيد الانتظار': { label: 'قيد الانتظار', color: 'bg-amber-100 text-amber-700 border-amber-200' }
  };

  const getAidIcon = (aidType: string) => {
    const type = aidType.toLowerCase();
    if (type.includes('غذائي') || type.includes('طعام') || type.includes('سلة')) {
      return (
        <svg className="w-12 h-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    } else if (type.includes('بطانية') || type.includes('ملابس') || type.includes('شتوية')) {
      return (
        <svg className="w-12 h-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
        </svg>
      );
    } else if (type.includes('دواء') || type.includes('طبي') || type.includes('صحة')) {
      return (
        <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      );
    } else if (type.includes('نقد') || type.includes('مالي')) {
      return (
        <svg className="w-12 h-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (type.includes('خيمة') || type.includes('مأوى')) {
      return (
        <svg className="w-12 h-12 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      );
    }
    return (
      <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    );
  };

  const getVerificationIcon = () => {
    if (distribution.receivedBySignature) return { icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    ), label: 'توقيع' };
    if (distribution.receivedByBiometric) return { icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
      </svg>
    ), label: 'بصمة' };
    if (distribution.receivedByPhoto) return { icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      </svg>
    ), label: 'صورة' };
    if (distribution.otpCode) return { icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ), label: 'OTP' };
    return null;
  };

  const verification = getVerificationIcon();
  const status = statusConfig[distribution.status as keyof typeof statusConfig] || statusConfig['قيد الانتظار'];

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        {/* Icon & Info */}
        <div className="flex items-start gap-3 flex-1">
          <div className="flex-shrink-0">{getAidIcon(distribution.aidType)}</div>
          <div className="flex-1">
            <h3 className="font-black text-gray-800 text-base mb-1">{distribution.aidType}</h3>
            <p className="text-xs text-gray-500 font-bold mb-2">{distribution.aidCategory}</p>
            
            <div className="flex flex-wrap items-center gap-3">
              <div className="bg-emerald-50 rounded-lg px-3 py-1">
                <span className="text-xs text-emerald-600 font-bold">الكمية:</span>
                <span className="text-sm font-black text-emerald-700 mr-1">{distribution.quantity}</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg px-3 py-1">
                <span className="text-xs text-gray-500 font-bold">التاريخ:</span>
                <span className="text-sm font-bold text-gray-700 mr-1">
                  {new Date(distribution.date).toLocaleDateString('ar-EG', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {verification && (
                <div className="bg-blue-50 rounded-lg px-2 py-1 flex items-center gap-1" title={verification.label}>
                  <span className="text-sm">{verification.icon}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <div className={`px-3 py-2 rounded-xl font-black text-xs border-2 flex-shrink-0 ${status.color}`}>
          {status.label}
        </div>
      </div>

      {/* Notes */}
      {distribution.notes && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-xs text-gray-500 font-bold">{distribution.notes}</p>
        </div>
      )}
    </div>
  );
};

export default AidDistributionItem;
