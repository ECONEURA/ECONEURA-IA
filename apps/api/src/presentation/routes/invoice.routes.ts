import { Router } from 'express';
import { z } from 'zod';

import { InvoiceController } from '../controllers/invoice.controller.js';
import { validateRequest, authenticate, authorize } from '../middleware/base.middleware.js';

// ============================================================================
// INVOICE ROUTES
// ============================================================================

export const createInvoiceRoutes = (invoiceController: InvoiceController): Router => {
  const router = Router();

  // ========================================================================
  // INVOICE MANAGEMENT ROUTES
  // ========================================================================

  // POST /invoices - Create invoice
  router.post('/',
    authenticate,
    authorize(['invoice:create']),
    validateRequest({
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
    }),
    invoiceController.createInvoice.bind(invoiceController)
  );

  // PUT /invoices/:id - Update invoice
  router.put('/:id',
    authenticate,
    authorize(['invoice:update']),
    validateRequest({
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
    }),
    invoiceController.updateInvoice.bind(invoiceController)
  );

  // DELETE /invoices/:id - Delete invoice
  router.delete('/:id',
    authenticate,
    authorize(['invoice:delete']),
    validateRequest({
      params: z.object({
        id: z.string().uuid()
      })
    }),
    invoiceController.deleteInvoice.bind(invoiceController)
  );

  // GET /invoices/:id - Get invoice by ID
  router.get('/:id',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
      params: z.object({
        id: z.string().uuid()
      })
    }),
    invoiceController.getInvoice.bind(invoiceController)
  );

  // ========================================================================
  // ORGANIZATION-SPECIFIC ROUTES
  // ========================================================================

  // GET /organizations/:organizationId/invoices - Get invoices by organization
  router.get('/organizations/:organizationId',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
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
    }),
    invoiceController.getInvoicesByOrganization.bind(invoiceController)
  );

  // GET /organizations/:organizationId/invoices/search - Search invoices
  router.get('/organizations/:organizationId/search',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
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
    }),
    invoiceController.searchInvoices.bind(invoiceController)
  );

  // GET /organizations/:organizationId/invoices/stats - Get invoice statistics
  router.get('/organizations/:organizationId/stats',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
      params: z.object({
        organizationId: z.string().uuid()
      })
    }),
    invoiceController.getInvoiceStats.bind(invoiceController)
  );

  // ========================================================================
  // QUERY ROUTES
  // ========================================================================

  // GET /invoices/type/:type - Get invoices by type
  router.get('/type/:type',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
      params: z.object({
        type: z.enum(['invoice', 'credit_note', 'debit_note', 'proforma', 'quote', 'receipt'])
      }),
      query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    invoiceController.getInvoicesByType.bind(invoiceController)
  );

  // GET /invoices/status/:status - Get invoices by status
  router.get('/status/:status',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
      params: z.object({
        status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid'])
      }),
      query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    invoiceController.getInvoicesByStatus.bind(invoiceController)
  );

  // GET /invoices/payment-status/:paymentStatus - Get invoices by payment status
  router.get('/payment-status/:paymentStatus',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
      params: z.object({
        paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled'])
      }),
      query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    invoiceController.getInvoicesByPaymentStatus.bind(invoiceController)
  );

  // GET /invoices/company/:companyId - Get invoices by company
  router.get('/company/:companyId',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
      params: z.object({
        companyId: z.string().uuid()
      }),
      query: z.object({
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    invoiceController.getInvoicesByCompany.bind(invoiceController)
  );

  // GET /invoices/overdue - Get overdue invoices
  router.get('/overdue',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
      query: z.object({
        organizationId: z.string().uuid(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(20),
        sortBy: z.string().default('createdAt'),
        sortOrder: z.enum(['asc', 'desc']).default('desc')
      })
    }),
    invoiceController.getOverdueInvoices.bind(invoiceController)
  );

  // GET /invoices/due-soon/:days - Get invoices due soon
  router.get('/due-soon/:days',
    authenticate,
    authorize(['invoice:read']),
    validateRequest({
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
    }),
    invoiceController.getInvoicesDueSoon.bind(invoiceController)
  );

  // ========================================================================
  // PAYMENT OPERATIONS
  // ========================================================================

  // POST /invoices/:id/payments - Record payment
  router.post('/:id/payments',
    authenticate,
    authorize(['invoice:update']),
    validateRequest({
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
    }),
    invoiceController.recordPayment.bind(invoiceController)
  );

  // POST /invoices/:id/discounts - Apply discount
  router.post('/:id/discounts',
    authenticate,
    authorize(['invoice:update']),
    validateRequest({
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
    }),
    invoiceController.applyDiscount.bind(invoiceController)
  );

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  // PUT /invoices/bulk-update - Bulk update invoices
  router.put('/bulk-update',
    authenticate,
    authorize(['invoice:update']),
    validateRequest({
      body: z.object({
        ids: z.array(z.string().uuid()).min(1),
        updates: z.object({
          status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded', 'partially_paid']).optional(),
          paymentStatus: z.enum(['pending', 'paid', 'partial', 'overdue', 'cancelled']).optional(),
          tags: z.array(z.string()).optional()
        })
      })
    }),
    invoiceController.bulkUpdateInvoices.bind(invoiceController)
  );

  // DELETE /invoices/bulk-delete - Bulk delete invoices
  router.delete('/bulk-delete',
    authenticate,
    authorize(['invoice:delete']),
    validateRequest({
      body: z.object({
        ids: z.array(z.string().uuid()).min(1)
      })
    }),
    invoiceController.bulkDeleteInvoices.bind(invoiceController)
  );

  return router;
};
