import { Router } from 'express'
import { authRouter } from './auth'
import { companiesRouter } from './crm/companies'
import { contactsRouter } from './crm/contacts'
import { dealsRouter } from './crm/deals'
import { productsRouter } from './erp/products'
import { invoicesRouter } from './finance/invoices'
import { aiRouter } from './ai'
import { flowsRouter } from './flows'
import { makeWebhooksRouter } from './make-webhooks'
import { register } from 'prom-client'

const router = Router()

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Metrics endpoint
router.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType)
    res.end(await register.metrics())
  } catch (err) {
    res.status(500).end(err)
  }
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
      },
      ai: {
        route: '/api/v1/ai/route',
        providers: '/api/v1/ai/providers/health',
        cost: '/api/v1/ai/cost/usage'
      },
      flows: {
        collection: '/api/v1/flows/collection',
        playbooks: '/api/v1/flows',
        history: '/api/v1/flows/history'
      },
      webhooks: {
        make: '/api/webhooks/make',
        make_health: '/api/webhooks/make/health',
        make_stats: '/api/webhooks/make/stats'
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

// AI routes
v1Router.use('/ai', aiRouter)

// Flows routes
v1Router.use('/flows', flowsRouter)

// Mount v1 router
router.use('/v1', v1Router)

// Webhook routes (no version prefix)
router.use('/webhooks/make', makeWebhooksRouter)

export { router as apiRouter }