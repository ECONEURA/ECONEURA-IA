// ============================================================================
// METRICS PROVIDER - REACT CONTEXT
// ============================================================================

'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  trackPageView, 
  trackUserAction, 
  trackError, 
  trackPerformance,
  getMetricsData,
  getSystemMetrics,
  getBusinessMetrics,
  getPerformanceMetrics,
  getErrorMetrics
} from '../lib/metrics.js';

// ============================================================================
// TYPES
// ============================================================================

interface MetricsContextType {
  // Tracking functions
  trackPageView: (page: string, organizationId?: string) => void;
  trackUserAction: (action: string, organizationId?: string) => void;
  trackError: (error: string, page?: string, organizationId?: string) => void;
  trackPerformance: (metric: string, value: number, page?: string) => void;
  
  // Data fetching functions
  getMetricsData: () => Promise<any>;
  getSystemMetrics: () => Promise<any>;
  getBusinessMetrics: () => Promise<any>;
  getPerformanceMetrics: () => Promise<any>;
  getErrorMetrics: () => Promise<any>;
  
  // State
  isLoading: boolean;
  error: string | null;
}

interface MetricsProviderProps {
  children: ReactNode;
  organizationId?: string;
}

// ============================================================================
// CONTEXT
// ============================================================================

const MetricsContext = createContext<MetricsContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

export function MetricsProvider({ children, organizationId }: MetricsProviderProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  const handleError = (error: string, page?: string): void => {
    setError(error);
    trackError(error, page, organizationId);
  };

  // ============================================================================
  // WRAPPED FUNCTIONS
  // ============================================================================

  const wrappedTrackPageView = (page: string, orgId?: string): void => {
    try {
      trackPageView(page, orgId || organizationId);
    } catch (err) {
      handleError(`Failed to track page view: ${err}`, page);
    }
  };

  const wrappedTrackUserAction = (action: string, orgId?: string): void => {
    try {
      trackUserAction(action, orgId || organizationId);
    } catch (err) {
      handleError(`Failed to track user action: ${err}`);
    }
  };

  const wrappedTrackError = (error: string, page?: string, orgId?: string): void => {
    try {
      trackError(error, page, orgId || organizationId);
    } catch (err) {
      handleError(`Failed to track error: ${err}`, page);
    }
  };

  const wrappedTrackPerformance = (metric: string, value: number, page?: string): void => {
    try {
      trackPerformance(metric, value, page);
    } catch (err) {
      handleError(`Failed to track performance: ${err}`, page);
    }
  };

  const wrappedGetMetricsData = async (): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getMetricsData();
      return data;
    } catch (err) {
      const errorMsg = `Failed to get metrics data: ${err}`;
      handleError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const wrappedGetSystemMetrics = async (): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getSystemMetrics();
      return data;
    } catch (err) {
      const errorMsg = `Failed to get system metrics: ${err}`;
      handleError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const wrappedGetBusinessMetrics = async (): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getBusinessMetrics();
      return data;
    } catch (err) {
      const errorMsg = `Failed to get business metrics: ${err}`;
      handleError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const wrappedGetPerformanceMetrics = async (): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getPerformanceMetrics();
      return data;
    } catch (err) {
      const errorMsg = `Failed to get performance metrics: ${err}`;
      handleError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const wrappedGetErrorMetrics = async (): Promise<any> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await getErrorMetrics();
      return data;
    } catch (err) {
      const errorMsg = `Failed to get error metrics: ${err}`;
      handleError(errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const contextValue: MetricsContextType = {
    trackPageView: wrappedTrackPageView,
    trackUserAction: wrappedTrackUserAction,
    trackError: wrappedTrackError,
    trackPerformance: wrappedTrackPerformance,
    getMetricsData: wrappedGetMetricsData,
    getSystemMetrics: wrappedGetSystemMetrics,
    getBusinessMetrics: wrappedGetBusinessMetrics,
    getPerformanceMetrics: wrappedGetPerformanceMetrics,
    getErrorMetrics: wrappedGetErrorMetrics,
    isLoading,
    error
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    // Track initial page view
    if (typeof window !== 'undefined') {
      const currentPage = window.location.pathname;
      wrappedTrackPageView(currentPage);
    }
  }, []);

  useEffect(() => {
    // Track page changes
    const handleRouteChange = (): void => {
      if (typeof window !== 'undefined') {
        const currentPage = window.location.pathname;
        wrappedTrackPageView(currentPage);
      }
    };

    // Listen for route changes (Next.js)
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', handleRouteChange);
      
      return () => {
        window.removeEventListener('popstate', handleRouteChange);
      };
    }
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <MetricsContext.Provider value={contextValue}>
      {children}
    </MetricsContext.Provider>
  );
}

// ============================================================================
// HOOK
// ============================================================================

export function useMetrics(): MetricsContextType {
  const context = useContext(MetricsContext);
  
  if (context === undefined) {
    throw new Error('useMetrics must be used within a MetricsProvider');
  }
  
  return context;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default MetricsProvider;
