export interface SEPATransaction {
    id: string;
    accountId: string;
    transactionId: string;
    amount: number;
    currency: string;
    date: Date;
    valueDate: Date;
    description: string;
    reference: string;
    counterparty: {
        name: string;
        iban: string;
        bic: string;
    };
    category: string;
    status: 'pending' | 'matched' | 'reconciled' | 'disputed';
    matchingScore?: number;
    matchedTransactionId?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface MatchingRule {
    id: string;
    name: string;
    description: string;
    priority: number;
    conditions: MatchingCondition[];
    actions: MatchingAction[];
    enabled: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface MatchingCondition {
    field: string;
    operator: 'equals' | 'contains' | 'regex' | 'range';
    value: unknown;
    weight: number;
}
export interface MatchingAction {
    type: 'match' | 'flag' | 'transform';
    parameters: Record<string, unknown>;
}
export interface ReconciliationResult {
    id: string;
    transactionId: string;
    matchedTransactionId: string;
    score: number;
    status: 'auto' | 'manual' | 'disputed';
    createdAt: Date;
    updatedAt: Date;
}
export interface SEPAUploadResult {
    fileId: string;
    fileName: string;
    transactionsCount: number;
    processedCount: number;
    errorsCount: number;
    status: 'success' | 'partial' | 'failed';
    errors: string[];
    createdAt: Date;
}
//# sourceMappingURL=sepa-types.d.ts.map