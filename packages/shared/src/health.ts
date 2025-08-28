/**
 * Sistema de monitoreo de estado para el SDK
 */

export interface HealthStatus {
  healthy: boolean;
  services: Record<string, ServiceStatus>;
  timestamp: number;
  uptime: number;
}

export interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  lastCheck: number;
  error?: string;
}

export interface HealthCheckConfig {
  interval?: number;
  timeout?: number;
  services?: Record<string, ServiceCheck>;
}

export interface ServiceCheck {
  check: () => Promise<void>;
  timeout?: number;
}

export class HealthMonitor {
  private status: HealthStatus;
  private checks: Record<string, ServiceCheck>;
  private interval: number;
  private timeout: number;
  private startTime: number;
  private timer?: NodeJS.Timeout;

  constructor(config: HealthCheckConfig = {}) {
    this.interval = config.interval || 30000; // 30 segundos
    this.timeout = config.timeout || 5000; // 5 segundos
    this.checks = config.services || {};
    this.startTime = Date.now();
    
    this.status = {
      healthy: true,
      services: {},
      timestamp: Date.now(),
      uptime: 0
    };
  }

  addCheck(name: string, check: ServiceCheck): void {
    this.checks[name] = check;
  }

  removeCheck(name: string): void {
    delete this.checks[name];
  }

  private async runCheck(
    name: string,
    check: ServiceCheck
  ): Promise<ServiceStatus> {
    const timeout = check.timeout || this.timeout;
    
    try {
      const startTime = Date.now();
      
      await Promise.race([
        check.check(),
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), timeout);
        })
      ]);

      return {
        status: 'up',
        latency: Date.now() - startTime,
        lastCheck: Date.now()
      };
    } catch (error) {
      return {
        status: 'down',
        lastCheck: Date.now(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async checkAll(): Promise<void> {
    const results = await Promise.all(
      Object.entries(this.checks).map(async ([name, check]) => {
        const status = await this.runCheck(name, check);
        return [name, status] as const;
      })
    );

    this.status = {
      healthy: results.every(([_, status]) => status.status === 'up'),
      services: Object.fromEntries(results),
      timestamp: Date.now(),
      uptime: Date.now() - this.startTime
    };
  }

  start(): void {
    if (this.timer) {
      return;
    }

    // Ejecutar inmediatamente
    this.checkAll();

    // Programar ejecuciones periódicas
    this.timer = setInterval(() => {
      this.checkAll();
    }, this.interval);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  getStatus(): HealthStatus {
    return { ...this.status };
  }

  isHealthy(): boolean {
    return this.status.healthy;
  }

  getServiceStatus(name: string): ServiceStatus | undefined {
    return this.status.services[name];
  }
}

// Helpers para crear health checks comunes
export function createHttpCheck(url: string): ServiceCheck {
  return {
    check: async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
    }
  };
}

export function createApiCheck(
  baseUrl: string,
  endpoint: string,
  headers?: Record<string, string>
): ServiceCheck {
  return {
    check: async () => {
      const response = await fetch(`${baseUrl}${endpoint}`, { headers });
      if (!response.ok) {
        throw new Error(`API ${response.status}`);
      }
    }
  };
}

export function createWebSocketCheck(url: string): ServiceCheck {
  return {
    check: () => new Promise((resolve, reject) => {
      const ws = new WebSocket(url);
      
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        ws.close();
        resolve();
      };

      ws.onerror = () => {
        clearTimeout(timeout);
        reject(new Error('WebSocket connection failed'));
      };
    })
  };
}
