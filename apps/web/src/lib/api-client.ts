interface ProxyConfig {
  enabled: boolean;
  baseUrl: string;
  healthCheckUrl: string;
}

class ProxyManager {
  private static instance: ProxyManager;
  private config: ProxyConfig = {
    enabled: false,
    baseUrl: 'http://localhost:3001',
    healthCheckUrl: 'http://localhost:3001/healthz'
  };

  private constructor() {}

  static getInstance(): ProxyManager {
    if (!ProxyManager.instance) {
      ProxyManager.instance = new ProxyManager();
    }
    return ProxyManager.instance;
  }

  async checkProxyHealth(): Promise<boolean> {
    try {
      const response = await fetch(this.config.healthCheckUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async detectAndEnableProxy(): Promise<boolean> {
    const isHealthy = await this.checkProxyHealth();
    this.config.enabled = isHealthy;
    return isHealthy;
  }

  isProxyEnabled(): boolean {
    return this.config.enabled;
  }

  getProxyUrl(originalUrl: string): string {
    if (!this.config.enabled) return originalUrl;

    // Convert relative URLs to proxy URLs
    if (originalUrl.startsWith('/api/')) {
      return `${this.config.baseUrl}${originalUrl}`;
    }

    return originalUrl;
  }

  async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const proxyUrl = this.getProxyUrl(endpoint);

    return fetch(proxyUrl, {
      ...options,
      headers: {
        ...options.headers,
        'x-correlation-id': Date.now().toString(16),
      }
    });
  }
}

export class ApiClient {
  private static proxyManager = ProxyManager.getInstance();

  static async initProxyDetection(): Promise<boolean> {
    return await this.proxyManager.detectAndEnableProxy();
  }

  static isProxyEnabled(): boolean {
    return this.proxyManager.isProxyEnabled();
  }

  static async get(endpoint: string, options: RequestInit = {}) {
    const response = await this.proxyManager.makeRequest(endpoint, {
      method: 'GET',
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async post(endpoint: string, data: any, options: RequestInit = {}) {
    const response = await this.proxyManager.makeRequest(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async put(endpoint: string, data: any, options: RequestInit = {}) {
    const response = await this.proxyManager.makeRequest(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify(data),
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  static async delete(endpoint: string, options: RequestInit = {}) {
    const response = await this.proxyManager.makeRequest(endpoint, {
      method: 'DELETE',
      ...options
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}