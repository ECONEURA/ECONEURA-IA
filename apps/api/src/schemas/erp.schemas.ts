import { z } from 'zod';

// =====================================================
// ERP VALIDATION SCHEMAS
// =====================================================

// ===== CUSTOMER SCHEMAS =====

export const CreateCustomerSchema = z.object({
  customerCode: z.string().min(1).max(20),
  companyName: z.string().max(200).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  customerType: z.enum(['individual', 'business']).default('individual'),
  creditLimit: z.number().positive().optional(),
  paymentTermId: z.string().optional(),
  billingAddress: z.string().max(500).optional(),
  billingCity: z.string().max(100).optional(),
  billingState: z.string().max(100).optional(),
  billingPostal: z.string().max(20).optional(),
  billingCountry: z.string().max(100).optional(),
  shippingAddress: z.string().max(500).optional(),
  shippingCity: z.string().max(100).optional(),
  shippingState: z.string().max(100).optional(),
  shippingPostal: z.string().max(20).optional(),
  shippingCountry: z.string().max(100).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

export const CustomerQuerySchema = z.object({
  search: z.string().optional(),
  customerType: z.enum(['individual', 'business']).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['customerCode', 'companyName', 'firstName', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export const CustomerParamsSchema = z.object({
  id: z.string().min(1)
});

// ===== SUPPLIER SCHEMAS =====

export const CreateSupplierSchema = z.object({
  supplierCode: z.string().min(1).max(20),
  companyName: z.string().min(1).max(200),
  contactName: z.string().max(100).optional(),
  email: z.string().email().optional(),
  phone: z.string().max(20).optional(),
  taxId: z.string().max(50).optional(),
  paymentTermId: z.string().optional(),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().max(100).optional(),
  bankName: z.string().max(200).optional(),
  accountNumber: z.string().max(50).optional(),
  iban: z.string().max(34).optional(),
  swift: z.string().max(11).optional(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

export const UpdateSupplierSchema = CreateSupplierSchema.partial();

export const SupplierQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['supplierCode', 'companyName', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export const SupplierParamsSchema = z.object({
  id: z.string().min(1)
});

// ===== PRODUCT SCHEMAS =====

export const CreateProductCategorySchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateProductCategorySchema = CreateProductCategorySchema.partial();

export const CreateProductSchema = z.object({
  sku: z.string().min(1).max(50),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  shortDescription: z.string().max(500).optional(),
  categoryId: z.string().optional(),
  unitPrice: z.number().positive(),
  costPrice: z.number().positive().optional(),
  currency: z.string().default('EUR'),
  taxRateId: z.string().optional(),
  trackInventory: z.boolean().default(true),
  stockQuantity: z.number().int().min(0).default(0),
  minStockLevel: z.number().int().min(0).default(0),
  maxStockLevel: z.number().int().positive().optional(),
  unit: z.string().default('pcs'),
  weight: z.number().positive().optional(),
  dimensions: z.string().optional(),
  supplierId: z.string().optional(),
  supplierSku: z.string().max(50).optional(),
  isActive: z.boolean().default(true),
  isService: z.boolean().default(false),
});

export const UpdateProductSchema = CreateProductSchema.partial();

export const ProductQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  isActive: z.boolean().optional(),
  isService: z.boolean().optional(),
  trackInventory: z.boolean().optional(),
  lowStock: z.boolean().optional(),
  supplierId: z.string().optional(),
  priceMin: z.number().positive().optional(),
  priceMax: z.number().positive().optional(),
  sortBy: z.enum(['sku', 'name', 'unitPrice', 'stockQuantity', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export const ProductParamsSchema = z.object({
  id: z.string().min(1)
});

// ===== FINANCIAL SCHEMAS =====

export const CreateAccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']),
  subType: z.string().max(100).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  allowManualEntry: z.boolean().default(true),
});

export const UpdateAccountSchema = CreateAccountSchema.partial();

export const AccountQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(['asset', 'liability', 'equity', 'income', 'expense']).optional(),
  isActive: z.boolean().optional(),
  sortBy: z.enum(['code', 'name', 'type', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

export const CreateTaxRateSchema = z.object({
  name: z.string().min(1).max(100),
  rate: z.number().min(0).max(1),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

export const UpdateTaxRateSchema = CreateTaxRateSchema.partial();

export const CreatePaymentTermSchema = z.object({
  name: z.string().min(1).max(100),
  days: z.number().int().min(0).max(365),
  description: z.string().optional(),
  isActive: z.boolean().default(true),
});

export const UpdatePaymentTermSchema = CreatePaymentTermSchema.partial();

// ===== INVOICE SCHEMAS =====

export const CreateInvoiceItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRateId: z.string().optional(),
});

export const CreateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1).max(50).optional(), // Auto-generated if not provided
  invoiceDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  customerId: z.string(),
  paymentTermId: z.string().optional(),
  discountAmount: z.number().min(0).default(0),
  currency: z.string().default('EUR'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  items: z.array(CreateInvoiceItemSchema).min(1),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().omit({ items: true });

export const InvoiceQuerySchema = z.object({
  search: z.string().optional(),
  customerId: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  amountMin: z.number().positive().optional(),
  amountMax: z.number().positive().optional(),
  sortBy: z.enum(['invoiceNumber', 'invoiceDate', 'dueDate', 'total', 'status', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

// ===== EXPENSE SCHEMAS =====

export const CreateExpenseItemSchema = z.object({
  productId: z.string().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  taxRateId: z.string().optional(),
});

export const CreateExpenseSchema = z.object({
  expenseNumber: z.string().min(1).max(50).optional(), // Auto-generated if not provided
  expenseDate: z.string().datetime(),
  supplierId: z.string().optional(),
  paymentTermId: z.string().optional(),
  currency: z.string().default('EUR'),
  status: z.enum(['pending', 'approved', 'paid', 'rejected']).default('pending'),
  description: z.string().optional(),
  notes: z.string().optional(),
  receiptUrl: z.string().url().optional(),
  items: z.array(CreateExpenseItemSchema).min(1),
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial().omit({ items: true });

export const ExpenseQuerySchema = z.object({
  search: z.string().optional(),
  supplierId: z.string().optional(),
  status: z.enum(['pending', 'approved', 'paid', 'rejected']).optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  amountMin: z.number().positive().optional(),
  amountMax: z.number().positive().optional(),
  sortBy: z.enum(['expenseNumber', 'expenseDate', 'total', 'status', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

// ===== TRANSACTION SCHEMAS =====

export const CreateTransactionSchema = z.object({
  transactionDate: z.string().datetime(),
  description: z.string().min(1).max(500),
  type: z.string().max(50),
  invoiceId: z.string().optional(),
  expenseId: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  accountId: z.string(),
  amount: z.number(),
  currency: z.string().default('EUR'),
  status: z.enum(['draft', 'posted', 'reconciled']).default('posted'),
});

export const UpdateTransactionSchema = CreateTransactionSchema.partial();

export const TransactionQuerySchema = z.object({
  search: z.string().optional(),
  type: z.string().optional(),
  accountId: z.string().optional(),
  customerId: z.string().optional(),
  supplierId: z.string().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  amountMin: z.number().optional(),
  amountMax: z.number().optional(),
  status: z.enum(['draft', 'posted', 'reconciled']).optional(),
  sortBy: z.enum(['transactionDate', 'amount', 'status', 'createdAt']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
});

// ===== COMMON PARAMS =====

export const ERPParamsSchema = z.object({
  id: z.string().min(1)
});

// ===== REPORTING SCHEMAS =====

export const FinancialReportQuerySchema = z.object({
  dateFrom: z.string().datetime(),
  dateTo: z.string().datetime(),
  accountType: z.enum(['asset', 'liability', 'equity', 'income', 'expense']).optional(),
  currency: z.string().default('EUR'),
});

export const InventoryReportQuerySchema = z.object({
  categoryId: z.string().optional(),
  lowStock: z.boolean().optional(),
  zeroStock: z.boolean().optional(),
  includeInactive: z.boolean().default(false),
});