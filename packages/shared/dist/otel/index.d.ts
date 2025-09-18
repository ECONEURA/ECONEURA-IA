export declare const tracer: {
    startSpan: (name: string) => {
        setAttribute: (_k?: string, _v?: any) => void;
        setAttributes: (_attrs?: Record<string, any>) => void;
        recordException: (_err?: any) => void;
        setStatus: (_s?: any) => void;
        end: () => void;
    };
    getTracer: (name: string) => {
        startSpan: (name: string) => {
            setAttribute: (_k?: string, _v?: any) => void;
            setAttributes: (_attrs?: Record<string, any>) => void;
            recordException: (_err?: any) => void;
            setStatus: (_s?: any) => void;
            end: () => void;
        };
    };
};
export declare const meter: {
    createCounter: (name: string, options?: any) => {
        add: (_value?: number, _labels?: Record<string, any>) => void;
    };
    createHistogram: (name: string, options?: any) => {
        record: (_value: number, _labels?: Record<string, any>) => void;
    };
    createUpDownCounter: (name: string, options?: any) => {
        add: (_value: number, _labels?: Record<string, any>) => void;
    };
    getMeter: (name: string) => {
        createCounter: (name: string, options?: any) => {
            add: (_value?: number, _labels?: Record<string, any>) => void;
        };
        createHistogram: (name: string, options?: any) => {
            record: (_value: number, _labels?: Record<string, any>) => void;
        };
        createUpDownCounter: (name: string, options?: any) => {
            add: (_value: number, _labels?: Record<string, any>) => void;
        };
    };
};
export declare const customMetrics: {
    aiRequestsTotal: {
        add: () => void;
    };
    aiCostEUR: {
        record: () => void;
    };
    aiLatencyMs: {
        record: () => void;
    };
    aiTokensTotal: {
        add: () => void;
    };
    httpRequestsTotal: {
        add: () => void;
    };
    httpLatencyMs: {
        record: () => void;
    };
    webhookReceived: {
        add: () => void;
    };
    webhookHmacFailures: {
        add: () => void;
    };
    flowExecutionsTotal: {
        add: () => void;
    };
    flowLatencyMs: {
        record: () => void;
    };
    dbConnectionsActive: {
        add: () => void;
    };
    dbQueryLatencyMs: {
        record: () => void;
    };
    idempotencyReplaysTotal: {
        add: () => void;
    };
    idempotencyConflictsTotal: {
        add: () => void;
    };
    rateLimitExceeded: {
        add: () => void;
    };
    orgMonthlyCost: {
        record: () => void;
    };
    orgCostBudget: {
        add: () => void;
    };
};
export declare function createSpan(name: string, attributes?: Record<string, any>): {
    setAttribute: (_k?: string, _v?: any) => void;
    setAttributes: (_attrs?: Record<string, any>) => void;
    recordException: (_err?: any) => void;
    setStatus: (_s?: any) => void;
    end: () => void;
};
export declare function createTracer(name?: string): {
    startSpan: (spanName: string) => {
        setAttribute: (_k?: string, _v?: any) => void;
        setAttributes: (_attrs?: Record<string, any>) => void;
        recordException: (_err?: any) => void;
        setStatus: (_s?: any) => void;
        end: () => void;
    };
};
export declare function recordException(span: any, error: Error, attributes?: Record<string, any>): void;
export declare function addEvent(span: any, name: string, attributes?: Record<string, any>): void;
export declare function setAttributes(span: any, attributes: Record<string, any>): void;
export declare function getCurrentSpan(): any;
export declare function getTraceId(): string;
export declare function getSpanId(): string;
export declare function recordAIRequest(provider: string, model: string, status: string, costEUR: number, latencyMs: number, tokensInput: number, tokensOutput: number, orgId?: string): void;
export declare function recordHTTPRequest(method: string, route: string, statusCode: number, latencyMs: number, orgId?: string): void;
export declare function recordWebhook(source: string, eventType: string, processingMs: number, hmacValid?: boolean): void;
export declare function recordFlowExecution(flowType: string, status: string, latencyMs: number, orgId?: string): void;
export declare function recordDatabaseQuery(operation: string, table: string, latencyMs: number, orgId?: string): void;
export declare function recordIdempotencyReplay(key: string, orgId?: string): void;
export declare function recordIdempotencyConflict(key: string, orgId?: string): void;
export declare function recordRateLimitExceeded(route: string, orgId?: string): void;
export declare function recordOrgCost(orgId: string, costEUR: number, budgetEUR: number): void;
export declare const sdk: {
    start: () => void;
    shutdown: () => Promise<void>;
};
//# sourceMappingURL=index.d.ts.map