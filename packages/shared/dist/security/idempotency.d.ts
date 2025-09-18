type Stored = {
    status: number;
    body: any;
};
export declare function getIdempotency(key: string): Promise<Stored | null>;
export declare function setIdempotency(key: string, value: Stored, ttlSeconds?: number): Promise<void>;
export {};
//# sourceMappingURL=idempotency.d.ts.map