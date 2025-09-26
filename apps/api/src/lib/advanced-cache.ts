// Advanced Caching Layer for ECONEURA

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  maxSize?: number; // Maximum number of items
  strategy?: 'lru' | 'lfu' | 'fifo'; // Eviction strategy
  serialize?: boolean; // Whether to serialize/deserialize values
  compress?: boolean; // Whether to compress values
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  hitRate: number;
  size: number;
  maxSize: number;
  memoryUsage: number;
}

export interface CacheItem {
  value: any;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
}

export class AdvancedCache {
  private cache: Map<string, CacheItem> = new Map();
  private options: Required<CacheOptions>;
  private stats: CacheStats;

  constructor(options: CacheOptions = {}) {
    this.options = {
      ttl: options.ttl || 3600, // 1 hour default
      maxSize: options.maxSize || 1000,
      strategy: options.strategy || 'lru',
      serialize: options.serialize || false,
      compress: options.compress || false
    };

    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.options.maxSize,
      memoryUsage: 0
    };

    // Start cleanup interval
    setInterval(() => {
      this.cleanup();
    }, 60000); // Cleanup every minute
  }

  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.options.ttl * 1000) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
  }

  set(key: string, value: any): void {
    const now = Date.now();
    
    if (this.cache.size >= this.options.maxSize && !this.cache.has(key)) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      timestamp: now,
      accessCount: 1,
      lastAccessed: now
    });

    this.stats.sets++;
    this.updateStats();
  }

  get(key: string): any | undefined {
    const item = this.cache.get(key);
    
    if (!item) {
      this.stats.misses++;
      this.updateStats();
      return undefined;
    }

    const now = Date.now();
    if (now - item.timestamp > this.options.ttl * 1000) {
      this.delete(key);
      this.stats.misses++;
      this.updateStats();
      return undefined;
    }

    item.accessCount++;
    item.lastAccessed = now;
    this.stats.hits++;
    this.updateStats();
    
    return item.value;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) {
      this.stats.deletes++;
      this.updateStats();
    }
    return deleted;
  }

  private evict(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string;
    
    switch (this.options.strategy) {
      case 'lru':
        keyToEvict = this.findLRU();
        break;
      case 'lfu':
        keyToEvict = this.findLFU();
        break;
      case 'fifo':
        keyToEvict = this.cache.keys().next().value;
        break;
      default:
        keyToEvict = this.cache.keys().next().value;
    }

    this.cache.delete(keyToEvict);
    this.stats.evictions++;
  }

  private findLRU(): string {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    return oldestKey;
  }

  private findLFU(): string {
    let leastUsedKey = '';
    let leastCount = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.accessCount < leastCount) {
        leastCount = item.accessCount;
        leastUsedKey = key;
      }
    }

    return leastUsedKey;
  }

  private updateStats(): void {
    this.stats.size = this.cache.size;
    this.stats.hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    
    // Estimate memory usage
    let memoryUsage = 0;
    for (const [key, item] of this.cache.entries()) {
      memoryUsage += key.length * 2; // Unicode characters are 2 bytes
      memoryUsage += JSON.stringify(item.value).length * 2;
      memoryUsage += 32; // Overhead for timestamps and counts
    }
    this.stats.memoryUsage = memoryUsage;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      hitRate: 0,
      size: 0,
      maxSize: this.options.maxSize,
      memoryUsage: 0
    };
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  keys(): IterableIterator<string> {
    return this.cache.keys();
  }

  size(): number {
    return this.cache.size;
  }
}

// Export singleton instance
export const advancedCache = new AdvancedCache();
