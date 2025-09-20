export interface EmailProcessingRequest {
    messageId: string;
    organizationId: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    metadata?: Record<string, any>;
}
export interface EmailProcessingResponse {
    success: boolean;
    messageId: string;
    result?: {
        processed: boolean;
        action: string;
        confidence: number;
        metadata: {
            category: string;
            sentiment: string;
            urgency: string;
            language: string;
            entities: string[];
        };
        processingTime: number;
    };
    error?: string;
    serviceId: string;
    responseTime: number;
}
export interface CronJobRequest {
    jobId: string;
    action: 'enable' | 'disable' | 'status';
    organizationId: string;
}
export interface CronJobResponse {
    success: boolean;
    jobId: string;
    result?: any;
    error?: string;
    serviceId: string;
    responseTime: number;
}
export declare class WorkersIntegrationService {
    private workersClient;
    private isInitialized;
    constructor();
    private initialize;
    processEmail(request: EmailProcessingRequest): Promise<EmailProcessingResponse>;
    processBulkEmails(requests: EmailProcessingRequest[]): Promise<EmailProcessingResponse[]>;
    manageCronJob(request: CronJobRequest): Promise<CronJobResponse>;
    getWorkersHealth(): Promise<{
        healthy: boolean;
        services: any[];
        stats: any;
    }>;
    private setupWebhookSubscriptions;
    private startHeartbeat;
    getStats(): {
        initialized: boolean;
        workersClient: any;
        webhookStats: any;
        serviceDiscovery: any;
    };
}
export declare const workersIntegrationService: WorkersIntegrationService;
//# sourceMappingURL=workers-integration.service.d.ts.map