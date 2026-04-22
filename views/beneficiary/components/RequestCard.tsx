// views/beneficiary/components/RequestCard.tsx
import React from 'react';

interface RequestCardProps {
  request: {
    id: string;
    type: 'transfer' | 'update' | 'complaint' | 'emergency';
    status: 'قيد الانتظار' | 'موافق' | 'مرفوض' | 'تمت المعالجة';
    date: string;
    subject?: string;
    reason?: string;
    description?: string;
    fromCamp?: string;
    toCamp?: string;
    response?: string;
    responseDate?: string;
  };
}

const RequestCard: React.FC<RequestCardProps> = ({ request }) => {
  const getTypeIcon = () => {
    switch (request.type) {
      case 'transfer':
        return (
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      case 'update':
        return (
          <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'complaint':
        return (
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'emergency':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getStatusConfig = () => {
    switch (request.status) {
      case 'قيد الانتظار':
        return { 
          label: 'قيد الانتظار', 
          color: 'bg-amber-100 text-amber-700 border-amber-200', 
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        };
      case 'موافق':
      case 'تمت المعالجة':
        return { 
          label: request.status, 
          color: 'bg-emerald-100 text-emerald-700 border-emerald-200', 
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )
        };
      case 'مرفوض':
        return { 
          label: 'مرفوض', 
          color: 'bg-red-100 text-red-700 border-red-200', 
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )
        };
      default:
        return { 
          label: request.status, 
          color: 'bg-gray-100 text-gray-700 border-gray-200', 
          icon: (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )
        };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 p-4 hover:shadow-lg hover:border-emerald-200 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 flex items-center justify-center bg-gray-50 rounded-xl flex-shrink-0">
            {getTypeIcon()}
          </div>
          <div className="flex-1">
            {request.subject && (
              <h3 className="font-black text-gray-800 text-base mb-1">{request.subject}</h3>
            )}
            <p className="text-xs text-gray-500 font-bold">
              {new Date(request.date).toLocaleDateString('ar-EG', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        </div>
        <div className={`px-3 py-2 rounded-xl font-black text-xs border-2 flex-shrink-0 ${statusConfig.color}`}>
          <span className="ml-1">{statusConfig.icon}</span>
          {statusConfig.label}
        </div>
      </div>

      {/* Content */}
      {(request.reason || request.description) && (
        <div className="bg-gray-50 rounded-xl p-3 mb-3">
          <div className="text-xs text-gray-500 font-bold mb-1">
            {request.type === 'transfer' ? 'السبب' : request.type === 'complaint' ? 'التفاصيل' : 'الوصف'}
          </div>
          <p className="text-sm text-gray-700 font-bold">
            {request.reason || request.description}
          </p>
        </div>
      )}

      {/* Transfer-specific info */}
      {request.type === 'transfer' && (
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-red-50 rounded-xl p-3">
            <div className="text-xs text-red-600 font-bold mb-1">من المخيم</div>
            <div className="font-bold text-sm text-red-700">{request.fromCamp || 'غير محدد'}</div>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <div className="text-xs text-emerald-600 font-bold mb-1">إلى المخيم</div>
            <div className="font-bold text-sm text-emerald-700">{request.toCamp || 'غير محدد'}</div>
          </div>
        </div>
      )}

      {/* Response */}
      {request.response && (
        <div className={`rounded-xl p-3 ${request.status === 'مرفوض' ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {request.status === 'مرفوض' ? (
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            <span className={`text-xs font-bold ${request.status === 'مرفوض' ? 'text-red-600' : 'text-emerald-600'}`}>
              الرد
            </span>
            {request.responseDate && (
              <span className="text-xs text-gray-500 font-bold mr-auto">
                {new Date(request.responseDate).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            )}
          </div>
          <p className={`text-sm font-bold ${request.status === 'مرفوض' ? 'text-red-700' : 'text-emerald-700'}`}>
            {request.response}
          </p>
        </div>
      )}
    </div>
  );
};

export default RequestCard;
