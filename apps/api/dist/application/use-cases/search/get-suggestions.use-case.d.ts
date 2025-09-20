import { UseCase } from '../base.use-case.js';
import { SearchRepository } from '../../../domain/repositories/search.repository.js';
import { SearchSuggestion } from '../../../domain/entities/search-result.entity.js';
export interface GetSuggestionsRequest {
    query: string;
    limit?: number;
    type?: string;
    category?: string;
}
export interface GetSuggestionsResponse {
    suggestions: SearchSuggestion[];
    totalCount: number;
    executionTime: number;
}
export declare class GetSuggestionsUseCase implements UseCase<GetSuggestionsRequest, GetSuggestionsResponse> {
    private searchRepository;
    constructor(searchRepository: SearchRepository);
    execute(request: GetSuggestionsRequest): Promise<GetSuggestionsResponse>;
}
//# sourceMappingURL=get-suggestions.use-case.d.ts.map