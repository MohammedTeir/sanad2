import { supabaseService } from './supabase';
import { storageService } from './storage';
import { DPProfile, InventoryItem } from '../types';
import { makePublicRequest } from '../utils/apiUtils';

export interface AuditLogEntry {
  id: string;
  userId: string;
  operationType: 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'export' | 'import' | 'distribution' | 'audit';
  resourceType: string; // 'family', 'individual', 'inventory', etc.
  resourceId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

export interface SystemOperationLog {
  id: string;
  userId: string;
  operationType: string;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

/**
 * Service for managing audit logs and system operations
 */
export class AuditService {
  /**
   * Logs an operation to the audit trail
   */
  async logOperation(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    try {
      await makePublicRequest('/reports/log-operation', {
        method: 'POST',
        body: JSON.stringify({
          user_id: entry.userId,
          operation_type: entry.operationType,
          resource_type: entry.resourceType,
          resource_id: entry.resourceId,
          old_values: entry.oldValue || {},
          new_values: entry.newValue || {},
          ip_address: entry.ipAddress || '',
          user_agent: entry.userAgent || '',
        }),
      });
    } catch (error) {
      console.debug('Audit logging skipped (expected for public operations):', error instanceof Error ? error.message : error);
    }
  }

  /**
   * Logs a family creation
   */
  async logFamilyCreation(userId: string, family: DPProfile): Promise<void> {
    await this.logOperation({
      userId,
      operationType: 'create',
      resourceType: 'family',
      resourceId: family.id,
      newValue: family,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Logs a family update
   */
  async logFamilyUpdate(userId: string, familyId: string, oldValue: DPProfile, newValue: DPProfile): Promise<void> {
    await this.logOperation({
      userId,
      operationType: 'update',
      resourceType: 'family',
      resourceId: familyId,
      oldValue,
      newValue,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Logs a family deletion (soft delete)
   */
  async logFamilyDeletion(userId: string, familyId: string, family: DPProfile): Promise<void> {
    await this.logOperation({
      userId,
      operationType: 'delete',
      resourceType: 'family',
      resourceId: familyId,
      oldValue: family,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Logs an inventory transaction
   */
  async logInventoryTransaction(userId: string, itemId: string, oldValue: InventoryItem, newValue: InventoryItem): Promise<void> {
    await this.logOperation({
      userId,
      operationType: 'update',
      resourceType: 'inventory',
      resourceId: itemId,
      oldValue,
      newValue,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Logs a distribution event
   */
  async logDistributionEvent(userId: string, familyId: string, aidDetails: any): Promise<void> {
    await this.logOperation({
      userId,
      operationType: 'distribution',
      resourceType: 'aid_distribution',
      resourceId: familyId,
      newValue: aidDetails,
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Logs a data export event
   */
  async logExportEvent(userId: string, entityType: string, recordCount: number): Promise<void> {
    await this.logOperation({
      userId,
      operationType: 'export',
      resourceType: entityType,
      resourceId: 'export_operation',
      newValue: { recordCount, entityType },
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Logs a data import event
   */
  async logImportEvent(userId: string, entityType: string, recordCount: number, successCount: number, errorCount: number): Promise<void> {
    await this.logOperation({
      userId,
      operationType: 'import',
      resourceType: entityType,
      resourceId: 'import_operation',
      newValue: { 
        recordCount, 
        entityType, 
        successCount, 
        errorCount,
        timestamp: new Date().toISOString()
      },
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Logs a user login event
   */
  async logLoginEvent(userId: string, username: string): Promise<void> {
    await this.logOperation({
      userId,
      operationType: 'login',
      resourceType: 'user_session',
      resourceId: userId,
      newValue: { username, loginTime: new Date().toISOString() },
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Logs a user logout event
   */
  async logLogoutEvent(userId: string): Promise<void> {
    await this.logOperation({
      userId,
      operationType: 'logout',
      resourceType: 'user_session',
      resourceId: userId,
      oldValue: { logoutTime: new Date().toISOString() },
      ipAddress: this.getClientIP(),
      userAgent: navigator.userAgent
    });
  }

  /**
   * Gets audit logs for a specific resource
   */
  async getResourceAuditLogs(resourceType: string, resourceId: string): Promise<AuditLogEntry[]> {
    // In a real implementation, we would query the database for audit logs
    // For now, we'll return an empty array
    return [];
  }

  /**
   * Gets audit logs for a specific user
   */
  async getUserAuditLogs(userId: string, limit: number = 50, offset: number = 0): Promise<AuditLogEntry[]> {
    // In a real implementation, we would query the database for audit logs
    // For now, we'll return an empty array
    return [];
  }

  /**
   * Gets system-wide audit logs
   */
  async getSystemAuditLogs(
    operationType?: string,
    startDate?: string,
    endDate?: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<AuditLogEntry[]> {
    // In a real implementation, we would query the database for audit logs
    // For now, we'll return an empty array
    return [];
  }

  /**
   * Gets client IP address
   */
  private getClientIP(): string {
    // In a browser environment, we can't reliably get the client IP
    // This would typically be handled by the backend
    return '127.0.0.1'; // Placeholder
  }

  /**
   * Logs a security event
   */
  async logSecurityEvent(
    userId: string,
    eventType: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    description: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      await supabaseService.logSecurityEvent({
        user_id: userId,
        event_type: eventType,
        severity,
        description,
        ip_address: this.getClientIP(),
        user_agent: navigator.userAgent,
        details: details || {}
      });
    } catch (error) {
      console.error('Error logging security event:', error);
    }
  }

  /**
   * Logs a failed login attempt
   */
  async logFailedLoginAttempt(username: string, ipAddress?: string): Promise<void> {
    try {
      console.log(`Failed login attempt for user: ${username}, IP: ${ipAddress || this.getClientIP()}`);
    } catch (error) {
      console.error('Error logging failed login attempt:', error);
    }
  }

  /**
   * Checks if user is blocked due to too many failed attempts
   */
  async isUserBlocked(username: string, ipAddress?: string): Promise<boolean> {
    try {
      const attempts = await supabaseService.getRecentFailedAttempts(
        ipAddress || this.getClientIP(),
        15 // Check last 15 minutes
      );
      
      // Consider user blocked if more than 5 failed attempts in 15 minutes
      return attempts.length > 5;
    } catch (error) {
      console.error('Error checking if user is blocked:', error);
      return false; // Default to not blocked if we can't determine
    }
  }
}

// Export a singleton instance
export const auditService = new AuditService();