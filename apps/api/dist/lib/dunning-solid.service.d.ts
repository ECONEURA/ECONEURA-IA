export interface DunningSegment {
    id: string;
    name: string;
    description: string;
    criteria: {
        overdueDays: {
            min: number;
            max: number;
        };
        amountRange: {
            min: number;
            max: number;
        };
        customerType: 'individual' | 'business' | 'both';
        riskLevel: 'low' | 'medium' | 'high';
        industry?: string[];
        region?: string[];
    };
    strategy: {
        maxRetries: number;
        retryInterval: number;
        escalationSteps: number;
        communicationChannels: ('email' | 'sms' | 'call' | 'letter')[];
        priority: 'low' | 'medium' | 'high' | 'critical';
    };
    kpis: {
        targetCollectionRate: number;
        targetResponseTime: number;
        maxDunningDuration: number;
        acceptableFailureRate: number;
    };
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
export interface DunningKPI {
    id: string;
    segmentId: string;
    metric: string;
    value: number;
    target: number;
    unit: string;
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    timestamp: string;
    status: 'on_target' | 'below_target' | 'above_target' | 'critical';
    trend: 'improving' | 'stable' | 'declining';
    metadata: Record<string, any>;
}
export interface DLQMessage {
    id: string;
    originalMessageId: string;
    queueName: string;
    messageType: 'dunning_step' | 'escalation' | 'notification' | 'retry';
    payload: Record<string, any>;
    failureReason: string;
    retryCount: number;
    maxRetries: number;
    firstFailureAt: string;
    lastFailureAt: string;
    nextRetryAt: string;
    status: 'pending' | 'processing' | 'retried' | 'dead' | 'resolved';
    priority: 'low' | 'medium' | 'high' | 'critical';
    organizationId: string;
    metadata: Record<string, any>;
}
export interface DunningRetry {
    id: string;
    messageId: string;
    attemptNumber: number;
    status: 'pending' | 'processing' | 'success' | 'failed';
    scheduledAt: string;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
    retryStrategy: 'immediate' | 'exponential_backoff' | 'linear' | 'custom';
    backoffMultiplier: number;
    maxBackoffTime: number;
    metadata: Record<string, any>;
}
export interface DunningStats {
    totalInvoices: number;
    overdueInvoices: number;
    collectedAmount: number;
    pendingAmount: number;
    collectionRate: number;
    averageCollectionTime: number;
    segmentStats: Record<string, {
        invoices: number;
        collected: number;
        pending: number;
        rate: number;
        avgTime: number;
    }>;
    dlqStats: {
        totalMessages: number;
        pendingRetries: number;
        deadMessages: number;
        retrySuccessRate: number;
        avgRetryTime: number;
    };
    kpiStats: {
        onTarget: number;
        belowTarget: number;
        aboveTarget: number;
        critical: number;
    };
    lastUpdated: string;
}
export interface DunningConfig {
    enabled: boolean;
    maxRetries: number;
    retryIntervals: number[];
    dlqRetentionDays: number;
    kpiCalculationInterval: number;
    autoEscalation: boolean;
    escalationThresholds: {
        collectionRate: number;
        responseTime: number;
        failureRate: number;
    };
    notificationEnabled: boolean;
    segments: DunningSegment[];
}
export declare class DunningSolidService {
    private config;
    private segments;
    private kpis;
    private dlqMessages;
    private retries;
    private stats;
    private kpiCalculationInterval;
    private dlqProcessingInterval;
    constructor(config?: Partial<DunningConfig>);
    private initializeDefaultSegments;
    private startKpiCalculation;
    private startDLQProcessing;
    createSegment(segment: Omit<DunningSegment, 'id' | 'createdAt' | 'updatedAt'>): Promise<DunningSegment>;
    updateSegment(segmentId: string, updates: Partial<DunningSegment>): Promise<DunningSegment>;
    getSegments(): DunningSegment[];
    getSegment(segmentId: string): DunningSegment | null;
    addToDLQ(originalMessageId: string, queueName: string, messageType: DLQMessage['messageType'], payload: Record<string, any>, failureReason: string, organizationId: string, priority?: DLQMessage['priority']): Promise<DLQMessage>;
    retryDLQMessage(dlqId: string): Promise<DunningRetry>;
    private calculateNextRetryTime;
    private processDLQMessages;
    private calculateKPIs;
    private updateKPIStats;
    private updateDLQStats;
    private updateOverallStats;
    getKPIs(segmentId?: string, period?: string): DunningKPI[];
    getDLQMessages(status?: string, priority?: string): DLQMessage[];
    getRetries(messageId?: string, status?: string): DunningRetry[];
    getStats(): DunningStats;
    updateConfig(newConfig: Partial<DunningConfig>): void;
    stop(): void;
}
export declare const dunningSolidService: DunningSolidService;
//# sourceMappingURL=dunning-solid.service.d.ts.map