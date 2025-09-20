interface RLSContext {
    userId: string;
    organizationId: string;
    role: string;
    permissions: string[];
    sessionId: string;
    ipAddress: string;
    userAgent: string;
    timestamp: string;
}
interface RLSPolicy {
    id: string;
    organizationId: string;
    tableName: string;
    policyName: string;
    description?: string;
    configuration: {
        operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';
        isActive: boolean;
        priority: number;
        bypassRLS: boolean;
    };
    conditions: {
        type: 'simple' | 'complex' | 'function' | 'template';
        expression: string;
        parameters?: Record<string, any>;
        dependencies?: string[];
    };
    accessRules: {
        roles: string[];
        users?: string[];
        groups?: string[];
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
    };
    createdAt: string;
    updatedAt: string;
}
interface RLSRule {
    id: string;
    organizationId: string;
    ruleName: string;
    description?: string;
    configuration: {
        isActive: boolean;
        priority: number;
        evaluationOrder: number;
        stopOnMatch: boolean;
    };
    conditions: {
        context: {
            userId?: string;
            organizationId?: string;
            role?: string;
            permissions?: string[];
            sessionAttributes?: Record<string, any>;
        };
        data: {
            tableName?: string;
            columnName?: string;
            operation?: string;
            value?: any;
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
        type: 'allow' | 'deny' | 'modify' | 'log' | 'redirect';
        parameters: Record<string, any>;
        message?: string;
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
interface RLSAuditLog {
    id: string;
    organizationId: string;
    userId: string;
    sessionId: string;
    operation: {
        type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
        tableName: string;
        recordId?: string;
        columns?: string[];
    };
    securityContext: {
        ipAddress: string;
        userAgent: string;
        role: string;
        permissions: string[];
        policiesApplied: string[];
        rulesEvaluated: string[];
    };
    result: {
        allowed: boolean;
        reason?: string;
        dataReturned?: number;
        executionTime: number;
        policiesMatched: number;
        rulesMatched: number;
    };
    timestamp: string;
    requestId?: string;
}
declare class RLSGenerativaService {
    private rlsContexts;
    private rlsPolicies;
    private rlsRules;
    private rlsValidations;
    private rlsAuditLogs;
    private rlsReports;
    constructor();
    init(): void;
    private createDemoData;
    createRLSContext(contextData: Omit<RLSContext, 'timestamp'>): Promise<RLSContext>;
    getRLSContext(sessionId: string): Promise<RLSContext | undefined>;
    getRLSPolicies(organizationId: string, filters?: {
        tableName?: string;
        operation?: string;
        isActive?: boolean;
        limit?: number;
    }): Promise<RLSPolicy[]>;
    createRLSPolicy(policyData: Omit<RLSPolicy, 'id' | 'createdAt' | 'updatedAt'>): Promise<RLSPolicy>;
    getRLSRules(organizationId: string, filters?: {
        isActive?: boolean;
        role?: string;
        limit?: number;
    }): Promise<RLSRule[]>;
    createRLSRule(ruleData: Omit<RLSRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<RLSRule>;
    evaluateAccess(context: RLSContext, operation: {
        type: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
        tableName: string;
        recordId?: string;
        columns?: string[];
    }): Promise<{
        allowed: boolean;
        reason?: string;
        policiesApplied: string[];
        rulesEvaluated: string[];
        executionTime: number;
    }>;
    private evaluateRule;
    private evaluatePolicy;
    logRLSAccess(auditData: Omit<RLSAuditLog, 'id' | 'timestamp'>): Promise<RLSAuditLog>;
    getRLSStats(organizationId: string): Promise<{
        totalPolicies: number;
        activePolicies: number;
        totalRules: number;
        activeRules: number;
        totalValidations: number;
        activeValidations: number;
        accessStats: {
            totalAccessAttempts: number;
            allowedAccess: number;
            deniedAccess: number;
            averageExecutionTime: number;
        };
        last24Hours: {
            accessAttempts: number;
            allowedAccess: number;
            deniedAccess: number;
        };
        last7Days: {
            accessAttempts: number;
            allowedAccess: number;
            deniedAccess: number;
        };
        byOperation: {
            SELECT: number;
            INSERT: number;
            UPDATE: number;
            DELETE: number;
        };
        byTable: Record<string, number>;
        byUser: Record<string, number>;
        topPolicies: {
            policyId: string;
            count: number;
        }[];
        topRules: {
            ruleId: string;
            count: number;
        }[];
    }>;
    private getTableStats;
    private getUserStats;
    private getTopPolicies;
    private getTopRules;
    generateRLSPolicy(organizationId: string, tableName: string, requirements: {
        accessLevel: 'public' | 'organization' | 'user' | 'admin';
        operations: ('SELECT' | 'INSERT' | 'UPDATE' | 'DELETE')[];
        roles: string[];
        additionalConditions?: string;
    }): Promise<RLSPolicy>;
}
export declare const rlsGenerativaService: RLSGenerativaService;
export {};
//# sourceMappingURL=rls-generativa.service.d.ts.map