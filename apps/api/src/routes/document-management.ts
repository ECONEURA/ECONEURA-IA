/**
 * DOCUMENT MANAGEMENT ROUTES
 *
 * PR-54: Rutas API para gestión de documentos avanzado
 *
 * Endpoints:
 * - POST /documents - Crear documento
 * - GET /documents - Listar documentos
 * - GET /documents/:id - Obtener documento
 * - PUT /documents/:id - Actualizar documento
 * - DELETE /documents/:id - Eliminar documento
 * - POST /documents/:id/versions - Crear versión
 * - GET /documents/:id/versions - Listar versiones
 * - POST /documents/:id/permissions - Otorgar permiso
 * - GET /documents/search - Buscar documentos
 * - GET /documents/statistics - Estadísticas
 */

import { Router } from 'express';
import { z } from 'zod';
import { documentManagementService } from '../services/document-management.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();

// ============================================================================
// MIDDLEWARE
// ============================================================================

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    organizationId: string;
    email: string;
  };
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  originalName: z.string().min(1).max(255),
  type: z.enum(['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'md', 'html', 'xml', 'json', 'csv', 'image', 'video', 'audio', 'other']),
  status: z.enum(['draft', 'review', 'approved', 'archived', 'deleted']).default('draft'),
  metadata: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
    category: z.string().optional(),
    author: z.string().min(1),
    language: z.string().default('es'),
    keywords: z.array(z.string()).default([]),
    customFields: z.record(z.any()).default({})
  }),
  storagePath: z.string(),
  storageProvider: z.enum(['local', 'azure', 'aws', 'gcp']).default('local'),
  size: z.number().positive(),
  mimeType: z.string(),
  checksum: z.string(),
  isPublic: z.boolean().default(false),
  isEncrypted: z.boolean().default(false),
  retentionPolicy: z.object({
    retentionDays: z.number().positive().optional(),
    autoDelete: z.boolean().default(false),
    legalHold: z.boolean().default(false)
  }).optional()
});

const UpdateDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'review', 'approved', 'archived', 'deleted']).optional(),
  metadata: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    author: z.string().min(1).optional(),
    language: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional()
  }).optional(),
  isPublic: z.boolean().optional(),
  isEncrypted: z.boolean().optional(),
  retentionPolicy: z.object({
    retentionDays: z.number().positive().optional(),
    autoDelete: z.boolean().optional(),
    legalHold: z.boolean().optional()
  }).optional()
});

const CreateVersionSchema = z.object({
  version: z.string(),
  content: z.string(),
  size: z.number().positive(),
  checksum: z.string(),
  changes: z.string().optional()
});

const GrantPermissionSchema = z.object({
  userId: z.string().uuid(),
  permission: z.enum(['read', 'write', 'admin', 'owner'])
});

const SearchDocumentsSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    type: z.array(z.enum(['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'md', 'html', 'xml', 'json', 'csv', 'image', 'video', 'audio', 'other'])).optional(),
    status: z.array(z.enum(['draft', 'review', 'approved', 'archived', 'deleted'])).optional(),
    author: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional()
    }).optional(),
    sizeRange: z.object({
      min: z.number().optional(),
      max: z.number().optional()
    }).optional()
  }).optional(),
  sort: z.object({
    field: z.enum(['name', 'createdAt', 'updatedAt', 'size', 'type']),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  }).optional()
});

// ============================================================================
// DOCUMENT ROUTES
// ============================================================================

// POST /documents - Create document
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';
    const createdBy = req.user?.id || 'demo-user';

    const validatedData = CreateDocumentSchema.parse(req.body);

    const document = await documentManagementService.createDocument(
      organizationId,
      validatedData,
      createdBy
    );

    structuredLogger.info('Document created via API', {
      documentId: document.id,
      name: document.name,
      type: document.type,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document created successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to create document via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create document'
    });
  }
});

// GET /documents - List documents
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';
    const searchParams = SearchDocumentsSchema.parse(req.query);

    const result = await documentManagementService.searchDocuments(organizationId, searchParams);

    res.json({
      success: true,
      data: result,
      message: 'Documents retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to list documents via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to list documents'
    });
  }
});

// GET /documents/:id - Get document
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const document = await documentManagementService.getDocument(id, organizationId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document,
      message: 'Document retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to get document via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get document'
    });
  }
});

// PUT /documents/:id - Update document
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';
    const updatedBy = req.user?.id || 'demo-user';

    const validatedData = UpdateDocumentSchema.parse(req.body);

    const document = await documentManagementService.updateDocument(
      id,
      organizationId,
      validatedData,
      updatedBy
    );

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    structuredLogger.info('Document updated via API', {
      documentId: id,
      organizationId
    });

    res.json({
      success: true,
      data: document,
      message: 'Document updated successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to update document via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to update document'
    });
  }
});

// DELETE /documents/:id - Delete document
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const success = await documentManagementService.deleteDocument(id, organizationId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    structuredLogger.info('Document deleted via API', {
      documentId: id,
      organizationId
    });

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to delete document via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete document'
    });
  }
});

// ============================================================================
// DOCUMENT VERSION ROUTES
// ============================================================================

// POST /documents/:id/versions - Create document version
router.post('/:id/versions', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';
    const createdBy = req.user?.id || 'demo-user';

    const validatedData = CreateVersionSchema.parse(req.body);

    const version = await documentManagementService.createDocumentVersion(
      id,
      organizationId,
      {
        ...validatedData,
        documentId: id,
        createdBy
      }
    );

    structuredLogger.info('Document version created via API', {
      documentId: id,
      versionId: version.id,
      version: version.version,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: version,
      message: 'Document version created successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to create document version via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to create document version'
    });
  }
});

// GET /documents/:id/versions - List document versions
router.get('/:id/versions', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const document = await documentManagementService.getDocument(id, organizationId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.json({
      success: true,
      data: document.versions,
      message: 'Document versions retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to list document versions via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to list document versions'
    });
  }
});

// ============================================================================
// DOCUMENT PERMISSION ROUTES
// ============================================================================

// POST /documents/:id/permissions - Grant document permission
router.post('/:id/permissions', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';
    const grantedBy = req.user?.id || 'demo-user';

    const validatedData = GrantPermissionSchema.parse(req.body);

    const success = await documentManagementService.grantDocumentPermission(
      id,
      organizationId,
      validatedData.userId,
      validatedData.permission,
      grantedBy
    );

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    structuredLogger.info('Document permission granted via API', {
      documentId: id,
      userId: validatedData.userId,
      permission: validatedData.permission,
      organizationId
    });

    res.json({
      success: true,
      message: 'Document permission granted successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to grant document permission via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      documentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to grant document permission'
    });
  }
});

// ============================================================================
// DOCUMENT SEARCH ROUTES
// ============================================================================

// GET /documents/search - Search documents
router.get('/search', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';
    const searchParams = SearchDocumentsSchema.parse(req.query);

    const result = await documentManagementService.searchDocuments(organizationId, searchParams);

    res.json({
      success: true,
      data: result,
      message: 'Document search completed successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to search documents via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to search documents'
    });
  }
});

// ============================================================================
// DOCUMENT STATISTICS ROUTES
// ============================================================================

// GET /documents/statistics - Get document statistics
router.get('/statistics', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';

    const statistics = await documentManagementService.getDocumentStatistics(organizationId);

    res.json({
      success: true,
      data: statistics,
      message: 'Document statistics retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to get document statistics via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get document statistics'
    });
  }
});

export default router;
