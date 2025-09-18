import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('Worker Environment Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate worker environment configuration schema exists', () => {
    // Basic sanity test to ensure config module is importable
    expect(() => {
      require('../../../config/env.js');
    }).not.toThrow();
  });

  it('should have required worker configuration exports', () => {
    const config = require('../../../config/env.js');
    
    expect(config).toBeDefined();
    expect(config.workerEnv).toBeDefined();
    expect(config.queueConfig).toBeDefined();
    expect(config.workerServerConfig).toBeDefined();
    
    expect(typeof config.isDevelopment).toBe('function');
    expect(typeof config.isProduction).toBe('function');
    expect(typeof config.isTest).toBe('function');
  });

  it('should provide reasonable worker defaults', () => {
    // Set minimal required env vars for test
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost/test',
      REDIS_URL: 'redis://localhost:6379',
    };

    // Clear the module cache to force re-evaluation
    delete require.cache[require.resolve('../../../config/env.js')];
    
    const config = require('../../../config/env.js');
    
    expect(config.workerEnv.NODE_ENV).toBe('test');
    expect(config.queueConfig.name).toBeDefined();
    expect(config.queueConfig.concurrency).toBeGreaterThan(0);
    expect(config.workerServerConfig.port).toBeDefined();
    expect(config.isTest()).toBe(true);
  });

  it('should validate queue configuration limits', () => {
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost/test',
      REDIS_URL: 'redis://localhost:6379',
      QUEUE_CONCURRENCY: '10',
      QUEUE_MAX_ATTEMPTS: '5',
    };

    delete require.cache[require.resolve('../../../config/env.js')];
    const config = require('../../../config/env.js');
    
    expect(config.queueConfig.concurrency).toBe(10);
    expect(config.queueConfig.maxAttempts).toBe(5);
  });
});
