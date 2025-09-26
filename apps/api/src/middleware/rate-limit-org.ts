import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { getDatabaseService } from '@econeura/db';
import { eq } from 'drizzle-orm';
import { organizations } from '@econeura/db/schema';

import { structuredLogger } from '../lib/structured-logger.js';

// ============================================================================
// ENHANCED RATE LIMITING MIDDLEWARE
// ============================================================================

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (req: Request) => string;
  onLimitReached?: (req: Request, res: Response) => void;
}

interface OrganizationRateLimit {
  organizationId: string;
  subscriptionTier: string;
  requests: number;
  resetTime: number;
  lastRequest: number;
  blockedRequests: number;
  totalRequests: number;
}

interface RateLimitMetrics {
  totalRequests: number;
  blockedRequests: number;
  averageResponseTime: number;
  peakRequestsPerMinute: number;
  lastReset: number;
}

// Enhanced rate limits with better memory management
const orgRateLimits = new Map<string, OrganizationRateLimit>();
const rateLimitMetrics = new Map<string, RateLimitMetrics>();

// Cleanup interval for memory management
setInterval(() => {
  const now = Date.now();
  for (const [key, limit] of orgRateLimits.entries()) {
    if (limit.resetTime < now) {
      orgRateLimits.delete(key);
    }
  }
}, 60000); // Cleanup every minute

// Enhanced rate limits by subscription tier
const SUBSCRIPTION_LIMITS = {
  'enterprise': {
    requests: 10000,      // 10,000 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    burstLimit: 100,      // 100 requests per minute
    aiRequests: 1000,     // 1,000 AI requests per hour
    priority: 1
  },
  'pro': {
    requests: 5000,       // 5,000 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    burstLimit: 50,       // 50 requests per minute
    aiRequests: 500,      // 500 AI requests per hour
    priority: 2
  },
  'basic': {
    requests: 1000,       // 1,000 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    burstLimit: 20,       // 20 requests per minute
    aiRequests: 100,      // 100 AI requests per hour
    priority: 3
  },
  'free': {
    requests: 100,        // 100 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    burstLimit: 5,        // 5 requests per minute
    aiRequests: 10,       // 10 AI requests per hour
    priority: 4
  },
  'demo': {
    requests: 50,         // 50 requests per 15 minutes
    windowMs: 15 * 60 * 1000,
    burstLimit: 3,        // 3 requests per minute
    aiRequests: 5,        // 5 AI requests per hour
    priority: 5
  }
} as const;

// Function to get organization rate limit configuration
async function getOrgRateLimitConfig(orgId: string): Promise<typeof SUBSCRIPTION_LIMITS[keyof typeof SUBSCRIPTION_LIMITS]> {
  try {
    const db = getDatabaseService().getDatabase();
    const org = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    
    if (org.length === 0) {
      return SUBSCRIPTION_LIMITS.free;
    }
    
    const subscriptionTier = org[0].subscriptionTier as keyof typeof SUBSCRIPTION_LIMITS;
    return SUBSCRIPTION_LIMITS[subscriptionTier] || SUBSCRIPTION_LIMITS.free;
  } catch (error) {
    structuredLogger.error('Failed to get organization rate limit config', error as Error);
    return SUBSCRIPTION_LIMITS.free;
  }
}

// Enhanced function to check organization rate limit
async function checkOrgRateLimit(orgId: string, endpoint?: string): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
  tier: string;
  burstAllowed: boolean;
}> {
  const now = Date.now();
  const config = await getOrgRateLimitConfig(orgId);
  const orgLimit = orgRateLimits.get(orgId);
  
  // Initialize or reset rate limit
  if (!orgLimit || orgLimit.resetTime < now) {
    const newLimit: OrganizationRateLimit = {
      organizationId: orgId,
      subscriptionTier: config.priority.toString(),
      requests: 1,
      resetTime: now + config.windowMs,
      lastRequest: now,
      blockedRequests: 0,
      totalRequests: 1
    };
    orgRateLimits.set(orgId, newLimit);
    
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime: newLimit.resetTime,
      tier: config.priority.toString(),
      burstAllowed: true
    };
  }
  
  // Check burst limit (requests per minute)
  const timeSinceLastRequest = now - orgLimit.lastRequest;
  const burstAllowed = timeSinceLastRequest > (60000 / config.burstLimit);
  
  // Check main rate limit
  if (orgLimit.requests >= config.requests) {
    orgLimit.blockedRequests++;
    orgLimit.totalRequests++;
    
    return {
      allowed: false,
      remaining: 0,
      resetTime: orgLimit.resetTime,
      tier: config.priority.toString(),
      burstAllowed: false
    };
  }
  
  // Update counters
  orgLimit.requests++;
  orgLimit.lastRequest = now;
  orgLimit.totalRequests++;
  
  return {
    allowed: true,
    remaining: config.requests - orgLimit.requests,
    resetTime: orgLimit.resetTime,
    tier: config.priority.toString(),
    burstAllowed
  };
}

// Function to get rate limit metrics
function getRateLimitMetrics(orgId: string): RateLimitMetrics | null {
  const orgLimit = orgRateLimits.get(orgId);
  if (!orgLimit) return null;
  
  const metrics = rateLimitMetrics.get(orgId) || {
    totalRequests: 0,
    blockedRequests: 0,
    averageResponseTime: 0,
    peakRequestsPerMinute: 0,
    lastReset: Date.now()
  };
  
  return {
    ...metrics,
    totalRequests: orgLimit.totalRequests,
    blockedRequests: orgLimit.blockedRequests
  };
}

// Enhanced middleware for organization rate limiting
export const rateLimitOrg = async (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const orgId = req.headers['x-org-id'] as string;
  const endpoint = req.path;
  const method = req.method;
  
  if (!orgId) {
    return res.status(400).json({
      error: 'Missing x-org-id header',
      timestamp: new Date().toISOString()
    });
  }
  
  try {
    const rateLimitResult = await checkOrgRateLimit(orgId, endpoint);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': rateLimitResult.remaining + rateLimitResult.remaining,
      'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
      'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
      'X-RateLimit-Tier': rateLimitResult.tier,
      'X-RateLimit-Burst-Allowed': rateLimitResult.burstAllowed.toString()
    });
    
    if (!rateLimitResult.allowed) {
      const processingTime = Date.now() - startTime;
      
      structuredLogger.warn('Rate limit exceeded', {
        orgId,
        endpoint,
        method,
        tier: rateLimitResult.tier,
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        processingTime
      });
      
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Organization ${orgId} has exceeded the rate limit`,
        tier: rateLimitResult.tier,
        remaining: rateLimitResult.remaining,
        resetTime: new Date(rateLimitResult.resetTime).toISOString(),
        retryAfter: Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000),
        timestamp: new Date().toISOString()
      });
    }
    
    // Log successful request
    const processingTime = Date.now() - startTime;
    structuredLogger.info('Rate limit check passed', {
      orgId,
      endpoint,
      method,
      tier: rateLimitResult.tier,
      remaining: rateLimitResult.remaining,
      burstAllowed: rateLimitResult.burstAllowed,
      processingTime
    });
    
    next();
  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    structuredLogger.error('Rate limit check failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      orgId,
      endpoint,
      method,
      processingTime
    });
    
    // Allow request to proceed if rate limit check fails
    next();
  }
};

// Rate limiter estándar con configuración personalizada
export const standardRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Default limit
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    structuredLogger.warn('Standard rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    res.status(429).json({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: 15 * 60
    });
  }
});

// Budget guard middleware
export const budgetGuard = (req: Request, res: Response, next: NextFunction) => {
  const orgId = req.headers['x-org-id'] as string;
  const estimatedCost = req.headers['x-est-cost-eur'] as string;
  
  if (!orgId) {
    return next();
  }
  
  // Verificar presupuesto (simulado)
  const budget = getOrgBudget(orgId);
  const currentUsage = getOrgUsage(orgId);
  const cost = parseFloat(estimatedCost) || 0;
  
  if (currentUsage + cost > budget) {
    structuredLogger.warn('Budget exceeded', {
      orgId,
      budget,
      currentUsage,
      estimatedCost: cost
    });
    
    return res.status(429).json({
      error: 'Budget exceeded',
      message: `Organization ${orgId} has exceeded its budget`,
      budget,
      currentUsage,
      estimatedCost: cost
    });
  }
  
  next();
};

// Funciones auxiliares (simuladas)
function getOrgBudget(orgId: string): number {
  const budgets = {
    'enterprise': 1000,    // €1000 per month
    'business': 500,       // €500 per month
    'starter': 100,        // €100 per month
    'demo': 10             // €10 per month
  };
  
  return budgets[orgId as keyof typeof budgets] || budgets.starter;
}

function getOrgUsage(orgId: string): number {
  // En una implementación real, esto vendría de la base de datos
  return Math.random() * 50; // Simulado
}

// Middleware para rate limiting por endpoint
export const endpointRateLimit = (maxRequests: number, windowMs: number = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const orgId = req.headers['x-org-id'] as string;
      const endpoint = req.path;
      return `${orgId}:${endpoint}`;
    },
    handler: (req: Request, res: Response) => {
      const orgId = req.headers['x-org-id'] as string;
      const endpoint = req.path;
      
      structuredLogger.warn('Endpoint rate limit exceeded', {
        orgId,
        endpoint,
        maxRequests,
        windowMs
      });
      
      res.status(429).json({
        error: 'Endpoint rate limit exceeded',
        message: `Too many requests to ${endpoint}`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Middleware para rate limiting por usuario
export const userRateLimit = (maxRequests: number, windowMs: number = 15 * 60 * 1000) => {
  return rateLimit({
    windowMs,
    max: maxRequests,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req: Request) => {
      const orgId = req.headers['x-org-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      return `${orgId}:${userId}`;
    },
    handler: (req: Request, res: Response) => {
      const orgId = req.headers['x-org-id'] as string;
      const userId = req.headers['x-user-id'] as string;
      
      structuredLogger.warn('User rate limit exceeded', {
        orgId,
        userId,
        maxRequests,
        windowMs
      });
      
      res.status(429).json({
        error: 'User rate limit exceeded',
        message: `User ${userId} has exceeded the rate limit`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};
