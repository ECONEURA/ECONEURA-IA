import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { logger } from '@econeura/shared/logging';
import { rateLimitExceeded } from '@econeura/shared/metrics';

interface TokenBucket {
  tokens: number;
  lastRefill: number;
  rpsLimit: number;
  burstLimit: number;
}

interface RateLimitOptions {
  defaultRps?: number;
  defaultBurst?: number;
  windowMs?: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
}

export class OrgRateLimiter {
  private buckets = new Map<string, TokenBucket>();
  private limits = new Map<string, { rps_limit: number; burst: number }>();
  private lastLimitsRefresh = 0;
  private readonly LIMITS_CACHE_MS = 30000; // 30 seconds

  constructor(private options: RateLimitOptions = {}) {
    // Periodically clean up old buckets
    setInterval(() => this.cleanupBuckets(), 60000); // Every minute
  }

  async rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const orgId = req.header('x-org-id');
    
    if (!orgId) {
      // No org ID - apply default limits
      return this.applyRateLimit(
        req, 
        res, 
        next, 
        'default', 
        this.options.defaultRps || 10,
        this.options.defaultBurst || 20
      );
    }

    try {
      // Get org limits (with caching)
      const limits = await this.getOrgLimits(orgId);
      
      return this.applyRateLimit(
        req,
        res,
        next,
        orgId,
        limits.rps_limit,
        limits.burst
      );

    } catch (error) {
      logger.error('Rate limiting error', error as Error, {
        corr_id: res.locals.corr_id,
        org_id: orgId,
      });

      // On error, apply default limits
      return this.applyRateLimit(
        req,
        res,
        next,
        orgId,
        this.options.defaultRps || 10,
        this.options.defaultBurst || 20
      );
    }
  }

  private async applyRateLimit(
    req: Request,
    res: Response,
    next: NextFunction,
    orgId: string,
    rpsLimit: number,
    burstLimit: number
  ): Promise<void> {
    const now = Date.now();
    const bucket = this.getOrCreateBucket(orgId, rpsLimit, burstLimit);

    // Refill tokens based on time elapsed
    this.refillBucket(bucket, now);

    // Check if we have tokens available
    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      
      // Add rate limiting headers
      res.setHeader('X-RateLimit-Limit', rpsLimit.toString());
      res.setHeader('X-RateLimit-Remaining', Math.floor(bucket.tokens).toString());
      res.setHeader('X-RateLimit-Reset', new Date(now + 1000).toISOString());

      next();
    } else {
      // Rate limit exceeded
      rateLimitExceeded.labels(orgId, 'rps').inc();
      
      logger.logSecurityEvent('Rate limit exceeded', {
        event_type: 'rate_limit',
        org_id: orgId,
        ip_address: req.ip,
        x_request_id: res.locals.corr_id,
        details: {
          rps_limit: rpsLimit,
          burst_limit: burstLimit,
          remaining_tokens: bucket.tokens,
        },
      });

      res.setHeader('X-RateLimit-Limit', rpsLimit.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', new Date(now + 1000).toISOString());
      res.setHeader('Retry-After', '1');

      res.status(429).json({
        error: 'rate_limit_exceeded',
        type: 'https://econeura.dev/errors/rate_limit_exceeded',
        title: 'Rate Limit Exceeded',
        status: 429,
        detail: `Rate limit of ${rpsLimit} requests per second exceeded`,
        instance: `corr:${res.locals.corr_id || 'n/a'}`,
        org_id: orgId,
        retry_after_seconds: 1,
      });
    }
  }

  private getOrCreateBucket(orgId: string, rpsLimit: number, burstLimit: number): TokenBucket {
    let bucket = this.buckets.get(orgId);
    
    if (!bucket || bucket.rpsLimit !== rpsLimit || bucket.burstLimit !== burstLimit) {
      bucket = {
        tokens: burstLimit, // Start with full bucket
        lastRefill: Date.now(),
        rpsLimit,
        burstLimit,
      };
      this.buckets.set(orgId, bucket);
    }
    
    return bucket;
  }

  private refillBucket(bucket: TokenBucket, now: number): void {
    const timePassed = (now - bucket.lastRefill) / 1000; // Convert to seconds
    const tokensToAdd = timePassed * bucket.rpsLimit;
    
    bucket.tokens = Math.min(bucket.burstLimit, bucket.tokens + tokensToAdd);
    bucket.lastRefill = now;
  }

  private async getOrgLimits(orgId: string): Promise<{ rps_limit: number; burst: number }> {
    const now = Date.now();
    
    // Check cache first
    if (now - this.lastLimitsRefresh < this.LIMITS_CACHE_MS && this.limits.has(orgId)) {
      return this.limits.get(orgId)!;
    }

    // Refresh limits from database
    if (now - this.lastLimitsRefresh >= this.LIMITS_CACHE_MS) {
      await this.refreshLimitsCache();
    }

    // Return cached or default
    return this.limits.get(orgId) || {
      rps_limit: this.options.defaultRps || 100,
      burst: this.options.defaultBurst || 200,
    };
  }

  private async refreshLimitsCache(): Promise<void> {
    try {
      const result = await db.query<{ org_id: string; rps_limit: number; burst: number }>(
        'SELECT org_id, rps_limit, burst FROM org_limits'
      );

      this.limits.clear();
      for (const row of result.rows) {
        this.limits.set(row.org_id, {
          rps_limit: row.rps_limit,
          burst: row.burst,
        });
      }

      this.lastLimitsRefresh = Date.now();
      
      logger.debug('Refreshed rate limit cache', {
        orgs_cached: result.rows.length,
      });

    } catch (error) {
      logger.error('Failed to refresh rate limits cache', error as Error);
    }
  }

  private cleanupBuckets(): void {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes

    let cleaned = 0;
    for (const [orgId, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge) {
        this.buckets.delete(orgId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      logger.debug(`Cleaned up ${cleaned} inactive rate limit buckets`);
    }
  }

  // Method to check current rate limit status (for monitoring)
  public getRateLimitStatus(orgId: string): {
    tokens_remaining: number;
    rps_limit: number;
    burst_limit: number;
    last_refill: Date;
  } | null {
    const bucket = this.buckets.get(orgId);
    if (!bucket) return null;

    // Ensure bucket is up to date
    this.refillBucket(bucket, Date.now());

    return {
      tokens_remaining: Math.floor(bucket.tokens),
      rps_limit: bucket.rpsLimit,
      burst_limit: bucket.burstLimit,
      last_refill: new Date(bucket.lastRefill),
    };
  }

  // Method to manually adjust limits (for admin endpoints)
  public async updateOrgLimits(orgId: string, rpsLimit: number, burst: number): Promise<void> {
    // Update database
    await db.query(
      'UPDATE org_limits SET rps_limit = $1, burst = $2 WHERE org_id = $3',
      [rpsLimit, burst, orgId]
    );

    // Update cache
    this.limits.set(orgId, { rps_limit: rpsLimit, burst });

    // Reset bucket to apply new limits immediately
    this.buckets.delete(orgId);

    logger.info('Updated org rate limits', {
      org_id: orgId,
      rps_limit: rpsLimit,
      burst,
    });
  }
}

// Create singleton instance
export const orgRateLimiter = new OrgRateLimiter({
  defaultRps: 100,
  defaultBurst: 200,
});

// Export middleware function
export function rateLimitOrg(options?: RateLimitOptions) {
  const limiter = options ? new OrgRateLimiter(options) : orgRateLimiter;
  return (req: Request, res: Response, next: NextFunction) => {
    return limiter.rateLimitMiddleware(req, res, next);
  };
}