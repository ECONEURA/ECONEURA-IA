import { Architecture } from '../../../domain/entities/architecture.entity.js';
import { BaseUseCase } from '../base.use-case.js';
export class CreateArchitectureUseCase extends BaseUseCase {
    architectureRepository;
    constructor(architectureRepository) {
        super();
        this.architectureRepository = architectureRepository;
    }
    async execute(request) {
        this.validateBaseRequest(request);
        this.validateString(request.name, 'Name');
        this.validateString(request.type, 'Architecture type');
        if (!request.settings.layers || request.settings.layers.length === 0) {
            throw new Error('At least one layer is required');
        }
        for (const layer of request.settings.layers) {
            if (!layer.name || layer.name.trim().length === 0) {
                throw new Error('Layer name cannot be empty');
            }
            if (!layer.type) {
                throw new Error('Layer type is required');
            }
        }
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
        const existingArchitecture = await this.architectureRepository.existsByName(request.name, request.organizationId);
        if (existingArchitecture) {
            throw new Error(`Architecture with name '${request.name}' already exists`);
        }
        const architecture = Architecture.create({
            organizationId: request.organizationId,
            name: request.name,
            type: request.type,
            status: 'design',
            description: request.description,
            settings: {
                type: request.type,
                layers: request.settings.layers.map(layer => ({
                    id: layer.id,
                    name: layer.name,
                    type: layer.type,
                    description: layer.description,
                    components: layer.components.map(component => ({
                        id: component.id,
                        name: component.name,
                        type: component.type,
                        layer: layer.type,
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
            components: request.settings.layers.flatMap(layer => layer.components.map(component => ({
                id: component.id,
                name: component.name,
                type: component.type,
                layer: layer.type,
                description: component.description,
                dependencies: component.dependencies,
                interfaces: component.interfaces,
                implementation: component.implementation,
                tests: component.tests,
                documentation: component.documentation,
                createdAt: new Date(),
                updatedAt: new Date()
            }))),
            layers: request.settings.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                type: layer.type,
                description: layer.description,
                components: layer.components.map(component => ({
                    id: component.id,
                    name: component.name,
                    type: component.type,
                    layer: layer.type,
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
        if (!architecture.validate()) {
            throw new Error('Invalid architecture data');
        }
        const savedArchitecture = await this.architectureRepository.save(architecture);
        return this.createSuccessResponse({
            architecture: savedArchitecture,
        }, 'Architecture created successfully');
    }
}
//# sourceMappingURL=create-architecture.use-case.js.map