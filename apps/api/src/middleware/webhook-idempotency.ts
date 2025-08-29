import { Request, Response, NextFunction } from 'express'
import { db, setOrg } from '@econeura/db'
import { Problems } from './problem-json.js'
import { logger } from '@econeura/shared'
import { createHash } from 'crypto'

export interface WebhookIdempotencyOptions {
  ttlHours?: number
  keyHeader?: string
  generateKey?: (req: Request) => string
}

/**
 * Webhook Idempotency middleware with persistent storage
 */
export function webhookIdempotency(options: WebhookIdempotencyOptions = {}) {
  const {
    ttlHours = 24,
    keyHeader = 'x-idempotency-key',
    generateKey = defaultKeyGenerator,
  } = options

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Get idempotency key from header or generate from request
    const idempotencyKey = req.header(keyHeader) || generateKey(req)
    
    if (!idempotencyKey) {
      return next() // No idempotency key, proceed normally
    }

    const orgId = req.orgId || 'system'
    const route = req.route?.path || req.path

    try {
      // Set organization context for RLS
      await setOrg(orgId)

      // Check if key exists and is valid
      const result = await db.query<{
        in_progress: boolean
        last_status: number
        response_json: Record<string, unknown>
        ttl_until: Date
        result_hash: string
      }>(
        `SELECT in_progress, last_status, response_json, ttl_until, result_hash 
         FROM idempotency_keys 
         WHERE key = $1 AND org_id = $2`,
        [idempotencyKey, orgId]
      )

      if (result.rows.length > 0) {
        const existing = result.rows[0]
        
        // Check if TTL has expired
        if (new Date() > existing.ttl_until) {
          // TTL expired, allow new request
          logger.info('Idempotency key expired, allowing new request', {
            key: idempotencyKey,
            org_id: orgId,
            route,
            corr_id: res.locals.corr_id,
          })
        } else if (existing.in_progress) {
          // Request in progress, return 409
          logger.warn('Idempotency key in progress', {
            key: idempotencyKey,
            org_id: orgId,
            route,
            corr_id: res.locals.corr_id,
          })
          
          throw Problems.conflict('Request already in progress', {
            detail: 'This request is already being processed',
            idempotency_key: idempotencyKey,
          })
        } else {
          // Return cached response
          logger.info('Returning cached response for idempotency key', {
            key: idempotencyKey,
            org_id: orgId,
            route,
            status: existing.last_status,
            corr_id: res.locals.corr_id,
          })

          res.status(existing.last_status)
          res.json(existing.response_json)
          return
        }
      }

      // Set TTL
      const ttlUntil = new Date()
      ttlUntil.setHours(ttlUntil.getHours() + ttlHours)

      // Insert or update idempotency key
      await db.query.
        `INSERT INTO idempotency_keys (key, org_id, first_seen_at, in_progress, ttl_until, result_hash) 
         VALUES ($1, $2, NOW(), true, $3, $4)
         ON CONFLICT (key, org_id) DO UPDATE SET 
           in_progress = true, 
           ttl_until = EXCLUDED.ttl_until,
           result_hash = EXCLUDED.result_hash`,
        [idempotencyKey, orgId, ttlUntil, generateResultHash(req)]
      )

      // Store idempotency info for completion handler
      res.locals.idempotency_key = idempotencyKey
      res.locals.idempotency_ttl = ttlUntil
      res.locals.idempotency_org_id = orgId

      // Wrap res.end to capture response
      const originalEnd = res.end
      res.end = function(chunk?: any, encoding?: any, callback?: any): Response {
        // Mark idempotency as complete with response
        if (res.locals.idempotency_key) {
          setImmediate(async () => {
            try {
              await setOrg(res.locals.idempotency_org_id)
              
              let responseData = {}
              
              // Try to parse response if it's JSON
              if (chunk && typeof chunk === 'string') {
                try {
                  responseData = JSON.parse(chunk)
                } catch {
                  responseData = { data: chunk }
                }
              } else if (chunk && typeof chunk === 'object') {
                responseData = chunk
              }

              await db.query.
                `UPDATE idempotency_keys 
                 SET in_progress = false, 
                     last_status = $1, 
                     response_json = $2,
                     result_hash = $3
                 WHERE key = $4 AND org_id = $5`,
                [
                  res.statusCode,
                  JSON.stringify(responseData),
                  generateResultHash(req),
                  res.locals.idempotency_key,
                  res.locals.idempotency_org_id,
                ]
              )

              logger.debug('Webhook idempotency key completed', {
                key: res.locals.idempotency_key,
                org_id: res.locals.idempotency_org_id,
                status: res.statusCode,
                corr_id: res.locals.corr_id,
              })

            } catch (error) {
              logger.error('Failed to update webhook idempotency key', error as Error, {
                key: res.locals.idempotency_key,
                org_id: res.locals.idempotency_org_id,
                corr_id: res.locals.corr_id,
              })
            }
          })
        }

        // Call original end
        return originalEnd.call(this, chunk, encoding, callback)
      }

      next()

    } catch (error) {
      if (error instanceof Error && error.message.includes('Request already in progress')) {
        throw error // Re-throw idempotency conflicts
      }
      
      logger.error('Webhook idempotency middleware error', error as Error, {
        key: idempotencyKey,
        org_id: orgId,
        route,
        corr_id: res.locals.corr_id,
      })
      
      // Continue without idempotency on error
      next()
    }
  }
}

/**
 * Default key generator for webhooks
 */
function defaultKeyGenerator(req: Request): string {
  const bodyHash = createHash('sha256')
    .update(JSON.stringify(req.body))
    .digest('hex')
  
  const urlHash = createHash('sha256')
    .update(req.url)
    .digest('hex')
  
  return createHash('sha256')
    .update(`${req.method}:${urlHash}:${bodyHash}`)
    .digest('hex')
    .substring(0, 32)
}

/**
 * Generate result hash for idempotency
 */
function generateResultHash(req: Request): string {
  const bodyHash = createHash('sha256')
    .update(JSON.stringify(req.body))
    .digest('hex')
  
  const headersHash = createHash('sha256')
    .update(JSON.stringify({
      'content-type': req.headers['content-type'],
      'user-agent': req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
    }))
    .digest('hex')
  
  return createHash('sha256')
    .update(`${bodyHash}:${headersHash}`)
    .digest('hex')
    .substring(0, 32)
}

/**
 * Create webhook idempotency middleware for Make
 */
export function makeWebhookIdempotency() {
  return webhookIdempotency({
    ttlHours: 24,
    keyHeader: 'x-make-idempotency-key',
    generateKey: (req) => {
      // Make-specific key generation
      const bodyHash = createHash('sha256')
        .update(JSON.stringify(req.body))
        .digest('hex')
      
      const timestamp = req.headers['x-make-timestamp'] || Date.now()
      
      return createHash('sha256')
        .update(`make:${timestamp}:${bodyHash}`)
        .digest('hex')
        .substring(0, 32)
    },
  })
}

/**
 * Create webhook idempotency middleware for general webhooks
 */
export function generalWebhookIdempotency() {
  return webhookIdempotency({
    ttlHours: 12,
    keyHeader: 'x-webhook-idempotency-key',
  })
}
