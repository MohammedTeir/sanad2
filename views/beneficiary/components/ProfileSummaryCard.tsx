// views/beneficiary/components/ProfileSummaryCard.tsx
import React from 'react';
import type { DPProfile } from '../../types';

interface ProfileSummaryCardProps {
  profile: DPProfile;
}

const ProfileSummaryCard: React.FC<ProfileSummaryCardProps> = ({ profile }) => {
  const vulnerabilityConfig = {
    'عالي جداً': { label: 'عالي جداً', color: 'bg-red-50 text-red-700 border-red-200' },
    'عالي': { label: 'عالي', color: 'bg-orange-50 text-orange-700 border-orange-200' },
    'متوسط': { label: 'متوسط', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'منخفض': { label: 'منخفض', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  };

  const statusConfig = {
    'قيد الانتظار': { label: 'قيد الانتظار', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    'موافق': { label: 'موافق عليه', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'مرفوض': { label: 'مرفوض', color: 'bg-red-50 text-red-700 border-red-200' }
  };

  const getFullName = () => {
    if (profile.headFirstName && profile.headFatherName && profile.headGrandfatherName && profile.headFamilyName) {
      return `${profile.headFirstName} ${profile.headFatherName} ${profile.headGrandfatherName} ${profile.headFamilyName}`;
    }
    return profile.headOfFamily;
  };

  // Safe access for vulnerability priority with default
  const vulnPriority = profile.vulnerabilityPriority || 'منخفض';
  const vulnConfig = vulnerabilityConfig[vulnPriority] || vulnerabilityConfig['منخفض'];
  
  // Safe access for registration status with default
  const regStatus = profile.registrationStatus || 'قيد الانتظار';
  const statusCfg = statusConfig[regStatus] || statusConfig['قيد الانتظار'];

  return (
    <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-800 rounded-3xl p-6 md:p-8 text-white shadow-xl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-2">{getFullName()}</h1>
          <p className="text-emerald-100 font-bold text-sm">رقم الهوية: {profile.nationalId}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className={`px-4 py-2 rounded-xl font-black text-sm border-2 ${statusCfg.color}`}>
            {statusCfg.label}
          </span>
          <span className={`px-4 py-2 rounded-xl font-black text-sm border-2 ${vulnConfig.color}`}>
            {vulnConfig.label}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="text-emerald-100 text-xs font-bold mb-1">عدد الأفراد</div>
          <div className="text-3xl font-black">{profile.totalMembersCount || 0}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="text-emerald-100 text-xs font-bold mb-1">الذكور</div>
          <div className="text-3xl font-black">{profile.maleCount || 0}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="text-emerald-100 text-xs font-bold mb-1">الإناث</div>
          <div className="text-3xl font-black">{profile.femaleCount || 0}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
          <div className="text-emerald-100 text-xs font-bold mb-1">درجة الهشاشة</div>
          <div className="text-3xl font-black">{profile.vulnerabilityScore?.toFixed(0) || '0'}</div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-emerald-100 text-xs font-bold mb-1">المخيم</div>
          <div className="font-bold text-sm">{profile.currentHousingGovernorate || 'غير محدد'}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-emerald-100 text-xs font-bold mb-1">رقم الوحدة</div>
          <div className="font-bold text-sm">{profile.unitNumber || 'غير محدد'}</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
          <div className="text-emerald-100 text-xs font-bold mb-1">تاريخ التسجيل</div>
          <div className="font-bold text-sm">
            {profile.registeredDate ? new Date(profile.registeredDate).toLocaleDateString('ar-EG') : 'غير محدد'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSummaryCard;
