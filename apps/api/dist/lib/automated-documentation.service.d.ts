import { z } from 'zod';
declare const DocumentationSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    type: z.ZodEnum<["API", "ARCHITECTURE", "USER_GUIDE", "RUNBOOK", "CHANGELOG", "README"]>;
    version: z.ZodString;
    content: z.ZodString;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
    status: z.ZodEnum<["DRAFT", "REVIEW", "PUBLISHED", "ARCHIVED"]>;
    tags: z.ZodArray<z.ZodString, "many">;
    author: z.ZodString;
    reviewers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    type?: "API" | "ARCHITECTURE" | "USER_GUIDE" | "RUNBOOK" | "CHANGELOG" | "README";
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
    version?: string;
    metadata?: Record<string, any>;
    title?: string;
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    author?: string;
    reviewers?: string[];
}, {
    type?: "API" | "ARCHITECTURE" | "USER_GUIDE" | "RUNBOOK" | "CHANGELOG" | "README";
    status?: "DRAFT" | "REVIEW" | "PUBLISHED" | "ARCHIVED";
    version?: string;
    metadata?: Record<string, any>;
    title?: string;
    id?: string;
    tags?: string[];
    createdAt?: Date;
    updatedAt?: Date;
    content?: string;
    author?: string;
    reviewers?: string[];
}>;
declare const APIDocumentationSchema: z.ZodObject<{
    id: z.ZodString;
    endpoint: z.ZodString;
    method: z.ZodEnum<["GET", "POST", "PUT", "DELETE", "PATCH"]>;
    description: z.ZodString;
    parameters: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        required: z.ZodBoolean;
        description: z.ZodString;
        example: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        name?: string;
        description?: string;
        required?: boolean;
        example?: any;
    }, {
        type?: string;
        name?: string;
        description?: string;
        required?: boolean;
        example?: any;
    }>, "many">;
    responses: z.ZodArray<z.ZodObject<{
        status: z.ZodNumber;
        description: z.ZodString;
        schema: z.ZodOptional<z.ZodAny>;
    }, "strip", z.ZodTypeAny, {
        status?: number;
        description?: string;
        schema?: any;
    }, {
        status?: number;
        description?: string;
        schema?: any;
    }>, "many">;
    examples: z.ZodOptional<z.ZodArray<z.ZodObject<{
        request: z.ZodAny;
        response: z.ZodAny;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description?: string;
        request?: any;
        response?: any;
    }, {
        description?: string;
        request?: any;
        response?: any;
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    endpoint?: string;
    id?: string;
    description?: string;
    parameters?: {
        type?: string;
        name?: string;
        description?: string;
        required?: boolean;
        example?: any;
    }[];
    responses?: {
        status?: number;
        description?: string;
        schema?: any;
    }[];
    examples?: {
        description?: string;
        request?: any;
        response?: any;
    }[];
}, {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    endpoint?: string;
    id?: string;
    description?: string;
    parameters?: {
        type?: string;
        name?: string;
        description?: string;
        required?: boolean;
        example?: any;
    }[];
    responses?: {
        status?: number;
        description?: string;
        schema?: any;
    }[];
    examples?: {
        description?: string;
        request?: any;
        response?: any;
    }[];
}>;
declare const ArchitectureDocumentationSchema: z.ZodObject<{
    id: z.ZodString;
    component: z.ZodString;
    description: z.ZodString;
    dependencies: z.ZodArray<z.ZodString, "many">;
    interfaces: z.ZodArray<z.ZodObject<{
        name: z.ZodString;
        type: z.ZodString;
        description: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        type?: string;
        name?: string;
        description?: string;
    }, {
        type?: string;
        name?: string;
        description?: string;
    }>, "many">;
    diagrams: z.ZodOptional<z.ZodArray<z.ZodObject<{
        type: z.ZodEnum<["FLOWCHART", "SEQUENCE", "COMPONENT", "DEPLOYMENT"]>;
        content: z.ZodString;
        format: z.ZodEnum<["Mermaid", "PlantUML", "SVG"]>;
    }, "strip", z.ZodTypeAny, {
        type?: "FLOWCHART" | "SEQUENCE" | "COMPONENT" | "DEPLOYMENT";
        content?: string;
        format?: "Mermaid" | "PlantUML" | "SVG";
    }, {
        type?: "FLOWCHART" | "SEQUENCE" | "COMPONENT" | "DEPLOYMENT";
        content?: string;
        format?: "Mermaid" | "PlantUML" | "SVG";
    }>, "many">>;
}, "strip", z.ZodTypeAny, {
    id?: string;
    component?: string;
    description?: string;
    dependencies?: string[];
    interfaces?: {
        type?: string;
        name?: string;
        description?: string;
    }[];
    diagrams?: {
        type?: "FLOWCHART" | "SEQUENCE" | "COMPONENT" | "DEPLOYMENT";
        content?: string;
        format?: "Mermaid" | "PlantUML" | "SVG";
    }[];
}, {
    id?: string;
    component?: string;
    description?: string;
    dependencies?: string[];
    interfaces?: {
        type?: string;
        name?: string;
        description?: string;
    }[];
    diagrams?: {
        type?: "FLOWCHART" | "SEQUENCE" | "COMPONENT" | "DEPLOYMENT";
        content?: string;
        format?: "Mermaid" | "PlantUML" | "SVG";
    }[];
}>;
declare const RunbookSchema: z.ZodObject<{
    id: z.ZodString;
    title: z.ZodString;
    description: z.ZodString;
    procedures: z.ZodArray<z.ZodObject<{
        step: z.ZodNumber;
        title: z.ZodString;
        description: z.ZodString;
        commands: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        expectedResult: z.ZodOptional<z.ZodString>;
        troubleshooting: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        title?: string;
        description?: string;
        step?: number;
        commands?: string[];
        expectedResult?: string;
        troubleshooting?: string;
    }, {
        title?: string;
        description?: string;
        step?: number;
        commands?: string[];
        expectedResult?: string;
        troubleshooting?: string;
    }>, "many">;
    prerequisites: z.ZodArray<z.ZodString, "many">;
    estimatedTime: z.ZodString;
    difficulty: z.ZodEnum<["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"]>;
}, "strip", z.ZodTypeAny, {
    title?: string;
    id?: string;
    description?: string;
    procedures?: {
        title?: string;
        description?: string;
        step?: number;
        commands?: string[];
        expectedResult?: string;
        troubleshooting?: string;
    }[];
    prerequisites?: string[];
    estimatedTime?: string;
    difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
}, {
    title?: string;
    id?: string;
    description?: string;
    procedures?: {
        title?: string;
        description?: string;
        step?: number;
        commands?: string[];
        expectedResult?: string;
        troubleshooting?: string;
    }[];
    prerequisites?: string[];
    estimatedTime?: string;
    difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
}>;
export type Documentation = z.infer<typeof DocumentationSchema>;
export type APIDocumentation = z.infer<typeof APIDocumentationSchema>;
export type ArchitectureDocumentation = z.infer<typeof ArchitectureDocumentationSchema>;
export type Runbook = z.infer<typeof RunbookSchema>;
export interface DocumentationConfig {
    outputDirectory: string;
    templatesDirectory: string;
    autoGenerate: boolean;
    versioning: boolean;
    reviewRequired: boolean;
    notificationChannels: string[];
    formats: string[];
    languages: string[];
}
export interface DocumentationGeneration {
    id: string;
    type: string;
    status: 'RUNNING' | 'COMPLETED' | 'FAILED';
    startTime: Date;
    endTime?: Date;
    filesGenerated: string[];
    errors: string[];
    metadata: Record<string, any>;
}
export declare class AutomatedDocumentationService {
    private config;
    private documentation;
    private apiDocs;
    private architectureDocs;
    private runbooks;
    private generations;
    constructor(config: DocumentationConfig);
    createDocumentation(doc: Omit<Documentation, 'id' | 'createdAt' | 'updatedAt'>): Promise<Documentation>;
    getDocumentation(docId: string): Promise<Documentation | null>;
    listDocumentation(type?: string): Promise<Documentation[]>;
    updateDocumentation(docId: string, updates: Partial<Documentation>): Promise<Documentation | null>;
    deleteDocumentation(docId: string): Promise<boolean>;
    generateAPIDocumentation(): Promise<DocumentationGeneration>;
    generateArchitectureDocumentation(): Promise<DocumentationGeneration>;
    generateUserGuides(): Promise<DocumentationGeneration>;
    generateRunbooks(): Promise<DocumentationGeneration>;
    generateAllDocumentation(): Promise<DocumentationGeneration[]>;
    createRunbook(runbook: Omit<Runbook, 'id'>): Promise<Runbook>;
    getRunbook(runbookId: string): Promise<Runbook | null>;
    listRunbooks(): Promise<Runbook[]>;
    updateRunbook(runbookId: string, updates: Partial<Runbook>): Promise<Runbook | null>;
    deleteRunbook(runbookId: string): Promise<boolean>;
    generateAPIFiles(): Promise<string[]>;
    generateArchitectureFiles(): Promise<string[]>;
    generateUserGuideFiles(): Promise<string[]>;
    generateRunbookFiles(): Promise<string[]>;
    private scanAPIEndpoints;
    private generateEndpointDocumentation;
    private scanArchitectureComponents;
    private generateComponentDocumentation;
    private scanUserModules;
    private generateModuleUserGuide;
    private scanSystemProcedures;
    private generateProcedureRunbook;
    private generateOpenAPISpec;
    private generateAPIDocumentationHTML;
    private generateAPIDocumentationMarkdown;
    private generateArchitectureDocumentationHTML;
    private generateArchitectureDiagrams;
    private generateUserGuideIndex;
    private generateRunbookIndex;
    private generateRunbookContent;
    private writeFile;
    getDocumentationStatistics(): Promise<{
        totalDocuments: number;
        documentsByType: Record<string, number>;
        totalGenerations: number;
        successfulGenerations: number;
        failedGenerations: number;
        lastGeneration: Date | null;
        totalRunbooks: number;
        totalAPIDocs: number;
        totalArchitectureDocs: number;
    }>;
    generateDocumentationReport(period: 'daily' | 'weekly' | 'monthly'): Promise<{
        period: string;
        generatedAt: Date;
        summary: any;
        generations: DocumentationGeneration[];
        documents: Documentation[];
        runbooks: Runbook[];
        recommendations: string[];
    }>;
    private getPeriodMs;
    private generateDocumentationRecommendations;
    private initializeDefaultDocumentation;
}
export default AutomatedDocumentationService;
//# sourceMappingURL=automated-documentation.service.d.ts.map