import { Router } from 'express'
import { companiesController } from '../../../controllers/crm/companies.controller'
import { requirePermission } from '../../../mw/auth'

const companiesRouter = Router()

// List companies
companiesRouter.get(
  '/',
  requirePermission('crm:companies:read'),
  companiesController.list
)

// Get company stats
companiesRouter.get(
  '/stats',
  requirePermission('crm:companies:read'),
  companiesController.getStats
)

// Get single company
companiesRouter.get(
  '/:id',
  requirePermission('crm:companies:read'),
  companiesController.get
)

// Create company
companiesRouter.post(
  '/',
  requirePermission('crm:companies:write'),
  companiesController.create
)

// Update company
companiesRouter.put(
  '/:id',
  requirePermission('crm:companies:write'),
  companiesController.update
)

// Delete company
companiesRouter.delete(
  '/:id',
  requirePermission('crm:companies:delete'),
  companiesController.delete
)

// Add contact to company
companiesRouter.post(
  '/:id/contacts',
  requirePermission('crm:companies:write'),
  companiesController.addContact
)

// Get company activities
companiesRouter.get(
  '/:id/activities',
  requirePermission('crm:companies:read'),
  companiesController.getActivities
)

export { companiesRouter }