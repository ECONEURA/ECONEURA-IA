import { z } from 'zod';
import { structuredLogger } from './structured-logger.js';

export const PromptDefinitionSchema = z.object({
  id: z.string(),
  version: z.string(),
  content: z.string(),
  approved: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
  metadata: z.record(z.any()).optional()
});

export type PromptDefinition = z.infer<typeof PromptDefinitionSchema>;

export class PromptLibraryService {
  private prompts: Map<string, PromptDefinition[]> = new Map();
  private approvedPrompts: Map<string, PromptDefinition> = new Map();

  constructor() {
    this.initializeDefaultPrompts();
  }

  private initializeDefaultPrompts(): void {
    const defaultPrompts = [
      {
        id: 'sales-email',
        version: '1.0.0',
        content: 'Generate a professional sales email for {product} targeting {audience}',
        approved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { category: 'sales', language: 'en' }
      },
      {
        id: 'customer-support',
        version: '1.0.0',
        content: 'Provide helpful customer support response for {issue} with {tone} tone',
        approved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { category: 'support', language: 'en' }
      },
      {
        id: 'meeting-summary',
        version: '1.0.0',
        content: 'Create a concise meeting summary highlighting key decisions and action items',
        approved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { category: 'meetings', language: 'en' }
      },
      {
        id: 'product-description',
        version: '1.0.0',
        content: 'Write an engaging product description for {product} highlighting {features}',
        approved: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: { category: 'marketing', language: 'en' }
      }
    ];

    defaultPrompts.forEach(prompt => {
      this.addPrompt(prompt);
    });
  }

  async getPrompt(id: string, version?: string): Promise<PromptDefinition | null> {
    const promptVersions = this.prompts.get(id);
    if (!promptVersions) return null;

    if (version) {
      return promptVersions.find(p => p.version === version) || null;
    }

    // Return latest approved version
    const approved = this.approvedPrompts.get(id);
    if (approved) return approved;

    // Return latest version if no approved version
    return promptVersions[promptVersions.length - 1] || null;
  }

  async addPrompt(prompt: Omit<PromptDefinition, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = new Date().toISOString();
    const newPrompt: PromptDefinition = {
      ...prompt,
      createdAt: now,
      updatedAt: now
    };

    const existing = this.prompts.get(prompt.id) || [];
    existing.push(newPrompt);
    this.prompts.set(prompt.id, existing);

    if (prompt.approved) {
      this.approvedPrompts.set(prompt.id, newPrompt);
    }

    structuredLogger.info('Prompt added to library', {
      promptId: prompt.id,
      version: prompt.version,
      approved: prompt.approved
    });
  }

  async approvePrompt(id: string, version: string): Promise<void> {
    const prompt = await this.getPrompt(id, version);
    if (!prompt) {
      throw new Error(`Prompt ${id} version ${version} not found`);
    }

    const approvedPrompt: PromptDefinition = {
      ...prompt,
      approved: true,
      updatedAt: new Date().toISOString()
    };

    this.approvedPrompts.set(id, approvedPrompt);

    // Update in versions array
    const versions = this.prompts.get(id) || [];
    const versionIndex = versions.findIndex(p => p.version === version);
    if (versionIndex >= 0) {
      versions[versionIndex] = approvedPrompt;
      this.prompts.set(id, versions);
    }

    structuredLogger.info('Prompt approved', {
      promptId: id,
      version: version
    });
  }

  async listPrompts(): Promise<PromptDefinition[]> {
    const allPrompts: PromptDefinition[] = [];
    for (const versions of this.prompts.values()) {
      allPrompts.push(...versions);
    }
    return allPrompts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getApprovedPrompts(): Promise<PromptDefinition[]> {
    return Array.from(this.approvedPrompts.values());
  }

  async getPromptsByCategory(category: string): Promise<PromptDefinition[]> {
    const allPrompts = await this.listPrompts();
    return allPrompts.filter(prompt => prompt.metadata?.category === category);
  }

  async searchPrompts(query: string): Promise<PromptDefinition[]> {
    const allPrompts = await this.listPrompts();
    const lowercaseQuery = query.toLowerCase();
    
    return allPrompts.filter(prompt => 
      prompt.content.toLowerCase().includes(lowercaseQuery) ||
      prompt.id.toLowerCase().includes(lowercaseQuery) ||
      (prompt.metadata?.category && prompt.metadata.category.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const promptLibrary = new PromptLibraryService();
