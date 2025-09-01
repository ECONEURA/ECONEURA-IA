import { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../lib/rate-limiting.js';
import { logger } from '../lib/logger.js';

// composite key rate limiting: org:agent and ip

export interface RateLimitRequest extends Request {
  organizationId?: string;
  requestId?: string;
}

export function rateLimitMiddleware(req: RateLimitRequest, res: Response, next: NextFunction): void {
  // Extract organization ID from headers or query params
  const organizationId = req.headers['x-organization-id'] as string || 
                        req.query.organizationId as string || 
                        'default-org';

  // Use existing request ID or generate one
  const requestId = req.requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Check rate limit
  const result = rateLimiter.isAllowed(organizationId, requestId);

  // Add rate limit headers
  res.set({
    'X-RateLimit-Limit': '100', // This would come from the organization config
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.resetTime).toISOString(),
    'X-RateLimit-Strategy': 'sliding-window' // This would come from the organization config
  });

  if (result.retryAfter) {
    res.set('Retry-After', result.retryAfter.toString());
  }

  if (!result.allowed) {
    // Rate limit exceeded
    logger.warn('Rate limit exceeded', {
      organizationId,
      requestId,
      remaining: result.remaining,
      resetTime: new Date(result.resetTime).toISOString(),
      retryAfter: result.retryAfter || 0,
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests',
      retryAfter: result.retryAfter,
      resetTime: new Date(result.resetTime).toISOString(),
      requestId
    });
    return;
  }

  // Rate limit check passed
  logger.debug('Rate limit check passed', {
    organizationId,
    requestId,
    remaining: result.remaining,
    method: req.method,
    path: req.path
  });

  // Add organization ID to request for downstream use
  req.organizationId = organizationId;
  req.requestId = requestId;

  next();
}

export function rateLimitByEndpoint(req: RateLimitRequest, res: Response, next: NextFunction): void {
  const organizationId = req.organizationId || 'default-org';
  const endpoint = req.path;
  const method = req.method;
  
  // Create endpoint-specific organization ID
  const endpointOrgId = `${organizationId}:${method}:${endpoint}`;
  
  // Apply stricter limits for specific endpoints
  const endpointConfig = {
    windowMs: 60000,
    maxRequests: 50, // Stricter limit for specific endpoints
    strategy: 'sliding-window' as const
  };

  // Check if this endpoint has a specific rate limit
  const result = rateLimiter.isAllowed(endpointOrgId, req.requestId || 'unknown');

  if (!result.allowed) {
    logger.warn('Endpoint rate limit exceeded', {
      organizationId,
      endpoint,
      method,
      requestId: req.requestId,
      remaining: result.remaining
    });

    res.status(429).json({
      error: 'Endpoint rate limit exceeded',
      message: `Too many requests to ${method} ${endpoint}`,
      retryAfter: result.retryAfter,
      resetTime: new Date(result.resetTime).toISOString(),
      requestId: req.requestId
    });
    return;
  }

  next();
}

export function rateLimitByUser(req: RateLimitRequest, res: Response, next: NextFunction): void {
  const userId = req.headers['x-user-id'] as string || 
                 req.query.userId as string || 
                 req.ip; // Fallback to IP

  const organizationId = req.organizationId || 'default-org';
  const userOrgId = `${organizationId}:user:${userId}`;

  // Apply user-specific rate limits
  const userConfig = {
    windowMs: 60000,
    maxRequests: 30, // Stricter limit per user
    strategy: 'token-bucket' as const,
    burstSize: 5,
    refillRate: 1
  };

  const result = rateLimiter.isAllowed(userOrgId, req.requestId || 'unknown');

  if (!result.allowed) {
    logger.warn('User rate limit exceeded', {
      organizationId,
      userId,
      requestId: req.requestId,
      remaining: result.remaining
    });

    res.status(429).json({
      error: 'User rate limit exceeded',
      message: 'Too many requests from this user',
      retryAfter: result.retryAfter,
      resetTime: new Date(result.resetTime).toISOString(),
      requestId: req.requestId
    });
    return;
  }

  next();
}

// Middleware for API key rate limiting
export function rateLimitByApiKey(req: RateLimitRequest, res: Response, next: NextFunction): void {
  const apiKey = req.headers.authorization?.replace('Bearer ', '') || 
                 req.headers['x-api-key'] as string;

  if (!apiKey) {
    // No API key, use default rate limiting
    next();
    return;
  }

  const organizationId = req.organizationId || 'default-org';
  const apiKeyOrgId = `${organizationId}:apikey:${apiKey}`;

  // Apply API key specific rate limits
  const apiKeyConfig = {
    windowMs: 60000,
    maxRequests: 200, // Higher limit for API keys
    strategy: 'sliding-window' as const
  };

  const result = rateLimiter.isAllowed(apiKeyOrgId, req.requestId || 'unknown');

  if (!result.allowed) {
    logger.warn('API key rate limit exceeded', {
      organizationId,
      apiKey: apiKey.substring(0, 8) + '...', // Log partial key for security
      requestId: req.requestId,
      remaining: result.remaining
    });

    res.status(429).json({
      error: 'API key rate limit exceeded',
      message: 'Too many requests with this API key',
      retryAfter: result.retryAfter,
      resetTime: new Date(result.resetTime).toISOString(),
      requestId: req.requestId
    });
    return;
  }

  next();
}
