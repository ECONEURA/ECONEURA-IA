import { z } from 'zod';
import { 
  SendMessageSchema,
  WebhookPayloadSchema,
  IntegrationConfigSchema,
  BaseHeadersSchema,
  validateRequest 
} from '../schemas';

export class IntegrationsClient {
  constructor(
    private baseUrl: string,
    private headers: z.infer<typeof BaseHeadersSchema>
  ) {}

  // Enviar mensaje
  async sendMessage(params: z.infer<typeof SendMessageSchema>) {
    const validatedParams = validateRequest(SendMessageSchema, params);

    const response = await fetch(this.baseUrl + '/channels/send', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to send message: ' + response.statusText);
    }

    return response.json();
  }

  // Recibir webhook
  async handleWebhook(payload: z.infer<typeof WebhookPayloadSchema>) {
    const validatedPayload = validateRequest(WebhookPayloadSchema, payload);

    const response = await fetch(this.baseUrl + '/webhooks', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedPayload),
    });

    if (!response.ok) {
      throw new Error('Failed to handle webhook: ' + response.statusText);
    }

    return response.json();
  }

  // Configurar integración
  async updateIntegrationConfig(type: string, config: z.infer<typeof IntegrationConfigSchema>) {
    const validatedConfig = validateRequest(IntegrationConfigSchema, config);

    const response = await fetch(this.baseUrl + '/integrations/config/' + type, {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedConfig),
    });

    if (!response.ok) {
      throw new Error('Failed to update integration config: ' + response.statusText);
    }

    return response.json();
  }

  // Consultar estado de integración
  async getIntegrationStatus(type: string) {
    const response = await fetch(this.baseUrl + '/integrations/status/' + type, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get integration status: ' + response.statusText);
    }

    return response.json();
  }
}
