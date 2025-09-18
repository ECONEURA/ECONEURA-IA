/**
 * Executive Dashboard Service
 * 
 * This service provides comprehensive executive dashboard capabilities including
 * C-level dashboards, real-time monitoring, strategic alerts, decision support,
 * and performance benchmarking.
 */

import {
  Dashboard,
  DashboardLayout,
  DashboardWidget,
  WidgetConfig,
  Threshold,
  DashboardFilter,
  DashboardAlert,
  AlertCondition,
  CreateDashboardRequest,
  DashboardConfig,
  AnalyticsMetric,
  BusinessIntelligence,
  KPI
} from './analytics-types.js';

export class ExecutiveDashboardService {
  private config: DashboardConfig;
  private dashboards: Map<string, Dashboard> = new Map();
  private alerts: Map<string, DashboardAlert[]> = new Map();
  private alertConditions: Map<string, AlertCondition[]> = new Map();

  constructor(config: Partial<DashboardConfig> = {}) {
    this.config = {
      realTimeUpdates: true,
      autoRefresh: true,
      refreshInterval: 30000, // 30 seconds
      maxWidgets: 50,
      customWidgets: true,
      mobileResponsive: true,
      exportEnabled: true,
      sharingEnabled: true,
      ...config
    };
  }

  // ============================================================================
  // DASHBOARD MANAGEMENT
  // ============================================================================

  async createDashboard(request: CreateDashboardRequest, organizationId: string, createdBy: string): Promise<Dashboard> {
    const dashboard: Dashboard = {
      id: this.generateId(),
      name: request.name,
      description: request.description,
      type: request.type,
      layout: request.layout,
      widgets: request.widgets,
      filters: request.filters,
      organizationId,
      createdBy,
      isPublic: request.isPublic,
      isActive: true,
      refreshInterval: request.refreshInterval,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dashboards.set(dashboard.id, dashboard);

    // Initialize alerts for this dashboard
    await this.initializeDashboardAlerts(dashboard);

    return dashboard;
  }

  async updateDashboard(dashboardId: string, updates: Partial<CreateDashboardRequest>): Promise<Dashboard | null> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) return null;

    const updatedDashboard: Dashboard = {
      ...dashboard,
      ...updates,
      updatedAt: new Date()
    };

    this.dashboards.set(dashboardId, updatedDashboard);

    // Update alerts if widgets changed
    if (updates.widgets) {
      await this.updateDashboardAlerts(dashboardId, updates.widgets);
    }

    return updatedDashboard;
  }

  async getDashboard(dashboardId: string): Promise<Dashboard | null> {
    return this.dashboards.get(dashboardId) || null;
  }

  async getDashboards(organizationId: string, filters?: {
    type?: string;
    createdBy?: string;
    isActive?: boolean;
    isPublic?: boolean;
  }): Promise<Dashboard[]> {
    let dashboards = Array.from(this.dashboards.values())
      .filter(d => d.organizationId === organizationId);

    if (filters) {
      if (filters.type) {
        dashboards = dashboards.filter(d => d.type === filters.type);
      }
      if (filters.createdBy) {
        dashboards = dashboards.filter(d => d.createdBy === filters.createdBy);
      }
      if (filters.isActive !== undefined) {
        dashboards = dashboards.filter(d => d.isActive === filters.isActive);
      }
      if (filters.isPublic !== undefined) {
        dashboards = dashboards.filter(d => d.isPublic === filters.isPublic);
      }
    }

    return dashboards;
  }

  async deleteDashboard(dashboardId: string): Promise<boolean> {
    const deleted = this.dashboards.delete(dashboardId);
    if (deleted) {
      this.alerts.delete(dashboardId);
      this.alertConditions.delete(dashboardId);
    }
    return deleted;
  }

  // ============================================================================
  // EXECUTIVE DASHBOARD
  // ============================================================================

  async getExecutiveDashboard(organizationId: string): Promise<Dashboard> {
    let dashboard = Array.from(this.dashboards.values())
      .find(d => d.organizationId === organizationId && d.type === 'executive');

    if (!dashboard) {
      dashboard = await this.createDefaultExecutiveDashboard(organizationId);
    }

    // Populate with real-time data
    await this.populateDashboardData(dashboard);

    return dashboard;
  }

  private async createDefaultExecutiveDashboard(organizationId: string): Promise<Dashboard> {
    const layout: DashboardLayout = {
      columns: 4,
      rows: 3,
      gridSize: 12,
      responsive: true
    };

    const widgets: DashboardWidget[] = [
      {
        id: this.generateId(),
        type: 'kpi',
        title: 'Revenue',
        position: { x: 0, y: 0, width: 3, height: 2 },
        config: {
          metricId: 'revenue',
          thresholds: [
            1000000, color: '#10B981', label: 'Target', operator: 'greater_than',
            800000, color: '#F59E0B', label: 'Warning', operator: 'less_than'
          ]
        },
        data: 1250000, unit: 'USD', trend: 'increasing',
        refreshInterval: 30000,
        isVisible: true
      },
      {
        id: this.generateId(),
        type: 'kpi',
        title: 'Profit Margin',
        position: { x: 3, y: 0, width: 3, height: 2 },
        config: {
          metricId: 'profit_margin',
          thresholds: [
            20, color: '#10B981', label: 'Excellent', operator: 'greater_than',
            15, color: '#F59E0B', label: 'Good', operator: 'greater_than',
            10, color: '#EF4444', label: 'Poor', operator: 'less_than'
          ]
        },
        data: 18.5, unit: '%', trend: 'stable',
        refreshInterval: 30000,
        isVisible: true
      },
      {
        id: this.generateId(),
        type: 'chart',
        title: 'Revenue Trend',
        position: { x: 6, y: 0, width: 6, height: 2 },
        config: {
          chartType: 'line',
          colors: ['#3B82F6', '#10B981']
        },
        data: this.generateRevenueTrendData(),
        refreshInterval: 60000,
        isVisible: true
      },
      {
        id: this.generateId(),
        type: 'metric',
        title: 'Customer Growth',
        position: { x: 0, y: 2, width: 4, height: 2 },
        config: {
          metricId: 'customer_growth',
          thresholds: [
            10, color: '#10B981', label: 'High Growth', operator: 'greater_than',
            5, color: '#F59E0B', label: 'Moderate Growth', operator: 'greater_than'
          ]
        },
        data: 12.3, unit: '%', trend: 'increasing',
        refreshInterval: 30000,
        isVisible: true
      },
      {
        id: this.generateId(),
        title: 'Operational Efficiency',
        type: 'gauge',
        position: { x: 4, y: 2, width: 4, height: 2 },
        config: {
          metricId: 'operational_efficiency',
          thresholds: [
            90, color: '#10B981', label: 'Excellent', operator: 'greater_than',
            80, color: '#F59E0B', label: 'Good', operator: 'greater_than',
            70, color: '#EF4444', label: 'Needs Improvement', operator: 'less_than'
          ]
        },
        data: 87.5, unit: '%', trend: 'stable',
        refreshInterval: 30000,
        isVisible: true
      },
      {
        id: this.generateId(),
        type: 'alert',
        title: 'Critical Alerts',
        position: { x: 8, y: 2, width: 4, height: 2 },
        config: {
          thresholds: [
            0, color: '#EF4444', label: 'Critical', operator: 'greater_than'
          ]
        },
        data: { alerts: await this.getCriticalAlerts(organizationId) },
        refreshInterval: 10000,
        isVisible: true
      }
    ];

    const filters: DashboardFilter[] = [
      {
        id: this.generateId(),
        name: 'Date Range',
        type: 'date',
        field: 'dateRange',
        defaultValue: 'last_30_days',
        isRequired: false
      },
      {
        id: this.generateId(),
        name: 'Business Unit',
        type: 'select',
        field: 'businessUnit',
        options: ['All', 'Sales', 'Marketing', 'Operations', 'Finance'],
        defaultValue: 'All',
        isRequired: false
      }
    ];

    const dashboard: Dashboard = {
      id: this.generateId(),
      name: 'Executive Dashboard',
      description: 'High-level overview of key business metrics and KPIs',
      type: 'executive',
      layout,
      widgets,
      filters,
      organizationId,
      createdBy: 'system',
      isPublic: true,
      isActive: true,
      refreshInterval: 30000,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.dashboards.set(dashboard.id, dashboard);
    await this.initializeDashboardAlerts(dashboard);

    return dashboard;
  }

  private generateRevenueTrendData(): any {
    const data = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: 1000000 + Math.random() * 500000,
        profit: 200000 + Math.random() * 100000
      });
    }
    
    return data;
  }

  // ============================================================================
  // DASHBOARD DATA POPULATION
  // ============================================================================

  private async populateDashboardData(dashboard: Dashboard): Promise<void> {
    for (const widget of dashboard.widgets) {
      if (widget.isVisible) {
        widget.data = await this.getWidgetData(widget, dashboard.organizationId);
      }
    }
  }

  private async getWidgetData(widget: DashboardWidget, organizationId: string): Promise<any> {
    switch (widget.type) {
      case 'kpi':
        return await this.getKPIData(widget, organizationId);
      case 'metric':
        return await this.getMetricData(widget, organizationId);
      case 'chart':
        return await this.getChartData(widget, organizationId);
      case 'gauge':
        return await this.getGaugeData(widget, organizationId);
      case 'alert':
        return await this.getAlertData(widget, organizationId);
      case 'table':
        return await this.getTableData(widget, organizationId);
      case 'trend':
        return await this.getTrendData(widget, organizationId);
      default:
        return 0, unit: '', trend: 'stable';
    }
  }

  private async getKPIData(widget: DashboardWidget, organizationId: string): Promise<any> {
    // Simulate KPI data
    const metricId = widget.config?.metricId || 'default';
    const baseValue = this.getBaseValueForMetric(metricId);
    
    return {
      value: baseValue + (Math.random() - 0.5) * baseValue * 0.1,
      unit: this.getUnitForMetric(metricId),
      trend: this.getRandomTrend(),
      change: (Math.random() - 0.5) * 20,
      target: baseValue * 1.1,
      status: this.getStatusForValue(baseValue, baseValue * 1.1)
    };
  }

  private async getMetricData(widget: DashboardWidget, organizationId: string): Promise<any> {
    // Similar to KPI but with different formatting
    return await this.getKPIData(widget, organizationId);
  }

  private async getChartData(widget: DashboardWidget, organizationId: string): Promise<any> {
    const chartType = widget.config?.chartType || 'line';
    
    switch (chartType) {
      case 'line':
        return this.generateLineChartData();
      case 'bar':
        return this.generateBarChartData();
      case 'pie':
        return this.generatePieChartData();
      case 'area':
        return this.generateAreaChartData();
      default:
        return this.generateLineChartData();
    }
  }

  private generateLineChartData(): any {
    const data = [];
    const labels = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }));
      data.push(Math.random() * 1000 + 500);
    }
    
    return {
      labels,
      datasets: [{
        label: 'Performance',
        data,
        borderColor: '#3B82F6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      }]
    };
  }

  private generateBarChartData(): any {
    const categories = ['Q1', 'Q2', 'Q3', 'Q4'];
    const data = categories.map(() => Math.random() * 1000 + 500);
    
    return {
      labels: categories,
      datasets: [{
        label: 'Quarterly Performance',
        data,
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
      }]
    };
  }

  private generatePieChartData(): any {
    return {
      labels: ['Excellent', 'Good', 'Average', 'Poor'],
      datasets: [{
        data: [35, 40, 20, 5],
        backgroundColor: ['#10B981', '#3B82F6', '#F59E0B', '#EF4444']
      }]
    };
  }

  private generateAreaChartData(): any {
    return this.generateLineChartData();
  }

  private async getGaugeData(widget: DashboardWidget, organizationId: string): Promise<any> {
    const metricId = widget.config?.metricId || 'default';
    const baseValue = this.getBaseValueForMetric(metricId);
    
    return {
      value: baseValue + (Math.random() - 0.5) * baseValue * 0.1,
      unit: this.getUnitForMetric(metricId),
      min: 0,
      max: 100,
      thresholds: widget.config?.thresholds || []
    };
  }

  private async getAlertData(widget: DashboardWidget, organizationId: string): Promise<any> {
    return {
      alerts: await this.getCriticalAlerts(organizationId),
      totalAlerts: (await this.getCriticalAlerts(organizationId)).length
    };
  }

  private async getTableData(widget: DashboardWidget, organizationId: string): Promise<any> {
    return {
      headers: ['Metric', 'Current', 'Target', 'Status', 'Trend'],
      rows: [
        ['Revenue', '$1.25M', '$1.2M', 'Above Target', '↗'],
        ['Profit', '$250K', '$200K', 'Above Target', '↗'],
        ['Customers', '15K', '12K', 'Above Target', '↗'],
        ['Efficiency', '87%', '85%', 'Above Target', '→']
      ]
    };
  }

  private async getTrendData(widget: DashboardWidget, organizationId: string): Promise<any> {
    return {
      trend: this.getRandomTrend(),
      change: (Math.random() - 0.5) * 20,
      confidence: 0.8 + Math.random() * 0.2,
      forecast: this.generateForecastData()
    };
  }

  private generateForecastData(): any[] {
    const forecast = [];
    const now = new Date();
    
    for (let i = 1; i <= 6; i++) {
      const date = new Date(now);
      date.setMonth(date.getMonth() + i);
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        predicted: 1000 + Math.random() * 500,
        confidence: 0.9 - (i * 0.1)
      });
    }
    
    return forecast;
  }

  // ============================================================================
  // ALERT MANAGEMENT
  // ============================================================================

  private async initializeDashboardAlerts(dashboard: Dashboard): Promise<void> {
    const alerts: DashboardAlert[] = [];
    
    for (const widget of dashboard.widgets) {
      if (widget.config?.thresholds) {
        for (const threshold of widget.config.thresholds) {
          const alert: DashboardAlert = {
            id: this.generateId(),
            dashboardId: dashboard.id,
            widgetId: widget.id,
            condition: {
              metric: widget.config.metricId || 'default',
              operator: threshold.operator,
              value: threshold.value,
              timeWindow: 300 // 5 minutes
            },
            message: `${widget.title} ${threshold.label}: ${threshold.value}`,
            severity: this.getSeverityFromColor(threshold.color),
            isActive: true,
            recipients: [dashboard.createdBy],
            createdAt: new Date()
          };
          
          alerts.push(alert);
        }
      }
    }
    
    this.alerts.set(dashboard.id, alerts);
  }

  private async updateDashboardAlerts(dashboardId: string, widgets: DashboardWidget[]): Promise<void> {
    // Remove old alerts
    this.alerts.delete(dashboardId);
    
    // Create new dashboard with updated widgets
    const dashboard = this.dashboards.get(dashboardId);
    if (dashboard) {
      const updatedDashboard = { ...dashboard, widgets };
      await this.initializeDashboardAlerts(updatedDashboard);
    }
  }

  private getSeverityFromColor(color: string): DashboardAlert['severity'] {
    switch (color) {
      case '#EF4444': return 'critical';
      case '#F59E0B': return 'warning';
      case '#10B981': return 'info';
      default: return 'info';
    }
  }

  async getDashboardAlerts(dashboardId: string): Promise<DashboardAlert[]> {
    return this.alerts.get(dashboardId) || [];
  }

  async getCriticalAlerts(organizationId: string): Promise<DashboardAlert[]> {
    const allAlerts: DashboardAlert[] = [];
    
    for (const [dashboardId, alerts] of this.alerts.entries()) {
      const dashboard = this.dashboards.get(dashboardId);
      if (dashboard && dashboard.organizationId === organizationId) {
        allAlerts.push(...alerts.filter(alert => 
          alert.isActive && alert.severity === 'critical'
        ));
      }
    }
    
    return allAlerts;
  }

  async triggerAlert(alertId: string): Promise<void> {
    // Find and trigger the alert
    for (const [dashboardId, alerts] of this.alerts.entries()) {
      const alert = alerts.find(a => a.id === alertId);
      if (alert) {
        alert.lastTriggered = new Date();
        // In a real implementation, this would send notifications
        
        break;
      }
    }
  }

  // ============================================================================
  // PERFORMANCE MONITORING
  // ============================================================================

  async getPerformanceMetrics(organizationId: string): Promise<{
    dashboardLoadTime: number;
    widgetRefreshTime: number;
    alertResponseTime: number;
    dataAccuracy: number;
    systemUptime: number;
  }> {
    return {
      dashboardLoadTime: 150 + Math.random() * 100, // 150-250ms
      widgetRefreshTime: 50 + Math.random() * 50,  // 50-100ms
      alertResponseTime: 10 + Math.random() * 20,  // 10-30ms
      dataAccuracy: 0.95 + Math.random() * 0.05,   // 95-100%
      systemUptime: 0.99 + Math.random() * 0.01    // 99-100%
    };
  }

  async getDashboardAnalytics(organizationId: string): Promise<{
    totalDashboards: number;
    activeDashboards: number;
    totalWidgets: number;
    averageWidgetsPerDashboard: number;
    mostPopularWidgetType: string;
    alertCount: number;
  }> {
    const dashboards = await this.getDashboards(organizationId);
    const activeDashboards = dashboards.filter(d => d.isActive).length;
    const totalWidgets = dashboards.reduce((sum, d) => sum + d.widgets.length, 0);
    
    const widgetTypes: Record<string, number> = {};
    dashboards.forEach(d => {
      d.widgets.forEach(w => {
        widgetTypes[w.type] = (widgetTypes[w.type] || 0) + 1;
      });
    });
    
    const mostPopularWidgetType = Object.entries(widgetTypes)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'kpi';
    
    const alertCount = Array.from(this.alerts.values())
      .flat()
      .filter(alert => {
        const dashboard = this.dashboards.get(alert.dashboardId);
        return dashboard && dashboard.organizationId === organizationId;
      }).length;

    return {
      totalDashboards: dashboards.length,
      activeDashboards,
      totalWidgets,
      averageWidgetsPerDashboard: dashboards.length > 0 ? totalWidgets / dashboards.length : 0,
      mostPopularWidgetType,
      alertCount
    };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private getBaseValueForMetric(metricId: string): number {
    const baseValues: Record<string, number> = {
      revenue: 1250000,
      profit_margin: 18.5,
      customer_growth: 12.3,
      operational_efficiency: 87.5,
      default: 100
    };
    
    return baseValues[metricId] || baseValues.default;
  }

  private getUnitForMetric(metricId: string): string {
    const units: Record<string, string> = {
      revenue: 'USD',
      profit_margin: '%',
      customer_growth: '%',
      operational_efficiency: '%',
      default: ''
    };
    
    return units[metricId] || units.default;
  }

  private getRandomTrend(): 'increasing' | 'decreasing' | 'stable' {
    const trends = ['increasing', 'decreasing', 'stable'];
    return trends[Math.floor(Math.random() * trends.length)] as any;
  }

  private getStatusForValue(current: number, target: number): 'above' | 'at' | 'below' {
    const variance = (current - target) / target;
    if (variance > 0.05) return 'above';
    if (variance < -0.05) return 'below';
    return 'at';
  }

  private generateId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getServiceStats(): Promise<{
    totalDashboards: number;
    totalWidgets: number;
    totalAlerts: number;
    config: DashboardConfig;
  }> {
    const totalWidgets = Array.from(this.dashboards.values())
      .reduce((sum, d) => sum + d.widgets.length, 0);
    
    const totalAlerts = Array.from(this.alerts.values())
      .flat().length;

    return {
      totalDashboards: this.dashboards.size,
      totalWidgets,
      totalAlerts,
      config: this.config
    };
  }
}
