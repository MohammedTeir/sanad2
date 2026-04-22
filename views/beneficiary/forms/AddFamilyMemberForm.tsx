// views/beneficiary/forms/AddFamilyMemberForm.tsx
import React, { useState } from 'react';
import type { FamilyMember, Gender, RelationType, EducationStage, MaritalStatus, DisabilityType, ChronicDiseaseType, WarInjuryType, MedicalFollowupFrequency } from '../../types';

interface AddFamilyMemberFormProps {
  familyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const RELATIONS: RelationType[] = [
  'الابن', 'البنت', 'الجد', 'الجدة', 'الحفيد', 'الحفيدة', 
  'العم', 'العمة', 'الخال', 'الخالة', 'ابن الأخ', 'ابنة الأخ', 'ابن العم', 'أخرى'
];

const EDUCATION_STAGES: EducationStage[] = [
  'لا يدرس', 'ابتدائي', 'إعدادي/ثانوي', 'جامعي', 'أخرى'
];

const MARITAL_STATUSES: MaritalStatus[] = [
  'أعزب', 'متزوج', 'أرمل', 'مطلق', 'أسرة هشة'
];

const DISABILITY_TYPES: DisabilityType[] = [
  'لا يوجد', 'حركية', 'بصرية', 'سمعية', 'ذهنية', 'أخرى'
];

const CHRONIC_DISEASE_TYPES: ChronicDiseaseType[] = [
  'لا يوجد', 'سكري', 'ضغط دم', 'قلب', 'سرطان', 'ربو', 'فشل كلوي', 'مرض نفسي', 'أخرى'
];

const WAR_INJURY_TYPES: WarInjuryType[] = [
  'لا يوجد', 'بتر', 'كسر', 'شظية', 'حرق', 'رأس/وجه', 'عمود فقري', 'أخرى'
];

const MEDICAL_FOLLOWUP_FREQUENCIES: MedicalFollowupFrequency[] = [
  'يومي', 'أسبوعي', 'شهري'
];

const AddFamilyMemberForm: React.FC<AddFamilyMemberFormProps> = ({ familyId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState<Partial<FamilyMember>>({
    firstName: '',
    fatherName: '',
    grandfatherName: '',
    familyName: '',
    gender: 'ذكر',
    dateOfBirth: '',
    relation: 'الابن',
    isStudying: false,
    isWorking: false,
    educationStage: 'لا يدرس',
    occupation: '',
    phoneNumber: '',
    maritalStatus: 'أعزب',
    disabilityType: 'لا يوجد',
    chronicDiseaseType: 'لا يوجد',
    hasWarInjury: false,
    warInjuryType: 'لا يوجد',
    medicalFollowupRequired: false
  });

  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear related fields when setting to "لا يوجد"
    if (field === 'disabilityType' && value === 'لا يوجد') {
      setFormData(prev => ({ ...prev, disabilitySeverity: undefined, disabilityDetails: '' }));
    } else if (field === 'chronicDiseaseType' && value === 'لا يوجد') {
      setFormData(prev => ({ ...prev, chronicDiseaseDetails: '' }));
    } else if (field === 'warInjuryType' && value === 'لا يوجد') {
      setFormData(prev => ({ ...prev, warInjuryDetails: '' }));
    }
    
    // Clear education when not studying
    if (field === 'isStudying' && value === false) {
      setFormData(prev => ({ ...prev, educationStage: 'لا يدرس' }));
    }
    
    // Clear work when not working
    if (field === 'isWorking' && value === false) {
      setFormData(prev => ({ ...prev, occupation: '' }));
    }
    
    // Clear medical followup when not required
    if (field === 'medicalFollowupRequired' && value === false) {
      setFormData(prev => ({ ...prev, medicalFollowupFrequency: undefined, medicalFollowupDetails: '' }));
    }
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.firstName?.trim()) newErrors.firstName = 'الاسم الأول مطلوب';
    if (!formData.fatherName?.trim()) newErrors.fatherName = 'اسم الأب مطلوب';
    if (!formData.grandfatherName?.trim()) newErrors.grandfatherName = 'اسم الجد مطلوب';
    if (!formData.familyName?.trim()) newErrors.familyName = 'العائلة مطلوب';
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'تاريخ الميلاد مطلوب';
    if (!formData.relation) newErrors.relation = 'الصلة مطلوب';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;
    
    try {
      setLoading(true);
      // TODO: Call beneficiaryService.addFamilyMember
      onSuccess?.();
    } catch (error: any) {
      setErrors({ submit: error.message || 'فشل إضافة الفرد' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-black mb-2">إضافة فرد جديد للأسرة</h2>
        <p className="text-emerald-100 text-sm font-bold">يرجى تعبئة جميع الحقول المطلوبة</p>
      </div>

      {/* Errors */}
      {errors.submit && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-bold text-sm">{errors.submit}</p>
        </div>
      )}

      {/* 4-Part Name */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
        <h3 className="font-black text-gray-800 text-lg mb-4">الاسم الرباعي</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الاسم الأول <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => handleFieldChange('firstName', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.firstName ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
              placeholder="الاسم الأول"
            />
            {errors.firstName && <p className="text-red-500 text-xs font-bold mt-1">{errors.firstName}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم الأب <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.fatherName}
              onChange={(e) => handleFieldChange('fatherName', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.fatherName ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
              placeholder="اسم الأب"
            />
            {errors.fatherName && <p className="text-red-500 text-xs font-bold mt-1">{errors.fatherName}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">اسم الجد <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.grandfatherName}
              onChange={(e) => handleFieldChange('grandfatherName', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.grandfatherName ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
              placeholder="اسم الجد"
            />
            {errors.grandfatherName && <p className="text-red-500 text-xs font-bold mt-1">{errors.grandfatherName}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">العائلة <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.familyName}
              onChange={(e) => handleFieldChange('familyName', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.familyName ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
              placeholder="العائلة"
            />
            {errors.familyName && <p className="text-red-500 text-xs font-bold mt-1">{errors.familyName}</p>}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
        <h3 className="font-black text-gray-800 text-lg mb-4">المعلومات الأساسية</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الجنس</label>
            <select
              value={formData.gender}
              onChange={(e) => handleFieldChange('gender', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
            >
              <option value="ذكر">ذكر</option>
              <option value="أنثى">أنثى</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">تاريخ الميلاد <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => handleFieldChange('dateOfBirth', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.dateOfBirth ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
            />
            {errors.dateOfBirth && <p className="text-red-500 text-xs font-bold mt-1">{errors.dateOfBirth}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الصلة برب الأسرة <span className="text-red-500">*</span></label>
            <select
              value={formData.relation}
              onChange={(e) => handleFieldChange('relation', e.target.value)}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.relation ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
            >
              {RELATIONS.map(rel => (
                <option key={rel} value={rel}>{rel}</option>
              ))}
            </select>
            {errors.relation && <p className="text-red-500 text-xs font-bold mt-1">{errors.relation}</p>}
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">رقم الهوية (اختياري)</label>
            <input
              type="text"
              value={formData.nationalId || ''}
              onChange={(e) => handleFieldChange('nationalId', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
              placeholder="رقم الهوية"
            />
          </div>
        </div>
      </div>

      {/* Education & Work */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
        <h3 className="font-black text-gray-800 text-lg mb-4">التعليم والعمل</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isStudying}
                onChange={(e) => handleFieldChange('isStudying', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-gray-700">يدرس</span>
            </label>
          </div>
          
          {formData.isStudying && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">المرحلة الدراسية</label>
              <select
                value={formData.educationStage}
                onChange={(e) => handleFieldChange('educationStage', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
              >
                {EDUCATION_STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isWorking}
                onChange={(e) => handleFieldChange('isWorking', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-gray-700">يعمل</span>
            </label>
          </div>
          
          {formData.isWorking && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">المهنة</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => handleFieldChange('occupation', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
                placeholder="المهنة"
              />
            </div>
          )}
        </div>
      </div>

      {/* Marital Status */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
        <h3 className="font-black text-gray-800 text-lg mb-4">الحالة الاجتماعية</h3>
        <select
          value={formData.maritalStatus}
          onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
        >
          {MARITAL_STATUSES.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Health */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
        <h3 className="font-black text-gray-800 text-lg mb-4">الحالة الصحية</h3>
        <div className="space-y-4">
          {/* Disability */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الإعاقة</label>
            <select
              value={formData.disabilityType}
              onChange={(e) => handleFieldChange('disabilityType', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
            >
              {DISABILITY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Chronic Disease */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الأمراض المزمنة</label>
            <select
              value={formData.chronicDiseaseType}
              onChange={(e) => handleFieldChange('chronicDiseaseType', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
            >
              {CHRONIC_DISEASE_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* War Injury */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">إصابات الحرب</label>
            <select
              value={formData.warInjuryType}
              onChange={(e) => handleFieldChange('warInjuryType', e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
            >
              {WAR_INJURY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          {/* Medical Follow-up */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.medicalFollowupRequired}
                onChange={(e) => handleFieldChange('medicalFollowupRequired', e.target.checked)}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-gray-700">يحتاج متابعة طبية</span>
            </label>
          </div>
          
          {formData.medicalFollowupRequired && (
            <>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تكرار المتابعة</label>
                <select
                  value={formData.medicalFollowupFrequency || ''}
                  onChange={(e) => handleFieldChange('medicalFollowupFrequency', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
                >
                  <option value="">اختر التكرار</option>
                  {MEDICAL_FOLLOWUP_FREQUENCIES.map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">تفاصيل المتابعة</label>
                <textarea
                  value={formData.medicalFollowupDetails || ''}
                  onChange={(e) => handleFieldChange('medicalFollowupDetails', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
                  rows={3}
                  placeholder="تفاصيل المتابعة الطبية"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
        <h3 className="font-black text-gray-800 text-lg mb-4">معلومات التواصل</h3>
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">رقم الجوال</label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => handleFieldChange('phoneNumber', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
            placeholder="05xxxxxxxx"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري الحفظ...' : 'حفظ'}
        </button>
      </div>
    </form>
  );
};

export default AddFamilyMemberForm;
