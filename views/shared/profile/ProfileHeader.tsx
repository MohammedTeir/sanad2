// views/shared/profile/ProfileHeader.tsx
import React from 'react';

interface ProfileHeaderProps {
  firstName?: string;
  lastName?: string;
  email: string;
  role: string;
  isEditing: boolean;
  gradientFrom: string;
  gradientTo: string;
  onEditToggle: () => void;
  campName?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  firstName,
  lastName,
  email,
  role,
  isEditing,
  gradientFrom,
  gradientTo,
  onEditToggle,
  campName
}) => {
  const getInitial = () => {
    return firstName?.[0] || email?.[0] || 'U';
  };

  const getRoleDisplay = (role: string) => {
    const roles: Record<string, string> = {
      'SYSTEM_ADMIN': 'مدير النظام',
      'CAMP_MANAGER': 'مدير المخيم',
      'FIELD_OFFICER': 'موظف ميداني',
      'BENEFICIARY': 'مستفيد',
      'DONOR_OBSERVER': 'مراقب مانح'
    };
    return roles[role] || role;
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      'SYSTEM_ADMIN': 'bg-purple-100 text-purple-700 border-purple-200',
      'CAMP_MANAGER': 'bg-blue-100 text-blue-700 border-blue-200',
      'FIELD_OFFICER': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'BENEFICIARY': 'bg-gray-100 text-gray-700 border-gray-200',
      'DONOR_OBSERVER': 'bg-amber-100 text-amber-700 border-amber-200'
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="bg-white rounded-[2rem] border shadow-sm p-4 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        {/* Avatar and Name Section */}
        <div className="flex items-center gap-3 md:gap-4 lg:gap-6 w-full md:w-auto">
          {/* Avatar */}
          <div className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 bg-gradient-to-br ${gradientFrom} ${gradientTo} rounded-2xl flex items-center justify-center text-white text-2xl md:text-3xl lg:text-4xl font-black shadow-lg flex-shrink-0`}>
            {getInitial()}
          </div>

          {/* Name and Details */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <h1 className="text-lg md:text-xl lg:text-2xl font-black text-gray-800 truncate">
                {firstName} {lastName}
              </h1>
              <span className={`inline-block px-2 py-1 md:px-3 md:py-1 rounded-lg font-black text-[10px] md:text-xs border-2 whitespace-nowrap ${getRoleBadgeColor(role)}`}>
                {getRoleDisplay(role)}
              </span>
            </div>
            <p className="text-gray-500 text-xs md:text-sm font-bold mt-1 truncate">{email}</p>
            {campName && (
              <p className="text-blue-600 text-xs font-bold mt-1 flex items-center gap-1">
                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{campName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Edit Button */}
        <button
          onClick={onEditToggle}
          className={`w-full md:w-auto flex items-center justify-center gap-2 px-4 md:px-6 py-3 bg-emerald-500 text-white rounded-xl font-black hover:bg-emerald-600 transition-all shadow-lg active:scale-95 md:active:scale-100`}
        >
          <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <span className="text-sm md:text-base">{isEditing ? 'إلغاء' : 'تعديل الملف'}</span>
        </button>
      </div>
    </div>
  );
};
