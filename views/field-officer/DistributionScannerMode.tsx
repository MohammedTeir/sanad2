// views/field-officer/DistributionScannerMode.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { realDataService } from '../../services/realDataServiceBackend';
import { sessionService } from '../../services/sessionService';
import { makeAuthenticatedRequest } from '../../utils/apiUtils';
import { DPProfile, AidCampaign } from '../../types';
import Toast from '../../components/Toast';

interface DistributionEntry {
  familyId: string;
  familyName: string;
  nationalId: string;
  quantity: string;
  status: 'تم التسليم' | 'قيد الانتظار';
  scannedAt: Date;
}

const DistributionScannerMode = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentCampId, setCurrentCampId] = useState<string>('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' | 'warning' } | null>(null);
  
  // State
  const [campaigns, setCampaigns] = useState<AidCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [manualId, setManualId] = useState('');
  const [scannedFamilies, setScannedFamilies] = useState<DistributionEntry[]>([]);
  const [lastScannedFamily, setLastScannedFamily] = useState<DPProfile | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [scanMode, setScanMode] = useState<'camera' | 'manual'>('manual');

  useEffect(() => {
    window.scrollTo(0, 0);
    const currentUser = sessionService.getCurrentUser();
    if (currentUser?.campId) {
      setCurrentCampId(currentUser.campId);
    } else {
      setToast({ message: 'لم يتم تحديد المخيم.', type: 'error' });
    }
  }, []);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      if (!currentCampId) return;

      const loadedCampaigns = await makeAuthenticatedRequest(`/aid/campaigns?campId=${currentCampId}`);
      console.log('Loaded campaigns:', loadedCampaigns);
      
      // Filter active/pending campaigns
      const activeCampaigns = (Array.isArray(loadedCampaigns) ? loadedCampaigns : [])
        .filter((c: any) => c.status === 'نشط' || c.status === 'مكتمل');
      
      setCampaigns(activeCampaigns);
      
      // Auto-select first campaign if only one
      if (activeCampaigns.length === 1) {
        setSelectedCampaign(activeCampaigns[0].id);
      }
    } catch (err: any) {
      console.error('Error loading campaigns:', err);
      setToast({ message: 'فشل تحميل حملات التوزيع', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [currentCampId]);

  useEffect(() => {
    if (currentCampId) {
      loadCampaigns();
    }
  }, [currentCampId, loadCampaigns]);

  const handleScanFamily = async (familyId: string) => {
    if (!selectedCampaign) {
      setToast({ message: 'الرجاء اختيار حملة التوزيع أولاً', type: 'warning' });
      return;
    }

    try {
      // Fetch family details
      const family = await makeAuthenticatedRequest(`/families/${familyId}`);
      
      if (!family) {
        setToast({ message: 'الأسرة غير موجودة', type: 'error' });
        return;
      }

      // Check if already scanned in this session
      if (scannedFamilies.find(f => f.familyId === familyId)) {
        setToast({ message: 'تم مسح هذه الأسرة مسبقاً', type: 'info' });
        return;
      }

      // Add to scanned list
      const entry: DistributionEntry = {
        familyId: family.id,
        familyName: family.headOfFamily,
        nationalId: family.nationalId || family.headOfFamilyNationalId || '',
        quantity: '1',
        status: 'تم التسليم',
        scannedAt: new Date()
      };

      setScannedFamilies(prev => [entry, ...prev]);
      setLastScannedFamily(family);
      setShowSuccessModal(true);
      setManualId('');

      // Auto-close modal after 2 seconds
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);

    } catch (err: any) {
      console.error('Error scanning family:', err);
      if (err?.status === 404) {
        setToast({ message: 'الأسرة غير موجودة', type: 'error' });
      } else {
        setToast({ message: 'فشل مسح الأسرة', type: 'error' });
      }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualId.trim()) {
      setToast({ message: 'الرجاء إدخال رقم الهوية', type: 'warning' });
      return;
    }

    // Find family by national ID
    try {
      const families = await makeAuthenticatedRequest(`/families?campId=${currentCampId}`);
      const family = Array.isArray(families) ? families.find((f: any) => 
        f.nationalId === manualId.trim() || 
        f.headOfFamilyNationalId === manualId.trim()
      ) : null;

      if (!family) {
        setToast({ message: 'الأسرة غير موجودة بهذا الرقم', type: 'error' });
        return;
      }

      await handleScanFamily(family.id);
    } catch (err: any) {
      console.error('Error finding family:', err);
      setToast({ message: 'فشل البحث عن الأسرة', type: 'error' });
    }
  };

  const handleSubmitDistributions = async () => {
    if (scannedFamilies.length === 0) {
      setToast({ message: 'لا توجد أسر لمسحها', type: 'warning' });
      return;
    }

    if (!selectedCampaign) {
      setToast({ message: 'الرجاء اختيار حملة التوزيع', type: 'warning' });
      return;
    }

    setSubmitting(true);
    try {
      // Submit all distribution records
      const campaign = campaigns.find(c => c.id === selectedCampaign);
      
      const distributionRecords = scannedFamilies.map(entry => ({
        campaignId: selectedCampaign,
        familyId: entry.familyId,
        aidId: campaign?.aidId,
        quantity: parseFloat(entry.quantity) || 1,
        status: entry.status,
        deliveredBy: sessionService.getCurrentUser()?.id,
        deliveryDate: entry.scannedAt.toISOString()
      }));

      // Submit to backend
      await makeAuthenticatedRequest('/aid/distributions/batch', {
        method: 'POST',
        body: JSON.stringify({
          distributions: distributionRecords,
          campaignId: selectedCampaign
        })
      });

      setToast({ message: `تم تسجيل ${scannedFamilies.length} توزيع بنجاح`, type: 'success' });
      
      // Reset
      setScannedFamilies([]);
      setManualId('');
      
      // Reload campaigns to update counts
      setTimeout(() => {
        loadCampaigns();
      }, 1000);

    } catch (err: any) {
      console.error('Error submitting distributions:', err);
      setToast({ message: err.message || 'فشل تسجيل التوزيعات', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getAidTypeLabel = (campaign: AidCampaign) => {
    if (typeof campaign.aidType === 'string') return campaign.aidType;
    if (campaign.aidType && typeof campaign.aidType === 'object' && 'name' in campaign.aidType) {
      return (campaign.aidType as any).name;
    }
    return 'مساعدة';
  };

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500">
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-amber-600 to-amber-700 rounded-[2rem] p-6 text-white shadow-lg">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1h12m-5 0h8" />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-black mb-1">مسح التوزيع</h1>
            <p className="text-amber-100 font-bold text-sm">تسجيل استلام المساعدات للأسر</p>
          </div>
        </div>
      </div>

      {/* Campaign Selection */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6">
        <label className="block text-sm font-black text-gray-700 mb-4">
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            حملة التوزيع
          </span>
        </label>
        {loading ? (
          <div className="h-12 bg-gray-100 rounded-2xl animate-pulse"></div>
        ) : campaigns.length === 0 ? (
          <div className="p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl text-center">
            <p className="text-amber-800 font-bold text-sm">لا توجد حملات توزيع نشطة حالياً</p>
          </div>
        ) : (
          <select
            value={selectedCampaign}
            onChange={(e) => setSelectedCampaign(e.target.value)}
            className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-sm font-bold"
          >
            <option value="">اختر حملة التوزيع...</option>
            {campaigns.map((campaign: any) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name} - {getAidTypeLabel(campaign)} ({campaign.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Scan Mode Toggle */}
      <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-2">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setScanMode('manual')}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
              scanMode === 'manual'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            إدخال يدوي
          </button>
          <button
            type="button"
            onClick={() => setScanMode('camera')}
            className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${
              scanMode === 'camera'
                ? 'bg-amber-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            مسح بالكاميرا
          </button>
        </div>
      </div>

      {/* Manual Input Form */}
      {scanMode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-2 uppercase tracking-wide">
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                </svg>
                رقم الهوية الوطنية
              </span>
            </label>
            <input
              type="text"
              value={manualId}
              onChange={(e) => setManualId(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="أدخل 9 أرقام"
              maxLength={9}
              className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none transition-all duration-200 focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 placeholder:text-gray-300 text-sm font-bold text-center tracking-widest"
            />
          </div>
          <button
            type="submit"
            disabled={!manualId.trim() || !selectedCampaign}
            className="w-full py-4 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-2xl font-black hover:from-amber-700 hover:to-amber-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              تسجيل الاستلام
            </span>
          </button>
        </form>
      )}

      {/* Camera Scan Placeholder */}
      {scanMode === 'camera' && (
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm p-8 text-center">
          <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-black text-gray-800 mb-2">مسح رمز QR</h3>
          <p className="text-gray-500 font-bold text-sm mb-4">قم بتوجيه الكاميرا نحو رمز QR الخاص بالأسرة</p>
          <div className="w-full max-w-xs mx-auto aspect-square bg-gray-100 rounded-2xl border-4 border-amber-300 border-dashed flex items-center justify-center">
            <p className="text-gray-400 font-bold text-sm">منطقة المسح</p>
          </div>
          <p className="text-xs text-gray-400 mt-4">هذه الميزة تتطلب صلاحية الوصول للكاميرا</p>
        </div>
      )}

      {/* Scanned Families List */}
      {scannedFamilies.length > 0 && (
        <div className="bg-white rounded-[2rem] border-2 border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              الأسر المسجلة ({scannedFamilies.length})
            </h2>
            <button
              onClick={() => setScannedFamilies([])}
              className="text-red-600 hover:text-red-700 font-bold text-sm"
            >
              مسح الكل
            </button>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
            {scannedFamilies.map((entry, index) => (
              <div key={index} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-black text-gray-800 text-sm">{entry.familyName}</p>
                  <p className="text-gray-500 text-xs font-bold">{entry.nationalId}</p>
                </div>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                  {entry.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      {scannedFamilies.length > 0 && (
        <button
          onClick={handleSubmitDistributions}
          disabled={submitting || !selectedCampaign}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-2xl font-black hover:from-emerald-700 hover:to-emerald-800 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              جاري الحفظ...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              حفظ {scannedFamilies.length} توزيعات
            </>
          )}
        </button>
      )}

      {/* Success Modal */}
      {showSuccessModal && lastScannedFamily && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95">
            <div className="text-center">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-gray-800 mb-2">تم المسح بنجاح</h3>
              <p className="text-gray-600 font-bold mb-4">{lastScannedFamily.headOfFamily}</p>
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-500 font-bold mb-1">رقم الهوية</p>
                <p className="text-lg font-black text-gray-800">{lastScannedFamily.nationalId || lastScannedFamily.headOfFamilyNationalId}</p>
              </div>
              <p className="text-sm text-emerald-600 font-bold">✓ تم التسجيل بنجاح</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DistributionScannerMode;
