import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reportingService, KPIReport } from '../services/reportingService';
import { RTLView, RTLText } from '../components/RTLText';
import { DashboardCard } from '../components/DashboardCard';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: string;
}

const KPICard: React.FC<KPICardProps> = ({ title, value, subtitle, color = '#36a2eb' }) => {
  return (
    <div className="bg-white rounded-xl shadow-md p-4 border-l-4 flex-1 min-w-[45%] mb-4" style={{ borderColor: color }}>
      <RTLText className="text-sm font-bold text-gray-600">{title}</RTLText>
      <RTLText className="text-2xl font-bold text-gray-900 mt-1">{value}</RTLText>
      {subtitle && <RTLText className="text-xs text-gray-500 mt-1">{subtitle}</RTLText>}
    </div>
  );
};

const DashboardScreen: React.FC = () => {
  const { user } = useAuth();
  const [kpiReport, setKpiReport] = useState<KPIReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKPIReport();
  }, []);

  const loadKPIReport = async () => {
    try {
      setLoading(true);
      const report = await reportingService.generateKPIReport();
      setKpiReport(report);
    } catch (error) {
      console.error('Error loading KPI report:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <RTLView className="min-h-screen flex items-center justify-center bg-gray-50">
        <RTLText className="text-lg text-gray-600">جاري التحميل...</RTLText>
      </RTLView>
    );
  }

  return (
    <RTLView className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <RTLText className="text-2xl font-bold text-gray-900 mb-2">لوحة التحكم</RTLText>
        <RTLText className="text-base text-gray-600 mb-6">مرحباً، {user?.name}</RTLText>

        {/* KPI Cards */}
        <div className="flex flex-wrap gap-4 mb-6">
          <KPICard
            title="إجمالي الأسر"
            value={kpiReport?.totalFamilies || 0}
            subtitle="عدد الأسر في المخيم"
            color="#36a2eb"
          />
          <KPICard
            title="إجمالي الأفراد"
            value={kpiReport?.totalIndividuals || 0}
            subtitle="عدد الأفراد في المخيم"
            color="#ff6384"
          />
          <KPICard
            title="نسبة تغطية المساعدات"
            value={`${kpiReport?.aidCoverageRate ? kpiReport.aidCoverageRate.toFixed(1) : 0}%`}
            subtitle="نسبة الأسر التي تلقت مساعدات"
            color="#4bc0c0"
          />
          <KPICard
            title="متوسط زمن التوزيع"
            value={`${kpiReport?.averageDistributionTime ? kpiReport.averageDistributionTime.toFixed(1) : 0} يوم`}
            subtitle="متوسط الوقت بين التوزيعات"
            color="#ff9f40"
          />
        </div>

        {/* Demographic Distribution */}
        {kpiReport && (
          <DashboardCard title="التوزيع الديمغرافي">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-sm text-gray-600">الذكور</RTLText>
                <RTLText className="text-xl font-bold text-gray-900">{kpiReport.demographicDistribution.males}</RTLText>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-sm text-gray-600">الإناث</RTLText>
                <RTLText className="text-xl font-bold text-gray-900">{kpiReport.demographicDistribution.females}</RTLText>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-sm text-gray-600">الأطفال</RTLText>
                <RTLText className="text-xl font-bold text-gray-900">{kpiReport.demographicDistribution.children}</RTLText>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-sm text-gray-600">المراهقين</RTLText>
                <RTLText className="text-xl font-bold text-gray-900">{kpiReport.demographicDistribution.teenagers}</RTLText>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-sm text-gray-600">البالغين</RTLText>
                <RTLText className="text-xl font-bold text-gray-900">{kpiReport.demographicDistribution.adults}</RTLText>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-sm text-gray-600">كبار السن</RTLText>
                <RTLText className="text-xl font-bold text-gray-900">{kpiReport.demographicDistribution.seniors}</RTLText>
              </div>
            </div>
          </DashboardCard>
        )}

        {/* Critical Inventory Alerts */}
        {kpiReport && kpiReport.criticalInventoryAlerts.length > 0 && (
          <DashboardCard title="تنبيهات المخزون الحرج">
            <div className="space-y-3">
              {kpiReport.criticalInventoryAlerts.map((item, index) => (
                <div key={index} className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <RTLText className="font-bold text-gray-900">{item.name}</RTLText>
                  <RTLText className="text-sm text-red-600">
                    المتوفر: {item.quantityAvailable} {item.unit}
                  </RTLText>
                  <RTLText className="text-sm text-gray-500">
                    الحد الأدنى: {item.minAlertThreshold} {item.unit}
                  </RTLText>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}

        {/* Gaps Analysis */}
        {kpiReport && (
          <DashboardCard title="تحليل الفجوات">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-gray-700">الأسر التي لم تتلق مساعدات</RTLText>
                <RTLText className="font-bold text-gray-900">{kpiReport.gapsAnalysis.familiesWithoutAid}</RTLText>
              </div>
              {Object.entries(kpiReport.gapsAnalysis.familiesWithoutSpecificAidTypes).map(([aidType, count], index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <RTLText className="text-gray-700">بدون مساعدة {aidType}</RTLText>
                  <RTLText className="font-bold text-gray-900">{count}</RTLText>
                </div>
              ))}
            </div>
          </DashboardCard>
        )}
      </div>
    </RTLView>
  );
};

export default DashboardScreen;
