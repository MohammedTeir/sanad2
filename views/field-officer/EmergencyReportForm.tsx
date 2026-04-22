// views/field-officer/EmergencyReportForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService } from '../../services/sessionService';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import Toast from '../../components/Toast';
import FileUpload from '../../components/FileUpload';

type EmergencyType = 'medical' | 'security' | 'infrastructure' | 'family' | 'other';
type PriorityLevel = 'عادي' | 'عاجل' | 'طارئ جداً';

interface EmergencyReport {
  type: EmergencyType;
  priority: PriorityLevel;
  title: string;
  description: string;
  location: string;
  familyId?: string;
  familyName?: string;
  contactPhone?: string;
  photos: string[];
}

const EmergencyReportForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  const [formData, setFormData] = useState<EmergencyReport>({
    type: 'medical',
    priority: 'عاجل',
    title: '',
    description: '',
    location: '',
    familyId: '',
    familyName: '',
    contactPhone: '',
    photos: []
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
    } else {
      setToast({ message: 'لم يتم تحديد المخيم.', type: 'error' });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      setToast({ message: 'الرجاء إدخال عنوان للبلاغ', type: 'error' });
      return;
    }
    if (!formData.description.trim()) {
      setToast({ message: 'الرجاء إدخال وصف للتفاصيل', type: 'error' });
      return;
    }
    if (!formData.location.trim()) {
      setToast({ message: 'الرجاء تحديد الموقع', type: 'error' });
      return;
    }

    setSubmitting(true);
    try {
      // Submit emergency report to backend
      await makeAuthenticatedRequest('/reports/emergency', {
        method: 'POST',
        body: JSON.stringify({
          ...formData,
          campId: currentCampId,
          reportedBy: sessionService.getCurrentUser()?.id,
          reportedAt: new Date().toISOString()
        })
      });

      setToast({ message: 'تم إرسال البلاغ الطارئ بنجاح', type: 'success' });
      
      // Reset form
      setFormData({
        type: 'medical',
        priority: 'عاجل',
        title: '',
        description: '',
        location: '',
        familyId: '',
        familyName: '',
        contactPhone: '',
        photos: []
      });

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/field');
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting emergency report:', err);
      setToast({ 
        message: err.message || 'فشل إرسال البلاغ. يرجى المحاولة مرة أخرى.', 
        type: 'error' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getEmergencyTypeLabel = (type: EmergencyType) => {
    const labels: Record<EmergencyType, string> = {
      medical: 'طبي',
      security: 'أمني',
      infrastructure: 'بنية تحتية',
      family: 'حالة أسرية',
      other: 'أخرى'
    };
    return labels[type];
  };

  const getEmergencyTypeIcon = (type: EmergencyType) => {
    switch (type) {
      case 'medical':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        );
      case 'security':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'infrastructure':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'family':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'other':
        return (
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getEmergencyTypeColor = (type: EmergencyType) => {
    switch (type) {
      case 'medical':
        return 'selected:bg-red-50 selected:border-red-300 hover:bg-red-50 border-red-200 text-red-700';
      case 'security':
        return 'selected:bg-amber-50 selected:border-amber-300 hover:bg-amber-50 border-amber-200 text-amber-700';
      case 'infrastructure':
        return 'selected:bg-blue-50 selected:border-blue-300 hover:bg-blue-50 border-blue-200 text-blue-700';
      case 'family':
        return 'selected:bg-emerald-50 selected:border-emerald-300 hover:bg-emerald-50 border-emerald-200 text-emerald-700';
      case 'other':
        return 'selected:bg-gray-50 selected:border-gray-300 hover:bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-[2rem] p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black mb-1">بلاغ طارئ</h1>
            <p className="text-red-100 font-bold text-sm">إرسال بلاغ عاجل لإدارة المخيم</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Emergency Type Selection */}
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-black text-gray-700 mb-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              نوع البلاغ
            </span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {(['medical', 'security', 'infrastructure', 'family', 'other'] as EmergencyType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setFormData({ ...formData, type })}
                className={`p-4 border-2 rounded-2xl flex flex-col items-center gap-2 transition-all ${
                  formData.type === type
                    ? getEmergencyTypeColor(type)
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                {getEmergencyTypeIcon(type)}
                <span className="text-xs font-black">{getEmergencyTypeLabel(type)}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Priority Level */}
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-black text-gray-700 mb-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              مستوى الأولوية
            </span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['عادي', 'عاجل', 'طارئ جداً'] as PriorityLevel[]).map((priority) => (
              <button
                key={priority}
                type="button"
                onClick={() => setFormData({ ...formData, priority })}
                className={`p-4 border-2 rounded-2xl font-black transition-all ${
                  formData.priority === priority
                    ? priority === 'طارئ جداً'
                      ? 'bg-red-50 border-red-300 text-red-700'
                      : priority === 'عاجل'
                      ? 'bg-amber-50 border-amber-300 text-amber-700'
                      : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                    : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                }`}
              >
                {priority}
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
          <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
            عنوان البلاغ *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="مثال: حالة طبية طارئة - خيمة 15"
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder:text-gray-300 text-sm font-bold"
            required
          />
        </div>

        {/* Description */}
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
          <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              وصف الحالة *
            </span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="اشرح تفاصيل الحالة بشكل واضح..."
            rows={5}
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder:text-gray-300 text-sm font-bold resize-none"
            required
          />
        </div>

        {/* Location */}
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
          <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              الموقع *
            </span>
          </label>
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="مثال: المخيم الشمالي، خيمة رقم 15، بالقرب من المدرسة"
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder:text-gray-300 text-sm font-bold"
            required
          />
        </div>

        {/* Family Info (Optional) */}
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-black text-gray-700 mb-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              بيانات الأسرة (اختياري)
            </span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">اسم رب الأسرة</label>
              <input
                type="text"
                value={formData.familyName}
                onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                placeholder="اسم رب الأسرة"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder:text-gray-300 text-sm font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-2">رقم الهاتف</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                placeholder="059xxxxxxx"
                className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-red-500 focus:ring-4 focus:ring-red-500/10 placeholder:text-gray-300 text-sm font-bold"
              />
            </div>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
          <label className="block text-sm font-black text-gray-700 mb-4">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              صور توضيحية (اختياري)
            </span>
          </label>
          <FileUpload
            bucket="emergency-photos"
            onUploadComplete={(url) => {
              setFormData({ ...formData, photos: [...formData.photos, url] });
            }}
            maxFiles={5}
            maxSizeMB={5}
            accept="image/*"
          />
          {formData.photos.length > 0 && (
            <div className="mt-4 grid grid-cols-3 gap-3">
              {formData.photos.map((photo, index) => (
                <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-gray-200">
                  <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ ...formData, photos: formData.photos.filter((_, i) => i !== index) });
                    }}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => navigate('/field')}
            className="flex-1 px-6 py-4 bg-gray-100 text-gray-700 rounded-2xl font-black hover:bg-gray-200 transition-all"
            disabled={submitting}
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={submitting || !formData.title || !formData.description || !formData.location}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-black hover:from-red-700 hover:to-red-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                جاري الإرسال...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
                إرسال البلاغ
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmergencyReportForm;
