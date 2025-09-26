import { z } from 'zod';

import {
  UUIDSchema,
  OrganizationIdSchema,
  NameSchema,
  DescriptionSchema,
  NotesSchema,
  TagsSchema,
  CustomFieldsSchema,
  BaseSearchQuerySchema,
  IdParamSchema,
  OrganizationIdParamSchema,
  ListResponseSchema,
  BaseStatsSchema,
  BulkDeleteSchema,
  DateRangeSchema
} from './base.dto.js';

// ============================================================================
// ARCHITECTURE DTOs - PR-0: MONOREPO + HEXAGONAL ARCHITECTURE
// ============================================================================

// ========================================================================
// REQUEST DTOs
// ========================================================================

export const CreateArchitectureRequestSchema = z.object({
  organizationId: OrganizationIdSchema,
  name: NameSchema,
  type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven'], {
    errorMap: () => ({ message: 'Type must be one of: hexagonal, layered, microservices, monolithic, event_driven' })
  }),
  description: DescriptionSchema.optional(),
  settings: z.object({
    layers: z.array(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(255),
      type: z.enum(['domain', 'application', 'infrastructure', 'presentation', 'shared'], {
        errorMap: () => ({ message: 'Layer type must be one of: domain, application, infrastructure, presentation, shared' })
      }),
      description: z.string().max(1000),
      components: z.array(z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255),
        type: z.enum(['entity', 'repository', 'use_case', 'service', 'controller', 'middleware', 'dto', 'route'], {
          errorMap: () => ({ message: 'Component type must be one of: entity, repository, use_case, service, controller, middleware, dto, route' })
        }),
        description: z.string().max(1000),
        dependencies: z.array(z.string()).default([]),
        interfaces: z.array(z.string()).default([]),
        implementation: z.string().max(5000),
        tests: z.array(z.string()).default([]),
        documentation: z.string().max(5000)
      })).min(1, 'At least one component is required per layer'),
      dependencies: z.array(z.string()).default([]),
      responsibilities: z.array(z.string()).default([]),
      patterns: z.array(z.string()).default([])
    })).min(1, 'At least one layer is required'),
    patterns: z.array(z.string()).default([]),
    principles: z.array(z.string()).default([]),
    conventions: z.record(z.any()).default({}),
    tools: z.array(z.string()).default([]),
    frameworks: z.array(z.string()).default([]),
    libraries: z.array(z.string()).default([]),
    customFields: CustomFieldsSchema,
    tags: TagsSchema,
    notes: NotesSchema
  })
});

export const UpdateArchitectureRequestSchema = z.object({
  name: NameSchema.optional(),
  type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven']).optional(),
  description: DescriptionSchema.optional(),
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
    customFields: CustomFieldsSchema.optional(),
    tags: TagsSchema.optional(),
    notes: NotesSchema.optional()
  }).optional()
});

export const AnalyzeArchitectureRequestSchema = z.object({
  id: UUIDSchema,
  forceReanalysis: z.boolean().default(false)
});

// ========================================================================
// PARAMETER DTOs
// ========================================================================

export const ArchitectureIdParamSchema = IdParamSchema;
export const ArchitectureOrganizationIdParamSchema = OrganizationIdParamSchema;

// ========================================================================
// QUERY DTOs
// ========================================================================

export const ArchitectureSearchQuerySchema = BaseSearchQuerySchema.extend({
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
});

export const ArchitectureBulkUpdateSchema = z.object({
  ids: z.array(UUIDSchema).min(1, 'At least one architecture ID is required'),
  updates: z.object({
    status: z.enum(['design', 'implementation', 'testing', 'deployed', 'maintenance']).optional(),
    patterns: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional()
  })
});

export const ArchitectureBulkDeleteSchema = BulkDeleteSchema;

// ========================================================================
// RESPONSE DTOs
// ========================================================================

export const ArchitectureComponentResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['entity', 'repository', 'use_case', 'service', 'controller', 'middleware', 'dto', 'route']),
  layer: z.enum(['domain', 'application', 'infrastructure', 'presentation', 'shared']),
  description: z.string(),
  dependencies: z.array(z.string()),
  interfaces: z.array(z.string()),
  implementation: z.string(),
  tests: z.array(z.string()),
  documentation: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ArchitectureLayerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['domain', 'application', 'infrastructure', 'presentation', 'shared']),
  description: z.string(),
  components: z.array(ArchitectureComponentResponseSchema),
  dependencies: z.array(z.string()),
  responsibilities: z.array(z.string()),
  patterns: z.array(z.string()),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ArchitectureMetricsResponseSchema = z.object({
  totalComponents: z.number(),
  totalLayers: z.number(),
  complexity: z.number(),
  coupling: z.number(),
  cohesion: z.number(),
  maintainability: z.number(),
  testability: z.number(),
  scalability: z.number(),
  performance: z.number(),
  security: z.number(),
  lastAnalysisDate: z.date(),
  analysisDuration: z.number(),
  qualityScore: z.number()
});

export const ArchitectureResponseSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  name: z.string(),
  type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven']),
  status: z.enum(['design', 'implementation', 'testing', 'deployed', 'maintenance']),
  description: z.string().optional(),
  settings: z.object({
    type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven']),
    layers: z.array(ArchitectureLayerResponseSchema),
    patterns: z.array(z.string()),
    principles: z.array(z.string()),
    conventions: z.record(z.any()),
    tools: z.array(z.string()),
    frameworks: z.array(z.string()),
    libraries: z.array(z.string()),
    customFields: z.record(z.any()),
    tags: z.array(z.string()),
    notes: z.string()
  }),
  metrics: ArchitectureMetricsResponseSchema.optional(),
  components: z.array(ArchitectureComponentResponseSchema),
  layers: z.array(ArchitectureLayerResponseSchema),
  lastAnalysisDate: z.date().optional(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export const ArchitectureListResponseSchema = ListResponseSchema.extend({
  data: z.array(ArchitectureResponseSchema)
});

export const ArchitectureStatsResponseSchema = BaseStatsSchema.extend({
  byType: z.record(z.number()),
  byStatus: z.record(z.number()),
  byLayerType: z.record(z.number()),
  byComponentType: z.record(z.number()),
  totalComponents: z.number(),
  totalLayers: z.number(),
  averageQualityScore: z.number(),
  averageComplexity: z.number(),
  averageCoupling: z.number(),
  averageCohesion: z.number(),
  averageMaintainability: z.number(),
  averageTestability: z.number(),
  averageScalability: z.number(),
  averagePerformance: z.number(),
  averageSecurity: z.number(),
  lastAnalysisDate: z.date().optional(),
  totalAnalysisTime: z.number(),
  architecturesWithMetrics: z.number()
});

// ========================================================================
// BATCH OPERATION DTOs
// ========================================================================

export const BatchAnalysisRequestSchema = z.object({
  ids: z.array(UUIDSchema).min(1, 'At least one architecture ID is required'),
  forceReanalysis: z.boolean().default(false)
});

// ========================================================================
// REPORT DTOs
// ========================================================================

export const ArchitectureReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema,
  filters: z.object({
    type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven']).optional(),
    status: z.enum(['design', 'implementation', 'testing', 'deployed', 'maintenance']).optional(),
    layerType: z.enum(['domain', 'application', 'infrastructure', 'presentation', 'shared']).optional(),
    componentType: z.enum(['entity', 'repository', 'use_case', 'service', 'controller', 'middleware', 'dto', 'route']).optional(),
    isActive: z.boolean().optional(),
    hasMetrics: z.boolean().optional(),
    dateRange: DateRangeSchema.optional()
  }).optional()
});

export const ComponentReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema
});

export const QualityReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema
});

export const AnalysisReportRequestSchema = z.object({
  organizationId: OrganizationIdSchema,
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  filters: z.object({
    type: z.enum(['hexagonal', 'layered', 'microservices', 'monolithic', 'event_driven']).optional(),
    status: z.enum(['design', 'implementation', 'testing', 'deployed', 'maintenance']).optional(),
    minQualityScore: z.number().min(0).max(10).optional(),
    maxQualityScore: z.number().min(0).max(10).optional()
  }).optional()
});

// ========================================================================
// TYPE EXPORTS
// ========================================================================

export type CreateArchitectureRequest = z.infer<typeof CreateArchitectureRequestSchema>;
export type UpdateArchitectureRequest = z.infer<typeof UpdateArchitectureRequestSchema>;
export type AnalyzeArchitectureRequest = z.infer<typeof AnalyzeArchitectureRequestSchema>;
export type ArchitectureIdParam = z.infer<typeof ArchitectureIdParamSchema>;
export type ArchitectureOrganizationIdParam = z.infer<typeof ArchitectureOrganizationIdParamSchema>;
export type ArchitectureSearchQuery = z.infer<typeof ArchitectureSearchQuerySchema>;
export type ArchitectureBulkUpdate = z.infer<typeof ArchitectureBulkUpdateSchema>;
export type ArchitectureBulkDelete = z.infer<typeof ArchitectureBulkDeleteSchema>;
export type ArchitectureResponse = z.infer<typeof ArchitectureResponseSchema>;
export type ArchitectureListResponse = z.infer<typeof ArchitectureListResponseSchema>;
export type ArchitectureStatsResponse = z.infer<typeof ArchitectureStatsResponseSchema>;
export type ArchitectureComponentResponse = z.infer<typeof ArchitectureComponentResponseSchema>;
export type ArchitectureLayerResponse = z.infer<typeof ArchitectureLayerResponseSchema>;
export type ArchitectureMetricsResponse = z.infer<typeof ArchitectureMetricsResponseSchema>;
export type BatchAnalysisRequest = z.infer<typeof BatchAnalysisRequestSchema>;
export type ArchitectureReportRequest = z.infer<typeof ArchitectureReportRequestSchema>;
export type ComponentReportRequest = z.infer<typeof ComponentReportRequestSchema>;
export type QualityReportRequest = z.infer<typeof QualityReportRequestSchema>;
export type AnalysisReportRequest = z.infer<typeof AnalysisReportRequestSchema>;
