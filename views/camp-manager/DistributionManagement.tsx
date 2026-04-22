// views/camp-manager/DistributionManagement.tsx
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * @deprecated Use /manager/distribution instead
 * This component is kept for backward compatibility and redirects to the new dedicated pages
 * 
 * New dedicated pages:
 * - DistributionList: /manager/distribution (campaign overview)
 * - DistributionDetails: /manager/distribution/:campaignId (single campaign distribution)
 * - DistributionHistory: /manager/distribution-history (all distribution records)
 */
const DistributionManagement: React.FC = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    navigate('/manager/distribution', { replace: true });
  }, [navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-amber-500"></div>
        <p className="text-gray-500 font-bold text-sm">جاري الانتقال للصفحة الجديدة...</p>
      </div>
    </div>
  );
};

export default DistributionManagement;
