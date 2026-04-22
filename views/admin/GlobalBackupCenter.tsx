import React, { useState, useEffect } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import { getAuthToken } from '../../utils/authUtils';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';

interface BackupOperation {
  id: string;
  operation_type: 'نسخة احتياطية' | 'مزامنة' | 'استعادة';
  scope: 'كامل' | 'جزئي' | 'خاص بالمخيم';
  campId?: string;
  campName?: string;
  name?: string; // Custom name for the backup
  file_name?: string;
  file_url?: string;
  status: 'قيد المعالجة' | 'مكتمل' | 'فشل';
  size_bytes?: number;
  initiatedBy?: string;
  initiatedByName?: string;
  startedAt: string;
  completedAt?: string;
}

const GlobalBackupCenter = () => {
  const [backups, setBackups] = useState<BackupOperation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Create backup modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [backupType, setBackupType] = useState<'كامل' | 'جزئي' | 'خاص بالمخيم'>('كامل');
  const [selectedCampId, setSelectedCampId] = useState<string>('');
  const [backupName, setBackupName] = useState<string>('');
  const [camps, setCamps] = useState<any[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    processing: 0,
    failed: 0,
    totalSize: 0
  });

  // Confirm modals
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupOperation | null>(null);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadBackups = async () => {
    setLoading(true);
    setRefreshing(true);
    try {
      const response: any = await realDataService.getBackups();
      console.log('Raw response:', response);
      
      const backupData = Array.isArray(response) ? response : (response.data || []);
      console.log('Processed backupData:', backupData);
      
      setBackups(backupData);
      
      // Calculate statistics
      setStats({
        total: backupData.length,
        completed: backupData.filter((b: any) => b.status === 'مكتمل').length,
        processing: backupData.filter((b: any) => b.status === 'قيد المعالجة').length,
        failed: backupData.filter((b: any) => b.status === 'فشل').length,
        totalSize: backupData.reduce((sum: number, b: any) => sum + (parseFloat(b.size_bytes) || 0), 0)
      });
    } catch (err) {
      console.error('Error loading backups:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadCamps = async () => {
    try {
      const response = await realDataService.getCamps();
      setCamps(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error loading camps:', err);
    }
  };

  useEffect(() => {
    loadBackups();
    loadCamps();
  }, []);

  const handleRefresh = () => {
    loadBackups();
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      let scope = backupType;
      let campId = selectedCampId || undefined;
      let name = backupName || undefined;

      await realDataService.createBackup(scope, campId, name);

      setShowCreateModal(false);
      setBackupType('كامل');
      setSelectedCampId('');
      setBackupName('');
      setToast({ message: 'تم بدء إنشاء النسخة الاحتياطية بنجاح', type: 'success' });

      // Refresh after a short delay to allow backup to start
      setTimeout(() => loadBackups(), 2000);
    } catch (error) {
      console.error('Error creating backup:', error);
      setToast({ message: 'فشل إنشاء النسخة الاحتياطية: ' + (error as any).message, type: 'error' });
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleDownload = async (backup: BackupOperation) => {
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication token not found');
      }

      const apiUrl = import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:3001/api';
      
      // Implement retry logic for 429 errors
      let retryCount = 0;
      const MAX_RETRIES = 3;
      const BASE_RETRY_DELAY_MS = 1000;
      
      const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      const calculateRetryDelay = (retryCount: number, retryAfterHeader: string | null): number => {
        if (retryAfterHeader) {
          const retryAfterSeconds = parseInt(retryAfterHeader, 10);
          if (!isNaN(retryAfterSeconds)) {
            return retryAfterSeconds * 1000;
          }
        }
        const exponentialDelay = BASE_RETRY_DELAY_MS * Math.pow(2, retryCount);
        const jitter = Math.random() * 1000;
        return exponentialDelay + jitter;
      };
      
      let response;
      while (retryCount <= MAX_RETRIES) {
        response = await fetch(`${apiUrl}/backup-sync/download/${backup.id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          // Handle 429 Too Many Requests with retry logic
          if (response.status === 429 && retryCount < MAX_RETRIES) {
            const retryAfter = response.headers.get('Retry-After') || response.headers.get('RateLimit-Reset');
            const delay = calculateRetryDelay(retryCount, retryAfter);
            
            console.warn(`[Rate Limit] Hit 429 error on download. Retry ${retryCount + 1}/${MAX_RETRIES} after ${Math.round(delay)}ms`);
            
            await sleep(delay);
            retryCount++;
            continue;
          }
          
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Download failed: ${response.statusText}`);
        }
        
        break; // Success, exit the retry loop
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = backup.file_name || `backup_${backup.id}_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setToast({ message: 'تم تنزيل النسخة الاحتياطية بنجاح', type: 'success' });
    } catch (error) {
      console.error('Download error:', error);
      setToast({ message: `فشل التنزيل: ${(error as any).message}`, type: 'error' });
    }
  };

  const handleRestore = async (backup: BackupOperation) => {
    setSelectedBackup(backup);
    setShowRestoreConfirm(true);
  };

  const handleDelete = async (backup: BackupOperation) => {
    setSelectedBackup(backup);
    setShowDeleteConfirm(true);
  };

  const confirmRestore = async () => {
    if (!selectedBackup) return;
    try {
      await makeAuthenticatedRequest('/backup-sync/restore', {
        method: 'POST',
        body: JSON.stringify({
          backupId: selectedBackup.id,
          scope: selectedBackup.scope
        })
      });

      setToast({ message: '✅ بدأت عملية الاستعادة. يرجى الانتظار...', type: 'info' });
      setShowRestoreConfirm(false);
      setSelectedBackup(null);
      setTimeout(() => loadBackups(), 3000);
    } catch (error) {
      console.error('Restore error:', error);
      setToast({ message: `فشل الاستعادة: ${(error as any).message}`, type: 'error' });
    }
  };

  const confirmDelete = async () => {
    if (!selectedBackup) return;
    try {
      await makeAuthenticatedRequest(`/backup-sync/${selectedBackup.id}`, {
        method: 'DELETE'
      });

      setToast({ message: '✅ تم حذف النسخة الاحتياطية بنجاح', type: 'success' });
      setShowDeleteConfirm(false);
      setSelectedBackup(null);
      loadBackups();
    } catch (error) {
      console.error('Delete error:', error);
      setToast({ message: `فشل الحذف: ${(error as any).message}`, type: 'error' });
    }
  };

  const cancelRestore = () => {
    setShowRestoreConfirm(false);
    setSelectedBackup(null);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setSelectedBackup(null);
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null || bytes === 0) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      'مكتمل': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'قيد المعالجة': 'bg-blue-100 text-blue-700 border-blue-200',
      'فشل': 'bg-red-100 text-red-700 border-red-200'
    };
    return badges[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      'مكتمل': 'مكتمل',
      'قيد المعالجة': 'قيد التنفيذ',
      'فشل': 'فشل'
    };
    return texts[status] || status;
  };

  const getOperationIcon = (type: string) => {
    const icons: Record<string, string> = {
      'نسخة احتياطية': '💾',
      'مزامنة': '🔄',
      'استعادة': '↩️'
    };
    return icons[type] || '📄';
  };

  const getScopeBadge = (scope: string) => {
    const badges: Record<string, string> = {
      'كامل': 'bg-purple-100 text-purple-700 border-purple-200',
      'جزئي': 'bg-blue-100 text-blue-700 border-blue-200',
      'خاص بالمخيم': 'bg-amber-100 text-amber-700 border-amber-200'
    };
    return badges[scope] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getScopeText = (scope: string) => {
    const texts: Record<string, string> = {
      'كامل': 'كامل',
      'جزئي': 'جزئي',
      'خاص بالمخيم': 'مخيم محدد'
    };
    return texts[scope] || scope;
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-56 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Backup Stats & Actions Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-[2rem] border shadow-sm p-6">
              <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6"></div>
              <div className="space-y-4">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Backups List Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-48 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                <div className="w-24 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              مركز النسخ الاحتياطي
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">إدارة النسخ الاحتياطية واستعادة البيانات بتشفير AES-256</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
            >
              <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              تحديث
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              نسخة جديدة
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6 pt-6 border-t">
          <div className="bg-indigo-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-indigo-600">{stats.total}</p>
            <p className="text-xs font-bold text-indigo-700 mt-1">إجمالي النسخ</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-600">{stats.completed}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">مكتملة</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-blue-600">{stats.processing}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">قيد التنفيذ</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-red-600">{stats.failed}</p>
            <p className="text-xs font-bold text-red-700 mt-1">فشل</p>
          </div>
          <div className="bg-purple-50 rounded-2xl p-4 text-center">
            <p className="text-2xl font-black text-purple-600">{formatFileSize(stats.totalSize)}</p>
            <p className="text-xs font-bold text-purple-700 mt-1">الحجم الإجمالي</p>
          </div>
        </div>
      </div>

      {/* Backups Table */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">العملية</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">النطاق</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">الملف</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">الحجم</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">بواسطة</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">الوقت</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {backups.length > 0 ? backups.map((backup) => (
                <tr key={backup.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getOperationIcon(backup.operation_type)}</span>
                      <div>
                        {backup.name ? (
                          <>
                            <p className="font-black text-gray-800 text-sm">{backup.name}</p>
                            <p className="text-xs text-gray-400 font-bold">
                              {backup.operation_type === 'backup' ? 'نسخ احتياطي' :
                               backup.operation_type === 'sync' ? 'مزامنة' : 'استعادة'}
                            </p>
                          </>
                        ) : (
                          <span className="font-bold text-gray-700 text-sm">
                            {backup.operation_type === 'backup' ? 'نسخ احتياطي' :
                             backup.operation_type === 'sync' ? 'مزامنة' : 'استعادة'}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs border-2 ${getScopeBadge(backup.scope)}`}>
                      {getScopeText(backup.scope)}
                    </span>
                    {backup.campName && (
                      <p className="text-xs text-gray-500 font-bold mt-1">{backup.campName}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {backup.file_name && backup.file_name !== 'Creating backup...' && backup.file_name !== 'Backup in progress...' ? (
                      <div>
                        <p className="font-bold text-gray-700 text-sm">{backup.file_name}</p>
                        <p className="text-xs text-gray-400 font-mono">{backup.id.slice(0, 8)}...</p>
                      </div>
                    ) : backup.status === 'completed' ? (
                      <div>
                        <p className="font-bold text-gray-700 text-sm">backup_{backup.id.slice(0, 8)}.json</p>
                        <p className="text-xs text-gray-400 font-mono">{backup.id.slice(0, 8)}...</p>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">قيد الإنشاء...</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-black text-gray-600 text-sm">{formatFileSize(backup.size_bytes)}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs border-2 ${getStatusBadge(backup.status)}`}>
                      {getStatusText(backup.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xs">
                        {backup.initiatedByName?.[0] || 'U'}
                      </div>
                      <span className="font-bold text-gray-700 text-sm">{backup.initiatedByName || 'System'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-gray-700">
                        {(() => {
                          try {
                            const date = new Date(backup.startedAt);
                            if (isNaN(date.getTime())) return 'غير متوفر';
                            return date.toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit'
                            });
                          } catch {
                            return 'غير متوفر';
                          }
                        })()}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {(() => {
                          try {
                            const date = new Date(backup.startedAt);
                            if (isNaN(date.getTime())) return '--:--';
                            return date.toLocaleTimeString('ar-EG', {
                              hour: '2-digit',
                              minute: '2-digit'
                            });
                          } catch {
                            return '--:--';
                          }
                        })()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {backup.status === 'مكتمل' && (
                        <>
                          <button
                            onClick={() => handleDownload(backup)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="تحميل"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRestore(backup)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="استعادة"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(backup)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      )}
                      {backup.status === 'قيد المعالجة' && (
                        <span className="text-blue-600 text-xs font-bold animate-pulse">جاري...</span>
                      )}
                      {backup.status === 'فشل' && (
                        <span className="text-red-600 text-xs font-bold">فشل</span>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl text-gray-300">
                      📭
                    </div>
                    <p className="text-gray-400 font-black">لا توجد نسخ احتياطية</p>
                    <p className="text-gray-300 text-sm font-bold mt-1">أنشئ نسخة احتياطية جديدة للبدء</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-indigo-50 border-2 border-indigo-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-indigo-800 mb-2">معلومات هامة</h3>
            <ul className="space-y-1 text-sm text-indigo-700 font-bold">
              <li>• النسخ الاحتياطية مشفرة بتشفير AES-256 للأمان الكامل</li>
              <li>• النسخ الكامل يشمل جميع البيانات والأسر والمخيمات</li>
              <li>• النسخ الجزئي يشمل البيانات المحددة فقط</li>
              <li>• يمكن استعادة النسخة الاحتياطية في أي وقت</li>
              <li>• يتم الاحتفاظ بالنسخ لمدة 90 يوماً حسب سياسة النظام</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white">
              <h2 className="text-xl font-black flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                إنشاء نسخة احتياطية جديدة
              </h2>
              <p className="text-indigo-100 text-sm font-bold mt-1">اختر نوع النسخ الاحتياطي المطلوب</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">اسم النسخة الاحتياطية (اختياري)</label>
                <input
                  type="text"
                  value={backupName}
                  onChange={(e) => setBackupName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-gray-800 text-sm"
                  placeholder="مثال: نسخة يومية، نسخة أسبوعية، إلخ..."
                />
                <p className="text-xs text-gray-400 font-bold mt-1">يمكنك ترك هذا الحقل فارغاً وسيتم استخدام اسم افتراضي</p>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-3">نوع النسخ</label>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    onClick={() => setBackupType('كامل')}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      backupType === 'كامل'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-800">نسخ كامل</p>
                        <p className="text-xs text-gray-500 font-bold mt-1">جميع البيانات والأسر والمخيمات</p>
                      </div>
                      <span className="text-2xl">💾</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setBackupType('جزئي')}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      backupType === 'جزئي'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-800">نسخ جزئي</p>
                        <p className="text-xs text-gray-500 font-bold mt-1">البيانات المحددة فقط</p>
                      </div>
                      <span className="text-2xl">📄</span>
                    </div>
                  </button>

                  <button
                    onClick={() => setBackupType('خاص بالمخيم')}
                    className={`p-4 rounded-xl border-2 text-right transition-all ${
                      backupType === 'خاص بالمخيم'
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-black text-gray-800">مخيم محدد</p>
                        <p className="text-xs text-gray-500 font-bold mt-1">بيانات مخيم معين فقط</p>
                      </div>
                      <span className="text-2xl">🏠</span>
                    </div>
                  </button>
                </div>
              </div>

              {backupType === 'خاص بالمخيم' && (
                <div className="animate-in slide-in-from-top-2 duration-200">
                  <label className="block text-sm font-black text-gray-700 mb-2">اختر المخيم</label>
                  <select
                    value={selectedCampId}
                    onChange={(e) => setSelectedCampId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm bg-white"
                  >
                    <option value="">اختر مخيماً...</option>
                    {camps.map((camp: any) => (
                      <option key={camp.id} value={camp.id}>{camp.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  إلغاء
                </button>
                <button
                  onClick={handleCreateBackup}
                  disabled={creatingBackup || (backupType === 'خاص بالمخيم' && !selectedCampId)}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-black hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creatingBackup ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جاري الإنشاء...
                    </span>
                  ) : (
                    'إنشاء النسخة'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirm Modal */}
      {showRestoreConfirm && selectedBackup && (
        <ConfirmModal
          isOpen={showRestoreConfirm}
          onClose={cancelRestore}
          onConfirm={confirmRestore}
          title="تأكيد استعادة النسخة الاحتياطية"
          message={
            <div className="space-y-3">
              <p className="font-bold text-gray-700">
                هل أنت متأكد من استعادة النسخة الاحتياطية <span className="text-indigo-600">"{selectedBackup.name || `backup_${selectedBackup.id.slice(0, 8)}.json`}"</span>؟
              </p>
              <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
                <p className="font-black text-amber-800 text-sm">⚠️ تحذير: سيتم استبدال البيانات الحالية بالبيانات من النسخة الاحتياطية!</p>
              </div>
            </div>
          }
          confirmText="استعادة"
          cancelText="إلغاء"
          type="warning"
          isLoading={false}
        />
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && selectedBackup && (
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={cancelDelete}
          onConfirm={confirmDelete}
          title="تأكيد حذف النسخة الاحتياطية"
          message={
            <div className="space-y-3">
              <p className="font-bold text-gray-700">
                هل أنت متأكد من حذف النسخة الاحتياطية <span className="text-red-600">"{selectedBackup.name || `backup_${selectedBackup.id.slice(0, 8)}.json`}"</span>؟
              </p>
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <p className="font-black text-red-800 text-sm">⚠️ لا يمكن التراجع عن هذا الإجراء!</p>
              </div>
            </div>
          }
          confirmText="حذف"
          cancelText="إلغاء"
          type="danger"
          isLoading={false}
        />
      )}
    </div>
  );
};

export default GlobalBackupCenter;
