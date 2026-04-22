// components/OfflineStatusBar.tsx
import React, { useState, useEffect } from 'react';
import Toast from './Toast';

interface OfflineStatusProps {
  campId?: string;
}

const OfflineStatusBar: React.FC<OfflineStatusProps> = ({ campId }) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingRecords, setPendingRecords] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Mock data for pending records
  useEffect(() => {
    // In a real implementation, this would track actual pending records
    // For now, we'll simulate with mock data
    setPendingRecords(3);
    
    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Simulate periodic sync check
    const syncInterval = setInterval(() => {
      if (isOnline && pendingRecords > 0) {
        setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));
      }
    }, 30000); // Check every 30 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(syncInterval);
    };
  }, [isOnline, pendingRecords]);

  const handleSync = async () => {
    if (!isOnline) {
      setToast({ message: 'لا يمكن المزامنة بدون اتصال بالإنترنت', type: 'error' });
      return;
    }

    if (pendingRecords === 0) {
      setToast({ message: 'لا توجد سجلات معلقة للمزامنة', type: 'warning' });
      return;
    }

    setIsSyncing(true);
    setProgress(0);

    try {
      // Simulate sync process
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 200);

      // Wait for sync to complete
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update records after sync
      const syncedCount = pendingRecords;
      setPendingRecords(0);
      setLastSyncTime(new Date().toLocaleTimeString('ar-EG'));

      setToast({ message: `تمت مزامنة ${syncedCount} سجلات بنجاح`, type: 'success' });
    } catch (error) {
      console.error('Sync error:', error);
      setToast({ message: 'فشل عملية المزامنة', type: 'error' });
    } finally {
      setIsSyncing(false);
      setProgress(0);
    }
  };

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-full px-6 py-3 border border-gray-200 z-50 flex items-center space-x-4 min-w-max">
      {/* Connection Status */}
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-sm font-medium">
          {isOnline ? 'متصل' : 'غير متصل'}
        </span>
      </div>
      
      {/* Pending Records */}
      {pendingRecords > 0 && (
        <div className="flex items-center">
          <span className="text-sm font-medium text-amber-600">
            {pendingRecords} معلق
          </span>
        </div>
      )}
      
      {/* Last Sync Time */}
      {lastSyncTime && (
        <div className="text-xs text-gray-500 hidden md:block">
          آخر مزامنة: {lastSyncTime}
        </div>
      )}
      
      {/* Sync Button */}
      <button
        onClick={handleSync}
        disabled={!isOnline || pendingRecords === 0 || isSyncing}
        className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center ${
          !isOnline || pendingRecords === 0 || isSyncing
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-emerald-600 text-white hover:bg-emerald-700'
        }`}
      >
        {isSyncing ? (
          <>
            <svg className="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            جاري...
          </>
        ) : (
          'مزامنة'
        )}
      </button>

      {/* Sync Progress Bar */}
      {isSyncing && (
        <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      )}
      </div>
    </>
  );
};

export default OfflineStatusBar;