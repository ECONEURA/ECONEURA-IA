import { BaseEntity } from './base.js';

// AI Request types
export interface AIRequest {
  prompt: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  metadata?: Record<string, unknown>;
  options?: AIRequestOptions;
}

export interface AIRequestOptions {
  stream?: boolean;
  user?: string;
  functions?: AIFunction[];
  functionCall?: string | { name: string };
  presencePenalty?: number;
  frequencyPenalty?: number;
  topP?: number;
  stop?: string | string[];
}

export interface AIFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

// AI Response types
export interface AIResponse {
  text: string;
  usage: AIUsage;
  model: string;
  latency: number;
  finishReason?: 'stop' | 'length' | 'function_call' | 'content_filter';
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

// AI Model types
export interface AIModel extends BaseEntity {
  provider: 'openai' | 'azure' | 'anthropic' | 'cohere';
  model: string;
  capabilities: string[];
  maxTokens: number;
  pricing: {
    inputTokens: number;
    outputTokens: number;
    currency: string;
  };
  status: 'active' | 'deprecated' | 'maintenance';
  metadata?: Record<string, unknown>;
}
