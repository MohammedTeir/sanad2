// views/beneficiary/forms/ComplaintForm.tsx
import React, { useState } from 'react';
import { beneficiaryService } from '../../../services/beneficiaryService';

interface ComplaintFormProps {
  familyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const CATEGORIES = [
  'شكوى',
  'مقترح',
  'استفسار',
  'طلب مساعدة',
  'أخرى'
];

const ComplaintForm: React.FC<ComplaintFormProps> = ({ familyId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: 'شكوى',
    isAnonymous: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      setErrors({ subject: 'يرجى كتابة العنوان' });
      return;
    }
    if (!formData.description.trim()) {
      setErrors({ description: 'يرجى كتابة التفاصيل' });
      return;
    }
    
    try {
      setLoading(true);
      await beneficiaryService.submitComplaint(
        formData.subject,
        formData.description,
        formData.category,
        formData.isAnonymous
      );
      onSuccess?.();
    } catch (error: any) {
      setErrors({ submit: error.message || 'فشل إرسال الشكوى' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-black mb-2">شكوى / مقترح</h2>
        <p className="text-emerald-100 text-sm font-bold">نقدر ملاحظاتك لتحسين خدماتنا</p>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-bold text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
        <h3 className="font-black text-gray-800 text-lg mb-4">تفاصيل الشكوى/المقترح</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">النوع</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-emerald-500 focus:outline-none font-bold text-gray-800"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">العنوان <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, subject: e.target.value }));
                if (errors.subject) setErrors(prev => ({ ...prev, subject: '' }));
              }}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.subject ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
              placeholder="عنوان الشكوى أو المقترح"
            />
            {errors.subject && <p className="text-red-500 text-xs font-bold mt-1">{errors.subject}</p>}
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
              placeholder="اكتب تفاصيل الشكوى أو المقترح..."
            />
            {errors.description && <p className="text-red-500 text-xs font-bold mt-1">{errors.description}</p>}
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isAnonymous}
                onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-bold text-gray-700">إرسال بشكل مجهول</span>
            </label>
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
          className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-bold hover:from-emerald-700 hover:to-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'جاري الإرسال...' : 'إرسال'}
        </button>
      </div>
    </form>
  );
};

export default ComplaintForm;
