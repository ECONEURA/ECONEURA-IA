import { z } from 'zod';
import { 
  AIRequestSchema, 
  ChatCompletionSchema,
  AICostLimitsSchema,
  BaseHeadersSchema,
  validateRequest 
} from '../schemas';

export class AIClient {
  constructor(
    private baseUrl: string,
    private headers: z.infer<typeof BaseHeadersSchema>
  ) {}

  // Chat completions (compatible con OpenAI)
  async createChatCompletion(params: z.infer<typeof ChatCompletionSchema>) {
    const validatedParams = validateRequest(ChatCompletionSchema, params);
    
    const response = await fetch(this.baseUrl + '/ai/chat/completions', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('AI request failed: ' + response.statusText);
    }

    return response.json();
  }

  // Generación simple de texto
  async generate(params: z.infer<typeof AIRequestSchema>) {
    const validatedParams = validateRequest(AIRequestSchema, params);

    const response = await fetch(this.baseUrl + '/ai/generate', {
      method: 'POST', 
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Text generation failed: ' + response.statusText);
    }

    return response.json();
  }

  // Consultar límites de costes
  async getCostLimits() {
    const response = await fetch(this.baseUrl + '/ai/usage/limits', {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get cost limits: ' + response.statusText);
    }

    return validateRequest(AICostLimitsSchema, await response.json());
  }

  // Actualizar límites de costes
  async updateCostLimits(limits: Partial<z.infer<typeof AICostLimitsSchema>>) {
    const response = await fetch(this.baseUrl + '/ai/usage/limits', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(limits),
    });

    if (!response.ok) {
      throw new Error('Failed to update cost limits: ' + response.statusText);
    }

    return response.json();
  }
}
