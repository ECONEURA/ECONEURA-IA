import { structuredLogger } from './structured-logger.js';
class DLQGroomingService {
    messages = new Map();
    patterns = new Map();
    retryJobs = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        this.startAutoGrooming();
        this.startRetryProcessor();
        structuredLogger.info('DLQ Grooming Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const message1 = {
            id: 'dlq_msg_1',
            organizationId: 'demo-org-1',
            queueName: 'email-processing',
            originalMessage: {
                id: 'msg_001',
                type: 'email_send',
                payload: {
                    to: 'user@example.com',
                    subject: 'Welcome Email',
                    template: 'welcome'
                },
                headers: {
                    'x-correlation-id': 'corr_001',
                    'x-priority': 'normal'
                },
                timestamp: oneDayAgo.toISOString(),
                retryCount: 3,
                maxRetries: 5
            },
            failureInfo: {
                errorType: 'SMTPConnectionError',
                errorMessage: 'Connection timeout to SMTP server',
                stackTrace: 'Error: Connection timeout\n    at SMTPClient.connect()\n    at EmailService.send()',
                failureTimestamp: oneDayAgo.toISOString(),
                retryAttempts: 3,
                lastRetryAt: oneDayAgo.toISOString()
            },
            analysis: {
                rootCause: 'Network connectivity issue with SMTP server',
                category: 'transient',
                severity: 'medium',
                suggestedAction: 'retry',
                confidence: 85,
                patterns: ['smtp_timeout', 'network_error'],
                similarFailures: 12
            },
            grooming: {
                status: 'analyzed',
                groomedBy: 'system',
                groomedAt: oneDayAgo.toISOString(),
                notes: 'Auto-analyzed as transient network error',
                autoRetryScheduled: new Date(now.getTime() + 30 * 60 * 1000).toISOString(),
                manualReviewRequired: false
            },
            metrics: {
                processingTime: 1500,
                memoryUsage: 45.2,
                cpuUsage: 12.8,
                networkLatency: 5000
            },
            createdAt: oneDayAgo.toISOString(),
            updatedAt: oneDayAgo.toISOString()
        };
        const message2 = {
            id: 'dlq_msg_2',
            organizationId: 'demo-org-1',
            queueName: 'data-processing',
            originalMessage: {
                id: 'msg_002',
                type: 'data_import',
                payload: {
                    fileId: 'file_123',
                    format: 'csv',
                    size: 1024000
                },
                headers: {
                    'x-correlation-id': 'corr_002',
                    'x-batch-id': 'batch_001'
                },
                timestamp: oneWeekAgo.toISOString(),
                retryCount: 5,
                maxRetries: 5
            },
            failureInfo: {
                errorType: 'ValidationError',
                errorMessage: 'Invalid CSV format: missing required columns',
                stackTrace: 'Error: Missing required columns\n    at CSVValidator.validate()\n    at DataProcessor.process()',
                failureTimestamp: oneWeekAgo.toISOString(),
                retryAttempts: 5,
                lastRetryAt: oneWeekAgo.toISOString()
            },
            analysis: {
                rootCause: 'Data format validation failure - permanent issue',
                category: 'data',
                severity: 'high',
                suggestedAction: 'manual_review',
                confidence: 95,
                patterns: ['validation_error', 'data_format'],
                similarFailures: 3
            },
            grooming: {
                status: 'escalated',
                groomedBy: 'system',
                groomedAt: oneWeekAgo.toISOString(),
                notes: 'Escalated to data team for manual review',
                manualReviewRequired: true
            },
            metrics: {
                processingTime: 3000,
                memoryUsage: 78.5,
                cpuUsage: 25.3
            },
            createdAt: oneWeekAgo.toISOString(),
            updatedAt: oneWeekAgo.toISOString()
        };
        this.messages.set(message1.id, message1);
        this.messages.set(message2.id, message2);
        const pattern1 = {
            id: 'pattern_1',
            organizationId: 'demo-org-1',
            name: 'SMTP Connection Errors',
            description: 'Auto-retry for transient SMTP connection issues',
            pattern: {
                errorType: 'SMTPConnectionError',
                conditions: [
                    { field: 'errorMessage', operator: 'contains', value: 'timeout' },
                    { field: 'queueName', operator: 'equals', value: 'email-processing' }
                ]
            },
            action: {
                type: 'auto_retry',
                config: {
                    maxRetries: 3,
                    retryDelay: 30000,
                    notificationChannels: ['email', 'slack']
                }
            },
            statistics: {
                matches: 45,
                successRate: 78,
                lastMatch: oneDayAgo.toISOString(),
                averageResolutionTime: 120000
            },
            enabled: true,
            createdAt: oneWeekAgo.toISOString(),
            updatedAt: oneDayAgo.toISOString()
        };
        const pattern2 = {
            id: 'pattern_2',
            organizationId: 'demo-org-1',
            name: 'Data Validation Errors',
            description: 'Escalate data validation errors for manual review',
            pattern: {
                errorType: 'ValidationError',
                conditions: [
                    { field: 'errorMessage', operator: 'contains', value: 'missing required' },
                    { field: 'queueName', operator: 'equals', value: 'data-processing' }
                ]
            },
            action: {
                type: 'escalate',
                config: {
                    escalationLevel: 2,
                    notificationChannels: ['email', 'pagerduty']
                }
            },
            statistics: {
                matches: 12,
                successRate: 25,
                lastMatch: oneWeekAgo.toISOString(),
                averageResolutionTime: 3600000
            },
            enabled: true,
            createdAt: oneWeekAgo.toISOString(),
            updatedAt: oneWeekAgo.toISOString()
        };
        this.patterns.set(pattern1.id, pattern1);
        this.patterns.set(pattern2.id, pattern2);
    }
    startAutoGrooming() {
        setInterval(() => {
            this.processPendingMessages();
        }, 5 * 60 * 1000);
    }
    startRetryProcessor() {
        setInterval(() => {
            this.processScheduledRetries();
        }, 60 * 1000);
    }
    async createDLQMessage(messageData) {
        const now = new Date().toISOString();
        const newMessage = {
            id: `dlq_msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...messageData,
            analysis: {
                category: messageData.analysis?.category || 'transient',
                severity: messageData.analysis?.severity || 'medium',
                suggestedAction: messageData.analysis?.suggestedAction || 'retry',
                confidence: messageData.analysis?.confidence || 50,
                patterns: messageData.analysis?.patterns || [],
                similarFailures: messageData.analysis?.similarFailures || 0,
                ...messageData.analysis
            },
            grooming: {
                status: 'pending',
                manualReviewRequired: false,
                ...messageData.grooming
            },
            createdAt: now,
            updatedAt: now
        };
        this.messages.set(newMessage.id, newMessage);
        if (!messageData.analysis) {
            await this.analyzeMessage(newMessage.id);
        }
        structuredLogger.info('DLQ message created', {
            messageId: newMessage.id,
            organizationId: newMessage.organizationId,
            queueName: newMessage.queueName,
            errorType: newMessage.failureInfo.errorType
        });
        return newMessage;
    }
    async getDLQMessages(organizationId, filters = {}) {
        let messages = Array.from(this.messages.values())
            .filter(m => m.organizationId === organizationId);
        if (filters.queueName) {
            messages = messages.filter(m => m.queueName === filters.queueName);
        }
        if (filters.status) {
            messages = messages.filter(m => m.grooming.status === filters.status);
        }
        if (filters.category) {
            messages = messages.filter(m => m.analysis.category === filters.category);
        }
        if (filters.severity) {
            messages = messages.filter(m => m.analysis.severity === filters.severity);
        }
        if (filters.startDate) {
            messages = messages.filter(m => m.createdAt >= filters.startDate);
        }
        if (filters.endDate) {
            messages = messages.filter(m => m.createdAt <= filters.endDate);
        }
        if (filters.limit) {
            messages = messages.slice(0, filters.limit);
        }
        return messages.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async createPattern(patternData) {
        const now = new Date().toISOString();
        const newPattern = {
            id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...patternData,
            statistics: {
                matches: patternData.statistics?.matches || 0,
                successRate: patternData.statistics?.successRate || 0,
                lastMatch: patternData.statistics?.lastMatch || '',
                averageResolutionTime: patternData.statistics?.averageResolutionTime || 0,
                ...patternData.statistics
            },
            enabled: patternData.enabled !== undefined ? patternData.enabled : true,
            createdAt: now,
            updatedAt: now
        };
        this.patterns.set(newPattern.id, newPattern);
        structuredLogger.info('DLQ pattern created', {
            patternId: newPattern.id,
            organizationId: newPattern.organizationId,
            name: newPattern.name,
            actionType: newPattern.action.type
        });
        return newPattern;
    }
    async getPatterns(organizationId, filters = {}) {
        let patterns = Array.from(this.patterns.values())
            .filter(p => p.organizationId === organizationId);
        if (filters.enabled !== undefined) {
            patterns = patterns.filter(p => p.enabled === filters.enabled);
        }
        if (filters.actionType) {
            patterns = patterns.filter(p => p.action.type === filters.actionType);
        }
        if (filters.limit) {
            patterns = patterns.slice(0, filters.limit);
        }
        return patterns.sort((a, b) => a.name.localeCompare(b.name));
    }
    async analyzeMessage(messageId) {
        const message = this.messages.get(messageId);
        if (!message) {
            throw new Error(`Message ${messageId} not found`);
        }
        const matchingPatterns = Array.from(this.patterns.values())
            .filter(p => p.organizationId === message.organizationId && p.enabled)
            .filter(p => this.matchesPattern(message, p));
        if (matchingPatterns.length > 0) {
            const bestPattern = matchingPatterns[0];
            message.analysis = {
                ...message.analysis,
                rootCause: this.determineRootCause(message, bestPattern),
                category: this.categorizeError(message, bestPattern),
                severity: this.assessSeverity(message, bestPattern),
                suggestedAction: bestPattern.action.type,
                confidence: 90,
                patterns: [bestPattern.name],
                similarFailures: bestPattern.statistics.matches
            };
            message.grooming = {
                ...message.grooming,
                status: 'analyzed',
                groomedBy: 'system',
                groomedAt: new Date().toISOString(),
                notes: `Auto-analyzed using pattern: ${bestPattern.name}`,
                manualReviewRequired: bestPattern.action.type === 'escalate' || bestPattern.action.type === 'manual_review'
            };
            await this.scheduleAction(message, bestPattern);
        }
        else {
            message.analysis = {
                ...message.analysis,
                rootCause: 'Unknown error pattern',
                category: 'system',
                severity: 'high',
                suggestedAction: 'manual_review',
                confidence: 30,
                patterns: ['unknown_pattern'],
                similarFailures: 0
            };
            message.grooming = {
                ...message.grooming,
                status: 'analyzed',
                groomedBy: 'system',
                groomedAt: new Date().toISOString(),
                notes: 'No matching pattern found - requires manual review',
                manualReviewRequired: true
            };
        }
        message.updatedAt = new Date().toISOString();
        this.messages.set(messageId, message);
        structuredLogger.info('DLQ message analyzed', {
            messageId,
            organizationId: message.organizationId,
            suggestedAction: message.analysis.suggestedAction,
            confidence: message.analysis.confidence
        });
        return message;
    }
    matchesPattern(message, pattern) {
        if (message.failureInfo.errorType !== pattern.pattern.errorType) {
            return false;
        }
        for (const condition of pattern.pattern.conditions) {
            let fieldValue;
            switch (condition.field) {
                case 'errorMessage':
                    fieldValue = message.failureInfo.errorMessage;
                    break;
                case 'queueName':
                    fieldValue = message.queueName;
                    break;
                case 'messageType':
                    fieldValue = message.originalMessage.type;
                    break;
                default:
                    continue;
            }
            if (!this.evaluateCondition(fieldValue, condition.operator, condition.value)) {
                return false;
            }
        }
        return true;
    }
    evaluateCondition(value, operator, expected) {
        switch (operator) {
            case 'equals':
                return value === expected;
            case 'contains':
                return value.includes(expected);
            case 'regex':
                return new RegExp(expected).test(value);
            case 'starts_with':
                return value.startsWith(expected);
            case 'ends_with':
                return value.endsWith(expected);
            default:
                return false;
        }
    }
    determineRootCause(message, pattern) {
        const errorType = message.failureInfo.errorType;
        const errorMessage = message.failureInfo.errorMessage;
        if (errorType === 'SMTPConnectionError') {
            return 'Network connectivity issue with SMTP server';
        }
        else if (errorType === 'ValidationError') {
            return 'Data format validation failure';
        }
        else if (errorMessage.includes('timeout')) {
            return 'Request timeout - possible service overload';
        }
        else if (errorMessage.includes('permission')) {
            return 'Insufficient permissions for operation';
        }
        else {
            return 'Unknown root cause - requires investigation';
        }
    }
    categorizeError(message, pattern) {
        const errorType = message.failureInfo.errorType;
        const errorMessage = message.failureInfo.errorMessage;
        if (errorType.includes('Connection') || errorType.includes('Timeout')) {
            return 'transient';
        }
        else if (errorType.includes('Validation') || errorMessage.includes('format')) {
            return 'data';
        }
        else if (errorType.includes('Permission') || errorType.includes('Auth')) {
            return 'configuration';
        }
        else if (errorType.includes('System') || errorType.includes('Internal')) {
            return 'system';
        }
        else {
            return 'permanent';
        }
    }
    assessSeverity(message, pattern) {
        const errorType = message.failureInfo.errorType;
        const retryCount = message.originalMessage.retryCount;
        const maxRetries = message.originalMessage.maxRetries;
        if (retryCount >= maxRetries) {
            return 'critical';
        }
        else if (errorType.includes('Connection') || errorType.includes('Timeout')) {
            return 'medium';
        }
        else if (errorType.includes('Validation') || errorType.includes('Data')) {
            return 'high';
        }
        else {
            return 'low';
        }
    }
    async scheduleAction(message, pattern) {
        const now = new Date();
        switch (pattern.action.type) {
            case 'auto_retry': {
                const retryDelay = pattern.action.config.retryDelay || 30000;
                const scheduledAt = new Date(now.getTime() + retryDelay);
                const retryJob = {
                    id: `retry_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                    organizationId: message.organizationId,
                    messageId: message.id,
                    queueName: message.queueName,
                    retryConfig: {
                        maxRetries: pattern.action.config.maxRetries || 3,
                        currentAttempt: 0,
                        delayMs: retryDelay,
                        backoffMultiplier: 2,
                        maxDelayMs: 300000
                    },
                    status: 'scheduled',
                    scheduledAt: scheduledAt.toISOString(),
                    createdAt: now.toISOString(),
                    updatedAt: now.toISOString()
                };
                this.retryJobs.set(retryJob.id, retryJob);
                message.grooming.autoRetryScheduled = scheduledAt.toISOString();
                break;
            }
            case 'skip':
                message.grooming.status = 'skipped';
                message.grooming.notes = `Skipped based on pattern: ${pattern.name}`;
                break;
            case 'escalate':
                message.grooming.status = 'escalated';
                message.grooming.notes = `Escalated based on pattern: ${pattern.name}`;
                break;
            case 'manual_review':
                message.grooming.status = 'analyzed';
                message.grooming.manualReviewRequired = true;
                message.grooming.notes = `Manual review required based on pattern: ${pattern.name}`;
                break;
        }
        this.messages.set(message.id, message);
    }
    async processScheduledRetries() {
        const now = new Date();
        const scheduledRetries = Array.from(this.retryJobs.values())
            .filter(job => job.status === 'scheduled' && new Date(job.scheduledAt) <= now);
        for (const retryJob of scheduledRetries) {
            await this.executeRetry(retryJob);
        }
    }
    async executeRetry(retryJob) {
        const message = this.messages.get(retryJob.messageId);
        if (!message) {
            retryJob.status = 'failed';
            retryJob.result = {
                success: false,
                error: 'Original message not found',
                processingTime: 0
            };
            this.retryJobs.set(retryJob.id, retryJob);
            return;
        }
        retryJob.status = 'running';
        retryJob.startedAt = new Date().toISOString();
        this.retryJobs.set(retryJob.id, retryJob);
        const startTime = Date.now();
        try {
            await this.simulateRetryProcessing(message);
            const processingTime = Date.now() - startTime;
            retryJob.status = 'completed';
            retryJob.completedAt = new Date().toISOString();
            retryJob.result = {
                success: true,
                processingTime
            };
            message.grooming.status = 'retried';
            message.grooming.notes = `Successfully retried (attempt ${retryJob.retryConfig.currentAttempt + 1})`;
            this.messages.set(message.id, message);
            structuredLogger.info('DLQ retry completed successfully', {
                retryJobId: retryJob.id,
                messageId: message.id,
                processingTime
            });
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            retryJob.retryConfig.currentAttempt++;
            if (retryJob.retryConfig.currentAttempt >= retryJob.retryConfig.maxRetries) {
                retryJob.status = 'failed';
                retryJob.completedAt = new Date().toISOString();
                retryJob.result = {
                    success: false,
                    error: error.message,
                    processingTime
                };
                message.grooming.status = 'escalated';
                message.grooming.notes = `Retry failed after ${retryJob.retryConfig.maxRetries} attempts`;
                this.messages.set(message.id, message);
                structuredLogger.error('DLQ retry failed permanently', {
                    retryJobId: retryJob.id,
                    messageId: message.id,
                    error: error.message
                });
            }
            else {
                const nextDelay = Math.min(retryJob.retryConfig.delayMs * Math.pow(retryJob.retryConfig.backoffMultiplier, retryJob.retryConfig.currentAttempt), retryJob.retryConfig.maxDelayMs);
                retryJob.status = 'scheduled';
                retryJob.scheduledAt = new Date(Date.now() + nextDelay).toISOString();
                structuredLogger.info('DLQ retry scheduled for next attempt', {
                    retryJobId: retryJob.id,
                    messageId: message.id,
                    attempt: retryJob.retryConfig.currentAttempt + 1,
                    nextDelay
                });
            }
        }
        retryJob.updatedAt = new Date().toISOString();
        this.retryJobs.set(retryJob.id, retryJob);
    }
    async simulateRetryProcessing(message) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (message.failureInfo.errorType === 'SMTPConnectionError') {
            if (Math.random() < 0.8) {
                return;
            }
            else {
                throw new Error('SMTP connection still failing');
            }
        }
        else if (message.failureInfo.errorType === 'ValidationError') {
            throw new Error('Validation error persists');
        }
        else {
            if (Math.random() < 0.5) {
                return;
            }
            else {
                throw new Error('Retry failed');
            }
        }
    }
    async groomMessage(messageId, action) {
        const message = this.messages.get(messageId);
        if (!message) {
            throw new Error(`Message ${messageId} not found`);
        }
        message.grooming = {
            ...message.grooming,
            status: action.status,
            groomedBy: action.groomedBy,
            groomedAt: new Date().toISOString(),
            notes: action.notes,
            manualReviewRequired: false
        };
        message.updatedAt = new Date().toISOString();
        this.messages.set(messageId, message);
        structuredLogger.info('DLQ message manually groomed', {
            messageId,
            organizationId: message.organizationId,
            action: action.status,
            groomedBy: action.groomedBy
        });
        return message;
    }
    async processPendingMessages() {
        const pendingMessages = Array.from(this.messages.values())
            .filter(m => m.grooming.status === 'pending');
        for (const message of pendingMessages) {
            await this.analyzeMessage(message.id);
        }
    }
    async generateReport(organizationId, reportType, startDate, endDate, generatedBy) {
        const messages = Array.from(this.messages.values())
            .filter(m => m.organizationId === organizationId &&
            m.createdAt >= startDate &&
            m.createdAt <= endDate);
        const byCategory = messages.reduce((acc, m) => {
            acc[m.analysis.category] = (acc[m.analysis.category] || 0) + 1;
            return acc;
        }, {});
        const bySeverity = messages.reduce((acc, m) => {
            acc[m.analysis.severity] = (acc[m.analysis.severity] || 0) + 1;
            return acc;
        }, {});
        const byQueue = messages.reduce((acc, m) => {
            acc[m.queueName] = (acc[m.queueName] || 0) + 1;
            return acc;
        }, {});
        const errorCounts = messages.reduce((acc, m) => {
            acc[m.failureInfo.errorType] = (acc[m.failureInfo.errorType] || 0) + 1;
            return acc;
        }, {});
        const topErrors = Object.entries(errorCounts)
            .map(([errorType, count]) => ({
            errorType,
            count,
            percentage: (count / messages.length) * 100
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const resolutionStats = {
            autoResolved: messages.filter(m => m.grooming.status === 'retried').length,
            manuallyResolved: messages.filter(m => m.grooming.status === 'resolved').length,
            escalated: messages.filter(m => m.grooming.status === 'escalated').length,
            skipped: messages.filter(m => m.grooming.status === 'skipped').length
        };
        const performanceMetrics = {
            averageProcessingTime: messages.length > 0 ? messages.reduce((sum, m) => sum + (m.metrics.processingTime || 0), 0) / messages.length : 0,
            averageResolutionTime: this.calculateAverageResolutionTime(messages),
            successRate: this.calculateSuccessRate(messages)
        };
        const patterns = Array.from(this.patterns.values())
            .filter(p => p.organizationId === organizationId)
            .map(p => ({
            patternId: p.id,
            patternName: p.name,
            matches: p.statistics.matches,
            successRate: p.statistics.successRate
        }));
        const report = {
            id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            organizationId,
            reportType: reportType,
            period: { startDate, endDate },
            data: {
                totalMessages: messages.length,
                byCategory,
                bySeverity,
                byQueue,
                topErrors,
                resolutionStats,
                performanceMetrics,
                patterns
            },
            generatedBy,
            createdAt: new Date().toISOString()
        };
        structuredLogger.info('DLQ report generated', {
            reportId: report.id,
            organizationId,
            reportType,
            period: `${startDate} to ${endDate}`
        });
        return report;
    }
    calculateAverageResolutionTime(messages) {
        const resolvedMessages = messages.filter(m => m.grooming.status === 'retried' || m.grooming.status === 'resolved');
        if (resolvedMessages.length === 0)
            return 0;
        const totalTime = resolvedMessages.reduce((sum, m) => {
            const created = new Date(m.createdAt);
            const resolved = new Date(m.grooming.groomedAt || m.updatedAt);
            return sum + (resolved.getTime() - created.getTime());
        }, 0);
        return totalTime / resolvedMessages.length;
    }
    calculateSuccessRate(messages) {
        if (messages.length === 0)
            return 0;
        const successful = messages.filter(m => m.grooming.status === 'retried' || m.grooming.status === 'resolved').length;
        return (successful / messages.length) * 100;
    }
    async getStats(organizationId) {
        const messages = Array.from(this.messages.values()).filter(m => m.organizationId === organizationId);
        const patterns = Array.from(this.patterns.values()).filter(p => p.organizationId === organizationId);
        const retryJobs = Array.from(this.retryJobs.values()).filter(j => j.organizationId === organizationId);
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentMessages = messages.filter(m => new Date(m.createdAt) >= last24Hours);
        const recentRetries = retryJobs.filter(r => new Date(r.createdAt) >= last24Hours);
        return {
            totalMessages: messages.length,
            totalPatterns: patterns.length,
            totalRetryJobs: retryJobs.length,
            last24Hours: {
                newMessages: recentMessages.length,
                retryJobs: recentRetries.length,
                autoResolved: recentMessages.filter(m => m.grooming.status === 'retried').length,
                manuallyResolved: recentMessages.filter(m => m.grooming.status === 'resolved').length,
                escalated: recentMessages.filter(m => m.grooming.status === 'escalated').length
            },
            last7Days: {
                newMessages: messages.filter(m => new Date(m.createdAt) >= last7Days).length,
                retryJobs: retryJobs.filter(r => new Date(r.createdAt) >= last7Days).length
            },
            byStatus: messages.reduce((acc, m) => {
                acc[m.grooming.status] = (acc[m.grooming.status] || 0) + 1;
                return acc;
            }, {}),
            byCategory: messages.reduce((acc, m) => {
                acc[m.analysis.category] = (acc[m.analysis.category] || 0) + 1;
                return acc;
            }, {}),
            bySeverity: messages.reduce((acc, m) => {
                acc[m.analysis.severity] = (acc[m.analysis.severity] || 0) + 1;
                return acc;
            }, {}),
            byQueue: messages.reduce((acc, m) => {
                acc[m.queueName] = (acc[m.queueName] || 0) + 1;
                return acc;
            }, {}),
            retryJobStats: {
                scheduled: retryJobs.filter(r => r.status === 'scheduled').length,
                running: retryJobs.filter(r => r.status === 'running').length,
                completed: retryJobs.filter(r => r.status === 'completed').length,
                failed: retryJobs.filter(r => r.status === 'failed').length
            }
        };
    }
}
export const dlgGroomingService = new DLQGroomingService();
//# sourceMappingURL=dlg-grooming.service.js.map