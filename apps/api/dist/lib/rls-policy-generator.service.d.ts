import { RLSPolicy, PolicyTemplate, PolicyGenerationRequest, DatabaseSchema, PolicyRule, PolicyGenerationOptions } from './rls-types.js';
export declare class RLSPolicyGeneratorService {
    private policies;
    private templates;
    private schemas;
    private generationRequests;
    constructor();
    private initializeTemplates;
    private initializeSchemas;
    generatePolicy(schemaId: string, tableName: string, policyType: 'select' | 'insert' | 'update' | 'delete' | 'all', templateId: string, variables: Record<string, unknown>, rules: PolicyRule[], options: PolicyGenerationOptions, requestedBy: string): Promise<RLSPolicy>;
    private generatePolicyFromTemplate;
    private generateCondition;
    private extractRoles;
    private extractUsers;
    private extractOrganizations;
    private extractDataCategories;
    getPolicy(policyId: string): RLSPolicy | null;
    getPolicies(): RLSPolicy[];
    getPoliciesByTable(tableName: string): RLSPolicy[];
    getPoliciesBySchema(schemaName: string): RLSPolicy[];
    getTemplates(): PolicyTemplate[];
    getTemplate(templateId: string): PolicyTemplate | null;
    getTemplatesByCategory(category: string): PolicyTemplate[];
    getSchemas(): DatabaseSchema[];
    getSchema(schemaId: string): DatabaseSchema | null;
    getGenerationRequests(): PolicyGenerationRequest[];
    getGenerationRequest(requestId: string): PolicyGenerationRequest | null;
    updatePolicy(policyId: string, updates: Partial<RLSPolicy>): RLSPolicy | null;
    deletePolicy(policyId: string): boolean;
    getPolicyStats(): {
        totalPolicies: number;
        draftPolicies: number;
        validatedPolicies: number;
        deployedPolicies: number;
        failedPolicies: number;
        policiesByType: Record<string, number>;
        policiesByTable: Record<string, number>;
    };
}
//# sourceMappingURL=rls-policy-generator.service.d.ts.map