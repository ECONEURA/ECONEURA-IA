import { v4 as uuidv4 } from 'uuid';
import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  operation: string;
  startTime: number;
  metadata: Record<string, any>;
}

export class RequestTracingService {
  private traces: Map<string, TraceContext> = new Map();

  createTrace(operation: string, metadata: Record<string, any> = {}): TraceContext {
    const traceId = uuidv4();
    const spanId = uuidv4();

    const trace: TraceContext = {
      traceId,
      spanId,
      operation,
      startTime: Date.now(),
      metadata
    };

    this.traces.set(traceId, trace);
    return trace;
  }

  createSpan(traceId: string, operation: string, metadata: Record<string, any> = {}): TraceContext {
    const parentTrace = this.traces.get(traceId);
    if (!parentTrace) {
      throw new Error(`Trace ${traceId} not found`);
    }

    const spanId = uuidv4();
    const span: TraceContext = {
      traceId,
      spanId,
      parentSpanId: parentTrace.spanId,
      operation,
      startTime: Date.now(),
      metadata
    };

    return span;
  }

  finishTrace(traceId: string, metadata: Record<string, any> = {}): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const duration = Date.now() - trace.startTime;

    // Update metrics
    prometheus.register.getSingleMetric('request_duration_seconds')?.observe({
      operation: trace.operation
    }, duration / 1000);

    this.traces.delete(traceId);
  }
}

export const requestTracingService = new RequestTracingService();
