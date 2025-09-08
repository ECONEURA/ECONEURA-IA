import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DataAnalyticsDashboardService } from '../../../lib/data-analytics-dashboard.service.js';

describe('DataAnalyticsDashboardService', () => {
  let service: DataAnalyticsDashboardService;

  beforeEach(() => {
    service = new DataAnalyticsDashboardService();
  });

  describe('Dashboard Management', () => {
    it('should create a dashboard successfully', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        description: 'Test dashboard description',
        layout: {
          columns: 4,
          rows: 10,
          responsive: true,
          theme: 'light' as const
        },
        filters: [],
        permissions: {
          isPublic: false,
          allowedUsers: [],
          allowedRoles: ['admin']
        },
        tags: ['test']
      };

      const dashboard = await service.createDashboard(dashboardData, 'test-org');

      expect(dashboard).toBeDefined();
      expect(dashboard.name).toBe('Test Dashboard');
      expect(dashboard.organizationId).toBe('test-org');
      expect(dashboard.isActive).toBe(true);
      expect(dashboard.widgets).toEqual([]);
    });

    it('should get a dashboard by ID', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { columns: 4, rows: 10, responsive: true, theme: 'light' as const },
        filters: [],
        permissions: { isPublic: false, allowedUsers: [], allowedRoles: [] },
        tags: []
      };

      const createdDashboard = await service.createDashboard(dashboardData, 'test-org');
      const retrievedDashboard = await service.getDashboard(createdDashboard.id);

      expect(retrievedDashboard).toBeDefined();
      expect(retrievedDashboard?.id).toBe(createdDashboard.id);
      expect(retrievedDashboard?.name).toBe('Test Dashboard');
    });

    it('should return null for non-existent dashboard', async () => {
      const dashboard = await service.getDashboard('non-existent-id');
      expect(dashboard).toBeNull();
    });

    it('should get dashboards with filters', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { columns: 4, rows: 10, responsive: true, theme: 'light' as const },
        filters: [],
        permissions: { isPublic: false, allowedUsers: [], allowedRoles: [] },
        tags: ['analytics']
      };

      await service.createDashboard(dashboardData, 'test-org');
      const dashboards = await service.getDashboards('test-org', { tags: ['analytics'] });

      expect(dashboards).toHaveLength(1);
      expect(dashboards[0].tags).toContain('analytics');
    });

    it('should update a dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { columns: 4, rows: 10, responsive: true, theme: 'light' as const },
        filters: [],
        permissions: { isPublic: false, allowedUsers: [], allowedRoles: [] },
        tags: []
      };

      const createdDashboard = await service.createDashboard(dashboardData, 'test-org');
      const updatedDashboard = await service.updateDashboard(createdDashboard.id, { 
        name: 'Updated Dashboard' 
      });

      expect(updatedDashboard).toBeDefined();
      expect(updatedDashboard?.name).toBe('Updated Dashboard');
      expect(updatedDashboard?.updatedAt).not.toEqual(createdDashboard.updatedAt);
    });

    it('should delete a dashboard', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { columns: 4, rows: 10, responsive: true, theme: 'light' as const },
        filters: [],
        permissions: { isPublic: false, allowedUsers: [], allowedRoles: [] },
        tags: []
      };

      const createdDashboard = await service.createDashboard(dashboardData, 'test-org');
      const deleted = await service.deleteDashboard(createdDashboard.id);

      expect(deleted).toBe(true);
      
      const retrievedDashboard = await service.getDashboard(createdDashboard.id);
      expect(retrievedDashboard).toBeNull();
    });
  });

  describe('Widget Management', () => {
    let dashboardId: string;

    beforeEach(async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { columns: 4, rows: 10, responsive: true, theme: 'light' as const },
        filters: [],
        permissions: { isPublic: false, allowedUsers: [], allowedRoles: [] },
        tags: []
      };

      const dashboard = await service.createDashboard(dashboardData, 'test-org');
      dashboardId = dashboard.id;
    });

    it('should add a widget to dashboard', async () => {
      const widgetData = {
        type: 'chart' as const,
        title: 'Test Chart',
        dataSource: 'analytics',
        configuration: {
          chartType: 'line' as const,
          metrics: ['users'],
          timeRange: '30d'
        },
        position: { x: 0, y: 0, width: 6, height: 4 },
        isVisible: true,
        isEditable: true
      };

      const widget = await service.addWidget(dashboardId, widgetData);

      expect(widget).toBeDefined();
      expect(widget?.title).toBe('Test Chart');
      expect(widget?.type).toBe('chart');

      const dashboard = await service.getDashboard(dashboardId);
      expect(dashboard?.widgets).toHaveLength(1);
      expect(dashboard?.widgets[0].id).toBe(widget?.id);
    });

    it('should update a widget', async () => {
      const widgetData = {
        type: 'chart' as const,
        title: 'Test Chart',
        dataSource: 'analytics',
        configuration: {
          chartType: 'line' as const,
          metrics: ['users'],
          timeRange: '30d'
        },
        position: { x: 0, y: 0, width: 6, height: 4 },
        isVisible: true,
        isEditable: true
      };

      const widget = await service.addWidget(dashboardId, widgetData);
      const updatedWidget = await service.updateWidget(dashboardId, widget!.id, { 
        title: 'Updated Chart' 
      });

      expect(updatedWidget).toBeDefined();
      expect(updatedWidget?.title).toBe('Updated Chart');
      expect(updatedWidget?.updatedAt).not.toEqual(widget?.updatedAt);
    });

    it('should remove a widget from dashboard', async () => {
      const widgetData = {
        type: 'chart' as const,
        title: 'Test Chart',
        dataSource: 'analytics',
        configuration: {
          chartType: 'line' as const,
          metrics: ['users'],
          timeRange: '30d'
        },
        position: { x: 0, y: 0, width: 6, height: 4 },
        isVisible: true,
        isEditable: true
      };

      const widget = await service.addWidget(dashboardId, widgetData);
      const removed = await service.removeWidget(dashboardId, widget!.id);

      expect(removed).toBe(true);

      const dashboard = await service.getDashboard(dashboardId);
      expect(dashboard?.widgets).toHaveLength(0);
    });

    it('should return null for non-existent widget operations', async () => {
      const widget = await service.addWidget('non-existent-dashboard', {
        type: 'chart',
        title: 'Test Chart',
        dataSource: 'analytics',
        configuration: { metrics: ['users'] },
        position: { x: 0, y: 0, width: 6, height: 4 }
      });

      expect(widget).toBeNull();
    });
  });

  describe('Analytics Data', () => {
    it('should get analytics data', async () => {
      const data = await service.getAnalyticsData('test-org');

      expect(data).toBeDefined();
      expect(data.metrics).toBeDefined();
      expect(data.metrics.totalUsers).toBeGreaterThan(0);
      expect(data.trends).toBeDefined();
      expect(data.trends.users).toBeInstanceOf(Array);
      expect(data.topPages).toBeInstanceOf(Array);
      expect(data.trafficSources).toBeInstanceOf(Array);
      expect(data.deviceBreakdown).toBeInstanceOf(Array);
      expect(data.geographicData).toBeInstanceOf(Array);
      expect(data.realTimeData).toBeDefined();
    });

    it('should get analytics data with filters', async () => {
      const data = await service.getAnalyticsData('test-org', {
        timeRange: '7d',
        metrics: ['totalUsers', 'activeUsers']
      });

      expect(data).toBeDefined();
      expect(data.metrics).toBeDefined();
      expect(data.trends.users.length).toBeLessThanOrEqual(7);
    });

    it('should get widget data for different widget types', async () => {
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { columns: 4, rows: 10, responsive: true, theme: 'light' as const },
        filters: [],
        permissions: { isPublic: false, allowedUsers: [], allowedRoles: [] },
        tags: []
      };

      const dashboard = await service.createDashboard(dashboardData, 'test-org');

      const chartWidget = {
        id: 'test-widget',
        type: 'chart' as const,
        title: 'Test Chart',
        dataSource: 'analytics',
        configuration: {
          chartType: 'line' as const,
          metrics: ['users'],
          timeRange: '30d'
        },
        position: { x: 0, y: 0, width: 6, height: 4 },
        isVisible: true,
        isEditable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const chartData = await service.getWidgetData(chartWidget, 'test-org');
      expect(chartData).toBeDefined();

      const metricWidget = {
        ...chartWidget,
        type: 'metric' as const,
        configuration: { metrics: ['totalUsers'] }
      };

      const metricData = await service.getWidgetData(metricWidget, 'test-org');
      expect(metricData).toBeDefined();
      expect(metricData.value).toBeGreaterThan(0);
    });
  });

  describe('Reports', () => {
    it('should create a report', async () => {
      const report = await service.createReport(
        'Test Report',
        'Test report description',
        'analytics',
        'test-org',
        { timeRange: '30d' }
      );

      expect(report).toBeDefined();
      expect(report.name).toBe('Test Report');
      expect(report.type).toBe('analytics');
      expect(report.organizationId).toBe('test-org');
      expect(report.data).toBeDefined();
    });

    it('should get reports for organization', async () => {
      await service.createReport('Report 1', 'Description 1', 'analytics', 'test-org');
      await service.createReport('Report 2', 'Description 2', 'business', 'test-org');
      await service.createReport('Report 3', 'Description 3', 'analytics', 'other-org');

      const reports = await service.getReports('test-org');
      expect(reports).toHaveLength(2);
      expect(reports.every(r => r.organizationId === 'test-org')).toBe(true);
    });

    it('should export report in different formats', async () => {
      const report = await service.createReport(
        'Test Report',
        'Test report description',
        'analytics',
        'test-org'
      );

      const jsonExport = await service.exportReport(report.id, 'json');
      expect(jsonExport).toBeDefined();
      expect(() => JSON.parse(jsonExport)).not.toThrow();

      const csvExport = await service.exportReport(report.id, 'csv');
      expect(csvExport).toBeDefined();
      expect(csvExport).toContain('Metric,Value');

      const pdfExport = await service.exportReport(report.id, 'pdf');
      expect(pdfExport).toBeDefined();
      expect(pdfExport).toContain('PDF Report');
    });
  });

  describe('Alerts', () => {
    it('should create an alert', async () => {
      const alertData = {
        name: 'Test Alert',
        description: 'Test alert description',
        metric: 'totalUsers',
        condition: {
          operator: 'greater_than' as const,
          value: 1000,
          threshold: 1000
        },
        severity: 'medium' as const,
        recipients: ['admin@test.com']
      };

      const alert = await service.createAlert(alertData, 'test-org');

      expect(alert).toBeDefined();
      expect(alert.name).toBe('Test Alert');
      expect(alert.metric).toBe('totalUsers');
      expect(alert.organizationId).toBe('test-org');
      expect(alert.isActive).toBe(true);
      expect(alert.triggerCount).toBe(0);
    });

    it('should get alerts for organization', async () => {
      await service.createAlert({
        name: 'Alert 1',
        metric: 'totalUsers',
        condition: { operator: 'greater_than', value: 1000, threshold: 1000 },
        severity: 'medium',
        recipients: ['admin@test.com']
      }, 'test-org');

      await service.createAlert({
        name: 'Alert 2',
        metric: 'activeUsers',
        condition: { operator: 'less_than', value: 500, threshold: 500 },
        severity: 'high',
        recipients: ['admin@test.com']
      }, 'other-org');

      const alerts = await service.getAlerts('test-org');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].organizationId).toBe('test-org');
    });

    it('should check alerts and trigger them when conditions are met', async () => {
      await service.createAlert({
        name: 'High Users Alert',
        metric: 'totalUsers',
        condition: { operator: 'greater_than', value: 1000, threshold: 1000 },
        severity: 'high',
        recipients: ['admin@test.com']
      }, 'test-org');

      const triggeredAlerts = await service.checkAlerts('test-org');
      
      // The demo data has totalUsers > 1000, so the alert should be triggered
      expect(triggeredAlerts).toHaveLength(1);
      expect(triggeredAlerts[0].name).toBe('High Users Alert');
      expect(triggeredAlerts[0].triggerCount).toBe(1);
      expect(triggeredAlerts[0].lastTriggered).toBeDefined();
    });
  });

  describe('Service Stats', () => {
    it('should get service statistics', async () => {
      // Create some test data
      const dashboardData = {
        name: 'Test Dashboard',
        layout: { columns: 4, rows: 10, responsive: true, theme: 'light' as const },
        filters: [],
        permissions: { isPublic: false, allowedUsers: [], allowedRoles: [] },
        tags: []
      };

      await service.createDashboard(dashboardData, 'test-org');
      await service.createReport('Test Report', 'Description', 'analytics', 'test-org');
      await service.createAlert({
        name: 'Test Alert',
        metric: 'totalUsers',
        condition: { operator: 'greater_than', value: 1000, threshold: 1000 },
        severity: 'medium',
        recipients: ['admin@test.com']
      }, 'test-org');

      const stats = await service.getServiceStats();

      expect(stats).toBeDefined();
      expect(stats.dashboards).toBeGreaterThan(0);
      expect(stats.reports).toBeGreaterThan(0);
      expect(stats.alerts).toBeGreaterThan(0);
      expect(stats.activeAlerts).toBeGreaterThan(0);
    });
  });
});
