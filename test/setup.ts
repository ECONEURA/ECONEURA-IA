import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Global test setup
beforeAll(async () => {
  // Setup global test environment
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://econeura_user:econeura_password@localhost:5432/econeura_test';
  process.env.REDIS_URL = 'redis://localhost:6379/1';
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.AZURE_OPENAI_API_KEY = 'test-azure-key';
  process.env.AZURE_OPENAI_ENDPOINT = 'https://test.openai.azure.com/';
  process.env.OPENAI_API_KEY = 'test-openai-key';
  process.env.MOCK_EXTERNAL = 'true';
  
  // Mock fetch globally
  global.fetch = vi.fn();
  
  // Mock external providers
  vi.mock('openai', () => ({
    OpenAI: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: 'Mocked response' } }]
          })
        }
      }
    }))
  }));
  
  vi.mock('@azure/openai', () => ({
    OpenAIClient: vi.fn().mockImplementation(() => ({
      getChatCompletions: vi.fn().mockResolvedValue({
        choices: [{ message: { content: 'Mocked Azure response' } }]
      })
    }))
  }));
  
  // Use fake timers for unstable tests
  vi.useFakeTimers();
});

// Global test teardown
afterAll(async () => {
  // Cleanup global test environment
  process.env.NODE_ENV = 'development';
  vi.useRealTimers();
});

// Mock console methods in test environment
beforeEach(() => {
  vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});
