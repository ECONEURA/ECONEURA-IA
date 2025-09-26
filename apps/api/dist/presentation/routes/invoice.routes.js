import { Router } from 'express';
import { z } from 'zod';

import { validateRequest, authenticate, authorize } from '../middleware/base.middleware.js';
export const createInvoiceRoutes = (invoiceController) => {
    const router = Router();
    router.post('/', authenticate, authorize(['invoice:create']), validateRequest({
        body: z.object({
            organizationId: z.string().uuid(),
            invoiceNumber: z.string().min(1).max(100),
            type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt']),
            status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']),
            paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']),
            companyId: z.string().uuid(),
            contactId: z.string().uuid().optional(),
            issueDate: z.coerce.date(),
            dueDate: z.coerce.date(),
            paidDate: z.coerce.date().optional(),
            items: z.array(z.object({
                productId: z.string().uuid().optional(),
                description: z.string().min(1).max(500),
                quantity: z.number().min(0.01),
                unitPrice: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }),
                totalPrice: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }),
                taxRate: z.number().min(0).max(100).optional(),
                taxAmount: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                discountRate: z.number().min(0).max(100).optional(),
                discountAmount: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                notes: z.string().max(500).optional()
            })).min(1),
            paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'check', 'paypal', 'stripe', 'other']).optional(),
            reference: z.string().max(100).optional(),
            notes: z.string().max(1000).optional(),
            settings: z.object({
                currency: z.string().length(3),
                taxInclusive: z.boolean().default(false),
                defaultTaxRate: z.number().min(0).max(100).default(0),
                paymentTerms: z.number().int().min(0).default(30),
                lateFeeRate: z.number().min(0).max(100).optional(),
                lateFeeAmount: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                notes: z.string().max(1000).optional(),
                footer: z.string().max(1000).optional(),
                customFields: z.record(z.any()).default({}),
                tags: z.array(z.string()).default([])
            }),
            attachments: z.array(z.string().url()).optional()
        })
    }), invoiceController.createInvoice.bind(invoiceController));
    router.put('/:id', authenticate, authorize(['invoice:update']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        }),
        body: z.object({
            invoiceNumber: z.string().min(1).max(100).optional(),
            type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt']).optional(),
            status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']).optional(),
            paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
            companyId: z.string().uuid().optional(),
            contactId: z.string().uuid().optional(),
            issueDate: z.coerce.date().optional(),
            dueDate: z.coerce.date().optional(),
            paidDate: z.coerce.date().optional(),
            items: z.array(z.object({
                id: z.string().uuid().optional(),
                productId: z.string().uuid().optional(),
                description: z.string().min(1).max(500),
                quantity: z.number().min(0.01),
                unitPrice: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }),
                totalPrice: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }),
                taxRate: z.number().min(0).max(100).optional(),
                taxAmount: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                discountRate: z.number().min(0).max(100).optional(),
                discountAmount: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                notes: z.string().max(500).optional()
            })).optional(),
            paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'check', 'paypal', 'stripe', 'other']).optional(),
            reference: z.string().max(100).optional(),
            notes: z.string().max(1000).optional(),
            settings: z.object({
                currency: z.string().length(3).optional(),
                taxInclusive: z.boolean().optional(),
                defaultTaxRate: z.number().min(0).max(100).optional(),
                paymentTerms: z.number().int().min(0).optional(),
                lateFeeRate: z.number().min(0).max(100).optional(),
                lateFeeAmount: z.object({
                    amount: z.number().min(0),
                    currency: z.string().length(3)
                }).optional(),
                notes: z.string().max(1000).optional(),
                footer: z.string().max(1000).optional(),
                customFields: z.record(z.any()).optional(),
                tags: z.array(z.string()).optional()
            }).optional(),
            attachments: z.array(z.string().url()).optional()
        })
    }), invoiceController.updateInvoice.bind(invoiceController));
    router.delete('/:id', authenticate, authorize(['invoice:delete']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        })
    }), invoiceController.deleteInvoice.bind(invoiceController));
    router.get('/:id', authenticate, authorize(['invoice:read']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        })
    }), invoiceController.getInvoice.bind(invoiceController));
    router.get('/organizations/:organizationId', authenticate, authorize(['invoice:read']), validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
            search: z.string().max(200).optional(),
            type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt']).optional(),
            status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']).optional(),
            paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
            companyId: z.string().uuid().optional(),
            contactId: z.string().uuid().optional(),
            issueDateFrom: z.coerce.date().optional(),
            issueDateTo: z.coerce.date().optional(),
            dueDateFrom: z.coerce.date().optional(),
            dueDateTo: z.coerce.date().optional(),
            minAmount: z.coerce.number().min(0).optional(),
            maxAmount: z.coerce.number().min(0).optional(),
            isOverdue: z.coerce.boolean().optional(),
            isPaid: z.coerce.boolean().optional(),
            isPartiallyPaid: z.coerce.boolean().optional(),
            isPending: z.coerce.boolean().optional()
        })
    }), invoiceController.getInvoicesByOrganization.bind(invoiceController));
    router.get('/organizations/:organizationId/search', authenticate, authorize(['invoice:read']), validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
            search: z.string().max(200).optional(),
            type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt']).optional(),
            status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']).optional(),
            paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
            companyId: z.string().uuid().optional(),
            contactId: z.string().uuid().optional(),
            issueDateFrom: z.coerce.date().optional(),
            issueDateTo: z.coerce.date().optional(),
            dueDateFrom: z.coerce.date().optional(),
            dueDateTo: z.coerce.date().optional(),
            minAmount: z.coerce.number().min(0).optional(),
            maxAmount: z.coerce.number().min(0).optional(),
            isOverdue: z.coerce.boolean().optional(),
            isPaid: z.coerce.boolean().optional(),
            isPartiallyPaid: z.coerce.boolean().optional(),
            isPending: z.coerce.boolean().optional()
        })
    }), invoiceController.searchInvoices.bind(invoiceController));
    router.get('/organizations/:organizationId/stats', authenticate, authorize(['invoice:read']), validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), invoiceController.getInvoiceStats.bind(invoiceController));
    router.get('/type/:type', authenticate, authorize(['invoice:read']), validateRequest({
        params: z.object({
            type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt'])
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), invoiceController.getInvoicesByType.bind(invoiceController));
    router.get('/status/:status', authenticate, authorize(['invoice:read']), validateRequest({
        params: z.object({
            status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid'])
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), invoiceController.getInvoicesByStatus.bind(invoiceController));
    router.get('/payment-status/:paymentStatus', authenticate, authorize(['invoice:read']), validateRequest({
        params: z.object({
            paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled'])
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), invoiceController.getInvoicesByPaymentStatus.bind(invoiceController));
    router.get('/company/:companyId', authenticate, authorize(['invoice:read']), validateRequest({
        params: z.object({
            companyId: z.string().uuid()
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), invoiceController.getInvoicesByCompany.bind(invoiceController));
    router.get('/overdue', authenticate, authorize(['invoice:read']), validateRequest({
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), invoiceController.getOverdueInvoices.bind(invoiceController));
    router.get('/due-soon/:days', authenticate, authorize(['invoice:read']), validateRequest({
        params: z.object({
            days: z.coerce.number().int().min(1).max(365)
        }),
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), invoiceController.getInvoicesDueSoon.bind(invoiceController));
    router.post('/:id/payments', authenticate, authorize(['invoice:update']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        }),
        body: z.object({
            amount: z.object({
                amount: z.number().min(0),
                currency: z.string().length(3)
            }),
            paymentMethod: z.enum(['cash', 'credit_card', 'bank_transfer', 'check', 'paypal', 'stripe', 'other']),
            paidDate: z.coerce.date().optional(),
            reference: z.string().max(100).optional(),
            notes: z.string().max(500).optional()
        })
    }), invoiceController.recordPayment.bind(invoiceController));
    router.post('/:id/discounts', authenticate, authorize(['invoice:update']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        }),
        body: z.object({
            discountAmount: z.object({
                amount: z.number().min(0),
                currency: z.string().length(3)
            }),
            reason: z.string().max(200).optional()
        })
    }), invoiceController.applyDiscount.bind(invoiceController));
    router.put('/bulk-update', authenticate, authorize(['invoice:update']), validateRequest({
        body: z.object({
            ids: z.array(z.string().uuid()).min(1),
            updates: z.object({
                status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']).optional(),
                paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
                tags: z.array(z.string()).optional()
            })
        })
    }), invoiceController.bulkUpdateInvoices.bind(invoiceController));
    router.delete('/bulk-delete', authenticate, authorize(['invoice:delete']), validateRequest({
        body: z.object({
            ids: z.array(z.string().uuid()).min(1)
        })
    }), invoiceController.bulkDeleteInvoices.bind(invoiceController));
    return router;
};
//# sourceMappingURL=invoice.routes.js.map