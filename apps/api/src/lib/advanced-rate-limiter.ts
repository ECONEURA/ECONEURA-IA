import { prometheus } from '../middleware/observability.js';

import { logger } from './logger.js';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean; // Skip rate limiting for successful requests
  skipFailedRequests?: boolean; // Skip rate limiting for failed requests
  keyGenerator?: (req: any) => string; // Custom key generator
  onLimitReached?: (req: any, res: any) => void; // Callback when limit is reached
  standardHeaders?: boolean; // Send standard rate limit headers
  legacyHeaders?: boolean; // Send legacy rate limit headers
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: Date;
  retryAfter?: number;
}

export interface RateLimitRule {
  id: string;
  name: string;
  pattern: string; // URL pattern or regex
  config: RateLimitConfig;
  enabled: boolean;
  priority: number; // Higher priority rules are checked first
}

export interface RateLimitStats {
  totalRequests: number;
  allowedRequests: number;
  blockedRequests: number;
  averageResponseTime: number;
  peakRequestsPerSecond: number;
  currentRequestsPerSecond: number;
}

export class AdvancedRateLimiter {
  private rules: Map<string, RateLimitRule> = new Map();
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();
  private stats: RateLimitStats;
  private cleanupInterval: NodeJS.Timeout;
  private requestHistory: Array<{ timestamp: number; allowed: boolean }> = [];

  constructor() {
    this.stats = {
      totalRequests: 0,
      allowedRequests: 0,
      blockedRequests: 0,
      averageResponseTime: 0,
      peakRequestsPerSecond: 0,
      currentRequestsPerSecond: 0
    };

    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute

    logger.info('Advanced Rate Limiter initialized', {
      features: [
        'multiple_rules',
        'pattern_matching',
        'priority_system',
        'statistics',
        'prometheus_metrics',
        'cleanup_automation'
      ]
    });
  }

  /**
   * Register a rate limit rule
   */
  registerRule(rule: RateLimitRule): void {
    this.rules.set(rule.id, rule);
    
    logger.info('Rate limit rule registered', {
      id: rule.id,
      name: rule.name,
      pattern: rule.pattern,
      maxRequests: rule.config.maxRequests,
      windowMs: rule.config.windowMs,
      enabled: rule.enabled,
      priority: rule.priority
    });
  }

  /**
   * Unregister a rate limit rule
   */
  unregisterRule(ruleId: string): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.delete(ruleId);
      logger.info('Rate limit rule unregistered', { id: ruleId });
    }
  }

  /**
   * Check if request should be rate limited
   */
  async checkLimit(req: any, res: any): Promise<{ allowed: boolean; info?: RateLimitInfo }> {
    const startTime = Date.now();
    
    try {
      // Find matching rule
      const rule = this.findMatchingRule(req);
      if (!rule || !rule.enabled) {
        return { allowed: true };
      }

      // Generate key for this request
      const key = this.generateKey(req, rule);
      
      // Check current count
      const current = this.requestCounts.get(key);
      const now = Date.now();
      const windowStart = now - rule.config.windowMs;

      let count = 0;
      let resetTime = now + rule.config.windowMs;

      if (current && current.resetTime > now) {
        count = current.count;
        resetTime = current.resetTime;
      }

      // Check if limit is exceeded
      if (count >= rule.config.maxRequests) {
        this.stats.blockedRequests++;
        this.recordRequest(false, startTime);
        this.recordMetrics(rule.id, false, Date.now() - startTime);

        // Set rate limit headers
        this.setRateLimitHeaders(res, {
          limit: rule.config.maxRequests,
          remaining: 0,
          reset: new Date(resetTime),
          retryAfter: Math.ceil((resetTime - now) / 1000)
        });

        // Call onLimitReached callback
        if (rule.config.onLimitReached) {
          rule.config.onLimitReached(req, res);
        }

        logger.warn('Rate limit exceeded', {
          ruleId: rule.id,
          key,
          count,
          limit: rule.config.maxRequests,
          resetTime: new Date(resetTime).toISOString()
        });

        return { 
          allowed: false, 
          info: {
            limit: rule.config.maxRequests,
            remaining: 0,
            reset: new Date(resetTime),
            retryAfter: Math.ceil((resetTime - now) / 1000)
          }
        };
      }

      // Increment count
      this.requestCounts.set(key, {
        count: count + 1,
        resetTime
      });

      this.stats.allowedRequests++;
      this.recordRequest(true, startTime);
      this.recordMetrics(rule.id, true, Date.now() - startTime);

      // Set rate limit headers
      this.setRateLimitHeaders(res, {
        limit: rule.config.maxRequests,
        remaining: rule.config.maxRequests - count - 1,
        reset: new Date(resetTime)
      });

      logger.debug('Rate limit check passed', {
        ruleId: rule.id,
        key,
        count: count + 1,
        limit: rule.config.maxRequests,
        remaining: rule.config.maxRequests - count - 1
      });

      return { 
        allowed: true, 
        info: {
          limit: rule.config.maxRequests,
          remaining: rule.config.maxRequests - count - 1,
          reset: new Date(resetTime)
        }
      };
    } catch (error) {
      logger.error('Rate limit check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Fail open - allow request if rate limiting fails
      return { allowed: true };
    }
  }

  /**
   * Find matching rule for request
   */
  private findMatchingRule(req: any): RateLimitRule | null {
    const rules = Array.from(this.rules.values())
      .filter(rule => rule.enabled)
      .sort((a, b) => b.priority - a.priority); // Sort by priority (highest first)

    for (const rule of rules) {
      if (this.matchesPattern(req, rule.pattern)) {
        return rule;
      }
    }

    return null;
  }

  /**
   * Check if request matches pattern
   */
  private matchesPattern(req: any, pattern: string): boolean {
    try {
      // Simple string matching for now
      // In production, this could be more sophisticated with regex support
      return req.path.includes(pattern) || req.url.includes(pattern);
    } catch (error) {
      logger.error('Pattern matching failed', {
        pattern,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  /**
   * Generate key for request
   */
  private generateKey(req: any, rule: RateLimitRule): string {
    if (rule.config.keyGenerator) {
      return rule.config.keyGenerator(req);
    }

    // Default key generation
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    const path = req.path || req.url || 'unknown';
    
    return `${rule.id}:${ip}:${path}:${userAgent}`;
  }

  /**
   * Set rate limit headers
   */
  private setRateLimitHeaders(res: any, info: RateLimitInfo): void {
    if (res.setHeader) {
      // Standard headers
      res.setHeader('X-RateLimit-Limit', info.limit);
      res.setHeader('X-RateLimit-Remaining', info.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(info.reset.getTime() / 1000));
      
      if (info.retryAfter) {
        res.setHeader('Retry-After', info.retryAfter);
      }

      // Legacy headers
      res.setHeader('X-RateLimit-Limit', info.limit);
      res.setHeader('X-RateLimit-Remaining', info.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(info.reset.getTime() / 1000));
    }
  }

  /**
   * Record request for statistics
   */
  private recordRequest(allowed: boolean, startTime: number): void {
    this.stats.totalRequests++;
    
    const now = Date.now();
    this.requestHistory.push({ timestamp: now, allowed });
    
    // Keep only last 60 seconds of history
    const cutoff = now - 60000;
    this.requestHistory = this.requestHistory.filter(r => r.timestamp > cutoff);
    
    // Update current requests per second
    this.stats.currentRequestsPerSecond = this.requestHistory.length;
    
    // Update peak requests per second
    if (this.stats.currentRequestsPerSecond > this.stats.peakRequestsPerSecond) {
      this.stats.peakRequestsPerSecond = this.stats.currentRequestsPerSecond;
    }
  }

  /**
   * Record metrics
   */
  private recordMetrics(ruleId: string, allowed: boolean, duration: number): void {
    if (allowed) {
      prometheus.rateLimitAllowed.inc({ ruleId });
    } else {
      prometheus.rateLimitBlocked.inc({ ruleId });
    }
    
    prometheus.rateLimitDuration.observe({ ruleId }, duration / 1000);
    prometheus.rateLimitTotal.inc({ ruleId });
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [key, entry] of this.requestCounts.entries()) {
      if (entry.resetTime <= now) {
        this.requestCounts.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Rate limiter cleanup completed', { entriesCleaned: cleanedCount });
    }
  }

  /**
   * Get rate limit statistics
   */
  getStats(): RateLimitStats {
    return { ...this.stats };
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): RateLimitRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all rules
   */
  getAllRules(): RateLimitRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Enable/disable a rule
   */
  toggleRule(ruleId: string, enabled: boolean): void {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = enabled;
      logger.info('Rate limit rule toggled', { ruleId, enabled });
    }
  }

  /**
   * Reset rate limit for a specific key
   */
  resetLimit(key: string): void {
    this.requestCounts.delete(key);
    logger.info('Rate limit reset', { key });
  }

  /**
   * Reset all rate limits
   */
  resetAllLimits(): void {
    this.requestCounts.clear();
    logger.info('All rate limits reset');
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.rules.clear();
    this.requestCounts.clear();
    this.requestHistory = [];

    logger.info('Advanced Rate Limiter destroyed');
  }
}

// Export Prometheus metrics
export const rateLimitMetrics = {
  rateLimitTotal: new prometheus.Counter({
    name: 'econeura_rate_limit_total',
    help: 'Total number of rate limit checks',
    labelNames: ['ruleId']
  }),
  rateLimitAllowed: new prometheus.Counter({
    name: 'econeura_rate_limit_allowed_total',
    help: 'Total number of allowed requests',
    labelNames: ['ruleId']
  }),
  rateLimitBlocked: new prometheus.Counter({
    name: 'econeura_rate_limit_blocked_total',
    help: 'Total number of blocked requests',
    labelNames: ['ruleId']
  }),
  rateLimitDuration: new prometheus.Histogram({
    name: 'econeura_rate_limit_duration_seconds',
    help: 'Rate limit check duration in seconds',
    labelNames: ['ruleId'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  })
};

// Export singleton instance
export const advancedRateLimiter = new AdvancedRateLimiter();
