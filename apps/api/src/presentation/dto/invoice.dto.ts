import { z } from 'zod';

import {
  UUIDSchema,
  OrganizationIdSchema,
  NotesSchema,
  TagsSchema,
  CustomFieldsSchema,
  BaseSearchQuerySchema,
  IdParamSchema,
  OrganizationIdParamSchema,
  ListResponseSchema,
  BaseStatsSchema,
  BulkDeleteSchema,
  MoneySchema,
  DateRangeSchema
} from './base.dto.js';

// ============================================================================
// INVOICE DTOs
// ============================================================================

// ========================================================================
// REQUEST DTOs
// ========================================================================

export const CreateInvoiceRequestSchema = z.object({
  organizationId: OrganizationIdSchema,
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(100, 'Invoice number cannot exceed 100 characters'),
  type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt'], {
    errorMap: () => ({ message: 'Type must be one of: invoice, credit_note, debit_note, proforma, quote, receipt' })
  }),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid'], {
    errorMap: () => ({ message: 'Status must be one of: draft, sent, paid, overdue, cancelled, refunded, partially_paid' })
  }),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled'], {
    errorMap: () => ({ message: 'Payment status must be one of: pending, paid, partial, overdue, cancelled' })
  }),
  companyId: UUIDSchema,
  contactId: UUIDSchema.optional(),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  paidDate: z.coerce.date().optional(),
  items: z.array(z.object({
    productId: UUIDSchema.optional(),
    description: z.string().min(1, 'Item description is required').max(500, 'Description cannot exceed 500 characters'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: MoneySchema,
    totalPrice: MoneySchema,
    taxRate: z.number().min(0, 'Tax rate must be non-negative').max(100, 'Tax rate cannot exceed 100%').optional(),
    taxAmount: MoneySchema.optional(),
    discountRate: z.number().min(0, 'Discount rate must be non-negative').max(100, 'Discount rate cannot exceed 100%').optional(),
    discountAmount: MoneySchema.optional(),
    notes: z.string().max(500, 'Item notes cannot exceed 500 characters').optional()
  })).min(1, 'Invoice must have at least one item'),
  paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'check', 'paypal', 'stripe', 'other']).optional(),
  reference: z.string().max(100, 'Reference cannot exceed 100 characters').optional(),
  notes: NotesSchema,
  settings: z.object({
    currency: z.string().length(3, 'Currency must be 3 characters'),
    taxInclusive: z.boolean().default(false),
    defaultTaxRate: z.number().min(0, 'Default tax rate must be non-negative').max(100, 'Default tax rate cannot exceed 100%').default(0),
    paymentTerms: z.number().int().min(0, 'Payment terms must be non-negative').default(30),
    lateFeeRate: z.number().min(0, 'Late fee rate must be non-negative').max(100, 'Late fee rate cannot exceed 100%').optional(),
    lateFeeAmount: MoneySchema.optional(),
    notes: z.string().max(1000, 'Settings notes cannot exceed 1000 characters').optional(),
    footer: z.string().max(1000, 'Footer cannot exceed 1000 characters').optional(),
    customFields: CustomFieldsSchema,
    tags: TagsSchema
  }),
  attachments: z.array(z.string().url('Invalid attachment URL')).optional()
}).refine(
  (data) => data.issueDate <= data.dueDate,
  {
    message: 'Issue date must be before or equal to due date',
    path: ['issueDate']
  }
);

export const UpdateInvoiceRequestSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required').max(100, 'Invoice number cannot exceed 100 characters').optional(),
  type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt']).optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
  companyId: UUIDSchema.optional(),
  contactId: UUIDSchema.optional(),
  issueDate: z.coerce.date().optional(),
  dueDate: z.coerce.date().optional(),
  paidDate: z.coerce.date().optional(),
  items: z.array(z.object({
    id: UUIDSchema.optional(),
    productId: UUIDSchema.optional(),
    description: z.string().min(1, 'Item description is required').max(500, 'Description cannot exceed 500 characters'),
    quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
    unitPrice: MoneySchema,
    totalPrice: MoneySchema,
    taxRate: z.number().min(0, 'Tax rate must be non-negative').max(100, 'Tax rate cannot exceed 100%').optional(),
    taxAmount: MoneySchema.optional(),
    discountRate: z.number().min(0, 'Discount rate must be non-negative').max(100, 'Discount rate cannot exceed 100%').optional(),
    discountAmount: MoneySchema.optional(),
    notes: z.string().max(500, 'Item notes cannot exceed 500 characters').optional()
  })).optional(),
  paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'check', 'paypal', 'stripe', 'other']).optional(),
  reference: z.string().max(100, 'Reference cannot exceed 100 characters').optional(),
  notes: NotesSchema.optional(),
  settings: z.object({
    currency: z.string().length(3, 'Currency must be 3 characters').optional(),
    taxInclusive: z.boolean().optional(),
    defaultTaxRate: z.number().min(0, 'Default tax rate must be non-negative').max(100, 'Default tax rate cannot exceed 100%').optional(),
    paymentTerms: z.number().int().min(0, 'Payment terms must be non-negative').optional(),
    lateFeeRate: z.number().min(0, 'Late fee rate must be non-negative').max(100, 'Late fee rate cannot exceed 100%').optional(),
    lateFeeAmount: MoneySchema.optional(),
    notes: z.string().max(1000, 'Settings notes cannot exceed 1000 characters').optional(),
    footer: z.string().max(1000, 'Footer cannot exceed 1000 characters').optional(),
    customFields: CustomFieldsSchema.optional(),
    tags: TagsSchema.optional()
  }).optional(),
  attachments: z.array(z.string().url('Invalid attachment URL')).optional()
});

// ========================================================================
// PARAMETER DTOs
// ========================================================================

export const InvoiceIdParamSchema = IdParamSchema;
export const InvoiceOrganizationIdParamSchema = OrganizationIdParamSchema;

// ========================================================================
// QUERY DTOs
// ========================================================================

export const InvoiceSearchQuerySchema = BaseSearchQuerySchema.extend({
  type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt']).optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']).optional(),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
  companyId: UUIDSchema.optional(),
  contactId: UUIDSchema.optional(),
  issueDateFrom: z.coerce.date().optional(),
  issueDateTo: z.coerce.date().optional(),
  dueDateFrom: z.coerce.date().optional(),
  dueDateTo: z.coerce.date().optional(),
  minAmount: z.coerce.number().min(0, 'Minimum amount must be non-negative').optional(),
  maxAmount: z.coerce.number().min(0, 'Maximum amount must be non-negative').optional(),
  isOverdue: z.coerce.boolean().optional(),
  isPaid: z.coerce.boolean().optional(),
  isPartiallyPaid: z.coerce.boolean().optional(),
  isPending: z.coerce.boolean().optional()
});

export const InvoiceBulkUpdateSchema = z.object({
  ids: z.array(UUIDSchema).min(1, 'At least one invoice ID is required'),
  updates: z.object({
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']).optional(),
    paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
    tags: z.array(z.string()).optional()
  })
});

export const InvoiceBulkDeleteSchema = BulkDeleteSchema;

// ========================================================================
// RESPONSE DTOs
// ========================================================================

export const InvoiceItemResponseSchema = z.object({
  id: z.string(),
  productId: z.string().optional(),
  description: z.string(),
  quantity: z.number(),
  unitPrice: MoneySchema,
  totalPrice: MoneySchema,
  taxRate: z.number().optional(),
  taxAmount: MoneySchema.optional(),
  discountRate: z.number().optional(),
  discountAmount: MoneySchema.optional(),
  notes: z.string().optional()
});

export const InvoiceResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  invoiceNumber: z.string(),
  type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt']),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']),
  paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']),
  companyId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  issueDate: z.date(),
  dueDate: z.date(),
  paidDate: z.date().optional(),
  subtotal: MoneySchema,
  taxAmount: MoneySchema,
  discountAmount: MoneySchema,
  totalAmount: MoneySchema,
  paidAmount: MoneySchema,
  balanceAmount: MoneySchema,
  items: z.array(InvoiceItemResponseSchema),
  paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'check', 'paypal', 'stripe', 'other']).optional(),
  reference: z.string().optional(),
  notes: z.string().optional(),
  settings: z.object({
    currency: z.string(),
    taxInclusive: z.boolean(),
    defaultTaxRate: z.number(),
    paymentTerms: z.number(),
    lateFeeRate: z.number().optional(),
    lateFeeAmount: MoneySchema.optional(),
    notes: z.string().optional(),
    footer: z.string().optional(),
    customFields: z.record(z.any()),
    tags: z.array(z.string())
  }),
  attachments: z.array(z.string()).optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const InvoiceListResponseSchema = ListResponseSchema.extend({
  data: z.array(InvoiceResponseSchema)
});

export const InvoiceStatsResponseSchema = BaseStatsSchema.extend({
  byType: z.record(z.number()),
  byStatus: z.record(z.number()),
  byPaymentStatus: z.record(z.number()),
  totalAmount: z.number(),
  paidAmount: z.number(),
  outstandingAmount: z.number(),
  overdueAmount: z.number(),
  averageAmount: z.number(),
  averagePaymentTime: z.number(),
  overdueCount: z.number(),
  paidCount: z.number(),
  pendingCount: z.number(),
  partiallyPaidCount: z.number()
});

// ========================================================================
// PAYMENT DTOs
// ========================================================================

export const RecordPaymentRequestSchema = z.object({
  amount: MoneySchema,
  paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'check', 'paypal', 'stripe', 'other']),
  paidDate: z.coerce.date().optional(),
  reference: z.string().max(100, 'Payment reference cannot exceed 100 characters').optional(),
  notes: z.string().max(500, 'Payment notes cannot exceed 500 characters').optional()
});

export const ApplyDiscountRequestSchema = z.object({
  discountAmount: MoneySchema,
  reason: z.string().max(200, 'Discount reason cannot exceed 200 characters').optional()
});

// ========================================================================
// REPORT DTOs
// ========================================================================

export const InvoiceReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema,
  filters: z.object({
    type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt']).optional(),
    status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']).optional(),
    paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
    companyId: UUIDSchema.optional(),
    contactId: UUIDSchema.optional(),
    dateRange: DateRangeSchema.optional()
  }).optional()
});

export const PaymentReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
});

export const OverdueReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema
});

// ========================================================================
// TYPE EXPORTS
// ========================================================================

export type CreateInvoiceRequest = z.infer<typeof CreateInvoiceRequestSchema>;
export type UpdateInvoiceRequest = z.infer<typeof UpdateInvoiceRequestSchema>;
export type InvoiceIdParam = z.infer<typeof InvoiceIdParamSchema>;
export type InvoiceOrganizationIdParam = z.infer<typeof InvoiceOrganizationIdParamSchema>;
export type InvoiceSearchQuery = z.infer<typeof InvoiceSearchQuerySchema>;
export type InvoiceBulkUpdate = z.infer<typeof InvoiceBulkUpdateSchema>;
export type InvoiceBulkDelete = z.infer<typeof InvoiceBulkDeleteSchema>;
export type InvoiceResponse = z.infer<typeof InvoiceResponseSchema>;
export type InvoiceListResponse = z.infer<typeof InvoiceListResponseSchema>;
export type InvoiceStatsResponse = z.infer<typeof InvoiceStatsResponseSchema>;
export type InvoiceItemResponse = z.infer<typeof InvoiceItemResponseSchema>;
export type RecordPaymentRequest = z.infer<typeof RecordPaymentRequestSchema>;
export type ApplyDiscountRequest = z.infer<typeof ApplyDiscountRequestSchema>;
export type InvoiceReportRequest = z.infer<typeof InvoiceReportRequestSchema>;
export type PaymentReportRequest = z.infer<typeof PaymentReportRequestSchema>;
export type OverdueReportRequest = z.infer<typeof OverdueReportRequestSchema>;
