import { RLSPolicy, PolicyValidationResult, ValidationConfig } from './rls-types.js';
export declare class RLSPolicyValidatorService {
    private validationResults;
    private validationConfigs;
    constructor();
    private initializeValidationConfigs;
    validatePolicy(policy: RLSPolicy, validationTypes: string[], executedBy: string): Promise<PolicyValidationResult[]>;
    private performValidation;
    private validateSyntax;
    private validateSemantic;
    private validatePerformance;
    private validateSecurity;
    private validateCompliance;
    private validateGDPRCompliance;
    private calculateConditionComplexity;
    private requiresIndex;
    private analyzeConditionPerformance;
    private detectNPlusOneQueries;
    private detectPrivilegeEscalation;
    private detectDataLeakage;
    private detectBypassVulnerabilities;
    private detectSensitiveDataExposure;
    private checkDataRetentionCompliance;
    private generateRecommendations;
    getValidationResults(policyId?: string): PolicyValidationResult[];
    getValidationResult(resultId: string): PolicyValidationResult | null;
    getValidationConfigs(): ValidationConfig[];
    getValidationConfig(configId: string): ValidationConfig | null;
    updateValidationConfig(configId: string, updates: Partial<ValidationConfig>): ValidationConfig | null;
    getValidationStats(): {
        totalValidations: number;
        passedValidations: number;
        failedValidations: number;
        warningValidations: number;
        averageScore: number;
        validationsByType: Record<string, number>;
    };
}
//# sourceMappingURL=rls-policy-validator.service.d.ts.map