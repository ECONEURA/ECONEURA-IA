import { Request, Response, NextFunction } from 'express';
import { ArchitectureRepository } from '../../domain/repositories/architecture.repository.js';
import { CreateArchitectureUseCase } from '../../application/use-cases/architecture/create-architecture.use-case.js';
import { AnalyzeArchitectureUseCase } from '../../application/use-cases/architecture/analyze-architecture.use-case.js';
import { BaseController } from './base.controller.js';
import {
  CreateArchitectureRequestSchema,
  UpdateArchitectureRequestSchema,
  AnalyzeArchitectureRequestSchema,
  ArchitectureIdParamSchema,
  ArchitectureOrganizationIdParamSchema,
  ArchitectureSearchQuerySchema,
  ArchitectureBulkUpdateSchema,
  ArchitectureBulkDeleteSchema,
  type CreateArchitectureRequest,
  type UpdateArchitectureRequest,
  type AnalyzeArchitectureRequest,
  type ArchitectureIdParam,
  type ArchitectureOrganizationIdParam,
  type ArchitectureSearchQuery,
  type ArchitectureBulkUpdate,
  type ArchitectureBulkDelete,
  type ArchitectureResponse,
  type ArchitectureListResponse,
  type ArchitectureStatsResponse
} from '../dto/architecture.dto.js';

// ============================================================================
// ARCHITECTURE CONTROLLER - PR-0: MONOREPO + HEXAGONAL ARCHITECTURE
// ============================================================================

export class ArchitectureController extends BaseController {
  private createArchitectureUseCase: CreateArchitectureUseCase;
  private analyzeArchitectureUseCase: AnalyzeArchitectureUseCase;

  constructor(private architectureRepository: ArchitectureRepository) {
    super();
    this.createArchitectureUseCase = new CreateArchitectureUseCase(architectureRepository);
    this.analyzeArchitectureUseCase = new AnalyzeArchitectureUseCase(architectureRepository);
  }

  // ========================================================================
  // ARCHITECTURE MANAGEMENT
  // ========================================================================

  async createArchitecture(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const requestData = CreateArchitectureRequestSchema.parse(req.body);
      const createdBy = this.getUserId(req);

      const result = await this.createArchitectureUseCase.execute({
        ...requestData,
        createdBy
      });

      const response: ArchitectureResponse = this.transformArchitectureToResponse(result.data.architecture);
      this.sendSuccessResponse(res, response, 'Architecture created successfully', 201);
    }, res, next);
  }

  async updateArchitecture(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { id } = ArchitectureIdParamSchema.parse(req.params);
      const requestData = UpdateArchitectureRequestSchema.parse(req.body);
      const updatedBy = this.getUserId(req);

      // Find existing architecture
      const existingArchitecture = await this.architectureRepository.findById(id);
      if (!existingArchitecture) {
        this.sendNotFoundResponse(res, 'Architecture');
        return;
      }

      // Update basic fields
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

      // Save updated architecture
      const updatedArchitecture = await this.architectureRepository.update(existingArchitecture);

      const response: ArchitectureResponse = this.transformArchitectureToResponse(updatedArchitecture);
      this.sendSuccessResponse(res, response, 'Architecture updated successfully');
    }, res, next);
  }

  async deleteArchitecture(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { id } = ArchitectureIdParamSchema.parse(req.params);
      const deletedBy = this.getUserId(req);

      await this.architectureRepository.delete(id);
      this.sendSuccessResponse(res, null, 'Architecture deleted successfully');
    }, res, next);
  }

  async getArchitecture(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { id } = ArchitectureIdParamSchema.parse(req.params);

      const architecture = await this.architectureRepository.findById(id);
      if (!architecture) {
        this.sendNotFoundResponse(res, 'Architecture');
        return;
      }

      const response: ArchitectureResponse = this.transformArchitectureToResponse(architecture);
      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getArchitecturesByOrganization(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
      const query = ArchitectureSearchQuerySchema.parse(req.query);

      const result = await this.architectureRepository.findByOrganizationId(organizationId, query);
      
      const response: ArchitectureListResponse = {
        data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async searchArchitectures(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
      const query = ArchitectureSearchQuerySchema.parse(req.query);

      const result = await this.architectureRepository.search(query.search || '', organizationId, query);
      
      const response: ArchitectureListResponse = {
        data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getArchitectureStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);

      const stats = await this.architectureRepository.getStats(organizationId);
      const response: ArchitectureStatsResponse = this.transformStatsToResponse(stats);

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  // ========================================================================
  // ARCHITECTURE QUERIES
  // ========================================================================

  async getArchitecturesByType(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
      const { type } = req.params;
      const query = ArchitectureSearchQuerySchema.parse(req.query);

      const result = await this.architectureRepository.findByType(type, organizationId, query);
      
      const response: ArchitectureListResponse = {
        data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getArchitecturesByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
      const { status } = req.params;
      const query = ArchitectureSearchQuerySchema.parse(req.query);

      const result = await this.architectureRepository.findByStatus(status, organizationId, query);
      
      const response: ArchitectureListResponse = {
        data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getActiveArchitectures(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
      const query = ArchitectureSearchQuerySchema.parse(req.query);

      const result = await this.architectureRepository.findActiveArchitectures(organizationId, query);
      
      const response: ArchitectureListResponse = {
        data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  async getArchitecturesWithMetrics(req: Request, res: Response, next: NextFunction): Promise<void> {
    await this.handleAsync(async () => {
      const { organizationId } = ArchitectureOrganizationIdParamSchema.parse(req.params);
      const query = ArchitectureSearchQuerySchema.parse(req.query);

      const result = await this.architectureRepository.findWithMetrics(organizationId, query);
      
      const response: ArchitectureListResponse = {
        data: result.data.map(architecture => this.transformArchitectureToResponse(architecture)),
        pagination: result.pagination
      };

      this.sendSuccessResponse(res, response);
    }, res, next);
  }

  // ========================================================================
  // ANALYSIS OPERATIONS
  // ========================================================================

  async analyzeArchitecture(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  async bulkUpdateArchitectures(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  async bulkDeleteArchitectures(req: Request, res: Response, next: NextFunction): Promise<void> {
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

  // ========================================================================
  // TRANSFORMATION METHODS
  // ========================================================================

  private transformArchitectureToResponse(architecture: any): ArchitectureResponse {
    return {
      id: architecture.id.value,
      organizationId: architecture.organizationId.value,
      name: architecture.name,
      type: architecture.type.value,
      status: architecture.status.value,
      description: architecture.description,
      settings: {
        type: architecture.settings.type.value,
        layers: architecture.settings.layers.map((layer: any) => ({
          id: layer.id,
          name: layer.name,
          type: layer.type.value,
          description: layer.description,
          components: layer.components.map((component: any) => ({
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
      components: architecture.components.map((component: any) => ({
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
      layers: architecture.layers.map((layer: any) => ({
        id: layer.id,
        name: layer.name,
        type: layer.type.value,
        description: layer.description,
        components: layer.components.map((component: any) => ({
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

  private transformStatsToResponse(stats: any): ArchitectureStatsResponse {
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
