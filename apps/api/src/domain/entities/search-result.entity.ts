import { z } from 'zod';
import { BaseEntity } from './base.entity';

/**
 * Search Result Entity - Resultado de búsqueda inteligente
 * 
 * Representa un resultado de búsqueda con metadatos, scoring y contexto
 * para búsquedas semánticas y filtros avanzados.
 */
export interface SearchResult extends BaseEntity {
  // Identificación del resultado
  id: string;
  type: SearchResultType;
  entityId: string;
  entityType: string;
  
  // Contenido del resultado
  title: string;
  description: string;
  content: string;
  tags: string[];
  
  // Metadatos de búsqueda
  score: number;
  relevance: number;
  confidence: number;
  
  // Contexto y filtros
  category: string;
  subcategory?: string;
  metadata: Record<string, any>;
  
  // Información de la entidad original
  entityData: Record<string, any>;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  indexedAt: Date;
}

export enum SearchResultType {
  COMPANY = 'company',
  CONTACT = 'contact',
  DEAL = 'deal',
  PRODUCT = 'product',
  INVOICE = 'invoice',
  USER = 'user',
  DOCUMENT = 'document',
  INTERACTION = 'interaction'
}

/**
 * Search Query - Consulta de búsqueda inteligente
 */
export interface SearchQuery {
  // Términos de búsqueda
  query: string;
  filters?: SearchFilters;
  
  // Paginación
  page?: number;
  limit?: number;
  
  // Ordenamiento
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  
  // Configuración de búsqueda
  searchType?: SearchType;
  includeMetadata?: boolean;
  highlightMatches?: boolean;
}

export interface SearchFilters {
  // Filtros por tipo
  types?: SearchResultType[];
  
  // Filtros por categoría
  categories?: string[];
  subcategories?: string[];
  
  // Filtros por fechas
  dateFrom?: Date;
  dateTo?: Date;
  
  // Filtros por usuario/organización
  userId?: string;
  organizationId?: string;
  
  // Filtros por tags
  tags?: string[];
  
  // Filtros por score
  minScore?: number;
  minRelevance?: number;
  minConfidence?: number;
  
  // Filtros personalizados
  customFilters?: Record<string, any>;
}

export enum SearchType {
  SEMANTIC = 'semantic',
  FUZZY = 'fuzzy',
  EXACT = 'exact',
  WILDCARD = 'wildcard',
  REGEX = 'regex'
}

/**
 * Search Suggestions - Sugerencias de autocompletado
 */
export interface SearchSuggestion {
  text: string;
  type: SearchResultType;
  category: string;
  score: number;
  metadata?: Record<string, any>;
}

/**
 * Search Analytics - Análisis de búsquedas
 */
export interface SearchAnalytics {
  query: string;
  resultsCount: number;
  executionTime: number;
  filters: SearchFilters;
  userAgent?: string;
  userId?: string;
  timestamp: Date;
}

// Zod Schemas para validación
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

/**
 * Search Result Builder - Constructor de resultados de búsqueda
 */
export class SearchResultBuilder {
  private result: Partial<SearchResult> = {};

  static create(): SearchResultBuilder {
    return new SearchResultBuilder();
  }

  withId(id: string): SearchResultBuilder {
    this.result.id = id;
    return this;
  }

  withType(type: SearchResultType): SearchResultBuilder {
    this.result.type = type;
    return this;
  }

  withEntityId(entityId: string): SearchResultBuilder {
    this.result.entityId = entityId;
    return this;
  }

  withEntityType(entityType: string): SearchResultBuilder {
    this.result.entityType = entityType;
    return this;
  }

  withContent(title: string, description: string, content: string): SearchResultBuilder {
    this.result.title = title;
    this.result.description = description;
    this.result.content = content;
    return this;
  }

  withTags(tags: string[]): SearchResultBuilder {
    this.result.tags = tags;
    return this;
  }

  withScoring(score: number, relevance: number, confidence: number): SearchResultBuilder {
    this.result.score = score;
    this.result.relevance = relevance;
    this.result.confidence = confidence;
    return this;
  }

  withCategory(category: string, subcategory?: string): SearchResultBuilder {
    this.result.category = category;
    this.result.subcategory = subcategory;
    return this;
  }

  withMetadata(metadata: Record<string, any>): SearchResultBuilder {
    this.result.metadata = metadata;
    return this;
  }

  withEntityData(entityData: Record<string, any>): SearchResultBuilder {
    this.result.entityData = entityData;
    return this;
  }

  withTimestamps(createdAt: Date, updatedAt: Date, indexedAt: Date): SearchResultBuilder {
    this.result.createdAt = createdAt;
    this.result.updatedAt = updatedAt;
    this.result.indexedAt = indexedAt;
    return this;
  }

  build(): SearchResult {
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
