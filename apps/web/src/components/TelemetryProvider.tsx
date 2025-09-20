// ============================================================================
// TELEMETRY PROVIDER - REACT CONTEXT
// ============================================================================

'use client';

import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { 
  initializeWebTelemetry, 
  setTelemetryUser, 
  trackPageView,
  useTelemetry,
  useUserTracking 
} from '../lib/telemetry';

// ============================================================================
// TYPES
// ============================================================================

interface TelemetryContextType {
  track: (action: string, element?: string, context?: Record<string, any>) => void;
  trackError: (error: Error | string, context?: Record<string, any>) => void;
  trackCustom: (name: string, properties?: Record<string, any>, metrics?: Record<string, number>) => void;
  setUser: (userId: string, organizationId?: string) => void;
}

interface TelemetryProviderProps {
  children: ReactNode;
  config?: {
    enabled?: boolean;
    endpoint?: string;
    apiKey?: string;
    sampleRate?: number;
    privacyMode?: boolean;
    debugMode?: boolean;
  };
  userId?: string;
  organizationId?: string;
  page?: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const TelemetryContext = createContext<TelemetryContextType | null>(null);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function TelemetryProvider({ 
  children, 
  config = {}, 
  userId, 
  organizationId, 
  page 
}: TelemetryProviderProps) {
  const { track, trackError, trackCustom } = useTelemetry();

  // Initialize telemetry on mount
  useEffect(() => {
    initializeWebTelemetry(config);
  }, [config]);

  // Set user when provided
  useUserTracking(userId || '', organizationId);

  // Track page view when page changes
  useEffect(() => {
    if (page) {
      trackPageView(page, {
        userId,
        organizationId,
        timestamp: Date.now()
      });
    }
  }, [page, userId, organizationId]);

  const setUser = (newUserId: string, newOrganizationId?: string) => {
    setTelemetryUser(newUserId, newOrganizationId);
  };

  const contextValue: TelemetryContextType = {
    track,
    trackError,
    trackCustom,
    setUser
  };

  return (
    <TelemetryContext.Provider value={contextValue}>
      {children}
    </TelemetryContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useTelemetryContext(): TelemetryContextType {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error('useTelemetryContext must be used within a TelemetryProvider');
  }
  return context;
}

// ============================================================================
// HIGHER-ORDER COMPONENT
// ============================================================================

export function withTelemetryProvider<P extends object>(
  Component: React.ComponentType<P>,
  defaultConfig?: TelemetryProviderProps['config']
) {
  return function TelemetryProviderWrapper(props: P & TelemetryProviderProps) {
    const { children, config, userId, organizationId, page, ...componentProps } = props;
    
    return (
      <TelemetryProvider 
        config={{ ...defaultConfig, ...config }}
        userId={userId}
        organizationId={organizationId}
        page={page}
      >
        <Component {...(componentProps as P)} />
        {children}
      </TelemetryProvider>
    );
  };
}

// ============================================================================
// AUTOMATIC TRACKING COMPONENTS
// ============================================================================

interface TrackedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  trackingAction?: string;
  trackingContext?: Record<string, any>;
  children: ReactNode;
}

export function TrackedButton({ 
  trackingAction = 'button_click', 
  trackingContext = {}, 
  onClick,
  children,
  ...props 
}: TrackedButtonProps) {
  const { track } = useTelemetryContext();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    track(trackingAction, 'button', {
      ...trackingContext,
      buttonText: typeof children === 'string' ? children : 'button',
      timestamp: Date.now()
    });

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <button {...props} onClick={handleClick}>
      {children}
    </button>
  );
}

interface TrackedLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  trackingAction?: string;
  trackingContext?: Record<string, any>;
  children: ReactNode;
}

export function TrackedLink({ 
  trackingAction = 'link_click', 
  trackingContext = {}, 
  onClick,
  children,
  ...props 
}: TrackedLinkProps) {
  const { track } = useTelemetryContext();

  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    track(trackingAction, 'link', {
      ...trackingContext,
      href: props.href,
      linkText: typeof children === 'string' ? children : 'link',
      timestamp: Date.now()
    });

    if (onClick) {
      onClick(event);
    }
  };

  return (
    <a {...props} onClick={handleClick}>
      {children}
    </a>
  );
}

interface TrackedFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  trackingAction?: string;
  trackingContext?: Record<string, any>;
  children: ReactNode;
}

export function TrackedForm({ 
  trackingAction = 'form_submit', 
  trackingContext = {}, 
  onSubmit,
  children,
  ...props 
}: TrackedFormProps) {
  const { track } = useTelemetryContext();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(event.currentTarget);
    const formFields = Array.from(formData.keys());

    track(trackingAction, 'form', {
      ...trackingContext,
      fieldCount: formFields.length,
      fields: formFields,
      timestamp: Date.now()
    });

    if (onSubmit) {
      onSubmit(event);
    }
  };

  return (
    <form {...props} onSubmit={handleSubmit}>
      {children}
    </form>
  );
}

// ============================================================================
// PERFORMANCE TRACKING COMPONENT
// ============================================================================

interface PerformanceTrackerProps {
  componentName: string;
  children: ReactNode;
  trackRender?: boolean;
  trackMount?: boolean;
  trackUnmount?: boolean;
}

export function PerformanceTracker({ 
  componentName, 
  children, 
  trackRender = true,
  trackMount = true,
  trackUnmount = true
}: PerformanceTrackerProps) {
  const { track, trackCustom } = useTelemetryContext();

  useEffect(() => {
    if (trackMount) {
      const startTime = performance.now();
      track('component_mount', componentName, {
        componentName,
        timestamp: Date.now()
      });

      return () => {
        if (trackUnmount) {
          const endTime = performance.now();
          track('component_unmount', componentName, {
            componentName,
            lifetime: endTime - startTime,
            timestamp: Date.now()
          });
        }
      };
    }
  }, [track, componentName, trackMount, trackUnmount]);

  useEffect(() => {
    if (trackRender) {
      const startTime = performance.now();
      
      return () => {
        const endTime = performance.now();
        trackCustom('component_render_time', {
          component: componentName
        }, {
          renderTime: endTime - startTime
        });
      };
    }
  }, [trackCustom, componentName, trackRender]);

  return <>{children}</>;
}

// ============================================================================
// ERROR BOUNDARY WITH TELEMETRY
// ============================================================================

interface TelemetryErrorBoundaryProps {
  children: ReactNode;
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface TelemetryErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class TelemetryErrorBoundary extends React.Component<
  TelemetryErrorBoundaryProps,
  TelemetryErrorBoundaryState
> {
  constructor(props: TelemetryErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): TelemetryErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Track error with telemetry
    const { trackError } = useTelemetryContext();
    trackError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: Date.now()
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} resetError={this.resetError} />;
      }
      
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>An error occurred while rendering this component.</p>
          <button onClick={this.resetError}>Try again</button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default TelemetryProvider;
