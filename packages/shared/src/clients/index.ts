import { BaseHeadersSchema } from '../schemas';
import { AIClient } from './ai-client';
import { CRMClient } from './crm-client';
import { FlowsClient } from './flows-client';
import { IntegrationsClient } from './integrations-client';
import { AdminClient } from './admin-client';

export interface EcoNeuraClientConfig {
  baseUrl: string;
  headers: {
    'x-org-id': string;
    authorization: string;
    'x-request-id'?: string;
    traceparent?: string;
    'x-idempotency-key'?: string;
  };
}

export class EcoNeuraClient {
  private baseUrl: string;
  private headers: Record<string, string>;

  public ai: AIClient;
  public crm: CRMClient;
  public flows: FlowsClient;
  public integrations: IntegrationsClient;
  public admin: AdminClient;

  constructor(config: EcoNeuraClientConfig) {
    // Validate config
    const headers = BaseHeadersSchema.parse(config.headers);

    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.headers = headers;

    // Initialize domain clients
    this.ai = new AIClient(this.baseUrl, headers);
    this.crm = new CRMClient(this.baseUrl, headers);
    this.flows = new FlowsClient(this.baseUrl, headers);
    this.integrations = new IntegrationsClient(this.baseUrl, headers);
    this.admin = new AdminClient(this.baseUrl, headers);
  }

  // Helpers
  async healthCheck() {
    const response = await fetch(this.baseUrl + '/health', {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Health check failed: ' + response.statusText);
    }

    return response.json();
  }

  async getMetrics() {
    const response = await fetch(this.baseUrl + '/metrics', {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get metrics: ' + response.statusText);
    }

    return response.text(); // Returns Prometheus format
  }
}
