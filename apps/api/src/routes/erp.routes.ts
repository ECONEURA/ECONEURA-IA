import { Router } from 'express';
import { authenticate, authorize, requireOrganizationScope } from '../middleware/auth';
import { validate, validatePagination } from '../middleware/validation';
import {
  // Customer schemas
  CreateCustomerSchema,
  UpdateCustomerSchema,
  CustomerQuerySchema,
  CustomerParamsSchema,
  // Supplier schemas
  CreateSupplierSchema,
  UpdateSupplierSchema,
  SupplierQuerySchema,
  SupplierParamsSchema,
  // Product schemas
  CreateProductSchema,
  UpdateProductSchema,
  CreateProductCategorySchema,
  UpdateProductCategorySchema,
  ProductQuerySchema,
  ProductParamsSchema,
  // Invoice schemas
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceQuerySchema,
  // Account schemas
  CreateAccountSchema,
  UpdateAccountSchema,
  AccountQuerySchema,
  CreateTaxRateSchema,
  UpdateTaxRateSchema,
  CreatePaymentTermSchema,
  UpdatePaymentTermSchema,
  // Common schemas
  ERPParamsSchema,
  FinancialReportQuerySchema,
  InventoryReportQuerySchema
} from '../schemas/erp.schemas';

// Import controllers
import * as customersController from '../controllers/customers.controller';
import * as suppliersController from '../controllers/suppliers.controller';
import * as productsController from '../controllers/products.controller';
import * as invoicesController from '../controllers/invoices.controller';
import * as financialConfigController from '../controllers/financial-config.controller';

const router = Router();

// Apply authentication and organization scope to all ERP routes
router.use(authenticate);
router.use(requireOrganizationScope);

// =============================================================================
// CUSTOMER ROUTES
// =============================================================================

/**
 * @route GET /erp/customers
 * @desc Get all customers with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/customers',
  validate(CustomerQuerySchema, 'query'),
  validatePagination,
  customersController.getCustomers
);

/**
 * @route GET /erp/customers/stats
 * @desc Get customer statistics
 * @access Private (authenticated users)
 */
router.get('/customers/stats',
  customersController.getCustomerStats
);

/**
 * @route GET /erp/customers/:id
 * @desc Get single customer by ID
 * @access Private (authenticated users)
 */
router.get('/customers/:id',
  validate(CustomerParamsSchema, 'params'),
  customersController.getCustomer
);

/**
 * @route POST /erp/customers
 * @desc Create new customer
 * @access Private (authenticated users)
 */
router.post('/customers',
  validate(CreateCustomerSchema, 'body'),
  customersController.createCustomer
);

/**
 * @route PUT /erp/customers/:id
 * @desc Update existing customer
 * @access Private (authenticated users)
 */
router.put('/customers/:id',
  validate(CustomerParamsSchema, 'params'),
  validate(UpdateCustomerSchema, 'body'),
  customersController.updateCustomer
);

/**
 * @route DELETE /erp/customers/:id
 * @desc Delete customer
 * @access Private (authenticated users)
 */
router.delete('/customers/:id',
  validate(CustomerParamsSchema, 'params'),
  customersController.deleteCustomer
);

// =============================================================================
// SUPPLIER ROUTES
// =============================================================================

/**
 * @route GET /erp/suppliers
 * @desc Get all suppliers with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/suppliers',
  validate(SupplierQuerySchema, 'query'),
  validatePagination,
  suppliersController.getSuppliers
);

/**
 * @route GET /erp/suppliers/stats
 * @desc Get supplier statistics
 * @access Private (authenticated users)
 */
router.get('/suppliers/stats',
  suppliersController.getSupplierStats
);

/**
 * @route GET /erp/suppliers/:id
 * @desc Get single supplier by ID
 * @access Private (authenticated users)
 */
router.get('/suppliers/:id',
  validate(SupplierParamsSchema, 'params'),
  suppliersController.getSupplier
);

/**
 * @route POST /erp/suppliers
 * @desc Create new supplier
 * @access Private (authenticated users)
 */
router.post('/suppliers',
  validate(CreateSupplierSchema, 'body'),
  suppliersController.createSupplier
);

/**
 * @route PUT /erp/suppliers/:id
 * @desc Update existing supplier
 * @access Private (authenticated users)
 */
router.put('/suppliers/:id',
  validate(SupplierParamsSchema, 'params'),
  validate(UpdateSupplierSchema, 'body'),
  suppliersController.updateSupplier
);

/**
 * @route DELETE /erp/suppliers/:id
 * @desc Delete supplier
 * @access Private (authenticated users)
 */
router.delete('/suppliers/:id',
  validate(SupplierParamsSchema, 'params'),
  suppliersController.deleteSupplier
);

// =============================================================================
// PRODUCT CATEGORY ROUTES
// =============================================================================

/**
 * @route GET /erp/products/categories
 * @desc Get all product categories
 * @access Private (authenticated users)
 */
router.get('/products/categories',
  productsController.getProductCategories
);

/**
 * @route POST /erp/products/categories
 * @desc Create new product category
 * @access Private (authenticated users)
 */
router.post('/products/categories',
  validate(CreateProductCategorySchema, 'body'),
  productsController.createProductCategory
);

// =============================================================================
// PRODUCT ROUTES
// =============================================================================

/**
 * @route GET /erp/products
 * @desc Get all products with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/products',
  validate(ProductQuerySchema, 'query'),
  validatePagination,
  productsController.getProducts
);

/**
 * @route GET /erp/products/inventory
 * @desc Get inventory report
 * @access Private (authenticated users)
 */
router.get('/products/inventory',
  validate(InventoryReportQuerySchema, 'query'),
  productsController.getInventoryReport
);

/**
 * @route GET /erp/products/:id
 * @desc Get single product by ID
 * @access Private (authenticated users)
 */
router.get('/products/:id',
  validate(ProductParamsSchema, 'params'),
  productsController.getProduct
);

/**
 * @route POST /erp/products
 * @desc Create new product
 * @access Private (authenticated users)
 */
router.post('/products',
  validate(CreateProductSchema, 'body'),
  productsController.createProduct
);

/**
 * @route PUT /erp/products/:id
 * @desc Update existing product
 * @access Private (authenticated users)
 */
router.put('/products/:id',
  validate(ProductParamsSchema, 'params'),
  validate(UpdateProductSchema, 'body'),
  productsController.updateProduct
);

/**
 * @route DELETE /erp/products/:id
 * @desc Delete product
 * @access Private (authenticated users)
 */
router.delete('/products/:id',
  validate(ProductParamsSchema, 'params'),
  productsController.deleteProduct
);

/**
 * @route PATCH /erp/products/:id/stock
 * @desc Update product stock
 * @access Private (authenticated users)
 */
router.patch('/products/:id/stock',
  validate(ProductParamsSchema, 'params'),
  productsController.updateProductStock
);

// =============================================================================
// INVOICE ROUTES
// =============================================================================

/**
 * @route GET /erp/invoices
 * @desc Get all invoices with filtering and pagination
 * @access Private (authenticated users)
 */
router.get('/invoices',
  validate(InvoiceQuerySchema, 'query'),
  validatePagination,
  invoicesController.getInvoices
);

/**
 * @route GET /erp/invoices/stats
 * @desc Get invoice statistics
 * @access Private (authenticated users)
 */
router.get('/invoices/stats',
  invoicesController.getInvoiceStats
);

/**
 * @route GET /erp/invoices/:id
 * @desc Get single invoice by ID
 * @access Private (authenticated users)
 */
router.get('/invoices/:id',
  validate(ERPParamsSchema, 'params'),
  invoicesController.getInvoice
);

/**
 * @route POST /erp/invoices
 * @desc Create new invoice
 * @access Private (authenticated users)
 */
router.post('/invoices',
  validate(CreateInvoiceSchema, 'body'),
  invoicesController.createInvoice
);

/**
 * @route PUT /erp/invoices/:id
 * @desc Update existing invoice
 * @access Private (authenticated users)
 */
router.put('/invoices/:id',
  validate(ERPParamsSchema, 'params'),
  validate(UpdateInvoiceSchema, 'body'),
  invoicesController.updateInvoice
);

/**
 * @route DELETE /erp/invoices/:id
 * @desc Delete invoice
 * @access Private (authenticated users)
 */
router.delete('/invoices/:id',
  validate(ERPParamsSchema, 'params'),
  invoicesController.deleteInvoice
);

/**
 * @route PATCH /erp/invoices/:id/send
 * @desc Mark invoice as sent
 * @access Private (authenticated users)
 */
router.patch('/invoices/:id/send',
  validate(ERPParamsSchema, 'params'),
  invoicesController.sendInvoice
);

// =============================================================================
// FINANCIAL CONFIGURATION ROUTES (Admin/Manager only)
// =============================================================================

/**
 * @route GET /erp/config/accounts
 * @desc Get chart of accounts
 * @access Private (Admin/Manager)
 */
router.get('/config/accounts',
  authorize(['admin', 'manager']),
  validate(AccountQuerySchema, 'query'),
  financialConfigController.getAccounts
);

/**
 * @route POST /erp/config/accounts
 * @desc Create new account
 * @access Private (Admin only)
 */
router.post('/config/accounts',
  authorize(['admin']),
  validate(CreateAccountSchema, 'body'),
  financialConfigController.createAccount
);

/**
 * @route PUT /erp/config/accounts/:id
 * @desc Update existing account
 * @access Private (Admin only)
 */
router.put('/config/accounts/:id',
  authorize(['admin']),
  validate(ERPParamsSchema, 'params'),
  validate(UpdateAccountSchema, 'body'),
  financialConfigController.updateAccount
);

/**
 * @route GET /erp/config/tax-rates
 * @desc Get tax rates
 * @access Private (authenticated users)
 */
router.get('/config/tax-rates',
  financialConfigController.getTaxRates
);

/**
 * @route POST /erp/config/tax-rates
 * @desc Create new tax rate
 * @access Private (Admin/Manager)
 */
router.post('/config/tax-rates',
  authorize(['admin', 'manager']),
  validate(CreateTaxRateSchema, 'body'),
  financialConfigController.createTaxRate
);

/**
 * @route PUT /erp/config/tax-rates/:id
 * @desc Update existing tax rate
 * @access Private (Admin/Manager)
 */
router.put('/config/tax-rates/:id',
  authorize(['admin', 'manager']),
  validate(ERPParamsSchema, 'params'),
  validate(UpdateTaxRateSchema, 'body'),
  financialConfigController.updateTaxRate
);

/**
 * @route DELETE /erp/config/tax-rates/:id
 * @desc Delete tax rate
 * @access Private (Admin only)
 */
router.delete('/config/tax-rates/:id',
  authorize(['admin']),
  validate(ERPParamsSchema, 'params'),
  financialConfigController.deleteTaxRate
);

/**
 * @route GET /erp/config/payment-terms
 * @desc Get payment terms
 * @access Private (authenticated users)
 */
router.get('/config/payment-terms',
  financialConfigController.getPaymentTerms
);

/**
 * @route POST /erp/config/payment-terms
 * @desc Create new payment term
 * @access Private (Admin/Manager)
 */
router.post('/config/payment-terms',
  authorize(['admin', 'manager']),
  validate(CreatePaymentTermSchema, 'body'),
  financialConfigController.createPaymentTerm
);

/**
 * @route PUT /erp/config/payment-terms/:id
 * @desc Update existing payment term
 * @access Private (Admin/Manager)
 */
router.put('/config/payment-terms/:id',
  authorize(['admin', 'manager']),
  validate(ERPParamsSchema, 'params'),
  validate(UpdatePaymentTermSchema, 'body'),
  financialConfigController.updatePaymentTerm
);

/**
 * @route DELETE /erp/config/payment-terms/:id
 * @desc Delete payment term
 * @access Private (Admin only)
 */
router.delete('/config/payment-terms/:id',
  authorize(['admin']),
  validate(ERPParamsSchema, 'params'),
  financialConfigController.deletePaymentTerm
);

export default router;