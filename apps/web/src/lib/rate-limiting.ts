export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  strategy: 'token-bucket' | 'sliding-window' | 'fixed-window';
  burstSize?: number;
  refillRate?: number;
}

export interface OrganizationRateLimit {
  organizationId: string;
  config: RateLimitConfig;
  createdAt: Date;
  updatedAt: Date;
}

export interface RateLimitState {
  tokens: number;
  lastRefill: number;
  requestCount: number;
  windowStart: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export class WebRateLimiter {
  private organizations: Map<string, OrganizationRateLimit> = new Map();
  private states: Map<string, RateLimitState> = new Map();
  private defaultConfig: RateLimitConfig = {
    windowMs: 60000, // 1 minute
    maxRequests: 100,
    strategy: 'sliding-window',
    burstSize: 10,
    refillRate: 1
  };

  constructor() {
    this.initializeDefaultOrganizations();
  }

  private initializeDefaultOrganizations(): void {
    // Organizaciones demo con diferentes configuraciones
    this.addOrganization('web-demo-org-1', {
      windowMs: 60000,
      maxRequests: 100,
      strategy: 'sliding-window',
      burstSize: 10,
      refillRate: 1
    });

    this.addOrganization('web-demo-org-2', {
      windowMs: 300000, // 5 minutes
      maxRequests: 500,
      strategy: 'token-bucket',
      burstSize: 50,
      refillRate: 2
    });

    this.addOrganization('web-premium-org', {
      windowMs: 60000,
      maxRequests: 1000,
      strategy: 'token-bucket',
      burstSize: 100,
      refillRate: 10
    });
  }

  addOrganization(organizationId: string, config: Partial<RateLimitConfig>): void {
    const fullConfig: RateLimitConfig = {
      ...this.defaultConfig,
      ...config
    };

    const organization: OrganizationRateLimit = {
      organizationId,
      config: fullConfig,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.organizations.set(organizationId, organization);
    
    // Initialize state
    this.states.set(organizationId, {
      tokens: fullConfig.burstSize || fullConfig.maxRequests,
      lastRefill: Date.now(),
      requestCount: 0,
      windowStart: Date.now()
    });

    console.log('Web organization rate limit added', {
      organizationId,
      config: fullConfig
    });
  }

  removeOrganization(organizationId: string): boolean {
    const removed = this.organizations.delete(organizationId);
    this.states.delete(organizationId);
    
    if (removed) {
      console.log('Web organization rate limit removed', { organizationId });
    }
    
    return removed;
  }

  updateOrganization(organizationId: string, config: Partial<RateLimitConfig>): boolean {
    const existing = this.organizations.get(organizationId);
    if (!existing) {
      return false;
    }

    const updatedConfig: RateLimitConfig = {
      ...existing.config,
      ...config
    };

    existing.config = updatedConfig;
    existing.updatedAt = new Date();

    // Reset state with new config
    this.states.set(organizationId, {
      tokens: updatedConfig.burstSize || updatedConfig.maxRequests,
      lastRefill: Date.now(),
      requestCount: 0,
      windowStart: Date.now()
    });

    console.log('Web organization rate limit updated', {
      organizationId,
      config: updatedConfig
    });

    return true;
  }

  isAllowed(organizationId: string, requestId: string): RateLimitResult {
    const organization = this.organizations.get(organizationId);
    if (!organization) {
      // Default to most restrictive config for unknown organizations
      return this.isAllowedWithConfig(organizationId, this.defaultConfig, requestId);
    }

    return this.isAllowedWithConfig(organizationId, organization.config, requestId);
  }

  private isAllowedWithConfig(organizationId: string, config: RateLimitConfig, requestId: string): RateLimitResult {
    const state = this.states.get(organizationId);
    if (!state) {
      return { allowed: false, remaining: 0, resetTime: Date.now() + config.windowMs };
    }

    const now = Date.now();
    let allowed = false;
    let remaining = 0;
    let resetTime = now + config.windowMs;
    let retryAfter: number | undefined;

    switch (config.strategy) {
      case 'token-bucket':
        ({ allowed, remaining, resetTime, retryAfter } = this.tokenBucketStrategy(state, config, now));
        break;
      case 'sliding-window':
        ({ allowed, remaining, resetTime } = this.slidingWindowStrategy(state, config, now));
        break;
      case 'fixed-window':
        ({ allowed, remaining, resetTime } = this.fixedWindowStrategy(state, config, now));
        break;
    }

    // Update state
    if (allowed) {
      state.requestCount++;
      if (config.strategy === 'token-bucket') {
        state.tokens = remaining;
        state.lastRefill = now;
      }
    }

    // Log rate limit events
    if (!allowed) {
      console.warn('Web rate limit exceeded', {
        organizationId,
        strategy: config.strategy,
        remaining,
        retryAfter,
        requestId
      });
    }

    return { allowed, remaining, resetTime, retryAfter };
  }

  private tokenBucketStrategy(state: RateLimitState, config: RateLimitConfig, now: number): RateLimitResult {
    const timePassed = now - state.lastRefill;
    const tokensToAdd = Math.floor(timePassed / 1000) * (config.refillRate || 1);
    
    state.tokens = Math.min(
      config.burstSize || config.maxRequests,
      state.tokens + tokensToAdd
    );
    
    const allowed = state.tokens > 0;
    const remaining = allowed ? state.tokens - 1 : 0;
    const resetTime = now + (1000 / (config.refillRate || 1));
    const retryAfter = allowed ? undefined : Math.ceil(1000 / (config.refillRate || 1));

    return { allowed, remaining, resetTime, retryAfter };
  }

  private slidingWindowStrategy(state: RateLimitState, config: RateLimitConfig, now: number): RateLimitResult {
    const windowStart = now - config.windowMs;
    
    if (state.windowStart < windowStart) {
      // Reset window
      state.requestCount = 0;
      state.windowStart = now;
    }

    const allowed = state.requestCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - state.requestCount);
    const resetTime = state.windowStart + config.windowMs;

    return { allowed, remaining, resetTime };
  }

  private fixedWindowStrategy(state: RateLimitState, config: RateLimitConfig, now: number): RateLimitResult {
    const currentWindow = Math.floor(now / config.windowMs);
    const stateWindow = Math.floor(state.windowStart / config.windowMs);

    if (currentWindow > stateWindow) {
      // New window, reset
      state.requestCount = 0;
      state.windowStart = now;
    }

    const allowed = state.requestCount < config.maxRequests;
    const remaining = Math.max(0, config.maxRequests - state.requestCount);
    const resetTime = (currentWindow + 1) * config.windowMs;

    return { allowed, remaining, resetTime };
  }

  getOrganizationStats(organizationId: string): { config: RateLimitConfig; state: RateLimitState; stats: any } | null {
    const organization = this.organizations.get(organizationId);
    const state = this.states.get(organizationId);

    if (!organization || !state) {
      return null;
    }

    const stats = {
      totalRequests: state.requestCount,
      currentTokens: state.tokens,
      lastRefill: new Date(state.lastRefill).toISOString(),
      windowStart: new Date(state.windowStart).toISOString(),
      utilization: (state.requestCount / organization.config.maxRequests) * 100
    };

    return { config: organization.config, state, stats };
  }

  getAllOrganizations(): OrganizationRateLimit[] {
    return Array.from(this.organizations.values());
  }

  resetOrganization(organizationId: string): boolean {
    const organization = this.organizations.get(organizationId);
    if (!organization) {
      return false;
    }

    this.states.set(organizationId, {
      tokens: organization.config.burstSize || organization.config.maxRequests,
      lastRefill: Date.now(),
      requestCount: 0,
      windowStart: Date.now()
    });

    console.log('Web organization rate limit reset', { organizationId });
    return true;
  }

  getGlobalStats(): any {
    const organizations = Array.from(this.organizations.values());
    const states = Array.from(this.states.values());

    return {
      totalOrganizations: organizations.length,
      totalRequests: states.reduce((sum, state) => sum + state.requestCount, 0),
      averageUtilization: states.reduce((sum, state) => {
        const org = organizations.find(o => this.states.get(o.organizationId) === state);
        return sum + (state.requestCount / (org?.config.maxRequests || 1)) * 100;
      }, 0) / states.length,
      strategies: {
        'token-bucket': organizations.filter(o => o.config.strategy === 'token-bucket').length,
        'sliding-window': organizations.filter(o => o.config.strategy === 'sliding-window').length,
        'fixed-window': organizations.filter(o => o.config.strategy === 'fixed-window').length
      }
    };
  }
}

export const webRateLimiter = new WebRateLimiter();
