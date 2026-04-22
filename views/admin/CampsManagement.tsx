import React, { useState, useEffect } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { Camp } from '../../types';
import { ICONS } from '../../constants';
import { GAZA_LOCATIONS } from '../../constants/gazaLocations';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import { formatFullCoordinateString } from '../../utils/geoUtils';

const CampsManagement = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [familyCounts, setFamilyCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddCamp, setShowAddCamp] = useState(false);
  const [showEditCamp, setShowEditCamp] = useState(false);
  const [showViewCamp, setShowViewCamp] = useState(false);
  const [selectedCamp, setSelectedCamp] = useState<Camp | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [governorateFilter, setGovernorateFilter] = useState<string>('all');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [newCamp, setNewCamp] = useState({
    name: '',
    managerName: '',
    address: '',
    governorate: '',
    area: '',
    email: '',
    password: '',
    confirmPassword: '',
    location_lat: 31.5,
    location_lng: 34.4
  });

  const [isLocationCaptured, setIsLocationCaptured] = useState(false);
  const [capturingLocation, setCapturingLocation] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }

    setCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setNewCamp(prev => ({
          ...prev,
          location_lat: latitude,
          location_lng: longitude
        }));
        setIsLocationCaptured(true);
        setCapturingLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMsg = 'تعذر تحديد الموقع. يرجى تفعيل الـ GPS.';
        if (err.code === 1) errorMsg = 'يرجى منح صلاحية الوصول للموقع الجغرافي.';
        setErrorMessage(errorMsg);
        setCapturingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const [editCamp, setEditCamp] = useState({
    name: '',
    managerName: '',
    address: '',
    governorate: '',
    area: '',
    status: 'نشط' as 'نشط' | 'قيد الانتظار' | 'ممتلئ',
    location_lat: 31.5,
    location_lng: 34.4
  });

  const [isEditLocationCaptured, setIsEditLocationCaptured] = useState(false);
  const [capturingEditLocation, setCapturingEditLocation] = useState(false);

  const handleGetEditLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }

    setCapturingEditLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        setEditCamp(prev => ({
          ...prev,
          location_lat: latitude,
          location_lng: longitude
        }));
        setIsEditLocationCaptured(true);
        setCapturingEditLocation(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMsg = 'تعذر تحديد الموقع. يرجى تفعيل الـ GPS.';
        if (err.code === 1) errorMsg = 'يرجى منح صلاحية الوصول للموقع الجغرافي.';
        setErrorMessage(errorMsg);
        setCapturingEditLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [campToDelete, setCampToDelete] = useState<Camp | null>(null);
  const [availableAreas, setAvailableAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);
  const [editAvailableAreas, setEditAvailableAreas] = useState<{name: string, arabic_name: string, type: string}[]>([]);

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
      // Fetch camps and family stats in parallel
      const [loadedCamps, stats] = await Promise.all([
        realDataService.getCamps(),
        realDataService.getGlobalFamilyStats().catch(err => {
          console.error("خطأ في جلب إحصائيات العائلات:", err);
          return null;
        })
      ]);

      setCamps(loadedCamps);

      if (stats && stats.byCamp) {
        const counts: Record<string, number> = {};
        stats.byCamp.forEach(item => {
          counts[item.campId] = item.familyCount;
        });
        setFamilyCounts(counts);
      }
    } catch (err) {
      console.error("خطأ في جلب البيانات:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  const handleGovernorateChange = (governorate: string, isNew: boolean = true) => {
    // Find governorate by either English name or Arabic name
    const govData = GAZA_LOCATIONS.find(g => g.name === governorate || g.arabic_name === governorate);
    const areas = govData?.areas || [];
    if (isNew) {
      setNewCamp({...newCamp, governorate, area: ''});
      setAvailableAreas(areas);
    } else {
      setEditCamp({...editCamp, governorate, area: ''});
      setEditAvailableAreas(areas);
    }
  };

  const handleCreateCamp = async () => {
    if (!newCamp.name || !newCamp.managerName || !newCamp.address || !newCamp.email || !newCamp.password || !newCamp.governorate || !newCamp.area) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newCamp.email)) {
      setErrorMessage("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    if (newCamp.password !== newCamp.confirmPassword) {
      setErrorMessage("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
      return;
    }

    if (newCamp.password.length < 6) {
      setErrorMessage("يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل");
      return;
    }
    
    setIsCreating(true);
    try {
      const nameParts = newCamp.managerName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || '';

      const campData = await makeAuthenticatedRequest('/camps', {
        method: 'POST',
        body: JSON.stringify({
          name: newCamp.name,
          manager_name: newCamp.managerName,
          status: 'نشط', // Use Arabic status value
          location_lat: newCamp.location_lat,
          location_lng: newCamp.location_lng,
          location_address: newCamp.address,
          location_governorate: newCamp.governorate,
          location_area: newCamp.area
        })
      });
      const campId = campData.id;

      await makeAuthenticatedRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({
          email: newCamp.email,
          password: newCamp.password,
          role: 'CAMP_MANAGER',
          firstName: firstName,
          lastName: lastName,
          campId: campId
        })
      });

      setShowAddCamp(false);
      setNewCamp({
        name: '', managerName: '', address: '',
        governorate: '', area: '', email: '', password: '', confirmPassword: '',
        location_lat: 31.5, location_lng: 34.4
      });
      setIsLocationCaptured(false);
      setAvailableAreas([]);
      setSuccessMessage("تم إنشاء المخيم بنجاح!");
      loadData();
    } catch (err) {
      console.error('Camp creation error:', err);
      setErrorMessage("خطأ في إنشاء المخيم: " + (err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditCamp = (camp: Camp) => {
    setSelectedCamp(camp);

    // Map status to Arabic
    let statusValue: 'نشط' | 'قيد الانتظار' | 'ممتلئ' = 'نشط';
    const campStatus = camp.status;

    if ((campStatus as any) === 'نشط') {
      statusValue = 'نشط';
    } else if ((campStatus as any) === 'قيد الانتظار') {
      statusValue = 'قيد الانتظار';
    } else if ((campStatus as any) === 'ممتلئ') {
      statusValue = 'ممتلئ';
    }
    
    // Determine initial coordinates with high precision check
    const initialLat = camp.location_lat !== undefined && camp.location_lat !== null ? camp.location_lat : (camp.location?.lat || 31.5);
    const initialLng = camp.location_lng !== undefined && camp.location_lng !== null ? camp.location_lng : (camp.location?.lng || 34.4);

    setEditCamp({
      name: camp.name,
      managerName: camp.managerName || camp.manager_name || '',
      address: camp.location?.address || camp.location_address || '',
      governorate: (camp.location as any)?.governorate || camp.location_governorate || '',
      area: (camp.location as any)?.area || camp.location_area || '',
      status: statusValue,
      location_lat: initialLat,
      location_lng: initialLng
    });

    setIsEditLocationCaptured(false);

    const governorate = (camp.location as any)?.governorate || camp.location_governorate || '';
    if (governorate) {
      const areas = GAZA_LOCATIONS.find(g => g.name === governorate || g.arabic_name === governorate)?.areas || [];
      setEditAvailableAreas(areas);
    }

    setShowEditCamp(true);
  };

  const handleUpdateCamp = async () => {
    if (!editCamp.name || !editCamp.managerName || !editCamp.address || !editCamp.governorate || !editCamp.area) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    if (!selectedCamp) return;
    
    setIsUpdating(true);
    try {
      await makeAuthenticatedRequest(`/camps/${selectedCamp.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: editCamp.name,
          manager_name: editCamp.managerName,
          status: editCamp.status,
          location_address: editCamp.address,
          location_governorate: editCamp.governorate,
          location_area: editCamp.area,
          location_lat: editCamp.location_lat,
          location_lng: editCamp.location_lng,
          updated_at: new Date().toISOString()
        })
      });

      setShowEditCamp(false);
      setSelectedCamp(null);
      setSuccessMessage("تم تحديث المخيم بنجاح!");
      loadData();
    } catch (err) {
      console.error('Camp update error:', err);
      setErrorMessage("خطأ في تحديث المخيم");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCamp = async (camp: Camp) => {
    setCampToDelete(camp);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteCamp = async () => {
    if (!campToDelete) return;
    
    setIsDeleting(true);
    try {
      await makeAuthenticatedRequest(`/camps/${campToDelete.id}`, {
        method: 'DELETE',
      });

      setSuccessMessage("تم حذف المخيم بنجاح!");
      setShowDeleteConfirm(false);
      setCampToDelete(null);
      loadData();
    } catch (err) {
      console.error('Camp delete error:', err);
      setErrorMessage("خطأ في حذف المخيم");
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteCamp = () => {
    setShowDeleteConfirm(false);
    setCampToDelete(null);
  };

  const handleViewCamp = (camp: Camp) => {
    setSelectedCamp(camp);
    setShowViewCamp(true);
  };

  // Filter camps
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
      case 'نشط': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'قيد الانتظار': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ممتلئ': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'نشط': return 'نشط';
      case 'قيد الانتظار': return 'معلق';
      case 'ممتلئ': return 'ممتلئ';
      default: return status;
    }
  };

  if (loading) return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-40 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-60 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="w-40 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
        </div>

        {/* Filters Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
          ))}
        </div>

        {/* Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 rounded-2xl p-4 text-center">
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto"></div>
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse mx-auto mt-2"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Camps Grid Skeleton */}
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
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-28 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
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
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center">
                <ICONS.Home className="w-6 h-6" />
              </div>
              إدارة المخيمات
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">إدارة شاملة لجميع المخيمات في النظام</p>
          </div>
          <button 
            onClick={() => setShowAddCamp(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة مخيم
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="md:col-span-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو المدير..."
                className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm"
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
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm bg-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="قيد الانتظار">معلق</option>
              <option value="ممتلئ">ممتلئ</option>
            </select>
          </div>
          
          <div>
            <select
              value={governorateFilter}
              onChange={(e) => setGovernorateFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm bg-white"
            >
              <option value="all">جميع المحافظات</option>
              {GAZA_LOCATIONS.map((gov) => (
                <option key={gov.name} value={gov.name}>{gov.arabic_name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setGovernorateFilter('all');
              }}
              className="px-4 py-3 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors"
            >
              إعادة تعيين
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-600">{camps.filter(c => c.status === 'نشط').length}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">نشط</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{camps.filter(c => c.status === 'قيد الانتظار').length}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">معلق</p>
          </div>
          <div className="bg-red-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-red-600">{camps.filter(c => c.status === 'ممتلئ').length}</p>
            <p className="text-xs font-bold text-red-700 mt-1">ممتلئ</p>
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
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">العائلات</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCamps.length > 0 ? filteredCamps.map((camp) => (
                <tr key={camp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black text-lg">
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
                        {(camp.location as any)?.governorate} - {(camp.location as any)?.area}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="font-black text-gray-800 text-lg">{familyCounts[camp.id] || 0}</span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">عائلة</span>
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
                      <button
                        onClick={() => handleEditCamp(camp)}
                        className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center hover:bg-amber-100 transition-colors"
                        title="تعديل"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteCamp(camp)}
                        disabled={isDeleting}
                        className="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                        title="حذف"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl text-gray-300">
                      📭
                    </div>
                    <p className="text-gray-400 font-black">لا توجد مخيمات مطابقة</p>
                    <p className="text-gray-300 text-sm font-bold mt-1">حاول تغيير معايير البحث أو الفلترة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && campToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <h3 className="text-xl font-black">تأكيد الحذف</h3>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <p className="text-lg font-black text-gray-800 mb-2">هل أنت متأكد من الحذف؟</p>
                <p className="text-sm text-gray-600 font-bold">
                  مخيم "<span className="font-black text-gray-800">{campToDelete.name}</span>"
                </p>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-black text-red-800">تحذير!</p>
                    <p className="text-xs text-red-700 font-bold mt-1">
                      هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المخيم وجميع البيانات المرتبطة به نهائياً.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-2">تفاصيل المخيم</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-400">المدير</p>
                    <p className="font-bold text-gray-700 text-sm">{campToDelete.managerName}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={cancelDeleteCamp}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteCamp}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري الحذف...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف المخيم
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Camp Modal */}
      {showViewCamp && selectedCamp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-xl font-black">تفاصيل المخيم</h3>
              </div>
              <button onClick={() => setShowViewCamp(false)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-xl flex items-center justify-center transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
              {/* Basic Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                <h4 className="text-lg font-black text-gray-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  المعلومات الأساسية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">اسم المخيم</p>
                    <p className="font-black text-gray-800">{selectedCamp.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">عدد العائلات</p>
                    <p className="font-black text-emerald-600 text-lg">{familyCounts[selectedCamp.id] || 0} أسرة</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-500 mb-1">حالة المخيم</p>
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs border-2 ${
                      selectedCamp.status === 'نشط' ? 'bg-emerald-100 text-emerald-700' :
                      selectedCamp.status === 'قيد الانتظار' ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedCamp.status === 'نشط' ? 'نشط' :
                       selectedCamp.status === 'قيد الانتظار' ? 'معلق' : 'ممتلئ'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Manager Info */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                <h4 className="text-lg font-black text-blue-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  معلومات المدير
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-bold text-blue-600 mb-1">اسم المدير</p>
                    <p className="font-black text-blue-900">{selectedCamp.managerName}</p>
                  </div>
                </div>
              </div>

              {/* Location Info */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6">
                <h4 className="text-lg font-black text-emerald-800 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  الموقع
                </h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-bold text-emerald-600 mb-1">العنوان</p>
                    <p className="font-black text-emerald-900">{selectedCamp.location?.address || 'غير محدد'}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-1">المحافظة</p>
                      <p className="font-bold text-emerald-900">{(selectedCamp.location as any)?.governorate || 'غير محدد'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-600 mb-1">المنطقة</p>
                      <p className="font-bold text-emerald-900">{(selectedCamp.location as any)?.area || 'غير محدد'}</p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-emerald-100 mt-3">
                    <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
                      <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        الإحداثيات الفنية (DMS)
                      </p>
                      <pre className="font-mono text-[11px] font-bold text-emerald-800 leading-relaxed whitespace-pre-wrap">
                        {formatFullCoordinateString(
                          selectedCamp.location_lat || selectedCamp.location?.lat || 31.5,
                          selectedCamp.location_lng || selectedCamp.location?.lng || 34.4
                        )}
                      </pre>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${selectedCamp.location_lat || selectedCamp.location?.lat || 31.5},${selectedCamp.location_lng || selectedCamp.location?.lng || 34.4}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 hover:text-emerald-700 bg-white px-3 py-1.5 rounded-lg border-2 border-emerald-100 transition-all shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        عرض الموقع على خرائط جوجل
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowViewCamp(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  setShowViewCamp(false);
                  handleEditCamp(selectedCamp);
                }}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg"
              >
                تعديل المخيم
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Camp Modal */}
      {showAddCamp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-emerald-600 text-white p-4 md:p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-black">إضافة مخيم جديد</h3>
              </div>
              <button onClick={() => setShowAddCamp(false)} className="w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-lg md:rounded-xl flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">اسم المخيم <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newCamp.name}
                    onChange={(e) => setNewCamp({ ...newCamp, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                    placeholder="مثال: مخيم الامل"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">اسم المدير <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newCamp.managerName}
                    onChange={(e) => setNewCamp({ ...newCamp, managerName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                    placeholder="مثال: أحمد محمد"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    value={newCamp.email}
                    onChange={(e) => setNewCamp({ ...newCamp, email: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                    placeholder="manager@camp.com"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">المحافظة <span className="text-red-500">*</span></label>
                  <select
                    value={newCamp.governorate}
                    onChange={(e) => handleGovernorateChange(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm bg-white"
                    disabled={isCreating}
                  >
                    <option value="">اختر المحافظة</option>
                    {GAZA_LOCATIONS.map((gov) => (
                      <option key={gov.name} value={gov.arabic_name}>{gov.arabic_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">المنطقة <span className="text-red-500">*</span></label>
                  <select
                    value={newCamp.area}
                    onChange={(e) => setNewCamp({ ...newCamp, area: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm bg-white disabled:bg-gray-100"
                    disabled={isCreating || !newCamp.governorate}
                  >
                    <option value="">اختر المنطقة</option>
                    {availableAreas.map((area) => (
                      <option key={area.name} value={area.arabic_name}>{area.arabic_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">العنوان <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={newCamp.address}
                  onChange={(e) => setNewCamp({ ...newCamp, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                  placeholder="مثال: شارع عمر المختار، جباليا"
                  disabled={isCreating}
                />
              </div>

              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={capturingLocation || isCreating}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md ${
                    isLocationCaptured 
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200 shadow-emerald-100' 
                      : 'bg-blue-50 text-blue-700 border-2 border-blue-100 hover:bg-blue-100 shadow-blue-100'
                  }`}
                >
                  {capturingLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      جاري التحديد...
                    </>
                  ) : isLocationCaptured ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      تم تحديد الموقع بنجاح
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      تحديد موقعي الحالي (GPS)
                    </>
                  )}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">كلمة المرور <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={newCamp.password}
                    onChange={(e) => setNewCamp({ ...newCamp, password: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                    placeholder="******"
                    disabled={isCreating}
                  />
                  <p className="text-xs text-gray-400 font-bold mt-1">الحد الأدنى: 6 أحرف</p>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={newCamp.confirmPassword}
                    onChange={(e) => setNewCamp({ ...newCamp, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                    placeholder="******"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-black text-amber-800">ملاحظة مهمة</p>
                  <p className="text-xs text-amber-600 font-bold mt-1">سيتم إنشاء حساب للمدير بالبريد الإلكتروني وكلمة المرور. يمكنه الدخول فوراً بعد الإنشاء</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 flex justify-end gap-3 flex-shrink-0 border-t">
              <button onClick={() => setShowAddCamp(false)} className="px-6 md:px-8 py-3 bg-white text-gray-700 rounded-xl font-black border-2 border-gray-200 hover:bg-gray-100 transition-all text-sm md:text-base" disabled={isCreating}>إلغاء</button>
              <button
                onClick={handleCreateCamp}
                disabled={isCreating || !newCamp.name || !newCamp.managerName || !newCamp.address || !newCamp.email || !newCamp.password || !newCamp.confirmPassword || !newCamp.governorate || !newCamp.area}
                className="px-6 md:px-8 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
              >
                {isCreating ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>جاري الإنشاء...</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>إنشاء المخيم</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Camp Modal */}
      {showEditCamp && selectedCamp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-amber-600 text-white p-4 md:p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-black">تعديل المخيم</h3>
              </div>
              <button onClick={() => setShowEditCamp(false)} className="w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-lg md:rounded-xl flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">اسم المخيم <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editCamp.name}
                    onChange={(e) => setEditCamp({ ...editCamp, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm"
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">اسم المدير <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editCamp.managerName}
                    onChange={(e) => setEditCamp({ ...editCamp, managerName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">حالة المخيم <span className="text-red-500">*</span></label>
                  <select
                    value={editCamp.status}
                    onChange={(e) => setEditCamp({ ...editCamp, status: e.target.value as any })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm bg-white"
                    disabled={isUpdating}
                  >
                    <option value="نشط">نشط</option>
                    <option value="قيد الانتظار">قيد الانتظار</option>
                    <option value="ممتلئ">ممتلئ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">المحافظة <span className="text-red-500">*</span></label>
                  <select
                    value={editCamp.governorate}
                    onChange={(e) => handleGovernorateChange(e.target.value, false)}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm bg-white"
                    disabled={isUpdating}
                  >
                    <option value="">اختر المحافظة</option>
                    {GAZA_LOCATIONS.map((gov) => (
                      <option key={gov.name} value={gov.arabic_name}>{gov.arabic_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">المنطقة <span className="text-red-500">*</span></label>
                  <select
                    value={editCamp.area}
                    onChange={(e) => setEditCamp({ ...editCamp, area: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm bg-white disabled:bg-gray-100"
                    disabled={isUpdating || !editCamp.governorate}
                  >
                    <option value="">اختر المنطقة</option>
                    {editAvailableAreas.map((area) => (
                      <option key={area.name} value={area.arabic_name}>{area.arabic_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">العنوان <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={editCamp.address}
                  onChange={(e) => setEditCamp({ ...editCamp, address: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm"
                  disabled={isUpdating}
                />
              </div>

              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={handleGetEditLocation}
                  disabled={capturingEditLocation || isUpdating}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-sm transition-all shadow-md ${
                    isEditLocationCaptured 
                      ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200 shadow-emerald-100' 
                      : 'bg-blue-50 text-blue-700 border-2 border-blue-100 hover:bg-blue-100 shadow-blue-100'
                  }`}
                >
                  {capturingEditLocation ? (
                    <>
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                      جاري التحديد...
                    </>
                  ) : isEditLocationCaptured ? (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                      تم تحديث الموقع بنجاح
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      تحديث الموقع الحالي (GPS)
                    </>
                  )}
                </button>
              </div>

              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-black text-blue-800">ملاحظة</p>
                  <p className="text-xs text-blue-600 font-bold mt-1">تعديل حالة المخيم تؤثر على صلاحيات الدخول والخدمات المتاحة</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 flex justify-end gap-3 flex-shrink-0 border-t">
              <button onClick={() => setShowEditCamp(false)} className="px-6 md:px-8 py-3 bg-white text-gray-700 rounded-xl font-black border-2 border-gray-200 hover:bg-gray-100 transition-all text-sm md:text-base" disabled={isUpdating}>إلغاء</button>
              <button
                onClick={handleUpdateCamp}
                disabled={isUpdating || !editCamp.name || !editCamp.managerName || !editCamp.address || !editCamp.governorate || !editCamp.area}
                className="px-6 md:px-8 py-3 bg-amber-600 text-white rounded-xl font-black shadow-lg shadow-amber-200 hover:bg-amber-700 hover:shadow-xl hover:shadow-amber-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
              >
                {isUpdating ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>جاري الحفظ...</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>حفظ التعديلات</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CampsManagement;
