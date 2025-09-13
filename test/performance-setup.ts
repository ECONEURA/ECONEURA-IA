import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global performance test setup
beforeAll(async () => {
  // Setup performance test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://econeura_user:econeura_password@localhost:5432/econeura_performance_test';
  process.env.REDIS_URL = 'redis://localhost:6379/3';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.AZURE_OPENAI_API_KEY = 'test-azure-key';
  process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com/';
  
  // Start performance test database and services
  // This would typically start Docker containers or test services
});

// Global performance test teardown
afterAll(async () => {
  // Cleanup performance test environment
  process.env.NODE_ENV = 'development';
  
  // Stop performance test database and services
  // This would typically stop Docker containers or test services
});

// Mock console methods in performance test environment
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
