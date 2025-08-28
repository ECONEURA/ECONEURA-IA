import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  InvoiceQuerySchema,
  ERPParamsSchema
} from '../schemas/erp.schemas';

/**
 * Generate next invoice number
 */
const generateInvoiceNumber = async (organizationId: string): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;
  
  // Find the last invoice number for current year
  const lastInvoice = await prisma.invoice.findFirst({
    where: {
      organizationId,
      invoiceNumber: { startsWith: prefix }
    },
    orderBy: { createdAt: 'desc' }
  });

  let nextNumber = 1;
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ''));
    nextNumber = lastNumber + 1;
  }

  return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
};

/**
 * Calculate invoice totals
 */
const calculateInvoiceTotals = (items: any[], discountAmount: number = 0) => {
  let subtotal = 0;
  let taxAmount = 0;

  items.forEach(item => {
    const lineTotal = item.quantity * item.unitPrice;
    subtotal += lineTotal;
    
    if (item.taxRate) {
      const itemTaxAmount = lineTotal * item.taxRate.rate;
      taxAmount += itemTaxAmount;
    }
  });

  const total = subtotal + taxAmount - discountAmount;
  
  return { subtotal, taxAmount, total };
};

/**
 * Get all invoices with filtering and pagination
 */
export const getInvoices = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const pagination = req.pagination!;
  
  const query = InvoiceQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  // Add search filters
  if (query.search) {
    where.OR = [
      { invoiceNumber: { contains: query.search, mode: 'insensitive' } },
      { 
        customer: {
          OR: [
            { customerCode: { contains: query.search, mode: 'insensitive' } },
            { companyName: { contains: query.search, mode: 'insensitive' } },
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } }
          ]
        }
      }
    ];
  }
  
  if (query.customerId) {
    where.customerId = query.customerId;
  }
  
  if (query.status) {
    where.status = query.status;
  }

  // Date range filters
  if (query.dateFrom || query.dateTo) {
    where.invoiceDate = {};
    if (query.dateFrom) {
      where.invoiceDate.gte = new Date(query.dateFrom);
    }
    if (query.dateTo) {
      where.invoiceDate.lte = new Date(query.dateTo);
    }
  }

  // Amount range filters
  if (query.amountMin !== undefined || query.amountMax !== undefined) {
    where.total = {};
    if (query.amountMin !== undefined) {
      where.total.gte = query.amountMin;
    }
    if (query.amountMax !== undefined) {
      where.total.lte = query.amountMax;
    }
  }

  // Execute queries
  const [invoices, totalCount] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: pagination.offset,
      take: pagination.limit,
      orderBy: query.sortBy ? { [query.sortBy]: query.sortDir || 'asc' } : { createdAt: 'desc' },
      include: {
        customer: {
          select: {
            id: true,
            customerCode: true,
            companyName: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        paymentTerm: {
          select: { id: true, name: true, days: true }
        },
        _count: {
          select: {
            items: true,
            transactions: true
          }
        }
      }
    }),
    prisma.invoice.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  res.json({
    data: invoices,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      totalCount,
      totalPages,
      hasNext: pagination.page < totalPages,
      hasPrev: pagination.page > 1
    }
  });
});

/**
 * Get single invoice by ID
 */
export const getInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ERPParamsSchema.parse(req.params);

  const invoice = await prisma.invoice.findFirst({
    where: { 
      id,
      organizationId
    },
    include: {
      customer: {
        select: {
          id: true,
          customerCode: true,
          companyName: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          billingAddress: true,
          billingCity: true,
          billingState: true,
          billingPostal: true,
          billingCountry: true
        }
      },
      paymentTerm: {
        select: { id: true, name: true, days: true }
      },
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true }
          },
          taxRate: {
            select: { id: true, name: true, rate: true }
          }
        }
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          transactionNumber: true,
          transactionDate: true,
          description: true,
          amount: true,
          type: true
        }
      }
    }
  });

  if (!invoice) {
    throw new ApiError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  }

  res.json({ data: invoice });
});

/**
 * Create new invoice
 */
export const createInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const invoiceData = CreateInvoiceSchema.parse(req.body);

  // Verify customer exists
  const customer = await prisma.customer.findFirst({
    where: { id: invoiceData.customerId, organizationId }
  });

  if (!customer) {
    throw new ApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  // Verify payment term exists (if provided)
  if (invoiceData.paymentTermId) {
    const paymentTerm = await prisma.paymentTerm.findFirst({
      where: { id: invoiceData.paymentTermId, organizationId }
    });
    if (!paymentTerm) {
      throw new ApiError('Payment term not found', 404, 'PAYMENT_TERM_NOT_FOUND');
    }
  }

  // Validate invoice items and collect data
  const validatedItems = [];
  for (const item of invoiceData.items) {
    let product = null;
    let taxRate = null;

    if (item.productId) {
      product = await prisma.product.findFirst({
        where: { id: item.productId, organizationId }
      });
      if (!product) {
        throw new ApiError(`Product not found: ${item.productId}`, 404, 'PRODUCT_NOT_FOUND');
      }
    }

    if (item.taxRateId) {
      taxRate = await prisma.taxRate.findFirst({
        where: { id: item.taxRateId, organizationId }
      });
      if (!taxRate) {
        throw new ApiError(`Tax rate not found: ${item.taxRateId}`, 404, 'TAX_RATE_NOT_FOUND');
      }
    }

    const lineTotal = item.quantity * item.unitPrice;
    const itemTaxAmount = taxRate ? lineTotal * Number(taxRate.rate) : 0;

    validatedItems.push({
      ...item,
      taxAmount: itemTaxAmount,
      lineTotal: lineTotal,
      taxRate
    });
  }

  // Calculate totals
  const { subtotal, taxAmount, total } = calculateInvoiceTotals(
    validatedItems, 
    invoiceData.discountAmount
  );

  // Generate invoice number if not provided
  const invoiceNumber = invoiceData.invoiceNumber || await generateInvoiceNumber(organizationId);

  // Create invoice with items in transaction
  const invoice = await prisma.$transaction(async (tx) => {
    const createdInvoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        invoiceDate: new Date(invoiceData.invoiceDate),
        dueDate: new Date(invoiceData.dueDate),
        customerId: invoiceData.customerId,
        paymentTermId: invoiceData.paymentTermId,
        subtotal,
        taxAmount,
        discountAmount: invoiceData.discountAmount,
        total,
        currency: invoiceData.currency,
        status: invoiceData.status,
        notes: invoiceData.notes,
        internalNotes: invoiceData.internalNotes,
        organizationId,
        createdById: userId,
        updatedById: userId
      }
    });

    // Create invoice items
    await tx.invoiceItem.createMany({
      data: validatedItems.map(item => ({
        invoiceId: createdInvoice.id,
        productId: item.productId || null,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRateId: item.taxRateId || null,
        taxAmount: item.taxAmount,
        lineTotal: item.lineTotal
      }))
    });

    return createdInvoice;
  });

  // Fetch complete invoice with relations
  const completeInvoice = await prisma.invoice.findUnique({
    where: { id: invoice.id },
    include: {
      customer: {
        select: { id: true, customerCode: true, companyName: true, firstName: true, lastName: true }
      },
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true }
          },
          taxRate: {
            select: { id: true, name: true, rate: true }
          }
        }
      }
    }
  });

  res.status(201).json({ 
    data: completeInvoice,
    message: 'Invoice created successfully' 
  });
});

/**
 * Update existing invoice
 */
export const updateInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = ERPParamsSchema.parse(req.params);
  const updateData = UpdateInvoiceSchema.parse(req.body);

  // Check if invoice exists
  const existingInvoice = await prisma.invoice.findFirst({
    where: { id, organizationId }
  });

  if (!existingInvoice) {
    throw new ApiError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  }

  // Prevent editing paid invoices
  if (existingInvoice.status === 'paid') {
    throw new ApiError('Cannot modify paid invoice', 400, 'INVOICE_ALREADY_PAID');
  }

  // Validate foreign keys if provided
  if (updateData.customerId) {
    const customer = await prisma.customer.findFirst({
      where: { id: updateData.customerId, organizationId }
    });
    if (!customer) {
      throw new ApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
    }
  }

  if (updateData.paymentTermId) {
    const paymentTerm = await prisma.paymentTerm.findFirst({
      where: { id: updateData.paymentTermId, organizationId }
    });
    if (!paymentTerm) {
      throw new ApiError('Payment term not found', 404, 'PAYMENT_TERM_NOT_FOUND');
    }
  }

  const invoice = await prisma.invoice.update({
    where: { id },
    data: {
      ...updateData,
      invoiceDate: updateData.invoiceDate ? new Date(updateData.invoiceDate) : undefined,
      dueDate: updateData.dueDate ? new Date(updateData.dueDate) : undefined,
      updatedById: userId,
      updatedAt: new Date()
    },
    include: {
      customer: {
        select: { id: true, customerCode: true, companyName: true, firstName: true, lastName: true }
      },
      items: {
        include: {
          product: {
            select: { id: true, sku: true, name: true }
          },
          taxRate: {
            select: { id: true, name: true, rate: true }
          }
        }
      }
    }
  });

  res.json({ 
    data: invoice,
    message: 'Invoice updated successfully' 
  });
});

/**
 * Delete invoice
 */
export const deleteInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ERPParamsSchema.parse(req.params);

  // Check if invoice exists
  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: { transactions: true }
      }
    }
  });

  if (!invoice) {
    throw new ApiError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  }

  // Prevent deleting invoices with payments
  if (invoice._count.transactions > 0 || Number(invoice.paidAmount) > 0) {
    throw new ApiError('Cannot delete invoice with payments', 400, 'INVOICE_HAS_PAYMENTS');
  }

  await prisma.invoice.delete({
    where: { id }
  });

  res.json({ 
    message: 'Invoice deleted successfully' 
  });
});

/**
 * Mark invoice as sent
 */
export const sendInvoice = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = ERPParamsSchema.parse(req.params);

  const invoice = await prisma.invoice.findFirst({
    where: { id, organizationId }
  });

  if (!invoice) {
    throw new ApiError('Invoice not found', 404, 'INVOICE_NOT_FOUND');
  }

  if (invoice.status !== 'draft') {
    throw new ApiError('Only draft invoices can be sent', 400, 'INVALID_INVOICE_STATUS');
  }

  const updatedInvoice = await prisma.invoice.update({
    where: { id },
    data: {
      status: 'sent',
      updatedById: userId,
      updatedAt: new Date()
    }
  });

  res.json({
    data: updatedInvoice,
    message: 'Invoice marked as sent'
  });
});

/**
 * Get invoice statistics
 */
export const getInvoiceStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  // Status breakdown
  const statusStats = await prisma.invoice.groupBy({
    by: ['status'],
    where: { organizationId },
    _count: { _all: true },
    _sum: { total: true }
  });

  // Overdue invoices
  const overdueInvoices = await prisma.invoice.count({
    where: {
      organizationId,
      status: { in: ['sent', 'overdue'] },
      dueDate: { lt: new Date() }
    }
  });

  // Monthly revenue trends
  const monthlyRevenue = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "invoiceDate") as month,
      COUNT(*) as count,
      SUM("total") as total_amount,
      SUM("paidAmount") as paid_amount
    FROM "invoices" 
    WHERE "organizationId" = ${organizationId}
      AND "invoiceDate" >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', "invoiceDate")
    ORDER BY month DESC
  `;

  // Top customers by invoice value
  const topCustomers = await prisma.customer.findMany({
    where: { organizationId },
    include: {
      invoices: {
        where: { status: { not: 'cancelled' } },
        select: { total: true }
      }
    }
  });

  const topCustomersByRevenue = topCustomers
    .map(customer => ({
      id: customer.id,
      customerCode: customer.customerCode,
      name: customer.companyName || `${customer.firstName} ${customer.lastName}`,
      totalRevenue: customer.invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0),
      invoiceCount: customer.invoices.length
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  res.json({
    data: {
      byStatus: statusStats.map(stat => ({
        status: stat.status,
        count: stat._count._all,
        totalAmount: stat._sum.total
      })),
      overdueCount: overdueInvoices,
      monthlyRevenue,
      topCustomers: topCustomersByRevenue
    }
  });
});