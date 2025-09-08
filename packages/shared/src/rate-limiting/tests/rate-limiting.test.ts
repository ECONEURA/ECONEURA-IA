// ============================================================================
// RATE LIMITING TESTS - SLIDING WINDOW ALGORITHM
// ============================================================================

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  RateLimiter, 
  MemoryRateLimitStore,
  RateLimitConfigSchema,
  RateLimitRuleSchema,
  RateLimitResultSchema,
  createRateLimitMiddleware,
  createPresetRateLimiter,
  RateLimitPresets
} from '../index.js';

// ============================================================================
// MOCK SETUP
// ============================================================================

// Mock Date.now to control time
const mockDateNow = vi.fn();
vi.stubGlobal('Date', {
  ...Date,
  now: mockDateNow
});

// Mock setTimeout and clearTimeout
const mockSetTimeout = vi.fn();
const mockClearTimeout = vi.fn();
vi.stubGlobal('setTimeout', mockSetTimeout);
vi.stubGlobal('clearTimeout', mockClearTimeout);

// ============================================================================
// TEST HELPERS
// ============================================================================

function createMockRequest(overrides: any = {}): any {
  return {
    ip: '192.168.1.1',
    headers: {},
    method: 'GET',
    path: '/test',
    user: { id: 'user-123' },
    ...overrides
  };
}

function createMockResponse(): any {
  const res: any = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis()
  };
  return res;
}

function createMockNext(): any {
  return vi.fn();
}

// ============================================================================
// RATE LIMITER TESTS
// ============================================================================

describe('RateLimiter', () => {
  let limiter: RateLimiter;
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
    limiter = new RateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 10,
      enabled: true
    }, store);
    
    // Reset mocks
    vi.clearAllMocks();
    mockDateNow.mockReturnValue(1000000); // Fixed time for testing
  });

  afterEach(() => {
    limiter.clearAllLimits();
  });

  describe('Configuration', () => {
    it('should create with default config', () => {
      const defaultLimiter = new RateLimiter();
      expect(defaultLimiter).toBeInstanceOf(RateLimiter);
    });

    it('should validate config schema', () => {
      const validConfig = {
        windowMs: 60000,
        maxRequests: 100,
        message: 'Rate limit exceeded'
      };

      const result = RateLimitConfigSchema.safeParse(validConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid config', () => {
      const invalidConfig = {
        windowMs: 500, // Too small
        maxRequests: 0, // Too small
        message: 'Rate limit exceeded'
      };

      const result = RateLimitConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const request = { ip: '192.168.1.1' };

      for (let i = 0; i < 5; i++) {
        const result = await limiter.checkLimit(request);
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(10 - i - 1);
      }
    });

    it('should block requests when limit exceeded', async () => {
      const request = { ip: '192.168.1.1' };

      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        const result = await limiter.checkLimit(request);
        expect(result.allowed).toBe(true);
      }

      // 11th request should be blocked
      const result = await limiter.checkLimit(request);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should reset window after time passes', async () => {
      const request = { ip: '192.168.1.1' };

      // Fill up the window
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit(request);
      }

      // Should be blocked
      let result = await limiter.checkLimit(request);
      expect(result.allowed).toBe(false);

      // Move time forward by window duration
      mockDateNow.mockReturnValue(1000000 + 60000);

      // Should be allowed again
      result = await limiter.checkLimit(request);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });
  });

  describe('Different Key Types', () => {
    it('should rate limit by IP address', async () => {
      const request1 = { ip: '192.168.1.1' };
      const request2 = { ip: '192.168.1.2' };

      // Fill up limit for IP 1
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit(request1);
      }

      // IP 1 should be blocked
      let result = await limiter.checkLimit(request1);
      expect(result.allowed).toBe(false);

      // IP 2 should still be allowed
      result = await limiter.checkLimit(request2);
      expect(result.allowed).toBe(true);
    });

    it('should rate limit by API key', async () => {
      const request1 = { apiKey: 'key-123' };
      const request2 = { apiKey: 'key-456' };

      // Add rule for API key rate limiting
      limiter.addRule({
        id: 'api-key',
        name: 'API Key Rate Limit',
        windowMs: 60000,
        maxRequests: 5,
        keyType: 'api_key'
      });

      // Fill up limit for key 1
      for (let i = 0; i < 5; i++) {
        await limiter.checkLimit(request1, 'api-key');
      }

      // Key 1 should be blocked
      let result = await limiter.checkLimit(request1, 'api-key');
      expect(result.allowed).toBe(false);

      // Key 2 should still be allowed
      result = await limiter.checkLimit(request2, 'api-key');
      expect(result.allowed).toBe(true);
    });

    it('should rate limit by user ID', async () => {
      const request1 = { userId: 'user-123' };
      const request2 = { userId: 'user-456' };

      // Add rule for user rate limiting
      limiter.addRule({
        id: 'user',
        name: 'User Rate Limit',
        windowMs: 60000,
        maxRequests: 3,
        keyType: 'user'
      });

      // Fill up limit for user 1
      for (let i = 0; i < 3; i++) {
        await limiter.checkLimit(request1, 'user');
      }

      // User 1 should be blocked
      let result = await limiter.checkLimit(request1, 'user');
      expect(result.allowed).toBe(false);

      // User 2 should still be allowed
      result = await limiter.checkLimit(request2, 'user');
      expect(result.allowed).toBe(true);
    });
  });

  describe('Rule Management', () => {
    it('should add and retrieve rules', () => {
      const rule = {
        id: 'test-rule',
        name: 'Test Rule',
        windowMs: 30000,
        maxRequests: 5,
        keyType: 'ip' as const
      };

      limiter.addRule(rule);
      const retrieved = limiter.getRule('test-rule');
      
      expect(retrieved).toEqual(rule);
    });

    it('should remove rules', () => {
      const rule = {
        id: 'test-rule',
        name: 'Test Rule',
        windowMs: 30000,
        maxRequests: 5,
        keyType: 'ip' as const
      };

      limiter.addRule(rule);
      expect(limiter.getRule('test-rule')).toBeDefined();

      const removed = limiter.removeRule('test-rule');
      expect(removed).toBe(true);
      expect(limiter.getRule('test-rule')).toBeUndefined();
    });

    it('should get all rules', () => {
      const rule1 = {
        id: 'rule-1',
        name: 'Rule 1',
        windowMs: 30000,
        maxRequests: 5,
        keyType: 'ip' as const
      };

      const rule2 = {
        id: 'rule-2',
        name: 'Rule 2',
        windowMs: 60000,
        maxRequests: 10,
        keyType: 'user' as const
      };

      limiter.addRule(rule1);
      limiter.addRule(rule2);

      const allRules = limiter.getAllRules();
      expect(allRules).toHaveLength(2);
      expect(allRules).toContainEqual(rule1);
      expect(allRules).toContainEqual(rule2);
    });
  });

  describe('Admin Functions', () => {
    it('should reset specific limit', async () => {
      const request = { ip: '192.168.1.1' };

      // Fill up the limit
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit(request);
      }

      // Should be blocked
      let result = await limiter.checkLimit(request);
      expect(result.allowed).toBe(false);

      // Reset the limit
      await limiter.resetLimit('ip:192.168.1.1');

      // Should be allowed again
      result = await limiter.checkLimit(request);
      expect(result.allowed).toBe(true);
    });

    it('should get limit information', async () => {
      const request = { ip: '192.168.1.1' };

      // Make some requests
      for (let i = 0; i < 3; i++) {
        await limiter.checkLimit(request);
      }

      const limitInfo = await limiter.getLimitInfo('ip:192.168.1.1');
      expect(limitInfo).toBeDefined();
      expect(limitInfo?.count).toBe(3);
    });

    it('should clear all limits', async () => {
      const request = { ip: '192.168.1.1' };

      // Fill up the limit
      for (let i = 0; i < 10; i++) {
        await limiter.checkLimit(request);
      }

      // Should be blocked
      let result = await limiter.checkLimit(request);
      expect(result.allowed).toBe(false);

      // Clear all limits
      await limiter.clearAllLimits();

      // Should be allowed again
      result = await limiter.checkLimit(request);
      expect(result.allowed).toBe(true);
    });
  });

  describe('Statistics', () => {
    it('should provide statistics', () => {
      const stats = limiter.getStats();
      expect(stats).toHaveProperty('rules');
      expect(stats).toHaveProperty('storeStats');
      expect(typeof stats.rules).toBe('number');
    });
  });
});

// ============================================================================
// MEMORY STORE TESTS
// ============================================================================

describe('MemoryRateLimitStore', () => {
  let store: MemoryRateLimitStore;

  beforeEach(() => {
    store = new MemoryRateLimitStore();
    vi.clearAllMocks();
  });

  afterEach(() => {
    store.clear();
  });

  it('should store and retrieve entries', async () => {
    const key = 'test-key';
    const entry = {
      count: 5,
      windowStart: 1000000,
      windowEnd: 1060000,
      firstRequest: 1000000,
      lastRequest: 1000000
    };

    await store.set(key, entry, 60000);
    const retrieved = await store.get(key);

    expect(retrieved).toEqual(entry);
  });

  it('should delete entries', async () => {
    const key = 'test-key';
    const entry = {
      count: 5,
      windowStart: 1000000,
      windowEnd: 1060000,
      firstRequest: 1000000,
      lastRequest: 1000000
    };

    await store.set(key, entry, 60000);
    expect(await store.get(key)).toBeDefined();

    await store.delete(key);
    expect(await store.get(key)).toBeNull();
  });

  it('should clear all entries', async () => {
    const entry = {
      count: 5,
      windowStart: 1000000,
      windowEnd: 1060000,
      firstRequest: 1000000,
      lastRequest: 1000000
    };

    await store.set('key1', entry, 60000);
    await store.set('key2', entry, 60000);

    expect(await store.get('key1')).toBeDefined();
    expect(await store.get('key2')).toBeDefined();

    await store.clear();

    expect(await store.get('key1')).toBeNull();
    expect(await store.get('key2')).toBeNull();
  });

  it('should provide statistics', () => {
    const stats = store.getStats();
    expect(stats).toHaveProperty('totalKeys');
    expect(stats).toHaveProperty('memoryUsage');
    expect(typeof stats.totalKeys).toBe('number');
    expect(typeof stats.memoryUsage).toBe('number');
  });
});

// ============================================================================
// EXPRESS MIDDLEWARE TESTS
// ============================================================================

describe('Express Middleware', () => {
  let limiter: RateLimiter;
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 5
    });
    
    req = createMockRequest();
    res = createMockResponse();
    next = createMockNext();
    
    vi.clearAllMocks();
    mockDateNow.mockReturnValue(1000000);
  });

  it('should allow requests within limit', async () => {
    const middleware = createRateLimitMiddleware(limiter);

    for (let i = 0; i < 3; i++) {
      await middleware(req, res, next);
      expect(next).toHaveBeenCalledTimes(i + 1);
      expect(res.status).not.toHaveBeenCalled();
    }
  });

  it('should block requests when limit exceeded', async () => {
    const middleware = createRateLimitMiddleware(limiter);

    // Fill up the limit
    for (let i = 0; i < 5; i++) {
      await middleware(req, res, next);
    }

    // 6th request should be blocked
    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.json).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(5); // Only first 5 calls
  });

  it('should add rate limit headers', async () => {
    const middleware = createRateLimitMiddleware(limiter);

    await middleware(req, res, next);

    expect(res.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'X-RateLimit-Limit': expect.any(String),
        'X-RateLimit-Remaining': expect.any(String),
        'X-RateLimit-Reset': expect.any(String)
      })
    );
  });

  it('should handle errors gracefully', async () => {
    // Mock store to throw error
    const errorStore = {
      get: vi.fn().mockRejectedValue(new Error('Store error')),
      set: vi.fn(),
      delete: vi.fn(),
      clear: vi.fn()
    };

    const errorLimiter = new RateLimiter({}, errorStore);
    const middleware = createRateLimitMiddleware(errorLimiter);

    await middleware(req, res, next);

    // Should continue on error
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});

// ============================================================================
// PRESET CONFIGURATIONS TESTS
// ============================================================================

describe('Rate Limit Presets', () => {
  it('should create preset rate limiters', () => {
    const apiLimiter = createPresetRateLimiter('api');
    const strictLimiter = createPresetRateLimiter('strict');
    const loginLimiter = createPresetRateLimiter('login');

    expect(apiLimiter).toBeInstanceOf(RateLimiter);
    expect(strictLimiter).toBeInstanceOf(RateLimiter);
    expect(loginLimiter).toBeInstanceOf(RateLimiter);
  });

  it('should have correct preset configurations', () => {
    expect(RateLimitPresets.api.windowMs).toBe(15 * 60 * 1000);
    expect(RateLimitPresets.api.maxRequests).toBe(1000);

    expect(RateLimitPresets.strict.windowMs).toBe(15 * 60 * 1000);
    expect(RateLimitPresets.strict.maxRequests).toBe(100);

    expect(RateLimitPresets.login.windowMs).toBe(15 * 60 * 1000);
    expect(RateLimitPresets.login.maxRequests).toBe(5);
  });
});

// ============================================================================
// SCHEMA VALIDATION TESTS
// ============================================================================

describe('Schema Validation', () => {
  describe('RateLimitRuleSchema', () => {
    it('should validate valid rule', () => {
      const validRule = {
        id: 'test-rule',
        name: 'Test Rule',
        windowMs: 60000,
        maxRequests: 100,
        keyType: 'ip' as const,
        message: 'Rate limit exceeded',
        enabled: true
      };

      const result = RateLimitRuleSchema.safeParse(validRule);
      expect(result.success).toBe(true);
    });

    it('should reject invalid rule', () => {
      const invalidRule = {
        id: '', // Empty ID
        name: 'Test Rule',
        windowMs: 500, // Too small
        maxRequests: 0, // Too small
        keyType: 'invalid' // Invalid key type
      };

      const result = RateLimitRuleSchema.safeParse(invalidRule);
      expect(result.success).toBe(false);
    });

    it('should apply default values', () => {
      const minimalRule = {
        id: 'test-rule',
        name: 'Test Rule',
        windowMs: 60000,
        maxRequests: 100,
        keyType: 'ip' as const
      };

      const result = RateLimitRuleSchema.safeParse(minimalRule);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
        expect(result.data.conditions).toEqual({});
      }
    });
  });

  describe('RateLimitResultSchema', () => {
    it('should validate valid result', () => {
      const validResult = {
        allowed: true,
        remaining: 5,
        resetTime: 1060000,
        totalHits: 5,
        windowStart: 1000000,
        windowEnd: 1060000,
        key: 'ip:192.168.1.1',
        rule: 'default'
      };

      const result = RateLimitResultSchema.safeParse(validResult);
      expect(result.success).toBe(true);
    });

    it('should reject invalid result', () => {
      const invalidResult = {
        allowed: 'yes', // Should be boolean
        remaining: -1, // Should be >= 0
        resetTime: 'invalid', // Should be number
        totalHits: -1, // Should be >= 0
        windowStart: 1000000,
        windowEnd: 1060000,
        key: 'ip:192.168.1.1',
        rule: 'default'
      };

      const result = RateLimitResultSchema.safeParse(invalidResult);
      expect(result.success).toBe(false);
    });
  });
});

// ============================================================================
// EDGE CASES
// ============================================================================

describe('Edge Cases', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter({
      windowMs: 60000,
      maxRequests: 10
    });
    mockDateNow.mockReturnValue(1000000);
  });

  it('should handle concurrent requests', async () => {
    const request = { ip: '192.168.1.1' };

    // Make concurrent requests
    const promises = Array.from({ length: 15 }, () => 
      limiter.checkLimit(request)
    );

    const results = await Promise.all(promises);
    
    // First 10 should be allowed, rest should be blocked
    const allowed = results.filter(r => r.allowed);
    const blocked = results.filter(r => !r.allowed);

    expect(allowed).toHaveLength(10);
    expect(blocked).toHaveLength(5);
  });

  it('should handle empty request objects', async () => {
    const request = {};

    const result = await limiter.checkLimit(request);
    expect(result.allowed).toBe(true);
  });

  it('should handle disabled rate limiting', async () => {
    const disabledLimiter = new RateLimiter({
      enabled: false
    });

    const request = { ip: '192.168.1.1' };

    // Should always allow requests when disabled
    for (let i = 0; i < 100; i++) {
      const result = await disabledLimiter.checkLimit(request);
      expect(result.allowed).toBe(true);
    }
  });

  it('should handle very small windows', async () => {
    const smallWindowLimiter = new RateLimiter({
      windowMs: 1000, // 1 second
      maxRequests: 2
    });

    const request = { ip: '192.168.1.1' };

    // Make 2 requests
    await smallWindowLimiter.checkLimit(request);
    await smallWindowLimiter.checkLimit(request);

    // Should be blocked
    const result = await smallWindowLimiter.checkLimit(request);
    expect(result.allowed).toBe(false);

    // Move time forward
    mockDateNow.mockReturnValue(1000000 + 1000);

    // Should be allowed again
    const newResult = await smallWindowLimiter.checkLimit(request);
    expect(newResult.allowed).toBe(true);
  });
});
