import { z } from 'zod';
export declare const TelemetryConfigSchema: z.ZodObject<{
    enabled: z.ZodDefault<z.ZodBoolean>;
    endpoint: z.ZodOptional<z.ZodString>;
    apiKey: z.ZodOptional<z.ZodString>;
    sampleRate: z.ZodDefault<z.ZodNumber>;
    batchSize: z.ZodDefault<z.ZodNumber>;
    flushInterval: z.ZodDefault<z.ZodNumber>;
    maxRetries: z.ZodDefault<z.ZodNumber>;
    privacyMode: z.ZodDefault<z.ZodBoolean>;
    debugMode: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    endpoint?: string;
    maxRetries?: number;
    apiKey?: string;
    enabled?: boolean;
    sampleRate?: number;
    batchSize?: number;
    flushInterval?: number;
    privacyMode?: boolean;
    debugMode?: boolean;
}, {
    endpoint?: string;
    maxRetries?: number;
    apiKey?: string;
    enabled?: boolean;
    sampleRate?: number;
    batchSize?: number;
    flushInterval?: number;
    privacyMode?: boolean;
    debugMode?: boolean;
}>;
export declare const TelemetryEventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<["page_view", "user_action", "performance", "error", "custom"]>;
    name: z.ZodString;
    timestamp: z.ZodNumber;
    sessionId: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    organizationId: z.ZodOptional<z.ZodString>;
    properties: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    metrics: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodNumber>>;
    tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    privacy: z.ZodDefault<z.ZodObject<{
        pii: z.ZodDefault<z.ZodBoolean>;
        sensitive: z.ZodDefault<z.ZodBoolean>;
        anonymized: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        pii?: boolean;
        sensitive?: boolean;
        anonymized?: boolean;
    }, {
        pii?: boolean;
        sensitive?: boolean;
        anonymized?: boolean;
    }>>;
}, "strip", z.ZodTypeAny, {
    type?: "error" | "custom" | "performance" | "user_action" | "page_view";
    timestamp?: number;
    id?: string;
    userId?: string;
    name?: string;
    organizationId?: string;
    sessionId?: string;
    tags?: string[];
    metrics?: Record<string, number>;
    properties?: Record<string, any>;
    privacy?: {
        pii?: boolean;
        sensitive?: boolean;
        anonymized?: boolean;
    };
}, {
    type?: "error" | "custom" | "performance" | "user_action" | "page_view";
    timestamp?: number;
    id?: string;
    userId?: string;
    name?: string;
    organizationId?: string;
    sessionId?: string;
    tags?: string[];
    metrics?: Record<string, number>;
    properties?: Record<string, any>;
    privacy?: {
        pii?: boolean;
        sensitive?: boolean;
        anonymized?: boolean;
    };
}>;
export declare const PerformanceMetricsSchema: z.ZodObject<{
    pageLoadTime: z.ZodOptional<z.ZodNumber>;
    domContentLoaded: z.ZodOptional<z.ZodNumber>;
    firstContentfulPaint: z.ZodOptional<z.ZodNumber>;
    largestContentfulPaint: z.ZodOptional<z.ZodNumber>;
    firstInputDelay: z.ZodOptional<z.ZodNumber>;
    cumulativeLayoutShift: z.ZodOptional<z.ZodNumber>;
    memoryUsage: z.ZodOptional<z.ZodNumber>;
    networkLatency: z.ZodOptional<z.ZodNumber>;
    renderTime: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    pageLoadTime?: number;
    domContentLoaded?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    firstInputDelay?: number;
    cumulativeLayoutShift?: number;
    memoryUsage?: number;
    networkLatency?: number;
    renderTime?: number;
}, {
    pageLoadTime?: number;
    domContentLoaded?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    firstInputDelay?: number;
    cumulativeLayoutShift?: number;
    memoryUsage?: number;
    networkLatency?: number;
    renderTime?: number;
}>;
export declare const UserActionSchema: z.ZodObject<{
    action: z.ZodString;
    element: z.ZodOptional<z.ZodString>;
    page: z.ZodOptional<z.ZodString>;
    context: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    duration: z.ZodOptional<z.ZodNumber>;
    success: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    context?: Record<string, any>;
    success?: boolean;
    duration?: number;
    action?: string;
    page?: string;
    element?: string;
}, {
    context?: Record<string, any>;
    success?: boolean;
    duration?: number;
    action?: string;
    page?: string;
    element?: string;
}>;
export declare const ErrorEventSchema: z.ZodObject<{
    message: z.ZodString;
    stack: z.ZodOptional<z.ZodString>;
    filename: z.ZodOptional<z.ZodString>;
    lineno: z.ZodOptional<z.ZodNumber>;
    colno: z.ZodOptional<z.ZodNumber>;
    error: z.ZodOptional<z.ZodAny>;
    context: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    severity: z.ZodDefault<z.ZodEnum<["low", "medium", "high", "critical"]>>;
}, "strip", z.ZodTypeAny, {
    error?: any;
    message?: string;
    context?: Record<string, any>;
    filename?: string;
    stack?: string;
    severity?: "medium" | "low" | "high" | "critical";
    lineno?: number;
    colno?: number;
}, {
    error?: any;
    message?: string;
    context?: Record<string, any>;
    filename?: string;
    stack?: string;
    severity?: "medium" | "low" | "high" | "critical";
    lineno?: number;
    colno?: number;
}>;
export type TelemetryConfig = z.infer<typeof TelemetryConfigSchema>;
export type TelemetryEvent = z.infer<typeof TelemetryEventSchema>;
export type PerformanceMetrics = z.infer<typeof PerformanceMetricsSchema>;
export type UserAction = z.infer<typeof UserActionSchema>;
export type ErrorEvent = z.infer<typeof ErrorEventSchema>;
export declare class TelemetryService {
    private config;
    private events;
    private sessionId;
    private userId?;
    private organizationId?;
    private flushTimer?;
    private isFlushing;
    constructor(config?: Partial<TelemetryConfig>);
    setUser(userId: string, organizationId?: string): void;
    trackEvent(type: TelemetryEvent['type'], name: string, properties?: Record<string, any>, metrics?: Record<string, number>, tags?: string[]): void;
    trackPageView(page: string, properties?: Record<string, any>): void;
    trackUserAction(action: string, element?: string, context?: Record<string, any>): void;
    trackPerformance(metrics: PerformanceMetrics): void;
    trackError(error: Error | string, context?: Record<string, any>): void;
    trackCustom(name: string, properties?: Record<string, any>, metrics?: Record<string, number>): void;
    private setupPerformanceObserver;
    private getFirstContentfulPaint;
    private getLargestContentfulPaint;
    private getFirstInputDelay;
    private getCumulativeLayoutShift;
    private getMemoryUsage;
    private getResourceType;
    private setupErrorHandlers;
    private sanitizeProperties;
    private isPII;
    private isSensitive;
    private anonymizeValue;
    private analyzePrivacy;
    private shouldSample;
    private scheduleFlush;
    private startFlushTimer;
    private flush;
    private sendEvents;
    private generateId;
    private generateSessionId;
    private getCurrentFilename;
    private getCurrentLineNumber;
    private getCurrentColumnNumber;
    destroy(): void;
}
export declare function initializeTelemetry(config?: Partial<TelemetryConfig>): TelemetryService;
export declare function getTelemetry(): TelemetryService | null;
export declare function trackPageView(page: string, properties?: Record<string, any>): void;
export declare function trackUserAction(action: string, element?: string, context?: Record<string, any>): void;
export declare function trackError(error: Error | string, context?: Record<string, any>): void;
export declare function trackCustom(name: string, properties?: Record<string, any>, metrics?: Record<string, number>): void;
export declare function setTelemetryUser(userId: string, organizationId?: string): void;
//# sourceMappingURL=index.d.ts.map