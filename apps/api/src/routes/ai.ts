import { Router } from 'express'
import { aiController } from '../controllers/ai.controller.js'
import { requireAuth, requireOrg } from '../middleware/auth.js'

const router = Router()

// AI routing endpoint
router.post('/route', requireAuth, requireOrg, aiController.routeRequest.bind(aiController))

// Provider health check
router.get('/providers/health', requireAuth, aiController.getProviderHealth.bind(aiController))

// Cost usage for organization
router.get('/cost/usage', requireAuth, requireOrg, aiController.getCostUsage.bind(aiController))

export { router as aiRouter }