import { SearchResultType } from '../../../domain/entities/search-result.entity.js';
export class IndexEntityUseCase {
    searchRepository;
    constructor(searchRepository) {
        this.searchRepository = searchRepository;
    }
    async execute(request) {
        const startTime = Date.now();
        if (!request.entity || !request.entityId) {
            throw new Error('Entity and entityId are required');
        }
        if (!Object.values(SearchResultType).includes(request.type)) {
            throw new Error('Invalid search result type');
        }
        await this.searchRepository.indexEntity(request.entity, request.type);
        const executionTime = Date.now() - startTime;
        return {
            success: true,
            indexedAt: new Date(),
            executionTime
        };
    }
}
//# sourceMappingURL=index-entity.use-case.js.map