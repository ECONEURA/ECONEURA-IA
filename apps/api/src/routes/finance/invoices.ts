import { Router } from 'express'
import { invoicesController } from '../../controllers/invoices.controller.js'
import { requireAuth, requireOrg, setOrgContext } from '../../middleware/auth.js'

const router = Router()

// Apply middleware to all routes
router.use(requireAuth)
router.use(requireOrg)
router.use(setOrgContext)

// GET /api/v1/finance/invoices
router.get('/', invoicesController.list.bind(invoicesController))

// GET /api/v1/finance/invoices/:id
router.get('/:id', invoicesController.getById.bind(invoicesController))

// POST /api/v1/finance/invoices
router.post('/', invoicesController.create.bind(invoicesController))

// PUT /api/v1/finance/invoices/:id
router.put('/:id', invoicesController.update.bind(invoicesController))

// DELETE /api/v1/finance/invoices/:id
router.delete('/:id', invoicesController.delete.bind(invoicesController))

export { router as invoicesRouter }