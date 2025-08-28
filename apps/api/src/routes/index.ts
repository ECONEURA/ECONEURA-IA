import { Router } from 'express'

// Auth routes
import { authRouter } from './auth'

// CRM routes
import { companiesRouter } from './crm/companies'
import { contactsRouter } from './crm/contacts'
import { dealsRouter } from './crm/deals'

// ERP routes
import { productsRouter } from './erp/products'

// Finance routes
import { invoicesRouter } from './finance/invoices'

const apiRouter = Router()

// Health check
apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  })
})

// Auth routes
apiRouter.use('/auth', authRouter)

// API v1 routes
const v1Router = Router()

// CRM module
v1Router.use('/crm/companies', companiesRouter)
v1Router.use('/crm/contacts', contactsRouter)
v1Router.use('/crm/deals', dealsRouter)

// ERP module
v1Router.use('/erp/products', productsRouter)

// Finance module
v1Router.use('/finance/invoices', invoicesRouter)

// Mount v1 routes
apiRouter.use('/v1', v1Router)

export { apiRouter }