import { CreateArchitectureUseCase } from '../../application/use-cases/architecture/create-architecture.use-case.js';
import { AnalyzeArchitectureUseCase } from '../../application/use-cases/architecture/analyze-architecture.use-case.js';
import { BaseController } from './base.controller.js';
import { CreateArchitectureRequestSchema, UpdateArchitectureRequestSchema, AnalyzeArchitectureRequestSchema, ArchitectureIdParamSchema, ArchitectureOrganizationIdParamSchema, ArchitectureSearchQuerySchema, ArchitectureBulkUpdateSchema, ArchitectureBulkDeleteSchema } from '../dto/architecture.dto.js';
export class ArchitectureController extends BaseController {
    architectureRepository;
    createArchitectureUseCase;
    analyzeArchitectureUseCase;
    constructor(architectureRepository) {
        super();
        this.architectureRepository = architectureRepository;
        this.createArchitectureUseCase = new CreateArchitectureUseCase(architectureRepository);
        this.analyzeArchitectureUseCase = new AnalyzeArchitectureUseCase(architectureRepository);
    }
    async createArchitecture(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = CreateArchitectureRequestSchema.parse(req.body);
            const createdBy = this.getUserId(req);
            const result = await this.createArchitectureUseCase.execute({
                ...requestData,
                createdBy
            });
            const response = this.transformArchitectureToResponse(result.data.architecture);
            this.sendSuccessResponse(res, response, 'Architecture created successfully', 201);
        }, res, next);
    }
    async updateArchitecture(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = ArchitectureIdParamSchema.parse(req.params);
            const requestData = UpdateArchitectureRequestSchema.parse(req.body);
            const updatedBy = this.getUserId(req);
            const existingArchitecture = await this.architectureRepository.findById(id);
            if (!existingArchitecture) {
                this.sendNotFoundResponse(res, 'Architecture');
                return;
            }
            if (requestData.name !== undefined) {
                existingArchitecture.updateName(requestData.name);
            }
            if (requestData.type !== undefined) {
                existingArchitecture.updateType(requestData.type);
            }
            if (requestData.description !== undefined) {
                existingArchitecture.updateDescription(requestData.description);
            }
            if (requestData.settings !== undefined) {
                existingArchitecture.updateSettings(requestData.settings);
            }
            const updatedArchitecture = await this.architectureRepository.update(existingArchitecture);
            const response = this.transformArchitectureToResponse(updatedArchitecture);
            this.sendSuccessResponse(res, response, 'Architecture updated successfully');
        }, res, next);
    }
    async deleteArchitecture(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = ArchitectureIdParamSchema.parse(req.params);
            const deletedBy = this.getUserId(req);
            await this.architectureRepository.delete(id);
            this.sendSuccessResponse(res, null, 'Architecture deleted successfully');
        }, res, next);
    }
    async getArchitecture(req, res, next) {
        await this.handleAsync(async () => {
            const { id } = ArchitectureIdParamSchema.parse(req.params);
            const architecture = await this.architectureRepository.findById(id);
            if (!architecture) {
                this.sendNotFoundResponse(res, 'Architecture');
                return;
            }
            const response = this.transformArchitectureToResponse(architecture);
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getArchitecturesByOrganization(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
            const query = ArchitectureSearchQuerySchema.parse(req.query);
            const result = await this.architectureRepository.findByOrganizationId(organizationId, query);
            const response = {
                data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async searchArchitectures(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
            const query = ArchitectureSearchQuerySchema.parse(req.query);
            const result = await this.architectureRepository.search(query.search || '', organizationId, query);
            const response = {
                data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getArchitectureStats(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
            const stats = await this.architectureRepository.getStats(organizationId);
            const response = this.transformStatsToResponse(stats);
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getArchitecturesByType(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
            const { type } = req.params;
            const query = ArchitectureSearchQuerySchema.parse(req.query);
            const result = await this.architectureRepository.findByType(type, organizationId, query);
            const response = {
                data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getArchitecturesByStatus(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
            const { status } = req.params;
            const query = ArchitectureSearchQuerySchema.parse(req.query);
            const result = await this.architectureRepository.findByStatus(status, organizationId, query);
            const response = {
                data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getActiveArchitectures(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
            const query = ArchitectureSearchQuerySchema.parse(req.query);
            const result = await this.architectureRepository.findActiveArchitectures(organizationId, query);
            const response = {
                data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async getArchitecturesWithMetrics(req, res, next) {
        await this.handleAsync(async () => {
            const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
            const query = ArchitectureSearchQuerySchema.parse(req.query);
            const result = await this.architectureRepository.findWithMetrics(organizationId, query);
            const response = {
                data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
                pagination: result.pagination
            };
            this.sendSuccessResponse(res, response);
        }, res, next);
    }
    async analyzeArchitecture(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = AnalyzeArchitectureRequestSchema.parse(req.body);
            const createdBy = this.getUserId(req);
            const result = await this.analyzeArchitectureUseCase.execute({
                ...requestData,
                createdBy
            });
            const response = {
                architecture: this.transformArchitectureToResponse(result.data.architecture),
                metrics: result.data.metrics
            };
            this.sendSuccessResponse(res, response, 'Architecture analyzed successfully');
        }, res, next);
    }
    async bulkUpdateArchitectures(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = ArchitectureBulkUpdateSchema.parse(req.body);
            const updatedBy = this.getUserId(req);
            await this.architectureRepository.updateStatusMany(requestData.ids, requestData.updates.status || 'design');
            this.sendSuccessResponse(res, {
                updated: requestData.ids.length,
                ids: requestData.ids
            }, `${requestData.ids.length} architectures updated successfully`);
        }, res, next);
    }
    async bulkDeleteArchitectures(req, res, next) {
        await this.handleAsync(async () => {
            const requestData = ArchitectureBulkDeleteSchema.parse(req.body);
            const deletedBy = this.getUserId(req);
            await this.architectureRepository.deleteMany(requestData.ids);
            this.sendSuccessResponse(res, {
                deleted: requestData.ids.length,
                ids: requestData.ids
            }, `${requestData.ids.length} architectures deleted successfully`);
        }, res, next);
    }
    transformArchitectureToResponse(architecture) {
        return {
            id: architecture.id.value,
            organizationId: architecture.organizationId.value,
            name: architecture.name,
            type: architecture.type.value,
            status: architecture.status.value,
            description: architecture.description,
            settings: {
                type: architecture.settings.type.value,
                layers: architecture.settings.layers.map((layer) => ({
                    id: layer.id,
                    name: layer.name,
                    type: layer.type.value,
                    description: layer.description,
                    components: layer.components.map((component) => ({
                        id: component.id,
                        name: component.name,
                        type: component.type.value,
                        layer: component.layer.value,
                        description: component.description,
                        dependencies: component.dependencies,
                        interfaces: component.interfaces,
                        implementation: component.implementation,
                        tests: component.tests,
                        documentation: component.documentation,
                        createdAt: component.createdAt,
                        updatedAt: component.updatedAt
                    })),
                    dependencies: layer.dependencies,
                    responsibilities: layer.responsibilities,
                    patterns: layer.patterns,
                    createdAt: layer.createdAt,
                    updatedAt: layer.updatedAt
                })),
                patterns: architecture.settings.patterns,
                principles: architecture.settings.principles,
                conventions: architecture.settings.conventions,
                tools: architecture.settings.tools,
                frameworks: architecture.settings.frameworks,
                libraries: architecture.settings.libraries,
                customFields: architecture.settings.customFields,
                tags: architecture.settings.tags,
                notes: architecture.settings.notes
            },
            metrics: architecture.metrics ? {
                totalComponents: architecture.metrics.totalComponents,
                totalLayers: architecture.metrics.totalLayers,
                complexity: architecture.metrics.complexity,
                coupling: architecture.metrics.coupling,
                cohesion: architecture.metrics.cohesion,
                maintainability: architecture.metrics.maintainability,
                testability: architecture.metrics.testability,
                scalability: architecture.metrics.scalability,
                performance: architecture.metrics.performance,
                security: architecture.metrics.security,
                lastAnalysisDate: architecture.metrics.lastAnalysisDate,
                analysisDuration: architecture.metrics.analysisDuration,
                qualityScore: architecture.metrics.qualityScore
            } : undefined,
            components: architecture.components.map((component) => ({
                id: component.id,
                name: component.name,
                type: component.type.value,
                layer: component.layer.value,
                description: component.description,
                dependencies: component.dependencies,
                interfaces: component.interfaces,
                implementation: component.implementation,
                tests: component.tests,
                documentation: component.documentation,
                createdAt: component.createdAt,
                updatedAt: component.updatedAt
            })),
            layers: architecture.layers.map((layer) => ({
                id: layer.id,
                name: layer.name,
                type: layer.type.value,
                description: layer.description,
                components: layer.components.map((component) => ({
                    id: component.id,
                    name: component.name,
                    type: component.type.value,
                    layer: component.layer.value,
                    description: component.description,
                    dependencies: component.dependencies,
                    interfaces: component.interfaces,
                    implementation: component.implementation,
                    tests: component.tests,
                    documentation: component.documentation,
                    createdAt: component.createdAt,
                    updatedAt: component.updatedAt
                })),
                dependencies: layer.dependencies,
                responsibilities: layer.responsibilities,
                patterns: layer.patterns,
                createdAt: layer.createdAt,
                updatedAt: layer.updatedAt
            })),
            lastAnalysisDate: architecture.lastAnalysisDate,
            isActive: architecture.isActive,
            createdAt: architecture.createdAt,
            updatedAt: architecture.updatedAt
        };
    }
    transformStatsToResponse(stats) {
        return {
            total: stats.total,
            active: stats.active,
            inactive: stats.inactive,
            createdThisMonth: stats.createdThisMonth,
            createdThisYear: stats.createdThisYear,
            updatedThisMonth: stats.updatedThisMonth,
            updatedThisYear: stats.updatedThisYear,
            byType: stats.byType,
            byStatus: stats.byStatus,
            byLayerType: stats.byLayerType,
            byComponentType: stats.byComponentType,
            totalComponents: stats.totalComponents,
            totalLayers: stats.totalLayers,
            averageQualityScore: stats.averageQualityScore,
            averageComplexity: stats.averageComplexity,
            averageCoupling: stats.averageCoupling,
            averageCohesion: stats.averageCohesion,
            averageMaintainability: stats.averageMaintainability,
            averageTestability: stats.averageTestability,
            averageScalability: stats.averageScalability,
            averagePerformance: stats.averagePerformance,
            averageSecurity: stats.averageSecurity,
            lastAnalysisDate: stats.lastAnalysisDate,
            totalAnalysisTime: stats.totalAnalysisTime,
            architecturesWithMetrics: stats.architecturesWithMetrics
        };
    }
}
//# sourceMappingURL=architecture.controller.js.map