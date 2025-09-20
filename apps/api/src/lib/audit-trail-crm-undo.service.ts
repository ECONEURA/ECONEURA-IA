/**
 * PR-65: Audit Trail CRM + Undo Service
 * 
 * Sistema de auditoría completa para CRM con capacidades de undo y revert
 * Incluye diffs detallados y capacidad de revertir cambios hasta 24 horas
 */

import { structuredLogger } from './structured-logger.js';

export interface AuditTrailEntry {
  id: string;
  organizationId: string;
  userId: string;
  userEmail: string;
  action: string;
  resource: 'company' | 'contact' | 'deal' | 'activity' | 'note' | 'task';
  resourceId: string;
  resourceName: string;
  changes: {
    before: Record<string, any>;
    after: Record<string, any>;
    diff: Record<string, {
      field: string;
      oldValue: any;
      newValue: any;
      changeType: 'added' | 'modified' | 'removed';
    }>;
  };
  metadata: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    correlationId?: string;
    source: 'web' | 'api' | 'import' | 'sync' | 'system';
    reason?: string;
  };
  timestamp: string;
  isReversible: boolean;
  expiresAt: string; // 24 horas después del timestamp
  status: 'active' | 'reverted' | 'expired';
  revertedAt?: string;
  revertedBy?: string;
  revertReason?: string;
}

export interface UndoOperation {
  id: string;
  auditTrailId: string;
  organizationId: string;
  userId: string;
  resource: string;
  resourceId: string;
  operation: 'undo' | 'revert';
  changes: Record<string, any>;
  reason: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  metadata: Record<string, any>;
}

export interface AuditTrailStats {
  totalEntries: number;
  entriesByResource: Record<string, number>;
  entriesByAction: Record<string, number>;
  entriesByUser: Record<string, number>;
  reversibleEntries: number;
  revertedEntries: number;
  expiredEntries: number;
  last24Hours: number;
  last7Days: number;
  last30Days: number;
}

export interface AuditTrailConfig {
  enabled: boolean;
  retentionDays: number;
  undoWindowHours: number;
  maxUndoOperations: number;
  autoExpire: boolean;
  trackFields: string[];
  sensitiveFields: string[];
  excludeActions: string[];
  includeMetadata: boolean;
  compressionEnabled: boolean;
}

export class AuditTrailCRMUndoService {
  private config: AuditTrailConfig;
  private auditEntries: Map<string, AuditTrailEntry> = new Map();
  private undoOperations: Map<string, UndoOperation> = new Map();
  private stats: AuditTrailStats;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<AuditTrailConfig> = {}) {
    this.config = {
      enabled: true,
      retentionDays: 90,
      undoWindowHours: 24,
      maxUndoOperations: 1000,
      autoExpire: true,
      trackFields: ['name', 'email', 'phone', 'status', 'value', 'stage', 'priority', 'description'],
      sensitiveFields: ['password', 'token', 'secret', 'key'],
      excludeActions: ['view', 'list', 'search'],
      includeMetadata: true,
      compressionEnabled: true,
      ...config
    };

    this.stats = {
      totalEntries: 0,
      entriesByResource: {},
      entriesByAction: {},
      entriesByUser: {},
      reversibleEntries: 0,
      revertedEntries: 0,
      expiredEntries: 0,
      last24Hours: 0,
      last7Days: 0,
      last30Days: 0
    };

    this.startCleanupProcess();
    
    structuredLogger.info('Audit Trail CRM Undo service initialized', {
      config: this.config,
      requestId: ''
    });
  }

  private startCleanupProcess(): void {
    if (!this.config.autoExpire) return;

    // Limpiar entradas expiradas cada hora
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredEntries();
    }, 60 * 60 * 1000);

    structuredLogger.info('Audit trail cleanup process started', {
      interval: '1 hour',
      requestId: ''
    });
  }

  async logAuditEntry(
    organizationId: string,
    userId: string,
    userEmail: string,
    action: string,
    resource: AuditTrailEntry['resource'],
    resourceId: string,
    resourceName: string,
    before: Record<string, any>,
    after: Record<string, any>,
    metadata: Partial<AuditTrailEntry['metadata']> = {}
  ): Promise<AuditTrailEntry> {
    if (!this.config.enabled) {
      throw new Error('Audit trail is disabled');
    }

    if (this.config.excludeActions.includes(action)) {
      throw new Error(`Action ${action} is excluded from audit trail`);
    }

    const entryId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    const expiresAt = new Date(Date.now() + this.config.undoWindowHours * 60 * 60 * 1000).toISOString();

    // Generar diff detallado
    const diff = this.generateDiff(before, after);

    // Determinar si es reversible
    const isReversible = this.isReversibleAction(action, diff);

    const auditEntry: AuditTrailEntry = {
      id: entryId,
      organizationId,
      userId,
      userEmail,
      action,
      resource,
      resourceId,
      resourceName,
      changes: {
        before: this.sanitizeData(before),
        after: this.sanitizeData(after),
        diff
      },
      metadata: {
        source: 'api',
        ...metadata
      },
      timestamp,
      isReversible,
      expiresAt,
      status: 'active'
    };

    this.auditEntries.set(entryId, auditEntry);
    this.updateStats(auditEntry);

    structuredLogger.info('Audit entry logged', {
      entryId,
      organizationId,
      userId,
      action,
      resource,
      resourceId,
      isReversible,
      requestId: ''
    });

    return auditEntry;
  }

  private generateDiff(before: Record<string, any>, after: Record<string, any>): Record<string, any> {
    const diff: Record<string, any> = {};
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);

    for (const key of allKeys) {
      const oldValue = before[key];
      const newValue = after[key];

      if (oldValue !== newValue) {
        if (oldValue === undefined) {
          diff[key] = {
            field: key,
            oldValue: null,
            newValue,
            changeType: 'added'
          };
        } else if (newValue === undefined) {
          diff[key] = {
            field: key,
            oldValue,
            newValue: null,
            changeType: 'removed'
          };
        } else {
          diff[key] = {
            field: key,
            oldValue,
            newValue,
            changeType: 'modified'
          };
        }
      }
    }

    return diff;
  }

  private isReversibleAction(action: string, diff: Record<string, any>): boolean {
    // Acciones que no son reversibles
    const nonReversibleActions = ['delete', 'permanent_delete', 'bulk_delete'];
    if (nonReversibleActions.includes(action)) {
      return false;
    }

    // Verificar si hay cambios en campos sensibles
    const hasSensitiveChanges = Object.keys(diff).some(field => 
      this.config.sensitiveFields.some(sensitive => 
        field.toLowerCase().includes(sensitive.toLowerCase())
      )
    );

    if (hasSensitiveChanges) {
      return false;
    }

    // Verificar si hay cambios en campos trackeados
    const hasTrackedChanges = Object.keys(diff).some(field => 
      this.config.trackFields.includes(field)
    );

    return hasTrackedChanges;
  }

  private sanitizeData(data: Record<string, any>): Record<string, any> {
    const sanitized = { ...data };
    
    // Remover campos sensibles
    for (const field of this.config.sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  async undoChange(
    auditTrailId: string,
    userId: string,
    reason: string,
    metadata: Record<string, any> = {}
  ): Promise<UndoOperation> {
    const auditEntry = this.auditEntries.get(auditTrailId);
    
    if (!auditEntry) {
      throw new Error('Audit entry not found');
    }

    if (auditEntry.status !== 'active') {
      throw new Error('Audit entry is not active');
    }

    if (!auditEntry.isReversible) {
      throw new Error('This change is not reversible');
    }

    if (new Date() > new Date(auditEntry.expiresAt)) {
      throw new Error('Undo window has expired');
    }

    const undoId = `undo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();

    const undoOperation: UndoOperation = {
      id: undoId,
      auditTrailId,
      organizationId: auditEntry.organizationId,
      userId,
      resource: auditEntry.resource,
      resourceId: auditEntry.resourceId,
      operation: 'undo',
      changes: auditEntry.changes.before,
      reason,
      timestamp,
      status: 'pending',
      metadata
    };

    try {
      // Simular la operación de undo
      await this.executeUndoOperation(undoOperation, auditEntry);
      
      undoOperation.status = 'completed';
      auditEntry.status = 'reverted';
      auditEntry.revertedAt = timestamp;
      auditEntry.revertedBy = userId;
      auditEntry.revertReason = reason;

      this.undoOperations.set(undoId, undoOperation);
      this.updateStats(auditEntry);

      structuredLogger.info('Change undone successfully', {
        undoId,
        auditTrailId,
        userId,
        resource: auditEntry.resource,
        resourceId: auditEntry.resourceId,
        requestId: ''
      });

      return undoOperation;

    } catch (error) {
      undoOperation.status = 'failed';
      undoOperation.errorMessage = error instanceof Error ? error.message : String(error);
      
      this.undoOperations.set(undoId, undoOperation);

      structuredLogger.error('Failed to undo change', {
        undoId,
        auditTrailId,
        error: error instanceof Error ? error.message : String(error),
        requestId: ''
      });

      throw error;
    }
  }

  private async executeUndoOperation(undoOperation: UndoOperation, auditEntry: AuditTrailEntry): Promise<void> {
    // Simular la ejecución del undo
    await new Promise(resolve => setTimeout(resolve, 100));

    // En un sistema real, aquí se ejecutaría la lógica para revertir los cambios
    // Por ejemplo, actualizar la base de datos con los valores anteriores
    
    structuredLogger.info('Undo operation executed', {
      undoId: undoOperation.id,
      resource: undoOperation.resource,
      resourceId: undoOperation.resourceId,
      changesCount: Object.keys(undoOperation.changes).length,
      requestId: ''
    });
  }

  async getAuditTrail(
    organizationId: string,
    filters: {
      resource?: string;
      action?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    entries: AuditTrailEntry[];
    total: number;
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    let entries = Array.from(this.auditEntries.values())
      .filter(entry => entry.organizationId === organizationId);

    // Aplicar filtros
    if (filters.resource) {
      entries = entries.filter(entry => entry.resource === filters.resource);
    }

    if (filters.action) {
      entries = entries.filter(entry => entry.action === filters.action);
    }

    if (filters.userId) {
      entries = entries.filter(entry => entry.userId === filters.userId);
    }

    if (filters.startDate) {
      entries = entries.filter(entry => entry.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      entries = entries.filter(entry => entry.timestamp <= filters.endDate!);
    }

    // Ordenar por timestamp descendente
    entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = entries.length;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginatedEntries = entries.slice(offset, offset + limit);

    return {
      entries: paginatedEntries,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  async getAuditEntry(auditTrailId: string): Promise<AuditTrailEntry | null> {
    return this.auditEntries.get(auditTrailId) || null;
  }

  async getUndoOperations(
    organizationId: string,
    filters: {
      status?: string;
      userId?: string;
      startDate?: string;
      endDate?: string;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<{
    operations: UndoOperation[];
    total: number;
    pagination: {
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> {
    let operations = Array.from(this.undoOperations.values())
      .filter(op => op.organizationId === organizationId);

    // Aplicar filtros
    if (filters.status) {
      operations = operations.filter(op => op.status === filters.status);
    }

    if (filters.userId) {
      operations = operations.filter(op => op.userId === filters.userId);
    }

    if (filters.startDate) {
      operations = operations.filter(op => op.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      operations = operations.filter(op => op.timestamp <= filters.endDate!);
    }

    // Ordenar por timestamp descendente
    operations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = operations.length;
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;
    const paginatedOperations = operations.slice(offset, offset + limit);

    return {
      operations: paginatedOperations,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  getStats(): AuditTrailStats {
    return this.stats;
  }

  private updateStats(auditEntry: AuditTrailEntry): void {
    this.stats.totalEntries++;
    
    // Actualizar contadores por recurso
    this.stats.entriesByResource[auditEntry.resource] = 
      (this.stats.entriesByResource[auditEntry.resource] || 0) + 1;
    
    // Actualizar contadores por acción
    this.stats.entriesByAction[auditEntry.action] = 
      (this.stats.entriesByAction[auditEntry.action] || 0) + 1;
    
    // Actualizar contadores por usuario
    this.stats.entriesByUser[auditEntry.userId] = 
      (this.stats.entriesByUser[auditEntry.userId] || 0) + 1;

    if (auditEntry.isReversible) {
      this.stats.reversibleEntries++;
    }

    if (auditEntry.status === 'reverted') {
      this.stats.revertedEntries++;
    }

    // Actualizar contadores por período
    const now = new Date();
    const entryDate = new Date(auditEntry.timestamp);
    
    if (now.getTime() - entryDate.getTime() <= 24 * 60 * 60 * 1000) {
      this.stats.last24Hours++;
    }
    
    if (now.getTime() - entryDate.getTime() <= 7 * 24 * 60 * 60 * 1000) {
      this.stats.last7Days++;
    }
    
    if (now.getTime() - entryDate.getTime() <= 30 * 24 * 60 * 60 * 1000) {
      this.stats.last30Days++;
    }
  }

  private cleanupExpiredEntries(): void {
    const now = new Date();
    let expiredCount = 0;

    for (const [id, entry] of this.auditEntries.entries()) {
      if (entry.status === 'active' && now > new Date(entry.expiresAt)) {
        entry.status = 'expired';
        expiredCount++;
        this.stats.expiredEntries++;
      }
    }

    if (expiredCount > 0) {
      structuredLogger.info('Expired audit entries cleaned up', {
        expiredCount,
        requestId: ''
      });
    }
  }

  updateConfig(newConfig: Partial<AuditTrailConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar proceso de limpieza si cambió la configuración
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.startCleanupProcess();
    }
    
    structuredLogger.info('Audit trail configuration updated', {
      config: this.config,
      requestId: ''
    });
  }

  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    structuredLogger.info('Audit Trail CRM Undo service stopped', { requestId: '' });
  }
}

export const auditTrailCRMUndoService = new AuditTrailCRMUndoService();
