import { z } from 'zod';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/econeura';
const REQUEST_TIMEOUT = 30000; // 30 seconds

// Error types
export interface ApiError {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  org_id?: string;
  validation_errors?: Array<{
    path: string[];
    message: string;
  }>;
}

export class EcoNeuraApiError extends Error {
  constructor(
    public readonly error: ApiError,
    public readonly response: Response
  ) {
    super(error.detail || error.title);
    this.name = 'EcoNeuraApiError';
  }

  get status() {
    return this.error.status;
  }

  get type() {
    return this.error.type;
  }

  get isValidationError() {
    return this.status === 422 && Array.isArray(this.error.validation_errors);
  }

  get isRateLimited() {
    return this.status === 429;
  }

  get isServerError() {
    return this.status >= 500;
  }
}

// Request configuration
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  cache?: RequestCache;
  idempotencyKey?: string;
}

// Base API client
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const {
      method = 'GET',
      body,
      headers = {},
      cache = 'no-store',
      idempotencyKey,
    } = config;

    const url = `${this.baseUrl}${endpoint}`;
    
    // Prepare headers
    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
      ...headers,
    };

    // Add idempotency key for mutation operations
    if (idempotencyKey && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      requestHeaders['X-Idempotency-Key'] = idempotencyKey;
    }

    // Prepare request body
    const requestBody = body ? JSON.stringify(body) : undefined;

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        cache,
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json') && !contentType?.includes('application/problem+json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return (await response.text()) as T;
      }

      const data = await response.json();

      // Handle error responses
      if (!response.ok) {
        throw new EcoNeuraApiError(data as ApiError, response);
      }

      return data as T;
    } catch (error) {
      if (error instanceof EcoNeuraApiError) {
        throw error;
      }

      // Handle fetch errors (network, timeout, etc.)
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Network error occurred'
      );
    }
  }

  // GET request
  async get<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'POST', body });
  }

  // PUT request
  async put<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PUT', body });
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: unknown, config?: Omit<RequestConfig, 'method'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'PATCH', body });
  }

  // DELETE request
  async delete<T>(endpoint: string, config?: Omit<RequestConfig, 'method' | 'body'>): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Specific API schemas and functions
export const FlowExecutionSchema = z.object({
  id: z.string(),
  flow_type: z.enum(['cobro_proactivo', 'follow_up', 'reminder']),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  input_data: z.record(z.unknown()),
  output_data: z.record(z.unknown()).optional(),
  steps_completed: z.array(z.string()),
  error_message: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  corr_id: z.string(),
});

export const InvoiceSchema = z.object({
  id: z.string(),
  org_id: z.string(),
  customer_id: z.string(),
  amount: z.number(),
  due_date: z.string(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  created_at: z.string(),
  customer_name: z.string().optional(),
  customer_email: z.string().optional(),
});

export type FlowExecution = z.infer<typeof FlowExecutionSchema>;
export type Invoice = z.infer<typeof InvoiceSchema>;

// API functions for CFO dashboard
export const cfoApi = {
  // Start cobro proactivo flow
  async startCobroFlow(customerIds: string[]): Promise<{ corr_id: string; flow_id: string; status: string }> {
    return apiClient.post('/flows/cobro', {
      flow_type: 'cobro_proactivo',
      input_data: {
        customer_ids: customerIds,
        escalation_level: 1,
      },
    }, {
      idempotencyKey: crypto.randomUUID(),
    });
  },

  // Get flow status
  async getFlowStatus(flowId: string): Promise<FlowExecution> {
    const data = await apiClient.get(`/flows/${flowId}/status`);
    return FlowExecutionSchema.parse(data);
  },

  // List flow executions
  async listFlows(params: {
    limit?: number;
    offset?: number;
    status?: string;
    flow_type?: string;
  } = {}): Promise<{
    flows: FlowExecution[];
    pagination: {
      limit: number;
      offset: number;
      total: number;
      has_more: boolean;
    };
  }> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });

    const query = searchParams.toString();
    const data = await apiClient.get(`/flows${query ? `?${query}` : ''}`) as any;
    
    return {
      flows: data.flows.map((flow: unknown) => FlowExecutionSchema.parse(flow)),
      pagination: data.pagination,
    };
  },

  // Cancel flow execution
  async cancelFlow(flowId: string): Promise<{ id: string; status: string; message: string }> {
    return apiClient.post(`/flows/${flowId}/cancel`, {}, {
      idempotencyKey: crypto.randomUUID(),
    });
  },

  // Get provider status
  async getProviderStatus(): Promise<{
    status: 'ok' | 'degraded' | 'error';
    providers: Array<{
      provider: string;
      status: 'available' | 'unavailable' | 'degraded';
      latency_ms: number;
      last_check: string;
      error_message?: string;
    }>;
    summary: {
      available: number;
      total: number;
      availability_percentage: number;
    };
  }> {
    return apiClient.get('/providers/status');
  },
};

// Mock data for development (when backend is not available)
export const mockData = {
  overdueInvoices: [
    {
      id: '1',
      org_id: 'org-demo',
      customer_id: 'cust-1',
      amount: 1250.00,
      due_date: '2024-08-15',
      status: 'overdue' as const,
      created_at: '2024-07-15T10:00:00Z',
      customer_name: 'Diana Wilson',
      customer_email: 'diana.wilson@example.com',
    },
    {
      id: '2',
      org_id: 'org-demo',
      customer_id: 'cust-2',
      amount: 675.30,
      due_date: '2024-08-20',
      status: 'overdue' as const,
      created_at: '2024-07-20T14:30:00Z',
      customer_name: 'Frank Miller',
      customer_email: 'frank.miller@example.com',
    },
  ],
  activeFlows: [
    {
      id: 'flow-1',
      flow_type: 'cobro_proactivo' as const,
      status: 'running' as const,
      input_data: { customer_ids: ['cust-1', 'cust-2'] },
      steps_completed: ['email_draft', 'teams_notification'],
      created_at: '2024-08-27T10:00:00Z',
      updated_at: '2024-08-27T10:15:00Z',
      corr_id: 'corr-123',
      error_message: null,
    },
  ],
  metrics: {
    dso_days: 32,
    emails_drafted: 15,
    emails_sent: 12,
    ai_cost_month: 12.50,
    success_rate: 85.5,
  },
};