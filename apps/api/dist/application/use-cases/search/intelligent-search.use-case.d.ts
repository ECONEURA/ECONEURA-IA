import { UseCase } from '../base.use-case.js';
import { SearchRepository } from '../../../domain/repositories/search.repository.js';
import { SearchResult, SearchFilters, SearchType } from '../../../domain/entities/search-result.entity.js';
export interface IntelligentSearchRequest {
    query: string;
    filters?: SearchFilters;
    searchType?: SearchType;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeMetadata?: boolean;
    highlightMatches?: boolean;
}
export interface IntelligentSearchResponse {
    results: SearchResult[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    executionTime: number;
    suggestions?: string[];
    filters?: Record<string, any[]>;
}
export declare class IntelligentSearchUseCase implements UseCase<IntelligentSearchRequest, IntelligentSearchResponse> {
    private searchRepository;
    constructor(searchRepository: SearchRepository);
    execute(request: IntelligentSearchRequest): Promise<IntelligentSearchResponse>;
}
//# sourceMappingURL=intelligent-search.use-case.d.ts.map