import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { envSchema, loadEnvConfig } from './env';

describe('Environment Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      JWT_SECRET: 'super-secret-key-at-least-32-chars-long',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('envSchema', () => {
    it('should validate correct environment variables', () => {
      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(true);
    });

    it('should provide default values', () => {
  // Ensure NODE_ENV is not set so defaults apply
  // process.env properties are readonly in TS types; assign undefined
  (process.env as any).NODE_ENV = undefined
  const result = envSchema.parse(process.env);
      expect(result.NODE_ENV).toBe('development');
      expect(result.LOG_LEVEL).toBe('info');
      expect(result.PORT).toBe(3000);
    });

    it('should fail on invalid URLs', () => {
      process.env.DATABASE_URL = 'invalid-url';
      const result = envSchema.safeParse(process.env);
      expect(result.success).toBe(false);
    });

    it('should transform comma-separated strings to arrays', () => {
      process.env.CORS_ORIGINS = 'http://localhost:3000,http://example.com';
      const result = envSchema.parse(process.env);
      expect(result.CORS_ORIGINS).toEqual(['http://localhost:3000', 'http://example.com']);
    });
  });

  describe('loadEnvConfig', () => {
    it('should load and validate environment configuration', () => {
      const config = loadEnvConfig();
      expect(config.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
      expect(config.JWT_SECRET).toBe('super-secret-key-at-least-32-chars-long');
    });

    it('should throw meaningful error on validation failure', () => {
      delete process.env.JWT_SECRET;
      expect(() => loadEnvConfig()).toThrow('Invalid environment configuration');
    });
  });
});
