// Test Setup Configuration
import { structuredLogger } from '../../lib/structured-logger.js';

// Configure logger for test environment
if (process.env.NODE_ENV === 'test') {
  // Mock logger for tests
  (structuredLogger as any).level = 'silent';
  (structuredLogger as any).info = () => {};
  (structuredLogger as any).debug = () => {};
  (structuredLogger as any).error = () => {};
  (structuredLogger as any).warn = () => {};
}

// Global test configuration
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Setup test environment
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3001';
});

afterAll(() => {
  // Cleanup
});
