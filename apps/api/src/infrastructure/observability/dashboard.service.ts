import { LoggerService } from './logger.service.js';
import { MetricsService } from './metrics.service.js';
import { HealthService } from './health.service.js';
import { AlertingService } from './alerting.service.js';

// ============================================================================
// DASHBOARD SERVICE
// ============================================================================

export interface DashboardConfig {
  name: string;
  description: string;
  refreshInterval: number; // in milliseconds
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  filters: DashboardFilter[];
  permissions: DashboardPermissions;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  title: string;
  description: string;
  position: WidgetPosition;
  size: WidgetSize;
  config: WidgetConfig;
  dataSource: DataSource;
  refreshInterval: number;
  enabled: boolean;
}

export interface WidgetPosition {
  x: number;
  y: number;
  z: number;
}

export interface WidgetSize {
  width: number;
  height: number;
}

export interface WidgetConfig {
  [key: string]: any;
}

export interface DataSource {
  type: 'metrics' | 'logs' | 'traces' | 'health' | 'alerts';
  query: string;
  timeRange: TimeRange;
  aggregation?: string;
  groupBy?: string[];
  filters?: Record<string, any>;
}

export interface TimeRange {
  from: Date;
  to: Date;
  relative?: string; // e.g., '1h', '24h', '7d'
}

export interface DashboardLayout {
  columns: number;
  rows: number;
  gap: number;
  responsive: boolean;
}

export interface DashboardFilter {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'date' | 'text' | 'number';
  field: string;
  options?: string[];
  defaultValue?: any;
  required: boolean;
}

export interface DashboardPermissions {
  view: string[];
  edit: string[];
  admin: string[];
}

export type WidgetType = 
  | 'metric' 
  | 'chart' 
  | 'table' 
  | 'gauge' 
  | 'heatmap' 
  | 'log' 
  | 'alert' 
  | 'health' 
  | 'map' 
  | 'text';

export class DashboardService {
  private static instance: DashboardService;
  private dashboards: Map<string, DashboardConfig> = new Map();
  private logger: LoggerService;
  private metrics: MetricsService;
  private health: HealthService;
  private alerting: AlertingService;

  private constructor() {
    this.logger = LoggerService.getInstance();
    this.metrics = MetricsService.getInstance();
    this.health = HealthService.getInstance();
    this.alerting = AlertingService.getInstance();
    this.initializeDefaultDashboards();
  }

  public static getInstance(): DashboardService {
    if (!DashboardService.instance) {
      DashboardService.instance = new DashboardService();
    }
    return DashboardService.instance;
  }

  // ========================================================================
  // INITIALIZATION
  // ========================================================================

  private initializeDefaultDashboards(): void {
    // System Overview Dashboard
    this.addDashboard({
      name: 'System Overview',
      description: 'High-level system health and performance metrics',
      refreshInterval: 30000,
      widgets: [
        {
          id: 'system_health',
          type: 'health',
          title: 'System Health',
          description: 'Overall system health status',
          position: { x: 0, y: 0, z: 0 },
          size: { width: 4, height: 2 },
          config: {
            showDetails: true,
            showMetrics: true
          },
          dataSource: {
            type: 'health',
            query: 'system_health',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          },
          refreshInterval: 30000,
          enabled: true
        },
        {
          id: 'request_rate',
          type: 'metric',
          title: 'Request Rate',
          description: 'HTTP requests per second',
          position: { x: 4, y: 0, z: 0 },
          size: { width: 4, height: 2 },
          config: {
            unit: 'req/s',
            color: 'blue'
          },
          dataSource: {
            type: 'metrics',
            query: 'rate(http_requests_total[5m])',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          },
          refreshInterval: 30000,
          enabled: true
        },
        {
          id: 'response_time',
          type: 'chart',
          title: 'Response Time',
          description: 'Average response time over time',
          position: { x: 8, y: 0, z: 0 },
          size: { width: 4, height: 2 },
          config: {
            chartType: 'line',
            unit: 'ms',
            color: 'green'
          },
          dataSource: {
            type: 'metrics',
            query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          },
          refreshInterval: 30000,
          enabled: true
        },
        {
          id: 'error_rate',
          type: 'gauge',
          title: 'Error Rate',
          description: 'Percentage of failed requests',
          position: { x: 0, y: 2, z: 0 },
          size: { width: 4, height: 2 },
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
          },
          refreshInterval: 30000,
          enabled: true
        },
        {
          id: 'active_alerts',
          type: 'alert',
          title: 'Active Alerts',
          description: 'Currently firing alerts',
          position: { x: 4, y: 2, z: 0 },
          size: { width: 4, height: 2 },
          config: {
            showSeverity: true,
            showAge: true,
            maxItems: 10
          },
          dataSource: {
            type: 'alerts',
            query: 'status=firing',
            timeRange: {
              from: new Date(Date.now() - 86400000),
              to: new Date()
            }
          },
          refreshInterval: 30000,
          enabled: true
        },
        {
          id: 'memory_usage',
          type: 'chart',
          title: 'Memory Usage',
          description: 'Memory consumption over time',
          position: { x: 8, y: 2, z: 0 },
          size: { width: 4, height: 2 },
          config: {
            chartType: 'area',
            unit: 'MB',
            color: 'purple'
          },
          dataSource: {
            type: 'metrics',
            query: 'memory_usage_bytes / 1024 / 1024',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          },
          refreshInterval: 30000,
          enabled: true
        }
      ],
      layout: {
        columns: 12,
        rows: 4,
        gap: 16,
        responsive: true
      },
      filters: [
        {
          id: 'time_range',
          name: 'Time Range',
          type: 'select',
          field: 'timeRange',
          options: ['1h', '6h', '24h', '7d', '30d'],
          defaultValue: '1h',
          required: true
        },
        {
          id: 'service',
          name: 'Service',
          type: 'multiselect',
          field: 'service',
          options: ['econeura-api', 'econeura-web', 'econeura-worker'],
          defaultValue: ['econeura-api'],
          required: false
        }
      ],
      permissions: {
        view: ['admin', 'manager', 'viewer'],
        edit: ['admin', 'manager'],
        admin: ['admin']
      }
    });

    // Business Metrics Dashboard
    this.addDashboard({
      name: 'Business Metrics',
      description: 'Business-specific metrics and KPIs',
      refreshInterval: 60000,
      widgets: [
        {
          id: 'user_count',
          type: 'metric',
          title: 'Total Users',
          description: 'Total number of registered users',
          position: { x: 0, y: 0, z: 0 },
          size: { width: 3, height: 2 },
          config: {
            unit: 'users',
            color: 'blue'
          },
          dataSource: {
            type: 'metrics',
            query: 'users_total',
            timeRange: {
              from: new Date(Date.now() - 86400000),
              to: new Date()
            }
          },
          refreshInterval: 60000,
          enabled: true
        },
        {
          id: 'organization_count',
          type: 'metric',
          title: 'Total Organizations',
          description: 'Total number of organizations',
          position: { x: 3, y: 0, z: 0 },
          size: { width: 3, height: 2 },
          config: {
            unit: 'orgs',
            color: 'green'
          },
          dataSource: {
            type: 'metrics',
            query: 'organizations_total',
            timeRange: {
              from: new Date(Date.now() - 86400000),
              to: new Date()
            }
          },
          refreshInterval: 60000,
          enabled: true
        },
        {
          id: 'user_logins',
          type: 'chart',
          title: 'User Logins',
          description: 'User login activity over time',
          position: { x: 6, y: 0, z: 0 },
          size: { width: 6, height: 2 },
          config: {
            chartType: 'line',
            unit: 'logins',
            color: 'orange'
          },
          dataSource: {
            type: 'metrics',
            query: 'rate(user_logins_total[1h])',
            timeRange: {
              from: new Date(Date.now() - 86400000),
              to: new Date()
            }
          },
          refreshInterval: 60000,
          enabled: true
        },
        {
          id: 'business_operations',
          type: 'table',
          title: 'Business Operations',
          description: 'Recent business operations',
          position: { x: 0, y: 2, z: 0 },
          size: { width: 12, height: 3 },
          config: {
            columns: ['operation', 'organization_id', 'status', 'duration', 'timestamp'],
            sortBy: 'timestamp',
            sortOrder: 'desc',
            maxRows: 20
          },
          dataSource: {
            type: 'metrics',
            query: 'business_operations_total',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          },
          refreshInterval: 60000,
          enabled: true
        }
      ],
      layout: {
        columns: 12,
        rows: 5,
        gap: 16,
        responsive: true
      },
      filters: [
        {
          id: 'time_range',
          name: 'Time Range',
          type: 'select',
          field: 'timeRange',
          options: ['1h', '6h', '24h', '7d', '30d'],
          defaultValue: '24h',
          required: true
        },
        {
          id: 'organization',
          name: 'Organization',
          type: 'multiselect',
          field: 'organization_id',
          options: [],
          defaultValue: [],
          required: false
        }
      ],
      permissions: {
        view: ['admin', 'manager'],
        edit: ['admin'],
        admin: ['admin']
      }
    });

    // Performance Dashboard
    this.addDashboard({
      name: 'Performance',
      description: 'System performance and resource utilization',
      refreshInterval: 15000,
      widgets: [
        {
          id: 'cpu_usage',
          type: 'gauge',
          title: 'CPU Usage',
          description: 'Current CPU utilization',
          position: { x: 0, y: 0, z: 0 },
          size: { width: 3, height: 2 },
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
          },
          refreshInterval: 15000,
          enabled: true
        },
        {
          id: 'memory_usage_gauge',
          type: 'gauge',
          title: 'Memory Usage',
          description: 'Current memory utilization',
          position: { x: 3, y: 0, z: 0 },
          size: { width: 3, height: 2 },
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
          },
          refreshInterval: 15000,
          enabled: true
        },
        {
          id: 'disk_usage',
          type: 'gauge',
          title: 'Disk Usage',
          description: 'Current disk utilization',
          position: { x: 6, y: 0, z: 0 },
          size: { width: 3, height: 2 },
          config: {
            min: 0,
            max: 100,
            unit: '%',
            thresholds: [
              { value: 80, color: 'yellow' },
              { value: 90, color: 'red' }
            ]
          },
          dataSource: {
            type: 'metrics',
            query: 'disk_usage_percent',
            timeRange: {
              from: new Date(Date.now() - 300000),
              to: new Date()
            }
          },
          refreshInterval: 15000,
          enabled: true
        },
        {
          id: 'response_time_percentiles',
          type: 'chart',
          title: 'Response Time Percentiles',
          description: 'Response time distribution',
          position: { x: 9, y: 0, z: 0 },
          size: { width: 3, height: 2 },
          config: {
            chartType: 'line',
            unit: 'ms',
            series: ['p50', 'p95', 'p99']
          },
          dataSource: {
            type: 'metrics',
            query: 'histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m])), histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])), histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          },
          refreshInterval: 15000,
          enabled: true
        },
        {
          id: 'throughput',
          type: 'chart',
          title: 'Throughput',
          description: 'Requests per second over time',
          position: { x: 0, y: 2, z: 0 },
          size: { width: 6, height: 3 },
          config: {
            chartType: 'line',
            unit: 'req/s',
            color: 'blue'
          },
          dataSource: {
            type: 'metrics',
            query: 'rate(http_requests_total[1m])',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          },
          refreshInterval: 15000,
          enabled: true
        },
        {
          id: 'error_breakdown',
          type: 'chart',
          title: 'Error Breakdown',
          description: 'Error types and frequencies',
          position: { x: 6, y: 2, z: 0 },
          size: { width: 6, height: 3 },
          config: {
            chartType: 'pie',
            showLegend: true
          },
          dataSource: {
            type: 'metrics',
            query: 'errors_total by (error_type)',
            timeRange: {
              from: new Date(Date.now() - 3600000),
              to: new Date()
            }
          },
          refreshInterval: 15000,
          enabled: true
        }
      ],
      layout: {
        columns: 12,
        rows: 5,
        gap: 16,
        responsive: true
      },
      filters: [
        {
          id: 'time_range',
          name: 'Time Range',
          type: 'select',
          field: 'timeRange',
          options: ['5m', '15m', '1h', '6h', '24h'],
          defaultValue: '1h',
          required: true
        }
      ],
      permissions: {
        view: ['admin', 'manager', 'viewer'],
        edit: ['admin', 'manager'],
        admin: ['admin']
      }
    });
  }

  // ========================================================================
  // DASHBOARD MANAGEMENT
  // ========================================================================

  addDashboard(dashboard: DashboardConfig): void {
    this.dashboards.set(dashboard.name, dashboard);
    this.logger.info(`Dashboard added: ${dashboard.name}`, {
      widgetsCount: dashboard.widgets.length,
      refreshInterval: dashboard.refreshInterval
    });
  }

  removeDashboard(name: string): void {
    const dashboard = this.dashboards.get(name);
    if (dashboard) {
      this.dashboards.delete(name);
      this.logger.info(`Dashboard removed: ${dashboard.name}`);
    }
  }

  getDashboard(name: string): DashboardConfig | undefined {
    return this.dashboards.get(name);
  }

  getAllDashboards(): DashboardConfig[] {
    return Array.from(this.dashboards.values());
  }

  // ========================================================================
  // WIDGET DATA
  // ========================================================================

  async getWidgetData(widget: DashboardWidget, filters: Record<string, any> = {}): Promise<any> {
    try {
      switch (widget.dataSource.type) {
        case 'metrics':
          return await this.getMetricsData(widget.dataSource, filters);
        case 'health':
          return await this.getHealthData(widget.dataSource, filters);
        case 'alerts':
          return await this.getAlertsData(widget.dataSource, filters);
        case 'logs':
          return await this.getLogsData(widget.dataSource, filters);
        case 'traces':
          return await this.getTracesData(widget.dataSource, filters);
        default:
          throw new Error(`Unsupported data source type: ${widget.dataSource.type}`);
      }
    } catch (error) {
      this.logger.error(`Failed to get widget data: ${widget.title}`, {
        widgetId: widget.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  private async getMetricsData(dataSource: DataSource, filters: Record<string, any>): Promise<any> {
    // Implement metrics data retrieval
    return {
      data: [],
      metadata: {
        query: dataSource.query,
        timeRange: dataSource.timeRange,
        filters
      }
    };
  }

  private async getHealthData(dataSource: DataSource, filters: Record<string, any>): Promise<any> {
    const healthStatus = await this.health.getHealthStatus();
    return {
      data: healthStatus,
      metadata: {
        query: dataSource.query,
        timeRange: dataSource.timeRange,
        filters
      }
    };
  }

  private async getAlertsData(dataSource: DataSource, filters: Record<string, any>): Promise<any> {
    const alerts = this.alerting.getActiveAlerts();
    return {
      data: alerts,
      metadata: {
        query: dataSource.query,
        timeRange: dataSource.timeRange,
        filters
      }
    };
  }

  private async getLogsData(dataSource: DataSource, filters: Record<string, any>): Promise<any> {
    // Implement logs data retrieval
    return {
      data: [],
      metadata: {
        query: dataSource.query,
        timeRange: dataSource.timeRange,
        filters
      }
    };
  }

  private async getTracesData(dataSource: DataSource, filters: Record<string, any>): Promise<any> {
    // Implement traces data retrieval
    return {
      data: [],
      metadata: {
        query: dataSource.query,
        timeRange: dataSource.timeRange,
        filters
      }
    };
  }

  // ========================================================================
  // DASHBOARD EXPORT
  // ========================================================================

  exportDashboard(name: string): string {
    const dashboard = this.dashboards.get(name);
    if (!dashboard) {
      throw new Error(`Dashboard not found: ${name}`);
    }

    return JSON.stringify(dashboard, null, 2);
  }

  importDashboard(dashboardJson: string): void {
    try {
      const dashboard = JSON.parse(dashboardJson) as DashboardConfig;
      this.addDashboard(dashboard);
    } catch (error) {
      throw new Error(`Failed to import dashboard: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========================================================================
  // DASHBOARD STATUS
  // ========================================================================

  getDashboardStatus(): {
    totalDashboards: number;
    totalWidgets: number;
    enabledWidgets: number;
    lastUpdated: Date;
  } {
    const totalDashboards = this.dashboards.size;
    let totalWidgets = 0;
    let enabledWidgets = 0;

    for (const dashboard of this.dashboards.values()) {
      totalWidgets += dashboard.widgets.length;
      enabledWidgets += dashboard.widgets.filter(widget => widget.enabled).length;
    }

    return {
      totalDashboards,
      totalWidgets,
      enabledWidgets,
      lastUpdated: new Date()
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const dashboardService = DashboardService.getInstance();
