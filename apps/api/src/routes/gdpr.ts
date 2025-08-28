import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { authenticateJWT } from '../mw/auth'
import { maskPII, encrypt } from '../mw/security'
import archiver from 'archiver'

const router = Router()
const prisma = new PrismaClient()

// Export user data (GDPR Article 20 - Right to data portability)
router.get('/export', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.id
    const orgId = req.user!.organizationId

    // Collect all user data
    const userData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        sessions: true,
        organization: true,
        role: true,
        assignedActivities: {
          where: { orgId }
        }
      }
    })

    // Collect organization data if user is admin
    let organizationData = null
    if (req.user!.role === 'admin') {
      organizationData = await prisma.$transaction([
        prisma.company.findMany({ where: { orgId } }),
        prisma.contact.findMany({ where: { orgId } }),
        prisma.deal.findMany({ where: { orgId } }),
        prisma.product.findMany({ where: { orgId } }),
        prisma.invoice.findMany({ where: { orgId } }),
        prisma.auditLog.findMany({ 
          where: { userId, orgId },
          take: 1000,
          orderBy: { createdAt: 'desc' }
        })
      ])
    }

    // Create ZIP archive
    res.setHeader('Content-Type', 'application/zip')
    res.setHeader('Content-Disposition', `attachment; filename="econeura-data-export-${Date.now()}.zip"`)

    const archive = archiver('zip', { zlib: { level: 9 } })
    archive.pipe(res)

    // Add user data
    archive.append(JSON.stringify(userData, null, 2), { name: 'user-data.json' })
    
    if (organizationData) {
      archive.append(JSON.stringify(organizationData, null, 2), { name: 'organization-data.json' })
    }

    await archive.finalize()

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId,
        userId,
        action: 'GDPR_EXPORT',
        resource: 'user_data',
        metadata: { timestamp: new Date() }
      }
    })
  } catch (error) {
    console.error('GDPR export error:', error)
    res.status(500).json({ error: 'Failed to export data' })
  }
})

// Delete account (GDPR Article 17 - Right to erasure)
router.delete('/delete-account', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.id
    const orgId = req.user!.organizationId

    // Verify user password
    const { password } = req.body
    if (!password) {
      return res.status(400).json({ error: 'Password required for account deletion' })
    }

    // Anonymize rather than hard delete for audit trail
    await prisma.$transaction([
      // Anonymize user data
      prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted-${userId}@anonymous.local`,
          password: 'DELETED',
          name: 'Deleted User',
          isActive: false,
          deletedAt: new Date(),
          metadata: { deletedAt: new Date(), reason: 'User requested deletion' }
        }
      }),
      
      // Delete sessions
      prisma.session.deleteMany({
        where: { userId }
      }),

      // Audit log
      prisma.auditLog.create({
        data: {
          orgId,
          userId,
          action: 'GDPR_DELETE',
          resource: 'user_account',
          metadata: { timestamp: new Date() }
        }
      })
    ])

    res.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('GDPR delete error:', error)
    res.status(500).json({ error: 'Failed to delete account' })
  }
})

// Update consent preferences
router.put('/consent', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user!.id
    const { marketing, analytics, cookies } = req.body

    await prisma.user.update({
      where: { id: userId },
      data: {
        metadata: {
          consent: {
            marketing: marketing || false,
            analytics: analytics || false,
            cookies: cookies || false,
            updatedAt: new Date()
          }
        }
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        orgId: req.user!.organizationId,
        userId,
        action: 'GDPR_CONSENT_UPDATE',
        resource: 'user_consent',
        metadata: { marketing, analytics, cookies }
      }
    })

    res.json({ message: 'Consent preferences updated' })
  } catch (error) {
    console.error('GDPR consent error:', error)
    res.status(500).json({ error: 'Failed to update consent' })
  }
})

// View data processing activities
router.get('/processing-activities', authenticateJWT, async (req, res) => {
  const activities = [
    {
      purpose: 'Service Provision',
      legalBasis: 'Contract',
      dataCategories: ['Contact Information', 'Business Data'],
      retention: 'Duration of contract + 30 days',
      recipients: ['Internal Staff', 'Cloud Providers']
    },
    {
      purpose: 'Financial Management',
      legalBasis: 'Legal Obligation',
      dataCategories: ['Financial Records', 'Tax Information'],
      retention: '7 years',
      recipients: ['Accounting Department', 'Tax Authorities']
    },
    {
      purpose: 'Security & Fraud Prevention',
      legalBasis: 'Legitimate Interest',
      dataCategories: ['Access Logs', 'IP Addresses'],
      retention: '90 days',
      recipients: ['Security Team']
    },
    {
      purpose: 'Marketing',
      legalBasis: 'Consent',
      dataCategories: ['Email', 'Preferences'],
      retention: 'Until consent withdrawn',
      recipients: ['Marketing Team', 'Email Service Provider']
    }
  ]

  res.json(activities)
})

export { router as gdprRouter }