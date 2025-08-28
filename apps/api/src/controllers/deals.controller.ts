import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateDealSchema,
  UpdateDealSchema,
  DealQuerySchema,
  DealParamsSchema
} from '../schemas/crm.schemas';

/**
 * Get all deals with filtering and pagination
 */
export const getDeals = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const pagination = req.pagination!;
  
  const query = DealQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  // Add search filters
  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { 
        contact: {
          OR: [
            { firstName: { contains: query.search, mode: 'insensitive' } },
            { lastName: { contains: query.search, mode: 'insensitive' } }
          ]
        }
      },
      {
        company: {
          name: { contains: query.search, mode: 'insensitive' }
        }
      }
    ];
  }
  
  if (query.contactId) {
    where.contactId = query.contactId;
  }
  
  if (query.companyId) {
    where.companyId = query.companyId;
  }
  
  if (query.assignedToId) {
    where.assignedToId = query.assignedToId;
  }
  
  if (query.stage) {
    where.stage = query.stage;
  }
  
  if (query.status) {
    where.status = query.status;
  }
  
  if (query.priority) {
    where.priority = query.priority;
  }
  
  if (query.source) {
    where.source = query.source;
  }

  // Value range filters
  if (query.valueMin !== undefined || query.valueMax !== undefined) {
    where.value = {};
    if (query.valueMin !== undefined) {
      where.value.gte = query.valueMin;
    }
    if (query.valueMax !== undefined) {
      where.value.lte = query.valueMax;
    }
  }

  // Probability range filters
  if (query.probabilityMin !== undefined || query.probabilityMax !== undefined) {
    where.probability = {};
    if (query.probabilityMin !== undefined) {
      where.probability.gte = query.probabilityMin;
    }
    if (query.probabilityMax !== undefined) {
      where.probability.lte = query.probabilityMax;
    }
  }

  // Date range filters
  if (query.createdAfter || query.createdBefore) {
    where.createdAt = {};
    if (query.createdAfter) {
      where.createdAt.gte = new Date(query.createdAfter);
    }
    if (query.createdBefore) {
      where.createdAt.lte = new Date(query.createdBefore);
    }
  }

  if (query.expectedCloseAfter || query.expectedCloseBefore) {
    where.expectedCloseDate = {};
    if (query.expectedCloseAfter) {
      where.expectedCloseDate.gte = new Date(query.expectedCloseAfter);
    }
    if (query.expectedCloseBefore) {
      where.expectedCloseDate.lte = new Date(query.expectedCloseBefore);
    }
  }

  // Execute queries
  const [deals, totalCount] = await Promise.all([
    prisma.deal.findMany({
      where,
      skip: pagination.offset,
      take: pagination.limit,
      orderBy: query.sortBy ? { [query.sortBy]: query.sortDir || 'asc' } : { createdAt: 'desc' },
      include: {
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        labels: {
          include: {
            label: {
              select: { id: true, name: true, color: true }
            }
          }
        },
        _count: {
          select: {
            activities: true
          }
        }
      }
    }),
    prisma.deal.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  res.json({
    data: deals,
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
 * Get single deal by ID
 */
export const getDeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = DealParamsSchema.parse(req.params);

  const deal = await prisma.deal.findFirst({
    where: { 
      id,
      organizationId
    },
    include: {
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobTitle: true
        }
      },
      company: {
        select: {
          id: true,
          name: true,
          industry: true,
          website: true,
          size: true
        }
      },
      assignedTo: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      },
      labels: {
        include: {
          label: {
            select: { id: true, name: true, color: true }
          }
        }
      },
      activities: {
        orderBy: { createdAt: 'desc' },
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

  if (!deal) {
    throw new ApiError('Deal not found', 404, 'DEAL_NOT_FOUND');
  }

  res.json({ data: deal });
});

/**
 * Create new deal
 */
export const createDeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const dealData = CreateDealSchema.parse(req.body);

  // Validate foreign key references
  if (dealData.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: dealData.contactId, organizationId }
    });
    if (!contact) {
      throw new ApiError('Contact not found', 404, 'CONTACT_NOT_FOUND');
    }
  }

  if (dealData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: dealData.companyId, organizationId }
    });
    if (!company) {
      throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }
  }

  if (dealData.assignedToId) {
    const user = await prisma.user.findFirst({
      where: { id: dealData.assignedToId, organizationId }
    });
    if (!user) {
      throw new ApiError('Assigned user not found', 404, 'USER_NOT_FOUND');
    }
  }

  const deal = await prisma.deal.create({
    data: {
      ...dealData,
      organizationId,
      createdById: userId,
      updatedById: userId
    },
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true }
      },
      company: {
        select: { id: true, name: true }
      },
      assignedTo: {
        select: { id: true, firstName: true, lastName: true }
      },
      createdBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  res.status(201).json({ 
    data: deal,
    message: 'Deal created successfully' 
  });
});

/**
 * Update existing deal
 */
export const updateDeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = DealParamsSchema.parse(req.params);
  const updateData = UpdateDealSchema.parse(req.body);

  // Check if deal exists
  const existingDeal = await prisma.deal.findFirst({
    where: { id, organizationId }
  });

  if (!existingDeal) {
    throw new ApiError('Deal not found', 404, 'DEAL_NOT_FOUND');
  }

  // Validate foreign key references if provided
  if (updateData.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: updateData.contactId, organizationId }
    });
    if (!contact) {
      throw new ApiError('Contact not found', 404, 'CONTACT_NOT_FOUND');
    }
  }

  if (updateData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: updateData.companyId, organizationId }
    });
    if (!company) {
      throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }
  }

  if (updateData.assignedToId) {
    const user = await prisma.user.findFirst({
      where: { id: updateData.assignedToId, organizationId }
    });
    if (!user) {
      throw new ApiError('Assigned user not found', 404, 'USER_NOT_FOUND');
    }
  }

  const deal = await prisma.deal.update({
    where: { id },
    data: {
      ...updateData,
      updatedById: userId,
      updatedAt: new Date()
    },
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true }
      },
      company: {
        select: { id: true, name: true }
      },
      assignedTo: {
        select: { id: true, firstName: true, lastName: true }
      },
      updatedBy: {
        select: { id: true, firstName: true, lastName: true }
      }
    }
  });

  res.json({ 
    data: deal,
    message: 'Deal updated successfully' 
  });
});

/**
 * Delete deal
 */
export const deleteDeal = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = DealParamsSchema.parse(req.params);

  // Check if deal exists
  const deal = await prisma.deal.findFirst({
    where: { id, organizationId }
  });

  if (!deal) {
    throw new ApiError('Deal not found', 404, 'DEAL_NOT_FOUND');
  }

  await prisma.deal.delete({
    where: { id }
  });

  res.json({ 
    message: 'Deal deleted successfully' 
  });
});

/**
 * Get deals pipeline/funnel stats
 */
export const getDealsPipeline = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  // Get deals grouped by stage
  const stageStats = await prisma.deal.groupBy({
    by: ['stage'],
    where: { 
      organizationId,
      status: 'open'
    },
    _count: { _all: true },
    _sum: { value: true },
    _avg: { probability: true }
  });

  // Get overall pipeline stats
  const pipelineStats = await prisma.deal.aggregate({
    where: { 
      organizationId,
      status: 'open'
    },
    _count: { _all: true },
    _sum: { value: true },
    _avg: { 
      value: true,
      probability: true
    }
  });

  // Get monthly trends (last 12 months)
  const monthlyTrends = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('month', "createdAt") as month,
      COUNT(*) as count,
      SUM("value") as total_value,
      AVG("probability") as avg_probability
    FROM "Deal" 
    WHERE "organizationId" = ${organizationId}
      AND "createdAt" >= NOW() - INTERVAL '12 months'
    GROUP BY DATE_TRUNC('month', "createdAt")
    ORDER BY month DESC
  `;

  // Calculate weighted pipeline value
  const weightedValue = stageStats.reduce((sum, stage) => {
    const stageValue = stage._sum.value || 0;
    const avgProbability = stage._avg.probability || 0;
    return sum + (stageValue * avgProbability / 100);
  }, 0);

  res.json({
    data: {
      pipeline: {
        totalDeals: pipelineStats._count._all,
        totalValue: pipelineStats._sum.value,
        averageValue: pipelineStats._avg.value,
        averageProbability: pipelineStats._avg.probability,
        weightedValue
      },
      stages: stageStats.map(stage => ({
        stage: stage.stage,
        count: stage._count._all,
        totalValue: stage._sum.value,
        averageProbability: stage._avg.probability,
        weightedValue: (stage._sum.value || 0) * (stage._avg.probability || 0) / 100
      })),
      trends: monthlyTrends
    }
  });
});

/**
 * Add labels to deal
 */
export const addDealLabels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = DealParamsSchema.parse(req.params);
  const { labelIds } = req.body;

  if (!Array.isArray(labelIds) || labelIds.length === 0) {
    throw new ApiError('Label IDs array is required', 400, 'INVALID_LABEL_IDS');
  }

  // Verify deal exists
  const deal = await prisma.deal.findFirst({
    where: { id, organizationId }
  });

  if (!deal) {
    throw new ApiError('Deal not found', 404, 'DEAL_NOT_FOUND');
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
    dealId: id,
    labelId
  }));

  await prisma.dealLabel.createMany({
    data: labelData,
    skipDuplicates: true
  });

  res.json({ 
    message: 'Labels added successfully' 
  });
});

/**
 * Remove labels from deal
 */
export const removeDealLabels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = DealParamsSchema.parse(req.params);
  const { labelIds } = req.body;

  if (!Array.isArray(labelIds) || labelIds.length === 0) {
    throw new ApiError('Label IDs array is required', 400, 'INVALID_LABEL_IDS');
  }

  // Verify deal exists
  const deal = await prisma.deal.findFirst({
    where: { id, organizationId }
  });

  if (!deal) {
    throw new ApiError('Deal not found', 404, 'DEAL_NOT_FOUND');
  }

  await prisma.dealLabel.deleteMany({
    where: {
      dealId: id,
      labelId: { in: labelIds }
    }
  });

  res.json({ 
    message: 'Labels removed successfully' 
  });
});