import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import dataAnalyticsDashboardRouter from '../../routes/data-analytics-dashboard.js';

const app = express();
app.use(express.json());
app.use('/v1/data-analytics-dashboard', dataAnalyticsDashboardRouter);

describe('Data Analytics Dashboard API Integration Tests', () => {
  const testOrgId = 'test-org-123';
  const testHeaders = {
    'x-org-id': testOrgId,
    'x-correlation-id': 'test-correlation-id'
  };

  let createdDashboardId: string;
  let createdWidgetId: string;
  let createdReportId: string;
  let createdAlertId: string;

  describe('Dashboard Management', () => {
    it('should create a dashboard successfully', async () => {
      const dashboardData = {
        name: 'Test Analytics Dashboard',
        description: 'A test dashboard for analytics',
        layout: {
          columns: 4,
          rows: 10,
          responsive: true,
          theme: 'light'
        },
        filters: [
          {
            field: 'timeRange',
            label: 'Time Range',
            type: 'select',
            options: ['1h', '24h', '7d', '30d'],
            defaultValue: '30d',
            isRequired: true
          }
        ],
        permissions: {
          isPublic: false,
          allowedUsers: ['user1', 'user2'],
          allowedRoles: ['admin', 'analyst']
        },
        tags: ['analytics', 'test']
      };

      const response = await request(app)
        .post('/v1/data-analytics-dashboard/dashboards')
        .set(testHeaders)
        .send(dashboardData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Test Analytics Dashboard');
      expect(response.body.data.organizationId).toBe(testOrgId);
      expect(response.body.data.isActive).toBe(true);
      expect(response.body.data.widgets).toEqual([]);

      createdDashboardId = response.body.data.id;
    });

    it('should get a dashboard by ID', async () => {
      const response = await request(app)
        .get(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}`)
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.id).toBe(createdDashboardId);
      expect(response.body.data.name).toBe('Test Analytics Dashboard');
    });

    it('should get all dashboards for organization', async () => {
      const response = await request(app)
        .get('/v1/data-analytics-dashboard/dashboards')
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.meta.organizationId).toBe(testOrgId);
    });

    it('should get dashboards with filters', async () => {
      const response = await request(app)
        .get('/v1/data-analytics-dashboard/dashboards?tags=analytics&isActive=true')
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.every((d: any) => d.tags.includes('analytics'))).toBe(true);
    });

    it('should update a dashboard', async () => {
      const updates = {
        name: 'Updated Analytics Dashboard',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}`)
        .set(testHeaders)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Analytics Dashboard');
      expect(response.body.data.description).toBe('Updated description');
    });

    it('should return 404 for non-existent dashboard', async () => {
      const response = await request(app)
        .get('/v1/data-analytics-dashboard/dashboards/non-existent-id')
        .set(testHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Dashboard not found');
    });
  });

  describe('Widget Management', () => {
    it('should add a widget to dashboard', async () => {
      const widgetData = {
        type: 'chart',
        title: 'Users Trend Chart',
        description: 'Chart showing user trends over time',
        dataSource: 'analytics',
        configuration: {
          chartType: 'line',
          metrics: ['users'],
          timeRange: '30d',
          showLegend: true,
          yAxisLabel: 'Users',
          xAxisLabel: 'Date'
        },
        position: {
          x: 0,
          y: 0,
          width: 6,
          height: 4
        },
        isVisible: true,
        isEditable: true
      };

      const response = await request(app)
        .post(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}/widgets`)
        .set(testHeaders)
        .send(widgetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toBe('Users Trend Chart');
      expect(response.body.data.type).toBe('chart');

      createdWidgetId = response.body.data.id;
    });

    it('should add a metric widget to dashboard', async () => {
      const widgetData = {
        type: 'metric',
        title: 'Total Users',
        dataSource: 'analytics',
        configuration: {
          metrics: ['totalUsers'],
          timeRange: '30d'
        },
        position: {
          x: 6,
          y: 0,
          width: 3,
          height: 2
        }
      };

      const response = await request(app)
        .post(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}/widgets`)
        .set(testHeaders)
        .send(widgetData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('metric');
    });

    it('should update a widget', async () => {
      const updates = {
        title: 'Updated Users Trend Chart',
        configuration: {
          chartType: 'bar',
          metrics: ['users', 'sessions'],
          timeRange: '7d'
        }
      };

      const response = await request(app)
        .put(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}/widgets/${createdWidgetId}`)
        .set(testHeaders)
        .send(updates)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Updated Users Trend Chart');
      expect(response.body.data.configuration.chartType).toBe('bar');
    });

    it('should get widget data', async () => {
      const response = await request(app)
        .get(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}/widgets/${createdWidgetId}/data`)
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.meta.widgetId).toBe(createdWidgetId);
    });

    it('should remove a widget from dashboard', async () => {
      const response = await request(app)
        .delete(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}/widgets/${createdWidgetId}`)
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Widget removed successfully');
    });

    it('should return 404 for non-existent widget operations', async () => {
      const response = await request(app)
        .get(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}/widgets/non-existent-widget/data`)
        .set(testHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Widget not found');
    });
  });

  describe('Analytics Data', () => {
    it('should get analytics data', async () => {
      const response = await request(app)
        .get('/v1/data-analytics-dashboard/analytics')
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.metrics).toBeDefined();
      expect(response.body.data.metrics.totalUsers).toBeGreaterThan(0);
      expect(response.body.data.trends).toBeDefined();
      expect(response.body.data.topPages).toBeInstanceOf(Array);
      expect(response.body.data.trafficSources).toBeInstanceOf(Array);
      expect(response.body.data.deviceBreakdown).toBeInstanceOf(Array);
      expect(response.body.data.geographicData).toBeInstanceOf(Array);
      expect(response.body.data.realTimeData).toBeDefined();
    });

    it('should get analytics data with filters', async () => {
      const response = await request(app)
        .get('/v1/data-analytics-dashboard/analytics?timeRange=7d&metrics=totalUsers,activeUsers')
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.meta.filters.timeRange).toBe('7d');
      expect(response.body.meta.filters.metrics).toEqual(['totalUsers', 'activeUsers']);
    });
  });

  describe('Reports', () => {
    it('should create a report', async () => {
      const reportData = {
        name: 'Monthly Analytics Report',
        description: 'Comprehensive monthly analytics report',
        type: 'analytics',
        filters: {
          timeRange: '30d',
          metrics: ['totalUsers', 'activeUsers', 'revenue']
        }
      };

      const response = await request(app)
        .post('/v1/data-analytics-dashboard/reports')
        .set(testHeaders)
        .send(reportData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('Monthly Analytics Report');
      expect(response.body.data.type).toBe('analytics');
      expect(response.body.data.organizationId).toBe(testOrgId);

      createdReportId = response.body.data.id;
    });

    it('should get reports for organization', async () => {
      const response = await request(app)
        .get('/v1/data-analytics-dashboard/reports')
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((r: any) => r.organizationId === testOrgId)).toBe(true);
    });

    it('should export report in JSON format', async () => {
      const response = await request(app)
        .get(`/v1/data-analytics-dashboard/reports/${createdReportId}/export?format=json`)
        .set(testHeaders)
        .expect(200);

      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    it('should export report in CSV format', async () => {
      const response = await request(app)
        .get(`/v1/data-analytics-dashboard/reports/${createdReportId}/export?format=csv`)
        .set(testHeaders)
        .expect(200);

      expect(response.headers['content-type']).toContain('text/csv');
      expect(response.text).toContain('Metric,Value');
    });

    it('should return 400 for missing required fields in report creation', async () => {
      const response = await request(app)
        .post('/v1/data-analytics-dashboard/reports')
        .set(testHeaders)
        .send({
          description: 'Report without name and type'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Name and type are required');
    });
  });

  describe('Alerts', () => {
    it('should create an alert', async () => {
      const alertData = {
        name: 'High User Count Alert',
        description: 'Alert when user count exceeds threshold',
        metric: 'totalUsers',
        condition: {
          operator: 'greater_than',
          value: 10000,
          threshold: 10000
        },
        severity: 'high',
        recipients: ['admin@test.com', 'analyst@test.com']
      };

      const response = await request(app)
        .post('/v1/data-analytics-dashboard/alerts')
        .set(testHeaders)
        .send(alertData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.name).toBe('High User Count Alert');
      expect(response.body.data.metric).toBe('totalUsers');
      expect(response.body.data.organizationId).toBe(testOrgId);
      expect(response.body.data.isActive).toBe(true);

      createdAlertId = response.body.data.id;
    });

    it('should get alerts for organization', async () => {
      const response = await request(app)
        .get('/v1/data-analytics-dashboard/alerts')
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every((a: any) => a.organizationId === testOrgId)).toBe(true);
    });

    it('should check alerts and return triggered ones', async () => {
      const response = await request(app)
        .post('/v1/data-analytics-dashboard/alerts/check')
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.meta.organizationId).toBe(testOrgId);
      expect(response.body.meta.checkedAt).toBeDefined();
    });

    it('should return 400 for invalid alert data', async () => {
      const response = await request(app)
        .post('/v1/data-analytics-dashboard/alerts')
        .set(testHeaders)
        .send({
          name: 'Invalid Alert',
          metric: 'totalUsers',
          // Missing required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid alert data');
    });
  });

  describe('Service Statistics', () => {
    it('should get service statistics', async () => {
      const response = await request(app)
        .get('/v1/data-analytics-dashboard/stats')
        .set(testHeaders)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.dashboards).toBeGreaterThan(0);
      expect(response.body.data.reports).toBeGreaterThan(0);
      expect(response.body.data.alerts).toBeGreaterThan(0);
      expect(response.body.data.activeAlerts).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid dashboard data', async () => {
      const response = await request(app)
        .post('/v1/data-analytics-dashboard/dashboards')
        .set(testHeaders)
        .send({
          // Missing required fields
          description: 'Invalid dashboard'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid dashboard data');
    });

    it('should handle invalid widget data', async () => {
      const response = await request(app)
        .post(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}/widgets`)
        .set(testHeaders)
        .send({
          // Missing required fields
          description: 'Invalid widget'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid widget data');
    });

    it('should handle server errors gracefully', async () => {
      // Test with invalid dashboard ID to trigger error handling
      const response = await request(app)
        .get('/v1/data-analytics-dashboard/dashboards/invalid-id')
        .set(testHeaders)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Dashboard not found');
    });
  });

  afterEach(async () => {
    // Clean up created resources
    if (createdDashboardId) {
      await request(app)
        .delete(`/v1/data-analytics-dashboard/dashboards/${createdDashboardId}`)
        .set(testHeaders);
    }
  });
});
