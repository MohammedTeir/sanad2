// views/camp-manager/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { getCurrentUser, removeAuthToken } from '../../utils/authUtils';
import { realDataService } from '../../services/realDataServiceBackend';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import Toast from '../../components/Toast';
import {
  ProfileHeader,
  ProfileSection,
  ProfileField,
  PasswordChangeModal,
  SecuritySettings
} from '../shared/profile';

interface User {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  phone_number?: string;
  role: string;
  camp_id?: string;
  camp_name?: string;
  is_active: boolean;
  created_at: string;
  last_login?: string;
}

interface Camp {
  id: string;
  name: string;
  status?: string;
}

const ProfilePage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [campInfo, setCampInfo] = useState<Camp | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  // Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: ''
  });

  // Password change modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Scroll to top when page loads
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const currentUser = getCurrentUser();
      console.log('Current user from session:', currentUser);

      if (!currentUser || !currentUser.id) {
        console.error('No user found in session');
        return;
      }

      // Fetch current user profile data directly from backend
      const currentUserData = await makeAuthenticatedRequest('/users/profile');
      console.log('Current user data from backend:', currentUserData);

      if (currentUserData) {
        setUser(currentUserData);
        setFormData({
          firstName: currentUserData.first_name || '',
          lastName: currentUserData.last_name || '',
          phoneNumber: currentUserData.phone_number || ''
        });

        // Fetch camp info if user has camp_id using the dedicated endpoint
        if (currentUserData.camp_id) {
          try {
            const camp = await makeAuthenticatedRequest('/camps/my-camp');
            if (camp) {
              setCampInfo(camp);
            }
          } catch (err) {
            console.error('Error loading camp info:', err);
          }
        }

        console.log('Last login value:', currentUserData.last_login);

        // Update last login if not set or old (without reloading)
        if (!currentUserData.last_login) {
          console.log('Last login is null, updating...');
          makeAuthenticatedRequest('/auth/update-last-login', {
            method: 'POST',
            body: JSON.stringify({ userId: currentUserData.id })
          })
          .then(data => {
            console.log('Last login updated:', data);
            // Update the user state directly instead of reloading
            setUser(prev => prev ? { ...prev, last_login: new Date().toISOString() } : null);
          })
          .catch(console.error);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveProfile = async () => {
    setSaving(true);

    try {
      const currentUser = getCurrentUser();
      if (!currentUser || !currentUser.id) {
        throw new Error('User ID not found');
      }

      // Update user via backend
      await realDataService.updateUser(currentUser.id, {
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: formData.phoneNumber
      });

      setToast({ message: '✅ تم حفظ التغييرات بنجاح', type: 'success' });
      setIsEditing(false);

      setTimeout(() => {
        loadProfile();
      }, 2000);
    } catch (error) {
      console.error('Error saving profile:', error);
      setToast({ message: '❌ فشل حفظ التغييرات: ' + (error as any).message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (currentPassword: string, newPassword: string) => {
    const currentUser = getCurrentUser();
    if (!currentUser || !currentUser.id) {
      console.error('User ID not found');
      throw new Error('❌ لم يتم العثور على معرف المستخدم');
    }

    console.log('Changing password for user:', currentUser.id);

    const response = await makeAuthenticatedRequest('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        userId: currentUser.id,
        currentPassword,
        newPassword
      })
    });

    console.log('Password change response:', response);
    
    // Log out user after successful password change for security
    removeAuthToken();
    
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 2000);
    
    return { success: true, message: 'تم تغيير كلمة المرور بنجاح. سيتم تسجيل الخروج...' };
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Profile Header Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-4 md:p-6 lg:p-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gray-200 rounded-2xl animate-pulse flex-shrink-0"></div>
            <div className="space-y-2 flex-1">
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-4 w-60 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Profile Form Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-4 md:p-6 lg:p-8">
          <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>

        {/* Camp Info Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-4 md:p-6 lg:p-8">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>
        </div>

        {/* Security Section Skeleton */}
        <div className="bg-white rounded-[2rem] border shadow-sm p-4 md:p-6 lg:p-8">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6"></div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Toast Notifications */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Profile Header */}
      <ProfileHeader
        firstName={user?.first_name}
        lastName={user?.last_name}
        email={user?.email || ''}
        role={user?.role || ''}
        isEditing={isEditing}
        gradientFrom="from-emerald-500"
        gradientTo="to-emerald-600"
        onEditToggle={() => setIsEditing(!isEditing)}
        campName={campInfo?.name}
      />

      {/* Profile Information Section */}
      <ProfileSection
        title="المعلومات الشخصية"
        icon={
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        }
        iconBgColor="bg-emerald-100"
        iconTextColor="text-emerald-600"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <ProfileField
            label="الاسم الأول"
            value={user?.first_name || '-'}
            isEditing={isEditing}
            inputValue={formData.firstName}
            onInputChange={handleInputChange}
            inputName="firstName"
            placeholder="أدخل الاسم الأول"
          />

          <ProfileField
            label="اسم العائلة"
            value={user?.last_name || '-'}
            isEditing={isEditing}
            inputValue={formData.lastName}
            onInputChange={handleInputChange}
            inputName="lastName"
            placeholder="أدخل اسم العائلة"
          />

          <ProfileField
            label="البريد الإلكتروني"
            value={user?.email || '-'}
            isEditing={false}
            icon={
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />

          <ProfileField
            label="رقم الهاتف"
            value={user?.phone_number || '-'}
            isEditing={isEditing}
            inputType="tel"
            inputValue={formData.phoneNumber}
            onInputChange={handleInputChange}
            inputName="phoneNumber"
            placeholder="أدخل رقم الهاتف"
          />

          <ProfileField
            label="المنصب"
            value={
              <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs border-2 ${
                user?.role === 'SYSTEM_ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                user?.role === 'CAMP_MANAGER' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                user?.role === 'FIELD_OFFICER' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                user?.role === 'BENEFICIARY' ? 'bg-gray-100 text-gray-700 border-gray-200' :
                'bg-amber-100 text-amber-700 border-amber-200'
              }`}>
                {user?.role === 'SYSTEM_ADMIN' ? 'مدير النظام' :
                 user?.role === 'CAMP_MANAGER' ? 'مدير المخيم' :
                 user?.role === 'FIELD_OFFICER' ? 'موظف ميداني' :
                 user?.role === 'BENEFICIARY' ? 'مستفيد' :
                 'مراقب مانح'}
              </span>
            }
            isEditing={false}
          />

          <ProfileField
            label="المخيم"
            value={
              campInfo?.name ? (
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{campInfo.name}</span>
                </div>
              ) : 'غير محدد'
            }
            isEditing={false}
          />

          <ProfileField
            label="الحالة"
            value={
              user?.is_active ? (
                <span className="inline-flex items-center gap-2 text-emerald-700">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  نشط
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 text-gray-500">
                  <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                  غير نشط
                </span>
              )
            }
            isEditing={false}
          />

          <ProfileField
            label="تاريخ الإنشاء"
            value={user?.created_at ? new Date(user.created_at).toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : '-'}
            isEditing={false}
          />

          <ProfileField
            label="آخر دخول"
            value={user?.last_login ? new Date(user.last_login).toLocaleString('ar-EG', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            }) : 'لم يسبق الدخول'}
            isEditing={false}
          />
        </div>

        {isEditing && (
          <div className="mt-6 pt-6 border-t flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all active:scale-95"
            >
              إلغاء
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex-1 px-6 py-3 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg active:scale-95"
            >
              {saving ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري الحفظ...
                </span>
              ) : (
                'حفظ التغييرات'
              )}
            </button>
          </div>
        )}
      </ProfileSection>

      {/* Camp Information Card */}
      {campInfo && (
        <ProfileSection
          title="معلومات المخيم"
          icon={
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          iconBgColor="bg-emerald-100"
          iconTextColor="text-emerald-600"
        >
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border-2 border-emerald-200 p-4 md:p-6">
            <div className="flex items-start gap-3 md:gap-4">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-black text-gray-800 text-base md:text-lg mb-2">{campInfo.name}</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    مخيم نشط
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs font-black">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    مدير المخيم
                  </span>
                </div>
              </div>
            </div>
          </div>
        </ProfileSection>
      )}

      {/* Security Settings Section */}
      <ProfileSection
        title="الأمان"
        icon={
          <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        }
        iconBgColor="bg-red-100"
        iconTextColor="text-red-600"
      >
        <SecuritySettings
          onChangePasswordClick={() => setShowPasswordModal(true)}
          gradientFrom="from-emerald-500"
          gradientTo="to-emerald-600"
          lastLogin={user?.last_login}
        />
      </ProfileSection>

      {/* Password Change Modal */}
      <PasswordChangeModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSubmit={handleChangePassword}
        onShowToast={(message, type) => setToast({ message, type })}
      />
    </div>
  );
};

export default ProfilePage;
