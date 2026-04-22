// views/beneficiary/components/FamilyMemberCard.tsx
import React, { useState } from 'react';
import type { FamilyMember } from '../../types';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onEdit?: (member: FamilyMember) => void;
  onDelete?: (memberId: string) => void;
  canEdit?: boolean;
}

const FamilyMemberCard: React.FC<FamilyMemberCardProps> = ({ member, onEdit, onDelete, canEdit = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getRelationIcon = (relation: string) => {
    // Icon mapping based on relation using SVG
    if (relation.includes('ابن') || relation.includes('بنت')) {
      return (
        <svg className="w-8 h-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (relation.includes('جد') || relation.includes('جدة')) {
      return (
        <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else if (relation.includes('حفيد') || relation.includes('حفيدة')) {
      return (
        <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-8 h-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  };

  const getHealthBadges = () => {
    const badges = [];
    
    if (member.disabilityType && member.disabilityType !== 'لا يوجد') {
      badges.push({ label: 'إعاقة', color: 'bg-red-100 text-red-700 border-red-200' });
    }
    
    if (member.chronicDiseaseType && member.chronicDiseaseType !== 'لا يوجد') {
      badges.push({ label: 'مرض مزمن', color: 'bg-orange-100 text-orange-700 border-orange-200' });
    }
    
    if (member.hasWarInjury || (member.warInjuryType && member.warInjuryType !== 'لا يوجد')) {
      badges.push({ label: 'إصابة حرب', color: 'bg-amber-100 text-amber-700 border-amber-200' });
    }
    
    if (member.medicalFollowupRequired) {
      badges.push({ label: 'متابعة طبية', color: 'bg-blue-100 text-blue-700 border-blue-200' });
    }
    
    return badges;
  };

  const getStatusBadge = () => {
    if (member.isStudying) {
      return { label: 'طالب', color: 'bg-emerald-100 text-emerald-700' };
    }
    if (member.isWorking) {
      return { label: 'يعمل', color: 'bg-blue-100 text-blue-700' };
    }
    return null;
  };

  const healthBadges = getHealthBadges();
  const statusBadge = getStatusBadge();

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-emerald-200">
      {/* Card Header */}
      <div 
        className="p-4 cursor-pointer flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="text-3xl">{getRelationIcon(member.relation)}</div>
          <div>
            <h3 className="font-black text-gray-800 text-base">{member.name}</h3>
            <p className="text-xs text-gray-500 font-bold">
              {member.age} سنة • {member.gender} • {member.relation}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {statusBadge && (
            <span className={`px-3 py-1 rounded-full text-xs font-black ${statusBadge.color}`}>
              {statusBadge.label}
            </span>
          )}
          <svg 
            className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Health Badges */}
      {healthBadges.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {healthBadges.map((badge, idx) => (
            <span 
              key={idx}
              className={`px-3 py-1 rounded-full text-xs font-black border-2 ${badge.color}`}
            >
              {badge.label}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Content */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-3">
          {/* Personal Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="text-xs text-gray-500 font-bold mb-1">تاريخ الميلاد</div>
              <div className="font-bold text-sm text-gray-800">
                {member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString('ar-EG') : 'غير محدد'}
              </div>
            </div>
            {member.nationalId && (
              <div>
                <div className="text-xs text-gray-500 font-bold mb-1">رقم الهوية</div>
                <div className="font-bold text-sm text-gray-800">{member.nationalId}</div>
              </div>
            )}
          </div>

          {/* Education/Work */}
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="text-xs text-gray-500 font-bold mb-2">التعليم / العمل</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">الحالة الدراسية</div>
                <div className="font-bold text-sm">
                  {member.isStudying ? member.educationStage || 'يدرس' : 'لا يدرس'}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">الحالة العملية</div>
                <div className="font-bold text-sm">
                  {member.isWorking ? member.occupation || 'يعمل' : 'لا يعمل'}
                </div>
              </div>
            </div>
          </div>

          {/* Health Details */}
          {healthBadges.length > 0 && (
            <div className="bg-red-50 rounded-xl p-3">
              <div className="text-xs text-red-600 font-bold mb-2">التفاصيل الصحية</div>
              <div className="space-y-2">
                {member.disabilityType && member.disabilityType !== 'لا يوجد' && (
                  <div className="text-sm">
                    <span className="font-bold text-red-700">الإعاقة:</span>
                    <span className="text-red-600 mr-2">{member.disabilityType}</span>
                    {member.disabilitySeverity && <span className="text-red-600">({member.disabilitySeverity})</span>}
                  </div>
                )}
                {member.chronicDiseaseType && member.chronicDiseaseType !== 'لا يوجد' && (
                  <div className="text-sm">
                    <span className="font-bold text-red-700">المرض المزمن:</span>
                    <span className="text-red-600 mr-2">{member.chronicDiseaseType}</span>
                  </div>
                )}
                {(member.hasWarInjury || member.warInjuryType !== 'لا يوجد') && (
                  <div className="text-sm">
                    <span className="font-bold text-red-700">إصابة الحرب:</span>
                    <span className="text-red-600 mr-2">{member.warInjuryType}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact */}
          {member.phoneNumber && (
            <div className="bg-emerald-50 rounded-xl p-3">
              <div className="text-xs text-emerald-600 font-bold mb-1">رقم التواصل</div>
              <div className="font-bold text-sm text-emerald-700">{member.phoneNumber}</div>
            </div>
          )}

          {/* Actions */}
          {canEdit && (
            <div className="flex gap-2 pt-3 border-t">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit?.(member);
                }}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors"
              >
                تعديل
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete?.(member.id);
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
              >
                حذف
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FamilyMemberCard;
