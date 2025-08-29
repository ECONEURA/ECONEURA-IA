import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/connection.js';
import { logger } from '@econeura/shared/logging';
import { idempotencyReplaysTotal, idempotencyConflictsTotal } from '@econeura/shared/metrics';

interface IdempotencyOptions {
  ttlHours?: number;
  keyHeader?: string;
  skipRoutes?: string[];
}

export function idempotency(options: IdempotencyOptions = {}) {
  const {
    ttlHours = 24,
    keyHeader = 'x-idempotency-key',
    skipRoutes = [],
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Skip if not a mutating operation or in skip routes
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) || 
        skipRoutes.some(route => req.path.startsWith(route))) {
      return next();
    }

    const idempotencyKey = req.header(keyHeader);
    if (!idempotencyKey) {
      return next(); // Idempotency is optional
    }

    const orgId = req.header('x-org-id');
    const route = req.route?.path || req.path;

    try {
      // Check if key exists and is valid
      const result = await db.query<{
        in_progress: boolean;
        last_status: number;
        response_json: Record<string, unknown>;
        ttl_until: Date;
      }>(
        'SELECT in_progress, last_status, response_json, ttl_until FROM idempotency_keys WHERE key = $1',
        [idempotencyKey]
      );

      if (result.rows.length > 0) {
        const record = result.rows[0];
        
        // Check if TTL has expired
        if (new Date() > record.ttl_until) {
          // Remove expired key
          await db.query.'DELETE FROM idempotency_keys WHERE key = $1', [idempotencyKey]);
        } else {
          // Key is still valid
          if (record.in_progress) {
            // Request is still being processed - return 409
            idempotencyConflictsTotal.labels(route, orgId || 'unknown').inc();
            
            logger.info('Idempotency conflict - request in progress', {
              corr_id: res.locals.corr_id,
              org_id: orgId,
              route,
              idempotency_key: idempotencyKey,
            });

            res.status(409).json({
              error: 'request_in_progress',
              type: 'https://econeura.dev/errors/request_in_progress',
              title: 'Request In Progress',
              status: 409,
              detail: 'A request with this idempotency key is currently being processed',
              instance: `corr:${res.locals.corr_id || 'n/a'}`,
              org_id: orgId || 'n/a',
            });
            return;
          } else {
            // Request was already completed - return cached response
            idempotencyReplaysTotal.labels(route, orgId || 'unknown').inc();
            
            logger.info('Idempotency replay - returning cached response', {
              corr_id: res.locals.corr_id,
              org_id: orgId,
              route,
              idempotency_key: idempotencyKey,
              cached_status: record.last_status,
            });

            res.setHeader('x-idempotent-replay', '1');
            res.status(record.last_status).json(record.response_json);
            return;
          }
        }
      }

      // Create new idempotency record
      const ttlUntil = new Date();
      ttlUntil.setHours(ttlUntil.getHours() + ttlHours);

      await db.query.
        `INSERT INTO idempotency_keys (key, first_seen_at, in_progress, ttl_until) 
         VALUES ($1, NOW(), true, $2)
         ON CONFLICT (key) DO UPDATE SET 
           in_progress = true, 
           ttl_until = EXCLUDED.ttl_until`,
        [idempotencyKey, ttlUntil]
      );

      // Store idempotency info for completion handler
      res.locals.idempotency_key = idempotencyKey;
      res.locals.idempotency_ttl = ttlUntil;

      // Wrap res.end to capture response
      const originalEnd = res.end;
      res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
        // Mark idempotency as complete with response
        if (res.locals.idempotency_key) {
          setImmediate(async () => {
            try {
              let responseData = {};
              
              // Try to parse response if it's JSON
              if (chunk && typeof chunk === 'string') {
                try {
                  responseData = JSON.parse(chunk);
                } catch {
                  responseData = { data: chunk };
                }
              } else if (chunk && typeof chunk === 'object') {
                responseData = chunk;
              }

              await db.query.
                `UPDATE idempotency_keys 
                 SET in_progress = false, last_status = $1, response_json = $2 
                 WHERE key = $3`,
                [res.statusCode, JSON.stringify(responseData), res.locals.idempotency_key]
              );

              logger.debug('Idempotency key completed', {
                corr_id: res.locals.corr_id,
                idempotency_key: res.locals.idempotency_key,
                status: res.statusCode,
              });

            } catch (error) {
              logger.error('Failed to update idempotency key', error as Error, {
                corr_id: res.locals.corr_id,
                idempotency_key: res.locals.idempotency_key,
              });
            }
          });
        }

        // Call original end
        return originalEnd.call(this, chunk, encoding, callback);
      };

      next();

    } catch (error) {
      logger.error('Idempotency middleware error', error as Error, {
        corr_id: res.locals.corr_id,
        org_id: orgId,
        idempotency_key: idempotencyKey,
      });

      // On error, allow request to proceed without idempotency
      next();
    }
  };
}

// Cleanup function for expired keys (should be called by cron job)
export async function cleanupExpiredIdempotencyKeys(): Promise<number> {
  try {
    const result = await db.query.
      'DELETE FROM idempotency_keys WHERE ttl_until < NOW()'
    );
    
    const deletedCount = result.rowCount || 0;
    
    if (deletedCount > 0) {
      logger.info(`Cleaned up ${deletedCount} expired idempotency keys`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error('Failed to cleanup expired idempotency keys', error as Error);
    return 0;
  }
}