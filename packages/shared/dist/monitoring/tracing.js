import { SpanKind, SpanStatusCode, trace, context } from '@opentelemetry/api';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { envSchema } from '../core/config/env.js';
const env = envSchema.parse(process.env);
export function initTracer() {
    const provider = new NodeTracerProvider({
        resource: new Resource({
            [SemanticResourceAttributes.SERVICE_NAME]: 'econeura',
            [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.NODE_ENV,
        }),
    });
    if (env.OTEL_EXPORTER_OTLP_ENDPOINT) {
        const exporter = new OTLPTraceExporter({
            url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
        });
        provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
    }
    provider.register();
    return trace.getTracer('econeura');
}
export class TracingManager {
    tracer;
    activeSpans;
    constructor() {
        this.tracer = initTracer();
        this.activeSpans = new Map();
    }
    startSpan(name, options = {}) {
        const { kind = SpanKind.INTERNAL, attributes = {} } = options;
        const span = this.tracer.startSpan(name, { kind, attributes });
        this.activeSpans.set(name, span);
        return span;
    }
    endSpan(name, options = {}) {
        const span = this.activeSpans.get(name);
        if (!span) {
            return;
        }
        const { status, error } = options;
        if (status) {
            span.setStatus({ code: status });
        }
        if (error) {
            span.recordException(error);
        }
        span.end();
        this.activeSpans.delete(name);
    }
    async withSpan(name, fn, options = {}) {
        const span = this.startSpan(name, options);
        try {
            return await context.with(trace.setSpan(context.active(), span), () => fn(span));
        }
        catch (error) {
            if (error instanceof Error) {
                this.endSpan(name, { status: SpanStatusCode.ERROR, error });
            }
            throw error;
        }
        finally {
            this.endSpan(name);
        }
    }
    addEvent(spanName, eventName, attributes) {
        const span = this.activeSpans.get(spanName);
        if (span) {
            span.addEvent(eventName, attributes);
        }
    }
    setAttributes(spanName, attributes) {
        const span = this.activeSpans.get(spanName);
        if (span) {
            span.setAttributes(attributes);
        }
    }
}
export const tracingManager = new TracingManager();
//# sourceMappingURL=tracing.js.map