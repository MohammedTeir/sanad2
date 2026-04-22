import React, { useState, useEffect } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';

interface AuditLog {
  id: string;
  userId: string;
  userName?: string;
  userRole?: string;
  operationType: string;
  resourceType: string;
  resourceId?: string;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [operationTypeFilter, setOperationTypeFilter] = useState<string>('all');
  const [resourceTypeFilter, setResourceTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    if (successMessage || errorMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage, errorMessage]);

  const loadLogs = async (page: number = 1) => {
    setLoading(true);
    setRefreshing(true);
    try {
      const params: any = {
        page,
        limit: pageSize,
        searchQuery: searchQuery || '',
      };

      if (operationTypeFilter !== 'all') {
        params.operationType = operationTypeFilter;
      }

      if (resourceTypeFilter !== 'all') {
        params.resourceType = resourceTypeFilter;
      }

      if (dateFrom) {
        params.dateFrom = new Date(dateFrom).toISOString();
      }

      if (dateTo) {
        params.dateTo = new Date(dateTo).toISOString();
      }

      const response = await realDataService.getAuditLogs(params);

      // Ensure we have proper data structure
      const logsData = response.data || [];
      const totalCount = response.totalCount || logsData.length || 0;

      setLogs(logsData);
      setTotalCount(totalCount);
      setCurrentPage(page);

      // Only show success message if explicitly refreshing, not on initial load
      if (!isInitialLoad && logsData.length > 0) {
        setSuccessMessage(`تم تحميل ${logsData.length} سجل تدقيق`);
      }
    } catch (err) {
      console.error('Error loading audit logs:', err);
      setErrorMessage('فشل تحميل سجلات التدقيق');
      setLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs(1).then(() => {
      setIsInitialLoad(false);
    });
  }, []);

  const handleRefresh = () => {
    loadLogs(currentPage);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setOperationTypeFilter('all');
    setResourceTypeFilter('all');
    setSeverityFilter('all');
    setDateFrom('');
    setDateTo('');
    loadLogs(1);
  };

  const getOperationColor = (type: string) => {
    const op = type?.toUpperCase();
    if (op?.includes('DELETE')) return 'bg-red-100 text-red-700 border-red-200';
    if (op?.includes('CREATE') || op?.includes('INSERT')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (op?.includes('UPDATE') || op?.includes('PUT')) return 'bg-blue-100 text-blue-700 border-blue-200';
    if (op?.includes('LOGIN')) return 'bg-purple-100 text-purple-700 border-purple-200';
    if (op?.includes('LOGOUT')) return 'bg-gray-100 text-gray-600 border-gray-200';
    return 'bg-amber-100 text-amber-700 border-amber-200';
  };

  const getOperationLabel = (type: string) => {
    const op = type?.toUpperCase();
    if (op?.includes('DELETE')) return 'حذف';
    if (op?.includes('CREATE') || op?.includes('INSERT')) return 'إنشاء';
    if (op?.includes('UPDATE') || op?.includes('PUT')) return 'تعديل';
    if (op?.includes('LOGIN')) return 'تسجيل دخول';
    if (op?.includes('LOGOUT')) return 'تسجيل خروج';
    if (op?.includes('APPROVE')) return 'موافقة';
    if (op?.includes('REJECT')) return 'رفض';
    return type || 'عملية';
  };

  const getResourceLabel = (type: string) => {
    const resource = type?.toLowerCase();
    if (resource?.includes('camp')) return 'المخيمات';
    if (resource?.includes('user')) return 'المستخدمين';
    if (resource?.includes('family')) return 'الأسر';
    if (resource?.includes('dp')) return 'النازحين';
    if (resource?.includes('inventory') || resource?.includes('aid')) return 'المخزون';
    if (resource?.includes('transfer')) return 'الانتقالات';
    if (resource?.includes('config') || resource?.includes('setting')) return 'الإعدادات';
    if (resource?.includes('security') || resource?.includes('auth')) return 'الأمان';
    return type || 'مورد';
  };

  const getRoleLabel = (role: string) => {
    const r = role?.toUpperCase();
    if (r === 'SYSTEM_ADMIN') return 'مدير النظام';
    if (r === 'CAMP_MANAGER') return 'مدير المخيم';
    if (r === 'FIELD_OFFICER') return 'موظف ميداني';
    if (r === 'BENEFICIARY') return 'مستفيد';
    if (r === 'DONOR_OBSERVER') return 'مراقب مانح';
    return role || 'دور';
  };

  const getOperationIcon = (type: string) => {
    const op = type?.toUpperCase();
    if (op?.includes('DELETE')) return '🗑️';
    if (op?.includes('CREATE') || op?.includes('INSERT')) return '➕';
    if (op?.includes('UPDATE') || op?.includes('PUT')) return '✏️';
    if (op?.includes('LOGIN')) return '🔐';
    if (op?.includes('LOGOUT')) return '🔓';
    if (op?.includes('APPROVE')) return '✅';
    if (op?.includes('REJECT')) return '❌';
    return '📝';
  };

  const getResourceIcon = (type: string) => {
    const resource = type?.toLowerCase();
    if (resource?.includes('camp')) return '🏠';
    if (resource?.includes('user')) return '👤';
    if (resource?.includes('family') || resource?.includes('dp')) return '👨‍👩‍👧‍👦';
    if (resource?.includes('inventory') || resource?.includes('aid')) return '📦';
    if (resource?.includes('transfer')) return '🔄';
    if (resource?.includes('config') || resource?.includes('setting')) return '⚙️';
    if (resource?.includes('security') || resource?.includes('auth')) return '🔒';
    return '📄';
  };

  const formatJsonDiff = (oldVal: any, newVal: any) => {
    if (!oldVal && !newVal) return null;
    
    const changes: string[] = [];
    const oldObj = typeof oldVal === 'string' ? JSON.parse(oldVal) : oldVal;
    const newObj = typeof newVal === 'string' ? JSON.parse(newVal) : newVal;

    if (oldObj && newObj) {
      const allKeys = new Set([...Object.keys(oldObj || {}), ...Object.keys(newObj || {})]);
      allKeys.forEach(key => {
        if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
          changes.push(`${key}: ${oldObj[key]} → ${newObj[key]}`);
        }
      });
    }

    return changes.length > 0 ? changes.join(', ') : 'No changes';
  };

  const filteredLogs = logs;

  const totalPages = Math.ceil(totalCount / pageSize);

  // Statistics
  const stats = {
    total: totalCount,
    creates: logs.filter(l => l.operationType?.toUpperCase().includes('CREATE')).length,
    updates: logs.filter(l => l.operationType?.toUpperCase().includes('UPDATE')).length,
    deletes: logs.filter(l => l.operationType?.toUpperCase().includes('DELETE')).length
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Header Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-60 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
            ))}
          </div>
        </div>

        {/* Audit Log Table Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  {['التوقيت', 'المستخدم', 'الدور', 'النوع', 'المورد', 'السجل', 'IP'].map((header, i) => (
                    <th key={i} className="px-6 py-4">
                      <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(8)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {[...Array(7)].map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse mx-auto"></div>
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
      {/* Toast Notifications */}
      {successMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 shadow-lg flex items-start gap-3">
            <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-black text-emerald-800 text-sm">{successMessage}</p>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 shadow-lg flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 text-red-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="font-black text-red-800 text-sm">{errorMessage}</p>
            </div>
            <button onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              سجل تدقيق العمليات
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">مراقبة شاملة لجميع العمليات والتغييرات في النظام</p>
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
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-blue-600">{stats.total}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">إجمالي العمليات</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-600">{stats.creates}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">إنشاء</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{stats.updates}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">تعديل</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-red-600">{stats.deletes}</p>
            <p className="text-xs font-bold text-red-700 mt-1">حذف</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          <div className="lg:col-span-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && loadLogs(1)}
                placeholder="بحث بالمستخدم أو المورد..."
                className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div>
            <select
              value={operationTypeFilter}
              onChange={(e) => setOperationTypeFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm bg-white"
            >
              <option value="all">جميع العمليات</option>
              <option value="CREATE">إنشاء</option>
              <option value="UPDATE">تعديل</option>
              <option value="DELETE">حذف</option>
              <option value="LOGIN">تسجيل دخول</option>
              <option value="LOGOUT">تسجيل خروج</option>
            </select>
          </div>

          <div>
            <select
              value={resourceTypeFilter}
              onChange={(e) => setResourceTypeFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm bg-white"
            >
              <option value="all">جميع الموارد</option>
              <option value="camps">المخيمات</option>
              <option value="users">المستخدمين</option>
              <option value="families">الأسر</option>
              <option value="inventory">المستودع</option>
              <option value="transfers">الانتقالات</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="w-full px-4 py-3 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors"
            >
              إعادة تعيين
            </button>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">من تاريخ</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">إلى تاريخ</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border-2 border-gray-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all font-bold text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => loadLogs(1)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all"
            >
              تطبيق الفلتر
            </button>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">العملية</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">المورد</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">التفاصيل</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">IP</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLogs.length > 0 ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{getOperationIcon(log.operationType)}</span>
                      <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs border-2 ${getOperationColor(log.operationType)}`}>
                        {getOperationLabel(log.operationType)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getResourceIcon(log.resourceType)}</span>
                      <div>
                        <p className="font-black text-gray-800 text-sm">{getResourceLabel(log.resourceType)}</p>
                        {log.resourceId && (
                          <p className="text-xs text-gray-400 font-bold font-mono">{log.resourceId.slice(0, 8)}...</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-black text-xs">
                        {((log.userName || log.userEmail || log.newValues?.email || log.newValues?.first_name || 'S')[0] || 'S').toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-700 text-sm">
                          {log.userName || 
                           log.userEmail || 
                           (log.newValues?.email ? log.newValues.email : 
                           log.newValues?.first_name ? `${log.newValues.first_name} ${log.newValues.last_name || ''}`.trim() : 
                           'System')}
                        </p>
                        {log.userRole && (
                          <p className="text-xs text-gray-400 font-bold">{getRoleLabel(log.userRole)}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="max-w-xs">
                      {log.oldValues || log.newValues ? (
                        <details className="group">
                          <summary className="cursor-pointer text-xs text-indigo-600 font-bold hover:text-indigo-800">
                            عرض التغييرات
                          </summary>
                          <div className="mt-2 p-2 bg-gray-50 rounded-lg text-xs font-mono text-gray-600 max-h-32 overflow-y-auto">
                            {formatJsonDiff(log.oldValues, log.newValues)}
                          </div>
                        </details>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      <span className="text-xs font-mono text-gray-600 font-bold">
                        {log.ipAddress && log.ipAddress !== 'N/A' && log.ipAddress !== 'unknown' ? log.ipAddress : 'غير متوفر'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-xs font-bold text-gray-700">
                        {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit'
                        })}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {new Date(log.createdAt || log.timestamp || Date.now()).toLocaleTimeString('ar-EG', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl text-gray-300">
                      📭
                    </div>
                    <p className="text-gray-400 font-black">لا توجد عمليات مطابقة</p>
                    <p className="text-gray-300 text-sm font-bold mt-1">حاول تغيير معايير البحث أو الفلترة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t flex justify-between items-center">
            <p className="text-sm font-bold text-gray-600">
              عرض {((currentPage - 1) * pageSize) + 1} إلى {Math.min(currentPage * pageSize, totalCount)} من {totalCount} عملية
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => loadLogs(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                السابق
              </button>
              <button
                onClick={() => loadLogs(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="font-black text-blue-800 mb-2">معلومات هامة</h3>
            <ul className="space-y-1 text-sm text-blue-700 font-bold">
              <li>• يتم تسجيل جميع العمليات تلقائياً لضمان الشفافية الكاملة</li>
              <li>• لا يمكن حذف أو تعديل سجلات التدقيق - للقراءة فقط</li>
              <li>• يتم التقاط عنوان IP الحقيقي من الطلب بشكل تلقائي</li>
              <li>• يتم تسجيل معلومات المتصفح (User Agent) للأمان</li>
              <li>• يتم الاحتفاظ بالسجلات لمدة 90 يوماً حسب سياسة النظام</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogViewer;
