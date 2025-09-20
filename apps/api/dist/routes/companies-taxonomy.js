import { Router } from 'express';
import { z } from 'zod';
import { companiesTaxonomyService } from '../lib/companies-taxonomy.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const router = Router();
const CompanyDataSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    website: z.string().url().optional(),
    industry: z.string().optional(),
    keywords: z.array(z.string()).optional()
});
const ViewDataSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    organizationId: z.string().min(1),
    filters: z.array(z.any()).optional(),
    sorting: z.object({
        field: z.string(),
        direction: z.enum(['asc', 'desc'])
    }).optional(),
    columns: z.array(z.any()).optional(),
    isDefault: z.boolean().optional(),
    isPublic: z.boolean().optional()
});
router.get('/taxonomies', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const taxonomies = companiesTaxonomyService.getTaxonomies();
        structuredLogger.info('Taxonomies requested', {
            traceId,
            spanId,
            count: taxonomies.length
        });
        res.json({
            success: true,
            data: {
                taxonomies,
                count: taxonomies.length,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get taxonomies', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get taxonomies',
            traceId
        });
    }
});
router.post('/classify', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const companyData = CompanyDataSchema.parse(req.body);
        structuredLogger.info('Company classification requested', {
            traceId,
            spanId,
            companyName: companyData.name
        });
        const classifications = await companiesTaxonomyService.classifyCompany(companyData);
        structuredLogger.info('Company classified successfully', {
            traceId,
            spanId,
            companyName: companyData.name,
            classificationsCount: classifications.length
        });
        res.json({
            success: true,
            data: {
                classifications,
                count: classifications.length,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid company data',
                details: error.errors,
                traceId
            });
        }
        structuredLogger.error('Failed to classify company', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to classify company',
            traceId
        });
    }
});
router.get('/views/:organizationId', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    const { organizationId } = req.params;
    try {
        const views = companiesTaxonomyService.getViews(organizationId);
        structuredLogger.info('Views requested', {
            traceId,
            spanId,
            organizationId,
            count: views.length
        });
        res.json({
            success: true,
            data: {
                views,
                count: views.length,
                organizationId,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get views', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId,
            organizationId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get views',
            organizationId,
            traceId
        });
    }
});
router.post('/views', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const viewData = ViewDataSchema.parse(req.body);
        structuredLogger.info('View creation requested', {
            traceId,
            spanId,
            viewName: viewData.name,
            organizationId: viewData.organizationId
        });
        const view = await companiesTaxonomyService.createView(viewData);
        structuredLogger.info('View created successfully', {
            traceId,
            spanId,
            viewId: view.id,
            viewName: view.name
        });
        res.status(201).json({
            success: true,
            data: {
                view,
                message: 'View created successfully',
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Invalid view data',
                details: error.errors,
                traceId
            });
        }
        structuredLogger.error('Failed to create view', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to create view',
            traceId
        });
    }
});
router.get('/views/:organizationId/:viewId/companies', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    const { organizationId, viewId } = req.params;
    const { page = 1, limit = 50, search } = req.query;
    try {
        structuredLogger.info('Companies by view requested', {
            traceId,
            spanId,
            organizationId,
            viewId,
            page,
            limit,
            search
        });
        const result = await companiesTaxonomyService.getCompaniesByView(viewId, organizationId, {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            search: search
        });
        structuredLogger.info('Companies retrieved successfully', {
            traceId,
            spanId,
            organizationId,
            viewId,
            total: result.total,
            returned: result.companies.length
        });
        res.json({
            success: true,
            data: {
                ...result,
                organizationId,
                viewId,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Failed to get companies by view', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId,
            organizationId,
            viewId
        });
        res.status(500).json({
            success: false,
            error: 'Failed to get companies by view',
            organizationId,
            viewId,
            traceId
        });
    }
});
router.get('/health', async (req, res) => {
    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const spanId = `span_${Math.random().toString(36).substr(2, 9)}`;
    try {
        const taxonomies = companiesTaxonomyService.getTaxonomies();
        const views = companiesTaxonomyService.getViews('default');
        const healthChecks = {
            hasTaxonomies: taxonomies.length > 0,
            hasViews: views.length > 0,
            serviceInitialized: true
        };
        const isHealthy = Object.values(healthChecks).every(check => check);
        structuredLogger.info('Taxonomy service health check', {
            traceId,
            spanId,
            healthChecks,
            isHealthy
        });
        res.status(isHealthy ? 200 : 503).json({
            success: true,
            data: {
                status: isHealthy ? 'healthy' : 'degraded',
                checks: healthChecks,
                taxonomiesCount: taxonomies.length,
                viewsCount: views.length,
                timestamp: new Date().toISOString(),
                traceId
            }
        });
    }
    catch (error) {
        structuredLogger.error('Taxonomy service health check failed', {
            error: error instanceof Error ? error.message : String(error),
            traceId,
            spanId
        });
        res.status(500).json({
            success: false,
            error: 'Taxonomy service health check failed',
            traceId
        });
    }
});
export default router;
//# sourceMappingURL=companies-taxonomy.js.map