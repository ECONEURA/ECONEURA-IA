class TracingSystem {
    traces = new Map();
    activeSpans = new Map();
    MAX_TRACES = 1000;
    generateTraceId() {
        return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSpanId() {
        return `span_${Math.random().toString(36).substr(2, 9)}`;
    }
    startSpan(name, parentContext) {
        const traceId = parentContext?.traceId || this.generateTraceId();
        const spanId = this.generateSpanId();
        const parentId = parentContext?.spanId;
        const span = {
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
    endSpan(spanId, tags) {
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
        if (this.traces.size > this.MAX_TRACES) {
            const oldestTraceId = Array.from(this.traces.keys())[0];
            this.traces.delete(oldestTraceId);
        }
    }
    addTag(spanId, key, value) {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.tags[key] = value;
        }
    }
    addLog(spanId, message, data) {
        const span = this.activeSpans.get(spanId);
        if (span) {
            span.logs.push({
                timestamp: Date.now(),
                message,
                data
            });
        }
    }
    getTrace(traceId) {
        return this.traces.get(traceId);
    }
    getTraces() {
        return Array.from(this.traces.values());
    }
    getAllTraces() {
        return Array.from(this.traces.values());
    }
    getActiveSpans() {
        return Array.from(this.activeSpans.values());
    }
    traceHttpRequest(method, path, handler) {
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
    traceAIRequest(model, provider, handler) {
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
    traceDatabaseQuery(query, handler) {
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
    exportTraces() {
        return Array.from(this.traces.values()).map(trace => ({
            traceId: trace.traceId,
            spans: this.flattenSpans(trace)
        }));
    }
    flattenSpans(span) {
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
    cleanup(maxAgeMs = 60 * 60 * 1000) {
        const cutoff = Date.now() - maxAgeMs;
        for (const [traceId, trace] of this.traces) {
            if (trace.startTime < cutoff) {
                this.traces.delete(traceId);
            }
        }
    }
    getStats() {
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
//# sourceMappingURL=tracing.js.map