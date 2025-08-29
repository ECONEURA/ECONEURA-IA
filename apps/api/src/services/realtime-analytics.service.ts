import { AIRouter } from '@econeura/shared';

export interface DataEvent {
  id: string;
  type: string;
  timestamp: Date;
  source: string;
  data: Record<string, any>;
  userId?: string;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export interface AnalyticsQuery {
  metric: string;
  dimensions: string[];
  filters: Record<string, any>;
  timeRange: {
    start: Date;
    end: Date;
    granularity: 'minute' | 'hour' | 'day' | 'week' | 'month';
  };
  aggregations: string[];
}

export interface RealTimeMetric {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: Date;
  metadata?: Record<string, any>;
}

export interface AnomalyDetection {
  metric: string;
  timestamp: Date;
  value: number;
  expectedValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  description: string;
}

export interface StreamProcessor {
  id: string;
  name: string;
  query: string;
  output: string;
  status: 'active' | 'paused' | 'error';
  processedEvents: number;
  errorCount: number;
  lastProcessed?: Date;
}

class RealTimeAnalyticsService {
  private eventStream: DataEvent[] = [];
  private metrics: Map<string, RealTimeMetric> = new Map();
  private anomalies: AnomalyDetection[] = [];
  private streamProcessors: Map<string, StreamProcessor> = new Map();
  private subscribers: Map<string, Array<(data: any) => void>> = new Map();
  private processingInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startProcessing();
  }

  async ingestEvent(event: Omit<DataEvent, 'id' | 'timestamp'>): Promise<string> {
    try {
      const id = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date();
      
      const dataEvent: DataEvent = {
        ...event,
        id,
        timestamp
      };

      this.eventStream.push(dataEvent);
      
      // Mantener solo los últimos 10,000 eventos en memoria
      if (this.eventStream.length > 10000) {
        this.eventStream = this.eventStream.slice(-9000);
      }

      // Procesar evento en tiempo real
      await this.processEvent(dataEvent);

      // Notificar suscriptores
      this.notifySubscribers('event', dataEvent);

      return id;
    } catch (error) {
      throw error;
    }
  }

  async queryAnalytics(query: AnalyticsQuery): Promise<any> {
    const span = createSpan('realtime.query_analytics', {
      metric: query.metric,
      granularity: query.timeRange.granularity
    });

    try {
      const filteredEvents = this.filterEvents(query);
      const aggregatedData = this.aggregateData(filteredEvents, query);
      
      return {
        query,
        data: aggregatedData,
        totalEvents: filteredEvents.length,
        queryTime: new Date()
      };
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async getRealTimeMetrics(): Promise<RealTimeMetric[]> {
    return Array.from(this.metrics.values());
  }

  async getMetricHistory(metricName: string, hours: number = 24): Promise<Array<{ timestamp: Date; value: number }>> {
    const span = createSpan('realtime.get_metric_history', { metric_name: metricName, hours });
    
    try {
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      const relevantEvents = this.eventStream.filter(event => 
        event.timestamp >= cutoff && 
        event.data[metricName] !== undefined
      );

      return relevantEvents.map(event => ({
        timestamp: event.timestamp,
        value: event.data[metricName]
      }));
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async detectAnomalies(metricName: string, threshold: number = 2.0): Promise<AnomalyDetection[]> {
    const span = createSpan('realtime.detect_anomalies', { metric_name: metricName, threshold });
    
    try {
      const history = await this.getMetricHistory(metricName, 168); // 1 semana
      if (history.length < 10) return [];

      const values = history.map(h => h.value);
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);

      const currentValue = values[values.length - 1];
      const deviation = Math.abs(currentValue - mean) / stdDev;

      if (deviation > threshold) {
        const severity = this.calculateSeverity(deviation);
        const confidence = Math.min(deviation / threshold, 1.0);

        const anomaly: AnomalyDetection = {
          metric: metricName,
          timestamp: new Date(),
          value: currentValue,
          expectedValue: mean,
          deviation,
          severity,
          confidence,
          description: `Anomaly detected: ${currentValue} vs expected ${mean.toFixed(2)} (±${(stdDev * threshold).toFixed(2)})`
        };

        this.anomalies.push(anomaly);
        
        // Mantener solo las últimas 100 anomalías
        if (this.anomalies.length > 100) {
          this.anomalies = this.anomalies.slice(-90);
        }

        return [anomaly];
      }

      return [];
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async createStreamProcessor(processor: Omit<StreamProcessor, 'id' | 'status' | 'processedEvents' | 'errorCount'>): Promise<StreamProcessor> {
    const span = createSpan('realtime.create_processor', { name: processor.name });
    
    try {
      const id = `processor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const newProcessor: StreamProcessor = {
        ...processor,
        id,
        status: 'active',
        processedEvents: 0,
        errorCount: 0
      };

      this.streamProcessors.set(id, newProcessor);
      
      span.setAttributes({ processor_id: id });
      return newProcessor;
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async getStreamProcessors(): Promise<StreamProcessor[]> {
    return Array.from(this.streamProcessors.values());
  }

  async subscribeToMetric(metricName: string, callback: (data: any) => void): Promise<string> {
    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.subscribers.has(metricName)) {
      this.subscribers.set(metricName, []);
    }
    
    this.subscribers.get(metricName)!.push(callback);
    
    return subscriptionId;
  }

  async unsubscribeFromMetric(metricName: string, subscriptionId: string): Promise<void> {
    const subscribers = this.subscribers.get(metricName);
    if (subscribers) {
      // En una implementación real, necesitaríamos una forma de identificar y remover callbacks específicos
      this.subscribers.delete(metricName);
    }
  }

  async getSystemHealth(): Promise<any> {
    const span = createSpan('realtime.get_health');
    
    try {
      const totalEvents = this.eventStream.length;
      const activeProcessors = Array.from(this.streamProcessors.values()).filter(p => p.status === 'active').length;
      const totalAnomalies = this.anomalies.length;
      const recentAnomalies = this.anomalies.filter(a => 
        a.timestamp >= new Date(Date.now() - 24 * 60 * 60 * 1000)
      ).length;

      const avgProcessingTime = this.calculateAverageProcessingTime();
      const errorRate = this.calculateErrorRate();

      return {
        status: 'healthy',
        metrics: {
          totalEvents,
          activeProcessors,
          totalAnomalies,
          recentAnomalies,
          avgProcessingTime,
          errorRate
        },
        lastUpdated: new Date()
      };
    } catch (error) {
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  private async processEvent(event: DataEvent): Promise<void> {
    const span = createSpan('realtime.process_event', { event_id: event.id });
    
    try {
      // Actualizar métricas en tiempo real
      await this.updateMetrics(event);
      
      // Ejecutar procesadores de stream
      await this.executeStreamProcessors(event);
      
      // Detectar anomalías
      await this.checkForAnomalies(event);
      
    } catch (error) {
      span.recordException(error as Error);
    } finally {
      span.end();
    }
  }

  private async updateMetrics(event: DataEvent): Promise<void> {
    for (const [key, value] of Object.entries(event.data)) {
      if (typeof value === 'number') {
        const metricName = `${event.type}_${key}`;
        const existingMetric = this.metrics.get(metricName);
        
        if (existingMetric) {
          const change = value - existingMetric.value;
          const changePercent = existingMetric.value !== 0 ? (change / existingMetric.value) * 100 : 0;
          
          this.metrics.set(metricName, {
            ...existingMetric,
            value,
            change,
            changePercent,
            trend: this.calculateTrend(changePercent),
            lastUpdated: new Date()
          });
        } else {
          this.metrics.set(metricName, {
            name: metricName,
            value,
            change: 0,
            changePercent: 0,
            trend: 'stable',
            lastUpdated: new Date()
          });
        }
      }
    }
  }

  private async executeStreamProcessors(event: DataEvent): Promise<void> {
    for (const processor of this.streamProcessors.values()) {
      if (processor.status !== 'active') continue;
      
      try {
        // Simular procesamiento de stream
        const matches = this.evaluateStreamQuery(processor.query, event);
        
        if (matches) {
          processor.processedEvents++;
          processor.lastProcessed = new Date();
          
          // Generar output basado en la configuración
          const output = this.generateStreamOutput(processor.output, event);
          
          // Notificar suscriptores
          this.notifySubscribers(processor.output, output);
        }
      } catch (error) {
        processor.errorCount++;
        if (processor.errorCount > 10) {
          processor.status = 'error';
        }
      }
    }
  }

  private async checkForAnomalies(event: DataEvent): Promise<void> {
    for (const [key, value] of Object.entries(event.data)) {
      if (typeof value === 'number') {
        const metricName = `${event.type}_${key}`;
        const anomalies = await this.detectAnomalies(metricName);
        
        if (anomalies.length > 0) {
          this.notifySubscribers('anomaly', anomalies[0]);
        }
      }
    }
  }

  private filterEvents(query: AnalyticsQuery): DataEvent[] {
    return this.eventStream.filter(event => {
      // Filtrar por rango de tiempo
      if (event.timestamp < query.timeRange.start || event.timestamp > query.timeRange.end) {
        return false;
      }
      
      // Filtrar por dimensiones
      for (const [key, value] of Object.entries(query.filters)) {
        if (event.data[key] !== value) {
          return false;
        }
      }
      
      return true;
    });
  }

  private aggregateData(events: DataEvent[], query: AnalyticsQuery): any {
    const aggregated: Record<string, any> = {};
    
    for (const aggregation of query.aggregations) {
      const values = events.map(event => event.data[query.metric]).filter(v => typeof v === 'number');
      
      switch (aggregation) {
        case 'sum':
          aggregated.sum = values.reduce((sum, val) => sum + val, 0);
          break;
        case 'avg':
          aggregated.avg = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
          break;
        case 'min':
          aggregated.min = values.length > 0 ? Math.min(...values) : 0;
          break;
        case 'max':
          aggregated.max = values.length > 0 ? Math.max(...values) : 0;
          break;
        case 'count':
          aggregated.count = values.length;
          break;
      }
    }
    
    return aggregated;
  }

  private evaluateStreamQuery(query: string, event: DataEvent): boolean {
    // Simulación de evaluación de query de stream
    // En producción, usar una librería como JSONPath o similar
    try {
      const queryObj = JSON.parse(query);
      return Object.entries(queryObj).every(([key, value]) => event.data[key] === value);
    } catch {
      return true; // Si no se puede parsear, aceptar todos los eventos
    }
  }

  private generateStreamOutput(outputConfig: string, event: DataEvent): any {
    try {
      const config = JSON.parse(outputConfig);
      const output: Record<string, any> = {};
      
      for (const [outputKey, sourceKey] of Object.entries(config)) {
        output[outputKey] = event.data[sourceKey as string];
      }
      
      return output;
    } catch {
      return event.data;
    }
  }

  private notifySubscribers(topic: string, data: any): void {
    const subscribers = this.subscribers.get(topic);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          // Log error but don't break other subscribers
        }
      });
    }
  }

  private calculateTrend(changePercent: number): 'up' | 'down' | 'stable' {
    if (changePercent > 5) return 'up';
    if (changePercent < -5) return 'down';
    return 'stable';
  }

  private calculateSeverity(deviation: number): 'low' | 'medium' | 'high' | 'critical' {
    if (deviation > 5) return 'critical';
    if (deviation > 3) return 'high';
    if (deviation > 2) return 'medium';
    return 'low';
  }

  private calculateAverageProcessingTime(): number {
    // Simulación de cálculo de tiempo promedio de procesamiento
    return Math.random() * 100 + 50; // 50-150ms
  }

  private calculateErrorRate(): number {
    const totalProcessors = this.streamProcessors.size;
    if (totalProcessors === 0) return 0;
    
    const errorProcessors = Array.from(this.streamProcessors.values()).filter(p => p.status === 'error').length;
    return (errorProcessors / totalProcessors) * 100;
  }

  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      // Procesamiento periódico de métricas y limpieza
      this.cleanupOldData();
      this.updateSystemMetrics();
    }, 60000); // Cada minuto
  }

  private cleanupOldData(): void {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 horas
    this.eventStream = this.eventStream.filter(event => event.timestamp >= cutoff);
  }

  private updateSystemMetrics(): void {
    // Actualizar métricas del sistema
    this.metrics.set('system_total_events', {
      name: 'system_total_events',
      value: this.eventStream.length,
      change: 0,
      changePercent: 0,
      trend: 'stable',
      lastUpdated: new Date()
    });
  }
}

export const realtimeAnalyticsService = new RealTimeAnalyticsService();
