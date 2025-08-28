import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { InvoiceSchema } from '@econeura/shared/schemas/finance'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/finance/invoices
router.get(
  '/',
  authenticateJWT,
  requirePermission('finance:invoices:read'),
  validateRequest({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
      search: z.string().optional(),
      status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']).optional(),
      entityType: z.enum(['COMPANY', 'CONTACT', 'SUPPLIER']).optional(),
      entityId: z.string().uuid().optional(),
      fromDate: z.string().optional(),
      toDate: z.string().optional(),
      overdue: z.string().transform(val => val === 'true').optional(),
      sortBy: z.enum(['invoiceNumber', 'issueDate', 'dueDate', 'totalAmount', 'status']).default('issueDate'),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
  }),
  async (req, res) => {
    try {
      const { 
        page, limit, search, status, entityType, entityId, 
        fromDate, toDate, overdue, sortBy, sortOrder 
      } = req.query as any
      const offset = (page - 1) * limit

      const where: any = {
        orgId: req.user!.organizationId,
        deletedAt: null
      }

      if (search) {
        where.OR = [
          { invoiceNumber: { contains: search, mode: 'insensitive' } },
          { notes: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (status) where.status = status
      if (entityType) where.entityType = entityType
      if (entityId) where.entityId = entityId

      if (fromDate || toDate) {
        where.issueDate = {}
        if (fromDate) where.issueDate.gte = new Date(fromDate)
        if (toDate) where.issueDate.lte = new Date(toDate)
      }

      if (overdue === true) {
        where.status = { in: ['SENT', 'PARTIALLY_PAID'] }
        where.dueDate = { lt: new Date() }
      }

      const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            company: entityType === 'COMPANY' ? true : undefined,
            contact: entityType === 'CONTACT' ? true : undefined,
            supplier: entityType === 'SUPPLIER' ? true : undefined,
            items: true,
            payments: {
              where: { status: 'COMPLETED' }
            }
          }
        }),
        prisma.invoice.count({ where })
      ])

      // Calculate paid amounts
      const enrichedInvoices = invoices.map(invoice => {
        const paidAmount = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
        const remainingAmount = invoice.totalAmount - paidAmount
        const isOverdue = invoice.status !== 'PAID' && invoice.dueDate < new Date()
        
        return {
          ...invoice,
          paidAmount,
          remainingAmount,
          isOverdue
        }
      })

      res.json({
        data: enrichedInvoices,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching invoices:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/v1/finance/invoices/summary
router.get(
  '/summary',
  authenticateJWT,
  requirePermission('finance:invoices:read'),
  async (req, res) => {
    try {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfYear = new Date(now.getFullYear(), 0, 1)

      const [total, paid, overdue, thisMonth, thisYear] = await Promise.all([
        // Total invoices
        prisma.invoice.aggregate({
          where: {
            orgId: req.user!.organizationId,
            deletedAt: null,
            status: { not: 'CANCELLED' }
          },
          _sum: { totalAmount: true },
          _count: true
        }),
        // Paid invoices
        prisma.invoice.aggregate({
          where: {
            orgId: req.user!.organizationId,
            deletedAt: null,
            status: 'PAID'
          },
          _sum: { totalAmount: true },
          _count: true
        }),
        // Overdue invoices
        prisma.invoice.aggregate({
          where: {
            orgId: req.user!.organizationId,
            deletedAt: null,
            status: { in: ['SENT', 'PARTIALLY_PAID'] },
            dueDate: { lt: now }
          },
          _sum: { totalAmount: true },
          _count: true
        }),
        // This month
        prisma.invoice.aggregate({
          where: {
            orgId: req.user!.organizationId,
            deletedAt: null,
            issueDate: { gte: startOfMonth },
            status: { not: 'CANCELLED' }
          },
          _sum: { totalAmount: true },
          _count: true
        }),
        // This year
        prisma.invoice.aggregate({
          where: {
            orgId: req.user!.organizationId,
            deletedAt: null,
            issueDate: { gte: startOfYear },
            status: { not: 'CANCELLED' }
          },
          _sum: { totalAmount: true },
          _count: true
        })
      ])

      res.json({
        total: {
          count: total._count,
          amount: total._sum.totalAmount || 0
        },
        paid: {
          count: paid._count,
          amount: paid._sum.totalAmount || 0
        },
        overdue: {
          count: overdue._count,
          amount: overdue._sum.totalAmount || 0
        },
        thisMonth: {
          count: thisMonth._count,
          amount: thisMonth._sum.totalAmount || 0
        },
        thisYear: {
          count: thisYear._count,
          amount: thisYear._sum.totalAmount || 0
        }
      })
    } catch (error) {
      console.error('Error fetching invoice summary:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/v1/finance/invoices/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('finance:invoices:read'),
  async (req, res) => {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        },
        include: {
          company: true,
          contact: true,
          supplier: true,
          items: {
            include: {
              product: true
            }
          },
          payments: {
            orderBy: { createdAt: 'desc' }
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
        return res.status(404).json({ error: 'Invoice not found' })
      }

      // Calculate payment status
      const paidAmount = invoice.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0)
      const remainingAmount = invoice.totalAmount - paidAmount
      const isOverdue = invoice.status !== 'PAID' && invoice.dueDate < new Date()

      res.json({
        ...invoice,
        paidAmount,
        remainingAmount,
        isOverdue
      })
    } catch (error) {
      console.error('Error fetching invoice:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/v1/finance/invoices
router.post(
  '/',
  authenticateJWT,
  requirePermission('finance:invoices:write'),
  validateRequest({
    body: InvoiceSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true })
  }),
  async (req, res) => {
    try {
      // Generate invoice number
      const year = new Date().getFullYear()
      const lastInvoice = await prisma.invoice.findFirst({
        where: {
          orgId: req.user!.organizationId,
          invoiceNumber: { startsWith: `INV-${year}-` }
        },
        orderBy: { invoiceNumber: 'desc' }
      })

      let nextNumber = 1
      if (lastInvoice) {
        const lastNumber = parseInt(lastInvoice.invoiceNumber.split('-')[2])
        nextNumber = lastNumber + 1
      }

      const invoiceNumber = `INV-${year}-${String(nextNumber).padStart(4, '0')}`

      // Create invoice with items
      const { items, ...invoiceData } = req.body
      
      const invoice = await prisma.invoice.create({
        data: {
          ...invoiceData,
          invoiceNumber,
          orgId: req.user!.organizationId,
          submittedByUserId: req.user!.id,
          items: items ? {
            create: items
          } : undefined
        },
        include: {
          items: true
        }
      })

      // Calculate totals if items were provided
      if (items && items.length > 0) {
        const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
        const taxAmount = subtotal * (invoice.taxRate / 100)
        const totalAmount = subtotal + taxAmount

        await prisma.invoice.update({
          where: { id: invoice.id },
          data: { subtotal, taxAmount, totalAmount }
        })
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'CREATE',
          resource: 'invoice',
          resourceId: invoice.id,
          metadata: { 
            invoiceNumber: invoice.invoiceNumber,
            totalAmount: invoice.totalAmount
          }
        }
      })

      res.status(201).json(invoice)
    } catch (error) {
      console.error('Error creating invoice:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/v1/finance/invoices/:id/status
router.put(
  '/:id/status',
  authenticateJWT,
  requirePermission('finance:invoices:write'),
  validateRequest({
    body: z.object({
      status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']),
      notes: z.string().optional()
    })
  }),
  async (req, res) => {
    try {
      const existing = await prisma.invoice.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Invoice not found' })
      }

      const invoice = await prisma.invoice.update({
        where: { id: req.params.id },
        data: {
          status: req.body.status,
          notes: req.body.notes
        }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'invoice',
          resourceId: invoice.id,
          metadata: { 
            statusChange: `${existing.status} -> ${req.body.status}`,
            notes: req.body.notes
          }
        }
      })

      res.json(invoice)
    } catch (error) {
      console.error('Error updating invoice status:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export { router as invoicesRouter }