// views/camp-manager/SpecialAssistanceManagement.tsx
// Camp Manager Special Assistance Requests Management
// Features: View, review, approve/reject special assistance requests

import React, { useState, useEffect } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

interface SpecialAssistanceRequest {
  id: string;
  family_id: string;
  family_name?: string;
  family_phone?: string;
  assistance_type: 'طبية' | 'مالية' | 'سكنية' | 'تعليمية' | 'أخرى';
  description: string;
  urgency: 'عاجل جداً' | 'عاجل' | 'عادي';
  status: 'جديد' | 'قيد المراجعة' | 'تمت الموافقة' | 'مرفوض' | 'تم التنفيذ';
  response?: string;
  responded_by?: string;
  responded_at?: string;
  created_at: string;
  updated_at: string;
}

const Icons = {
  Hand: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
    </svg>
  ),
  Check: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  X: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Eye: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ),
  Refresh: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  Inbox: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  Medical: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  ),
  Home: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  ),
  Cash: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Education: ({ className = "w-5 h-5" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path d="M12 14l9-5-9-5-9 5 9 5z" />
      <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
    </svg>
  ),
};

const URGENCY_COLORS = {
  'عاجل جداً': 'bg-red-100 text-red-700 border-red-200',
  'عاجل': 'bg-orange-100 text-orange-700 border-orange-200',
  'عادي': 'bg-blue-100 text-blue-700 border-blue-200'
};

const STATUS_COLORS = {
  'جديد': 'bg-blue-100 text-blue-700 border-blue-200',
  'قيد المراجعة': 'bg-amber-100 text-amber-700 border-amber-200',
  'تمت الموافقة': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'مرفوض': 'bg-red-100 text-red-700 border-red-200',
  'تم التنفيذ': 'bg-purple-100 text-purple-700 border-purple-200'
};

const ASSISTANCE_TYPE_ICONS: { [key: string]: any } = {
  'طبية': Icons.Medical,
  'مالية': Icons.Cash,
  'سكنية': Icons.Home,
  'تعليمية': Icons.Education,
  'أخرى': Icons.Hand
};

const ASSISTANCE_TYPE_LABELS: { [key: string]: string } = {
  'طبية': 'طبية',
  'مالية': 'مالية',
  'سكنية': 'سكنية',
  'تعليمية': 'تعليمية',
  'أخرى': 'أخرى'
};

const SpecialAssistanceManagement: React.FC = () => {
  const [requests, setRequests] = useState<SpecialAssistanceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<SpecialAssistanceRequest | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'execute' | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const currentUser = sessionService.getCurrentUser();
      const campId = currentUser?.campId;

      if (!campId) {
        setToast({ message: 'معرف المخيم غير موجود', type: 'error' });
        return;
      }

      const allRequests = await realDataService.getSpecialAssistanceRequests(campId);
      setRequests(Array.isArray(allRequests) ? allRequests : []);
    } catch (error: any) {
      console.error('Error loading special assistance requests:', error);
      setToast({ message: 'فشل تحميل طلبات المساعدة', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleResponse = async (action: 'approve' | 'reject' | 'execute') => {
    if (!selectedRequest) return;

    try {
      const currentUser = sessionService.getCurrentUser();
      
      await realDataService.updateSpecialAssistanceRequest(selectedRequest.id, {
        status: action === 'approve' ? 'تمت الموافقة' : action === 'reject' ? 'مرفوض' : 'تم التنفيذ',
        response: responseText,
        responded_by: currentUser?.id,
        responded_at: new Date().toISOString()
      });

      setToast({ 
        message: action === 'approve' ? 'تمت الموافقة على الطلب' : 
                 action === 'reject' ? 'تم رفض الطلب' : 'تم تحديث حالة الطلب', 
        type: 'success' 
      });

      setShowResponseModal(false);
      setResponseText('');
      setSelectedRequest(null);
      loadRequests();
    } catch (error: any) {
      console.error('Error updating request:', error);
      setToast({ message: 'فشل تحديث الطلب', type: 'error' });
    }
  };

  const openResponseModal = (request: SpecialAssistanceRequest, action: 'approve' | 'reject' | 'execute') => {
    setSelectedRequest(request);
    setConfirmAction(action);
    setShowResponseModal(true);
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    if (filterType !== 'all' && req.assistance_type !== filterType) return false;
    return true;
  });

  const stats = {
    total: requests.length,
    new: requests.filter(r => r.status === 'جديد').length,
    inReview: requests.filter(r => r.status === 'قيد المراجعة').length,
    approved: requests.filter(r => r.status === 'تمت الموافقة').length,
    rejected: requests.filter(r => r.status === 'مرفوض').length,
    executed: requests.filter(r => r.status === 'تم التنفيذ').length
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
      
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/20">
              <Icons.Hand className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-800">طلبات المساعدة الخاصة</h1>
              <p className="text-gray-500 font-bold text-sm">إدارة ومراجعة طلبات المساعدة للأسر</p>
            </div>
          </div>
          <button
            onClick={loadRequests}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            <Icons.Refresh className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 shadow-sm">
          <p className="text-gray-500 font-bold text-xs mb-1">الإجمالي</p>
          <p className="text-3xl font-black text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-blue-50 rounded-2xl p-4 border-2 border-blue-100">
          <p className="text-blue-600 font-bold text-xs mb-1">جديد</p>
          <p className="text-3xl font-black text-blue-700">{stats.new}</p>
        </div>
        <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-100">
          <p className="text-amber-600 font-bold text-xs mb-1">قيد المراجعة</p>
          <p className="text-3xl font-black text-amber-700">{stats.inReview}</p>
        </div>
        <div className="bg-emerald-50 rounded-2xl p-4 border-2 border-emerald-100">
          <p className="text-emerald-600 font-bold text-xs mb-1">موافق</p>
          <p className="text-3xl font-black text-emerald-700">{stats.approved}</p>
        </div>
        <div className="bg-red-50 rounded-2xl p-4 border-2 border-red-100">
          <p className="text-red-600 font-bold text-xs mb-1">مرفوض</p>
          <p className="text-3xl font-black text-red-700">{stats.rejected}</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-4 border-2 border-purple-100">
          <p className="text-purple-600 font-bold text-xs mb-1">تم التنفيذ</p>
          <p className="text-3xl font-black text-purple-700">{stats.executed}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 mb-6">
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none font-bold"
            >
              <option value="all">الكل</option>
              <option value="جديد">جديد</option>
              <option value="قيد المراجعة">قيد المراجعة</option>
              <option value="تمت الموافقة">تمت الموافقة</option>
              <option value="مرفوض">مرفوض</option>
              <option value="تم التنفيذ">تم التنفيذ</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">النوع</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none font-bold"
            >
              <option value="all">الكل</option>
              <option value="طبية">طبية</option>
              <option value="مالية">مالية</option>
              <option value="سكنية">سكنية</option>
              <option value="تعليمية">تعليمية</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
        </div>
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-100">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 font-bold">جاري تحميل الطلبات...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border-2 border-gray-100">
          <Icons.Inbox className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 font-bold text-lg">لا توجد طلبات مساعدة</p>
          <p className="text-gray-400 font-bold text-sm mt-2">ستظهر الطلبات هنا عند تقديمها من الأسر</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredRequests.map((request) => {
            const TypeIcon = ASSISTANCE_TYPE_ICONS[request.assistance_type] || Icons.Hand;
            
            return (
              <div key={request.id} className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm overflow-hidden hover:border-emerald-200 transition-colors">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                        <TypeIcon className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-gray-800 text-lg">{request.family_name || 'أسرة ' + request.family_id.slice(0, 8)}</h3>
                        <p className="text-xs text-gray-500 font-bold mt-1">
                          {new Date(request.created_at).toLocaleDateString('ar-EG', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1.5 rounded-full text-xs font-black border-2 ${STATUS_COLORS[request.status] || STATUS_COLORS['جديد']}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${ASSISTANCE_TYPE_LABELS[request.assistance_type] ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'}`}>
                      {ASSISTANCE_TYPE_LABELS[request.assistance_type] || 'أخرى'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-black ${URGENCY_COLORS[request.urgency]}`}>
                      {request.urgency}
                    </span>
                  </div>

                  <p className="text-gray-700 font-bold text-sm mb-4 line-clamp-3">{request.description}</p>

                  {request.response && (
                    <div className="bg-gray-50 rounded-xl p-3 mb-4">
                      <p className="text-xs font-black text-gray-700 mb-1">الرد:</p>
                      <p className="text-sm text-gray-600 font-bold">{request.response}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => openResponseModal(request, 'approve')}
                      disabled={request.status !== 'جديد' && request.status !== 'قيد المراجعة'}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                    >
                      <Icons.Check className="w-4 h-4" />
                      موافقة
                    </button>
                    <button
                      onClick={() => openResponseModal(request, 'reject')}
                      disabled={request.status !== 'جديد' && request.status !== 'قيد المراجعة'}
                      className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                    >
                      <Icons.X className="w-4 h-4" />
                      رفض
                    </button>
                    <button
                      onClick={() => openResponseModal(request, 'execute')}
                      disabled={request.status !== 'تمت الموافقة'}
                      className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-1 justify-center"
                    >
                      <Icons.Check className="w-4 h-4" />
                      تنفيذ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      {showResponseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-black text-gray-800">
                {confirmAction === 'approve' ? 'الموافقة على الطلب' : 
                 confirmAction === 'reject' ? 'رفض الطلب' : 'تأكيد التنفيذ'}
              </h3>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">الرد (اختياري)</label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  rows={4}
                  placeholder="اكتب ردك على الطلب..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => {
                  setShowResponseModal(false);
                  setResponseText('');
                  setSelectedRequest(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => handleResponse(confirmAction!)}
                className={`flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all ${
                  confirmAction === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                  confirmAction === 'reject' ? 'bg-red-600 hover:bg-red-700' :
                  'bg-purple-600 hover:bg-purple-700'
                }`}
              >
                {confirmAction === 'approve' ? 'موافقة' : confirmAction === 'reject' ? 'رفض' : 'تنفيذ'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={() => {}}
        title="تأكيد"
        message="هل أنت متأكد؟"
        confirmText="تأكيد"
        cancelText="إلغاء"
      />
    </div>
  );
};

export default SpecialAssistanceManagement;
