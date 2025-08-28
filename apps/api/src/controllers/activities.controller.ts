import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthRequest } from '../middleware/auth';
import { ApiError, asyncHandler } from '../middleware/error-handler';
import {
  CreateActivitySchema,
  UpdateActivitySchema,
  ActivityQuerySchema,
  ActivityParamsSchema
} from '../schemas/crm.schemas';

/**
 * Get all activities with filtering and pagination
 */
export const getActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const pagination = req.pagination!;
  
  const query = ActivityQuerySchema.parse(req.query);
  
  const where: any = { organizationId };
  
  // Add search filters
  if (query.search) {
    where.OR = [
      { subject: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } },
      { notes: { contains: query.search, mode: 'insensitive' } }
    ];
  }
  
  if (query.type) {
    where.type = query.type;
  }
  
  if (query.status) {
    where.status = query.status;
  }
  
  if (query.priority) {
    where.priority = query.priority;
  }
  
  if (query.contactId) {
    where.contactId = query.contactId;
  }
  
  if (query.companyId) {
    where.companyId = query.companyId;
  }
  
  if (query.dealId) {
    where.dealId = query.dealId;
  }
  
  if (query.assignedToId) {
    where.assignedToId = query.assignedToId;
  }
  
  if (query.createdById) {
    where.createdById = query.createdById;
  }

  // Date range filters
  if (query.dueDateAfter || query.dueDateBefore) {
    where.dueDate = {};
    if (query.dueDateAfter) {
      where.dueDate.gte = new Date(query.dueDateAfter);
    }
    if (query.dueDateBefore) {
      where.dueDate.lte = new Date(query.dueDateBefore);
    }
  }

  if (query.createdAfter || query.createdBefore) {
    where.createdAt = {};
    if (query.createdAfter) {
      where.createdAt.gte = new Date(query.createdAfter);
    }
    if (query.createdBefore) {
      where.createdAt.lte = new Date(query.createdBefore);
    }
  }

  // Execute queries
  const [activities, totalCount] = await Promise.all([
    prisma.activity.findMany({
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
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true
          }
        },
        deal: {
          select: {
            id: true,
            title: true,
            stage: true,
            value: true
          }
        },
        assignedTo: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    }),
    prisma.activity.count({ where })
  ]);

  const totalPages = Math.ceil(totalCount / pagination.limit);

  res.json({
    data: activities,
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
 * Get single activity by ID
 */
export const getActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ActivityParamsSchema.parse(req.params);

  const activity = await prisma.activity.findFirst({
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
          industry: true
        }
      },
      deal: {
        select: {
          id: true,
          title: true,
          stage: true,
          value: true,
          currency: true
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
      createdBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      updatedBy: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  if (!activity) {
    throw new ApiError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
  }

  res.json({ data: activity });
});

/**
 * Create new activity
 */
export const createActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const activityData = CreateActivitySchema.parse(req.body);

  // Validate foreign key references
  if (activityData.contactId) {
    const contact = await prisma.contact.findFirst({
      where: { id: activityData.contactId, organizationId }
    });
    if (!contact) {
      throw new ApiError('Contact not found', 404, 'CONTACT_NOT_FOUND');
    }
  }

  if (activityData.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: activityData.companyId, organizationId }
    });
    if (!company) {
      throw new ApiError('Company not found', 404, 'COMPANY_NOT_FOUND');
    }
  }

  if (activityData.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: activityData.dealId, organizationId }
    });
    if (!deal) {
      throw new ApiError('Deal not found', 404, 'DEAL_NOT_FOUND');
    }
  }

  if (activityData.assignedToId) {
    const user = await prisma.user.findFirst({
      where: { id: activityData.assignedToId, organizationId }
    });
    if (!user) {
      throw new ApiError('Assigned user not found', 404, 'USER_NOT_FOUND');
    }
  }

  const activity = await prisma.activity.create({
    data: {
      ...activityData,
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
      deal: {
        select: { id: true, title: true }
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
    data: activity,
    message: 'Activity created successfully' 
  });
});

/**
 * Update existing activity
 */
export const updateActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  const { id } = ActivityParamsSchema.parse(req.params);
  const updateData = UpdateActivitySchema.parse(req.body);

  // Check if activity exists
  const existingActivity = await prisma.activity.findFirst({
    where: { id, organizationId }
  });

  if (!existingActivity) {
    throw new ApiError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
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

  if (updateData.dealId) {
    const deal = await prisma.deal.findFirst({
      where: { id: updateData.dealId, organizationId }
    });
    if (!deal) {
      throw new ApiError('Deal not found', 404, 'DEAL_NOT_FOUND');
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

  const activity = await prisma.activity.update({
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
      deal: {
        select: { id: true, title: true }
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
    data: activity,
    message: 'Activity updated successfully' 
  });
});

/**
 * Delete activity
 */
export const deleteActivity = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;
  const { id } = ActivityParamsSchema.parse(req.params);

  // Check if activity exists
  const activity = await prisma.activity.findFirst({
    where: { id, organizationId }
  });

  if (!activity) {
    throw new ApiError('Activity not found', 404, 'ACTIVITY_NOT_FOUND');
  }

  await prisma.activity.delete({
    where: { id }
  });

  res.json({ 
    message: 'Activity deleted successfully' 
  });
});

/**
 * Get activity statistics
 */
export const getActivityStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId } = req.user!;

  // Get activity counts by type
  const typeStats = await prisma.activity.groupBy({
    by: ['type'],
    where: { organizationId },
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } }
  });

  // Get activity counts by status
  const statusStats = await prisma.activity.groupBy({
    by: ['status'],
    where: { organizationId },
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } }
  });

  // Get overdue activities
  const overdueCount = await prisma.activity.count({
    where: {
      organizationId,
      status: { not: 'completed' },
      dueDate: { lt: new Date() }
    }
  });

  // Get activities due today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dueTodayCount = await prisma.activity.count({
    where: {
      organizationId,
      status: { not: 'completed' },
      dueDate: {
        gte: today,
        lt: tomorrow
      }
    }
  });

  // Get activities by user
  const userStats = await prisma.activity.groupBy({
    by: ['assignedToId'],
    where: { 
      organizationId,
      assignedToId: { not: null }
    },
    _count: { _all: true },
    orderBy: { _count: { _all: 'desc' } },
    take: 10
  });

  // Get user details for user stats
  const userIds = userStats.map(stat => stat.assignedToId).filter(Boolean) as string[];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, firstName: true, lastName: true }
  });

  const userStatsWithNames = userStats.map(stat => {
    const user = users.find(u => u.id === stat.assignedToId);
    return {
      userId: stat.assignedToId,
      userName: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
      count: stat._count._all
    };
  });

  // Get weekly activity trends
  const weeklyTrends = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('week', "createdAt") as week,
      COUNT(*) as count
    FROM "Activity" 
    WHERE "organizationId" = ${organizationId}
      AND "createdAt" >= NOW() - INTERVAL '8 weeks'
    GROUP BY DATE_TRUNC('week', "createdAt")
    ORDER BY week DESC
  `;

  res.json({
    data: {
      total: typeStats.reduce((sum, stat) => sum + stat._count._all, 0),
      overdue: overdueCount,
      dueToday: dueTodayCount,
      byType: typeStats.map(stat => ({
        type: stat.type,
        count: stat._count._all
      })),
      byStatus: statusStats.map(stat => ({
        status: stat.status,
        count: stat._count._all
      })),
      byUser: userStatsWithNames,
      weeklyTrends
    }
  });
});

/**
 * Get upcoming activities (due within next 7 days)
 */
export const getUpcomingActivities = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { organizationId, id: userId } = req.user!;
  
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  const activities = await prisma.activity.findMany({
    where: {
      organizationId,
      status: { not: 'completed' },
      dueDate: {
        gte: new Date(),
        lte: nextWeek
      },
      OR: [
        { assignedToId: userId },
        { createdById: userId }
      ]
    },
    orderBy: { dueDate: 'asc' },
    take: 50,
    include: {
      contact: {
        select: { id: true, firstName: true, lastName: true }
      },
      company: {
        select: { id: true, name: true }
      },
      deal: {
        select: { id: true, title: true }
      }
    }
  });

  res.json({ data: activities });
});