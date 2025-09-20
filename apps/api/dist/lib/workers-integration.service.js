const createServiceClient = () => ({
    post: async (url, data) => {
        return { success: true, data };
    },
    get: async (url) => {
        return { success: true, data: {} };
    }
});
const webhookManager = {
    subscribe: (topic, callback) => {
    },
    publish: (topic, data) => {
    }
};
const serviceDiscovery = {
    register: (service) => {
    },
    registerService: (service) => {
    },
    discover: (serviceName) => {
        return { url: 'http://localhost:3001', healthy: true };
    },
    discoverService: (serviceName) => {
        return { url: 'http://localhost:3001', healthy: true };
    }
};
import { structuredLogger } from './structured-logger.js';
export class WorkersIntegrationService {
    workersClient;
    isInitialized = false;
    constructor() {
        this.workersClient = createServiceClient({
            serviceType: 'workers',
            timeout: 30000,
            retries: 3,
            retryDelay: 2000,
            circuitBreakerThreshold: 5,
            loadBalancing: 'round-robin'
        });
        this.initialize();
    }
    async initialize() {
        try {
            serviceDiscovery.registerService({
                id: 'api-main',
                name: 'ECONEURA API',
                type: 'api',
                host: 'localhost',
                port: 3001,
                version: '1.0.0',
                status: 'healthy',
                lastHeartbeat: new Date(),
                metadata: {
                    features: ['crm', 'erp', 'finance', 'ai', 'analytics'],
                    endpoints: ['/v1/contacts', '/v1/companies', '/v1/deals', '/v1/products']
                }
            });
            serviceDiscovery.registerEndpoints('api-main', [
                {
                    serviceId: 'api-main',
                    endpoint: '/v1/emails/process',
                    method: 'POST',
                    description: 'Process email through workers',
                    requiresAuth: true
                },
                {
                    serviceId: 'api-main',
                    endpoint: '/v1/cron/jobs',
                    method: 'GET',
                    description: 'Get cron job status',
                    requiresAuth: true
                }
            ]);
            this.setupWebhookSubscriptions();
            this.startHeartbeat();
            this.isInitialized = true;
            structuredLogger.info('Workers Integration Service initialized', {
                serviceId: 'api-main',
                workersClient: this.workersClient.getStats()
            });
        }
        catch (error) {
            structuredLogger.error('Failed to initialize Workers Integration Service', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async processEmail(request) {
        if (!this.isInitialized) {
            throw new Error('Workers Integration Service not initialized');
        }
        try {
            structuredLogger.info('Processing email through workers', {
                messageId: request.messageId,
                organizationId: request.organizationId,
                priority: request.priority || 'normal'
            });
            const response = await this.workersClient.request({
                endpoint: '/emails/process',
                method: 'POST',
                data: {
                    messageId: request.messageId,
                    organizationId: request.organizationId,
                    priority: request.priority || 'normal',
                    metadata: request.metadata || {}
                },
                headers: {
                    'X-Organization-ID': request.organizationId,
                    'X-Request-Source': 'api'
                }
            });
            if (response.success) {
                await webhookManager.emitEvent({
                    type: 'email.processed',
                    data: {
                        messageId: request.messageId,
                        organizationId: request.organizationId,
                        result: response.data
                    },
                    source: 'api',
                    version: '1.0.0'
                });
                structuredLogger.info('Email processed successfully', {
                    messageId: request.messageId,
                    serviceId: response.serviceId,
                    responseTime: response.responseTime
                });
            }
            return {
                success: response.success,
                messageId: request.messageId,
                result: response.data,
                error: response.error,
                serviceId: response.serviceId,
                responseTime: response.responseTime
            };
        }
        catch (error) {
            structuredLogger.error('Failed to process email through workers', {
                messageId: request.messageId,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                messageId: request.messageId,
                error: error instanceof Error ? error.message : 'Unknown error',
                serviceId: 'unknown',
                responseTime: 0
            };
        }
    }
    async processBulkEmails(requests) {
        if (!this.isInitialized) {
            throw new Error('Workers Integration Service not initialized');
        }
        try {
            structuredLogger.info('Processing bulk emails through workers', {
                count: requests.length,
                organizationId: requests[0]?.organizationId
            });
            const response = await this.workersClient.request({
                endpoint: '/emails/process/bulk',
                method: 'POST',
                data: {
                    messageIds: requests.map(r => r.messageId),
                    organizationId: requests[0]?.organizationId,
                    priority: requests[0]?.priority || 'normal'
                },
                headers: {
                    'X-Organization-ID': requests[0]?.organizationId || '',
                    'X-Request-Source': 'api'
                }
            });
            if (response.success && response.data) {
                await webhookManager.emitEvent({
                    type: 'email.bulk_processed',
                    data: {
                        count: requests.length,
                        organizationId: requests[0]?.organizationId,
                        results: response.data.results
                    },
                    source: 'api',
                    version: '1.0.0'
                });
                structuredLogger.info('Bulk emails processed successfully', {
                    count: requests.length,
                    serviceId: response.serviceId,
                    responseTime: response.responseTime
                });
            }
            return requests.map((request, index) => ({
                success: response.success,
                messageId: request.messageId,
                result: response.data?.results?.[index],
                error: response.error,
                serviceId: response.serviceId,
                responseTime: response.responseTime
            }));
        }
        catch (error) {
            structuredLogger.error('Failed to process bulk emails through workers', {
                count: requests.length,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return requests.map(request => ({
                success: false,
                messageId: request.messageId,
                error: error instanceof Error ? error.message : 'Unknown error',
                serviceId: 'unknown',
                responseTime: 0
            }));
        }
    }
    async manageCronJob(request) {
        if (!this.isInitialized) {
            throw new Error('Workers Integration Service not initialized');
        }
        try {
            structuredLogger.info('Managing cron job through workers', {
                jobId: request.jobId,
                action: request.action,
                organizationId: request.organizationId
            });
            let endpoint = '/cron/jobs';
            let method = 'GET';
            if (request.action === 'enable') {
                endpoint = `/cron/jobs/${request.jobId}/enable`;
                method = 'POST';
            }
            else if (request.action === 'disable') {
                endpoint = `/cron/jobs/${request.jobId}/disable`;
                method = 'POST';
            }
            else if (request.action === 'status') {
                endpoint = `/cron/jobs/${request.jobId}`;
                method = 'GET';
            }
            const response = await this.workersClient.request({
                endpoint,
                method,
                headers: {
                    'X-Organization-ID': request.organizationId,
                    'X-Request-Source': 'api'
                }
            });
            if (response.success) {
                await webhookManager.emitEvent({
                    type: 'cron.managed',
                    data: {
                        jobId: request.jobId,
                        action: request.action,
                        organizationId: request.organizationId,
                        result: response.data
                    },
                    source: 'api',
                    version: '1.0.0'
                });
                structuredLogger.info('Cron job managed successfully', {
                    jobId: request.jobId,
                    action: request.action,
                    serviceId: response.serviceId,
                    responseTime: response.responseTime
                });
            }
            return {
                success: response.success,
                jobId: request.jobId,
                result: response.data,
                error: response.error,
                serviceId: response.serviceId,
                responseTime: response.responseTime
            };
        }
        catch (error) {
            structuredLogger.error('Failed to manage cron job through workers', {
                jobId: request.jobId,
                action: request.action,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                success: false,
                jobId: request.jobId,
                error: error instanceof Error ? error.message : 'Unknown error',
                serviceId: 'unknown',
                responseTime: 0
            };
        }
    }
    async getWorkersHealth() {
        if (!this.isInitialized) {
            return {
                healthy: false,
                services: [],
                stats: {}
            };
        }
        try {
            const response = await this.workersClient.request({
                endpoint: '/health',
                method: 'GET'
            });
            return {
                healthy: response.success,
                services: response.data ? [response.data] : [],
                stats: this.workersClient.getStats()
            };
        }
        catch (error) {
            structuredLogger.error('Failed to get workers health', {
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            return {
                healthy: false,
                services: [],
                stats: this.workersClient.getStats()
            };
        }
    }
    setupWebhookSubscriptions() {
        webhookManager.subscribe({
            url: 'http://localhost:3001/v1/webhooks/workers',
            events: ['workers.email_processed', 'workers.cron_executed', 'workers.error_occurred'],
            secret: process.env.WEBHOOK_SECRET || 'default-secret',
            active: true,
            retryPolicy: {
                maxRetries: 3,
                retryDelay: 1000,
                backoffMultiplier: 2
            },
            headers: {
                'X-Webhook-Source': 'workers'
            }
        });
        structuredLogger.info('Webhook subscriptions configured for workers integration');
    }
    startHeartbeat() {
        setInterval(() => {
            serviceDiscovery.updateHeartbeat('api-main');
        }, 10000);
    }
    getStats() {
        return {
            initialized: this.isInitialized,
            workersClient: this.workersClient.getStats(),
            webhookStats: webhookManager.getStats(),
            serviceDiscovery: serviceDiscovery.getStats()
        };
    }
}
export const workersIntegrationService = new WorkersIntegrationService();
//# sourceMappingURL=workers-integration.service.js.map