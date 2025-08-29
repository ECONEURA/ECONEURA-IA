import { Router } from 'express'
import { flowsController } from '../controllers/flows.controller.js'
import { requireAuth, requireOrg } from '../middleware/auth.js'

const router = Router()

// Execute CFO collection playbook
router.post('/collection', requireAuth, requireOrg, flowsController.executeCollection.bind(flowsController))

// Get playbook status
router.get('/:playbookId/status', requireAuth, requireOrg, flowsController.getPlaybookStatus.bind(flowsController))

// Approve or reject playbook
router.post('/:playbookId/approve', requireAuth, requireOrg, flowsController.approvePlaybook.bind(flowsController))

// Get available playbooks
router.get('/', requireAuth, requireOrg, flowsController.getAvailablePlaybooks.bind(flowsController))

// Get execution history
router.get('/history', requireAuth, requireOrg, flowsController.getExecutionHistory.bind(flowsController))

export { router as flowsRouter }