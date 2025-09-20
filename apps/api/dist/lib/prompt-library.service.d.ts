import { z } from 'zod';
export declare const PromptDefinitionSchema: z.ZodObject<{
    id: z.ZodString;
    version: z.ZodString;
    content: z.ZodString;
    approved: z.ZodBoolean;
    createdAt: z.ZodString;
    updatedAt: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    version?: string;
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    content?: string;
    approved?: boolean;
}, {
    version?: string;
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: string;
    updatedAt?: string;
    content?: string;
    approved?: boolean;
}>;
export type PromptDefinition = z.infer<typeof PromptDefinitionSchema>;
export declare class PromptLibraryService {
    private prompts;
    private approvedPrompts;
    constructor();
    private initializeDefaultPrompts;
    getPrompt(id: string, version?: string): Promise<PromptDefinition | null>;
    addPrompt(prompt: Omit<PromptDefinition, 'createdAt' | 'updatedAt'>): Promise<void>;
    approvePrompt(id: string, version: string): Promise<void>;
    listPrompts(): Promise<PromptDefinition[]>;
    getApprovedPrompts(): Promise<PromptDefinition[]>;
    getPromptsByCategory(category: string): Promise<PromptDefinition[]>;
    searchPrompts(query: string): Promise<PromptDefinition[]>;
}
export declare const promptLibrary: PromptLibraryService;
//# sourceMappingURL=prompt-library.service.d.ts.map