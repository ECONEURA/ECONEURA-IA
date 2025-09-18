type Resolved = {
    run_id: string;
    status: 'ok' | 'queued';
};
export interface IdempotencyStore {
    setFirst(key: string, value: Resolved, ttlSec: number): Promise<boolean>;
    get(key: string): Promise<Resolved | null>;
}
export declare function createIdempotencyStore(): IdempotencyStore;
export {};
//# sourceMappingURL=store.d.ts.map