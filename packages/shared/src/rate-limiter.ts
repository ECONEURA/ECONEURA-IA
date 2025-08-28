/**
 * Rate limiter client-side para el SDK
 */

export interface RateLimitConfig {
  maxRequestsPerSecond?: number;
  maxBurst?: number;
  enabled?: boolean;
}

export interface RateLimiterResponse {
  allowed: boolean;
  retryAfter?: number;
  remaining: number;
}

export class TokenBucketRateLimiter {
  private tokens: number;
  private lastRefill: number;
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig = {}) {
    this.config = {
      maxRequestsPerSecond: config.maxRequestsPerSecond || 10,
      maxBurst: config.maxBurst || 20,
      enabled: config.enabled ?? true
    };

    this.tokens = this.config.maxBurst;
    this.lastRefill = Date.now();
  }

  private refillTokens(): void {
    const now = Date.now();
    const timePassed = (now - this.lastRefill) / 1000; // en segundos
    const newTokens = timePassed * this.config.maxRequestsPerSecond;
    
    this.tokens = Math.min(
      this.config.maxBurst,
      this.tokens + newTokens
    );
    
    this.lastRefill = now;
  }

  async acquire(): Promise<RateLimiterResponse> {
    if (!this.config.enabled) {
      return { allowed: true, remaining: Infinity };
    }

    this.refillTokens();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(this.tokens)
      };
    }

    // Calcular tiempo de espera
    const tokensNeeded = 1 - this.tokens;
    const secondsToWait = tokensNeeded / this.config.maxRequestsPerSecond;

    return {
      allowed: false,
      retryAfter: Math.ceil(secondsToWait),
      remaining: 0
    };
  }

  async wait(): Promise<void> {
    const result = await this.acquire();
    if (!result.allowed && result.retryAfter) {
      await new Promise(resolve => setTimeout(resolve, result.retryAfter * 1000));
    }
  }
}

// Rate limiter para endpoints específicos
export class EndpointRateLimiter {
  private limiters: Map<string, TokenBucketRateLimiter>;
  private defaultConfig: RateLimitConfig;

  constructor(defaultConfig: RateLimitConfig = {}) {
    this.limiters = new Map();
    this.defaultConfig = defaultConfig;
  }

  private getLimiter(endpoint: string): TokenBucketRateLimiter {
    let limiter = this.limiters.get(endpoint);
    if (!limiter) {
      limiter = new TokenBucketRateLimiter(this.defaultConfig);
      this.limiters.set(endpoint, limiter);
    }
    return limiter;
  }

  async acquire(endpoint: string): Promise<RateLimiterResponse> {
    return this.getLimiter(endpoint).acquire();
  }

  async wait(endpoint: string): Promise<void> {
    return this.getLimiter(endpoint).wait();
  }

  setConfig(endpoint: string, config: RateLimitConfig): void {
    this.limiters.set(endpoint, new TokenBucketRateLimiter(config));
  }

  clearConfig(endpoint: string): void {
    this.limiters.delete(endpoint);
  }
}

// Factory para crear rate limiters
export function createRateLimiter(
  type: 'simple' | 'endpoint',
  config?: RateLimitConfig
): TokenBucketRateLimiter | EndpointRateLimiter {
  return type === 'simple' 
    ? new TokenBucketRateLimiter(config)
    : new EndpointRateLimiter(config);
}
