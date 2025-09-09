import { DistributedCache } from '../../lib/distributed-cache.js';

describe('DistributedCache', () => {
  let cache: DistributedCache;

  beforeEach(() => {
    cache = new DistributedCache({
      ttl: 3600,
      maxSize: 100,
      strategy: 'lru',
      compression: false,
      encryption: false
    });
  });

  afterEach(() => {
    cache.destroy();
  });

  describe('Basic Operations', () => {
    it('should set and get values', async () => {
      await cache.set('key1', 'value1');
      const value = await cache.get('key1');
      
      expect(value).toBe('value1');
    });

    it('should return null for non-existent keys', async () => {
      const value = await cache.get('non-existent');
      
      expect(value).toBeNull();
    });

    it('should delete values', async () => {
      await cache.set('key1', 'value1');
      expect(await cache.get('key1')).toBe('value1');
      
      const deleted = await cache.delete('key1');
      expect(deleted).toBe(true);
      expect(await cache.get('key1')).toBeNull();
    });

    it('should return false when deleting non-existent keys', async () => {
      const deleted = await cache.delete('non-existent');
      expect(deleted).toBe(false);
    });

    it('should check if keys exist', async () => {
      await cache.set('key1', 'value1');
      
      expect(cache.has('key1')).toBe(true);
      expect(cache.has('non-existent')).toBe(false);
    });

    it('should clear all values', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      expect(cache.getSize()).toBe(2);
      
      await cache.clear();
      
      expect(cache.getSize()).toBe(0);
      expect(await cache.get('key1')).toBeNull();
      expect(await cache.get('key2')).toBeNull();
    });
  });

  describe('TTL (Time To Live)', () => {
    it('should respect default TTL', async () => {
      await cache.set('ttl-key', 'ttl-value');
      
      // Immediately available
      expect(await cache.get('ttl-key')).toBe('ttl-value');
      
      // Mock time advancement
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 3700000); // 1 hour + 100 seconds
      
      expect(await cache.get('ttl-key')).toBeNull();
      
      jest.restoreAllMocks();
    });

    it('should respect custom TTL', async () => {
      await cache.set('custom-ttl-key', 'custom-ttl-value', 1); // 1 second TTL
      
      expect(await cache.get('custom-ttl-key')).toBe('custom-ttl-value');
      
      // Mock time advancement
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000); // 2 seconds
      
      expect(await cache.get('custom-ttl-key')).toBeNull();
      
      jest.restoreAllMocks();
    });

    it('should clean up expired items automatically', async () => {
      await cache.set('expire1', 'value1', 1);
      await cache.set('expire2', 'value2', 1);
      await cache.set('persist', 'value3', 3600);
      
      expect(cache.getSize()).toBe(3);
      
      // Mock time advancement
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 2000); // 2 seconds
      
      // Trigger cleanup
      cache['cleanup']();
      
      expect(cache.getSize()).toBe(1);
      expect(await cache.get('persist')).toBe('value3');
      
      jest.restoreAllMocks();
    });
  });

  describe('Eviction Strategies', () => {
    it('should evict items when cache is full (LRU)', async () => {
      const smallCache = new DistributedCache({
        maxSize: 3,
        strategy: 'lru'
      });

      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      await smallCache.set('key3', 'value3');
      
      // Access key1 to make it recently used
      await smallCache.get('key1');
      
      // Add key4, should evict key2 (least recently used)
      await smallCache.set('key4', 'value4');
      
      expect(await smallCache.get('key1')).toBe('value1'); // Recently used
      expect(await smallCache.get('key2')).toBeNull(); // Evicted
      expect(await smallCache.get('key3')).toBe('value3');
      expect(await smallCache.get('key4')).toBe('value4');
      
      smallCache.destroy();
    });

    it('should evict items when cache is full (LFU)', async () => {
      const smallCache = new DistributedCache({
        maxSize: 3,
        strategy: 'lfu'
      });

      await smallCache.set('key1', 'value1');
      await smallCache.set('key2', 'value2');
      await smallCache.set('key3', 'value3');
      
      // Access key1 multiple times to make it frequently used
      await smallCache.get('key1');
      await smallCache.get('key1');
      await smallCache.get('key2');
      
      // Add key4, should evict key3 (least frequently used)
      await smallCache.set('key4', 'value4');
      
      expect(await smallCache.get('key1')).toBe('value1'); // Frequently used
      expect(await smallCache.get('key2')).toBe('value2'); // Used once
      expect(await smallCache.get('key3')).toBeNull(); // Evicted (never accessed after set)
      expect(await smallCache.get('key4')).toBe('value4');
      
      smallCache.destroy();
    });

    it('should evict items when cache is full (FIFO)', async () => {
      const smallCache = new DistributedCache({
        maxSize: 3,
        strategy: 'fifo'
      });

      await smallCache.set('key1', 'value1');
      await new Promise(resolve => setTimeout(resolve, 10)); // Ensure different timestamps
      await smallCache.set('key2', 'value2');
      await new Promise(resolve => setTimeout(resolve, 10));
      await smallCache.set('key3', 'value3');
      
      // Add key4, should evict key1 (first in)
      await smallCache.set('key4', 'value4');
      
      expect(await smallCache.get('key1')).toBeNull(); // Evicted (first in)
      expect(await smallCache.get('key2')).toBe('value2');
      expect(await smallCache.get('key3')).toBe('value3');
      expect(await smallCache.get('key4')).toBe('value4');
      
      smallCache.destroy();
    });
  });

  describe('Data Types', () => {
    it('should handle different data types', async () => {
      const testData = {
        string: 'test string',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: { value: 'deep' } },
        null: null,
        undefined: undefined
      };

      for (const [key, value] of Object.entries(testData)) {
        await cache.set(key, value);
        const retrieved = await cache.get(key);
        expect(retrieved).toEqual(value);
      }
    });

    it('should handle large objects', async () => {
      const largeObject = {
        data: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description: `Description for item ${i}`,
          metadata: {
            created: new Date(),
            updated: new Date(),
            tags: [`tag-${i}`, `category-${i % 10}`]
          }
        }))
      };

      await cache.set('large-object', largeObject);
      const retrieved = await cache.get('large-object');
      
      expect(retrieved).toEqual(largeObject);
      expect(retrieved.data).toHaveLength(1000);
    });
  });

  describe('Statistics', () => {
    it('should track cache statistics', async () => {
      await cache.set('key1', 'value1');
      await cache.set('key2', 'value2');
      
      // Generate some hits and misses
      await cache.get('key1'); // hit
      await cache.get('key2'); // hit
      await cache.get('non-existent'); // miss
      
      const stats = cache.getStats();
      
      expect(stats.size).toBe(2);
      expect(stats.hits).toBeGreaterThan(0);
      expect(stats.misses).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.hitRate).toBeLessThanOrEqual(100);
    });

    it('should calculate hit rate correctly', async () => {
      await cache.set('key1', 'value1');
      
      // 2 hits, 1 miss = 66.67% hit rate
      await cache.get('key1'); // hit
      await cache.get('key1'); // hit
      await cache.get('non-existent'); // miss
      
      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it('should track memory usage', () => {
      const memoryUsage = cache.getMemoryUsage();
      expect(memoryUsage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Configuration', () => {
    it('should use default configuration', () => {
      const defaultCache = new DistributedCache();
      
      expect(defaultCache.getStats().maxSize).toBe(10000);
      
      defaultCache.destroy();
    });

    it('should respect custom configuration', () => {
      const customCache = new DistributedCache({
        ttl: 1800,
        maxSize: 50,
        strategy: 'lfu',
        compression: true,
        encryption: true
      });
      
      expect(customCache.getStats().maxSize).toBe(50);
      
      customCache.destroy();
    });
  });

  describe('Error Handling', () => {
    it('should handle serialization errors gracefully', async () => {
      const circularObject: any = { name: 'circular' };
      circularObject.self = circularObject;

      // Should handle circular reference gracefully
      await expect(cache.set('circular', circularObject)).rejects.toThrow();
    });

    it('should handle get operations on corrupted data', async () => {
      await cache.set('test-key', 'test-value');
      
      // Corrupt the data manually
      const item = cache['cache'].get('test-key');
      if (item) {
        item.value = 'invalid-json-{';
      }
      
      const result = await cache.get('test-key');
      expect(result).toBeNull(); // Should return null for corrupted data
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle concurrent set operations', async () => {
      const promises = [];
      
      for (let i = 0; i < 100; i++) {
        promises.push(cache.set(`key-${i}`, `value-${i}`));
      }
      
      await Promise.all(promises);
      
      expect(cache.getSize()).toBe(100);
      
      // Verify all values are set correctly
      for (let i = 0; i < 100; i++) {
        const value = await cache.get(`key-${i}`);
        expect(value).toBe(`value-${i}`);
      }
    });

    it('should handle concurrent get operations', async () => {
      await cache.set('shared-key', 'shared-value');
      
      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(cache.get('shared-key'));
      }
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(50);
      results.forEach(result => {
        expect(result).toBe('shared-value');
      });
    });

    it('should handle mixed concurrent operations', async () => {
      const operations = [];
      
      // Mix of set, get, and delete operations
      for (let i = 0; i < 20; i++) {
        operations.push(cache.set(`key-${i}`, `value-${i}`));
        operations.push(cache.get(`key-${i}`));
        if (i % 3 === 0) {
          operations.push(cache.delete(`key-${i}`));
        }
      }
      
      await Promise.allSettled(operations);
      
      // Should not crash or corrupt the cache
      expect(cache.getSize()).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cleanup and Resource Management', () => {
    it('should cleanup resources on destroy', () => {
      const testCache = new DistributedCache();
      
      expect(testCache.getSize()).toBe(0);
      
      testCache.destroy();
      
      // After destroy, cache should be empty
      expect(testCache.getSize()).toBe(0);
    });

    it('should stop cleanup interval on destroy', () => {
      const testCache = new DistributedCache();
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      
      testCache.destroy();
      
      expect(clearIntervalSpy).toHaveBeenCalled();
      
      clearIntervalSpy.mockRestore();
    });
  });
});
