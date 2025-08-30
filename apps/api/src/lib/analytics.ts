interface AnalyticsEvent {
  type: string;
  timestamp: string;
  org: string;
  userId?: string;
  data: any;
}

interface AnalyticsMetrics {
  totalRequests: number;
  uniqueUsers: number;
  popularModels: Record<string, number>;
  costByOrg: Record<string, number>;
  errorRate: number;
  avgLatency: number;
}

class AnalyticsSystem {
  private events: AnalyticsEvent[] = [];
  private readonly MAX_EVENTS = 10000; // Mantener solo los últimos 10k eventos

  trackEvent(type: string, org: string, data: any, userId?: string): void {
    const event: AnalyticsEvent = {
      type,
      timestamp: new Date().toISOString(),
      org,
      userId,
      data
    };

    this.events.push(event);

    // Limpiar eventos antiguos si excedemos el límite
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }
  }

  trackAIRequest(org: string, model: string, tokens: number, cost: number, latency: number, userId?: string): void {
    this.trackEvent('ai_request', org, {
      model,
      tokens,
      cost,
      latency,
      provider: process.env.AZURE_OPENAI_API_KEY ? 'azure' : 'demo'
    }, userId);
  }

  trackSearch(org: string, query: string, results: number, userId?: string): void {
    this.trackEvent('search', org, {
      query,
      results,
      provider: this.getSearchProvider()
    }, userId);
  }

  trackError(org: string, error: string, endpoint: string, userId?: string): void {
    this.trackEvent('error', org, {
      error,
      endpoint,
      timestamp: new Date().toISOString()
    }, userId);
  }

  trackBudgetUsage(org: string, current: number, limit: number): void {
    this.trackEvent('budget_usage', org, {
      current,
      limit,
      percentage: (current / limit) * 100
    });
  }

  getMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): AnalyticsMetrics {
    const now = new Date();
    const cutoff = this.getCutoffTime(now, timeRange);
    
    const filteredEvents = this.events.filter(event => 
      new Date(event.timestamp) >= cutoff
    );

    const totalRequests = filteredEvents.filter(e => e.type === 'ai_request').length;
    const uniqueUsers = new Set(filteredEvents.map(e => e.userId).filter(Boolean)).size;
    
    const popularModels: Record<string, number> = {};
    const costByOrg: Record<string, number> = {};
    let totalLatency = 0;
    let latencyCount = 0;
    let errorCount = 0;

    filteredEvents.forEach(event => {
      if (event.type === 'ai_request') {
        // Popular models
        const model = event.data.model;
        popularModels[model] = (popularModels[model] || 0) + 1;

        // Cost by org
        const cost = event.data.cost || 0;
        costByOrg[event.org] = (costByOrg[event.org] || 0) + cost;

        // Average latency
        if (event.data.latency) {
          totalLatency += event.data.latency;
          latencyCount++;
        }
      } else if (event.type === 'error') {
        errorCount++;
      }
    });

    return {
      totalRequests,
      uniqueUsers,
      popularModels,
      costByOrg,
      errorRate: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
      avgLatency: latencyCount > 0 ? totalLatency / latencyCount : 0
    };
  }

  getPopularQueries(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Record<string, number> {
    const now = new Date();
    const cutoff = this.getCutoffTime(now, timeRange);
    
    const searchEvents = this.events.filter(event => 
      event.type === 'search' && new Date(event.timestamp) >= cutoff
    );

    const queries: Record<string, number> = {};
    searchEvents.forEach(event => {
      const query = event.data.query;
      queries[query] = (queries[query] || 0) + 1;
    });

    return queries;
  }

  getOrgUsage(org: string, timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): any {
    const now = new Date();
    const cutoff = this.getCutoffTime(now, timeRange);
    
    const orgEvents = this.events.filter(event => 
      event.org === org && new Date(event.timestamp) >= cutoff
    );

    const aiRequests = orgEvents.filter(e => e.type === 'ai_request');
    const searches = orgEvents.filter(e => e.type === 'search');
    const errors = orgEvents.filter(e => e.type === 'error');

    const totalCost = aiRequests.reduce((sum, e) => sum + (e.data.cost || 0), 0);
    const totalTokens = aiRequests.reduce((sum, e) => sum + (e.data.tokens || 0), 0);
    const avgLatency = aiRequests.length > 0 
      ? aiRequests.reduce((sum, e) => sum + (e.data.latency || 0), 0) / aiRequests.length 
      : 0;

    return {
      org,
      timeRange,
      aiRequests: aiRequests.length,
      searches: searches.length,
      errors: errors.length,
      totalCost,
      totalTokens,
      avgLatency,
      errorRate: aiRequests.length > 0 ? (errors.length / aiRequests.length) * 100 : 0
    };
  }

  private getCutoffTime(now: Date, timeRange: string): Date {
    const cutoff = new Date(now);
    switch (timeRange) {
      case '1h':
        cutoff.setHours(cutoff.getHours() - 1);
        break;
      case '24h':
        cutoff.setDate(cutoff.getDate() - 1);
        break;
      case '7d':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case '30d':
        cutoff.setDate(cutoff.getDate() - 30);
        break;
    }
    return cutoff;
  }

  private getSearchProvider(): string {
    if (process.env.BING_SEARCH_KEY) return 'bing';
    if (process.env.GOOGLE_SEARCH_API_KEY) return 'google';
    return 'demo';
  }

  // Método para exportar datos
  exportData(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Método para limpiar datos antiguos
  cleanup(): void {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30); // Mantener solo 30 días
    
    this.events = this.events.filter(event => 
      new Date(event.timestamp) >= cutoff
    );
  }
}

export const analytics = new AnalyticsSystem();
