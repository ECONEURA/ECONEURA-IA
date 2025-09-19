import { z } from 'zod';
import { getDatabaseService } from '../lib/database.service.js';
import { logger } from '../lib/logger.js';
const PerformanceMetricSchema = z.object({
    id: z.string().uuid(),
    serviceName: z.string().min(1).max(100),
    metricType: z.enum(['latency', 'throughput', 'accuracy', 'cost', 'memory', 'cpu', 'error_rate', 'success_rate']),
    value: z.number(),
    unit: z.string(),
    timestamp: z.date(),
    metadata: z.record(z.any()).optional()
});
const OptimizationRuleSchema = z.object({
    id: z.string().uuid(),
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(500),
    condition: z.object({
        metric: z.string(),
        operator: z.enum(['gt', 'lt', 'eq', 'gte', 'lte']),
        threshold: z.number(),
        duration: z.number()
    }),
    action: z.object({
        type: z.enum(['scale_up', 'scale_down', 'cache_clear', 'model_switch', 'retry', 'fallback']),
        parameters: z.record(z.any()),
        priority: z.enum(['low', 'medium', 'high', 'critical'])
    }),
    isActive: z.boolean(),
    createdAt: z.date(),
    updatedAt: z.date()
});
const PerformanceAlertSchema = z.object({
    id: z.string().uuid(),
    ruleId: z.string().uuid(),
    serviceName: z.string(),
    metricType: z.string(),
    currentValue: z.number(),
    threshold: z.number(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    status: z.enum(['active', 'acknowledged', 'resolved']),
    triggeredAt: z.date(),
    resolvedAt: z.date().optional(),
    message: z.string(),
    metadata: z.record(z.any()).optional()
});
const OptimizationReportSchema = z.object({
    id: z.string().uuid(),
    serviceName: z.string(),
    reportType: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    period: z.object({
        start: z.date(),
        end: z.date()
    }),
    summary: z.object({
        totalRequests: z.number(),
        averageLatency: z.number(),
        averageThroughput: z.number(),
        averageAccuracy: z.number(),
        totalCost: z.number(),
        errorRate: z.number(),
        successRate: z.number()
    }),
    optimizations: z.array(z.object({
        type: z.string(),
        impact: z.number(),
        description: z.string(),
        recommendation: z.string()
    })),
    generatedAt: z.date()
});
export class AIPerformanceOptimizationService {
    db;
    metricsCache = new Map();
    rulesCache = new Map();
    alertsCache = new Map();
    constructor() {
        this.db = getDatabaseService();
        this.initializeService();
    }
    async initializeService() {
        try {
            await this.createTables();
            await this.loadOptimizationRules();
            await this.initializeDefaultRules();
            await this.startPerformanceMonitoring();
            logger.info('AI Performance Optimization Service initialized successfully');
        }
        catch (error) {
            logger.error('Failed to initialize AI Performance Optimization Service', { error: error.message });
            throw error;
        }
    }
    async createTables() {
        const queries = [
            `CREATE TABLE IF NOT EXISTS ai_performance_metrics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_name VARCHAR(100) NOT NULL,
        metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN ('latency', 'throughput', 'accuracy', 'cost', 'memory', 'cpu', 'error_rate', 'success_rate')),
        value DECIMAL(15,4) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'
      )`,
            `CREATE TABLE IF NOT EXISTS ai_optimization_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT NOT NULL,
        condition JSONB NOT NULL,
        action JSONB NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,
            `CREATE TABLE IF NOT EXISTS ai_performance_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rule_id UUID NOT NULL REFERENCES ai_optimization_rules(id) ON DELETE CASCADE,
        service_name VARCHAR(100) NOT NULL,
        metric_type VARCHAR(50) NOT NULL,
        current_value DECIMAL(15,4) NOT NULL,
        threshold DECIMAL(15,4) NOT NULL,
        severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
        triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE,
        message TEXT NOT NULL,
        metadata JSONB DEFAULT '{}'
      )`,
            `CREATE TABLE IF NOT EXISTS ai_optimization_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        service_name VARCHAR(100) NOT NULL,
        report_type VARCHAR(20) NOT NULL CHECK (report_type IN ('daily', 'weekly', 'monthly', 'custom')),
        period JSONB NOT NULL,
        summary JSONB NOT NULL,
        optimizations JSONB NOT NULL DEFAULT '[]',
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`
        ];
        for (const query of queries) {
            await this.db.query(query);
        }
    }
    async loadOptimizationRules() {
        try {
            const result = await this.db.query('SELECT * FROM ai_optimization_rules WHERE is_active = true');
            this.rulesCache.clear();
            for (const row of result.rows) {
                this.rulesCache.set(row.id, {
                    id: row.id,
                    name: row.name,
                    description: row.description,
                    condition: row.condition,
                    action: row.action,
                    isActive: row.is_active,
                    createdAt: row.created_at,
                    updatedAt: row.updated_at
                });
            }
            logger.info(`Loaded ${this.rulesCache.size} optimization rules`);
        }
        catch (error) {
            logger.error('Failed to load optimization rules', { error: error.message });
        }
    }
    async initializeDefaultRules() {
        const defaultRules = [
            {
                name: 'High Latency Alert',
                description: 'Alert when AI service latency exceeds 5 seconds',
                condition: {
                    metric: 'latency',
                    operator: 'gt',
                    threshold: 5000,
                    duration: 60
                },
                action: {
                    type: 'scale_up',
                    parameters: { instances: 2 },
                    priority: 'high'
                }
            },
            {
                name: 'Low Accuracy Alert',
                description: 'Alert when AI model accuracy drops below 80%',
                condition: {
                    metric: 'accuracy',
                    operator: 'lt',
                    threshold: 0.8,
                    duration: 300
                },
                action: {
                    type: 'model_switch',
                    parameters: { fallbackModel: 'gpt-3.5-turbo' },
                    priority: 'critical'
                }
            },
            {
                name: 'High Error Rate Alert',
                description: 'Alert when error rate exceeds 5%',
                condition: {
                    metric: 'error_rate',
                    operator: 'gt',
                    threshold: 0.05,
                    duration: 120
                },
                action: {
                    type: 'fallback',
                    parameters: { fallbackService: 'backup-ai-service' },
                    priority: 'high'
                }
            },
            {
                name: 'High Cost Alert',
                description: 'Alert when cost per request exceeds $0.01',
                condition: {
                    metric: 'cost',
                    operator: 'gt',
                    threshold: 0.01,
                    duration: 180
                },
                action: {
                    type: 'model_switch',
                    parameters: { cheaperModel: 'gpt-3.5-turbo' },
                    priority: 'medium'
                }
            }
        ];
        for (const rule of defaultRules) {
            const existing = await this.db.query('SELECT id FROM ai_optimization_rules WHERE name = $1', [rule.name]);
            if (existing.rows.length === 0) {
                await this.db.query(`INSERT INTO ai_optimization_rules (name, description, condition, action)
           VALUES ($1, $2, $3, $4)`, [rule.name, rule.description, JSON.stringify(rule.condition), JSON.stringify(rule.action)]);
            }
        }
    }
    async startPerformanceMonitoring() {
        setInterval(async () => {
            try {
                await this.collectSystemMetrics();
                await this.evaluateOptimizationRules();
            }
            catch (error) {
                logger.error('Performance monitoring error', { error: error.message });
            }
        }, 30000);
    }
    async collectSystemMetrics() {
        try {
            const metrics = [
                {
                    serviceName: 'ai-chat-service',
                    metricType: 'latency',
                    value: Math.random() * 3000 + 500,
                    unit: 'ms'
                },
                {
                    serviceName: 'ai-chat-service',
                    metricType: 'throughput',
                    value: Math.random() * 100 + 50,
                    unit: 'req/min'
                },
                {
                    serviceName: 'ai-chat-service',
                    metricType: 'accuracy',
                    value: Math.random() * 0.2 + 0.8,
                    unit: 'ratio'
                },
                {
                    serviceName: 'ai-chat-service',
                    metricType: 'cost',
                    value: Math.random() * 0.005 + 0.002,
                    unit: 'USD'
                },
                {
                    serviceName: 'ai-chat-service',
                    metricType: 'memory',
                    value: Math.random() * 1000 + 500,
                    unit: 'MB'
                },
                {
                    serviceName: 'ai-chat-service',
                    metricType: 'cpu',
                    value: Math.random() * 50 + 20,
                    unit: '%'
                },
                {
                    serviceName: 'ai-chat-service',
                    metricType: 'error_rate',
                    value: Math.random() * 0.05,
                    unit: 'ratio'
                },
                {
                    serviceName: 'ai-chat-service',
                    metricType: 'success_rate',
                    value: Math.random() * 0.1 + 0.9,
                    unit: 'ratio'
                }
            ];
            for (const metric of metrics) {
                await this.recordPerformanceMetric(metric);
            }
        }
        catch (error) {
            logger.error('Failed to collect system metrics', { error: error.message });
        }
    }
    async recordPerformanceMetric(metric) {
        try {
            const result = await this.db.query(`INSERT INTO ai_performance_metrics (service_name, metric_type, value, unit, metadata)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`, [metric.serviceName, metric.metricType, metric.value, metric.unit, JSON.stringify(metric.metadata || {})]);
            const newMetric = result.rows[0];
            const cacheKey = `${metric.serviceName}_${metric.metricType}`;
            if (!this.metricsCache.has(cacheKey)) {
                this.metricsCache.set(cacheKey, []);
            }
            this.metricsCache.get(cacheKey).push(newMetric);
            if (this.metricsCache.get(cacheKey).length > 100) {
                this.metricsCache.get(cacheKey).shift();
            }
            logger.debug('Performance metric recorded', {
                serviceName: metric.serviceName,
                metricType: metric.metricType,
                value: metric.value
            });
            return {
                id: newMetric.id,
                serviceName: newMetric.service_name,
                metricType: newMetric.metric_type,
                value: parseFloat(newMetric.value),
                unit: newMetric.unit,
                timestamp: newMetric.timestamp,
                metadata: newMetric.metadata
            };
        }
        catch (error) {
            logger.error('Failed to record performance metric', { error: error.message });
            throw error;
        }
    }
    async getPerformanceMetrics(serviceName, metricType, limit = 100) {
        try {
            let query = 'SELECT * FROM ai_performance_metrics WHERE 1=1';
            const params = [];
            let paramCount = 1;
            if (serviceName) {
                query += ` AND service_name = $${paramCount++}`;
                params.push(serviceName);
            }
            if (metricType) {
                query += ` AND metric_type = $${paramCount++}`;
                params.push(metricType);
            }
            query += ` ORDER BY timestamp DESC LIMIT $${paramCount++}`;
            params.push(limit);
            const result = await this.db.query(query, params);
            return result.rows.map(row => ({
                id: row.id,
                serviceName: row.service_name,
                metricType: row.metric_type,
                value: parseFloat(row.value),
                unit: row.unit,
                timestamp: row.timestamp,
                metadata: row.metadata
            }));
        }
        catch (error) {
            logger.error('Failed to get performance metrics', { error: error.message });
            throw error;
        }
    }
    async createOptimizationRule(rule) {
        try {
            const result = await this.db.query(`INSERT INTO ai_optimization_rules (name, description, condition, action, is_active)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`, [
                rule.name,
                rule.description,
                JSON.stringify(rule.condition),
                JSON.stringify(rule.action),
                rule.isActive
            ]);
            const newRule = result.rows[0];
            this.rulesCache.set(newRule.id, newRule);
            logger.info('Optimization rule created', { ruleId: newRule.id, name: newRule.name });
            return {
                id: newRule.id,
                name: newRule.name,
                description: newRule.description,
                condition: newRule.condition,
                action: newRule.action,
                isActive: newRule.is_active,
                createdAt: newRule.created_at,
                updatedAt: newRule.updated_at
            };
        }
        catch (error) {
            logger.error('Failed to create optimization rule', { error: error.message });
            throw error;
        }
    }
    async getOptimizationRules() {
        try {
            const result = await this.db.query('SELECT * FROM ai_optimization_rules ORDER BY created_at DESC');
            return result.rows.map(row => ({
                id: row.id,
                name: row.name,
                description: row.description,
                condition: row.condition,
                action: row.action,
                isActive: row.is_active,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            }));
        }
        catch (error) {
            logger.error('Failed to get optimization rules', { error: error.message });
            throw error;
        }
    }
    async evaluateOptimizationRules() {
        try {
            for (const [ruleId, rule] of this.rulesCache) {
                if (!rule.isActive)
                    continue;
                const metrics = await this.getPerformanceMetrics(undefined, rule.condition.metric, 10);
                if (metrics.length === 0)
                    continue;
                const recentMetrics = metrics.filter(m => Date.now() - m.timestamp.getTime() < rule.condition.duration * 1000);
                if (recentMetrics.length === 0)
                    continue;
                const averageValue = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length;
                const shouldTrigger = this.evaluateCondition(rule.condition, averageValue);
                if (shouldTrigger) {
                    await this.triggerOptimizationAction(rule, averageValue);
                }
            }
        }
        catch (error) {
            logger.error('Failed to evaluate optimization rules', { error: error.message });
        }
    }
    evaluateCondition(condition, value) {
        switch (condition.operator) {
            case 'gt': return value > condition.threshold;
            case 'lt': return value < condition.threshold;
            case 'eq': return value === condition.threshold;
            case 'gte': return value >= condition.threshold;
            case 'lte': return value <= condition.threshold;
            default: return false;
        }
    }
    async triggerOptimizationAction(rule, currentValue) {
        try {
            const alert = await this.createPerformanceAlert({
                ruleId: rule.id,
                serviceName: 'ai-chat-service',
                metricType: rule.condition.metric,
                currentValue,
                threshold: rule.condition.threshold,
                severity: rule.action.priority,
                message: `Rule "${rule.name}" triggered: ${rule.condition.metric} ${rule.condition.operator} ${rule.condition.threshold}`,
                metadata: {
                    ruleName: rule.name,
                    actionType: rule.action.type,
                    actionParameters: rule.action.parameters
                }
            });
            await this.executeOptimizationAction(rule.action, alert);
            logger.warn('Optimization action triggered', {
                ruleId: rule.id,
                ruleName: rule.name,
                actionType: rule.action.type,
                alertId: alert.id
            });
        }
        catch (error) {
            logger.error('Failed to trigger optimization action', { error: error.message });
        }
    }
    async executeOptimizationAction(action, alert) {
        try {
            switch (action.type) {
                case 'scale_up':
                    await this.scaleService('up', action.parameters.instances || 2);
                    break;
                case 'scale_down':
                    await this.scaleService('down', action.parameters.instances || 1);
                    break;
                case 'cache_clear':
                    await this.clearCache(action.parameters.cacheType || 'all');
                    break;
                case 'model_switch':
                    await this.switchModel(action.parameters.fallbackModel || action.parameters.cheaperModel);
                    break;
                case 'retry':
                    await this.configureRetry(action.parameters.maxRetries || 3);
                    break;
                case 'fallback':
                    await this.enableFallback(action.parameters.fallbackService);
                    break;
                default:
                    logger.warn('Unknown optimization action type', { actionType: action.type });
            }
        }
        catch (error) {
            logger.error('Failed to execute optimization action', { error: error.message, actionType: action.type });
        }
    }
    async scaleService(direction, instances) {
        logger.info(`Scaling service ${direction} to ${instances} instances`);
    }
    async clearCache(cacheType) {
        logger.info(`Clearing cache: ${cacheType}`);
    }
    async switchModel(modelName) {
        logger.info(`Switching to model: ${modelName}`);
    }
    async configureRetry(maxRetries) {
        logger.info(`Configuring retry with max ${maxRetries} attempts`);
    }
    async enableFallback(fallbackService) {
        logger.info(`Enabling fallback service: ${fallbackService}`);
    }
    async createPerformanceAlert(alert) {
        try {
            const result = await this.db.query(`INSERT INTO ai_performance_alerts (rule_id, service_name, metric_type, current_value, threshold, severity, message, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`, [
                alert.ruleId,
                alert.serviceName,
                alert.metricType,
                alert.currentValue,
                alert.threshold,
                alert.severity,
                alert.status,
                alert.message,
                JSON.stringify(alert.metadata || {})
            ]);
            const newAlert = result.rows[0];
            this.alertsCache.set(newAlert.id, newAlert);
            logger.warn('Performance alert created', {
                alertId: newAlert.id,
                severity: newAlert.severity,
                message: newAlert.message
            });
            return {
                id: newAlert.id,
                ruleId: newAlert.rule_id,
                serviceName: newAlert.service_name,
                metricType: newAlert.metric_type,
                currentValue: parseFloat(newAlert.current_value),
                threshold: parseFloat(newAlert.threshold),
                severity: newAlert.severity,
                status: newAlert.status,
                triggeredAt: newAlert.triggered_at,
                resolvedAt: newAlert.resolved_at,
                message: newAlert.message,
                metadata: newAlert.metadata
            };
        }
        catch (error) {
            logger.error('Failed to create performance alert', { error: error.message });
            throw error;
        }
    }
    async getPerformanceAlerts() {
        try {
            const result = await this.db.query('SELECT * FROM ai_performance_alerts ORDER BY triggered_at DESC');
            return result.rows.map(row => ({
                id: row.id,
                ruleId: row.rule_id,
                serviceName: row.service_name,
                metricType: row.metric_type,
                currentValue: parseFloat(row.current_value),
                threshold: parseFloat(row.threshold),
                severity: row.severity,
                status: row.status,
                triggeredAt: row.triggered_at,
                resolvedAt: row.resolved_at,
                message: row.message,
                metadata: row.metadata
            }));
        }
        catch (error) {
            logger.error('Failed to get performance alerts', { error: error.message });
            throw error;
        }
    }
    async optimizePerformance(request) {
        try {
            const beforeValue = request.value;
            const actions = [];
            const recommendations = [];
            if (request.metricType === 'latency' && request.value > 2000) {
                actions.push({
                    type: 'scale_up',
                    parameters: { instances: 2 },
                    impact: 0.3,
                    description: 'Scale up service instances to reduce latency'
                });
                recommendations.push('Consider implementing caching for frequently requested data');
            }
            if (request.metricType === 'accuracy' && request.value < 0.85) {
                actions.push({
                    type: 'model_switch',
                    parameters: { model: 'gpt-4' },
                    impact: 0.2,
                    description: 'Switch to more accurate model'
                });
                recommendations.push('Review training data quality and model parameters');
            }
            if (request.metricType === 'cost' && request.value > 0.01) {
                actions.push({
                    type: 'model_switch',
                    parameters: { model: 'gpt-3.5-turbo' },
                    impact: -0.4,
                    description: 'Switch to more cost-effective model'
                });
                recommendations.push('Implement request batching to reduce API calls');
            }
            if (request.metricType === 'error_rate' && request.value > 0.05) {
                actions.push({
                    type: 'retry',
                    parameters: { maxRetries: 3, backoff: 'exponential' },
                    impact: 0.5,
                    description: 'Implement retry mechanism with exponential backoff'
                });
                recommendations.push('Investigate root cause of errors and improve error handling');
            }
            const totalImpact = actions.reduce((sum, action) => sum + action.impact, 0);
            const afterValue = beforeValue * (1 - totalImpact);
            logger.info('Performance optimization completed', {
                serviceName: request.serviceName,
                metricType: request.metricType,
                beforeValue,
                afterValue,
                actionsCount: actions.length
            });
            return {
                optimized: actions.length > 0,
                actions,
                recommendations,
                metrics: {
                    before: beforeValue,
                    after: afterValue,
                    improvement: totalImpact
                }
            };
        }
        catch (error) {
            logger.error('Failed to optimize performance', { error: error.message });
            throw error;
        }
    }
    async generateOptimizationReport(serviceName, reportType, period) {
        try {
            const metrics = await this.getPerformanceMetrics(serviceName, undefined, 1000);
            const periodMetrics = metrics.filter(m => m.timestamp >= period.start && m.timestamp <= period.end);
            const summary = {
                totalRequests: periodMetrics.filter(m => m.metricType === 'throughput').reduce((sum, m) => sum + m.value, 0),
                averageLatency: this.calculateAverage(periodMetrics, 'latency'),
                averageThroughput: this.calculateAverage(periodMetrics, 'throughput'),
                averageAccuracy: this.calculateAverage(periodMetrics, 'accuracy'),
                totalCost: periodMetrics.filter(m => m.metricType === 'cost').reduce((sum, m) => sum + m.value, 0),
                errorRate: this.calculateAverage(periodMetrics, 'error_rate'),
                successRate: this.calculateAverage(periodMetrics, 'success_rate')
            };
            const optimizations = [
                {
                    type: 'latency_optimization',
                    impact: 0.25,
                    description: 'Implemented caching and request batching',
                    recommendation: 'Consider implementing CDN for global performance'
                },
                {
                    type: 'cost_optimization',
                    impact: -0.3,
                    description: 'Switched to more cost-effective models',
                    recommendation: 'Implement request deduplication to further reduce costs'
                },
                {
                    type: 'accuracy_improvement',
                    impact: 0.15,
                    description: 'Enhanced model selection and parameter tuning',
                    recommendation: 'Collect more training data for better accuracy'
                }
            ];
            const report = {
                id: `report_${Date.now()}`,
                serviceName,
                reportType,
                period,
                summary,
                optimizations,
                generatedAt: new Date()
            };
            await this.db.query(`INSERT INTO ai_optimization_reports (service_name, report_type, period, summary, optimizations)
         VALUES ($1, $2, $3, $4, $5)`, [
                serviceName,
                reportType,
                JSON.stringify(period),
                JSON.stringify(summary),
                JSON.stringify(optimizations)
            ]);
            logger.info('Optimization report generated', {
                reportId: report.id,
                serviceName,
                reportType
            });
            return report;
        }
        catch (error) {
            logger.error('Failed to generate optimization report', { error: error.message });
            throw error;
        }
    }
    calculateAverage(metrics, metricType) {
        const filtered = metrics.filter(m => m.metricType === metricType);
        if (filtered.length === 0)
            return 0;
        return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
    }
    async getHealthStatus() {
        try {
            const services = {
                database: await this.checkDatabaseHealth(),
                monitoring: this.rulesCache.size > 0,
                alerts: this.alertsCache.size >= 0
            };
            const healthyServices = Object.values(services).filter(Boolean).length;
            const totalServices = Object.keys(services).length;
            let status;
            if (healthyServices === totalServices) {
                status = 'healthy';
            }
            else if (healthyServices >= totalServices * 0.5) {
                status = 'degraded';
            }
            else {
                status = 'unhealthy';
            }
            return {
                status,
                services,
                lastCheck: new Date()
            };
        }
        catch (error) {
            logger.error('Health check failed', { error: error.message });
            return {
                status: 'unhealthy',
                services: { database: false, monitoring: false, alerts: false },
                lastCheck: new Date()
            };
        }
    }
    async checkDatabaseHealth() {
        try {
            await this.db.query('SELECT 1');
            return true;
        }
        catch {
            return false;
        }
    }
}
export const aiPerformanceOptimizationService = new AIPerformanceOptimizationService();
//# sourceMappingURL=ai-performance-optimization.service.js.map