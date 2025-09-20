// ============================================================================
// WEB CORRELATION CLIENT
// ============================================================================

export interface CorrelationContext {
  correlationId: string;
  requestId?: string;
  userId?: string;
  sessionId?: string;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
}

export interface CorrelationHeaders {
  'x-correlation-id': string;
  'x-request-id'?: string;
  'x-user-id'?: string;
  'x-session-id'?: string;
  'x-trace-id'?: string;
  'x-span-id'?: string;
  'x-parent-span-id'?: string;
}

// ============================================================================
// CORRELATION ID GENERATION
// ============================================================================

export function generateCorrelationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `corr_${timestamp}_${random}`;
}

export function generateRequestId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${random}`;
}

export function generateTraceId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `trace_${timestamp}_${random}`;
}

export function generateSpanId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `span_${timestamp}_${random}`;
}

// ============================================================================
// CORRELATION ID VALIDATION
// ============================================================================

export function isValidCorrelationId(correlationId: string): boolean {
  if (!correlationId || typeof correlationId !== 'string') {
    return false;
  }

  // Check format: corr_timestamp_random
  const correlationIdPattern = /^corr_\d+_[a-z0-9]{8}$/;
  return correlationIdPattern.test(correlationId);
}

export function isValidRequestId(requestId: string): boolean {
  if (!requestId || typeof requestId !== 'string') {
    return false;
  }

  // Check format: req_timestamp_random
  const requestIdPattern = /^req_\d+_[a-z0-9]{8}$/;
  return requestIdPattern.test(requestId);
}

export function isValidTraceId(traceId: string): boolean {
  if (!traceId || typeof traceId !== 'string') {
    return false;
  }

  // Check format: trace_timestamp_random
  const traceIdPattern = /^trace_\d+_[a-z0-9]{8}$/;
  return traceIdPattern.test(traceId);
}

export function isValidSpanId(spanId: string): boolean {
  if (!spanId || typeof spanId !== 'string') {
    return false;
  }

  // Check format: span_timestamp_random
  const spanIdPattern = /^span_\d+_[a-z0-9]{8}$/;
  return spanIdPattern.test(spanId);
}

// ============================================================================
// CORRELATION ID EXTRACTION
// ============================================================================

export function extractCorrelationId(headers: Headers): string | null {
  const correlationId = headers.get('x-correlation-id');
  return correlationId && isValidCorrelationId(correlationId) ? correlationId : null;
}

export function extractRequestId(headers: Headers): string | null {
  const requestId = headers.get('x-request-id');
  return requestId && isValidRequestId(requestId) ? requestId : null;
}

export function extractTraceId(headers: Headers): string | null {
  const traceId = headers.get('x-trace-id');
  return traceId && isValidTraceId(traceId) ? traceId : null;
}

export function extractSpanId(headers: Headers): string | null {
  const spanId = headers.get('x-span-id');
  return spanId && isValidSpanId(spanId) ? spanId : null;
}

export function extractParentSpanId(headers: Headers): string | null {
  const parentSpanId = headers.get('x-parent-span-id');
  return parentSpanId && isValidSpanId(parentSpanId) ? parentSpanId : null;
}

// ============================================================================
// CORRELATION CONTEXT CREATION
// ============================================================================

export function createCorrelationContext(headers: Headers): CorrelationContext {
  const correlationId = extractCorrelationId(headers) || generateCorrelationId();
  const requestId = extractRequestId(headers) || generateRequestId();
  const traceId = extractTraceId(headers) || generateTraceId();
  const spanId = extractSpanId(headers) || generateSpanId();
  const parentSpanId = extractParentSpanId(headers);

  return {
    correlationId,
    requestId,
    traceId,
    spanId,
    parentSpanId,
  };
}

export function createCorrelationHeaders(context: CorrelationContext): CorrelationHeaders {
  const headers: CorrelationHeaders = {
    'x-correlation-id': context.correlationId,
  };

  if (context.requestId) {
    headers['x-request-id'] = context.requestId;
  }

  if (context.userId) {
    headers['x-user-id'] = context.userId;
  }

  if (context.sessionId) {
    headers['x-session-id'] = context.sessionId;
  }

  if (context.traceId) {
    headers['x-trace-id'] = context.traceId;
  }

  if (context.spanId) {
    headers['x-span-id'] = context.spanId;
  }

  if (context.parentSpanId) {
    headers['x-parent-span-id'] = context.parentSpanId;
  }

  return headers;
}

// ============================================================================
// CORRELATION ID PROPAGATION
// ============================================================================

export function propagateCorrelationId(
  sourceHeaders: Headers,
  targetHeaders: Record<string, string> = {}
): Record<string, string> {
  const context = createCorrelationContext(sourceHeaders);
  const correlationHeaders = createCorrelationHeaders(context);

  return {
    ...targetHeaders,
    ...correlationHeaders,
  };
}

export function createChildSpan(
  parentContext: CorrelationContext,
  operationName: string
): CorrelationContext {
  const childSpanId = generateSpanId();
  
  return {
    ...parentContext,
    spanId: childSpanId,
    parentSpanId: parentContext.spanId,
  };
}

// ============================================================================
// CORRELATION ID STORAGE
// ============================================================================

class CorrelationStore {
  private store = new Map<string, CorrelationContext>();

  set(correlationId: string, context: CorrelationContext): void {
    this.store.set(correlationId, context);
  }

  get(correlationId: string): CorrelationContext | undefined {
    return this.store.get(correlationId);
  }

  delete(correlationId: string): boolean {
    return this.store.delete(correlationId);
  }

  clear(): void {
    this.store.clear();
  }
}

export const correlationStore = new CorrelationStore();

// ============================================================================
// CORRELATION ID ASYNC CONTEXT
// ============================================================================

export function withCorrelationContext<T>(
  context: CorrelationContext,
  fn: () => T
): T {
  const originalContext = correlationStore.get(context.correlationId);
  
  try {
    correlationStore.set(context.correlationId, context);
    return fn();
  } finally {
    if (originalContext) {
      correlationStore.set(context.correlationId, originalContext);
    } else {
      correlationStore.delete(context.correlationId);
    }
  }
}

export function getCurrentCorrelationContext(correlationId: string): CorrelationContext | undefined {
  return correlationStore.get(correlationId);
}

// ============================================================================
// FETCH WRAPPER WITH CORRELATION
// ============================================================================

export class CorrelationFetch {
  private baseContext: CorrelationContext;

  constructor(baseContext?: CorrelationContext) {
    this.baseContext = baseContext || {
      correlationId: generateCorrelationId(),
      requestId: generateRequestId(),
      traceId: generateTraceId(),
      spanId: generateSpanId(),
    };
  }

  async fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const headers = new Headers(init?.headers);
    
    // Add correlation headers
    headers.set('X-Correlation-ID', this.baseContext.correlationId);
    headers.set('X-Request-ID', this.baseContext.requestId || '');
    headers.set('X-Trace-ID', this.baseContext.traceId || '');
    headers.set('X-Span-ID', this.baseContext.spanId || '');
    if (this.baseContext.parentSpanId) {
      headers.set('X-Parent-Span-ID', this.baseContext.parentSpanId);
    }

    const startTime = Date.now();
    
    try {
      const response = await fetch(input, {
        ...init,
        headers,
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log request completion
      console.log('Fetch completed:', {
        correlationId: this.baseContext.correlationId,
        requestId: this.baseContext.requestId,
        traceId: this.baseContext.traceId,
        spanId: this.baseContext.spanId,
        url: input.toString(),
        method: init?.method || 'GET',
        status: response.status,
        duration,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Log request error
      console.error('Fetch error:', {
        correlationId: this.baseContext.correlationId,
        requestId: this.baseContext.requestId,
        traceId: this.baseContext.traceId,
        spanId: this.baseContext.spanId,
        url: input.toString(),
        method: init?.method || 'GET',
        error: error instanceof Error ? error.message : String(error),
        duration,
        timestamp: new Date().toISOString(),
      });

      throw error;
    }
  }

  createChildSpan(operationName: string): CorrelationFetch {
    const childContext = createChildSpan(this.baseContext, operationName);
    return new CorrelationFetch(childContext);
  }
}

// ============================================================================
// REACT HOOKS FOR CORRELATION
// ============================================================================

export function useCorrelation(): CorrelationContext {
  const [context, setContext] = React.useState<CorrelationContext>(() => ({
    correlationId: generateCorrelationId(),
    requestId: generateRequestId(),
    traceId: generateTraceId(),
    spanId: generateSpanId(),
  }));

  React.useEffect(() => {
    // Initialize correlation context on mount
    const newContext: CorrelationContext = {
      correlationId: generateCorrelationId(),
      requestId: generateRequestId(),
      traceId: generateTraceId(),
      spanId: generateSpanId(),
    };

    setContext(newContext);
    correlationStore.set(newContext.correlationId, newContext);
  }, []);

  return context;
}

export function useCorrelationFetch(): CorrelationFetch {
  const context = useCorrelation();
  return React.useMemo(() => new CorrelationFetch(context), [context]);
}

// ============================================================================
// CORRELATION LOGGING
// ============================================================================

export function logWithCorrelation(
  context: CorrelationContext,
  level: 'info' | 'warn' | 'error',
  message: string,
  data?: Record<string, unknown>
): void {
  const logData = {
    correlationId: context.correlationId,
    requestId: context.requestId,
    traceId: context.traceId,
    spanId: context.spanId,
    level,
    message,
    ...data,
    timestamp: new Date().toISOString(),
  };

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

// ============================================================================
// CORRELATION TESTING UTILITIES
// ============================================================================

export function createMockCorrelationContext(): CorrelationContext {
  return {
    correlationId: generateCorrelationId(),
    requestId: generateRequestId(),
    traceId: generateTraceId(),
    spanId: generateSpanId(),
  };
}

export function createMockCorrelationHeaders(): CorrelationHeaders {
  const context = createMockCorrelationContext();
  return createCorrelationHeaders(context);
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  generateCorrelationId,
  generateRequestId,
  generateTraceId,
  generateSpanId,
  isValidCorrelationId,
  isValidRequestId,
  isValidTraceId,
  isValidSpanId,
  extractCorrelationId,
  extractRequestId,
  extractTraceId,
  extractSpanId,
  extractParentSpanId,
  createCorrelationContext,
  createCorrelationHeaders,
  propagateCorrelationId,
  createChildSpan,
  correlationStore,
  withCorrelationContext,
  getCurrentCorrelationContext,
  CorrelationFetch,
  useCorrelation,
  useCorrelationFetch,
  logWithCorrelation,
  createMockCorrelationContext,
  createMockCorrelationHeaders,
};

// Import React for hooks
import React from 'react';
