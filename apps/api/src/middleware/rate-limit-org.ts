import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { structuredLogger } from '../lib/structured-logger.js';

// Rate limits por organización
const orgRateLimits = new Map<string, { requests: number; resetTime: number }>();

// Función para obtener rate limit por organización
function getOrgRateLimit(orgId: string): number {
  // Rate limits por tipo de organización
  const limits = {
    'enterprise': 1000,    // 1000 requests per 15 minutes
    'business': 500,       // 500 requests per 15 minutes
    'starter': 100,        // 100 requests per 15 minutes
    'demo': 50             // 50 requests per 15 minutes
  };
  
  // Por defecto, usar límite de starter
  return limits[orgId as keyof typeof limits] || limits.starter;
}

// Función para verificar rate limit personalizado
function checkOrgRateLimit(orgId: string): boolean {
  const now = Date.now();
  const limit = getOrgRateLimit(orgId);
  const orgLimit = orgRateLimits.get(orgId);
  
  if (!orgLimit || orgLimit.resetTime < now) {
    // Reset rate limit
    orgRateLimits.set(orgId, {
      requests: 1,
      resetTime: now + 15 * 60 * 1000 // 15 minutes
    });
    return true;
  }
  
  if (orgLimit.requests >= limit) {
    return false;
  }
  
  orgLimit.requests++;
  return true;
}

// Middleware de rate limiting por organización
export const rateLimitOrg = (req: Request, res: Response, next: NextFunction) => {
  const orgId = req.headers['x-org-id'] as string;
  
  if (!orgId) {
    return res.status(400).json({
      error: 'Missing x-org-id header'
    });
  }
  
  if (!checkOrgRateLimit(orgId)) {
    const limit = getOrgRateLimit(orgId);
    
    structuredLogger.warn('Rate limit exceeded', {
      orgId,
      limit,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Organization ${orgId} has exceeded the rate limit of ${limit} requests per 15 minutes`,
      retryAfter: 15 * 60 // 15 minutes in seconds
    });
  }
  
  next();
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
