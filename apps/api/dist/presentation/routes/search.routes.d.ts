import { Router } from 'express';
import { SearchRepository } from '../../domain/repositories/search.repository.js';
export declare function createSearchRoutes(searchRepository: SearchRepository): Router;
export declare function createSearchRoutesWithConfig(searchRepository: SearchRepository, config?: {
    enableSemanticSearch?: boolean;
    enableFuzzySearch?: boolean;
    enableSuggestions?: boolean;
    enableIndexing?: boolean;
}): Router;
//# sourceMappingURL=search.routes.d.ts.map