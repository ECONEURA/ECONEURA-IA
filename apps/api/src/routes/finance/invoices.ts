import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { InvoiceSchema } from '@econeura/shared/schemas/finance'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/finance/invoices - List invoices
router.get(
  '/',
  authenticateJWT,
  requirePermission('finance:invoices:read'),
  validateRequest({
    query: z.object({
      page: z.string().optional().transform(v => parseInt(v || '1')),
      limit: z.string().optional().transform(v => parseInt(v || '20')),
      search: z.string().optional(),
      status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']).optional(),
      entityType: z.enum(['COMPANY', 'CONTACT', 'SUPPLIER']).optional(),
      entityId: z.string().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      minAmount: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
      maxAmount: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
      sortBy: z.enum(['invoiceNumber', 'issueDate', 'dueDate', 'totalAmount', 'status']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional()
    })
  }),
  async (req, res) => {
    const { 
      page = 1, 
      limit = 20,
      search,
      status,
      entityType,
      entityId,
      fromDate,
      toDate,
      minAmount,
      maxAmount,
      sortBy = 'issueDate',
      sortOrder = 'desc'
    } = req.query
    
    const offset = (page - 1) * limit

    const where = {
      orgId: req.user.organizationId,
      ...(search && {
        OR: [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(status && { status }),
      ...(entityType && { entityType }),
      ...(entityId && { entityId }),
      ...(fromDate && { issueDate: { gte: new Date(fromDate) } }),
      ...(toDate && { issueDate: { lte: new Date(toDate) } }),
      ...(minAmount !== undefined && { totalAmount: { gte: minAmount } }),
      ...(maxAmount !== undefined && { totalAmount: { lte: maxAmount } })
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          items: true,
          payments: {
            where: { status: 'COMPLETED' }
          },
          _count: {
            select: {
              items: true,
              payments: true
            }
          }
        }
      }),
      prisma.invoice.count({ where })
    ])

    // Calculate metrics
    const metrics = await prisma.invoice.groupBy({
      by: ['status'],
      where: {
        orgId: req.user.organizationId
      },
      _sum: {
        totalAmount: true
      },
      _count: {
        id: true
      }
    })

    // Calculate overdue invoices
    const now = new Date()
    const overdueInvoices = await prisma.invoice.count({
      where: {
        orgId: req.user.organizationId,
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: now }
      }
    })

    const overdueAmount = await prisma.invoice.aggregate({
      where: {
        orgId: req.user.organizationId,
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
        dueDate: { lt: now }
      },
      _sum: {
        totalAmount: true
      }
    })

    res.json({
      data: invoices.map(invoice => ({
        ...invoice,
        paidAmount: invoice.payments.reduce((sum, p) => sum + p.amount, 0),
        remainingAmount: invoice.totalAmount - invoice.payments.reduce((sum, p) => sum + p.amount, 0),
        isOverdue: invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && new Date(invoice.dueDate) < now
      })),
      metrics: {
        byStatus: metrics,
        overdue: {
          count: overdueInvoices,
          amount: overdueAmount._sum.totalAmount || 0
        }
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  }
)

// GET /api/v1/finance/invoices/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('finance:invoices:read'),
  async (req, res) => {
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: req.params.id,
        orgId: req.user.organizationId
      },
      include: {
        company: true,
        contact: true,
        supplier: true,
        items: {
          include: {
            product: {
              select: {
                id: true,
                sku: true,
                name: true
              }
            }
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
        submittedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!invoice) {
      return res.status(404).json({
        error: 'Invoice not found'
      })
    }

    const paidAmount = invoice.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0)

    res.json({
      ...invoice,
      paidAmount,
      remainingAmount: invoice.totalAmount - paidAmount,
      isOverdue: invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && new Date(invoice.dueDate) < new Date()
    })
  }
)

// POST /api/v1/finance/invoices
router.post(
  '/',
  authenticateJWT,
  requirePermission('finance:invoices:write'),
  validateRequest({
    body: InvoiceSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true })
      .extend({
        items: z.array(z.object({
          productId: z.string().optional(),
          description: z.string(),
          quantity: z.number().positive(),
          unitPrice: z.number().positive(),
          taxRate: z.number().min(0).max(100).optional()
        }))
      })
  }),
  async (req, res) => {
    try {
      // Generate invoice number if not provided
      let invoiceNumber = req.body.invoiceNumber
      if (!invoiceNumber) {
        const year = new Date().getFullYear()
        const count = await prisma.invoice.count({
          where: {
            orgId: req.user.organizationId,
            invoiceNumber: { startsWith: `INV-${year}-` }
          }
        })
        invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`
      }

      // Check for duplicate invoice number
      const existing = await prisma.invoice.findFirst({
        where: {
          orgId: req.user.organizationId,
          invoiceNumber
        }
      })

      if (existing) {
        return res.status(400).json({
          error: 'Invoice number already exists'
        })
      }

      // Calculate totals
      let subtotal = 0
      let taxAmount = 0
      const items = req.body.items || []

      for (const item of items) {
        const lineTotal = item.quantity * item.unitPrice
        const itemTax = lineTotal * ((item.taxRate || req.body.taxRate || 0) / 100)
        subtotal += lineTotal
        taxAmount += itemTax
      }

      const totalAmount = subtotal + taxAmount

      // Create invoice with items
      const invoice = await prisma.invoice.create({
        data: {
          orgId: req.user.organizationId,
          invoiceNumber,
          entityType: req.body.entityType,
          entityId: req.body.entityId,
          status: req.body.status || 'DRAFT',
          issueDate: req.body.issueDate ? new Date(req.body.issueDate) : new Date(),
          dueDate: req.body.dueDate ? new Date(req.body.dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          subtotal,
          taxAmount,
          totalAmount,
          currency: req.body.currency || 'EUR',
          taxRate: req.body.taxRate || 21,
          paymentTerms: req.body.paymentTerms || 30,
          notes: req.body.notes,
          metadata: req.body.metadata,
          submittedByUserId: req.user.id,
          items: {
            create: items.map(item => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              totalPrice: item.quantity * item.unitPrice,
              currency: req.body.currency || 'EUR'
            }))
          }
        },
        include: {
          items: true,
          company: {
            select: {
              id: true,
              name: true
            }
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          supplier: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'CREATE',
          resource: 'invoice',
          resourceId: invoice.id,
          metadata: {
            invoiceNumber,
            totalAmount,
            status: invoice.status
          }
        }
      })

      res.status(201).json(invoice)
    } catch (error) {
      console.error('Error creating invoice:', error)
      res.status(400).json({
        error: 'Failed to create invoice'
      })
    }
  }
)

// PUT /api/v1/finance/invoices/:id
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('finance:invoices:write'),
  validateRequest({
    body: InvoiceSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true }).partial()
  }),
  async (req, res) => {
    try {
      const existing = await prisma.invoice.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!existing) {
        return res.status(404).json({
          error: 'Invoice not found'
        })
      }

      // Don't allow editing paid or cancelled invoices
      if (existing.status === 'PAID' || existing.status === 'CANCELLED') {
        return res.status(400).json({
          error: `Cannot edit ${existing.status.toLowerCase()} invoice`
        })
      }

      const invoice = await prisma.invoice.update({
        where: { id: req.params.id },
        data: {
          ...req.body,
          ...(req.body.issueDate && { issueDate: new Date(req.body.issueDate) }),
          ...(req.body.dueDate && { dueDate: new Date(req.body.dueDate) })
        },
        include: {
          items: true,
          payments: true
        }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'UPDATE',
          resource: 'invoice',
          resourceId: invoice.id,
          metadata: { changes: req.body }
        }
      })

      res.json(invoice)
    } catch (error) {
      console.error('Error updating invoice:', error)
      res.status(400).json({
        error: 'Failed to update invoice'
      })
    }
  }
)

// POST /api/v1/finance/invoices/:id/send
router.post(
  '/:id/send',
  authenticateJWT,
  requirePermission('finance:invoices:write'),
  async (req, res) => {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!invoice) {
        return res.status(404).json({
          error: 'Invoice not found'
        })
      }

      if (invoice.status !== 'DRAFT') {
        return res.status(400).json({
          error: 'Only draft invoices can be sent'
        })
      }

      const updated = await prisma.invoice.update({
        where: { id: req.params.id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      })

      // TODO: Send email notification

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'UPDATE',
          resource: 'invoice',
          resourceId: invoice.id,
          metadata: { 
            action: 'sent',
            previousStatus: invoice.status,
            newStatus: 'SENT'
          }
        }
      })

      res.json(updated)
    } catch (error) {
      console.error('Error sending invoice:', error)
      res.status(400).json({
        error: 'Failed to send invoice'
      })
    }
  }
)

// POST /api/v1/finance/invoices/:id/cancel
router.post(
  '/:id/cancel',
  authenticateJWT,
  requirePermission('finance:invoices:delete'),
  validateRequest({
    body: z.object({
      reason: z.string()
    })
  }),
  async (req, res) => {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        },
        include: {
          payments: {
            where: { status: 'COMPLETED' }
          }
        }
      })

      if (!invoice) {
        return res.status(404).json({
          error: 'Invoice not found'
        })
      }

      if (invoice.status === 'PAID') {
        return res.status(400).json({
          error: 'Cannot cancel paid invoice'
        })
      }

      if (invoice.payments.length > 0) {
        return res.status(400).json({
          error: 'Cannot cancel invoice with payments. Please refund payments first.'
        })
      }

      const updated = await prisma.invoice.update({
        where: { id: req.params.id },
        data: {
          status: 'CANCELLED',
          metadata: {
            ...invoice.metadata,
            cancellation: {
              reason: req.body.reason,
              cancelledBy: req.user.id,
              cancelledAt: new Date()
            }
          }
        }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'UPDATE',
          resource: 'invoice',
          resourceId: invoice.id,
          metadata: {
            action: 'cancelled',
            reason: req.body.reason,
            previousStatus: invoice.status
          }
        }
      })

      res.json(updated)
    } catch (error) {
      console.error('Error cancelling invoice:', error)
      res.status(400).json({
        error: 'Failed to cancel invoice'
      })
    }
  }
)

export { router as invoicesRouter }