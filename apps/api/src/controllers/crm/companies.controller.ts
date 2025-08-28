import { Request, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import {
  ApiResponse,
  asyncHandler,
  parsePagination,
  parseFilters,
  handlePrismaError,
  TenantQueryBuilder,
  createAuditLog,
  validateRequest
} from '../../utils/controller'

const prisma = new PrismaClient()

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(1).max(255),
  industry: z.string().optional(),
  website: z.string().url().optional(),
  employees: z.number().int().min(0).optional(),
  status: z.enum(['PROSPECT', 'LEAD', 'CUSTOMER', 'PARTNER', 'COMPETITOR', 'CHURNED']).optional(),
  taxId: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

const updateCompanySchema = createCompanySchema.partial()

export const companiesController = {
  // GET /api/v1/crm/companies
  list: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { page, limit, sortBy, sortOrder } = parsePagination(req.query)
    const filters = parseFilters(req.query, [
      'name', 'industry', 'status', 'city', 'country', 'tags'
    ])

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.company)
      .filter(filters)
      .search(req.query.search as string, ['name', 'email', 'website'])
      .sort(sortBy!, sortOrder!)
      .paginate(page!, limit!)

    try {
      const { data, total } = await queryBuilder.execute()
      return ApiResponse.paginated(res, data, total, page!, limit!)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/crm/companies/:id
  get: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { id } = req.params

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.company)
      .includeRelations({
        contacts: {
          where: { deletedAt: null },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            position: true
          }
        },
        deals: {
          where: { deletedAt: null },
          select: {
            id: true,
            title: true,
            value: true,
            stage: true,
            status: true
          }
        },
        _count: {
          select: {
            contacts: true,
            deals: true,
            activities: true,
            invoices: true
          }
        }
      })

    try {
      const company = await queryBuilder.findOne(id)
      
      if (!company) {
        return ApiResponse.error(res, 'Company not found', 404)
      }

      return ApiResponse.success(res, company)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/crm/companies
  create: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const data = createCompanySchema.parse(req.body)

    try {
      const company = await prisma.company.create({
        data: {
          ...data,
          orgId,
          createdByUserId: userId
        },
        include: {
          _count: {
            select: {
              contacts: true,
              deals: true
            }
          }
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'CREATE',
        resource: 'company',
        resourceId: company.id,
        metadata: { name: company.name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, company, 201)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // PUT /api/v1/crm/companies/:id
  update: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params
    const data = updateCompanySchema.parse(req.body)

    try {
      // Check if company exists
      const existing = await prisma.company.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Company not found', 404)
      }

      const company = await prisma.company.update({
        where: { id },
        data: {
          ...data,
          updatedByUserId: userId
        },
        include: {
          _count: {
            select: {
              contacts: true,
              deals: true
            }
          }
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'UPDATE',
        resource: 'company',
        resourceId: company.id,
        metadata: { changes: data },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, company)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // DELETE /api/v1/crm/companies/:id
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params

    try {
      // Check if company exists
      const existing = await prisma.company.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Company not found', 404)
      }

      // Soft delete
      await prisma.company.update({
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
        resource: 'company',
        resourceId: id,
        metadata: { name: existing.name },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, { message: 'Company deleted successfully' })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/crm/companies/:id/contacts
  addContact: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params
    const { contactId } = req.body

    try {
      // Check if company exists
      const company = await prisma.company.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!company) {
        return ApiResponse.error(res, 'Company not found', 404)
      }

      // Check if contact exists
      const contact = await prisma.contact.findFirst({
        where: { id: contactId, orgId, deletedAt: null }
      })

      if (!contact) {
        return ApiResponse.error(res, 'Contact not found', 404)
      }

      // Update contact with company
      await prisma.contact.update({
        where: { id: contactId },
        data: {
          companyId: id,
          updatedByUserId: userId
        }
      })

      return ApiResponse.success(res, { message: 'Contact added to company' })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/crm/companies/:id/activities
  getActivities: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { id } = req.params
    const { page, limit, sortBy, sortOrder } = parsePagination(req.query)

    try {
      // Check if company exists
      const company = await prisma.company.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!company) {
        return ApiResponse.error(res, 'Company not found', 404)
      }

      const where = {
        orgId,
        entityType: 'COMPANY',
        entityId: id,
        deletedAt: null
      }

      const [activities, total] = await Promise.all([
        prisma.activity.findMany({
          where,
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { [sortBy!]: sortOrder },
          take: limit,
          skip: (page! - 1) * limit!
        }),
        prisma.activity.count({ where })
      ])

      return ApiResponse.paginated(res, activities, total, page!, limit!)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/crm/companies/stats
  getStats: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!

    try {
      const stats = await prisma.company.groupBy({
        by: ['status'],
        where: { orgId, deletedAt: null },
        _count: {
          id: true
        }
      })

      const total = await prisma.company.count({
        where: { orgId, deletedAt: null }
      })

      const recentlyAdded = await prisma.company.count({
        where: {
          orgId,
          deletedAt: null,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      })

      return ApiResponse.success(res, {
        total,
        recentlyAdded,
        byStatus: stats.reduce((acc, item) => {
          acc[item.status] = item._count.id
          return acc
        }, {} as Record<string, number>)
      })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  })
}