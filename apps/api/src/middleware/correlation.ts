import { Request, Response, NextFunction } from 'express';
import {
  generateCorrelationId,
  generateRequestId,
  generateTraceId,
  generateSpanId,
  extractCorrelationId,
  extractRequestId,
  extractTraceId,
  extractSpanId,
  extractParentSpanId,
  createCorrelationContext,
  createCorrelationHeaders,
  propagateCorrelationId,
  createChildSpan,
  addCorrelationToLog,
  createLogContext,
  getCorrelationIdFromRequest,
  setCorrelationIdOnResponse,
  addCorrelationToRequest,
  withCorrelationContext,
  getCurrentCorrelationContext,
  CorrelationContext,
} from '@econeura/shared/correlation';

// ============================================================================
// CORRELATION MIDDLEWARE
// ============================================================================

export interface CorrelationRequest extends Request {
  correlationId: string;
  requestId: string;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  correlationContext: CorrelationContext;
}

export interface CorrelationResponse extends Response {
  correlationId: string;
  requestId: string;
  traceId: string;
  spanId: string;
}

// ============================================================================
// CORRELATION MIDDLEWARE
// ============================================================================

export function correlationMiddleware(req: CorrelationRequest, res: CorrelationResponse, next: NextFunction): void {
  try {
    // Extract or generate correlation IDs
    const correlationId = extractCorrelationId(req.headers) || generateCorrelationId();
    const requestId = extractRequestId(req.headers) || generateRequestId();
    const traceId = extractTraceId(req.headers) || generateTraceId();
    const spanId = extractSpanId(req.headers) || generateSpanId();
    const parentSpanId = extractParentSpanId(req.headers);

    // Create correlation context
    const correlationContext: CorrelationContext = {
      correlationId,
      requestId,
      traceId,
      spanId,
      parentSpanId,
    };

    // Add correlation IDs to request
    req.correlationId = correlationId;
    req.requestId = requestId;
    req.traceId = traceId;
    req.spanId = spanId;
    req.parentSpanId = parentSpanId;
    req.correlationContext = correlationContext;

    // Add correlation IDs to response
    res.correlationId = correlationId;
    res.requestId = requestId;
    res.traceId = traceId;
    res.spanId = spanId;

    // Set correlation headers on response
    setCorrelationIdOnResponse(res, correlationId);
    res.setHeader('X-Request-ID', requestId);
    res.setHeader('X-Trace-ID', traceId);
    res.setHeader('X-Span-ID', spanId);
    if (parentSpanId) {
      res.setHeader('X-Parent-Span-ID', parentSpanId);
    }

    // Add correlation to request headers for downstream services
    addCorrelationToRequest(req, correlationId);
    req.headers['x-request-id'] = requestId;
    req.headers['x-trace-id'] = traceId;
    req.headers['x-span-id'] = spanId;
    if (parentSpanId) {
      req.headers['x-parent-span-id'] = parentSpanId;
    }

    // Execute request with correlation context
    withCorrelationContext(correlationContext, () => {
      next();
    });

  } catch (error) {
    console.error('Correlation middleware error:', error);
    // Continue without correlation context
    next();
  }
}

// ============================================================================
// CORRELATION LOGGING MIDDLEWARE
// ============================================================================

export function correlationLoggingMiddleware(req: CorrelationRequest, res: CorrelationResponse, next: NextFunction): void {
  const startTime = Date.now();

  // Log request start
  const requestLog = createLogContext(req.correlationContext, {
    event: 'request_start',
    method: req.method,
    path: req.path,
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  console.log('Request started:', requestLog);

  // Override res.end to log request completion
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    const responseLog = createLogContext(req.correlationContext, {
      event: 'request_end',
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });

    console.log('Request completed:', responseLog);

    // Call original end method
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

// ============================================================================
// CORRELATION PROPAGATION MIDDLEWARE
// ============================================================================

export function correlationPropagationMiddleware(req: CorrelationRequest, res: CorrelationResponse, next: NextFunction): void {
  // Add correlation headers to all outgoing requests
  const originalFetch = global.fetch;

  if (originalFetch) {
    global.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      const headers = new Headers(init?.headers);

      // Add correlation headers
      headers.set('X-Correlation-ID', req.correlationId);
      headers.set('X-Request-ID', req.requestId);
      headers.set('X-Trace-ID', req.traceId);
      headers.set('X-Span-ID', req.spanId);
      if (req.parentSpanId) {
        headers.set('X-Parent-Span-ID', req.parentSpanId);
      }

      return originalFetch(input, {
        ...init,
        headers,
      });
    };
  }

  next();
}

// ============================================================================
// CORRELATION ERROR HANDLING MIDDLEWARE
// ============================================================================

export function correlationErrorMiddleware(error: any, req: CorrelationRequest, res: CorrelationResponse, next: NextFunction): void {
  const errorLog = createLogContext(req.correlationContext, {
    event: 'error',
    error: {
      message: error.message,
      stack: error.stack,
      code: error.code,
    },
    method: req.method,
    path: req.path,
    timestamp: new Date().toISOString(),
  });

  console.error('Request error:', errorLog);

  // Ensure correlation headers are set on error response
  setCorrelationIdOnResponse(res, req.correlationId);
  res.setHeader('X-Request-ID', req.requestId);
  res.setHeader('X-Trace-ID', req.traceId);
  res.setHeader('X-Span-ID', req.spanId);
  if (req.parentSpanId) {
    res.setHeader('X-Parent-Span-ID', req.parentSpanId);
  }

  next(error);
}

// ============================================================================
// CORRELATION UTILITIES
// ============================================================================

export function getCorrelationContext(req: CorrelationRequest): CorrelationContext {
  return req.correlationContext;
}

export function createChildSpanFromRequest(req: CorrelationRequest, operationName: string): CorrelationContext {
  return createChildSpan(req.correlationContext, operationName);
}

export function logWithCorrelation(req: CorrelationRequest, level: 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
  const logData = createLogContext(req.correlationContext, {
    level,
    message,
    ...data,
    timestamp: new Date().toISOString(),
  });

  switch (level) {
    case 'info':
      console.info(message, logData);
      break;
    case 'warn':
      console.warn(message, logData);
      break;
    case 'error':
      console.error(message, logData);
      break;
  }
}

export function addCorrelationToResponse(res: CorrelationResponse, data: any): any {
  if (typeof data === 'object' && data !== null) {
    return {
      ...data,
      correlationId: res.correlationId,
      requestId: res.requestId,
      traceId: res.traceId,
      spanId: res.spanId,
    };
  }

  return data;
}

// ============================================================================
// CORRELATION TESTING UTILITIES
// ============================================================================

export function createMockCorrelationRequest(): Partial<CorrelationRequest> {
  const correlationId = generateCorrelationId();
  const requestId = generateRequestId();
  const traceId = generateTraceId();
  const spanId = generateSpanId();

  return {
    correlationId,
    requestId,
    traceId,
    spanId,
    correlationContext: {
      correlationId,
      requestId,
      traceId,
      spanId,
    },
    headers: {
      'x-correlation-id': correlationId,
      'x-request-id': requestId,
      'x-trace-id': traceId,
      'x-span-id': spanId,
    },
  };
}

export function createMockCorrelationResponse(): Partial<CorrelationResponse> {
  const correlationId = generateCorrelationId();
  const requestId = generateRequestId();
  const traceId = generateTraceId();
  const spanId = generateSpanId();

  return {
    correlationId,
    requestId,
    traceId,
    spanId,
    setHeader: jest.fn(),
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  correlationMiddleware,
  correlationLoggingMiddleware,
  correlationPropagationMiddleware,
  correlationErrorMiddleware,
  getCorrelationContext,
  createChildSpanFromRequest,
  logWithCorrelation,
  addCorrelationToResponse,
  createMockCorrelationRequest,
  createMockCorrelationResponse,
};
