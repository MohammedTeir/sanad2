// views/admin/DeletedRecordsViewer.tsx - SYSTEM_ADMIN Soft Delete Records Viewer
import React, { useState, useEffect, useCallback } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import { Role } from '../../types';
import Toast from '../../components/Toast';

interface SoftDeleteRecord {
  id: string;
  table_name: string;
  record_id: string;
  deleted_by_user_id: string;
  deleted_by_user_name?: string;
  deleted_at: string;
  reason?: string;
  data_snapshot: any;
  restored_at?: string;
  restored_by_user_id?: string;
  restored_by_user_name?: string;
  restore_reason?: string;
}

const TABLE_LABELS: Record<string, string> = {
  families: 'العائلات',
  individuals: 'الأفراد',
  inventory_items: 'عناصر المخزون',
  aid_types: 'أنواع المساعدات',
  aid_campaigns: 'حملات المساعدات',
  users: 'المستخدمين',
  camps: 'المخيمات'
};

const DeletedRecordsViewer: React.FC = () => {
  const [records, setRecords] = useState<SoftDeleteRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [filterTable, setFilterTable] = useState<string>('all');
  const [restoringRecord, setRestoringRecord] = useState<SoftDeleteRecord | null>(null);
  const [restoreReason, setRestoreReason] = useState('');
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  const currentUser = sessionService.getCurrentUser();
  const isSystemAdmin = currentUser?.role === Role.SYSTEM_ADMIN;

  // Redirect non-SYSTEM_ADMIN users
  useEffect(() => {
    if (!isSystemAdmin) {
      setToast({ message: 'غير مصرح لك بالوصول إلى هذه الصفحة', type: 'error' });
    }
  }, [isSystemAdmin]);

  const loadRecords = useCallback(async () => {
    try {
      setLoading(true);
      const data = await realDataService.getSoftDeletes(filterTable !== 'all' ? filterTable : undefined);
      setRecords(data);
    } catch (err: any) {
      console.error('Error loading soft delete records:', err);
      setToast({ message: err.message || 'فشل تحميل السجلات المحذوفة', type: 'error' });
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [filterTable]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleRestore = (record: SoftDeleteRecord) => {
    setRestoringRecord(record);
    setRestoreReason('');
  };

  const confirmRestore = async () => {
    if (!restoringRecord) return;
    try {
      let restoreFn;
      switch (restoringRecord.table_name) {
        case 'families':
          restoreFn = realDataService.restoreFamily;
          break;
        case 'individuals':
          restoreFn = realDataService.restoreIndividual;
          break;
        case 'inventory_items':
          restoreFn = realDataService.restoreInventoryItem;
          break;
        case 'aid_types':
          restoreFn = realDataService.restoreAidType;
          break;
        default:
          throw new Error('نوع السجل غير مدعوم');
      }

      await restoreFn(restoringRecord.record_id, restoreReason || 'استعادة من قبل الإدارة المركزية');
      setToast({ message: 'تم استعادة السجل بنجاح', type: 'success' });
      await loadRecords();
      setRestoringRecord(null);
      setRestoreReason('');
    } catch (err: any) {
      setToast({ message: `فشل استعادة السجل: ${err.message || 'خطأ غير معروف'}`, type: 'error' });
    }
  };

  const cancelRestore = () => {
    setRestoringRecord(null);
    setRestoreReason('');
  };

  const toggleExpand = (recordId: string) => {
    setExpandedRecord(expandedRecord === recordId ? null : recordId);
  };

  const getRecordName = (record: SoftDeleteRecord): string => {
    const snapshot = record.data_snapshot;
    if (!snapshot) return 'غير معروف';

    switch (record.table_name) {
      case 'families':
        return snapshot.head_of_family_name || snapshot.name || 'عائلة';
      case 'individuals':
        return snapshot.name || 'فرد';
      case 'inventory_items':
        return snapshot.name || 'عنصر مخزون';
      case 'aid_types':
        return snapshot.name || 'نوع مساعدة';
      case 'users':
        return snapshot.email || snapshot.username || 'مستخدم';
      case 'camps':
        return snapshot.name || 'مخيم';
      default:
        return 'سجل';
    }
  };

  const getDeletedByUserName = async (userId: string): Promise<string> => {
    // In a real implementation, this would fetch the user name from the backend
    return userId;
  };

  if (!isSystemAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2">غير مصرح لك</h2>
          <p className="text-gray-600 font-bold">هذه الصفحة متاحة فقط للإدارة المركزية</p>
        </div>
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[...Array(6)].map((_, i) => (
                    <th key={i} className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {[...Array(6)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-orange-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              السجلات المحذوفة
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">عرض وإدارة السجلات المحذوفة مؤقتاً</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-red-600">{records.length}</p>
            <p className="text-xs font-bold text-red-700 mt-1">إجمالي المحذوفات</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-blue-600">
              {records.filter(r => r.table_name === 'families').length}
            </p>
            <p className="text-xs font-bold text-blue-700 mt-1">العائلات</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-emerald-600">
              {records.filter(r => r.table_name === 'inventory_items').length}
            </p>
            <p className="text-xs font-bold text-emerald-700 mt-1">عناصر المخزون</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 text-center shadow-sm">
            <p className="text-3xl font-black text-purple-600">
              {records.filter(r => r.table_name === 'aid_types').length}
            </p>
            <p className="text-xs font-bold text-purple-700 mt-1">أنواع المساعدات</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <label className="block text-sm font-black text-gray-700">تصفية حسب الجدول:</label>
          <select
            value={filterTable}
            onChange={(e) => setFilterTable(e.target.value)}
            className="px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-bold"
          >
            <option value="all">جميع الجداول</option>
            {Object.entries(TABLE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-red-50 to-orange-50">
              <tr>
                <th className="px-6 py-4 text-right font-black text-gray-700">السجل</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">الجدول</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">تاريخ الحذف</th>
                <th className="px-6 py-4 text-right font-black text-gray-700">حذف بواسطة</th>
                <th className="px-6 py-4 text-center font-black text-gray-700">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                      </div>
                      <p className="text-gray-500 font-bold">لا توجد سجلات محذوفة</p>
                    </div>
                  </td>
                </tr>
              ) : (
                records.map((record) => (
                  <React.Fragment key={record.id}>
                    <tr className="hover:bg-red-50 transition-colors bg-red-50/30 border-2 border-red-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-black">
                            {getRecordName(record).charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-800 line-through text-red-600">{getRecordName(record)}</p>
                            <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-600 text-white text-xs font-black rounded">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              محذوف
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-black bg-gray-100 text-gray-700 border-2 border-gray-200">
                          {TABLE_LABELS[record.table_name] || record.table_name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-700" dir="ltr">
                          {new Date(record.deleted_at).toLocaleDateString('ar-EG', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-600">{record.deleted_by_user_name || record.deleted_by_user_id}</span>
                        {record.reason && (
                          <p className="text-xs text-gray-500 font-bold mt-1">{record.reason}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => toggleExpand(record.id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="عرض التفاصيل"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRestore(record)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="استعادة"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRecord === record.id && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-red-50/50">
                          <div className="bg-white rounded-xl p-4 border-2 border-red-100">
                            <h4 className="font-black text-gray-800 mb-3">بيانات السجل المحذوف:</h4>
                            <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto" dir="ltr">
                              {JSON.stringify(record.data_snapshot, null, 2)}
                            </pre>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Modal */}
      {restoringRecord && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">استعادة سجل محذوف</h3>
              <p className="text-gray-600 font-bold text-sm mb-4">
                هل أنت متأكد من استعادة "{getRecordName(restoringRecord)}" من جدول {TABLE_LABELS[restoringRecord.table_name] || restoringRecord.table_name}؟
              </p>
              <div className="text-right">
                <label className="block text-sm font-black text-gray-700 mb-2">
                  سبب الاستعادة
                </label>
                <textarea
                  value={restoreReason}
                  onChange={(e) => setRestoreReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold resize-none"
                  rows={3}
                  placeholder="أدخل سبب الاستعادة..."
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={cancelRestore}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={confirmRestore}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-800 transition-all shadow-lg"
              >
                استعادة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeletedRecordsViewer;
