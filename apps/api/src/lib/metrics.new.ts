import { register, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export class MetricsService {
  private healthCheckCounter: Counter;
  private healthCheckDuration: Histogram;
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
