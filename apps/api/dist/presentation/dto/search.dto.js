import { z } from 'zod';
import { BaseDTOs } from './base.dto.js';
import { SearchResultType, SearchType } from '../../domain/entities/search-result.entity.js';
export const IntelligentSearchRequestSchema = z.object({
    query: z.string().min(1).max(500),
    filters: z.object({
        types: z.array(z.nativeEnum(SearchResultType)).optional(),
        categories: z.array(z.string()).optional(),
        subcategories: z.array(z.string()).optional(),
        dateFrom: z.string().datetime().optional(),
        dateTo: z.string().datetime().optional(),
        userId: z.string().uuid().optional(),
        organizationId: z.string().uuid().optional(),
        tags: z.array(z.string()).optional(),
        minScore: z.number().min(0).max(1).optional(),
        minRelevance: z.number().min(0).max(1).optional(),
        minConfidence: z.number().min(0).max(1).optional(),
        customFilters: z.record(z.any()).optional()
    }).optional(),
    searchType: z.nativeEnum(SearchType).optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    includeMetadata: z.boolean().optional(),
    highlightMatches: z.boolean().optional()
});
export const GetSuggestionsRequestSchema = z.object({
    query: z.string().min(1).max(200),
    limit: z.number().int().min(1).max(50).optional(),
    type: z.nativeEnum(SearchResultType).optional(),
    category: z.string().optional()
});
export const IndexEntityRequestSchema = z.object({
    entity: z.any(),
    type: z.nativeEnum(SearchResultType),
    entityId: z.string().uuid(),
    title: z.string().min(1).max(200),
    description: z.string().min(1).max(500),
    content: z.string().min(1).max(5000),
    tags: z.array(z.string()).optional(),
    category: z.string().optional(),
    subcategory: z.string().optional(),
    metadata: z.record(z.any()).optional()
});
export const SearchResultResponseSchema = z.object({
    id: z.string().uuid(),
    type: z.nativeEnum(SearchResultType),
    entityId: z.string().uuid(),
    entityType: z.string(),
    title: z.string(),
    description: z.string(),
    content: z.string(),
    tags: z.array(z.string()),
    score: z.number().min(0).max(1),
    relevance: z.number().min(0).max(1),
    confidence: z.number().min(0).max(1),
    category: z.string(),
    subcategory: z.string().optional(),
    metadata: z.record(z.any()),
    entityData: z.record(z.any()),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    indexedAt: z.string().datetime()
});
export const SearchSuggestionResponseSchema = z.object({
    text: z.string(),
    type: z.nativeEnum(SearchResultType),
    category: z.string(),
    score: z.number().min(0).max(1),
    metadata: z.record(z.any()).optional()
});
export const IntelligentSearchResponseSchema = z.object({
    results: z.array(SearchResultResponseSchema),
    totalCount: z.number().int().min(0),
    page: z.number().int().min(1),
    limit: z.number().int().min(1),
    totalPages: z.number().int().min(0),
    executionTime: z.number().min(0),
    suggestions: z.array(z.string()).optional(),
    filters: z.record(z.array(z.any())).optional()
});
export const GetSuggestionsResponseSchema = z.object({
    suggestions: z.array(SearchSuggestionResponseSchema),
    totalCount: z.number().int().min(0),
    executionTime: z.number().min(0)
});
export const IndexEntityResponseSchema = z.object({
    success: z.boolean(),
    indexedAt: z.string().datetime(),
    executionTime: z.number().min(0)
});
export class IntelligentSearchRequestDTO extends BaseDTOs {
    constructor(data) {
        super(data, IntelligentSearchRequestSchema);
    }
}
export class GetSuggestionsRequestDTO extends BaseDTOs {
    constructor(data) {
        super(data, GetSuggestionsRequestSchema);
    }
}
export class IndexEntityRequestDTO extends BaseDTOs {
    constructor(data) {
        super(data, IndexEntityRequestSchema);
    }
}
export class SearchResultResponseDTO extends BaseDTOs {
    constructor(data) {
        super(data, SearchResultResponseSchema);
    }
}
export class SearchSuggestionResponseDTO extends BaseDTOs {
    constructor(data) {
        super(data, SearchSuggestionResponseSchema);
    }
}
export class IntelligentSearchResponseDTO extends BaseDTOs {
    constructor(data) {
        super(data, IntelligentSearchResponseSchema);
    }
}
export class GetSuggestionsResponseDTO extends BaseDTOs {
    constructor(data) {
        super(data, GetSuggestionsResponseSchema);
    }
}
export class IndexEntityResponseDTO extends BaseDTOs {
    constructor(data) {
        super(data, IndexEntityResponseSchema);
    }
}
//# sourceMappingURL=search.dto.js.map