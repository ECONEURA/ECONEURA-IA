import { Router } from 'express';

import { SearchController } from '../controllers/search.controller.js';
import { IntelligentSearchUseCase } from '../../application/use-cases/search/intelligent-search.use-case.js';
import { GetSuggestionsUseCase } from '../../application/use-cases/search/get-suggestions.use-case.js';
import { IndexEntityUseCase } from '../../application/use-cases/search/index-entity.use-case.js';
import { authMiddleware } from '../middleware/auth.js';
import { validationMiddleware } from '../middleware/validation.middleware.js';
import { IntelligentSearchRequestSchema, GetSuggestionsRequestSchema, IndexEntityRequestSchema } from '../dto/search.dto.js';
export function createSearchRoutes(searchRepository) {
    const router = Router();
    const intelligentSearchUseCase = new IntelligentSearchUseCase(searchRepository);
    const getSuggestionsUseCase = new GetSuggestionsUseCase(searchRepository);
    const indexEntityUseCase = new IndexEntityUseCase(searchRepository);
    const searchController = new SearchController(intelligentSearchUseCase, getSuggestionsUseCase, indexEntityUseCase);
    router.use(authMiddleware);
    router.post('/', validationMiddleware(IntelligentSearchRequestSchema), searchController.intelligentSearch.bind(searchController));
    router.get('/suggestions', validationMiddleware(GetSuggestionsRequestSchema, 'query'), searchController.getSuggestions.bind(searchController));
    router.post('/index', validationMiddleware(IndexEntityRequestSchema), searchController.indexEntity.bind(searchController));
    router.get('/:type', searchController.searchByType.bind(searchController));
    router.post('/semantic', validationMiddleware(IntelligentSearchRequestSchema), searchController.semanticSearch.bind(searchController));
    router.post('/fuzzy', validationMiddleware(IntelligentSearchRequestSchema), searchController.fuzzySearch.bind(searchController));
    router.get('/filters', searchController.getAvailableFilters.bind(searchController));
    router.get('/popular', searchController.getPopularSearches.bind(searchController));
    router.post('/reindex', searchController.reindexAll.bind(searchController));
    router.delete('/index/:type/:id', searchController.removeFromIndex.bind(searchController));
    return router;
}
export function createSearchRoutesWithConfig(searchRepository, config) {
    const router = createSearchRoutes(searchRepository);
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
//# sourceMappingURL=search.routes.js.map