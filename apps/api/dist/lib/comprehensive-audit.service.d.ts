import { AuditLog, AuditReport, AuditTrail, CreateAuditLogRequest, AuditConfig } from './security-types.js';
export declare class ComprehensiveAuditService {
    private config;
    private auditLogs;
    private auditReports;
    private auditTrails;
    constructor(config?: Partial<AuditConfig>);
    createAuditLog(request: CreateAuditLogRequest, organizationId: string, userId?: string): Promise<AuditLog>;
    getAuditLog(logId: string): Promise<AuditLog | null>;
    getAuditLogs(organizationId: string, filters?: {
        eventType?: string;
        userId?: string;
        resource?: string;
        action?: string;
        result?: string;
        severity?: string;
        category?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<AuditLog[]>;
    private determineSeverity;
    private processAuditLog;
    private checkAuditPatterns;
    private getRecentLogs;
    private flagSuspiciousActivity;
    private validateAuditIntegrity;
    private calculateHash;
    private updateAuditTrail;
    private extractEntityType;
    private extractEntityId;
    private mapToTrailAction;
    private extractChanges;
    getAuditTrail(entityType: string, entityId: string, organizationId: string): Promise<AuditTrail[]>;
    getAuditTrails(organizationId: string, filters?: {
        entityType?: string;
        userId?: string;
        action?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<AuditTrail[]>;
    createAuditReport(report: Omit<AuditReport, 'id' | 'createdAt' | 'updatedAt'>): Promise<AuditReport>;
    executeAudit(auditReport: AuditReport): Promise<AuditReport>;
    private performAuditExecution;
    private analyzeSecurityAudit;
    private analyzeComplianceAudit;
    private analyzeOperationalAudit;
    private generateRecommendations;
    private calculateOverallScore;
    private determineRiskLevel;
    getAuditReport(reportId: string): Promise<AuditReport | null>;
    getAuditReports(organizationId: string): Promise<AuditReport[]>;
    getAuditAnalytics(organizationId: string, period?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalLogs: number;
        logsByType: Record<string, number>;
        logsByResult: Record<string, number>;
        logsBySeverity: Record<string, number>;
        topUsers: Array<{
            userId: string;
            count: number;
        }>;
        topResources: Array<{
            resource: string;
            count: number;
        }>;
        securityEvents: number;
        complianceEvents: number;
        riskScore: number;
    }>;
    private calculateRiskScore;
    performForensicAnalysis(organizationId: string, criteria: {
        userId?: string;
        resource?: string;
        timeRange?: {
            start: Date;
            end: Date;
        };
        eventTypes?: string[];
    }): Promise<{
        analysisId: string;
        summary: string;
        timeline: Array<{
            timestamp: Date;
            event: string;
            details: any;
        }>;
        patterns: string[];
        anomalies: string[];
        recommendations: string[];
    }>;
    private identifyPatterns;
    private identifyAnomalies;
    private generateForensicRecommendations;
    private generateId;
    getServiceStats(): Promise<{
        totalLogs: number;
        totalReports: number;
        totalTrails: number;
        config: AuditConfig;
    }>;
}
//# sourceMappingURL=comprehensive-audit.service.d.ts.map