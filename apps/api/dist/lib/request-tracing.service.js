import { v4 as uuidv4 } from 'uuid';
import { prometheus } from '@econeura/shared/src/metrics/index.js';
export class RequestTracingService {
    traces = new Map();
    createTrace(operation, metadata = {}) {
        const traceId = uuidv4();
        const spanId = uuidv4();
        const trace = {
            traceId,
            spanId,
            operation,
            startTime: Date.now(),
            metadata
        };
        this.traces.set(traceId, trace);
        return trace;
    }
    createSpan(traceId, operation, metadata = {}) {
        const parentTrace = this.traces.get(traceId);
        if (!parentTrace) {
            throw new Error(`Trace ${traceId} not found`);
        }
        const spanId = uuidv4();
        const span = {
            traceId,
            spanId,
            parentSpanId: parentTrace.spanId,
            operation,
            startTime: Date.now(),
            metadata
        };
        return span;
    }
    finishTrace(traceId, metadata = {}) {
        const trace = this.traces.get(traceId);
        if (!trace)
            return;
        const duration = Date.now() - trace.startTime;
        prometheus.register.getSingleMetric('request_duration_seconds')?.observe({
            operation: trace.operation
        }, duration / 1000);
        this.traces.delete(traceId);
    }
}
export const requestTracingService = new RequestTracingService();
//# sourceMappingURL=request-tracing.service.js.map