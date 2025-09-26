import { IntelligentSearchRequestDTO, GetSuggestionsRequestDTO, IndexEntityRequestDTO, IntelligentSearchResponseDTO, GetSuggestionsResponseDTO, IndexEntityResponseDTO } from '../dto/search.dto.js';

import { BaseController } from './base.controller.js';
export class SearchController extends BaseController {
    intelligentSearchUseCase;
    getSuggestionsUseCase;
    indexEntityUseCase;
    constructor(intelligentSearchUseCase, getSuggestionsUseCase, indexEntityUseCase) {
        super();
        this.intelligentSearchUseCase = intelligentSearchUseCase;
        this.getSuggestionsUseCase = getSuggestionsUseCase;
        this.indexEntityUseCase = indexEntityUseCase;
    }
    async intelligentSearch(req, res) {
        try {
            const requestDTO = new IntelligentSearchRequestDTO(req.body);
            const validatedData = requestDTO.validate();
            const result = await this.intelligentSearchUseCase.execute(validatedData);
            const responseDTO = new IntelligentSearchResponseDTO(result);
            this.sendSuccess(res, responseDTO.getData(), 'Search completed successfully');
        }
        catch (error) {
            this.handleError(res, error, 'Failed to perform intelligent search');
        }
    }
    async getSuggestions(req, res) {
        try {
            const requestDTO = new GetSuggestionsRequestDTO({
                query: req.query.query,
                limit: req.query.limit ? parseInt(req.query.limit) : undefined,
                type: req.query.type,
                category: req.query.category
            });
            const validatedData = requestDTO.validate();
            const result = await this.getSuggestionsUseCase.execute(validatedData);
            const responseDTO = new GetSuggestionsResponseDTO(result);
            this.sendSuccess(res, responseDTO.getData(), 'Suggestions retrieved successfully');
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get suggestions');
        }
    }
    async indexEntity(req, res) {
        try {
            const requestDTO = new IndexEntityRequestDTO(req.body);
            const validatedData = requestDTO.validate();
            const result = await this.indexEntityUseCase.execute(validatedData);
            const responseDTO = new IndexEntityResponseDTO(result);
            this.sendSuccess(res, responseDTO.getData(), 'Entity indexed successfully');
        }
        catch (error) {
            this.handleError(res, error, 'Failed to index entity');
        }
    }
    async searchByType(req, res) {
        try {
            const { type } = req.params;
            const query = req.query.q;
            const page = req.query.page ? parseInt(req.query.page) : 1;
            const limit = req.query.limit ? parseInt(req.query.limit) : 20;
            if (!query) {
                this.sendError(res, 'Query parameter is required', 400);
                return;
            }
            const requestDTO = new IntelligentSearchRequestDTO({
                query,
                filters: { types: [type] },
                page,
                limit
            });
            const validatedData = requestDTO.validate();
            const result = await this.intelligentSearchUseCase.execute(validatedData);
            const responseDTO = new IntelligentSearchResponseDTO(result);
            this.sendSuccess(res, responseDTO.getData(), `Search by type ${type} completed successfully`);
        }
        catch (error) {
            this.handleError(res, error, `Failed to search by type ${req.params.type}`);
        }
    }
    async semanticSearch(req, res) {
        try {
            const requestDTO = new IntelligentSearchRequestDTO({
                ...req.body,
                searchType: 'semantic'
            });
            const validatedData = requestDTO.validate();
            const result = await this.intelligentSearchUseCase.execute(validatedData);
            const responseDTO = new IntelligentSearchResponseDTO(result);
            this.sendSuccess(res, responseDTO.getData(), 'Semantic search completed successfully');
        }
        catch (error) {
            this.handleError(res, error, 'Failed to perform semantic search');
        }
    }
    async fuzzySearch(req, res) {
        try {
            const requestDTO = new IntelligentSearchRequestDTO({
                ...req.body,
                searchType: 'fuzzy'
            });
            const validatedData = requestDTO.validate();
            const result = await this.intelligentSearchUseCase.execute(validatedData);
            const responseDTO = new IntelligentSearchResponseDTO(result);
            this.sendSuccess(res, responseDTO.getData(), 'Fuzzy search completed successfully');
        }
        catch (error) {
            this.handleError(res, error, 'Failed to perform fuzzy search');
        }
    }
    async getAvailableFilters(req, res) {
        try {
            const filters = {
                types: ['company', 'contact', 'deal', 'product', 'invoice', 'user', 'document', 'interaction'],
                categories: ['business', 'personal', 'financial', 'technical', 'marketing'],
                tags: ['urgent', 'important', 'follow-up', 'completed', 'pending']
            };
            this.sendSuccess(res, filters, 'Available filters retrieved successfully');
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get available filters');
        }
    }
    async getPopularSearches(req, res) {
        try {
            const limit = req.query.limit ? parseInt(req.query.limit) : 10;
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
        }
        catch (error) {
            this.handleError(res, error, 'Failed to get popular searches');
        }
    }
}
//# sourceMappingURL=search.controller.js.map