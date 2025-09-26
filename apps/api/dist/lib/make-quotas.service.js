import { createHmac, timingSafeEqual } from 'crypto';

import { structuredLogger } from './structured-logger.js';
export class MakeQuotasService {
    quotas = new Map();
    idempotencyStore = new Map();
    hmacSecret;
    constructor() {
        this.hmacSecret = process.env.MAKE_WEBHOOK_HMAC_SECRET || 'default-secret';
        this.initializeQuotas();
        this.startCleanupInterval();
    }
    initializeQuotas() {
        const defaultQuotas = [
            {
                orgId: 'enterprise',
                plan: 'enterprise',
                monthlyLimit: 10000,
                currentUsage: 0,
                resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            {
                orgId: 'business',
                plan: 'business',
                monthlyLimit: 5000,
                currentUsage: 0,
                resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            {
                orgId: 'starter',
                plan: 'starter',
                monthlyLimit: 1000,
                currentUsage: 0,
                resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            {
                orgId: 'demo',
                plan: 'demo',
                monthlyLimit: 100,
                currentUsage: 0,
                resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            }
        ];
        defaultQuotas.forEach(quota => {
            this.quotas.set(quota.orgId, quota);
        });
    }
    startCleanupInterval() {
        setInterval(() => {
            this.cleanupExpiredRecords();
        }, 60000);
    }
    cleanupExpiredRecords() {
        const now = new Date();
        let cleaned = 0;
        for (const [key, record] of this.idempotencyStore.entries()) {
            if (record.expiresAt < now) {
                this.idempotencyStore.delete(key);
                cleaned++;
            }
        }
        if (cleaned > 0) {
            structuredLogger.debug('Idempotency cleanup completed', { cleaned });
        }
    }
    async checkQuota(orgId) {
        const quota = this.quotas.get(orgId);
        if (!quota) {
            return { allowed: false, quota: null };
        }
        if (new Date() > quota.resetDate) {
            quota.currentUsage = 0;
            quota.resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        const allowed = quota.currentUsage < quota.monthlyLimit;
        return { allowed, quota };
    }
    async consumeQuota(orgId, amount = 1) {
        const { allowed, quota } = await this.checkQuota(orgId);
        if (!allowed || !quota) {
            return false;
        }
        quota.currentUsage += amount;
        structuredLogger.info('Quota consumed', {
            orgId,
            amount,
            currentUsage: quota.currentUsage,
            monthlyLimit: quota.monthlyLimit
        });
        return true;
    }
    async getQuota(orgId) {
        return this.quotas.get(orgId) || null;
    }
    async updateQuota(orgId, quota) {
        const existing = this.quotas.get(orgId);
        if (existing) {
            Object.assign(existing, quota);
            this.quotas.set(orgId, existing);
        }
        else {
            this.quotas.set(orgId, quota);
        }
    }
    generateIdempotencyKey(orgId, data) {
        const payload = JSON.stringify({ orgId, data });
        const hmac = createHmac('sha256', this.hmacSecret);
        hmac.update(payload);
        return hmac.digest('hex');
    }
    async checkIdempotency(key, orgId) {
        const record = this.idempotencyStore.get(key);
        if (!record) {
            return null;
        }
        if (record.orgId !== orgId) {
            return null;
        }
        if (new Date() > record.expiresAt) {
            this.idempotencyStore.delete(key);
            return null;
        }
        return record.response;
    }
    async storeIdempotency(key, orgId, response, ttlMinutes = 5) {
        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);
        const record = {
            key,
            orgId,
            response,
            createdAt: now,
            expiresAt
        };
        this.idempotencyStore.set(key, record);
    }
    async verifyWebhookSignature(payload, signature) {
        try {
            const expectedSignature = createHmac('sha256', this.hmacSecret)
                .update(payload)
                .digest('hex');
            const providedSignature = signature.replace('sha256=', '');
            return timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 'hex'));
        }
        catch (error) {
            structuredLogger.error('Webhook signature verification failed', error);
            return false;
        }
    }
    async getQuotaStats() {
        let total = 0;
        let used = 0;
        for (const quota of this.quotas.values()) {
            total += quota.monthlyLimit;
            used += quota.currentUsage;
        }
        return {
            total,
            used,
            available: total - used
        };
    }
    async getOrgUsage(orgId) {
        const quota = this.quotas.get(orgId);
        if (!quota) {
            return { current: 0, limit: 0, percentage: 0 };
        }
        const percentage = (quota.currentUsage / quota.monthlyLimit) * 100;
        return {
            current: quota.currentUsage,
            limit: quota.monthlyLimit,
            percentage: Math.round(percentage * 100) / 100
        };
    }
    async resetQuota(orgId) {
        const quota = this.quotas.get(orgId);
        if (quota) {
            quota.currentUsage = 0;
            quota.resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            structuredLogger.info('Quota reset', { orgId });
        }
    }
    async getAllQuotas() {
        return Array.from(this.quotas.values());
    }
}
export const makeQuotas = new MakeQuotasService();
//# sourceMappingURL=make-quotas.service.js.map