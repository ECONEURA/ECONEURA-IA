export class GetSuggestionsUseCase {
    searchRepository;
    constructor(searchRepository) {
        this.searchRepository = searchRepository;
    }
    async execute(request) {
        const startTime = Date.now();
        if (!request.query || request.query.trim().length === 0) {
            return {
                suggestions: [],
                totalCount: 0,
                executionTime: Date.now() - startTime
            };
        }
        const suggestions = await this.searchRepository.getSuggestions(request.query.trim(), request.limit || 10);
        let filteredSuggestions = suggestions;
        if (request.type) {
            filteredSuggestions = suggestions.filter(s => s.type === request.type);
        }
        if (request.category) {
            filteredSuggestions = filteredSuggestions.filter(s => s.category === request.category);
        }
        const executionTime = Date.now() - startTime;
        return {
            suggestions: filteredSuggestions,
            totalCount: filteredSuggestions.length,
            executionTime
        };
    }
}
//# sourceMappingURL=get-suggestions.use-case.js.map