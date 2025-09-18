import { env } from '../env.js'

// Temporary mock implementations for build
export const tracer = {
  startSpan: (name: string) => ({
    setAttribute: (_k?: string, _v?: any) => {},
    setAttributes: (_attrs?: Record<string, any>) => {},
    recordException: (_err?: any) => {},
    setStatus: (_s?: any) => {},
    end: () => {},
  }),
  getTracer: (name: string) => ({
    startSpan: (name: string) => ({
      setAttribute: (_k?: string, _v?: any) => {},
      setAttributes: (_attrs?: Record<string, any>) => {},
      recordException: (_err?: any) => {},
      setStatus: (_s?: any) => {},
      end: () => {},
    }),
  }),
}

export const meter = {
  createCounter: (name: string, options?: any) => ({
    add: (_value: number = 1, _labels?: Record<string, any>) => {},
  }),
  createHistogram: (name: string, options?: any) => ({
    record: (_value: number, _labels?: Record<string, any>) => {},
  }),
  createUpDownCounter: (name: string, options?: any) => ({
    add: (_value: number, _labels?: Record<string, any>) => {},
  }),
  getMeter: (name: string) => ({
    createCounter: (name: string, options?: any) => ({
      add: (_value: number = 1, _labels?: Record<string, any>) => {},
    }),
    createHistogram: (name: string, options?: any) => ({
      record: (_value: number, _labels?: Record<string, any>) => {},
    }),
    createUpDownCounter: (name: string, options?: any) => ({
      add: (_value: number, _labels?: Record<string, any>) => {},
    }),
  }),
}

// Mock metrics
export const customMetrics = {
  aiRequestsTotal: { add: () => {} },
  aiCostEUR: { record: () => {} },
  aiLatencyMs: { record: () => {} },
  aiTokensTotal: { add: () => {} },
  httpRequestsTotal: { add: () => {} },
  httpLatencyMs: { record: () => {} },
  webhookReceived: { add: () => {} },
  webhookHmacFailures: { add: () => {} },
  flowExecutionsTotal: { add: () => {} },
  flowLatencyMs: { record: () => {} },
  dbConnectionsActive: { add: () => {} },
  dbQueryLatencyMs: { record: () => {} },
  idempotencyReplaysTotal: { add: () => {} },
  idempotencyConflictsTotal: { add: () => {} },
  rateLimitExceeded: { add: () => {} },
  orgMonthlyCost: { record: () => {} },
  orgCostBudget: { add: () => {} },
}

// Mock utility functions
export function createSpan(name: string, attributes?: Record<string, any>) {
  return {
    setAttribute: (_k?: string, _v?: any) => {},
    setAttributes: (_attrs?: Record<string, any>) => {},
    recordException: (_err?: any) => {},
    setStatus: (_s?: any) => {},
    end: () => {},
  }
}

export function createTracer(name?: string) {
  return {
    startSpan: (spanName: string) => createSpan(spanName)
  }
}

export function recordException(span: any, error: Error, attributes?: Record<string, any>) {}
export function addEvent(span: any, name: string, attributes?: Record<string, any>) {}
export function setAttributes(span: any, attributes: Record<string, any>) {}
export function getCurrentSpan() { return null }
export function getTraceId() { return 'mock-trace-id' }
export function getSpanId() { return 'mock-span-id' }

// Mock metric recording functions
export function recordAIRequest(provider: string, model: string, status: string, costEUR: number, latencyMs: number, tokensInput: number, tokensOutput: number, orgId?: string) {}
export function recordHTTPRequest(method: string, route: string, statusCode: number, latencyMs: number, orgId?: string) {}
export function recordWebhook(source: string, eventType: string, processingMs: number, hmacValid: boolean = true) {}
export function recordFlowExecution(flowType: string, status: string, latencyMs: number, orgId?: string) {}
export function recordDatabaseQuery(operation: string, table: string, latencyMs: number, orgId?: string) {}
export function recordIdempotencyReplay(key: string, orgId?: string) {}
export function recordIdempotencyConflict(key: string, orgId?: string) {}
export function recordRateLimitExceeded(route: string, orgId?: string) {}
export function recordOrgCost(orgId: string, costEUR: number, budgetEUR: number) {}

// Mock SDK
export const sdk = {
  start: () => {},
  shutdown: () => Promise.resolve(),
}
