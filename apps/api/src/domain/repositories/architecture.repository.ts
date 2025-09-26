import { Architecture } from '../entities/architecture.entity.js';

import { BaseRepository, BaseFilters, BaseSearchOptions, PaginatedResult, BaseStats } from './base.repository.js';

// ============================================================================
// ARCHITECTURE REPOSITORY INTERFACE - PR-0: MONOREPO + HEXAGONAL ARCHITECTURE
// ============================================================================

export interface ArchitectureFilters extends BaseFilters {
  type?: string;
  status?: string;
  layerType?: string;
  componentType?: string;
  isActive?: boolean;
  hasMetrics?: boolean;
  minQualityScore?: number;
  maxQualityScore?: number;
  lastAnalysisFrom?: Date;
  lastAnalysisTo?: Date;
}

export interface ArchitectureSearchOptions extends BaseSearchOptions {
  type?: string;
  status?: string;
  layerType?: string;
  componentType?: string;
  isActive?: boolean;
  hasMetrics?: boolean;
  minQualityScore?: number;
  maxQualityScore?: number;
  lastAnalysisFrom?: Date;
  lastAnalysisTo?: Date;
}

export interface ArchitectureStats extends BaseStats {
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byLayerType: Record<string, number>;
  byComponentType: Record<string, number>;
  totalComponents: number;
  totalLayers: number;
  averageQualityScore: number;
  averageComplexity: number;
  averageCoupling: number;
  averageCohesion: number;
  averageMaintainability: number;
  averageTestability: number;
  averageScalability: number;
  averagePerformance: number;
  averageSecurity: number;
  lastAnalysisDate?: Date;
  totalAnalysisTime: number;
  architecturesWithMetrics: number;
}

export interface ArchitectureRepository extends BaseRepository<Architecture> {
  // ========================================================================
  // ARCHITECTURE-SPECIFIC QUERIES
  // ========================================================================

  findByType(type: string, organizationId: string, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;
  findByStatus(status: string, organizationId: string, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;
  findByLayerType(layerType: string, organizationId: string, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;
  findByComponentType(componentType: string, organizationId: string, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;
  findActiveArchitectures(organizationId: string, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;
  findWithMetrics(organizationId: string, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;

  // ========================================================================
  // ANALYSIS-BASED QUERIES
  // ========================================================================

  findByQualityScoreRange(organizationId: string, minScore: number, maxScore: number, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;
  findByAnalysisDateRange(organizationId: string, startDate: Date, endDate: Date, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;
  findByLastAnalysisDate(organizationId: string, days: number, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;
  findHighQualityArchitectures(organizationId: string, minScore: number, options?: ArchitectureSearchOptions): Promise<PaginatedResult<Architecture>>;

  // ========================================================================
  // SEARCH OPERATIONS
  // ========================================================================

  searchByName(name: string, organizationId: string): Promise<Architecture[]>;
  searchByDescription(description: string, organizationId: string): Promise<Architecture[]>;
  searchByPattern(pattern: string, organizationId: string): Promise<Architecture[]>;

  // ========================================================================
  // BULK OPERATIONS
  // ========================================================================

  updateStatusMany(ids: string[], status: string): Promise<void>;
  updateSettingsMany(ids: string[], settings: any): Promise<void>;
  analyzeArchitecturesMany(ids: string[]): Promise<void>;
  deleteComponentsMany(ids: string[], componentIds: string[]): Promise<void>;

  // ========================================================================
  // STATISTICS AND ANALYTICS
  // ========================================================================

  getStats(organizationId: string, filters?: ArchitectureFilters): Promise<ArchitectureStats>;
  getStatsByType(organizationId: string, type: string): Promise<ArchitectureStats>;
  getStatsByStatus(organizationId: string, status: string): Promise<ArchitectureStats>;
  getStatsByLayerType(organizationId: string, layerType: string): Promise<ArchitectureStats>;

  // ========================================================================
  // ARCHITECTURE ANALYTICS
  // ========================================================================

  getArchitectureAnalytics(organizationId: string, startDate: Date, endDate: Date): Promise<{
    totalArchitectures: number;
    averageQualityScore: number;
    byType: Record<string, number>;
    byStatus: Array<{
      status: string;
      count: number;
      averageQualityScore: number;
      averageComplexity: number;
    }>;
    trends: Array<{
      date: Date;
      architectures: number;
      averageQualityScore: number;
    }>;
    qualityDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    analysisDate: Date;
  }>;

  getComponentAnalytics(organizationId: string): Promise<{
    totalComponents: number;
    averageComponentsPerArchitecture: number;
    byType: Array<{
      type: string;
      count: number;
      averageComplexity: number;
      averageDependencies: number;
    }>;
    byLayer: Array<{
      layer: string;
      count: number;
      averageComplexity: number;
      averageDependencies: number;
    }>;
    complexityDistribution: Array<{
      range: string;
      count: number;
      percentage: number;
    }>;
    analysisDate: Date;
  }>;

  getQualityAnalytics(organizationId: string, startDate: Date, endDate: Date): Promise<{
    totalAnalyses: number;
    averageQualityScore: number;
    byType: Array<{
      type: string;
      count: number;
      averageQualityScore: number;
      bestQualityScore: number;
      worstQualityScore: number;
    }>;
    byStatus: Array<{
      status: string;
      count: number;
      averageQualityScore: number;
      averageComplexity: number;
    }>;
    qualityTrends: Array<{
      date: Date;
      averageQualityScore: number;
      analysesPerformed: number;
    }>;
    analysisDate: Date;
  }>;

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  existsByName(name: string, organizationId: string): Promise<boolean>;
  getArchitectureCount(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getTotalComponents(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getTotalLayers(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getAverageQualityScore(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getAverageComplexity(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getAverageCoupling(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getAverageCohesion(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getAverageMaintainability(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getAverageTestability(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getAverageScalability(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getAveragePerformance(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getAverageSecurity(organizationId: string, filters?: ArchitectureFilters): Promise<number>;
  getArchitecturesWithMetricsCount(organizationId: string, filters?: ArchitectureFilters): Promise<number>;

  // ========================================================================
  // REPORTING
  // ========================================================================

  generateArchitectureReport(organizationId: string, filters?: ArchitectureFilters): Promise<{
    summary: ArchitectureStats;
    architectures: Architecture[];
    generatedAt: Date;
  }>;

  generateComponentReport(organizationId: string): Promise<{
    summary: {
      totalComponents: number;
      averagePerArchitecture: number;
      byType: Record<string, number>;
    };
    components: Array<{
      id: string;
      name: string;
      type: string;
      layer: string;
      complexity: number;
      dependencies: number;
      interfaces: number;
      architectureId: string;
      architectureName: string;
    }>;
    generatedAt: Date;
  }>;

  generateQualityReport(organizationId: string): Promise<{
    summary: {
      totalArchitectures: number;
      averageQualityScore: number;
      highQuality: number;
      needsImprovement: number;
    };
    architectures: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      qualityScore: number;
      complexity: number;
      coupling: number;
      cohesion: number;
      maintainability: number;
      testability: number;
      scalability: number;
      performance: number;
      security: number;
      lastAnalysisDate: Date;
    }>;
    generatedAt: Date;
  }>;

  generateAnalysisReport(organizationId: string, startDate: Date, endDate: Date): Promise<{
    summary: {
      totalAnalyses: number;
      averageQualityScore: number;
      averageAnalysisTime: number;
    };
    analyses: Array<{
      id: string;
      name: string;
      type: string;
      status: string;
      analysisDate: Date;
      duration: number;
      qualityScore: number;
      complexity: number;
      coupling: number;
      cohesion: number;
    }>;
    generatedAt: Date;
  }>;
}
