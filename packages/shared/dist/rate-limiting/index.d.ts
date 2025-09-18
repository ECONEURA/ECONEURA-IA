import { z } from 'zod';
export declare const RateLimitConfigSchema: z.ZodObject<{
    windowMs: z.ZodDefault<z.ZodNumber>;
    maxRequests: z.ZodDefault<z.ZodNumber>;
    keyGenerator: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    skipSuccessfulRequests: z.ZodDefault<z.ZodBoolean>;
    skipFailedRequests: z.ZodDefault<z.ZodBoolean>;
    message: z.ZodDefault<z.ZodString>;
    standardHeaders: z.ZodDefault<z.ZodBoolean>;
    legacyHeaders: z.ZodDefault<z.ZodBoolean>;
    handler: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
    onLimitReached: z.ZodOptional<z.ZodFunction<z.ZodTuple<[], z.ZodUnknown>, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (...args: unknown[]) => unknown;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    handler?: (...args: unknown[]) => unknown;
    onLimitReached?: (...args: unknown[]) => unknown;
}, {
    message?: string;
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (...args: unknown[]) => unknown;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    handler?: (...args: unknown[]) => unknown;
    onLimitReached?: (...args: unknown[]) => unknown;
}>;
export declare const RateLimitRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    windowMs: z.ZodNumber;
    maxRequests: z.ZodNumber;
    keyType: z.ZodEnum<["ip", "api_key", "user", "custom"]>;
    keyField: z.ZodOptional<z.ZodString>;
    conditions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
    message: z.ZodOptional<z.ZodString>;
    enabled: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    message?: string;
    id?: string;
    name?: string;
    conditions?: Record<string, any>;
    enabled?: boolean;
    windowMs?: number;
    maxRequests?: number;
    keyType?: "custom" | "user" | "api_key" | "ip";
    keyField?: string;
}, {
    message?: string;
    id?: string;
    name?: string;
    conditions?: Record<string, any>;
    enabled?: boolean;
    windowMs?: number;
    maxRequests?: number;
    keyType?: "custom" | "user" | "api_key" | "ip";
    keyField?: string;
}>;
export declare const RateLimitResultSchema: z.ZodObject<{
    allowed: z.ZodBoolean;
    remaining: z.ZodNumber;
    resetTime: z.ZodNumber;
    totalHits: z.ZodNumber;
    windowStart: z.ZodNumber;
    windowEnd: z.ZodNumber;
    key: z.ZodString;
    rule: z.ZodString;
}, "strip", z.ZodTypeAny, {
    remaining?: number;
    allowed?: boolean;
    key?: string;
    resetTime?: number;
    totalHits?: number;
    windowStart?: number;
    windowEnd?: number;
    rule?: string;
}, {
    remaining?: number;
    allowed?: boolean;
    key?: string;
    resetTime?: number;
    totalHits?: number;
    windowStart?: number;
    windowEnd?: number;
    rule?: string;
}>;
export type RateLimitConfig = z.infer<typeof RateLimitConfigSchema>;
export type RateLimitRule = z.infer<typeof RateLimitRuleSchema>;
export type RateLimitResult = z.infer<typeof RateLimitResultSchema>;
export interface RateLimitRequest {
    ip?: string;
    apiKey?: string;
    userId?: string;
    customKey?: string;
    headers?: Record<string, string>;
    body?: any;
    method?: string;
    path?: string;
}
export interface RateLimitStore {
    get(key: string): Promise<RateLimitEntry | null>;
    set(key: string, entry: RateLimitEntry, ttl: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
}
export interface RateLimitEntry {
    count: number;
    windowStart: number;
    windowEnd: number;
    firstRequest: number;
    lastRequest: number;
}
export declare class MemoryRateLimitStore implements RateLimitStore {
    private store;
    private timers;
    get(key: string): Promise<RateLimitEntry | null>;
    set(key: string, entry: RateLimitEntry, ttl: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
    getStats(): {
        totalKeys: number;
        memoryUsage: number;
    };
}
export declare class RateLimiter {
    private config;
    private store;
    private rules;
    constructor(config?: Partial<RateLimitConfig>, store?: RateLimitStore);
    addRule(rule: RateLimitRule): void;
    removeRule(ruleId: string): boolean;
    getRule(ruleId: string): RateLimitRule | undefined;
    getAllRules(): RateLimitRule[];
    checkLimit(request: RateLimitRequest, ruleId?: string): Promise<RateLimitResult>;
    private generateKey;
    private calculateWindowStart;
    private getDefaultRule;
    private createAllowedResult;
    resetLimit(key: string): Promise<void>;
    getLimitInfo(key: string): Promise<RateLimitEntry | null>;
    clearAllLimits(): Promise<void>;
    getStats(): {
        rules: number;
        storeStats: any;
    };
}
import { Request, Response, NextFunction } from 'express';
export interface RateLimitRequestExtended extends Request {
    rateLimit?: RateLimitResult;
    user?: {
        id: string;
        organizationId?: string;
    };
}
export declare function createRateLimitMiddleware(limiter: RateLimiter, ruleId?: string): (req: RateLimitRequest, res: Response, next: NextFunction) => Promise<void>;
export declare const RateLimitPresets: {
    api: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    strict: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    login: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    passwordReset: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    upload: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
    ai: {
        windowMs: number;
        maxRequests: number;
        message: string;
    };
};
export declare function createRateLimiter(config?: Partial<RateLimitConfig>, store?: RateLimitStore): RateLimiter;
export declare function createPresetRateLimiter(preset: keyof typeof RateLimitPresets, store?: RateLimitStore): RateLimiter;
export default RateLimiter;
//# sourceMappingURL=index.d.ts.map