import React, { useState, useEffect } from 'react';
import { reportingService, DetailedReport } from '../services/reportingService';
import { RTLView, RTLText } from '../components/RTLText';
import { DashboardCard } from '../components/DashboardCard';

interface ReportFilter {
  vulnerabilityRange?: [number, number];
  socialStatus?: string;
  aidType?: string;
  distributionStatus?: 'تم التسليم' | 'قيد الانتظار';
}

type ReportType = 'families' | 'individuals' | 'distribution' | 'inventory' | 'vulnerability';

const ReportsScreen: React.FC = () => {
  const [reports, setReports] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<ReportType>('families');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<ReportFilter>({});

  useEffect(() => {
    loadReports();
  }, [filters]);

  const loadReports = async () => {
    try {
      setLoading(true);
      const detailedReports = await reportingService.generateDetailedReports(filters);
      setReports(detailedReports);
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    loadReports();
    setShowFilters(false);
  };

  const renderReportContent = () => {
    if (!reports) return null;

    switch (selectedReport) {
      case 'families':
        return (
          <DashboardCard title="تقرير الأسر">
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-gray-700">إجمالي الأسر</RTLText>
                <RTLText className="font-bold">{reports.families.length}</RTLText>
              </div>
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-gray-700">أسر جديدة هذا الشهر</RTLText>
                <RTLText className="font-bold">{reports.newFamiliesThisMonth}</RTLText>
              </div>
            </div>
          </DashboardCard>
        );

      case 'individuals':
        return (
          <DashboardCard title="تقرير الأفراد">
            <div className="space-y-2">
              <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
                <RTLText className="text-gray-700">إجمالي الأفراد</RTLText>
                <RTLText className="font-bold">{reports.individuals.length}</RTLText>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="p-3 bg-blue-50 rounded-lg text-center">
                  <RTLText className="text-sm text-gray-600">ذكور</RTLText>
                  <RTLText className="text-xl font-bold text-blue-700">{reports.demographicBreakdown.males}</RTLText>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg text-center">
                  <RTLText className="text-sm text-gray-600">إناث</RTLText>
                  <RTLText className="text-xl font-bold text-pink-700">{reports.demographicBreakdown.females}</RTLText>
                </div>
              </div>
            </div>
          </DashboardCard>
        );

      case 'distribution':
        return (
          <DashboardCard title="تقرير التوزيع">
            <div className="space-y-2">
              {reports.distributionHistory.map((dist, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <RTLText className="font-bold text-gray-900">{dist.aidType}</RTLText>
                  <RTLText className="text-sm text-gray-600">{dist.date}</RTLText>
                  <RTLText className="text-sm text-gray-500">{dist.quantityDistributed} {dist.unit}</RTLText>
                </div>
              ))}
            </div>
          </DashboardCard>
        );

      case 'inventory':
        return (
          <DashboardCard title="تقرير المخزون">
            <div className="space-y-2">
              {reports.inventoryLevels.map((item, index) => (
                <div key={index} className={`p-3 rounded-lg ${item.quantityAvailable < item.minAlertThreshold ? 'bg-red-50 border border-red-200' : 'bg-gray-50'}`}>
                  <RTLText className="font-bold text-gray-900">{item.name}</RTLText>
                  <RTLText className="text-sm text-gray-600">المتوفر: {item.quantityAvailable} {item.unit}</RTLText>
                  {item.quantityAvailable < item.minAlertThreshold && (
                    <RTLText className="text-sm text-red-600 font-bold">⚠️ منخفض</RTLText>
                  )}
                </div>
              ))}
            </div>
          </DashboardCard>
        );

      case 'vulnerability':
        return (
          <DashboardCard title="تقرير الهشاشة">
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-green-50 rounded-lg text-center">
                  <RTLText className="text-sm text-gray-600">منخفضة</RTLText>
                  <RTLText className="text-xl font-bold text-green-700">{reports.vulnerabilityDistribution.low}</RTLText>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg text-center">
                  <RTLText className="text-sm text-gray-600">متوسطة</RTLText>
                  <RTLText className="text-xl font-bold text-yellow-700">{reports.vulnerabilityDistribution.medium}</RTLText>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg text-center">
                  <RTLText className="text-sm text-gray-600">عالية</RTLText>
                  <RTLText className="text-xl font-bold text-orange-700">{reports.vulnerabilityDistribution.high}</RTLText>
                </div>
                <div className="p-3 bg-red-50 rounded-lg text-center">
                  <RTLText className="text-sm text-gray-600">حرجة</RTLText>
                  <RTLText className="text-xl font-bold text-red-700">{reports.vulnerabilityDistribution.critical}</RTLText>
                </div>
              </div>
            </div>
          </DashboardCard>
        );

      default:
        return null;
    }
  };

  return (
    <RTLView className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <RTLText className="text-2xl font-bold text-gray-900">التقارير</RTLText>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            {showFilters ? 'إخفاء الفلاتر' : 'الفلاتر'}
          </button>
        </div>

        {/* Filters */}
        {showFilters && (
          <DashboardCard title="الفلاتر">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">نوع الهشاشة</label>
                <select
                  value={filters.vulnerabilityRange?.[0] || ''}
                  onChange={(e) => setFilters({ ...filters, vulnerabilityRange: [parseInt(e.target.value) || 0, 100] as [number, number] })}
                  className="w-full p-2 border border-gray-300 rounded-lg"
                >
                  <option value="">الكل</option>
                  <option value="0">منخفضة (0-40)</option>
                  <option value="40">متوسطة (40-60)</option>
                  <option value="60">عالية (60-80)</option>
                  <option value="80">حرجة (80-100)</option>
                </select>
              </div>
              <button
                onClick={applyFilters}
                className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                تطبيق
              </button>
            </div>
          </DashboardCard>
        )}

        {/* Report Type Selector */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'families' as ReportType, label: 'الأسر' },
            { id: 'individuals' as ReportType, label: 'الأفراد' },
            { id: 'distribution' as ReportType, label: 'التوزيع' },
            { id: 'inventory' as ReportType, label: 'المخزون' },
            { id: 'vulnerability' as ReportType, label: 'الهشاشة' }
          ].map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedReport(type.id)}
              className={`px-4 py-2 rounded-lg font-bold ${
                selectedReport === type.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {type.label}
            </button>
          ))}
        </div>

        {/* Report Content */}
        {loading ? (
          <div className="text-center py-10">
            <RTLText className="text-gray-600">جاري التحميل...</RTLText>
          </div>
        ) : (
          renderReportContent()
        )}
      </div>
    </RTLView>
  );
};

export default ReportsScreen;
