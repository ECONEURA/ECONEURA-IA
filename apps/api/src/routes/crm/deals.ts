import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { DealSchema } from '@econeura/shared/schemas/crm'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/crm/deals
router.get(
  '/',
  authenticateJWT,
  requirePermission('crm:deals:read'),
  validateRequest({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
      search: z.string().optional(),
      stage: z.enum(['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']).optional(),
      status: z.enum(['OPEN', 'CLOSED']).optional(),
      assignedUserId: z.string().uuid().optional(),
      companyId: z.string().uuid().optional(),
      minValue: z.string().regex(/^\d+$/).transform(Number).optional(),
      maxValue: z.string().regex(/^\d+$/).transform(Number).optional(),
      sortBy: z.enum(['title', 'value', 'stage', 'expectedCloseDate', 'createdAt']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
  }),
  async (req, res) => {
    try {
      const { page, limit, search, stage, status, assignedUserId, companyId, minValue, maxValue, sortBy, sortOrder } = req.query as any
      const offset = (page - 1) * limit

      const where: any = {
        orgId: req.user!.organizationId,
        deletedAt: null
      }

      if (search) {
        where.title = { contains: search, mode: 'insensitive' }
      }

      if (stage) where.stage = stage
      if (status) where.status = status
      if (assignedUserId) where.assignedUserId = assignedUserId
      if (companyId) where.companyId = companyId
      
      if (minValue || maxValue) {
        where.value = {}
        if (minValue) where.value.gte = minValue
        if (maxValue) where.value.lte = maxValue
      }

      const [deals, total] = await Promise.all([
        prisma.deal.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            company: true,
            primaryContact: true,
            assignedUser: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }),
        prisma.deal.count({ where })
      ])

      res.json({
        data: deals,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching deals:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/v1/crm/deals/pipeline
router.get(
  '/pipeline',
  authenticateJWT,
  requirePermission('crm:deals:read'),
  async (req, res) => {
    try {
      const pipeline = await prisma.deal.groupBy({
        by: ['stage'],
        where: {
          orgId: req.user!.organizationId,
          status: 'OPEN',
          deletedAt: null
        },
        _count: {
          id: true
        },
        _sum: {
          value: true
        }
      })

      const stages = ['LEAD', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON', 'CLOSED_LOST']
      const result = stages.map(stage => {
        const data = pipeline.find(p => p.stage === stage)
        return {
          stage,
          count: data?._count?.id || 0,
          value: data?._sum?.value || 0
        }
      })

      res.json(result)
    } catch (error) {
      console.error('Error fetching pipeline:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/v1/crm/deals/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('crm:deals:read'),
  async (req, res) => {
    try {
      const deal = await prisma.deal.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
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
          }
        }
      })

      if (!deal) {
        return res.status(404).json({ error: 'Deal not found' })
      }

      res.json(deal)
    } catch (error) {
      console.error('Error fetching deal:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
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
      const deal = await prisma.deal.create({
        data: {
          ...req.body,
          orgId: req.user!.organizationId,
          assignedUserId: req.body.assignedUserId || req.user!.id
        }
      })

      // Create activity for deal creation
      await prisma.activity.create({
        data: {
          orgId: req.user!.organizationId,
          type: 'NOTE',
          subject: 'Deal created',
          description: `Deal "${deal.title}" was created`,
          entityType: 'DEAL',
          entityId: deal.id,
          status: 'COMPLETED',
          assignedUserId: req.user!.id
        }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'CREATE',
          resource: 'deal',
          resourceId: deal.id,
          metadata: { deal: deal.title, value: deal.value }
        }
      })

      res.status(201).json(deal)
    } catch (error) {
      console.error('Error creating deal:', error)
      res.status(500).json({ error: 'Internal server error' })
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
          orgId: req.user!.organizationId,
          deletedAt: null
        }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Deal not found' })
      }

      const deal = await prisma.deal.update({
        where: { id: req.params.id },
        data: req.body
      })

      // Track stage changes
      if (req.body.stage && req.body.stage !== existing.stage) {
        await prisma.activity.create({
          data: {
            orgId: req.user!.organizationId,
            type: 'NOTE',
            subject: 'Deal stage updated',
            description: `Deal stage changed from ${existing.stage} to ${req.body.stage}`,
            entityType: 'DEAL',
            entityId: deal.id,
            status: 'COMPLETED',
            assignedUserId: req.user!.id
          }
        })
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'deal',
          resourceId: deal.id,
          metadata: { changes: req.body }
        }
      })

      res.json(deal)
    } catch (error) {
      console.error('Error updating deal:', error)
      res.status(500).json({ error: 'Internal server error' })
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
      const existing = await prisma.deal.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Deal not found' })
      }

      // Soft delete
      await prisma.deal.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'DELETE',
          resource: 'deal',
          resourceId: req.params.id,
          metadata: { deal: existing.title, value: existing.value }
        }
      })

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting deal:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export { router as dealsRouter }