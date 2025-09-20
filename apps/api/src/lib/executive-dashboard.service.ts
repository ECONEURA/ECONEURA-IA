// Executive Dashboard Service - Strategic Business Intelligence
import { structuredLogger } from './structured-logger.js';

export interface MetricThreshold {
  value: number;
  color: string;
  label: string;
  operator: 'greater_than' | 'less_than' | 'equal' | 'between';
}

export interface ExecutiveMetric {
  id: string;
  title: string;
  value: number;
  unit: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  position: { x: number; y: number; width: number; height: number };
  config: { metricId: string; thresholds: MetricThreshold[]; };
  refreshInterval: number;
}

export class ExecutiveDashboardService {
  private metrics: Map<string, ExecutiveMetric> = new Map();
  private logger = structuredLogger;

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    const revenueMetric: ExecutiveMetric = {
      id: 'total-revenue',
      title: 'Total Revenue',
      value: 1250000,
      unit: 'USD',
      trend: 'increasing',
      position: { x: 0, y: 0, width: 3, height: 2 },
      config: {
        metricId: 'revenue',
        thresholds: [
          { value: 1000000, color: '#10B981', label: 'Target', operator: 'greater_than' },
          { value: 800000, color: '#F59E0B', label: 'Warning', operator: 'less_than' }
        ]
      },
      refreshInterval: 30000
    };

    this.metrics.set('total-revenue', revenueMetric);
    this.logger.info('Executive metrics initialized');
  }

  async getMetric(id: string): Promise<ExecutiveMetric | null> {
    return this.metrics.get(id) || null;
  }

  async updateMetric(id: string, value: number): Promise<void> {
    const metric = this.metrics.get(id);
    if (metric) {
      metric.value = value;
      this.logger.info('Metric updated', { id, value });
    }
  }
}

export const executiveDashboardService = new ExecutiveDashboardService();
