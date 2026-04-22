// views/shared/profile/ProfileSection.tsx
import React from 'react';

interface ProfileSectionProps {
  title: string;
  icon: React.ReactNode;
  iconBgColor?: string;
  iconTextColor?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  icon,
  iconBgColor = 'bg-orange-100',
  iconTextColor = 'text-orange-600',
  children,
  actions,
  className = ''
}) => {
  return (
    <div className={`bg-white rounded-[2rem] border shadow-sm p-4 md:p-6 lg:p-8 ${className}`}>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 md:w-12 md:h-12 ${iconBgColor} ${iconTextColor} rounded-xl flex items-center justify-center flex-shrink-0`}>
            {icon}
          </div>
          <h2 className="text-lg md:text-xl font-black text-gray-800">{title}</h2>
        </div>
        {actions && (
          <div className="flex-shrink-0">
            {actions}
          </div>
        )}
      </div>

      {/* Section Content */}
      <div>
        {children}
      </div>
    </div>
  );
};
