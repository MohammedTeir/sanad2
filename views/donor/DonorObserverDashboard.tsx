// views/DonorObserverDashboard.tsx
import React, { useState, useEffect } from 'react';
import { useRTLDirection } from '../../hooks/useRTL';
import { DashboardCard } from '../../components/DashboardCard';
import DataTable from '../../components/DataTable';
import { RTLText } from '../../components/RTLText';
import { realDataService } from '../../services/realDataServiceBackend';
import { DPProfile, Camp } from '../../types';

interface DonorObserverDashboardProps {
  section: string;
}

const DonorObserverDashboard: React.FC<DonorObserverDashboardProps> = ({ section }) => {
  const { direction, textAlign } = useRTLDirection();
  const [campStats, setCampStats] = useState<any[]>([]);
  const [distributionStats, setDistributionStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when page loads
    window.scrollTo(0, 0);
    
    const loadData = async () => {
      try {
        const camps = await realDataService.getCamps();
        const dps = await realDataService.getDPs();
        
        // Process camp statistics (aggregated, no sensitive data)
        const processedCamps = camps.map(camp => ({
          id: camp.id,
          name: camp.name,
          families: dps.filter(dp => dp.currentHousing.campId === camp.id).length,
          population: dps.filter(dp => dp.currentHousing.campId === camp.id).reduce((sum, dp) => sum + dp.totalMembersCount, 0),
          activeDistributions: 0 // This would come from distribution data
        }));
        
        setCampStats(processedCamps);
        
        // For distribution stats, we would load from distribution records
        // For now, using mock data as an example
        setDistributionStats([
          { id: '1', camp: 'مخيم الأمل', aidType: 'سلال غذائية', beneficiaries: 450, date: '2024-01-15' },
          { id: '2', camp: 'مخيم الكرامة', aidType: 'مستلزمات طبية', beneficiaries: 230, date: '2024-01-18' },
          { id: '3', camp: 'مخيم الوحدة', aidType: 'أغطية شتوية', beneficiaries: 680, date: '2024-01-20' },
        ]);
        
        setLoading(false);
      } catch (error) {
        console.error('Error loading data for donor observer dashboard:', error);
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const columns = [
    { key: 'name', header: 'اسم المخيم' },
    { key: 'families', header: 'الأسر' },
    { key: 'population', header: 'السكان' },
    { key: 'activeDistributions', header: 'التوزيعات النشطة' },
  ];

  const distributionColumns = [
    { key: 'camp', header: 'المخيم' },
    { key: 'aidType', header: 'نوع المساعدة' },
    { key: 'beneficiaries', header: 'المستفيدون' },
    { key: 'date', header: 'التاريخ' },
  ];

  const StatCard = ({ title, value, icon, color }: { title: string; value: string | number; icon: React.ReactNode; color: 'emerald' | 'blue' | 'amber' | 'red' | 'gray'; }) => (
    <DashboardCard
      title={title}
      value={value}
      icon={icon}
      color={color}
    />
  );

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64" style={{ direction }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600 mb-4"></div>
          <p className="text-gray-600 font-bold">جاري تحميل البيانات العامة...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6" style={{ direction }}>
      <div className="mb-8">
        <RTLText as="h1" className="text-2xl font-bold text-gray-800 mb-2">
          لوحة مراقب المانحين
        </RTLText>
        <RTLText className="text-gray-600">
          عرض ملخص الأداء والإحصائيات العامة للمنصة
        </RTLText>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="إجمالي المخيمات"
          value={campStats.length}
          color="emerald"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <StatCard
          title="إجمالي الأسر"
          value={campStats.reduce((sum, camp) => sum + camp.families, 0)}
          color="blue"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />
        <StatCard
          title="إجمالي السكان"
          value={campStats.reduce((sum, camp) => sum + camp.population, 0)}
          color="amber"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          }
        />
        <StatCard
          title="التوزيعات هذا الشهر"
          value="86"
          color="red"
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          }
        />
      </div>

      {/* Camp Statistics Table */}
      <div className="mb-8">
        <RTLText as="h2" className="text-xl font-semibold text-gray-800 mb-4">
          إحصائيات المخيمات
        </RTLText>
        <DataTable
          columns={columns}
          data={campStats}
          searchable={true}
        />
      </div>

      {/* Distribution Statistics Table */}
      <div className="mb-8">
        <RTLText as="h2" className="text-xl font-semibold text-gray-800 mb-4">
          إحصائيات التوزيع
        </RTLText>
        <DataTable
          columns={distributionColumns}
          data={distributionStats}
          searchable={true}
        />
      </div>
    </div>
  );
};

export default DonorObserverDashboard;