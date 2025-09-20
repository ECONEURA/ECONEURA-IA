import { UseCase } from '../base.use-case.js';
import { SearchRepository } from '../../../domain/repositories/search.repository.js';
import { SearchResultType } from '../../../domain/entities/search-result.entity.js';
export interface IndexEntityRequest {
    entity: any;
    type: SearchResultType;
    entityId: string;
    title: string;
    description: string;
    content: string;
    tags?: string[];
    category?: string;
    subcategory?: string;
    metadata?: Record<string, any>;
}
export interface IndexEntityResponse {
    success: boolean;
    indexedAt: Date;
    executionTime: number;
}
export declare class IndexEntityUseCase implements UseCase<IndexEntityRequest, IndexEntityResponse> {
    private searchRepository;
    constructor(searchRepository: SearchRepository);
    execute(request: IndexEntityRequest): Promise<IndexEntityResponse>;
}
//# sourceMappingURL=index-entity.use-case.d.ts.map