/**
 * Sistema de middleware para el SDK
 */

export interface Request {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
}

export interface Response {
  status: number;
  headers: Record<string, string>;
  data: unknown;
}

export type NextFunction = () => Promise<Response>;

export type Middleware = (
  request: Request,
  next: NextFunction
) => Promise<Response>;

export class MiddlewareChain {
  private middlewares: Middleware[] = [];

  use(middleware: Middleware): void {
    this.middlewares.push(middleware);
  }

  async execute(request: Request): Promise<Response> {
    const chain = this.middlewares.reduceRight(
      (next: NextFunction, middleware: Middleware) => {
        return () => middleware(request, next);
      },
      async () => {
        // Último middleware - ejecutar la request real
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined
        });

        const data = await response.json();
        return {
          status: response.status,
          headers: Object.fromEntries([...response.headers].map(([key, value]) => [key, value])),
          data
        };
      }
    );

    return chain();
  }
}

// Middleware de timeout
export function timeoutMiddleware(timeoutMs: number): Middleware {
  return async (request, next) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await Promise.race([
        next(),
        new Promise<never>((_, reject) => {
          controller.signal.addEventListener('abort', () => {
            reject(new Error(`Request timed out after ${timeoutMs}ms`));
          });
        })
      ]);

      clearTimeout(timeout);
      return response;
    } finally {
      clearTimeout(timeout);
    }
  };
}

// Middleware de retry
export function retryMiddleware(maxRetries: number = 3): Middleware {
  return async (request, next) => {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await next();
      } catch (error) {
        lastError = error as Error;
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, Math.pow(2, attempt) * 1000)
          );
        }
      }
    }
    
    throw lastError!;
  };
}

// Middleware de caché
export function cacheMiddleware(ttlMs: number): Middleware {
  const cache = new Map<string, { data: Response; expiresAt: number }>();

  return async (request, next) => {
    if (request.method !== 'GET') {
      return next();
    }

    const key = request.url;
    const cached = cache.get(key);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const response = await next();
    cache.set(key, {
      data: response,
      expiresAt: Date.now() + ttlMs
    });

    return response;
  };
}

// Middleware de logging
export function loggingMiddleware(): Middleware {
  return async (request, next) => {
    const startTime = Date.now();

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      console.log(
        `${request.method} ${request.url} - ${response.status} (${duration}ms)`
      );

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `${request.method} ${request.url} - ERROR (${duration}ms):`,
        error
      );
      throw error;
    }
  };
}

// Middleware de métricas
export function metricsMiddleware(
  recordMetric: (name: string, value: number) => void
): Middleware {
  return async (request, next) => {
    const startTime = Date.now();

    try {
      const response = await next();
      const duration = Date.now() - startTime;

      recordMetric('request_duration', duration);
      recordMetric('request_status', response.status);

      return response;
    } catch (error) {
      recordMetric('request_error', 1);
      throw error;
    }
  };
}
