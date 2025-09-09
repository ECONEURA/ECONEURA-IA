// ============================================================================
// RATE LIMITING MIDDLEWARE - EXPRESS INTEGRATION
// ============================================================================

import { Request, Response, NextFunction } from 'express';
import {
  RateLimiter,
  createRateLimitMiddleware,
  MemoryRateLimitStore
} from '@econeura/shared/rate-limiting';
import { structuredLogger } from '../lib/structured-logger.js';

// ============================================================================
// RATE LIMITER INSTANCES
// ============================================================================

const globalStore = new MemoryRateLimitStore();

export const globalRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 1000,
  message: 'Global rate limit exceeded',
  standardHeaders: true,
  onLimitReached: (request, result) => {
    structuredLogger.warn('Global rate limit exceeded', {
      ip: request.ip,
      userId: request.userId,
      rule: result.rule,
      totalHits: result.totalHits
    });
  }
}, globalStore);

export const apiKeyRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5000,
  message: 'API key rate limit exceeded'
}, globalStore);

export const userRateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 2000,
  message: 'User rate limit exceeded'
}, globalStore);

// ============================================================================
// RATE LIMITING RULES
// ============================================================================

globalRateLimiter.addRule({
  id: 'auth-login',
  name: 'Authentication Login',
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
  keyType: 'ip',
  message: 'Too many login attempts'
});

globalRateLimiter.addRule({
  id: 'ai-chat',
  name: 'AI Chat',
  windowMs: 60 * 1000,
  maxRequests: 10,
  keyType: 'user',
  message: 'AI chat rate limit exceeded'
});

// ============================================================================
// MIDDLEWARE FUNCTIONS
// ============================================================================

export const globalRateLimit = createRateLimitMiddleware(globalRateLimiter);
export const apiKeyRateLimit = createRateLimitMiddleware(apiKeyRateLimiter);
export const userRateLimit = createRateLimitMiddleware(userRateLimiter);

export function pathBasedRateLimit(req: Request, res: Response, next: NextFunction): void {
  const path = req.path;
  let ruleId: string | undefined;

  if (path.startsWith('/auth/login')) {
    ruleId = 'auth-login';
  } else if (path.startsWith('/ai/chat')) {
    ruleId = 'ai-chat';
  }

  const middleware = createRateLimitMiddleware(globalRateLimiter, ruleId);
  return middleware(req, res, next);
}

export function authBasedRateLimit(req: Request, res: Response, next: NextFunction): void {
  const request = req as any;

  if (request.headers['x-api-key']) {
    return apiKeyRateLimit(req, res, next);
  }

  if (request.user?.id) {
    return userRateLimit(req, res, next);
  }

  return globalRateLimit(req, res, next);
}

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

export async function getRateLimitStatus(req: Request, res: Response): void {
  try {
    const { key } = req.query;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Key parameter is required' });
    }

    const limitInfo = await globalRateLimiter.getLimitInfo(key);
    const stats = globalRateLimiter.getStats();

    res.json({ key, limitInfo, stats, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get rate limit status' });
  }
}

export async function resetRateLimit(req: Request, res: Response): void {
  try {
    const { key } = req.body;

    if (!key || typeof key !== 'string') {
      return res.status(400).json({ error: 'Key parameter is required' });
    }

    await globalRateLimiter.resetLimit(key);
    res.json({ message: 'Rate limit reset successfully', key });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset rate limit' });
  }
}

export function getClientIP(req: Request): string {
  return (;
    (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
    (req.headers['x-real-ip'] as string) ||
    req.connection.remoteAddress ||
    'unknown'
  );
}

export default {
  globalRateLimit,
  apiKeyRateLimit,
  userRateLimit,
  pathBasedRateLimit,
  authBasedRateLimit,
  getRateLimitStatus,
  resetRateLimit,
  getClientIP
};
