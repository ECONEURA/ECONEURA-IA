import { Architecture } from '../../../domain/entities/architecture.entity.js';
import { ArchitectureRepository } from '../../../domain/repositories/architecture.repository.js';
import { BaseUseCase, BaseRequest, BaseResponse } from '../base.use-case.js';

// ============================================================================
// CREATE ARCHITECTURE USE CASE - PR-0: MONOREPO + HEXAGONAL ARCHITECTURE
// ============================================================================

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

export class CreateArchitectureUseCase extends BaseUseCase<CreateArchitectureRequest, CreateArchitectureResponse> {
  constructor(
    private readonly architectureRepository: ArchitectureRepository
  ) {
    super();
  }

  async execute(request: CreateArchitectureRequest): Promise<CreateArchitectureResponse> {
    // ========================================================================
    // VALIDATION
    // ========================================================================

    this.validateBaseRequest(request);
    this.validateString(request.name, 'Name');
    this.validateString(request.type, 'Architecture type');

    if (!request.settings.layers || request.settings.layers.length === 0) {
      throw new Error('At least one layer is required');
    }

    // Validate layers
    for (const layer of request.settings.layers) {
      if (!layer.name || layer.name.trim().length === 0) {
        throw new Error('Layer name cannot be empty');
      }
      if (!layer.type) {
        throw new Error('Layer type is required');
      }
    }

    // Validate components
    for (const layer of request.settings.layers) {
      for (const component of layer.components) {
        if (!component.name || component.name.trim().length === 0) {
          throw new Error('Component name cannot be empty');
        }
        if (!component.type) {
          throw new Error('Component type is required');
        }
      }
    }

    // ========================================================================
    // BUSINESS LOGIC VALIDATION
    // ========================================================================

    // Check if architecture with same name already exists
    const existingArchitecture = await this.architectureRepository.existsByName(request.name, request.organizationId);
    if (existingArchitecture) {
      throw new Error(`Architecture with name '${request.name}' already exists`);
    }

    // ========================================================================
    // CREATE ARCHITECTURE
    // ========================================================================

    const architecture = Architecture.create({
      organizationId: { value: request.organizationId },
      name: request.name,
      type: { value: request.type },
      status: { value: 'design' },
      description: request.description,
      settings: {
        type: { value: request.type },
        layers: request.settings.layers.map(layer => ({
          id: layer.id,
          name: layer.name,
          type: { value: layer.type },
          description: layer.description,
          components: layer.components.map(component => ({
            id: component.id,
            name: component.name,
            type: { value: component.type },
            layer: { value: layer.type },
            description: component.description,
            dependencies: component.dependencies,
            interfaces: component.interfaces,
            implementation: component.implementation,
            tests: component.tests,
            documentation: component.documentation,
            createdAt: new Date(),
            updatedAt: new Date()
          })),
          dependencies: layer.dependencies,
          responsibilities: layer.responsibilities,
          patterns: layer.patterns,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        patterns: request.settings.patterns,
        principles: request.settings.principles,
        conventions: request.settings.conventions,
        tools: request.settings.tools,
        frameworks: request.settings.frameworks,
        libraries: request.settings.libraries,
        customFields: request.settings.customFields,
        tags: request.settings.tags,
        notes: request.settings.notes,
      },
      components: request.settings.layers.flatMap(layer => 
        layer.components.map(component => ({
          id: component.id,
          name: component.name,
          type: { value: component.type },
          layer: { value: layer.type },
          description: component.description,
          dependencies: component.dependencies,
          interfaces: component.interfaces,
          implementation: component.implementation,
          tests: component.tests,
          documentation: component.documentation,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      ),
      layers: request.settings.layers.map(layer => ({
        id: layer.id,
        name: layer.name,
        type: { value: layer.type },
        description: layer.description,
        components: layer.components.map(component => ({
          id: component.id,
          name: component.name,
          type: { value: component.type },
          layer: { value: layer.type },
          description: component.description,
          dependencies: component.dependencies,
          interfaces: component.interfaces,
          implementation: component.implementation,
          tests: component.tests,
          documentation: component.documentation,
          createdAt: new Date(),
          updatedAt: new Date()
        })),
        dependencies: layer.dependencies,
        responsibilities: layer.responsibilities,
        patterns: layer.patterns,
        createdAt: new Date(),
        updatedAt: new Date()
      })),
      isActive: true,
    });

    // ========================================================================
    // VALIDATE ARCHITECTURE
    // ========================================================================

    if (!architecture.validate()) {
      throw new Error('Invalid architecture data');
    }

    // ========================================================================
    // SAVE ARCHITECTURE
    // ========================================================================

    const savedArchitecture = await this.architectureRepository.save(architecture);

    // ========================================================================
    // RETURN RESPONSE
    // ========================================================================

    return this.createSuccessResponse({
      architecture: savedArchitecture,
    }, 'Architecture created successfully');
  }
}
