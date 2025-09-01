import { register, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export class MetricsService {
  private healthCheckCounter!: Counter;
  private healthCheckDuration!: Histogram;
  // Marca como asignadas definitivamente después de initializeMetrics()
  // para satisfacer al compilador TS y mantener la inicialización perezosa.
  private metricsInitialized: boolean = false;

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    if (this.metricsInitialized) return;

    // Initialize default metrics
    collectDefaultMetrics({ register });

    // Health check metrics
    this.healthCheckCounter = new Counter({
      name: 'health_check_total',
      help: 'Total number of health checks',
      labelNames: ['type', 'status'],
      registers: [register]
    });

    this.healthCheckDuration = new Histogram({
      name: 'health_check_duration_seconds',
      help: 'Health check duration in seconds',
      labelNames: ['type', 'status'],
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [register]
    });

    this.metricsInitialized = true;
  }

  incrementHealthCheck(type: string, status: string = 'success'): void {
    this.healthCheckCounter.labels(type, status).inc();
  }

  recordHealthCheckDuration(type: string, durationMs: number, status: string = 'success'): void {
    this.healthCheckDuration.labels(type, status).observe(durationMs / 1000);
  }

  async getMetrics(): Promise<string> {
    return register.metrics();
  }

  // Compatibilidad: alias y helpers usados por código existente
  async getPrometheusMetrics(): Promise<string> {
    return this.getMetrics();
  }

  // Devuelve un resumen sencillo de métricas (placeholder compatible)
  getMetricsSummary(): Record<string, unknown> {
    return { metricCount: 0 };
  }

  // Devuelve todas las métricas en forma de objeto (placeholder)
  getAllMetrics(): Record<string, unknown> {
    return {};
  }

  // Exportar Prometheus (alias)
  async exportPrometheus(): Promise<string> {
    return this.getMetrics();
  }

  // Estadísticas de métricas (placeholder)
  getMetricsStats(): Record<string, unknown> {
    return {};
  }

  // Registro de métricas HTTP genérico utilizado por observability middleware
  recordHttpRequest(route: string, method: string, statusCode: number, durationMs: number, org?: string): void {
    this.recordHealthCheckDuration('http', durationMs);
    // safe no-op for other metrics
  }

  // Increment flexible: increment(name), increment(name, labels), increment(name, value, labels)
  increment(name: string, valueOrLabels?: number | Record<string, string>, maybeLabels?: Record<string, string>): void {
    try {
      const value = typeof valueOrLabels === 'number' ? valueOrLabels : 1;
      const labels = typeof valueOrLabels === 'object' ? valueOrLabels : maybeLabels || { success: 'true' };
      // Use healthCheckCounter as a safe sink for simple increments
      this.healthCheckCounter.labels(name, (labels as any).status || 'success').inc(value);
    } catch (e) {
      // no-op
    }
  }

  // Registro específico para rate limit
  recordRateLimit(route: string, org?: string): void {
    // no-op placeholder
  }

  // Registro genérico para sistema
  recordSystemMetrics(): void {
    // no-op placeholder
  }

  // Limpieza/stop de métricas
  cleanup(): void {
    register.clear();
    this.metricsInitialized = false;
    this.initializeMetrics();
  }

  async getMetricsContentType(): Promise<string> {
    return register.contentType;
  }

  clearMetrics(): void {
    register.clear();
    this.initializeMetrics();
  }
}

// Exportar una instancia única del servicio de métricas
export const metrics = new MetricsService();
