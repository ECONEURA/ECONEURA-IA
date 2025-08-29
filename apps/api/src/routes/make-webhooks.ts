import { Router } from 'express'
import { makeWebhooksController } from '../controllers/make-webhooks.controller.js'
import { makeWebhookIPAllowlist } from '../middleware/ip-allowlist.js'
import { makeWebhookIdempotency } from '../middleware/webhook-idempotency.js'
import { verifyHmac } from '../middleware/verifyHmac.js'
import { env } from '@econeura/shared'

const router = Router()

// Make webhook endpoint with all security middleware
router.post('/',
  // 1. IP allowlist check
  makeWebhookIPAllowlist(),
  
  // 2. HMAC verification
  verifyHmac(env().MAKE_WEBHOOK_HMAC_SECRET || 'dev-secret', 300),
  
  // 3. Idempotency check
  makeWebhookIdempotency(),
  
  // 4. Process webhook
  makeWebhooksController.processWebhook.bind(makeWebhooksController)
)

// Webhook statistics (requires auth)
router.get('/stats',
  makeWebhooksController.getWebhookStats.bind(makeWebhooksController)
)

// Health check for Make webhook endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'make-webhooks',
    timestamp: new Date().toISOString(),
    features: {
      ip_allowlist: true,
      hmac_verification: true,
      idempotency: true,
      audit_trail: true,
    },
  })
})

export { router as makeWebhooksRouter }
