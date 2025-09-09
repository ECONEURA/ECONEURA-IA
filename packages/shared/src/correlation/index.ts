import { randomUUID } from 'crypto';

// ============================================================================
// CORRELATION ID UTILITIES
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
  return `corr_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

export function generateTraceId(): string {
  return `trace_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

export function generateSpanId(): string {
  return `span_${Date.now()}_${randomUUID().substring(0, 8)}`;
}

// ============================================================================
// CORRELATION ID VALIDATION
// ============================================================================

export function isValidCorrelationId(correlationId: string): boolean {
  if (!correlationId || typeof correlationId !== 'string') {
    return false;
  }

  // Check format: corr_timestamp_uuid
  const correlationIdPattern = /^corr_\d+_[a-f0-9]{8}$/;
  return correlationIdPattern.test(correlationId);
}

export function isValidRequestId(requestId: string): boolean {
  if (!requestId || typeof requestId !== 'string') {
    return false;
  }

  // Check format: req_timestamp_uuid
  const requestIdPattern = /^req_\d+_[a-f0-9]{8}$/;
  return requestIdPattern.test(requestId);
}

export function isValidTraceId(traceId: string): boolean {
  if (!traceId || typeof traceId !== 'string') {
    return false;
  }

  // Check format: trace_timestamp_uuid
  const traceIdPattern = /^trace_\d+_[a-f0-9]{8}$/;
  return traceIdPattern.test(traceId);
}

export function isValidSpanId(spanId: string): boolean {
  if (!spanId || typeof spanId !== 'string') {
    return false;
  }

  // Check format: span_timestamp_uuid
  const spanIdPattern = /^span_\d+_[a-f0-9]{8}$/;
  return spanIdPattern.test(spanId);
}

// ============================================================================
// CORRELATION ID EXTRACTION
// ============================================================================

export function extractCorrelationId(headers: Record<string, string | string[] | undefined>): string | null {
  const correlationId = headers['x-correlation-id'];

  if (Array.isArray(correlationId)) {
    return isValidCorrelationId(correlationId[0]) ? correlationId[0] : null;
  }

  if (typeof correlationId === 'string') {
    return isValidCorrelationId(correlationId) ? correlationId : null;
  }

  return null;
}

export function extractRequestId(headers: Record<string, string | string[] | undefined>): string | null {
  const requestId = headers['x-request-id'];

  if (Array.isArray(requestId)) {
    return isValidRequestId(requestId[0]) ? requestId[0] : null;
  }

  if (typeof requestId === 'string') {
    return isValidRequestId(requestId) ? requestId : null;
  }

  return null;
}

export function extractTraceId(headers: Record<string, string | string[] | undefined>): string | null {
  const traceId = headers['x-trace-id'];

  if (Array.isArray(traceId)) {
    return isValidTraceId(traceId[0]) ? traceId[0] : null;
  }

  if (typeof traceId === 'string') {
    return isValidTraceId(traceId) ? traceId : null;
  }

  return null;
}

export function extractSpanId(headers: Record<string, string | string[] | undefined>): string | null {
  const spanId = headers['x-span-id'];

  if (Array.isArray(spanId)) {
    return isValidSpanId(spanId[0]) ? spanId[0] : null;
  }

  if (typeof spanId === 'string') {
    return isValidSpanId(spanId) ? spanId : null;
  }

  return null;
}

export function extractParentSpanId(headers: Record<string, string | string[] | undefined>): string | null {
  const parentSpanId = headers['x-parent-span-id'];

  if (Array.isArray(parentSpanId)) {
    return isValidSpanId(parentSpanId[0]) ? parentSpanId[0] : null;
  }

  if (typeof parentSpanId === 'string') {
    return isValidSpanId(parentSpanId) ? parentSpanId : null;
  }

  return null;
}

// ============================================================================
// CORRELATION CONTEXT CREATION
// ============================================================================

export function createCorrelationContext(headers: Record<string, string | string[] | undefined>): CorrelationContext {
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
  sourceHeaders: Record<string, string | string[] | undefined>,
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
// CORRELATION ID LOGGING
// ============================================================================

export function addCorrelationToLog(logData: Record<string, unknown>, context: CorrelationContext): Record<string, unknown> {
  return {
    ...logData,
    correlationId: context.correlationId,
    requestId: context.requestId,
    traceId: context.traceId,
    spanId: context.spanId,
    parentSpanId: context.parentSpanId,
  };
}

export function createLogContext(context: CorrelationContext, additionalData: Record<string, unknown> = {}): Record<string, unknown> {
  return addCorrelationToLog(additionalData, context);
}

// ============================================================================
// CORRELATION ID MIDDLEWARE HELPERS
// ============================================================================

export function getCorrelationIdFromRequest(req: any): string {
  const correlationId = extractCorrelationId(req.headers);
  return correlationId || generateCorrelationId();
}

export function setCorrelationIdOnResponse(res: any, correlationId: string): void {
  res.setHeader('X-Correlation-ID', correlationId);
}

export function addCorrelationToRequest(req: any, correlationId: string): void {
  req.correlationId = correlationId;
  req.headers['x-correlation-id'] = correlationId;
}

// ============================================================================
// CORRELATION ID STORAGE (for async contexts)
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
  addCorrelationToLog,
  createLogContext,
  getCorrelationIdFromRequest,
  setCorrelationIdOnResponse,
  addCorrelationToRequest,
  correlationStore,
  withCorrelationContext,
  getCurrentCorrelationContext,
};
