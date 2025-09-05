import { env } from '../env'

// Temporary mock implementations for build
export const tracer = {
  startSpan: (name: string) => ({
    setAttribute: () => {},
    setStatus: () => {},
    end: () => {},
  }),
  getTracer: (name: string) => ({
    startSpan: (name: string) => ({
      setAttribute: () => {},
      setStatus: () => {},
      end: () => {},
    }),
  }),
}

export const meter = {
  createCounter: (name: string, options?: any) => ({
    add: (value: number, attributes?: Record<string, any>) => {},
  }),
  createHistogram: (name: string, options?: any) => ({
    record: (value: number, attributes?: Record<string, any>) => {},
  }),
  createUpDownCounter: (name: string, options?: any) => ({
    add: (value: number, attributes?: Record<string, any>) => {},
  }),
  getMeter: (name: string) => ({
    createCounter: (name: string, options?: any) => ({
      add: () => {},
    }),
    createHistogram: (name: string, options?: any) => ({
      record: () => {},
    }),
    createUpDownCounter: (name: string, options?: any) => ({
      add: () => {},
    }),
  }),
}

// Mock metrics
export const customMetrics = {
  aiRequestsTotal: { add: (value: number, attributes?: Record<string, any>) => {} },
  aiCostEUR: { record: (value: number, attributes?: Record<string, any>) => {} },
  aiLatencyMs: { record: (value: number, attributes?: Record<string, any>) => {} },
  aiTokensTotal: { add: (value: number, attributes?: Record<string, any>) => {} },
  httpRequestsTotal: { add: (value: number, attributes?: Record<string, any>) => {} },
  httpLatencyMs: { record: (value: number, attributes?: Record<string, any>) => {} },
  webhookReceived: { add: (value: number, attributes?: Record<string, any>) => {} },
  webhookHmacFailures: { add: (value: number, attributes?: Record<string, any>) => {} },
  flowExecutionsTotal: { add: (value: number, attributes?: Record<string, any>) => {} },
  flowLatencyMs: { record: (value: number, attributes?: Record<string, any>) => {} },
  dbConnectionsActive: { add: (value: number, attributes?: Record<string, any>) => {} },
  dbQueryLatencyMs: { record: (value: number, attributes?: Record<string, any>) => {} },
  idempotencyReplaysTotal: { add: (value: number, attributes?: Record<string, any>) => {} },
  idempotencyConflictsTotal: { add: (value: number, attributes?: Record<string, any>) => {} },
  rateLimitExceeded: { add: (value: number, attributes?: Record<string, any>) => {} },
  orgMonthlyCost: { record: (value: number, attributes?: Record<string, any>) => {} },
  orgCostBudget: { add: (value: number, attributes?: Record<string, any>) => {} },
}

// Mock utility functions
export function createSpan(name: string, attributes?: Record<string, any>) {
  return {
    setAttribute: (key: string, value: any) => {},
    setStatus: (status: any) => {},
    end: () => {},
  }
}

export function createTracer(name: string) {
  return {
    startSpan: (spanName: string, options?: any) => ({
      setAttribute: (key: string, value: any) => {},
      setAttributes: (attributes: Record<string, any>) => {},
      setStatus: (status: any) => {},
      recordException: (error: Error) => {},
      end: () => {},
    }),
  }
}

export function createMeter(name: string) {
  return {
    createCounter: (counterName: string, options?: any) => ({
      add: (value: number, attributes?: Record<string, any>) => {},
    }),
    createHistogram: (histogramName: string, options?: any) => ({
      record: (value: number, attributes?: Record<string, any>) => {},
    }),
    createGauge: (gaugeName: string, options?: any) => ({
      record: (value: number, attributes?: Record<string, any>) => {},
    }),
  }
}

export function recordException(span: any, error: Error, attributes?: Record<string, any>) {}
export function addEvent(span: any, name: string, attributes?: Record<string, any>) {}
export function setAttributes(span: any, attributes: Record<string, any>) {}
export function getCurrentSpan() { return null }
export function getTraceId() { return 'mock-trace-id' }
export function getSpanId() { return 'mock-span-id' }

// Mock metric recording functions
// All recording functions are exported from ./metrics/index to avoid conflicts
export function recordIdempotencyConflict(key: string, orgId?: string) {}
export function recordRateLimitExceeded(route: string, orgId?: string) {}
export function recordOrgCost(orgId: string, costEUR: number, budgetEUR: number) {}

// Mock SDK
export const sdk = {
  start: () => {},
  shutdown: () => Promise.resolve(),
}
