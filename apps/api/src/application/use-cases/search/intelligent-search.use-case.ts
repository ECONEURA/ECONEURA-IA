import { UseCase } from '../base.use-case';
import { SearchRepository } from '../../../domain/repositories/search.repository';
import { SearchResult, SearchQuery, SearchFilters, SearchType } from '../../../domain/entities/search-result.entity';

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

export class IntelligentSearchUseCase implements UseCase<IntelligentSearchRequest, IntelligentSearchResponse> {
  constructor(private searchRepository: SearchRepository) {}

  async execute(request: IntelligentSearchRequest): Promise<IntelligentSearchResponse> {
    const startTime = Date.now();

    // Validar query
    if (!request.query || request.query.trim().length === 0) {
      throw new Error('Query is required');
    }

    // Configurar búsqueda
    const searchQuery: SearchQuery = {
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

    // Ejecutar búsqueda
    const results = await this.searchRepository.search(searchQuery);

    // Obtener sugerencias si hay pocos resultados
    let suggestions: string[] = [];
    if (results.length < 5) {
      const searchSuggestions = await this.searchRepository.getSuggestions(request.query, 5);
      suggestions = searchSuggestions.map(s => s.text);
    }

    // Obtener filtros disponibles
    const availableFilters = await this.searchRepository.getAvailableFilters();

    const executionTime = Date.now() - startTime;
    const totalPages = Math.ceil(results.length / searchQuery.limit!);

    return {
      results,
      totalCount: results.length,
      page: searchQuery.page!,
      limit: searchQuery.limit!,
      totalPages,
      executionTime,
      suggestions: suggestions.length > 0 ? suggestions : undefined,
      filters: availableFilters
    };
  }
}
