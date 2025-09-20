import { structuredLogger } from './structured-logger.js';
class AdvancedErrorManagementService {
    errors = new Map();
    patterns = new Map();
    metrics = new Map();
    alerts = new Map();
    constructor() {
        this.init();
    }
    init() {
        this.createDemoData();
        this.generateTagsForDemoErrors();
        this.startErrorProcessing();
        this.startPerformanceMonitoring();
        this.startAlertProcessing();
        structuredLogger.info('Advanced Error Management Service initialized');
    }
    createDemoData() {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const error1 = {
            id: 'error_1',
            organizationId: 'demo-org-1',
            service: 'api-gateway',
            environment: 'production',
            errorType: 'DatabaseConnectionError',
            errorMessage: 'Connection timeout to primary database',
            stackTrace: 'Error: Connection timeout\n    at DatabaseClient.connect()\n    at APIGateway.authenticate()',
            context: {
                userId: 'user_123',
                sessionId: 'session_456',
                requestId: 'req_789',
                endpoint: '/api/v1/users',
                method: 'GET',
                userAgent: 'Mozilla/5.0...',
                ipAddress: '192.168.1.100',
                timestamp: oneHourAgo.toISOString()
            },
            severity: 'high',
            category: 'database',
            impact: {
                affectedUsers: 150,
                businessImpact: 'high',
                revenueImpact: 2500,
                slaImpact: true
            },
            performance: {
                responseTime: 5000,
                memoryUsage: 85.5,
                cpuUsage: 92.3,
                databaseQueries: 0,
                cacheHitRate: 0
            },
            resolution: {
                status: 'investigating',
                assignedTo: 'dev-team',
                priority: 'high',
                estimatedResolution: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString()
            },
            metadata: {
                tags: ['database', 'timeout', 'production'],
                customFields: {
                    databaseHost: 'db-primary-01',
                    connectionPool: 'exhausted'
                },
                relatedErrors: [],
                escalationLevel: 1
            },
            createdAt: oneHourAgo.toISOString(),
            updatedAt: oneHourAgo.toISOString()
        };
        const error2 = {
            id: 'error_2',
            organizationId: 'demo-org-1',
            service: 'user-service',
            environment: 'production',
            errorType: 'ValidationError',
            errorMessage: 'Invalid email format provided',
            context: {
                userId: 'user_456',
                requestId: 'req_101',
                endpoint: '/api/v1/users/register',
                method: 'POST',
                timestamp: oneDayAgo.toISOString()
            },
            severity: 'medium',
            category: 'validation',
            impact: {
                affectedUsers: 1,
                businessImpact: 'low',
                revenueImpact: 0
            },
            performance: {
                responseTime: 150,
                memoryUsage: 45.2,
                cpuUsage: 12.8,
                databaseQueries: 1,
                cacheHitRate: 95.5
            },
            resolution: {
                status: 'resolved',
                assignedTo: 'support-team',
                priority: 'medium',
                actualResolution: new Date(oneDayAgo.getTime() + 30 * 60 * 1000).toISOString(),
                resolutionNotes: 'Fixed email validation regex pattern'
            },
            metadata: {
                tags: ['validation', 'email', 'user-registration'],
                customFields: {
                    emailProvided: 'invalid-email@',
                    validationRule: 'email_format'
                },
                relatedErrors: [],
                escalationLevel: 0
            },
            createdAt: oneDayAgo.toISOString(),
            updatedAt: new Date(oneDayAgo.getTime() + 30 * 60 * 1000).toISOString()
        };
        this.errors.set(error1.id, error1);
        this.errors.set(error2.id, error2);
        const pattern1 = {
            id: 'pattern_1',
            organizationId: 'demo-org-1',
            name: 'Database Connection Errors',
            description: 'Auto-escalate database connection issues',
            pattern: {
                errorType: 'DatabaseConnectionError',
                category: 'database',
                conditions: [
                    { field: 'severity', operator: 'equals', value: 'high' },
                    { field: 'impact.businessImpact', operator: 'equals', value: 'high' }
                ]
            },
            action: {
                type: 'escalate',
                config: {
                    escalationLevel: 2,
                    alertChannels: ['slack', 'pagerduty'],
                    notificationTemplate: 'database_critical'
                }
            },
            statistics: {
                matches: 12,
                falsePositives: 1,
                accuracy: 92,
                lastMatch: oneHourAgo.toISOString(),
                averageResolutionTime: 1800000
            },
            enabled: true,
            createdAt: oneDayAgo.toISOString(),
            updatedAt: oneHourAgo.toISOString()
        };
        this.patterns.set(pattern1.id, pattern1);
        const metric1 = {
            id: 'metric_1',
            organizationId: 'demo-org-1',
            service: 'api-gateway',
            metricType: 'response_time',
            value: 250,
            unit: 'ms',
            timestamp: now.toISOString(),
            dimensions: {
                endpoint: '/api/v1/users',
                method: 'GET',
                statusCode: 200,
                environment: 'production'
            },
            thresholds: {
                warning: 500,
                critical: 1000
            },
            status: 'normal',
            createdAt: now.toISOString()
        };
        this.metrics.set(metric1.id, metric1);
        const alert1 = {
            id: 'alert_1',
            organizationId: 'demo-org-1',
            type: 'error',
            severity: 'high',
            title: 'Database Connection Timeout',
            description: 'Multiple database connection timeouts detected',
            source: {
                service: 'api-gateway',
                component: 'database-connection-pool'
            },
            condition: {
                metric: 'database_connection_errors',
                threshold: 5,
                operator: 'greater_than',
                duration: 300
            },
            status: 'active',
            escalationLevel: 1,
            notifications: {
                channels: ['slack', 'email'],
                sent: true,
                sentAt: oneHourAgo.toISOString(),
                acknowledged: false
            },
            metadata: {
                tags: ['database', 'critical', 'production'],
                customFields: {
                    affectedServices: ['api-gateway', 'user-service'],
                    estimatedImpact: 'high'
                },
                relatedAlerts: []
            },
            createdAt: oneHourAgo.toISOString(),
            updatedAt: oneHourAgo.toISOString()
        };
        this.alerts.set(alert1.id, alert1);
    }
    generateTagsForDemoErrors() {
        for (const error of this.errors.values()) {
            error.metadata.tags = this.generateTags(error);
        }
    }
    startErrorProcessing() {
        setInterval(() => {
            this.processNewErrors();
        }, 30 * 1000);
    }
    startPerformanceMonitoring() {
        setInterval(() => {
            this.collectPerformanceMetrics();
        }, 60 * 1000);
    }
    startAlertProcessing() {
        setInterval(() => {
            this.processAlerts();
        }, 15 * 1000);
    }
    async createError(errorData) {
        const now = new Date().toISOString();
        const newError = {
            id: `error_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...errorData,
            metadata: {
                tags: [],
                customFields: {},
                ...errorData.metadata
            },
            createdAt: now,
            updatedAt: now
        };
        this.errors.set(newError.id, newError);
        await this.analyzeError(newError.id);
        structuredLogger.info('Error event created', {
            errorId: newError.id,
            organizationId: newError.organizationId,
            service: newError.service,
            errorType: newError.errorType,
            severity: newError.severity
        });
        return newError;
    }
    async getErrors(organizationId, filters = {}) {
        let errors = Array.from(this.errors.values())
            .filter(e => e.organizationId === organizationId);
        if (filters.service) {
            errors = errors.filter(e => e.service === filters.service);
        }
        if (filters.severity) {
            errors = errors.filter(e => e.severity === filters.severity);
        }
        if (filters.category) {
            errors = errors.filter(e => e.category === filters.category);
        }
        if (filters.status) {
            errors = errors.filter(e => e.resolution.status === filters.status);
        }
        if (filters.startDate) {
            errors = errors.filter(e => e.createdAt >= filters.startDate);
        }
        if (filters.endDate) {
            errors = errors.filter(e => e.createdAt <= filters.endDate);
        }
        if (filters.limit) {
            errors = errors.slice(0, filters.limit);
        }
        return errors.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async createPattern(patternData) {
        const now = new Date().toISOString();
        const newPattern = {
            id: `pattern_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...patternData,
            enabled: patternData.enabled !== undefined ? patternData.enabled : true,
            statistics: {
                matches: 0,
                falsePositives: 0,
                accuracy: 0,
                lastMatch: '',
                averageResolutionTime: 0,
                ...patternData.statistics
            },
            createdAt: now,
            updatedAt: now
        };
        this.patterns.set(newPattern.id, newPattern);
        structuredLogger.info('Error pattern created', {
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
    async createPerformanceMetric(metricData) {
        const now = new Date().toISOString();
        const newMetric = {
            id: `metric_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...metricData,
            createdAt: now
        };
        if (newMetric.value >= newMetric.thresholds.critical) {
            newMetric.status = 'critical';
        }
        else if (newMetric.value >= newMetric.thresholds.warning) {
            newMetric.status = 'warning';
        }
        else {
            newMetric.status = 'normal';
        }
        this.metrics.set(newMetric.id, newMetric);
        structuredLogger.info('Performance metric created', {
            metricId: newMetric.id,
            organizationId: newMetric.organizationId,
            service: newMetric.service,
            metricType: newMetric.metricType,
            value: newMetric.value,
            status: newMetric.status
        });
        return newMetric;
    }
    async getPerformanceMetrics(organizationId, filters = {}) {
        let metrics = Array.from(this.metrics.values())
            .filter(m => m.organizationId === organizationId);
        if (filters.service) {
            metrics = metrics.filter(m => m.service === filters.service);
        }
        if (filters.metricType) {
            metrics = metrics.filter(m => m.metricType === filters.metricType);
        }
        if (filters.status) {
            metrics = metrics.filter(m => m.status === filters.status);
        }
        if (filters.startDate) {
            metrics = metrics.filter(m => m.timestamp >= filters.startDate);
        }
        if (filters.endDate) {
            metrics = metrics.filter(m => m.timestamp <= filters.endDate);
        }
        if (filters.limit) {
            metrics = metrics.slice(0, filters.limit);
        }
        return metrics.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    async createAlert(alertData) {
        const now = new Date().toISOString();
        const newAlert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            ...alertData,
            notifications: {
                channels: alertData.notifications.channels,
                sent: false,
                acknowledged: false,
                ...alertData.notifications
            },
            createdAt: now,
            updatedAt: now
        };
        this.alerts.set(newAlert.id, newAlert);
        structuredLogger.info('Alert created', {
            alertId: newAlert.id,
            organizationId: newAlert.organizationId,
            type: newAlert.type,
            severity: newAlert.severity,
            title: newAlert.title
        });
        return newAlert;
    }
    async getAlerts(organizationId, filters = {}) {
        let alerts = Array.from(this.alerts.values())
            .filter(a => a.organizationId === organizationId);
        if (filters.type) {
            alerts = alerts.filter(a => a.type === filters.type);
        }
        if (filters.severity) {
            alerts = alerts.filter(a => a.severity === filters.severity);
        }
        if (filters.status) {
            alerts = alerts.filter(a => a.status === filters.status);
        }
        if (filters.startDate) {
            alerts = alerts.filter(a => a.createdAt >= filters.startDate);
        }
        if (filters.endDate) {
            alerts = alerts.filter(a => a.createdAt <= filters.endDate);
        }
        if (filters.limit) {
            alerts = alerts.slice(0, filters.limit);
        }
        return alerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    async analyzeError(errorId) {
        const error = this.errors.get(errorId);
        if (!error) {
            throw new Error(`Error ${errorId} not found`);
        }
        const matchingPatterns = Array.from(this.patterns.values())
            .filter(p => p.organizationId === error.organizationId && p.enabled)
            .filter(p => this.matchesPattern(error, p));
        if (matchingPatterns.length > 0) {
            const bestPattern = matchingPatterns[0];
            bestPattern.statistics.matches++;
            bestPattern.statistics.lastMatch = new Date().toISOString();
            this.patterns.set(bestPattern.id, bestPattern);
            await this.executePatternAction(error, bestPattern);
        }
        error.metadata.tags = this.generateTags(error);
        error.updatedAt = new Date().toISOString();
        this.errors.set(errorId, error);
        structuredLogger.info('Error analyzed', {
            errorId,
            organizationId: error.organizationId,
            matchingPatterns: matchingPatterns.length,
            tags: error.metadata.tags
        });
        return error;
    }
    matchesPattern(error, pattern) {
        if (pattern.pattern.errorType && error.errorType !== pattern.pattern.errorType) {
            return false;
        }
        if (pattern.pattern.errorMessage && !error.errorMessage.includes(pattern.pattern.errorMessage)) {
            return false;
        }
        if (pattern.pattern.service && error.service !== pattern.pattern.service) {
            return false;
        }
        if (pattern.pattern.category && error.category !== pattern.pattern.category) {
            return false;
        }
        for (const condition of pattern.pattern.conditions) {
            if (!this.evaluateCondition(error, condition)) {
                return false;
            }
        }
        return true;
    }
    evaluateCondition(error, condition) {
        const fieldValue = this.getNestedValue(error, condition.field);
        const expectedValue = condition.value;
        switch (condition.operator) {
            case 'equals':
                return fieldValue === expectedValue;
            case 'contains':
                return String(fieldValue).includes(String(expectedValue));
            case 'regex':
                return new RegExp(String(expectedValue)).test(String(fieldValue));
            case 'starts_with':
                return String(fieldValue).startsWith(String(expectedValue));
            case 'ends_with':
                return String(fieldValue).endsWith(String(expectedValue));
            case 'greater_than':
                return Number(fieldValue) > Number(expectedValue);
            case 'less_than':
                return Number(fieldValue) < Number(expectedValue);
            default:
                return false;
        }
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    async executePatternAction(error, pattern) {
        switch (pattern.action.type) {
            case 'alert':
                await this.createAlert({
                    organizationId: error.organizationId,
                    type: 'error',
                    severity: error.severity,
                    title: `Pattern Match: ${pattern.name}`,
                    description: `Error matches pattern: ${error.errorMessage}`,
                    source: {
                        service: error.service
                    },
                    condition: {
                        metric: 'error_pattern_match'
                    },
                    status: 'active',
                    escalationLevel: pattern.action.config.escalationLevel || 1,
                    notifications: {
                        channels: pattern.action.config.alertChannels || ['slack']
                    },
                    metadata: {
                        tags: ['pattern-match', pattern.name],
                        customFields: {
                            patternId: pattern.id,
                            errorId: error.id
                        },
                        relatedAlerts: []
                    }
                });
                break;
            case 'escalate':
                error.metadata.escalationLevel = pattern.action.config.escalationLevel || 2;
                error.resolution.priority = 'critical';
                break;
            case 'auto_resolve':
                if (pattern.action.config.autoResolveAfter) {
                    setTimeout(() => {
                        error.resolution.status = 'resolved';
                        error.resolution.actualResolution = new Date().toISOString();
                        error.resolution.resolutionNotes = 'Auto-resolved by pattern';
                        error.updatedAt = new Date().toISOString();
                        this.errors.set(error.id, error);
                    }, pattern.action.config.autoResolveAfter * 60 * 1000);
                }
                break;
            case 'create_ticket':
                structuredLogger.info('Ticket created for error', {
                    errorId: error.id,
                    patternId: pattern.id,
                    priority: pattern.action.config.ticketPriority || 'medium'
                });
                break;
            case 'notify_team':
                structuredLogger.info('Team notified for error', {
                    errorId: error.id,
                    patternId: pattern.id,
                    template: pattern.action.config.notificationTemplate
                });
                break;
        }
    }
    generateTags(error) {
        const tags = [];
        tags.push(error.category);
        tags.push(error.severity);
        tags.push(error.service);
        tags.push(error.environment);
        if (error.errorType) {
            tags.push(error.errorType.toLowerCase().replace(/([A-Z])/g, '_$1').toLowerCase());
        }
        if (error.context.endpoint) {
            tags.push(`endpoint:${error.context.endpoint}`);
        }
        if (error.impact.businessImpact === 'critical') {
            tags.push('business-critical');
        }
        return [...new Set(tags)];
    }
    async processNewErrors() {
        const newErrors = Array.from(this.errors.values())
            .filter(e => e.resolution.status === 'open' &&
            new Date(e.createdAt).getTime() > Date.now() - 5 * 60 * 1000);
        for (const error of newErrors) {
            await this.analyzeError(error.id);
        }
    }
    async collectPerformanceMetrics() {
        const services = ['api-gateway', 'user-service', 'payment-service'];
        for (const service of services) {
            const responseTime = Math.random() * 1000;
            const errorRate = Math.random() * 5;
            await this.createPerformanceMetric({
                organizationId: 'demo-org-1',
                service,
                metricType: 'response_time',
                value: responseTime,
                unit: 'ms',
                timestamp: new Date().toISOString(),
                dimensions: {
                    environment: 'production'
                },
                thresholds: {
                    warning: 500,
                    critical: 1000
                }
            });
            await this.createPerformanceMetric({
                organizationId: 'demo-org-1',
                service,
                metricType: 'error_rate',
                value: errorRate,
                unit: '%',
                timestamp: new Date().toISOString(),
                dimensions: {
                    environment: 'production'
                },
                thresholds: {
                    warning: 2,
                    critical: 5
                }
            });
        }
    }
    async processAlerts() {
        const activeAlerts = Array.from(this.alerts.values())
            .filter(a => a.status === 'active' && !a.notifications.sent);
        for (const alert of activeAlerts) {
            alert.notifications.sent = true;
            alert.notifications.sentAt = new Date().toISOString();
            alert.updatedAt = new Date().toISOString();
            this.alerts.set(alert.id, alert);
            structuredLogger.info('Alert notification sent', {
                alertId: alert.id,
                channels: alert.notifications.channels,
                severity: alert.severity
            });
        }
    }
    async generateErrorReport(organizationId, reportType, startDate, endDate, generatedBy) {
        const errors = Array.from(this.errors.values())
            .filter(e => e.organizationId === organizationId &&
            e.createdAt >= startDate &&
            e.createdAt <= endDate);
        const byCategory = errors.reduce((acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + 1;
            return acc;
        }, {});
        const bySeverity = errors.reduce((acc, e) => {
            acc[e.severity] = (acc[e.severity] || 0) + 1;
            return acc;
        }, {});
        const byService = errors.reduce((acc, e) => {
            acc[e.service] = (acc[e.service] || 0) + 1;
            return acc;
        }, {});
        const errorCounts = errors.reduce((acc, e) => {
            acc[e.errorType] = (acc[e.errorType] || 0) + 1;
            return acc;
        }, {});
        const topErrors = Object.entries(errorCounts)
            .map(([errorType, count]) => ({
            errorType,
            count,
            percentage: (count / errors.length) * 100,
            trend: 'stable'
        }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        const resolvedErrors = errors.filter(e => e.resolution.status === 'resolved');
        const escalatedErrors = errors.filter(e => e.metadata.escalationLevel > 0);
        const resolutionStats = {
            averageResolutionTime: this.calculateAverageResolutionTime(resolvedErrors),
            resolutionRate: errors.length > 0 ? (resolvedErrors.length / errors.length) * 100 : 0,
            escalationRate: errors.length > 0 ? (escalatedErrors.length / errors.length) * 100 : 0,
            autoResolutionRate: 0
        };
        const performanceImpact = {
            averageResponseTime: errors.reduce((sum, e) => sum + (e.performance.responseTime || 0), 0) / errors.length,
            availabilityPercentage: 99.5,
            throughputImpact: 0.5
        };
        const businessImpact = {
            affectedUsers: errors.reduce((sum, e) => sum + e.impact.affectedUsers, 0),
            revenueImpact: errors.reduce((sum, e) => sum + (e.impact.revenueImpact || 0), 0),
            slaBreaches: errors.filter(e => e.impact.slaImpact).length
        };
        const report = {
            id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
            organizationId,
            reportType: reportType,
            period: { startDate, endDate },
            data: {
                totalErrors: errors.length,
                byCategory,
                bySeverity,
                byService,
                topErrors,
                resolutionStats,
                performanceImpact,
                businessImpact
            },
            generatedBy,
            createdAt: new Date().toISOString()
        };
        structuredLogger.info('Error report generated', {
            reportId: report.id,
            organizationId,
            reportType,
            period: `${startDate} to ${endDate}`
        });
        return report;
    }
    calculateAverageResolutionTime(errors) {
        if (errors.length === 0)
            return 0;
        const totalTime = errors.reduce((sum, error) => {
            if (error.resolution.actualResolution) {
                const created = new Date(error.createdAt);
                const resolved = new Date(error.resolution.actualResolution);
                return sum + (resolved.getTime() - created.getTime());
            }
            return sum;
        }, 0);
        return totalTime / errors.length;
    }
    async getStats(organizationId) {
        const errors = Array.from(this.errors.values()).filter(e => e.organizationId === organizationId);
        const patterns = Array.from(this.patterns.values()).filter(p => p.organizationId === organizationId);
        const metrics = Array.from(this.metrics.values()).filter(m => m.organizationId === organizationId);
        const alerts = Array.from(this.alerts.values()).filter(a => a.organizationId === organizationId);
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const recentErrors = errors.filter(e => new Date(e.createdAt) >= last24Hours);
        const recentAlerts = alerts.filter(a => new Date(a.createdAt) >= last24Hours);
        return {
            totalErrors: errors.length,
            totalPatterns: patterns.length,
            totalMetrics: metrics.length,
            totalAlerts: alerts.length,
            last24Hours: {
                newErrors: recentErrors.length,
                newAlerts: recentAlerts.length,
                resolvedErrors: recentErrors.filter(e => e.resolution.status === 'resolved').length,
                escalatedErrors: recentErrors.filter(e => e.metadata.escalationLevel > 0).length
            },
            last7Days: {
                newErrors: errors.filter(e => new Date(e.createdAt) >= last7Days).length,
                newAlerts: alerts.filter(a => new Date(a.createdAt) >= last7Days).length
            },
            byStatus: errors.reduce((acc, e) => {
                acc[e.resolution.status] = (acc[e.resolution.status] || 0) + 1;
                return acc;
            }, {}),
            byCategory: errors.reduce((acc, e) => {
                acc[e.category] = (acc[e.category] || 0) + 1;
                return acc;
            }, {}),
            bySeverity: errors.reduce((acc, e) => {
                acc[e.severity] = (acc[e.severity] || 0) + 1;
                return acc;
            }, {}),
            byService: errors.reduce((acc, e) => {
                acc[e.service] = (acc[e.service] || 0) + 1;
                return acc;
            }, {}),
            alertStats: {
                active: alerts.filter(a => a.status === 'active').length,
                acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
                resolved: alerts.filter(a => a.status === 'resolved').length,
                suppressed: alerts.filter(a => a.status === 'suppressed').length
            },
            performanceStats: {
                normal: metrics.filter(m => m.status === 'normal').length,
                warning: metrics.filter(m => m.status === 'warning').length,
                critical: metrics.filter(m => m.status === 'critical').length
            }
        };
    }
}
export const advancedErrorManagementService = new AdvancedErrorManagementService();
//# sourceMappingURL=advanced-error-management.service.js.map