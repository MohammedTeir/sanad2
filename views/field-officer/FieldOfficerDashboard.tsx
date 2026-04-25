// views/field-officer/FieldOfficerDashboard.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import { DPProfile, Camp } from '../../types';
import Toast from '../../components/Toast';
import { SearchInput } from '../../components/filters';
import { matchesArabicSearchMulti } from '../../utils/arabicTextUtils';

interface DashboardStats {
  totalFamilies: number;
  registeredToday: number;
  registeredThisWeek: number;
  pendingApprovals: number;
  distributionsCompleted: number;
  emergencyReportsSubmitted: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'distribution' | 'update';
  familyName?: string;
  familyId?: string;
  date: string;
  status?: string;
}

const FieldOfficerDashboard = ({ section = 'overview' }: { section?: string }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalFamilies: 0,
    registeredToday: 0,
    registeredThisWeek: 0,
    pendingApprovals: 0,
    distributionsCompleted: 0,
    emergencyReportsSubmitted: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [families, setFamilies] = useState<DPProfile[]>([]);
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');

  // Auto-redirect to registration form when section is 'register'
  useEffect(() => {
    if (section === 'register') {
      navigate('/field/register-family');
    }
  }, [section, navigate]);

  // Load current user's camp ID on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const currentUser = sessionService.getCurrentUser();
    console.log('Field Officer Dashboard - Current user from session:', currentUser);
    
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
      setCurrentUser(currentUser);
    } else if (currentUser?.id) {
      // If no campId in token, fetch user info from backend
      fetchUserInfo(currentUser.id);
    } else {
      setToast({ message: 'لم يتم تحديد المستخدم. يرجى تسجيل الدخول مرة أخرى.', type: 'error' });
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (userId: string) => {
    try {
      console.log('Fetching user info for:', userId);
      const userInfo = await makeAuthenticatedRequest(`/users/${userId}`);
      console.log('User info received:', userInfo);
      
      if (userInfo?.campId) {
        setCurrentCampId(userInfo.campId);
        setCurrentUser({ ...currentUser, campId: userInfo.campId });
      } else {
        setToast({ message: 'لم يتم تحديد المخيم. يرجى التواصل مع مدير المخيم.', type: 'error' });
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error fetching user info:', err);
      setToast({ message: 'فشل تحميل معلومات المستخدم', type: 'error' });
      setLoading(false);
    }
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setToast(null);

      if (!currentCampId) {
        setFamilies([]);
        setLoading(false);
        return;
      }

      // Load families data for this camp
      console.log('Field Officer Dashboard - Loading families for camp:', currentCampId);
      const loadedFamilies = await realDataService.getDPs(currentCampId);
      console.log('Field Officer Dashboard - Loaded families:', loadedFamilies);
      console.log('Field Officer Dashboard - Families count:', loadedFamilies?.length || 0);
      setFamilies(loadedFamilies || []);

      // Calculate statistics
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoStr = weekAgo.toISOString().split('T')[0];

      const total = loadedFamilies?.length || 0;
      const registeredToday = loadedFamilies?.filter(d => {
        const regDate = d.registeredDate?.split('T')[0] || d.registeredDate;
        return regDate === today;
      }).length || 0;

      const registeredThisWeek = loadedFamilies?.filter(d => {
        const regDate = d.registeredDate?.split('T')[0] || d.registeredDate;
        return regDate && regDate >= weekAgoStr;
      }).length || 0;

      const pending = loadedFamilies?.filter(d => d.registrationStatus === 'قيد الانتظار').length || 0;

      // Calculate distributions (from aidHistory)
      let distributionsCount = 0;
      loadedFamilies?.forEach(family => {
        if (family.aidHistory && family.aidHistory.length > 0) {
          distributionsCount += family.aidHistory.length;
        }
      });

      setStats({
        totalFamilies: total,
        registeredToday: registeredToday,
        registeredThisWeek: registeredThisWeek,
        pendingApprovals: pending,
        distributionsCompleted: distributionsCount,
        emergencyReportsSubmitted: 0 // Will be implemented with reports endpoint
      });

      // Build recent activities list
      const activities: RecentActivity[] = [];
      
      // Add recent registrations
      const recentRegistrations = loadedFamilies
        ?.filter(d => {
          const regDate = d.registeredDate?.split('T')[0] || d.registeredDate;
          return regDate && regDate >= weekAgoStr;
        })
        .sort((a, b) => {
          const dateA = new Date(a.registeredDate || '');
          const dateB = new Date(b.registeredDate || '');
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5)
        .map(family => ({
          id: family.id,
          type: 'registration' as const,
          familyName: family.headOfFamily,
          familyId: family.id,
          date: family.registeredDate || '',
          status: family.registrationStatus
        }));

      if (recentRegistrations) {
        activities.push(...recentRegistrations);
      }

      setRecentActivities(activities);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setToast({ message: err.message || 'فشل تحميل بيانات لوحة التحكم', type: 'error' });
      setFamilies([]);
      setStats({
        totalFamilies: 0,
        registeredToday: 0,
        registeredThisWeek: 0,
        pendingApprovals: 0,
        distributionsCompleted: 0,
        emergencyReportsSubmitted: 0
      });
    } finally {
      setLoading(false);
    }
  }, [currentCampId]);

  useEffect(() => {
    if (currentCampId) {
      loadData();
    }
  }, [currentCampId, section, loadData]);

  // Helper function to get full name
  const getFullName = (family: DPProfile): string => {
    if (family.headFirstName && family.headFatherName && family.headGrandfatherName && family.headFamilyName) {
      return `${family.headFirstName} ${family.headFatherName} ${family.headGrandfatherName} ${family.headFamilyName}`;
    }
    return family.headOfFamily || '';
  };

  // Filter families based on search query
  const filteredFamilies = families.filter(family => {
    if (!dashboardSearchQuery.trim()) return true;
    const fullName = getFullName(family);
    return matchesArabicSearchMulti(dashboardSearchQuery, [
      fullName,
      family.nationalId,
      family.phoneNumber,
      family.currentHousingLandmark
    ]);
  });

  if (loading) {
    return (
      <div className="space-y-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border-2 border-gray-100 shadow-sm">
              <div className="space-y-3">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Recent Activities Skeleton */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {section === 'overview' && (
        <>
          {/* Header Section */}
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-[2rem] p-6 md:p-8 text-white shadow-lg">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-black mb-1">مرحباً، {currentUser?.name || currentUser?.firstName || 'ضابط الميدان'}</h1>
                <p className="text-emerald-100 font-bold text-sm">لوحة تحكم موظف الميدان</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-emerald-100 text-xs font-bold mb-1">إجمالي الأسر</p>
                <p className="text-3xl font-black">{stats.totalFamilies}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-emerald-100 text-xs font-bold mb-1">مسجلة اليوم</p>
                <p className="text-3xl font-black">{stats.registeredToday}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-emerald-100 text-xs font-bold mb-1">هذا الأسبوع</p>
                <p className="text-3xl font-black">{stats.registeredThisWeek}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                <p className="text-emerald-100 text-xs font-bold mb-1">قيد الانتظار</p>
                <p className="text-3xl font-black">{stats.pendingApprovals}</p>
              </div>
            </div>
          </div>

          {/* Quick Search Bar */}
          <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <h3 className="font-black text-gray-800">بحث سريع عن أسرة</h3>
            </div>
            <SearchInput
              value={dashboardSearchQuery}
              onChange={setDashboardSearchQuery}
              placeholder="ابحث بالاسم، رقم الهوية، أو الهاتف..."
              debounceMs={300}
              showArabicHint={true}
              iconColor="emerald"
            />
            {dashboardSearchQuery && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-gray-600">
                    تم العثور على <span className="text-emerald-600 font-black">{filteredFamilies.length}</span> نتيجة
                  </p>
                  <button
                    onClick={() => setDashboardSearchQuery('')}
                    className="text-xs font-black text-emerald-600 hover:text-emerald-700"
                  >
                    مسح البحث
                  </button>
                </div>
                {filteredFamilies.length === 0 ? (
                  <div className="p-4 text-center bg-gray-50 rounded-xl">
                    <p className="text-gray-500 font-bold text-sm">لا توجد نتائج</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {filteredFamilies.slice(0, 10).map((family) => (
                      <div
                        key={family.id}
                        className="p-3 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer flex items-center justify-between"
                        onClick={() => navigate(`/field/dp-details/${family.id}`)}
                      >
                        <div>
                          <p className="font-black text-gray-800 text-sm">{getFullName(family)}</p>
                          <p className="text-xs text-gray-500 font-bold mt-1">
                            {family.nationalId} • {family.totalMembersCount} أفراد
                          </p>
                        </div>
                        <StatusBadge status={family.registrationStatus || 'قيد الانتظار'} />
                      </div>
                    ))}
                    {filteredFamilies.length > 10 && (
                      <button
                        onClick={() => navigate('/field/search')}
                        className="w-full py-2 text-sm font-black text-emerald-600 hover:text-emerald-700"
                      >
                        عرض جميع النتائج ({filteredFamilies.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div>
            <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              الإجراءات السريعة
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <QuickActionCard
                title="تسجيل أسرة جديدة"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                }
                color="emerald"
                onClick={() => navigate('/field/register')}
              />
              <QuickActionCard
                title="بحث عن أسرة"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                color="blue"
                onClick={() => navigate('/field/search')}
              />
              <QuickActionCard
                title="إدارة التوزيع"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1h12m-5 0h8" />
                  </svg>
                }
                color="amber"
                onClick={() => navigate('/field/distribution')}
              />
              <QuickActionCard
                title="سجل التوزيعات"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                }
                color="blue"
                onClick={() => navigate('/field/distribution-history')}
              />
              <QuickActionCard
                title="بلاغ طارئ"
                icon={
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                }
                color="red"
                onClick={() => navigate('/field/emergency-report')}
              />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            <StatCard
              title="إجمالي الأسر المسجلة"
              value={stats.totalFamilies}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              }
              color="emerald"
            />
            <StatCard
              title="التوزيعات المنفذة"
              value={stats.distributionsCompleted}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="blue"
            />
            <StatCard
              title="قيد انتظار الموافقة"
              value={stats.pendingApprovals}
              icon={
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              color="amber"
            />
          </div>

          {/* Recent Activities */}
          <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                الأنشطة الحديثة
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {recentActivities.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-bold">لا توجد أنشطة حديثة</p>
                </div>
              ) : (
                recentActivities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'registration' ? 'bg-emerald-100 text-emerald-600' :
                      activity.type === 'distribution' ? 'bg-blue-100 text-blue-600' :
                      'bg-amber-100 text-amber-600'
                    }`}>
                      {activity.type === 'registration' ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                      ) : activity.type === 'distribution' ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-black text-gray-800 text-sm">
                        {activity.type === 'registration' ? 'تسجيل أسرة جديدة' :
                         activity.type === 'distribution' ? 'توزيع مساعدة' : 'تحديث بيانات'}
                      </p>
                      <p className="text-gray-500 text-xs font-bold mt-1">
                        {activity.familyName || 'غير معروف'} • {new Date(activity.date).toLocaleDateString('ar-EG')}
                      </p>
                    </div>
                    {activity.status && (
                      <StatusBadge status={activity.status} />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {section === 'register' && (
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6 text-center py-12">
          <div className="animate-spin w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">جاري تحميل نموذج التسجيل...</p>
        </div>
      )}
    </div>
  );
};

// Quick Action Card Component
const QuickActionCard = ({ title, icon, color, onClick }: { 
  title: string; 
  icon: React.ReactNode; 
  color: 'emerald' | 'blue' | 'amber' | 'red';
  onClick: () => void;
}) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700',
    red: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700'
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} border-2 rounded-[2rem] p-6 transition-all hover:shadow-lg flex flex-col items-center gap-3 group`}
    >
      <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <span className="font-black text-sm text-center">{title}</span>
    </button>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }: { 
  title: string; 
  value: number; 
  icon: React.ReactNode; 
  color: 'emerald' | 'blue' | 'amber' | 'red';
}) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200'
  };

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-black text-gray-900">{value}</p>
        </div>
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = () => {
    switch (status) {
      case 'موافق':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'قيد الانتظار':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'مرفوض':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black border ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

export default FieldOfficerDashboard;
