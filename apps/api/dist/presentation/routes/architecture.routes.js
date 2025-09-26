import { Router } from 'express';
import { z } from 'zod';

import { validateRequest, authenticate, authorize } from '../middleware/base.middleware.js';
export const createArchitectureRoutes = (architectureController) => {
    const router = Router();
    router.post('/', authenticate, authorize(['architecture:create']), validateRequest({
        body: z.object({
            organizationId: z.string().uuid(),
            name: z.string().min(1).max(255),
            type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven']),
            description: z.string().max(1000).optional(),
            settings: z.object({
                layers: z.array(z.object({
                    id: z.string().uuid(),
                    name: z.string().min(1).max(255),
                    type: z.enum(['domain', 'application', 'infrastructure', 'presentation', 'shared']),
                    description: z.string().max(1000),
                    components: z.array(z.object({
                        id: z.string().uuid(),
                        name: z.string().min(1).max(255),
                        type: z.enum(['entity', 'repository', 'use_case', 'service', 'controller', 'middleware', 'dto', 'route']),
                        description: z.string().max(1000),
                        dependencies: z.array(z.string()).default([]),
                        interfaces: z.array(z.string()).default([]),
                        implementation: z.string().max(5000),
                        tests: z.array(z.string()).default([]),
                        documentation: z.string().max(5000)
                    })).min(1),
                    dependencies: z.array(z.string()).default([]),
                    responsibilities: z.array(z.string()).default([]),
                    patterns: z.array(z.string()).default([])
                })).min(1),
                patterns: z.array(z.string()).default([]),
                principles: z.array(z.string()).default([]),
                conventions: z.record(z.any()).default({}),
                tools: z.array(z.string()).default([]),
                frameworks: z.array(z.string()).default([]),
                libraries: z.array(z.string()).default([]),
                customFields: z.record(z.any()).default({}),
                tags: z.array(z.string()).default([]),
                notes: z.string().max(1000).default('')
            })
        })
    }), architectureController.createArchitecture.bind(architectureController));
    router.put('/:id', authenticate, authorize(['architecture:update']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        }),
        body: z.object({
            name: z.string().min(1).max(255).optional(),
            type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven']).optional(),
            description: z.string().max(1000).optional(),
            settings: z.object({
                layers: z.array(z.object({
                    id: z.string().uuid(),
                    name: z.string().min(1).max(255),
                    type: z.enum(['domain', 'application', 'infrastructure', 'presentation', 'shared']),
                    description: z.string().max(1000),
                    components: z.array(z.object({
                        id: z.string().uuid(),
                        name: z.string().min(1).max(255),
                        type: z.enum(['entity', 'repository', 'use_case', 'service', 'controller', 'middleware', 'dto', 'route']),
                        description: z.string().max(1000),
                        dependencies: z.array(z.string()).default([]),
                        interfaces: z.array(z.string()).default([]),
                        implementation: z.string().max(5000),
                        tests: z.array(z.string()).default([]),
                        documentation: z.string().max(5000)
                    })),
                    dependencies: z.array(z.string()).default([]),
                    responsibilities: z.array(z.string()).default([]),
                    patterns: z.array(z.string()).default([])
                })).optional(),
                patterns: z.array(z.string()).optional(),
                principles: z.array(z.string()).optional(),
                conventions: z.record(z.any()).optional(),
                tools: z.array(z.string()).optional(),
                frameworks: z.array(z.string()).optional(),
                libraries: z.array(z.string()).optional(),
                customFields: z.record(z.any()).optional(),
                tags: z.array(z.string()).optional(),
                notes: z.string().max(1000).optional()
            }).optional()
        })
    }), architectureController.updateArchitecture.bind(architectureController));
    router.delete('/:id', authenticate, authorize(['architecture:delete']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        })
    }), architectureController.deleteArchitecture.bind(architectureController));
    router.get('/:id', authenticate, authorize(['architecture:read']), validateRequest({
        params: z.object({
            id: z.string().uuid()
        })
    }), architectureController.getArchitecture.bind(architectureController));
    router.get('/organizations/:organizationId', authenticate, authorize(['architecture:read']), validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
            search: z.string().max(200).optional(),
            type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven']).optional(),
            status: z.enum(['design', 'implementation', 'testing', 'deployed', 'maintenance']).optional(),
            layerType: z.enum(['domain', 'application', 'infrastructure', 'presentation', 'shared']).optional(),
            componentType: z.enum(['entity', 'repository', 'use_case', 'service', 'controller', 'middleware', 'dto', 'route']).optional(),
            isActive: z.coerce.boolean().optional(),
            hasMetrics: z.coerce.boolean().optional(),
            minQualityScore: z.coerce.number().min(0).max(10).optional(),
            maxQualityScore: z.coerce.number().min(0).max(10).optional(),
            lastAnalysisFrom: z.coerce.date().optional(),
            lastAnalysisTo: z.coerce.date().optional()
        })
    }), architectureController.getArchitecturesByOrganization.bind(architectureController));
    router.get('/organizations/:organizationId/search', authenticate, authorize(['architecture:read']), validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        }),
        query: z.object({
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc'),
            search: z.string().max(200).optional(),
            type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven']).optional(),
            status: z.enum(['design', 'implementation', 'testing', 'deployed', 'maintenance']).optional(),
            layerType: z.enum(['domain', 'application', 'infrastructure', 'presentation', 'shared']).optional(),
            componentType: z.enum(['entity', 'repository', 'use_case', 'service', 'controller', 'middleware', 'dto', 'route']).optional(),
            isActive: z.coerce.boolean().optional(),
            hasMetrics: z.coerce.boolean().optional(),
            minQualityScore: z.coerce.number().min(0).max(10).optional(),
            maxQualityScore: z.coerce.number().min(0).max(10).optional(),
            lastAnalysisFrom: z.coerce.date().optional(),
            lastAnalysisTo: z.coerce.date().optional()
        })
    }), architectureController.searchArchitectures.bind(architectureController));
    router.get('/organizations/:organizationId/stats', authenticate, authorize(['architecture:read']), validateRequest({
        params: z.object({
            organizationId: z.string().uuid()
        })
    }), architectureController.getArchitectureStats.bind(architectureController));
    router.get('/type/:type', authenticate, authorize(['architecture:read']), validateRequest({
        params: z.object({
            type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven'])
        }),
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), architectureController.getArchitecturesByType.bind(architectureController));
    router.get('/status/:status', authenticate, authorize(['architecture:read']), validateRequest({
        params: z.object({
            status: z.enum(['design', 'implementation', 'testing', 'deployed', 'maintenance'])
        }),
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), architectureController.getArchitecturesByStatus.bind(architectureController));
    router.get('/active', authenticate, authorize(['architecture:read']), validateRequest({
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), architectureController.getActiveArchitectures.bind(architectureController));
    router.get('/with-metrics', authenticate, authorize(['architecture:read']), validateRequest({
        query: z.object({
            organizationId: z.string().uuid(),
            page: z.coerce.number().int().min(1).default(1),
            limit: z.coerce.number().int().min(1).max(100).default(20),
            sortBy: z.string().default('createdAt'),
            sortOrder: z.enum(['asc', 'desc']).default('desc')
        })
    }), architectureController.getArchitecturesWithMetrics.bind(architectureController));
    router.post('/analyze', authenticate, authorize(['architecture:analyze']), validateRequest({
        body: z.object({
            id: z.string().uuid(),
            forceReanalysis: z.boolean().default(false)
        })
    }), architectureController.analyzeArchitecture.bind(architectureController));
    router.put('/bulk-update', authenticate, authorize(['architecture:update']), validateRequest({
        body: z.object({
            ids: z.array(z.string().uuid()).min(1),
            updates: z.object({
                status: z.enum(['design', 'implementation', 'testing', 'deployed', 'maintenance']).optional(),
                patterns: z.array(z.string()).optional(),
                tags: z.array(z.string()).optional()
            })
        })
    }), architectureController.bulkUpdateArchitectures.bind(architectureController));
    router.delete('/bulk-delete', authenticate, authorize(['architecture:delete']), validateRequest({
        body: z.object({
            ids: z.array(z.string().uuid()).min(1)
        })
    }), architectureController.bulkDeleteArchitectures.bind(architectureController));
    return router;
};
//# sourceMappingURL=architecture.routes.js.map