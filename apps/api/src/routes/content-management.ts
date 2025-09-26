/**
 * CONTENT MANAGEMENT ROUTES
 * 
 * PR-55: Rutas API para gestión de contenido avanzado
 * 
 * Endpoints:
 * - POST /content - Crear contenido
 * - GET /content - Listar contenido
 * - GET /content/:id - Obtener contenido
 * - GET /content/slug/:slug - Obtener contenido por slug
 * - PUT /content/:id - Actualizar contenido
 * - DELETE /content/:id - Eliminar contenido
 * - POST /content/:id/versions - Crear versión
 * - GET /content/:id/versions - Listar versiones
 * - POST /content/:id/publish - Publicar contenido
 * - POST /content/:id/unpublish - Despublicar contenido
 * - GET /content/search - Buscar contenido
 * - GET /content/statistics - Estadísticas
 */

import { Router } from 'express';
import { z } from 'zod';

import { contentManagementService } from '../services/content-management.service.js';
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

const CreateContentSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1).max(255),
  type: z.enum(['article', 'blog', 'page', 'product', 'news', 'event', 'faq', 'tutorial', 'documentation', 'landing', 'other']),
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived', 'deleted']).default('draft'),
  template: z.enum(['default', 'blog', 'product', 'landing', 'news', 'custom']).default('default'),
  metadata: z.object({
    title: z.string().min(1).max(255),
    description: z.string().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    categories: z.array(z.string()).default([]),
    author: z.string().min(1),
    language: z.string().default('es'),
    keywords: z.array(z.string()).default([]),
    customFields: z.record(z.any()).default({}),
    seo: z.object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      metaKeywords: z.array(z.string()).default([]),
      canonicalUrl: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional(),
      twitterCard: z.string().optional(),
      structuredData: z.record(z.any()).optional()
    }).optional(),
    analytics: z.object({
      views: z.number().default(0),
      uniqueViews: z.number().default(0),
      shares: z.number().default(0),
      comments: z.number().default(0),
      likes: z.number().default(0),
      engagement: z.number().default(0),
      bounceRate: z.number().default(0),
      timeOnPage: z.number().default(0)
    }).optional()
  }),
  content: z.string().min(1),
  htmlContent: z.string().optional(),
  markdownContent: z.string().optional(),
  featuredImage: z.string().optional(),
  images: z.array(z.string()).default([]),
  attachments: z.array(z.string()).default([]),
  publishedAt: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isPublic: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isSticky: z.boolean().default(false),
  allowComments: z.boolean().default(true),
  allowSharing: z.boolean().default(true),
  workflow: z.object({
    currentStep: z.string(),
    steps: z.array(z.object({
      step: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'rejected']),
      assignedTo: z.string().uuid().optional(),
      completedAt: z.string().datetime().optional(),
      comments: z.string().optional()
    })).default([]),
    approvedBy: z.string().uuid().optional(),
    approvedAt: z.string().datetime().optional()
  }).optional()
});

const UpdateContentSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(255).optional(),
  status: z.enum(['draft', 'review', 'approved', 'published', 'archived', 'deleted']).optional(),
  template: z.enum(['default', 'blog', 'product', 'landing', 'news', 'custom']).optional(),
  metadata: z.object({
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    author: z.string().min(1).optional(),
    language: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    customFields: z.record(z.any()).optional(),
    seo: z.object({
      metaTitle: z.string().optional(),
      metaDescription: z.string().optional(),
      metaKeywords: z.array(z.string()).optional(),
      canonicalUrl: z.string().optional(),
      ogTitle: z.string().optional(),
      ogDescription: z.string().optional(),
      ogImage: z.string().optional(),
      twitterCard: z.string().optional(),
      structuredData: z.record(z.any()).optional()
    }).optional(),
    analytics: z.object({
      views: z.number().optional(),
      uniqueViews: z.number().optional(),
      shares: z.number().optional(),
      comments: z.number().optional(),
      likes: z.number().optional(),
      engagement: z.number().optional(),
      bounceRate: z.number().optional(),
      timeOnPage: z.number().optional()
    }).optional()
  }).optional(),
  content: z.string().min(1).optional(),
  htmlContent: z.string().optional(),
  markdownContent: z.string().optional(),
  featuredImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  publishedAt: z.string().datetime().optional(),
  scheduledAt: z.string().datetime().optional(),
  expiresAt: z.string().datetime().optional(),
  isPublic: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  isSticky: z.boolean().optional(),
  allowComments: z.boolean().optional(),
  allowSharing: z.boolean().optional(),
  workflow: z.object({
    currentStep: z.string(),
    steps: z.array(z.object({
      step: z.string(),
      status: z.enum(['pending', 'in_progress', 'completed', 'rejected']),
      assignedTo: z.string().uuid().optional(),
      completedAt: z.string().datetime().optional(),
      comments: z.string().optional()
    })).default([]),
    approvedBy: z.string().uuid().optional(),
    approvedAt: z.string().datetime().optional()
  }).optional()
});

const CreateVersionSchema = z.object({
  version: z.string(),
  content: z.string(),
  htmlContent: z.string().optional(),
  markdownContent: z.string().optional(),
  changes: z.string().optional()
});

const SearchContentSchema = z.object({
  query: z.string().optional(),
  filters: z.object({
    type: z.array(z.enum(['article', 'blog', 'page', 'product', 'news', 'event', 'faq', 'tutorial', 'documentation', 'landing', 'other'])).optional(),
    status: z.array(z.enum(['draft', 'review', 'approved', 'published', 'archived', 'deleted'])).optional(),
    author: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
    categories: z.array(z.string()).optional(),
    template: z.array(z.enum(['default', 'blog', 'product', 'landing', 'news', 'custom'])).optional(),
    dateRange: z.object({
      from: z.string().datetime().optional(),
      to: z.string().datetime().optional()
    }).optional(),
    isPublic: z.boolean().optional(),
    isFeatured: z.boolean().optional()
  }).optional(),
  sort: z.object({
    field: z.enum(['title', 'createdAt', 'updatedAt', 'publishedAt', 'views', 'engagement']),
    direction: z.enum(['asc', 'desc'])
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20)
  }).optional()
});

// ============================================================================
// CONTENT ROUTES
// ============================================================================

// POST /content - Create content
router.post('/', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';
    const createdBy = req.user?.id || 'demo-user';

    const validatedData = CreateContentSchema.parse(req.body);

    // Convert date strings to Date objects
    const contentData = {
      ...validatedData,
      publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : undefined,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      workflow: validatedData.workflow ? {
        ...validatedData.workflow,
        steps: validatedData.workflow.steps.map(step => ({
          ...step,
          completedAt: step.completedAt ? new Date(step.completedAt) : undefined
        })),
        approvedAt: validatedData.workflow.approvedAt ? new Date(validatedData.workflow.approvedAt) : undefined
      } : undefined
    };

    const content = await contentManagementService.createContent(
      organizationId,
      contentData,
      createdBy
    );

    structuredLogger.info('Content created via API', {
      contentId: content.id,
      title: content.title,
      type: content.type,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: content,
      message: 'Content created successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to create content via API', {
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
      error: 'Failed to create content'
    });
  }
});

// GET /content - List content
router.get('/', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';
    const searchParams = SearchContentSchema.parse(req.query);

    // Convert date strings to Date objects
    if (searchParams.filters?.dateRange) {
      if (searchParams.filters.dateRange.from) {
        searchParams.filters.dateRange.from = new Date(searchParams.filters.dateRange.from);
      }
      if (searchParams.filters.dateRange.to) {
        searchParams.filters.dateRange.to = new Date(searchParams.filters.dateRange.to);
      }
    }

    const result = await contentManagementService.searchContent(organizationId, searchParams);

    res.json({
      success: true,
      data: result,
      message: 'Content retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to list content via API', {
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
      error: 'Failed to list content'
    });
  }
});

// GET /content/:id - Get content
router.get('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const content = await contentManagementService.getContent(id, organizationId);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content,
      message: 'Content retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to get content via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get content'
    });
  }
});

// GET /content/slug/:slug - Get content by slug
router.get('/slug/:slug', async (req: AuthenticatedRequest, res) => {
  try {
    const { slug } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const content = await contentManagementService.getContentBySlug(slug, organizationId);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content,
      message: 'Content retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to get content by slug via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      slug: req.params.slug,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get content'
    });
  }
});

// PUT /content/:id - Update content
router.put('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';
    const updatedBy = req.user?.id || 'demo-user';

    const validatedData = UpdateContentSchema.parse(req.body);

    // Convert date strings to Date objects
    const updates = {
      ...validatedData,
      publishedAt: validatedData.publishedAt ? new Date(validatedData.publishedAt) : undefined,
      scheduledAt: validatedData.scheduledAt ? new Date(validatedData.scheduledAt) : undefined,
      expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : undefined,
      workflow: validatedData.workflow ? {
        ...validatedData.workflow,
        steps: validatedData.workflow.steps.map(step => ({
          ...step,
          completedAt: step.completedAt ? new Date(step.completedAt) : undefined
        })),
        approvedAt: validatedData.workflow.approvedAt ? new Date(validatedData.workflow.approvedAt) : undefined
      } : undefined
    };

    const content = await contentManagementService.updateContent(
      id,
      organizationId,
      updates,
      updatedBy
    );

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    structuredLogger.info('Content updated via API', {
      contentId: id,
      organizationId
    });

    res.json({
      success: true,
      data: content,
      message: 'Content updated successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to update content via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
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
      error: 'Failed to update content'
    });
  }
});

// DELETE /content/:id - Delete content
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const success = await contentManagementService.deleteContent(id, organizationId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    structuredLogger.info('Content deleted via API', {
      contentId: id,
      organizationId
    });

    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to delete content via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete content'
    });
  }
});

// ============================================================================
// CONTENT VERSION ROUTES
// ============================================================================

// POST /content/:id/versions - Create content version
router.post('/:id/versions', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';
    const createdBy = req.user?.id || 'demo-user';

    const validatedData = CreateVersionSchema.parse(req.body);

    const version = await contentManagementService.createContentVersion(
      id,
      organizationId,
      {
        ...validatedData,
        contentId: id,
        createdBy
      }
    );

    structuredLogger.info('Content version created via API', {
      contentId: id,
      versionId: version.id,
      version: version.version,
      organizationId
    });

    res.status(201).json({
      success: true,
      data: version,
      message: 'Content version created successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to create content version via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
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
      error: 'Failed to create content version'
    });
  }
});

// GET /content/:id/versions - List content versions
router.get('/:id/versions', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';

    const content = await contentManagementService.getContent(id, organizationId);

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    res.json({
      success: true,
      data: content.versions,
      message: 'Content versions retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to list content versions via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to list content versions'
    });
  }
});

// ============================================================================
// CONTENT PUBLISHING ROUTES
// ============================================================================

// POST /content/:id/publish - Publish content
router.post('/:id/publish', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';
    const publishedBy = req.user?.id || 'demo-user';

    const success = await contentManagementService.publishContent(id, organizationId, publishedBy);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    structuredLogger.info('Content published via API', {
      contentId: id,
      organizationId,
      publishedBy
    });

    res.json({
      success: true,
      message: 'Content published successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to publish content via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to publish content'
    });
  }
});

// POST /content/:id/unpublish - Unpublish content
router.post('/:id/unpublish', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user?.organizationId || 'demo-org';
    const unpublishedBy = req.user?.id || 'demo-user';

    const success = await contentManagementService.unpublishContent(id, organizationId, unpublishedBy);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Content not found'
      });
    }

    structuredLogger.info('Content unpublished via API', {
      contentId: id,
      organizationId,
      unpublishedBy
    });

    res.json({
      success: true,
      message: 'Content unpublished successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to unpublish content via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      contentId: req.params.id,
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to unpublish content'
    });
  }
});

// ============================================================================
// CONTENT SEARCH ROUTES
// ============================================================================

// GET /content/search - Search content
router.get('/search', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';
    const searchParams = SearchContentSchema.parse(req.query);

    // Convert date strings to Date objects
    if (searchParams.filters?.dateRange) {
      if (searchParams.filters.dateRange.from) {
        searchParams.filters.dateRange.from = new Date(searchParams.filters.dateRange.from);
      }
      if (searchParams.filters.dateRange.to) {
        searchParams.filters.dateRange.to = new Date(searchParams.filters.dateRange.to);
      }
    }

    const result = await contentManagementService.searchContent(organizationId, searchParams);

    res.json({
      success: true,
      data: result,
      message: 'Content search completed successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to search content via API', {
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
      error: 'Failed to search content'
    });
  }
});

// ============================================================================
// CONTENT STATISTICS ROUTES
// ============================================================================

// GET /content/statistics - Get content statistics
router.get('/statistics', async (req: AuthenticatedRequest, res) => {
  try {
    const organizationId = req.user?.organizationId || 'demo-org';

    const statistics = await contentManagementService.getContentStatistics(organizationId);

    res.json({
      success: true,
      data: statistics,
      message: 'Content statistics retrieved successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to get content statistics via API', {
      error: error instanceof Error ? error.message : 'Unknown error',
      organizationId: req.user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get content statistics'
    });
  }
});

export default router;
