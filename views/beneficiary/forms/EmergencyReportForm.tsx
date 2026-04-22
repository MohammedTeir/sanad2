// views/beneficiary/forms/EmergencyReportForm.tsx
import React, { useState } from 'react';
import { beneficiaryService } from '../../../services/beneficiaryService';

interface EmergencyReportFormProps {
  familyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const EMERGENCY_TYPES = [
  'حالة طبية طارئة',
  'نقص حاد في الغذاء',
  'انعدام المأوى',
  'مشكلة في المياه',
  'مشكلة في الكهرباء',
  'أمن وسلامة',
  'أخرى'
];

const URGENCY_LEVELS = [
  { value: 'عاجل جداً', label: '🚨 عاجل جداً - خطر فوري', color: 'red' },
  { value: 'عاجل', label: '⚠️ عاجل - يحتاج تدخلاً سريعاً', color: 'orange' },
  { value: 'عادي', label: '📋 عادي - غير طارئ', color: 'blue' }
];

const EmergencyReportForm: React.FC<EmergencyReportFormProps> = ({ familyId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState({
    emergencyType: 'حالة طبية طارئة',
    urgency: 'عاجل' as 'عاجل جداً' | 'عاجل' | 'عادي',
    description: '',
    location: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      setErrors({ description: 'يرجى كتابة التفاصيل' });
      return;
    }
    
    try {
      setLoading(true);
      await beneficiaryService.submitEmergencyReport(
        formData.emergencyType,
        formData.description,
        formData.urgency,
        formData.location || undefined
      );
      onSuccess?.();
    } catch (error: any) {
      setErrors({ submit: error.message || 'فشل إرسال البلاغ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-red-600 to-red-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          بلاغ طارئ
        </h2>
        <p className="text-red-100 text-sm font-bold">للحالات الطارئة فقط - سيتم التواصل معك بسرعة</p>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-bold text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
        <h3 className="font-black text-gray-800 text-lg mb-4">تفاصيل البلاغ الطارئ</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">نوع الطارئ</label>
            <select
              value={formData.emergencyType}
              onChange={(e) => setFormData(prev => ({ ...prev, emergencyType: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
            >
              {EMERGENCY_TYPES.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">مستوى الاستعجال</label>
            <div className="space-y-2">
              {URGENCY_LEVELS.map(level => (
                <label
                  key={level.value}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    formData.urgency === level.value
                      ? level.color === 'red' ? 'border-red-500 bg-red-50'
                      : level.color === 'orange' ? 'border-orange-500 bg-orange-50'
                      : 'border-blue-500 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="urgency"
                    checked={formData.urgency === level.value}
                    onChange={() => setFormData(prev => ({ ...prev, urgency: level.value as any }))}
                    className="w-5 h-5 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-gray-800">{level.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">الموقع (اختياري)</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
              placeholder="الموقع الدقيق أو أقرب معلم"
            />
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">التفاصيل <span className="text-red-500">*</span></label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.description ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
              rows={6}
              placeholder="اكتب تفاصيل الحالة الطارئة..."
            />
            {errors.description && <p className="text-red-500 text-xs font-bold mt-1">{errors.description}</p>}
          </div>
          
          <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <svg className="w-8 h-8 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="font-black text-amber-800 text-sm mb-1">تنبيه مهم</p>
                <p className="text-xs text-amber-700 font-bold">
                  يُرجى استخدام هذا النموذج للحالات الطارئة فقط. للإبلاغ عن حالات طارئة خطيرة، يرجى الاتصال بالطوارئ مباشرة.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold hover:from-red-700 hover:to-red-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري الإرسال...' : 'إرسال البلاغ'}
        </button>
      </div>
    </form>
  );
};

export default EmergencyReportForm;
