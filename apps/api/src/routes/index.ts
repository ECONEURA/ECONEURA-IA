import { Router } from 'express'
import { authRouter } from './auth'
import { companiesRouter } from './crm/companies'
import { contactsRouter } from './crm/contacts'
import { dealsRouter } from './crm/deals'
import { productsRouter } from './erp/products'
import { invoicesRouter } from './finance/invoices'

const router = Router()

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// API Info
router.get('/', (req, res) => {
  res.json({
    name: 'ECONEURA API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      crm: {
        companies: '/api/v1/crm/companies',
        contacts: '/api/v1/crm/contacts',
        deals: '/api/v1/crm/deals',
        activities: '/api/v1/crm/activities'
      },
      erp: {
        products: '/api/v1/erp/products',
        inventory: '/api/v1/erp/inventory',
        suppliers: '/api/v1/erp/suppliers',
        warehouses: '/api/v1/erp/warehouses',
        purchaseOrders: '/api/v1/erp/purchase-orders'
      },
      finance: {
        invoices: '/api/v1/finance/invoices',
        payments: '/api/v1/finance/payments',
        expenses: '/api/v1/finance/expenses',
        reports: '/api/v1/finance/reports'
      }
    }
  })
})

// Auth routes (no version prefix)
router.use('/auth', authRouter)

// v1 API routes
const v1Router = Router()

// CRM routes
v1Router.use('/crm/companies', companiesRouter)
v1Router.use('/crm/contacts', contactsRouter)
v1Router.use('/crm/deals', dealsRouter)

// ERP routes
v1Router.use('/erp/products', productsRouter)

// Finance routes
v1Router.use('/finance/invoices', invoicesRouter)

// Mount v1 router
router.use('/v1', v1Router)

export { router as apiRouter }