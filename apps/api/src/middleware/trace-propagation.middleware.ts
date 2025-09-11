/**
 * Trace Propagation Middleware
 * PR-103: Observabilidad/OTel (api) - propagación y trazas
 * 
 * Middleware para propagación de trazas OpenTelemetry entre servicios
 */

import { Request, Response, NextFunction } from 'express';
import { trace, context, Span, SpanKind, SpanStatusCode } from '@opentelemetry/api';
import { observabilityOTelService } from '../services/observability-otel.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

// =============================================================================
// INTERFACES
// =============================================================================

interface TraceHeaders {
  'traceparent'?: string;
  'tracestate'?: string;
  'x-trace-id'?: string;
  'x-span-id'?: string;
  'x-request-id'?: string;
  'x-correlation-id'?: string;
}

interface ExtendedRequest extends Request {
  traceContext?: {
    traceId: string;
    spanId: string;
    parentSpanId?: string;
    requestId: string;
    correlationId: string;
  };
  span?: Span;
  startTime?: number;
}

// =============================================================================
// TRACE PROPAGATION MIDDLEWARE
// =============================================================================

/**
 * Middleware para propagación de trazas OpenTelemetry
 * Extrae headers de trace y crea contexto de propagación
 */
export function tracePropagationMiddleware() {
  return (req: ExtendedRequest, res: Response, next: NextFunction): void => {
    try {
      // Extraer headers de trace
      const traceHeaders = extractTraceHeaders(req);
      
      // Crear contexto de trace
      const traceContext = createTraceContext(traceHeaders, req);
      
      // Almacenar contexto en request
      req.traceContext = traceContext;
      req.startTime = Date.now();
      
      // Crear span HTTP
      const span = observabilityOTelService.createHttpSpan(req, res, {
        attributes: {
          'trace.propagation': 'incoming',
          'trace.request_id': traceContext.requestId,
          'trace.correlation_id': traceContext.correlationId,
          'trace.parent_span_id': traceContext.parentSpanId || '',
          'trace.incoming': true
        }
      });
      
      // Almacenar span en request
      req.span = span;
      
      // Agregar headers de trace a la respuesta
      addTraceHeadersToResponse(res, traceContext, span);
      
      // Configurar finalización del span
      setupSpanFinalization(req, res, span);
      
      // Log de propagación de trace
      structuredLogger.info('Trace propagation middleware applied', {
        traceId: traceContext.traceId,
        spanId: traceContext.spanId,
        parentSpanId: traceContext.parentSpanId,
        requestId: traceContext.requestId,
        correlationId: traceContext.correlationId,
        method: req.method,
        path: req.path
      });
      
      next();
    } catch (error) {
      structuredLogger.error('Trace propagation middleware failed', {
        error: (error as Error).message,
        method: req.method,
        path: req.path
      });
      
      // Continuar sin propagación de trace en caso de error
      next();
    }
  };
}

// =============================================================================
// OUTGOING TRACE PROPAGATION
// =============================================================================

/**
 * Middleware para propagación de trazas en requests salientes
 * Agrega headers de trace a requests HTTP salientes
 */
export function outgoingTracePropagationMiddleware() {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Interceptar requests salientes (esto se aplicaría a un cliente HTTP)
      // Por ahora, solo loggear la intención
      structuredLogger.debug('Outgoing trace propagation middleware applied', {
        method: req.method,
        path: req.path
      });
      
      next();
    } catch (error) {
      structuredLogger.error('Outgoing trace propagation middleware failed', {
        error: (error as Error).message
      });
      next();
    }
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Extrae headers de trace del request
 */
function extractTraceHeaders(req: Request): TraceHeaders {
  return {
    'traceparent': req.headers['traceparent'] as string,
    'tracestate': req.headers['tracestate'] as string,
    'x-trace-id': req.headers['x-trace-id'] as string,
    'x-span-id': req.headers['x-span-id'] as string,
    'x-request-id': req.headers['x-request-id'] as string,
    'x-correlation-id': req.headers['x-correlation-id'] as string
  };
}

/**
 * Crea contexto de trace basado en headers
 */
function createTraceContext(headers: TraceHeaders, req: Request): ExtendedRequest['traceContext'] {
  // Generar IDs únicos
  const traceId = headers['x-trace-id'] || generateTraceId();
  const spanId = generateSpanId();
  const requestId = headers['x-request-id'] || generateRequestId();
  const correlationId = headers['x-correlation-id'] || generateCorrelationId();
  
  // Extraer parent span ID si existe
  const parentSpanId = headers['x-span-id'];
  
  return {
    traceId,
    spanId,
    parentSpanId,
    requestId,
    correlationId
  };
}

/**
 * Agrega headers de trace a la respuesta
 */
function addTraceHeadersToResponse(res: Response, traceContext: ExtendedRequest['traceContext'], span: Span): void {
  if (!traceContext) return;
  
  // Headers estándar de OpenTelemetry
  res.setHeader('X-Trace-Id', traceContext.traceId);
  res.setHeader('X-Span-Id', traceContext.spanId);
  res.setHeader('X-Request-ID', traceContext.requestId);
  res.setHeader('X-Correlation-ID', traceContext.correlationId);
  
  // Headers de OpenTelemetry W3C Trace Context
  const traceparent = `00-${traceContext.traceId}-${traceContext.spanId}-01`;
  res.setHeader('Traceparent', traceparent);
  
  // Headers adicionales para debugging
  res.setHeader('X-Trace-Propagation', 'enabled');
  res.setHeader('X-Trace-Service', 'econeura-api');
  res.setHeader('X-Trace-Version', '1.0.0');
}

/**
 * Configura la finalización del span
 */
function setupSpanFinalization(req: ExtendedRequest, res: Response, span: Span): void {
  res.on('finish', () => {
    try {
      const duration = Date.now() - (req.startTime || Date.now());
      
      // Agregar atributos finales al span
      span.setAttributes({
        'http.status_code': res.statusCode,
        'http.response_size': JSON.stringify(res.locals.responseBody || {}).length,
        'performance.duration_ms': duration,
        'trace.propagation': 'outgoing',
        'trace.completed': true
      });
      
      // Establecer estado del span
      if (res.statusCode >= 400) {
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: `HTTP ${res.statusCode}`
        });
      } else {
        span.setStatus({ code: SpanStatusCode.OK });
      }
      
      // Finalizar span
      span.end();
      
      // Log de finalización
      structuredLogger.info('Span finalized', {
        traceId: req.traceContext?.traceId,
        spanId: req.traceContext?.spanId,
        duration,
        statusCode: res.statusCode,
        method: req.method,
        path: req.path
      });
    } catch (error) {
      structuredLogger.error('Failed to finalize span', {
        error: (error as Error).message,
        traceId: req.traceContext?.traceId,
        spanId: req.traceContext?.spanId
      });
    }
  });
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Genera un ID de trace único
 */
function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Genera un ID de span único
 */
function generateSpanId(): string {
  return `span_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Genera un ID de request único
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Genera un ID de correlación único
 */
function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// CONTEXT PROPAGATION HELPERS
// =============================================================================

/**
 * Obtiene el contexto de trace actual
 */
export function getCurrentTraceContext(): ExtendedRequest['traceContext'] | undefined {
  const span = observabilityOTelService.getCurrentSpan();
  if (!span) return undefined;
  
  const spanContext = span.spanContext();
  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    requestId: generateRequestId(),
    correlationId: generateCorrelationId()
  };
}

/**
 * Crea un span hijo con propagación de contexto
 */
export function createChildSpanWithPropagation(
  parentSpan: Span,
  name: string,
  attributes: Record<string, string | number | boolean> = {}
): Span {
  const childSpan = observabilityOTelService.createChildSpan(parentSpan, name, { attributes });
  
  // Agregar atributos de propagación
  childSpan.setAttributes({
    'trace.propagation': 'child',
    'trace.parent_span_id': parentSpan.spanContext().spanId,
    'trace.parent_trace_id': parentSpan.spanContext().traceId
  });
  
  return childSpan;
}

/**
 * Propaga contexto de trace a un request saliente
 */
export function propagateTraceToOutgoingRequest(
  headers: Record<string, string> = {}
): Record<string, string> {
  const traceContext = getCurrentTraceContext();
  if (!traceContext) return headers;
  
  return {
    ...headers,
    'X-Trace-Id': traceContext.traceId,
    'X-Span-Id': traceContext.spanId,
    'X-Request-ID': traceContext.requestId,
    'X-Correlation-ID': traceContext.correlationId,
    'Traceparent': `00-${traceContext.traceId}-${traceContext.spanId}-01`
  };
}

// =============================================================================
// MIDDLEWARE DE LOGGING DE TRAZAS
// =============================================================================

/**
 * Middleware para logging detallado de trazas
 */
export function traceLoggingMiddleware() {
  return (req: ExtendedRequest, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    
    // Log de inicio de request
    structuredLogger.info('Request started with trace propagation', {
      traceId: req.traceContext?.traceId,
      spanId: req.traceContext?.spanId,
      parentSpanId: req.traceContext?.parentSpanId,
      requestId: req.traceContext?.requestId,
      correlationId: req.traceContext?.correlationId,
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    // Log de finalización de request
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      
      structuredLogger.info('Request completed with trace propagation', {
        traceId: req.traceContext?.traceId,
        spanId: req.traceContext?.spanId,
        requestId: req.traceContext?.requestId,
        correlationId: req.traceContext?.correlationId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration,
        responseSize: JSON.stringify(res.locals.responseBody || {}).length
      });
    });
    
    next();
  };
}

// =============================================================================
// MIDDLEWARE DE VALIDACIÓN DE TRAZAS
// =============================================================================

/**
 * Middleware para validar headers de trace
 */
export function traceValidationMiddleware() {
  return (req: ExtendedRequest, res: Response, next: NextFunction): void => {
    try {
      const traceHeaders = extractTraceHeaders(req);
      
      // Validar formato de traceparent si existe
      if (traceHeaders.traceparent) {
        const isValid = validateTraceparent(traceHeaders.traceparent);
        if (!isValid) {
          structuredLogger.warn('Invalid traceparent header', {
            traceparent: traceHeaders.traceparent,
            method: req.method,
            path: req.path
          });
        }
      }
      
      // Validar formato de trace ID si existe
      if (traceHeaders['x-trace-id']) {
        const isValid = validateTraceId(traceHeaders['x-trace-id']);
        if (!isValid) {
          structuredLogger.warn('Invalid trace ID header', {
            traceId: traceHeaders['x-trace-id'],
            method: req.method,
            path: req.path
          });
        }
      }
      
      next();
    } catch (error) {
      structuredLogger.error('Trace validation middleware failed', {
        error: (error as Error).message
      });
      next();
    }
  };
}

/**
 * Valida el formato de traceparent
 */
function validateTraceparent(traceparent: string): boolean {
  // Formato: 00-{trace-id}-{parent-id}-{trace-flags}
  const parts = traceparent.split('-');
  return parts.length === 4 && parts[0] === '00';
}

/**
 * Valida el formato de trace ID
 */
function validateTraceId(traceId: string): boolean {
  // Debe ser una cadena alfanumérica de longitud razonable
  return /^[a-zA-Z0-9_-]+$/.test(traceId) && traceId.length > 0 && traceId.length <= 64;
}
