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
    expiresAt: string;
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
export declare class AuditTrailCRMUndoService {
    private config;
    private auditEntries;
    private undoOperations;
    private stats;
    private cleanupInterval;
    constructor(config?: Partial<AuditTrailConfig>);
    private startCleanupProcess;
    logAuditEntry(organizationId: string, userId: string, userEmail: string, action: string, resource: AuditTrailEntry['resource'], resourceId: string, resourceName: string, before: Record<string, any>, after: Record<string, any>, metadata?: Partial<AuditTrailEntry['metadata']>): Promise<AuditTrailEntry>;
    private generateDiff;
    private isReversibleAction;
    private sanitizeData;
    undoChange(auditTrailId: string, userId: string, reason: string, metadata?: Record<string, any>): Promise<UndoOperation>;
    private executeUndoOperation;
    getAuditTrail(organizationId: string, filters?: {
        resource?: string;
        action?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        entries: AuditTrailEntry[];
        total: number;
        pagination: {
            limit: number;
            offset: number;
            hasMore: boolean;
        };
    }>;
    getAuditEntry(auditTrailId: string): Promise<AuditTrailEntry | null>;
    getUndoOperations(organizationId: string, filters?: {
        status?: string;
        userId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        operations: UndoOperation[];
        total: number;
        pagination: {
            limit: number;
            offset: number;
            hasMore: boolean;
        };
    }>;
    getStats(): AuditTrailStats;
    private updateStats;
    private cleanupExpiredEntries;
    updateConfig(newConfig: Partial<AuditTrailConfig>): void;
    stop(): void;
}
export declare const auditTrailCRMUndoService: AuditTrailCRMUndoService;
//# sourceMappingURL=audit-trail-crm-undo.service.d.ts.map