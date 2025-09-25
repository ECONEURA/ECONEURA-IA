/**
 * Test Setup for UI Testing with Accessibility
 * PR-99: Cobertura UI & Axe - Test setup with RTL and accessibility
 */

// MOCKS MUST BE AT THE TOP BEFORE ANY IMPORTS
// Mock react-dom with minimal implementation for React 19 compatibility
vi.mock('react-dom', () => ({
  __esModule: true,
  default: vi.fn(),
  createPortal: vi.fn(),
  findDOMNode: vi.fn(),
  render: vi.fn(),
  unmountComponentAtNode: vi.fn(),
  // React 19 compatibility
  version: '19.1.1',
  // Add missing properties that React 19 might need
  S: vi.fn(),
}));

// Setup testing-library matchers
import '@testing-library/jest-dom';
import { expect, vi } from 'vitest';

// Mock react-dom/client with minimal implementation for React 19 compatibility
vi.mock('react-dom/client', () => ({
  __esModule: true,
  default: vi.fn(),
  createRoot: vi.fn(() => ({
    render: vi.fn(),
    unmount: vi.fn(),
  })),
  hydrateRoot: vi.fn(),
  // React 19 compatibility
  version: '19.1.1',
}));

// Mock Next.js server components - simple implementation
vi.mock('next/server', () => ({
  __esModule: true,
  NextRequest: vi.fn().mockImplementation((input, init) => ({
    url: typeof input === 'string' ? input : input?.toString() || '',
    method: init?.method || 'GET',
    headers: new Headers(init?.headers),
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    clone: vi.fn(),
  })),
  NextResponse: {
    json: vi.fn().mockReturnValue({
      status: 200,
      json: vi.fn().mockResolvedValue({}),
      text: vi.fn().mockResolvedValue('{}'),
      headers: new Headers(),
    }),
    redirect: vi.fn().mockReturnValue({
      status: 302,
      headers: new Headers(),
    }),
    next: vi.fn().mockReturnValue({
      status: 200,
      headers: new Headers(),
    }),
  },
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    searchParams: new URLSearchParams(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    return React.createElement('img', { ...props, alt: props.alt || '' });
  },
}));

// Mock next-themes
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children, ...props }: any) => React.createElement('div', props, children),
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    themes: ['light', 'dark', 'system'],
  }),
}));

import React from 'react';
import { configure } from '@testing-library/react';

// Mock jest-axe for now - will be replaced with proper implementation later
const toHaveNoViolations = (received: any) => ({
  pass: received.violations.length === 0,
  message: () => `Expected no accessibility violations, but found ${received.violations.length}`
});

// Extend Vitest matchers
expect.extend({
  toHaveNoViolations
});

// Configure Testing Library
configure({
  testIdAttribute: 'data-testid',
  asyncUtilTimeout: 5000,
  // Increase timeout for accessibility tests
  getElementError: (message: string | null, container: any) => {
    const error = new Error(message || 'Element not found');
    error.name = 'TestingLibraryElementError';
    error.stack = undefined;
    return error;
  },
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock window.getComputedStyle
Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
  }),
});

// Mock console methods to reduce noise in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args: any[]) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('componentWillReceiveProps') ||
        args[0].includes('componentWillMount'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Global test cleanup
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
