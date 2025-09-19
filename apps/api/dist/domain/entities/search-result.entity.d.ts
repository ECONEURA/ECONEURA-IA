import { z } from 'zod';
import { BaseEntity } from './base.entity.js';
export interface SearchResult extends BaseEntity {
    id: string;
    type: SearchResultType;
    entityId: string;
    entityType: string;
    title: string;
    description: string;
    content: string;
    tags: string[];
    score: number;
    relevance: number;
    confidence: number;
    category: string;
    subcategory?: string;
    metadata: Record<string, any>;
    entityData: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    indexedAt: Date;
}
export declare enum SearchResultType {
    COMPANY = "company",
    CONTACT = "contact",
    DEAL = "deal",
    PRODUCT = "product",
    INVOICE = "invoice",
    USER = "user",
    DOCUMENT = "document",
    INTERACTION = "interaction"
}
export interface SearchQuery {
    query: string;
    filters?: SearchFilters;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    searchType?: SearchType;
    includeMetadata?: boolean;
    highlightMatches?: boolean;
}
export interface SearchFilters {
    types?: SearchResultType[];
    categories?: string[];
    subcategories?: string[];
    dateFrom?: Date;
    dateTo?: Date;
    userId?: string;
    organizationId?: string;
    tags?: string[];
    minScore?: number;
    minRelevance?: number;
    minConfidence?: number;
    customFilters?: Record<string, any>;
}
export declare enum SearchType {
    SEMANTIC = "semantic",
    FUZZY = "fuzzy",
    EXACT = "exact",
    WILDCARD = "wildcard",
    REGEX = "regex"
}
export interface SearchSuggestion {
    text: string;
    type: SearchResultType;
    category: string;
    score: number;
    metadata?: Record<string, any>;
}
export interface SearchAnalytics {
    query: string;
    resultsCount: number;
    executionTime: number;
    filters: SearchFilters;
    userAgent?: string;
    userId?: string;
    timestamp: Date;
}
export declare const SearchResultTypeSchema: z.ZodNativeEnum<typeof SearchResultType>;
export declare const SearchFiltersSchema: z.ZodObject<{
    types: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof SearchResultType>, "many">>;
    categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    subcategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    dateFrom: z.ZodOptional<z.ZodDate>;
    dateTo: z.ZodOptional<z.ZodDate>;
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
    dateFrom?: Date;
    dateTo?: Date;
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
    dateFrom?: Date;
    dateTo?: Date;
    minScore?: number;
    minRelevance?: number;
    minConfidence?: number;
    customFilters?: Record<string, any>;
}>;
export declare const SearchQuerySchema: z.ZodObject<{
    query: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        types: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof SearchResultType>, "many">>;
        categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        subcategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dateFrom: z.ZodOptional<z.ZodDate>;
        dateTo: z.ZodOptional<z.ZodDate>;
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
        dateFrom?: Date;
        dateTo?: Date;
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
        dateFrom?: Date;
        dateTo?: Date;
        minScore?: number;
        minRelevance?: number;
        minConfidence?: number;
        customFilters?: Record<string, any>;
    }>>;
    page: z.ZodOptional<z.ZodNumber>;
    limit: z.ZodOptional<z.ZodNumber>;
    sortBy: z.ZodOptional<z.ZodString>;
    sortOrder: z.ZodOptional<z.ZodEnum<["asc", "desc"]>>;
    searchType: z.ZodOptional<z.ZodNativeEnum<typeof SearchType>>;
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
        dateFrom?: Date;
        dateTo?: Date;
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
        dateFrom?: Date;
        dateTo?: Date;
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
export declare const SearchSuggestionSchema: z.ZodObject<{
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
export declare const SearchAnalyticsSchema: z.ZodObject<{
    query: z.ZodString;
    resultsCount: z.ZodNumber;
    executionTime: z.ZodNumber;
    filters: z.ZodObject<{
        types: z.ZodOptional<z.ZodArray<z.ZodNativeEnum<typeof SearchResultType>, "many">>;
        categories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        subcategories: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        dateFrom: z.ZodOptional<z.ZodDate>;
        dateTo: z.ZodOptional<z.ZodDate>;
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
        dateFrom?: Date;
        dateTo?: Date;
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
        dateFrom?: Date;
        dateTo?: Date;
        minScore?: number;
        minRelevance?: number;
        minConfidence?: number;
        customFilters?: Record<string, any>;
    }>;
    userAgent: z.ZodOptional<z.ZodString>;
    userId: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    query?: string;
    userId?: string;
    timestamp?: Date;
    filters?: {
        userId?: string;
        organizationId?: string;
        tags?: string[];
        categories?: string[];
        types?: SearchResultType[];
        subcategories?: string[];
        dateFrom?: Date;
        dateTo?: Date;
        minScore?: number;
        minRelevance?: number;
        minConfidence?: number;
        customFilters?: Record<string, any>;
    };
    userAgent?: string;
    resultsCount?: number;
    executionTime?: number;
}, {
    query?: string;
    userId?: string;
    timestamp?: Date;
    filters?: {
        userId?: string;
        organizationId?: string;
        tags?: string[];
        categories?: string[];
        types?: SearchResultType[];
        subcategories?: string[];
        dateFrom?: Date;
        dateTo?: Date;
        minScore?: number;
        minRelevance?: number;
        minConfidence?: number;
        customFilters?: Record<string, any>;
    };
    userAgent?: string;
    resultsCount?: number;
    executionTime?: number;
}>;
export declare class SearchResultBuilder {
    private result;
    static create(): SearchResultBuilder;
    withId(id: string): SearchResultBuilder;
    withType(type: SearchResultType): SearchResultBuilder;
    withEntityId(entityId: string): SearchResultBuilder;
    withEntityType(entityType: string): SearchResultBuilder;
    withContent(title: string, description: string, content: string): SearchResultBuilder;
    withTags(tags: string[]): SearchResultBuilder;
    withScoring(score: number, relevance: number, confidence: number): SearchResultBuilder;
    withCategory(category: string, subcategory?: string): SearchResultBuilder;
    withMetadata(metadata: Record<string, any>): SearchResultBuilder;
    withEntityData(entityData: Record<string, any>): SearchResultBuilder;
    withTimestamps(createdAt: Date, updatedAt: Date, indexedAt: Date): SearchResultBuilder;
    build(): SearchResult;
}
//# sourceMappingURL=search-result.entity.d.ts.map