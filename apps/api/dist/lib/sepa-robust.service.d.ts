interface SEPARobustTransaction {
    id: string;
    organizationId: string;
    accountId: string;
    transactionId: string;
    amount: number;
    currency: string;
    date: string;
    valueDate: string;
    description: string;
    reference: string;
    counterparty: {
        name: string;
        iban: string;
        bic: string;
    };
    category: string;
    status: 'pending' | 'matched' | 'reconciled' | 'disputed' | 'exception';
    matchingScore: number;
    matchedTransactionId?: string;
    camtVersion: '053' | '054';
    exceptionType?: 'duplicate' | 'invalid_amount' | 'missing_reference' | 'invalid_iban' | 'date_mismatch' | 'currency_mismatch';
    exceptionDetails?: string;
    validationErrors: string[];
    processingFlags: string[];
    createdAt: string;
    updatedAt: string;
}
interface SEPARobustRule {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    priority: number;
    conditions: {
        field: string;
        operator: 'equals' | 'contains' | 'regex' | 'range' | 'exists' | 'not_exists';
        value: any;
        weight: number;
    }[];
    actions: {
        type: 'auto_match' | 'flag_exception' | 'transform_data' | 'send_alert' | 'require_manual_review';
        parameters: Record<string, any>;
    }[];
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
interface SEPARobustException {
    id: string;
    organizationId: string;
    transactionId: string;
    exceptionType: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    details: Record<string, any>;
    status: 'open' | 'in_review' | 'resolved' | 'ignored';
    assignedTo?: string;
    resolution?: string;
    createdAt: string;
    updatedAt: string;
}
interface SEPARobustValidation {
    transactionId: string;
    isValid: boolean;
    errors: string[];
    warnings: string[];
    suggestions: string[];
    confidence: number;
}
interface SEPARobustReport {
    id: string;
    organizationId: string;
    reportType: 'processing_summary' | 'exception_analysis' | 'rule_performance' | 'validation_report';
    period: {
        startDate: string;
        endDate: string;
    };
    summary: {
        totalTransactions: number;
        processedTransactions: number;
        exceptionTransactions: number;
        matchedTransactions: number;
        averageProcessingTime: number;
        successRate: number;
    };
    data: any;
    generatedBy: string;
    createdAt: string;
}
declare class SEPARobustService {
    private transactions;
    private rules;
    private exceptions;
    private validations;
    constructor();
    init(): void;
    private createDemoData;
    createTransaction(transactionData: Omit<SEPARobustTransaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<SEPARobustTransaction>;
    getTransaction(transactionId: string): Promise<SEPARobustTransaction | undefined>;
    getTransactions(organizationId: string, filters?: {
        status?: string;
        exceptionType?: string;
        camtVersion?: string;
        accountId?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<SEPARobustTransaction[]>;
    createRule(ruleData: Omit<SEPARobustRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<SEPARobustRule>;
    getRules(organizationId: string, filters?: {
        enabled?: boolean;
        priority?: number;
        limit?: number;
    }): Promise<SEPARobustRule[]>;
    createException(exceptionData: Omit<SEPARobustException, 'id' | 'createdAt' | 'updatedAt'>): Promise<SEPARobustException>;
    getExceptions(organizationId: string, filters?: {
        status?: string;
        severity?: string;
        exceptionType?: string;
        assignedTo?: string;
        limit?: number;
    }): Promise<SEPARobustException[]>;
    validateTransaction(transaction: SEPARobustTransaction): Promise<SEPARobustValidation>;
    private applyRules;
    private evaluateRule;
    private evaluateCondition;
    private getFieldValue;
    private executeRuleActions;
    private validateIBAN;
    private validateReference;
    private determineExceptionType;
    generateReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<SEPARobustReport>;
    getStats(organizationId: string): Promise<{
        totalTransactions: number;
        totalExceptions: number;
        totalRules: number;
        activeRules: number;
        last24Hours: {
            transactions: number;
            exceptions: number;
            successRate: number;
        };
        last7Days: {
            transactions: number;
            exceptions: number;
        };
        byStatus: Record<string, number>;
        byExceptionType: Record<string, number>;
        bySeverity: Record<string, number>;
    }>;
}
export declare const sepaRobustService: SEPARobustService;
export {};
//# sourceMappingURL=sepa-robust.service.d.ts.map