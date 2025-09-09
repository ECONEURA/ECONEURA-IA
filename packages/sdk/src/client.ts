/**
 * ECONEURA SDK Client
 * A lightweight TypeScript client for the ECONEURA API
 */

export interface ClientConfig {
  baseUrl: string;
  accessToken?: string;
  refreshToken?: string;
  onTokenRefresh?: (tokens: { accessToken: string; refreshToken: string }) => void;
  timeout?: number;
  retries?: number;
}

export interface RequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  params?: Record<string, any>;
  query?: Record<string, any>;
  body?: any;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

export interface ApiResponse<T = any> {
  data: T;
  headers: Headers;
  status: number;
  ok: boolean;
}

export class ApiError extends Error {
  public status: number;
  public type: string;
  public detail?: string;
  public traceId?: string;
  public errors?: Record<string, string[]>;

  constructor(status: number, problem: any) {
    super(problem.title || `API Error: ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.type = problem.type || 'about:blank';
    this.detail = problem.detail;
    this.traceId = problem.traceId;
    this.errors = problem.errors;
  }
}

export class ApiClient {
  private config: Required<ClientConfig>;
  private refreshPromise: Promise<void> | null = null;

  constructor(config: ClientConfig) {
    this.config = {
      baseUrl: config.baseUrl.replace(/\/$/, ''),
      accessToken: config.accessToken || '',
      refreshToken: config.refreshToken || '',
      onTokenRefresh: config.onTokenRefresh || (() => {}),
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
    };
  }

  public setAccessToken(token: string) {
    this.config.accessToken = token;
  }

  public setRefreshToken(token: string) {
    this.config.refreshToken = token;
  }

  public async request<T>(options: RequestOptions): Promise<ApiResponse<T>> {
    const url = this.buildUrl(options.path, options.query);
    const headers = this.buildHeaders(options);

    let lastError: any;
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        const response = await fetch(url, {
          method: options.method,
          headers,
          body: options.body ? JSON.stringify(options.body) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Handle 401 and retry with refreshed token
        if (response.status === 401 && !options.skipAuth && this.config.refreshToken) {
          await this.refreshAccessToken();
          // Retry the request with new token
          headers['Authorization'] = `Bearer ${this.config.accessToken}`;
          continue;
        }

        // Parse response
        const contentType = response.headers.get('content-type');
        let data: any = null;

        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else if (response.status !== 204) {
          data = await response.text();
        }

        // Handle errors
        if (!response.ok) {
          throw new ApiError(response.status, data);
        }

        return {
          data,
          headers: response.headers,
          status: response.status,
          ok: response.ok,
        };

      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (except 401)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500 && error.status !== 401) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === this.config.retries) {
          throw error;
        }

        // Exponential backoff
        await this.sleep(Math.min(1000 * Math.pow(2, attempt), 10000));
      }
    }

    throw lastError;
  }

  private buildUrl(path: string, query?: Record<string, any>): string {
    const url = new URL(`${this.config.baseUrl}${path}`);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }

    return url.toString();
  }

  private buildHeaders(options: RequestOptions): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (!options.skipAuth && this.config.accessToken) {
      headers['Authorization'] = `Bearer ${this.config.accessToken}`;
    }

    return headers;
  }

  private async refreshAccessToken(): Promise<void> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.doRefresh();
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<void> {
    const response = await this.request<{
      tokens: {
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
        tokenType: string;
      };
    }>({
      method: 'POST',
      path: '/api/v1/auth/refresh',
      body: { refreshToken: this.config.refreshToken },
      skipAuth: true,
    });

    this.config.accessToken = response.data.tokens.accessToken;
    this.config.refreshToken = response.data.tokens.refreshToken;

    // Notify the app about new tokens
    this.config.onTokenRefresh({
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Convenience methods
  public get<T>(path: string, query?: Record<string, any>, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'GET', path, query });
  }

  public post<T>(path: string, body?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'POST', path, body });
  }

  public put<T>(path: string, body?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'PUT', path, body });
  }

  public patch<T>(path: string, body?: any, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'PATCH', path, body });
  }

  public delete<T>(path: string, options?: Partial<RequestOptions>): Promise<ApiResponse<T>> {
    return this.request<T>({ ...options, method: 'DELETE', path });
  }
}
