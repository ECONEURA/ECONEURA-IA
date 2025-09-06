import { structuredLogger } from '../lib/structured-logger.js';

export interface AIResponse {
  response: string;
  confidence: number;
  model: string;
  timestamp: Date;
}

export class BasicAIService {
  async generateResponse(prompt: string): Promise<AIResponse> {
    try {
      const response = `AI Response to: ${prompt.substring(0, 100)}...`;
      
      return {
        response,
        confidence: 0.85,
        model: 'basic-ai-v1',
        timestamp: new Date()
      };
    } catch (error) {
      structuredLogger.error('Failed to generate AI response', error as Error);
      throw error;
    }
  }
}

export const basicAI = new BasicAIService();
