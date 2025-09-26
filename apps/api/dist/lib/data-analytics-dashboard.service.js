import { z } from 'zod';

import { structuredLogger } from './structured-logger.js';
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
export class DataAnalyticsDashboardService {
    dashboards = new Map();
    reports = new Map();
    alerts = new Map();
    demoData;
    constructor() {
        this.initializeDemoData();
        this.createDefaultDashboards();
    }
    async createDashboard(data, organizationId) {
        const dashboard = {
            id: this.generateId(),
            name: data.name,
            description: data.description || '',
            widgets: [],
            layout: data.layout,
            filters: data.filters.map((filter, index) => ({
                id: this.generateId(),
                ...filter
            })),
            permissions: data.permissions,
            organizationId,
            tags: data.tags,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.dashboards.set(dashboard.id, dashboard);
        structuredLogger.info('Dashboard created', {
            dashboardId: dashboard.id,
            name: dashboard.name,
            organizationId,
            requestId: ''
        });
        return dashboard;
    }
    async getDashboard(dashboardId) {
        return this.dashboards.get(dashboardId) || null;
    }
    async getDashboards(organizationId, filters) {
        let dashboards = Array.from(this.dashboards.values())
            .filter(d => d.organizationId === organizationId);
        if (filters) {
            if (filters.isActive !== undefined) {
                dashboards = dashboards.filter(d => d.isActive === filters.isActive);
            }
            if (filters.tags && filters.tags.length > 0) {
                dashboards = dashboards.filter(d => filters.tags.some(tag => d.tags.includes(tag)));
            }
            if (filters.isPublic !== undefined) {
                dashboards = dashboards.filter(d => d.permissions.isPublic === filters.isPublic);
            }
        }
        return dashboards;
    }
    async updateDashboard(dashboardId, updates) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard)
            return null;
        const updatedDashboard = {
            ...dashboard,
            ...updates,
            updatedAt: new Date()
        };
        this.dashboards.set(dashboardId, updatedDashboard);
        structuredLogger.info('Dashboard updated', {
            dashboardId,
            changes: Object.keys(updates),
            requestId: ''
        });
        return updatedDashboard;
    }
    async deleteDashboard(dashboardId) {
        const deleted = this.dashboards.delete(dashboardId);
        if (deleted) {
            structuredLogger.info('Dashboard deleted', {
                dashboardId,
                requestId: ''
            });
        }
        return deleted;
    }
    async addWidget(dashboardId, data) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard)
            return null;
        const widget = {
            id: this.generateId(),
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        dashboard.widgets.push(widget);
        dashboard.updatedAt = new Date();
        this.dashboards.set(dashboardId, dashboard);
        structuredLogger.info('Widget added to dashboard', {
            dashboardId,
            widgetId: widget.id,
            widgetType: widget.type,
            requestId: ''
        });
        return widget;
    }
    async updateWidget(dashboardId, widgetId, updates) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard)
            return null;
        const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
        if (widgetIndex === -1)
            return null;
        const updatedWidget = {
            ...dashboard.widgets[widgetIndex],
            ...updates,
            updatedAt: new Date()
        };
        dashboard.widgets[widgetIndex] = updatedWidget;
        dashboard.updatedAt = new Date();
        this.dashboards.set(dashboardId, dashboard);
        structuredLogger.info('Widget updated', {
            dashboardId,
            widgetId,
            changes: Object.keys(updates),
            requestId: ''
        });
        return updatedWidget;
    }
    async removeWidget(dashboardId, widgetId) {
        const dashboard = this.dashboards.get(dashboardId);
        if (!dashboard)
            return false;
        const initialLength = dashboard.widgets.length;
        dashboard.widgets = dashboard.widgets.filter(w => w.id !== widgetId);
        dashboard.updatedAt = new Date();
        if (dashboard.widgets.length < initialLength) {
            this.dashboards.set(dashboardId, dashboard);
            structuredLogger.info('Widget removed from dashboard', {
                dashboardId,
                widgetId,
                requestId: ''
            });
            return true;
        }
        return false;
    }
    async getAnalyticsData(organizationId, filters) {
        const data = { ...this.demoData };
        if (filters?.timeRange) {
            data.trends = this.filterTrendsByTimeRange(data.trends ?? { users: [], sessions: [], revenue: [], conversions: [] }, filters.timeRange);
        }
        if (filters?.metrics && filters.metrics.length > 0) {
            data.metrics = this.filterMetrics(data.metrics ?? { totalUsers: 0, activeUsers: 0, totalSessions: 0, averageSessionDuration: 0, bounceRate: 0, conversionRate: 0, revenue: 0, costPerAcquisition: 0, returnOnInvestment: 0 }, filters.metrics);
        }
        structuredLogger.info('Analytics data retrieved', {
            organizationId,
            filters,
            requestId: ''
        });
        return {
            ...data,
            metrics: data.metrics ?? { totalUsers: 0, activeUsers: 0, totalSessions: 0, averageSessionDuration: 0, bounceRate: 0, conversionRate: 0, revenue: 0, costPerAcquisition: 0, returnOnInvestment: 0 },
            trends: data.trends ?? { users: [], sessions: [], revenue: [], conversions: [] },
            topPages: data.topPages ?? [],
            trafficSources: data.trafficSources ?? [],
            deviceBreakdown: data.deviceBreakdown ?? [],
            geographicData: data.geographicData ?? [],
            realTimeData: data.realTimeData ?? { activeUsers: 0, currentSessions: 0, topPages: [], topReferrers: [] }
        };
    }
    async getWidgetData(widget, organizationId) {
        const analyticsData = await this.getAnalyticsData(organizationId, {
            timeRange: widget.configuration.timeRange,
            metrics: widget.configuration.metrics,
            dimensions: widget.configuration.dimensions
        });
        switch (widget.type) {
            case 'chart':
                return this.generateChartData(widget, analyticsData);
            case 'metric':
                return this.generateMetricData(widget, analyticsData);
            case 'table':
                return this.generateTableData(widget, analyticsData);
            case 'gauge':
                return this.generateGaugeData(widget, analyticsData);
            case 'trend':
                return this.generateTrendData(widget, analyticsData);
            default:
                return {};
        }
    }
    async createReport(name, description, type, organizationId, filters) {
        const report = {
            id: this.generateId(),
            name,
            description,
            type,
            data: await this.getAnalyticsData(organizationId, filters),
            filters: filters || {},
            timeRange: {
                start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
                end: new Date()
            },
            organizationId,
            isScheduled: false,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.reports.set(report.id, report);
        structuredLogger.info('Report created', {
            reportId: report.id,
            name: report.name,
            type: report.type,
            organizationId,
            requestId: ''
        });
        return report;
    }
    async getReports(organizationId) {
        return Array.from(this.reports.values())
            .filter(r => r.organizationId === organizationId);
    }
    async exportReport(reportId, format) {
        const report = this.reports.get(reportId);
        if (!report)
            throw new Error('Report not found');
        switch (format) {
            case 'json':
                return JSON.stringify(report, null, 2);
            case 'csv':
                return this.convertToCSV(report.data);
            case 'pdf':
                return this.convertToPDF(report);
            default:
                throw new Error('Unsupported format');
        }
    }
    async createAlert(data, organizationId) {
        const alert = {
            id: this.generateId(),
            ...data,
            description: typeof data.description === 'string' ? data.description : '',
            isActive: true,
            organizationId,
            triggerCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.alerts.set(alert.id, alert);
        structuredLogger.info('Alert created', {
            alertId: alert.id,
            name: alert.name,
            metric: alert.metric,
            organizationId,
            requestId: ''
        });
        return alert;
    }
    async getAlerts(organizationId) {
        return Array.from(this.alerts.values())
            .filter(a => a.organizationId === organizationId);
    }
    async checkAlerts(organizationId) {
        const triggeredAlerts = [];
        const analyticsData = await this.getAnalyticsData(organizationId);
        for (const alert of this.alerts.values()) {
            if (!alert.isActive || alert.organizationId !== organizationId)
                continue;
            const metricValue = this.getMetricValue(analyticsData, alert.metric);
            const isTriggered = this.evaluateCondition(metricValue, alert.condition);
            if (isTriggered) {
                alert.lastTriggered = new Date();
                alert.triggerCount++;
                alert.updatedAt = new Date();
                this.alerts.set(alert.id, alert);
                triggeredAlerts.push(alert);
                structuredLogger.warn('Alert triggered', {
                    alertId: alert.id,
                    name: alert.name,
                    metric: alert.metric,
                    value: metricValue,
                    condition: alert.condition,
                    organizationId,
                    requestId: ''
                });
            }
        }
        return triggeredAlerts;
    }
    generateId() {
        return `data_analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    initializeDemoData() {
        this.demoData = {
            metrics: {
                totalUsers: 15420,
                activeUsers: 8930,
                totalSessions: 23450,
                averageSessionDuration: 4.2,
                bounceRate: 0.35,
                conversionRate: 0.12,
                revenue: 125000,
                costPerAcquisition: 25.50,
                returnOnInvestment: 3.2
            },
            trends: {
                users: this.generateTrendData('users', 30),
                sessions: this.generateTrendData('sessions', 30),
                revenue: this.generateTrendData('revenue', 30),
                conversions: this.generateTrendData('conversions', 30)
            },
            topPages: [
                { page: '/dashboard', views: 15420, uniqueViews: 8930, bounceRate: 0.25, avgTimeOnPage: 3.5 },
                { page: '/analytics', views: 12300, uniqueViews: 7200, bounceRate: 0.30, avgTimeOnPage: 4.2 },
                { page: '/reports', views: 9800, uniqueViews: 5600, bounceRate: 0.40, avgTimeOnPage: 2.8 },
                { page: '/settings', views: 7200, uniqueViews: 4200, bounceRate: 0.35, avgTimeOnPage: 3.1 }
            ],
            trafficSources: [
                { source: 'Direct', visits: 8500, percentage: 36.2, conversionRate: 0.15 },
                { source: 'Google', visits: 7200, percentage: 30.7, conversionRate: 0.12 },
                { source: 'Social Media', visits: 4200, percentage: 17.9, conversionRate: 0.08 },
                { source: 'Email', visits: 2800, percentage: 11.9, conversionRate: 0.18 },
                { source: 'Referral', visits: 800, percentage: 3.4, conversionRate: 0.10 }
            ],
            deviceBreakdown: [
                { device: 'Desktop', percentage: 65.2, sessions: 15290 },
                { device: 'Mobile', percentage: 28.7, sessions: 6730 },
                { device: 'Tablet', percentage: 6.1, sessions: 1430 }
            ],
            geographicData: [
                { country: 'Spain', region: 'Madrid', visits: 8500, percentage: 36.2 },
                { country: 'Spain', region: 'Barcelona', visits: 6200, percentage: 26.4 },
                { country: 'Spain', region: 'Valencia', visits: 3200, percentage: 13.6 },
                { country: 'France', region: 'Paris', visits: 2800, percentage: 11.9 },
                { country: 'Italy', region: 'Milan', visits: 1800, percentage: 7.7 },
                { country: 'Germany', region: 'Berlin', visits: 1000, percentage: 4.3 }
            ],
            realTimeData: {
                activeUsers: 245,
                currentSessions: 189,
                topPages: [
                    { page: '/dashboard', activeUsers: 89 },
                    { page: '/analytics', activeUsers: 67 },
                    { page: '/reports', activeUsers: 45 },
                    { page: '/settings', activeUsers: 28 }
                ],
                topReferrers: [
                    { referrer: 'google.com', visits: 45 },
                    { referrer: 'facebook.com', visits: 32 },
                    { referrer: 'linkedin.com', visits: 28 },
                    { referrer: 'twitter.com', visits: 19 }
                ]
            }
        };
    }
    generateTrendData(typeOrWidget, daysOrData) {
        if (typeof typeOrWidget === 'string' && typeof daysOrData === 'number') {
            const type = typeOrWidget;
            const days = daysOrData;
            const data = [];
            const baseValue = type === 'revenue' ? 3000 : type === 'conversions' ? 150 : type === 'sessions' ? 800 : 500;
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const variation = (Math.random() - 0.5) * 0.3;
                const value = Math.max(0, baseValue * (1 + variation));
                data.push({
                    date: date.toISOString().split('T')[0],
                    value: Math.round(value)
                });
            }
            return data;
        }
        if (typeof typeOrWidget === 'object' && typeof daysOrData === 'object') {
            const widget = typeOrWidget;
            const data = daysOrData;
            const metrics = widget.configuration.metrics;
            if (metrics.includes('users')) {
                return {
                    current: data.metrics.totalUsers,
                    previous: Math.round(data.metrics.totalUsers * 0.95),
                    change: 5.2,
                    trend: 'up',
                    data: data.trends.users.slice(-7)
                };
            }
            return { current: 0, previous: 0, change: 0, trend: 'stable', data: [] };
        }
        return null;
    }
    createDefaultDashboards() {
        const mainDashboard = {
            id: 'main-analytics-dashboard',
            name: 'Analytics Principal',
            description: 'Dashboard principal con métricas clave de analytics',
            widgets: [
                {
                    id: 'total-users-widget',
                    type: 'metric',
                    title: 'Total Usuarios',
                    dataSource: 'analytics',
                    configuration: {
                        metrics: ['totalUsers'],
                        timeRange: '30d'
                    },
                    position: { x: 0, y: 0, width: 3, height: 2 },
                    isVisible: true,
                    isEditable: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'users-trend-widget',
                    type: 'chart',
                    title: 'Tendencia de Usuarios',
                    dataSource: 'analytics',
                    configuration: {
                        chartType: 'line',
                        metrics: ['users'],
                        timeRange: '30d',
                        showLegend: true
                    },
                    position: { x: 3, y: 0, width: 6, height: 4 },
                    isVisible: true,
                    isEditable: true,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ],
            layout: {
                columns: 12,
                rows: 10,
                responsive: true,
                theme: 'auto'
            },
            filters: [],
            permissions: {
                isPublic: false,
                allowedUsers: [],
                allowedRoles: ['admin', 'analyst']
            },
            organizationId: 'demo-org',
            tags: ['analytics', 'main'],
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.dashboards.set(mainDashboard.id, mainDashboard);
    }
    filterTrendsByTimeRange(trends, timeRange) {
        const days = timeRange === '1h' ? 1 : timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
        return {
            users: trends.users.slice(-days),
            sessions: trends.sessions.slice(-days),
            revenue: trends.revenue.slice(-days),
            conversions: trends.conversions.slice(-days)
        };
    }
    filterMetrics(metrics, allowedMetrics) {
        const filtered = {};
        for (const metric of allowedMetrics) {
            if (metric in metrics) {
                filtered[metric] = metrics[metric];
            }
        }
        return filtered;
    }
    generateChartData(widget, data) {
        const chartType = widget.configuration.chartType || 'line';
        const metrics = widget.configuration.metrics;
        if (chartType === 'line' && metrics.includes('users')) {
            return {
                labels: data.trends.users.map(d => d.date),
                datasets: [{
                        label: 'Usuarios',
                        data: data.trends.users.map(d => d.value),
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.4
                    }]
            };
        }
        if (chartType === 'pie' && metrics.includes('trafficSources')) {
            return {
                labels: data.trafficSources.map(s => s.source),
                datasets: [{
                        data: data.trafficSources.map(s => s.visits),
                        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
                    }]
            };
        }
        return { labels: [], datasets: [] };
    }
    generateMetricData(widget, data) {
        const metrics = widget.configuration.metrics;
        const metric = metrics[0];
        return {
            value: data.metrics[metric] || 0,
            label: widget.title,
            change: Math.random() * 20 - 10,
            trend: Math.random() > 0.5 ? 'up' : 'down'
        };
    }
    generateTableData(widget, data) {
        if (widget.configuration.metrics.includes('topPages')) {
            return {
                columns: ['Página', 'Vistas', 'Vistas Únicas', 'Tasa de Rebote', 'Tiempo Promedio'],
                rows: data.topPages.map(page => [
                    page.page,
                    page.views,
                    page.uniqueViews,
                    `${(page.bounceRate * 100).toFixed(1)}%`,
                    `${page.avgTimeOnPage.toFixed(1)}s`
                ])
            };
        }
        return { columns: [], rows: [] };
    }
    generateGaugeData(widget, data) {
        const metrics = widget.configuration.metrics;
        const metric = metrics[0];
        const value = data.metrics[metric] || 0;
        return {
            value,
            min: 0,
            max: value * 2,
            label: widget.title,
            color: value > (value * 2 * 0.8) ? '#10B981' : value > (value * 2 * 0.6) ? '#F59E0B' : '#EF4444'
        };
    }
    convertToCSV(data) {
        const headers = ['Metric', 'Value'];
        const rows = [
            ['Total Users', data.metrics.totalUsers],
            ['Active Users', data.metrics.activeUsers],
            ['Total Sessions', data.metrics.totalSessions],
            ['Average Session Duration', data.metrics.averageSessionDuration],
            ['Bounce Rate', data.metrics.bounceRate],
            ['Conversion Rate', data.metrics.conversionRate],
            ['Revenue', data.metrics.revenue],
            ['Cost Per Acquisition', data.metrics.costPerAcquisition],
            ['Return On Investment', data.metrics.returnOnInvestment]
        ];
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
    convertToPDF(report) {
        return `PDF Report: ${report.name} - Generated at ${new Date().toISOString()}`;
    }
    getMetricValue(data, metric) {
        return data.metrics[metric] || 0;
    }
    evaluateCondition(value, condition) {
        switch (condition.operator) {
            case 'greater_than':
                return value > condition.threshold;
            case 'less_than':
                return value < condition.threshold;
            case 'equals':
                return value === condition.threshold;
            case 'not_equals':
                return value !== condition.threshold;
            default:
                return false;
        }
    }
    async getServiceStats() {
        return {
            dashboards: this.dashboards.size,
            reports: this.reports.size,
            alerts: this.alerts.size,
            activeAlerts: Array.from(this.alerts.values()).filter(a => a.isActive).length
        };
    }
}
export const dataAnalyticsDashboard = new DataAnalyticsDashboardService();
//# sourceMappingURL=data-analytics-dashboard.service.js.map