/**
 * Sistema de caché para el SDK
 */

export interface CacheConfig {
  ttlMs?: number;
  maxSize?: number;
  enabled?: boolean;
}

export interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export interface CacheStore {
  get<T>(key: string): CacheEntry<T> | undefined;
  set<T>(key: string, entry: CacheEntry<T>): void;
  delete(key: string): void;
  clear(): void;
  size(): number;
}

export class MemoryCacheStore implements CacheStore {
  private store = new Map<string, any>();
  private maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get<T>(key: string): CacheEntry<T> | undefined {
    return this.store.get(key);
  }

  set<T>(key: string, entry: CacheEntry<T>): void {
    // Evict oldest entry if cache is full
    if (this.store.size >= this.maxSize) {
      const oldestKey = this.store.keys().next().value;
      this.store.delete(oldestKey);
    }
    this.store.set(key, entry);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }
}

export class CacheManager {
  private store: CacheStore;
  private config: Required<CacheConfig>;

  constructor(
    config: CacheConfig = {},
    store?: CacheStore
  ) {
    this.config = {
      ttlMs: config.ttlMs || 5 * 60 * 1000, // 5 minutos por defecto
      maxSize: config.maxSize || 1000,
      enabled: config.enabled ?? true
    };
    this.store = store || new MemoryCacheStore(this.config.maxSize);
  }

  async get<T>(key: string): Promise<T | undefined> {
    if (!this.config.enabled) return undefined;

    const entry = this.store.get<T>(key);
    if (!entry) return undefined;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.data;
  }

  async set<T>(key: string, data: T, ttlMs?: number): Promise<void> {
    if (!this.config.enabled) return;

    const expiresAt = Date.now() + (ttlMs || this.config.ttlMs);
    this.store.set(key, { data, expiresAt });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  // Helper para usar con funciones asíncronas
  async withCache<T>(
    key: string,
    operation: () => Promise<T>,
    ttlMs?: number
  ): Promise<T> {
    if (!this.config.enabled) return operation();

    const cached = await this.get<T>(key);
    if (cached !== undefined) return cached;

    const data = await operation();
    await this.set(key, data, ttlMs);
    return data;
  }
}
