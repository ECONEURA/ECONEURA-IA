import { Router } from 'express';
import { z } from 'zod';
import { IntelligentReportingService } from '../lib/intelligent-reporting.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const reportingService = new IntelligentReportingService();
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
router.post('/', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId || 'default';
        const createdBy = req.user?.id || 'system';
        const validatedData = CreateReportSchema.parse(req.body);
        const report = await reportingService.createReport(validatedData, organizationId, createdBy);
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
    }
    catch (error) {
        structuredLogger.error('Failed to create report', error, {
            operation: 'report_create',
            body: req.body
        });
        if (error instanceof z.ZodError) {
            res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors
            });
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to create report'
            });
        }
    }
});
router.get('/', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId || 'default';
        const { type, createdBy, isActive, isPublic } = req.query;
        const filters = {
            type: type,
            createdBy: createdBy,
            isActive: isActive ? isActive === 'true' : undefined,
            isPublic: isPublic ? isPublic === 'true' : undefined
        };
        const reports = await reportingService.getReports(organizationId, filters);
        res.json({
            success: true,
            data: reports,
            count: reports.length
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get reports', error, {
            operation: 'reports_get',
            query: req.query
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get reports'
        });
    }
});
router.get('/:reportId', async (req, res) => {
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
    }
    catch (error) {
        structuredLogger.error('Failed to get report', error, {
            operation: 'report_get',
            reportId: req.params.reportId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get report'
        });
    }
});
router.put('/:reportId', async (req, res) => {
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
    }
    catch (error) {
        structuredLogger.error('Failed to update report', error, {
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
        }
        else {
            res.status(500).json({
                success: false,
                error: 'Failed to update report'
            });
        }
    }
});
router.delete('/:reportId', async (req, res) => {
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
    }
    catch (error) {
        structuredLogger.error('Failed to delete report', error, {
            operation: 'report_delete',
            reportId: req.params.reportId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to delete report'
        });
    }
});
router.post('/:reportId/generate', async (req, res) => {
    try {
        const { reportId } = req.params;
        const generatedBy = req.user?.id || 'system';
        const validatedData = GenerateReportSchema.parse(req.body);
        const generation = await reportingService.generateReport(reportId, generatedBy, validatedData.parameters);
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
    }
    catch (error) {
        structuredLogger.error('Failed to generate report', error, {
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
        }
        else {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Failed to generate report'
            });
        }
    }
});
router.get('/generations/:generationId', async (req, res) => {
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
    }
    catch (error) {
        structuredLogger.error('Failed to get generation status', error, {
            operation: 'generation_get',
            generationId: req.params.generationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get generation status'
        });
    }
});
router.get('/:reportId/generations', async (req, res) => {
    try {
        const { reportId } = req.params;
        const generations = await reportingService.getReportGenerations(reportId);
        res.json({
            success: true,
            data: generations,
            count: generations.length
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get report generations', error, {
            operation: 'generations_get',
            reportId: req.params.reportId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get report generations'
        });
    }
});
router.get('/templates', async (req, res) => {
    try {
        const templates = await reportingService.getReportTemplates();
        res.json({
            success: true,
            data: templates,
            count: templates.length
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get report templates', error, {
            operation: 'templates_get'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get report templates'
        });
    }
});
router.get('/analytics', async (req, res) => {
    try {
        const organizationId = req.user?.organizationId || 'default';
        const analytics = await reportingService.getReportAnalytics(organizationId);
        res.json({
            success: true,
            data: analytics
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get report analytics', error, {
            operation: 'analytics_get',
            organizationId: req.user?.organizationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get report analytics'
        });
    }
});
router.get('/stats', async (req, res) => {
    try {
        const stats = await reportingService.getServiceStats();
        res.json({
            success: true,
            data: stats
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get service stats', error, {
            operation: 'stats_get'
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get service stats'
        });
    }
});
export default router;
//# sourceMappingURL=advanced-reporting.js.map