// views/camp-manager/StaffManagement.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import { User, Role } from '../../types';
import Toast from '../../components/Toast';
import ConfirmModal from '../../components/ConfirmModal';
import { SearchInput, DateRangeFilter, FilterPanel } from '../../components/filters';
import { normalizeArabic, matchesArabicSearchMulti } from '../../utils/arabicTextUtils';

interface StaffMember extends User {
  lastLogin?: string;
}

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [generatedPassword, setGeneratedPassword] = useState<string>('');

  // Ref to keep currentCampId updated for useCallback closures
  const currentCampIdRef = useRef<string>('');

  useEffect(() => {
    currentCampIdRef.current = currentCampId;
  }, [currentCampId]);

  // Enhanced filters
  const [filterStatus, setFilterStatus] = useState<string>('all'); // active/suspended
  const [filterLastLoginStart, setFilterLastLoginStart] = useState<string>('');
  const [filterLastLoginEnd, setFilterLastLoginEnd] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetPasswordConfirm, setShowResetPasswordConfirm] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);
  const [staffToResetPassword, setStaffToResetPassword] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    password: '',
    isActive: true
  });

  // Load current user's camp ID on mount
  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
    } else {
      setLoading(false);
      setToast({ message: 'لم يتم تحديد المخيم. يرجى تسجيل الدخول كمدير مخيم.', type: 'error' });
    }
  }, []);

  // Load staff members
  const loadStaff = useCallback(async () => {
    try {
      setLoading(true);
      setToast(null);

      if (!currentCampIdRef.current) {
        setToast({ message: 'لم يتم تحديد المخيم. يرجى تسجيل الدخول كمدير مخيم.', type: 'error' });
        setStaff([]);
        setLoading(false);
        return;
      }

      const allUsers = await realDataService.getUsers();

      const campStaff = allUsers.filter((user: User) =>
        user.role === Role.FIELD_OFFICER &&
        user.campId === currentCampIdRef.current
      );

      setStaff(campStaff);
    } catch (err: any) {
      console.error('Error loading staff:', err);
      setToast({ message: err.message || 'فشل تحميل أعضاء الطاقم. تأكد من تشغيل الخادم الخلفي.', type: 'error' });
      setStaff([]);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (currentCampId) {
      loadStaff();
    }
  }, [currentCampId]);

  const generatePassword = (): string => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*';
    
    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    const allChars = uppercase + lowercase + numbers + symbols;
    for (let i = 0; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    return password.split('').sort(() => Math.random() - 0.5).join('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const inputValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

    setFormData(prev => ({
      ...prev,
      [name]: inputValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToast(null);

    try {
      if (editingStaff) {
        // Update existing staff member
        const updates: Partial<User> = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          isActive: formData.isActive
        };

        await realDataService.updateUser(editingStaff.id, updates);
        setToast({ message: 'تم تحديث بيانات عضو الطاقم بنجاح', type: 'success' });
      } else {
        // Create new staff member
        if (!formData.password || formData.password.length < 6) {
          setToast({ message: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', type: 'warning' });
          setSaving(false);
          return;
        }

        const newUser = {
          email: formData.email,
          password: formData.password,
          role: Role.FIELD_OFFICER,
          campId: currentCampId,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          isActive: formData.isActive
        };

        await realDataService.createUser(newUser);
        setToast({ message: 'تم إنشاء عضو الطاقم بنجاح', type: 'success' });
      }

      // Reset form and close modal
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phoneNumber: '',
        password: '',
        isActive: true
      });
      setGeneratedPassword('');
      setEditingStaff(null);
      setShowForm(false);

      await loadStaff();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل حفظ عضو الطاقم', type: 'error' });
      console.error('Error saving staff:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (member: StaffMember) => {
    setEditingStaff(member);
    setFormData({
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      phoneNumber: member.phoneNumber || '',
      isActive: member.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (staffId: string) => {
    setStaffToDelete(staffId);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!staffToDelete) return;
    try {
      await realDataService.deleteUser(staffToDelete);
      setToast({ message: 'تم حذف عضو الطاقم بنجاح', type: 'success' });
      await loadStaff();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل حذف عضو الطاقم', type: 'error' });
      console.error('Error deleting staff:', err);
    } finally {
      setShowDeleteConfirm(false);
      setStaffToDelete(null);
    }
  };

  const handleSuspend = async (staffId: string, currentStatus: boolean) => {
    try {
      await realDataService.updateUser(staffId, {
        isActive: !currentStatus
      });
      setToast({ message: `تم ${!currentStatus ? 'تنشيط' : 'تعليق'} عضو الطاقم بنجاح`, type: 'info' });
      await loadStaff();
    } catch (err: any) {
      setToast({ message: err.message || 'فشل تحديث حالة عضو الطاقم', type: 'error' });
      console.error('Error updating staff status:', err);
    }
  };

  const handleResetPassword = async (staffId: string) => {
    setStaffToResetPassword(staffId);
    setShowResetPasswordConfirm(true);
  };

  const confirmResetPassword = async () => {
    if (!staffToResetPassword) return;
    try {
      const newPassword = generatePassword();
      await realDataService.resetPassword(staffToResetPassword, newPassword);
      setGeneratedPassword(newPassword);
      setToast({ message: 'تم إعادة تعيين كلمة المرور بنجاح', type: 'success' });
    } catch (err: any) {
      setToast({ message: err.message || 'فشل إعادة تعيين كلمة المرور', type: 'error' });
      console.error('Error resetting password:', err);
    } finally {
      setShowResetPasswordConfirm(false);
      setStaffToResetPassword(null);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      isActive: true
    });
    setGeneratedPassword('');
    setEditingStaff(null);
    setShowForm(false);
  };

  const filteredStaff = staff.filter(member => {
    // Arabic-normalized search across multiple fields
    const matchesSearch = searchTerm === '' || matchesArabicSearchMulti(searchTerm, [
      member.firstName,
      member.lastName,
      member.email,
      member.phoneNumber
    ]);
    
    // Status filter
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'نشط' && member.isActive) ||
      (filterStatus === 'موقوف' && !member.isActive);
    
    // Last login date range filter
    const lastLogin = member.lastLogin;
    const matchesLoginStart = filterLastLoginStart === '' || 
      (lastLogin && new Date(lastLogin) >= new Date(filterLastLoginStart));
    
    const matchesLoginEnd = filterLastLoginEnd === '' || 
      (lastLogin && new Date(lastLogin) <= new Date(filterLastLoginEnd));
    
    return matchesSearch && matchesStatus && matchesLoginStart && matchesLoginEnd;
  });

  // Pagination
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStaff = filteredStaff.slice(startIndex, endIndex);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <div className="p-4 sm:p-6 animate-in fade-in duration-500">
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
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف عضو الطاقم هذا؟"
        confirmText="نعم، احذف"
        cancelText="إلغاء"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setStaffToDelete(null);
        }}
      />

      {/* Reset Password Confirmation Modal */}
      <ConfirmModal
        isOpen={showResetPasswordConfirm}
        title="تأكيد إعادة تعيين كلمة المرور"
        message="هل أنت متأكد من إعادة تعيين كلمة المرور لهذا العضو؟"
        confirmText="نعم، أعد التعيين"
        cancelText="إلغاء"
        type="warning"
        onConfirm={confirmResetPassword}
        onCancel={() => {
          setShowResetPasswordConfirm(false);
          setStaffToResetPassword(null);
        }}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mb-1 sm:mb-2">إدارة الطاقم</h1>
          <p className="text-sm sm:text-base text-gray-600 font-bold">إدارة ضباط الميدان في المخيم</p>
        </div>
        <button
          onClick={() => {
            setEditingStaff(null);
            setFormData({
              email: '',
              firstName: '',
              lastName: '',
              phoneNumber: '',
              isActive: true
            });
            setGeneratedPassword('');
            setShowForm(true);
          }}
          className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 sm:px-8 py-3 rounded-xl font-black hover:from-emerald-700 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 text-sm sm:text-base"
        >
          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          إضافة ضابط
        </button>
      </div>

      {/* Generated Password Alert */}
      {generatedPassword && (
        <div className="mb-4 sm:mb-6 p-4 sm:p-6 bg-amber-50 border-2 border-amber-200 rounded-2xl">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-7 h-7 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <div className="flex-1 w-full">
              <h3 className="text-base sm:text-lg font-black text-amber-800 mb-2">⚠️ كلمة المرور المؤقتة</h3>
              <div className="bg-white rounded-xl p-3 sm:p-4 mb-3 border-2 border-amber-300 overflow-x-auto">
                <p className="text-xl sm:text-3xl font-mono tracking-wider text-center text-amber-900 font-black break-all">{generatedPassword}</p>
              </div>
              <p className="text-xs sm:text-sm text-amber-700 font-bold mb-3">يرجى نسخ كلمة المرور وإبلاغها لعضو الطاقم بشكل آمن. لن تظهر مرة أخرى.</p>
              <button
                onClick={() => setGeneratedPassword('')}
                className="text-xs sm:text-sm text-amber-800 font-black underline hover:text-amber-900 transition-colors"
              >
                إخفاء كلمة المرور
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Filter Panel */}
      <FilterPanel
        title="تصفية أعضاء الطاقم"
        activeFilters={[
          ...(searchTerm ? [{ id: 'search', label: `بحث: "${searchTerm}"`, value: searchTerm, onRemove: () => setSearchTerm('') }] : []),
          ...(filterStatus !== 'all' ? [{ id: 'status', label: `الحالة: ${filterStatus === 'نشط' ? 'نشط' : 'موقوف'}`, value: filterStatus, onRemove: () => setFilterStatus('all') }] : []),
          ...(filterLastLoginStart || filterLastLoginEnd ? [{ id: 'loginRange', label: `تسجيل الدخول من ${filterLastLoginStart || '...'} إلى ${filterLastLoginEnd || '...'}`, value: 'loginRange', onRemove: () => { setFilterLastLoginStart(''); setFilterLastLoginEnd(''); } }] : [])
        ]}
        onClearAll={() => {
          setSearchTerm('');
          setFilterStatus('all');
          setFilterLastLoginStart('');
          setFilterLastLoginEnd('');
        }}
        defaultOpen={showFilters}
        iconColor="emerald"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search Input with Arabic Normalization */}
          <div className="lg:col-span-3">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="ابحث باسم العضو، البريد الإلكتروني، رقم الهاتف..."
              iconColor="emerald"
              showArabicHint
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-black text-gray-700 mb-2">الحالة</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold"
            >
              <option value="all">الجميع</option>
              <option value="نشط">نشط</option>
              <option value="موقوف">موقوف</option>
            </select>
          </div>

          {/* Last Login Date Range */}
          <div className="md:col-span-2">
            <DateRangeFilter
              label="آخر تسجيل دخول"
              startDate={filterLastLoginStart}
              endDate={filterLastLoginEnd}
              onChange={(start, end) => {
                setFilterLastLoginStart(start);
                setFilterLastLoginEnd(end);
              }}
              presetRanges={[
                { label: 'اليوم', value: 'today' },
                { label: 'آخر 7 أيام', value: 'last7days' },
                { label: 'آخر 30 يوم', value: 'last30days' },
                { label: 'هذا الشهر', value: 'thisMonth' }
              ]}
            />
          </div>
        </div>
      </FilterPanel>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  {['الاسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الحالة', 'آخر تسجيل دخول', 'الإجراءات'].map((header, i) => (
                    <th key={i} className="px-6 py-4">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...Array(10)].map((_, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    {[...Array(6)].map((_, j) => (
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
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-right text-sm font-black text-gray-700">الاسم</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-gray-700">البريد الإلكتروني</th>
                    <th className="px-6 py-4 text-right text-sm font-black text-gray-700">رقم الهاتف</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الحالة</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-gray-700">آخر تسجيل دخول</th>
                    <th className="px-6 py-4 text-center text-sm font-black text-gray-700">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentStaff.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <p className="text-gray-500 font-black text-lg">لا يوجد أعضاء طاقم</p>
                          {searchTerm && (
                            <p className="text-gray-400 font-bold text-sm">جرب البحث بكلمات أخرى</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentStaff.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-black text-lg">
                              {member.firstName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-black text-gray-800">{member.firstName} {member.lastName}</p>
                              <p className="text-xs text-gray-500 font-bold">ضابط ميدان</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700 font-bold">{member.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700 font-bold">{member.phoneNumber || '-'}</p>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleSuspend(member.id, member.isActive)}
                            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                              member.isActive
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                            {member.isActive ? 'نشط' : 'معلق'}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <p className="text-sm text-gray-600 font-bold">
                            {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString('ar-EG', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'لم يسجل دخول'}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleEdit(member)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="تعديل"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleResetPassword(member.id)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                              title="إعادة تعيين كلمة المرور"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              title="حذف"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {currentStaff.length === 0 ? (
              <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-black text-lg">لا يوجد أعضاء طاقم</p>
                  {searchTerm && (
                    <p className="text-gray-400 font-bold text-sm">جرب البحث بكلمات أخرى</p>
                  )}
                </div>
              </div>
            ) : (
              currentStaff.map((member) => (
                <div key={member.id} className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-4">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center text-white font-black text-xl flex-shrink-0">
                      {member.firstName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-800 text-lg truncate">{member.firstName} {member.lastName}</p>
                      <p className="text-xs text-gray-500 font-bold">ضابط ميدان</p>
                    </div>
                    <button
                      onClick={() => handleSuspend(member.id, member.isActive)}
                      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-bold text-xs transition-all flex-shrink-0 ${
                        member.isActive
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`}></span>
                      {member.isActive ? 'نشط' : 'معلق'}
                    </button>
                  </div>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className="text-gray-700 font-bold truncate">{member.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13 2.257a1 1 0 01-.502 1.21H9a1 1 0 01-1-1V5z" />
                      </svg>
                      <span className="text-gray-700 font-bold">{member.phoneNumber || '-'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-600 font-bold text-xs">
                        {member.lastLogin ? new Date(member.lastLogin).toLocaleDateString('ar-EG', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : 'لم يسجل دخول'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => handleEdit(member)}
                      className="flex-1 py-2.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      تعديل
                    </button>
                    <button
                      onClick={() => handleResetPassword(member.id)}
                      className="flex-1 py-2.5 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      كلمة المرور
                    </button>
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="flex-1 py-2.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      حذف
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-center items-center gap-3">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-emerald-500 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="hidden sm:inline">السابق</span>
          </button>
          <span className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-black text-sm sm:text-base">
            صفحة {currentPage} من {totalPages}
          </span>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-full sm:w-auto px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 hover:border-emerald-500 transition-all flex items-center justify-center gap-2"
          >
            <span className="hidden sm:inline">التالي</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl transform transition-all my-8 mx-auto">
            <div className="p-4 sm:p-8 border-b-2 border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg sm:text-2xl font-black text-gray-800 truncate">
                    {editingStaff ? 'تعديل ضابط ميداني' : 'إضافة ضابط ميداني جديد'}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 font-bold">
                    {editingStaff ? 'تحديث بيانات العضو' : 'إنشاء حساب جديد لعضو الطاقم'}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2">البريد الإلكتروني *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={!!editingStaff}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm sm:text-base disabled:bg-gray-100"
                    placeholder="example@domain.com"
                  />
                  {editingStaff && (
                    <p className="text-xs text-gray-500 font-bold mt-1">لا يمكن تغيير البريد الإلكتروني</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2">الاسم الأول *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm sm:text-base"
                    placeholder="الاسم الأول"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2">الاسم الأخير *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm sm:text-base"
                    placeholder="الاسم الأخير"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    placeholder="0599123456"
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm sm:text-base"
                  />
                </div>

                {!editingStaff && (
                  <div className="md:col-span-2">
                    <label className="block text-xs sm:text-sm font-black text-gray-700 mb-2">كلمة المرور *</label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      required
                      minLength={6}
                      className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm sm:text-base"
                      placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                    />
                    <p className="text-xs text-gray-500 font-bold mt-1">يجب أن تكون 6 أحرف على الأقل</p>
                  </div>
                )}

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500 border-2 border-gray-300"
                    />
                    <span className="font-black text-gray-700 text-sm sm:text-base">نشط</span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6 mt-4 sm:mt-6 border-t-2 border-gray-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all text-sm sm:text-base"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-black hover:from-emerald-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl text-sm sm:text-base"
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
                    editingStaff ? 'تحديث' : 'إضافة'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">تأكيد الحذف</h3>
              <p className="text-gray-600 font-bold text-sm">هل أنت متأكد من حذف هذا العضو؟ لا يمكن التراجع عن هذا الإجراء.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setStaffToDelete(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black hover:from-red-700 hover:to-red-800 transition-all shadow-lg"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Password Confirmation Modal */}
      {showResetPasswordConfirm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">تأكيد إعادة تعيين كلمة المرور</h3>
              <p className="text-gray-600 font-bold text-sm">هل أنت متأكد من إعادة تعيين كلمة مرور هذا العضو؟ سيتم إنشاء كلمة مرور جديدة.</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetPasswordConfirm(false);
                  setStaffToResetPassword(null);
                }}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={confirmResetPassword}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-black hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg"
              >
                نعم، أعد التعيين
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
