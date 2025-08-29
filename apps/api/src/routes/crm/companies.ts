import { Router } from 'express'
import { companiesController } from '../../controllers/companies.controller.js'
import { requireAuth, requireOrg, setOrgContext } from '../../middleware/auth.js'

const router = Router()

// Apply middleware to all routes
router.use(requireAuth)
router.use(requireOrg)
router.use(setOrgContext)

// GET /api/v1/crm/companies
router.get('/', companiesController.list.bind(companiesController))

// GET /api/v1/crm/companies/:id
router.get('/:id', companiesController.getById.bind(companiesController))

// POST /api/v1/crm/companies
router.post('/', companiesController.create.bind(companiesController))

// PUT /api/v1/crm/companies/:id
router.put('/:id', companiesController.update.bind(companiesController))

// DELETE /api/v1/crm/companies/:id
router.delete('/:id', companiesController.delete.bind(companiesController))

export { router as companiesRouter }