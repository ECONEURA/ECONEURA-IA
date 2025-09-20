import { BaseEntity, BaseEntityProps } from './base.entity.js';
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
export declare class Architecture extends BaseEntity {
    private props;
    private constructor();
    static create(props: Omit<ArchitectureProps, 'id' | 'createdAt' | 'updatedAt'>): Architecture;
    static fromJSON(data: ArchitectureProps): Architecture;
    get name(): string;
    get type(): ArchitectureType;
    get status(): ArchitectureStatus;
    get organizationId(): string;
    get description(): string | undefined;
    get settings(): ArchitectureSettings;
    get metrics(): ArchitectureMetrics | undefined;
    get components(): ArchitectureComponent[];
    get layers(): ArchitectureLayer[];
    get lastAnalysisDate(): Date | undefined;
    updateName(name: string): void;
    updateType(type: ArchitectureType): void;
    updateStatus(status: ArchitectureStatus): void;
    updateDescription(description: string): void;
    updateSettings(settings: ArchitectureSettings): void;
    updateMetrics(metrics: ArchitectureMetrics): void;
    addComponent(component: ArchitectureComponent): void;
    removeComponent(componentId: string): void;
    updateComponent(componentId: string, updates: Partial<ArchitectureComponent>): void;
    addLayer(layer: ArchitectureLayer): void;
    removeLayer(layerId: string): void;
    updateLayer(layerId: string, updates: Partial<ArchitectureLayer>): void;
    analyzeArchitecture(): ArchitectureMetrics;
    private calculateComplexity;
    private calculateCoupling;
    private calculateCohesion;
    private calculateMaintainability;
    private calculateTestability;
    private calculateScalability;
    private calculatePerformance;
    private calculateSecurity;
    private calculateQualityScore;
    validate(): boolean;
    toJSON(): ArchitectureProps;
    clone(): Architecture;
    static createHexagonalArchitecture(props: Omit<ArchitectureProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Architecture;
    static createMicroservicesArchitecture(props: Omit<ArchitectureProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Architecture;
    static createLayeredArchitecture(props: Omit<ArchitectureProps, 'id' | 'type' | 'createdAt' | 'updatedAt'>): Architecture;
}
export type { ArchitectureId, ArchitectureType, ArchitectureStatus, LayerType, ComponentType, ArchitectureComponent, ArchitectureLayer, ArchitectureSettings, ArchitectureMetrics };
//# sourceMappingURL=architecture.entity.d.ts.map