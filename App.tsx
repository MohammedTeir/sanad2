
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { Role } from './types';
import { ICONS } from './constants';
import { RTLProvider } from './contexts/RTLContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { makeAuthenticatedRequest } from './utils/apiUtils';
import ErrorBoundary from './components/ErrorBoundary';
import CollapsibleSidebarGroup from './components/CollapsibleSidebarGroup';
import Toast from './components/Toast';

// Views - Admin
import SystemAdminDashboard from './views/admin/SystemAdminDashboard';
import CampsManagement from './views/admin/CampsManagement';
import OnboardingManagement from './views/admin/OnboardingManagement';
import UserManagement from './views/admin/UserManagement';
import SystemConfigurationHub from './views/admin/SystemConfigurationHub';
import AuditLogViewer from './views/admin/AuditLogViewer';
import GlobalBackupCenter from './views/admin/GlobalBackupCenter';
import AdminProfilePage from './views/admin/ProfilePage';
import AdminDPManagement from './views/admin/DPManagement';
import AdminDPDetails from './views/admin/DPDetails';
import DeletedRecordsViewer from './views/admin/DeletedRecordsViewer';

// Views - Camp Manager
import CampDashboard from './views/camp-manager/CampDashboard';
import StaffManagement from './views/camp-manager/StaffManagement';
import AidCampaigns from './views/camp-manager/AidCampaigns';
import InventoryLedger from './views/camp-manager/InventoryLedger';
import DistributionList from './views/camp-manager/DistributionList';
import DistributionDetails from './views/camp-manager/DistributionDetails';
import DistributionHistory from './views/camp-manager/DistributionHistory';
import DistributionManagement from './views/camp-manager/DistributionManagement';
import DPManagement from './views/camp-manager/DPManagement';
import DPDetails from './views/camp-manager/DPDetails';
import TransferRequests from './views/camp-manager/TransferRequests';
import AidTypesConfig from './views/camp-manager/AidTypesConfig';
import InventoryItemsSetup from './views/camp-manager/InventoryItemsSetup';
import CampManagerProfilePage from './views/camp-manager/ProfilePage';
import ComplaintsManagement from './views/camp-manager/ComplaintsManagement';
import EmergencyReportsManagement from './views/camp-manager/EmergencyReportsManagement';
import SpecialAssistanceManagement from './views/camp-manager/SpecialAssistanceManagement';

// Views - Beneficiary
import DPPortal from './views/beneficiary/DPPortal';
// Note: ComplaintsFeedbackForm, EmergencyReporting are now integrated into DPPortal

// Views - Field Officer
import FieldOfficerDashboard from './views/field-officer/FieldOfficerDashboard';
import RegisterFamily from './views/field-officer/RegisterFamily';
import DistributionScannerMode from './views/field-officer/DistributionScannerMode';
import FamilySearch from './views/field-officer/FamilySearch';
import EmergencyReportForm from './views/field-officer/EmergencyReportForm';

// Views - Donor Observer
import DonorObserverDashboard from './views/donor/DonorObserverDashboard';

// Views - Shared
import Login from './views/shared/Login';
import PendingApproval from './views/shared/PendingApproval';
import CampOnboarding from './views/shared/CampOnboarding';
import MaintenancePage from './components/MaintenancePage';

// Utils
import { isAuthenticated, getCurrentUser, removeAuthToken } from './utils/authUtils';

// Independent Sidebar Component
const Sidebar = ({ role, onLogout, isOpen, setIsOpen }: { role: Role, onLogout: () => void, isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  
  // Helper component for simple menu items (non-categorized)
  const SimpleMenuItem = ({ item }: { item: { label: string, icon: any, path: string } }) => (
    <li>
      <Link to={item.path} onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${location.pathname === item.path ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-gray-500 hover:bg-emerald-50'}`}>
        <item.icon className="w-5 h-5" />
        {item.label}
      </Link>
    </li>
  );

  const menuItems = {
    [Role.SYSTEM_ADMIN]: [
      { label: 'الرئيسية', icon: ICONS.Home, path: '/admin' },
      { label: 'إدارة المخيمات', icon: ICONS.Home, path: '/admin/camps' },
      { label: 'طلبات الانضمام', icon: ICONS.Users, path: '/admin/onboarding' },
      { label: 'إدارة العائلات', icon: ICONS.Users, path: '/admin/dp-management' },
      { label: 'إدارة المستخدمين', icon: ICONS.Users, path: '/admin/users' },
      { label: 'إعدادات النظام', icon: ICONS.Settings, path: '/admin/settings' },
      { label: 'سجل التدقيق', icon: ICONS.Chart, path: '/admin/audit-log' },
      { label: 'مركز النسخ الاحتياطي', icon: ICONS.Inventory, path: '/admin/backup' },
      { label: 'السجلات المحذوفة', icon: ICONS.Inventory, path: '/admin/deleted-records' },
      { label: 'الملف الشخصي', icon: ICONS.Users, path: '/admin/profile' },
    ],
    [Role.CAMP_MANAGER]: {
      categories: [
        {
          title: 'الرئيسية',
          icon: ICONS.Home,
          items: [
            { label: 'لوحة التحكم', icon: ICONS.Home, path: '/manager' },
            { label: 'الملف الشخصي', icon: ICONS.Users, path: '/manager/profile' },
          ]
        },
        {
          title: 'إدارة العائلات',
          icon: ICONS.Users,
          items: [
            { label: 'إدارة العائلات', icon: ICONS.Users, path: '/manager/dp-management' },
            { label: 'طلبات النقل', icon: ICONS.Inventory, path: '/manager/transfer-requests' },
          ]
        },
        {
          title: 'المخزون والمساعدات',
          icon: ICONS.Inventory,
          items: [
            { label: 'أنواع المساعدات', icon: ICONS.Inventory, path: '/manager/aid-types' },
            { label: 'أصناف المخزون', icon: ICONS.Inventory, path: '/manager/inventory-items' },
            { label: 'حملات المساعدات', icon: ICONS.Inventory, path: '/manager/aid-campaigns' },
            { label: 'سجل المخزون', icon: ICONS.Inventory, path: '/manager/inventory-ledger' },
          ]
        },
        {
          title: 'التوزيعات',
          icon: ICONS.Chart,
          items: [
            { label: 'إدارة التوزيع', icon: ICONS.Inventory, path: '/manager/distribution' },
            { label: 'سجل التوزيعات', icon: ICONS.Inventory, path: '/manager/distribution-history' },
          ]
        },
        {
          title: 'الطاقم',
          icon: ICONS.Users,
          items: [
            { label: 'إدارة الموظفين', icon: ICONS.Users, path: '/manager/staff' },
          ]
        },
        {
          title: 'الشكاوى والبلاغات',
          icon: ICONS.Chart,
          items: [
            { label: 'الشكاوى', icon: ICONS.Users, path: '/manager/complaints' },
            { label: 'بلاغات الطوارئ', icon: ICONS.Chart, path: '/manager/emergency-reports' },
            { label: 'طلبات المساعدة', icon: ICONS.Inventory, path: '/manager/special-assistance' },
          ]
        },
      ]
    },
    [Role.FIELD_OFFICER]: [
      { label: 'الرئيسية', icon: ICONS.Home, path: '/field' },
      { label: 'تسجيل ميداني', icon: ICONS.Users, path: '/field/register' },
      { label: 'بحث عن أسرة', icon: ICONS.Users, path: '/field/search' },
      { label: 'مسح التوزيع', icon: ICONS.Inventory, path: '/field/scan' },
      { label: 'بلاغ طارئ', icon: ICONS.Chart, path: '/field/emergency-report' },
    ],
    [Role.DONOR_OBSERVER]: [
      { label: 'لوحة التحكم', icon: ICONS.Home, path: '/donor' },
      { label: 'الرئيسية', icon: ICONS.Dashboard, path: '/donor/dashboard' },
      { label: 'التقارير', icon: ICONS.Chart, path: '/donor/reports' },
    ],
    [Role.BENEFICIARY]: [
      { label: 'الملف الشخصي', icon: ICONS.Home, path: '/beneficiary' },
      // All features now accessible via tabs in the single-page portal
    ],
  };

  // Use a default role if none is provided to prevent errors
  const safeRole = role || Role.SYSTEM_ADMIN;
  const campManagerMenu = menuItems[Role.CAMP_MANAGER];

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />}
      <div className={`fixed right-0 top-0 h-full bg-white border-l shadow-sm z-50 transition-transform duration-300 w-64 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">س</div>
            <h1 className="text-xl font-bold text-emerald-800 font-black">سند</h1>
          </div>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {safeRole === Role.CAMP_MANAGER && campManagerMenu && 'categories' in campManagerMenu ? (
              // Categorized menu for Camp Manager
              campManagerMenu.categories.map((category: any, idx: number) => (
                <CollapsibleSidebarGroup
                  key={idx}
                  title={category.title}
                  icon={category.icon}
                  items={category.items}
                  defaultExpanded={idx === 0} // Expand first category by default
                  locationPathname={location.pathname}
                />
              ))
            ) : (
              // Simple flat menu for other roles
              menuItems[safeRole]?.map((item, idx) => (
                <SimpleMenuItem key={idx} item={item} />
              ))
            )}
          </ul>
        </nav>
        <div className="p-4 border-t mt-auto">
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 font-black text-sm transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
             تسجيل الخروج
          </button>
        </div>
      </div>
    </>
  );
};

const Layout = ({ children, role, onLogout }: any) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Provide a default role if none is provided to prevent errors
  const safeRole = role || Role.SYSTEM_ADMIN;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-row-reverse">
      <Sidebar role={safeRole} onLogout={onLogout} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 flex flex-col min-w-0 mr-0 lg:mr-64 transition-all duration-300">
        <header className="bg-white border-b px-4 md:px-6 py-4 flex justify-between items-center sticky top-0 z-30">
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 text-emerald-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg></button>
            <h2 className="font-black text-gray-800 text-sm md:text-base">
               {safeRole === Role.SYSTEM_ADMIN ? 'الإشراف المركزي' : safeRole === Role.CAMP_MANAGER ? 'إدارة المخيم' : safeRole === Role.DONOR_OBSERVER ? 'مراقب المانحين' : 'الميدان'}
            </h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
             <span className="hidden md:inline-block text-[10px] bg-gray-100 px-3 py-1 rounded-full font-black text-gray-400 uppercase tracking-widest">{safeRole}</span>
             <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-inner">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
             </div>
          </div>
        </header>
        <main className="p-3 md:p-6 lg:p-8 flex-1 w-full">{children}</main>
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<{ role: Role, id?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [showPendingApproval, setShowPendingApproval] = useState(false);

  // Toast notifications for login/logout
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Logout confirmation modal
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const checkedUserRef = useRef<string | null>(null);

  const handleLogin = (role: Role, id?: string) => {
    setUser({ role, id });

    // Show success toast based on role
    const roleNames = {
      [Role.SYSTEM_ADMIN]: 'الإشراف المركزي',
      [Role.CAMP_MANAGER]: 'مدير المخيم',
      [Role.FIELD_OFFICER]: 'ضابط الميدان',
      [Role.BENEFICIARY]: 'المستفيد',
      [Role.DONOR_OBSERVER]: 'مراقب المانحين'
    };

    setSuccessMessage(`تم تسجيل الدخول بنجاح - ${roleNames[role]}`);

    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);

    // Note: Camp status check is handled by useEffect after user state is updated
    // This prevents duplicate API calls
  };

  const handleLogout = () => {
    // Show logout confirmation modal instead of direct logout
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    removeAuthToken();
    setUser(null);
    setSuccessMessage('تم تسجيل الخروج بنجاح');
    setShowLogoutConfirm(false);
    
    // Auto-clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // Initialize authentication state from localStorage
  // Note: AuthContext handles the actual auth verification to prevent duplicate calls
  useEffect(() => {
    try {
      // Check if user is already authenticated from localStorage
      const currentUser = getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Camp status check will be triggered by the useEffect below when user state updates
      }
    } catch (error) {
      console.error('Error during authentication check:', error);
      // Clear any problematic tokens from localStorage
      localStorage.removeItem('auth_token');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check camp status when user state changes (for camp managers)
  // This is consolidated into a single function to prevent duplicate API calls
  const checkCampStatus = useCallback(async (currentUser: { role: Role }) => {
    // Only check for camp managers
    if (!currentUser || currentUser.role !== Role.CAMP_MANAGER) {
      return;
    }

    try {
      console.log('[checkCampStatus] Calling /camps/my-camp...');
      const campData = await makeAuthenticatedRequest('/camps/my-camp', {
        method: 'GET',
      });
      console.log('[checkCampStatus] Camp data received:', campData);

      // Check if response indicates maintenance mode
      if (campData.maintenanceMode && currentUser.role !== 'SYSTEM_ADMIN') {
        setIsMaintenanceMode(true);
        return;
      }

      if (campData.status === 'قيد الانتظار') {
        setShowPendingApproval(true);
        // Remove the auth token since the user shouldn't have access
        removeAuthToken();
        setUser(null);
      }
    } catch (error: any) {
      console.error('[checkCampStatus] Error:', error);
      console.error('[checkCampStatus] Error status:', error?.status);
      console.error('[checkCampStatus] Error message:', error?.message);
      console.error('[checkCampStatus] Error data:', error?.data);
      // If there's an error getting camp info (e.g., no camp associated),
      // clear the token and show error
      if (error?.status === 404 || error?.message?.includes('No camp')) {
        removeAuthToken();
        setUser(null);
        setErrorMessage('لم يتم تحديد المخيم. يرجى تسجيل الدخول كمدير مخيم.');
      }
    }
  }, []);

  // Trigger camp status check when user state updates
  useEffect(() => {
    if (user && user.role === Role.CAMP_MANAGER) {
      // Only check if we haven't checked for this specific user yet
      const userKey = `${user.id}-${user.role}`;
      if (checkedUserRef.current !== userKey) {
        checkedUserRef.current = userKey;
        checkCampStatus(user);
      }
    } else if (!user) {
      checkedUserRef.current = null;
    }
  }, [user, checkCampStatus]);

  // Protected route component
  const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" />;
    }

    // Check if user is a camp manager with a pending camp
    if (user.role === Role.CAMP_MANAGER) {
      // We need to verify the camp status by making an API call
      // This check happens after the user is already authenticated
      // We'll do this by checking the user's camp status when the component mounts
    }

    return <>{children}</>;
  };

  return (
    <LanguageProvider>
      <RTLProvider>
        <ErrorBoundary>
          {/* Toast Notifications */}
          {successMessage && (
            <Toast
              message={successMessage}
              type="success"
              onClose={() => setSuccessMessage(null)}
            />
          )}
          {errorMessage && (
            <Toast
              message={errorMessage}
              type="error"
              onClose={() => setErrorMessage(null)}
            />
          )}

          {/* Logout Confirmation Modal */}
          {showLogoutConfirm && (
            <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-black text-gray-800 mb-2">تأكيد تسجيل الخروج</h3>
                  <p className="text-gray-600 font-bold text-sm">هل أنت متأكد من تسجيل الخروج؟</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={confirmLogout}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
                  >
                    نعم، خروج
                  </button>
                </div>
              </div>
            </div>
          )}

          <Router>
            <Routes>
              <Route path="/login" element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} />
              <Route path="/register-family" element={<RegisterFamily />} />
              <Route path="/register-camp" element={<CampOnboarding />} />
              <Route path="/pending-approval" element={<PendingApproval />} />
              {showPendingApproval ? (
                <Route path="/*" element={<PendingApproval />} />
              ) : isMaintenanceMode && user?.role !== 'SYSTEM_ADMIN' ? (
                <Route path="/*" element={<MaintenancePage onLogout={handleLogout} />} />
              ) : (
                <Route path="/*" element={
                  <ProtectedRoute>
                    {user && user.role === Role.BENEFICIARY ? (
                      <DPPortal onLogout={handleLogout} />
                    ) : user ? (
                      <Layout role={user.role} onLogout={handleLogout}>
                        <Routes>
                          {user.role === Role.SYSTEM_ADMIN && (
                            <>
                              <Route path="/admin" element={<SystemAdminDashboard section="overview" />} />
                              <Route path="/admin/camps" element={<CampsManagement />} />
                              <Route path="/admin/onboarding" element={<OnboardingManagement />} />
                              <Route path="/admin/dp-management" element={<AdminDPManagement />} />
                              <Route path="/admin/dp-details/:id" element={<AdminDPDetails />} />
                              <Route path="/admin/users" element={<UserManagement />} />
                              <Route path="/admin/settings" element={<SystemConfigurationHub />} />
                              <Route path="/admin/audit-log" element={<AuditLogViewer />} />
                              <Route path="/admin/backup" element={<GlobalBackupCenter />} />
                              <Route path="/admin/deleted-records" element={<DeletedRecordsViewer />} />
                              <Route path="/admin/profile" element={<AdminProfilePage />} />
                              <Route path="*" element={<Navigate to="/admin" />} />
                            </>
                          )}
                          {user.role === Role.CAMP_MANAGER && (
                            <>
                              <Route path="/manager" element={<CampDashboard section="overview" />} />
                              <Route path="/manager/staff" element={<StaffManagement />} />
                              <Route path="/manager/aid-types" element={<AidTypesConfig />} />
                              <Route path="/manager/inventory-items" element={<InventoryItemsSetup />} />
                              <Route path="/manager/aid-campaigns" element={<AidCampaigns />} />
                              <Route path="/manager/inventory-ledger" element={<InventoryLedger />} />
                              <Route path="/manager/distribution" element={<DistributionList />} />
                              <Route path="/manager/distribution/:campaignId" element={<DistributionDetails />} />
                              <Route path="/manager/distribution-history" element={<DistributionHistory />} />
                              <Route path="/manager/distribution-management" element={<DistributionManagement />} />
                              <Route path="/manager/dp-management" element={<DPManagement />} />
                              <Route path="/manager/dp-details/:id" element={<DPDetails />} />
                              <Route path="/manager/transfer-requests" element={<TransferRequests />} />
                              <Route path="/manager/complaints" element={<ComplaintsManagement />} />
                              <Route path="/manager/emergency-reports" element={<EmergencyReportsManagement />} />
                              <Route path="/manager/special-assistance" element={<SpecialAssistanceManagement />} />
                              <Route path="/manager/profile" element={<CampManagerProfilePage />} />
                              <Route path="*" element={<Navigate to="/manager" />} />
                            </>
                          )}
                          {user.role === Role.FIELD_OFFICER && (
                            <>
                              <Route path="/field" element={<FieldOfficerDashboard section="overview" />} />
                              <Route path="/field/register" element={<FieldOfficerDashboard section="register" />} />
                              <Route path="/field/confirm" element={<FieldOfficerDashboard section="confirm" />} />
                              <Route path="/field/scan" element={<DistributionScannerMode />} />
                              <Route path="/field/search" element={<FamilySearch />} />
                              <Route path="/field/emergency-report" element={<EmergencyReportForm />} />
                              <Route path="/field/register-family" element={<RegisterFamily />} />
                              <Route path="*" element={<Navigate to="/field" />} />
                            </>
                          )}
                          {user.role === Role.BENEFICIARY && (
                            <>
                              <Route path="/beneficiary" element={<DPPortal onLogout={handleLogout} />} />
                              <Route path="/beneficiary/*" element={<DPPortal onLogout={handleLogout} />} />
                              <Route path="*" element={<Navigate to="/beneficiary" />} />
                            </>
                          )}
                          {user.role === Role.DONOR_OBSERVER && (
                            <>
                              <Route path="/donor" element={<DonorObserverDashboard section="overview" />} />
                              <Route path="/donor/reports" element={<DonorObserverDashboard section="reports" />} />
                              <Route path="/donor/dashboard" element={<DonorObserverDashboard section="dashboard" />} />
                              <Route path="*" element={<Navigate to="/donor" />} />
                            </>
                          )}
                        </Routes>
                      </Layout>
                    ) : (
                      // Fallback while user is being determined
                      <div className="min-h-screen flex items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
                      </div>
                    )}
                  </ProtectedRoute>
                } />
              )}
            </Routes>
          </Router>
        </ErrorBoundary>
      </RTLProvider>
    </LanguageProvider>
  );
}
