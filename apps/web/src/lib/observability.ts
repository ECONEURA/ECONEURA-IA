interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
}

interface MetricValue {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
}

class WebObservability {
  private logs: LogEntry[] = [];
  private metrics: MetricValue[] = [];
  private readonly MAX_LOGS = 1000;
  private readonly MAX_METRICS = 1000;
  private serviceName = 'web-bff';

  // Logging
  log(level: 'error' | 'warn' | 'info' | 'debug', message: string, context?: Record<string, any>): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      traceId: context?.traceId || this.generateTraceId(),
      spanId: this.generateSpanId()
    };

    this.logs.push(logEntry);

    // Limpiar logs antiguos
    if (this.logs.length > this.MAX_LOGS) {
      this.logs = this.logs.slice(-this.MAX_LOGS);
    }

    // En desarrollo, mostrar en consola
    if (process.env.NODE_ENV === 'development') {
      const color = {
        error: '\x1b[31m',
        warn: '\x1b[33m',
        info: '\x1b[36m',
        debug: '\x1b[35m'
      }[level] || '\x1b[0m';

      
      if (context) {
        
      }
    }
  }

  error(message: string, context?: Record<string, any>): void {
    this.log('error', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  // Métricas
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const metric: MetricValue = {
      name,
      value,
      timestamp: Date.now(),
      labels
    };

    this.metrics.push(metric);

    // Limpiar métricas antiguas
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
  }

  increment(name: string, value: number = 1, labels?: Record<string, string>): void {
    this.recordMetric(name, value, labels);
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.recordMetric(name, value, labels);
  }

  // Métodos específicos
  recordPageView(page: string, duration: number): void {
    this.recordMetric('page_view_total', 1, { page });
    this.recordMetric('page_view_duration_ms', duration, { page });
  }

  recordAPIRequest(endpoint: string, method: string, statusCode: number, duration: number): void {
    this.recordMetric('api_requests_total', 1, { endpoint, method, status: statusCode.toString() });
    this.recordMetric('api_request_duration_ms', duration, { endpoint, method });
    
    if (statusCode >= 400) {
      this.recordMetric('api_errors_total', 1, { endpoint, method, status: statusCode.toString() });
    }
  }

  recordAIRequest(model: string, provider: string, duration: number): void {
    this.recordMetric('ai_requests_total', 1, { model, provider });
    this.recordMetric('ai_request_duration_ms', duration, { model, provider });
  }

  recordError(error: string, context?: Record<string, any>): void {
    this.recordMetric('errors_total', 1, { type: 'client_error', error });
    this.error(error, context);
  }

  // Utilidades
  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSpanId(): string {
    return `span_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Métodos para obtener datos
  getLogs(level?: string, limit: number = 100): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }
    
    return filteredLogs.slice(-limit);
  }

  getMetrics(name?: string, limit: number = 100): MetricValue[] {
    let filteredMetrics = this.metrics;
    
    if (name) {
      filteredMetrics = filteredMetrics.filter(metric => metric.name === name);
    }
    
    return filteredMetrics.slice(-limit);
  }

  getMetricsSummary(): any {
    const summary: any = {};
    
    // Agrupar métricas por nombre
    const groupedMetrics = new Map<string, MetricValue[]>();
    
    for (const metric of this.metrics) {
      if (!groupedMetrics.has(metric.name)) {
        groupedMetrics.set(metric.name, []);
      }
      groupedMetrics.get(metric.name)!.push(metric);
    }

    // Calcular estadísticas para cada métrica
    for (const [name, values] of groupedMetrics) {
      const numericValues = values.map(v => v.value);
      
      summary[name] = {
        count: values.length,
        total: numericValues.reduce((sum, val) => sum + val, 0),
        average: numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length,
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        latest: values[values.length - 1]?.value
      };
    }

    return summary;
  }

  // Método para exportar en formato Prometheus
  exportPrometheus(): string {
    let output = '';
    
    // Agrupar métricas por nombre y labels
    const groupedMetrics = new Map<string, Map<string, number>>();
    
    for (const metric of this.metrics) {
      const labelStr = metric.labels 
        ? Object.entries(metric.labels).map(([k, v]) => `${k}="${v}"`).join(',')
        : '';
      
      const key = `${metric.name}${labelStr ? `{${labelStr}}` : ''}`;
      
      if (!groupedMetrics.has(key)) {
        groupedMetrics.set(key, new Map());
      }
      
      // Usar el último valor para cada combinación
      groupedMetrics.get(key)!.set('value', metric.value);
    }

    // Escribir métricas
    for (const [key, values] of groupedMetrics) {
      const value = values.get('value') || 0;
      output += `${key} ${value}\n`;
    }

    return output;
  }

  // Método para limpiar datos antiguos
  cleanup(maxAgeMs: number = 24 * 60 * 60 * 1000): void { // Por defecto 24 horas
    const cutoff = Date.now() - maxAgeMs;
    
    this.logs = this.logs.filter(log => new Date(log.timestamp).getTime() >= cutoff);
    this.metrics = this.metrics.filter(metric => metric.timestamp >= cutoff);
  }

  // Método para obtener estadísticas
  getStats(): any {
    return {
      service: this.serviceName,
      logs: {
        total: this.logs.length,
        byLevel: {
          error: this.logs.filter(l => l.level === 'error').length,
          warn: this.logs.filter(l => l.level === 'warn').length,
          info: this.logs.filter(l => l.level === 'info').length,
          debug: this.logs.filter(l => l.level === 'debug').length
        }
      },
      metrics: {
        total: this.metrics.length,
        uniqueNames: new Set(this.metrics.map(m => m.name)).size
      }
    };
  }
}

export const observability = new WebObservability();
