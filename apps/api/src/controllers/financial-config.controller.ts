import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateAccountSchema,
  UpdateAccountSchema,
  AccountQuerySchema,
  CreateTaxRateSchema,
  UpdateTaxRateSchema,
  CreatePaymentTermSchema,
  UpdatePaymentTermSchema,
  ERPParamsSchema
} from '../schemas/erp.schemas';

// ===== ACCOUNTS (CHART OF ACCOUNTS) =====

/**
 * Get all accounts (chart of accounts)
 */
export const getAccounts = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const query = AccountQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  if (query.search) {
    where.OR = [
      { code: { contains: query.search, mode: 'insensitive' } },
      { name: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  
  if (query.type) {
    where.type = query.type;
  }
  
  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  const accounts = await prisma.account.findMany({
    where,
    include: {
      parent: {
        select: { id: true, code: true, name: true }
      },
      children: {
        select: { id: true, code: true, name: true }
      },
      _count: {
        select: { transactions: true }
      }
    },
    orderBy: query.sortBy ? { [query.sortBy]: query.sortDir || 'asc' } : { code: 'asc' }
  });

  res.json({ data: accounts });
});

/**
 * Create new account
 */
export const createAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const accountData = CreateAccountSchema.parse(req.body);

  // Check if account code is unique
  const existingAccount = await prisma.account.findFirst({
    where: {
      code: accountData.code,
      organizationId
    }
  });

  if (existingAccount) {
    throw new ApiError('Account code already exists', 409, 'ACCOUNT_CODE_EXISTS');
  }

  // Check if parent exists (if provided)
  if (accountData.parentId) {
    const parent = await prisma.account.findFirst({
      where: { id: accountData.parentId, organizationId }
    });
    if (!parent) {
      throw new ApiError('Parent account not found', 404, 'PARENT_ACCOUNT_NOT_FOUND');
    }
  }

  const account = await prisma.account.create({
    data: {
      ...accountData,
      organizationId
    },
    include: {
      parent: {
        select: { id: true, code: true, name: true }
      }
    }
  });

  res.status(201).json({ 
    data: account,
    message: 'Account created successfully' 
  });
});

/**
 * Update existing account
 */
export const updateAccount = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ERPParamsSchema.parse(req.params);
  const updateData = UpdateAccountSchema.parse(req.body);

  const existingAccount = await prisma.account.findFirst({
    where: { id, organizationId }
  });

  if (!existingAccount) {
    throw new ApiError('Account not found', 404, 'ACCOUNT_NOT_FOUND');
  }

  // Check if new code is unique (if being changed)
  if (updateData.code && updateData.code !== existingAccount.code) {
    const conflictingAccount = await prisma.account.findFirst({
      where: {
        code: updateData.code,
        organizationId,
        id: { not: id }
      }
    });

    if (conflictingAccount) {
      throw new ApiError('Account code already exists', 409, 'ACCOUNT_CODE_EXISTS');
    }
  }

  const account = await prisma.account.update({
    where: { id },
    data: updateData,
    include: {
      parent: {
        select: { id: true, code: true, name: true }
      }
    }
  });

  res.json({ 
    data: account,
    message: 'Account updated successfully' 
  });
});

// ===== TAX RATES =====

/**
 * Get all tax rates
 */
export const getTaxRates = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  const taxRates = await prisma.taxRate.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: {
          products: true,
          invoiceItems: true,
          expenseItems: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({ data: taxRates });
});

/**
 * Create new tax rate
 */
export const createTaxRate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const taxRateData = CreateTaxRateSchema.parse(req.body);

  // Check if tax rate name is unique
  const existingTaxRate = await prisma.taxRate.findFirst({
    where: {
      name: taxRateData.name,
      organizationId
    }
  });

  if (existingTaxRate) {
    throw new ApiError('Tax rate name already exists', 409, 'TAX_RATE_NAME_EXISTS');
  }

  // If this is set as default, remove default from others
  if (taxRateData.isDefault) {
    await prisma.taxRate.updateMany({
      where: { organizationId, isDefault: true },
      data: { isDefault: false }
    });
  }

  const taxRate = await prisma.taxRate.create({
    data: {
      ...taxRateData,
      organizationId
    }
  });

  res.status(201).json({ 
    data: taxRate,
    message: 'Tax rate created successfully' 
  });
});

/**
 * Update existing tax rate
 */
export const updateTaxRate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ERPParamsSchema.parse(req.params);
  const updateData = UpdateTaxRateSchema.parse(req.body);

  const existingTaxRate = await prisma.taxRate.findFirst({
    where: { id, organizationId }
  });

  if (!existingTaxRate) {
    throw new ApiError('Tax rate not found', 404, 'TAX_RATE_NOT_FOUND');
  }

  // Check if new name is unique (if being changed)
  if (updateData.name && updateData.name !== existingTaxRate.name) {
    const conflictingTaxRate = await prisma.taxRate.findFirst({
      where: {
        name: updateData.name,
        organizationId,
        id: { not: id }
      }
    });

    if (conflictingTaxRate) {
      throw new ApiError('Tax rate name already exists', 409, 'TAX_RATE_NAME_EXISTS');
    }
  }

  // If this is set as default, remove default from others
  if (updateData.isDefault) {
    await prisma.taxRate.updateMany({
      where: { organizationId, isDefault: true, id: { not: id } },
      data: { isDefault: false }
    });
  }

  const taxRate = await prisma.taxRate.update({
    where: { id },
    data: updateData
  });

  res.json({ 
    data: taxRate,
    message: 'Tax rate updated successfully' 
  });
});

/**
 * Delete tax rate
 */
export const deleteTaxRate = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ERPParamsSchema.parse(req.params);

  const taxRate = await prisma.taxRate.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: {
          products: true,
          invoiceItems: true,
          expenseItems: true
        }
      }
    }
  });

  if (!taxRate) {
    throw new ApiError('Tax rate not found', 404, 'TAX_RATE_NOT_FOUND');
  }

  // Check if tax rate is in use
  const totalUsage = taxRate._count.products + taxRate._count.invoiceItems + taxRate._count.expenseItems;
  if (totalUsage > 0) {
    throw new ApiError(
      'Cannot delete tax rate that is in use',
      400,
      'TAX_RATE_IN_USE'
    );
  }

  await prisma.taxRate.delete({
    where: { id }
  });

  res.json({ 
    message: 'Tax rate deleted successfully' 
  });
});

// ===== PAYMENT TERMS =====

/**
 * Get all payment terms
 */
export const getPaymentTerms = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  const paymentTerms = await prisma.paymentTerm.findMany({
    where: { organizationId },
    include: {
      _count: {
        select: {
          customers: true,
          suppliers: true,
          invoices: true,
          expenses: true
        }
      }
    },
    orderBy: { days: 'asc' }
  });

  res.json({ data: paymentTerms });
});

/**
 * Create new payment term
 */
export const createPaymentTerm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const paymentTermData = CreatePaymentTermSchema.parse(req.body);

  // Check if payment term name is unique
  const existingPaymentTerm = await prisma.paymentTerm.findFirst({
    where: {
      name: paymentTermData.name,
      organizationId
    }
  });

  if (existingPaymentTerm) {
    throw new ApiError('Payment term name already exists', 409, 'PAYMENT_TERM_NAME_EXISTS');
  }

  const paymentTerm = await prisma.paymentTerm.create({
    data: {
      ...paymentTermData,
      organizationId
    }
  });

  res.status(201).json({ 
    data: paymentTerm,
    message: 'Payment term created successfully' 
  });
});

/**
 * Update existing payment term
 */
export const updatePaymentTerm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ERPParamsSchema.parse(req.params);
  const updateData = UpdatePaymentTermSchema.parse(req.body);

  const existingPaymentTerm = await prisma.paymentTerm.findFirst({
    where: { id, organizationId }
  });

  if (!existingPaymentTerm) {
    throw new ApiError('Payment term not found', 404, 'PAYMENT_TERM_NOT_FOUND');
  }

  // Check if new name is unique (if being changed)
  if (updateData.name && updateData.name !== existingPaymentTerm.name) {
    const conflictingPaymentTerm = await prisma.paymentTerm.findFirst({
      where: {
        name: updateData.name,
        organizationId,
        id: { not: id }
      }
    });

    if (conflictingPaymentTerm) {
      throw new ApiError('Payment term name already exists', 409, 'PAYMENT_TERM_NAME_EXISTS');
    }
  }

  const paymentTerm = await prisma.paymentTerm.update({
    where: { id },
    data: updateData
  });

  res.json({ 
    data: paymentTerm,
    message: 'Payment term updated successfully' 
  });
});

/**
 * Delete payment term
 */
export const deletePaymentTerm = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ERPParamsSchema.parse(req.params);

  const paymentTerm = await prisma.paymentTerm.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: {
          customers: true,
          suppliers: true,
          invoices: true,
          expenses: true
        }
      }
    }
  });

  if (!paymentTerm) {
    throw new ApiError('Payment term not found', 404, 'PAYMENT_TERM_NOT_FOUND');
  }

  // Check if payment term is in use
  const totalUsage = paymentTerm._count.customers + paymentTerm._count.suppliers + 
                    paymentTerm._count.invoices + paymentTerm._count.expenses;
  if (totalUsage > 0) {
    throw new ApiError(
      'Cannot delete payment term that is in use',
      400,
      'PAYMENT_TERM_IN_USE'
    );
  }

  await prisma.paymentTerm.delete({
    where: { id }
  });

  res.json({ 
    message: 'Payment term deleted successfully' 
  });
});