// views/beneficiary/forms/TransferRequestForm.tsx
import React, { useState, useEffect } from 'react';
import { beneficiaryService } from '../../services/beneficiaryService';

interface TransferRequestFormProps {
  familyId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const TransferRequestForm: React.FC<TransferRequestFormProps> = ({ familyId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [camps, setCamps] = useState<any[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  const [formData, setFormData] = useState({
    toCampId: '',
    reason: ''
  });

  useEffect(() => {
    loadCamps();
  }, []);

  const loadCamps = async () => {
    try {
      const campsData = await beneficiaryService.getCamps();
      setCamps(campsData);
    } catch (error) {
      console.error('Error loading camps:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.toCampId) {
      setErrors({ toCampId: 'يرجى اختيار المخيم' });
      return;
    }
    if (!formData.reason.trim()) {
      setErrors({ reason: 'يرجى كتابة سبب النقل' });
      return;
    }
    
    try {
      setLoading(true);
      await beneficiaryService.submitTransferRequest(familyId, formData.reason, formData.toCampId);
      onSuccess?.();
    } catch (error: any) {
      setErrors({ submit: error.message || 'فشل تقديم الطلب' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-black mb-2">طلب نقل مخيم</h2>
        <p className="text-emerald-100 text-sm font-bold">يرجى تعبئة جميع الحقول المطلوبة</p>
      </div>

      {errors.submit && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <p className="text-red-700 font-bold text-sm">{errors.submit}</p>
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 border-2 border-gray-100">
        <h3 className="font-black text-gray-800 text-lg mb-4">تفاصيل الطلب</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">المخيم المطلوب <span className="text-red-500">*</span></label>
            <select
              value={formData.toCampId}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, toCampId: e.target.value }));
                if (errors.toCampId) setErrors(prev => ({ ...prev, toCampId: '' }));
              }}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.toCampId ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
            >
              <option value="">اختر المخيم</option>
              {camps.map(camp => (
                <option key={camp.id} value={camp.id}>{camp.name}</option>
              ))}
            </select>
            {errors.toCampId && <p className="text-red-500 text-xs font-bold mt-1">{errors.toCampId}</p>}
          </div>
          
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">سبب النقل <span className="text-red-500">*</span></label>
            <textarea
              value={formData.reason}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, reason: e.target.value }));
                if (errors.reason) setErrors(prev => ({ ...prev, reason: '' }));
              }}
              className={`w-full px-4 py-3 rounded-xl border-2 ${errors.reason ? 'border-red-300' : 'border-gray-200'} focus:border-emerald-500 focus:outline-none font-bold text-gray-800`}
              rows={4}
              placeholder="اكتب سبب طلب النقل..."
            />
            {errors.reason && <p className="text-red-500 text-xs font-bold mt-1">{errors.reason}</p>}
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
          {loading ? 'جاري الإرسال...' : 'إرسال الطلب'}
        </button>
      </div>
    </form>
  );
};

export default TransferRequestForm;
