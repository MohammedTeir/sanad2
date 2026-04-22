import {
  DPProfile,
  Camp,
  AidTransaction,
  InventoryItem,
  AidCampaign
} from '../types';
import { supabaseService } from './supabase';

export interface KPIReport {
  totalFamilies: number;
  totalIndividuals: number;
  demographicDistribution: {
    males: number;
    females: number;
    children: number; // Under 12
    teenagers: number; // 12-18
    adults: number; // 18-60
    seniors: number; // Over 60
  };
  aidCoverageRate: number; // Percentage of families who received aid
  averageDistributionTime: number; // Average time between aid campaigns
  gapsAnalysis: {
    familiesWithoutAid: number;
    familiesWithoutSpecificAidTypes: Record<string, number>;
  };
  criticalInventoryAlerts: InventoryItem[];
}

export interface DetailedReport {
  familiesReport: DPProfile[];
  individualsReport: {
    id: string;
    name: string;
    familyId: string;
    age: number;
    gender: 'ذكر' | 'أنثى';
    healthStatus: {
      disability: boolean;
      chronicDisease: boolean;
      warInjury: boolean;
    };
  }[];
  distributionReport: AidTransaction[];
  inventoryReport: InventoryItem[];
  // ⚠️  DISABLED: Vulnerability report - Vulnerability score system disabled
  // vulnerabilityReport: {
  //   familyId: string;
  //   familyHead: string;
  //   vulnerabilityScore: number;
  //   vulnerabilityPriority: 'عالي جداً' | 'عالي' | 'متوسط' | 'منخفض';
  // }[];
  vulnerabilityReport: any[]; // Disabled - returns empty array
}

export interface ChartData {
  type: 'pie' | 'bar' | 'line' | 'heatmap';
  title: string;
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
  }[];
}

export class ReportingService {
  /**
   * Generates KPI report with key performance indicators
   */
  async generateKPIReport(campId?: string): Promise<KPIReport> {
    // Get all families
    const allFamilies = await this.getAllFamilies(campId);
    const allIndividuals = await this.getAllIndividuals(campId);
    const allAidDistributions = await this.getAllAidDistributions(campId);
    const allInventoryItems = await this.getAllInventoryItems(campId);

    // Calculate total families and individuals
    const totalFamilies = allFamilies.length;
    const totalIndividuals = allIndividuals.length;

    // Calculate demographic distribution
    const demographicDistribution = this.calculateDemographicDistribution(allIndividuals);

    // Calculate aid coverage rate
    const aidCoverageRate = this.calculateAidCoverageRate(allFamilies, allAidDistributions);

    // Calculate average distribution time
    const averageDistributionTime = this.calculateAverageDistributionTime(allAidDistributions);

    // Calculate gaps analysis
    const gapsAnalysis = this.calculateGapsAnalysis(allFamilies, allAidDistributions);

    // Get critical inventory alerts
    const criticalInventoryAlerts = this.getCriticalInventoryAlerts(allInventoryItems);

    return {
      totalFamilies,
      totalIndividuals,
      demographicDistribution,
      aidCoverageRate,
      averageDistributionTime,
      gapsAnalysis,
      criticalInventoryAlerts
    };
  }

  /**
   * Generates detailed reports
   */
  async generateDetailedReports(filters?: {
    vulnerabilityRange?: [number, number];
    socialStatus?: string;
    aidType?: string;
    distributionStatus?: 'تم التسليم' | 'قيد الانتظار';
  }): Promise<DetailedReport> {
    // Get all data
    const allFamilies = await this.getAllFamilies();
    const allIndividuals = await this.getAllIndividuals();
    const allAidDistributions = await this.getAllAidDistributions();
    const allInventoryItems = await this.getAllInventoryItems();

    // Apply filters to families report
    let filteredFamilies = allFamilies;
    // ⚠️  DISABLED: Vulnerability range filter
    // if (filters?.vulnerabilityRange) {
    //   filteredFamilies = allFamilies.filter(family =>
    //     family.vulnerabilityScore >= filters.vulnerabilityRange![0] &&
    //     family.vulnerabilityScore <= filters.vulnerabilityRange![1]
    //   );
    // }

    // Generate individuals report
    const individualsReport = allIndividuals.map(individual => ({
      id: individual.id,
      name: individual.name,
      familyId: individual.familyId,
      age: individual.age,
      gender: individual.gender,
      healthStatus: {
        disability: individual.disabilityType !== 'لا يوجد',
        chronicDisease: individual.chronicDiseaseType !== 'لا يوجد',
        warInjury: individual.hasWarInjury
      }
    }));

    // Apply filters to distribution report
    let filteredDistributions = allAidDistributions;
    if (filters?.aidType) {
      filteredDistributions = allAidDistributions.filter(dist => dist.aidType === filters.aidType);
    }
    if (filters?.distributionStatus) {
      filteredDistributions = allAidDistributions.filter(dist => dist.status === filters.distributionStatus);
    }

    // ⚠️  DISABLED: Vulnerability report - returns empty array
    // const vulnerabilityReport = allFamilies.map(family => ({
    //   familyId: family.id,
    //   familyHead: family.headOfFamily,
    //   vulnerabilityScore: family.vulnerabilityScore,
    //   vulnerabilityPriority: family.vulnerabilityPriority
    // })).sort((a, b) => b.vulnerabilityScore - a.vulnerabilityScore);
    const vulnerabilityReport: any[] = [];

    return {
      familiesReport: filteredFamilies,
      individualsReport,
      distributionReport: filteredDistributions,
      inventoryReport: allInventoryItems,
      vulnerabilityReport
    };
  }

  /**
   * Generates chart data for visualization
   */
  generateChartData(reportType: 'demographics' | 'aidCoverage' | 'vulnerability' | 'inventory'): ChartData {
    switch (reportType) {
      case 'demographics':
        return this.generateDemographicsChart();
      case 'aidCoverage':
        return this.generateAidCoverageChart();
      case 'vulnerability':
        return this.generateVulnerabilityChart();
      case 'inventory':
        return this.generateInventoryChart();
      default:
        throw new Error(`Unknown report type: ${reportType}`);
    }
  }

  private async getAllFamilies(campId?: string): Promise<DPProfile[]> {
    // In a real implementation, this would fetch from the appropriate service
    // For now, we'll return an empty array
    return [];
  }

  private async getAllIndividuals(campId?: string): Promise<any[]> {
    // In a real implementation, this would fetch from the appropriate service
    // For now, we'll return an empty array
    return [];
  }

  private async getAllAidDistributions(campId?: string): Promise<AidTransaction[]> {
    // In a real implementation, this would fetch from the appropriate service
    // For now, we'll return an empty array
    return [];
  }

  private async getAllInventoryItems(campId?: string): Promise<InventoryItem[]> {
    // In a real implementation, this would fetch from the appropriate service
    // For now, we'll return an empty array
    return [];
  }

  private calculateDemographicDistribution(individuals: any[]) {
    const distribution = {
      males: 0,
      females: 0,
      children: 0, // Under 12
      teenagers: 0, // 12-18
      adults: 0, // 18-60
      seniors: 0 // Over 60
    };

    for (const individual of individuals) {
      if (individual.gender === 'ذكر') distribution.males++;
      if (individual.gender === 'أنثى') distribution.females++;
      if (individual.age < 12) distribution.children++;
      if (individual.age >= 12 && individual.age < 18) distribution.teenagers++;
      if (individual.age >= 18 && individual.age < 60) distribution.adults++;
      if (individual.age >= 60) distribution.seniors++;
    }

    return distribution;
  }

  private calculateAidCoverageRate(families: DPProfile[], distributions: AidTransaction[]): number {
    if (families.length === 0) return 0;

    // Count unique families that received aid
    const familiesWithAid = new Set(distributions.map(dist => dist.dpId));
    return (familiesWithAid.size / families.length) * 100;
  }

  private calculateAverageDistributionTime(distributions: AidTransaction[]): number {
    if (distributions.length < 2) return 0;

    // Calculate average time between distributions
    const dates = distributions.map(dist => new Date(dist.date).getTime()).sort((a, b) => a - b);
    let totalTimeDiff = 0;

    for (let i = 1; i < dates.length; i++) {
      totalTimeDiff += dates[i] - dates[i - 1];
    }

    const avgTimeMs = totalTimeDiff / (dates.length - 1);
    // Convert to days
    return avgTimeMs / (1000 * 60 * 60 * 24);
  }

  private calculateGapsAnalysis(families: DPProfile[], distributions: AidTransaction[]): {
    familiesWithoutAid: number;
    familiesWithoutSpecificAidTypes: Record<string, number>;
  } {
    const familiesWithAid = new Set(distributions.map(dist => dist.dpId));
    const familiesWithoutAid = families.filter(family => !familiesWithAid.has(family.id)).length;

    // Calculate families without specific aid types
    const allAidTypes = [...new Set(distributions.map(dist => dist.aidType))];
    const familiesWithoutSpecificAidTypes: Record<string, number> = {};

    for (const aidType of allAidTypes) {
      const familiesReceivedThisAid = new Set(
        distributions
          .filter(dist => dist.aidType === aidType)
          .map(dist => dist.dpId)
      );
      const familiesWithoutThisAid = families.filter(
        family => !familiesReceivedThisAid.has(family.id)
      ).length;
      
      familiesWithoutSpecificAidTypes[aidType] = familiesWithoutThisAid;
    }

    return {
      familiesWithoutAid,
      familiesWithoutSpecificAidTypes
    };
  }

  private getCriticalInventoryAlerts(items: InventoryItem[]): InventoryItem[] {
    return items.filter(item => item.quantityAvailable <= item.minAlertThreshold);
  }

  private generateDemographicsChart(): ChartData {
    // This would be populated with real data in a real implementation
    return {
      type: 'pie',
      title: 'التوزيع الديموغرافي',
      labels: ['ذكور', 'إناث'],
      datasets: [{
        label: 'توزيع الجنس',
        data: [55, 45], // Placeholder values
        backgroundColor: ['#36a2eb', '#ff6384']
      }]
    };
  }

  private generateAidCoverageChart(): ChartData {
    return {
      type: 'bar',
      title: 'تغطية المساعدات حسب النوع',
      labels: ['غذائية', 'غير غذائية', 'طبية', 'مالية'],
      datasets: [{
        label: 'التغطية (%)',
        data: [75, 60, 80, 40], // Placeholder values
        backgroundColor: ['#4bc0c0', '#ff9f40', '#ff6384', '#36a2eb']
      }]
    };
  }

  private generateVulnerabilityChart(): ChartData {
    return {
      type: 'bar',
      title: 'الأسر حسب مستوى الاحتياج',
      labels: ['عالي جداً', 'عالي', 'متوسط', 'منخفض'],
      datasets: [{
        label: 'عدد الأسر',
        data: [15, 30, 40, 15], // Placeholder values
        backgroundColor: ['#ff6384', '#ff9f40', '#ffcd56', '#4bc0c0']
      }]
    };
  }

  private generateInventoryChart(): ChartData {
    return {
      type: 'line',
      title: 'مستويات المخزون مع مرور الوقت',
      labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
      datasets: [{
        label: 'مواد غذائية',
        data: [65, 59, 80, 81, 56, 55],
        backgroundColor: ['#36a2eb']
      }, {
        label: 'مستلزمات طبية',
        data: [28, 48, 40, 19, 86, 27],
        backgroundColor: ['#ff6384']
      }]
    };
  }
}

export const reportingService = new ReportingService();