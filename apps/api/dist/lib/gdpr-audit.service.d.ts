import { GDPRRequest, AuditEntry, GDPRStats, BreachRecord } from './gdpr-types.js';
export declare class GDPRAuditService {
    private auditEntries;
    private gdprRequests;
    private breaches;
    constructor();
    private initializeBreaches;
    logAuditEntry(requestId: string, action: 'created' | 'updated' | 'processed' | 'completed' | 'failed', actor: string, details: Record<string, unknown>, ipAddress: string, userAgent: string): Promise<AuditEntry>;
    createGDPRRequest(userId: string, type: 'export' | 'erase' | 'rectification' | 'portability', requestedBy: string, dataCategories: string[], scope?: 'user' | 'organization', priority?: 'low' | 'medium' | 'high' | 'urgent', reason?: string): Promise<GDPRRequest>;
    updateRequestStatus(requestId: string, status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled', processedBy: string, details?: Record<string, unknown>): Promise<GDPRRequest | null>;
    recordBreach(type: 'confidentiality' | 'integrity' | 'availability', severity: 'low' | 'medium' | 'high' | 'critical', description: string, affectedDataCategories: string[], affectedDataSubjects: number, discoveredBy: string): Promise<BreachRecord>;
    updateBreach(breachId: string, updates: Partial<BreachRecord>, updatedBy: string): Promise<BreachRecord | null>;
    private getLegalBasis;
    private generateSignature;
    getAuditEntries(requestId?: string): AuditEntry[];
    getGDPRRequests(userId?: string): GDPRRequest[];
    getGDPRRequest(requestId: string): GDPRRequest | null;
    getBreaches(): BreachRecord[];
    getBreach(breachId: string): BreachRecord | null;
    getGDPRStats(): GDPRStats;
    getComplianceReport(period: {
        start: Date;
        end: Date;
    }): {
        period: {
            start: Date;
            end: Date;
        };
        stats: GDPRStats;
        breaches: BreachRecord[];
        auditEntries: AuditEntry[];
        complianceScore: number;
    };
    exportAuditTrail(requestId: string): {
        request: GDPRRequest | null;
        auditTrail: AuditEntry[];
        exportedAt: Date;
    };
}
//# sourceMappingURL=gdpr-audit.service.d.ts.map