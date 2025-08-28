import { TimeoutError, NetworkError, RateLimitError } from './errors';

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableErrors?: string[];
}

export interface RetryState {
  attempt: number;
  error: Error;
  willRetry: boolean;
  nextDelayMs?: number;
}

const DEFAULT_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableErrors: [
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'RATE_LIMIT_ERROR'
  ]
};

export function isRetryableError(error: Error, config: RetryConfig): boolean {
  // Errores específicos que siempre son retryables
  if (
    error instanceof TimeoutError ||
    error instanceof NetworkError ||
    error instanceof RateLimitError
  ) {
    return true;
  }

  // Verificar códigos de error configurados
  const errorCodes = config.retryableErrors || DEFAULT_CONFIG.retryableErrors;
  return errorCodes.includes((error as any).code);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let attempt = 0;
  let lastError: Error;

  while (attempt < finalConfig.maxRetries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      attempt++;

      // No reintentar si el error no es retryable
      if (!isRetryableError(lastError, finalConfig)) {
        throw lastError;
      }

      // Calcular delay con backoff exponencial
      const delayMs = Math.min(
        finalConfig.initialDelay * Math.pow(finalConfig.backoffFactor, attempt - 1),
        finalConfig.maxDelay
      );

      // Si es un RateLimitError, usar su retryAfter si está disponible
      if (lastError instanceof RateLimitError && lastError.retryAfter) {
        await sleep(lastError.retryAfter * 1000);
      } else {
        await sleep(delayMs);
      }
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
