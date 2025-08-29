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
const createDealSchema = z.object({
  title: z.string().min(1).max(255),
  companyId: z.string().uuid().optional(),
  primaryContactId: z.string().uuid().optional(),
  value: z.number().min(0),
  currency: z.string().default('EUR'),
  stage: z.enum(['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']),
  status: z.enum(['OPEN', 'CLOSED']).default('OPEN'),
  probability: z.number().min(0).max(100).default(50),
  expectedCloseDate: z.string().datetime().optional(),
  assignedUserId: z.string().uuid().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

const updateDealSchema = createDealSchema.partial()

export const dealsController = {
  // GET /api/v1/crm/deals
  list: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId, permissions } = req.user!
    const { page, limit, sortBy, sortOrder } = parsePagination(req.query)
    const filters = parseFilters(req.query, [
      'companyId', 'stage', 'status', 'assignedUserId', 'tags'
    ])

    // Apply own-data filter if user doesn't have full read permission
    if (!permissions.includes('crm:deals:read') && permissions.includes('crm:deals:read:own')) {
      filters.assignedUserId = userId
    }

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.deal)
      .filter(filters)
      .search(req.query.search as string, ['title', 'description'])
      .includeRelations({
        company: {
          select: { id: true, name: true }
        },
        primaryContact: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        assignedUser: {
          select: { id: true, name: true }
        }
      })
      .sort(sortBy!, sortOrder!)
      .paginate(page!, limit!)

    try {
      const { data, total } = await queryBuilder.execute()
      return ApiResponse.paginated(res, data, total, page!, limit!)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/crm/deals/:id
  get: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId, permissions } = req.user!
    const { id } = req.params

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.deal)
      .includeRelations({
        company: true,
        primaryContact: true,
        assignedUser: {
          select: { id: true, name: true, email: true }
        },
        activities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        createdByUser: {
          select: { id: true, name: true }
        },
        updatedByUser: {
          select: { id: true, name: true }
        }
      })

    try {
      const deal = await queryBuilder.findOne(id)
      
      if (!deal) {
        return ApiResponse.error(res, 'Deal not found', 404)
      }

      // Check ownership if user has only own-data permission
      if (!permissions.includes('crm:deals:read') && permissions.includes('crm:deals:read:own')) {
        if (deal.assignedUserId !== userId) {
          return ApiResponse.error(res, 'Access denied', 403)
        }
      }

      return ApiResponse.success(res, deal)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/crm/deals
  create: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const data = createDealSchema.parse(req.body)

    try {
      // Verify related entities belong to org
      if (data.companyId) {
        const company = await prisma.company.findFirst({
          where: { id: data.companyId, orgId, deletedAt: null }
        })
        if (!company) {
          return ApiResponse.error(res, 'Company not found', 404)
        }
      }

      if (data.primaryContactId) {
        const contact = await prisma.contact.findFirst({
          where: { id: data.primaryContactId, orgId, deletedAt: null }
        })
        if (!contact) {
          return ApiResponse.error(res, 'Contact not found', 404)
        }
      }

      const deal = await prisma.deal.create({
        data: {
          ...data,
          orgId,
          assignedUserId: data.assignedUserId || userId,
          createdByUserId: userId,
          expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined
        },
        include: {
          company: { select: { id: true, name: true } },
          primaryContact: { select: { id: true, firstName: true, lastName: true } },
          assignedUser: { select: { id: true, name: true } }
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'CREATE',
        resource: 'deal',
        resourceId: deal.id,
        metadata: {
          title: deal.title,
          value: deal.value,
          stage: deal.stage
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, deal, 201)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // PUT /api/v1/crm/deals/:id
  update: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId, permissions } = req.user!
    const { id } = req.params
    const data = updateDealSchema.parse(req.body)

    try {
      // Check if deal exists
      const existing = await prisma.deal.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Deal not found', 404)
      }

      // Check ownership if user has only own-data permission
      if (!permissions.includes('crm:deals:write') && permissions.includes('crm:deals:write:own')) {
        if (existing.assignedUserId !== userId) {
          return ApiResponse.error(res, 'Access denied', 403)
        }
      }

      // Track stage changes for audit
      const stageChanged = data.stage && data.stage !== existing.stage

      const deal = await prisma.deal.update({
        where: { id },
        data: {
          ...data,
          updatedByUserId: userId,
          expectedCloseDate: data.expectedCloseDate ? new Date(data.expectedCloseDate) : undefined,
          closedAt: data.stage && ['CLOSED_WON', 'CLOSED_LOST'].includes(data.stage) 
            ? new Date() 
            : existing.closedAt
        },
        include: {
          company: { select: { id: true, name: true } },
          primaryContact: { select: { id: true, firstName: true, lastName: true } },
          assignedUser: { select: { id: true, name: true } }
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: stageChanged ? 'STAGE_CHANGE' : 'UPDATE',
        resource: 'deal',
        resourceId: deal.id,
        metadata: {
          changes: data,
          previousStage: stageChanged ? existing.stage : undefined,
          newStage: stageChanged ? data.stage : undefined
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, deal)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // DELETE /api/v1/crm/deals/:id
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId, permissions } = req.user!
    const { id } = req.params

    try {
      // Check if deal exists
      const existing = await prisma.deal.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Deal not found', 404)
      }

      // Check ownership if user has only own-data permission
      if (!permissions.includes('crm:deals:delete') && permissions.includes('crm:deals:delete:own')) {
        if (existing.assignedUserId !== userId) {
          return ApiResponse.error(res, 'Access denied', 403)
        }
      }

      // Soft delete
      await prisma.deal.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          updatedByUserId: userId
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'DELETE',
        resource: 'deal',
        resourceId: id,
        metadata: {
          title: existing.title,
          value: existing.value,
          stage: existing.stage
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, { message: 'Deal deleted successfully' })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/crm/deals/pipeline
  getPipeline: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId, permissions } = req.user!
    const filters = parseFilters(req.query, ['assignedUserId', 'companyId'])

    // Apply own-data filter if needed
    if (!permissions.includes('crm:deals:read') && permissions.includes('crm:deals:read:own')) {
      filters.assignedUserId = userId
    }

    try {
      const stages = ['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
      
      const pipeline = await Promise.all(
        stages.map(async (stage) => {
          const deals = await prisma.deal.findMany({
            where: {
              orgId,
              stage,
              deletedAt: null,
              ...filters
            },
            select: {
              id: true,
              title: true,
              value: true,
              probability: true,
              expectedCloseDate: true,
              company: {
                select: { id: true, name: true }
              },
              assignedUser: {
                select: { id: true, name: true }
              }
            },
            orderBy: { value: 'desc' },
            take: 50
          })

          const stats = await prisma.deal.aggregate({
            where: {
              orgId,
              stage,
              deletedAt: null,
              ...filters
            },
            _sum: { value: true },
            _count: { id: true }
          })

          return {
            stage,
            deals,
            count: stats._count.id,
            totalValue: stats._sum.value || 0
          }
        })
      )

      // Calculate conversion rates
      const conversionRates = stages.slice(0, -2).map((stage, index) => {
        const current = pipeline[index]
        const next = pipeline[index + 1]
        const rate = current.count > 0 ? (next.count / current.count) * 100 : 0
        
        return {
          from: stage,
          to: stages[index + 1],
          rate: Math.round(rate * 100) / 100
        }
      })

      return ApiResponse.success(res, {
        pipeline,
        conversionRates,
        summary: {
          totalDeals: pipeline.reduce((sum, stage) => sum + stage.count, 0),
          totalValue: pipeline.reduce((sum, stage) => sum + stage.totalValue, 0),
          wonDeals: pipeline.find(s => s.stage === 'CLOSED_WON')?.count || 0,
          lostDeals: pipeline.find(s => s.stage === 'CLOSED_LOST')?.count || 0
        }
      })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/crm/deals/forecast
  getForecast: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { startDate, endDate } = req.query

    try {
      const start = startDate ? new Date(startDate as string) : new Date()
      const end = endDate ? new Date(endDate as string) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)

      const deals = await prisma.deal.findMany({
        where: {
          orgId,
          status: 'OPEN',
          expectedCloseDate: {
            gte: start,
            lte: end
          },
          deletedAt: null
        },
        select: {
          id: true,
          title: true,
          value: true,
          probability: true,
          expectedCloseDate: true,
          stage: true,
          assignedUser: {
            select: { id: true, name: true }
          }
        },
        orderBy: { expectedCloseDate: 'asc' }
      })

      // Calculate weighted forecast
      const forecast = deals.reduce((acc, deal) => {
        const weighted = (deal.value * deal.probability) / 100
        const month = deal.expectedCloseDate!.toISOString().slice(0, 7)
        
        if (!acc[month]) {
          acc[month] = {
            expected: 0,
            weighted: 0,
            count: 0,
            deals: []
          }
        }
        
        acc[month].expected += deal.value
        acc[month].weighted += weighted
        acc[month].count++
        acc[month].deals.push(deal)
        
        return acc
      }, {} as Record<string, any>)

      return ApiResponse.success(res, {
        forecast,
        summary: {
          totalExpected: deals.reduce((sum, deal) => sum + deal.value, 0),
          totalWeighted: deals.reduce((sum, deal) => sum + (deal.value * deal.probability) / 100, 0),
          dealCount: deals.length,
          period: { start, end }
        }
      })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  })
}