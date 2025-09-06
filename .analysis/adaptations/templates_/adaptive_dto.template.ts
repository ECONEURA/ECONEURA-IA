import { z } from 'zod';
import { UUIDSchema, NameSchema, DescriptionSchema, TagsSchema, CustomFieldsSchema } from '../../../shared/utils/validation.utils.js';

// ============================================================================
// ADAPTIVE DTO TEMPLATE
// ============================================================================

// Analizar DTOs existentes para extraer patrones comunes
// TODO: Reemplazar con patrones específicos encontrados en el análisis

// ========================================================================
// BASIC SCHEMAS - Reutilizar schemas existentes
// ========================================================================

export const {{ENTITY_NAME}}TypeSchema = z.enum([
  // TODO: Definir tipos basados en DTOs existentes
]);

export const {{ENTITY_NAME}}StatusSchema = z.enum([
  // TODO: Definir estados basados en DTOs existentes
]);

// ========================================================================
// CREATE {{ENTITY_NAME}} SCHEMAS - Seguir patrón de DTOs existentes
// ========================================================================

export const Create{{ENTITY_NAME}}Schema = z.object({
  // TODO: Agregar campos basados en análisis de DTOs existentes
  organizationId: UUIDSchema,
  // name: NameSchema,
  // description: DescriptionSchema.optional(),
  // tags: TagsSchema,
  // customFields: CustomFieldsSchema
});

// ========================================================================
// UPDATE {{ENTITY_NAME}} SCHEMAS - Seguir patrón de DTOs existentes
// ========================================================================

export const Update{{ENTITY_NAME}}Schema = z.object({
  // TODO: Agregar campos basados en análisis de DTOs existentes
  // name: NameSchema.optional(),
  // description: DescriptionSchema.optional(),
  // tags: TagsSchema,
  // customFields: CustomFieldsSchema
});

// ========================================================================
// PARAMETER SCHEMAS - Reutilizar patrones existentes
// ========================================================================

export const {{ENTITY_NAME}}IdParamSchema = z.object({
  id: UUIDSchema
});

export const {{ENTITY_NAME}}OrganizationIdParamSchema = z.object({
  organizationId: UUIDSchema
});

// ========================================================================
// QUERY SCHEMAS - Seguir patrón de queries existentes
// ========================================================================

export const {{ENTITY_NAME}}SearchQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().max(200, 'Search term cannot exceed 200 characters').optional()
});

// ========================================================================
// RESPONSE SCHEMAS - Seguir patrón de respuestas existentes
// ========================================================================

export const {{ENTITY_NAME}}ResponseSchema = z.object({
  id: UUIDSchema,
  organizationId: UUIDSchema,
  // TODO: Agregar campos basados en análisis de DTOs existentes
  createdAt: z.date(),
  updatedAt: z.date()
});

export const {{ENTITY_NAME}}ListResponseSchema = z.object({
  data: z.array({{ENTITY_NAME}}ResponseSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean()
  })
});

// ========================================================================
// TYPE EXPORTS - Seguir patrón de exports existentes
// ========================================================================

export type Create{{ENTITY_NAME}}Request = z.infer<typeof Create{{ENTITY_NAME}}Schema>;
export type Update{{ENTITY_NAME}}Request = z.infer<typeof Update{{ENTITY_NAME}}Schema>;
export type {{ENTITY_NAME}}IdParam = z.infer<typeof {{ENTITY_NAME}}IdParamSchema>;
export type {{ENTITY_NAME}}OrganizationIdParam = z.infer<typeof {{ENTITY_NAME}}OrganizationIdParamSchema>;
export type {{ENTITY_NAME}}SearchQuery = z.infer<typeof {{ENTITY_NAME}}SearchQuerySchema>;
export type {{ENTITY_NAME}}Response = z.infer<typeof {{ENTITY_NAME}}ResponseSchema>;
export type {{ENTITY_NAME}}ListResponse = z.infer<typeof {{ENTITY_NAME}}ListResponseSchema>;
