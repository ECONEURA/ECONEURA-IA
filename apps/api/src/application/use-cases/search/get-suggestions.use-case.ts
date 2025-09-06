import { UseCase } from '../base.use-case';
import { SearchRepository } from '../../../domain/repositories/search.repository';
import { SearchSuggestion } from '../../../domain/entities/search-result.entity';

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

export class GetSuggestionsUseCase implements UseCase<GetSuggestionsRequest, GetSuggestionsResponse> {
  constructor(private searchRepository: SearchRepository) {}

  async execute(request: GetSuggestionsRequest): Promise<GetSuggestionsResponse> {
    const startTime = Date.now();
    
    // Validar query
    if (!request.query || request.query.trim().length === 0) {
      return {
        suggestions: [],
        totalCount: 0,
        executionTime: Date.now() - startTime
      };
    }

    // Obtener sugerencias
    const suggestions = await this.searchRepository.getSuggestions(
      request.query.trim(),
      request.limit || 10
    );

    // Filtrar por tipo si se especifica
    let filteredSuggestions = suggestions;
    if (request.type) {
      filteredSuggestions = suggestions.filter(s => s.type === request.type);
    }

    // Filtrar por categoría si se especifica
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
