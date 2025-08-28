import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateCompanySchema,
  UpdateCompanySchema,
  CompanyQuerySchema,
  CompanyParamsSchema
} from '../schemas/crm.schemas';

/**
 * Get all companies with filtering and pagination
 */
export const getCompanies = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const pagination = req.pagination!;
  
  const query = CompanyQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  // Add search filters
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { website: { contains: query.search, mode: 'insensitive' } },
      { industry: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  
  if (query.industry) {
    where.industry = { contains: query.industry, mode: 'insensitive' };
  }
  
  if (query.size) {
    where.size = query.size;
  }
  
  if (query.status) {
    where.status = query.status;
  }
  
  if (query.labels && query.labels.length > 0) {
    where.labels = {
      some: {
        labelId: { in: query.labels }
      }
    };
  }

  // Revenue range filters
  if (query.revenueMin !== undefined || query.revenueMax !== undefined) {
    where.annualRevenue = {};
    if (query.revenueMin !== undefined) {
      where.annualRevenue.gte = query.revenueMin;
    }
    if (query.revenueMax !== undefined) {
      where.annualRevenue.lte = query.revenueMax;
    }
  }

  // Employee count range filters
  if (query.employeesMin !== undefined || query.employeesMax !== undefined) {
    where.employeeCount = {};
    if (query.employeesMin !== undefined) {
      where.employeeCount.gte = query.employeesMin;
    }
    if (query.employeesMax !== undefined) {
      where.employeeCount.lte = query.employeesMax;
    }
  }

  // Execute queries
  const [companies, totalCount] = await Promise.all([
    prisma.company.findMany({
      where,
      skip: pagination.offset,
      take: pagination.limit,
      orderBy: query.sortBy ? { [query.sortBy]: query.sortDir || 'asc' } : { createdAt: 'desc' },
      include: {
        labels: {
          include: {
            label: {
              select: { id: true, name: true, color: true }
            }
          }
        },
        contacts: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true
          }
        },
        deals: {
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            value: true,
            currency: true,
            stage: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            contacts: true,
            deals: true,
            activities: true
          }
        }
      }
    }),
    prisma.company.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  res.json({
    data: companies,
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
 * Get single company by ID
 */
export const getCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = CompanyParamsSchema.parse(req.params);

  const company = await prisma.company.findFirst({
    where: { 
      id,
      organizationId
    },
    include: {
      labels: {
        include: {
          label: {
            select: { id: true, name: true, color: true }
          }
        }
      },
      contacts: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobTitle: true,
          status: true,
          createdAt: true
        }
      },
      deals: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          value: true,
          currency: true,
          stage: true,
          probability: true,
          expectedCloseDate: true,
          createdAt: true,
          assignedTo: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      },
      activities: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      },
      attachments: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
          createdAt: true,
          createdBy: {
            select: { id: true, firstName: true, lastName: true }
          }
        }
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true }
      },
      updatedBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  if (!company) {
    throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
  }

  res.json({ data: company });
});

/**
 * Create new company
 */
export const createCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const companyData = CreateCompanySchema.parse(req.body);

  const company = await prisma.company.create({
    data: {
      ...companyData,
      organizationId,
      createdById: userId,
      updatedById: userId
    },
    include: {
      createdBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  res.status(201).json({ 
    data: company,
    message: 'Company created successfully' 
  });
});

/**
 * Update existing company
 */
export const updateCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = CompanyParamsSchema.parse(req.params);
  const updateData = UpdateCompanySchema.parse(req.body);

  // Check if company exists
  const existingCompany = await prisma.company.findFirst({
    where: { id, organizationId }
  });

  if (!existingCompany) {
    throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
  }

  const company = await prisma.company.update({
    where: { id },
    data: {
      ...updateData,
      updatedById: userId,
      updatedAt: new Date()
    },
    include: {
      updatedBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  res.json({ 
    data: company,
    message: 'Company updated successfully' 
  });
});

/**
 * Delete company
 */
export const deleteCompany = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = CompanyParamsSchema.parse(req.params);

  // Check if company exists
  const company = await prisma.company.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: {
          contacts: true,
          deals: true
        }
      }
    }
  });

  if (!company) {
    throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
  }

  // Check if company has related records
  if (company._count.contacts > 0 || company._count.deals > 0) {
    throw new ApiError(
      'Cannot delete company with associated contacts or deals',
      400,
      'COMPANY_HAS_DEPENDENCIES'
    );
  }

  await prisma.company.delete({
    where: { id }
  });

  res.json({ 
    message: 'Company deleted successfully' 
  });
});

/**
 * Add labels to company
 */
export const addCompanyLabels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = CompanyParamsSchema.parse(req.params);
  const { labelIds } = req.body;

  if (!Array.isArray(labelIds) || labelIds.length === 0) {
    throw new ApiError('Label IDs array is required', 400, 'INVALID_LABEL_IDS');
  }

  // Verify company exists
  const company = await prisma.company.findFirst({
    where: { id, organizationId }
  });

  if (!company) {
    throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
  }

  // Verify all labels exist and belong to organization
  const labels = await prisma.label.findMany({
    where: { 
      id: { in: labelIds },
      organizationId 
    }
  });

  if (labels.length !== labelIds.length) {
    throw new ApiError('One or more labels not found', 404, 'LABELS_NOT_FOUND');
  }

  // Create label associations
  const labelData = labelIds.map((labelId: string) => ({
    companyId: id,
    labelId
  }));

  await prisma.companyLabel.createMany({
    data: labelData,
    skipDuplicates: true
  });

  res.json({ 
    message: 'Labels added successfully' 
  });
});

/**
 * Remove labels from company
 */
export const removeCompanyLabels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = CompanyParamsSchema.parse(req.params);
  const { labelIds } = req.body;

  if (!Array.isArray(labelIds) || labelIds.length === 0) {
    throw new ApiError('Label IDs array is required', 400, 'INVALID_LABEL_IDS');
  }

  // Verify company exists
  const company = await prisma.company.findFirst({
    where: { id, organizationId }
  });

  if (!company) {
    throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
  }

  await prisma.companyLabel.deleteMany({
    where: {
      companyId: id,
      labelId: { in: labelIds }
    }
  });

  res.json({ 
    message: 'Labels removed successfully' 
  });
});

/**
 * Get company statistics
 */
export const getCompanyStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  const stats = await prisma.company.aggregate({
    where: { organizationId },
    _count: { _all: true },
    _avg: { 
      annualRevenue: true,
      employeeCount: true 
    },
    _sum: { 
      annualRevenue: true 
    }
  });

  // Get industry breakdown
  const industryStats = await prisma.company.groupBy({
    by: ['industry'],
    where: { 
      organizationId,
      industry: { not: null }
    },
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } },
    take: 10
  });

  // Get size breakdown
  const sizeStats = await prisma.company.groupBy({
    by: ['size'],
    where: { 
      organizationId,
      size: { not: null }
    },
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } }
  });

  res.json({
    data: {
      total: stats._count._all,
      averageRevenue: stats._avg.annualRevenue,
      totalRevenue: stats._sum.annualRevenue,
      averageEmployees: stats._avg.employeeCount,
      byIndustry: industryStats.map(item => ({
        industry: item.industry,
        count: item._count._all
      })),
      bySize: sizeStats.map(item => ({
        size: item.size,
        count: item._count._all
      }))
    }
  });
});