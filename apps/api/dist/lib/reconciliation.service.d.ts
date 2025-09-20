import { SEPATransaction, ReconciliationResult } from './sepa-types.js';
export declare class ReconciliationService {
    private matchingEngine;
    private reconciliationResults;
    constructor();
    performReconciliation(sepaTransactions: SEPATransaction[], existingTransactions: SEPATransaction[]): Promise<{
        results: ReconciliationResult[];
        summary: {
            total: number;
            autoReconciled: number;
            manualReconciled: number;
            pending: number;
            disputed: number;
            successRate: number;
        };
    }>;
    private calculateReconciliationSummary;
    manualReconciliation(transactionId: string, matchedTransactionId: string, userId: string): Promise<ReconciliationResult | null>;
    disputeReconciliation(transactionId: string, reason: string, userId: string): Promise<ReconciliationResult | null>;
    approveReconciliation(transactionId: string, userId: string): Promise<ReconciliationResult | null>;
    getReconciliationResults(): ReconciliationResult[];
    getReconciliationResult(transactionId: string): ReconciliationResult | null;
    getReconciliationStats(): {
        totalReconciliations: number;
        autoReconciled: number;
        manualReconciled: number;
        pending: number;
        disputed: number;
        successRate: number;
        averageScore: number;
    };
    exportReconciliationReport(): {
        summary: any;
        results: ReconciliationResult[];
        exportedAt: Date;
    };
}
//# sourceMappingURL=reconciliation.service.d.ts.map