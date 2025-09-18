import { z } from 'zod';
declare const TemplateEngineConfigSchema: z.ZodObject<{
    engine: z.ZodEnum<["handlebars", "mustache", "simple"]>;
    defaultLanguage: z.ZodDefault<z.ZodString>;
    supportedLanguages: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    cacheEnabled: z.ZodDefault<z.ZodBoolean>;
    cacheSize: z.ZodDefault<z.ZodNumber>;
    strictMode: z.ZodDefault<z.ZodBoolean>;
    escapeHtml: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    engine?: "handlebars" | "mustache" | "simple";
    defaultLanguage?: string;
    supportedLanguages?: string[];
    cacheEnabled?: boolean;
    cacheSize?: number;
    strictMode?: boolean;
    escapeHtml?: boolean;
}, {
    engine?: "handlebars" | "mustache" | "simple";
    defaultLanguage?: string;
    supportedLanguages?: string[];
    cacheEnabled?: boolean;
    cacheSize?: number;
    strictMode?: boolean;
    escapeHtml?: boolean;
}>;
declare const TemplateSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["email", "sms", "push", "in_app", "webhook"]>;
    language: z.ZodString;
    subject: z.ZodOptional<z.ZodString>;
    body: z.ZodString;
    variables: z.ZodArray<z.ZodString, "many">;
    isActive: z.ZodDefault<z.ZodBoolean>;
    version: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "push" | "email" | "sms" | "webhook" | "in_app";
    id?: string;
    createdAt?: Date;
    isActive?: boolean;
    updatedAt?: Date;
    version?: number;
    name?: string;
    description?: string;
    subject?: string;
    language?: string;
    body?: string;
    variables?: string[];
}, {
    type?: "push" | "email" | "sms" | "webhook" | "in_app";
    id?: string;
    createdAt?: Date;
    isActive?: boolean;
    updatedAt?: Date;
    version?: number;
    name?: string;
    description?: string;
    subject?: string;
    language?: string;
    body?: string;
    variables?: string[];
}>;
declare const TemplateRenderRequestSchema: z.ZodObject<{
    templateId: z.ZodString;
    language: z.ZodOptional<z.ZodString>;
    variables: z.ZodRecord<z.ZodString, z.ZodAny>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    options: z.ZodOptional<z.ZodObject<{
        escapeHtml: z.ZodOptional<z.ZodBoolean>;
        strictMode: z.ZodOptional<z.ZodBoolean>;
        fallbackLanguage: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        strictMode?: boolean;
        escapeHtml?: boolean;
        fallbackLanguage?: string;
    }, {
        strictMode?: boolean;
        escapeHtml?: boolean;
        fallbackLanguage?: string;
    }>>;
}, "strip", z.ZodTypeAny, {
    options?: {
        strictMode?: boolean;
        escapeHtml?: boolean;
        fallbackLanguage?: string;
    };
    context?: Record<string, any>;
    language?: string;
    templateId?: string;
    variables?: Record<string, any>;
}, {
    options?: {
        strictMode?: boolean;
        escapeHtml?: boolean;
        fallbackLanguage?: string;
    };
    context?: Record<string, any>;
    language?: string;
    templateId?: string;
    variables?: Record<string, any>;
}>;
export interface TemplateEngineConfig {
    engine: 'handlebars' | 'mustache' | 'simple';
    defaultLanguage: string;
    supportedLanguages: string[];
    cacheEnabled: boolean;
    cacheSize: number;
    strictMode: boolean;
    escapeHtml: boolean;
}
export interface Template {
    id: string;
    name: string;
    description?: string;
    type: 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
    language: string;
    subject?: string;
    body: string;
    variables: string[];
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface TemplateRenderRequest {
    templateId: string;
    language?: string;
    variables: Record<string, any>;
    context?: Record<string, any>;
    options?: {
        escapeHtml?: boolean;
        strictMode?: boolean;
        fallbackLanguage?: string;
    };
}
export interface TemplateRenderResult {
    subject?: string;
    body: string;
    language: string;
    templateId: string;
    variables: Record<string, any>;
    metadata: {
        engine: string;
        renderTime: number;
        cacheHit: boolean;
        warnings: string[];
    };
}
export interface ITemplateEngine {
    render(request: TemplateRenderRequest): Promise<TemplateRenderResult>;
    validateTemplate(template: Template): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    getTemplate(templateId: string, language?: string): Promise<Template | null>;
    listTemplates(type?: string, language?: string): Promise<Template[]>;
    clearCache(): Promise<void>;
}
export declare class HandlebarsEngine implements ITemplateEngine {
    private config;
    private templates;
    private compiledTemplates;
    private cache;
    constructor(config: TemplateEngineConfig);
    render(request: TemplateRenderRequest): Promise<TemplateRenderResult>;
    validateTemplate(template: Template): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    getTemplate(templateId: string, language?: string): Promise<Template | null>;
    listTemplates(type?: string, language?: string): Promise<Template[]>;
    clearCache(): Promise<void>;
    private compileHandlebarsTemplate;
    private extractHandlebarsVariables;
    private generateCacheKey;
    private cleanupCache;
    private initializeDefaultTemplates;
}
export declare class MustacheEngine implements ITemplateEngine {
    private config;
    private templates;
    private cache;
    constructor(config: TemplateEngineConfig);
    render(request: TemplateRenderRequest): Promise<TemplateRenderResult>;
    validateTemplate(template: Template): Promise<{
        valid: boolean;
        errors: string[];
    }>;
    getTemplate(templateId: string, language?: string): Promise<Template | null>;
    listTemplates(type?: string, language?: string): Promise<Template[]>;
    clearCache(): Promise<void>;
    private renderMustacheTemplate;
    private generateCacheKey;
    private cleanupCache;
    private initializeDefaultTemplates;
}
export declare class TemplateEngineFactory {
    static create(config: TemplateEngineConfig): ITemplateEngine;
}
export { TemplateEngineConfigSchema, TemplateSchema, TemplateRenderRequestSchema };
//# sourceMappingURL=template-engine.d.ts.map