/**
 * Advanced Analytics Service
 * 
 * This service provides comprehensive analytics capabilities including real-time
 * data processing, statistical analysis, trend analysis, and anomaly detection.
 */

import {
  AnalyticsMetric,
  TrendAnalysis,
  ForecastData,
  SeasonalityData,
  AnomalyData,
  AnalyticsQuery,
  AnalyticsResult,
  AnalyticsDataPoint,
  StatisticalAnalysis,
  CreateMetricRequest,
  UpdateMetricRequest,
  AnalyticsConfig
} from './analytics-types.js';

export class AdvancedAnalyticsService {
  private config: AnalyticsConfig;
  private metrics: Map<string, AnalyticsMetric> = new Map();
  private trends: Map<string, TrendAnalysis> = new Map();
  private anomalies: Map<string, AnomalyData[]> = new Map();

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      realTimeProcessing: true,
      anomalyDetection: true,
      forecasting: true,
      seasonalityAnalysis: true,
      correlationAnalysis: true,
      cacheEnabled: true,
      cacheTTL: 3600,
      maxDataPoints: 10000,
      batchSize: 1000,
      ...config
    };
  }

  // ============================================================================
  // METRIC MANAGEMENT
  // ============================================================================

  async createMetric(request: CreateMetricRequest, organizationId: string): Promise<AnalyticsMetric> {
    const metric: AnalyticsMetric = {
      id: this.generateId(),
      name: request.name,
      type: request.type,
      value: 0,
      unit: request.unit,
      timestamp: new Date(),
      organizationId,
      metadata: request.metadata,
      tags: request.tags,
      category: request.category,
      subcategory: request.subcategory,
      source: request.source,
      confidence: 1.0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.metrics.set(metric.id, metric);
    return metric;
  }

  async updateMetric(metricId: string, request: UpdateMetricRequest): Promise<AnalyticsMetric | null> {
    const metric = this.metrics.get(metricId);
    if (!metric) return null;

    const updatedMetric: AnalyticsMetric = {
      ...metric,
      ...request,
      updatedAt: new Date()
    };

    this.metrics.set(metricId, updatedMetric);
    return updatedMetric;
  }

  async getMetric(metricId: string): Promise<AnalyticsMetric | null> {
    return this.metrics.get(metricId) || null;
  }

  async getMetrics(organizationId: string, filters?: {
    type?: string;
    category?: string;
    status?: string;
    tags?: string[];
  }): Promise<AnalyticsMetric[]> {
    let metrics = Array.from(this.metrics.values())
      .filter(m => m.organizationId === organizationId);

    if (filters) {
      if (filters.type) {
        metrics = metrics.filter(m => m.type === filters.type);
      }
      if (filters.category) {
        metrics = metrics.filter(m => m.category === filters.category);
      }
      if (filters.status) {
        metrics = metrics.filter(m => m.status === filters.status);
      }
      if (filters.tags && filters.tags.length > 0) {
        metrics = metrics.filter(m => 
          filters.tags!.some(tag => m.tags.includes(tag))
        );
      }
    }

    return metrics;
  }

  async deleteMetric(metricId: string): Promise<boolean> {
    return this.metrics.delete(metricId);
  }

  // ============================================================================
  // DATA COLLECTION AND PROCESSING
  // ============================================================================

  async recordMetric(metricId: string, value: number, metadata?: Record<string, any>): Promise<void> {
    const metric = this.metrics.get(metricId);
    if (!metric) throw new Error(`Metric ${metricId} not found`);

    const updatedMetric: AnalyticsMetric = {
      ...metric,
      value,
      metadata: { ...metric.metadata, ...metadata },
      timestamp: new Date(),
      updatedAt: new Date()
    };

    this.metrics.set(metricId, updatedMetric);

    // Real-time processing
    if (this.config.realTimeProcessing) {
      await this.processRealTimeData(updatedMetric);
    }
  }

  private async processRealTimeData(metric: AnalyticsMetric): Promise<void> {
    // Update trend analysis
    await this.updateTrendAnalysis(metric);

    // Detect anomalies
    if (this.config.anomalyDetection) {
      await this.detectAnomalies(metric);
    }

    // Update forecasts
    if (this.config.forecasting) {
      await this.updateForecasts(metric);
    }
  }

  // ============================================================================
  // TREND ANALYSIS
  // ============================================================================

  async analyzeTrends(metricId: string, period: TrendAnalysis['period']): Promise<TrendAnalysis> {
    const metric = this.metrics.get(metricId);
    if (!metric) throw new Error(`Metric ${metricId} not found`);

    const trendKey = `${metricId}_${period}`;
    let trend = this.trends.get(trendKey);

    if (!trend) {
      trend = await this.createTrendAnalysis(metricId, period);
      this.trends.set(trendKey, trend);
    }

    return trend;
  }

  private async createTrendAnalysis(metricId: string, period: TrendAnalysis['period']): Promise<TrendAnalysis> {
    const metric = this.metrics.get(metricId);
    if (!metric) throw new Error(`Metric ${metricId} not found`);

    // Simulate trend analysis
    const changePercentage = this.calculateChangePercentage(metric);
    const trend: TrendAnalysis['trend'] = this.determineTrend(changePercentage);
    const confidence = this.calculateConfidence(metric);

    const trendAnalysis: TrendAnalysis = {
      id: this.generateId(),
      metricId,
      period,
      trend,
      changePercentage,
      confidence,
      forecast: await this.generateForecast(metric, period),
      seasonality: await this.analyzeSeasonality(metric, period),
      anomalies: this.anomalies.get(metricId) || [],
      organizationId: metric.organizationId,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return trendAnalysis;
  }

  private async updateTrendAnalysis(metric: AnalyticsMetric): Promise<void> {
    const trendKey = `${metric.id}_daily`;
    const trend = this.trends.get(trendKey);
    
    if (trend) {
      const updatedTrend: TrendAnalysis = {
        ...trend,
        changePercentage: this.calculateChangePercentage(metric),
        trend: this.determineTrend(this.calculateChangePercentage(metric)),
        confidence: this.calculateConfidence(metric),
        updatedAt: new Date()
      };
      this.trends.set(trendKey, updatedTrend);
    }
  }

  private calculateChangePercentage(metric: AnalyticsMetric): number {
    // Simulate change calculation
    return Math.random() * 20 - 10; // -10% to +10%
  }

  private determineTrend(changePercentage: number): TrendAnalysis['trend'] {
    if (changePercentage > 5) return 'increasing';
    if (changePercentage < -5) return 'decreasing';
    if (Math.abs(changePercentage) < 1) return 'stable';
    return 'volatile';
  }

  private calculateConfidence(metric: AnalyticsMetric): number {
    // Simulate confidence calculation based on data quality
    return Math.min(0.95, Math.max(0.5, metric.confidence || 0.8));
  }

  // ============================================================================
  // FORECASTING
  // ============================================================================

  private async generateForecast(metric: AnalyticsMetric, period: TrendAnalysis['period']): Promise<ForecastData[]> {
    const forecast: ForecastData[] = [];
    const baseValue = metric.value;
    const trend = this.determineTrend(this.calculateChangePercentage(metric));

    for (let i = 1; i <= 12; i++) {
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() + i);

      let predictedValue = baseValue;
      
      // Apply trend
      switch (trend) {
        case 'increasing':
          predictedValue *= (1 + (i * 0.02));
          break;
        case 'decreasing':
          predictedValue *= (1 - (i * 0.02));
          break;
        case 'volatile':
          predictedValue *= (1 + (Math.random() - 0.5) * 0.1);
          break;
      }

      // Add some randomness
      predictedValue *= (1 + (Math.random() - 0.5) * 0.05);

      forecast.push({
        timestamp,
        predictedValue: Math.max(0, predictedValue),
        confidenceInterval: {
          lower: predictedValue * 0.8,
          upper: predictedValue * 1.2
        },
        probability: Math.max(0.1, 1 - (i * 0.05))
      });
    }

    return forecast;
  }

  private async updateForecasts(metric: AnalyticsMetric): Promise<void> {
    // Update forecasts for all periods
    const periods: TrendAnalysis['period'][] = ['daily', 'weekly', 'monthly'];
    
    for (const period of periods) {
      const trendKey = `${metric.id}_${period}`;
      const trend = this.trends.get(trendKey);
      
      if (trend) {
        const updatedTrend: TrendAnalysis = {
          ...trend,
          forecast: await this.generateForecast(metric, period),
          updatedAt: new Date()
        };
        this.trends.set(trendKey, updatedTrend);
      }
    }
  }

  // ============================================================================
  // SEASONALITY ANALYSIS
  // ============================================================================

  private async analyzeSeasonality(metric: AnalyticsMetric, period: TrendAnalysis['period']): Promise<SeasonalityData> {
    // Simulate seasonality analysis
    const hasSeasonality = Math.random() > 0.5;
    
    return {
      hasSeasonality,
      period: hasSeasonality ? 7 : 0,
      strength: hasSeasonality ? Math.random() * 0.8 + 0.2 : 0,
      pattern: hasSeasonality ? Array.from({ length: 7 }, () => Math.random()) : []
    };
  }

  // ============================================================================
  // ANOMALY DETECTION
  // ============================================================================

  private async detectAnomalies(metric: AnalyticsMetric): Promise<void> {
    const anomalies = this.anomalies.get(metric.id) || [];
    
    // Simple anomaly detection based on value deviation
    const expectedValue = this.calculateExpectedValue(metric);
    const deviation = Math.abs(metric.value - expectedValue) / expectedValue;
    
    if (deviation > 0.3) { // 30% deviation threshold
      const anomaly: AnomalyData = {
        id: this.generateId(),
        timestamp: metric.timestamp,
        value: metric.value,
        expectedValue,
        deviation,
        severity: this.determineSeverity(deviation),
        type: this.determineAnomalyType(metric.value, expectedValue),
        description: this.generateAnomalyDescription(deviation),
        impact: this.assessImpact(deviation),
        recommendations: this.generateRecommendations(deviation)
      };
      
      anomalies.push(anomaly);
      this.anomalies.set(metric.id, anomalies);
    }
  }

  private calculateExpectedValue(metric: AnalyticsMetric): number {
    // Simple expected value calculation
    return metric.value * (0.9 + Math.random() * 0.2);
  }

  private determineSeverity(deviation: number): AnomalyData['severity'] {
    if (deviation > 1.0) return 'critical';
    if (deviation > 0.7) return 'high';
    if (deviation > 0.4) return 'medium';
    return 'low';
  }

  private determineAnomalyType(value: number, expected: number): AnomalyData['type'] {
    if (value > expected * 1.5) return 'spike';
    if (value < expected * 0.5) return 'drop';
    return 'outlier';
  }

  private generateAnomalyDescription(deviation: number): string {
    return `Anomaly detected with ${(deviation * 100).toFixed(1)}% deviation from expected value`;
  }

  private assessImpact(deviation: number): string {
    if (deviation > 1.0) return 'High impact on business operations';
    if (deviation > 0.7) return 'Moderate impact on performance';
    if (deviation > 0.4) return 'Low impact, monitor closely';
    return 'Minimal impact';
  }

  private generateRecommendations(deviation: number): string[] {
    const recommendations = [];
    
    if (deviation > 1.0) {
      recommendations.push('Investigate root cause immediately');
      recommendations.push('Consider implementing alerts');
    } else if (deviation > 0.7) {
      recommendations.push('Monitor trend closely');
      recommendations.push('Review related metrics');
    } else {
      recommendations.push('Continue monitoring');
    }
    
    return recommendations;
  }

  // ============================================================================
  // STATISTICAL ANALYSIS
  // ============================================================================

  async performStatisticalAnalysis(metricId: string, dataPoints: number[]): Promise<StatisticalAnalysis> {
    if (dataPoints.length === 0) {
      throw new Error('No data points provided for analysis');
    }

    const sorted = [...dataPoints].sort((a, b) => a - b);
    const n = dataPoints.length;

    // Basic statistics
    const mean = dataPoints.reduce((sum, val) => sum + val, 0) / n;
    const median = this.calculateMedian(sorted);
    const mode = this.calculateMode(dataPoints);
    const variance = this.calculateVariance(dataPoints, mean);
    const standardDeviation = Math.sqrt(variance);
    
    // Advanced statistics
    const skewness = this.calculateSkewness(dataPoints, mean, standardDeviation);
    const kurtosis = this.calculateKurtosis(dataPoints, mean, standardDeviation);
    
    // Quartiles
    const quartiles = {
      q1: this.calculatePercentile(sorted, 25),
      q2: median,
      q3: this.calculatePercentile(sorted, 75)
    };
    
    // Outliers (IQR method)
    const iqr = quartiles.q3 - quartiles.q1;
    const outliers = dataPoints.filter(val => 
      val < quartiles.q1 - 1.5 * iqr || val > quartiles.q3 + 1.5 * iqr
    );

    return {
      mean,
      median,
      mode,
      standardDeviation,
      variance,
      skewness,
      kurtosis,
      min: sorted[0],
      max: sorted[n - 1],
      range: sorted[n - 1] - sorted[0],
      quartiles,
      outliers,
      correlation: {} // Would be calculated with multiple metrics
    };
  }

  private calculateMedian(sorted: number[]): number {
    const n = sorted.length;
    if (n % 2 === 0) {
      return (sorted[n / 2 - 1] + sorted[n / 2]) / 2;
    }
    return sorted[Math.floor(n / 2)];
  }

  private calculateMode(data: number[]): number {
    const frequency: Record<number, number> = {};
    data.forEach(val => {
      frequency[val] = (frequency[val] || 0) + 1;
    });
    
    let maxFreq = 0;
    let mode = data[0];
    
    Object.entries(frequency).forEach(([val, freq]) => {
      if (freq > maxFreq) {
        maxFreq = freq;
        mode = Number(val);
      }
    });
    
    return mode;
  }

  private calculateVariance(data: number[], mean: number): number {
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  }

  private calculateSkewness(data: number[], mean: number, stdDev: number): number {
    const n = data.length;
    const skewness = data.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / stdDev, 3);
    }, 0) / n;
    return skewness;
  }

  private calculateKurtosis(data: number[], mean: number, stdDev: number): number {
    const n = data.length;
    const kurtosis = data.reduce((sum, val) => {
      return sum + Math.pow((val - mean) / stdDev, 4);
    }, 0) / n;
    return kurtosis - 3; // Excess kurtosis
  }

  private calculatePercentile(sorted: number[], percentile: number): number {
    const index = (percentile / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    
    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  // ============================================================================
  // QUERY AND ANALYSIS
  // ============================================================================

  async executeQuery(query: AnalyticsQuery): Promise<AnalyticsResult> {
    const startTime = Date.now();
    
    // Filter metrics based on query
    let metrics = Array.from(this.metrics.values())
      .filter(m => query.metrics.includes(m.id))
      .filter(m => m.timestamp >= query.timeRange.start && m.timestamp <= query.timeRange.end);

    // Apply filters
    if (query.filters.length > 0) {
      metrics = this.applyFilters(metrics, query.filters);
    }

    // Group by dimensions
    const groupedData = this.groupData(metrics, query.groupBy);

    // Aggregate data
    const aggregatedData = this.aggregateData(groupedData, query.aggregation);

    // Create data points
    const dataPoints: AnalyticsDataPoint[] = aggregatedData.map((group, index) => ({
      timestamp: new Date(query.timeRange.start.getTime() + (index * 3600000)), // Hourly intervals
      metrics: group.metrics,
      dimensions: group.dimensions,
      metadata: group.metadata
    }));

    // Calculate trends and anomalies
    const trends = await this.calculateTrendsForQuery(query);
    const anomalies = await this.getAnomaliesForQuery(query);

    const executionTime = Date.now() - startTime;

    return {
      data: dataPoints,
      metadata: {
        totalRecords: dataPoints.length,
        executionTime,
        cacheHit: false,
        query
      },
      aggregations: this.calculateAggregations(aggregatedData),
      trends,
      anomalies
    };
  }

  private applyFilters(metrics: AnalyticsMetric[], filters: any[]): AnalyticsMetric[] {
    return metrics.filter(metric => {
      return filters.every(filter => {
        const value = this.getFilterValue(metric, filter.field);
        return this.evaluateFilter(value, filter.operator, filter.value);
      });
    });
  }

  private getFilterValue(metric: AnalyticsMetric, field: string): any {
    switch (field) {
      case 'value': return metric.value;
      case 'type': return metric.type;
      case 'category': return metric.category;
      case 'status': return metric.status;
      default: return metric.metadata[field];
    }
  }

  private evaluateFilter(value: any, operator: string, filterValue: any): boolean {
    switch (operator) {
      case 'equals': return value === filterValue;
      case 'not_equals': return value !== filterValue;
      case 'greater_than': return value > filterValue;
      case 'less_than': return value < filterValue;
      case 'contains': return String(value).includes(String(filterValue));
      case 'between': return value >= filterValue[0] && value <= filterValue[1];
      default: return true;
    }
  }

  private groupData(metrics: AnalyticsMetric[], groupBy?: string[]): any[] {
    if (!groupBy || groupBy.length === 0) {
      return [{ metrics, dimensions: {}, metadata: {} }];
    }

    const groups: Record<string, AnalyticsMetric[]> = {};
    
    metrics.forEach(metric => {
      const key = groupBy.map(field => this.getFilterValue(metric, field)).join('|');
      if (!groups[key]) groups[key] = [];
      groups[key].push(metric);
    });

    return Object.entries(groups).map(([key, groupMetrics]) => ({
      metrics: groupMetrics,
      dimensions: groupBy.reduce((dims, field) => {
        dims[field] = this.getFilterValue(groupMetrics[0], field);
        return dims;
      }, {} as Record<string, any>),
      metadata: { count: groupMetrics.length }
    }));
  }

  private aggregateData(groups: any[], aggregation: string): any[] {
    return groups.map(group => ({
      ...group,
      metrics: this.performAggregation(group.metrics, aggregation)
    }));
  }

  private performAggregation(metrics: AnalyticsMetric[], aggregation: string): Record<string, number> {
    const values = metrics.map(m => m.value);
    
    let result: number;
    switch (aggregation) {
      case 'sum': result = values.reduce((sum, val) => sum + val, 0); break;
      case 'avg': result = values.reduce((sum, val) => sum + val, 0) / values.length; break;
      case 'min': result = Math.min(...values); break;
      case 'max': result = Math.max(...values); break;
      case 'count': result = values.length; break;
      case 'median': result = this.calculateMedian([...values].sort((a, b) => a - b)); break;
      default: result = values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    return result;
  }

  private calculateAggregations(groups: any[]): Record<string, number> {
    const allValues = groups.flatMap(g => g.metrics.map((m: AnalyticsMetric) => m.value));
    
    return {
      total: allValues.reduce((sum, val) => sum + val, 0),
      average: allValues.reduce((sum, val) => sum + val, 0) / allValues.length,
      minimum: Math.min(...allValues),
      maximum: Math.max(...allValues),
      count: allValues.length
    };
  }

  private async calculateTrendsForQuery(query: AnalyticsQuery): Promise<TrendAnalysis[]> {
    const trends: TrendAnalysis[] = [];
    
    for (const metricId of query.metrics) {
      const trend = await this.analyzeTrends(metricId, 'daily');
      trends.push(trend);
    }
    
    return trends;
  }

  private async getAnomaliesForQuery(query: AnalyticsQuery): Promise<AnomalyData[]> {
    const anomalies: AnomalyData[] = [];
    
    for (const metricId of query.metrics) {
      const metricAnomalies = this.anomalies.get(metricId) || [];
      anomalies.push(...metricAnomalies);
    }
    
    return anomalies;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateId(): string {
    return `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getAnomalies(metricId: string): Promise<AnomalyData[]> {
    return this.anomalies.get(metricId) || [];
  }

  async getAllAnomalies(organizationId: string): Promise<AnomalyData[]> {
    const allAnomalies: AnomalyData[] = [];
    
    for (const [metricId, anomalies] of this.anomalies.entries()) {
      const metric = this.metrics.get(metricId);
      if (metric && metric.organizationId === organizationId) {
        allAnomalies.push(...anomalies);
      }
    }
    
    return allAnomalies;
  }

  async getServiceStats(): Promise<{
    totalMetrics: number;
    totalTrends: number;
    totalAnomalies: number;
    config: AnalyticsConfig;
  }> {
    return {
      totalMetrics: this.metrics.size,
      totalTrends: this.trends.size,
      totalAnomalies: Array.from(this.anomalies.values()).flat().length,
      config: this.config
    };
  }
}
