// views/camp-manager/ComplaintsManagement.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../../services/sessionService';
import { realDataService } from '../../services/realDataServiceBackend';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { Complaint, ComplaintStatus } from '../../types';

const STATUS_COLORS: { [key: string]: string } = {
  'جديد': 'bg-blue-50 text-blue-700 border-blue-200',
  'قيد المراجعة': 'bg-amber-50 text-amber-700 border-amber-200',
  'تم الرد': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'مغلق': 'bg-gray-50 text-gray-700 border-gray-200'
};

const CATEGORY_COLORS: { [key: string]: string } = {
  'عام': 'bg-gray-100 text-gray-700',
  'صحي': 'bg-red-100 text-red-700',
  'أمن': 'bg-orange-100 text-orange-700',
  'مرافق': 'bg-blue-100 text-blue-700',
  'أخرى': 'bg-purple-100 text-purple-700'
};

const CATEGORIES = ['عام', 'صحي', 'أمن', 'مرافق', 'أخرى'];
const STATUSES: ComplaintStatus[] = ['جديد', 'قيد المراجعة', 'تم الرد', 'مغلق'];

const ComplaintsManagement: React.FC = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Modal states
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [complaintToDelete, setComplaintToDelete] = useState<string | null>(null);
  
  // Form states
  const [responseText, setResponseText] = useState('');
  const [restoreReason, setRestoreReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [campId, setCampId] = useState<string>('');
  const [showDeleted, setShowDeleted] = useState(false);

  const user = sessionService.getCurrentUser();
  const isSystemAdmin = user?.role === 'SYSTEM_ADMIN';

  // Refs to keep values updated for useCallback closures
  const campIdRef = useRef<string>('');
  const showDeletedRef = useRef<boolean>(false);
  const isSystemAdminRef = useRef<boolean>(false);

  useEffect(() => {
    campIdRef.current = campId;
  }, [campId]);

  useEffect(() => {
    showDeletedRef.current = showDeleted;
  }, [showDeleted]);

  useEffect(() => {
    isSystemAdminRef.current = isSystemAdmin;
  }, [isSystemAdmin]);

  // Helper functions for date formatting
  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'غير متوفر';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'غير متوفر';
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'غير متوفر';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'غير متوفر';
    return date.toLocaleDateString('ar-EG', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  // Load complaints
  const loadComplaints = useCallback(async (campId: string, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      let url = `/staff/complaints?campId=${campId}`;
      if (showDeletedRef.current && isSystemAdminRef.current) {
        url += '&includeDeleted=true';
      }

      const data = await makeAuthenticatedRequest(url);
      setComplaints(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error loading complaints:', error);
      setToast({ message: error.message || 'فشل تحميل الشكاوى', type: 'error' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial load
  useEffect(() => {
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCampId(currentUser.campId);
      loadComplaints(currentUser.campId);
    } else {
      setToast({ message: 'لم يتم تحديد المخيم', type: 'error' });
      setLoading(false);
    }
  }, []);

  // Reload when showDeleted changes
  useEffect(() => {
    if (campId) {
      loadComplaints(campId);
    }
  }, [campId]);

  const handleRefresh = () => {
    loadComplaints(campId, true);
  };

  // Handle respond to complaint
  const handleRespond = async () => {
    if (!selectedComplaint) return;
    
    if (!responseText.trim()) {
      setToast({ message: 'يرجى كتابة الرد', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      await makeAuthenticatedRequest(`/staff/complaints/${selectedComplaint.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          response: responseText,
          status: 'تم الرد'
        })
      });
      
      setToast({ message: 'تم إرسال الرد بنجاح', type: 'success' });
      setShowResponseModal(false);
      setResponseText('');
      setSelectedComplaint(null);
      loadComplaints(campId);
    } catch (error: any) {
      console.error('Error responding to complaint:', error);
      setToast({ message: error.message || 'فشل إرسال الرد', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (complaintId: string, newStatus: string) => {
    try {
      // Debug logging to track status changes
      console.log('[ComplaintsManagement] Updating status:', {
        complaintId,
        newStatus,
        newStatusTrimmed: newStatus.trim(),
        newStatusLength: newStatus.length,
        newStatusCharCodes: Array.from(newStatus).map(c => c.charCodeAt(0))
      });

      await makeAuthenticatedRequest(`/staff/complaints/${complaintId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus.trim() })
      });
      setToast({ message: 'تم تحديث الحالة بنجاح', type: 'success' });
      loadComplaints(campId);
    } catch (error: any) {
      console.error('Error updating status:', error);
      setToast({ message: error.message || 'فشل تحديث الحالة', type: 'error' });
    }
  };

  // Handle delete
  const handleDelete = (complaintId: string) => {
    setComplaintToDelete(complaintId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!complaintToDelete) return;

    try {
      setSubmitting(true);
      await makeAuthenticatedRequest(`/staff/complaints/${complaintToDelete}`, {
        method: 'DELETE'
      });
      setToast({ message: 'تم حذف الشكوى بنجاح', type: 'success' });
      loadComplaints(campId);
    } catch (error: any) {
      console.error('Error deleting complaint:', error);
      setToast({ message: error.message || 'فشل حذف الشكوى', type: 'error' });
    } finally {
      setSubmitting(false);
      setShowDeleteConfirm(false);
      setComplaintToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setComplaintToDelete(null);
  };

  // Handle restore
  const handleRestore = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setRestoreReason('');
    setShowRestoreModal(true);
  };

  const confirmRestore = async () => {
    if (!selectedComplaint) return;

    try {
      setSubmitting(true);
      await realDataService.restoreComplaint(selectedComplaint.id, restoreReason);
      setToast({ message: 'تم استعادة الشكوى بنجاح', type: 'success' });
      setShowRestoreModal(false);
      setRestoreReason('');
      setSelectedComplaint(null);
      loadComplaints(campId);
    } catch (error: any) {
      console.error('Error restoring complaint:', error);
      setToast({ message: error.message || 'فشل استعادة الشكوى', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRestore = () => {
    setShowRestoreModal(false);
    setRestoreReason('');
    setSelectedComplaint(null);
  };

  // Filter complaints
  const filteredComplaints = complaints.filter(complaint => {
    // Filter by status
    if (filterStatus !== 'all' && complaint.status !== filterStatus) return false;
    
    // Filter by category
    if (filterCategory !== 'all' && complaint.category !== filterCategory) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const familyName = (complaint.familyName || '').toLowerCase();
      const subject = complaint.subject.toLowerCase();
      const description = complaint.description.toLowerCase();
      return familyName.includes(query) || subject.includes(query) || description.includes(query);
    }
    
    return true;
  });

  // Calculate statistics
  const stats = {
    total: complaints.filter(c => !c.deleted).length,
    new: complaints.filter(c => c.status === 'جديد' && !c.deleted).length,
    inReview: complaints.filter(c => c.status === 'قيد المراجعة' && !c.deleted).length,
    responded: complaints.filter(c => c.status === 'تم الرد' && !c.deleted).length,
    deleted: complaints.filter(c => c.deleted).length
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6" dir="rtl">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="تأكيد حذف الشكوى"
        message="هل أنت متأكد من حذف هذه الشكوى؟ يمكن استعادتها لاحقاً من قبل مدير النظام."
        confirmText="حذف"
        cancelText="إلغاء"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      {/* Restore Modal */}
      <ConfirmModal
        isOpen={showRestoreModal}
        title="استعادة شكوى محذوفة"
        message={
          <div className="space-y-3">
            <p>هل أنت متأكد من استعادة هذه الشكوى؟</p>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                سبب الاستعادة (اختياري)
              </label>
              <textarea
                value={restoreReason}
                onChange={(e) => setRestoreReason(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-sm"
                rows={3}
                placeholder="اكتب سبب استعادة الشكوى..."
              />
            </div>
          </div>
        }
        confirmText="استعادة"
        cancelText="إلغاء"
        type="success"
        onConfirm={confirmRestore}
        onCancel={cancelRestore}
      />

      {/* Response Modal */}
      {showResponseModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-800">الرد على الشكوى</h2>
                <button
                  onClick={() => setShowResponseModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Complaint Info */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-black ${CATEGORY_COLORS[selectedComplaint.category]}`}>
                    {selectedComplaint.category}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-black border-2 ${STATUS_COLORS[selectedComplaint.status]}`}>
                    {selectedComplaint.status}
                  </span>
                </div>
                <h3 className="font-black text-gray-800">{selectedComplaint.subject}</h3>
                <p className="text-sm text-gray-600 font-bold">
                  {selectedComplaint.isAnonymous ? 'مجهول' : selectedComplaint.familyName}
                </p>
              </div>

              {/* Response Input */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  نص الرد
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-sm"
                  rows={6}
                  placeholder="اكتب ردك هنا..."
                  dir="rtl"
                />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button
                onClick={() => setShowResponseModal(false)}
                disabled={submitting}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleRespond}
                disabled={submitting || !responseText.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'جاري الإرسال...' : 'إرسال الرد'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black text-gray-800">تفاصيل الشكوى</h2>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-wrap gap-2">
                <span className={`px-3 py-1.5 rounded-full text-sm font-black ${CATEGORY_COLORS[selectedComplaint.category]}`}>
                  {selectedComplaint.category}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-sm font-black border-2 ${STATUS_COLORS[selectedComplaint.status]}`}>
                  {selectedComplaint.status}
                </span>
                {selectedComplaint.isAnonymous && (
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-black">
                    مجهول الهوية
                  </span>
                )}
              </div>

              {/* Family Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-black text-gray-800 mb-2">معلومات العائلة</h3>
                <p className="text-gray-700 font-bold">
                  {selectedComplaint.isAnonymous ? 'مجهول' : selectedComplaint.familyName || 'غير متوفر'}
                </p>
                {!selectedComplaint.isAnonymous && selectedComplaint.headOfFamilyNationalId && (
                  <p className="text-sm text-gray-500 font-bold mt-1">
                    رقم الهوية: {selectedComplaint.headOfFamilyNationalId}
                  </p>
                )}
              </div>

              {/* Subject & Description */}
              <div className="space-y-3">
                <div>
                  <h3 className="font-black text-gray-800 mb-2">العنوان</h3>
                  <p className="text-gray-700 font-bold">{selectedComplaint.subject}</p>
                </div>
                <div>
                  <h3 className="font-black text-gray-800 mb-2">التفاصيل</h3>
                  <p className="text-gray-700 font-bold whitespace-pre-line">{selectedComplaint.description}</p>
                </div>
              </div>

              {/* Response Section */}
              {selectedComplaint.response && (
                <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-100">
                  <h3 className="font-black text-emerald-800 mb-2">الرد</h3>
                  <p className="text-emerald-700 font-bold whitespace-pre-line">{selectedComplaint.response}</p>
                  <p className="text-xs text-emerald-600 font-bold mt-2">
                    تاريخ الرد: {formatDateTime(selectedComplaint.respondedAt)}
                  </p>
                </div>
              )}

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 font-bold">تاريخ الإرسال</p>
                  <p className="text-gray-700 font-black">{formatDateTime(selectedComplaint.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-500 font-bold">آخر تحديث</p>
                  <p className="text-gray-700 font-black">{formatDateTime(selectedComplaint.updatedAt)}</p>
                </div>
              </div>

              {/* Deleted Info */}
              {selectedComplaint.deleted && (
                <div className="bg-red-50 rounded-xl p-4 border-2 border-red-100">
                  <p className="text-red-700 font-black mb-2">هذه الشكوى محذوفة</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-red-600 font-bold">
                      تاريخ الحذف: {formatDateTime(selectedComplaint.deletedAt)}
                    </p>
                    {selectedComplaint.restorationReason && (
                      <p className="text-red-600 font-bold">
                        سبب الاستعادة: {selectedComplaint.restorationReason}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 sticky bottom-0 bg-white">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-800">إدارة الشكاوى والمقترحات</h1>
          <p className="text-gray-500 font-bold text-sm mt-1">متابعة والرد على شكاوى النازحين</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 self-start sm:self-auto"
        >
          <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="hidden sm:inline">{refreshing ? 'جاري التحديث...' : 'تحديث'}</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 font-bold text-xs md:text-sm">إجمالي الشكاوى</p>
              <p className="text-2xl md:text-4xl font-black text-gray-800 mt-2">{stats.total}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gray-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-blue-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 font-bold text-xs md:text-sm">جديدة</p>
              <p className="text-2xl md:text-4xl font-black text-blue-700 mt-2">{stats.new}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-amber-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-600 font-bold text-xs md:text-sm">قيد المراجعة</p>
              <p className="text-2xl md:text-4xl font-black text-amber-700 mt-2">{stats.inReview}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border-2 border-emerald-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-600 font-bold text-xs md:text-sm">تم الرد</p>
              <p className="text-2xl md:text-4xl font-black text-emerald-700 mt-2">{stats.responded}</p>
            </div>
            <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
        <div className="flex flex-col gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="البحث بالاسم أو الموضوع..."
              className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-sm"
            />
            <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Status & Category Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-bold text-gray-700 whitespace-nowrap">الحالة:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-sm"
              >
                <option value="all">الكل</option>
                {STATUSES.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 flex-1">
              <label className="text-sm font-bold text-gray-700 whitespace-nowrap">التصنيف:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-sm"
              >
                <option value="all">الكل</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Show Deleted Toggle - SYSTEM_ADMIN only */}
          {isSystemAdmin && (
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDeleted}
                  onChange={(e) => setShowDeleted(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-sm font-bold text-red-600">إظهار الشكاوى المحذوفة</span>
              </label>
              {showDeleted && (
                <span className="text-xs text-red-500 font-bold mr-4">
                  (عرض {stats.deleted} شكوى محذوفة)
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Complaints List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-4 animate-pulse">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredComplaints.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <p className="text-gray-600 font-bold text-lg mb-2">
            {searchQuery ? 'لا توجد شكاوى تطابق بحثك' : 'لا توجد شكاوى'}
          </p>
          <p className="text-gray-500 font-bold text-sm">
            {searchQuery ? 'جرب تغيير كلمات البحث' : 'ستظهر الشكاوى هنا عندما يقوم النازحون بإرسالها'}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 px-6 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
            >
              مسح البحث
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredComplaints.map((complaint) => {
            const isDeleted = complaint.deleted === true;
            return (
              <div
                key={complaint.id}
                className={`${
                  isDeleted 
                    ? 'bg-red-50 border-2 border-red-200' 
                    : 'bg-white border-2 border-gray-100'
                } shadow-sm overflow-hidden hover:shadow-md transition-shadow rounded-2xl`}
              >
                <div className="p-4 md:p-5">
                  {/* Deleted Badge */}
                  {isDeleted && (
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-red-200">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs font-black rounded">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        محذوف
                      </span>
                      <span className="text-xs text-red-600 font-bold">
                        {formatDate(complaint.deletedAt)}
                      </span>
                    </div>
                  )}

                  {/* Header */}
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      isDeleted ? 'bg-red-100' : 'bg-emerald-100'
                    }`}>
                      <svg className={`w-5 h-5 ${isDeleted ? 'text-red-600' : 'text-emerald-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-black ${CATEGORY_COLORS[complaint.category]}`}>
                          {complaint.category}
                        </span>
                        {complaint.isAnonymous && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-black">مجهول</span>
                        )}
                        <span className={`px-2 py-1 rounded-full text-xs font-black border-2 ${STATUS_COLORS[complaint.status]}`}>
                          {complaint.status}
                        </span>
                      </div>
                      <h3 className="font-black text-gray-800 text-base md:text-lg truncate">{complaint.subject}</h3>
                      <p className="text-xs text-gray-500 font-bold mt-1">
                        {complaint.isAnonymous ? 'مجهول' : complaint.familyName || 'غير متوفر'} • {formatDate(complaint.createdAt)}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  <p className={`text-gray-700 font-bold text-sm mb-3 line-clamp-2 ${isDeleted ? 'text-red-700' : ''}`}>
                    {complaint.description}
                  </p>

                  {/* Response */}
                  {complaint.response && (
                    <div className={`rounded-xl p-3 border mb-3 ${
                      isDeleted ? 'bg-red-100 border-red-200' : 'bg-emerald-50 border-emerald-100'
                    }`}>
                      <p className={`text-xs font-black mb-1 ${isDeleted ? 'text-red-800' : 'text-emerald-800'}`}>الرد:</p>
                      <p className={`text-sm font-bold ${isDeleted ? 'text-red-700' : 'text-emerald-700'}`}>{complaint.response}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2">
                    {isDeleted ? (
                      // Restore button for deleted complaints
                      <button
                        onClick={() => handleRestore(complaint)}
                        disabled={submitting || !isSystemAdmin}
                        className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all disabled:opacity-50 flex-1 sm:flex-none justify-center"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                        <span>استعادة</span>
                      </button>
                    ) : (
                      // Regular action buttons
                      <>
                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowResponseModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs hover:bg-emerald-700 transition-all flex-1 sm:flex-none justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          <span>رد</span>
                        </button>

                        <button
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setShowDetailsModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all flex-1 sm:flex-none justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>تفاصيل</span>
                        </button>

                        {/* Status Dropdown */}
                        <select
                          value={complaint.status}
                          onChange={(e) => handleStatusChange(complaint.id, e.target.value)}
                          className="px-2 py-2 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-xs bg-white"
                        >
                          {STATUSES.map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDelete(complaint.id)}
                          className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-all flex-1 sm:flex-none justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="hidden sm:inline">حذف</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ComplaintsManagement;
