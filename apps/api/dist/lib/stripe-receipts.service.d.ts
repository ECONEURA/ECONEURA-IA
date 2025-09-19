interface StripeReceipt {
    id: string;
    organizationId: string;
    stripePaymentIntentId: string;
    stripeChargeId: string;
    amount: number;
    currency: string;
    status: 'pending' | 'succeeded' | 'failed' | 'canceled' | 'requires_action';
    customerId: string;
    customerEmail: string;
    description: string;
    metadata: Record<string, string>;
    receiptUrl?: string;
    receiptNumber: string;
    createdAt: string;
    updatedAt: string;
    reconciledAt?: string;
    reconciliationStatus: 'pending' | 'reconciled' | 'discrepancy' | 'manual_review';
    bankTransactionId?: string;
    bankReference?: string;
    discrepancyReason?: string;
    discrepancyAmount?: number;
}
interface StripeWebhookEvent {
    id: string;
    type: string;
    data: {
        object: any;
    };
    created: number;
    livemode: boolean;
}
interface ReconciliationRule {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    conditions: {
        amountRange?: {
            min: number;
            max: number;
        };
        currency?: string;
        customerEmail?: string;
        descriptionPattern?: string;
        metadata?: Record<string, string>;
    };
    actions: {
        autoReconcile: boolean;
        alertOnDiscrepancy: boolean;
        requireManualReview: boolean;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
interface ReconciliationReport {
    id: string;
    organizationId: string;
    period: {
        startDate: string;
        endDate: string;
    };
    summary: {
        totalReceipts: number;
        totalAmount: number;
        reconciledReceipts: number;
        reconciledAmount: number;
        pendingReceipts: number;
        pendingAmount: number;
        discrepancyReceipts: number;
        discrepancyAmount: number;
        reconciliationRate: number;
    };
    receipts: StripeReceipt[];
    discrepancies: {
        receiptId: string;
        reason: string;
        amount: number;
        suggestedAction: string;
    }[];
    createdAt: string;
    generatedBy: string;
}
declare class StripeReceiptsService {
    private receipts;
    private reconciliationRules;
    private webhookEvents;
    constructor();
    init(): void;
    private createDemoData;
    createReceipt(receiptData: Omit<StripeReceipt, 'id' | 'createdAt' | 'updatedAt' | 'reconciliationStatus'>): Promise<StripeReceipt>;
    getReceipt(receiptId: string): Promise<StripeReceipt | undefined>;
    getReceipts(organizationId: string, filters?: {
        status?: string;
        reconciliationStatus?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<StripeReceipt[]>;
    processWebhookEvent(event: StripeWebhookEvent): Promise<{
        processed: boolean;
        receiptId?: string;
    }>;
    private handlePaymentIntentSucceeded;
    private handlePaymentIntentFailed;
    private handleChargeDispute;
    autoReconcileReceipt(receiptId: string): Promise<boolean>;
    private matchesRule;
    manualReconcileReceipt(receiptId: string, bankTransactionId: string, bankReference: string, notes?: string): Promise<StripeReceipt | undefined>;
    createReconciliationRule(ruleData: Omit<ReconciliationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ReconciliationRule>;
    getReconciliationRules(organizationId: string): Promise<ReconciliationRule[]>;
    generateReconciliationReport(organizationId: string, startDate: string, endDate: string, generatedBy: string): Promise<ReconciliationReport>;
    getReconciliationStats(organizationId: string): Promise<{
        totalReceipts: number;
        totalAmount: number;
        reconciledReceipts: number;
        pendingReceipts: number;
        discrepancyReceipts: number;
        manualReviewReceipts: number;
        reconciliationRate: number;
        last30Days: {
            receipts: number;
            amount: number;
            reconciled: number;
        };
        last7Days: {
            receipts: number;
            amount: number;
            reconciled: number;
        };
        byStatus: {
            succeeded: number;
            failed: number;
            pending: number;
            canceled: number;
        };
    }>;
}
export declare const stripeReceiptsService: StripeReceiptsService;
export {};
//# sourceMappingURL=stripe-receipts.service.d.ts.map