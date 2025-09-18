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
export declare function generateCorrelationId(): string;
export declare function generateRequestId(): string;
export declare function generateTraceId(): string;
export declare function generateSpanId(): string;
export declare function isValidCorrelationId(correlationId: string): boolean;
export declare function isValidRequestId(requestId: string): boolean;
export declare function isValidTraceId(traceId: string): boolean;
export declare function isValidSpanId(spanId: string): boolean;
export declare function extractCorrelationId(headers: Record<string, string | string[] | undefined>): string | null;
export declare function extractRequestId(headers: Record<string, string | string[] | undefined>): string | null;
export declare function extractTraceId(headers: Record<string, string | string[] | undefined>): string | null;
export declare function extractSpanId(headers: Record<string, string | string[] | undefined>): string | null;
export declare function extractParentSpanId(headers: Record<string, string | string[] | undefined>): string | null;
export declare function createCorrelationContext(headers: Record<string, string | string[] | undefined>): CorrelationContext;
export declare function createCorrelationHeaders(context: CorrelationContext): CorrelationHeaders;
export declare function propagateCorrelationId(sourceHeaders: Record<string, string | string[] | undefined>, targetHeaders?: Record<string, string>): Record<string, string>;
export declare function createChildSpan(parentContext: CorrelationContext, operationName: string): CorrelationContext;
export declare function addCorrelationToLog(logData: Record<string, unknown>, context: CorrelationContext): Record<string, unknown>;
export declare function createLogContext(context: CorrelationContext, additionalData?: Record<string, unknown>): Record<string, unknown>;
export declare function getCorrelationIdFromRequest(req: any): string;
export declare function setCorrelationIdOnResponse(res: any, correlationId: string): void;
export declare function addCorrelationToRequest(req: any, correlationId: string): void;
declare class CorrelationStore {
    private store;
    set(correlationId: string, context: CorrelationContext): void;
    get(correlationId: string): CorrelationContext | undefined;
    delete(correlationId: string): boolean;
    clear(): void;
}
export declare const correlationStore: CorrelationStore;
export declare function withCorrelationContext<T>(context: CorrelationContext, fn: () => T): T;
export declare function getCurrentCorrelationContext(correlationId: string): CorrelationContext | undefined;
declare const _default: {
    generateCorrelationId: typeof generateCorrelationId;
    generateRequestId: typeof generateRequestId;
    generateTraceId: typeof generateTraceId;
    generateSpanId: typeof generateSpanId;
    isValidCorrelationId: typeof isValidCorrelationId;
    isValidRequestId: typeof isValidRequestId;
    isValidTraceId: typeof isValidTraceId;
    isValidSpanId: typeof isValidSpanId;
    extractCorrelationId: typeof extractCorrelationId;
    extractRequestId: typeof extractRequestId;
    extractTraceId: typeof extractTraceId;
    extractSpanId: typeof extractSpanId;
    extractParentSpanId: typeof extractParentSpanId;
    createCorrelationContext: typeof createCorrelationContext;
    createCorrelationHeaders: typeof createCorrelationHeaders;
    propagateCorrelationId: typeof propagateCorrelationId;
    createChildSpan: typeof createChildSpan;
    addCorrelationToLog: typeof addCorrelationToLog;
    createLogContext: typeof createLogContext;
    getCorrelationIdFromRequest: typeof getCorrelationIdFromRequest;
    setCorrelationIdOnResponse: typeof setCorrelationIdOnResponse;
    addCorrelationToRequest: typeof addCorrelationToRequest;
    correlationStore: CorrelationStore;
    withCorrelationContext: typeof withCorrelationContext;
    getCurrentCorrelationContext: typeof getCurrentCorrelationContext;
};
export default _default;
//# sourceMappingURL=index.d.ts.map