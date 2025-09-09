/**
 * Advanced Reporting API Routes
 *
 * This module provides comprehensive API endpoints for the advanced reporting system,
 * including report management, generation, scheduling, templates, and analytics.
 */

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { IntelligentReportingService } from '../lib/intelligent-reporting.service.js';
import { structuredLogger } from '../lib/structured-logger.js';

const router = Router();
const reportingService = new IntelligentReportingService();

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const CreateReportSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  type: z.enum(['executive', 'operational', 'analytics', 'custom']),
  template: z.string().optional(),
  data: z.array(z.object({
    metricId: z.string(),
    metricName: z.string(),
    unit: z.string(),
    visualization: z.object({
      type: z.string(),
      title: z.string(),
      colors: z.array(z.string()).optional(),
      options: z.record(z.any()).optional()
    }).optional()
  })),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'greater_than', 'less_than', 'contains', 'between', 'in']),
    value: z.any().optional(),
    values: z.array(z.any()).optional()
  })).optional(),
  schedule: z.object({
    frequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly']),
    time: z.string(),
    isActive: z.boolean()
  }).optional(),
  recipients: z.array(z.string()).optional(),
  format: z.enum(['pdf', 'excel', 'json', 'csv']).default('pdf'),
  isPublic: z.boolean().default(false)
});

const UpdateReportSchema = CreateReportSchema.partial();

const GenerateReportSchema = z.object({
  parameters: z.record(z.any()).optional()
});

// ============================================================================
// REPORT MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Create a new report
 * POST /api/reports
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId || 'default';
    const createdBy = (req as any).user?.id || 'system';

    const validatedData = CreateReportSchema.parse(req.body);

    const report = await reportingService.createReport(
      validatedData,
      organizationId,
      createdBy
    );

    structuredLogger.info('Report created', {
      operation: 'report_create',
      reportId: report.id,
      name: report.name,
      type: report.type,
      organizationId,
      createdBy
    });

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    structuredLogger.error('Failed to create report', error as Error, {
      operation: 'report_create',
      body: req.body
    });

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to create report'
      });
    }
  }
});

/**
 * Get all reports for organization
 * GET /api/reports
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId || 'default';
    const { type, createdBy, isActive, isPublic } = req.query;

    const filters = {
      type: type as string,
      createdBy: createdBy as string,
      isActive: isActive ? isActive === 'true' : undefined,
      isPublic: isPublic ? isPublic === 'true' : undefined
    };

    const reports = await reportingService.getReports(organizationId, filters);

    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    structuredLogger.error('Failed to get reports', error as Error, {
      operation: 'reports_get',
      query: req.query
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get reports'
    });
  }
});

/**
 * Get a specific report
 * GET /api/reports/:reportId
 */
router.get('/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const report = await reportingService.getReport(reportId);

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    structuredLogger.error('Failed to get report', error as Error, {
      operation: 'report_get',
      reportId: req.params.reportId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get report'
    });
  }
});

/**
 * Update a report
 * PUT /api/reports/:reportId
 */
router.put('/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const validatedData = UpdateReportSchema.parse(req.body);

    const updatedReport = await reportingService.updateReport(reportId, validatedData);

    if (!updatedReport) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    structuredLogger.info('Report updated', {
      operation: 'report_update',
      reportId,
      updates: Object.keys(validatedData)
    });

    res.json({
      success: true,
      data: updatedReport
    });
  } catch (error) {
    structuredLogger.error('Failed to update report', error as Error, {
      operation: 'report_update',
      reportId: req.params.reportId,
      body: req.body
    });

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update report'
      });
    }
  }
});

/**
 * Delete a report
 * DELETE /api/reports/:reportId
 */
router.delete('/:reportId', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const deleted = await reportingService.deleteReport(reportId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: 'Report not found'
      });
    }

    structuredLogger.info('Report deleted', {
      operation: 'report_delete',
      reportId
    });

    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    structuredLogger.error('Failed to delete report', error as Error, {
      operation: 'report_delete',
      reportId: req.params.reportId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to delete report'
    });
  }
});

// ============================================================================
// REPORT GENERATION ENDPOINTS
// ============================================================================

/**
 * Generate a report
 * POST /api/reports/:reportId/generate
 */
router.post('/:reportId/generate', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;
    const generatedBy = (req as any).user?.id || 'system';
    const validatedData = GenerateReportSchema.parse(req.body);

    const generation = await reportingService.generateReport(
      reportId,
      generatedBy,
      validatedData.parameters
    );

    structuredLogger.info('Report generation started', {
      operation: 'report_generate',
      reportId,
      generationId: generation.id,
      generatedBy
    });

    res.status(202).json({
      success: true,
      data: generation
    });
  } catch (error) {
    structuredLogger.error('Failed to generate report', error as Error, {
      operation: 'report_generate',
      reportId: req.params.reportId,
      body: req.body
    });

    if (error instanceof z.ZodError) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    } else {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate report'
      });
    }
  }
});

/**
 * Get report generation status
 * GET /api/reports/generations/:generationId
 */
router.get('/generations/:generationId', async (req: Request, res: Response) => {
  try {
    const { generationId } = req.params;

    const generation = await reportingService.getReportGeneration(generationId);

    if (!generation) {
      return res.status(404).json({
        success: false,
        error: 'Generation not found'
      });
    }

    res.json({
      success: true,
      data: generation
    });
  } catch (error) {
    structuredLogger.error('Failed to get generation status', error as Error, {
      operation: 'generation_get',
      generationId: req.params.generationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get generation status'
    });
  }
});

/**
 * Get all generations for a report
 * GET /api/reports/:reportId/generations
 */
router.get('/:reportId/generations', async (req: Request, res: Response) => {
  try {
    const { reportId } = req.params;

    const generations = await reportingService.getReportGenerations(reportId);

    res.json({
      success: true,
      data: generations,
      count: generations.length
    });
  } catch (error) {
    structuredLogger.error('Failed to get report generations', error as Error, {
      operation: 'generations_get',
      reportId: req.params.reportId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get report generations'
    });
  }
});

// ============================================================================
// REPORT TEMPLATES ENDPOINTS
// ============================================================================

/**
 * Get available report templates
 * GET /api/reports/templates
 */
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const templates = await reportingService.getReportTemplates();

    res.json({
      success: true,
      data: templates,
      count: templates.length
    });
  } catch (error) {
    structuredLogger.error('Failed to get report templates', error as Error, {
      operation: 'templates_get'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get report templates'
    });
  }
});

// ============================================================================
// REPORT ANALYTICS ENDPOINTS
// ============================================================================

/**
 * Get reporting analytics for organization
 * GET /api/reports/analytics
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const organizationId = (req as any).user?.organizationId || 'default';

    const analytics = await reportingService.getReportAnalytics(organizationId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    structuredLogger.error('Failed to get report analytics', error as Error, {
      operation: 'analytics_get',
      organizationId: (req as any).user?.organizationId
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get report analytics'
    });
  }
});

/**
 * Get service statistics
 * GET /api/reports/stats
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await reportingService.getServiceStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    structuredLogger.error('Failed to get service stats', error as Error, {
      operation: 'stats_get'
    });

    res.status(500).json({
      success: false,
      error: 'Failed to get service stats'
    });
  }
});

export default router;
