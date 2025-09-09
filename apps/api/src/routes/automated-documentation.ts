import { Router, Request, Response } from 'express';
import { z } from 'zod';
import AutomatedDocumentationService, {
  Documentation,
  APIDocumentation,
  ArchitectureDocumentation,
  Runbook,
  DocumentationConfig
} from '../lib/automated-documentation.service.js';
import { logger } from '../lib/logger.js';

const router: Router = Router();

// Configuración por defecto
const defaultConfig: DocumentationConfig = {
  outputDirectory: './docs/generated',
  templatesDirectory: './docs/templates',
  autoGenerate: true,
  versioning: true,
  reviewRequired: false,
  notificationChannels: ['email', 'slack'],
  formats: ['html', 'markdown', 'json'],
  languages: ['en', 'es']
};

// Inicializar servicio
const documentationService = new AutomatedDocumentationService(defaultConfig);

// Schemas de validación para requests
const CreateDocumentationSchema = z.object({
  title: z.string().min(1),
  type: z.enum(['API', 'ARCHITECTURE', 'USER_GUIDE', 'RUNBOOK', 'CHANGELOG', 'README']),
  version: z.string().min(1),
  content: z.string().min(1),
  metadata: z.record(z.any()).optional(),
  status: z.enum(['DRAFT', 'REVIEW', 'PUBLISHED', 'ARCHIVED']).optional(),
  tags: z.array(z.string()).optional(),
  author: z.string().min(1),
  reviewers: z.array(z.string()).optional()
});

const CreateRunbookSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  procedures: z.array(z.object({
    step: z.number().min(1),
    title: z.string().min(1),
    description: z.string().min(1),
    commands: z.array(z.string()).optional(),
    expectedResult: z.string().optional(),
    troubleshooting: z.string().optional()
  })),
  prerequisites: z.array(z.string()),
  estimatedTime: z.string().min(1),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])
});

const UpdateConfigSchema = z.object({
  outputDirectory: z.string().optional(),
  templatesDirectory: z.string().optional(),
  autoGenerate: z.boolean().optional(),
  versioning: z.boolean().optional(),
  reviewRequired: z.boolean().optional(),
  notificationChannels: z.array(z.string()).optional(),
  formats: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional()
});

// ===== DOCUMENTACIÓN GENERAL =====

// GET /api/automated-documentation/docs
router.get('/docs', async (req: Request, res: Response) => {
  try {
    const { type } = req.query;
    const docs = await documentationService.listDocumentation(type as string);

    res.json({
      success: true,
      data: docs,
      count: docs.length
    });
  } catch (error) {
    logger.error('Error listing documentation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list documentation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/automated-documentation/docs/:id
router.get('/docs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const doc = await documentationService.getDocumentation(id);

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Documentation not found'
      });
    }

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    logger.error('Error getting documentation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get documentation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/automated-documentation/docs
router.post('/docs', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateDocumentationSchema.parse(req.body);

    const doc = await documentationService.createDocumentation({
      title: validatedData.title,
      type: validatedData.type,
      version: validatedData.version,
      content: validatedData.content,
      metadata: validatedData.metadata || {},
      status: validatedData.status || 'DRAFT',
      tags: validatedData.tags || [],
      author: validatedData.author,
      reviewers: validatedData.reviewers
    });

    res.status(201).json({
      success: true,
      data: doc,
      message: 'Documentation created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error creating documentation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create documentation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/automated-documentation/docs/:id
router.put('/docs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedDoc = await documentationService.updateDocumentation(id, updates);

    if (!updatedDoc) {
      return res.status(404).json({
        success: false,
        error: 'Documentation not found'
      });
    }

    res.json({
      success: true,
      data: updatedDoc,
      message: 'Documentation updated successfully'
    });
  } catch (error) {
    logger.error('Error updating documentation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update documentation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/automated-documentation/docs/:id
router.delete('/docs/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await documentationService.deleteDocumentation(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Documentation not found'
      });
    }

    res.json({
      success: true,
      message: 'Documentation deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting documentation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete documentation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== GENERACIÓN AUTOMÁTICA =====

// POST /api/automated-documentation/generate/api
router.post('/generate/api', async (req: Request, res: Response) => {
  try {
    const generation = await documentationService.generateAPIDocumentation();

    res.json({
      success: true,
      data: generation,
      message: 'API documentation generation started'
    });
  } catch (error) {
    logger.error('Error generating API documentation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate API documentation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/automated-documentation/generate/architecture
router.post('/generate/architecture', async (req: Request, res: Response) => {
  try {
    const generation = await documentationService.generateArchitectureDocumentation();

    res.json({
      success: true,
      data: generation,
      message: 'Architecture documentation generation started'
    });
  } catch (error) {
    logger.error('Error generating architecture documentation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate architecture documentation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/automated-documentation/generate/user-guides
router.post('/generate/user-guides', async (req: Request, res: Response) => {
  try {
    const generation = await documentationService.generateUserGuides();

    res.json({
      success: true,
      data: generation,
      message: 'User guides generation started'
    });
  } catch (error) {
    logger.error('Error generating user guides', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate user guides',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/automated-documentation/generate/runbooks
router.post('/generate/runbooks', async (req: Request, res: Response) => {
  try {
    const generation = await documentationService.generateRunbooks();

    res.json({
      success: true,
      data: generation,
      message: 'Runbooks generation started'
    });
  } catch (error) {
    logger.error('Error generating runbooks', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate runbooks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/automated-documentation/generate/all
router.post('/generate/all', async (req: Request, res: Response) => {
  try {
    const generations = await documentationService.generateAllDocumentation();

    res.json({
      success: true,
      data: generations,
      count: generations.length,
      message: 'Complete documentation generation started'
    });
  } catch (error) {
    logger.error('Error generating all documentation', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to generate all documentation',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== RUNBOOKS =====

// GET /api/automated-documentation/runbooks
router.get('/runbooks', async (req: Request, res: Response) => {
  try {
    const runbooks = await documentationService.listRunbooks();

    res.json({
      success: true,
      data: runbooks,
      count: runbooks.length
    });
  } catch (error) {
    logger.error('Error listing runbooks', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to list runbooks',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/automated-documentation/runbooks/:id
router.get('/runbooks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const runbook = await documentationService.getRunbook(id);

    if (!runbook) {
      return res.status(404).json({
        success: false,
        error: 'Runbook not found'
      });
    }

    res.json({
      success: true,
      data: runbook
    });
  } catch (error) {
    logger.error('Error getting runbook', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get runbook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/automated-documentation/runbooks
router.post('/runbooks', async (req: Request, res: Response) => {
  try {
    const validatedData = CreateRunbookSchema.parse(req.body);

    const runbook = await documentationService.createRunbook({
      title: validatedData.title,
      description: validatedData.description,
      procedures: validatedData.procedures,
      prerequisites: validatedData.prerequisites,
      estimatedTime: validatedData.estimatedTime,
      difficulty: validatedData.difficulty
    });

    res.status(201).json({
      success: true,
      data: runbook,
      message: 'Runbook created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error creating runbook', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to create runbook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/automated-documentation/runbooks/:id
router.put('/runbooks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedRunbook = await documentationService.updateRunbook(id, updates);

    if (!updatedRunbook) {
      return res.status(404).json({
        success: false,
        error: 'Runbook not found'
      });
    }

    res.json({
      success: true,
      data: updatedRunbook,
      message: 'Runbook updated successfully'
    });
  } catch (error) {
    logger.error('Error updating runbook', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update runbook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/automated-documentation/runbooks/:id
router.delete('/runbooks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await documentationService.deleteRunbook(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Runbook not found'
      });
    }

    res.json({
      success: true,
      message: 'Runbook deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting runbook', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to delete runbook',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== ESTADÍSTICAS Y REPORTES =====

// GET /api/automated-documentation/statistics
router.get('/statistics', async (req: Request, res: Response) => {
  try {
    const statistics = await documentationService.getDocumentationStatistics();

    res.json({
      success: true,
      data: statistics
    });
  } catch (error) {
    logger.error('Error getting documentation statistics', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get documentation statistics',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/automated-documentation/reports/:period
router.get('/reports/:period', async (req: Request, res: Response) => {
  try {
    const { period } = req.params;

    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid period. Must be: daily, weekly, or monthly'
      });
    }

    const report = await documentationService.generateDocumentationReport(period as 'daily' | 'weekly' | 'monthly');

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    logger.error('Error generating documentation report', { error, period: req.params.period });
    res.status(500).json({
      success: false,
      error: 'Failed to generate documentation report',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== CONFIGURACIÓN =====

// GET /api/automated-documentation/config
router.get('/config', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: defaultConfig
    });
  } catch (error) {
    logger.error('Error getting configuration', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to get configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/automated-documentation/config
router.put('/config', async (req: Request, res: Response) => {
  try {
    const validatedData = UpdateConfigSchema.parse(req.body);

    // Actualizar configuración (en una implementación real, esto se persistiría)
    Object.assign(defaultConfig, validatedData);

    res.json({
      success: true,
      data: defaultConfig,
      message: 'Configuration updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }

    logger.error('Error updating configuration', { error });
    res.status(500).json({
      success: false,
      error: 'Failed to update configuration',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ===== HEALTH CHECK =====

// GET /api/automated-documentation/health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const statistics = await documentationService.getDocumentationStatistics();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        documentation: statistics.totalDocuments > 0 ? 'operational' : 'no_docs',
        runbooks: statistics.totalRunbooks > 0 ? 'operational' : 'no_runbooks',
        generation: statistics.totalGenerations > 0 ? 'operational' : 'no_generations'
      },
      statistics: {
        totalDocuments: statistics.totalDocuments,
        totalRunbooks: statistics.totalRunbooks,
        totalGenerations: statistics.totalGenerations,
        successRate: statistics.totalGenerations > 0
          ? (statistics.successfulGenerations / statistics.totalGenerations) * 100
          : 0
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error checking health', { error });
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
