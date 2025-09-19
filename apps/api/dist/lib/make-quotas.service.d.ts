export interface MakeQuota {
    orgId: string;
    plan: string;
    monthlyLimit: number;
    currentUsage: number;
    resetDate: Date;
}
export interface IdempotencyRecord {
    key: string;
    orgId: string;
    response: any;
    createdAt: Date;
    expiresAt: Date;
}
export declare class MakeQuotasService {
    private quotas;
    private idempotencyStore;
    private hmacSecret;
    constructor();
    private initializeQuotas;
    private startCleanupInterval;
    private cleanupExpiredRecords;
    checkQuota(orgId: string): Promise<{
        allowed: boolean;
        quota: MakeQuota | null;
    }>;
    consumeQuota(orgId: string, amount?: number): Promise<boolean>;
    getQuota(orgId: string): Promise<MakeQuota | null>;
    updateQuota(orgId: string, quota: Partial<MakeQuota>): Promise<void>;
    generateIdempotencyKey(orgId: string, data: any): string;
    checkIdempotency(key: string, orgId: string): Promise<any | null>;
    storeIdempotency(key: string, orgId: string, response: any, ttlMinutes?: number): Promise<void>;
    verifyWebhookSignature(payload: string, signature: string): Promise<boolean>;
    getQuotaStats(): Promise<{
        total: number;
        used: number;
        available: number;
    }>;
    getOrgUsage(orgId: string): Promise<{
        current: number;
        limit: number;
        percentage: number;
    }>;
    resetQuota(orgId: string): Promise<void>;
    getAllQuotas(): Promise<MakeQuota[]>;
}
export declare const makeQuotas: MakeQuotasService;
//# sourceMappingURL=make-quotas.service.d.ts.map