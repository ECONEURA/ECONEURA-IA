import { Architecture } from '../../../domain/entities/architecture.entity.js';
import { ArchitectureRepository } from '../../../domain/repositories/architecture.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';
export interface CreateArchitectureRequest extends BaseRequest {
    name: string;
    type: 'hexagonal' | 'layered' | 'microservices' | 'monolithic' | 'event_driven';
    description?: string;
    settings: {
        layers: Array<{
            id: string;
            name: string;
            type: 'domain' | 'application' | 'infrastructure' | 'presentation' | 'shared';
            description: string;
            components: Array<{
                id: string;
                name: string;
                type: 'entity' | 'repository' | 'use_case' | 'service' | 'controller' | 'middleware' | 'dto' | 'route';
                description: string;
                dependencies: string[];
                interfaces: string[];
                implementation: string;
                tests: string[];
                documentation: string;
            }>;
            dependencies: string[];
            responsibilities: string[];
            patterns: string[];
        }>;
        patterns: string[];
        principles: string[];
        conventions: Record<string, any>;
        tools: string[];
        frameworks: string[];
        libraries: string[];
        customFields: Record<string, any>;
        tags: string[];
        notes: string;
    };
}
export interface CreateArchitectureResponse extends BaseResponse {
    data: {
        architecture: Architecture;
    };
}
export declare class CreateArchitectureUseCase extends BaseUseCase<CreateArchitectureRequest, CreateArchitectureResponse> {
    private readonly architectureRepository;
    constructor(architectureRepository: ArchitectureRepository);
    execute(request: CreateArchitectureRequest): Promise<CreateArchitectureResponse>;
}
//# sourceMappingURL=create-architecture.use-case.d.ts.map