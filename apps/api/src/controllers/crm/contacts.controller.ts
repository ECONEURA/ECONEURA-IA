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
const createContactSchema = z.object({
  companyId: z.string().uuid().optional(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  position: z.string().optional(),
  department: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  source: z.string().optional(),
  tags: z.array(z.string()).optional(),
  metadata: z.record(z.any()).optional()
})

const updateContactSchema = createContactSchema.partial()

export const contactsController = {
  // GET /api/v1/crm/contacts
  list: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { page, limit, sortBy, sortOrder } = parsePagination(req.query)
    const filters = parseFilters(req.query, [
      'companyId', 'firstName', 'lastName', 'email', 'status', 'position', 'tags'
    ])

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.contact)
      .filter(filters)
      .search(req.query.search as string, ['firstName', 'lastName', 'email', 'position'])
      .includeRelations({
        company: {
          select: {
            id: true,
            name: true
          }
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

  // GET /api/v1/crm/contacts/:id
  get: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { id } = req.params

    const queryBuilder = new TenantQueryBuilder(orgId, prisma.contact)
      .includeRelations({
        company: true,
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
        activities: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        _count: {
          select: {
            deals: true,
            activities: true
          }
        }
      })

    try {
      const contact = await queryBuilder.findOne(id)
      
      if (!contact) {
        return ApiResponse.error(res, 'Contact not found', 404)
      }

      return ApiResponse.success(res, contact)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/crm/contacts
  create: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const data = createContactSchema.parse(req.body)

    try {
      // Check for duplicate email in org
      const existing = await prisma.contact.findFirst({
        where: {
          orgId,
          email: data.email,
          deletedAt: null
        }
      })

      if (existing) {
        return ApiResponse.error(res, 'Contact with this email already exists', 409)
      }

      // Verify company belongs to org if provided
      if (data.companyId) {
        const company = await prisma.company.findFirst({
          where: {
            id: data.companyId,
            orgId,
            deletedAt: null
          }
        })

        if (!company) {
          return ApiResponse.error(res, 'Company not found', 404)
        }
      }

      const contact = await prisma.contact.create({
        data: {
          ...data,
          orgId,
          createdByUserId: userId
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'CREATE',
        resource: 'contact',
        resourceId: contact.id,
        metadata: { 
          name: `${contact.firstName} ${contact.lastName}`,
          email: contact.email
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, contact, 201)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // PUT /api/v1/crm/contacts/:id
  update: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params
    const data = updateContactSchema.parse(req.body)

    try {
      // Check if contact exists
      const existing = await prisma.contact.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Contact not found', 404)
      }

      // Check for duplicate email if email is being changed
      if (data.email && data.email !== existing.email) {
        const duplicate = await prisma.contact.findFirst({
          where: {
            orgId,
            email: data.email,
            deletedAt: null,
            NOT: { id }
          }
        })

        if (duplicate) {
          return ApiResponse.error(res, 'Contact with this email already exists', 409)
        }
      }

      // Verify company belongs to org if provided
      if (data.companyId) {
        const company = await prisma.company.findFirst({
          where: {
            id: data.companyId,
            orgId,
            deletedAt: null
          }
        })

        if (!company) {
          return ApiResponse.error(res, 'Company not found', 404)
        }
      }

      const contact = await prisma.contact.update({
        where: { id },
        data: {
          ...data,
          updatedByUserId: userId
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      })

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'UPDATE',
        resource: 'contact',
        resourceId: contact.id,
        metadata: { changes: data },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, contact)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // DELETE /api/v1/crm/contacts/:id
  delete: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params

    try {
      // Check if contact exists
      const existing = await prisma.contact.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!existing) {
        return ApiResponse.error(res, 'Contact not found', 404)
      }

      // Check if contact has active deals
      const activeDeals = await prisma.deal.count({
        where: {
          primaryContactId: id,
          status: 'OPEN',
          deletedAt: null
        }
      })

      if (activeDeals > 0) {
        return ApiResponse.error(
          res,
          'Cannot delete contact with active deals',
          400,
          { activeDeals }
        )
      }

      // Soft delete
      await prisma.contact.update({
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
        resource: 'contact',
        resourceId: id,
        metadata: {
          name: `${existing.firstName} ${existing.lastName}`,
          email: existing.email
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, { message: 'Contact deleted successfully' })
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // POST /api/v1/crm/contacts/:id/activities
  createActivity: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { id } = req.params
    const { type, subject, description, dueDate, priority } = req.body

    try {
      // Check if contact exists
      const contact = await prisma.contact.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!contact) {
        return ApiResponse.error(res, 'Contact not found', 404)
      }

      const activity = await prisma.activity.create({
        data: {
          orgId,
          type,
          subject,
          description,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority: priority || 'MEDIUM',
          entityType: 'CONTACT',
          entityId: id,
          assignedUserId: userId,
          status: 'PENDING'
        },
        include: {
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      return ApiResponse.success(res, activity, 201)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  }),

  // GET /api/v1/crm/contacts/:id/timeline
  getTimeline: asyncHandler(async (req: Request, res: Response) => {
    const { orgId } = req.user!
    const { id } = req.params
    const { page, limit } = parsePagination(req.query)

    try {
      // Check if contact exists
      const contact = await prisma.contact.findFirst({
        where: { id, orgId, deletedAt: null }
      })

      if (!contact) {
        return ApiResponse.error(res, 'Contact not found', 404)
      }

      // Get activities, notes, and interactions
      const where = {
        orgId,
        entityType: 'CONTACT',
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
          orderBy: { createdAt: 'desc' },
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

  // POST /api/v1/crm/contacts/import
  importContacts: asyncHandler(async (req: Request, res: Response) => {
    const { orgId, userId } = req.user!
    const { contacts } = req.body

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return ApiResponse.error(res, 'Invalid contacts data', 400)
    }

    if (contacts.length > 1000) {
      return ApiResponse.error(res, 'Cannot import more than 1000 contacts at once', 400)
    }

    try {
      const results = {
        imported: 0,
        skipped: 0,
        errors: [] as any[]
      }

      for (const contactData of contacts) {
        try {
          // Validate each contact
          const validated = createContactSchema.parse(contactData)

          // Check for duplicate
          const existing = await prisma.contact.findFirst({
            where: {
              orgId,
              email: validated.email,
              deletedAt: null
            }
          })

          if (existing) {
            results.skipped++
            results.errors.push({
              email: validated.email,
              error: 'Duplicate email'
            })
            continue
          }

          // Create contact
          await prisma.contact.create({
            data: {
              ...validated,
              orgId,
              createdByUserId: userId
            }
          })

          results.imported++
        } catch (error: any) {
          results.errors.push({
            email: contactData.email,
            error: error.message
          })
        }
      }

      // Create audit log
      await createAuditLog(prisma, {
        orgId,
        userId,
        action: 'IMPORT',
        resource: 'contact',
        metadata: results,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      })

      return ApiResponse.success(res, results)
    } catch (error) {
      return handlePrismaError(error, res)
    }
  })
}