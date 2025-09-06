import { Request, Response } from 'express';
import { BaseController } from './base.controller';
import { IntelligentSearchUseCase } from '../../application/use-cases/search/intelligent-search.use-case';
import { GetSuggestionsUseCase } from '../../application/use-cases/search/get-suggestions.use-case';
import { IndexEntityUseCase } from '../../application/use-cases/search/index-entity.use-case';
import {
  IntelligentSearchRequestDTO,
  GetSuggestionsRequestDTO,
  IndexEntityRequestDTO,
  IntelligentSearchResponseDTO,
  GetSuggestionsResponseDTO,
  IndexEntityResponseDTO
} from '../dto/search.dto';

/**
 * Search Controller - Controlador para búsqueda inteligente
 * 
 * Maneja las operaciones de búsqueda semántica, filtros avanzados,
 * autocompletado y indexación de entidades.
 */
export class SearchController extends BaseController {
  constructor(
    private intelligentSearchUseCase: IntelligentSearchUseCase,
    private getSuggestionsUseCase: GetSuggestionsUseCase,
    private indexEntityUseCase: IndexEntityUseCase
  ) {
    super();
  }

  /**
   * Búsqueda inteligente principal
   * POST /api/v1/search
   */
  async intelligentSearch(req: Request, res: Response): Promise<void> {
    try {
      const requestDTO = new IntelligentSearchRequestDTO(req.body);
      const validatedData = requestDTO.validate();

      const result = await this.intelligentSearchUseCase.execute(validatedData);
      const responseDTO = new IntelligentSearchResponseDTO(result);

      this.sendSuccess(res, responseDTO.getData(), 'Search completed successfully');
    } catch (error) {
      this.handleError(res, error, 'Failed to perform intelligent search');
    }
  }

  /**
   * Obtener sugerencias de autocompletado
   * GET /api/v1/search/suggestions
   */
  async getSuggestions(req: Request, res: Response): Promise<void> {
    try {
      const requestDTO = new GetSuggestionsRequestDTO({
        query: req.query.query as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        type: req.query.type as any,
        category: req.query.category as string
      });
      const validatedData = requestDTO.validate();

      const result = await this.getSuggestionsUseCase.execute(validatedData);
      const responseDTO = new GetSuggestionsResponseDTO(result);

      this.sendSuccess(res, responseDTO.getData(), 'Suggestions retrieved successfully');
    } catch (error) {
      this.handleError(res, error, 'Failed to get suggestions');
    }
  }

  /**
   * Indexar entidad para búsqueda
   * POST /api/v1/search/index
   */
  async indexEntity(req: Request, res: Response): Promise<void> {
    try {
      const requestDTO = new IndexEntityRequestDTO(req.body);
      const validatedData = requestDTO.validate();

      const result = await this.indexEntityUseCase.execute(validatedData);
      const responseDTO = new IndexEntityResponseDTO(result);

      this.sendSuccess(res, responseDTO.getData(), 'Entity indexed successfully');
    } catch (error) {
      this.handleError(res, error, 'Failed to index entity');
    }
  }

  /**
   * Búsqueda por tipo específico
   * GET /api/v1/search/:type
   */
  async searchByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const query = req.query.q as string;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;

      if (!query) {
        this.sendError(res, 'Query parameter is required', 400);
        return;
      }

      const requestDTO = new IntelligentSearchRequestDTO({
        query,
        filters: { types: [type as any] },
        page,
        limit
      });
      const validatedData = requestDTO.validate();

      const result = await this.intelligentSearchUseCase.execute(validatedData);
      const responseDTO = new IntelligentSearchResponseDTO(result);

      this.sendSuccess(res, responseDTO.getData(), `Search by type ${type} completed successfully`);
    } catch (error) {
      this.handleError(res, error, `Failed to search by type ${req.params.type}`);
    }
  }

  /**
   * Búsqueda semántica
   * POST /api/v1/search/semantic
   */
  async semanticSearch(req: Request, res: Response): Promise<void> {
    try {
      const requestDTO = new IntelligentSearchRequestDTO({
        ...req.body,
        searchType: 'semantic'
      });
      const validatedData = requestDTO.validate();

      const result = await this.intelligentSearchUseCase.execute(validatedData);
      const responseDTO = new IntelligentSearchResponseDTO(result);

      this.sendSuccess(res, responseDTO.getData(), 'Semantic search completed successfully');
    } catch (error) {
      this.handleError(res, error, 'Failed to perform semantic search');
    }
  }

  /**
   * Búsqueda difusa (fuzzy)
   * POST /api/v1/search/fuzzy
   */
  async fuzzySearch(req: Request, res: Response): Promise<void> {
    try {
      const requestDTO = new IntelligentSearchRequestDTO({
        ...req.body,
        searchType: 'fuzzy'
      });
      const validatedData = requestDTO.validate();

      const result = await this.intelligentSearchUseCase.execute(validatedData);
      const responseDTO = new IntelligentSearchResponseDTO(result);

      this.sendSuccess(res, responseDTO.getData(), 'Fuzzy search completed successfully');
    } catch (error) {
      this.handleError(res, error, 'Failed to perform fuzzy search');
    }
  }

  /**
   * Obtener filtros disponibles
   * GET /api/v1/search/filters
   */
  async getAvailableFilters(req: Request, res: Response): Promise<void> {
    try {
      // Esta funcionalidad se implementaría en el repository
      const filters = {
        types: ['company', 'contact', 'deal', 'product', 'invoice', 'user', 'document', 'interaction'],
        categories: ['business', 'personal', 'financial', 'technical', 'marketing'],
        tags: ['urgent', 'important', 'follow-up', 'completed', 'pending']
      };

      this.sendSuccess(res, filters, 'Available filters retrieved successfully');
    } catch (error) {
      this.handleError(res, error, 'Failed to get available filters');
    }
  }

  /**
   * Obtener búsquedas populares
   * GET /api/v1/search/popular
   */
  async getPopularSearches(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      // Esta funcionalidad se implementaría en el repository
      const popularSearches = [
        'companies',
        'contacts',
        'deals',
        'products',
        'invoices',
        'reports',
        'analytics',
        'dashboard'
      ].slice(0, limit);

      this.sendSuccess(res, { searches: popularSearches }, 'Popular searches retrieved successfully');
    } catch (error) {
      this.handleError(res, error, 'Failed to get popular searches');
    }
  }
}
