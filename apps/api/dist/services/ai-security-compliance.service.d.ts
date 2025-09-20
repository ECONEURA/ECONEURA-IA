import { z } from 'zod';
declare const SecurityPolicySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["data_protection", "access_control", "content_filter", "audit", "compliance"]>;
    rules: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["equals", "contains", "regex", "range", "exists"]>;
        value: z.ZodAny;
        action: z.ZodEnum<["allow", "deny", "log", "encrypt", "anonymize"]>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        field?: string;
        action?: "anonymize" | "allow" | "log" | "deny" | "encrypt";
        operator?: "range" | "equals" | "contains" | "regex" | "exists";
    }, {
        value?: any;
        field?: string;
        action?: "anonymize" | "allow" | "log" | "deny" | "encrypt";
        operator?: "range" | "equals" | "contains" | "regex" | "exists";
    }>, "many">;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "audit" | "compliance" | "access_control" | "data_protection" | "content_filter";
    name?: string;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    rules?: {
        value?: any;
        field?: string;
        action?: "anonymize" | "allow" | "log" | "deny" | "encrypt";
        operator?: "range" | "equals" | "contains" | "regex" | "exists";
    }[];
}, {
    type?: "audit" | "compliance" | "access_control" | "data_protection" | "content_filter";
    name?: string;
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    rules?: {
        value?: any;
        field?: string;
        action?: "anonymize" | "allow" | "log" | "deny" | "encrypt";
        operator?: "range" | "equals" | "contains" | "regex" | "exists";
    }[];
}>;
declare const ComplianceCheckSchema: z.ZodObject<{
    id: z.ZodString;
    policyId: z.ZodString;
    checkType: z.ZodEnum<["data_retention", "access_audit", "content_scan", "encryption_check", "gdpr_compliance"]>;
    status: z.ZodEnum<["pending", "running", "completed", "failed"]>;
    result: z.ZodObject<{
        passed: z.ZodBoolean;
        violations: z.ZodArray<z.ZodObject<{
            rule: z.ZodString;
            severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
            description: z.ZodString;
            recommendation: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            severity?: "critical" | "low" | "medium" | "high";
            description?: string;
            rule?: string;
            recommendation?: string;
        }, {
            severity?: "critical" | "low" | "medium" | "high";
            description?: string;
            rule?: string;
            recommendation?: string;
        }>, "many">;
        score: z.ZodNumber;
        details: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        details?: Record<string, any>;
        score?: number;
        passed?: boolean;
        violations?: {
            severity?: "critical" | "low" | "medium" | "high";
            description?: string;
            rule?: string;
            recommendation?: string;
        }[];
    }, {
        details?: Record<string, any>;
        score?: number;
        passed?: boolean;
        violations?: {
            severity?: "critical" | "low" | "medium" | "high";
            description?: string;
            rule?: string;
            recommendation?: string;
        }[];
    }>;
    startedAt: z.ZodDate;
    completedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "completed" | "failed" | "running";
    id?: string;
    createdAt?: Date;
    completedAt?: Date;
    result?: {
        details?: Record<string, any>;
        score?: number;
        passed?: boolean;
        violations?: {
            severity?: "critical" | "low" | "medium" | "high";
            description?: string;
            rule?: string;
            recommendation?: string;
        }[];
    };
    startedAt?: Date;
    policyId?: string;
    checkType?: "data_retention" | "access_audit" | "content_scan" | "encryption_check" | "gdpr_compliance";
}, {
    status?: "pending" | "completed" | "failed" | "running";
    id?: string;
    createdAt?: Date;
    completedAt?: Date;
    result?: {
        details?: Record<string, any>;
        score?: number;
        passed?: boolean;
        violations?: {
            severity?: "critical" | "low" | "medium" | "high";
            description?: string;
            rule?: string;
            recommendation?: string;
        }[];
    };
    startedAt?: Date;
    policyId?: string;
    checkType?: "data_retention" | "access_audit" | "content_scan" | "encryption_check" | "gdpr_compliance";
}>;
declare const SecurityIncidentSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["data_breach", "unauthorized_access", "content_violation", "policy_violation", "system_compromise"]>;
    severity: z.ZodEnum<["low", "medium", "high", "critical"]>;
    status: z.ZodEnum<["open", "investigating", "resolved", "closed"]>;
    description: z.ZodString;
    affectedData: z.ZodArray<z.ZodString, "many">;
    affectedUsers: z.ZodArray<z.ZodString, "many">;
    detectionMethod: z.ZodString;
    remediation: z.ZodOptional<z.ZodString>;
    reportedAt: z.ZodDate;
    resolvedAt: z.ZodOptional<z.ZodDate>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "data_breach" | "unauthorized_access" | "system_compromise" | "content_violation" | "policy_violation";
    status?: "open" | "investigating" | "resolved" | "closed";
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    createdAt?: Date;
    description?: string;
    resolvedAt?: Date;
    remediation?: string;
    reportedAt?: Date;
    affectedUsers?: string[];
    affectedData?: string[];
    detectionMethod?: string;
}, {
    type?: "data_breach" | "unauthorized_access" | "system_compromise" | "content_violation" | "policy_violation";
    status?: "open" | "investigating" | "resolved" | "closed";
    id?: string;
    severity?: "critical" | "low" | "medium" | "high";
    createdAt?: Date;
    description?: string;
    resolvedAt?: Date;
    remediation?: string;
    reportedAt?: Date;
    affectedUsers?: string[];
    affectedData?: string[];
    detectionMethod?: string;
}>;
declare const AuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
    action: z.ZodString;
    resource: z.ZodString;
    resourceId: z.ZodOptional<z.ZodString>;
    details: z.ZodRecord<z.ZodString, z.ZodAny>;
    ipAddress: z.ZodString;
    userAgent: z.ZodString;
    timestamp: z.ZodDate;
    success: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    success?: boolean;
    userId?: string;
    timestamp?: Date;
    details?: Record<string, any>;
    id?: string;
    action?: string;
    userAgent?: string;
    resourceId?: string;
    ipAddress?: string;
    resource?: string;
}, {
    success?: boolean;
    userId?: string;
    timestamp?: Date;
    details?: Record<string, any>;
    id?: string;
    action?: string;
    userAgent?: string;
    resourceId?: string;
    ipAddress?: string;
    resource?: string;
}>;
export type SecurityPolicy = z.infer<typeof SecurityPolicySchema>;
export type ComplianceCheck = z.infer<typeof ComplianceCheckSchema>;
export type SecurityIncident = z.infer<typeof SecurityIncidentSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export interface AISecurityRequest {
    userId: string;
    organizationId: string;
    action: string;
    data: any;
    context: {
        ipAddress: string;
        userAgent: string;
        sessionId?: string;
    };
}
export interface AISecurityResponse {
    allowed: boolean;
    reason?: string;
    violations: Array<{
        rule: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
    }>;
    recommendations: string[];
    auditId: string;
}
export interface ComplianceReport {
    id: string;
    organizationId: string;
    reportType: string;
    period: {
        start: Date;
        end: Date;
    };
    summary: {
        totalChecks: number;
        passedChecks: number;
        failedChecks: number;
        overallScore: number;
    };
    details: {
        dataProtection: ComplianceCheck['result'];
        accessControl: ComplianceCheck['result'];
        contentFilter: ComplianceCheck['result'];
        auditTrail: ComplianceCheck['result'];
        gdprCompliance: ComplianceCheck['result'];
    };
    recommendations: string[];
    generatedAt: Date;
}
export declare class AISecurityComplianceService {
    private db;
    private securityCache;
    private complianceCache;
    constructor();
    private initializeService;
    private createTables;
    private loadSecurityPolicies;
    private initializeDefaultPolicies;
    createSecurityPolicy(policy: Omit<SecurityPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityPolicy>;
    getSecurityPolicies(): Promise<SecurityPolicy[]>;
    updateSecurityPolicy(id: string, updates: Partial<SecurityPolicy>): Promise<SecurityPolicy>;
    runComplianceCheck(policyId: string, checkType: ComplianceCheck['checkType']): Promise<ComplianceCheck>;
    private performComplianceCheck;
    createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'reportedAt' | 'createdAt'>): Promise<SecurityIncident>;
    getSecurityIncidents(): Promise<SecurityIncident[]>;
    logAuditEvent(auditLog: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog>;
    evaluateAISecurity(request: AISecurityRequest): Promise<AISecurityResponse>;
    private evaluateRule;
    private getFieldValue;
    generateComplianceReport(organizationId: string, reportType: string, period: {
        start: Date;
        end: Date;
    }): Promise<ComplianceReport>;
    private aggregateCheckResults;
    private generateRecommendations;
    getHealthStatus(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, boolean>;
        lastCheck: Date;
    }>;
    private checkDatabaseHealth;
}
export declare const aiSecurityComplianceService: AISecurityComplianceService;
export {};
//# sourceMappingURL=ai-security-compliance.service.d.ts.map