// ============================================================================
// ECONEURA API SDK - TYPESCRIPT CLIENT
// ============================================================================

import {
  BaseResponse,
  PaginatedResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  LogoutRequest,
  CreateApiKeyRequest,
  ApiKeyResponse,
  User,
  CreateUserRequest,
  UpdateUserRequest,
  Contact,
  CreateContactRequest,
  UpdateContactRequest,
  Deal,
  CreateDealRequest,
  UpdateDealRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  AIRequest,
  AIResponse,
  Webhook,
  CreateWebhookRequest,
  UpdateWebhookRequest
} from './index.js';

// ============================================================================
// SDK CONFIGURATION
// ============================================================================

export interface SDKConfig {
  baseUrl: string;
  apiKey?: string;
  accessToken?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class SDKError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'SDKError';
  }
}

// ============================================================================
// HTTP CLIENT
// ============================================================================

class HttpClient {
  private config: SDKConfig;
  private defaultHeaders: Record<string, string>;

  constructor(config: SDKConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      retryDelay: 1000,
      ...config
    };

    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'ECONEURA-SDK/1.0.0'
    };

    if (this.config.apiKey) {
      this.defaultHeaders['X-API-Key'] = this.config.apiKey;
    }

    if (this.config.accessToken) {
      this.defaultHeaders['Authorization'] = `Bearer ${this.config.accessToken}`;
    }
  }

  private async request<T>(
    method: string,
    path: string,
    data?: any,
    options: { retries?: number } = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path}`;
    const retries = options.retries ?? this.config.retries ?? 3;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method,
          headers: this.defaultHeaders,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        const responseData = await response.json();

        if (!response.ok) {
          throw new SDKError(
            responseData.message || `HTTP ${response.status}`,
            response.status,
            responseData
          );
        }

        return responseData;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        if (error instanceof SDKError && error.status && error.status < 500) {
          throw error;
        }

        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }
    }

    throw new SDKError('Max retries exceeded');
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, data?: any): Promise<T> {
    return this.request<T>('POST', path, data);
  }

  async put<T>(path: string, data?: any): Promise<T> {
    return this.request<T>('PUT', path, data);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  setAccessToken(token: string): void {
    this.config.accessToken = token;
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
    this.defaultHeaders['X-API-Key'] = apiKey;
  }
}

// ============================================================================
// ECONEURA SDK
// ============================================================================

export class ECONEURASDK {
  private http: HttpClient;

  constructor(config: SDKConfig) {
    this.http = new HttpClient(config);
  }

  // ============================================================================
  // AUTHENTICATION
  // ============================================================================

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.http.post<LoginResponse>('/auth/login', credentials);
    if (response.data?.accessToken) {
      this.http.setAccessToken(response.data.accessToken);
    }
    return response;
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await this.http.post<RefreshTokenResponse>('/auth/refresh', request);
    if (response.data?.accessToken) {
      this.http.setAccessToken(response.data.accessToken);
    }
    return response;
  }

  async logout(request?: LogoutRequest): Promise<BaseResponse> {
    return this.http.post<BaseResponse>('/auth/logout', request);
  }

  async getCurrentUser(): Promise<BaseResponse & { data: User }> {
    return this.http.get<BaseResponse & { data: User }>('/auth/me');
  }

  async createApiKey(request: CreateApiKeyRequest): Promise<BaseResponse & { data: ApiKeyResponse }> {
    return this.http.post<BaseResponse & { data: ApiKeyResponse }>('/auth/api-keys', request);
  }

  // ============================================================================
  // USERS
  // ============================================================================

  async listUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<User>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.http.get<PaginatedResponse<User>>(`/users${query ? `?${query}` : ''}`);
  }

  async getUser(id: string): Promise<BaseResponse & { data: User }> {
    return this.http.get<BaseResponse & { data: User }>(`/users/${id}`);
  }

  async createUser(request: CreateUserRequest): Promise<BaseResponse & { data: User }> {
    return this.http.post<BaseResponse & { data: User }>('/users', request);
  }

  async updateUser(id: string, request: UpdateUserRequest): Promise<BaseResponse & { data: User }> {
    return this.http.put<BaseResponse & { data: User }>(`/users/${id}`, request);
  }

  async deleteUser(id: string): Promise<void> {
    await this.http.delete(`/users/${id}`);
  }

  // ============================================================================
  // CONTACTS (CRM)
  // ============================================================================

  async listContacts(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Contact>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);

    const query = searchParams.toString();
    return this.http.get<PaginatedResponse<Contact>>(`/contacts${query ? `?${query}` : ''}`);
  }

  async getContact(id: string): Promise<BaseResponse & { data: Contact }> {
    return this.http.get<BaseResponse & { data: Contact }>(`/contacts/${id}`);
  }

  async createContact(request: CreateContactRequest): Promise<BaseResponse & { data: Contact }> {
    return this.http.post<BaseResponse & { data: Contact }>('/contacts', request);
  }

  async updateContact(id: string, request: UpdateContactRequest): Promise<BaseResponse & { data: Contact }> {
    return this.http.put<BaseResponse & { data: Contact }>(`/contacts/${id}`, request);
  }

  async deleteContact(id: string): Promise<void> {
    await this.http.delete(`/contacts/${id}`);
  }

  // ============================================================================
  // DEALS (CRM)
  // ============================================================================

  async listDeals(params?: {
    page?: number;
    limit?: number;
    stage?: string;
  }): Promise<PaginatedResponse<Deal>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.stage) searchParams.set('stage', params.stage);

    const query = searchParams.toString();
    return this.http.get<PaginatedResponse<Deal>>(`/deals${query ? `?${query}` : ''}`);
  }

  async getDeal(id: string): Promise<BaseResponse & { data: Deal }> {
    return this.http.get<BaseResponse & { data: Deal }>(`/deals/${id}`);
  }

  async createDeal(request: CreateDealRequest): Promise<BaseResponse & { data: Deal }> {
    return this.http.post<BaseResponse & { data: Deal }>('/deals', request);
  }

  async updateDeal(id: string, request: UpdateDealRequest): Promise<BaseResponse & { data: Deal }> {
    return this.http.put<BaseResponse & { data: Deal }>(`/deals/${id}`, request);
  }

  async deleteDeal(id: string): Promise<void> {
    await this.http.delete(`/deals/${id}`);
  }

  // ============================================================================
  // PRODUCTS (ERP)
  // ============================================================================

  async listProducts(params?: {
    page?: number;
    limit?: number;
    category?: string;
  }): Promise<PaginatedResponse<Product>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.category) searchParams.set('category', params.category);

    const query = searchParams.toString();
    return this.http.get<PaginatedResponse<Product>>(`/products${query ? `?${query}` : ''}`);
  }

  async getProduct(id: string): Promise<BaseResponse & { data: Product }> {
    return this.http.get<BaseResponse & { data: Product }>(`/products/${id}`);
  }

  async createProduct(request: CreateProductRequest): Promise<BaseResponse & { data: Product }> {
    return this.http.post<BaseResponse & { data: Product }>('/products', request);
  }

  async updateProduct(id: string, request: UpdateProductRequest): Promise<BaseResponse & { data: Product }> {
    return this.http.put<BaseResponse & { data: Product }>(`/products/${id}`, request);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.http.delete(`/products/${id}`);
  }

  // ============================================================================
  // ORDERS (ERP)
  // ============================================================================

  async listOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<PaginatedResponse<Order>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.status) searchParams.set('status', params.status);

    const query = searchParams.toString();
    return this.http.get<PaginatedResponse<Order>>(`/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: string): Promise<BaseResponse & { data: Order }> {
    return this.http.get<BaseResponse & { data: Order }>(`/orders/${id}`);
  }

  async createOrder(request: CreateOrderRequest): Promise<BaseResponse & { data: Order }> {
    return this.http.post<BaseResponse & { data: Order }>('/orders', request);
  }

  async updateOrder(id: string, request: UpdateOrderRequest): Promise<BaseResponse & { data: Order }> {
    return this.http.put<BaseResponse & { data: Order }>(`/orders/${id}`, request);
  }

  async deleteOrder(id: string): Promise<void> {
    await this.http.delete(`/orders/${id}`);
  }

  // ============================================================================
  // AI SERVICES
  // ============================================================================

  async aiChat(request: AIRequest): Promise<BaseResponse & { data: AIResponse }> {
    return this.http.post<BaseResponse & { data: AIResponse }>('/ai/chat', request);
  }

  // ============================================================================
  // WEBHOOKS
  // ============================================================================

  async listWebhooks(params?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResponse<Webhook>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());

    const query = searchParams.toString();
    return this.http.get<PaginatedResponse<Webhook>>(`/webhooks${query ? `?${query}` : ''}`);
  }

  async getWebhook(id: string): Promise<BaseResponse & { data: Webhook }> {
    return this.http.get<BaseResponse & { data: Webhook }>(`/webhooks/${id}`);
  }

  async createWebhook(request: CreateWebhookRequest): Promise<BaseResponse & { data: Webhook }> {
    return this.http.post<BaseResponse & { data: Webhook }>('/webhooks', request);
  }

  async updateWebhook(id: string, request: UpdateWebhookRequest): Promise<BaseResponse & { data: Webhook }> {
    return this.http.put<BaseResponse & { data: Webhook }>(`/webhooks/${id}`, request);
  }

  async deleteWebhook(id: string): Promise<void> {
    await this.http.delete(`/webhooks/${id}`);
  }

  // ============================================================================
  // SYSTEM
  // ============================================================================

  async healthCheck(): Promise<BaseResponse & { data: any }> {
    return this.http.get<BaseResponse & { data: any }>('/health');
  }

  async getMetrics(): Promise<BaseResponse & { data: any }> {
    return this.http.get<BaseResponse & { data: any }>('/metrics');
  }

  // ============================================================================
  // UTILITIES
  // ============================================================================

  setAccessToken(token: string): void {
    this.http.setAccessToken(token);
  }

  setApiKey(apiKey: string): void {
    this.http.setApiKey(apiKey);
  }
}

// ============================================================================
// FACTORY FUNCTION
// ============================================================================

export function createSDK(config: SDKConfig): ECONEURASDK {
  return new ECONEURASDK(config);
}

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default ECONEURASDK;
