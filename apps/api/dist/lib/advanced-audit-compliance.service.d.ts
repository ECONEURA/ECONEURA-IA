export interface AuditEvent {
    id: string;
    timestamp: string;
    userId: string;
    organizationId: string;
    action: string;
    resource: string;
    resourceId?: string;
    details: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    compliance: {
        gdpr: boolean;
        sox: boolean;
        pci: boolean;
        hipaa: boolean;
        iso27001: boolean;
    };
    riskScore: number;
    tags: string[];
}
export interface ComplianceRule {
    id: string;
    name: string;
    description: string;
    framework: 'gdpr' | 'sox' | 'pci' | 'hipaa' | 'iso27001';
    conditions: {
        action?: string[];
        resource?: string[];
        severity?: string[];
        timeWindow?: number;
        threshold?: number;
    };
    actions: {
        alert: boolean;
        block: boolean;
        notify: string[];
        escalate: boolean;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface ComplianceViolation {
    id: string;
    ruleId: string;
    eventId: string;
    timestamp: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    details: Record<string, any>;
    status: 'open' | 'investigating' | 'resolved' | 'false_positive';
    assignedTo?: string;
    resolution?: string;
    resolvedAt?: string;
}
export interface AuditReport {
    id: string;
    name: string;
    description: string;
    organizationId: string;
    period: {
        start: string;
        end: string;
    };
    filters: {
        actions?: string[];
        resources?: string[];
        severities?: string[];
        frameworks?: string[];
    };
    metrics: {
        totalEvents: number;
        violations: number;
        riskScore: number;
        complianceScore: number;
        topActions: Array<{
            action: string;
            count: number;
        }>;
        topResources: Array<{
            resource: string;
            count: number;
        }>;
        severityDistribution: Record<string, number>;
        frameworkCompliance: Record<string, number>;
    };
    generatedAt: string;
    generatedBy: string;
}
export declare class AdvancedAuditComplianceService {
    private auditEvents;
    private complianceRules;
    private violations;
    private reports;
    constructor();
    private initializeDefaultRules;
    private initializeMockData;
    logAuditEvent(eventData: Omit<AuditEvent, 'id' | 'timestamp'>): Promise<AuditEvent>;
    private checkComplianceRules;
    private evaluateRule;
    private createViolation;
    getAuditEvents(filters?: {
        organizationId?: string;
        userId?: string;
        action?: string;
        resource?: string;
        severity?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        events: AuditEvent[];
        total: number;
    }>;
    getComplianceRules(): Promise<ComplianceRule[]>;
    createComplianceRule(ruleData: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ComplianceRule>;
    getViolations(filters?: {
        organizationId?: string;
        status?: string;
        severity?: string;
        ruleId?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        violations: ComplianceViolation[];
        total: number;
    }>;
    updateViolationStatus(violationId: string, status: string, resolution?: string, assignedTo?: string): Promise<ComplianceViolation>;
    generateAuditReport(reportData: {
        name: string;
        description: string;
        organizationId: string;
        period: {
            start: string;
            end: string;
        };
        filters?: {
            actions?: string[];
            resources?: string[];
            severities?: string[];
            frameworks?: string[];
        };
        generatedBy: string;
    }): Promise<AuditReport>;
    private calculateComplianceScore;
    private getTopActions;
    private getTopResources;
    private getSeverityDistribution;
    private getFrameworkCompliance;
    getAuditReports(organizationId: string): Promise<AuditReport[]>;
    getComplianceMetrics(organizationId: string): Promise<{
        totalEvents: number;
        totalViolations: number;
        openViolations: number;
        complianceScore: number;
        riskScore: number;
        frameworkCompliance: Record<string, number>;
        recentViolations: ComplianceViolation[];
    }>;
}
export declare const advancedAuditComplianceService: AdvancedAuditComplianceService;
//# sourceMappingURL=advanced-audit-compliance.service.d.ts.map