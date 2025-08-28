import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateSupplierSchema,
  UpdateSupplierSchema,
  SupplierQuerySchema,
  SupplierParamsSchema
} from '../schemas/erp.schemas';

/**
 * Get all suppliers with filtering and pagination
 */
export const getSuppliers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const pagination = req.pagination!;
  
  const query = SupplierQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  // Add search filters
  if (query.search) {
    where.OR = [
      { supplierCode: { contains: query.search, mode: 'insensitive' } },
      { companyName: { contains: query.search, mode: 'insensitive' } },
      { contactName: { contains: query.search, mode: 'insensitive' } },
      { email: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  
  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  // Execute queries
  const [suppliers, totalCount] = await Promise.all([
    prisma.supplier.findMany({
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
            expenses: true,
            transactions: true,
            products: true
          }
        }
      }
    }),
    prisma.supplier.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  res.json({
    data: suppliers,
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
 * Get single supplier by ID
 */
export const getSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = SupplierParamsSchema.parse(req.params);

  const supplier = await prisma.supplier.findFirst({
    where: { 
      id,
      organizationId
    },
    include: {
      paymentTerm: {
        select: { id: true, name: true, days: true }
      },
      expenses: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          expenseNumber: true,
          expenseDate: true,
          total: true,
          paidAmount: true,
          status: true
        }
      },
      products: {
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          sku: true,
          name: true,
          unitPrice: true,
          stockQuantity: true
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
          expenses: true,
          transactions: true,
          products: true
        }
      }
    }
  });

  if (!supplier) {
    throw new ApiError('Supplier not found', 404, 'SUPPLIER_NOT_FOUND');
  }

  res.json({ data: supplier });
});

/**
 * Create new supplier
 */
export const createSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const supplierData = CreateSupplierSchema.parse(req.body);

  // Check if supplier code is unique
  const existingSupplier = await prisma.supplier.findFirst({
    where: {
      supplierCode: supplierData.supplierCode,
      organizationId
    }
  });

  if (existingSupplier) {
    throw new ApiError('Supplier code already exists', 409, 'SUPPLIER_CODE_EXISTS');
  }

  // Check if payment term exists (if provided)
  if (supplierData.paymentTermId) {
    const paymentTerm = await prisma.paymentTerm.findFirst({
      where: { id: supplierData.paymentTermId, organizationId }
    });
    if (!paymentTerm) {
      throw new ApiError('Payment term not found', 404, 'PAYMENT_TERM_NOT_FOUND');
    }
  }

  const supplier = await prisma.supplier.create({
    data: {
      ...supplierData,
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
    data: supplier,
    message: 'Supplier created successfully' 
  });
});

/**
 * Update existing supplier
 */
export const updateSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = SupplierParamsSchema.parse(req.params);
  const updateData = UpdateSupplierSchema.parse(req.body);

  // Check if supplier exists
  const existingSupplier = await prisma.supplier.findFirst({
    where: { id, organizationId }
  });

  if (!existingSupplier) {
    throw new ApiError('Supplier not found', 404, 'SUPPLIER_NOT_FOUND');
  }

  // Check if new supplier code is unique (if being changed)
  if (updateData.supplierCode && updateData.supplierCode !== existingSupplier.supplierCode) {
    const conflictingSupplier = await prisma.supplier.findFirst({
      where: {
        supplierCode: updateData.supplierCode,
        organizationId,
        id: { not: id }
      }
    });

    if (conflictingSupplier) {
      throw new ApiError('Supplier code already exists', 409, 'SUPPLIER_CODE_EXISTS');
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

  const supplier = await prisma.supplier.update({
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
    data: supplier,
    message: 'Supplier updated successfully' 
  });
});

/**
 * Delete supplier
 */
export const deleteSupplier = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = SupplierParamsSchema.parse(req.params);

  // Check if supplier exists
  const supplier = await prisma.supplier.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: {
          expenses: true,
          transactions: true,
          products: true
        }
      }
    }
  });

  if (!supplier) {
    throw new ApiError('Supplier not found', 404, 'SUPPLIER_NOT_FOUND');
  }

  // Check if supplier has related records
  const totalDependencies = supplier._count.expenses + supplier._count.transactions + supplier._count.products;
  if (totalDependencies > 0) {
    throw new ApiError(
      'Cannot delete supplier with associated expenses, transactions, or products',
      400,
      'SUPPLIER_HAS_DEPENDENCIES'
    );
  }

  await prisma.supplier.delete({
    where: { id }
  });

  res.json({ 
    message: 'Supplier deleted successfully' 
  });
});

/**
 * Get supplier statistics
 */
export const getSupplierStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  // Get active vs inactive
  const statusStats = await prisma.supplier.groupBy({
    by: ['isActive'],
    where: { organizationId },
    _count: { _all: true }
  });

  // Get top suppliers by expense amount
  const topSuppliers = await prisma.supplier.findMany({
    where: { organizationId },
    include: {
      expenses: {
        where: { status: 'paid' },
        select: { total: true }
      }
    },
    take: 20
  });

  const topSuppliersByExpense = topSuppliers
    .map(supplier => ({
      id: supplier.id,
      supplierCode: supplier.supplierCode,
      companyName: supplier.companyName,
      totalExpense: supplier.expenses.reduce((sum, expense) => sum + Number(expense.total), 0)
    }))
    .sort((a, b) => b.totalExpense - a.totalExpense)
    .slice(0, 10);

  // Monthly supplier acquisition
  const monthlyStats = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as count
    FROM "suppliers" 
    WHERE "organizationId" = ${organizationId}
      AND "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month DESC
  `;

  // Suppliers with most products
  const suppliersWithProducts = await prisma.supplier.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: { products: true }
      }
    },
    orderBy: {
      products: {
        _count: 'desc'
      }
    },
    take: 10
  });

  res.json({
    data: {
      total: statusStats.reduce((sum, stat) => sum + stat._count._all, 0),
      byStatus: statusStats.map(stat => ({
        status: stat.isActive ? 'active' : 'inactive',
        count: stat._count._all
      })),
      topByExpense: topSuppliersByExpense,
      topByProducts: suppliersWithProducts.map(supplier => ({
        id: supplier.id,
        supplierCode: supplier.supplierCode,
        companyName: supplier.companyName,
        productCount: supplier._count.products
      })),
      monthlyAcquisition: monthlyStats
    }
  });
});