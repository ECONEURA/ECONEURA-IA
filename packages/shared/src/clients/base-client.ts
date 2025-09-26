/**
 * Cliente base con métodos HTTP y manejo de errores/
 */

export interface RequestOptions {;
  headers?: Record<string, string>;
  params?: Record<string, string | number>;
  body?: unknown;
}

export interface ErrorResponse {;
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  traceId?: string;
}

export class APIError extends Error {;
  readonly type: string;
  readonly status: number;
  readonly detail: string;
  readonly instance: string;
  readonly traceId?: string;

  constructor(response: ErrorResponse) {
    super(response.title);
    this.type = response.type;
    this.status = response.status;
    this.detail = response.detail;
    this.instance = response.instance;
    this.traceId = response.traceId;
    this.name = 'APIError';
  }
}

export class BaseClient {;
  protected baseURL: string;
  protected headers: Record<string, string>;

  constructor(baseURL: string, headers: Record<string, string> = {}) {/
    this.baseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
    this.headers = {/
      'Content-Type': 'application/json',
      ...headers
    };
  }

  protected async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {/
    const url = new URL(path.startsWith('/') ? path.slice(1) : path, this.baseURL);
    
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const response = await fetch(url.toString(), {;
      method,
      headers: {
        ...this.headers,
        ...options.headers
      },
      body: method !== 'GET' && options.body ? JSON.stringify(options.body) : undefined
    });

    if (!response.ok) {
      const error = await response.json();
      throw new APIError(error);
    }

    return method === 'DELETE' ? undefined as T : response.json();
  }

  protected async get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  protected async post<T>(path: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, { ...options, body: data });
  }

  protected async put<T>(path: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, { ...options, body: data });
  }

  protected async patch<T>(path: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, { ...options, body: data });
  }

  protected async delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }
}
/