// ============================================================================
// WEB TELEMETRY INTEGRATION - NEXT.JS SPECIFIC
// ============================================================================

import { 
  initializeTelemetry, 
  getTelemetry, 
  trackPageView, 
  trackUserAction, 
  trackError, 
  trackCustom,
  setTelemetryUser,
  TelemetryConfig 
} from '@econeura/shared/telemetry';

// ============================================================================
// NEXT.JS TELEMETRY CONFIGURATION
// ============================================================================

const defaultConfig: TelemetryConfig = {
  enabled: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_TELEMETRY_ENABLED === 'true',
  endpoint: process.env.NEXT_PUBLIC_TELEMETRY_ENDPOINT,
  apiKey: process.env.NEXT_PUBLIC_TELEMETRY_API_KEY,
  sampleRate: parseFloat(process.env.NEXT_PUBLIC_TELEMETRY_SAMPLE_RATE || '1.0'),
  batchSize: parseInt(process.env.NEXT_PUBLIC_TELEMETRY_BATCH_SIZE || '100'),
  flushInterval: parseInt(process.env.NEXT_PUBLIC_TELEMETRY_FLUSH_INTERVAL || '5000'),
  maxRetries: parseInt(process.env.NEXT_PUBLIC_TELEMETRY_MAX_RETRIES || '3'),
  privacyMode: process.env.NEXT_PUBLIC_TELEMETRY_PRIVACY_MODE !== 'false',
  debugMode: process.env.NODE_ENV === 'development'
};

// ============================================================================
// TELEMETRY INITIALIZATION
// ============================================================================

let isInitialized = false;

export function initializeWebTelemetry(config: Partial<TelemetryConfig> = {}): void {
  if (typeof window === 'undefined' || isInitialized) {
    return;
  }

  const mergedConfig = { ...defaultConfig, ...config };
  initializeTelemetry(mergedConfig);
  isInitialized = true;

  // Track initial page view
  trackPageView(window.location.pathname, {
    referrer: document.referrer,
    userAgent: navigator.userAgent,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: {
      width: window.screen.width,
      height: window.screen.height
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    }
  });

  // Setup route change tracking for Next.js
  setupRouteTracking();
}

// ============================================================================
// ROUTE TRACKING
// ============================================================================

function setupRouteTracking(): void {
  if (typeof window === 'undefined') return;

  // Track route changes for Next.js App Router
  let currentPath = window.location.pathname;

  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      trackPageView(currentPath, {
        routeChange: true,
        timestamp: Date.now()
      });
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also listen to popstate events
  window.addEventListener('popstate', () => {
    trackPageView(window.location.pathname, {
      routeChange: true,
      navigationType: 'popstate',
      timestamp: Date.now()
    });
  });
}

// ============================================================================
// REACT HOOKS
// ============================================================================

import { useEffect, useCallback } from 'react';

export function useTelemetry() {
  const track = useCallback((action: string, element?: string, context?: Record<string, any>) => {
    trackUserAction(action, element, context);
  }, []);

  const trackError = useCallback((error: Error | string, context?: Record<string, any>) => {
    trackError(error, context);
  }, []);

  const trackCustom = useCallback((name: string, properties?: Record<string, any>, metrics?: Record<string, number>) => {
    trackCustom(name, properties, metrics);
  }, []);

  return {
    track,
    trackError,
    trackCustom
  };
}

export function usePageTracking(page: string, properties?: Record<string, any>) {
  useEffect(() => {
    trackPageView(page, properties);
  }, [page, properties]);
}

export function useUserTracking(userId: string, organizationId?: string) {
  useEffect(() => {
    setTelemetryUser(userId, organizationId);
  }, [userId, organizationId]);
}

// ============================================================================
// COMPONENT TRACKING
// ============================================================================

export function withTelemetry<T extends Record<string, any>>(
  Component: React.ComponentType<T>,
  trackingConfig?: {
    page?: string;
    component?: string;
    trackMount?: boolean;
    trackUnmount?: boolean;
    trackProps?: (props: T) => Record<string, any>;
  }
) {
  return function TelemetryWrappedComponent(props: T) {
    const { track } = useTelemetry();

    useEffect(() => {
      if (trackingConfig?.trackMount) {
        track('component_mount', trackingConfig.component || Component.name, {
          page: trackingConfig.page,
          props: trackingConfig.trackProps ? trackingConfig.trackProps(props) : {}
        });
      }

      return () => {
        if (trackingConfig?.trackUnmount) {
          track('component_unmount', trackingConfig.component || Component.name, {
            page: trackingConfig.page
          });
        }
      };
    }, [track, props]);

    return <Component {...props} />;
  };
}

// ============================================================================
// FORM TRACKING
// ============================================================================

export function useFormTracking(formName: string) {
  const { track } = useTelemetry();

  const trackFormStart = useCallback(() => {
    track('form_start', formName, { formName });
  }, [track, formName]);

  const trackFormSubmit = useCallback((success: boolean, fields?: string[]) => {
    track('form_submit', formName, {
      formName,
      success,
      fieldCount: fields?.length || 0,
      fields: fields || []
    });
  }, [track, formName]);

  const trackFormError = useCallback((error: string, field?: string) => {
    track('form_error', formName, {
      formName,
      error,
      field
    });
  }, [track, formName]);

  const trackFieldFocus = useCallback((field: string) => {
    track('field_focus', formName, {
      formName,
      field
    });
  }, [track, formName]);

  const trackFieldBlur = useCallback((field: string, hasValue: boolean) => {
    track('field_blur', formName, {
      formName,
      field,
      hasValue
    });
  }, [track, formName]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormError,
    trackFieldFocus,
    trackFieldBlur
  };
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

export function usePerformanceTracking() {
  const { trackCustom } = useTelemetry();

  const trackRenderTime = useCallback((componentName: string, renderTime: number) => {
    trackCustom('component_render_time', {
      component: componentName
    }, {
      renderTime
    });
  }, [trackCustom]);

  const trackApiCall = useCallback((
    endpoint: string, 
    method: string, 
    duration: number, 
    success: boolean,
    statusCode?: number
  ) => {
    trackCustom('api_call', {
      endpoint,
      method,
      success,
      statusCode
    }, {
      duration,
      success: success ? 1 : 0
    });
  }, [trackCustom]);

  const trackResourceLoad = useCallback((resource: string, loadTime: number, size?: number) => {
    trackCustom('resource_load', {
      resource,
      type: getResourceType(resource)
    }, {
      loadTime,
      size: size || 0
    });
  }, [trackCustom]);

  return {
    trackRenderTime,
    trackApiCall,
    trackResourceLoad
  };
}

function getResourceType(url: string): string {
  if (url.includes('.js')) return 'script';
  if (url.includes('.css')) return 'stylesheet';
  if (url.includes('.png') || url.includes('.jpg') || url.includes('.gif')) return 'image';
  if (url.includes('.woff') || url.includes('.ttf')) return 'font';
  return 'other';
}

// ============================================================================
// ERROR BOUNDARY INTEGRATION
// ============================================================================

export class TelemetryErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    });
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} />;
      }
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  trackPageView,
  trackUserAction,
  trackError,
  trackCustom,
  setTelemetryUser,
  getTelemetry
};

export default {
  initialize: initializeWebTelemetry,
  trackPageView,
  trackUserAction,
  trackError,
  trackCustom,
  setTelemetryUser,
  useTelemetry,
  usePageTracking,
  useUserTracking,
  withTelemetry,
  useFormTracking,
  usePerformanceTracking,
  TelemetryErrorBoundary
};
