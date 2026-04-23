// views/camp-manager/CampDashboard.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import { DPProfile, Camp } from '../../types';
import Toast from '../../components/Toast';
import { SearchInput } from '../../components/filters';
import { matchesArabicSearchMulti } from '../../utils/arabicTextUtils';
import { formatFullCoordinateString } from '../../utils/geoUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardStats {
  totalFamilies: number;
  totalMembers: number;
  activeFamilies: number;
  pendingFamilies: number;
  transferRequests: number;
  criticalCases: number;
  activeCampaigns: number;
  availableInventory: number;
  staffMembers: number;
  distributionsCompleted: number;
}

interface RecentActivity {
  id: string;
  type: 'registration' | 'distribution' | 'transfer' | 'update' | 'staff';
  familyName?: string;
  familyId?: string;
  date: string;
  status?: string;
  details?: string;
  userName?: string;
}

interface InventoryAlert {
  id: string;
  name: string;
  quantityAvailable: number;
  minAlertThreshold: number;
  unit: string;
}

interface VulnerabilityDistribution {
  veryHigh: number;
  high: number;
  medium: number;
  low: number;
}

interface MonthlyRegistration {
  month: string;
  count: number;
}

const CampDashboard = ({ section = 'overview' }: { section?: string }) => {
  const navigate = useNavigate();
  const [dps, setDps] = useState<DPProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [currentCamp, setCurrentCamp] = useState<Camp | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  
  const [stats, setStats] = useState<DashboardStats>({
    totalFamilies: 0,
    totalMembers: 0,
    activeFamilies: 0,
    pendingFamilies: 0,
    transferRequests: 0,
    criticalCases: 0,
    activeCampaigns: 0,
    availableInventory: 0,
    staffMembers: 0,
    distributionsCompleted: 0
  });

  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [inventoryAlerts, setInventoryAlerts] = useState<InventoryAlert[]>([]);
  const [vulnerabilityDist, setVulnerabilityDist] = useState<VulnerabilityDistribution>({
    veryHigh: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [monthlyRegistrations, setMonthlyRegistrations] = useState<MonthlyRegistration[]>([]);
  const [filteredFamilies, setFilteredFamilies] = useState<DPProfile[]>([]);
  const [updatingLocation, setUpdatingLocation] = useState(false);

  // Chart data state
  const [distributionProgressData, setDistributionProgressData] = useState<any>(null);
  const [vulnerabilityChartData, setVulnerabilityChartData] = useState<any>(null);
  const [registrationTrendData, setRegistrationTrendData] = useState<any>(null);

  // ... (previous refs)

  const handleUpdateLocation = async () => {
    if (!navigator.geolocation) {
      setToast({ message: 'المتصفح لا يدعم تحديد الموقع الجغرافي', type: 'error' });
      return;
    }

    setUpdatingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          await makeAuthenticatedRequest(`/camps/${currentCampId}`, {
            method: 'PUT',
            body: JSON.stringify({
              location_lat: lat,
              location_lng: lng
            })
          });

          setToast({ message: 'تم تحديث موقع المخيم بنجاح', type: 'success' });
          loadData(true); // Refresh dashboard to show updated data
        } catch (err: any) {
          console.error('Update location error:', err);
          setToast({ message: 'فشل تحديث الموقع: ' + err.message, type: 'error' });
        } finally {
          setUpdatingLocation(false);
        }
      },
      (err) => {
        console.error('Geolocation error:', err);
        let errorMsg = 'تعذر تحديد الموقع. يرجى تفعيل الـ GPS.';
        if (err.code === 1) errorMsg = 'يرجى منح صلاحية الوصول للموقع الجغرافي.';
        setToast({ message: errorMsg, type: 'error' });
        setUpdatingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ... (rest of the component)

  // Ref to track last load time and prevent duplicate auto-refresh calls
  const lastLoadTimeRef = useRef<number>(0);
  const isLoadingRef = useRef<boolean>(false);
  const hasLoadedRef = useRef<boolean>(false);
  const loadedCampIdRef = useRef<string | null>(null);
  const currentCampIdRef = useRef<string>('');

  // Keep currentCampIdRef updated
  useEffect(() => {
    currentCampIdRef.current = currentCampId;
  }, [currentCampId]);

  // Load current user's camp ID on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
      setCurrentUser(currentUser);
    } else if (currentUser?.id) {
      fetchUserInfo(currentUser.id);
    } else {
      setToast({ message: 'لم يتم تحديد المخيم. يرجى تسجيل الدخول كمدير مخيم.', type: 'error' });
      setLoading(false);
    }
  }, []);

  const fetchUserInfo = async (userId: string) => {
    try {
      const userInfo = await makeAuthenticatedRequest(`/users/${userId}`);
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

  const loadData = useCallback(async (isRefresh = false) => {
    // Prevent duplicate concurrent calls
    if (isLoadingRef.current) {
      console.log('[loadData] Skipping duplicate call - already loading');
      return;
    }

    // Prevent duplicate initial load (unless camp changed or it's a refresh)
    if (!isRefresh && hasLoadedRef.current && loadedCampIdRef.current === currentCampIdRef.current) {
      console.log('[loadData] Skipping duplicate initial load');
      return;
    }

    // Prevent auto-refresh from running too soon after manual load
    const now = Date.now();
    if (isRefresh && now - lastLoadTimeRef.current < 5000) {
      console.log('[loadData] Skipping auto-refresh - loaded too recently');
      return;
    }

    isLoadingRef.current = true;
    lastLoadTimeRef.current = now;
    hasLoadedRef.current = true;
    loadedCampIdRef.current = currentCampIdRef.current;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setToast(null);

      if (!currentCampIdRef.current) {
        setDps([]);
        setLoading(false);
        setRefreshing(false);
        isLoadingRef.current = false;
        return;
      }

      // Load all data in parallel - use currentCampIdRef to avoid dependency
      const campIdToUse = currentCampIdRef.current;
      const [
        loadedDPs,
        campData,
        transfers,
        campaigns,
        inventoryItems,
        staff,
        distributions
      ] = await Promise.all([
        realDataService.getDPs(campIdToUse),
        makeAuthenticatedRequest('/camps/my-camp').catch(() => null),
        makeAuthenticatedRequest(`/transfers?campId=${campIdToUse}`).catch(() => []),
        makeAuthenticatedRequest(`/aid/campaigns?campId=${campIdToUse}`).catch(() => []),
        makeAuthenticatedRequest(`/inventory?campId=${campIdToUse}`).catch(() => []),
        makeAuthenticatedRequest(`/users/camp/field-officers`).catch(() => []),
        makeAuthenticatedRequest(`/aid/distributions?campId=${campIdToUse}`).catch(() => [])
      ]);

      setDps(loadedDPs || []);
      setCurrentCamp(campData);

      // Calculate statistics
      const total = loadedDPs?.length || 0;
      const active = loadedDPs?.filter(d => d.registrationStatus === 'موافق').length || 0;
      const pending = loadedDPs?.filter(d => d.registrationStatus === 'قيد الانتظار').length || 0;
      const critical = loadedDPs?.filter(d => (d.vulnerabilityScore || 0) > 80).length || 0;
      const totalMembers = loadedDPs?.reduce((sum, d) => sum + (d.totalMembersCount || 0), 0) || 0;

      // Calculate vulnerability distribution
      const veryHigh = loadedDPs?.filter(d => d.vulnerabilityPriority === 'عالي جداً').length || 0;
      const high = loadedDPs?.filter(d => d.vulnerabilityPriority === 'عالي').length || 0;
      const medium = loadedDPs?.filter(d => d.vulnerabilityPriority === 'متوسط').length || 0;
      const low = loadedDPs?.filter(d => d.vulnerabilityPriority === 'منخفض').length || 0;

      setVulnerabilityDist({ veryHigh, high, medium, low });

      // Calculate monthly registrations (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const monthlyData: { [key: string]: number } = {};
      
      loadedDPs?.forEach(d => {
        const regDate = new Date(d.registeredDate || '');
        if (regDate >= sixMonthsAgo) {
          const monthKey = regDate.toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' });
          monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
        }
      });

      const monthlyReg = Object.entries(monthlyData).map(([month, count]) => ({ month, count }));
      setMonthlyRegistrations(monthlyReg);

      // Count active campaigns
      const activeCampaignsCount = Array.isArray(campaigns) ? campaigns.filter((c: any) => c.status === 'نشطة').length : 0;
      
      // Count available inventory items
      const availableInventoryCount = Array.isArray(inventoryItems) ? inventoryItems.filter((i: any) => (i.quantity_available || i.quantityAvailable || 0) > 0).length : 0;

      // Count staff members
      const staffCount = Array.isArray(staff) ? staff.length : 0;

      // Count distributions completed
      const distributionsCount = Array.isArray(distributions) ? distributions.length : 0;

      // Calculate inventory alerts
      const alerts: InventoryAlert[] = [];
      if (Array.isArray(inventoryItems)) {
        inventoryItems.forEach((item: any) => {
          const qty = item.quantity_available || item.quantityAvailable || 0;
          const minThreshold = item.minAlertThreshold || 10;
          if (qty <= minThreshold && (item.is_active !== false && item.isActive !== false)) {
            alerts.push({
              id: item.id,
              name: item.name || item.nameAr || 'صنف غير معروف',
              quantityAvailable: qty,
              minAlertThreshold: minThreshold,
              unit: item.unit || item.unitAr || 'وحدة'
            });
          }
        });
      }
      setInventoryAlerts(alerts);

      setStats({
        totalFamilies: total,
        totalMembers: totalMembers,
        activeFamilies: active,
        pendingFamilies: pending,
        transferRequests: Array.isArray(transfers) ? transfers.filter((t: any) => t.status === 'قيد الانتظار').length : 0,
        criticalCases: critical,
        activeCampaigns: activeCampaignsCount,
        availableInventory: availableInventoryCount,
        staffMembers: staffCount,
        distributionsCompleted: distributionsCount
      });

      // Build recent activities list
      const activities: RecentActivity[] = [];

      // Recent registrations (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentRegistrations = loadedDPs
        ?.filter(d => {
          const regDate = new Date(d.registeredDate || '');
          return regDate >= weekAgo;
        })
        .sort((a, b) => {
          const dateA = new Date(a.registeredDate || '');
          const dateB = new Date(b.registeredDate || '');
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5)
        .map(family => {
          const fullName = family.headFirstName && family.headFamilyName
            ? `${family.headFirstName} ${family.headFatherName || ''} ${family.headGrandfatherName || ''} ${family.headFamilyName}`.trim()
            : family.headOfFamily || 'غير معروف';
          
          return {
            id: family.id,
            type: 'registration' as const,
            familyName: fullName,
            familyId: family.id,
            date: family.registeredDate || '',
            status: family.registrationStatus,
            details: `${family.totalMembersCount || 0} أفراد`
          };
        });

      if (recentRegistrations) {
        activities.push(...recentRegistrations);
      }

      // Recent distributions
      if (Array.isArray(distributions)) {
        const recentDistributions = distributions
          .slice(0, 3)
          .map((dist: any) => ({
            id: dist.id,
            type: 'distribution' as const,
            familyName: dist.familyName || 'غير معروف',
            date: dist.distributionDate || dist.createdAt || '',
            status: dist.status,
            details: dist.aidType || dist.campaignName || ''
          }));
        activities.push(...recentDistributions);
      }

      setRecentActivities(activities);

      // Prepare chart data
      prepareChartData(campaigns, monthlyReg);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setToast({ message: err.message || 'فشل تحميل بيانات لوحة التحكم', type: 'error' });
      setDps([]);
      setStats({
        totalFamilies: 0,
        totalMembers: 0,
        activeFamilies: 0,
        pendingFamilies: 0,
        transferRequests: 0,
        criticalCases: 0,
        activeCampaigns: 0,
        availableInventory: 0,
        staffMembers: 0,
        distributionsCompleted: 0
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const prepareChartData = (campaigns: any[], monthlyReg: MonthlyRegistration[]) => {
    // Distribution Progress Chart Data
    if (Array.isArray(campaigns) && campaigns.length > 0) {
      const campaignNames = campaigns.slice(0, 5).map((c: any) => c.name || 'حملة غير معروفة');
      const targetFamilies = campaigns.slice(0, 5).map((c: any) => c.targetFamilies?.length || c.totalTargetFamilies || 0);
      const distributedCount = campaigns.slice(0, 5).map((c: any) => c.distributedTo?.length || c.distributedCount || 0);

      setDistributionProgressData({
        labels: campaignNames,
        datasets: [
          {
            label: 'الهدف',
            data: targetFamilies,
            backgroundColor: 'rgba(5, 150, 105, 0.2)',
            borderColor: 'rgb(5, 150, 105)',
            borderWidth: 2,
            borderRadius: 8,
            barPercentage: 0.6
          },
          {
            label: 'تم التوزيع',
            data: distributedCount,
            backgroundColor: 'rgba(37, 99, 235, 0.6)',
            borderColor: 'rgb(37, 99, 235)',
            borderWidth: 2,
            borderRadius: 8,
            barPercentage: 0.6
          }
        ]
      });
    }

    // Vulnerability Pie Chart Data
    setVulnerabilityChartData({
      labels: ['عالي جداً', 'عالي', 'متوسط', 'منخفض'],
      datasets: [{
        data: [vulnerabilityDist.veryHigh, vulnerabilityDist.high, vulnerabilityDist.medium, vulnerabilityDist.low],
        backgroundColor: [
          'rgba(220, 38, 38, 0.8)',  // Red for very high
          'rgba(249, 115, 22, 0.8)', // Orange for high
          'rgba(245, 158, 11, 0.8)', // Amber for medium
          'rgba(5, 150, 105, 0.8)'   // Emerald for low
        ],
        borderColor: [
          'rgb(220, 38, 38)',
          'rgb(249, 115, 22)',
          'rgb(245, 158, 11)',
          'rgb(5, 150, 105)'
        ],
        borderWidth: 2
      }]
    });

    // Registration Trend Line Chart Data
    if (monthlyReg.length > 0) {
      setRegistrationTrendData({
        labels: monthlyReg.map(m => m.month),
        datasets: [{
          label: 'التسجيلات الشهرية',
          data: monthlyReg.map(m => m.count),
          borderColor: 'rgb(5, 150, 105)',
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(5, 150, 105)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      });
    }
  };

  useEffect(() => {
    if (currentCampId) {
      loadData();
    }
  }, [currentCampId]);

  // Real-time refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentCampId) {
        loadData(true);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCampId]);

  // Filter families based on search query
  useEffect(() => {
    if (!dashboardSearchQuery.trim()) {
      setFilteredFamilies(dps.slice(0, 10));
    } else {
      const filtered = dps.filter(family => {
        const fullName = family.headFirstName && family.headFamilyName
          ? `${family.headFirstName} ${family.headFatherName || ''} ${family.headGrandfatherName || ''} ${family.headFamilyName}`.trim()
          : family.headOfFamily || '';
        
        return matchesArabicSearchMulti(dashboardSearchQuery, [
          fullName,
          family.nationalId,
          family.phoneNumber,
          family.currentHousingLandmark || ''
        ]);
      });
      setFilteredFamilies(filtered.slice(0, 10));
    }
  }, [dashboardSearchQuery, dps]);

  const handleRefresh = () => {
    loadData(true);
    setToast({ message: 'جاري تحديث البيانات...', type: 'info' });
  };

  if (loading) {
    return <DashboardSkeleton />;
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
          {/* Hero Header Section */}
          <HeroHeader
            camp={currentCamp}
            user={currentUser}
            stats={stats}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onUpdateLocation={handleUpdateLocation}
            updatingLocation={updatingLocation}
          />

          {/* Quick Search Bar */}
          <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-4 md:p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="font-black text-gray-800 text-lg">بحث سريع عن أسرة</h3>
            </div>
            <SearchInput
              value={dashboardSearchQuery}
              onChange={setDashboardSearchQuery}
              placeholder="ابحث بالاسم، رقم الهوية، أو الهاتف..."
              debounceMs={300}
              showArabicHint={true}
              iconColor="emerald"
            />
            {filteredFamilies.length > 0 && (
              <div className="mt-4 space-y-2 max-h-80 overflow-y-auto">
                {filteredFamilies.map((family) => {
                  const fullName = family.headFirstName && family.headFamilyName
                    ? `${family.headFirstName} ${family.headFatherName || ''} ${family.headGrandfatherName || ''} ${family.headFamilyName}`.trim()
                    : family.headOfFamily || 'غير معروف';

                  return (
                    <div
                      key={family.id}
                      className="p-4 bg-gray-50 rounded-xl hover:bg-emerald-50 transition-colors cursor-pointer flex items-center justify-between"
                      onClick={() => navigate(`/manager/dp-details/${family.id}`)}
                    >
                      <div>
                        <p className="font-black text-gray-800 text-sm">{fullName}</p>
                        <p className="text-xs text-gray-500 font-bold mt-1">
                          {family.nationalId} • {family.totalMembersCount} أفراد
                          {family.vulnerabilityScore ? ` • نقاط: ${family.vulnerabilityScore}` : ''}
                        </p>
                      </div>
                      <StatusBadge status={family.registrationStatus || 'قيد الانتظار'} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <QuickActionsSection navigate={navigate} />

          {/* Stats Cards Grid */}
          <StatsCardsGrid stats={stats} />

          {/* Charts Section */}
          <ChartsSection
            distributionData={distributionProgressData}
            vulnerabilityData={vulnerabilityChartData}
            trendData={registrationTrendData}
          />

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activities */}
            <RecentActivitiesSection activities={recentActivities} navigate={navigate} />

            {/* Critical Alerts */}
            <CriticalAlertsSection inventoryAlerts={inventoryAlerts} stats={stats} navigate={navigate} />
          </div>
        </>
      )}
    </div>
  );
};

// Hero Header Component
const HeroHeader = ({ camp, user, stats, onRefresh, refreshing, onUpdateLocation, updatingLocation }: {
  camp: Camp | null;
  user: any;
  stats: DashboardStats;
  onRefresh: () => void;
  refreshing: boolean;
  onUpdateLocation: () => void;
  updatingLocation: boolean;
}) => (
  <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-[2.5rem] p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
    {/* Background Pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
    </div>

    <div className="relative z-10">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-[2rem] flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black mb-2">
              مرحباً، {user?.name || user?.firstName || 'مدير المخيم'}
            </h1>
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-emerald-100 font-bold text-sm md:text-base">
                {camp?.name || 'مخيم غير محدد'}
              </p>
              <button
                onClick={onUpdateLocation}
                disabled={updatingLocation}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-full text-[10px] font-black transition-all border border-white/20 disabled:opacity-50"
                title="تحديث الموقع الجغرافي للمخيم بناءً على موقعك الحالي"
              >
                {updatingLocation ? (
                  <div className="w-3 h-3 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                )}
                {updatingLocation ? 'جاري التحديث...' : 'تحديث الموقع (GPS)'}
              </button>
            </div>
            {camp?.status && (
              <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-black ${
                camp.status === 'نشط' ? 'bg-green-500/30 text-green-100' :
                camp.status === 'ممتلئ' ? 'bg-amber-500/30 text-amber-100' :
                'bg-gray-500/30 text-gray-100'
              }`}>
                {camp.status}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={refreshing}
          className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center hover:bg-white/30 transition-all disabled:opacity-50"
        >
          <svg className={`w-6 h-6 text-white ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <QuickStat label="إجمالي الأسر" value={stats.totalFamilies} subValue={`${stats.totalMembers} فرد`} />
        <QuickStat label="الأسر النشطة" value={stats.activeFamilies} />
        <QuickStat label="قيد الانتظار" value={stats.pendingFamilies} variant="warning" />
        <QuickStat label="حالات حرجة" value={stats.criticalCases} variant="danger" />
      </div>
    </div>
  </div>
);

const QuickStat = ({ label, value, subValue, variant = 'default' }: {
  label: string;
  value: number;
  subValue?: string;
  variant?: 'default' | 'warning' | 'danger';
}) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3 md:p-4 hover:bg-white/15 transition-all">
    <p className={`text-xs font-bold mb-1 ${
      variant === 'warning' ? 'text-amber-100' :
      variant === 'danger' ? 'text-red-100' :
      'text-emerald-100'
    }`}>
      {label}
    </p>
    <p className="text-2xl md:text-3xl font-black">{value}</p>
    {subValue && <p className="text-xs text-emerald-100 font-bold mt-1">{subValue}</p>}
  </div>
);

// Quick Actions Component
const QuickActionsSection = ({ navigate }: { navigate: (path: string) => void }) => {
  const actions = [
    {
      title: 'تسجيل أسرة',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'emerald',
      path: '/field/register'
    },
    {
      title: 'حملة مساعدات',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: 'blue',
      path: '/manager/aid-campaigns'
    },
    {
      title: 'توزيع مساعدة',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'amber',
      path: '/manager/distribution'
    },
    {
      title: 'إضافة موظف',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'purple',
      path: '/manager/staff'
    },
    {
      title: 'بحث عن أسرة',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
      color: 'teal',
      path: '/manager/dp-management'
    },
    {
      title: 'بلاغ طارئ',
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      color: 'red',
      path: '/field/emergency-report'
    }
  ];

  return (
    <div>
      <h2 className="text-xl font-black text-gray-800 mb-4 flex items-center gap-2">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        الإجراءات السريعة
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {actions.map((action, idx) => (
          <QuickActionCard key={idx} {...action} onClick={() => navigate(action.path)} />
        ))}
      </div>
    </div>
  );
};

const QuickActionCard = ({ title, icon, color, onClick }: {
  title: string;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'amber' | 'purple' | 'teal' | 'red';
  onClick: () => void;
}) => {
  const colorClasses = {
    emerald: 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-700',
    amber: 'bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-700',
    purple: 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700',
    teal: 'bg-teal-50 border-teal-200 hover:bg-teal-100 text-teal-700',
    red: 'bg-red-50 border-red-200 hover:bg-red-100 text-red-700'
  };

  return (
    <button
      onClick={onClick}
      className={`${colorClasses[color]} border-2 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all hover:shadow-lg hover:-translate-y-1`}
    >
      <div className="w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center">
        {icon}
      </div>
      <span className="text-xs font-black text-center">{title}</span>
    </button>
  );
};

// Stats Cards Component
const StatsCardsGrid = ({ stats }: { stats: DashboardStats }) => {
  const cards = [
    {
      title: 'إجمالي الأسر',
      value: stats.totalFamilies,
      subtitle: `${stats.totalMembers} فرد`,
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      variant: 'primary' as const,
      trend: null
    },
    {
      title: 'الأسر النشطة',
      value: stats.activeFamilies,
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: 'success' as const
    },
    {
      title: 'قيد الانتظار',
      value: stats.pendingFamilies,
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      variant: 'warning' as const
    },
    {
      title: 'طلبات النقل',
      value: stats.transferRequests,
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ),
      variant: 'info' as const
    },
    {
      title: 'حالات حرجة',
      value: stats.criticalCases,
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      variant: 'danger' as const
    },
    {
      title: 'حملات نشطة',
      value: stats.activeCampaigns,
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      variant: 'primary' as const
    },
    {
      title: 'أصناف المخزون',
      value: stats.availableInventory,
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
      variant: 'success' as const
    },
    {
      title: 'الموظفين',
      value: stats.staffMembers,
      icon: (
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      variant: 'info' as const
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map((card, idx) => (
        <StatCard key={idx} {...card} />
      ))}
    </div>
  );
};

const StatCard = ({ title, value, subtitle, icon, variant, trend }: {
  title: string;
  value: number;
  subtitle?: string;
  icon: React.ReactNode;
  variant: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  trend?: { value: number; positive: boolean } | null;
}) => {
  const variants = {
    primary: {
      bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100',
      border: 'border-emerald-200',
      iconBg: 'bg-emerald-500',
      text: 'text-emerald-700'
    },
    success: {
      bg: 'bg-gradient-to-br from-teal-50 to-teal-100',
      border: 'border-teal-200',
      iconBg: 'bg-teal-500',
      text: 'text-teal-700'
    },
    warning: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      border: 'border-amber-200',
      iconBg: 'bg-amber-500',
      text: 'text-amber-700'
    },
    danger: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      border: 'border-red-200',
      iconBg: 'bg-red-500',
      text: 'text-red-700'
    },
    info: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      iconBg: 'bg-blue-500',
      text: 'text-blue-700'
    }
  };

  const v = variants[variant];

  return (
    <div className={`${v.bg} ${v.border} border-2 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">{title}</p>
          <p className="text-4xl font-black text-gray-800">{value}</p>
          {subtitle && <p className="text-sm font-bold text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className={`${v.iconBg} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-black ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
          <svg className={`w-4 h-4 ${trend.positive ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          <span>{trend.value}%</span>
        </div>
      )}
    </div>
  );
};

// Charts Section Component
const ChartsSection = ({ distributionData, vulnerabilityData, trendData }: {
  distributionData: any;
  vulnerabilityData: any;
  trendData: any;
}) => {
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          font: {
            family: 'system-ui',
            size: 12
          },
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 12,
        displayColors: true
      }
    },
    scales: {
      x: {
        grid: {
          display: false
        },
        ticks: {
          font: { size: 11 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          font: { size: 11 }
        }
      }
    }
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          font: {
            family: 'system-ui',
            size: 12
          },
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        cornerRadius: 12
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Distribution Progress Chart */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="font-black text-gray-800 text-lg">تقدم التوزيعات</h3>
        </div>
        <div className="h-64">
          {distributionData ? (
            <Bar data={distributionData} options={chartOptions} />
          ) : (
            <EmptyChartState message="لا توجد بيانات حملات" />
          )}
        </div>
      </div>

      {/* Vulnerability Distribution Chart */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            </svg>
          </div>
          <h3 className="font-black text-gray-800 text-lg">توزيع نقاط الضعف</h3>
        </div>
        <div className="h-64">
          {vulnerabilityData && vulnerabilityData.datasets[0].data.some((v: number) => v > 0) ? (
            <Doughnut data={vulnerabilityData} options={pieOptions} />
          ) : (
            <EmptyChartState message="لا توجد بيانات نقاط الضعف" />
          )}
        </div>
      </div>

      {/* Registration Trend Chart */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6 lg:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <h3 className="font-black text-gray-800 text-lg">اتجاه التسجيلات الشهرية</h3>
        </div>
        <div className="h-64">
          {trendData ? (
            <Line data={trendData} options={chartOptions} />
          ) : (
            <EmptyChartState message="لا توجد بيانات تسجيلات" />
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyChartState = ({ message }: { message: string }) => (
  <div className="h-full flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-gray-500 font-bold text-sm">{message}</p>
    </div>
  </div>
);

// Recent Activities Component
const RecentActivitiesSection = ({ activities, navigate }: {
  activities: RecentActivity[];
  navigate: (path: string) => void;
}) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'registration':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        );
      case 'distribution':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'transfer':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        );
      default:
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'registration':
        return 'bg-emerald-100 text-emerald-600';
      case 'distribution':
        return 'bg-blue-100 text-blue-600';
      case 'transfer':
        return 'bg-amber-100 text-amber-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'registration':
        return 'تسجيل أسرة جديدة';
      case 'distribution':
        return 'توزيع مساعدة';
      case 'transfer':
        return 'طلب نقل';
      default:
        return 'تحديث بيانات';
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-black text-gray-800 text-lg">الأنشطة الحديثة</h3>
          </div>
          <button
            onClick={() => navigate('/manager/dp-management')}
            className="text-sm font-black text-emerald-600 hover:text-emerald-700"
          >
            عرض الكل
          </button>
        </div>
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 font-bold">لا توجد أنشطة حديثة</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => activity.familyId && navigate(`/manager/dp-details/${activity.familyId}`)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-800 text-sm">
                    {getActivityText(activity.type)}
                  </p>
                  <p className="text-gray-500 text-xs font-bold mt-1">
                    {activity.familyName || activity.details || 'غير معروف'}
                    {activity.date && ` • ${new Date(activity.date).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                  </p>
                </div>
                {activity.status && (
                  <StatusBadge status={activity.status} />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// Critical Alerts Component
const CriticalAlertsSection = ({ inventoryAlerts, stats, navigate }: {
  inventoryAlerts: InventoryAlert[];
  stats: DashboardStats;
  navigate: (path: string) => void;
}) => {
  const hasAlerts = inventoryAlerts.length > 0 || stats.pendingFamilies > 0 || stats.transferRequests > 0;

  return (
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="font-black text-gray-800 text-lg">تنبيهات هامة</h3>
        </div>
      </div>
      <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
        {!hasAlerts ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-emerald-600 font-black">كل شيء على ما يرام!</p>
            <p className="text-gray-500 font-bold text-sm mt-1">لا توجد تنبيهات حالية</p>
          </div>
        ) : (
          <>
            {/* Pending Approvals Alert */}
            {stats.pendingFamilies > 0 && (
              <div
                className="p-4 hover:bg-amber-50 transition-colors cursor-pointer"
                onClick={() => navigate('/manager/dp-management')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-amber-800 text-sm">
                      {stats.pendingFamilies} أسر بانتظار الموافقة
                    </p>
                    <p className="text-amber-600 text-xs font-bold mt-1">
                      يرجى مراجعة طلبات الانضمام المعلقة
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Transfer Requests Alert */}
            {stats.transferRequests > 0 && (
              <div
                className="p-4 hover:bg-blue-50 transition-colors cursor-pointer"
                onClick={() => navigate('/manager/transfer-requests')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-blue-800 text-sm">
                      {stats.transferRequests} طلبات نقل معلقة
                    </p>
                    <p className="text-blue-600 text-xs font-bold mt-1">
                      يرجى مراجعة طلبات النقل الواردة
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            )}

            {/* Inventory Alerts */}
            {inventoryAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-4 hover:bg-red-50 transition-colors cursor-pointer"
                onClick={() => navigate('/manager/inventory-ledger')}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-black text-red-800 text-sm">
                      {alert.name}
                    </p>
                    <p className="text-red-600 text-xs font-bold mt-1">
                      المتبقي: {alert.quantityAvailable} {alert.unit} (الحد الأدنى: {alert.minAlertThreshold})
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
};

// Status Badge Component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusStyles = (s: string) => {
    switch (s) {
      case 'موافق':
      case 'نشط':
      case 'تم التسليم':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'قيد الانتظار':
      case 'معلق':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'مرفوض':
      case 'ملغي':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-black border-2 ${getStatusStyles(status)}`}>
      {status}
    </span>
  );
};

// Skeleton Loader Component
const DashboardSkeleton = () => (
  <div className="space-y-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
    {/* Hero Header Skeleton */}
    <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-[2.5rem] p-6 md:p-10">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-white/20 rounded-[2rem] animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-6 w-48 bg-white/20 rounded animate-pulse"></div>
            <div className="h-4 w-32 bg-white/20 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="w-12 h-12 bg-white/20 rounded-2xl animate-pulse"></div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/10 rounded-2xl p-4">
            <div className="h-3 w-20 bg-white/20 rounded animate-pulse mb-2"></div>
            <div className="h-8 w-12 bg-white/20 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>

    {/* Search Bar Skeleton */}
    <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
      <div className="h-10 w-full bg-gray-100 rounded-xl animate-pulse"></div>
    </div>

    {/* Quick Actions Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="bg-gray-100 rounded-2xl p-4 h-24 animate-pulse"></div>
      ))}
    </div>

    {/* Stats Cards Skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white rounded-[2rem] border-2 border-gray-100 p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-10 w-16 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="w-14 h-14 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-[2rem] border-2 border-gray-100 p-6">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-64 bg-gray-100 rounded animate-pulse"></div>
        </div>
      ))}
    </div>

    {/* Activities & Alerts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="bg-white rounded-[2rem] border-2 border-gray-100">
          <div className="p-6 border-b">
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="divide-y">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default CampDashboard;
