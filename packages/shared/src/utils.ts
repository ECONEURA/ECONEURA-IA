import { randomUUID } from 'crypto';

// Generación de IDs únicos
export function generateId(prefix?: string): string {
  return prefix ? `${prefix}_${randomUUID()}` : randomUUID();
}

// Type guards
export function isNonNullable<T>(value: T): value is NonNullable<T> {
  return value !== null && value !== undefined;
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

// Object helpers
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[]
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  keys.forEach((key) => {
    if (key in obj) {
      result[key] = obj[key];
    }
  });
  return result;
}

// Array helpers
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

// String helpers
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Date helpers
export function formatDate(date: Date, locale = 'es-ES'): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'medium'
  }).format(date);
}

// Validation helpers
export function validateEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

export function validatePhone(phone: string): boolean {
  const regex = /^\+?[\d\s-]{8,}$/;
  return regex.test(phone);
}

// Retry helper
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    attempts: number;
    delay: number;
    backoff?: number;
    onError?: (error: Error, attempt: number) => void;
  }
): Promise<T> {
  const { attempts, delay, backoff = 2, onError } = options;
  
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === attempts) {
        throw error;
      }
      
      if (onError && error instanceof Error) {
        onError(error, attempt);
      }
      
      await new Promise(resolve => 
        setTimeout(resolve, delay * Math.pow(backoff, attempt - 1))
      );
    }
  }
  
  throw new Error('Retry failed');
}

// Safe JSON parse
export function safeJsonParse<T>(value: string): T | null {
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

// Async helpers
export async function asyncFilter<T>(
  array: T[],
  predicate: (item: T) => Promise<boolean>
): Promise<T[]> {
  const results = await Promise.all(
    array.map(async item => ({
      item,
      pass: await predicate(item)
    }))
  );
  
  return results
    .filter(({ pass }) => pass)
    .map(({ item }) => item);
}
