import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateLabelSchema,
  UpdateLabelSchema,
  LabelQuerySchema,
  LabelParamsSchema
} from '../schemas/crm.schemas';

/**
 * Get all labels with filtering and pagination
 */
export const getLabels = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const pagination = req.pagination!;
  
  const query = LabelQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  // Add search filters
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  
  if (query.category) {
    where.category = query.category;
  }

  // Execute queries
  const [labels, totalCount] = await Promise.all([
    prisma.label.findMany({
      where,
      skip: pagination.offset,
      take: pagination.limit,
      orderBy: query.sortBy ? { [query.sortBy]: query.sortDir || 'asc' } : { name: 'asc' },
      include: {
        _count: {
          select: {
            contacts: true,
            companies: true,
            deals: true
          }
        }
      }
    }),
    prisma.label.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  res.json({
    data: labels,
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
 * Get single label by ID
 */
export const getLabel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = LabelParamsSchema.parse(req.params);

  const label = await prisma.label.findFirst({
    where: { 
      id,
      organizationId
    },
    include: {
      contacts: {
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              jobTitle: true
            }
          }
        }
      },
      companies: {
        include: {
          company: {
            select: {
              id: true,
              name: true,
              industry: true
            }
          }
        }
      },
      deals: {
        include: {
          deal: {
            select: {
              id: true,
              title: true,
              value: true,
              currency: true,
              stage: true
            }
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

  if (!label) {
    throw new ApiError('Label not found', 404, 'LABEL_NOT_FOUND');
  }

  res.json({ data: label });
});

/**
 * Create new label
 */
export const createLabel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const labelData = CreateLabelSchema.parse(req.body);

  // Check if label name already exists in organization
  const existingLabel = await prisma.label.findFirst({
    where: {
      organizationId,
      name: labelData.name
    }
  });

  if (existingLabel) {
    throw new ApiError('Label with this name already exists', 409, 'LABEL_NAME_EXISTS');
  }

  const label = await prisma.label.create({
    data: {
      ...labelData,
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
    data: label,
    message: 'Label created successfully' 
  });
});

/**
 * Update existing label
 */
export const updateLabel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = LabelParamsSchema.parse(req.params);
  const updateData = UpdateLabelSchema.parse(req.body);

  // Check if label exists
  const existingLabel = await prisma.label.findFirst({
    where: { id, organizationId }
  });

  if (!existingLabel) {
    throw new ApiError('Label not found', 404, 'LABEL_NOT_FOUND');
  }

  // Check if new name conflicts with existing labels (if name is being changed)
  if (updateData.name && updateData.name !== existingLabel.name) {
    const conflictingLabel = await prisma.label.findFirst({
      where: {
        organizationId,
        name: updateData.name,
        id: { not: id }
      }
    });

    if (conflictingLabel) {
      throw new ApiError('Label with this name already exists', 409, 'LABEL_NAME_EXISTS');
    }
  }

  const label = await prisma.label.update({
    where: { id },
    data: {
      ...updateData,
      updatedById: userId,
      updatedAt: new Date()
    },
    include: {
      updatedBy: {
        select: { id: true, firstName: true, lastName: true }
      },
      _count: {
        select: {
          contacts: true,
          companies: true,
          deals: true
        }
      }
    }
  });

  res.json({ 
    data: label,
    message: 'Label updated successfully' 
  });
});

/**
 * Delete label
 */
export const deleteLabel = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = LabelParamsSchema.parse(req.params);

  // Check if label exists
  const label = await prisma.label.findFirst({
    where: { id, organizationId },
    include: {
      _count: {
        select: {
          contacts: true,
          companies: true,
          deals: true
        }
      }
    }
  });

  if (!label) {
    throw new ApiError('Label not found', 404, 'LABEL_NOT_FOUND');
  }

  const totalUsage = label._count.contacts + label._count.companies + label._count.deals;
  
  if (totalUsage > 0) {
    throw new ApiError(
      `Cannot delete label that is used by ${totalUsage} records`,
      400,
      'LABEL_IN_USE'
    );
  }

  await prisma.label.delete({
    where: { id }
  });

  res.json({ 
    message: 'Label deleted successfully' 
  });
});

/**
 * Get label statistics
 */
export const getLabelStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  // Get label usage statistics
  const labelStats = await prisma.label.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      color: true,
      category: true,
      _count: {
        select: {
          contacts: true,
          companies: true,
          deals: true
        }
      }
    },
    orderBy: [
      { _count: { contacts: 'desc' } },
      { name: 'asc' }
    ]
  });

  // Calculate totals
  const totalLabels = labelStats.length;
  const totalUsage = labelStats.reduce((sum, label) => 
    sum + label._count.contacts + label._count.companies + label._count.deals, 0
  );

  // Group by category
  const categoryStats = labelStats.reduce((acc, label) => {
    const category = label.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = {
        category,
        count: 0,
        usage: 0
      };
    }
    acc[category].count += 1;
    acc[category].usage += label._count.contacts + label._count.companies + label._count.deals;
    return acc;
  }, {} as Record<string, { category: string; count: number; usage: number }>);

  // Most used labels
  const mostUsedLabels = labelStats
    .map(label => ({
      id: label.id,
      name: label.name,
      color: label.color,
      category: label.category,
      totalUsage: label._count.contacts + label._count.companies + label._count.deals,
      usageByType: {
        contacts: label._count.contacts,
        companies: label._count.companies,
        deals: label._count.deals
      }
    }))
    .sort((a, b) => b.totalUsage - a.totalUsage)
    .slice(0, 10);

  // Unused labels
  const unusedLabels = labelStats
    .filter(label => 
      label._count.contacts === 0 && 
      label._count.companies === 0 && 
      label._count.deals === 0
    )
    .map(label => ({
      id: label.id,
      name: label.name,
      color: label.color,
      category: label.category
    }));

  res.json({
    data: {
      summary: {
        totalLabels,
        totalUsage,
        unusedCount: unusedLabels.length
      },
      byCategory: Object.values(categoryStats),
      mostUsed: mostUsedLabels,
      unused: unusedLabels
    }
  });
});

/**
 * Bulk operations for labels
 */
export const bulkLabelOperations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { operation, labelIds, data } = req.body;

  if (!Array.isArray(labelIds) || labelIds.length === 0) {
    throw new ApiError('Label IDs array is required', 400, 'INVALID_LABEL_IDS');
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

  let result;

  switch (operation) {
    case 'delete':
      // Check if any labels are in use
      const labelsWithUsage = await prisma.label.findMany({
        where: { id: { in: labelIds } },
        include: {
          _count: {
            select: {
              contacts: true,
              companies: true,
              deals: true
            }
          }
        }
      });

      const labelsInUse = labelsWithUsage.filter(label =>
        label._count.contacts > 0 || label._count.companies > 0 || label._count.deals > 0
      );

      if (labelsInUse.length > 0) {
        throw new ApiError(
          `Cannot delete ${labelsInUse.length} labels that are in use`,
          400,
          'LABELS_IN_USE'
        );
      }

      result = await prisma.label.deleteMany({
        where: { id: { in: labelIds } }
      });
      break;

    case 'update':
      if (!data) {
        throw new ApiError('Update data is required', 400, 'UPDATE_DATA_REQUIRED');
      }

      result = await prisma.label.updateMany({
        where: { id: { in: labelIds } },
        data: {
          ...data,
          updatedById: userId,
          updatedAt: new Date()
        }
      });
      break;

    default:
      throw new ApiError('Invalid operation', 400, 'INVALID_OPERATION');
  }

  res.json({
    message: `Bulk ${operation} operation completed successfully`,
    affected: result.count
  });
});