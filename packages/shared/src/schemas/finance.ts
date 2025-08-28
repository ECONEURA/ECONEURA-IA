import { z } from 'zod';

// Base entity
const BaseEntity = z.object({
  id: z.string().uuid(),
  orgId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable().optional(),
});

// Invoice schemas
export const InvoiceStatusSchema = z.enum([
  'draft',
  'sent',
  'viewed',
  'partial',
  'paid',
  'overdue',
  'cancelled',
  'refunded'
]);

export const InvoiceSchema = BaseEntity.extend({
  invoiceNumber: z.string().min(1).max(50),
  type: z.enum(['sales', 'purchase', 'credit_note', 'debit_note']).default('sales'),
  entityType: z.enum(['company', 'contact', 'supplier']),
  entityId: z.string().uuid(),
  status: InvoiceStatusSchema.default('draft'),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  paymentTerms: z.string().max(200).optional(),
  currency: z.string().length(3).default('EUR'),
  
  // Amounts
  subtotal: z.number().min(0).default(0),
  discountPercentage: z.number().min(0).max(100).default(0),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  shippingCost: z.number().min(0).default(0),
  totalAmount: z.number().min(0).default(0),
  paidAmount: z.number().min(0).default(0),
  balanceDue: z.number().min(0).default(0),
  
  // References
  purchaseOrderId: z.string().uuid().optional(),
  salesOrderId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  
  // Billing info
  billingAddress: z.object({
    line1: z.string().max(200),
    line2: z.string().max(200).optional(),
    city: z.string().max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20),
    country: z.string().max(100),
  }),
  
  shippingAddress: z.object({
    line1: z.string().max(200),
    line2: z.string().max(200).optional(),
    city: z.string().max(100),
    state: z.string().max(100).optional(),
    postalCode: z.string().max(20),
    country: z.string().max(100),
  }).optional(),
  
  // Additional fields
  notes: z.string().max(5000).optional(),
  internalNotes: z.string().max(5000).optional(),
  termsAndConditions: z.string().max(10000).optional(),
  
  // Workflow
  submittedAt: z.string().datetime().optional(),
  submittedByUserId: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  approvedByUserId: z.string().uuid().optional(),
  sentAt: z.string().datetime().optional(),
  viewedAt: z.string().datetime().optional(),
  paidAt: z.string().datetime().optional(),
  cancelledAt: z.string().datetime().optional(),
  cancelledReason: z.string().max(500).optional(),
  
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export const InvoiceItemSchema = z.object({
  id: z.string().uuid(),
  invoiceId: z.string().uuid(),
  productId: z.string().uuid().optional(),
  description: z.string().min(1).max(500),
  quantity: z.number().min(0),
  unitPrice: z.number().min(0),
  unit: z.string().max(50).default('unit'),
  discount: z.number().min(0).max(100).default(0), // percentage
  taxRate: z.number().min(0).max(100).default(21),
  subtotal: z.number().min(0),
  taxAmount: z.number().min(0),
  total: z.number().min(0),
  accountCode: z.string().max(50).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateInvoiceSchema = InvoiceSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  invoiceNumber: true, // auto-generated
  balanceDue: true, // calculated
}).extend({
  items: z.array(InvoiceItemSchema.omit({ id: true, invoiceId: true })),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export const InvoiceFilterSchema = z.object({
  q: z.string().optional(),
  type: z.enum(['sales', 'purchase', 'credit_note', 'debit_note']).optional(),
  status: InvoiceStatusSchema.optional(),
  entityType: z.enum(['company', 'contact', 'supplier']).optional(),
  entityId: z.string().uuid().optional(),
  dateFrom: z.string().datetime().optional(),
  dateTo: z.string().datetime().optional(),
  minAmount: z.number().min(0).optional(),
  maxAmount: z.number().optional(),
  overdue: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

// Payment schemas
export const PaymentMethodSchema = z.enum([
  'cash',
  'check',
  'bank_transfer',
  'credit_card',
  'debit_card',
  'paypal',
  'stripe',
  'other'
]);

export const PaymentSchema = BaseEntity.extend({
  paymentNumber: z.string().min(1).max(50),
  invoiceId: z.string().uuid().optional(),
  entityType: z.enum(['company', 'contact', 'supplier']),
  entityId: z.string().uuid(),
  amount: z.number().min(0),
  currency: z.string().length(3).default('EUR'),
  paymentDate: z.string().datetime(),
  paymentMethod: PaymentMethodSchema,
  referenceNumber: z.string().max(100).optional(),
  
  // Bank details
  bankAccount: z.string().max(100).optional(),
  bankName: z.string().max(200).optional(),
  
  // Processing info
  processingFee: z.number().min(0).default(0),
  netAmount: z.number().min(0),
  
  status: z.enum(['pending', 'processing', 'completed', 'failed', 'cancelled']).default('pending'),
  processedAt: z.string().datetime().optional(),
  failureReason: z.string().max(500).optional(),
  
  notes: z.string().max(5000).optional(),
  reconciledAt: z.string().datetime().optional(),
  reconciledByUserId: z.string().uuid().optional(),
  
  metadata: z.record(z.unknown()).optional(),
});

export const CreatePaymentSchema = PaymentSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  paymentNumber: true, // auto-generated
  netAmount: true, // calculated
});

export const UpdatePaymentSchema = CreatePaymentSchema.partial();

// Expense schemas
export const ExpenseSchema = BaseEntity.extend({
  expenseNumber: z.string().min(1).max(50),
  category: z.enum([
    'travel',
    'meals',
    'supplies',
    'utilities',
    'rent',
    'salaries',
    'marketing',
    'professional_fees',
    'equipment',
    'maintenance',
    'insurance',
    'taxes',
    'other'
  ]),
  description: z.string().min(1).max(500),
  amount: z.number().min(0),
  currency: z.string().length(3).default('EUR'),
  expenseDate: z.string().datetime(),
  
  // Related entities
  employeeId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  supplierId: z.string().uuid().optional(),
  
  // Receipt info
  hasReceipt: z.boolean().default(false),
  receiptUrl: z.string().url().optional(),
  
  // Payment info
  paymentMethod: PaymentMethodSchema.optional(),
  reimbursable: z.boolean().default(false),
  reimbursedAt: z.string().datetime().optional(),
  
  // Approval workflow
  status: z.enum(['draft', 'submitted', 'approved', 'rejected', 'paid']).default('draft'),
  submittedAt: z.string().datetime().optional(),
  submittedByUserId: z.string().uuid().optional(),
  approvedAt: z.string().datetime().optional(),
  approvedByUserId: z.string().uuid().optional(),
  rejectedReason: z.string().max(500).optional(),
  
  taxDeductible: z.boolean().default(false),
  taxRate: z.number().min(0).max(100).default(0),
  
  accountCode: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateExpenseSchema = ExpenseSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  expenseNumber: true, // auto-generated
});

export const UpdateExpenseSchema = CreateExpenseSchema.partial();

// Financial Summary schemas
export const FinancialSummarySchema = z.object({
  orgId: z.string().uuid(),
  period: z.object({
    start: z.string().datetime(),
    end: z.string().datetime(),
  }),
  
  // Revenue metrics
  revenue: z.object({
    total: z.number(),
    byCategory: z.record(z.string(), z.number()),
    growth: z.number(), // percentage
  }),
  
  // Accounts receivable
  accountsReceivable: z.object({
    total: z.number(),
    current: z.number(),
    overdue30: z.number(),
    overdue60: z.number(),
    overdue90: z.number(),
    overdue90Plus: z.number(),
  }),
  
  // Accounts payable
  accountsPayable: z.object({
    total: z.number(),
    current: z.number(),
    overdue30: z.number(),
    overdue60: z.number(),
    overdue90: z.number(),
    overdue90Plus: z.number(),
  }),
  
  // Cash flow
  cashFlow: z.object({
    opening: z.number(),
    inflow: z.number(),
    outflow: z.number(),
    closing: z.number(),
  }),
  
  // Expenses
  expenses: z.object({
    total: z.number(),
    byCategory: z.record(z.string(), z.number()),
  }),
  
  // Profitability
  grossProfit: z.number(),
  grossProfitMargin: z.number(), // percentage
  netProfit: z.number(),
  netProfitMargin: z.number(), // percentage
  
  // Key metrics
  averageDaysToPayment: z.number(),
  averageOrderValue: z.number(),
  outstandingInvoices: z.number().int(),
  
  currency: z.string().length(3).default('EUR'),
  generatedAt: z.string().datetime(),
});

// Export types
export type Invoice = z.infer<typeof InvoiceSchema>;
export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;
export type InvoiceFilter = z.infer<typeof InvoiceFilterSchema>;
export type InvoiceStatus = z.infer<typeof InvoiceStatusSchema>;

export type Payment = z.infer<typeof PaymentSchema>;
export type CreatePayment = z.infer<typeof CreatePaymentSchema>;
export type UpdatePayment = z.infer<typeof UpdatePaymentSchema>;
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>;

export type Expense = z.infer<typeof ExpenseSchema>;
export type CreateExpense = z.infer<typeof CreateExpenseSchema>;
export type UpdateExpense = z.infer<typeof UpdateExpenseSchema>;

export type FinancialSummary = z.infer<typeof FinancialSummarySchema>;