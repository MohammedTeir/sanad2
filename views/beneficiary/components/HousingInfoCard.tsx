// views/beneficiary/components/HousingInfoCard.tsx
import React from 'react';
import type { DPProfile } from '../../types';

interface HousingInfoCardProps {
  profile: DPProfile;
}

const HousingInfoCard: React.FC<HousingInfoCardProps> = ({ profile }) => {
  const getUtilityIcon = (type: string) => {
    switch (type) {
      case 'water':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        );
      case 'electricity':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'sanitary':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
    }
  };

  const housingSuitability = profile.currentHousingIsSuitable ?? profile.currentHousing?.isSuitableForFamilySize;
  const sanitaryFacilities = profile.currentHousingSanitaryFacilities || profile.currentHousing?.sanitaryFacilities;
  const waterSource = profile.currentHousingWaterSource || profile.currentHousing?.waterSource;
  const electricityAccess = profile.currentHousingElectricityAccess || profile.currentHousing?.electricityAccess;

  return (
    <div className="space-y-4">
      {/* Original Housing */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
        <h3 className="font-black text-gray-800 text-base mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          السكن الأصلي (قبل النزوح)
        </h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-bold mb-1">المحافظة</div>
              <div className="font-bold text-sm text-gray-800">
                {profile.originalAddressGovernorate || profile.originalAddress?.governorate || 'غير محدد'}
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-bold mb-1">المنطقة</div>
              <div className="font-bold text-sm text-gray-800">
                {profile.originalAddressRegion || profile.originalAddress?.region || 'غير محدد'}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 font-bold mb-1">العنوان بالتفصيل</div>
            <div className="font-bold text-sm text-gray-800">
              {profile.originalAddressDetails || profile.originalAddress?.details || 'غير محدد'}
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 font-bold mb-1">نوع السكن</div>
            <div className="font-bold text-sm text-gray-800">
              {profile.originalAddressHousingType || profile.originalAddress?.housingType || 'غير محدد'}
            </div>
          </div>
        </div>
      </div>

      {/* Current Housing */}
      <div className="bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl border-2 border-emerald-200 p-4">
        <h3 className="font-black text-gray-800 text-base mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
          السكن الحالي (في المخيم)
        </h3>
        <div className="space-y-3">
          {/* Housing Type */}
          <div className="bg-white rounded-xl p-3">
            <div className="text-xs text-gray-500 font-bold mb-2">نوع السكن</div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-black text-sm">
                {profile.currentHousingType || profile.currentHousing?.type || 'غير محدد'}
              </span>
              {profile.currentHousingSharingStatus && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg font-black text-sm">
                  {profile.currentHousingSharingStatus}
                </span>
              )}
              {profile.currentHousingDetailedType && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg font-black text-sm">
                  {profile.currentHousingDetailedType}
                </span>
              )}
            </div>
          </div>

          {/* Location Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl p-3">
              <div className="text-xs text-gray-500 font-bold mb-1">المحافظة</div>
              <div className="font-bold text-sm text-gray-800">
                {profile.currentHousingGovernorate || profile.currentHousing?.governorate || 'غير محدد'}
              </div>
            </div>
            <div className="bg-white rounded-xl p-3">
              <div className="text-xs text-gray-500 font-bold mb-1">المنطقة</div>
              <div className="font-bold text-sm text-gray-800">
                {profile.currentHousingRegion || profile.currentHousing?.region || 'غير محدد'}
              </div>
            </div>
          </div>

          {profile.currentHousingLandmark || profile.currentHousing?.landmark ? (
            <div className="bg-white rounded-xl p-3">
              <div className="text-xs text-gray-500 font-bold mb-1">أقرب معلم</div>
              <div className="font-bold text-sm text-gray-800">
                {profile.currentHousingLandmark || profile.currentHousing?.landmark}
              </div>
            </div>
          ) : null}

          {/* Unit Number */}
          <div className="bg-white rounded-xl p-3">
            <div className="text-xs text-gray-500 font-bold mb-1">رقم الخيمة/الوحدة</div>
            <div className="font-bold text-sm text-gray-800">
              {profile.unitNumber || profile.currentHousing?.unitNumber || 'غير محدد'}
            </div>
          </div>

          {/* Suitability */}
          <div className={`rounded-xl p-3 ${housingSuitability ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <div className="flex items-center gap-2">
              <span className="text-lg">{housingSuitability ? '✅' : '⚠️'}</span>
              <span className={`font-bold text-sm ${housingSuitability ? 'text-emerald-700' : 'text-amber-700'}`}>
                {housingSuitability ? 'السكن مناسب لعدد الأفراد' : 'السكن غير مناسب لعدد الأفراد'}
              </span>
            </div>
          </div>

          {/* Utilities */}
          <div className="grid grid-cols-3 gap-2">
            {sanitaryFacilities && (
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{getUtilityIcon('sanitary')}</div>
                <div className="text-xs text-gray-500 font-bold mb-1">المرافق</div>
                <div className="font-bold text-xs text-gray-800">{sanitaryFacilities}</div>
              </div>
            )}
            {waterSource && (
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{getUtilityIcon('water')}</div>
                <div className="text-xs text-gray-500 font-bold mb-1">المياه</div>
                <div className="font-bold text-xs text-gray-800">{waterSource}</div>
              </div>
            )}
            {electricityAccess && (
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{getUtilityIcon('electricity')}</div>
                <div className="text-xs text-gray-500 font-bold mb-1">الكهرباء</div>
                <div className="font-bold text-xs text-gray-800">{electricityAccess}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Refugee/Resident Abroad */}
      {profile.refugeeResidentAbroad && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
          <h3 className="font-black text-gray-800 text-base mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            لاجئ / مقيم بالخارج
          </h3>
          <div className="space-y-2">
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-xs text-gray-500 font-bold mb-1">الدولة</div>
              <div className="font-bold text-sm text-gray-800">{profile.refugeeResidentAbroad.country}</div>
            </div>
            {profile.refugeeResidentAbroad.city && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 font-bold mb-1">المدينة</div>
                <div className="font-bold text-sm text-gray-800">{profile.refugeeResidentAbroad.city}</div>
              </div>
            )}
            {profile.refugeeResidentAbroad.residenceType && (
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 font-bold mb-1">نوع الإقامة</div>
                <div className="font-bold text-sm text-gray-800">{profile.refugeeResidentAbroad.residenceType}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HousingInfoCard;
