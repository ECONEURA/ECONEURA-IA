/**
 * Observability OpenTelemetry Service
 * PR-103: Observabilidad/OTel (api) - propagación y trazas
 * 
 * Servicio de observabilidad mejorado con OpenTelemetry, propagación de trazas
 * y métricas avanzadas
 */

import { trace, context, Span, SpanKind, SpanStatusCode, Tracer, metrics, Meter } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';

import { structuredLogger } from '../lib/structured-logger.js';

// Interfaces para observabilidad
export interface ObservabilityConfig {
  service: {
    name: string;
    version: string;
    environment: string;
    instance: string;
  };
  tracing: {
    enabled: boolean;
    samplingRate: number;
    maxSpansPerTrace: number;
    batchSize: number;
    exportTimeout: number;
  };
  metrics: {
    enabled: boolean;
    collectionInterval: number;
    customMetrics: boolean;
  };
  logging: {
    enabled: boolean;
    level: 'debug' | 'info' | 'warn' | 'error';
    structured: boolean;
  };
}

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  service: string;
  userId?: string;
  organizationId?: string;
  tenantId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface SpanMetrics {
  totalSpans: number;
  activeSpans: number;
  completedSpans: number;
  errorSpans: number;
  averageDuration: number;
  p95Duration: number;
  p99Duration: number;
}

export interface ServiceMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate: number;
  };
  latency: {
    average: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errors: {
    total: number;
    rate: number;
    byType: Record<string, number>;
  };
  resources: {
    memory: {
      used: number;
      total: number;
      percentage: number;
    };
    cpu: {
      usage: number;
      load: number;
    };
  };
}

class ObservabilityOTelService {
  private static instance: ObservabilityOTelService;
  private tracer: Tracer;
  private meter: Meter;
  private config: ObservabilityConfig;
  private spanMetrics: SpanMetrics;
  private serviceMetrics: ServiceMetrics;
  private activeSpans: Map<string, Span> = new Map();
  private spanDurations: number[] = [];

  private constructor() {
    this.tracer = trace.getTracer('econeura-api', '1.0.0');
    this.meter = metrics.getMeter('econeura-api', '1.0.0');
    this.config = this.getDefaultConfig();
    this.spanMetrics = this.getDefaultSpanMetrics();
    this.serviceMetrics = this.getDefaultServiceMetrics();
    this.init();
  }

  public static getInstance(): ObservabilityOTelService {
    if (!ObservabilityOTelService.instance) {
      ObservabilityOTelService.instance = new ObservabilityOTelService();
    }
    return ObservabilityOTelService.instance;
  }

  private getDefaultConfig(): ObservabilityConfig {
    return {
      service: {
        name: 'econeura-api',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        instance: process.env.HOSTNAME || 'localhost'
      },
      tracing: {
        enabled: true,
        samplingRate: 1.0,
        maxSpansPerTrace: 100,
        batchSize: 512,
        exportTimeout: 30000
      },
      metrics: {
        enabled: true,
        collectionInterval: 30000,
        customMetrics: true
      },
      logging: {
        enabled: true,
        level: 'info',
        structured: true
      }
    };
  }

  private getDefaultSpanMetrics(): SpanMetrics {
    return {
      totalSpans: 0,
      activeSpans: 0,
      completedSpans: 0,
      errorSpans: 0,
      averageDuration: 0,
      p95Duration: 0,
      p99Duration: 0
    };
  }

  private getDefaultServiceMetrics(): ServiceMetrics {
    return {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        rate: 0
      },
      latency: {
        average: 0,
        p50: 0,
        p95: 0,
        p99: 0
      },
      errors: {
        total: 0,
        rate: 0,
        byType: {}
      },
      resources: {
        memory: {
          used: 0,
          total: 0,
          percentage: 0
        },
        cpu: {
          usage: 0,
          load: 0
        }
      }
    };
  }

  private init(): void {
    try {
      // Inicializar métricas OpenTelemetry
      this.initializeMetrics();
      
      // Inicializar limpieza periódica
      this.startCleanupScheduler();
      
      // Inicializar recolección de métricas del sistema
      this.startSystemMetricsCollection();
      
      structuredLogger.info('Observability OpenTelemetry service initialized', {
        service: this.config.service.name,
        version: this.config.service.version,
        environment: this.config.service.environment,
        tracingEnabled: this.config.tracing.enabled,
        metricsEnabled: this.config.metrics.enabled
      });
    } catch (error) {
      structuredLogger.error('Failed to initialize observability service', {
        error: (error as Error).message
      });
      throw error;
    }
  }

  private initializeMetrics(): void {
    // Métricas de requests HTTP
    this.meter.createCounter('http_requests_total', {
      description: 'Total number of HTTP requests',
      unit: '1'
    });

    // Métricas de duración de requests
    this.meter.createHistogram('http_request_duration_ms', {
      description: 'HTTP request duration in milliseconds',
      unit: 'ms'
    });

    // Métricas de errores
    this.meter.createCounter('http_errors_total', {
      description: 'Total number of HTTP errors',
      unit: '1'
    });

    // Métricas de spans
    this.meter.createCounter('spans_total', {
      description: 'Total number of spans created',
      unit: '1'
    });

    // Métricas de duración de spans
    this.meter.createHistogram('span_duration_ms', {
      description: 'Span duration in milliseconds',
      unit: 'ms'
    });

    // Métricas de memoria
    this.meter.createGauge('memory_usage_bytes', {
      description: 'Memory usage in bytes',
      unit: 'bytes'
    });

    // Métricas de CPU
    this.meter.createGauge('cpu_usage_percent', {
      description: 'CPU usage percentage',
      unit: 'percent'
    });
  }

  // ========================================================================
  // TRACING METHODS
  // ========================================================================

  createSpan(name: string, options: {
    kind?: SpanKind;
    attributes?: Record<string, string | number | boolean>;
    parentSpan?: Span;
  } = {}): Span {
    const span = this.tracer.startSpan(name, {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: {
        'service.name': this.config.service.name,
        'service.version': this.config.service.version,
        'service.environment': this.config.service.environment,
        'service.instance': this.config.service.instance,
        ...options.attributes
      }
    });

    // Registrar span activo
    this.activeSpans.set(span.spanContext().spanId, span);
    this.spanMetrics.totalSpans++;
    this.spanMetrics.activeSpans++;

    return span;
  }

  createHttpSpan(req: Request, res: Response, options: {
    attributes?: Record<string, string | number | boolean>;
    parentSpan?: Span;
  } = {}): Span {
    const span = this.tracer.startSpan(`${req.method} ${req.path}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.route': req.route?.path || req.path,
        'http.user_agent': req.headers['user-agent'] || '',
        'http.request_id': req.headers['x-request-id'] as string || '',
        'http.tenant_id': req.headers['x-tenant-id'] as string || '',
        'http.organization_id': req.headers['x-organization-id'] as string || '',
        'service.name': this.config.service.name,
        'service.version': this.config.service.version,
        'service.environment': this.config.service.environment,
        ...options.attributes
      }
    });

    // Agregar contexto de usuario si está disponible
    if ((req as any).user?.id) {
      span.setAttributes({
        'user.id': (req as any).user.id,
        'user.organization_id': (req as any).user.organizationId || '',
        'user.tenant_id': (req as any).user.tenantId || ''
      });
    }

    // Registrar span activo
    this.activeSpans.set(span.spanContext().spanId, span);
    this.spanMetrics.totalSpans++;
    this.spanMetrics.activeSpans++;

    return span;
  }

  createDatabaseSpan(operation: string, table: string, options: {
    attributes?: Record<string, string | number | boolean>;
    parentSpan?: Span;
  } = {}): Span {
    const span = this.tracer.startSpan(`db.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.operation': operation,
        'db.sql.table': table,
        'service.name': this.config.service.name,
        'service.version': this.config.service.version,
        ...options.attributes
      }
    });

    // Registrar span activo
    this.activeSpans.set(span.spanContext().spanId, span);
    this.spanMetrics.totalSpans++;
    this.spanMetrics.activeSpans++;

    return span;
  }

  createExternalApiSpan(service: string, endpoint: string, options: {
    attributes?: Record<string, string | number | boolean>;
    parentSpan?: Span;
  } = {}): Span {
    const span = this.tracer.startSpan(`external.${service}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': 'POST',
        'http.url': endpoint,
        'external.service': service,
        'service.name': this.config.service.name,
        'service.version': this.config.service.version,
        ...options.attributes
      }
    });

    // Registrar span activo
    this.activeSpans.set(span.spanContext().spanId, span);
    this.spanMetrics.totalSpans++;
    this.spanMetrics.activeSpans++;

    return span;
  }

  createBusinessSpan(operation: string, organizationId: string, options: {
    attributes?: Record<string, string | number | boolean>;
    parentSpan?: Span;
  } = {}): Span {
    const span = this.tracer.startSpan(`business.${operation}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'business.operation': operation,
        'organization.id': organizationId,
        'service.name': this.config.service.name,
        'service.version': this.config.service.version,
        ...options.attributes
      }
    });

    // Registrar span activo
    this.activeSpans.set(span.spanContext().spanId, span);
    this.spanMetrics.totalSpans++;
    this.spanMetrics.activeSpans++;

    return span;
  }

  // ========================================================================
  // SPAN EXECUTION
  // ========================================================================

  async executeWithSpan<T>(
    name: string,
    operation: () => Promise<T>,
    options: {
      attributes?: Record<string, string | number | boolean>;
      parentSpan?: Span;
    } = {}
  ): Promise<T> {
    const span = this.createSpan(name, options);
    const startTime = Date.now();
    
    try {
      const result = await context.with(trace.setSpan(context.active(), span), operation);
      const duration = Date.now() - startTime;
      
      span.setAttributes({
        'performance.duration_ms': duration,
        'performance.operation': name
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      this.recordSpanCompletion(span, duration, false);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      span.setAttributes({
        'performance.duration_ms': duration,
        'performance.operation': name,
        'performance.error': true
      });
      
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error as Error);
      this.recordSpanCompletion(span, duration, true);
      
      throw error;
    } finally {
      span.end();
    }
  }

  async executeWithHttpSpan<T>(
    req: Request,
    res: Response,
    operation: () => Promise<T>,
    options: {
      attributes?: Record<string, string | number | boolean>;
      parentSpan?: Span;
    } = {}
  ): Promise<T> {
    const span = this.createHttpSpan(req, res, options);
    const startTime = Date.now();
    
    try {
      const result = await context.with(trace.setSpan(context.active(), span), operation);
      const duration = Date.now() - startTime;
      
      span.setAttributes({
        'http.status_code': res.statusCode,
        'http.response_size': JSON.stringify(res.locals.responseBody || {}).length,
        'performance.duration_ms': duration
      });
      
      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`
        });
        this.recordHttpRequest(req, res, duration, true);
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
        this.recordHttpRequest(req, res, duration, false);
      }
      
      this.recordSpanCompletion(span, duration, res.statusCode >= 400);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error as Error);
      this.recordHttpRequest(req, res, duration, true);
      this.recordSpanCompletion(span, duration, true);
      
      throw error;
    } finally {
      span.end();
    }
  }

  // ========================================================================
  // CONTEXT PROPAGATION
  // ========================================================================

  getCurrentSpan(): Span | undefined {
    return trace.getActiveSpan();
  }

  getCurrentTraceId(): string | undefined {
    const span = this.getCurrentSpan();
    return span?.spanContext().traceId;
  }

  getCurrentSpanId(): string | undefined {
    const span = this.getCurrentSpan();
    return span?.spanContext().spanId;
  }

  getTraceContext(): TraceContext | undefined {
    const span = this.getCurrentSpan();
    if (!span) return undefined;

    const spanContext = span.spanContext();
    return {
      traceId: spanContext.traceId,
      spanId: spanContext.spanId,
      operation: span.name,
      service: this.config.service.name
    };
  }

  // ========================================================================
  // METRICS RECORDING
  // ========================================================================

  private recordSpanCompletion(span: Span, duration: number, isError: boolean): void {
    this.spanMetrics.activeSpans--;
    this.spanMetrics.completedSpans++;
    
    if (isError) {
      this.spanMetrics.errorSpans++;
    }
    
    // Registrar duración
    this.spanDurations.push(duration);
    
    // Mantener solo las últimas 1000 duraciones para cálculos
    if (this.spanDurations.length > 1000) {
      this.spanDurations.shift();
    }
    
    // Actualizar métricas de duración
    this.updateDurationMetrics();
    
    // Remover span activo
    this.activeSpans.delete(span.spanContext().spanId);
  }

  private recordHttpRequest(req: Request, res: Response, duration: number, isError: boolean): void {
    this.serviceMetrics.requests.total++;
    
    if (isError) {
      this.serviceMetrics.requests.failed++;
      this.serviceMetrics.errors.total++;
      
      // Registrar error por tipo
      const errorType = `http_${res.statusCode}`;
      this.serviceMetrics.errors.byType[errorType] = (this.serviceMetrics.errors.byType[errorType] || 0) + 1;
    } else {
      this.serviceMetrics.requests.successful++;
    }
    
    // Actualizar métricas de latencia
    this.updateLatencyMetrics(duration);
  }

  private updateDurationMetrics(): void {
    if (this.spanDurations.length === 0) return;
    
    const sorted = [...this.spanDurations].sort((a, b) => a - b);
    const len = sorted.length;
    
    this.spanMetrics.averageDuration = sorted.reduce((sum, d) => sum + d, 0) / len;
    this.spanMetrics.p95Duration = sorted[Math.floor(len * 0.95)];
    this.spanMetrics.p99Duration = sorted[Math.floor(len * 0.99)];
  }

  private updateLatencyMetrics(duration: number): void {
    // Implementar métricas de latencia similares a las de duración
    // Por simplicidad, usar el mismo array para ambas métricas
    this.updateDurationMetrics();
    
    this.serviceMetrics.latency.average = this.spanMetrics.averageDuration;
    this.serviceMetrics.latency.p50 = this.spanMetrics.averageDuration;
    this.serviceMetrics.latency.p95 = this.spanMetrics.p95Duration;
    this.serviceMetrics.latency.p99 = this.spanMetrics.p99Duration;
  }

  // ========================================================================
  // SYSTEM METRICS
  // ========================================================================

  private startSystemMetricsCollection(): void {
    if (!this.config.metrics.enabled) return;
    
    setInterval(() => {
      this.collectSystemMetrics();
    }, this.config.metrics.collectionInterval);
  }

  private collectSystemMetrics(): void {
    try {
      const memUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      this.serviceMetrics.resources.memory.used = memUsage.heapUsed;
      this.serviceMetrics.resources.memory.total = memUsage.heapTotal;
      this.serviceMetrics.resources.memory.percentage = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      // CPU usage es más complejo de calcular, usar un valor aproximado
      this.serviceMetrics.resources.cpu.usage = 0; // Implementar cálculo real si es necesario
      this.serviceMetrics.resources.cpu.load = 0; // Implementar cálculo real si es necesario
      
      structuredLogger.debug('System metrics collected', {
        memory: this.serviceMetrics.resources.memory,
        cpu: this.serviceMetrics.resources.cpu
      });
    } catch (error) {
      structuredLogger.error('Failed to collect system metrics', {
        error: (error as Error).message
      });
    }
  }

  // ========================================================================
  // CLEANUP AND MAINTENANCE
  // ========================================================================

  private startCleanupScheduler(): void {
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // Cada 5 minutos
  }

  private cleanup(): void {
    try {
      // Limpiar spans activos huérfanos (más de 5 minutos)
      const cutoff = Date.now() - 5 * 60 * 1000;
      const orphanedSpans: string[] = [];
      
      for (const [spanId, span] of this.activeSpans) {
        // Verificar si el span es muy antiguo (esto es una aproximación)
        if (this.spanMetrics.totalSpans > 10000) {
          orphanedSpans.push(spanId);
        }
      }
      
      for (const spanId of orphanedSpans) {
        this.activeSpans.delete(spanId);
        this.spanMetrics.activeSpans--;
      }
      
      // Limpiar duraciones antiguas
      if (this.spanDurations.length > 1000) {
        this.spanDurations = this.spanDurations.slice(-1000);
      }
      
      structuredLogger.debug('Observability cleanup completed', {
        orphanedSpansRemoved: orphanedSpans.length,
        activeSpans: this.spanMetrics.activeSpans,
        totalDurations: this.spanDurations.length
      });
    } catch (error) {
      structuredLogger.error('Observability cleanup failed', {
        error: (error as Error).message
      });
    }
  }

  // ========================================================================
  // GETTERS AND STATUS
  // ========================================================================

  getConfig(): ObservabilityConfig {
    return { ...this.config };
  }

  getSpanMetrics(): SpanMetrics {
    return { ...this.spanMetrics };
  }

  getServiceMetrics(): ServiceMetrics {
    return { ...this.serviceMetrics };
  }

  getActiveSpans(): Span[] {
    return Array.from(this.activeSpans.values());
  }

  getActiveSpanCount(): number {
    return this.activeSpans.size;
  }

  // ========================================================================
  // MIDDLEWARE
  // ========================================================================

  httpTracingMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const span = this.createHttpSpan(req, res);
      
      // Almacenar span en request para uso posterior
      (req as any).span = span;
      
      // Agregar headers de trace a la respuesta
      res.setHeader('X-Trace-Id', span.spanContext().traceId);
      res.setHeader('X-Span-Id', span.spanContext().spanId);
      
      // Finalizar span cuando termine la respuesta
      res.on('finish', () => {
        const duration = Date.now() - (req as any).startTime || 0;
        
        span.setAttributes({
          'http.status_code': res.statusCode,
          'http.response_size': JSON.stringify(res.locals.responseBody || {}).length,
          'performance.duration_ms': duration
        });
        
        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }
        
        this.recordSpanCompletion(span, duration, res.statusCode >= 400);
        span.end();
      });
      
      next();
    };
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  createChildSpan(parentSpan: Span, name: string, options: {
    attributes?: Record<string, string | number | boolean>;
  } = {}): Span {
    const span = this.tracer.startSpan(name, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'service.name': this.config.service.name,
        'service.version': this.config.service.version,
        ...options.attributes
      }
    });

    // Registrar span activo
    this.activeSpans.set(span.spanContext().spanId, span);
    this.spanMetrics.totalSpans++;
    this.spanMetrics.activeSpans++;

    return span;
  }

  traceError(error: Error, context: Record<string, any> = {}): void {
    const span = this.getCurrentSpan();
    if (span) {
      span.recordException(error);
      span.setAttributes({
        'error.name': error.name,
        'error.message': error.message,
        'error.stack': error.stack || '',
        ...context
      });
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message
      });
    }
    
    // Registrar error en métricas
    this.serviceMetrics.errors.total++;
    const errorType = error.constructor.name;
    this.serviceMetrics.errors.byType[errorType] = (this.serviceMetrics.errors.byType[errorType] || 0) + 1;
  }

  traceBusinessOperation(operation: string, organizationId: string, context: Record<string, any> = {}): Span {
    const span = this.createBusinessSpan(operation, organizationId);
    
    span.setAttributes({
      'business.operation': operation,
      'organization.id': organizationId,
      ...context
    });
    
    return span;
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const observabilityOTelService = ObservabilityOTelService.getInstance();

// ============================================================================
// EXPRESS REQUEST EXTENSION
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      span?: Span;
      startTime?: number;
    }
  }
}
