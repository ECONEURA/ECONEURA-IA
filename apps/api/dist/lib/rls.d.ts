export interface RLSContext {
    organizationId: string;
    userId?: string;
    role?: string;
    permissions?: string[];
    tenantId?: string;
    requestId?: string;
}
export interface RLSRule {
    id: string;
    name: string;
    table: string;
    condition: string;
    organizationId: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface RLSFilter {
    organizationId: string;
    userId?: string;
    role?: string;
    permissions?: string[];
    tenantId?: string;
}
export declare class RowLevelSecurity {
    private rules;
    private context;
    constructor();
    setContext(context: RLSContext): void;
    getContext(): RLSContext | null;
    clearContext(): void;
    createRule(ruleData: Omit<RLSRule, 'id' | 'createdAt' | 'updatedAt'>): string;
    updateRule(ruleId: string, updates: Partial<RLSRule>): boolean;
    deleteRule(ruleId: string): boolean;
    getRulesByOrganization(organizationId: string): RLSRule[];
    getRulesByTable(table: string): RLSRule[];
    applyRLSFilters(table: string, baseQuery?: any): any;
    private evaluateRule;
    private applyRuleCondition;
    private parseRuleCondition;
    private applyDefaultFilters;
    checkAccess(resource: string, action: string): boolean;
    private hasPermission;
    private getRolePermissions;
    sanitizeInput(data: any, table: string): any;
    validateOutput(data: any, table: string): boolean;
    private initializeDefaultRules;
    getStats(): any;
}
export declare const rlsSystem: RowLevelSecurity;
//# sourceMappingURL=rls.d.ts.map