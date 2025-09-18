export declare function assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T;
export declare function assertTrue(value: unknown, message?: string): asserts value;
export declare function delay(ms: number): Promise<void>;
export declare function retry<T>(fn: () => Promise<T>, options?: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: unknown) => boolean;
}): Promise<T>;
export declare function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message?: string): Promise<T>;
export declare function memoize<T extends (...args: any[]) => any>(fn: T, options?: {
    maxSize?: number;
    ttl?: number;
}): T;
export declare function chunk<T>(array: T[], size: number): T[][];
export declare function debounce<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters<T>) => void;
export declare function throttle<T extends (...args: any[]) => any>(fn: T, wait: number): (...args: Parameters<T>) => void;
//# sourceMappingURL=common.d.ts.map