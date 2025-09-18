import { z } from 'zod';
export const InvoiceSchema = z.object({
    id: z.string().uuid().optional(),
    invoiceNumber: z.string().min(1),
    type: z.enum(['invoice', 'credit_note', 'debit_note']).default('invoice'),
    status: z.enum(['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled']).default('draft'),
    entityType: z.enum(['company', 'contact']),
    entityId: z.string().uuid(),
    issueDate: z.string().datetime(),
    dueDate: z.string().datetime(),
    currency: z.string().default('EUR'),
    subtotal: z.number().min(0),
    taxAmount: z.number().min(0).default(0),
    totalAmount: z.number().min(0),
    paidAmount: z.number().min(0).default(0),
    balanceDue: z.number().min(0),
    taxRate: z.number().min(0).max(100).default(21),
    notes: z.string().optional(),
    terms: z.string().optional(),
    lineItems: z.array(z.object({
        id: z.string().uuid().optional(),
        description: z.string().min(1),
        quantity: z.number().positive(),
        unitPrice: z.number().min(0),
        total: z.number().min(0),
        taxRate: z.number().min(0).max(100).default(21)
    })),
    orgId: z.string(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
});
export const CreateInvoiceSchema = InvoiceSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateInvoiceSchema = InvoiceSchema.partial().omit({ id: true, orgId: true });
export const PaymentSchema = z.object({
    id: z.string().uuid().optional(),
    invoiceId: z.string().uuid(),
    amount: z.number().positive(),
    currency: z.string().default('EUR'),
    method: z.enum(['cash', 'bank_transfer', 'credit_card', 'paypal', 'stripe', 'sepa']),
    reference: z.string().optional(),
    transactionId: z.string().optional(),
    status: z.enum(['pending', 'completed', 'failed', 'cancelled']).default('pending'),
    processedAt: z.string().datetime().optional(),
    metadata: z.record(z.any()).optional(),
    orgId: z.string(),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
});
export const CreatePaymentSchema = PaymentSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const SEPATransactionSchema = z.object({
    id: z.string().optional(),
    messageId: z.string().optional(),
    accountId: z.string(),
    amount: z.number(),
    currency: z.string().default('EUR'),
    valueDate: z.string().datetime(),
    bookingDate: z.string().datetime().optional(),
    creditorName: z.string().optional(),
    creditorIBAN: z.string().optional(),
    debtorName: z.string().optional(),
    debtorIBAN: z.string().optional(),
    remittanceInfo: z.string().optional(),
    endToEndId: z.string().optional(),
    mandateId: z.string().optional(),
    creditorId: z.string().optional(),
    reasonCode: z.string().optional(),
    status: z.enum(['pending', 'processed', 'rejected', 'returned']).default('pending'),
    orgId: z.string(),
    createdAt: z.string().datetime().optional()
});
export const SEPAUploadResultSchema = z.object({
    fileId: z.string(),
    fileName: z.string(),
    format: z.enum(['CAMT', 'MT940']),
    transactionsCount: z.number().min(0),
    processedCount: z.number().min(0),
    errorsCount: z.number().min(0),
    status: z.enum(['processing', 'completed', 'failed']),
    errors: z.array(z.string()).default([]),
    createdAt: z.string().datetime(),
    transactions: z.array(SEPATransactionSchema).optional()
});
export const BudgetSchema = z.object({
    id: z.string().uuid().optional(),
    organizationId: z.string(),
    name: z.string().min(1),
    description: z.string().optional(),
    amount: z.number().positive(),
    currency: z.string().default('EUR'),
    period: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']).default('monthly'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime().optional(),
    categories: z.array(z.string()).default([]),
    alertThreshold: z.number().min(0).max(100).default(80),
    criticalThreshold: z.number().min(0).max(100).default(95),
    isActive: z.boolean().default(true),
    notifications: z.object({
        email: z.boolean().default(true),
        sms: z.boolean().default(false),
        teams: z.boolean().default(true),
        slack: z.boolean().default(false)
    }).default({}),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional()
});
export const CreateBudgetSchema = BudgetSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const UpdateBudgetSchema = BudgetSchema.partial().omit({ id: true, organizationId: true });
//# sourceMappingURL=finance.js.map