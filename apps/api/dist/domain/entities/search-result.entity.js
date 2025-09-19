import { z } from 'zod';
export var SearchResultType;
(function (SearchResultType) {
    SearchResultType["COMPANY"] = "company";
    SearchResultType["CONTACT"] = "contact";
    SearchResultType["DEAL"] = "deal";
    SearchResultType["PRODUCT"] = "product";
    SearchResultType["INVOICE"] = "invoice";
    SearchResultType["USER"] = "user";
    SearchResultType["DOCUMENT"] = "document";
    SearchResultType["INTERACTION"] = "interaction";
})(SearchResultType || (SearchResultType = {}));
export var SearchType;
(function (SearchType) {
    SearchType["SEMANTIC"] = "semantic";
    SearchType["FUZZY"] = "fuzzy";
    SearchType["EXACT"] = "exact";
    SearchType["WILDCARD"] = "wildcard";
    SearchType["REGEX"] = "regex";
})(SearchType || (SearchType = {}));
export const SearchResultTypeSchema = z.nativeEnum(SearchResultType);
export const SearchFiltersSchema = z.object({
    types: z.array(SearchResultTypeSchema).optional(),
    categories: z.array(z.string()).optional(),
    subcategories: z.array(z.string()).optional(),
    dateFrom: z.date().optional(),
    dateTo: z.date().optional(),
    userId: z.string().uuid().optional(),
    organizationId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    minScore: z.number().min(0).max(1).optional(),
    minRelevance: z.number().min(0).max(1).optional(),
    minConfidence: z.number().min(0).max(1).optional(),
    customFilters: z.record(z.any()).optional()
});
export const SearchQuerySchema = z.object({
    query: z.string().min(1).max(500),
    filters: SearchFiltersSchema.optional(),
    page: z.number().int().min(1).optional(),
    limit: z.number().int().min(1).max(100).optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    searchType: z.nativeEnum(SearchType).optional(),
    includeMetadata: z.boolean().optional(),
    highlightMatches: z.boolean().optional()
});
export const SearchSuggestionSchema = z.object({
    text: z.string(),
    type: SearchResultTypeSchema,
    category: z.string(),
    score: z.number().min(0).max(1),
    metadata: z.record(z.any()).optional()
});
export const SearchAnalyticsSchema = z.object({
    query: z.string(),
    resultsCount: z.number().int().min(0),
    executionTime: z.number().min(0),
    filters: SearchFiltersSchema,
    userAgent: z.string().optional(),
    userId: z.string().uuid().optional(),
    timestamp: z.date()
});
export class SearchResultBuilder {
    result = {};
    static create() {
        return new SearchResultBuilder();
    }
    withId(id) {
        this.result.id = id;
        return this;
    }
    withType(type) {
        this.result.type = type;
        return this;
    }
    withEntityId(entityId) {
        this.result.entityId = entityId;
        return this;
    }
    withEntityType(entityType) {
        this.result.entityType = entityType;
        return this;
    }
    withContent(title, description, content) {
        this.result.title = title;
        this.result.description = description;
        this.result.content = content;
        return this;
    }
    withTags(tags) {
        this.result.tags = tags;
        return this;
    }
    withScoring(score, relevance, confidence) {
        this.result.score = score;
        this.result.relevance = relevance;
        this.result.confidence = confidence;
        return this;
    }
    withCategory(category, subcategory) {
        this.result.category = category;
        this.result.subcategory = subcategory;
        return this;
    }
    withMetadata(metadata) {
        this.result.metadata = metadata;
        return this;
    }
    withEntityData(entityData) {
        this.result.entityData = entityData;
        return this;
    }
    withTimestamps(createdAt, updatedAt, indexedAt) {
        this.result.createdAt = createdAt;
        this.result.updatedAt = updatedAt;
        this.result.indexedAt = indexedAt;
        return this;
    }
    build() {
        if (!this.result.id || !this.result.type || !this.result.entityId) {
            throw new Error('SearchResult requires id, type, and entityId');
        }
        return {
            id: this.result.id,
            type: this.result.type,
            entityId: this.result.entityId,
            entityType: this.result.entityType || this.result.type,
            title: this.result.title || '',
            description: this.result.description || '',
            content: this.result.content || '',
            tags: this.result.tags || [],
            score: this.result.score || 0,
            relevance: this.result.relevance || 0,
            confidence: this.result.confidence || 0,
            category: this.result.category || 'general',
            subcategory: this.result.subcategory,
            metadata: this.result.metadata || {},
            entityData: this.result.entityData || {},
            createdAt: this.result.createdAt || new Date(),
            updatedAt: this.result.updatedAt || new Date(),
            indexedAt: this.result.indexedAt || new Date()
        };
    }
}
//# sourceMappingURL=search-result.entity.js.map