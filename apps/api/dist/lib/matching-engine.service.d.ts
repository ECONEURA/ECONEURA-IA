import { SEPATransaction, MatchingRule, ReconciliationResult } from './sepa-types.js';
export declare class MatchingEngineService {
    private rules;
    private reconciliationResults;
    constructor();
    private initializeDefaultRules;
    matchTransactions(sepaTransactions: SEPATransaction[], existingTransactions: SEPATransaction[]): Promise<ReconciliationResult[]>;
    private calculateMatchingScore;
    private evaluateCondition;
    private getFieldValue;
    addRule(rule: MatchingRule): void;
    updateRule(ruleId: string, updates: Partial<MatchingRule>): boolean;
    deleteRule(ruleId: string): boolean;
    getRules(): MatchingRule[];
    getReconciliationResults(): ReconciliationResult[];
    getMatchingStats(): {
        totalTransactions: number;
        matchedTransactions: number;
        autoMatched: number;
        manualMatched: number;
        pendingTransactions: number;
        averageScore: number;
    };
}
//# sourceMappingURL=matching-engine.service.d.ts.map