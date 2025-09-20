import { z } from 'zod';
import { SEPATransaction, MatchingRule } from './sepa-types.js';
export declare const SEPATransactionSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    accountId: z.ZodString;
    transactionId: z.ZodString;
    amount: z.ZodNumber;
    currency: z.ZodDefault<z.ZodString>;
    date: z.ZodString;
    valueDate: z.ZodString;
    description: z.ZodString;
    reference: z.ZodOptional<z.ZodString>;
    counterparty: z.ZodObject<{
        name: z.ZodOptional<z.ZodString>;
        iban: z.ZodOptional<z.ZodString>;
        bic: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        name?: string;
        iban?: string;
        bic?: string;
    }, {
        name?: string;
        iban?: string;
        bic?: string;
    }>;
    category: z.ZodDefault<z.ZodString>;
    status: z.ZodDefault<z.ZodEnum<["pending", "matched", "reconciled", "disputed"]>>;
    matchingScore: z.ZodOptional<z.ZodNumber>;
    matchedTransactionId: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "matched" | "reconciled" | "disputed";
    date?: string;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    amount?: number;
    currency?: string;
    category?: string;
    valueDate?: string;
    reference?: string;
    transactionId?: string;
    accountId?: string;
    counterparty?: {
        name?: string;
        iban?: string;
        bic?: string;
    };
    matchingScore?: number;
    matchedTransactionId?: string;
}, {
    status?: "pending" | "matched" | "reconciled" | "disputed";
    date?: string;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    amount?: number;
    currency?: string;
    category?: string;
    valueDate?: string;
    reference?: string;
    transactionId?: string;
    accountId?: string;
    counterparty?: {
        name?: string;
        iban?: string;
        bic?: string;
    };
    matchingScore?: number;
    matchedTransactionId?: string;
}>;
export declare const MatchingRuleSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    priority: z.ZodDefault<z.ZodNumber>;
    conditions: z.ZodArray<z.ZodObject<{
        field: z.ZodString;
        operator: z.ZodEnum<["equals", "contains", "regex", "range"]>;
        value: z.ZodAny;
        weight: z.ZodDefault<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        value?: any;
        field?: string;
        operator?: "range" | "equals" | "contains" | "regex";
        weight?: number;
    }, {
        value?: any;
        field?: string;
        operator?: "range" | "equals" | "contains" | "regex";
        weight?: number;
    }>, "many">;
    actions: z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["match", "flag", "transform"]>;
        parameters: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type?: "match" | "flag" | "transform";
        parameters?: Record<string, any>;
    }, {
        type?: "match" | "flag" | "transform";
        parameters?: Record<string, any>;
    }>, "many">;
    enabled: z.ZodDefault<z.ZodBoolean>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    name?: string;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    priority?: number;
    actions?: {
        type?: "match" | "flag" | "transform";
        parameters?: Record<string, any>;
    }[];
    enabled?: boolean;
    conditions?: {
        value?: any;
        field?: string;
        operator?: "range" | "equals" | "contains" | "regex";
        weight?: number;
    }[];
}, {
    name?: string;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    priority?: number;
    actions?: {
        type?: "match" | "flag" | "transform";
        parameters?: Record<string, any>;
    }[];
    enabled?: boolean;
    conditions?: {
        value?: any;
        field?: string;
        operator?: "range" | "equals" | "contains" | "regex";
        weight?: number;
    }[];
}>;
export declare const SEPAFilterSchema: z.ZodObject<{
    accountId: z.ZodOptional<z.ZodString>;
    status: z.ZodOptional<z.ZodEnum<["pending", "matched", "reconciled", "disputed"]>>;
    category: z.ZodOptional<z.ZodString>;
    dateFrom: z.ZodOptional<z.ZodString>;
    dateTo: z.ZodOptional<z.ZodString>;
    amountMin: z.ZodOptional<z.ZodNumber>;
    amountMax: z.ZodOptional<z.ZodNumber>;
    reference: z.ZodOptional<z.ZodString>;
    counterpartyName: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    status?: "pending" | "matched" | "reconciled" | "disputed";
    limit?: number;
    category?: string;
    reference?: string;
    accountId?: string;
    dateFrom?: string;
    dateTo?: string;
    offset?: number;
    amountMin?: number;
    amountMax?: number;
    counterpartyName?: string;
}, {
    status?: "pending" | "matched" | "reconciled" | "disputed";
    limit?: number;
    category?: string;
    reference?: string;
    accountId?: string;
    dateFrom?: string;
    dateTo?: string;
    offset?: number;
    amountMin?: number;
    amountMax?: number;
    counterpartyName?: string;
}>;
export interface SEPASummary {
    total: number;
    totalValue: number;
    byStatus: Record<string, number>;
    byCategory: Record<string, number>;
    byAccount: Record<string, number>;
    pendingCount: number;
    matchedCount: number;
    reconciledCount: number;
    disputedCount: number;
    averageAmount: number;
    topCounterparties: Array<{
        name: string;
        count: number;
        totalAmount: number;
    }>;
    recentActivity: Array<{
        date: string;
        count: number;
    }>;
}
export interface SEPAAnalytics {
    summary: SEPASummary;
    trends: {
        matchingRate: number;
        reconciliationRate: number;
        averageProcessingTime: number;
        errorRate: number;
    };
    performance: {
        totalTransactions: number;
        matchedTransactions: number;
        reconciledTransactions: number;
        disputedTransactions: number;
        matchingAccuracy: number;
        processingEfficiency: number;
    };
    recommendations: string[];
}
export declare class SEPAService {
    private transactions;
    private matchingRules;
    private reconciliationResults;
    private nextId;
    constructor();
    private initializeSampleData;
    private initializeDefaultRules;
    createTransaction(orgId: string, userId: string, data: z.infer<typeof SEPATransactionSchema>): Promise<SEPATransaction>;
    getTransactions(orgId: string, filters: z.infer<typeof SEPAFilterSchema>): Promise<{
        transactions: SEPATransaction[];
        total: number;
    }>;
    getTransactionById(orgId: string, transactionId: string): Promise<SEPATransaction | null>;
    updateTransaction(orgId: string, transactionId: string, userId: string, data: Partial<z.infer<typeof SEPATransactionSchema>>): Promise<SEPATransaction | null>;
    deleteTransaction(orgId: string, transactionId: string, userId: string): Promise<boolean>;
    autoMatchTransaction(transactionId: string): Promise<{
        matched: boolean;
        score?: number;
        matchedTransactionId?: string;
    }>;
    private applyMatchingRule;
    private evaluateCondition;
    private getFieldValue;
    private findBestMatch;
    getSEPASummary(orgId: string): Promise<SEPASummary>;
    getSEPAAnalytics(orgId: string): Promise<SEPAAnalytics>;
    createMatchingRule(orgId: string, userId: string, data: z.infer<typeof MatchingRuleSchema>): Promise<MatchingRule>;
    getMatchingRules(orgId: string): Promise<MatchingRule[]>;
    getStats(): any;
}
export declare const sepaService: SEPAService;
//# sourceMappingURL=sepa.service.d.ts.map