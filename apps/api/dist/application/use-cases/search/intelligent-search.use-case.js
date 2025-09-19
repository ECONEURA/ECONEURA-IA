import { SearchType } from '../../../domain/entities/search-result.entity.js';
export class IntelligentSearchUseCase {
    searchRepository;
    constructor(searchRepository) {
        this.searchRepository = searchRepository;
    }
    async execute(request) {
        const startTime = Date.now();
        if (!request.query || request.query.trim().length === 0) {
            throw new Error('Query is required');
        }
        const searchQuery = {
            query: request.query.trim(),
            filters: request.filters,
            page: request.page || 1,
            limit: request.limit || 20,
            sortBy: request.sortBy,
            sortOrder: request.sortOrder || 'desc',
            searchType: request.searchType || SearchType.SEMANTIC,
            includeMetadata: request.includeMetadata || false,
            highlightMatches: request.highlightMatches || true
        };
        const results = await this.searchRepository.search(searchQuery);
        let suggestions = [];
        if (results.length < 5) {
            const searchSuggestions = await this.searchRepository.getSuggestions(request.query, 5);
            suggestions = searchSuggestions.map(s => s.text);
        }
        const availableFilters = await this.searchRepository.getAvailableFilters();
        const executionTime = Date.now() - startTime;
        const totalPages = Math.ceil(results.length / searchQuery.limit);
        return {
            results,
            totalCount: results.length,
            page: searchQuery.page,
            limit: searchQuery.limit,
            totalPages,
            executionTime,
            suggestions: suggestions.length > 0 ? suggestions : undefined,
            filters: availableFilters
        };
    }
}
//# sourceMappingURL=intelligent-search.use-case.js.map