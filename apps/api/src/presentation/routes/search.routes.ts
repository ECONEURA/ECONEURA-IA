import { Router } from 'express';
import { SearchController } from '../controllers/search.controller.js';
import { IntelligentSearchUseCase } from '../../application/use-cases/search/intelligent-search.use-case.js';
import { GetSuggestionsUseCase } from '../../application/use-cases/search/get-suggestions.use-case.js';
import { IndexEntityUseCase } from '../../application/use-cases/search/index-entity.use-case.js';
import { SearchRepository } from '../../domain/repositories/search.repository.js';
import { authMiddleware } from '../middleware/auth.js';
import { validationMiddleware } from '../middleware/validation.middleware.js';
import { IntelligentSearchRequestSchema, GetSuggestionsRequestSchema, IndexEntityRequestSchema } from '../dto/search.dto.js';

/**
 * Search Routes - Rutas para búsqueda inteligente
 * 
 * Define los endpoints para búsqueda semántica, filtros avanzados,
 * autocompletado y indexación de entidades.
 */
export function createSearchRoutes(searchRepository: SearchRepository): Router {
  const router = Router();
  
  // Inicializar casos de uso
  const intelligentSearchUseCase = new IntelligentSearchUseCase(searchRepository);
  const getSuggestionsUseCase = new GetSuggestionsUseCase(searchRepository);
  const indexEntityUseCase = new IndexEntityUseCase(searchRepository);
  
  // Inicializar controlador
  const searchController = new SearchController(
    intelligentSearchUseCase,
    getSuggestionsUseCase,
    indexEntityUseCase
  );

  // Middleware de autenticación para todas las rutas
  router.use(authMiddleware);

  // ===== BÚSQUEDA PRINCIPAL =====
  
  /**
   * POST /api/v1/search
   * Búsqueda inteligente principal
   */
  router.post(
    '/',
    validationMiddleware(IntelligentSearchRequestSchema),
    searchController.intelligentSearch.bind(searchController)
  );

  /**
   * GET /api/v1/search/suggestions
   * Obtener sugerencias de autocompletado
   */
  router.get(
    '/suggestions',
    validationMiddleware(GetSuggestionsRequestSchema, 'query'),
    searchController.getSuggestions.bind(searchController)
  );

  /**
   * POST /api/v1/search/index
   * Indexar entidad para búsqueda
   */
  router.post(
    '/index',
    validationMiddleware(IndexEntityRequestSchema),
    searchController.indexEntity.bind(searchController)
  );

  // ===== BÚSQUEDA POR TIPO =====
  
  /**
   * GET /api/v1/search/:type
   * Búsqueda por tipo específico
   */
  router.get(
    '/:type',
    searchController.searchByType.bind(searchController)
  );

  // ===== BÚSQUEDA ESPECIALIZADA =====
  
  /**
   * POST /api/v1/search/semantic
   * Búsqueda semántica
   */
  router.post(
    '/semantic',
    validationMiddleware(IntelligentSearchRequestSchema),
    searchController.semanticSearch.bind(searchController)
  );

  /**
   * POST /api/v1/search/fuzzy
   * Búsqueda difusa (fuzzy)
   */
  router.post(
    '/fuzzy',
    validationMiddleware(IntelligentSearchRequestSchema),
    searchController.fuzzySearch.bind(searchController)
  );

  // ===== FILTROS Y METADATOS =====
  
  /**
   * GET /api/v1/search/filters
   * Obtener filtros disponibles
   */
  router.get(
    '/filters',
    searchController.getAvailableFilters.bind(searchController)
  );

  /**
   * GET /api/v1/search/popular
   * Obtener búsquedas populares
   */
  router.get(
    '/popular',
    searchController.getPopularSearches.bind(searchController)
  );

  // ===== RUTAS DE ADMINISTRACIÓN =====
  
  /**
   * POST /api/v1/search/reindex
   * Reindexar todas las entidades
   */
  router.post(
    '/reindex',
    searchController.reindexAll.bind(searchController)
  );

  /**
   * DELETE /api/v1/search/index/:type/:id
   * Eliminar entidad del índice
   */
  router.delete(
    '/index/:type/:id',
    searchController.removeFromIndex.bind(searchController)
  );

  return router;
}

/**
 * Función auxiliar para crear rutas de búsqueda con configuración personalizada
 */
export function createSearchRoutesWithConfig(
  searchRepository: SearchRepository,
  config?: {
    enableSemanticSearch?: boolean;
    enableFuzzySearch?: boolean;
    enableSuggestions?: boolean;
    enableIndexing?: boolean;
  }
): Router {
  const router = createSearchRoutes(searchRepository);
  
  // Aplicar configuración personalizada
  if (config) {
    if (!config.enableSemanticSearch) {
      router.delete('/semantic', (req, res) => {
        res.status(404).json({ error: 'Semantic search not enabled' });
      });
    }
    
    if (!config.enableFuzzySearch) {
      router.delete('/fuzzy', (req, res) => {
        res.status(404).json({ error: 'Fuzzy search not enabled' });
      });
    }
    
    if (!config.enableSuggestions) {
      router.delete('/suggestions', (req, res) => {
        res.status(404).json({ error: 'Suggestions not enabled' });
      });
    }
    
    if (!config.enableIndexing) {
      router.delete('/index', (req, res) => {
        res.status(404).json({ error: 'Indexing not enabled' });
      });
    }
  }
  
  return router;
}
