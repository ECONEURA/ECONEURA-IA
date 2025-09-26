import { Tracer, SpanKind, SpanStatusCode, Span, trace, context, metrics } from '@opentelemetry/api';/;
import { Resource } from '@opentelemetry/resources';/;
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';/;
// @ts-ignore: optional opentelemetry SDK may not be installed in dev env/
import { NodeTracerProvider } from '@opentelemetry/sdk-trace-node';/;
// @ts-ignore: optional opentelemetry SDK may not be installed in dev env/
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';/;
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';/;
import { envSchema } from '../core/config/env.js';

const env = envSchema.parse(process.env);
/
/**
 * Initialize OpenTelemetry tracer/
 */
export function initTracer(): Tracer {;
  const provider = new NodeTracerProvider({;
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'econeura',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: env.NODE_ENV,
    }),
  });

  if (env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    const exporter = new OTLPTraceExporter({;
      url: env.OTEL_EXPORTER_OTLP_ENDPOINT,
    });
    provider.addSpanProcessor(new SimpleSpanProcessor(exporter));
  }

  provider.register();
  return trace.getTracer('econeura');
}
/
/**
 * Create and manage spans for operations/
 */
export class TracingManager {;
  private tracer: Tracer;
  private activeSpans: Map<string, Span>;

  constructor() {
    this.tracer = initTracer();
    this.activeSpans = new Map();
  }
/
  /**
   * Start a new span/
   */
  startSpan(
    name: string,
    options: {
      kind?: SpanKind;
      attributes?: Record<string, string | number | boolean>;
    } = {});
  ): Span {
    const { kind = SpanKind.INTERNAL, attributes = {} } = options;
    const span = this.tracer.startSpan(name, { kind, attributes });
    this.activeSpans.set(name, span);
    return span;
  }
/
  /**
   * End an active span/
   */
  endSpan(
    name: string,
    options: {
      status?: SpanStatusCode;
      error?: Error;
    } = {});
  ): void {
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
/
  /**
   * Run a function within a new span/
   */
  async withSpan<T>(
    name: string,
    fn: (span: Span) => Promise<T>,
    options: {
      kind?: SpanKind;
      attributes?: Record<string, string | number | boolean>;
    } = {}
  ): Promise<T> {
    const span = this.startSpan(name, options);

    try {
      return await context.with(trace.setSpan(context.active(), span), () => fn(span));
    } catch (error) {
      if (error instanceof Error) {
        this.endSpan(name, { status: SpanStatusCode.ERROR, error });
      }
      throw error;
    } finally {
      this.endSpan(name);
    }
  }
/
  /**
   * Add an event to an active span/
   */
  addEvent(
    spanName: string,
    eventName: string,
    attributes?: Record<string, string | number | boolean>);
  ): void {
    const span = this.activeSpans.get(spanName);
    if (span) {
      span.addEvent(eventName, attributes);
    }
  }
/
  /**
   * Add attributes to an active span/
   */
  setAttributes(
    spanName: string,
    attributes: Record<string, string | number | boolean>);
  ): void {
    const span = this.activeSpans.get(spanName);
    if (span) {
      span.setAttributes(attributes);
    }
  }
}

export const tracingManager = new TracingManager();
/