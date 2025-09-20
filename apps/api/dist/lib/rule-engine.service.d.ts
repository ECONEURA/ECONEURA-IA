import { MatchingRule } from './sepa-types.js';
export declare class RuleEngineService {
    private rules;
    constructor();
    private initializeDefaultRules;
    addRule(rule: Omit<MatchingRule, 'id' | 'createdAt' | 'updatedAt'>): MatchingRule;
    updateRule(ruleId: string, updates: Partial<MatchingRule>): MatchingRule | null;
    deleteRule(ruleId: string): boolean;
    getRule(ruleId: string): MatchingRule | null;
    getRules(): MatchingRule[];
    getEnabledRules(): MatchingRule[];
    enableRule(ruleId: string): boolean;
    disableRule(ruleId: string): boolean;
    validateRule(rule: Omit<MatchingRule, 'id' | 'createdAt' | 'updatedAt'>): {
        isValid: boolean;
        errors: string[];
    };
    private validateCondition;
    private validateAction;
    testRule(rule: MatchingRule, testData: any): {
        passed: boolean;
        score: number;
        details: any;
    };
    private evaluateCondition;
    private getNestedValue;
    private sortRulesByPriority;
    getRuleStats(): {
        totalRules: number;
        enabledRules: number;
        disabledRules: number;
        averagePriority: number;
    };
}
//# sourceMappingURL=rule-engine.service.d.ts.map