import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { hashApiKey } from '@econeura/shared/security';
import { logger } from '@econeura/shared/logging';
import { authFailures } from '@econeura/shared/metrics';
import { ApiError } from './problemJson.js';

interface AuthenticatedRequest extends Request {
  org?: {
    org_id: string;
    name: string;
    enabled: boolean;
  };
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authorization = req.header('authorization');
  const orgId = req.header('x-org-id');

  if (!authorization || !authorization.startsWith('Bearer ')) {
    authFailures.labels(orgId || 'unknown', 'missing_token').inc();
    
    logger.logSecurityEvent('Missing or invalid authorization header', {
      event_type: 'auth_failure',
      org_id: orgId,
      ip_address: req.ip,
      x_request_id: res.locals.corr_id,
    });
    
    throw ApiError.unauthorized('Missing or invalid authorization header');
  }

  if (!orgId) {
    authFailures.labels('unknown', 'missing_org_id').inc();
    
    logger.logSecurityEvent('Missing x-org-id header', {
      event_type: 'auth_failure',
      ip_address: req.ip,
      x_request_id: res.locals.corr_id,
    });
    
    throw ApiError.badRequest('x-org-id header is required');
  }

  const apiKey = authorization.slice(7); // Remove 'Bearer '
  
  // Validate API key format
  if (!apiKey || apiKey.length < 20) {
    authFailures.labels(orgId, 'invalid_format').inc();
    
    logger.logSecurityEvent('Invalid API key format', {
      event_type: 'auth_failure',
      org_id: orgId,
      ip_address: req.ip,
      x_request_id: res.locals.corr_id,
    });
    
    throw ApiError.unauthorized('Invalid API key format');
  }

  // Verify API key and organization
  verifyApiKey(apiKey, orgId)
    .then((org) => {
      if (!org) {
        authFailures.labels(orgId, 'invalid_credentials').inc();
        
        logger.logSecurityEvent('Invalid API key or organization', {
          event_type: 'auth_failure',
          org_id: orgId,
          ip_address: req.ip,
          x_request_id: res.locals.corr_id,
        });
        
        throw ApiError.unauthorized('Invalid API key or organization');
      }

      if (!org.enabled) {
        authFailures.labels(orgId, 'org_disabled').inc();
        
        logger.logSecurityEvent('Organization disabled', {
          event_type: 'auth_failure',
          org_id: orgId,
          ip_address: req.ip,
          x_request_id: res.locals.corr_id,
        });
        
        throw ApiError.forbidden('Organization is disabled');
      }

      // Store org info in request
      req.org = org;
      res.locals.org_id = org.org_id;

      logger.debug('Authentication successful', {
        org_id: org.org_id,
        corr_id: res.locals.corr_id,
      });

      next();
    })
    .catch(next);
}

async function verifyApiKey(
  apiKey: string, 
  orgId: string
): Promise<{ org_id: string; name: string; enabled: boolean } | null> {
  try {
    const keyHash = hashApiKey(apiKey);
    
    const result = await db.query<{
      org_id: string;
      name: string;
      enabled: boolean;
    }>(
      'SELECT org_id, name, enabled FROM organizations WHERE org_id = $1 AND api_key_hash = $2',
      [orgId, keyHash]
    );

    return result.rows[0] || null;
    
  } catch (error) {
    logger.error('API key verification failed', error as Error, {
      org_id: orgId,
    });
    return null;
  }
}

// Optional auth middleware (doesn't throw on missing auth)
export function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authorization = req.header('authorization');
  const orgId = req.header('x-org-id');

  if (!authorization || !orgId) {
    return next(); // Continue without auth
  }

  try {
    requireAuth(req, res, next);
  } catch (error) {
    // Log but don't throw
    logger.warn('Optional auth failed', {
      org_id: orgId,
      corr_id: res.locals.corr_id,
    });
    next();
  }
}

// Admin auth middleware (for admin endpoints)
export function requireAdminAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  requireAuth(req, res, (err) => {
    if (err) return next(err);

    // Check if this is an admin request
    const adminOrgIds = (process.env.ADMIN_ORG_IDS || '').split(',').map(id => id.trim());
    
    if (!adminOrgIds.includes(req.org!.org_id)) {
      logger.logSecurityEvent('Admin access denied', {
        event_type: 'auth_failure',
        org_id: req.org!.org_id,
        ip_address: req.ip,
        x_request_id: res.locals.corr_id,
      });
      
      throw ApiError.forbidden('Admin access required');
    }

    next();
  });
}

// Middleware to check feature flags
export function requireFeatureFlag(flag: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    if (!req.org) {
      throw ApiError.unauthorized('Authentication required');
    }

    try {
      const result = await db.query<{ enabled: boolean }>(
        'SELECT enabled FROM org_feature_flags WHERE org_id = $1 AND flag = $2',
        [req.org.org_id, flag]
      );

      const isEnabled = result.rows[0]?.enabled || false;

      if (!isEnabled) {
        logger.logSecurityEvent('Feature flag access denied', {
          event_type: 'auth_failure',
          org_id: req.org.org_id,
          ip_address: req.ip,
          x_request_id: res.locals.corr_id,
          details: { feature_flag: flag },
        });

        throw ApiError.forbidden(`Feature '${flag}' is not enabled for this organization`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// API key management functions
export async function createOrganization(
  orgId: string,
  name: string,
  apiKey: string
): Promise<void> {
  const keyHash = hashApiKey(apiKey);
  
  await db.query(
    'INSERT INTO organizations (org_id, name, api_key_hash) VALUES ($1, $2, $3)',
    [orgId, name, keyHash]
  );
  
  // Create default limits
  await db.query(
    'INSERT INTO org_limits (org_id) VALUES ($1)',
    [orgId]
  );
  
  logger.info('Organization created', { org_id: orgId, name });
}

export async function rotateApiKey(orgId: string, newApiKey: string): Promise<void> {
  const keyHash = hashApiKey(newApiKey);
  
  await db.query(
    'UPDATE organizations SET api_key_hash = $1 WHERE org_id = $2',
    [keyHash, orgId]
  );
  
  logger.info('API key rotated', { org_id: orgId });
}

export async function disableOrganization(orgId: string): Promise<void> {
  await db.query(
    'UPDATE organizations SET enabled = false WHERE org_id = $1',
    [orgId]
  );
  
  logger.info('Organization disabled', { org_id: orgId });
}

export type { AuthenticatedRequest };