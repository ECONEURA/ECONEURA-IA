import { z } from 'zod';
import { BaseDTOs } from './base.dto.js';
import { SearchResultType, SearchType } from '../../domain/entities/search-result.entity.js';
export declare const IntelligentSearchRequestSchema: z.ZodObject<{
    query: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        types: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof SearchResultType>, "many">>;
        categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        subcategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dateFrom: z.ZodOptional<z.ZodString>;
        dateTo: z.ZodOptional<z.ZodString>;
        userId: z.ZodOptional<z.ZodString>;
        organizationId: z.ZodOptional<z.ZodString>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        minScore: z.ZodOptional<z.ZodNumber>;
        minRelevance: z.ZodOptional<z.ZodNumber>;
        minConfidence: z.ZodOptional<z.ZodNumber>;
        customFilters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        userId?: string;
        organizationId?: string;
        tags?: string[];
        categories?: string[];
        types?: SearchResultType[];
        subcategories?: string[];
        dateFrom?: string;
        dateTo?: string;
        minScore?: number;
        minRelevance?: number;
        minConfidence?: number;
        customFilters?: Record<string, any>;
    }, {
        userId?: string;
        organizationId?: string;
        tags?: string[];
        categories?: string[];
        types?: SearchResultType[];
        subcategories?: string[];
        dateFrom?: string;
        dateTo?: string;
        minScore?: number;
        minRelevance?: number;
        minConfidence?: number;
        customFilters?: Record<string, any>;
    }>>;
    searchType: z.ZodOptional<z.ZodNativeEnum<typeof SearchType>>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    includeMetadata: z.ZodOptional<z.ZodBoolean>;
    highlightMatches: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    page?: number;
    limit?: number;
    filters?: {
        userId?: string;
        organizationId?: string;
        tags?: string[];
        categories?: string[];
        types?: SearchResultType[];
        subcategories?: string[];
        dateFrom?: string;
        dateTo?: string;
        minScore?: number;
        minRelevance?: number;
        minConfidence?: number;
        customFilters?: Record<string, any>;
    };
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    searchType?: SearchType;
    includeMetadata?: boolean;
    highlightMatches?: boolean;
}, {
    query?: string;
    page?: number;
    limit?: number;
    filters?: {
        userId?: string;
        organizationId?: string;
        tags?: string[];
        categories?: string[];
        types?: SearchResultType[];
        subcategories?: string[];
        dateFrom?: string;
        dateTo?: string;
        minScore?: number;
        minRelevance?: number;
        minConfidence?: number;
        customFilters?: Record<string, any>;
    };
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    searchType?: SearchType;
    includeMetadata?: boolean;
    highlightMatches?: boolean;
}>;
export declare const GetSuggestionsRequestSchema: z.ZodObject<{
    query: z.ZodString;
    limit: z.ZodOptional<z.ZodNumber>;
    type: z.ZodOptional<z.ZodNativeEnum<typeof SearchResultType>>;
    category: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    query?: string;
    type?: SearchResultType;
    limit?: number;
    category?: string;
}, {
    query?: string;
    type?: SearchResultType;
    limit?: number;
    category?: string;
}>;
export declare const IndexEntityRequestSchema: z.ZodObject<{
    entity: z.ZodAny;
    type: z.ZodNativeEnum<typeof SearchResultType>;
    entityId: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    content: z.ZodString;
    tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    category: z.ZodOptional<z.ZodString>;
    subcategory: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type?: SearchResultType;
    metadata?: Record<string, any>;
    title?: string;
    tags?: string[];
    description?: string;
    content?: string;
    category?: string;
    entityId?: string;
    subcategory?: string;
    entity?: any;
}, {
    type?: SearchResultType;
    metadata?: Record<string, any>;
    title?: string;
    tags?: string[];
    description?: string;
    content?: string;
    category?: string;
    entityId?: string;
    subcategory?: string;
    entity?: any;
}>;
export declare const SearchResultResponseSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodNativeEnum<typeof SearchResultType>;
    entityId: z.ZodString;
    entityType: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    content: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    score: z.ZodNumber;
    relevance: z.ZodNumber;
    confidence: z.ZodNumber;
    category: z.ZodString;
    subcategory: z.ZodOptional<z.ZodString>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    entityData: z.ZodRecord<z.ZodString, z.ZodAny>;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    indexedAt: z.ZodString;
}, "strip", z.ZodTypeAny, {
    type?: SearchResultType;
    metadata?: Record<string, any>;
    title?: string;
    id?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    score?: number;
    content?: string;
    category?: string;
    entityType?: string;
    entityId?: string;
    subcategory?: string;
    confidence?: number;
    relevance?: number;
    entityData?: Record<string, any>;
    indexedAt?: string;
}, {
    type?: SearchResultType;
    metadata?: Record<string, any>;
    title?: string;
    id?: string;
    tags?: string[];
    createdAt?: string;
    updatedAt?: string;
    description?: string;
    score?: number;
    content?: string;
    category?: string;
    entityType?: string;
    entityId?: string;
    subcategory?: string;
    confidence?: number;
    relevance?: number;
    entityData?: Record<string, any>;
    indexedAt?: string;
}>;
export declare const SearchSuggestionResponseSchema: z.ZodObject<{
    text: z.ZodString;
    type: z.ZodNativeEnum<typeof SearchResultType>;
    category: z.ZodString;
    score: z.ZodNumber;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    type?: SearchResultType;
    metadata?: Record<string, any>;
    text?: string;
    score?: number;
    category?: string;
}, {
    type?: SearchResultType;
    metadata?: Record<string, any>;
    text?: string;
    score?: number;
    category?: string;
}>;
export declare const IntelligentSearchResponseSchema: z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodNativeEnum<typeof SearchResultType>;
        entityId: z.ZodString;
        entityType: z.ZodString;
        title: z.ZodString;
        description: z.ZodString;
        content: z.ZodString;
        tags: z.ZodArray<z.ZodString, "many">;
        score: z.ZodNumber;
        relevance: z.ZodNumber;
        confidence: z.ZodNumber;
        category: z.ZodString;
        subcategory: z.ZodOptional<z.ZodString>;
        metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
        entityData: z.ZodRecord<z.ZodString, z.ZodAny>;
        createdAt: z.ZodString;
        updatedAt: z.ZodString;
        indexedAt: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type?: SearchResultType;
        metadata?: Record<string, any>;
        title?: string;
        id?: string;
        tags?: string[];
        createdAt?: string;
        updatedAt?: string;
        description?: string;
        score?: number;
        content?: string;
        category?: string;
        entityType?: string;
        entityId?: string;
        subcategory?: string;
        confidence?: number;
        relevance?: number;
        entityData?: Record<string, any>;
        indexedAt?: string;
    }, {
        type?: SearchResultType;
        metadata?: Record<string, any>;
        title?: string;
        id?: string;
        tags?: string[];
        createdAt?: string;
        updatedAt?: string;
        description?: string;
        score?: number;
        content?: string;
        category?: string;
        entityType?: string;
        entityId?: string;
        subcategory?: string;
        confidence?: number;
        relevance?: number;
        entityData?: Record<string, any>;
        indexedAt?: string;
    }>, "many">;
    totalCount: z.ZodNumber;
    page: z.ZodNumber;
    limit: z.ZodNumber;
    totalPages: z.ZodNumber;
    executionTime: z.ZodNumber;
    suggestions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    filters: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodArray<z.ZodAny, "many">>>;
}, "strip", z.ZodTypeAny, {
    page?: number;
    limit?: number;
    filters?: Record<string, any[]>;
    results?: {
        type?: SearchResultType;
        metadata?: Record<string, any>;
        title?: string;
        id?: string;
        tags?: string[];
        createdAt?: string;
        updatedAt?: string;
        description?: string;
        score?: number;
        content?: string;
        category?: string;
        entityType?: string;
        entityId?: string;
        subcategory?: string;
        confidence?: number;
        relevance?: number;
        entityData?: Record<string, any>;
        indexedAt?: string;
    }[];
    executionTime?: number;
    totalCount?: number;
    totalPages?: number;
    suggestions?: string[];
}, {
    page?: number;
    limit?: number;
    filters?: Record<string, any[]>;
    results?: {
        type?: SearchResultType;
        metadata?: Record<string, any>;
        title?: string;
        id?: string;
        tags?: string[];
        createdAt?: string;
        updatedAt?: string;
        description?: string;
        score?: number;
        content?: string;
        category?: string;
        entityType?: string;
        entityId?: string;
        subcategory?: string;
        confidence?: number;
        relevance?: number;
        entityData?: Record<string, any>;
        indexedAt?: string;
    }[];
    executionTime?: number;
    totalCount?: number;
    totalPages?: number;
    suggestions?: string[];
}>;
export declare const GetSuggestionsResponseSchema: z.ZodObject<{
    suggestions: z.ZodArray<z.ZodObject<{
        text: z.ZodString;
        type: z.ZodNativeEnum<typeof SearchResultType>;
        category: z.ZodString;
        score: z.ZodNumber;
        metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    }, "strip", z.ZodTypeAny, {
        type?: SearchResultType;
        metadata?: Record<string, any>;
        text?: string;
        score?: number;
        category?: string;
    }, {
        type?: SearchResultType;
        metadata?: Record<string, any>;
        text?: string;
        score?: number;
        category?: string;
    }>, "many">;
    totalCount: z.ZodNumber;
    executionTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    executionTime?: number;
    totalCount?: number;
    suggestions?: {
        type?: SearchResultType;
        metadata?: Record<string, any>;
        text?: string;
        score?: number;
        category?: string;
    }[];
}, {
    executionTime?: number;
    totalCount?: number;
    suggestions?: {
        type?: SearchResultType;
        metadata?: Record<string, any>;
        text?: string;
        score?: number;
        category?: string;
    }[];
}>;
export declare const IndexEntityResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    indexedAt: z.ZodString;
    executionTime: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    success?: boolean;
    executionTime?: number;
    indexedAt?: string;
}, {
    success?: boolean;
    executionTime?: number;
    indexedAt?: string;
}>;
export type IntelligentSearchRequest = z.infer<typeof IntelligentSearchRequestSchema>;
export type GetSuggestionsRequest = z.infer<typeof GetSuggestionsRequestSchema>;
export type IndexEntityRequest = z.infer<typeof IndexEntityRequestSchema>;
export type SearchResultResponse = z.infer<typeof SearchResultResponseSchema>;
export type SearchSuggestionResponse = z.infer<typeof SearchSuggestionResponseSchema>;
export type IntelligentSearchResponse = z.infer<typeof IntelligentSearchResponseSchema>;
export type GetSuggestionsResponse = z.infer<typeof GetSuggestionsResponseSchema>;
export type IndexEntityResponse = z.infer<typeof IndexEntityResponseSchema>;
export declare class IntelligentSearchRequestDTO extends BaseDTOs<IntelligentSearchRequest> {
    constructor(data: IntelligentSearchRequest);
}
export declare class GetSuggestionsRequestDTO extends BaseDTOs<GetSuggestionsRequest> {
    constructor(data: GetSuggestionsRequest);
}
export declare class IndexEntityRequestDTO extends BaseDTOs<IndexEntityRequest> {
    constructor(data: IndexEntityRequest);
}
export declare class SearchResultResponseDTO extends BaseDTOs<SearchResultResponse> {
    constructor(data: SearchResultResponse);
}
export declare class SearchSuggestionResponseDTO extends BaseDTOs<SearchSuggestionResponse> {
    constructor(data: SearchSuggestionResponse);
}
export declare class IntelligentSearchResponseDTO extends BaseDTOs<IntelligentSearchResponse> {
    constructor(data: IntelligentSearchResponse);
}
export declare class GetSuggestionsResponseDTO extends BaseDTOs<GetSuggestionsResponse> {
    constructor(data: GetSuggestionsResponse);
}
export declare class IndexEntityResponseDTO extends BaseDTOs<IndexEntityResponse> {
    constructor(data: IndexEntityResponse);
}
//# sourceMappingURL=search.dto.d.ts.map