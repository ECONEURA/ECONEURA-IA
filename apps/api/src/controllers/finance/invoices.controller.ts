import { Request, Response } from 'express'
// import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import {
  ApiResponse,
  asyncHandler,
  parsePagination,
  parseFilters,
  handlePrismaError,
  TenantQueryBuilder,
  createAuditLog
} from '../../utils/controller'

const prisma = new PrismaClient()

// Validation schemas
const invoiceItemSchema = z.object({
  productId: z.string().uuid().optional(),
  description: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
  totalPrice: z.number().min(0),
  currency: z.string().default('EUR')
})

const createInvoiceSchema = z.object({
  invoiceNumber: z.string().optional(), // Auto-generate if not provided
  entityType: z.enum(['COMPANY', 'CONTACT', 'SUPPLIER']),
  entityId: z.string().uuid(),
  status: z.enum(['DRAFT', 'SENT', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'CANCELLED']).default('DRAFT'),
  issueDate: z.string().datetime(),
  dueDate: z.string().datetime(),
  currency: z.string().default('EUR'),
  taxRate: z.number().min(0).max(100).default(21),
  paymentTerms: z.number().int().min(0).default(30),
  paymentMethod: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1)
})

const updateInvoiceSchema = createInvoiceSchema.partial().extend({
  items: z.array(invoiceItemSchema).optional()
})

export const invoicesController = {
  // GET /api/v1/finance/invoices
  list: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { page, limit, sortBy, sortOrder } = parsePagination(req.query)
    const filters = parseFilters(req.query, [
      'status', 'entityType', 'entityId', 'dueDate'
    ])

    // Add date range filters
    if (req.query.startDate) {
      filters.issueDate = {
        ...filters.issueDate,
        gte: new Date(req.query.startDate as string)
      }
    }
    if (req.query.endDate) {
      filters.issueDate = {
        ...filters.issueDate,
        lte: new Date(req.query.endDate as string)
      }
    }

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.invoice)
      .filter(filters)
      .search(req.query.search as string, ['invoiceNumber', 'notes'])
      .includeRelations({
        company: {
          select: { id: true, name: true }
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        supplier: {
          select: { id: true, name: true }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            paymentDate: true,
            status: true
          }
        }
      })
      .sort(sortBy!, sortOrder!)
      .paginate(page!, limit!)

    try {
      const { data, total } = await queryBuilder.execute()
      
      // Calculate paid amounts
      const invoicesWithPaidAmounts = data.map((invoice: any) => {
        const paidAmount = invoice.payments
          .filter((p: any) => p.status === 'COMPLETED')
          .reduce((sum: number, p: any) => sum + p.amount, 0)
        
        return {
          ...invoice,
          paidAmount,
          remainingAmount: invoice.totalAmount - paidAmount
        }
      })

      return ApiResponse.paginated(res, invoicesWithPaidAmounts, total, page!, limit!)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/finance/invoices/:id
  get: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { id } = req.params

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.invoice)
      .includeRelations({
        company: true,
        contact: true,
        supplier: true,
        items: {
          include: {
            product: {
              select: { id: true, sku: true, name: true }
            }
          }
        },
        payments: {
          orderBy: { paymentDate: 'desc' }
        },
        submittedBy: {
          select: { id: true, name: true, email: true }
        },
        approvedBy: {
          select: { id: true, name: true, email: true }
        }
      })

    try {
      const invoice = await queryBuilder.findOne(id)
      
      if (!invoice) {
        return ApiResponse.error(res, 'Invoice not found', 404)
      }

      // Calculate paid amount
      const paidAmount = invoice.payments
        .filter((p: any) => p.status === 'COMPLETED')
        .reduce((sum: number, p: any) => sum + p.amount, 0)

      return ApiResponse.success(res, {
        ...invoice,
        paidAmount,
        remainingAmount: invoice.totalAmount - paidAmount,
        isOverdue: invoice.status !== 'PAID' && new Date() > invoice.dueDate
      })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/finance/invoices
  create: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const data = createInvoiceSchema.parse(req.body)

    try {
      // Generate invoice number if not provided
      if (!data.invoiceNumber) {
        const year = new Date().getFullYear()
        const count = await prisma.invoice.count({
          where: {
            orgId,
            invoiceNumber: {
              startsWith: `INV-${year}-`
            }
          }
        })
        data.invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`
      }

      // Verify entity exists and belongs to org
      let entity
      switch (data.entityType) {
        case 'COMPANY':
          entity = await prisma.company.findFirst({
            where: { id: data.entityId, orgId, deletedAt: null }
          })
          break
        case 'CONTACT':
          entity = await prisma.contact.findFirst({
            where: { id: data.entityId, orgId, deletedAt: null }
          })
          break
        case 'SUPPLIER':
          entity = await prisma.supplier.findFirst({
            where: { id: data.entityId, orgId, deletedAt: null }
          })
          break
      }

      if (!entity) {
        return ApiResponse.error(res, `${data.entityType} not found`, 404)
      }

      // Calculate totals
      const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0)
      const taxAmount = subtotal * (data.taxRate / 100)
      const totalAmount = subtotal + taxAmount

      // Create invoice with items
      const invoice = await prisma.invoice.create({
        data: {
          orgId,
          invoiceNumber: data.invoiceNumber,
          entityType: data.entityType,
          entityId: data.entityId,
          status: data.status,
          issueDate: new Date(data.issueDate),
          dueDate: new Date(data.dueDate),
          subtotal,
          taxAmount,
          totalAmount,
          currency: data.currency,
          taxRate: data.taxRate,
          paymentTerms: data.paymentTerms,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          submittedByUserId: userId,
          items: {
            create: data.items
          }
        },
        include: {
          items: true,
          company: data.entityType === 'COMPANY' ? true : undefined,
          contact: data.entityType === 'CONTACT' ? true : undefined,
          supplier: data.entityType === 'SUPPLIER' ? true : undefined
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'CREATE',
        resource: 'invoice',
        resourceId: invoice.id,
        metadata: {
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          entityType: invoice.entityType
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, invoice, 201)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // PUT /api/v1/finance/invoices/:id
  update: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params
    const data = updateInvoiceSchema.parse(req.body)

    try {
      // Check if invoice exists
      const existing = await prisma.invoice.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Invoice not found', 404)
      }

      // Don't allow editing paid invoices
      if (existing.status === 'PAID') {
        return ApiResponse.error(res, 'Cannot edit paid invoices', 400)
      }

      // If items are provided, recalculate totals
      let updateData: any = { ...data }
      if (data.items) {
        const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0)
        const taxRate = data.taxRate ?? existing.taxRate
        const taxAmount = subtotal * (taxRate / 100)
        updateData = {
          ...updateData,
          subtotal,
          taxAmount,
          totalAmount: subtotal + taxAmount
        }

        // Delete existing items and create new ones
        await prisma.invoiceItem.deleteMany({
          where: { invoiceId: id }
        })
      }

      const invoice = await prisma.invoice.update({
        where: { id },
        data: {
          ...updateData,
          issueDate: updateData.issueDate ? new Date(updateData.issueDate) : undefined,
          dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
          items: data.items ? {
            create: data.items
          } : undefined
        },
        include: {
          items: true,
          company: existing.entityType === 'COMPANY' ? true : undefined,
          contact: existing.entityType === 'CONTACT' ? true : undefined,
          supplier: existing.entityType === 'SUPPLIER' ? true : undefined
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'UPDATE',
        resource: 'invoice',
        resourceId: invoice.id,
        metadata: { changes: data },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, invoice)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // DELETE /api/v1/finance/invoices/:id
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params

    try {
      // Check if invoice exists
      const existing = await prisma.invoice.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Invoice not found', 404)
      }

      // Don't allow deleting paid or partially paid invoices
      if (['PAID', 'PARTIALLY_PAID'].includes(existing.status)) {
        return ApiResponse.error(res, 'Cannot delete paid invoices', 400)
      }

      // Check for payments
      const payments = await prisma.payment.count({
        where: { invoiceId: id }
      })

      if (payments > 0) {
        return ApiResponse.error(res, 'Cannot delete invoice with payments', 400)
      }

      // Soft delete
      await prisma.invoice.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          status: 'CANCELLED'
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'DELETE',
        resource: 'invoice',
        resourceId: id,
        metadata: {
          invoiceNumber: existing.invoiceNumber,
          totalAmount: existing.totalAmount
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, { message: 'Invoice deleted successfully' })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/finance/invoices/:id/send
  sendInvoice: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params
    const { email, cc, message } = req.body

    try {
      // Check if invoice exists
      const invoice = await prisma.invoice.findFirst({
        where: { id, orgId, deletedAt: null },
        include: {
          company: true,
          contact: true,
          supplier: true,
          items: true
        }
      })

      if (!invoice) {
        return ApiResponse.error(res, 'Invoice not found', 404)
      }

      // Update invoice status to SENT
      await prisma.invoice.update({
        where: { id },
        data: {
          status: 'SENT',
          sentAt: new Date()
        }
      })

      // TODO: Implement email sending logic
      // This would integrate with an email service like SendGrid, AWS SES, etc.

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'SEND',
        resource: 'invoice',
        resourceId: id,
        metadata: {
          email,
          cc,
          message
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, {
        message: 'Invoice sent successfully',
        sentTo: email
      })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/finance/invoices/:id/record-payment
  recordPayment: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params
    const { amount, paymentDate, paymentMethod, reference, notes } = req.body

    const paymentSchema = z.object({
      amount: z.number().min(0.01),
      paymentDate: z.string().datetime(),
      paymentMethod: z.string(),
      reference: z.string().optional(),
      notes: z.string().optional()
    })

    try {
      const paymentData = paymentSchema.parse({
        amount, paymentDate, paymentMethod, reference, notes
      })

      // Check if invoice exists
      const invoice = await prisma.invoice.findFirst({
        where: { id, orgId, deletedAt: null },
        include: {
          payments: {
            where: { status: 'COMPLETED' }
          }
        }
      })

      if (!invoice) {
        return ApiResponse.error(res, 'Invoice not found', 404)
      }

      // Calculate current paid amount
      const currentPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0)
      const remaining = invoice.totalAmount - currentPaid

      if (paymentData.amount > remaining) {
        return ApiResponse.error(
          res,
          'Payment amount exceeds remaining invoice balance',
          400,
          {
            totalAmount: invoice.totalAmount,
            alreadyPaid: currentPaid,
            remaining,
            attemptedPayment: paymentData.amount
          }
        )
      }

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          orgId,
          amount: paymentData.amount,
          currency: invoice.currency,
          paymentDate: new Date(paymentData.paymentDate),
          status: 'COMPLETED',
          paymentMethod: paymentData.paymentMethod,
          reference: paymentData.reference,
          notes: paymentData.notes,
          entityType: invoice.entityType,
          entityId: invoice.entityId,
          invoiceId: id,
          processedByUserId: userId
        }
      })

      // Update invoice status
      const newPaidAmount = currentPaid + paymentData.amount
      const newStatus = newPaidAmount >= invoice.totalAmount
        ? 'PAID'
        : 'PARTIALLY_PAID'

      await prisma.invoice.update({
        where: { id },
        data: {
          status: newStatus,
          paidAt: newStatus === 'PAID' ? new Date() : null
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'PAYMENT_RECORDED',
        resource: 'invoice',
        resourceId: id,
        metadata: {
          paymentId: payment.id,
          amount: payment.amount,
          newStatus
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, {
        payment,
        invoice: {
          id: invoice.id,
          status: newStatus,
          totalAmount: invoice.totalAmount,
          paidAmount: newPaidAmount,
          remainingAmount: invoice.totalAmount - newPaidAmount
        }
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return ApiResponse.error(res, 'Validation error', 400, error.errors)
      }
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/finance/invoices/summary
  getSummary: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { startDate, endDate } = req.query

    try {
      const dateFilter: any = {}
      if (startDate) {
        dateFilter.gte = new Date(startDate as string)
      }
      if (endDate) {
        dateFilter.lte = new Date(endDate as string)
      }

      // Get invoice statistics
      const [
        totalInvoices,
        statusCounts,
        totalAmounts,
        overdueInvoices
      ] = await Promise.all([
        // Total invoices
        prisma.invoice.count({
          where: {
            orgId,
            deletedAt: null,
            issueDate: dateFilter
          }
        }),

        // Count by status
        prisma.invoice.groupBy({
          by: ['status'],
          where: {
            orgId,
            deletedAt: null,
            issueDate: dateFilter
          },
          _count: { id: true }
        }),

        // Total amounts by status
        prisma.invoice.groupBy({
          by: ['status'],
          where: {
            orgId,
            deletedAt: null,
            issueDate: dateFilter
          },
          _sum: { totalAmount: true }
        }),

        // Overdue invoices
        prisma.invoice.findMany({
          where: {
            orgId,
            deletedAt: null,
            status: { in: ['SENT', 'PARTIALLY_PAID'] },
            dueDate: { lt: new Date() }
          },
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            dueDate: true,
            company: {
              select: { id: true, name: true }
            }
          }
        })
      ])

      const summary = {
        total: totalInvoices,
        byStatus: statusCounts.reduce((acc, item) => {
          acc[item.status] = item._count.id
          return acc
        }, {} as Record<string, number>),
        amounts: totalAmounts.reduce((acc, item) => {
          acc[item.status] = item._sum.totalAmount || 0
          return acc
        }, {} as Record<string, number>),
        totalAmount: totalAmounts.reduce((sum, item) => sum + (item._sum.totalAmount || 0), 0),
        overdueCount: overdueInvoices.length,
        overdueAmount: overdueInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0),
        overdueInvoices: overdueInvoices.slice(0, 10) // Top 10
      }

      return ApiResponse.success(res, summary)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  })
}