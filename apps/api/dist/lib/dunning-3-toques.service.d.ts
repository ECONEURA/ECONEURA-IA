export interface Invoice {
    id: string;
    invoiceNumber: string;
    customerId: string;
    customerName: string;
    amount: number;
    currency: string;
    dueDate: string;
    status: 'pending' | 'overdue' | 'paid' | 'cancelled';
    organizationId: string;
    createdAt: string;
    updatedAt: string;
    metadata?: Record<string, any>;
}
export interface DunningStep {
    id: string;
    invoiceId: string;
    stepNumber: number;
    stepType: 'email' | 'call' | 'letter' | 'legal';
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'cancelled';
    scheduledDate: string;
    sentDate?: string;
    deliveryDate?: string;
    content: string;
    recipient: string;
    channel: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    escalationLevel: number;
    createdAt: string;
    updatedAt: string;
}
export interface DunningCampaign {
    id: string;
    invoiceId: string;
    customerId: string;
    status: 'active' | 'completed' | 'cancelled' | 'paused';
    currentStep: number;
    totalSteps: number;
    startDate: string;
    endDate?: string;
    steps: DunningStep[];
    paymentReceived?: boolean;
    paymentDate?: string;
    notes: string[];
    createdAt: string;
    updatedAt: string;
}
export interface DunningConfig {
    enabled: boolean;
    maxSteps: number;
    stepIntervals: number[];
    escalationThresholds: {
        email: number;
        call: number;
        letter: number;
        legal: number;
    };
    channels: {
        email: {
            enabled: boolean;
            template: string;
        };
        call: {
            enabled: boolean;
            script: string;
        };
        letter: {
            enabled: boolean;
            template: string;
        };
        legal: {
            enabled: boolean;
            template: string;
        };
    };
    autoEscalation: boolean;
    gracePeriod: number;
    maxOverdueDays: number;
    notificationEnabled: boolean;
}
export interface DunningStats {
    totalInvoices: number;
    overdueInvoices: number;
    activeCampaigns: number;
    completedCampaigns: number;
    successfulCollections: number;
    collectionRate: number;
    averageDaysToPayment: number;
    stepEffectiveness: Record<string, number>;
    lastRun: string;
}
export declare class Dunning3ToquesService {
    private config;
    private invoices;
    private campaigns;
    private steps;
    private stats;
    private isProcessing;
    private processingInterval;
    constructor(config?: Partial<DunningConfig>);
    private startPeriodicProcessing;
    processDunningCampaigns(): Promise<DunningStats>;
    private getOverdueInvoices;
    private createNewCampaigns;
    private createDunningCampaign;
    private getStepType;
    private getScheduledDate;
    private generateStepContent;
    private getChannel;
    private getPriority;
    private processActiveCampaigns;
    private processCampaign;
    private executeStep;
    private sendStep;
    private calculateStats;
    getActiveCampaigns(): DunningCampaign[];
    getCampaign(campaignId: string): DunningCampaign | null;
    getCampaignSteps(campaignId: string): DunningStep[];
    markInvoiceAsPaid(invoiceId: string, paymentDate: string): Promise<void>;
    getStats(): DunningStats;
    updateConfig(newConfig: Partial<DunningConfig>): void;
    stop(): void;
}
export declare const dunning3ToquesService: Dunning3ToquesService;
//# sourceMappingURL=dunning-3-toques.service.d.ts.map