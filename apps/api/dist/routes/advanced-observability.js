import { Router } from 'express';
import { z } from 'zod';
import { advancedObservability } from '../services/advanced-observability.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const LogFiltersSchema = z.object({
    level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']).optional(),
    service: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(1000).optional()
});
const CreateLogSchema = z.object({
    level: z.enum(['debug', 'info', 'warn', 'error', 'fatal']),
    message: z.string().min(1),
    service: z.string().min(1),
    userId: z.string().optional(),
    requestId: z.string().optional(),
    traceId: z.string().optional(),
    spanId: z.string().optional(),
    metadata: z.record(z.any()).optional()
});
const TraceFiltersSchema = z.object({
    service: z.string().optional(),
    operationName: z.string().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    limit: z.number().int().min(1).max(1000).optional()
});
const CreateTraceSchema = z.object({
    traceId: z.string().min(1),
    parentId: z.string().optional(),
    operationName: z.string().min(1),
    service: z.string().min(1),
    tags: z.record(z.any()).optional(),
    logs: z.array(z.object({
        timestamp: z.string().datetime(),
        fields: z.record(z.any())
    })).optional(),
    status: z.enum(['started', 'finished', 'error'])
});
const AlertConditionSchema = z.object({
    metric: z.string().min(1),
    operator: z.enum(['gt', 'lt', 'eq', 'ne', 'gte', 'lte']),
    threshold: z.number(),
    timeWindow: z.number().int().min(1)
});
const AlertActionSchema = z.object({
    type: z.enum(['email', 'sms', 'webhook', 'slack', 'pagerduty']),
    target: z.string().min(1),
    template: z.string().optional()
});
const CreateAlertRuleSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    enabled: z.boolean().default(true),
    conditions: z.array(AlertConditionSchema).min(1),
    actions: z.array(AlertActionSchema).min(1),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    cooldownMinutes: z.number().int().min(1).default(15)
});
const AlertFiltersSchema = z.object({
    status: z.enum(['firing', 'resolved', 'acknowledged']).optional(),
    severity: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    limit: z.number().int().min(1).max(1000).optional()
});
const DashboardWidgetSchema = z.object({
    id: z.string().min(1),
    type: z.enum(['metric', 'chart', 'table', 'alert', 'log']),
    title: z.string().min(1),
    position: z.object({
        x: z.number().int().min(0),
        y: z.number().int().min(0),
        w: z.number().int().min(1),
        h: z.number().int().min(1)
    }),
    config: z.record(z.any())
});
const CreateDashboardSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    widgets: z.array(DashboardWidgetSchema).min(1),
    refreshInterval: z.number().int().min(5).default(30)
});
const PerformanceAnalysisSchema = z.object({
    service: z.string().min(1),
    timeRange: z.string().min(1)
});
router.get('/metrics', async (req, res) => {
    try {
        const metrics = await advancedObservability.getMetrics();
        structuredLogger.info('Observability metrics requested', {
            endpoint: '/metrics',
            method: 'GET'
        });
        res.json({
            success: true,
            data: metrics,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get observability metrics', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get observability metrics',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/performance-analysis', async (req, res) => {
    try {
        const { service, timeRange } = PerformanceAnalysisSchema.parse(req.body);
        const analysis = await advancedObservability.getPerformanceAnalysis(service, timeRange);
        structuredLogger.info('Performance analysis requested', {
            endpoint: '/performance-analysis',
            method: 'POST',
            service,
            timeRange
        });
        res.json({
            success: true,
            data: analysis,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid performance analysis request', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to generate performance analysis', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate performance analysis',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/logs', async (req, res) => {
    try {
        const filters = LogFiltersSchema.parse(req.query);
        if (filters.startTime) {
            filters.startTime = new Date(filters.startTime);
        }
        if (filters.endTime) {
            filters.endTime = new Date(filters.endTime);
        }
        const logs = await advancedObservability.getLogs(filters);
        structuredLogger.info('Logs requested', {
            endpoint: '/logs',
            method: 'GET',
            filters,
            count: logs.length
        });
        res.json({
            success: true,
            data: logs,
            count: logs.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid logs request', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to get logs', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get logs',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/logs', async (req, res) => {
    try {
        const logData = CreateLogSchema.parse(req.body);
        const log = await advancedObservability.createLog(logData);
        structuredLogger.info('Log entry created', {
            endpoint: '/logs',
            method: 'POST',
            logId: log.id,
            level: log.level,
            service: log.service
        });
        res.status(201).json({
            success: true,
            data: log,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid log creation request', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create log entry', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create log entry',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/traces', async (req, res) => {
    try {
        const filters = TraceFiltersSchema.parse(req.query);
        if (filters.startTime) {
            filters.startTime = new Date(filters.startTime);
        }
        if (filters.endTime) {
            filters.endTime = new Date(filters.endTime);
        }
        const traces = await advancedObservability.getTraces(filters);
        structuredLogger.info('Traces requested', {
            endpoint: '/traces',
            method: 'GET',
            filters,
            count: traces.length
        });
        res.json({
            success: true,
            data: traces,
            count: traces.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid traces request', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to get traces', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get traces',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/traces', async (req, res) => {
    try {
        const traceData = CreateTraceSchema.parse(req.body);
        if (traceData.logs) {
            traceData.logs = traceData.logs.map(log => ({
                ...log,
                timestamp: new Date(log.timestamp)
            }));
        }
        const trace = await advancedObservability.createTrace(traceData);
        structuredLogger.info('Trace span created', {
            endpoint: '/traces',
            method: 'POST',
            traceId: trace.id,
            operationName: trace.operationName,
            service: trace.service
        });
        res.status(201).json({
            success: true,
            data: trace,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid trace creation request', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create trace span', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create trace span',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/alert-rules', async (req, res) => {
    try {
        const rules = await advancedObservability.getAlertRules();
        structuredLogger.info('Alert rules requested', {
            endpoint: '/alert-rules',
            method: 'GET',
            count: rules.length
        });
        res.json({
            success: true,
            data: rules,
            count: rules.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get alert rules', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get alert rules',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/alert-rules', async (req, res) => {
    try {
        const ruleData = CreateAlertRuleSchema.parse(req.body);
        const rule = await advancedObservability.createAlertRule(ruleData);
        structuredLogger.info('Alert rule created', {
            endpoint: '/alert-rules',
            method: 'POST',
            ruleId: rule.id,
            name: rule.name,
            severity: rule.severity
        });
        res.status(201).json({
            success: true,
            data: rule,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid alert rule creation request', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create alert rule', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create alert rule',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/alerts', async (req, res) => {
    try {
        const filters = AlertFiltersSchema.parse(req.query);
        const alerts = await advancedObservability.getAlerts(filters);
        structuredLogger.info('Alerts requested', {
            endpoint: '/alerts',
            method: 'GET',
            filters,
            count: alerts.length
        });
        res.json({
            success: true,
            data: alerts,
            count: alerts.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid alerts request', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request parameters',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to get alerts', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get alerts',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/dashboards', async (req, res) => {
    try {
        const dashboards = await advancedObservability.getDashboards();
        structuredLogger.info('Dashboards requested', {
            endpoint: '/dashboards',
            method: 'GET',
            count: dashboards.length
        });
        res.json({
            success: true,
            data: dashboards,
            count: dashboards.length,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get dashboards', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get dashboards',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.post('/dashboards', async (req, res) => {
    try {
        const dashboardData = CreateDashboardSchema.parse(req.body);
        const dashboard = await advancedObservability.createDashboard(dashboardData);
        structuredLogger.info('Dashboard created', {
            endpoint: '/dashboards',
            method: 'POST',
            dashboardId: dashboard.id,
            name: dashboard.name,
            widgets: dashboard.widgets.length
        });
        res.status(201).json({
            success: true,
            data: dashboard,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            structuredLogger.warn('Invalid dashboard creation request', { errors: error.errors });
            return res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: error.errors
            });
        }
        structuredLogger.error('Failed to create dashboard', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create dashboard',
            message: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
router.get('/health', async (req, res) => {
    try {
        const metrics = await advancedObservability.getMetrics();
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            metrics: {
                logs: metrics.logs,
                traces: metrics.traces,
                alerts: metrics.alerts,
                errors: metrics.errors
            },
            uptime: process.uptime()
        };
        structuredLogger.info('Observability health check', health);
        res.json(health);
    }
    catch (error) {
        structuredLogger.error('Observability health check failed', error);
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});
export default router;
//# sourceMappingURL=advanced-observability.js.map