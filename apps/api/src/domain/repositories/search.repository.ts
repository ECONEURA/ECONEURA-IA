import { BaseRepository } from './base.repository.js';
import { SearchResult, SearchQuery, SearchFilters, SearchSuggestion, SearchAnalytics } from '../entities/search-result.entity.js';

/**
 * Search Repository Interface
 * 
 * Define los contratos para operaciones de búsqueda inteligente,
 * incluyendo búsqueda semántica, filtros avanzados y autocompletado.
 */
export interface SearchRepository extends BaseRepository<SearchResult> {
  // Búsqueda principal
  search(query: SearchQuery): Promise<SearchResult[]>;
  searchByType(type: string, query: string, filters?: SearchFilters): Promise<SearchResult[]>;
  
  // Búsqueda semántica
  semanticSearch(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
  fuzzySearch(query: string, filters?: SearchFilters): Promise<SearchResult[]>;
  
  // Autocompletado y sugerencias
  getSuggestions(query: string, limit?: number): Promise<SearchSuggestion[]>;
  getPopularSearches(limit?: number): Promise<string[]>;
  
  // Filtros y categorías
  getAvailableFilters(): Promise<Record<string, any[]>>;
  getCategories(): Promise<string[]>;
  getTags(): Promise<string[]>;
  
  // Indexación
  indexEntity(entity: any, type: string): Promise<void>;
  reindexAll(): Promise<void>;
  removeFromIndex(entityId: string, type: string): Promise<void>;
  
  // Analytics
  trackSearch(analytics: SearchAnalytics): Promise<void>;
  getSearchAnalytics(dateFrom?: Date, dateTo?: Date): Promise<SearchAnalytics[]>;
  
  // Configuración
  updateSearchConfig(config: SearchConfig): Promise<void>;
  getSearchConfig(): Promise<SearchConfig>;
}

export interface SearchConfig {
  // Configuración de búsqueda
  defaultSearchType: string;
  maxResults: number;
  enableSemanticSearch: boolean;
  enableFuzzySearch: boolean;
  
  // Configuración de scoring
  scoreWeights: {
    title: number;
    description: number;
    content: number;
    tags: number;
    metadata: number;
  };
  
  // Configuración de filtros
  enableFilters: boolean;
  maxFilters: number;
  
  // Configuración de autocompletado
  enableSuggestions: boolean;
  maxSuggestions: number;
  suggestionThreshold: number;
}
