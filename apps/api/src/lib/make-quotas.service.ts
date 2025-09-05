import { EventEmitter } from 'events';
import { structuredLogger } from './structured-logger.js';
import { apiCache } from './advanced-cache.js';

export interface MakeQuota {
  id: string;
  organizationId: string;
  quotaType: 'api_calls' | 'data_processing' | 'webhook_calls';
  limit: number;
  used: number;
  period: 'hourly' | 'daily' | 'monthly';
  resetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuotaUsage {
  quotaId: string;
  organizationId: string;
  used: number;
  remaining: number;
  percentage: number;
  resetAt: Date;
  isExceeded: boolean;
  isWarning: boolean;
}

export interface IdempotencyKey {
  key: string;
  organizationId: string;
  requestHash: string;
  responseHash: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
  expiresAt: Date;
  ttl: number;
}

export class MakeQuotasService extends EventEmitter {
  private quotas: Map<string, MakeQuota> = new Map();
  private idempotencyKeys: Map<string, IdempotencyKey> = new Map();
  private readonly WARNING_THRESHOLD = 80;
  private readonly CRITICAL_THRESHOLD = 95;

  constructor() {
    super();
    this.initializeDefaultQuotas();
    this.startCleanupInterval();
  }

  private initializeDefaultQuotas(): void {
    const defaultQuotas: Omit<MakeQuota, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        organizationId: 'demo-org-1',
        quotaType: 'api_calls',
        limit: 1000,
        used: 0,
        period: 'hourly',
        resetAt: new Date(Date.now() + 60 * 60 * 1000)
      },
      {
        organizationId: 'demo-org-1',
        quotaType: 'data_processing',
        limit: 10000,
        used: 0,
        period: 'daily',
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      {
        organizationId: 'demo-org-1',
        quotaType: 'webhook_calls',
        limit: 500,
        used: 0,
        period: 'hourly',
        resetAt: new Date(Date.now() + 60 * 60 * 1000)
      },
      {
        organizationId: 'premium-org',
        quotaType: 'api_calls',
        limit: 10000,
        used: 0,
        period: 'hourly',
        resetAt: new Date(Date.now() + 60 * 60 * 1000)
      },
      {
        organizationId: 'premium-org',
        quotaType: 'data_processing',
        limit: 100000,
        used: 0,
        period: 'daily',
        resetAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      }
    ];

    defaultQuotas.forEach(quota => {
      const id = `quota_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date();
      const makeQuota: MakeQuota = {
        ...quota,
        id,
        createdAt: now,
        updatedAt: now
      };
      this.quotas.set(id, makeQuota);
    });

    structuredLogger.info('Default quotas initialized', {
      quotasCount: this.quotas.size,
      requestId: ''
    });
  }

  private startCleanupInterval(): void {
    // Cleanup expired idempotency keys every 5 minutes
    setInterval(() => {
      this.cleanupExpiredKeys();
    }, 5 * 60 * 1000);

    // Reset quotas based on their period
    setInterval(() => {
      this.resetExpiredQuotas();
    }, 60 * 1000); // Check every minute
  }

  private cleanupExpiredKeys(): void {
    const now = new Date();
    let cleanedCount = 0;

    for (const [key, idempotencyKey] of this.idempotencyKeys.entries()) {
      if (now > idempotencyKey.expiresAt) {
        this.idempotencyKeys.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      structuredLogger.info('Expired idempotency keys cleaned up', {
        cleanedCount,
        requestId: ''
      });
    }
  }

  private resetExpiredQuotas(): void {
    const now = new Date();
    let resetCount = 0;

    for (const quota of this.quotas.values()) {
      if (now >= quota.resetAt) {
        quota.used = 0;
        quota.updatedAt = now;
        
        // Set next reset time based on period
        switch (quota.period) {
          case 'hourly':
            quota.resetAt = new Date(now.getTime() + 60 * 60 * 1000);
            break;
          case 'daily':
            quota.resetAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            break;
          case 'monthly':
            quota.resetAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
            break;
        }
        
        resetCount++;
        this.emit('quotaReset', quota);
      }
    }

    if (resetCount > 0) {
      structuredLogger.info('Quotas reset', {
        resetCount,
        requestId: ''
      });
    }
  }

  public async checkQuota(organizationId: string, quotaType: MakeQuota['quotaType']): Promise<QuotaUsage> {
    const quota = Array.from(this.quotas.values()).find(
      q => q.organizationId === organizationId && q.quotaType === quotaType
    );

    if (!quota) {
      throw new Error(`Quota not found for organization ${organizationId} and type ${quotaType}`);
    }

    const remaining = Math.max(0, quota.limit - quota.used);
    const percentage = (quota.used / quota.limit) * 100;
    const isExceeded = quota.used >= quota.limit;
    const isWarning = percentage >= this.WARNING_THRESHOLD && !isExceeded;

    const usage: QuotaUsage = {
      quotaId: quota.id,
      organizationId: quota.organizationId,
      used: quota.used,
      remaining,
      percentage: Math.round(percentage * 100) / 100,
      resetAt: quota.resetAt,
      isExceeded,
      isWarning
    };

    // Cache the usage for 30 seconds
    const cacheKey = `quota_usage_${organizationId}_${quotaType}`;
    apiCache.set(cacheKey, usage, 30);

    return usage;
  }

  public async consumeQuota(organizationId: string, quotaType: MakeQuota['quotaType'], amount: number = 1): Promise<QuotaUsage> {
    const quota = Array.from(this.quotas.values()).find(
      q => q.organizationId === organizationId && q.quotaType === quotaType
    );

    if (!quota) {
      throw new Error(`Quota not found for organization ${organizationId} and type ${quotaType}`);
    }

    // Check if quota would be exceeded
    if (quota.used + amount > quota.limit) {
      throw new Error(`Quota exceeded for organization ${organizationId} and type ${quotaType}`);
    }

    quota.used += amount;
    quota.updatedAt = new Date();

    const usage = await this.checkQuota(organizationId, quotaType);

    // Emit events for monitoring
    if (usage.isExceeded) {
      this.emit('quotaExceeded', { quota, usage });
      structuredLogger.warn('Quota exceeded', {
        organizationId,
        quotaType,
        used: quota.used,
        limit: quota.limit,
        requestId: ''
      });
    } else if (usage.isWarning) {
      this.emit('quotaWarning', { quota, usage });
      structuredLogger.warn('Quota warning threshold reached', {
        organizationId,
        quotaType,
        percentage: usage.percentage,
        requestId: ''
      });
    }

    return usage;
  }

  public async createIdempotencyKey(
    key: string,
    organizationId: string,
    requestHash: string,
    ttlMinutes: number = 5
  ): Promise<IdempotencyKey> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlMinutes * 60 * 1000);

    const idempotencyKey: IdempotencyKey = {
      key,
      organizationId,
      requestHash,
      responseHash: '',
      status: 'pending',
      createdAt: now,
      expiresAt,
      ttl: ttlMinutes
    };

    this.idempotencyKeys.set(key, idempotencyKey);

    structuredLogger.info('Idempotency key created', {
      key,
      organizationId,
      ttl: ttlMinutes,
      requestId: ''
    });

    return idempotencyKey;
  }

  public async getIdempotencyKey(key: string): Promise<IdempotencyKey | null> {
    const idempotencyKey = this.idempotencyKeys.get(key);
    
    if (!idempotencyKey) {
      return null;
    }

    // Check if expired
    if (new Date() > idempotencyKey.expiresAt) {
      this.idempotencyKeys.delete(key);
      return null;
    }

    return idempotencyKey;
  }

  public async completeIdempotencyKey(key: string, responseHash: string): Promise<void> {
    const idempotencyKey = this.idempotencyKeys.get(key);
    
    if (!idempotencyKey) {
      throw new Error(`Idempotency key not found: ${key}`);
    }

    idempotencyKey.responseHash = responseHash;
    idempotencyKey.status = 'completed';

    structuredLogger.info('Idempotency key completed', {
      key,
      organizationId: idempotencyKey.organizationId,
      requestId: ''
    });
  }

  public async failIdempotencyKey(key: string): Promise<void> {
    const idempotencyKey = this.idempotencyKeys.get(key);
    
    if (!idempotencyKey) {
      throw new Error(`Idempotency key not found: ${key}`);
    }

    idempotencyKey.status = 'failed';

    structuredLogger.info('Idempotency key failed', {
      key,
      organizationId: idempotencyKey.organizationId,
      requestId: ''
    });
  }

  public async getQuotaStats(organizationId?: string): Promise<{
    totalQuotas: number;
    totalUsage: number;
    exceededQuotas: number;
    warningQuotas: number;
    quotas: QuotaUsage[];
  }> {
    let quotas = Array.from(this.quotas.values());
    
    if (organizationId) {
      quotas = quotas.filter(q => q.organizationId === organizationId);
    }

    const quotaUsages: QuotaUsage[] = [];
    let totalUsage = 0;
    let exceededQuotas = 0;
    let warningQuotas = 0;

    for (const quota of quotas) {
      const usage = await this.checkQuota(quota.organizationId, quota.quotaType);
      quotaUsages.push(usage);
      totalUsage += usage.used;
      
      if (usage.isExceeded) {
        exceededQuotas++;
      } else if (usage.isWarning) {
        warningQuotas++;
      }
    }

    return {
      totalQuotas: quotas.length,
      totalUsage,
      exceededQuotas,
      warningQuotas,
      quotas: quotaUsages
    };
  }

  public async getOrganizationQuotas(organizationId: string): Promise<QuotaUsage[]> {
    const quotas = Array.from(this.quotas.values()).filter(
      q => q.organizationId === organizationId
    );

    const quotaUsages: QuotaUsage[] = [];
    
    for (const quota of quotas) {
      const usage = await this.checkQuota(quota.organizationId, quota.quotaType);
      quotaUsages.push(usage);
    }

    return quotaUsages;
  }
}

export const makeQuotasService = new MakeQuotasService();
