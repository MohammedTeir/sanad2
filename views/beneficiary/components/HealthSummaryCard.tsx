// views/beneficiary/components/HealthSummaryCard.tsx
import React from 'react';
import type { DPProfile } from '../../types';

interface HealthSummaryCardProps {
  profile: DPProfile;
}

const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({ profile }) => {
  const getHealthIcon = (type: string) => {
    switch (type) {
      case 'disability':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        );
      case 'chronic':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        );
      case 'injury':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'followup':
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
    }
  };

  const healthStats = [
    {
      label: 'ذوي إعاقة',
      count: profile.disabledCount || 0,
      type: 'disability',
      color: 'bg-red-50 text-red-700 border-red-200'
    },
    {
      label: 'أمراض مزمنة',
      count: profile.chronicCount || 0,
      type: 'chronic',
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    {
      label: 'إصابات حرب',
      count: profile.injuredCount || 0,
      type: 'injury',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    },
    {
      label: 'متابعة طبية',
      count: profile.medicalFollowupCount || 0,
      type: 'followup',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    }
  ];

  return (
    <div className="space-y-4">
      {/* Family Health Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {healthStats.map((stat) => (
          <div 
            key={stat.type}
            className={`rounded-2xl p-4 border-2 text-center ${stat.color}`}
          >
            <div className="flex justify-center mb-2">{getHealthIcon(stat.type)}</div>
            <div className="text-3xl font-black mb-1">{stat.count}</div>
            <div className="text-xs font-bold">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Head of Family Health */}
      <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
        <h3 className="font-black text-gray-800 text-base mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          صحة رب الأسرة
        </h3>
        <div className="space-y-2">
          {profile.disabilityType && profile.disabilityType !== 'لا يوجد' ? (
            <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
              <span className="text-sm font-bold text-red-700">إعاقة: {profile.disabilityType}</span>
              {profile.disabilitySeverity && (
                <span className="text-xs font-black text-red-600 bg-red-100 px-2 py-1 rounded-lg">
                  {profile.disabilitySeverity}
                </span>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl">
              <span className="text-sm font-bold text-emerald-700">✅ لا يوجد إعاقة</span>
            </div>
          )}

          {profile.chronicDiseaseType && profile.chronicDiseaseType !== 'لا يوجد' ? (
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <span className="text-sm font-bold text-orange-700">مرض مزمن: {profile.chronicDiseaseType}</span>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl">
              <span className="text-sm font-bold text-emerald-700">✅ لا يوجد أمراض مزمنة</span>
            </div>
          )}

          {profile.warInjuryType && profile.warInjuryType !== 'لا يوجد' ? (
            <div className="p-3 bg-amber-50 rounded-xl">
              <span className="text-sm font-bold text-amber-700">إصابة حرب: {profile.warInjuryType}</span>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl">
              <span className="text-sm font-bold text-emerald-700">✅ لا يوجد إصابات حرب</span>
            </div>
          )}

          {profile.medicalFollowupRequired ? (
            <div className="p-3 bg-blue-50 rounded-xl">
              <div className="text-sm font-bold text-blue-700 mb-1">⚕️ يحتاج متابعة طبية</div>
              {profile.medicalFollowupFrequency && (
                <div className="text-xs text-blue-600 font-bold">التكرار: {profile.medicalFollowupFrequency}</div>
              )}
              {profile.medicalFollowupDetails && (
                <div className="text-xs text-blue-600 mt-1">{profile.medicalFollowupDetails}</div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 rounded-xl">
              <span className="text-sm font-bold text-emerald-700">✅ لا يحتاج متابعة طبية</span>
            </div>
          )}
        </div>
      </div>

      {/* Wife/Spouse Health */}
      {profile.wifeName && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 p-4">
          <h3 className="font-black text-gray-800 text-base mb-3 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            صحة الزوجة
          </h3>
          <div className="space-y-2">
            {profile.wifeIsPregnant && (
              <div className="p-3 bg-pink-50 rounded-xl">
                <div className="text-sm font-bold text-pink-700">
                  🤰 حامل - الشهر {profile.wifePregnancyMonth}
                </div>
                {profile.wifePregnancySpecialNeeds && (
                  <div className="text-xs text-pink-600 font-bold mt-1">تحتاج متابعة خاصة</div>
                )}
                {profile.wifePregnancyFollowupDetails && (
                  <div className="text-xs text-pink-600 mt-1">{profile.wifePregnancyFollowupDetails}</div>
                )}
              </div>
            )}

            {profile.wifeDisabilityType && profile.wifeDisabilityType !== 'لا يوجد' && (
              <div className="p-3 bg-red-50 rounded-xl">
                <span className="text-sm font-bold text-red-700">إعاقة: {profile.wifeDisabilityType}</span>
              </div>
            )}

            {profile.wifeChronicDiseaseType && profile.wifeChronicDiseaseType !== 'لا يوجد' && (
              <div className="p-3 bg-orange-50 rounded-xl">
                <span className="text-sm font-bold text-orange-700">مرض مزمن: {profile.wifeChronicDiseaseType}</span>
              </div>
            )}

            {profile.wifeWarInjuryType && profile.wifeWarInjuryType !== 'لا يوجد' && (
              <div className="p-3 bg-amber-50 rounded-xl">
                <span className="text-sm font-bold text-amber-700">إصابة حرب: {profile.wifeWarInjuryType}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pregnant Women Count */}
      {profile.pregnantWomenCount && profile.pregnantWomenCount > 0 && (
        <div className="bg-pink-50 border-2 border-pink-200 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-pink-700 mb-1 flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                نساء حوامل
              </div>
              <div className="text-2xl font-black text-pink-800">{profile.pregnantWomenCount}</div>
            </div>
            <svg className="w-12 h-12 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthSummaryCard;
