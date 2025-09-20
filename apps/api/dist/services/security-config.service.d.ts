export interface SecurityConfig {
    cors: {
        allowedOrigins: string[];
        allowedMethods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        credentials: boolean;
        maxAge: number;
    };
    helmet: {
        contentSecurityPolicy: any;
        hsts: any;
        frameguard: any;
        noSniff: boolean;
        xssFilter: boolean;
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    validation: {
        maxRequestSize: number;
        allowedContentTypes: string[];
        allowedHttpMethods: string[];
    };
    monitoring: {
        enableLogging: boolean;
        enableMetrics: boolean;
        logLevel: 'info' | 'warn' | 'error';
    };
}
export interface SecurityMetrics {
    totalRequests: number;
    blockedRequests: number;
    suspiciousRequests: number;
    corsRequests: number;
    rateLimitedRequests: number;
    lastUpdated: string;
}
declare class SecurityConfigService {
    private config;
    private metrics;
    private isInitialized;
    constructor();
    private getDefaultConfig;
    private getDefaultMetrics;
    private init;
    private loadFromEnvironment;
    private validateConfig;
    getConfig(): SecurityConfig;
    getCorsConfig(): {
        allowedOrigins: string[];
        allowedMethods: string[];
        allowedHeaders: string[];
        exposedHeaders: string[];
        credentials: boolean;
        maxAge: number;
    };
    getHelmetConfig(): {
        contentSecurityPolicy: any;
        hsts: any;
        frameguard: any;
        noSniff: boolean;
        xssFilter: boolean;
    };
    getRateLimitConfig(): {
        windowMs: number;
        maxRequests: number;
        skipSuccessfulRequests: boolean;
        skipFailedRequests: boolean;
    };
    getValidationConfig(): {
        maxRequestSize: number;
        allowedContentTypes: string[];
        allowedHttpMethods: string[];
    };
    getMonitoringConfig(): {
        enableLogging: boolean;
        enableMetrics: boolean;
        logLevel: "info" | "warn" | "error";
    };
    getMetrics(): SecurityMetrics;
    isReady(): boolean;
    updateCorsOrigins(origins: string[]): void;
    addCorsOrigin(origin: string): void;
    removeCorsOrigin(origin: string): void;
    updateRateLimit(maxRequests: number, windowMs: number): void;
    updateMaxRequestSize(size: number): void;
    incrementTotalRequests(): void;
    incrementBlockedRequests(): void;
    incrementSuspiciousRequests(): void;
    incrementCorsRequests(): void;
    incrementRateLimitedRequests(): void;
    resetMetrics(): void;
    isOriginAllowed(origin: string): boolean;
    isMethodAllowed(method: string): boolean;
    isHeaderAllowed(header: string): boolean;
    isContentTypeAllowed(contentType: string): boolean;
    isRequestSizeValid(size: number): boolean;
    getSecurityHeaders(): Record<string, string>;
    getApiHeaders(): Record<string, string>;
    getMiddlewareConfig(): {
        cors: {
            origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void;
            credentials: boolean;
            methods: string[];
            allowedHeaders: string[];
            exposedHeaders: string[];
            maxAge: number;
            preflightContinue: boolean;
            optionsSuccessStatus: number;
        };
        helmet: {
            contentSecurityPolicy: any;
            crossOriginEmbedderPolicy: boolean;
            crossOriginOpenerPolicy: {
                policy: string;
            };
            crossOriginResourcePolicy: {
                policy: string;
            };
            dnsPrefetchControl: {
                allow: boolean;
            };
            frameguard: any;
            hidePoweredBy: boolean;
            hsts: any;
            ieNoOpen: boolean;
            noSniff: boolean;
            originAgentCluster: boolean;
            permittedCrossDomainPolicies: boolean;
            referrerPolicy: {
                policy: string;
            };
            xssFilter: boolean;
        };
    };
}
export declare const securityConfigService: SecurityConfigService;
export {};
//# sourceMappingURL=security-config.service.d.ts.map