// ============================================================================
// METRICS CLIENT - WEB INTEGRATION
// ============================================================================

import { 
  initializeMetrics, 
  getMetrics, 
  PredefinedMetrics,
  counter,
  gauge,
  histogram
} from '@econeura/shared/metrics';

// ============================================================================
// METRICS INITIALIZATION
// ============================================================================

// Initialize metrics service for web client
const metricsService = initializeMetrics({
  enabled: process.env.NEXT_PUBLIC_METRICS_ENABLED !== 'false',
  endpoint: process.env.NEXT_PUBLIC_METRICS_ENDPOINT,
  apiKey: process.env.NEXT_PUBLIC_METRICS_API_KEY,
  debugMode: process.env.NODE_ENV === 'development'
});

// ============================================================================
// WEB METRICS TRACKING
// ============================================================================

export function trackPageView(page: string, organizationId?: string): void {
  counter(PredefinedMetrics.PAGE_VIEWS_TOTAL, 1, {
    page,
    organization_id: organizationId || 'unknown'
  });
}

export function trackUserAction(action: string, organizationId?: string): void {
  counter(PredefinedMetrics.USER_ACTIONS_TOTAL, 1, {
    action,
    organization_id: organizationId || 'unknown'
  });
}

export function trackFormSubmission(form: string, success: boolean, organizationId?: string): void {
  counter(PredefinedMetrics.FORM_SUBMISSIONS_TOTAL, 1, {
    form,
    success: success.toString(),
    organization_id: organizationId || 'unknown'
  });
}

export function trackError(error: string, page?: string, organizationId?: string): void {
  counter(PredefinedMetrics.CLIENT_ERRORS_TOTAL, 1, {
    error,
    page: page || 'unknown',
    organization_id: organizationId || 'unknown'
  });
}

export function trackPerformance(metric: string, value: number, page?: string): void {
  gauge(PredefinedMetrics.CLIENT_PERFORMANCE, value, {
    metric,
    page: page || 'unknown'
  });
}

export function trackAPICall(endpoint: string, method: string, duration: number, success: boolean): void {
  counter(PredefinedMetrics.API_CALLS_TOTAL, 1, {
    endpoint,
    method,
    success: success.toString()
  });

  histogram(PredefinedMetrics.API_CALL_DURATION, duration / 1000, {
    endpoint,
    method,
    success: success.toString()
  });
}

// ============================================================================
// WEB VITALS TRACKING
// ============================================================================

export function trackWebVitals(metric: string, value: number, page: string): void {
  gauge(PredefinedMetrics.WEB_VITALS, value, {
    metric,
    page
  });
}

export function trackLCP(value: number, page: string): void {
  trackWebVitals('lcp', value, page);
}

export function trackFID(value: number, page: string): void {
  trackWebVitals('fid', value, page);
}

export function trackCLS(value: number, page: string): void {
  trackWebVitals('cls', value, page);
}

export function trackFCP(value: number, page: string): void {
  trackWebVitals('fcp', value, page);
}

export function trackTTFB(value: number, page: string): void {
  trackWebVitals('ttfb', value, page);
}

// ============================================================================
// BUSINESS METRICS TRACKING
// ============================================================================

export function trackContactCreated(organizationId?: string): void {
  counter(PredefinedMetrics.CONTACTS_TOTAL, 1, {
    action: 'created',
    organization_id: organizationId || 'unknown'
  });
}

export function trackContactUpdated(organizationId?: string): void {
  counter(PredefinedMetrics.CONTACTS_TOTAL, 1, {
    action: 'updated',
    organization_id: organizationId || 'unknown'
  });
}

export function trackContactDeleted(organizationId?: string): void {
  counter(PredefinedMetrics.CONTACTS_TOTAL, 1, {
    action: 'deleted',
    organization_id: organizationId || 'unknown'
  });
}

export function trackDealCreated(organizationId?: string): void {
  counter(PredefinedMetrics.DEALS_TOTAL, 1, {
    action: 'created',
    organization_id: organizationId || 'unknown'
  });
}

export function trackDealUpdated(organizationId?: string): void {
  counter(PredefinedMetrics.DEALS_TOTAL, 1, {
    action: 'updated',
    organization_id: organizationId || 'unknown'
  });
}

export function trackDealClosed(organizationId?: string): void {
  counter(PredefinedMetrics.DEALS_TOTAL, 1, {
    action: 'closed',
    organization_id: organizationId || 'unknown'
  });
}

export function trackOrderCreated(organizationId?: string): void {
  counter(PredefinedMetrics.ORDERS_TOTAL, 1, {
    action: 'created',
    organization_id: organizationId || 'unknown'
  });
}

export function trackOrderUpdated(organizationId?: string): void {
  counter(PredefinedMetrics.ORDERS_TOTAL, 1, {
    action: 'updated',
    organization_id: organizationId || 'unknown'
  });
}

export function trackOrderCompleted(organizationId?: string): void {
  counter(PredefinedMetrics.ORDERS_TOTAL, 1, {
    action: 'completed',
    organization_id: organizationId || 'unknown'
  });
}

// ============================================================================
// AI METRICS TRACKING
// ============================================================================

export function trackAIRequest(action: string, tokens?: number, cost?: number): void {
  counter(PredefinedMetrics.AI_REQUESTS_TOTAL, 1, {
    action
  });

  if (tokens) {
    counter(PredefinedMetrics.AI_TOKENS_USED, tokens, {
      action
    });
  }
}

export function trackAISuccess(action: string, tokens?: number): void {
  counter(PredefinedMetrics.AI_REQUESTS_TOTAL, 1, {
    action,
    status: 'success'
  });

  if (tokens) {
    counter(PredefinedMetrics.AI_TOKENS_USED, tokens, {
      action,
      status: 'success'
    });
  }
}

export function trackAIFailure(action: string, error: string): void {
  counter(PredefinedMetrics.AI_REQUESTS_TOTAL, 1, {
    action,
    status: 'failure',
    error
  });
}

// ============================================================================
// METRICS UTILITIES
// ============================================================================

export async function getMetricsData(): Promise<any> {
  try {
    const response = await fetch('/api/metrics', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get metrics data:', error);
    throw error;
  }
}

export async function getSystemMetrics(): Promise<any> {
  try {
    const response = await fetch('/api/metrics/system', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get system metrics:', error);
    throw error;
  }
}

export async function getBusinessMetrics(): Promise<any> {
  try {
    const response = await fetch('/api/metrics/business', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get business metrics:', error);
    throw error;
  }
}

export async function getPerformanceMetrics(): Promise<any> {
  try {
    const response = await fetch('/api/metrics/performance', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get performance metrics:', error);
    throw error;
  }
}

export async function getErrorMetrics(): Promise<any> {
  try {
    const response = await fetch('/api/metrics/errors', {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to get error metrics:', error);
    throw error;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  metricsService,
  PredefinedMetrics
};

export default {
  trackPageView,
  trackUserAction,
  trackFormSubmission,
  trackError,
  trackPerformance,
  trackAPICall,
  trackWebVitals,
  trackLCP,
  trackFID,
  trackCLS,
  trackFCP,
  trackTTFB,
  trackContactCreated,
  trackContactUpdated,
  trackContactDeleted,
  trackDealCreated,
  trackDealUpdated,
  trackDealClosed,
  trackOrderCreated,
  trackOrderUpdated,
  trackOrderCompleted,
  trackAIRequest,
  trackAISuccess,
  trackAIFailure,
  getMetricsData,
  getSystemMetrics,
  getBusinessMetrics,
  getPerformanceMetrics,
  getErrorMetrics
};
