// services/performanceMonitoringService.ts
import { supabaseService } from './supabase';

export interface PerformanceMetrics {
  cacheHitRate: number;
  activeConnections: number;
  slowQueries: SlowQuery[];
  topResources: ResourceAccessCount[];
  databaseHealth: DatabaseHealth;
}

export interface SlowQuery {
  query: string;
  executionTime: number;
  timestamp: string;
}

export interface ResourceAccessCount {
  resourceType: string;
  resourceId: string;
  accessCount: number;
}

export interface DatabaseHealth {
  uptime: string;
  connections: number;
  activeQueries: number;
  replicationLag: number | null;
}

class PerformanceMonitoringService {
  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    // In a real implementation, this would query database performance views
    // For now, we'll simulate the data
    
    // Query the performance monitoring views we created in the SQL
    const { data: tableStats } = await supabaseService.client
      .from('performance_monitoring_view')
      .select('*')
      .limit(10);
    
    const { data: frequentAccess } = await supabaseService.client
      .from('frequently_accessed_records')
      .select('*')
      .limit(10);
    
    // Simulated metrics based on our database statistics
    return {
      cacheHitRate: this.calculateCacheHitRate(),
      activeConnections: this.getActiveConnections(),
      slowQueries: this.getSlowQueries(),
      topResources: frequentAccess?.map(item => ({
        resourceType: item.resource_type,
        resourceId: item.resource_id,
        accessCount: item.access_count
      })) || [],
      databaseHealth: {
        uptime: '7 days, 3 hours, 22 minutes',
        connections: 12,
        activeQueries: 3,
        replicationLag: null // Not applicable for single instance
      }
    };
  }

  private calculateCacheHitRate(): number {
    // In a real implementation, this would track actual cache hits/misses
    // For simulation, return a realistic value
    return 0.87; // 87% cache hit rate
  }

  private getActiveConnections(): number {
    // In a real implementation, this would query database connection stats
    return 15;
  }

  private getSlowQueries(): SlowQuery[] {
    // In a real implementation, this would query database logs for slow queries
    // For simulation, return sample data
    return [
      {
        // ⚠️  DISABLED: vulnerability_score ORDER BY removed
        query: 'SELECT * FROM families WHERE camp_id = $1',
        executionTime: 245,
        timestamp: new Date(Date.now() - 300000).toISOString() // 5 minutes ago
      },
      {
        query: 'SELECT * FROM aid_distributions WHERE family_id = $1',
        executionTime: 187,
        timestamp: new Date(Date.now() - 600000).toISOString() // 10 minutes ago
      }
    ];
  }

  async getOptimizationRecommendations(): Promise<string[]> {
    const metrics = await this.getPerformanceMetrics();
    const recommendations: string[] = [];

    // Check cache hit rate
    if (metrics.cacheHitRate < 0.8) {
      recommendations.push('Consider increasing cache TTL for frequently accessed data');
    }

    // Check for slow queries
    if (metrics.slowQueries.some(query => query.executionTime > 200)) {
      recommendations.push('Review slow queries and consider adding appropriate indexes');
    }

    // Check database health
    if (metrics.databaseHealth.activeQueries > 10) {
      recommendations.push('High number of active queries - consider optimizing queries or scaling database');
    }

    // Check frequently accessed resources
    if (metrics.topResources.length > 0 && metrics.topResources[0].accessCount > 1000) {
      recommendations.push(`Resource ${metrics.topResources[0].resourceId} is frequently accessed - consider caching strategy`);
    }

    return recommendations;
  }

  async logPerformanceMetric(metricName: string, value: number, tags?: Record<string, string>): Promise<void> {
    // In a real implementation, this would log to a metrics collection system
    console.log(`Performance metric: ${metricName} = ${value}`, tags);
  }

  async getQueryPerformance(query: string): Promise<number> {
    // In a real implementation, this would measure actual query performance
    // For simulation, return a random value
    return Math.floor(Math.random() * 300) + 50; // Between 50-350ms
  }
}

export const performanceMonitoringService = new PerformanceMonitoringService();