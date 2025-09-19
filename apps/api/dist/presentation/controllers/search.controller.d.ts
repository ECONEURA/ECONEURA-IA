import { Request, Response } from 'express';
import { BaseController } from './base.controller.js';
import { IntelligentSearchUseCase } from '../../application/use-cases/search/intelligent-search.use-case.js';
import { GetSuggestionsUseCase } from '../../application/use-cases/search/get-suggestions.use-case.js';
import { IndexEntityUseCase } from '../../application/use-cases/search/index-entity.use-case.js';
export declare class SearchController extends BaseController {
    private intelligentSearchUseCase;
    private getSuggestionsUseCase;
    private indexEntityUseCase;
    constructor(intelligentSearchUseCase: IntelligentSearchUseCase, getSuggestionsUseCase: GetSuggestionsUseCase, indexEntityUseCase: IndexEntityUseCase);
    intelligentSearch(req: Request, res: Response): Promise<void>;
    getSuggestions(req: Request, res: Response): Promise<void>;
    indexEntity(req: Request, res: Response): Promise<void>;
    searchByType(req: Request, res: Response): Promise<void>;
    semanticSearch(req: Request, res: Response): Promise<void>;
    fuzzySearch(req: Request, res: Response): Promise<void>;
    getAvailableFilters(req: Request, res: Response): Promise<void>;
    getPopularSearches(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=search.controller.d.ts.map