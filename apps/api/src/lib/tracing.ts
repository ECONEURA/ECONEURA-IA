interface TraceSpan {
  id: string;
  traceId: string;
  parentId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string | number | boolean>;
  logs: Array<{
    timestamp: number;
    message: string;
    data?: any;
  }>;
  children: TraceSpan[];
}

interface TraceContext {
  traceId: string;
  spanId: string;
  parentId?: string;
}

class TracingSystem {
  private traces: Map<string, TraceSpan> = new Map();
  private activeSpans: Map<string, TraceSpan> = new Map();
  private readonly MAX_TRACES = 1000;

  generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSpanId(): string {
    return `span_${Math.random().toString(36).substr(2, 9)}`;
  }

  startSpan(name: string, parentContext?: TraceContext): TraceContext {
    const traceId = parentContext?.traceId || this.generateTraceId();
    const spanId = this.generateSpanId();
    const parentId = parentContext?.spanId;

    const span: TraceSpan = {
      id: spanId,
      traceId,
      parentId,
      name,
      startTime: Date.now(),
      tags: {},
      logs: [],
      children: []
    };

    this.activeSpans.set(spanId, span);
    this.traces.set(traceId, span);

    return { traceId, spanId, parentId };
  }

  endSpan(spanId: string, tags?: Record<string, string | number | boolean>): void {
    const span = this.activeSpans.get(spanId);
    if (!span) {
      console.warn(`Span ${spanId} not found`);
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;

    if (tags) {
      span.tags = { ...span.tags, ...tags };
    }

    this.activeSpans.delete(spanId);

    // Limpiar traces antiguos si excedemos el límite
    if (this.traces.size > this.MAX_TRACES) {
      const oldestTraceId = Array.from(this.traces.keys())[0];
      this.traces.delete(oldestTraceId);
    }
  }

  addTag(spanId: string, key: string, value: string | number | boolean): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.tags[key] = value;
    }
  }

  addLog(spanId: string, message: string, data?: any): void {
    const span = this.activeSpans.get(spanId);
    if (span) {
      span.logs.push({
        timestamp: Date.now(),
        message,
        data
      });
    }
  }

  getTrace(traceId: string): TraceSpan | undefined {
    return this.traces.get(traceId);
  }

  getAllTraces(): TraceSpan[] {
    return Array.from(this.traces.values());
  }

  getActiveSpans(): TraceSpan[] {
    return Array.from(this.activeSpans.values());
  }

  // Métodos específicos para operaciones comunes
  traceHttpRequest(method: string, path: string, handler: () => Promise<any>): Promise<any> {
    const context = this.startSpan(`HTTP ${method} ${path}`, {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId()
    });

    this.addTag(context.spanId, 'http.method', method);
    this.addTag(context.spanId, 'http.path', path);
    this.addTag(context.spanId, 'component', 'http');

    const startTime = Date.now();

    return handler()
      .then((result) => {
        const duration = Date.now() - startTime;
        this.addTag(context.spanId, 'http.status_code', 200);
        this.addTag(context.spanId, 'duration_ms', duration);
        this.addLog(context.spanId, 'HTTP request completed successfully');
        this.endSpan(context.spanId);
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.addTag(context.spanId, 'http.status_code', error.status || 500);
        this.addTag(context.spanId, 'duration_ms', duration);
        this.addTag(context.spanId, 'error', true);
        this.addLog(context.spanId, 'HTTP request failed', { error: error.message });
        this.endSpan(context.spanId);
        throw error;
      });
  }

  traceAIRequest(model: string, provider: string, handler: () => Promise<any>): Promise<any> {
    const context = this.startSpan(`AI Request ${model}`, {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId()
    });

    this.addTag(context.spanId, 'ai.model', model);
    this.addTag(context.spanId, 'ai.provider', provider);
    this.addTag(context.spanId, 'component', 'ai');

    const startTime = Date.now();

    return handler()
      .then((result) => {
        const duration = Date.now() - startTime;
        this.addTag(context.spanId, 'duration_ms', duration);
        this.addLog(context.spanId, 'AI request completed successfully');
        this.endSpan(context.spanId);
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.addTag(context.spanId, 'duration_ms', duration);
        this.addTag(context.spanId, 'error', true);
        this.addLog(context.spanId, 'AI request failed', { error: error.message });
        this.endSpan(context.spanId);
        throw error;
      });
  }

  traceDatabaseQuery(query: string, handler: () => Promise<any>): Promise<any> {
    const context = this.startSpan('Database Query', {
      traceId: this.generateTraceId(),
      spanId: this.generateSpanId()
    });

    this.addTag(context.spanId, 'db.query', query);
    this.addTag(context.spanId, 'component', 'database');

    const startTime = Date.now();

    return handler()
      .then((result) => {
        const duration = Date.now() - startTime;
        this.addTag(context.spanId, 'duration_ms', duration);
        this.addLog(context.spanId, 'Database query completed successfully');
        this.endSpan(context.spanId);
        return result;
      })
      .catch((error) => {
        const duration = Date.now() - startTime;
        this.addTag(context.spanId, 'duration_ms', duration);
        this.addTag(context.spanId, 'error', true);
        this.addLog(context.spanId, 'Database query failed', { error: error.message });
        this.endSpan(context.spanId);
        throw error;
      });
  }

  // Método para exportar traces en formato JSON
  exportTraces(): any[] {
    return Array.from(this.traces.values()).map(trace => ({
      traceId: trace.traceId,
      spans: this.flattenSpans(trace)
    }));
  }

  private flattenSpans(span: TraceSpan): any[] {
    const spans = [{
      id: span.id,
      traceId: span.traceId,
      parentId: span.parentId,
      name: span.name,
      startTime: span.startTime,
      endTime: span.endTime,
      duration: span.duration,
      tags: span.tags,
      logs: span.logs
    }];

    for (const child of span.children) {
      spans.push(...this.flattenSpans(child));
    }

    return spans;
  }

  // Método para limpiar traces antiguos
  cleanup(maxAgeMs: number = 60 * 60 * 1000): void { // Por defecto 1 hora
    const cutoff = Date.now() - maxAgeMs;
    
    for (const [traceId, trace] of this.traces) {
      if (trace.startTime < cutoff) {
        this.traces.delete(traceId);
      }
    }
  }

  // Método para obtener estadísticas de traces
  getStats(): any {
    const traces = Array.from(this.traces.values());
    const activeSpans = Array.from(this.activeSpans.values());

    return {
      totalTraces: traces.length,
      activeSpans: activeSpans.length,
      averageTraceDuration: traces.length > 0 
        ? traces.reduce((sum, t) => sum + (t.duration || 0), 0) / traces.length 
        : 0,
      tracesWithErrors: traces.filter(t => t.tags.error).length
    };
  }
}

export const tracing = new TracingSystem();
