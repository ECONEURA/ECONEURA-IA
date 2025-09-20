import { SecurityEvent, CreateSecurityEventRequest, SecurityConfig, Vulnerability, ComplianceRequirement, CreateComplianceRequirementRequest, ComplianceConfig } from './security-types.js';
export interface SecurityTest {
    id: string;
    name: string;
    type: 'penetration' | 'vulnerability' | 'compliance' | 'performance';
    status: 'pending' | 'running' | 'completed' | 'failed';
    target: string;
    results: SecurityTestResult[];
    createdAt: Date;
    completedAt?: Date;
}
export interface SecurityTestResult {
    id: string;
    testId: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    description: string;
    recommendation: string;
    evidence: string[];
    status: 'open' | 'in_progress' | 'resolved' | 'false_positive';
}
export interface AuditLog {
    id: string;
    userId?: string;
    organizationId?: string;
    action: string;
    resource: string;
    ipAddress: string;
    userAgent: string;
    details: any;
    timestamp: Date;
}
export declare class SecurityConsolidatedService {
    private config;
    private complianceConfig;
    private securityEvents;
    private accessControls;
    private permissions;
    private roles;
    private securityPolicies;
    private vulnerabilities;
    private vulnerabilityScans;
    private complianceRequirements;
    private complianceAssessments;
    private complianceFindings;
    private securityTests;
    private blockedIPs;
    private suspiciousIPs;
    constructor(securityConfig?: Partial<SecurityConfig>, complianceConfig?: Partial<ComplianceConfig>);
    createSecurityEvent(request: CreateSecurityEventRequest, organizationId: string, userId?: string): Promise<SecurityEvent>;
    getSecurityEvent(eventId: string): Promise<SecurityEvent | null>;
    getSecurityEvents(organizationId: string, filters?: {
        type?: string;
        severity?: string;
        status?: string;
        category?: string;
        userId?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<SecurityEvent[]>;
    updateSecurityEventStatus(eventId: string, status: SecurityEvent['status']): Promise<SecurityEvent | null>;
    private processSecurityEvent;
    private calculateRiskScore;
    private analyzeRiskScore;
    recordLoginAttempt(email: string, ipAddress: string, userAgent: string, success: boolean): Promise<void>;
    isIPBlocked(ipAddress: string): Promise<boolean>;
    blockIP(ipAddress: string, reason: string): Promise<void>;
    unblockIP(ipAddress: string): Promise<void>;
    detectSuspiciousActivity(userId: string, organizationId: string, action: string, ipAddress: string, userAgent: string, details: any): Promise<boolean>;
    encryptData(data: string): string;
    decryptData(encryptedData: string): string;
    createComplianceRequirement(request: CreateComplianceRequirementRequest, organizationId: string): Promise<ComplianceRequirement>;
    getComplianceRequirement(requirementId: string): Promise<ComplianceRequirement | null>;
    getComplianceRequirements(organizationId: string, filters?: {
        standard?: string;
        status?: string;
        category?: string;
        priority?: string;
    }): Promise<ComplianceRequirement[]>;
    createVulnerability(vulnerability: Omit<Vulnerability, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vulnerability>;
    getVulnerabilities(organizationId: string, filters?: {
        severity?: string;
        status?: string;
        affectedSystem?: string;
    }): Promise<Vulnerability[]>;
    createSecurityTest(test: Omit<SecurityTest, 'id' | 'createdAt'>): Promise<SecurityTest>;
    executeSecurityTest(testId: string): Promise<SecurityTest>;
    private completeSecurityTest;
    recordAuditLog(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<void>;
    recordSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<void>;
    validateInput(data: any, schema: any): {
        isValid: boolean;
        errors: string[];
    };
    sanitizeInput(input: string): string;
    private generateId;
    private getRecentEvents;
    private isSuspiciousIP;
    private isUnusualTime;
    private evaluateSecurityPolicies;
    private evaluatePolicyRule;
    private executePolicyAction;
    private triggerIncidentResponse;
    private sendSecurityAlert;
    private quarantineUser;
    private calculateNextAssessment;
    private performAutoAssessment;
    private getLogLevel;
    private startSecurityMonitoring;
    private cleanupExpiredBlocks;
    private cleanupOldLogs;
    getServiceStats(): Promise<{
        security: {
            totalEvents: number;
            totalVulnerabilities: number;
            totalPolicies: number;
            totalAccessControls: number;
            config: SecurityConfig;
        };
        compliance: {
            totalRequirements: number;
            totalAssessments: number;
            totalFindings: number;
            config: ComplianceConfig;
        };
        testing: {
            totalTests: number;
        };
    }>;
    updateConfig(securityConfig?: Partial<SecurityConfig>, complianceConfig?: Partial<ComplianceConfig>): void;
    getConfig(): {
        security: SecurityConfig;
        compliance: ComplianceConfig;
    };
}
export declare const securityConsolidated: SecurityConsolidatedService;
//# sourceMappingURL=security-consolidated.service.d.ts.map