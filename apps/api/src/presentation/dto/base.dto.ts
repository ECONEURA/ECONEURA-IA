import { z } from 'zod';

// ============================================================================
// BASE DTOs - Schemas base para todos los DTOs
// ============================================================================

// ========================================================================
// SCHEMAS COMUNES
// ========================================================================

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const OrganizationIdSchema = z.string().uuid('Invalid organization ID format');

export const NameSchema = z.string()
  .min(1, 'Name is required')
  .max(200, 'Name cannot exceed 200 characters')
  .transform(val => val.trim());

export const DescriptionSchema = z.string()
  .max(2000, 'Description cannot exceed 2000 characters')
  .optional()
  .transform(val => val?.trim());

export const ShortDescriptionSchema = z.string()
  .max(500, 'Short description cannot exceed 500 characters')
  .optional()
  .transform(val => val?.trim());

export const EmailSchema = z.string()
  .email('Invalid email format')
  .transform(val => val.toLowerCase().trim());

export const PhoneSchema = z.string()
  .regex(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
  .optional();

export const WebsiteSchema = z.string()
  .url('Invalid website URL')
  .optional();

export const TagsSchema = z.array(z.string())
  .default([]);

export const CustomFieldsSchema = z.record(z.any())
  .default({});

export const NotesSchema = z.string()
  .max(1000, 'Notes cannot exceed 1000 characters')
  .default('');

// ========================================================================
// SCHEMAS DE PAGINACIÓN
// ========================================================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1, 'Page must be at least 1').default(1),
  limit: z.coerce.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit cannot exceed 100').default(20),
  sortBy: z.string().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

export const SearchQuerySchema = z.object({
  search: z.string().max(200, 'Search term cannot exceed 200 characters').optional()
});

export const BaseSearchQuerySchema = PaginationQuerySchema.merge(SearchQuerySchema);

// ========================================================================
// SCHEMAS DE PARÁMETROS
// ========================================================================

export const IdParamSchema = z.object({
  id: UUIDSchema
});

export const OrganizationIdParamSchema = z.object({
  organizationId: OrganizationIdSchema
});

// ========================================================================
// SCHEMAS DE RESPUESTA
// ========================================================================

export const BaseResponseSchema = z.object({
  success: z.boolean(),
  data: z.any(),
  message: z.string().optional()
});

export const PaginationResponseSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
  hasNext: z.boolean(),
  hasPrev: z.boolean()
});

export const ListResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: PaginationResponseSchema
});

// ========================================================================
// SCHEMAS DE ESTADÍSTICAS
// ========================================================================

export const BaseStatsSchema = z.object({
  total: z.number(),
  active: z.number(),
  inactive: z.number(),
  createdThisMonth: z.number(),
  createdThisYear: z.number(),
  updatedThisMonth: z.number(),
  updatedThisYear: z.number()
});

// ========================================================================
// SCHEMAS DE OPERACIONES EN LOTE
// ========================================================================

export const BulkUpdateSchema = z.object({
  ids: z.array(UUIDSchema).min(1, 'At least one ID is required'),
  updates: z.record(z.any())
});

export const BulkDeleteSchema = z.object({
  ids: z.array(UUIDSchema).min(1, 'At least one ID is required')
});

// ========================================================================
// SCHEMAS DE VALIDACIÓN DE FECHAS
// ========================================================================

export const DateRangeSchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional()
}).refine(
  (data) => {
    if (data.startDate && data.endDate) {
      return data.startDate <= data.endDate;
    }
    return true;
  },
  {
    message: 'Start date must be before or equal to end date',
    path: ['startDate']
  }
);

// ========================================================================
// SCHEMAS DE VALIDACIÓN DE MONEDA
// ========================================================================

export const MoneySchema = z.object({
  amount: z.number().min(0, 'Amount must be non-negative'),
  currency: z.string().length(3, 'Currency must be 3 characters')
});

// ========================================================================
// SCHEMAS DE VALIDACIÓN DE DIRECCIÓN
// ========================================================================

export const AddressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional(),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
  countryCode: z.string().length(2, 'Country code must be 2 characters')
});

// ========================================================================
// TIPOS EXPORTADOS
// ========================================================================

export type BaseSearchQuery = z.infer<typeof BaseSearchQuerySchema>;
export type IdParam = z.infer<typeof IdParamSchema>;
export type OrganizationIdParam = z.infer<typeof OrganizationIdParamSchema>;
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type ListResponse<T> = {
  data: T[];
  pagination: z.infer<typeof PaginationResponseSchema>;
};
export type BaseStats = z.infer<typeof BaseStatsSchema>;
export type BulkUpdate = z.infer<typeof BulkUpdateSchema>;
export type BulkDelete = z.infer<typeof BulkDeleteSchema>;
export type DateRange = z.infer<typeof DateRangeSchema>;
export type Money = z.infer<typeof MoneySchema>;
export type Address = z.infer<typeof AddressSchema>;
