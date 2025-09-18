import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface BaseClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  apiKey?: string;
  organizationId?: string;
}

export class BaseClient {
  protected client: AxiosInstance;
  protected config: BaseClientConfig;

  constructor(config: BaseClientConfig) {
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ECONEURA-SDK/1.0.0',
        ...config.headers,
      },
    });

    // Add request interceptor for authentication and organization context
    this.client.interceptors.request.use(
      (config) => {
        if (this.config.apiKey) {
          config.headers.Authorization = `Bearer ${this.config.apiKey}`;
        }
        
        if (this.config.organizationId) {
          config.headers['X-Org'] = this.config.organizationId;
        }

        // Add correlation ID for tracing
        config.headers['X-Correlation-Id'] = this.generateCorrelationId();
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error) => {
        if (error.response?.status === 401) {
          throw new Error('Authentication required. Please provide a valid API key.');
        }
        if (error.response?.status === 403) {
          throw new Error('Access forbidden. Check your permissions.');
        }
        if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.response?.status >= 500) {
          throw new Error('Server error. Please try again later.');
        }
        throw error;
      }
    );
  }

  protected async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<ApiResponse<T>>(url, config);
    return this.handleResponse(response);
  }

  protected async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<ApiResponse<T>>(url, data, config);
    return this.handleResponse(response);
  }

  protected async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<ApiResponse<T>>(url, data, config);
    return this.handleResponse(response);
  }

  protected async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<ApiResponse<T>>(url, data, config);
    return this.handleResponse(response);
  }

  protected async delete<T>(url: string, config?: AxiosRequestConfig): Promise<void> {
    const response = await this.client.delete<ApiResponse<T>>(url, config);
    this.handleResponse(response);
  }

  private handleResponse<T>(response: AxiosResponse<ApiResponse<T>>): T {
    const { data } = response.data;
    
    if (!response.data.success) {
      throw new Error(response.data.error || 'Unknown error occurred');
    }
    
    return data as T;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Utility methods
  public setApiKey(apiKey: string): void {
    this.config.apiKey = apiKey;
  }

  public setOrganizationId(organizationId: string): void {
    this.config.organizationId = organizationId;
  }

  public getConfig(): BaseClientConfig {
    return { ...this.config };
  }
}
