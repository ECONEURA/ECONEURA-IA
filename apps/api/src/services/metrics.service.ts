import { structuredLogger } from '../lib/structured-logger.js';

export interface KPIMetric {
  id: string;
  name: string;
  value: number;
  target: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  changePercent: number;
  status: 'excellent' | 'good' | 'warning' | 'critical';
  category: 'inventory' | 'financial' | 'suppliers' | 'operational';
}

export interface KPIScorecard {
  category: string;
  metrics: KPIMetric[];
  overallScore: number;
  recommendations: string[];
}

export interface TrendAnalysis {
  metric: string;
  period: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  changePercent: number;
  significance: 'high' | 'medium' | 'low';
}

export class MetricsService {
  private metrics: Map<string, KPIMetric[]> = new Map();
  private historicalData: Map<string, any[]> = new Map();

  constructor() {
    this.initializeDefaultMetrics();
  }

  private initializeDefaultMetrics(): void {
    // Inventory metrics
    const inventoryMetrics: KPIMetric[] = [
      {
        id: 'inventory-turnover',
        name: 'Inventory Turnover',
        value: 6.2,
        target: 8.0,
        unit: 'times/year',
        trend: 'up',
        changePercent: 5.2,
        status: 'good',
        category: 'inventory'
      },
      {
        id: 'stock-accuracy',
        name: 'Stock Accuracy',
        value: 97.5,
        target: 98.0,
        unit: '%',
        trend: 'stable',
        changePercent: 0.3,
        status: 'excellent',
        category: 'inventory'
      },
      {
        id: 'reorder-efficiency',
        name: 'Reorder Efficiency',
        value: 85.2,
        target: 90.0,
        unit: '%',
        trend: 'up',
        changePercent: 2.1,
        status: 'good',
        category: 'inventory'
      }
    ];

    // Financial metrics
    const financialMetrics: KPIMetric[] = [
      {
        id: 'revenue-growth',
        name: 'Revenue Growth',
        value: 12.5,
        target: 15.0,
        unit: '%',
        trend: 'up',
        changePercent: 3.2,
        status: 'good',
        category: 'financial'
      },
      {
        id: 'profit-margin',
        name: 'Profit Margin',
        value: 18.7,
        target: 20.0,
        unit: '%',
        trend: 'stable',
        changePercent: -0.5,
        status: 'good',
        category: 'financial'
      },
      {
        id: 'cash-flow',
        name: 'Cash Flow',
        value: 125000,
        target: 150000,
        unit: 'EUR',
        trend: 'up',
        changePercent: 8.3,
        status: 'good',
        category: 'financial'
      }
    ];

    // Supplier metrics
    const supplierMetrics: KPIMetric[] = [
      {
        id: 'on-time-delivery',
        name: 'On-Time Delivery',
        value: 92.3,
        target: 95.0,
        unit: '%',
        trend: 'up',
        changePercent: 1.8,
        status: 'good',
        category: 'suppliers'
      },
      {
        id: 'supplier-quality',
        name: 'Supplier Quality',
        value: 96.8,
        target: 98.0,
        unit: '%',
        trend: 'stable',
        changePercent: 0.2,
        status: 'excellent',
        category: 'suppliers'
      },
      {
        id: 'cost-reduction',
        name: 'Cost Reduction',
        value: 5.2,
        target: 8.0,
        unit: '%',
        trend: 'up',
        changePercent: 1.5,
        status: 'good',
        category: 'suppliers'
      }
    ];

    // Operational metrics
    const operationalMetrics: KPIMetric[] = [
      {
        id: 'order-fulfillment',
        name: 'Order Fulfillment',
        value: 94.7,
        target: 96.0,
        unit: '%',
        trend: 'up',
        changePercent: 2.1,
        status: 'excellent',
        category: 'operational'
      },
      {
        id: 'customer-satisfaction',
        name: 'Customer Satisfaction',
        value: 4.3,
        target: 4.5,
        unit: '/5',
        trend: 'stable',
        changePercent: 0.1,
        status: 'good',
        category: 'operational'
      },
      {
        id: 'employee-productivity',
        name: 'Employee Productivity',
        value: 87.5,
        target: 90.0,
        unit: '%',
        trend: 'up',
        changePercent: 3.2,
        status: 'good',
        category: 'operational'
      }
    ];

    this.metrics.set('inventory', inventoryMetrics);
    this.metrics.set('financial', financialMetrics);
    this.metrics.set('suppliers', supplierMetrics);
    this.metrics.set('operational', operationalMetrics);
  }

  async getKPIScorecard(category?: string): Promise<KPIScorecard[]> {
    try {
      const categories = category ? [category] : ['inventory', 'financial', 'suppliers', 'operational'];
      const scorecards: KPIScorecard[] = [];

      for (const cat of categories) {
        const metrics = this.metrics.get(cat) || [];
        const overallScore = this.calculateOverallScore(metrics);
        const recommendations = this.generateRecommendations(metrics);

        scorecards.push({
          category: cat,
          metrics,
          overallScore,
          recommendations
        });
      }

      structuredLogger.info('KPI scorecard generated', {
        categories: categories.length,
        totalMetrics: scorecards.reduce((sum, sc) => sum + sc.metrics.length, 0)
      });

      return scorecards;
    } catch (error) {
      structuredLogger.error('Failed to get KPI scorecard', error as Error);
      throw error;
    }
  }

  async getTrendAnalysis(metricId: string, period: string = '30d'): Promise<TrendAnalysis> {
    try {
      const historicalData = this.historicalData.get(metricId) || [];
      const trend = this.calculateTrend(historicalData);
      const changePercent = this.calculateChangePercent(historicalData);
      const significance = this.calculateSignificance(changePercent);

      const analysis: TrendAnalysis = {
        metric: metricId,
        period,
        trend,
        changePercent,
        significance
      };

      structuredLogger.info('Trend analysis completed', {
        metricId,
        trend,
        changePercent,
        significance
      });

      return analysis;
    } catch (error) {
      structuredLogger.error('Failed to get trend analysis', error as Error, { metricId });
      throw error;
    }
  }

  async generateAlerts(): Promise<{ alerts: any[]; critical: number; warning: number }> {
    try {
      const alerts = [];
      let critical = 0;
      let warning = 0;

      for (const [category, metrics] of this.metrics.entries()) {
        for (const metric of metrics) {
          if (metric.status === 'critical') {
            alerts.push({
              id: `alert-${metric.id}`,
              type: 'critical',
              metric: metric.name,
              value: metric.value,
              target: metric.target,
              message: `${metric.name} is below target (${metric.value} vs ${metric.target})`
            });
            critical++;
          } else if (metric.status === 'warning') {
            alerts.push({
              id: `alert-${metric.id}`,
              type: 'warning',
              metric: metric.name,
              value: metric.value,
              target: metric.target,
              message: `${metric.name} needs attention (${metric.value} vs ${metric.target})`
            });
            warning++;
          }
        }
      }

      structuredLogger.info('Alerts generated', {
        totalAlerts: alerts.length,
        critical,
        warning
      });

      return { alerts, critical, warning };
    } catch (error) {
      structuredLogger.error('Failed to generate alerts', error as Error);
      throw error;
    }
  }

  async updateMetric(metricId: string, value: number): Promise<void> {
    try {
      for (const [category, metrics] of this.metrics.entries()) {
        const metric = metrics.find(m => m.id === metricId);
        if (metric) {
          const oldValue = metric.value;
          metric.value = value;
          metric.changePercent = ((value - oldValue) / oldValue) * 100;
          metric.trend = metric.changePercent > 1 ? 'up' : metric.changePercent < -1 ? 'down' : 'stable';
          metric.status = this.calculateStatus(metric.value, metric.target);
          
          // Store historical data
          const historical = this.historicalData.get(metricId) || [];
          historical.push({
            timestamp: new Date(),
            value,
            changePercent: metric.changePercent
          });
          this.historicalData.set(metricId, historical.slice(-30)); // Keep last 30 entries
          
          break;
        }
      }

      structuredLogger.info('Metric updated', {
        metricId,
        newValue: value
      });
    } catch (error) {
      structuredLogger.error('Failed to update metric', error as Error, { metricId });
      throw error;
    }
  }

  private calculateOverallScore(metrics: KPIMetric[]): number {
    if (metrics.length === 0) return 0;
    
    const totalScore = metrics.reduce((sum, metric) => {
      const ratio = metric.value / metric.target;
      const score = Math.min(ratio * 100, 100);
      return sum + score;
    }, 0);
    
    return Math.round(totalScore / metrics.length);
  }

  private generateRecommendations(metrics: KPIMetric[]): string[] {
    const recommendations = [];
    
    for (const metric of metrics) {
      if (metric.status === 'critical') {
        recommendations.push(`Urgent: ${metric.name} needs immediate attention`);
      } else if (metric.status === 'warning') {
        recommendations.push(`Monitor: ${metric.name} is below target`);
      } else if (metric.trend === 'down') {
        recommendations.push(`Trend: ${metric.name} is declining`);
      }
    }
    
    return recommendations;
  }

  private calculateTrend(historicalData: any[]): 'increasing' | 'decreasing' | 'stable' {
    if (historicalData.length < 2) return 'stable';
    
    const recent = historicalData.slice(-3);
    const older = historicalData.slice(-6, -3);
    
    if (recent.length === 0 || older.length === 0) return 'stable';
    
    const recentAvg = recent.reduce((sum, item) => sum + item.value, 0) / recent.length;
    const olderAvg = older.reduce((sum, item) => sum + item.value, 0) / older.length;
    
    const change = (recentAvg - olderAvg) / olderAvg;
    
    if (change > 0.05) return 'increasing';
    if (change < -0.05) return 'decreasing';
    return 'stable';
  }

  private calculateChangePercent(historicalData: any[]): number {
    if (historicalData.length < 2) return 0;
    
    const latest = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];
    
    return ((latest.value - previous.value) / previous.value) * 100;
  }

  private calculateSignificance(changePercent: number): 'high' | 'medium' | 'low' {
    const absChange = Math.abs(changePercent);
    
    if (absChange > 10) return 'high';
    if (absChange > 5) return 'medium';
    return 'low';
  }

  private calculateStatus(value: number, target: number): 'excellent' | 'good' | 'warning' | 'critical' {
    const ratio = value / target;
    
    if (ratio >= 1.0) return 'excellent';
    if (ratio >= 0.9) return 'good';
    if (ratio >= 0.8) return 'warning';
    return 'critical';
  }

  async getPerformanceByCategory(): Promise<{ category: string; score: number; metrics: number }[]> {
    const results = [];
    
    for (const [category, metrics] of this.metrics.entries()) {
      const score = this.calculateOverallScore(metrics);
      results.push({
        category,
        score,
        metrics: metrics.length
      });
    }
    
    return results;
  }

  async exportMetrics(format: 'json' | 'csv' = 'json'): Promise<string> {
    const allMetrics = [];
    
    for (const [category, metrics] of this.metrics.entries()) {
      allMetrics.push(...metrics.map(metric => ({ ...metric, category })));
    }
    
    if (format === 'csv') {
      const headers = ['id', 'name', 'value', 'target', 'unit', 'trend', 'changePercent', 'status', 'category'];
      const csvRows = [headers.join(',')];
      
      for (const metric of allMetrics) {
        const row = headers.map(header => metric[header as keyof typeof metric]).join(',');
        csvRows.push(row);
      }
      
      return csvRows.join('\n');
    }
    
    return JSON.stringify(allMetrics, null, 2);
  }
}

export const metricsService = new MetricsService();
