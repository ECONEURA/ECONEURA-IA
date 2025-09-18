import { z } from 'zod';
export const TelemetryConfigSchema = z.object({
    enabled: z.boolean().default(true),
    endpoint: z.string().url().optional(),
    apiKey: z.string().optional(),
    sampleRate: z.number().min(0).max(1).default(1.0),
    batchSize: z.number().min(1).max(1000).default(100),
    flushInterval: z.number().min(1000).default(5000),
    maxRetries: z.number().min(0).max(10).default(3),
    privacyMode: z.boolean().default(true),
    debugMode: z.boolean().default(false)
});
export const TelemetryEventSchema = z.object({
    id: z.string().uuid(),
    type: z.enum(['page_view', 'user_action', 'performance', 'error', 'custom']),
    name: z.string().min(1),
    timestamp: z.number(),
    sessionId: z.string().uuid(),
    userId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
    properties: z.record(z.any()).default({}),
    metrics: z.record(z.number()).default({}),
    tags: z.array(z.string()).default([]),
    privacy: z.object({
        pii: z.boolean().default(false),
        sensitive: z.boolean().default(false),
        anonymized: z.boolean().default(false)
    }).default({})
});
export const PerformanceMetricsSchema = z.object({
    pageLoadTime: z.number().optional(),
    domContentLoaded: z.number().optional(),
    firstContentfulPaint: z.number().optional(),
    largestContentfulPaint: z.number().optional(),
    firstInputDelay: z.number().optional(),
    cumulativeLayoutShift: z.number().optional(),
    memoryUsage: z.number().optional(),
    networkLatency: z.number().optional(),
    renderTime: z.number().optional()
});
export const UserActionSchema = z.object({
    action: z.string().min(1),
    element: z.string().optional(),
    page: z.string().optional(),
    context: z.record(z.any()).default({}),
    duration: z.number().optional(),
    success: z.boolean().default(true)
});
export const ErrorEventSchema = z.object({
    message: z.string().min(1),
    stack: z.string().optional(),
    filename: z.string().optional(),
    lineno: z.number().optional(),
    colno: z.number().optional(),
    error: z.any().optional(),
    context: z.record(z.any()).default({}),
    severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium')
});
export class TelemetryService {
    config;
    events = [];
    sessionId;
    userId;
    organizationId;
    flushTimer;
    isFlushing = false;
    constructor(config = {}) {
        this.config = TelemetryConfigSchema.parse(config);
        this.sessionId = this.generateSessionId();
        if (this.config.enabled) {
            this.startFlushTimer();
            this.setupPerformanceObserver();
            this.setupErrorHandlers();
        }
    }
    setUser(userId, organizationId) {
        this.userId = userId;
        this.organizationId = organizationId;
    }
    trackEvent(type, name, properties = {}, metrics = {}, tags = []) {
        if (!this.config.enabled || !this.shouldSample()) {
            return;
        }
        const event = {
            id: this.generateId(),
            type,
            name,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            userId: this.userId,
            organizationId: this.organizationId,
            properties: this.sanitizeProperties(properties),
            metrics,
            tags,
            privacy: this.analyzePrivacy(properties)
        };
        this.events.push(event);
        this.scheduleFlush();
    }
    trackPageView(page, properties = {}) {
        this.trackEvent('page_view', 'page_view', {
            page,
            url: window.location.href,
            referrer: document.referrer,
            ...properties
        });
    }
    trackUserAction(action, element, context = {}) {
        this.trackEvent('user_action', 'user_action', {
            action,
            element,
            page: window.location.pathname,
            ...context
        });
    }
    trackPerformance(metrics) {
        this.trackEvent('performance', 'performance_metrics', {}, metrics);
    }
    trackError(error, context = {}) {
        const errorEvent = {
            message: typeof error === 'string' ? error : error.message,
            stack: typeof error === 'object' ? error.stack : undefined,
            context,
            severity: 'medium'
        };
        this.trackEvent('error', 'error', {
            ...errorEvent,
            filename: this.getCurrentFilename(),
            lineno: this.getCurrentLineNumber(),
            colno: this.getCurrentColumnNumber()
        });
    }
    trackCustom(name, properties = {}, metrics = {}) {
        this.trackEvent('custom', name, properties, metrics);
    }
    setupPerformanceObserver() {
        if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
            return;
        }
        window.addEventListener('load', () => {
            setTimeout(() => {
                const navigation = performance.getEntriesByType('navigation')[0];
                if (navigation) {
                    this.trackPerformance({
                        pageLoadTime: navigation.loadEventEnd - navigation.loadEventStart,
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        firstContentfulPaint: this.getFirstContentfulPaint(),
                        largestContentfulPaint: this.getLargestContentfulPaint(),
                        firstInputDelay: this.getFirstInputDelay(),
                        cumulativeLayoutShift: this.getCumulativeLayoutShift(),
                        memoryUsage: this.getMemoryUsage(),
                        networkLatency: navigation.responseStart - navigation.requestStart
                    });
                }
            }, 1000);
        });
        const resourceObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.entryType === 'resource') {
                    this.trackCustom('resource_load', {
                        name: entry.name,
                        duration: entry.duration,
                        size: entry.transferSize || 0,
                        type: this.getResourceType(entry.name)
                    }, {
                        loadTime: entry.duration,
                        size: entry.transferSize || 0
                    });
                }
            }
        });
        try {
            resourceObserver.observe({ entryTypes: ['resource'] });
        }
        catch (e) {
        }
    }
    getFirstContentfulPaint() {
        const entries = performance.getEntriesByName('first-contentful-paint');
        return entries.length > 0 ? entries[0].startTime : undefined;
    }
    getLargestContentfulPaint() {
        const entries = performance.getEntriesByType('largest-contentful-paint');
        return entries.length > 0 ? entries[entries.length - 1].startTime : undefined;
    }
    getFirstInputDelay() {
        const entries = performance.getEntriesByType('first-input');
        return entries.length > 0 ? entries[0].processingStart - entries[0].startTime : undefined;
    }
    getCumulativeLayoutShift() {
        const entries = performance.getEntriesByType('layout-shift');
        return entries.reduce((sum, entry) => sum + entry.value, 0);
    }
    getMemoryUsage() {
        if ('memory' in performance) {
            return performance.memory.usedJSHeapSize;
        }
        return undefined;
    }
    getResourceType(url) {
        if (url.includes('.js'))
            return 'script';
        if (url.includes('.css'))
            return 'stylesheet';
        if (url.includes('.png') || url.includes('.jpg') || url.includes('.gif'))
            return 'image';
        if (url.includes('.woff') || url.includes('.ttf'))
            return 'font';
        return 'other';
    }
    setupErrorHandlers() {
        if (typeof window === 'undefined')
            return;
        window.addEventListener('error', (event) => {
            this.trackError(event.error || event.message, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                type: 'javascript_error'
            });
        });
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError(event.reason, {
                type: 'unhandled_promise_rejection',
                promise: event.promise
            });
        });
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.trackError(`Resource load error: ${event.target.src || event.target.href}`, {
                    type: 'resource_error',
                    element: event.target.tagName,
                    src: event.target.src || event.target.href
                });
            }
        }, true);
    }
    sanitizeProperties(properties) {
        if (!this.config.privacyMode) {
            return properties;
        }
        const sanitized = {};
        for (const [key, value] of Object.entries(properties)) {
            if (this.isPII(key, value)) {
                sanitized[key] = this.anonymizeValue(value);
            }
            else if (this.isSensitive(key, value)) {
                sanitized[key] = '[REDACTED]';
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    isPII(key, value) {
        const piiKeys = ['email', 'phone', 'ssn', 'credit_card', 'password', 'token'];
        const piiPatterns = [
            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
            /^\d{3}-\d{2}-\d{4}$/,
            /^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/
        ];
        return piiKeys.some(piiKey => key.toLowerCase().includes(piiKey)) ||
            piiPatterns.some(pattern => typeof value === 'string' && pattern.test(value));
    }
    isSensitive(key, value) {
        const sensitiveKeys = ['password', 'secret', 'key', 'token', 'auth'];
        return sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey));
    }
    anonymizeValue(value) {
        if (typeof value === 'string') {
            if (value.includes('@')) {
                const [local, domain] = value.split('@');
                return `${local.substring(0, 2)}***@${domain}`;
            }
            if (value.length > 4) {
                return `${value.substring(0, 2)}***${value.substring(value.length - 2)}`;
            }
            return '***';
        }
        return '[ANONYMIZED]';
    }
    analyzePrivacy(properties) {
        let pii = false;
        let sensitive = false;
        let anonymized = false;
        for (const [key, value] of Object.entries(properties)) {
            if (this.isPII(key, value)) {
                pii = true;
                if (this.config.privacyMode) {
                    anonymized = true;
                }
            }
            if (this.isSensitive(key, value)) {
                sensitive = true;
            }
        }
        return { pii, sensitive, anonymized };
    }
    shouldSample() {
        return Math.random() < this.config.sampleRate;
    }
    scheduleFlush() {
        if (this.events.length >= this.config.batchSize) {
            this.flush();
        }
    }
    startFlushTimer() {
        this.flushTimer = setInterval(() => {
            if (this.events.length > 0) {
                this.flush();
            }
        }, this.config.flushInterval);
    }
    async flush() {
        if (this.isFlushing || this.events.length === 0) {
            return;
        }
        this.isFlushing = true;
        const eventsToFlush = this.events.splice(0, this.config.batchSize);
        try {
            await this.sendEvents(eventsToFlush);
        }
        catch (error) {
            this.events.unshift(...eventsToFlush);
            console.warn('Failed to send telemetry events:', error);
        }
        finally {
            this.isFlushing = false;
        }
    }
    async sendEvents(events) {
        if (!this.config.endpoint) {
            if (this.config.debugMode) {
            }
            return;
        }
        const response = await fetch(this.config.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
            },
            body: JSON.stringify({
                events,
                sessionId: this.sessionId,
                timestamp: Date.now()
            })
        });
        if (!response.ok) {
            throw new Error(`Failed to send telemetry: ${response.status}`);
        }
    }
    generateId() {
        return crypto.randomUUID();
    }
    generateSessionId() {
        return crypto.randomUUID();
    }
    getCurrentFilename() {
        return window.location.pathname;
    }
    getCurrentLineNumber() {
        return undefined;
    }
    getCurrentColumnNumber() {
        return undefined;
    }
    destroy() {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        this.flush();
    }
}
let globalTelemetry = null;
export function initializeTelemetry(config = {}) {
    if (globalTelemetry) {
        return globalTelemetry;
    }
    globalTelemetry = new TelemetryService(config);
    return globalTelemetry;
}
export function getTelemetry() {
    return globalTelemetry;
}
export function trackPageView(page, properties) {
    getTelemetry()?.trackPageView(page, properties);
}
export function trackUserAction(action, element, context) {
    getTelemetry()?.trackUserAction(action, element, context);
}
export function trackError(error, context) {
    getTelemetry()?.trackError(error, context);
}
export function trackCustom(name, properties, metrics) {
    getTelemetry()?.trackCustom(name, properties, metrics);
}
export function setTelemetryUser(userId, organizationId) {
    getTelemetry()?.setUser(userId, organizationId);
}
//# sourceMappingURL=index.js.map