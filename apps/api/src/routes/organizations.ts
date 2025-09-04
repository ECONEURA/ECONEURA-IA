import { Router } from 'express';
import { organizationsController } from '../controllers/organizations';
import { requireRole } from '../middleware/auth';

const router = Router();

// GET /api/v1/organizations - Get all organizations
router.get('/', organizationsController.getOrganizations);

// GET /api/v1/organizations/:id - Get organization by ID
router.get('/:id', organizationsController.getOrganizationById);

// POST /api/v1/organizations - Create organization (admin only)
router.post('/', requireRole(['admin']), organizationsController.createOrganization);

// PUT /api/v1/organizations/:id - Update organization
router.put('/:id', organizationsController.updateOrganization);

// DELETE /api/v1/organizations/:id - Delete organization (admin only)
router.delete('/:id', requireRole(['admin']), organizationsController.deleteOrganization);

export default router;
