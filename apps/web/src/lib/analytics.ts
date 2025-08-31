// ============================================================================
// CLIENTE DEL SISTEMA DE ANALYTICS DE DATOS - BFF
// ============================================================================

// ============================================================================
// INTERFACES
// ============================================================================

export interface MetricData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface DimensionData {
  dimension: string;
  value: string | number;
  count: number;
  percentage: number;
}

export interface AnalyticsResult {
  metrics: Record<string, MetricData[]>;
  dimensions: Record<string, DimensionData[]>;
  summary: {
    totalRecords: number;
    timeRange: string;
    lastUpdated: Date;
  };
}

export interface Dashboard {
  id: string;
  name: string;
  description?: string;
  userId: string;
  orgId: string;
  widgets: Widget[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Widget {
  id: string;
  type: 'chart' | 'metric' | 'table' | 'heatmap' | 'funnel';
  title: string;
  query: AnalyticsQuery;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config?: Record<string, any>;
}

export interface AnalyticsQuery {
  metrics: string[];
  dimensions?: string[];
  filters?: Filter[];
  timeRange: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
  startDate?: string;
  endDate?: string;
  groupBy?: string[];
  orderBy?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  limit?: number;
}

export interface Filter {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
  value: string | number | Array<string | number>;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  userId: string;
  orgId: string;
  query: AnalyticsQuery;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CLIENTE PRINCIPAL
// ============================================================================

class WebAnalyticsSystem {
  private baseUrl: string;

  constructor() {
    this.baseUrl = '/api/analytics';
    console.log('WebAnalyticsSystem initialized (client-side)');
  }

  // ============================================================================
  // MÉTRICAS Y CONSULTAS
  // ============================================================================

  async getMetrics(query: AnalyticsQuery): Promise<AnalyticsResult> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting metrics:', error);
      throw error;
    }
  }

  async getRealTimeMetrics(metrics: string[]): Promise<Record<string, number>> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics/realtime`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ metrics }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting real-time metrics:', error);
      throw error;
    }
  }

  // ============================================================================
  // DASHBOARDS
  // ============================================================================

  async createDashboard(dashboard: Omit<Dashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<Dashboard> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dashboard),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating dashboard:', error);
      throw error;
    }
  }

  async getDashboard(id: string): Promise<Dashboard | null> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboards/${id}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting dashboard:', error);
      throw error;
    }
  }

  async listDashboards(userId: string, orgId: string): Promise<Dashboard[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboards?userId=${userId}&orgId=${orgId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing dashboards:', error);
      throw error;
    }
  }

  async updateDashboard(id: string, updates: Partial<Dashboard>): Promise<Dashboard> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating dashboard:', error);
      throw error;
    }
  }

  async deleteDashboard(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/dashboards/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting dashboard:', error);
      throw error;
    }
  }

  // ============================================================================
  // REPORTES
  // ============================================================================

  async createReport(report: Omit<Report, 'id' | 'createdAt' | 'updatedAt'>): Promise<Report> {
    try {
      const response = await fetch(`${this.baseUrl}/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  async getReport(id: string): Promise<Report | null> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/${id}`);

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting report:', error);
      throw error;
    }
  }

  async listReports(userId: string, orgId: string): Promise<Report[]> {
    try {
      const response = await fetch(`${this.baseUrl}/reports?userId=${userId}&orgId=${orgId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing reports:', error);
      throw error;
    }
  }

  async updateReport(id: string, updates: Partial<Report>): Promise<Report> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  async deleteReport(id: string): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error;
    }
  }

  async generateReport(id: string): Promise<AnalyticsResult> {
    try {
      const response = await fetch(`${this.baseUrl}/reports/${id}/generate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // ============================================================================
  // DATOS DE EJEMPLO
  // ============================================================================

  async getSampleData(): Promise<Record<string, any>> {
    try {
      const response = await fetch(`${this.baseUrl}/sample-data`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting sample data:', error);
      throw error;
    }
  }

  async getAvailableMetrics(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/metrics/available`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting available metrics:', error);
      throw error;
    }
  }

  async getAvailableDimensions(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/dimensions/available`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting available dimensions:', error);
      throw error;
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  formatMetricValue(value: number, metric: string): string {
    switch (metric) {
      case 'revenue':
        return new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
        }).format(value);
      case 'conversion_rate':
        return `${(value * 100).toFixed(2)}%`;
      case 'customer_satisfaction':
        return value.toFixed(1);
      case 'error_rate':
        return `${(value * 100).toFixed(2)}%`;
      case 'system_performance':
        return `${value.toFixed(1)}%`;
      default:
        return new Intl.NumberFormat('es-ES').format(value);
    }
  }

  getMetricColor(metric: string, value: number): string {
    switch (metric) {
      case 'conversion_rate':
        return value > 0.025 ? 'text-green-600' : value > 0.015 ? 'text-yellow-600' : 'text-red-600';
      case 'customer_satisfaction':
        return value > 4.0 ? 'text-green-600' : value > 3.5 ? 'text-yellow-600' : 'text-red-600';
      case 'error_rate':
        return value < 0.01 ? 'text-green-600' : value < 0.05 ? 'text-yellow-600' : 'text-red-600';
      case 'system_performance':
        return value > 95 ? 'text-green-600' : value > 90 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  getMetricIcon(metric: string): string {
    switch (metric) {
      case 'page_views':
        return '👁️';
      case 'user_sessions':
        return '👥';
      case 'conversion_rate':
        return '📈';
      case 'revenue':
        return '💰';
      case 'customer_satisfaction':
        return '😊';
      case 'system_performance':
        return '⚡';
      case 'error_rate':
        return '⚠️';
      case 'api_usage':
        return '🔌';
      case 'ai_chat_usage':
        return '🤖';
      case 'inventory_movements':
        return '📦';
      default:
        return '📊';
    }
  }

  getTimeRangeLabel(timeRange: string): string {
    switch (timeRange) {
      case 'hour':
        return 'Última hora';
      case 'day':
        return 'Último día';
      case 'week':
        return 'Última semana';
      case 'month':
        return 'Último mes';
      case 'quarter':
        return 'Último trimestre';
      case 'year':
        return 'Último año';
      default:
        return timeRange;
    }
  }

  getWidgetTypeLabel(type: string): string {
    switch (type) {
      case 'chart':
        return 'Gráfico';
      case 'metric':
        return 'Métrica';
      case 'table':
        return 'Tabla';
      case 'heatmap':
        return 'Mapa de calor';
      case 'funnel':
        return 'Embudo';
      default:
        return type;
    }
  }
}

// ============================================================================
// EXPORTACIÓN
// ============================================================================

export const webAnalyticsSystem = new WebAnalyticsSystem();
