import { PerformanceOptimizer } from '../../lib/performance-optimizer.js';
import { ResponseOptimizer } from '../../lib/response-optimizer.js';

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;

  beforeEach(() => {
    optimizer = new PerformanceOptimizer();
  });

  afterEach(() => {
    optimizer.destroy();
  });

  describe('CPU Optimization', () => {
    it('should monitor CPU usage', async () => {
      const usage = optimizer.getCpuUsage();
      expect(usage).toBeGreaterThanOrEqual(0);
      expect(usage).toBeLessThanOrEqual(100);
    });

    it('should optimize CPU-intensive operations', async () => {
      const startTime = Date.now();
      
      // Simulate CPU-intensive operation
      const result = await optimizer.optimizeCpuIntensiveOperation(() => {
        let sum = 0;
        for (let i = 0; i < 1000000; i++) {
          sum += i;
        }
        return sum;
      });

      expect(result).toBeDefined();
      expect(Date.now() - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should throttle operations under high CPU load', async () => {
      // Mock high CPU usage
      jest.spyOn(optimizer, 'getCpuUsage').mockReturnValue(95);

      const operations = [];
      for (let i = 0; i < 10; i++) {
        operations.push(optimizer.optimizeCpuIntensiveOperation(() => i));
      }

      const results = await Promise.all(operations);
      expect(results).toHaveLength(10);
    });
  });

  describe('Memory Optimization', () => {
    it('should monitor memory usage', () => {
      const usage = optimizer.getMemoryUsage();
      expect(usage.used).toBeGreaterThan(0);
      expect(usage.total).toBeGreaterThan(usage.used);
      expect(usage.percentage).toBeGreaterThanOrEqual(0);
      expect(usage.percentage).toBeLessThanOrEqual(100);
    });

    it('should trigger garbage collection when memory is high', async () => {
      // Mock high memory usage
      jest.spyOn(optimizer, 'getMemoryUsage').mockReturnValue({
        used: 1024 * 1024 * 1024, // 1GB
        total: 1024 * 1024 * 1024 * 1.1, // 1.1GB
        percentage: 90
      });

      const gcSpy = jest.spyOn(optimizer, 'forceGarbageCollection');
      
      await optimizer.optimizeMemory();
      
      expect(gcSpy).toHaveBeenCalled();
    });

    it('should clear unused caches', async () => {
      // Add some data to cache
      optimizer.setCache('test-key', 'test-value');
      expect(optimizer.getCache('test-key')).toBe('test-value');

      // Mock old timestamp to simulate expired cache
      jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 60000 * 60); // 1 hour later

      await optimizer.optimizeMemory();
      
      expect(optimizer.getCache('test-key')).toBeNull();
    });
  });

  describe('Database Optimization', () => {
    it('should optimize database queries', async () => {
      const mockQuery = jest.fn().mockResolvedValue([{ id: 1, name: 'test' }]);
      
      const result = await optimizer.optimizeQuery(mockQuery, 'SELECT * FROM users');
      
      expect(result).toEqual([{ id: 1, name: 'test' }]);
      expect(mockQuery).toHaveBeenCalledTimes(1);
    });

    it('should cache frequent queries', async () => {
      const mockQuery = jest.fn().mockResolvedValue([{ id: 1, name: 'test' }]);
      const sql = 'SELECT * FROM users WHERE id = 1';
      
      // First call
      const result1 = await optimizer.optimizeQuery(mockQuery, sql);
      // Second call (should use cache)
      const result2 = await optimizer.optimizeQuery(mockQuery, sql);
      
      expect(result1).toEqual(result2);
      expect(mockQuery).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it('should identify slow queries', async () => {
      const slowQuery = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve([]), 2000))
      );
      
      const startTime = Date.now();
      await optimizer.optimizeQuery(slowQuery, 'SLOW_QUERY');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeGreaterThan(1000);
      
      const slowQueries = optimizer.getSlowQueries();
      expect(slowQueries).toContainEqual(
        expect.objectContaining({
          query: 'SLOW_QUERY',
          duration: expect.any(Number)
        })
      );
    });
  });

  describe('Network Optimization', () => {
    it('should compress responses', async () => {
      const largeData = 'x'.repeat(10000);
      const compressed = await optimizer.compressData(largeData);
      
      expect(compressed.length).toBeLessThan(largeData.length);
    });

    it('should implement connection pooling', () => {
      const pool = optimizer.getConnectionPool();
      expect(pool.maxConnections).toBeGreaterThan(0);
      expect(pool.currentConnections).toBeGreaterThanOrEqual(0);
    });

    it('should optimize API responses', async () => {
      const mockData = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `User ${i}`,
          email: `user${i}@example.com`,
          createdAt: new Date(),
          updatedAt: new Date()
        }))
      };

      const optimized = await optimizer.optimizeResponse(mockData);
      
      expect(optimized.size).toBeLessThan(JSON.stringify(mockData).length);
      expect(optimized.compressed).toBe(true);
    });
  });

  describe('Caching Strategy', () => {
    it('should implement LRU cache eviction', () => {
      const maxSize = 3;
      optimizer.setCacheMaxSize(maxSize);
      
      // Fill cache beyond max size
      optimizer.setCache('key1', 'value1');
      optimizer.setCache('key2', 'value2');
      optimizer.setCache('key3', 'value3');
      optimizer.setCache('key4', 'value4'); // Should evict key1
      
      expect(optimizer.getCache('key1')).toBeNull();
      expect(optimizer.getCache('key2')).toBe('value2');
      expect(optimizer.getCache('key3')).toBe('value3');
      expect(optimizer.getCache('key4')).toBe('value4');
    });

    it('should respect TTL for cache entries', async () => {
      optimizer.setCache('ttl-key', 'ttl-value', 100); // 100ms TTL
      
      expect(optimizer.getCache('ttl-key')).toBe('ttl-value');
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(optimizer.getCache('ttl-key')).toBeNull();
    });
  });

  describe('Performance Metrics', () => {
    it('should collect performance metrics', () => {
      const metrics = optimizer.getMetrics();
      
      expect(metrics).toHaveProperty('cpu');
      expect(metrics).toHaveProperty('memory');
      expect(metrics).toHaveProperty('queries');
      expect(metrics).toHaveProperty('cache');
      expect(metrics).toHaveProperty('network');
    });

    it('should track response times', async () => {
      const startTime = Date.now();
      
      await optimizer.trackOperation('test-operation', async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'result';
      });
      
      const metrics = optimizer.getMetrics();
      expect(metrics.operations['test-operation']).toBeDefined();
      expect(metrics.operations['test-operation'].averageTime).toBeGreaterThan(90);
    });
  });
});

describe('ResponseOptimizer', () => {
  let responseOptimizer: ResponseOptimizer;

  beforeEach(() => {
    responseOptimizer = new ResponseOptimizer();
  });

  afterEach(() => {
    responseOptimizer.destroy();
  });

  describe('Response Compression', () => {
    it('should compress large responses', async () => {
      const largeResponse = {
        data: Array.from({ length: 1000 }, (_, i) => ({ id: i, value: `item-${i}` }))
      };

      const req = { headers: { 'accept-encoding': 'gzip' } };
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      await responseOptimizer.optimize(req, res, largeResponse);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Encoding', 'gzip');
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json');
    });

    it('should not compress small responses', async () => {
      const smallResponse = { message: 'OK' };

      const req = { headers: { 'accept-encoding': 'gzip' } };
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      await responseOptimizer.optimize(req, res, smallResponse);

      expect(res.setHeader).not.toHaveBeenCalledWith('Content-Encoding', 'gzip');
    });
  });

  describe('Response Caching', () => {
    it('should cache GET responses', async () => {
      const response = { data: 'cached-data' };
      const req = { method: 'GET', url: '/api/test', headers: {} };
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      await responseOptimizer.optimize(req, res, response);

      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', expect.any(String));
      expect(res.setHeader).toHaveBeenCalledWith('ETag', expect.any(String));
    });

    it('should return 304 for cached responses', async () => {
      const response = { data: 'cached-data' };
      const etag = '"test-etag"';
      
      const req = { 
        method: 'GET', 
        url: '/api/test', 
        headers: { 'if-none-match': etag } 
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      // Mock the ETag generation to return our test ETag
      jest.spyOn(responseOptimizer, 'generateETag').mockReturnValue(etag);

      await responseOptimizer.optimize(req, res, response);

      expect(res.status).toHaveBeenCalledWith(304);
      expect(res.end).toHaveBeenCalledWith();
    });
  });

  describe('Response Transformation', () => {
    it('should transform responses based on accept header', async () => {
      const response = { users: [{ id: 1, name: 'John' }] };
      
      const req = { 
        method: 'GET',
        headers: { 'accept': 'application/xml' } 
      };
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      await responseOptimizer.optimize(req, res, response);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/xml');
    });

    it('should filter fields based on query parameters', async () => {
      const response = { 
        users: [
          { id: 1, name: 'John', email: 'john@example.com', password: 'secret' }
        ] 
      };
      
      const req = { 
        method: 'GET',
        url: '/api/users?fields=id,name',
        query: { fields: 'id,name' },
        headers: {} 
      };
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      await responseOptimizer.optimize(req, res, response);

      const optimizedResponse = JSON.parse(res.write.mock.calls[0][0]);
      expect(optimizedResponse.users[0]).toEqual({ id: 1, name: 'John' });
      expect(optimizedResponse.users[0]).not.toHaveProperty('email');
      expect(optimizedResponse.users[0]).not.toHaveProperty('password');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track optimization metrics', async () => {
      const response = { data: 'test' };
      const req = { method: 'GET', headers: {} };
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      await responseOptimizer.optimize(req, res, response);

      const stats = responseOptimizer.getStats();
      expect(stats.totalOptimizations).toBeGreaterThan(0);
      expect(stats.compressionRatio).toBeGreaterThanOrEqual(0);
      expect(stats.averageOptimizationTime).toBeGreaterThanOrEqual(0);
    });

    it('should identify slow optimizations', async () => {
      const response = { data: 'x'.repeat(100000) }; // Large response
      const req = { method: 'GET', headers: { 'accept-encoding': 'gzip' } };
      const res = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn()
      };

      const startTime = Date.now();
      await responseOptimizer.optimize(req, res, response);
      const duration = Date.now() - startTime;

      expect(duration).toBeGreaterThan(0);
      
      const stats = responseOptimizer.getStats();
      expect(stats.slowOptimizations).toBeDefined();
    });
  });
});
