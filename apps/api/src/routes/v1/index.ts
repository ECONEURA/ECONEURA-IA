import { Router } from 'express'
import { authenticateJWT, requirePermission } from '../../mw/auth'

// Import CRM routes
import { companiesRouter } from './crm/companies'
import { contactsRouter } from './crm/contacts'
import { dealsRouter } from './crm/deals'
import { activitiesRouter } from './crm/activities'

// Import ERP routes
import { productsRouter } from './erp/products'
import { suppliersRouter } from './erp/suppliers'
import { warehousesRouter } from './erp/warehouses'
import { inventoryRouter } from './erp/inventory'
import { purchaseOrdersRouter } from './erp/purchase-orders'

// Import Finance routes
import { invoicesRouter } from './finance/invoices'
import { paymentsRouter } from './finance/payments'
import { expensesRouter } from './finance/expenses'
import { reportsRouter } from './finance/reports'

const v1Router = Router()

// Apply authentication to all v1 routes
v1Router.use(authenticateJWT)

// CRM routes
v1Router.use('/crm/companies', requirePermission('crm:companies'), companiesRouter)
v1Router.use('/crm/contacts', requirePermission('crm:contacts'), contactsRouter)
v1Router.use('/crm/deals', requirePermission('crm:deals'), dealsRouter)
v1Router.use('/crm/activities', requirePermission('crm:activities'), activitiesRouter)

// ERP routes
v1Router.use('/erp/products', requirePermission('erp:products'), productsRouter)
v1Router.use('/erp/suppliers', requirePermission('erp:suppliers'), suppliersRouter)
v1Router.use('/erp/warehouses', requirePermission('erp:warehouses'), warehousesRouter)
v1Router.use('/erp/inventory', requirePermission('erp:inventory'), inventoryRouter)
v1Router.use('/erp/purchase-orders', requirePermission('erp:purchase_orders'), purchaseOrdersRouter)

// Finance routes
v1Router.use('/finance/invoices', requirePermission('finance:invoices'), invoicesRouter)
v1Router.use('/finance/payments', requirePermission('finance:payments'), paymentsRouter)
v1Router.use('/finance/expenses', requirePermission('finance:expenses'), expensesRouter)
v1Router.use('/finance/reports', requirePermission('finance:reports'), reportsRouter)

// Health check
v1Router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

export { v1Router }