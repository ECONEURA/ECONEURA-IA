/**
 * Type assertion to ensure value is defined
 */
export function assertDefined<T>(
  value: T | undefined | null,
  message = 'Value is undefined'
): asserts value is T {
  if (value === undefined || value === null) {
    throw new Error(message);
  }
}

/**
 * Type assertion to ensure value is truthy
 */
export function assertTrue(
  value: unknown,
  message = 'Assertion failed'
): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

/**
 * Delay execution for specified milliseconds
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    shouldRetry?: (error: unknown) => boolean;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    shouldRetry = () => true
  } = options;

  let attempt = 1;
  let currentDelay = initialDelay;

  while (true) {
    try {
      return await fn();
    } catch (error) {
      if (attempt >= maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      await delay(currentDelay);
      currentDelay = Math.min(currentDelay * backoffFactor, maxDelay);
      attempt++;
    }
  }
}

/**
 * Wrap a promise with a timeout
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  message = 'Operation timed out'
): Promise<T> {
  const timeoutPromise = delay(timeoutMs).then(() => {
    throw new Error(message);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Memoize a function
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  options: {
    maxSize?: number;
    ttl?: number;
  } = {}
): T {
  const { maxSize = 100, ttl } = options;
  const cache = new Map<string, { value: any; timestamp: number }>();

  return ((...args: Parameters<T>): ReturnType<T> => {
    const key = JSON.stringify(args);
    const now = Date.now();

    if (cache.has(key)) {
      const entry = cache.get(key)!;
      if (!ttl || now - entry.timestamp < ttl) {
        return entry.value;
      }
      cache.delete(key);
    }

    const value = fn(...args);
    cache.set(key, { value, timestamp: now });

    if (cache.size > maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }

    return value;
  }) as T;
}

/**
 * Chunk an array into smaller arrays
 */
export function chunk<T>(array: T[], size: number): T[][] {
  return array.reduce((chunks, item, index) => {
    const chunkIndex = Math.floor(index / size);
    
    if (!chunks[chunkIndex]) {
      chunks[chunkIndex] = [];
    }
    
    chunks[chunkIndex].push(item);
    return chunks;
  }, [] as T[][]);
}

/**
 * Debounce a function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined;

  return (...args: Parameters<T>): void => {
    const later = () => {
      clearTimeout(timeout);
      fn(...args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle a function
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  wait: number
): (...args: Parameters<T>) => void {
  let isThrottled = false;
  let lastArgs: Parameters<T> | undefined;

  return (...args: Parameters<T>): void => {
    if (isThrottled) {
      lastArgs = args;
      return;
    }

    fn(...args);
    isThrottled = true;

    setTimeout(() => {
      isThrottled = false;
      if (lastArgs) {
        fn(...lastArgs);
        lastArgs = undefined;
      }
    }, wait);
  };
}
