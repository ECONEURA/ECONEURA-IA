/**
 * DATA ANALYTICS DASHBOARD SERVICE
 * 
 * PR-36: Sistema completo de analytics y dashboards de datos
 * 
 * Funcionalidades:
 * - Dashboard de analytics en tiempo real
 * - Visualizaciones interactivas
 * - Análisis de tendencias
 * - Métricas de negocio
 * - Reportes personalizables
 * - Exportación de datos
 * - Alertas inteligentes
 */

import { z } from 'zod';
import { structuredLogger } from './structured-logger.js';
import { analyticsConsolidated } from './analytics-consolidated.service.js';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface DashboardWidget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'gauge' | 'map' | 'heatmap' | 'trend';
  title: string;
  description?: string;
  dataSource: string;
  configuration: {
    chartType?: 'line' | 'bar' | 'pie' | 'area' | 'scatter' | 'doughnut';
    metrics: string[];
    dimensions?: string[];
    filters?: Record<string, any>;
    timeRange?: string;
    refreshInterval?: number;
    colors?: string[];
    showLegend?: boolean;
    showDataLabels?: boolean;
    yAxisLabel?: string;
    xAxisLabel?: string;
  };
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isVisible: boolean;
  isEditable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: {
    columns: number;
    rows: number;
    responsive: boolean;
    theme: 'light' | 'dark' | 'auto';
  };
  filters: DashboardFilter[];
  permissions: {
    isPublic: boolean;
    allowedUsers: string[];
    allowedRoles: string[];
  };
  organizationId: string;
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardFilter {
  id: string;
  field: string;
  label: string;
  type: 'select' | 'multiselect' | 'date' | 'daterange' | 'number' | 'text';
  options?: string[];
  defaultValue?: any;
  isRequired: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export interface AnalyticsData {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalSessions: number;
    averageSessionDuration: number;
    bounceRate: number;
    conversionRate: number;
    revenue: number;
    costPerAcquisition: number;
    returnOnInvestment: number;
  };
  trends: {
    users: Array<{ date: string; value: number }>;
    sessions: Array<{ date: string; value: number }>;
    revenue: Array<{ date: string; value: number }>;
    conversions: Array<{ date: string; value: number }>;
  };
  topPages: Array<{
    page: string;
    views: number;
    uniqueViews: number;
    bounceRate: number;
    avgTimeOnPage: number;
  }>;
  trafficSources: Array<{
    source: string;
    visits: number;
    percentage: number;
    conversionRate: number;
  }>;
  deviceBreakdown: Array<{
    device: string;
    percentage: number;
    sessions: number;
  }>;
  geographicData: Array<{
    country: string;
    region: string;
    visits: number;
    percentage: number;
  }>;
  realTimeData: {
    activeUsers: number;
    currentSessions: number;
    topPages: Array<{ page: string; activeUsers: number }>;
    topReferrers: Array<{ referrer: string; visits: number }>;
  };
}

export interface Report {
  id: string;
  name: string;
  description: string;
  type: 'analytics' | 'performance' | 'business' | 'custom';
  data: AnalyticsData;
  filters: Record<string, any>;
  timeRange: {
    start: Date;
    end: Date;
  };
  organizationId: string;
  isScheduled: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Alert {
  id: string;
  name: string;
  description: string;
  metric: string;
  condition: {
    operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains';
    value: number | string;
    threshold: number;
  };
  isActive: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recipients: string[];
  organizationId: string;
  lastTriggered?: Date;
  triggerCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

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

// ============================================================================
// DATA ANALYTICS DASHBOARD SERVICE
// ============================================================================

export class DataAnalyticsDashboardService {
  private dashboards: Map<string, Dashboard> = new Map();
  private reports: Map<string, Report> = new Map();
  private alerts: Map<string, Alert> = new Map();
  private demoData: AnalyticsData;

  constructor() {
    this.initializeDemoData();
    this.createDefaultDashboards();
  }

  // ============================================================================
  // DASHBOARD MANAGEMENT
  // ============================================================================

  async createDashboard(data: z.infer<typeof CreateDashboardSchema>, organizationId: string): Promise<Dashboard> {
    const dashboard: Dashboard = {
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

  async getDashboard(dashboardId: string): Promise<Dashboard | null> {
    return this.dashboards.get(dashboardId) || null;
  }

  async getDashboards(organizationId: string, filters?: {
    isActive?: boolean;
    tags?: string[];
    isPublic?: boolean;
  }): Promise<Dashboard[]> {
    let dashboards = Array.from(this.dashboards.values())
      .filter(d => d.organizationId === organizationId);

    if (filters) {
      if (filters.isActive !== undefined) {
        dashboards = dashboards.filter(d => d.isActive === filters.isActive);
      }
      if (filters.tags && filters.tags.length > 0) {
        dashboards = dashboards.filter(d => 
          filters.tags!.some(tag => d.tags.includes(tag))
        );
      }
      if (filters.isPublic !== undefined) {
        dashboards = dashboards.filter(d => d.permissions.isPublic === filters.isPublic);
      }
    }

    return dashboards;
  }

  async updateDashboard(dashboardId: string, updates: Partial<Dashboard>): Promise<Dashboard | null> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const updatedDashboard: Dashboard = {
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

  async deleteDashboard(dashboardId: string): Promise<boolean> {
    const deleted = this.dashboards.delete(dashboardId);

    if (deleted) {
      structuredLogger.info('Dashboard deleted', {
        dashboardId,
        requestId: ''
      });
    }

    return deleted;
  }

  // ============================================================================
  // WIDGET MANAGEMENT
  // ============================================================================

  async addWidget(dashboardId: string, data: z.infer<typeof CreateWidgetSchema>): Promise<DashboardWidget | null> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const widget: DashboardWidget = {
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

  async updateWidget(dashboardId: string, widgetId: string, updates: Partial<DashboardWidget>): Promise<DashboardWidget | null> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const widgetIndex = dashboard.widgets.findIndex(w => w.id === widgetId);
    if (widgetIndex === -1) return null;

    const updatedWidget: DashboardWidget = {
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

  async removeWidget(dashboardId: string, widgetId: string): Promise<boolean> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return false;

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

  // ============================================================================
  // ANALYTICS DATA
  // ============================================================================

  async getAnalyticsData(organizationId: string, filters?: {
    timeRange?: string;
    metrics?: string[];
    dimensions?: string[];
  }): Promise<AnalyticsData> {
    // En un sistema real, esto consultaría la base de datos
    // Por ahora, devolvemos datos demo con algunas variaciones
    const data = { ...this.demoData };

    // Aplicar filtros de tiempo
    if (filters?.timeRange) {
      data.trends = this.filterTrendsByTimeRange(data.trends, filters.timeRange);
    }

    // Aplicar filtros de métricas
    if (filters?.metrics && filters.metrics.length > 0) {
      data.metrics = this.filterMetrics(data.metrics, filters.metrics);
    }

    structuredLogger.info('Analytics data retrieved', {
      organizationId,
      filters,
      requestId: ''
    });

    return data;
  }

  async getWidgetData(widget: DashboardWidget, organizationId: string): Promise<any> {
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

  // ============================================================================
  // REPORTS
  // ============================================================================

  async createReport(name: string, description: string, type: Report['type'], 
                    organizationId: string, filters?: Record<string, any>): Promise<Report> {
    const report: Report = {
      id: this.generateId(),
      name,
      description,
      type,
      data: await this.getAnalyticsData(organizationId, filters),
      filters: filters || {},
      timeRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
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

  async getReports(organizationId: string): Promise<Report[]> {
    return Array.from(this.reports.values())
      .filter(r => r.organizationId === organizationId);
  }

  async exportReport(reportId: string, format: 'json' | 'csv' | 'pdf'): Promise<string> {
    const report = this.reports.get(reportId);
    if (!report) throw new Error('Report not found');

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

  // ============================================================================
  // ALERTS
  // ============================================================================

  async createAlert(data: z.infer<typeof CreateAlertSchema>, organizationId: string): Promise<Alert> {
    const alert: Alert = {
      id: this.generateId(),
      ...data,
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

  async getAlerts(organizationId: string): Promise<Alert[]> {
    return Array.from(this.alerts.values())
      .filter(a => a.organizationId === organizationId);
  }

  async checkAlerts(organizationId: string): Promise<Alert[]> {
    const triggeredAlerts: Alert[] = [];
    const analyticsData = await this.getAnalyticsData(organizationId);

    for (const alert of this.alerts.values()) {
      if (!alert.isActive || alert.organizationId !== organizationId) continue;

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

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateId(): string {
    return `data_analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeDemoData(): void {
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

  private generateTrendData(type: string, days: number): Array<{ date: string; value: number }> {
    const data = [];
    const baseValue = type === 'revenue' ? 3000 : type === 'conversions' ? 150 : type === 'sessions' ? 800 : 500;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
      const value = Math.max(0, baseValue * (1 + variation));
      
      data.push({
        date: date.toISOString().split('T')[0],
        value: Math.round(value)
      });
    }
    
    return data;
  }

  private createDefaultDashboards(): void {
    // Dashboard principal de analytics
    const mainDashboard: Dashboard = {
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

  private filterTrendsByTimeRange(trends: AnalyticsData['trends'], timeRange: string): AnalyticsData['trends'] {
    const days = timeRange === '1h' ? 1 : timeRange === '24h' ? 1 : timeRange === '7d' ? 7 : 30;
    
    return {
      users: trends.users.slice(-days),
      sessions: trends.sessions.slice(-days),
      revenue: trends.revenue.slice(-days),
      conversions: trends.conversions.slice(-days)
    };
  }

  private filterMetrics(metrics: AnalyticsData['metrics'], allowedMetrics: string[]): AnalyticsData['metrics'] {
    const filtered: Partial<AnalyticsData['metrics']> = {};
    
    for (const metric of allowedMetrics) {
      if (metric in metrics) {
        (filtered as any)[metric] = (metrics as any)[metric];
      }
    }
    
    return filtered as AnalyticsData['metrics'];
  }

  private generateChartData(widget: DashboardWidget, data: AnalyticsData): any {
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

  private generateMetricData(widget: DashboardWidget, data: AnalyticsData): any {
    const metrics = widget.configuration.metrics;
    const metric = metrics[0];
    
    return {
      value: (data.metrics as any)[metric] || 0,
      label: widget.title,
      change: Math.random() * 20 - 10, // ±10% change
      trend: Math.random() > 0.5 ? 'up' : 'down'
    };
  }

  private generateTableData(widget: DashboardWidget, data: AnalyticsData): any {
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

  private generateGaugeData(widget: DashboardWidget, data: AnalyticsData): any {
    const metrics = widget.configuration.metrics;
    const metric = metrics[0];
    const value = (data.metrics as any)[metric] || 0;
    
    return {
      value,
      min: 0,
      max: value * 2,
      label: widget.title,
      color: value > (value * 2 * 0.8) ? '#10B981' : value > (value * 2 * 0.6) ? '#F59E0B' : '#EF4444'
    };
  }

  private generateTrendData(widget: DashboardWidget, data: AnalyticsData): any {
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

  private convertToCSV(data: AnalyticsData): string {
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

  private convertToPDF(report: Report): string {
    // En un sistema real, esto generaría un PDF
    return `PDF Report: ${report.name} - Generated at ${new Date().toISOString()}`;
  }

  private getMetricValue(data: AnalyticsData, metric: string): number {
    return (data.metrics as any)[metric] || 0;
  }

  private evaluateCondition(value: number, condition: Alert['condition']): boolean {
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

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  async getServiceStats(): Promise<{
    dashboards: number;
    reports: number;
    alerts: number;
    activeAlerts: number;
  }> {
    return {
      dashboards: this.dashboards.size,
      reports: this.reports.size,
      alerts: this.alerts.size,
      activeAlerts: Array.from(this.alerts.values()).filter(a => a.isActive).length
    };
  }
}

// Instancia singleton
export const dataAnalyticsDashboard = new DataAnalyticsDashboardService();
