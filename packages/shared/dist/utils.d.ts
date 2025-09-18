export declare function generateId(prefix?: string): string;
export declare function isNonNullable<T>(value: T): value is NonNullable<T>;
export declare function isString(value: unknown): value is string;
export declare function isNumber(value: unknown): value is number;
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
export declare function chunk<T>(array: T[], size: number): T[][];
export declare function slugify(text: string): string;
export declare function formatDate(date: Date, locale?: string): string;
export declare function validateEmail(email: string): boolean;
export declare function validatePhone(phone: string): boolean;
export declare function retry<T>(fn: () => Promise<T>, options: {
    attempts: number;
    delay: number;
    backoff?: number;
    onError?: (error: Error, attempt: number) => void;
}): Promise<T>;
export declare function safeJsonParse<T>(value: string): T | null;
export declare function asyncFilter<T>(array: T[], predicate: (item: T) => Promise<boolean>): Promise<T[]>;
//# sourceMappingURL=utils.d.ts.map