import { describe, it, expect, beforeEach } from 'vitest';

describe('Environment Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = process.env;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should validate environment configuration schema exists', () => {
    // Basic sanity test to ensure config module is importable
    expect(() => {
      require('../../../config/env.js');
    }).not.toThrow();
  });

  it('should have required configuration exports', () => {
    const config = require('../../../config/env.js');
    
    expect(config).toBeDefined();
    expect(config.serverConfig).toBeDefined();
    expect(config.dbConfig).toBeDefined();
    expect(config.redisConfig).toBeDefined();
    expect(config.jwtConfig).toBeDefined();
    
    expect(typeof config.isDevelopment).toBe('function');
    expect(typeof config.isProduction).toBe('function');
    expect(typeof config.isTest).toBe('function');
  });

  it('should provide reasonable development defaults', () => {
    // Set minimal required env vars for test
    process.env = {
      ...originalEnv,
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost/test',
      REDIS_URL: 'redis://localhost:6379',
      JWT_SECRET: 'test-secret-that-is-at-least-32-characters-long-for-testing',
    };

    // Clear the module cache to force re-evaluation
    delete require.cache[require.resolve('../../../config/env.js')];
    
    const config = require('../../../config/env.js');
    
    expect(config.env.NODE_ENV).toBe('test');
    expect(config.env.PORT).toBeDefined();
    expect(config.env.LOG_LEVEL).toBeDefined();
    expect(config.isTest()).toBe(true);
    expect(config.isProduction()).toBe(false);
  });
});
