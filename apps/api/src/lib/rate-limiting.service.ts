import { prometheus } from '@econeura/shared/src/metrics/index.js';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: any) => string;
}

export class RateLimitingService {
  private limits: Map<string, { count: number; resetTime: number }> = new Map();

  checkLimit(key: string, config: RateLimitConfig): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const limit = this.limits.get(key);

    if (!limit || now > limit.resetTime) {
      // Reset or create new limit
      this.limits.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      });
      
      return {
        allowed: true,
        remaining: config.maxRequests - 1,
        resetTime: now + config.windowMs
      };
    }

    if (limit.count >= config.maxRequests) {
      // Rate limit exceeded
      prometheus.register.getSingleMetric('rate_limit_exceeded_total')?.inc({
        key: key.substring(0, 50) // Truncate for metrics
      });
      
      return {
        allowed: false,
        remaining: 0,
        resetTime: limit.resetTime
      };
    }

    // Increment count
    limit.count++;
    this.limits.set(key, limit);

    return {
      allowed: true,
      remaining: config.maxRequests - limit.count,
      resetTime: limit.resetTime
    };
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, limit] of this.limits) {
      if (now > limit.resetTime) {
        this.limits.delete(key);
      }
    }
  }
}

export const rateLimitingService = new RateLimitingService();
