import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateCustomerSchema,
  UpdateCustomerSchema,
  CustomerQuerySchema,
  CustomerParamsSchema
} from '../schemas/erp.schemas';

/**
 * Get all customers with filtering and pagination
 */
export const getCustomers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const pagination = req.pagination!;
  
  const query = CustomerQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  // Add search filters
  if (query.search) {
    where.OR = [
      { customerCode: { contains: query.search, mode: 'insensitive' } },
      { companyName: { contains: query.search, mode: 'insensitive' } },
      { firstName: { contains: query.search, mode: 'insensitive' } },
      { lastName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  
  if (query.customerType) {
    where.customerType = query.customerType;
  }
  
  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  // Execute queries
  const [customers, totalCount] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: pagination.offset,
      take: pagination.limit,
      orderBy: query.sortBy ? { [query.sortBy]: query.sortDir || 'asc' } : { createdAt: 'desc' },
      include: {
        paymentTerm: {
          select: { id: true, name: true, days: true }
        },
        _count: {
          select: {
            invoices: true,
            transactions: true
          }
        }
      }
    }),
    prisma.customer.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  res.json({
    data: customers,
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
 * Get single customer by ID
 */
export const getCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = CustomerParamsSchema.parse(req.params);

  const customer = await prisma.customer.findFirst({
    where: { 
      id,
      organizationId
    },
    include: {
      paymentTerm: {
        select: { id: true, name: true, days: true }
      },
      invoices: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          invoiceNumber: true,
          invoiceDate: true,
          dueDate: true,
          total: true,
          paidAmount: true,
          status: true
        }
      },
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          transactionNumber: true,
          transactionDate: true,
          description: true,
          amount: true,
          type: true
        }
      },
      _count: {
        select: {
          invoices: true,
          transactions: true
        }
      }
    }
  });

  if (!customer) {
    throw new ApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  res.json({ data: customer });
});

/**
 * Create new customer
 */
export const createCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const customerData = CreateCustomerSchema.parse(req.body);

  // Check if customer code is unique
  const existingCustomer = await prisma.customer.findFirst({
    where: {
      customerCode: customerData.customerCode,
      organizationId
    }
  });

  if (existingCustomer) {
    throw new ApiError('Customer code already exists', 409, 'CUSTOMER_CODE_EXISTS');
  }

  // Check if payment term exists (if provided)
  if (customerData.paymentTermId) {
    const paymentTerm = await prisma.paymentTerm.findFirst({
      where: { id: customerData.paymentTermId, organizationId }
    });
    if (!paymentTerm) {
      throw new ApiError('Payment term not found', 404, 'PAYMENT_TERM_NOT_FOUND');
    }
  }

  const customer = await prisma.customer.create({
    data: {
      ...customerData,
      organizationId,
      createdById: userId,
      updatedById: userId
    },
    include: {
      paymentTerm: {
        select: { id: true, name: true, days: true }
      }
    }
  });

  res.status(201).json({ 
    data: customer,
    message: 'Customer created successfully' 
  });
});

/**
 * Update existing customer
 */
export const updateCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = CustomerParamsSchema.parse(req.params);
  const updateData = UpdateCustomerSchema.parse(req.body);

  // Check if customer exists
  const existingCustomer = await prisma.customer.findFirst({
    where: { id, organizationId }
  });

  if (!existingCustomer) {
    throw new ApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  // Check if new customer code is unique (if being changed)
  if (updateData.customerCode && updateData.customerCode !== existingCustomer.customerCode) {
    const conflictingCustomer = await prisma.customer.findFirst({
      where: {
        customerCode: updateData.customerCode,
        organizationId,
        id: { not: id }
      }
    });

    if (conflictingCustomer) {
      throw new ApiError('Customer code already exists', 409, 'CUSTOMER_CODE_EXISTS');
    }
  }

  // Check if payment term exists (if provided)
  if (updateData.paymentTermId) {
    const paymentTerm = await prisma.paymentTerm.findFirst({
      where: { id: updateData.paymentTermId, organizationId }
    });
    if (!paymentTerm) {
      throw new ApiError('Payment term not found', 404, 'PAYMENT_TERM_NOT_FOUND');
    }
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      ...updateData,
      updatedById: userId,
      updatedAt: new Date()
    },
    include: {
      paymentTerm: {
        select: { id: true, name: true, days: true }
      }
    }
  });

  res.json({ 
    data: customer,
    message: 'Customer updated successfully' 
  });
});

/**
 * Delete customer
 */
export const deleteCustomer = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = CustomerParamsSchema.parse(req.params);

  // Check if customer exists
  const customer = await prisma.customer.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: {
          invoices: true,
          transactions: true
        }
      }
    }
  });

  if (!customer) {
    throw new ApiError('Customer not found', 404, 'CUSTOMER_NOT_FOUND');
  }

  // Check if customer has related records
  if (customer._count.invoices > 0 || customer._count.transactions > 0) {
    throw new ApiError(
      'Cannot delete customer with associated invoices or transactions',
      400,
      'CUSTOMER_HAS_DEPENDENCIES'
    );
  }

  await prisma.customer.delete({
    where: { id }
  });

  res.json({ 
    message: 'Customer deleted successfully' 
  });
});

/**
 * Get customer statistics
 */
export const getCustomerStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  // Get customer counts by type
  const typeStats = await prisma.customer.groupBy({
    by: ['customerType'],
    where: { organizationId },
    _count: { _all: true }
  });

  // Get active vs inactive
  const statusStats = await prisma.customer.groupBy({
    by: ['isActive'],
    where: { organizationId },
    _count: { _all: true }
  });

  // Get top customers by revenue (from invoices)
  const topCustomers = await prisma.customer.findMany({
    where: { organizationId },
    include: {
      invoices: {
        where: { status: 'paid' },
        select: { total: true }
      }
    },
    take: 10
  });

  const topCustomersByRevenue = topCustomers
    .map(customer => ({
      id: customer.id,
      customerCode: customer.customerCode,
      name: customer.companyName || `${customer.firstName} ${customer.lastName}`,
      totalRevenue: customer.invoices.reduce((sum, invoice) => sum + Number(invoice.total), 0)
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 10);

  // Monthly customer acquisition
  const monthlyStats = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as count
    FROM "customers" 
    WHERE "organizationId" = ${organizationId}
      AND "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month DESC
  `;

  res.json({
    data: {
      total: typeStats.reduce((sum, stat) => sum + stat._count._all, 0),
      byType: typeStats.map(stat => ({
        type: stat.customerType,
        count: stat._count._all
      })),
      byStatus: statusStats.map(stat => ({
        status: stat.isActive ? 'active' : 'inactive',
        count: stat._count._all
      })),
      topByRevenue: topCustomersByRevenue,
      monthlyAcquisition: monthlyStats
    }
  });
});