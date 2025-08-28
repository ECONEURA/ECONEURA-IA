import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { DealSchema } from '@econeura/shared/schemas/crm'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/crm/deals - List deals
router.get(
  '/',
  authenticateJWT,
  requirePermission('crm:deals:read'),
  validateRequest({
    query: z.object({
      page: z.string().optional().transform(v => parseInt(v || '1')),
      limit: z.string().optional().transform(v => parseInt(v || '20')),
      search: z.string().optional(),
      stage: z.enum(['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
      status: z.enum(['OPEN', 'CLOSED']).optional(),
      assignedUserId: z.string().optional(),
      companyId: z.string().optional(),
      minValue: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
      maxValue: z.string().optional().transform(v => v ? parseFloat(v) : undefined),
      sortBy: z.enum(['title', 'value', 'createdAt', 'expectedCloseDate', 'stage']).optional(),
      sortOrder: z.enum(['asc', 'desc']).optional()
    })
  }),
  async (req, res) => {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      stage, 
      status, 
      assignedUserId,
      companyId,
      minValue,
      maxValue,
      sortBy = 'createdAt', 
      sortOrder = 'desc' 
    } = req.query
    
    const offset = (page - 1) * limit

    const where = {
      orgId: req.user.organizationId,
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      }),
      ...(stage && { stage }),
      ...(status && { status }),
      ...(assignedUserId && { assignedUserId }),
      ...(companyId && { companyId }),
      ...(minValue !== undefined && { value: { gte: minValue } }),
      ...(maxValue !== undefined && { value: { lte: maxValue } })
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip: offset,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          primaryContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true
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
    ])

    // Calculate pipeline metrics
    const metrics = await prisma.deal.groupBy({
      by: ['stage'],
      where: {
        orgId: req.user.organizationId,
        status: 'OPEN'
      },
      _sum: {
        value: true
      },
      _count: {
        id: true
      }
    })

    res.json({
      data: deals,
      metrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  }
)

// GET /api/v1/crm/deals/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('crm:deals:read'),
  async (req, res) => {
    const deal = await prisma.deal.findFirst({
      where: {
        id: req.params.id,
        orgId: req.user.organizationId
      },
      include: {
        company: true,
        primaryContact: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: {
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    })

    if (!deal) {
      return res.status(404).json({
        error: 'Deal not found'
      })
    }

    res.json(deal)
  }
)

// POST /api/v1/crm/deals
router.post(
  '/',
  authenticateJWT,
  requirePermission('crm:deals:write'),
  validateRequest({
    body: DealSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true })
  }),
  async (req, res) => {
    try {
      // Validate company exists
      if (req.body.companyId) {
        const company = await prisma.company.findFirst({
          where: {
            id: req.body.companyId,
            orgId: req.user.organizationId
          }
        })

        if (!company) {
          return res.status(400).json({
            error: 'Company not found'
          })
        }
      }

      // Validate contact exists
      if (req.body.primaryContactId) {
        const contact = await prisma.contact.findFirst({
          where: {
            id: req.body.primaryContactId,
            orgId: req.user.organizationId
          }
        })

        if (!contact) {
          return res.status(400).json({
            error: 'Contact not found'
          })
        }
      }

      const deal = await prisma.deal.create({
        data: {
          ...req.body,
          orgId: req.user.organizationId,
          assignedUserId: req.body.assignedUserId || req.user.id
        },
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          primaryContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Create activity for deal creation
      await prisma.activity.create({
        data: {
          orgId: req.user.organizationId,
          type: 'NOTE',
          subject: 'Deal created',
          description: `Deal "${deal.title}" was created`,
          entityType: 'DEAL',
          entityId: deal.id,
          status: 'COMPLETED',
          assignedUserId: req.user.id
        }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'CREATE',
          resource: 'deal',
          resourceId: deal.id,
          metadata: { 
            title: deal.title,
            value: deal.value,
            stage: deal.stage
          }
        }
      })

      res.status(201).json(deal)
    } catch (error) {
      console.error('Error creating deal:', error)
      res.status(400).json({
        error: 'Failed to create deal'
      })
    }
  }
)

// PUT /api/v1/crm/deals/:id
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('crm:deals:write'),
  validateRequest({
    body: DealSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true }).partial()
  }),
  async (req, res) => {
    try {
      const existing = await prisma.deal.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!existing) {
        return res.status(404).json({
          error: 'Deal not found'
        })
      }

      // Track stage changes
      const stageChanged = req.body.stage && req.body.stage !== existing.stage

      const deal = await prisma.deal.update({
        where: { id: req.params.id },
        data: req.body,
        include: {
          company: {
            select: {
              id: true,
              name: true
            }
          },
          primaryContact: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      })

      // Create activity for stage change
      if (stageChanged) {
        await prisma.activity.create({
          data: {
            orgId: req.user.organizationId,
            type: 'NOTE',
            subject: 'Deal stage changed',
            description: `Deal stage changed from ${existing.stage} to ${req.body.stage}`,
            entityType: 'DEAL',
            entityId: deal.id,
            status: 'COMPLETED',
            assignedUserId: req.user.id
          }
        })
      }

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'UPDATE',
          resource: 'deal',
          resourceId: deal.id,
          metadata: { 
            changes: req.body,
            stageChanged
          }
        }
      })

      res.json(deal)
    } catch (error) {
      console.error('Error updating deal:', error)
      res.status(400).json({
        error: 'Failed to update deal'
      })
    }
  }
)

// DELETE /api/v1/crm/deals/:id
router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('crm:deals:delete'),
  async (req, res) => {
    try {
      const deal = await prisma.deal.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!deal) {
        return res.status(404).json({
          error: 'Deal not found'
        })
      }

      // Delete related activities
      await prisma.activity.deleteMany({
        where: {
          entityType: 'DEAL',
          entityId: deal.id
        }
      })

      await prisma.deal.delete({
        where: { id: req.params.id }
      })

      // Log audit event
      await prisma.auditLog.create({
        data: {
          orgId: req.user.organizationId,
          userId: req.user.id,
          action: 'DELETE',
          resource: 'deal',
          resourceId: deal.id,
          metadata: { 
            title: deal.title,
            value: deal.value
          }
        }
      })

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting deal:', error)
      res.status(400).json({
        error: 'Failed to delete deal'
      })
    }
  }
)

// POST /api/v1/crm/deals/:id/activities
router.post(
  '/:id/activities',
  authenticateJWT,
  requirePermission('crm:activities:write'),
  validateRequest({
    body: z.object({
      type: z.enum(['CALL', 'EMAIL', 'MEETING', 'TASK', 'NOTE']),
      subject: z.string(),
      description: z.string().optional(),
      dueDate: z.string().optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
    })
  }),
  async (req, res) => {
    try {
      const deal = await prisma.deal.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user.organizationId
        }
      })

      if (!deal) {
        return res.status(404).json({
          error: 'Deal not found'
        })
      }

      const activity = await prisma.activity.create({
        data: {
          ...req.body,
          orgId: req.user.organizationId,
          entityType: 'DEAL',
          entityId: deal.id,
          status: 'PENDING',
          assignedUserId: req.user.id
        }
      })

      res.status(201).json(activity)
    } catch (error) {
      console.error('Error creating activity:', error)
      res.status(400).json({
        error: 'Failed to create activity'
      })
    }
  }
)

export { router as dealsRouter }