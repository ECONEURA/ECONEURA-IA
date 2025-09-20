// Dashboard Service for Executive Insights and Monitoring
import { structuredLogger } from '../../lib/structured-logger.js';

export interface DashboardWidget {
  id: string;
  title: string;
  type: 'chart' | 'metric' | 'table' | 'gauge';
  position: { x: number; y: number; width: number; height: number };
  config: {
    min?: number;
    max?: number;
    unit?: string;
    thresholds?: Array<{ value: number; color: string }>;
  };
  dataSource: {
    type: 'metrics' | 'database' | 'api';
    query: string;
    timeRange?: {
      from: Date;
      to: Date;
    };
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: 'grid' | 'flex';
  refreshInterval: number;
  permissions: string[];
}

export class DashboardService {
  private dashboards: Map<string, Dashboard> = new Map();
  private logger = structuredLogger;

  constructor() {
    this.initializeDefaultDashboards();
  }

  private initializeDefaultDashboards(): void {
    // Executive Dashboard
    const executiveDashboard: Dashboard = {
      id: 'executive',
      name: 'Executive Dashboard',
      description: 'High-level business metrics and KPIs',
      layout: 'grid',
      refreshInterval: 30000, // 30 seconds
      permissions: ['admin', 'executive'],
      widgets: [
        {
          id: 'revenue-growth',
          title: 'Revenue Growth',
          type: 'chart',
          position: { x: 0, y: 0, width: 6, height: 4 },
          config: {
            unit: '€',
            thresholds: [
              { value: 1000000, color: 'green' },
              { value: 500000, color: 'yellow' },
              { value: 100000, color: 'red' }
            ]
          },
          dataSource: {
            type: 'database',
            query: 'SELECT SUM(amount) as revenue FROM transactions WHERE created_at >= NOW() - INTERVAL 30 DAY',
            timeRange: {
              from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              to: new Date()
            }
          }
        },
        {
          id: 'active-users',
          title: 'Active Users',
          type: 'metric',
          position: { x: 6, y: 0, width: 3, height: 2 },
          config: {
            unit: 'users',
            thresholds: [
              { value: 10000, color: 'green' },
              { value: 5000, color: 'yellow' },
              { value: 1000, color: 'red' }
            ]
          },
          dataSource: {
            type: 'database',
            query: 'SELECT COUNT(DISTINCT user_id) as active_users FROM user_sessions WHERE last_activity >= NOW() - INTERVAL 24 HOUR'
          }
        },
        {
          id: 'error-rate',
          title: 'Error Rate',
          type: 'gauge',
          position: { x: 9, y: 0, width: 3, height: 2 },
          config: {
            min: 0,
            max: 100,
            unit: '%',
            thresholds: [
              { value: 5, color: 'yellow' },
              { value: 10, color: 'red' }
            ]
          },
          dataSource: {
            type: 'metrics',
            query: 'rate(http_requests_total{status_code=~"5.."}[5m]) / rate(http_requests_total[5m]) * 100',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          }
        }
      ]
    };

    // Technical Dashboard
    const technicalDashboard: Dashboard = {
      id: 'technical',
      name: 'Technical Operations',
      description: 'System performance and infrastructure metrics',
      layout: 'grid',
      refreshInterval: 10000, // 10 seconds
      permissions: ['admin', 'developer', 'ops'],
      widgets: [
        {
          id: 'response-time',
          title: 'Average Response Time',
          type: 'chart',
          position: { x: 0, y: 0, width: 6, height: 3 },
          config: {
            unit: 'ms',
            thresholds: [
              { value: 100, color: 'green' },
              { value: 500, color: 'yellow' },
              { value: 1000, color: 'red' }
            ]
          },
          dataSource: {
            type: 'metrics',
            query: 'avg(http_request_duration_ms)',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          }
        },
        {
          id: 'cpu-usage',
          title: 'CPU Usage',
          type: 'gauge',
          position: { x: 6, y: 0, width: 3, height: 3 },
          config: {
            min: 0,
            max: 100,
            unit: '%',
            thresholds: [
              { value: 70, color: 'yellow' },
              { value: 90, color: 'red' }
            ]
          },
          dataSource: {
            type: 'metrics',
            query: 'cpu_usage_percent',
            timeRange: {
              from: new Date(Date.now() - 300000),
              to: new Date()
            }
          }
        },
        {
          id: 'memory-usage',
          title: 'Memory Usage',
          type: 'gauge',
          position: { x: 9, y: 0, width: 3, height: 3 },
          config: {
            min: 0,
            max: 100,
            unit: '%',
            thresholds: [
              { value: 80, color: 'yellow' },
              { value: 95, color: 'red' }
            ]
          },
          dataSource: {
            type: 'metrics',
            query: 'memory_usage_percent',
            timeRange: {
              from: new Date(Date.now() - 300000),
              to: new Date()
            }
          }
        }
      ]
    };

    this.dashboards.set('executive', executiveDashboard);
    this.dashboards.set('technical', technicalDashboard);

    this.logger.info('Default dashboards initialized', {
      dashboards: Array.from(this.dashboards.keys())
    });
  }

  async getDashboard(id: string): Promise<Dashboard | null> {
    return this.dashboards.get(id) || null;
  }

  async getDashboards(): Promise<Dashboard[]> {
    return Array.from(this.dashboards.values());
  }

  async createDashboard(dashboard: Dashboard): Promise<void> {
    this.dashboards.set(dashboard.id, dashboard);
    this.logger.info('Dashboard created', { dashboardId: dashboard.id });
  }

  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<void> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard with id ${id} not found`);
    }

    const updatedDashboard = { ...dashboard, ...updates };
    this.dashboards.set(id, updatedDashboard);
    this.logger.info('Dashboard updated', { dashboardId: id });
  }

  async deleteDashboard(id: string): Promise<void> {
    const deleted = this.dashboards.delete(id);
    if (!deleted) {
      throw new Error(`Dashboard with id ${id} not found`);
    }
    this.logger.info('Dashboard deleted', { dashboardId: id });
  }

  async getWidgetData(dashboardId: string, widgetId: string): Promise<any> {
    const dashboard = this.dashboards.get(dashboardId);
    if (!dashboard) {
      throw new Error(`Dashboard with id ${dashboardId} not found`);
    }

    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) {
      throw new Error(`Widget with id ${widgetId} not found`);
    }

    // Simulate data fetching based on data source type
    switch (widget.dataSource.type) {
      case 'metrics':
        return this.fetchMetricsData(widget.dataSource.query);
      case 'database':
        return this.fetchDatabaseData(widget.dataSource.query);
      case 'api':
        return this.fetchApiData(widget.dataSource.query);
      default:
        throw new Error(`Unsupported data source type: ${widget.dataSource.type}`);
    }
  }

  private async fetchMetricsData(query: string): Promise<any> {
    // Simulate metrics data fetching
    this.logger.debug('Fetching metrics data', { query });
    return {
      timestamp: new Date(),
      value: Math.random() * 100,
      unit: 'percent'
    };
  }

  private async fetchDatabaseData(query: string): Promise<any> {
    // Simulate database query
    this.logger.debug('Fetching database data', { query });
    return {
      timestamp: new Date(),
      rows: [
        { date: '2025-01-01', value: 1000000 },
        { date: '2025-01-02', value: 1100000 },
        { date: '2025-01-03', value: 1200000 }
      ]
    };
  }

  private async fetchApiData(url: string): Promise<any> {
    // Simulate API call
    this.logger.debug('Fetching API data', { url });
    return {
      timestamp: new Date(),
      data: { status: 'ok', value: 42 }
    };
  }

  async exportDashboard(id: string): Promise<string> {
    const dashboard = this.dashboards.get(id);
    if (!dashboard) {
      throw new Error(`Dashboard with id ${id} not found`);
    }

    return JSON.stringify(dashboard, null, 2);
  }

  async importDashboard(dashboardJson: string): Promise<void> {
    try {
      const dashboard: Dashboard = JSON.parse(dashboardJson);
      this.dashboards.set(dashboard.id, dashboard);
      this.logger.info('Dashboard imported', { dashboardId: dashboard.id });
    } catch (error) {
      this.logger.error('Failed to import dashboard', { error });
      throw new Error('Invalid dashboard JSON format');
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
