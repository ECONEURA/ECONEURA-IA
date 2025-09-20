import { createHmac, timingSafeEqual } from 'crypto';
import { structuredLogger } from './structured-logger.js';

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

export class MakeQuotasService {
  private quotas: Map<string, MakeQuota> = new Map();
  private idempotencyStore: Map<string, IdempotencyRecord> = new Map();
  private hmacSecret: string;

  constructor() {
    this.hmacSecret = process.env.MAKE_WEBHOOK_HMAC_SECRET || 'default-secret';
    this.initializeQuotas();
    this.startCleanupInterval();
  }

  private initializeQuotas(): void {
    // Inicializar cuotas por defecto
    const defaultQuotas: MakeQuota[] = [
      {
        orgId: 'enterprise',
        plan: 'enterprise',
        monthlyLimit: 10000,
        currentUsage: 0,
        resetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
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

  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpiredRecords();
    }, 60000); // Cleanup every minute
  }

  private cleanupExpiredRecords(): void {
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

  async checkQuota(orgId: string): Promise<{ allowed: boolean; quota: MakeQuota | null }> {
    const quota = this.quotas.get(orgId);
    
    if (!quota) {
      return { allowed: false, quota: null };
    }

    // Check if quota has reset
    if (new Date() > quota.resetDate) {
      quota.currentUsage = 0;
      quota.resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    const allowed = quota.currentUsage < quota.monthlyLimit;
    
    return { allowed, quota };
  }

  async consumeQuota(orgId: string, amount: number = 1): Promise<boolean> {
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

  async getQuota(orgId: string): Promise<MakeQuota | null> {
    return this.quotas.get(orgId) || null;
  }

  async updateQuota(orgId: string, quota: Partial<MakeQuota>): Promise<void> {
    const existing = this.quotas.get(orgId);
    if (existing) {
      Object.assign(existing, quota);
      this.quotas.set(orgId, existing);
    } else {
      this.quotas.set(orgId, quota as MakeQuota);
    }
  }

  // Idempotencia
  generateIdempotencyKey(orgId: string, data: any): string {
    const payload = JSON.stringify({ orgId, data });
    const hmac = createHmac('sha256', this.hmacSecret);
    hmac.update(payload);
    return hmac.digest('hex');
  }

  async checkIdempotency(key: string, orgId: string): Promise<any | null> {
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

  async storeIdempotency(key: string, orgId: string, response: any, ttlMinutes: number = 5): Promise<void> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const record: IdempotencyRecord = {
      key,
      orgId,
      response,
      createdAt: now,
      expiresAt
    };

    this.idempotencyStore.set(key, record);
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      const expectedSignature = createHmac('sha256', this.hmacSecret)
        .update(payload)
        .digest('hex');
      
      const providedSignature = signature.replace('sha256=', '');
      
      return timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(providedSignature, 'hex')
      );
    } catch (error) {
      structuredLogger.error('Webhook signature verification failed', error as Error);
      return false;
    }
  }

  async getQuotaStats(): Promise<{ total: number; used: number; available: number }> {
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

  async getOrgUsage(orgId: string): Promise<{ current: number; limit: number; percentage: number }> {
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

  async resetQuota(orgId: string): Promise<void> {
    const quota = this.quotas.get(orgId);
    
    if (quota) {
      quota.currentUsage = 0;
      quota.resetDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      
      structuredLogger.info('Quota reset', { orgId });
    }
  }

  async getAllQuotas(): Promise<MakeQuota[]> {
    return Array.from(this.quotas.values());
  }
}

export const makeQuotas = new MakeQuotasService();
