import { z } from 'zod';
import { BaseEntity, BaseEntityProps } from './base.entity.js';

// ============================================================================
// ARCHITECTURE ENTITY - PR-0: MONOREPO + HEXAGONAL ARCHITECTURE
// ============================================================================

export interface ArchitectureId {
  value: string;
}

export interface ArchitectureType {
  value: 'hexagonal' | 'layered' | 'microservices' | 'monolithic' | 'event_driven';
}

export interface ArchitectureStatus {
  value: 'design' | 'implementation' | 'testing' | 'deployed' | 'maintenance';
}

export interface LayerType {
  value: 'domain' | 'application' | 'infrastructure' | 'presentation' | 'shared';
}

export interface ComponentType {
  value: 'entity' | 'repository' | 'use_case' | 'service' | 'controller' | 'middleware' | 'dto' | 'route';
}

export interface ArchitectureComponent {
  id: string;
  name: string;
  type: ComponentType;
  layer: LayerType;
  description: string;
  dependencies: string[];
  interfaces: string[];
  implementation: string;
  tests: string[];
  documentation: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchitectureLayer {
  id: string;
  name: string;
  type: LayerType;
  description: string;
  components: ArchitectureComponent[];
  dependencies: string[];
  responsibilities: string[];
  patterns: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ArchitectureSettings {
  type: ArchitectureType;
  layers: ArchitectureLayer[];
  patterns: string[];
  principles: string[];
  conventions: Record<string, any>;
  tools: string[];
  frameworks: string[];
  libraries: string[];
  customFields: Record<string, any>;
  tags: string[];
  notes: string;
}

export interface ArchitectureMetrics {
  totalComponents: number;
  totalLayers: number;
  complexity: number;
  coupling: number;
  cohesion: number;
  maintainability: number;
  testability: number;
  scalability: number;
  performance: number;
  security: number;
  lastAnalysisDate: Date;
  analysisDuration: number;
  qualityScore: number;
}

export interface ArchitectureProps extends BaseEntityProps {
  name: string;
  type: ArchitectureType;
  status: ArchitectureStatus;
  organizationId: string;
  description?: string;
  settings: ArchitectureSettings;
  metrics?: ArchitectureMetrics;
  components: ArchitectureComponent[];
  layers: ArchitectureLayer[];
  lastAnalysisDate?: Date;
  isActive: boolean;
}

export class Architecture extends BaseEntity {
  private constructor(private props: ArchitectureProps) {
    super(props);
  }

  // ========================================================================
  // FACTORY METHODS
  // ========================================================================

  static create(props: Omit<ArchitectureProps, 'id' | 'createdAt' | 'updatedAt'>): Architecture {
    const now = new Date();
    return new Architecture({
      ...props,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromJSON(data: ArchitectureProps): Architecture {
    return new Architecture(data);
  }

  // ========================================================================
  // GETTERS
  // ========================================================================

  get name(): string { return this.props.name; }
  get type(): ArchitectureType { return this.props.type; }
  get status(): ArchitectureStatus { return this.props.status; }
  get organizationId(): string { return this.props.organizationId; }
  get description(): string | undefined { return this.props.description; }
  get settings(): ArchitectureSettings { return this.props.settings; }
  get metrics(): ArchitectureMetrics | undefined { return this.props.metrics; }
  get components(): ArchitectureComponent[] { return this.props.components; }
  get layers(): ArchitectureLayer[] { return this.props.layers; }
  get lastAnalysisDate(): Date | undefined { return this.props.lastAnalysisDate; }

  // ========================================================================
  // BUSINESS METHODS
  // ========================================================================

  updateName(name: string): void {
    if (!name || name.trim().length === 0) {
      throw new Error('Name cannot be empty');
    }
    this.props.name = name.trim();
    this.updateTimestamp();
  }

  updateType(type: ArchitectureType): void {
    this.props.type = type;
    this.updateTimestamp();
  }

  updateStatus(status: ArchitectureStatus): void {
    this.props.status = status;
    this.updateTimestamp();
  }

  updateDescription(description: string): void {
    this.props.description = description;
    this.updateTimestamp();
  }

  updateSettings(settings: ArchitectureSettings): void {
    this.props.settings = settings;
    this.updateTimestamp();
  }

  updateMetrics(metrics: ArchitectureMetrics): void {
    this.props.metrics = metrics;
    this.updateTimestamp();
  }

  addComponent(component: ArchitectureComponent): void {
    this.props.components.push(component);
    this.updateTimestamp();
  }

  removeComponent(componentId: string): void {
    this.props.components = this.props.components.filter(component => component.id !== componentId);
    this.updateTimestamp();
  }

  updateComponent(componentId: string, updates: Partial<ArchitectureComponent>): void {
    const componentIndex = this.props.components.findIndex(component => component.id === componentId);
    if (componentIndex !== -1) {
      this.props.components[componentIndex] = { ...this.props.components[componentIndex], ...updates };
      this.updateTimestamp();
    }
  }

  addLayer(layer: ArchitectureLayer): void {
    this.props.layers.push(layer);
    this.updateTimestamp();
  }

  removeLayer(layerId: string): void {
    this.props.layers = this.props.layers.filter(layer => layer.id !== layerId);
    this.updateTimestamp();
  }

  updateLayer(layerId: string, updates: Partial<ArchitectureLayer>): void {
    const layerIndex = this.props.layers.findIndex(layer => layer.id === layerId);
    if (layerIndex !== -1) {
      this.props.layers[layerIndex] = { ...this.props.layers[layerIndex], ...updates };
      this.updateTimestamp();
    }
  }

  // ========================================================================
  // ARCHITECTURE ANALYSIS METHODS
  // ========================================================================

  analyzeArchitecture(): ArchitectureMetrics {
    const metrics: ArchitectureMetrics = {
      totalComponents: this.props.components.length,
      totalLayers: this.props.layers.length,
      complexity: this.calculateComplexity(),
      coupling: this.calculateCoupling(),
      cohesion: this.calculateCohesion(),
      maintainability: this.calculateMaintainability(),
      testability: this.calculateTestability(),
      scalability: this.calculateScalability(),
      performance: this.calculatePerformance(),
      security: this.calculateSecurity(),
      lastAnalysisDate: new Date(),
      analysisDuration: 0,
      qualityScore: 0
    };

    // Calculate quality score
    metrics.qualityScore = this.calculateQualityScore(metrics);
    
    this.props.metrics = metrics;
    this.props.lastAnalysisDate = new Date();
    this.updateTimestamp();

    return metrics;
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private calculateComplexity(): number {
    // Calculate cyclomatic complexity based on components and dependencies
    let complexity = 0;
    for (const component of this.props.components) {
      complexity += component.dependencies.length + component.interfaces.length;
    }
    return Math.min(complexity / 10, 10); // Normalize to 0-10 scale
  }

  private calculateCoupling(): number {
    // Calculate coupling based on dependencies between components
    let totalDependencies = 0;
    for (const component of this.props.components) {
      totalDependencies += component.dependencies.length;
    }
    return Math.min(totalDependencies / this.props.components.length, 10);
  }

  private calculateCohesion(): number {
    // Calculate cohesion based on component responsibilities
    let cohesion = 0;
    for (const component of this.props.components) {
      // Higher cohesion if component has focused responsibilities
      cohesion += Math.max(0, 5 - component.dependencies.length);
    }
    return Math.min(cohesion / this.props.components.length, 10);
  }

  private calculateMaintainability(): number {
    // Calculate maintainability based on documentation and test coverage
    let maintainability = 0;
    for (const component of this.props.components) {
      if (component.documentation && component.documentation.length > 0) maintainability += 2;
      if (component.tests && component.tests.length > 0) maintainability += 3;
    }
    return Math.min(maintainability / this.props.components.length, 10);
  }

  private calculateTestability(): number {
    // Calculate testability based on test coverage
    let testability = 0;
    for (const component of this.props.components) {
      if (component.tests && component.tests.length > 0) testability += 5;
    }
    return Math.min(testability / this.props.components.length, 10);
  }

  private calculateScalability(): number {
    // Calculate scalability based on architecture type and patterns
    let scalability = 5; // Base score
    if (this.props.type.value === 'microservices') scalability += 3;
    if (this.props.type.value === 'hexagonal') scalability += 2;
    if (this.props.settings.patterns.includes('event_driven')) scalability += 2;
    return Math.min(scalability, 10);
  }

  private calculatePerformance(): number {
    // Calculate performance based on architecture efficiency
    let performance = 5; // Base score
    if (this.props.type.value === 'hexagonal') performance += 2;
    if (this.props.settings.patterns.includes('caching')) performance += 2;
    if (this.props.settings.patterns.includes('optimization')) performance += 1;
    return Math.min(performance, 10);
  }

  private calculateSecurity(): number {
    // Calculate security based on security patterns and practices
    let security = 5; // Base score
    if (this.props.settings.patterns.includes('security_by_design')) security += 2;
    if (this.props.settings.patterns.includes('authentication')) security += 1;
    if (this.props.settings.patterns.includes('authorization')) security += 1;
    if (this.props.settings.patterns.includes('encryption')) security += 1;
    return Math.min(security, 10);
  }

  private calculateQualityScore(metrics: ArchitectureMetrics): number {
    // Calculate overall quality score
    const weights = {
      complexity: 0.15,
      coupling: 0.15,
      cohesion: 0.15,
      maintainability: 0.15,
      testability: 0.15,
      scalability: 0.1,
      performance: 0.1,
      security: 0.05
    };

    let score = 0;
    score += (10 - metrics.complexity) * weights.complexity;
    score += (10 - metrics.coupling) * weights.coupling;
    score += metrics.cohesion * weights.cohesion;
    score += metrics.maintainability * weights.maintainability;
    score += metrics.testability * weights.testability;
    score += metrics.scalability * weights.scalability;
    score += metrics.performance * weights.performance;
    score += metrics.security * weights.security;

    return Math.round(score * 100) / 100;
  }

  // ========================================================================
  // VALIDATION METHODS
  // ========================================================================

  validate(): boolean {
    if (!this.validateBase()) {
      return false;
    }

    if (!this.props.name || this.props.name.trim().length === 0) {
      return false;
    }

    if (!this.props.organizationId || this.props.organizationId.trim().length === 0) {
      return false;
    }

    if (!this.props.settings.layers || this.props.settings.layers.length === 0) {
      return false;
    }

    return true;
  }

  // ========================================================================
  // UTILITY METHODS
  // ========================================================================

  toJSON(): ArchitectureProps {
    return { ...this.props };
  }

  clone(): Architecture {
    return Architecture.fromJSON(this.toJSON());
  }

  // ========================================================================
  // FACTORY METHODS FOR SPECIFIC ARCHITECTURE TYPES
  // ========================================================================

  static createHexagonalArchitecture(props: Omit<ArchitectureProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Architecture {
    return Architecture.create({
      ...props,
      type: 'hexagonal',
    });
  }

  static createMicroservicesArchitecture(props: Omit<ArchitectureProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Architecture {
    return Architecture.create({
      ...props,
      type: 'microservices',
    });
  }

  static createLayeredArchitecture(props: Omit<ArchitectureProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Architecture {
    return Architecture.create({
      ...props,
      type: 'layered',
    });
  }
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type { ArchitectureId, ArchitectureType, ArchitectureStatus, LayerType, ComponentType, ArchitectureComponent, ArchitectureLayer, ArchitectureSettings, ArchitectureMetrics };
