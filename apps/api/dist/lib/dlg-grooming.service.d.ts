interface DLQMessage {
    id: string;
    organizationId: string;
    queueName: string;
    originalMessage: {
        id: string;
        type: string;
        payload: Record<string, any>;
        headers: Record<string, string>;
        timestamp: string;
        retryCount: number;
        maxRetries: number;
    };
    failureInfo: {
        errorType: string;
        errorMessage: string;
        stackTrace?: string;
        failureTimestamp: string;
        retryAttempts: number;
        lastRetryAt?: string;
    };
    analysis: {
        rootCause?: string;
        category: 'transient' | 'permanent' | 'configuration' | 'data' | 'system';
        severity: 'low' | 'medium' | 'high' | 'critical';
        suggestedAction: 'retry' | 'skip' | 'manual_review' | 'escalate';
        confidence: number;
        patterns: string[];
        similarFailures: number;
    };
    grooming: {
        status: 'pending' | 'analyzed' | 'retried' | 'skipped' | 'escalated' | 'resolved';
        groomedBy?: string;
        groomedAt?: string;
        notes?: string;
        autoRetryScheduled?: string;
        manualReviewRequired: boolean;
    };
    metrics: {
        processingTime?: number;
        memoryUsage?: number;
        cpuUsage?: number;
        networkLatency?: number;
    };
    createdAt: string;
    updatedAt: string;
}
interface DLQPattern {
    id: string;
    organizationId: string;
    name: string;
    description: string;
    pattern: {
        errorType: string;
        errorMessage?: string;
        queueName?: string;
        messageType?: string;
        conditions: Array<{
            field: string;
            operator: 'equals' | 'contains' | 'regex' | 'starts_with' | 'ends_with';
            value: string;
        }>;
    };
    action: {
        type: 'auto_retry' | 'skip' | 'escalate' | 'manual_review';
        config: {
            maxRetries?: number;
            retryDelay?: number;
            escalationLevel?: number;
            notificationChannels?: string[];
        };
    };
    statistics: {
        matches: number;
        successRate: number;
        lastMatch: string;
        averageResolutionTime: number;
    };
    enabled: boolean;
    createdAt: string;
    updatedAt: string;
}
interface DLQReport {
    id: string;
    organizationId: string;
    reportType: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
    period: {
        startDate: string;
        endDate: string;
    };
    data: {
        totalMessages: number;
        byCategory: Record<string, number>;
        bySeverity: Record<string, number>;
        byQueue: Record<string, number>;
        topErrors: Array<{
            errorType: string;
            count: number;
            percentage: number;
        }>;
        resolutionStats: {
            autoResolved: number;
            manuallyResolved: number;
            escalated: number;
            skipped: number;
        };
        performanceMetrics: {
            averageProcessingTime: number;
            averageResolutionTime: number;
            successRate: number;
        };
        patterns: Array<{
            patternId: string;
            patternName: string;
            matches: number;
            successRate: number;
        }>;
    };
    generatedBy: string;
    createdAt: string;
}
declare class DLQGroomingService {
    private messages;
    private patterns;
    private retryJobs;
    constructor();
    init(): void;
    private createDemoData;
    private startAutoGrooming;
    private startRetryProcessor;
    createDLQMessage(messageData: Omit<DLQMessage, 'id' | 'createdAt' | 'updatedAt'>): Promise<DLQMessage>;
    getDLQMessages(organizationId: string, filters?: {
        queueName?: string;
        status?: string;
        category?: string;
        severity?: string;
        startDate?: string;
        endDate?: string;
        limit?: number;
    }): Promise<DLQMessage[]>;
    createPattern(patternData: Omit<DLQPattern, 'id' | 'createdAt' | 'updatedAt'>): Promise<DLQPattern>;
    getPatterns(organizationId: string, filters?: {
        enabled?: boolean;
        actionType?: string;
        limit?: number;
    }): Promise<DLQPattern[]>;
    analyzeMessage(messageId: string): Promise<DLQMessage>;
    private matchesPattern;
    private evaluateCondition;
    private determineRootCause;
    private categorizeError;
    private assessSeverity;
    private scheduleAction;
    processScheduledRetries(): Promise<void>;
    private executeRetry;
    private simulateRetryProcessing;
    groomMessage(messageId: string, action: {
        status: 'retried' | 'skipped' | 'escalated' | 'resolved';
        notes?: string;
        groomedBy: string;
    }): Promise<DLQMessage>;
    processPendingMessages(): Promise<void>;
    generateReport(organizationId: string, reportType: string, startDate: string, endDate: string, generatedBy: string): Promise<DLQReport>;
    private calculateAverageResolutionTime;
    private calculateSuccessRate;
    getStats(organizationId: string): Promise<{
        totalMessages: number;
        totalPatterns: number;
        totalRetryJobs: number;
        last24Hours: {
            newMessages: number;
            retryJobs: number;
            autoResolved: number;
            manuallyResolved: number;
            escalated: number;
        };
        last7Days: {
            newMessages: number;
            retryJobs: number;
        };
        byStatus: Record<string, number>;
        byCategory: Record<string, number>;
        bySeverity: Record<string, number>;
        byQueue: Record<string, number>;
        retryJobStats: {
            scheduled: number;
            running: number;
            completed: number;
            failed: number;
        };
    }>;
}
export declare const dlgGroomingService: DLQGroomingService;
export {};
//# sourceMappingURL=dlg-grooming.service.d.ts.map