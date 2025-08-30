interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccess: number;
  size: number;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  evictions: number;
  oldestEntry: number;
  newestEntry: number;
}

class SmartCache {
  private cache = new Map<string, CacheEntry>();
  private readonly maxSize: number;
  private readonly maxEntries: number;
  private readonly cleanupInterval: number;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(
    maxSize = 100 * 1024 * 1024, // 100MB
    maxEntries = 1000,
    cleanupInterval = 5 * 60 * 1000 // 5 minutos
  ) {
    this.maxSize = maxSize;
    this.maxEntries = maxEntries;
    this.cleanupInterval = cleanupInterval;
    
    // Limpieza automática
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  set<T>(key: string, data: T, ttl: number = 60 * 60 * 1000): void {
    const size = this.calculateSize(data);
    
    // Verificar si hay espacio
    if (this.cache.size >= this.maxEntries || this.getTotalSize() + size > this.maxSize) {
      this.evictEntries();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
      accessCount: 0,
      lastAccess: Date.now(),
      size
    };

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.misses++;
      return null;
    }

    // Verificar expiración
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Actualizar estadísticas de acceso
    entry.accessCount++;
    entry.lastAccess = Date.now();
    this.hits++;

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  getStats(): CacheStats {
    const entries = Array.from(this.cache.values());
    const timestamps = entries.map(e => e.timestamp);
    
    return {
      totalEntries: this.cache.size,
      totalSize: this.getTotalSize(),
      hitRate: this.getHitRate(),
      missRate: this.getMissRate(),
      evictions: this.evictions,
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0
    };
  }

  // Caché específico para IA
  setAIResponse(key: string, response: any, model: string, tokens: number): void {
    const ttl = this.calculateAITTL(tokens, model);
    this.set(key, {
      response,
      model,
      tokens,
      cachedAt: Date.now()
    }, ttl);
  }

  getAIResponse(key: string): any | null {
    return this.get(key);
  }

  // Caché específico para búsquedas
  setSearchResults(query: string, results: any[], provider: string): void {
    const key = `search:${query}:${provider}`;
    const ttl = 6 * 60 * 60 * 1000; // 6 horas para búsquedas
    this.set(key, {
      results,
      provider,
      cachedAt: Date.now()
    }, ttl);
  }

  getSearchResults(query: string, provider: string): any[] | null {
    const key = `search:${query}:${provider}`;
    const entry = this.get(key);
    return entry ? entry.results : null;
  }

  // Caché específico para templates
  setPromptTemplate(templateId: string, variables: Record<string, string>, result: any): void {
    const key = `template:${templateId}:${JSON.stringify(variables)}`;
    const ttl = 24 * 60 * 60 * 1000; // 24 horas para templates
    this.set(key, {
      result,
      templateId,
      variables,
      cachedAt: Date.now()
    }, ttl);
  }

  getPromptTemplate(templateId: string, variables: Record<string, string>): any | null {
    const key = `template:${templateId}:${JSON.stringify(variables)}`;
    return this.get(key);
  }

  private calculateSize(data: any): number {
    try {
      return JSON.stringify(data).length;
    } catch {
      return 1024; // Tamaño por defecto si no se puede serializar
    }
  }

  private calculateAITTL(tokens: number, model: string): number {
    // TTL más largo para respuestas más costosas
    const baseTTL = 60 * 60 * 1000; // 1 hora base
    const tokenMultiplier = Math.min(tokens / 1000, 10); // Máximo 10x
    return baseTTL * (1 + tokenMultiplier);
  }

  private getTotalSize(): number {
    return Array.from(this.cache.values()).reduce((total, entry) => total + entry.size, 0);
  }

  private getHitRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? (this.hits / total) * 100 : 0;
  }

  private getMissRate(): number {
    const total = this.hits + this.misses;
    return total > 0 ? (this.misses / total) * 100 : 0;
  }

  private evictEntries(): void {
    const entries = Array.from(this.cache.entries());
    
    // Ordenar por prioridad (menos accedidos y más antiguos primero)
    entries.sort(([, a], [, b]) => {
      const aScore = a.accessCount / (Date.now() - a.lastAccess + 1);
      const bScore = b.accessCount / (Date.now() - b.lastAccess + 1);
      return aScore - bScore;
    });

    // Evictar el 20% de las entradas menos usadas
    const toEvict = Math.ceil(entries.length * 0.2);
    for (let i = 0; i < toEvict; i++) {
      this.cache.delete(entries[i][0]);
      this.evictions++;
    }
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Método para obtener información detallada de una entrada
  getEntryInfo(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;

    return {
      key,
      size: entry.size,
      age: Date.now() - entry.timestamp,
      ttl: entry.ttl,
      accessCount: entry.accessCount,
      lastAccess: entry.lastAccess,
      expiresAt: entry.timestamp + entry.ttl,
      isExpired: Date.now() > entry.timestamp + entry.ttl
    };
  }
}

export const smartCache = new SmartCache();
