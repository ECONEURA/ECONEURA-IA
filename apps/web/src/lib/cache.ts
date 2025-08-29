// lib/cache.ts
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class IntelligentCache {
  private cache = new Map<string, CacheEntry>();
  private maxSize = 1000; // Máximo 1000 entradas
  private cleanupInterval = 5 * 60 * 1000; // 5 minutos

  constructor() {
    // Limpieza automática cada 5 minutos
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  set(key: string, data: any, ttl: number = 300000): void { // 5 minutos por defecto
    // Limpiar si alcanzamos el límite
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Verificar si ha expirado
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Métricas del caché
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.calculateHitRate()
    };
  }

  private hitCount = 0;
  private totalRequests = 0;

  private calculateHitRate(): number {
    return this.totalRequests > 0 ? (this.hitCount / this.totalRequests) * 100 : 0;
  }

  // Método para generar claves de caché inteligentes
  generateKey(type: 'chat' | 'image' | 'tts' | 'search', data: any): string {
    const hash = this.simpleHash(JSON.stringify(data));
    return `${type}:${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convertir a 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

export const intelligentCache = new IntelligentCache();
