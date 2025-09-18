export * from './hmac.js';
export * from './idempotency.js';
export declare function redactPII(text: string): {
    redacted: string;
    tokens: Record<string, string>;
};
export declare function restorePII(redacted: string, tokens: Record<string, string>): string;
export declare function generateHMAC(timestamp: string, body: string, secret: string): string;
export declare function verifyHMAC(timestamp: string, body: string, signature: string, secret: string, maxSkewSeconds?: number): boolean;
export declare function hashApiKey(apiKey: string): string;
export declare function generateApiKey(prefix?: string): string;
export declare function validateApiKeyFormat(apiKey: string): boolean;
export declare function generateCorrelationId(): string;
export declare function generateRequestId(): string;
export declare function generateTraceParent(): string;
export declare const CSP_HEADER: string;
export declare const SECURITY_HEADERS: {
    readonly 'X-Content-Type-Options': "nosniff";
    readonly 'X-Frame-Options': "DENY";
    readonly 'X-XSS-Protection': "1; mode=block";
    readonly 'Strict-Transport-Security': "max-age=31536000; includeSubDomains";
    readonly 'Referrer-Policy': "strict-origin-when-cross-origin";
    readonly 'Content-Security-Policy': string;
};
//# sourceMappingURL=index.d.ts.map