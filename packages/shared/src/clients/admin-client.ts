import { z } from 'zod';
import { 
  CreateOrgSchema,
  UpdateOrgLimitsSchema,
  UpdateFeatureFlagSchema,
  CreateApiKeySchema,
  BaseHeadersSchema,
  validateRequest 
} from '../schemas';

export class AdminClient {
  constructor(
    private baseUrl: string,
    private headers: z.infer<typeof BaseHeadersSchema>
  ) {}

  // Organizaciones
  async createOrg(params: z.infer<typeof CreateOrgSchema>) {
    const validatedParams = validateRequest(CreateOrgSchema, params);

    const response = await fetch(this.baseUrl + '/admin/organizations', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to create organization: ' + response.statusText);
    }

    return response.json();
  }

  async getOrgDetails(orgId: string) {
    const response = await fetch(this.baseUrl + '/admin/organizations/' + orgId, {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get organization details: ' + response.statusText);
    }

    return response.json();
  }

  async listOrgs(params?: {
    page?: number;
    perPage?: number;
    status?: string;
    plan?: string;
  }) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.perPage) query.append('per_page', params.perPage.toString());
    if (params?.status) query.append('status', params.status);
    if (params?.plan) query.append('plan', params.plan);

    const response = await fetch(this.baseUrl + '/admin/organizations?' + query.toString(), {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to list organizations: ' + response.statusText);
    }

    return response.json();
  }

  // Límites de organización
  async updateOrgLimits(orgId: string, limits: z.infer<typeof UpdateOrgLimitsSchema>) {
    const validatedLimits = validateRequest(UpdateOrgLimitsSchema, limits);

    const response = await fetch(this.baseUrl + '/admin/organizations/' + orgId + '/limits', {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedLimits),
    });

    if (!response.ok) {
      throw new Error('Failed to update organization limits: ' + response.statusText);
    }

    return response.json();
  }

  // Feature flags
  async updateFeatureFlag(orgId: string, flag: string, params: z.infer<typeof UpdateFeatureFlagSchema>) {
    const validatedParams = validateRequest(UpdateFeatureFlagSchema, params);

    const response = await fetch(this.baseUrl + '/admin/organizations/' + orgId + '/features/' + flag, {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to update feature flag: ' + response.statusText);
    }

    return response.json();
  }

  // API keys
  async createApiKey(orgId: string, params: z.infer<typeof CreateApiKeySchema>) {
    const validatedParams = validateRequest(CreateApiKeySchema, params);

    const response = await fetch(this.baseUrl + '/admin/organizations/' + orgId + '/api-keys', {
      method: 'POST',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedParams),
    });

    if (!response.ok) {
      throw new Error('Failed to create API key: ' + response.statusText);
    }

    return response.json();
  }

  async revokeApiKey(orgId: string, keyId: string) {
    const response = await fetch(this.baseUrl + '/admin/organizations/' + orgId + '/api-keys/' + keyId + '/revoke', {
      method: 'POST',
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to revoke API key: ' + response.statusText);
    }

    return response.json();
  }

  async listApiKeys(orgId: string) {
    const response = await fetch(this.baseUrl + '/admin/organizations/' + orgId + '/api-keys', {
      headers: this.headers,
    });

    if (!response.ok) {
      throw new Error('Failed to list API keys: ' + response.statusText);
    }

    return response.json();
  }
}
