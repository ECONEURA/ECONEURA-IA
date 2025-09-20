import { Router } from 'express';
import { z } from 'zod';
import { semanticSearchCRMService } from '../lib/semantic-search-crm.service.js';
import { structuredLogger } from '../lib/structured-logger.js';
const semanticSearchCRMRouter = Router();
const IndexDocumentSchema = z.object({
    organizationId: z.string().min(1),
    type: z.enum(['contact', 'company', 'deal', 'invoice', 'product', 'interaction', 'note', 'task']),
    title: z.string().min(1),
    content: z.string().min(1),
    metadata: z.object({
        entityId: z.string().min(1),
        entityType: z.string().min(1),
        tags: z.array(z.string()),
        categories: z.array(z.string()),
        priority: z.enum(['low', 'medium', 'high', 'critical']),
        status: z.string().min(1),
        createdBy: z.string().min(1),
        lastModifiedBy: z.string().min(1),
        language: z.string().min(1),
        confidence: z.coerce.number().min(0).max(1)
    }),
    searchableFields: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional()
    })
});
const SemanticSearchSchema = z.object({
    query: z.string().min(1),
    organizationId: z.string().min(1),
    type: z.enum(['semantic', 'hybrid', 'keyword', 'fuzzy']).optional(),
    filters: z.object({
        documentTypes: z.array(z.string()).optional(),
        tags: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        priority: z.array(z.string()).optional(),
        status: z.array(z.string()).optional(),
        dateRange: z.object({
            start: z.string().datetime(),
            end: z.string().datetime()
        }).optional(),
        createdBy: z.array(z.string()).optional(),
        language: z.string().optional()
    }).optional(),
    limit: z.coerce.number().int().positive().max(100).default(10).optional(),
    offset: z.coerce.number().int().min(0).default(0).optional(),
    similarityThreshold: z.coerce.number().min(0).max(1).default(0.7).optional(),
    includeMetadata: z.coerce.boolean().default(true).optional()
});
const UpdateDocumentSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    metadata: z.object({
        entityId: z.string().min(1).optional(),
        entityType: z.string().min(1).optional(),
        tags: z.array(z.string()).optional(),
        categories: z.array(z.string()).optional(),
        priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
        status: z.string().min(1).optional(),
        createdBy: z.string().min(1).optional(),
        lastModifiedBy: z.string().min(1).optional(),
        language: z.string().min(1).optional(),
        confidence: z.coerce.number().min(0).max(1).optional()
    }).optional(),
    searchableFields: z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        phone: z.string().optional(),
        company: z.string().optional(),
        description: z.string().optional(),
        notes: z.string().optional(),
        tags: z.array(z.string()).optional()
    }).optional()
});
const CreateSearchIndexSchema = z.object({
    organizationId: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    status: z.enum(['building', 'ready', 'updating', 'error']).default('building'),
    configuration: z.object({
        model: z.string().min(1),
        dimensions: z.coerce.number().int().positive(),
        similarityMetric: z.enum(['cosine', 'euclidean', 'dot_product']),
        chunkSize: z.coerce.number().int().positive(),
        overlapSize: z.coerce.number().int().min(0),
        language: z.string().min(1),
        autoUpdate: z.boolean().default(true),
        updateInterval: z.coerce.number().int().positive()
    })
});
const LogSearchAnalyticsSchema = z.object({
    organizationId: z.string().min(1),
    queryId: z.string().min(1),
    userId: z.string().min(1),
    sessionId: z.string().min(1),
    query: z.string().min(1),
    results: z.object({
        totalFound: z.coerce.number().int().min(0),
        clickedDocuments: z.array(z.string()),
        timeSpent: z.coerce.number().int().min(0),
        satisfaction: z.coerce.number().int().min(1).max(5),
        feedback: z.string().optional()
    }),
    performance: z.object({
        queryTime: z.coerce.number().int().min(0),
        indexTime: z.coerce.number().int().min(0),
        cacheHit: z.boolean(),
        modelUsed: z.string().min(1)
    })
});
const GetSearchSuggestionsSchema = z.object({
    query: z.string().min(1),
    organizationId: z.string().min(1),
    userId: z.string().optional(),
    sessionId: z.string().optional(),
    previousQueries: z.array(z.string()).optional()
});
semanticSearchCRMRouter.post('/documents', async (req, res) => {
    try {
        const documentData = IndexDocumentSchema.parse(req.body);
        const document = await semanticSearchCRMService.indexDocument(documentData);
        res.status(201).json({
            success: true,
            data: document,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error indexing document', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
semanticSearchCRMRouter.get('/documents/:documentId', async (req, res) => {
    try {
        const { documentId } = z.object({ documentId: z.string().min(1) }).parse(req.params);
        const document = await semanticSearchCRMService.getDocument(documentId);
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }
        res.json({
            success: true,
            data: document,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting document', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
semanticSearchCRMRouter.put('/documents/:documentId', async (req, res) => {
    try {
        const { documentId } = z.object({ documentId: z.string().min(1) }).parse(req.params);
        const updates = UpdateDocumentSchema.parse(req.body);
        const document = await semanticSearchCRMService.updateDocument(documentId, updates);
        if (!document) {
            return res.status(404).json({
                success: false,
                error: 'Document not found'
            });
        }
        res.json({
            success: true,
            data: document,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error updating document', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
semanticSearchCRMRouter.post('/search', async (req, res) => {
    try {
        const { query, organizationId, type, filters, limit, offset, similarityThreshold, includeMetadata } = SemanticSearchSchema.parse(req.body);
        const searchResult = await semanticSearchCRMService.semanticSearch(query, organizationId, {
            type,
            filters,
            limit,
            offset,
            similarityThreshold,
            includeMetadata
        });
        res.json({
            success: true,
            data: searchResult,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error performing semantic search', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
semanticSearchCRMRouter.get('/indexes', async (req, res) => {
    try {
        const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(req.query);
        const indexes = await semanticSearchCRMService.getSearchIndexes(organizationId);
        res.json({
            success: true,
            data: {
                indexes,
                total: indexes.length
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting search indexes', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
semanticSearchCRMRouter.post('/indexes', async (req, res) => {
    try {
        const indexData = CreateSearchIndexSchema.parse(req.body);
        const index = await semanticSearchCRMService.createSearchIndex(indexData);
        res.status(201).json({
            success: true,
            data: index,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error creating search index', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
semanticSearchCRMRouter.post('/analytics', async (req, res) => {
    try {
        const analyticsData = LogSearchAnalyticsSchema.parse(req.body);
        const analytics = await semanticSearchCRMService.logSearchAnalytics(analyticsData);
        res.status(201).json({
            success: true,
            data: analytics,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error logging search analytics', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
semanticSearchCRMRouter.post('/suggestions', async (req, res) => {
    try {
        const { query, organizationId, userId, sessionId, previousQueries } = GetSearchSuggestionsSchema.parse(req.body);
        const suggestions = await semanticSearchCRMService.getSearchSuggestions(query, organizationId, {
            userId,
            sessionId,
            previousQueries
        });
        res.json({
            success: true,
            data: suggestions,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting search suggestions', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
semanticSearchCRMRouter.get('/stats', async (req, res) => {
    try {
        const { organizationId } = z.object({ organizationId: z.string().min(1) }).parse(req.query);
        const stats = await semanticSearchCRMService.getSearchStats(organizationId);
        res.json({
            success: true,
            data: stats,
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error getting search stats', { error });
        res.status(400).json({
            success: false,
            error: 'Invalid request data',
            details: error.errors
        });
    }
});
semanticSearchCRMRouter.get('/health', async (req, res) => {
    try {
        const stats = await semanticSearchCRMService.getSearchStats('demo-org-1');
        res.json({
            success: true,
            data: {
                status: 'ok',
                totalDocuments: stats.totalDocuments,
                totalQueries: stats.totalQueries,
                totalIndexes: stats.totalIndexes,
                documentStats: {
                    byType: stats.documentStats.byType,
                    byPriority: stats.documentStats.byPriority,
                    averageConfidence: stats.documentStats.averageConfidence
                },
                searchStats: {
                    totalSearches: stats.searchStats.totalSearches,
                    averageResults: stats.searchStats.averageResults,
                    averageExecutionTime: stats.searchStats.averageExecutionTime
                },
                performanceStats: {
                    averageQueryTime: stats.performanceStats.averageQueryTime,
                    cacheHitRate: stats.performanceStats.cacheHitRate,
                    averageSatisfaction: stats.performanceStats.averageSatisfaction
                },
                lastUpdated: new Date().toISOString()
            },
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
        structuredLogger.error('Error checking semantic search health', { error });
        res.status(500).json({
            success: false,
            error: 'Health check failed'
        });
    }
});
export { semanticSearchCRMRouter };
//# sourceMappingURL=semantic-search-crm.js.map