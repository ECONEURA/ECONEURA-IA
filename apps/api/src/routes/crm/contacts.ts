import { Router } from 'express'
import { z } from 'zod'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT, requirePermission } from '../../mw/auth'
import { validateRequest } from '../../mw/validate'
import { ContactSchema } from '@econeura/shared/schemas/crm'

const router = Router()
const prisma = new PrismaClient()

// GET /api/v1/crm/contacts
router.get(
  '/',
  authenticateJWT,
  requirePermission('crm:contacts:read'),
  validateRequest({
    query: z.object({
      page: z.string().regex(/^\d+$/).transform(Number).default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).default('20'),
      search: z.string().optional(),
      companyId: z.string().uuid().optional(),
      status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
      sortBy: z.enum(['firstName', 'lastName', 'createdAt', 'updatedAt']).default('createdAt'),
      sortOrder: z.enum(['asc', 'desc']).default('desc')
    })
  }),
  async (req, res) => {
    try {
      const { page, limit, search, companyId, status, sortBy, sortOrder } = req.query as any
      const offset = (page - 1) * limit

      const where: any = {
        orgId: req.user!.organizationId,
        deletedAt: null
      }

      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } }
        ]
      }

      if (companyId) where.companyId = companyId
      if (status) where.status = status

      const [contacts, total] = await Promise.all([
        prisma.contact.findMany({
          where,
          skip: offset,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            company: true,
            deals: { where: { deletedAt: null } }
          }
        }),
        prisma.contact.count({ where })
      ])

      res.json({
        data: contacts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      })
    } catch (error) {
      console.error('Error fetching contacts:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// GET /api/v1/crm/contacts/:id
router.get(
  '/:id',
  authenticateJWT,
  requirePermission('crm:contacts:read'),
  async (req, res) => {
    try {
      const contact = await prisma.contact.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        },
        include: {
          company: true,
          deals: { where: { deletedAt: null } },
          activities: {
            where: { deletedAt: null },
            orderBy: { createdAt: 'desc' },
            take: 10
          }
        }
      })

      if (!contact) {
        return res.status(404).json({ error: 'Contact not found' })
      }

      res.json(contact)
    } catch (error) {
      console.error('Error fetching contact:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// POST /api/v1/crm/contacts
router.post(
  '/',
  authenticateJWT,
  requirePermission('crm:contacts:write'),
  validateRequest({
    body: ContactSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true })
  }),
  async (req, res) => {
    try {
      const contact = await prisma.contact.create({
        data: {
          ...req.body,
          orgId: req.user!.organizationId
        }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'CREATE',
          resource: 'contact',
          resourceId: contact.id,
          metadata: { contact: `${contact.firstName} ${contact.lastName}` }
        }
      })

      res.status(201).json(contact)
    } catch (error) {
      console.error('Error creating contact:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// PUT /api/v1/crm/contacts/:id
router.put(
  '/:id',
  authenticateJWT,
  requirePermission('crm:contacts:write'),
  validateRequest({
    body: ContactSchema.omit({ id: true, orgId: true, createdAt: true, updatedAt: true }).partial()
  }),
  async (req, res) => {
    try {
      const existing = await prisma.contact.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Contact not found' })
      }

      const contact = await prisma.contact.update({
        where: { id: req.params.id },
        data: req.body
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'UPDATE',
          resource: 'contact',
          resourceId: contact.id,
          metadata: { changes: req.body }
        }
      })

      res.json(contact)
    } catch (error) {
      console.error('Error updating contact:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// DELETE /api/v1/crm/contacts/:id
router.delete(
  '/:id',
  authenticateJWT,
  requirePermission('crm:contacts:delete'),
  async (req, res) => {
    try {
      const existing = await prisma.contact.findFirst({
        where: {
          id: req.params.id,
          orgId: req.user!.organizationId,
          deletedAt: null
        }
      })

      if (!existing) {
        return res.status(404).json({ error: 'Contact not found' })
      }

      // Soft delete
      await prisma.contact.update({
        where: { id: req.params.id },
        data: { deletedAt: new Date() }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          orgId: req.user!.organizationId,
          userId: req.user!.id,
          action: 'DELETE',
          resource: 'contact',
          resourceId: req.params.id,
          metadata: { contact: `${existing.firstName} ${existing.lastName}` }
        }
      })

      res.status(204).send()
    } catch (error) {
      console.error('Error deleting contact:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

export { router as contactsRouter }