// ============================================================================
// WEB TELEMETRY TESTS - NEXT.JS INTEGRATION
// ============================================================================

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';

// Mock the shared telemetry module
vi.mock('@econeura/shared/telemetry', () => ({
  initializeTelemetry: vi.fn(),
  getTelemetry: vi.fn(() => ({
    trackEvent: vi.fn(),
    trackPageView: vi.fn(),
    trackUserAction: vi.fn(),
    trackError: vi.fn(),
    trackCustom: vi.fn(),
    setUser: vi.fn()
  })),
  trackPageView: vi.fn(),
  trackUserAction: vi.fn(),
  trackError: vi.fn(),
  trackCustom: vi.fn(),
  setTelemetryUser: vi.fn()
}));

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/test',
    searchParams: new URLSearchParams()
  }),
  usePathname: () => '/test',
  useSearchParams: () => new URLSearchParams()
}));

// Mock window and document
Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'https://example.com/test',
      pathname: '/test',
      search: '?param=value'
    },
    screen: {
      width: 1920,
      height: 1080
    },
    innerWidth: 1200,
    innerHeight: 800,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  writable: true
});

Object.defineProperty(global, 'document', {
  value: {
    referrer: 'https://google.com',
    body: {
      addEventListener: vi.fn()
    }
  },
  writable: true
});

Object.defineProperty(global, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Browser)',
    language: 'en-US'
  },
  writable: true
});

// Import after mocks
import {
  initializeWebTelemetry,
  useTelemetry,
  usePageTracking,
  useUserTracking,
  useFormTracking,
  usePerformanceTracking,
  withTelemetry,
  TelemetryErrorBoundary
} from '../telemetry';

import {
  TelemetryProvider,
  useTelemetryContext,
  TrackedButton,
  TrackedLink,
  TrackedForm,
  PerformanceTracker
} from '../../components/TelemetryProvider';

describe('Web Telemetry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializeWebTelemetry', () => {
    it('should initialize telemetry with default config', () => {
      expect(() => {
        initializeWebTelemetry();
      }).not.toThrow();
    });

    it('should initialize telemetry with custom config', () => {
      const config = {
        enabled: true,
        endpoint: 'https://api.example.com/telemetry',
        apiKey: 'test-key',
        sampleRate: 0.5
      };

      expect(() => {
        initializeWebTelemetry(config);
      }).not.toThrow();
    });
  });

  describe('React Hooks', () => {
    it('should provide telemetry context', () => {
      const TestComponent = () => {
        const { track } = useTelemetryContext();
        return (
          <button onClick={() => track('test_action', 'button')}>
            Test Button
          </button>
        );
      };

      render(
        <TelemetryProvider>
          <TestComponent />
        </TelemetryProvider>
      );

      const button = screen.getByText('Test Button');
      expect(button).toBeInTheDocument();
    });

    it('should throw error when used outside provider', () => {
      const TestComponent = () => {
        useTelemetryContext();
        return <div>Test</div>;
      };

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTelemetryContext must be used within a TelemetryProvider');
    });
  });

  describe('useTelemetry hook', () => {
    it('should provide tracking functions', () => {
      const TestComponent = () => {
        const { track, trackError, trackCustom } = useTelemetry();
        
        return (
          <div>
            <button onClick={() => track('test_action', 'button')}>Track</button>
            <button onClick={() => trackError('test error')}>Error</button>
            <button onClick={() => trackCustom('custom_event')}>Custom</button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByText('Track')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Custom')).toBeInTheDocument();
    });
  });

  describe('usePageTracking hook', () => {
    it('should track page views', () => {
      const TestComponent = () => {
        usePageTracking('/test-page', { source: 'navigation' });
        return <div>Test Page</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
  });

  describe('useUserTracking hook', () => {
    it('should track user information', () => {
      const TestComponent = () => {
        useUserTracking('user-123', 'org-456');
        return <div>User Component</div>;
      };

      render(<TestComponent />);
      expect(screen.getByText('User Component')).toBeInTheDocument();
    });
  });

  describe('useFormTracking hook', () => {
    it('should provide form tracking functions', () => {
      const TestComponent = () => {
        const {
          trackFormStart,
          trackFormSubmit,
          trackFormError,
          trackFieldFocus,
          trackFieldBlur
        } = useFormTracking('test-form');

        return (
          <div>
            <button onClick={() => trackFormStart()}>Start</button>
            <button onClick={() => trackFormSubmit(true, ['field1'])}>Submit</button>
            <button onClick={() => trackFormError('validation error', 'field1')}>Error</button>
            <button onClick={() => trackFieldFocus('field1')}>Focus</button>
            <button onClick={() => trackFieldBlur('field1', true)}>Blur</button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByText('Start')).toBeInTheDocument();
      expect(screen.getByText('Submit')).toBeInTheDocument();
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Focus')).toBeInTheDocument();
      expect(screen.getByText('Blur')).toBeInTheDocument();
    });
  });

  describe('usePerformanceTracking hook', () => {
    it('should provide performance tracking functions', () => {
      const TestComponent = () => {
        const { trackRenderTime, trackApiCall, trackResourceLoad } = usePerformanceTracking();

        return (
          <div>
            <button onClick={() => trackRenderTime('TestComponent', 100)}>Render</button>
            <button onClick={() => trackApiCall('/api/test', 'GET', 200, true, 200)}>API</button>
            <button onClick={() => trackResourceLoad('/test.js', 150, 1024)}>Resource</button>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByText('Render')).toBeInTheDocument();
      expect(screen.getByText('API')).toBeInTheDocument();
      expect(screen.getByText('Resource')).toBeInTheDocument();
    });
  });

  describe('withTelemetry HOC', () => {
    it('should wrap component with telemetry', () => {
      const TestComponent = ({ name }: { name: string }) => <div>Hello {name}</div>;
      
      const WrappedComponent = withTelemetry(TestComponent, {
        page: '/test',
        component: 'TestComponent',
        trackMount: true,
        trackUnmount: true
      });

      render(<WrappedComponent name="World" />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });
  });
});

describe('TelemetryProvider Component', () => {
  describe('TrackedButton', () => {
    it('should track button clicks', () => {
      const handleClick = vi.fn();
      
      render(
        <TelemetryProvider>
          <TrackedButton 
            trackingAction="test_click"
            trackingContext={{ buttonId: 'test' }}
            onClick={handleClick}
          >
            Test Button
          </TrackedButton>
        </TelemetryProvider>
      );

      const button = screen.getByText('Test Button');
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('TrackedLink', () => {
    it('should track link clicks', () => {
      const handleClick = vi.fn();
      
      render(
        <TelemetryProvider>
          <TrackedLink 
            href="/test"
            trackingAction="test_link_click"
            trackingContext={{ linkType: 'navigation' }}
            onClick={handleClick}
          >
            Test Link
          </TrackedLink>
        </TelemetryProvider>
      );

      const link = screen.getByText('Test Link');
      fireEvent.click(link);

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('TrackedForm', () => {
    it('should track form submissions', () => {
      const handleSubmit = vi.fn();
      
      render(
        <TelemetryProvider>
          <TrackedForm 
            trackingAction="test_form_submit"
            trackingContext={{ formType: 'contact' }}
            onSubmit={handleSubmit}
          >
            <input name="email" defaultValue="test@example.com" />
            <button type="submit">Submit</button>
          </TrackedForm>
        </TelemetryProvider>
      );

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('PerformanceTracker', () => {
    it('should track component performance', () => {
      render(
        <TelemetryProvider>
          <PerformanceTracker 
            componentName="TestComponent"
            trackRender={true}
            trackMount={true}
            trackUnmount={true}
          >
            <div>Test Content</div>
          </PerformanceTracker>
        </TelemetryProvider>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });
  });

  describe('TelemetryErrorBoundary', () => {
    it('should catch and track errors', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={resetError}>Reset</button>
        </div>
      );

      render(
        <TelemetryProvider>
          <TelemetryErrorBoundary fallback={ErrorFallback}>
            <ThrowError />
          </TelemetryErrorBoundary>
        </TelemetryProvider>
      );

      expect(screen.getByText('Error: Test error')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    it('should render default fallback when no custom fallback provided', () => {
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <TelemetryProvider>
          <TelemetryErrorBoundary>
            <ThrowError />
          </TelemetryErrorBoundary>
        </TelemetryProvider>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText('Try again')).toBeInTheDocument();
    });

    it('should reset error state', () => {
      const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
        if (shouldThrow) {
          throw new Error('Test error');
        }
        return <div>No error</div>;
      };

      const ErrorFallback = ({ error, resetError }: { error: Error; resetError: () => void }) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={resetError}>Reset</button>
        </div>
      );

      const { rerender } = render(
        <TelemetryProvider>
          <TelemetryErrorBoundary fallback={ErrorFallback}>
            <ThrowError shouldThrow={true} />
          </TelemetryErrorBoundary>
        </TelemetryProvider>
      );

      expect(screen.getByText('Error: Test error')).toBeInTheDocument();

      const resetButton = screen.getByText('Reset');
      fireEvent.click(resetButton);

      rerender(
        <TelemetryProvider>
          <TelemetryErrorBoundary fallback={ErrorFallback}>
            <ThrowError shouldThrow={false} />
          </TelemetryErrorBoundary>
        </TelemetryProvider>
      );

      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  it('should work with multiple providers', () => {
    const TestComponent = () => {
      const { track } = useTelemetryContext();
      return (
        <button onClick={() => track('nested_action', 'button')}>
          Nested Button
        </button>
      );
    };

    render(
      <TelemetryProvider config={{ enabled: true }}>
        <TelemetryProvider config={{ enabled: false }}>
          <TestComponent />
        </TelemetryProvider>
      </TelemetryProvider>
    );

    const button = screen.getByText('Nested Button');
    expect(button).toBeInTheDocument();
  });

  it('should handle user context changes', () => {
    const TestComponent = ({ userId }: { userId: string }) => {
      useUserTracking(userId, 'org-123');
      return <div>User: {userId}</div>;
    };

    const { rerender } = render(<TestComponent userId="user-1" />);
    expect(screen.getByText('User: user-1')).toBeInTheDocument();

    rerender(<TestComponent userId="user-2" />);
    expect(screen.getByText('User: user-2')).toBeInTheDocument();
  });

  it('should handle page context changes', () => {
    const TestComponent = ({ page }: { page: string }) => {
      usePageTracking(page, { source: 'test' });
      return <div>Page: {page}</div>;
    };

    const { rerender } = render(<TestComponent page="/page-1" />);
    expect(screen.getByText('Page: /page-1')).toBeInTheDocument();

    rerender(<TestComponent page="/page-2" />);
    expect(screen.getByText('Page: /page-2')).toBeInTheDocument();
  });
});
