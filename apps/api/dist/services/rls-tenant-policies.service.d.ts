export interface TenantRLSPolicy {
    id: string;
    tenantId: string;
    organizationId: string;
    tableName: string;
    policyName: string;
    description?: string;
    configuration: {
        operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
        isActive: boolean;
        priority: number;
        bypassRLS: boolean;
        enforceTenantIsolation: boolean;
    };
    conditions: {
        type: 'tenant_isolation' | 'role_based' | 'user_based' | 'custom' | 'hybrid';
        expression: string;
        parameters?: Record<string, any>;
        tenantConditions?: {
            strictIsolation: boolean;
            crossTenantAccess: boolean;
            sharedDataAccess: boolean;
        };
    };
    accessRules: {
        roles: string[];
        users?: string[];
        groups?: string[];
        tenantRestrictions?: {
            allowedTenants?: string[];
            blockedTenants?: string[];
            crossTenantOperations?: string[];
        };
        timeRestrictions?: {
            startTime?: string;
            endTime?: string;
            daysOfWeek?: number[];
            timezone?: string;
        };
        ipRestrictions?: {
            allowedIPs?: string[];
            blockedIPs?: string[];
            allowedRanges?: string[];
        };
    };
    metadata: {
        createdBy: string;
        lastModifiedBy: string;
        version: number;
        tags?: string[];
        documentation?: string;
        compliance?: {
            gdpr: boolean;
            sox: boolean;
            hipaa: boolean;
            pci: boolean;
        };
    };
    createdAt: string;
    updatedAt: string;
}
export interface TenantRLSRule {
    id: string;
    tenantId: string;
    organizationId: string;
    ruleName: string;
    description?: string;
    configuration: {
        isActive: boolean;
        priority: number;
        evaluationOrder: number;
        stopOnMatch: boolean;
        tenantScope: 'single' | 'multi' | 'global';
    };
    conditions: {
        context: {
            userId?: string;
            organizationId?: string;
            tenantId?: string;
            role?: string;
            permissions?: string[];
            sessionAttributes?: Record<string, any>;
        };
        data: {
            tableName?: string;
            columnName?: string;
            operation?: string;
            value?: any;
            tenantId?: string;
        };
        time: {
            startDate?: string;
            endDate?: string;
            timeOfDay?: {
                start: string;
                end: string;
            };
        };
    };
    actions: {
        type: 'allow' | 'deny' | 'modify' | 'log' | 'redirect' | 'tenant_isolate';
        parameters: Record<string, any>;
        message?: string;
        tenantIsolation?: {
            enforce: boolean;
            allowedTenants?: string[];
            blockedTenants?: string[];
        };
    };
    metadata: {
        createdBy: string;
        lastModifiedBy: string;
        version: number;
        tags?: string[];
    };
    createdAt: string;
    updatedAt: string;
}
export interface TenantRLSContext {
    userId: string;
    organizationId: string;
    tenantId: string;
    role: string;
    permissions: string[];
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
    tenantMetadata?: {
        tenantType: 'enterprise' | 'small_business' | 'individual';
        subscriptionLevel: 'basic' | 'premium' | 'enterprise';
        dataRetentionDays: number;
        complianceRequirements: string[];
    };
}
export interface TenantRLSAuditLog {
    id: string;
    organizationId: string;
    tenantId: string;
    userId: string;
    sessionId: string;
    operation: {
        type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
        tableName: string;
        recordId?: string;
        columns?: string[];
        tenantId?: string;
    };
    securityContext: {
        ipAddress: string;
        userAgent: string;
        role: string;
        permissions: string[];
        policiesApplied: string[];
        rulesEvaluated: string[];
        tenantIsolation: boolean;
    };
    result: {
        allowed: boolean;
        reason?: string;
        dataReturned?: number;
        executionTime: number;
        policiesMatched: number;
        rulesMatched: number;
        tenantIsolationEnforced: boolean;
    };
    timestamp: string;
    requestId?: string;
}
export interface TenantRLSStats {
    totalPolicies: number;
    activePolicies: number;
    totalRules: number;
    activeRules: number;
    tenantIsolationPolicies: number;
    crossTenantPolicies: number;
    accessStats: {
        totalAccessAttempts: number;
        allowedAccess: number;
        deniedAccess: number;
        tenantIsolationViolations: number;
        averageExecutionTime: number;
    };
    byTenant: Record<string, {
        policies: number;
        rules: number;
        accessAttempts: number;
        violations: number;
    }>;
    byOperation: Record<string, number>;
    byTable: Record<string, number>;
    complianceStats: {
        gdprCompliant: number;
        soxCompliant: number;
        hipaaCompliant: number;
        pciCompliant: number;
    };
}
declare class TenantRLSPoliciesService {
    private tenantPolicies;
    private tenantRules;
    private tenantContexts;
    private tenantAuditLogs;
    constructor();
    init(): void;
    private createDefaultTenantPolicies;
    createTenantContext(contextData: Omit<TenantRLSContext, 'timestamp'>): Promise<TenantRLSContext>;
    getTenantContext(sessionId: string): Promise<TenantRLSContext | undefined>;
    getTenantPolicies(tenantId: string, filters?: {
        tableName?: string;
        operation?: string;
        isActive?: boolean;
        enforceTenantIsolation?: boolean;
        limit?: number;
    }): Promise<TenantRLSPolicy[]>;
    createTenantPolicy(policyData: Omit<TenantRLSPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenantRLSPolicy>;
    getTenantRules(tenantId: string, filters?: {
        isActive?: boolean;
        role?: string;
        tenantScope?: 'single' | 'multi' | 'global';
        limit?: number;
    }): Promise<TenantRLSRule[]>;
    createTenantRule(ruleData: Omit<TenantRLSRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenantRLSRule>;
    evaluateTenantAccess(context: TenantRLSContext, operation: {
        type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
        tableName: string;
        recordId?: string;
        columns?: string[];
        targetTenantId?: string;
    }): Promise<{
        allowed: boolean;
        reason?: string;
        policiesApplied: string[];
        rulesEvaluated: string[];
        executionTime: number;
        tenantIsolationEnforced: boolean;
    }>;
    private checkCrossTenantAccess;
    private evaluateTenantRule;
    private evaluateTenantPolicy;
    logTenantAccess(auditData: Omit<TenantRLSAuditLog, 'id' | 'timestamp'>): Promise<TenantRLSAuditLog>;
    getTenantStats(tenantId: string): Promise<TenantRLSStats>;
    private getTenantBreakdown;
    private getOperationStats;
    private getTableStats;
    private getComplianceStats;
    generateTenantPolicy(tenantId: string, tableName: string, requirements: {
        accessLevel: 'tenant_strict' | 'tenant_shared' | 'cross_tenant' | 'admin_only';
        operations: ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[];
        roles: string[];
        enforceIsolation: boolean;
        additionalConditions?: string;
    }): Promise<TenantRLSPolicy>;
}
export declare const tenantRLSPoliciesService: TenantRLSPoliciesService;
export {};
//# sourceMappingURL=rls-tenant-policies.service.d.ts.map