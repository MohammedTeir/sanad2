import React, { useState, useEffect } from 'react';
import { realDataService } from '../../services/realDataServiceBackend';
import { User, Role, Camp } from '../../types';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';

interface ExtendedUser extends User {
  phoneNumber?: string;
  createdAt?: string;
  campName?: string;
}

const UserManagement = () => {
  const [users, setUsers] = useState<ExtendedUser[]>([]);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<ExtendedUser | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'FIELD_OFFICER' as Role,
    campId: '',
    isActive: true
  });

  const [editUser, setEditUser] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    role: 'FIELD_OFFICER' as Role,
    campId: '',
    isActive: true,
    email: '',
    newPassword: '',
    confirmPassword: ''
  });

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
      const [loadedUsers, loadedCamps] = await Promise.all([
        realDataService.getUsers(),
        realDataService.getCamps()
      ]);
      
      // Map snake_case to camelCase for consistency
      const mappedUsers = (Array.isArray(loadedUsers) ? loadedUsers : []).map((user: any) => ({
        ...user,
        firstName: user.first_name || user.firstName,
        lastName: user.last_name || user.lastName,
        phoneNumber: user.phone_number || user.phoneNumber,
        createdAt: user.created_at || user.createdAt,
        campId: user.camp_id || user.campId,
        isActive: user.is_active !== undefined ? user.is_active : (user.isActive !== undefined ? user.isActive : true)
      }));
      
      setUsers(mappedUsers);
      setCamps(Array.isArray(loadedCamps) ? loadedCamps : []);
    } catch (err) {
      console.error("Error loading data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { 
    loadData(); 
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.role) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    if ((newUser.role === 'CAMP_MANAGER' || newUser.role === 'FIELD_OFFICER') && !newUser.campId) {
      setErrorMessage("يرجى اختيار المخيم لهذا المستخدم");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      setErrorMessage("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    if (newUser.password !== newUser.confirmPassword) {
      setErrorMessage("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
      return;
    }

    if (newUser.password.length < 6) {
      setErrorMessage("يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل");
      return;
    }
    
    setIsCreating(true);
    try {
      await makeAuthenticatedRequest('/users', {
        method: 'POST',
        body: JSON.stringify({
          email: newUser.email,
          password: newUser.password,
          role: newUser.role,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          phoneNumber: newUser.phoneNumber,
          campId: newUser.campId || null,
          isActive: newUser.isActive
        })
      });

      setShowAddModal(false);
      setNewUser({
        email: '', password: '', confirmPassword: '', firstName: '',
        lastName: '', phoneNumber: '', role: 'FIELD_OFFICER', campId: '', isActive: true
      });
      setSuccessMessage("تم إنشاء المستخدم بنجاح!");
      loadData();
    } catch (err) {
      console.error('User creation error:', err);
      setErrorMessage("خطأ في إنشاء المستخدم: " + (err as Error).message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    if (!editUser.firstName || !editUser.role || !editUser.email) {
      setErrorMessage("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editUser.email)) {
      setErrorMessage("يرجى إدخال بريد إلكتروني صحيح");
      return;
    }

    // Validate password if changing
    if (editUser.newPassword || editUser.confirmPassword) {
      if (editUser.newPassword !== editUser.confirmPassword) {
        setErrorMessage("كلمة المرور وتأكيد كلمة المرور غير متطابقين");
        return;
      }
      if (editUser.newPassword.length < 6) {
        setErrorMessage("يجب أن تكون كلمة المرور مكونة من 6 أحرف على الأقل");
        return;
      }
    }

    if ((editUser.role === 'CAMP_MANAGER' || editUser.role === 'FIELD_OFFICER') && !editUser.campId) {
      setErrorMessage("يرجى اختيار المخيم لهذا المستخدم");
      return;
    }

    setIsUpdating(true);
    try {
      const updateData: any = {
        first_name: editUser.firstName,
        last_name: editUser.lastName,
        phone_number: editUser.phoneNumber,
        camp_id: editUser.campId || null,
        is_active: editUser.isActive,
        email: editUser.email,
        role: editUser.role,
        updated_at: new Date().toISOString()
      };

      // Add password if changing
      if (editUser.newPassword) {
        updateData.password = editUser.newPassword;
      }

      await makeAuthenticatedRequest(`/users/${selectedUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });

      setShowEditModal(false);
      setSelectedUser(null);
      loadData();
      setSuccessMessage("تم تحديث المستخدم بنجاح!");
    } catch (err) {
      console.error('User update error:', err);
      setErrorMessage("خطأ في تحديث المستخدم: " + (err as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async (user: ExtendedUser) => {
    setSelectedUser(user);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!selectedUser) return;

    setIsDeleting(true);
    try {
      await makeAuthenticatedRequest(`/users/${selectedUser.id}`, {
        method: 'DELETE',
      });

      setSuccessMessage("تم حذف المستخدم بنجاح!");
      setShowDeleteConfirm(false);
      setSelectedUser(null);
      loadData();
    } catch (err) {
      console.error('User delete error:', err);
      setErrorMessage("خطأ في حذف المستخدم: " + (err as Error).message);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteUser = () => {
    setShowDeleteConfirm(false);
    setSelectedUser(null);
  };

  const handleEditUser = (user: ExtendedUser) => {
    setSelectedUser(user);
    setEditUser({
      firstName: user.firstName || user.first_name || '',
      lastName: user.lastName || user.last_name || '',
      phoneNumber: user.phoneNumber || user.phone_number || '',
      role: user.role as Role,
      campId: (user as any).campId || (user as any).camp_id || '',
      isActive: user.isActive !== undefined ? user.isActive : ((user as any).is_active !== undefined ? (user as any).is_active : true),
      email: user.email || '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowEditModal(true);
  };

  const handleViewUser = (user: ExtendedUser) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  // Filter users
  const filteredUsers = users.filter(user => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
    const matchesSearch = 
      fullName.includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'نشط' ? user.isActive : !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'مدير النظام';
      case 'CAMP_MANAGER': return 'مدير المخيم';
      case 'FIELD_OFFICER': return 'موظف ميداني';
      case 'BENEFICIARY': return 'مستفيد';
      case 'DONOR_OBSERVER': return 'مراقب مانح';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'CAMP_MANAGER': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'FIELD_OFFICER': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getCampName = (campId: string) => {
    const camp = camps.find(c => c.id === campId);
    return camp ? camp.name : 'غير مرتبط';
  };

  if (loading) return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Skeleton */}
      <div className="bg-white rounded-[2rem] border shadow-sm p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
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
      </div>

      {/* Users Table Skeleton */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {['الاسم', 'البريد الإلكتروني', 'الدور', 'المخيم', 'الحالة', 'تاريخ الإنشاء', 'الإجراءات'].map((header, i) => (
                  <th key={i} className="px-6 py-4">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mx-auto"></div>
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
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              إدارة المستخدمين
            </h1>
            <p className="text-gray-500 text-sm font-bold mt-1 mr-12">إدارة شاملة لجميع حسابات المستخدمين والصلاحيات</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            إضافة مستخدم
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
                placeholder="بحث بالاسم أو البريد..."
                className="w-full pl-4 pr-10 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm"
              />
              <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm bg-white"
            >
              <option value="all">جميع الأدوار</option>
              <option value="SYSTEM_ADMIN">مدير النظام</option>
              <option value="CAMP_MANAGER">مدير المخيم</option>
              <option value="FIELD_OFFICER">موظف ميداني</option>
            </select>
          </div>
          
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-sm bg-white"
            >
              <option value="all">جميع الحالات</option>
              <option value="نشط">نشط</option>
              <option value="معلق">معلق</option>
            </select>
          </div>
          
          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setSearchQuery('');
                setRoleFilter('all');
                setStatusFilter('all');
              }}
              className="px-4 py-3 text-gray-600 font-bold text-sm hover:bg-gray-100 rounded-xl transition-colors"
            >
              إعادة تعيين
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div className="bg-purple-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-purple-600">{users.filter(u => u.role === 'SYSTEM_ADMIN').length}</p>
            <p className="text-xs font-bold text-purple-700 mt-1">مدير النظام</p>
          </div>
          <div className="bg-blue-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-blue-600">{users.filter(u => u.role === 'CAMP_MANAGER').length}</p>
            <p className="text-xs font-bold text-blue-700 mt-1">مدير مخيم</p>
          </div>
          <div className="bg-emerald-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-emerald-600">{users.filter(u => u.role === 'FIELD_OFFICER').length}</p>
            <p className="text-xs font-bold text-emerald-700 mt-1">موظف ميداني</p>
          </div>
          <div className="bg-amber-50 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-amber-600">{users.filter(u => !u.isActive).length}</p>
            <p className="text-xs font-bold text-amber-700 mt-1">معلق</p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-[2rem] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b-2 border-gray-100">
              <tr>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">المستخدم</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">الدور</th>
                <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-wider">المخيم</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">الحالة</th>
                <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-wider">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-black text-lg">
                        {(user.firstName || user.email)[0]}
                      </div>
                      <div>
                        <p className="font-black text-gray-800">
                          {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
                        </p>
                        <p className="text-xs text-gray-400 font-bold">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs border-2 ${getRoleColor(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {(user as any).campId || (user as any).camp_id ? (
                      <p className="font-bold text-gray-700 text-sm">{getCampName((user as any).campId || (user as any).camp_id)}</p>
                    ) : (
                      <p className="text-gray-400 font-bold text-sm">-</p>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`inline-block px-3 py-1 rounded-lg font-black text-xs ${
                      user.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {user.isActive ? 'نشط' : 'معلق'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {user.role !== 'SYSTEM_ADMIN' ? (
                        <>
                          <button
                            onClick={() => handleViewUser(user)}
                            className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-100 transition-colors"
                            title="عرض"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleEditUser(user)}
                            className="w-9 h-9 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center hover:bg-amber-100 transition-colors"
                            title="تعديل"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={isDeleting}
                            className="w-9 h-9 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors disabled:opacity-50"
                            title="حذف"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 font-bold">مدير النظام</span>
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
                    <p className="text-gray-400 font-black">لا توجد مستخدمين مطابقين</p>
                    <p className="text-gray-300 text-sm font-bold mt-1">حاول تغيير معايير البحث أو الفلترة</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
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
                <p className="text-red-600 font-black text-sm">"{selectedUser.email}"</p>
              </div>

              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-black text-red-800">تحذير!</p>
                    <p className="text-xs text-red-700 font-bold mt-1">
                      هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المستخدم وجميع البيانات المرتبطة به نهائياً.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs font-bold text-gray-500 mb-3">معلومات المستخدم</p>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-400">الاسم</p>
                    <p className="font-bold text-gray-700 text-sm">{selectedUser.firstName || selectedUser.first_name} {selectedUser.lastName || selectedUser.last_name}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-400">البريد الإلكتروني</p>
                    <p className="font-bold text-gray-700 text-sm">{selectedUser.email}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-xs text-gray-400">الدور</p>
                    <p className="font-bold text-gray-700 text-sm">{getRoleLabel(selectedUser.role)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={cancelDeleteUser}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={confirmDeleteUser}
                disabled={isDeleting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-black hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    حذف المستخدم
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-emerald-600 text-white p-4 md:p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-black">إضافة مستخدم جديد</h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-lg md:rounded-xl flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">الاسم الأول <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={newUser.firstName}
                    onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                    placeholder="أحمد"
                    disabled={isCreating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">اسم العائلة</label>
                  <input
                    type="text"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                    placeholder="محمد"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                  placeholder="user@example.com"
                  disabled={isCreating}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">كلمة المرور <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
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
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({ ...newUser, confirmPassword: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                    placeholder="******"
                    disabled={isCreating}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">الدور <span className="text-red-500">*</span></label>
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm bg-white"
                    disabled={isCreating}
                  >
                    <option value="SYSTEM_ADMIN">مدير النظام</option>
                    <option value="FIELD_OFFICER">موظف ميداني</option>
                    <option value="CAMP_MANAGER">مدير المخيم (لمخيم موجود)</option>
                  </select>
                  <p className="text-xs text-gray-400 font-bold mt-1">
                    ⚠️ لإنشاء مخيم جديد مع مديره، استخدم صفحة "إدارة المخيمات"
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={newUser.phoneNumber}
                    onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-bold text-gray-800 text-sm"
                    placeholder="059xxxxxxx"
                    disabled={isCreating}
                  />
                </div>
              </div>

              {newUser.role === 'CAMP_MANAGER' || newUser.role === 'FIELD_OFFICER' ? (
                <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                  <label className="block text-sm font-black text-blue-800 mb-2">المخيم <span className="text-red-500">*</span></label>
                  <select
                    value={newUser.campId}
                    onChange={(e) => setNewUser({ ...newUser, campId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold text-gray-800 text-sm bg-white"
                    disabled={isCreating}
                  >
                    <option value="">اختر المخيم</option>
                    {camps.map((camp) => (
                      <option key={camp.id} value={camp.id}>{camp.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 font-bold mt-1">
                    ℹ️ {newUser.role === 'CAMP_MANAGER' ? 'سيتم تعيين هذا المستخدم كمدير للمخيم المختار' : 'سيتم ربط هذا الموظف الميداني بالمخيم المختار'}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newUser.isActive}
                  onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 rounded focus:ring-emerald-500"
                  disabled={isCreating}
                />
                <label htmlFor="isActive" className="text-sm font-black text-gray-700">تفعيل الحساب فوراً</label>
              </div>

              <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-black text-amber-800">ملاحظة مهمة</p>
                  <p className="text-xs text-amber-600 font-bold mt-1">سيتم إنشاء الحساب بكلمة مرور مؤقتة. يجب على المستخدم تغييرها عند أول دخول</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 flex justify-end gap-3 flex-shrink-0 border-t">
              <button onClick={() => setShowAddModal(false)} className="px-6 md:px-8 py-3 bg-white text-gray-700 rounded-xl font-black border-2 border-gray-200 hover:bg-gray-100 transition-all text-sm md:text-base" disabled={isCreating}>إلغاء</button>
              <button
                onClick={handleCreateUser}
                disabled={isCreating || !newUser.email || !newUser.password || !newUser.firstName || !newUser.role}
                className="px-6 md:px-8 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm md:text-base"
              >
                {isCreating ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>جاري الإنشاء...</>
                ) : (
                  <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>إنشاء المستخدم</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-amber-600 text-white p-4 md:p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-black">تعديل المستخدم</h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-lg md:rounded-xl flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-5 max-h-[65vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">الاسم الأول <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={editUser.firstName}
                    onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm"
                    disabled={isUpdating}
                  />
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">اسم العائلة</label>
                  <input
                    type="text"
                    value={editUser.lastName}
                    onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-black text-gray-700 mb-2">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => setEditUser({ ...editUser, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm"
                  disabled={isUpdating}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">الدور <span className="text-red-500">*</span></label>
                  <select
                    value={editUser.role}
                    onChange={(e) => setEditUser({ ...editUser, role: e.target.value as Role })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm bg-white"
                    disabled={isUpdating}
                  >
                    <option value="SYSTEM_ADMIN">مدير النظام</option>
                    <option value="FIELD_OFFICER">موظف ميداني</option>
                    <option value="CAMP_MANAGER">مدير المخيم (لمخيم موجود)</option>
                  </select>
                  <p className="text-xs text-amber-600 font-bold mt-1">⚠️ فقط مدير النظام يمكنه تغيير الأدوار</p>
                </div>
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2">رقم الهاتف</label>
                  <input
                    type="tel"
                    value={editUser.phoneNumber}
                    onChange={(e) => setEditUser({ ...editUser, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {editUser.role === 'CAMP_MANAGER' || editUser.role === 'FIELD_OFFICER' ? (
                <div className="bg-blue-50 border-2 border-blue-100 rounded-xl p-4">
                  <label className="block text-sm font-black text-blue-800 mb-2">المخيم <span className="text-red-500">*</span></label>
                  <select
                    value={editUser.campId}
                    onChange={(e) => setEditUser({ ...editUser, campId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-blue-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all font-bold text-gray-800 text-sm bg-white"
                    disabled={isUpdating}
                  >
                    <option value="">اختر المخيم</option>
                    {camps.map((camp) => (
                      <option key={camp.id} value={camp.id}>{camp.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-blue-600 font-bold mt-1">
                    ℹ️ {editUser.role === 'CAMP_MANAGER' ? 'سيتم تعيين هذا المستخدم كمدير للمخيم المختار' : 'سيتم ربط هذا الموظف الميداني بالمخيم المختار'}
                  </p>
                </div>
              ) : null}

              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editUser.isActive}
                  onChange={(e) => setEditUser({ ...editUser, isActive: e.target.checked })}
                  className="w-5 h-5 text-amber-600 rounded focus:ring-amber-500"
                  disabled={isUpdating}
                />
                <label htmlFor="editIsActive" className="text-sm font-black text-gray-700">الحساب نشط</label>
              </div>

              {/* Password Change Section */}
              <div className="border-t-2 border-dashed border-gray-200 pt-5 mt-5">
                <h4 className="text-sm font-black text-gray-700 mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  تغيير كلمة المرور
                </h4>
                <p className="text-xs text-gray-500 font-bold mb-4">اترك الحقول فارغة إذا لم ترغب في تغيير كلمة المرور</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">كلمة المرور الجديدة</label>
                    <input
                      type="password"
                      value={editUser.newPassword}
                      onChange={(e) => setEditUser({ ...editUser, newPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm"
                      placeholder="اتركه فارغاً للإبقاء على كلمة المرور الحالية"
                      disabled={isUpdating}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-gray-700 mb-2">تأكيد كلمة المرور</label>
                    <input
                      type="password"
                      value={editUser.confirmPassword}
                      onChange={(e) => setEditUser({ ...editUser, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all font-bold text-gray-800 text-sm"
                      placeholder="أكد كلمة المرور الجديدة"
                      disabled={isUpdating}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border-2 border-blue-100 rounded-2xl p-4 flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-black text-blue-800">ملاحظة</p>
                  <p className="text-xs text-blue-600 font-bold mt-1">يمكنك تغيير البريد الإلكتروني وكلمة المرور في أي وقت. يجب أن تكون كلمة المرور 6 أحرف على الأقل.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 md:p-6 flex justify-end gap-3 flex-shrink-0 border-t">
              <button onClick={() => setShowEditModal(false)} className="px-6 md:px-8 py-3 bg-white text-gray-700 rounded-xl font-black border-2 border-gray-200 hover:bg-gray-100 transition-all text-sm md:text-base" disabled={isUpdating}>إلغاء</button>
              <button
                onClick={handleUpdateUser}
                disabled={isUpdating || !editUser.firstName || !editUser.role || !editUser.email}
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

      {/* View User Modal */}
      {showViewModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-blue-600 text-white p-4 md:p-6 flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center">
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h3 className="text-lg md:text-xl font-black">تفاصيل المستخدم</h3>
              </div>
              <button onClick={() => setShowViewModal(false)} className="w-8 h-8 md:w-10 md:h-10 bg-white/20 hover:bg-white/30 rounded-lg md:rounded-xl flex items-center justify-center transition-colors">
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 md:p-6 space-y-3 md:space-y-4 overflow-y-auto max-h-[70vh]">
              {/* Profile Header */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center font-black text-2xl shadow-sm">
                  {(selectedUser.firstName || selectedUser.email)[0]}
                </div>
                <div>
                  <p className="font-black text-gray-800 text-lg">
                    {selectedUser.firstName ? `${selectedUser.firstName} ${selectedUser.lastName || ''}` : selectedUser.email}
                  </p>
                  <p className="text-sm text-gray-500 font-bold">{selectedUser.email}</p>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold mb-1">الاسم الأول</p>
                  <p className="font-black text-gray-800">{selectedUser.firstName || selectedUser.first_name || '-'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold mb-1">اسم العائلة</p>
                  <p className="font-black text-gray-800">{selectedUser.lastName || selectedUser.last_name || '-'}</p>
                </div>
              </div>

              {/* Contact Info */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-bold mb-1">البريد الإلكتروني</p>
                <p className="font-black text-gray-800">{selectedUser.email}</p>
              </div>

              {selectedUser.phoneNumber && (
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-500 font-bold mb-1">رقم الهاتف</p>
                  <p className="font-black text-gray-800">{selectedUser.phoneNumber}</p>
                </div>
              )}

              {/* Role & Status */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border-2 border-blue-200">
                  <p className="text-xs text-blue-600 font-bold mb-1">الدور</p>
                  <p className="font-black text-blue-900">{getRoleLabel(selectedUser.role)}</p>
                </div>
                <div className={`p-4 rounded-xl border-2 ${selectedUser.isActive ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200' : 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200'}`}>
                  <p className="text-xs text-gray-600 font-bold mb-1">الحالة</p>
                  <p className={`font-black ${selectedUser.isActive ? 'text-emerald-900' : 'text-gray-900'}`}>{selectedUser.isActive ? 'نشط ✓' : 'معلق ⏸'}</p>
                </div>
              </div>

              {/* Camp Assignment */}
              {(selectedUser as any).campId || (selectedUser as any).camp_id ? (
                <div className="p-4 bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl border-2 border-amber-200">
                  <p className="text-xs text-amber-600 font-bold mb-1">المخيم</p>
                  <p className="font-black text-amber-900">{getCampName((selectedUser as any).campId || (selectedUser as any).camp_id)}</p>
                </div>
              ) : null}

              {/* Created Date */}
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-bold mb-1">تاريخ الإنشاء</p>
                <p className="font-black text-gray-800">{new Date(selectedUser.createdAt || Date.now()).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setShowViewModal(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-all"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  setShowViewModal(false);
                  handleEditUser(selectedUser);
                }}
                className="flex-1 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-black hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg flex items-center justify-center gap-2 text-sm md:text-base"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                تعديل
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
