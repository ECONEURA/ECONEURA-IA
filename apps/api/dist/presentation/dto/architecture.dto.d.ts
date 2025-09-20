import { z } from 'zod';
export declare const CreateArchitectureRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    name: z.ZodEffects<z.ZodString, string, string>;
    type: z.ZodEnum<["hexagonal", "layered", "microservices", "monolithic", "event_driven"]>;
    description: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string, string>>;
    settings: z.ZodObject<{
        layers: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
            description: z.ZodString;
            components: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
                description: z.ZodString;
                dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                interfaces: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                implementation: z.ZodString;
                tests: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                documentation: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }, {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }>, "many">;
            dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            responsibilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            patterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }, {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }>, "many">;
        patterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        principles: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        conventions: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tools: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        frameworks: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        libraries: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        customFields: z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tags: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        notes: z.ZodDefault<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    }, {
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
    organizationId?: string;
    name?: string;
    description?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    };
}, {
    type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
    organizationId?: string;
    name?: string;
    description?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    };
}>;
export declare const UpdateArchitectureRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
    type: z.ZodOptional<z.ZodEnum<["hexagonal", "layered", "microservices", "monolithic", "event_driven"]>>;
    description: z.ZodOptional<z.ZodEffects<z.ZodOptional<z.ZodString>, string, string>>;
    settings: z.ZodOptional<z.ZodObject<{
        layers: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
            description: z.ZodString;
            components: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
                description: z.ZodString;
                dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                interfaces: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                implementation: z.ZodString;
                tests: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
                documentation: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }, {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }>, "many">;
            dependencies: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            responsibilities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
            patterns: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }, {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }>, "many">>;
        patterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        principles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        conventions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        tools: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        frameworks: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        libraries: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        customFields: z.ZodOptional<z.ZodDefault<z.ZodRecord<z.ZodString, z.ZodAny>>>;
        tags: z.ZodOptional<z.ZodDefault<z.ZodArray<z.ZodString, "many">>>;
        notes: z.ZodOptional<z.ZodDefault<z.ZodString>>;
    }, "strip", z.ZodTypeAny, {
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    }, {
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    }>>;
}, "strip", z.ZodTypeAny, {
    type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
    name?: string;
    description?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    };
}, {
    type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
    name?: string;
    description?: string;
    settings?: {
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                description?: string;
                implementation?: string;
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    };
}>;
export declare const AnalyzeArchitectureRequestSchema: z.ZodObject<{
    id: z.ZodString;
    forceReanalysis: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    forceReanalysis?: boolean;
}, {
    id?: string;
    forceReanalysis?: boolean;
}>;
export declare const ArchitectureIdParamSchema: z.ZodObject<{
    id: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id?: string;
}, {
    id?: string;
}>;
export declare const ArchitectureOrganizationIdParamSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const ArchitectureSearchQuerySchema: z.ZodObject<{
    page: z.ZodDefault<z.ZodNumber>;
    limit: z.ZodDefault<z.ZodNumber>;
    sortBy: z.ZodDefault<z.ZodString>;
    sortOrder: z.ZodDefault<z.ZodEnum<["asc", "desc"]>>;
} & {
    search: z.ZodOptional<z.ZodString>;
} & {
    type: z.ZodOptional<z.ZodEnum<["hexagonal", "layered", "microservices", "monolithic", "event_driven"]>>;
    status: z.ZodOptional<z.ZodEnum<["design", "implementation", "testing", "deployed", "maintenance"]>>;
    layerType: z.ZodOptional<z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>>;
    componentType: z.ZodOptional<z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>>;
    isActive: z.ZodOptional<z.ZodBoolean>;
    hasMetrics: z.ZodOptional<z.ZodBoolean>;
    minQualityScore: z.ZodOptional<z.ZodNumber>;
    maxQualityScore: z.ZodOptional<z.ZodNumber>;
    lastAnalysisFrom: z.ZodOptional<z.ZodDate>;
    lastAnalysisTo: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
    status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    layerType?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
    componentType?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
    hasMetrics?: boolean;
    minQualityScore?: number;
    maxQualityScore?: number;
    lastAnalysisFrom?: Date;
    lastAnalysisTo?: Date;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}, {
    type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
    status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
    page?: number;
    limit?: number;
    isActive?: boolean;
    search?: string;
    layerType?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
    componentType?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
    hasMetrics?: boolean;
    minQualityScore?: number;
    maxQualityScore?: number;
    lastAnalysisFrom?: Date;
    lastAnalysisTo?: Date;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}>;
export declare const ArchitectureBulkUpdateSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    updates: z.ZodObject<{
        status: z.ZodOptional<z.ZodEnum<["design", "implementation", "testing", "deployed", "maintenance"]>>;
        patterns: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        tags: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        tags?: string[];
        patterns?: string[];
    }, {
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        tags?: string[];
        patterns?: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    updates?: {
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        tags?: string[];
        patterns?: string[];
    };
    ids?: string[];
}, {
    updates?: {
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        tags?: string[];
        patterns?: string[];
    };
    ids?: string[];
}>;
export declare const ArchitectureBulkDeleteSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    ids?: string[];
}, {
    ids?: string[];
}>;
export declare const ArchitectureComponentResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
    layer: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
    description: z.ZodString;
    dependencies: z.ZodArray<z.ZodString, "many">;
    interfaces: z.ZodArray<z.ZodString, "many">;
    implementation: z.ZodString;
    tests: z.ZodArray<z.ZodString, "many">;
    documentation: z.ZodString;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    implementation?: string;
    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
    dependencies?: string[];
    interfaces?: string[];
    tests?: string[];
    documentation?: string;
}, {
    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    implementation?: string;
    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
    dependencies?: string[];
    interfaces?: string[];
    tests?: string[];
    documentation?: string;
}>;
export declare const ArchitectureLayerResponseSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
    description: z.ZodString;
    components: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
        layer: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
        description: z.ZodString;
        dependencies: z.ZodArray<z.ZodString, "many">;
        interfaces: z.ZodArray<z.ZodString, "many">;
        implementation: z.ZodString;
        tests: z.ZodArray<z.ZodString, "many">;
        documentation: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        implementation?: string;
        layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        dependencies?: string[];
        interfaces?: string[];
        tests?: string[];
        documentation?: string;
    }, {
        type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        implementation?: string;
        layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        dependencies?: string[];
        interfaces?: string[];
        tests?: string[];
        documentation?: string;
    }>, "many">;
    dependencies: z.ZodArray<z.ZodString, "many">;
    responsibilities: z.ZodArray<z.ZodString, "many">;
    patterns: z.ZodArray<z.ZodString, "many">;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    components?: {
        type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        implementation?: string;
        layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        dependencies?: string[];
        interfaces?: string[];
        tests?: string[];
        documentation?: string;
    }[];
    dependencies?: string[];
    responsibilities?: string[];
    patterns?: string[];
}, {
    type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
    name?: string;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    components?: {
        type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        implementation?: string;
        layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        dependencies?: string[];
        interfaces?: string[];
        tests?: string[];
        documentation?: string;
    }[];
    dependencies?: string[];
    responsibilities?: string[];
    patterns?: string[];
}>;
export declare const ArchitectureMetricsResponseSchema: z.ZodObject<{
    totalComponents: z.ZodNumber;
    totalLayers: z.ZodNumber;
    complexity: z.ZodNumber;
    coupling: z.ZodNumber;
    cohesion: z.ZodNumber;
    maintainability: z.ZodNumber;
    testability: z.ZodNumber;
    scalability: z.ZodNumber;
    performance: z.ZodNumber;
    security: z.ZodNumber;
    lastAnalysisDate: z.ZodDate;
    analysisDuration: z.ZodNumber;
    qualityScore: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    security?: number;
    performance?: number;
    complexity?: number;
    lastAnalysisDate?: Date;
    analysisDuration?: number;
    totalComponents?: number;
    totalLayers?: number;
    coupling?: number;
    cohesion?: number;
    maintainability?: number;
    testability?: number;
    scalability?: number;
    qualityScore?: number;
}, {
    security?: number;
    performance?: number;
    complexity?: number;
    lastAnalysisDate?: Date;
    analysisDuration?: number;
    totalComponents?: number;
    totalLayers?: number;
    coupling?: number;
    cohesion?: number;
    maintainability?: number;
    testability?: number;
    scalability?: number;
    qualityScore?: number;
}>;
export declare const ArchitectureResponseSchema: z.ZodObject<{
    id: z.ZodString;
    organizationId: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["hexagonal", "layered", "microservices", "monolithic", "event_driven"]>;
    status: z.ZodEnum<["design", "implementation", "testing", "deployed", "maintenance"]>;
    description: z.ZodOptional<z.ZodString>;
    settings: z.ZodObject<{
        type: z.ZodEnum<["hexagonal", "layered", "microservices", "monolithic", "event_driven"]>;
        layers: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
            description: z.ZodString;
            components: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
                layer: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
                description: z.ZodString;
                dependencies: z.ZodArray<z.ZodString, "many">;
                interfaces: z.ZodArray<z.ZodString, "many">;
                implementation: z.ZodString;
                tests: z.ZodArray<z.ZodString, "many">;
                documentation: z.ZodString;
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }, {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }>, "many">;
            dependencies: z.ZodArray<z.ZodString, "many">;
            responsibilities: z.ZodArray<z.ZodString, "many">;
            patterns: z.ZodArray<z.ZodString, "many">;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }, {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }>, "many">;
        patterns: z.ZodArray<z.ZodString, "many">;
        principles: z.ZodArray<z.ZodString, "many">;
        conventions: z.ZodRecord<z.ZodString, z.ZodAny>;
        tools: z.ZodArray<z.ZodString, "many">;
        frameworks: z.ZodArray<z.ZodString, "many">;
        libraries: z.ZodArray<z.ZodString, "many">;
        customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
        tags: z.ZodArray<z.ZodString, "many">;
        notes: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    }, {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    }>;
    metrics: z.ZodOptional<z.ZodObject<{
        totalComponents: z.ZodNumber;
        totalLayers: z.ZodNumber;
        complexity: z.ZodNumber;
        coupling: z.ZodNumber;
        cohesion: z.ZodNumber;
        maintainability: z.ZodNumber;
        testability: z.ZodNumber;
        scalability: z.ZodNumber;
        performance: z.ZodNumber;
        security: z.ZodNumber;
        lastAnalysisDate: z.ZodDate;
        analysisDuration: z.ZodNumber;
        qualityScore: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        security?: number;
        performance?: number;
        complexity?: number;
        lastAnalysisDate?: Date;
        analysisDuration?: number;
        totalComponents?: number;
        totalLayers?: number;
        coupling?: number;
        cohesion?: number;
        maintainability?: number;
        testability?: number;
        scalability?: number;
        qualityScore?: number;
    }, {
        security?: number;
        performance?: number;
        complexity?: number;
        lastAnalysisDate?: Date;
        analysisDuration?: number;
        totalComponents?: number;
        totalLayers?: number;
        coupling?: number;
        cohesion?: number;
        maintainability?: number;
        testability?: number;
        scalability?: number;
        qualityScore?: number;
    }>>;
    components: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
        layer: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
        description: z.ZodString;
        dependencies: z.ZodArray<z.ZodString, "many">;
        interfaces: z.ZodArray<z.ZodString, "many">;
        implementation: z.ZodString;
        tests: z.ZodArray<z.ZodString, "many">;
        documentation: z.ZodString;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        implementation?: string;
        layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        dependencies?: string[];
        interfaces?: string[];
        tests?: string[];
        documentation?: string;
    }, {
        type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        implementation?: string;
        layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        dependencies?: string[];
        interfaces?: string[];
        tests?: string[];
        documentation?: string;
    }>, "many">;
    layers: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
        description: z.ZodString;
        components: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
            layer: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
            description: z.ZodString;
            dependencies: z.ZodArray<z.ZodString, "many">;
            interfaces: z.ZodArray<z.ZodString, "many">;
            implementation: z.ZodString;
            tests: z.ZodArray<z.ZodString, "many">;
            documentation: z.ZodString;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }, {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }>, "many">;
        dependencies: z.ZodArray<z.ZodString, "many">;
        responsibilities: z.ZodArray<z.ZodString, "many">;
        patterns: z.ZodArray<z.ZodString, "many">;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        components?: {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }[];
        dependencies?: string[];
        responsibilities?: string[];
        patterns?: string[];
    }, {
        type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        components?: {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }[];
        dependencies?: string[];
        responsibilities?: string[];
        patterns?: string[];
    }>, "many">;
    lastAnalysisDate: z.ZodOptional<z.ZodDate>;
    isActive: z.ZodBoolean;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
    status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
    organizationId?: string;
    name?: string;
    metrics?: {
        security?: number;
        performance?: number;
        complexity?: number;
        lastAnalysisDate?: Date;
        analysisDuration?: number;
        totalComponents?: number;
        totalLayers?: number;
        coupling?: number;
        cohesion?: number;
        maintainability?: number;
        testability?: number;
        scalability?: number;
        qualityScore?: number;
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    settings?: {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    };
    components?: {
        type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        implementation?: string;
        layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        dependencies?: string[];
        interfaces?: string[];
        tests?: string[];
        documentation?: string;
    }[];
    layers?: {
        type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        components?: {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }[];
        dependencies?: string[];
        responsibilities?: string[];
        patterns?: string[];
    }[];
    lastAnalysisDate?: Date;
}, {
    type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
    status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
    organizationId?: string;
    name?: string;
    metrics?: {
        security?: number;
        performance?: number;
        complexity?: number;
        lastAnalysisDate?: Date;
        analysisDuration?: number;
        totalComponents?: number;
        totalLayers?: number;
        coupling?: number;
        cohesion?: number;
        maintainability?: number;
        testability?: number;
        scalability?: number;
        qualityScore?: number;
    };
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    isActive?: boolean;
    settings?: {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        tags?: string[];
        notes?: string;
        tools?: string[];
        customFields?: Record<string, any>;
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        patterns?: string[];
        principles?: string[];
        conventions?: Record<string, any>;
        frameworks?: string[];
        libraries?: string[];
    };
    components?: {
        type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        implementation?: string;
        layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        dependencies?: string[];
        interfaces?: string[];
        tests?: string[];
        documentation?: string;
    }[];
    layers?: {
        type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        name?: string;
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        components?: {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }[];
        dependencies?: string[];
        responsibilities?: string[];
        patterns?: string[];
    }[];
    lastAnalysisDate?: Date;
}>;
export declare const ArchitectureListResponseSchema: z.ZodObject<{
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        limit: z.ZodNumber;
        total: z.ZodNumber;
        totalPages: z.ZodNumber;
        hasNext: z.ZodBoolean;
        hasPrev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }, {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    }>;
} & {
    data: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        organizationId: z.ZodString;
        name: z.ZodString;
        type: z.ZodEnum<["hexagonal", "layered", "microservices", "monolithic", "event_driven"]>;
        status: z.ZodEnum<["design", "implementation", "testing", "deployed", "maintenance"]>;
        description: z.ZodOptional<z.ZodString>;
        settings: z.ZodObject<{
            type: z.ZodEnum<["hexagonal", "layered", "microservices", "monolithic", "event_driven"]>;
            layers: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
                description: z.ZodString;
                components: z.ZodArray<z.ZodObject<{
                    id: z.ZodString;
                    name: z.ZodString;
                    type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
                    layer: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
                    description: z.ZodString;
                    dependencies: z.ZodArray<z.ZodString, "many">;
                    interfaces: z.ZodArray<z.ZodString, "many">;
                    implementation: z.ZodString;
                    tests: z.ZodArray<z.ZodString, "many">;
                    documentation: z.ZodString;
                    createdAt: z.ZodDate;
                    updatedAt: z.ZodDate;
                }, "strip", z.ZodTypeAny, {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }, {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }>, "many">;
                dependencies: z.ZodArray<z.ZodString, "many">;
                responsibilities: z.ZodArray<z.ZodString, "many">;
                patterns: z.ZodArray<z.ZodString, "many">;
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                components?: {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }[];
                dependencies?: string[];
                responsibilities?: string[];
                patterns?: string[];
            }, {
                type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                components?: {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }[];
                dependencies?: string[];
                responsibilities?: string[];
                patterns?: string[];
            }>, "many">;
            patterns: z.ZodArray<z.ZodString, "many">;
            principles: z.ZodArray<z.ZodString, "many">;
            conventions: z.ZodRecord<z.ZodString, z.ZodAny>;
            tools: z.ZodArray<z.ZodString, "many">;
            frameworks: z.ZodArray<z.ZodString, "many">;
            libraries: z.ZodArray<z.ZodString, "many">;
            customFields: z.ZodRecord<z.ZodString, z.ZodAny>;
            tags: z.ZodArray<z.ZodString, "many">;
            notes: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
            tags?: string[];
            notes?: string;
            tools?: string[];
            customFields?: Record<string, any>;
            layers?: {
                type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                components?: {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }[];
                dependencies?: string[];
                responsibilities?: string[];
                patterns?: string[];
            }[];
            patterns?: string[];
            principles?: string[];
            conventions?: Record<string, any>;
            frameworks?: string[];
            libraries?: string[];
        }, {
            type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
            tags?: string[];
            notes?: string;
            tools?: string[];
            customFields?: Record<string, any>;
            layers?: {
                type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                components?: {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }[];
                dependencies?: string[];
                responsibilities?: string[];
                patterns?: string[];
            }[];
            patterns?: string[];
            principles?: string[];
            conventions?: Record<string, any>;
            frameworks?: string[];
            libraries?: string[];
        }>;
        metrics: z.ZodOptional<z.ZodObject<{
            totalComponents: z.ZodNumber;
            totalLayers: z.ZodNumber;
            complexity: z.ZodNumber;
            coupling: z.ZodNumber;
            cohesion: z.ZodNumber;
            maintainability: z.ZodNumber;
            testability: z.ZodNumber;
            scalability: z.ZodNumber;
            performance: z.ZodNumber;
            security: z.ZodNumber;
            lastAnalysisDate: z.ZodDate;
            analysisDuration: z.ZodNumber;
            qualityScore: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            security?: number;
            performance?: number;
            complexity?: number;
            lastAnalysisDate?: Date;
            analysisDuration?: number;
            totalComponents?: number;
            totalLayers?: number;
            coupling?: number;
            cohesion?: number;
            maintainability?: number;
            testability?: number;
            scalability?: number;
            qualityScore?: number;
        }, {
            security?: number;
            performance?: number;
            complexity?: number;
            lastAnalysisDate?: Date;
            analysisDuration?: number;
            totalComponents?: number;
            totalLayers?: number;
            coupling?: number;
            cohesion?: number;
            maintainability?: number;
            testability?: number;
            scalability?: number;
            qualityScore?: number;
        }>>;
        components: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
            layer: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
            description: z.ZodString;
            dependencies: z.ZodArray<z.ZodString, "many">;
            interfaces: z.ZodArray<z.ZodString, "many">;
            implementation: z.ZodString;
            tests: z.ZodArray<z.ZodString, "many">;
            documentation: z.ZodString;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }, {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }>, "many">;
        layers: z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            name: z.ZodString;
            type: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
            description: z.ZodString;
            components: z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                name: z.ZodString;
                type: z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>;
                layer: z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>;
                description: z.ZodString;
                dependencies: z.ZodArray<z.ZodString, "many">;
                interfaces: z.ZodArray<z.ZodString, "many">;
                implementation: z.ZodString;
                tests: z.ZodArray<z.ZodString, "many">;
                documentation: z.ZodString;
                createdAt: z.ZodDate;
                updatedAt: z.ZodDate;
            }, "strip", z.ZodTypeAny, {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }, {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }>, "many">;
            dependencies: z.ZodArray<z.ZodString, "many">;
            responsibilities: z.ZodArray<z.ZodString, "many">;
            patterns: z.ZodArray<z.ZodString, "many">;
            createdAt: z.ZodDate;
            updatedAt: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }, {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }>, "many">;
        lastAnalysisDate: z.ZodOptional<z.ZodDate>;
        isActive: z.ZodBoolean;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        organizationId?: string;
        name?: string;
        metrics?: {
            security?: number;
            performance?: number;
            complexity?: number;
            lastAnalysisDate?: Date;
            analysisDuration?: number;
            totalComponents?: number;
            totalLayers?: number;
            coupling?: number;
            cohesion?: number;
            maintainability?: number;
            testability?: number;
            scalability?: number;
            qualityScore?: number;
        };
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
            tags?: string[];
            notes?: string;
            tools?: string[];
            customFields?: Record<string, any>;
            layers?: {
                type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                components?: {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }[];
                dependencies?: string[];
                responsibilities?: string[];
                patterns?: string[];
            }[];
            patterns?: string[];
            principles?: string[];
            conventions?: Record<string, any>;
            frameworks?: string[];
            libraries?: string[];
        };
        components?: {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }[];
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        lastAnalysisDate?: Date;
    }, {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        organizationId?: string;
        name?: string;
        metrics?: {
            security?: number;
            performance?: number;
            complexity?: number;
            lastAnalysisDate?: Date;
            analysisDuration?: number;
            totalComponents?: number;
            totalLayers?: number;
            coupling?: number;
            cohesion?: number;
            maintainability?: number;
            testability?: number;
            scalability?: number;
            qualityScore?: number;
        };
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
            tags?: string[];
            notes?: string;
            tools?: string[];
            customFields?: Record<string, any>;
            layers?: {
                type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                components?: {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }[];
                dependencies?: string[];
                responsibilities?: string[];
                patterns?: string[];
            }[];
            patterns?: string[];
            principles?: string[];
            conventions?: Record<string, any>;
            frameworks?: string[];
            libraries?: string[];
        };
        components?: {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }[];
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        lastAnalysisDate?: Date;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    data?: {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        organizationId?: string;
        name?: string;
        metrics?: {
            security?: number;
            performance?: number;
            complexity?: number;
            lastAnalysisDate?: Date;
            analysisDuration?: number;
            totalComponents?: number;
            totalLayers?: number;
            coupling?: number;
            cohesion?: number;
            maintainability?: number;
            testability?: number;
            scalability?: number;
            qualityScore?: number;
        };
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
            tags?: string[];
            notes?: string;
            tools?: string[];
            customFields?: Record<string, any>;
            layers?: {
                type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                components?: {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }[];
                dependencies?: string[];
                responsibilities?: string[];
                patterns?: string[];
            }[];
            patterns?: string[];
            principles?: string[];
            conventions?: Record<string, any>;
            frameworks?: string[];
            libraries?: string[];
        };
        components?: {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }[];
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        lastAnalysisDate?: Date;
    }[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}, {
    data?: {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        organizationId?: string;
        name?: string;
        metrics?: {
            security?: number;
            performance?: number;
            complexity?: number;
            lastAnalysisDate?: Date;
            analysisDuration?: number;
            totalComponents?: number;
            totalLayers?: number;
            coupling?: number;
            cohesion?: number;
            maintainability?: number;
            testability?: number;
            scalability?: number;
            qualityScore?: number;
        };
        id?: string;
        createdAt?: Date;
        updatedAt?: Date;
        description?: string;
        isActive?: boolean;
        settings?: {
            type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
            tags?: string[];
            notes?: string;
            tools?: string[];
            customFields?: Record<string, any>;
            layers?: {
                type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                components?: {
                    type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                    name?: string;
                    id?: string;
                    createdAt?: Date;
                    updatedAt?: Date;
                    description?: string;
                    implementation?: string;
                    layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                    dependencies?: string[];
                    interfaces?: string[];
                    tests?: string[];
                    documentation?: string;
                }[];
                dependencies?: string[];
                responsibilities?: string[];
                patterns?: string[];
            }[];
            patterns?: string[];
            principles?: string[];
            conventions?: Record<string, any>;
            frameworks?: string[];
            libraries?: string[];
        };
        components?: {
            type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            implementation?: string;
            layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            dependencies?: string[];
            interfaces?: string[];
            tests?: string[];
            documentation?: string;
        }[];
        layers?: {
            type?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
            name?: string;
            id?: string;
            createdAt?: Date;
            updatedAt?: Date;
            description?: string;
            components?: {
                type?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
                name?: string;
                id?: string;
                createdAt?: Date;
                updatedAt?: Date;
                description?: string;
                implementation?: string;
                layer?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
                dependencies?: string[];
                interfaces?: string[];
                tests?: string[];
                documentation?: string;
            }[];
            dependencies?: string[];
            responsibilities?: string[];
            patterns?: string[];
        }[];
        lastAnalysisDate?: Date;
    }[];
    pagination?: {
        page?: number;
        limit?: number;
        total?: number;
        totalPages?: number;
        hasNext?: boolean;
        hasPrev?: boolean;
    };
}>;
export declare const ArchitectureStatsResponseSchema: z.ZodObject<{
    total: z.ZodNumber;
    active: z.ZodNumber;
    inactive: z.ZodNumber;
    createdThisMonth: z.ZodNumber;
    createdThisYear: z.ZodNumber;
    updatedThisMonth: z.ZodNumber;
    updatedThisYear: z.ZodNumber;
} & {
    byType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byStatus: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byLayerType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    byComponentType: z.ZodRecord<z.ZodString, z.ZodNumber>;
    totalComponents: z.ZodNumber;
    totalLayers: z.ZodNumber;
    averageQualityScore: z.ZodNumber;
    averageComplexity: z.ZodNumber;
    averageCoupling: z.ZodNumber;
    averageCohesion: z.ZodNumber;
    averageMaintainability: z.ZodNumber;
    averageTestability: z.ZodNumber;
    averageScalability: z.ZodNumber;
    averagePerformance: z.ZodNumber;
    averageSecurity: z.ZodNumber;
    lastAnalysisDate: z.ZodOptional<z.ZodDate>;
    totalAnalysisTime: z.ZodNumber;
    architecturesWithMetrics: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    active?: number;
    inactive?: number;
    total?: number;
    lastAnalysisDate?: Date;
    byStatus?: Record<string, number>;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
    byType?: Record<string, number>;
    totalComponents?: number;
    totalLayers?: number;
    byLayerType?: Record<string, number>;
    byComponentType?: Record<string, number>;
    averageQualityScore?: number;
    averageComplexity?: number;
    averageCoupling?: number;
    averageCohesion?: number;
    averageMaintainability?: number;
    averageTestability?: number;
    averageScalability?: number;
    averagePerformance?: number;
    averageSecurity?: number;
    totalAnalysisTime?: number;
    architecturesWithMetrics?: number;
}, {
    active?: number;
    inactive?: number;
    total?: number;
    lastAnalysisDate?: Date;
    byStatus?: Record<string, number>;
    createdThisMonth?: number;
    createdThisYear?: number;
    updatedThisMonth?: number;
    updatedThisYear?: number;
    byType?: Record<string, number>;
    totalComponents?: number;
    totalLayers?: number;
    byLayerType?: Record<string, number>;
    byComponentType?: Record<string, number>;
    averageQualityScore?: number;
    averageComplexity?: number;
    averageCoupling?: number;
    averageCohesion?: number;
    averageMaintainability?: number;
    averageTestability?: number;
    averageScalability?: number;
    averagePerformance?: number;
    averageSecurity?: number;
    totalAnalysisTime?: number;
    architecturesWithMetrics?: number;
}>;
export declare const BatchAnalysisRequestSchema: z.ZodObject<{
    ids: z.ZodArray<z.ZodString, "many">;
    forceReanalysis: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    ids?: string[];
    forceReanalysis?: boolean;
}, {
    ids?: string[];
    forceReanalysis?: boolean;
}>;
export declare const ArchitectureReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["hexagonal", "layered", "microservices", "monolithic", "event_driven"]>>;
        status: z.ZodOptional<z.ZodEnum<["design", "implementation", "testing", "deployed", "maintenance"]>>;
        layerType: z.ZodOptional<z.ZodEnum<["domain", "application", "infrastructure", "presentation", "shared"]>>;
        componentType: z.ZodOptional<z.ZodEnum<["entity", "repository", "use_case", "service", "controller", "middleware", "dto", "route"]>>;
        isActive: z.ZodOptional<z.ZodBoolean>;
        hasMetrics: z.ZodOptional<z.ZodBoolean>;
        dateRange: z.ZodOptional<z.ZodEffects<z.ZodObject<{
            startDate: z.ZodOptional<z.ZodDate>;
            endDate: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            startDate?: Date;
            endDate?: Date;
        }, {
            startDate?: Date;
            endDate?: Date;
        }>, {
            startDate?: Date;
            endDate?: Date;
        }, {
            startDate?: Date;
            endDate?: Date;
        }>>;
    }, "strip", z.ZodTypeAny, {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        isActive?: boolean;
        layerType?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        componentType?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        hasMetrics?: boolean;
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    }, {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        isActive?: boolean;
        layerType?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        componentType?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        hasMetrics?: boolean;
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    }>>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    filters?: {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        isActive?: boolean;
        layerType?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        componentType?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        hasMetrics?: boolean;
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    };
}, {
    organizationId?: string;
    filters?: {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        isActive?: boolean;
        layerType?: "infrastructure" | "domain" | "application" | "presentation" | "shared";
        componentType?: "route" | "middleware" | "service" | "entity" | "repository" | "use_case" | "controller" | "dto";
        hasMetrics?: boolean;
        dateRange?: {
            startDate?: Date;
            endDate?: Date;
        };
    };
}>;
export declare const ComponentReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const QualityReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
}, {
    organizationId?: string;
}>;
export declare const AnalysisReportRequestSchema: z.ZodObject<{
    organizationId: z.ZodString;
    startDate: z.ZodDate;
    endDate: z.ZodDate;
    filters: z.ZodOptional<z.ZodObject<{
        type: z.ZodOptional<z.ZodEnum<["hexagonal", "layered", "microservices", "monolithic", "event_driven"]>>;
        status: z.ZodOptional<z.ZodEnum<["design", "implementation", "testing", "deployed", "maintenance"]>>;
        minQualityScore: z.ZodOptional<z.ZodNumber>;
        maxQualityScore: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        minQualityScore?: number;
        maxQualityScore?: number;
    }, {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        minQualityScore?: number;
        maxQualityScore?: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    organizationId?: string;
    filters?: {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        minQualityScore?: number;
        maxQualityScore?: number;
    };
    startDate?: Date;
    endDate?: Date;
}, {
    organizationId?: string;
    filters?: {
        type?: "hexagonal" | "layered" | "microservices" | "monolithic" | "event_driven";
        status?: "testing" | "maintenance" | "design" | "implementation" | "deployed";
        minQualityScore?: number;
        maxQualityScore?: number;
    };
    startDate?: Date;
    endDate?: Date;
}>;
export type CreateArchitectureRequest = z.infer<typeof CreateArchitectureRequestSchema>;
export type UpdateArchitectureRequest = z.infer<typeof UpdateArchitectureRequestSchema>;
export type AnalyzeArchitectureRequest = z.infer<typeof AnalyzeArchitectureRequestSchema>;
export type ArchitectureIdParam = z.infer<typeof ArchitectureIdParamSchema>;
export type ArchitectureOrganizationIdParam = z.infer<typeof ArchitectureOrganizationIdParamSchema>;
export type ArchitectureSearchQuery = z.infer<typeof ArchitectureSearchQuerySchema>;
export type ArchitectureBulkUpdate = z.infer<typeof ArchitectureBulkUpdateSchema>;
export type ArchitectureBulkDelete = z.infer<typeof ArchitectureBulkDeleteSchema>;
export type ArchitectureResponse = z.infer<typeof ArchitectureResponseSchema>;
export type ArchitectureListResponse = z.infer<typeof ArchitectureListResponseSchema>;
export type ArchitectureStatsResponse = z.infer<typeof ArchitectureStatsResponseSchema>;
export type ArchitectureComponentResponse = z.infer<typeof ArchitectureComponentResponseSchema>;
export type ArchitectureLayerResponse = z.infer<typeof ArchitectureLayerResponseSchema>;
export type ArchitectureMetricsResponse = z.infer<typeof ArchitectureMetricsResponseSchema>;
export type BatchAnalysisRequest = z.infer<typeof BatchAnalysisRequestSchema>;
export type ArchitectureReportRequest = z.infer<typeof ArchitectureReportRequestSchema>;
export type ComponentReportRequest = z.infer<typeof ComponentReportRequestSchema>;
export type QualityReportRequest = z.infer<typeof QualityReportRequestSchema>;
export type AnalysisReportRequest = z.infer<typeof AnalysisReportRequestSchema>;
//# sourceMappingURL=architecture.dto.d.ts.map