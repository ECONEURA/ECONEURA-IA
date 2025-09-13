import { trace, context, Span, SpanKind, SpanStatusCode, Tracer } from '@opentelemetry/api';
import { Request, Response, NextFunction } from 'express';

// ============================================================================
// TRACING SERVICE
// ============================================================================

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  service: string;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface SpanOptions {
  kind?: SpanKind;
  attributes?: Record<string, string | number | boolean>;
  startTime?: number;
  endTime?: number;
}

export class TracingService {
  private static instance: TracingService;
  private tracer: Tracer;

  private constructor() {
    this.tracer = trace.getTracer('econeura-api', '1.0.0');
  }

  public static getInstance(): TracingService {
    if (!TracingService.instance) {
      TracingService.instance = new TracingService();
    }
    return TracingService.instance;
  }

  // ========================================================================
  // SPAN CREATION
  // ========================================================================

  createSpan(name: string, options: SpanOptions = {}): Span {
    const span = this.tracer.startSpan(name, {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: {
        'service.name': 'econeura-api',
        'service.version': '1.0.0',
        ...options.attributes
      },
      startTime: options.startTime
    });

    return span;
  }

  createHttpSpan(req: Request, res: Response, options: SpanOptions = {}): Span {
    const span = this.tracer.startSpan(`${req.method} ${req.path}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'http.method': req.method,
        'http.url': req.url,
        'http.route': req.route?.path || req.path,
        'http.user_agent': req.headers['user-agent'] || '',
        'http.request_id': req.headers['x-request-id'] as string || '',
        'service.name': 'econeura-api',
        'service.version': '1.0.0',
        ...options.attributes
      }
    });

    // Add user context if available
    if (req.user?.id) {
      span.setAttributes({
        'user.id': req.user.id,
        'user.organization_id': req.user.organizationId || ''
      });
    }

    return span;
  }

  createDatabaseSpan(operation: string, table: string, options: SpanOptions = {}): Span {
    const span = this.tracer.startSpan(`db.${operation}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'db.system': 'postgresql',
        'db.operation': operation,
        'db.sql.table': table,
        'service.name': 'econeura-api',
        'service.version': '1.0.0',
        ...options.attributes
      }
    });

    return span;
  }

  createExternalApiSpan(service: string, endpoint: string, options: SpanOptions = {}): Span {
    const span = this.tracer.startSpan(`external.${service}`, {
      kind: SpanKind.CLIENT,
      attributes: {
        'http.method': 'POST',
        'http.url': endpoint,
        'external.service': service,
        'service.name': 'econeura-api',
        'service.version': '1.0.0',
        ...options.attributes
      }
    });

    return span;
  }

  createBusinessSpan(operation: string, organizationId: string, options: SpanOptions = {}): Span {
    const span = this.tracer.startSpan(`business.${operation}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'business.operation': operation,
        'organization.id': organizationId,
        'service.name': 'econeura-api',
        'service.version': '1.0.0',
        ...options.attributes
      }
    });

    return span;
  }

  // ========================================================================
  // SPAN EXECUTION
  // ========================================================================

  async executeWithSpan<T>(
    name: string,
    operation: () => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    const span = this.createSpan(name, options);
    
    try {
      const result = await context.with(trace.setSpan(context.active(), span), operation);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  async executeWithHttpSpan<T>(
    req: Request,
    res: Response,
    operation: () => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    const span = this.createHttpSpan(req, res, options);
    
    try {
      const result = await context.with(trace.setSpan(context.active(), span), operation);
      
      span.setAttributes({
        'http.status_code': res.statusCode,
        'http.response_size': JSON.stringify(res.locals.responseBody || {}).length
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  // ========================================================================
  // SPAN ATTRIBUTES
  // ========================================================================

  setSpanAttributes(span: Span, attributes: Record<string, string | number | boolean>): void {
    span.setAttributes(attributes);
  }

  addSpanEvent(span: Span, name: string, attributes?: Record<string, string | number | boolean>): void {
    span.addEvent(name, attributes);
  }

  setSpanStatus(span: Span, status: { code: SpanStatusCode; message?: string }): void {
    span.setStatus(status);
  }

  recordSpanException(span: Span, error: Error): void {
    span.recordException(error);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
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
      service: 'econeura-api'
    };
  }

  // ========================================================================
  // MIDDLEWARE
  // ========================================================================

  httpTracingMiddleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const span = this.createHttpSpan(req, res);
      
      // Store span in request for later use
      req.span = span;
      
      // Add trace headers to response
      res.setHeader('X-Trace-Id', span.spanContext().traceId);
      res.setHeader('X-Span-Id', span.spanContext().spanId);
      
      // End span when response finishes
      res.on('finish', () => {
        span.setAttributes({
          'http.status_code': res.statusCode,
          'http.response_size': JSON.stringify(res.locals.responseBody || {}).length
        });
        
        if (res.statusCode >= 400) {
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`
          });
        } else {
          span.setStatus({ code: SpanStatusCode.OK });
        }
        
        span.end();
      });
      
      next();
    };
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  createChildSpan(parentSpan: Span, name: string, options: SpanOptions = {}): Span {
    const span = this.tracer.startSpan(name, {
      kind: options.kind || SpanKind.INTERNAL,
      attributes: {
        'service.name': 'econeura-api',
        'service.version': '1.0.0',
        ...options.attributes
      }
    });

    return span;
  }

  // ========================================================================
  // PERFORMANCE TRACING
  // ========================================================================

  async tracePerformance<T>(
    operation: string,
    fn: () => Promise<T>,
    options: SpanOptions = {}
  ): Promise<T> {
    const startTime = Date.now();
    const span = this.createSpan(operation, options);
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      span.setAttributes({
        'performance.duration_ms': duration,
        'performance.operation': operation
      });
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      span.setAttributes({
        'performance.duration_ms': duration,
        'performance.operation': operation,
        'performance.error': true
      });
      
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error instanceof Error ? error.message : 'Unknown error'
      });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  }

  // ========================================================================
  // ERROR TRACING
  // ========================================================================

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
  }

  // ========================================================================
  // BUSINESS TRACING
  // ========================================================================

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

export const tracing = TracingService.getInstance();

// ============================================================================
// EXPRESS REQUEST EXTENSION
// ============================================================================

declare global {
  namespace Express {
    interface Request {
      span?: Span;
    }
  }
}
