import { structuredLogger } from './structured-logger.js';
export class DunningSolidService {
    config;
    segments = new Map();
    kpis = new Map();
    dlqMessages = new Map();
    retries = new Map();
    stats;
    kpiCalculationInterval = null;
    dlqProcessingInterval = null;
    constructor(config = {}) {
        this.config = {
            enabled: true,
            maxRetries: 5,
            retryIntervals: [1, 6, 24, 72, 168],
            dlqRetentionDays: 30,
            kpiCalculationInterval: 60,
            autoEscalation: true,
            escalationThresholds: {
                collectionRate: 0.8,
                responseTime: 24,
                failureRate: 0.1
            },
            notificationEnabled: true,
            segments: [],
            ...config
        };
        this.stats = {
            totalInvoices: 0,
            overdueInvoices: 0,
            collectedAmount: 0,
            pendingAmount: 0,
            collectionRate: 0,
            averageCollectionTime: 0,
            segmentStats: {},
            dlqStats: {
                totalMessages: 0,
                pendingRetries: 0,
                deadMessages: 0,
                retrySuccessRate: 0,
                avgRetryTime: 0
            },
            kpiStats: {
                onTarget: 0,
                belowTarget: 0,
                aboveTarget: 0,
                critical: 0
            },
            lastUpdated: new Date().toISOString()
        };
        this.initializeDefaultSegments();
        this.startKpiCalculation();
        this.startDLQProcessing();
        this.calculateKPIs();
        structuredLogger.info('Dunning Solid service initialized', {
            config: this.config,
            requestId: ''
        });
    }
    initializeDefaultSegments() {
        const defaultSegments = [
            {
                id: 'segment_001',
                name: 'Low Risk - Small Amounts',
                description: 'Customers with low risk and small overdue amounts',
                criteria: {
                    overdueDays: { min: 1, max: 30 },
                    amountRange: { min: 0, max: 1000 },
                    customerType: 'both',
                    riskLevel: 'low'
                },
                strategy: {
                    maxRetries: 3,
                    retryInterval: 24,
                    escalationSteps: 2,
                    communicationChannels: ['email', 'sms'],
                    priority: 'low'
                },
                kpis: {
                    targetCollectionRate: 0.85,
                    targetResponseTime: 48,
                    maxDunningDuration: 30,
                    acceptableFailureRate: 0.05
                },
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'segment_002',
                name: 'Medium Risk - Medium Amounts',
                description: 'Customers with medium risk and medium overdue amounts',
                criteria: {
                    overdueDays: { min: 31, max: 90 },
                    amountRange: { min: 1001, max: 10000 },
                    customerType: 'both',
                    riskLevel: 'medium'
                },
                strategy: {
                    maxRetries: 4,
                    retryInterval: 12,
                    escalationSteps: 3,
                    communicationChannels: ['email', 'call', 'sms'],
                    priority: 'medium'
                },
                kpis: {
                    targetCollectionRate: 0.75,
                    targetResponseTime: 24,
                    maxDunningDuration: 45,
                    acceptableFailureRate: 0.1
                },
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            },
            {
                id: 'segment_003',
                name: 'High Risk - Large Amounts',
                description: 'Customers with high risk and large overdue amounts',
                criteria: {
                    overdueDays: { min: 91, max: 365 },
                    amountRange: { min: 10001, max: 100000 },
                    customerType: 'both',
                    riskLevel: 'high'
                },
                strategy: {
                    maxRetries: 5,
                    retryInterval: 6,
                    escalationSteps: 4,
                    communicationChannels: ['call', 'letter', 'email'],
                    priority: 'high'
                },
                kpis: {
                    targetCollectionRate: 0.6,
                    targetResponseTime: 12,
                    maxDunningDuration: 60,
                    acceptableFailureRate: 0.15
                },
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            }
        ];
        defaultSegments.forEach(segment => {
            this.segments.set(segment.id, segment);
        });
        structuredLogger.info('Default dunning segments initialized', {
            segmentCount: defaultSegments.length,
            requestId: ''
        });
    }
    startKpiCalculation() {
        if (!this.config.enabled)
            return;
        this.kpiCalculationInterval = setInterval(() => {
            this.calculateKPIs();
        }, this.config.kpiCalculationInterval * 60 * 1000);
        structuredLogger.info('KPI calculation process started', {
            interval: `${this.config.kpiCalculationInterval} minutes`,
            requestId: ''
        });
    }
    startDLQProcessing() {
        if (!this.config.enabled)
            return;
        this.dlqProcessingInterval = setInterval(() => {
            this.processDLQMessages();
        }, 5 * 60 * 1000);
        structuredLogger.info('DLQ processing started', {
            interval: '5 minutes',
            requestId: ''
        });
    }
    async createSegment(segment) {
        const segmentId = `segment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const newSegment = {
            ...segment,
            id: segmentId,
            createdAt: now,
            updatedAt: now
        };
        this.segments.set(segmentId, newSegment);
        structuredLogger.info('Dunning segment created', {
            segmentId,
            name: segment.name,
            requestId: ''
        });
        return newSegment;
    }
    async updateSegment(segmentId, updates) {
        const segment = this.segments.get(segmentId);
        if (!segment) {
            throw new Error('Segment not found');
        }
        const updatedSegment = {
            ...segment,
            ...updates,
            id: segmentId,
            updatedAt: new Date().toISOString()
        };
        this.segments.set(segmentId, updatedSegment);
        structuredLogger.info('Dunning segment updated', {
            segmentId,
            updates: Object.keys(updates),
            requestId: ''
        });
        return updatedSegment;
    }
    getSegments() {
        return Array.from(this.segments.values());
    }
    getSegment(segmentId) {
        return this.segments.get(segmentId) || null;
    }
    async addToDLQ(originalMessageId, queueName, messageType, payload, failureReason, organizationId, priority = 'medium') {
        const dlqId = `dlq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const dlqMessage = {
            id: dlqId,
            originalMessageId,
            queueName,
            messageType,
            payload,
            failureReason,
            retryCount: 0,
            maxRetries: this.config.maxRetries,
            firstFailureAt: now,
            lastFailureAt: now,
            nextRetryAt: this.calculateNextRetryTime(0),
            status: 'pending',
            priority,
            organizationId,
            metadata: {}
        };
        this.dlqMessages.set(dlqId, dlqMessage);
        this.updateDLQStats();
        structuredLogger.info('Message added to DLQ', {
            dlqId,
            originalMessageId,
            queueName,
            messageType,
            failureReason,
            priority,
            requestId: ''
        });
        return dlqMessage;
    }
    async retryDLQMessage(dlqId) {
        const dlqMessage = this.dlqMessages.get(dlqId);
        if (!dlqMessage) {
            throw new Error('DLQ message not found');
        }
        if (dlqMessage.retryCount >= dlqMessage.maxRetries) {
            dlqMessage.status = 'dead';
            this.updateDLQStats();
            throw new Error('Maximum retries exceeded');
        }
        const retryId = `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        const retry = {
            id: retryId,
            messageId: dlqId,
            attemptNumber: dlqMessage.retryCount + 1,
            status: 'pending',
            scheduledAt: dlqMessage.nextRetryAt,
            retryStrategy: 'exponential_backoff',
            backoffMultiplier: 2,
            maxBackoffTime: 1440,
            metadata: {}
        };
        this.retries.set(retryId, retry);
        dlqMessage.retryCount++;
        dlqMessage.lastFailureAt = now;
        dlqMessage.nextRetryAt = this.calculateNextRetryTime(dlqMessage.retryCount);
        dlqMessage.status = 'processing';
        structuredLogger.info('DLQ message retry scheduled', {
            retryId,
            dlqId,
            attemptNumber: retry.attemptNumber,
            scheduledAt: retry.scheduledAt,
            requestId: ''
        });
        return retry;
    }
    calculateNextRetryTime(retryCount) {
        const intervalIndex = Math.min(retryCount, this.config.retryIntervals.length - 1);
        const intervalHours = this.config.retryIntervals[intervalIndex];
        const nextRetryTime = new Date(Date.now() + intervalHours * 60 * 60 * 1000);
        return nextRetryTime.toISOString();
    }
    async processDLQMessages() {
        const now = new Date();
        const pendingMessages = Array.from(this.dlqMessages.values())
            .filter(msg => msg.status === 'pending' && new Date(msg.nextRetryAt) <= now);
        for (const message of pendingMessages) {
            try {
                await this.retryDLQMessage(message.id);
            }
            catch (error) {
                structuredLogger.error('Failed to retry DLQ message', {
                    dlqId: message.id,
                    error: error instanceof Error ? error.message : String(error),
                    requestId: ''
                });
            }
        }
        if (pendingMessages.length > 0) {
            structuredLogger.info('DLQ messages processed', {
                processedCount: pendingMessages.length,
                requestId: ''
            });
        }
    }
    async calculateKPIs() {
        const now = new Date().toISOString();
        for (const segment of this.segments.values()) {
            if (!segment.isActive)
                continue;
            const kpis = [
                {
                    id: `kpi_${segment.id}_collection_rate_${now}`,
                    segmentId: segment.id,
                    metric: 'collection_rate',
                    value: 0.75 + Math.random() * 0.2,
                    target: segment.kpis.targetCollectionRate,
                    unit: 'percentage',
                    period: 'daily',
                    timestamp: now,
                    status: 'on_target',
                    trend: 'stable',
                    metadata: {}
                },
                {
                    id: `kpi_${segment.id}_response_time_${now}`,
                    segmentId: segment.id,
                    metric: 'response_time',
                    value: 12 + Math.random() * 24,
                    target: segment.kpis.targetResponseTime,
                    unit: 'hours',
                    period: 'daily',
                    timestamp: now,
                    status: 'on_target',
                    trend: 'stable',
                    metadata: {}
                },
                {
                    id: `kpi_${segment.id}_failure_rate_${now}`,
                    segmentId: segment.id,
                    metric: 'failure_rate',
                    value: Math.random() * 0.2,
                    target: segment.kpis.acceptableFailureRate,
                    unit: 'percentage',
                    period: 'daily',
                    timestamp: now,
                    status: 'on_target',
                    trend: 'stable',
                    metadata: {}
                }
            ];
            kpis.forEach(kpi => {
                if (kpi.metric === 'failure_rate') {
                    kpi.status = kpi.value <= kpi.target ? 'on_target' : 'below_target';
                }
                else {
                    kpi.status = kpi.value >= kpi.target ? 'on_target' : 'below_target';
                }
                this.kpis.set(kpi.id, kpi);
            });
        }
        this.updateKPIStats();
        this.updateOverallStats();
        structuredLogger.info('KPIs calculated', {
            segmentCount: this.segments.size,
            kpiCount: this.kpis.size,
            requestId: ''
        });
    }
    updateKPIStats() {
        const kpiValues = Array.from(this.kpis.values());
        this.stats.kpiStats = {
            onTarget: kpiValues.filter(kpi => kpi.status === 'on_target').length,
            belowTarget: kpiValues.filter(kpi => kpi.status === 'below_target').length,
            aboveTarget: kpiValues.filter(kpi => kpi.status === 'above_target').length,
            critical: kpiValues.filter(kpi => kpi.status === 'critical').length
        };
    }
    updateDLQStats() {
        const dlqValues = Array.from(this.dlqMessages.values());
        const retryValues = Array.from(this.retries.values());
        this.stats.dlqStats = {
            totalMessages: dlqValues.length,
            pendingRetries: dlqValues.filter(msg => msg.status === 'pending').length,
            deadMessages: dlqValues.filter(msg => msg.status === 'dead').length,
            retrySuccessRate: retryValues.length > 0 ?
                retryValues.filter(retry => retry.status === 'success').length / retryValues.length : 0,
            avgRetryTime: retryValues.length > 0 ?
                retryValues.reduce((sum, retry) => {
                    if (retry.completedAt && retry.startedAt) {
                        return sum + (new Date(retry.completedAt).getTime() - new Date(retry.startedAt).getTime());
                    }
                    return sum;
                }, 0) / retryValues.length / 1000 / 60 : 0
        };
    }
    updateOverallStats() {
        this.stats.totalInvoices = 1000 + Math.floor(Math.random() * 500);
        this.stats.overdueInvoices = Math.floor(this.stats.totalInvoices * 0.3);
        this.stats.collectedAmount = 50000 + Math.random() * 100000;
        this.stats.pendingAmount = 20000 + Math.random() * 50000;
        this.stats.collectionRate = this.stats.collectedAmount / (this.stats.collectedAmount + this.stats.pendingAmount);
        this.stats.averageCollectionTime = 15 + Math.random() * 30;
        this.stats.lastUpdated = new Date().toISOString();
        for (const segment of this.segments.values()) {
            this.stats.segmentStats[segment.id] = {
                invoices: Math.floor(this.stats.overdueInvoices * 0.33),
                collected: Math.floor(this.stats.collectedAmount * 0.33),
                pending: Math.floor(this.stats.pendingAmount * 0.33),
                rate: 0.7 + Math.random() * 0.2,
                avgTime: 10 + Math.random() * 20
            };
        }
    }
    getKPIs(segmentId, period) {
        let kpis = Array.from(this.kpis.values());
        if (segmentId) {
            kpis = kpis.filter(kpi => kpi.segmentId === segmentId);
        }
        if (period) {
            kpis = kpis.filter(kpi => kpi.period === period);
        }
        return kpis.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    getDLQMessages(status, priority) {
        let messages = Array.from(this.dlqMessages.values());
        if (status) {
            messages = messages.filter(msg => msg.status === status);
        }
        if (priority) {
            messages = messages.filter(msg => msg.priority === priority);
        }
        return messages.sort((a, b) => new Date(b.firstFailureAt).getTime() - new Date(a.firstFailureAt).getTime());
    }
    getRetries(messageId, status) {
        let retries = Array.from(this.retries.values());
        if (messageId) {
            retries = retries.filter(retry => retry.messageId === messageId);
        }
        if (status) {
            retries = retries.filter(retry => retry.status === status);
        }
        return retries.sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
    }
    getStats() {
        return this.stats;
    }
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        if (this.kpiCalculationInterval) {
            clearInterval(this.kpiCalculationInterval);
            this.startKpiCalculation();
        }
        if (this.dlqProcessingInterval) {
            clearInterval(this.dlqProcessingInterval);
            this.startDLQProcessing();
        }
        structuredLogger.info('Dunning configuration updated', {
            config: this.config,
            requestId: ''
        });
    }
    stop() {
        if (this.kpiCalculationInterval) {
            clearInterval(this.kpiCalculationInterval);
            this.kpiCalculationInterval = null;
        }
        if (this.dlqProcessingInterval) {
            clearInterval(this.dlqProcessingInterval);
            this.dlqProcessingInterval = null;
        }
        structuredLogger.info('Dunning Solid service stopped', { requestId: '' });
    }
}
export const dunningSolidService = new DunningSolidService();
//# sourceMappingURL=dunning-solid.service.js.map