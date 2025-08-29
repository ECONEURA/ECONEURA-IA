import { Router } from 'express'
import { dealsController } from '../../controllers/deals.controller.js'
import { requireAuth, requireOrg, setOrgContext } from '../../middleware/auth.js'

const router = Router()

// Apply middleware to all routes
router.use(requireAuth)
router.use(requireOrg)
router.use(setOrgContext)

// GET /api/v1/crm/deals
router.get('/', dealsController.list.bind(dealsController))

// GET /api/v1/crm/deals/:id
router.get('/:id', dealsController.getById.bind(dealsController))

// POST /api/v1/crm/deals
router.post('/', dealsController.create.bind(dealsController))

// PUT /api/v1/crm/deals/:id
router.put('/:id', dealsController.update.bind(dealsController))

// DELETE /api/v1/crm/deals/:id
router.delete('/:id', dealsController.delete.bind(dealsController))

export { router as dealsRouter }