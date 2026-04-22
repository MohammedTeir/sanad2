import React, { useState, useEffect } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { Camp } from '../../types';
import { GAZA_LOCATIONS } from '../../constants/gazaLocations';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';

const OnboardingManagement = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Action states
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

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

  const loadData = async () => {
    setRefreshing(true);
    try {
      const loadedCamps = await realDataService.getCamps();
      setCamps(Array.isArray(loadedCamps) ? loadedCamps : []);
    } catch (err) {
      console.error("Error loading camps:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  const handleApproveCamp = async () => {
    if (!selectedCamp) return;
    
    setIsApproving(true);
    try {
      await makeAuthenticatedRequest(`/camps/${selectedCamp.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: 'نشط',
          updated_at: new Date().toISOString()
        })
      });

      setShowApproveModal(false);
      setSelectedCamp(null);
      setSuccessMessage("تم قبول المخيم بنجاح! أصبح المخيم الآن نشطاً ويمكن للمدير الدخول");
      loadData();
    } catch (err) {
      console.error('Camp approval error:', err);
      setErrorMessage("خطأ في قبول المخيم: " + (err as Error).message);
    } finally {
      setIsApproving(false);
    }
  };

  const handleRejectCamp = async () => {
    if (!selectedCamp) return;

    if (!rejectionReason.trim()) {
      setErrorMessage("يرجى إدخال سبب الرفض");
      return;
    }
    
    setIsRejecting(true);
    try {
      // For rejection, we can either delete the camp or keep it as rejected
      // Here we'll delete it, but you could also add a 'rejected' status
      await makeAuthenticatedRequest(`/camps/${selectedCamp.id}`, {
        method: 'DELETE',
      });

      setShowRejectModal(false);
      setSelectedCamp(null);
      setRejectionReason('');
      setSuccessMessage("تم رفض المخيم بنجاح");
      loadData();
    } catch (err) {
      console.error('Camp rejection error:', err);
      setErrorMessage("خطأ في رفض المخيم: " + (err as Error).message);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleViewCamp = (camp: Camp) => {
    setSelectedCamp(camp);
    setShowViewModal(true);
  };

  const handleApproveClick = (camp: Camp) => {
    setSelectedCamp(camp);
    setShowApproveModal(true);
  };

  const handleRejectClick = (camp: Camp) => {
    setSelectedCamp(camp);
    setShowRejectModal(true);
  };

  // Filter camps - show only pending by default
  const filteredCamps = camps.filter(camp => {
    const matchesSearch = camp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         camp.managerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || camp.status === statusFilter;
    const matchesGovernorate = governorateFilter === 'all' || 
                               ((camp.location as any)?.governorate === governorateFilter);
    
    return matchesSearch && matchesStatus && matchesGovernorate;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'قيد الانتظار': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'نشط': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'مرفوض': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'قيد الانتظار': return 'معلق';
      case 'نشط': return 'نشط';
      case 'مرفوض': return 'مرفوض';
      default: return status;
    }
  };

  const getGovernorateName = (camp: Camp) => {
    return (camp.location as any)?.governorate || 'غير محدد';
  };

  if (loading) return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Requests Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-2">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="w-20 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            <div className="space-y-3 mb-4">
              <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex gap-2 mt-4">
              <div className="flex-1 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="flex-1 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

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
              <div className="w-10 h-10 bg-amber-600 text-white rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              طلبات انضمام المخيمات
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">مراجعة والموافقة على طلبات الانضمام الجديدة</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="md:col-span-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث باسم المخيم أو المدير..."
                className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-sm"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-sm bg-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="قيد الانتظار">معلق</option>
              <option value="نشط">نشط</option>
              <option value="مرفوض">مرفوض</option>
            </select>
          </div>
          
          <div>
            <select
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-sm bg-white"
            >
              <option value="all">جميع المحافظات</option>
              {GAZA_LOCATIONS.map((gov) => (
                <option key={gov.name} value={gov.name}>{gov.arabic_name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{camps.filter(c => c.status === 'قيد الانتظار').length}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">معلق</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-600">{camps.filter(c => c.status === 'نشط').length}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">مقبول</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-red-600">{camps.filter(c => c.status === 'مرفوض').length}</p>
            <p className="text-xs font-bold text-red-700 mt-1">مرفوض</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-blue-600">{camps.length}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">الإجمالي</p>
          </div>
        </div>
      </div>

      {/* Camps List */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">المخيم</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">المدير</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">الموقع</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCamps.length > 0 ? filteredCamps.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center font-black text-lg">
                        {camp.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-gray-800">{camp.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-700">{camp.managerName}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-bold text-gray-700 text-sm">{camp.location?.address}</p>
                      <p className="text-xs text-gray-400 font-bold">
                        {getGovernorateName(camp)}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs border-2 ${getStatusColor(camp.status)}`}>
                      {getStatusLabel(camp.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewCamp(camp)}
                        className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors"
                        title="عرض"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      {camp.status === 'قيد الانتظار' && (
                        <>
                          <button
                            onClick={() => handleApproveClick(camp)}
                            className="w-9 h-9 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-colors"
                            title="موافقة"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRejectClick(camp)}
                            className="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                            title="رفض"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl text-gray-300">
                      📭
                    </div>
                    <p className="text-gray-400 font-black">لا توجد طلبات مطابقة</p>
                    <p className="text-gray-300 text-sm font-bold mt-1">حاول تغيير معايير البحث أو الفلترة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Camp Modal */}
      {showViewModal && selectedCamp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-blue-600 text-white p-6 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-black">تفاصيل المخيم</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center font-black text-2xl">
                  {selectedCamp.name[0]}
                </div>
                <div>
                  <p className="font-black text-gray-800 text-lg">{selectedCamp.name}</p>
                  <p className="text-sm text-gray-500 font-bold">مدير المخيم: {selectedCamp.managerName}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold mb-1">الحالة</p>
                  <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs ${getStatusColor(selectedCamp.status)}`}>
                    {getStatusLabel(selectedCamp.status)}
                  </span>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold mb-1">الموقع</p>
                  <p className="font-black text-gray-800">{selectedCamp.location?.address || 'غير محدد'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold mb-1">المحافظة</p>
                  <p className="font-black text-gray-800">{getGovernorateName(selectedCamp)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold mb-1">المنطقة</p>
                  <p className="font-black text-gray-800">{(selectedCamp.location as any)?.area || 'غير محدد'}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-bold mb-1">تاريخ التقديم</p>
                <p className="font-black text-gray-800">{new Date(selectedCamp.createdAt || Date.now()).toLocaleDateString('ar-EG')}</p>
              </div>
            </div>

            <div className="bg-gray-50 p-6 flex justify-end gap-3">
              <button onClick={() => setShowViewModal(false)} className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-black hover:bg-gray-300 transition-all">إغلاق</button>
              {selectedCamp.status === 'قيد الانتظار' && (
                <>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleApproveClick(selectedCamp);
                    }}
                    className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg hover:bg-emerald-700 transition-all"
                  >
                    موافقة
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false);
                      handleRejectClick(selectedCamp);
                    }}
                    className="px-6 py-3 bg-red-600 text-white rounded-xl font-black shadow-lg hover:bg-red-700 transition-all"
                  >
                    رفض
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && selectedCamp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black">تأكيد الموافقة</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-lg font-black text-gray-800 mb-2">المخيم جاهز للتفعيل!</p>
                <p className="text-emerald-600 font-black text-lg">"{selectedCamp.name}"</p>
              </div>

              <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-black text-emerald-800">بعد الموافقة:</p>
                    <ul className="text-xs text-emerald-700 font-bold mt-1 space-y-1">
                      <li>• سيتم تفعيل حساب المخيم فوراً</li>
                      <li>• سيتمكن مدير المخيم من الدخول للنظام</li>
                      <li>• يمكن البدء بتسجيل العائلات والنازحين</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-3">معلومات المخيم</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">المدير</p>
                    <p className="font-bold text-gray-700 text-sm">{selectedCamp.managerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">المحافظة</p>
                    <p className="font-bold text-gray-700 text-sm">{(selectedCamp.location as any)?.governorate || 'غير محدد'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">المنطقة</p>
                    <p className="font-bold text-gray-700 text-sm">{(selectedCamp.location as any)?.area || 'غير محدد'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowApproveModal(false)}
                disabled={isApproving}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleApproveCamp}
                disabled={isApproving}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-black hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isApproving ? (
                  <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>جاري...</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>تأكيد الموافقة</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirmation Modal */}
      {showRejectModal && selectedCamp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black">تأكيد الرفض</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <p className="text-lg font-black text-gray-800 mb-2">رفض طلب الانضمام</p>
                <p className="text-red-600 font-black text-lg">"{selectedCamp.name}"</p>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-black text-red-800">تحذير!</p>
                    <p className="text-xs text-red-700 font-bold mt-1">
                      رفض الطلب سيؤدي إلى حذف المخيم نهائياً ولن يتمكن المدير من الدخول.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">سبب الرفض *</label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all font-bold text-sm resize-none"
                  rows={4}
                  placeholder="اكتب سبب رفض الطلب بالتفصيل..."
                  disabled={isRejecting}
                />
                {!rejectionReason.trim() && (
                  <p className="text-xs text-red-600 font-bold mt-1">يرجى إدخال سبب الرفض</p>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-3">معلومات المخيم</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">المدير</p>
                    <p className="font-bold text-gray-700 text-sm">{selectedCamp.managerName}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
                disabled={isRejecting}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={handleRejectCamp}
                disabled={isRejecting || !rejectionReason.trim()}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRejecting ? (
                  <><svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>جاري...</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>تأكيد الرفض</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingManagement;
