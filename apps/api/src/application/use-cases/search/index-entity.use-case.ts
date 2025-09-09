import { UseCase } from '../base.use-case';
import { SearchRepository } from '../../../domain/repositories/search.repository';
import { SearchResult, SearchResultType } from '../../../domain/entities/search-result.entity';

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

export class IndexEntityUseCase implements UseCase<IndexEntityRequest, IndexEntityResponse> {
  constructor(private searchRepository: SearchRepository) {}

  async execute(request: IndexEntityRequest): Promise<IndexEntityResponse> {
    const startTime = Date.now();

    // Validar entidad
    if (!request.entity || !request.entityId) {
      throw new Error('Entity and entityId are required');
    }

    // Validar tipo
    if (!Object.values(SearchResultType).includes(request.type)) {
      throw new Error('Invalid search result type');
    }

    // Indexar entidad
    await this.searchRepository.indexEntity(request.entity, request.type);

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      indexedAt: new Date(),
      executionTime
    };
  }
}
