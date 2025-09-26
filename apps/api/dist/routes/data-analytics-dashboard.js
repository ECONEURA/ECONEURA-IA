import { Router } from 'express';
import { z } from 'zod';

import { dataAnalyticsDashboard } from '../lib/data-analytics-dashboard.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
router.post('/dashboards', async (req, res) => {
    try {
        const organizationId = req.headers['x-org-id'] || 'demo-org';
        const CreateDashboardSchema = z.object({
            name: z.string().min(1).max(100),
            description: z.string().max(500).optional(),
            layout: z.object({
                columns: z.number().min(1).max(12).default(4),
                rows: z.number().min(1).max(20).default(10),
                responsive: z.boolean().default(true),
                theme: z.enum(['light', 'dark', 'auto']).default('auto')
            }),
            filters: z.array(z.object({
                field: z.string(),
                label: z.string(),
                type: z.enum(['select', 'multiselect', 'date', 'daterange', 'number', 'text']),
                options: z.array(z.string()).optional(),
                defaultValue: z.any().optional(),
                isRequired: z.boolean().default(false),
                validation: z.object({
                    min: z.number().optional(),
                    max: z.number().optional(),
                    pattern: z.string().optional()
                }).optional()
            })).default([]),
            permissions: z.object({
                isPublic: z.boolean().default(false),
                allowedUsers: z.array(z.string()).default([]),
                allowedRoles: z.array(z.string()).default([])
            }),
            tags: z.array(z.string()).default([])
        });
        const dashboardData = CreateDashboardSchema.parse(req.body);
        const dashboard = await dataAnalyticsDashboard.createDashboard(dashboardData, organizationId);
        structuredLogger.info('Dashboard created via API', {
            dashboardId: dashboard.id,
            name: dashboard.name,
            organizationId,
            requestId: req.headers['x-correlation-id'] || ''
        });
        res.status(201).json({
            success: true,
            data: dashboard,
            message: 'Dashboard created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create dashboard', error);
        res.status(400).json({
            success: false,
            error: 'Invalid dashboard data',
            details: error.message
        });
    }
});
router.get('/dashboards/:id', async (req, res) => {
    try {
        const dashboardId = req.params.id;
        const dashboard = await dataAnalyticsDashboard.getDashboard(dashboardId);
        if (!dashboard) {
            return res.status(404).json({
                success: false,
                error: 'Dashboard not found'
            });
        }
        res.json({
            success: true,
            data: dashboard
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get dashboard', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve dashboard'
        });
    }
});
router.get('/dashboards', async (req, res) => {
    try {
        const organizationId = req.headers['x-org-id'] || 'demo-org';
        const filters = {
            isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
            tags: req.query.tags ? req.query.tags.split(',') : undefined,
            isPublic: req.query.isPublic === 'true' ? true : req.query.isPublic === 'false' ? false : undefined
        };
        const dashboards = await dataAnalyticsDashboard.getDashboards(organizationId, filters);
        res.json({
            success: true,
            data: dashboards,
            meta: {
                count: dashboards.length,
                organizationId,
                filters
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get dashboards', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve dashboards'
        });
    }
});
router.put('/dashboards/:id', async (req, res) => {
    try {
        const dashboardId = req.params.id;
        const updates = req.body;
        const dashboard = await dataAnalyticsDashboard.updateDashboard(dashboardId, updates);
        if (!dashboard) {
            return res.status(404).json({
                success: false,
                error: 'Dashboard not found'
            });
        }
        structuredLogger.info('Dashboard updated via API', {
            dashboardId,
            changes: Object.keys(updates),
            requestId: req.headers['x-correlation-id'] || ''
        });
        res.json({
            success: true,
            data: dashboard,
            message: 'Dashboard updated successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update dashboard', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update dashboard'
        });
    }
});
router.delete('/dashboards/:id', async (req, res) => {
    try {
        const dashboardId = req.params.id;
        const deleted = await dataAnalyticsDashboard.deleteDashboard(dashboardId);
        if (!deleted) {
            return res.status(404).json({
                success: false,
                error: 'Dashboard not found'
            });
        }
        structuredLogger.info('Dashboard deleted via API', {
            dashboardId,
            requestId: req.headers['x-correlation-id'] || ''
        });
        res.json({
            success: true,
            message: 'Dashboard deleted successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to delete dashboard', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete dashboard'
        });
    }
});
router.post('/dashboards/:id/widgets', async (req, res) => {
    try {
        const dashboardId = req.params.id;
        const CreateWidgetSchema = z.object({
            type: z.enum(['chart', 'metric', 'table', 'gauge', 'map', 'heatmap', 'trend']),
            title: z.string().min(1).max(100),
            description: z.string().max(500).optional(),
            dataSource: z.string(),
            configuration: z.object({
                chartType: z.enum(['line', 'bar', 'pie', 'area', 'scatter', 'doughnut']).optional(),
                metrics: z.array(z.string()),
                dimensions: z.array(z.string()).optional(),
                filters: z.record(z.any()).optional(),
                timeRange: z.string().optional(),
                refreshInterval: z.number().optional(),
                colors: z.array(z.string()).optional(),
                showLegend: z.boolean().optional(),
                showDataLabels: z.boolean().optional(),
                yAxisLabel: z.string().optional(),
                xAxisLabel: z.string().optional()
            }),
            position: z.object({
                x: z.number().min(0),
                y: z.number().min(0),
                width: z.number().min(1).max(12),
                height: z.number().min(1).max(20)
            }),
            isVisible: z.boolean().default(true),
            isEditable: z.boolean().default(true)
        });
        const widgetData = CreateWidgetSchema.parse(req.body);
        const widget = await dataAnalyticsDashboard.addWidget(dashboardId, widgetData);
        if (!widget) {
            return res.status(404).json({
                success: false,
                error: 'Dashboard not found'
            });
        }
        structuredLogger.info('Widget added to dashboard via API', {
            dashboardId,
            widgetId: widget.id,
            widgetType: widget.type,
            requestId: req.headers['x-correlation-id'] || ''
        });
        res.status(201).json({
            success: true,
            data: widget,
            message: 'Widget added successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to add widget', error);
        res.status(400).json({
            success: false,
            error: 'Invalid widget data',
            details: error.message
        });
    }
});
router.put('/dashboards/:dashboardId/widgets/:widgetId', async (req, res) => {
    try {
        const { dashboardId, widgetId } = req.params;
        const updates = req.body;
        const widget = await dataAnalyticsDashboard.updateWidget(dashboardId, widgetId, updates);
        if (!widget) {
            return res.status(404).json({
                success: false,
                error: 'Widget or dashboard not found'
            });
        }
        structuredLogger.info('Widget updated via API', {
            dashboardId,
            widgetId,
            changes: Object.keys(updates),
            requestId: req.headers['x-correlation-id'] || ''
        });
        res.json({
            success: true,
            data: widget,
            message: 'Widget updated successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to update widget', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update widget'
        });
    }
});
router.delete('/dashboards/:dashboardId/widgets/:widgetId', async (req, res) => {
    try {
        const { dashboardId, widgetId } = req.params;
        const removed = await dataAnalyticsDashboard.removeWidget(dashboardId, widgetId);
        if (!removed) {
            return res.status(404).json({
                success: false,
                error: 'Widget or dashboard not found'
            });
        }
        structuredLogger.info('Widget removed from dashboard via API', {
            dashboardId,
            widgetId,
            requestId: req.headers['x-correlation-id'] || ''
        });
        res.json({
            success: true,
            message: 'Widget removed successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to remove widget', error);
        res.status(500).json({
            success: false,
            error: 'Failed to remove widget'
        });
    }
});
router.get('/dashboards/:dashboardId/widgets/:widgetId/data', async (req, res) => {
    try {
        const { dashboardId, widgetId } = req.params;
        const organizationId = req.headers['x-org-id'] || 'demo-org';
        const dashboard = await dataAnalyticsDashboard.getDashboard(dashboardId);
        if (!dashboard) {
            return res.status(404).json({
                success: false,
                error: 'Dashboard not found'
            });
        }
        const widget = dashboard.widgets.find(w => w.id === widgetId);
        if (!widget) {
            return res.status(404).json({
                success: false,
                error: 'Widget not found'
            });
        }
        const data = await dataAnalyticsDashboard.getWidgetData(widget, organizationId);
        res.json({
            success: true,
            data,
            meta: {
                widgetId,
                widgetType: widget.type,
                organizationId,
                generatedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get widget data', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve widget data'
        });
    }
});
router.get('/analytics', async (req, res) => {
    try {
        const organizationId = req.headers['x-org-id'] || 'demo-org';
        const filters = {
            timeRange: req.query.timeRange,
            metrics: req.query.metrics ? req.query.metrics.split(',') : undefined,
            dimensions: req.query.dimensions ? req.query.dimensions.split(',') : undefined
        };
        const data = await dataAnalyticsDashboard.getAnalyticsData(organizationId, filters);
        res.json({
            success: true,
            data,
            meta: {
                organizationId,
                filters,
                generatedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get analytics data', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve analytics data'
        });
    }
});
router.post('/reports', async (req, res) => {
    try {
        const organizationId = req.headers['x-org-id'] || 'demo-org';
        const { name, description, type, filters } = req.body;
        if (!name || !type) {
            return res.status(400).json({
                success: false,
                error: 'Name and type are required'
            });
        }
        const report = await dataAnalyticsDashboard.createReport(name, description || '', type, organizationId, filters);
        structuredLogger.info('Report created via API', {
            reportId: report.id,
            name: report.name,
            type: report.type,
            organizationId,
            requestId: req.headers['x-correlation-id'] || ''
        });
        res.status(201).json({
            success: true,
            data: report,
            message: 'Report created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create report', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create report'
        });
    }
});
router.get('/reports', async (req, res) => {
    try {
        const organizationId = req.headers['x-org-id'] || 'demo-org';
        const reports = await dataAnalyticsDashboard.getReports(organizationId);
        res.json({
            success: true,
            data: reports,
            meta: {
                count: reports.length,
                organizationId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get reports', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve reports'
        });
    }
});
router.get('/reports/:id/export', async (req, res) => {
    try {
        const reportId = req.params.id;
        const format = req.query.format || 'json';
        const data = await dataAnalyticsDashboard.exportReport(reportId, format);
        const contentType = format === 'csv' ? 'text/csv' :
            format === 'pdf' ? 'application/pdf' : 'application/json';
        const filename = `report-${reportId}-${new Date().toISOString().split('T')[0]}.${format}`;
        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(data);
    }
    catch (error) {
        structuredLogger.error('Failed to export report', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export report'
        });
    }
});
router.post('/alerts', async (req, res) => {
    try {
        const organizationId = req.headers['x-org-id'] || 'demo-org';
        const CreateAlertSchema = z.object({
            name: z.string().min(1).max(100),
            description: z.string().max(500).optional(),
            metric: z.string(),
            condition: z.object({
                operator: z.enum(['greater_than', 'less_than', 'equals', 'not_equals', 'contains']),
                value: z.union([z.number(), z.string()]),
                threshold: z.number()
            }),
            severity: z.enum(['low', 'medium', 'high', 'critical']),
            recipients: z.array(z.string())
        });
        const alertData = CreateAlertSchema.parse(req.body);
        const alert = await dataAnalyticsDashboard.createAlert(alertData, organizationId);
        structuredLogger.info('Alert created via API', {
            alertId: alert.id,
            name: alert.name,
            metric: alert.metric,
            organizationId,
            requestId: req.headers['x-correlation-id'] || ''
        });
        res.status(201).json({
            success: true,
            data: alert,
            message: 'Alert created successfully'
        });
    }
    catch (error) {
        structuredLogger.error('Failed to create alert', error);
        res.status(400).json({
            success: false,
            error: 'Invalid alert data',
            details: error.message
        });
    }
});
router.get('/alerts', async (req, res) => {
    try {
        const organizationId = req.headers['x-org-id'] || 'demo-org';
        const alerts = await dataAnalyticsDashboard.getAlerts(organizationId);
        res.json({
            success: true,
            data: alerts,
            meta: {
                count: alerts.length,
                organizationId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get alerts', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve alerts'
        });
    }
});
router.post('/alerts/check', async (req, res) => {
    try {
        const organizationId = req.headers['x-org-id'] || 'demo-org';
        const triggeredAlerts = await dataAnalyticsDashboard.checkAlerts(organizationId);
        structuredLogger.info('Alerts checked via API', {
            organizationId,
            triggeredCount: triggeredAlerts.length,
            requestId: req.headers['x-correlation-id'] || ''
        });
        res.json({
            success: true,
            data: triggeredAlerts,
            meta: {
                triggeredCount: triggeredAlerts.length,
                organizationId,
                checkedAt: new Date().toISOString()
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to check alerts', error);
        res.status(500).json({
            success: false,
            error: 'Failed to check alerts'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await dataAnalyticsDashboard.getServiceStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get service stats', error);
        res.status(500).json({
            success: false,
            error: 'Failed to retrieve service statistics'
        });
    }
});
export default router;
//# sourceMappingURL=data-analytics-dashboard.js.map