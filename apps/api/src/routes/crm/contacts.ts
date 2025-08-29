import { Router } from 'express'
import { contactsController } from '../../controllers/contacts.controller.js'
import { requireAuth, requireOrg, setOrgContext } from '../../middleware/auth.js'

const router = Router()

// Apply middleware to all routes
router.use(requireAuth)
router.use(requireOrg)
router.use(setOrgContext)

// GET /api/v1/crm/contacts
router.get('/', contactsController.list.bind(contactsController))

// GET /api/v1/crm/contacts/:id
router.get('/:id', contactsController.getById.bind(contactsController))

// POST /api/v1/crm/contacts
router.post('/', contactsController.create.bind(contactsController))

// PUT /api/v1/crm/contacts/:id
router.put('/:id', contactsController.update.bind(contactsController))

// DELETE /api/v1/crm/contacts/:id
router.delete('/:id', contactsController.delete.bind(contactsController))

export { router as contactsRouter }