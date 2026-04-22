import React, { useState } from 'react';
import { storageService } from '../services/storage';
import { DPProfile, AidTransaction } from '../types';
import Toast from './Toast';

interface AidDistributionFormProps {
  dpProfile: DPProfile;
  onClose: () => void;
  onSuccess: () => void;
}

const AidDistributionForm: React.FC<AidDistributionFormProps> = ({ dpProfile, onClose, onSuccess }) => {
  const [aidType, setAidType] = useState('');
  const [aidCategory, setAidCategory] = useState<'food' | 'non_food' | 'medical' | 'cash' | 'other'>('food');
  const [quantity, setQuantity] = useState(1);
  const [campaignId, setCampaignId] = useState('');
  const [notes, setNotes] = useState('');
  const [verificationMethod, setVerificationMethod] = useState<'signature' | 'biometric' | 'photo' | 'otp'>('signature');
  const [verificationValue, setVerificationValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create the aid transaction
      const newTransaction: AidTransaction = {
        id: `aid_${Date.now()}`,
        dpId: dpProfile.id,
        aidType,
        aidCategory,
        quantity,
        date: new Date().toISOString().split('T')[0],
        distributedBy: 'current_user_id', // This would be replaced with actual user ID
        notes,
        campaignId: campaignId || undefined,
        duplicateCheckPassed: true,
        status: 'تم التسليم'
      };

      // Add verification method based on selection
      switch (verificationMethod) {
        case 'signature':
          newTransaction.receivedBySignature = verificationValue;
          break;
        case 'biometric':
          newTransaction.receivedByBiometric = verificationValue;
          break;
        case 'photo':
          newTransaction.receivedByPhoto = verificationValue;
          break;
        case 'otp':
          newTransaction.otpCode = verificationValue;
          break;
      }

      // Add to the profile's aid history
      const updatedProfile = {
        ...dpProfile,
        aidHistory: [...dpProfile.aidHistory, newTransaction]
      };

      // Save the updated profile
      await storageService.saveDP(updatedProfile);

      setToast({ message: 'تم تسجيل توزيع المساعدة بنجاح', type: 'success' });
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Error distributing aid:', error);
      setToast({ message: 'حدث خطأ أثناء تسجيل توزيع المساعدة', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="p-8 bg-emerald-700 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">تسجيل توزيع مساعدة</h3>
            <p className="text-emerald-200 text-xs font-bold mt-1">لأجل: {dpProfile.headOfFamily}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl transition-all">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 mr-1 uppercase tracking-wide">
                نوع المساعدة
              </label>
              <input
                type="text"
                required
                value={aidType}
                onChange={(e) => setAidType(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 text-sm"
                placeholder="مثلاً: سلة غذائية، بطانية، دواء"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 mr-1 uppercase tracking-wide">
                فئة المساعدة
              </label>
              <select
                value={aidCategory}
                onChange={(e) => setAidCategory(e.target.value as any)}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 text-xs font-bold text-gray-600"
              >
                <option value="food">غذائية</option>
                <option value="non_food">غير غذائية</option>
                <option value="medical">طبية</option>
                <option value="cash">نقدية</option>
                <option value="other">أخرى</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 mr-1 uppercase tracking-wide">
                الكمية
              </label>
              <input
                type="number"
                required
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-black text-gray-400 mb-2 mr-1 uppercase tracking-wide">
                حملة التوزيع (اختياري)
              </label>
              <input
                type="text"
                value={campaignId}
                onChange={(e) => setCampaignId(e.target.value)}
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 text-sm"
                placeholder="معرف حملة التوزيع"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 mr-1 uppercase tracking-wide">
              وسيلة التحقق
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="signature"
                  name="verification"
                  checked={verificationMethod === 'signature'}
                  onChange={() => setVerificationMethod('signature')}
                  className="w-4 h-4 text-emerald-600"
                />
                <label htmlFor="signature" className="text-sm font-bold text-gray-700">توقيع</label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="biometric"
                  name="verification"
                  checked={verificationMethod === 'biometric'}
                  onChange={() => setVerificationMethod('biometric')}
                  className="w-4 h-4 text-emerald-600"
                />
                <label htmlFor="biometric" className="text-sm font-bold text-gray-700">بصمة</label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="photo"
                  name="verification"
                  checked={verificationMethod === 'photo'}
                  onChange={() => setVerificationMethod('photo')}
                  className="w-4 h-4 text-emerald-600"
                />
                <label htmlFor="photo" className="text-sm font-bold text-gray-700">صورة</label>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  id="otp"
                  name="verification"
                  checked={verificationMethod === 'otp'}
                  onChange={() => setVerificationMethod('otp')}
                  className="w-4 h-4 text-emerald-600"
                />
                <label htmlFor="otp" className="text-sm font-bold text-gray-700">رمز OTP</label>
              </div>
            </div>
            
            <input
              type="text"
              value={verificationValue}
              onChange={(e) => setVerificationValue(e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 text-sm"
              placeholder={`أدخل تفاصيل ${verificationMethod === 'signature' ? 'التوقيع' : verificationMethod === 'biometric' ? 'البصمة' : verificationMethod === 'photo' ? 'الصورة' : 'رمز OTP'}`}
            />
          </div>
          
          <div>
            <label className="block text-[10px] font-black text-gray-400 mb-2 mr-1 uppercase tracking-wide">
              ملاحظات (اختياري)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-gray-300 text-sm"
              rows={3}
              placeholder="ملاحظات إضافية حول التوزيع..."
            />
          </div>
          
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black shadow-sm hover:bg-gray-200 transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-lg hover:bg-emerald-700 transition-all disabled:opacity-50"
            >
              {loading ? 'جاري التسجيل...' : 'تسجيل التوزيع'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AidDistributionForm;