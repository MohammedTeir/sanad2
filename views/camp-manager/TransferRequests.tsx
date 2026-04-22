// views/camp-manager/TransferRequests.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

interface TransferRequest {
  id: string;
  dp_id: string;
  dp_name: string;
  dp_national_id?: string;
  dp_phone?: string;
  from_camp_id: string;
  from_camp_name: string;
  to_camp_id: string;
  to_camp_name: string;
  status: 'قيد الانتظار' | 'موافق' | 'مرفوض' | 'تمت المعالجة';
  request_date: string;
  reason: string;
  additional_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  rejection_reason?: string;
  admin_notes?: string;
  family_members_count?: number;
}

// SVG Icon Components
const InboxIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

const SendIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

const ChartIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const RefreshIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const UserIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const DocumentIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const EyeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const CheckIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const HomeIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const UsersIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const MedicalIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const BriefcaseIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const BookIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const ShieldIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const getReasonIcon = (reason: string) => {
  if (reason.includes('ازدحام')) return <UsersIcon className="w-4 h-4" />;
  if (reason.includes('عائلة') || reason.includes('لم شمل')) return <HomeIcon className="w-4 h-4" />;
  if (reason.includes('صحة') || reason.includes('طبي')) return <MedicalIcon className="w-4 h-4" />;
  if (reason.includes('عمل')) return <BriefcaseIcon className="w-4 h-4" />;
  if (reason.includes('تعليم') || reason.includes('مدرسة')) return <BookIcon className="w-4 h-4" />;
  if (reason.includes('أمن')) return <ShieldIcon className="w-4 h-4" />;
  return <DocumentIcon className="w-4 h-4" />;
};

const TransferRequests: React.FC = () => {
  const [requests, setRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [activeTab, setActiveTab] = useState<'incoming' | 'outgoing' | 'all'>('incoming');
  const [filterStatus, setFilterStatus] = useState<'all' | 'قيد الانتظار' | 'موافق' | 'مرفوض'>('قيد الانتظار');

  // Ref to keep currentCampId updated for useCallback closures
  const currentCampIdRef = useRef<string>('');

  useEffect(() => {
    currentCampIdRef.current = currentCampId;
  }, [currentCampId]);

  // Modal states
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<TransferRequest | null>(null);
  const [approveNotes, setApproveNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  // Load current user's camp ID on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
    } else {
      setToast({ message: 'لم يتم تحديد المخيم. يرجى تسجيل الدخول كمدير مخيم.', type: 'error' });
    }
  }, []);

  // Load transfer requests
  const loadRequests = useCallback(async () => {
    if (!currentCampIdRef.current) return;

    try {
      setLoading(true);
      const data = await realDataService.getTransferRequests(currentCampIdRef.current, activeTab);
      setRequests(data);
    } catch (err: any) {
      console.error('Error loading transfer requests:', err);
      setToast({ message: err.message || 'فشل تحميل طلبات النقل', type: 'error' });
      setRequests([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentCampId) {
      loadRequests();
    }
  }, [currentCampId, activeTab]);

  const handleApprove = (request: TransferRequest) => {
    setSelectedRequest(request);
    setApproveNotes('');
    setShowApproveModal(true);
  };

  const handleReject = (request: TransferRequest) => {
    setSelectedRequest(request);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleViewDetails = (request: TransferRequest) => {
    setSelectedRequest(request);
    setShowDetailsModal(true);
  };

  const confirmApprove = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      const response = await realDataService.approveTransferRequest(selectedRequest.id, approveNotes || undefined);
      setToast({ 
        message: response?.message || 'تم قبول طلب النقل بنجاح', 
        type: 'success' 
      });
      setShowApproveModal(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (err: any) {
      setToast({ 
        message: err?.message || `فشل قبول الطلب: ${err.message || 'خطأ غير معروف'}`, 
        type: 'error' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const confirmReject = async () => {
    if (!selectedRequest || !rejectReason.trim()) return;
    setProcessing(true);
    try {
      const response = await realDataService.rejectTransferRequest(selectedRequest.id, rejectReason);
      setToast({ 
        message: response?.message || 'تم رفض طلب النقل', 
        type: 'success' 
      });
      setShowRejectModal(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (err: any) {
      setToast({ 
        message: err?.message || `فشل رفض الطلب: ${err.message || 'خطأ غير معروف'}`, 
        type: 'error' 
      });
    } finally {
      setProcessing(false);
    }
  };

  const cancelApprove = () => {
    setShowApproveModal(false);
    setSelectedRequest(null);
    setApproveNotes('');
  };

  const cancelReject = () => {
    setShowRejectModal(false);
    setSelectedRequest(null);
    setRejectReason('');
  };

  const closeDetails = () => {
    setShowDetailsModal(false);
    setSelectedRequest(null);
  };

  const filteredRequests = requests.filter(req => {
    if (filterStatus !== 'all' && req.status !== filterStatus) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'قيد الانتظار':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'موافق':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'مرفوض':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'تمت المعالجة':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Tabs Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-4">
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-10 w-32 bg-gray-200 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-4 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 md:w-14 md:h-14 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <RefreshIcon className="w-7 h-7 md:w-8 md:h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-gray-800">
                إدارة طلبات النقل
              </h1>
              <p className="text-gray-500 text-xs md:text-sm font-bold mt-1">
                متابعة ومراجعة طلبات النقل بين المخيمات
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm font-bold">
            <span className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 flex items-center gap-1">
              <InboxIcon className="w-4 h-4" />
              الواردة: {requests.filter(r => r.status === 'قيد الانتظار' && r.to_camp_id === currentCampId).length}
            </span>
            <span className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 flex items-center gap-1">
              <SendIcon className="w-4 h-4" />
              الصادرة: {requests.filter(r => r.status === 'قيد الانتظار' && r.from_camp_id === currentCampId).length}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs - Responsive */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`flex-1 min-w-[80px] py-2 md:py-3 px-2 md:px-4 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-1 md:gap-2 ${
              activeTab === 'incoming'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <InboxIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">الواردة</span>
            <span className="sm:hidden">واردة</span>
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`flex-1 min-w-[80px] py-2 md:py-3 px-2 md:px-4 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-1 md:gap-2 ${
              activeTab === 'outgoing'
                ? 'bg-purple-500 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SendIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">الصادرة</span>
            <span className="sm:hidden">صادرة</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 min-w-[80px] py-2 md:py-3 px-2 md:px-4 rounded-xl font-black text-xs md:text-sm transition-all flex items-center justify-center gap-1 md:gap-2 ${
              activeTab === 'all'
                ? 'bg-gray-800 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ChartIcon className="w-4 h-4 md:w-5 md:h-5" />
            <span className="hidden sm:inline">الكل</span>
          </button>
        </div>
      </div>

      {/* Filter - Responsive */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-3 md:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs md:text-sm font-black text-gray-700 whitespace-nowrap">الحالة:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="flex-1 min-w-[140px] px-3 md:px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-bold text-xs md:text-sm"
          >
            <option value="all">الكل</option>
            <option value="قيد الانتظار">قيد الانتظار</option>
            <option value="موافق">موافق</option>
            <option value="مرفوض">مرفوض</option>
          </select>
          <button
            onClick={loadRequests}
            className="flex items-center gap-2 px-3 md:px-4 py-2 bg-emerald-500 text-white rounded-xl font-black text-xs md:text-sm hover:bg-emerald-600 transition-all whitespace-nowrap"
          >
            <RefreshIcon className="w-4 h-4" />
            <span className="hidden sm:inline">تحديث</span>
          </button>
        </div>
      </div>

      {/* Requests Table - Responsive */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b">
          <h2 className="text-base md:text-lg font-black text-gray-800 flex items-center gap-2">
            <DocumentIcon className="w-5 h-5 text-gray-600" />
            {activeTab === 'incoming' ? 'الطلبات الواردة' : activeTab === 'outgoing' ? 'الطلبات الصادرة' : 'جميع الطلبات'}
          </h2>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="p-8 md:p-12 text-center">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentIcon className="w-8 h-8 md:w-10 md:h-10 text-gray-400" />
            </div>
            <p className="text-gray-500 font-bold text-base md:text-lg">لا توجد طلبات نقل</p>
            <p className="text-gray-400 text-xs md:text-sm mt-1">
              {activeTab === 'incoming'
                ? 'لا توجد طلبات واردة حالياً'
                : activeTab === 'outgoing'
                ? 'لا توجد طلبات صادرة حالياً'
                : 'لا توجد طلبات نقل في النظام'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[800px] lg:min-w-0">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs font-black text-gray-500 uppercase whitespace-nowrap">الأسرة</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs font-black text-gray-500 uppercase whitespace-nowrap hidden sm:table-cell">من</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs font-black text-gray-500 uppercase whitespace-nowrap hidden sm:table-cell">إلى</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs font-black text-gray-500 uppercase whitespace-nowrap">السبب</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs font-black text-gray-500 uppercase whitespace-nowrap hidden md:table-cell">التاريخ</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs font-black text-gray-500 uppercase whitespace-nowrap">الحالة</th>
                    <th className="px-3 md:px-6 py-3 md:py-4 text-right text-[10px] md:text-xs font-black text-gray-500 uppercase whitespace-nowrap">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div>
                          <p className="font-bold text-gray-800 text-xs md:text-sm">{request.dp_name}</p>
                          <p className="text-[10px] md:text-xs text-gray-500 mt-1 truncate max-w-[150px] md:max-w-none">
                            {request.dp_national_id && `هوية: ${request.dp_national_id}`}
                          </p>
                        </div>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-gray-600 hidden sm:table-cell">
                        <span className="truncate block max-w-[120px] md:max-w-none">{request.from_camp_name}</span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-xs md:text-sm font-bold text-gray-600 hidden sm:table-cell">
                        <span className="truncate block max-w-[120px] md:max-w-none">{request.to_camp_name}</span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <span className="inline-flex items-center gap-1 text-xs md:text-sm font-bold text-gray-700">
                          <span className="flex-shrink-0">{getReasonIcon(request.reason)}</span>
                          <span className="truncate max-w-[100px] md:max-w-xs">{request.reason}</span>
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4 text-[10px] md:text-sm font-mono font-bold text-gray-600 hidden md:table-cell whitespace-nowrap">
                        {new Date(request.request_date).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <span className={`inline-block px-2 md:px-3 py-1 rounded-lg text-[10px] md:text-xs font-black border-2 ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-3 md:px-6 py-3 md:py-4">
                        <div className="flex items-center gap-1 md:gap-2">
                          <button
                            onClick={() => handleViewDetails(request)}
                            className="p-1.5 md:p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            title="عرض التفاصيل"
                          >
                            <EyeIcon className="w-4 h-4 md:w-5 md:h-5" />
                          </button>
                          {request.status === 'قيد الانتظار' && activeTab === 'incoming' && (
                            <>
                              <button
                                onClick={() => handleApprove(request)}
                                className="p-1.5 md:p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors flex-shrink-0"
                                title="قبول"
                              >
                                <CheckIcon className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                              <button
                                onClick={() => handleReject(request)}
                                className="p-1.5 md:p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                                title="رفض"
                              >
                                <XIcon className="w-4 h-4 md:w-5 md:h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && selectedRequest && (
        <ConfirmModal
          isOpen={showApproveModal}
          title="تأكيد قبول طلب النقل"
          message={
            <div className="space-y-4">
              <p className="font-bold text-gray-700">
                هل أنت متأكد من قبول طلب النقل للأسرة <span className="text-blue-600">{selectedRequest.dp_name}</span>؟
              </p>
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <p className="text-sm font-bold text-blue-800 mb-2">تفاصيل الطلب:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-blue-600">من:</span> {selectedRequest.from_camp_name}
                  </div>
                  <div>
                    <span className="text-blue-600">إلى:</span> {selectedRequest.to_camp_name}
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-600">السبب:</span> {selectedRequest.reason}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">ملاحظات إضافية (اختياري)</label>
                <textarea
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 font-bold text-sm"
                  rows={3}
                  placeholder="أضف أي ملاحظات..."
                />
              </div>
            </div>
          }
          confirmText="نعم، قبول"
          cancelText="إلغاء"
          onConfirm={confirmApprove}
          onCancel={cancelApprove}
          confirmColor="emerald"
          disabled={processing}
        />
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedRequest && (
        <ConfirmModal
          isOpen={showRejectModal}
          title="تأكيد رفض طلب النقل"
          message={
            <div className="space-y-4">
              <p className="font-bold text-gray-700">
                هل أنت متأكد من رفض طلب النقل للأسرة <span className="text-blue-600">{selectedRequest.dp_name}</span>؟
              </p>
              <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                <p className="text-sm font-bold text-red-800 mb-2">تفاصيل الطلب:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-red-600">من:</span> {selectedRequest.from_camp_name}
                  </div>
                  <div>
                    <span className="text-red-600">إلى:</span> {selectedRequest.to_camp_name}
                  </div>
                  <div className="col-span-2">
                    <span className="text-red-600">السبب:</span> {selectedRequest.reason}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-black text-red-700 mb-2">سبب الرفض *</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-red-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 font-bold text-sm"
                  rows={3}
                  placeholder="اشرح سبب الرفض..."
                />
              </div>
            </div>
          }
          confirmText="نعم، رفض"
          cancelText="إلغاء"
          onConfirm={confirmReject}
          onCancel={cancelReject}
          confirmColor="red"
          disabled={processing || !rejectReason.trim()}
        />
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedRequest && (
        <ConfirmModal
          isOpen={showDetailsModal}
          title="تفاصيل طلب النقل"
          message={
            <div className="space-y-6">
              {/* Family Info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">👤</span> معلومات الأسرة
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">الاسم:</span>
                    <p className="font-bold text-gray-800">{selectedRequest.dp_name}</p>
                  </div>
                  {selectedRequest.dp_national_id && (
                    <div>
                      <span className="text-gray-500">رقم الهوية:</span>
                      <p className="font-bold text-gray-800 font-mono">{selectedRequest.dp_national_id}</p>
                    </div>
                  )}
                  {selectedRequest.dp_phone && (
                    <div>
                      <span className="text-gray-500">الهاتف:</span>
                      <p className="font-bold text-gray-800">{selectedRequest.dp_phone}</p>
                    </div>
                  )}
                  {selectedRequest.family_members_count && (
                    <div>
                      <span className="text-gray-500">عدد الأفراد:</span>
                      <p className="font-bold text-gray-800">{selectedRequest.family_members_count} أفراد</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Transfer Info */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <h3 className="font-black text-blue-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">🔄</span> معلومات النقل
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-blue-600">من المخيم:</span>
                    <p className="font-bold text-blue-800">{selectedRequest.from_camp_name}</p>
                  </div>
                  <div>
                    <span className="text-blue-600">إلى المخيم:</span>
                    <p className="font-bold text-blue-800">{selectedRequest.to_camp_name}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-blue-600">سبب النقل:</span>
                    <p className="font-bold text-blue-800 mt-1">{selectedRequest.reason}</p>
                  </div>
                  {selectedRequest.additional_notes && (
                    <div className="col-span-2">
                      <span className="text-blue-600">ملاحظات إضافية:</span>
                      <p className="font-bold text-blue-800 mt-1">{selectedRequest.additional_notes}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <h3 className="font-black text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-xl">📊</span> الحالة والتوقيت
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">الحالة:</span>
                    <span className={`inline-block mr-2 px-3 py-1 rounded-lg text-xs font-black border-2 ${getStatusColor(selectedRequest.status)}`}>
                      {selectedRequest.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">تاريخ الطلب:</span>
                    <p className="font-bold text-gray-800 font-mono text-xs">
                      {new Date(selectedRequest.request_date).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  {selectedRequest.reviewed_at && (
                    <div>
                      <span className="text-gray-500">تاريخ المراجعة:</span>
                      <p className="font-bold text-gray-800 font-mono text-xs">
                        {new Date(selectedRequest.reviewed_at).toLocaleString('ar-EG')}
                      </p>
                    </div>
                  )}
                  {selectedRequest.rejection_reason && (
                    <div className="col-span-2">
                      <span className="text-gray-500">سبب الرفض:</span>
                      <p className="font-bold text-red-600 mt-1">{selectedRequest.rejection_reason}</p>
                    </div>
                  )}
                  {selectedRequest.admin_notes && (
                    <div className="col-span-2">
                      <span className="text-gray-500">ملاحظات الإدارة:</span>
                      <p className="font-bold text-gray-700 mt-1">{selectedRequest.admin_notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          }
          confirmText="إغلاق"
          cancelText=""
          onConfirm={closeDetails}
          onCancel={closeDetails}
          confirmColor="gray"
        />
      )}
    </div>
  );
};

export default TransferRequests;
