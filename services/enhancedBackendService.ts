import { supabaseService } from './supabase';
import { Cache } from 'memory-cache';

// Simple in-memory cache implementation
// In production, consider using Redis or similar
class BackendCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes

  get<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data as T;
  }

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  invalidate(pattern: string): void {
    // Simple invalidation - in real implementation, use more sophisticated pattern matching
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

export const backendCache = new BackendCache();

// Enhanced service with caching and performance optimizations
export class EnhancedSupabaseService {
  private cache = backendCache;

  // Cached methods for frequently accessed data
  async getCampsWithCache(): Promise<any[]> {
    const cacheKey = 'camps:all';
    const cached = this.cache.get<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const camps = await supabaseService.getCamps();
    this.cache.set(cacheKey, camps, 10 * 60 * 1000); // Cache for 10 minutes
    return camps;
  }

  async getCampByIdWithCache(id: string): Promise<any | null> {
    const cacheKey = `camps:${id}`;
    const cached = this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const camp = await supabaseService.getCampById(id);
    if (camp) {
      this.cache.set(cacheKey, camp, 10 * 60 * 1000); // Cache for 10 minutes
    }
    return camp;
  }

  async getFamiliesByCampWithCache(campId: string): Promise<any[]> {
    const cacheKey = `families:camp:${campId}`;
    const cached = this.cache.get<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const families = await supabaseService.getFamilies(campId);
    this.cache.set(cacheKey, families, 5 * 60 * 1000); // Cache for 5 minutes
    return families;
  }

  async getFamilyByIdWithCache(id: string): Promise<any | null> {
    const cacheKey = `families:${id}`;
    const cached = this.cache.get<any>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const family = await supabaseService.getFamilyById(id);
    if (family) {
      this.cache.set(cacheKey, family, 5 * 60 * 1000); // Cache for 5 minutes
    }
    return family;
  }

  async getInventoryByCampWithCache(campId: string): Promise<any[]> {
    const cacheKey = `inventory:camp:${campId}`;
    const cached = this.cache.get<any[]>(cacheKey);
    
    if (cached) {
      return cached;
    }
    
    const inventory = await supabaseService.getInventoryByCampId(campId);
    this.cache.set(cacheKey, inventory, 2 * 60 * 1000); // Cache for 2 minutes (inventory changes frequently)
    return inventory;
  }

  // Method to invalidate cache when data changes
  private invalidateRelatedCache(operation: string, resourceId: string, resourceType: string): void {
    switch(resourceType) {
      case 'camp':
        this.cache.invalidate(`camps:${resourceId}`);
        this.cache.invalidate('camps:all');
        this.cache.invalidate(`families:camp:${resourceId}`);
        this.cache.invalidate(`inventory:camp:${resourceId}`);
        break;
      case 'family':
        this.cache.invalidate(`families:${resourceId}`);
        break;
      case 'inventory':
        this.cache.invalidate(`inventory:camp:*`);
        this.cache.invalidate(`inventory:*`);
        break;
    }
  }

  // Enhanced method with caching and audit logging
  async createFamilyWithAudit(family: any, userId: string): Promise<any> {
    try {
      // Invalidate related caches before update
      if (family.camp_id) {
        this.cache.invalidate(`families:camp:${family.camp_id}`);
        this.cache.invalidate(`families:all`);
      }

      const result = await supabaseService.createFamily(family);
      
      // Log the operation
      await supabaseService.logSystemOperation({
        user_id: userId,
        operation_type: 'CREATE_FAMILY',
        resource_type: 'family',
        resource_id: result.id,
        old_values: null,
        new_values: result,
        ip_address: null,
        user_agent: null
      });

      return result;
    } catch (error) {
      console.error('Error creating family with audit:', error);
      throw error;
    }
  }

  async updateFamilyWithAudit(id: string, updates: any, userId: string): Promise<any> {
    try {
      // Get current family data for audit purposes
      const currentFamily = await supabaseService.getFamilyById(id);
      
      // Invalidate related caches before update
      if (currentFamily?.camp_id) {
        this.cache.invalidate(`families:camp:${currentFamily.camp_id}`);
      }
      this.cache.invalidate(`families:${id}`);

      const result = await supabaseService.updateFamily(id, updates);
      
      // Log the operation
      await supabaseService.logSystemOperation({
        user_id: userId,
        operation_type: 'UPDATE_FAMILY',
        resource_type: 'family',
        resource_id: id,
        old_values: currentFamily,
        new_values: result,
        ip_address: null,
        user_agent: null
      });

      return result;
    } catch (error) {
      console.error('Error updating family with audit:', error);
      throw error;
    }
  }

  async createAidDistributionWithAudit(distribution: any, userId: string): Promise<any> {
    try {
      // Invalidate related caches before update
      this.cache.invalidate(`families:${distribution.family_id}`);
      this.cache.invalidate(`inventory:*`);

      const result = await supabaseService.createAidDistribution(distribution);
      
      // Log the operation
      await supabaseService.logSystemOperation({
        user_id: userId,
        operation_type: 'CREATE_AID_DISTRIBUTION',
        resource_type: 'aid_distribution',
        resource_id: result.id,
        old_values: null,
        new_values: result,
        ip_address: null,
        user_agent: null
      });

      return result;
    } catch (error) {
      console.error('Error creating aid distribution with audit:', error);
      throw error;
    }
  }

  // Performance monitoring method
  async getPerformanceMetrics(): Promise<any> {
    // This would connect to your database's performance monitoring views
    // For now, returning mock data
    return {
      cacheHitRate: this.calculateCacheHitRate(),
      activeConnections: 0, // Would come from database stats
      slowQueries: [], // Would come from database logs
      topResources: [] // Would come from access logs
    };
  }

  private calculateCacheHitRate(): number {
    // Simplified cache hit rate calculation
    // In a real implementation, you'd track hits and misses
    return 0.85; // Assuming 85% cache hit rate
  }

  // Method to warm up cache with commonly accessed data
  async warmUpCache(): Promise<void> {
    try {
      // Preload commonly accessed data
      await this.getCampsWithCache();
      
      // Could also preload other frequently accessed data here
      console.log('Cache warmed up successfully');
    } catch (error) {
      console.error('Error warming up cache:', error);
    }
  }
}

export const enhancedSupabaseService = new EnhancedSupabaseService();