import { logger } from './logger.js';

interface GraphTokenRotationConfig {
  enabled: boolean;
  rotationIntervalMs: number;
  failureRate: number;
  latencyMs: {
    min: number;
    max: number;
  };
  errorTypes: string[];
  simulationMode: boolean;
}

interface GraphToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  tokenType: string;
  scope: string;
  issuedAt: string;
}

interface GraphChaosEvent {
  id: string;
  type: 'token_rotation' | 'token_expiry' | 'api_failure' | 'latency_injection';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  metadata: {
    endpoint?: string;
    method?: string;
    statusCode?: number;
    latency?: number;
    tokenId?: string;
    errorMessage?: string;
  };
}

class GraphChaosLightService {
  private config: GraphTokenRotationConfig;
  private tokens: Map<string, GraphToken> = new Map();
  private chaosEvents: GraphChaosEvent[] = [];
  private rotationInterval?: NodeJS.Timeout;
  private isRunning = false;

  constructor() {
    this.config = {
      enabled: process.env.GRAPH_CHAOS_ENABLED === 'true',
      rotationIntervalMs: Number(process.env.GRAPH_CHAOS_ROTATION_INTERVAL || 30000), // 30 seconds
      failureRate: Number(process.env.GRAPH_CHAOS_FAILURE_RATE || 0.1), // 10%
      latencyMs: {
        min: Number(process.env.GRAPH_CHAOS_LATENCY_MIN || 100),
        max: Number(process.env.GRAPH_CHAOS_LATENCY_MAX || 500),
      },
      errorTypes: ['token_expired', 'rate_limit', 'service_unavailable', 'unauthorized'],
      simulationMode: process.env.GRAPH_CHAOS_SIMULATION_MODE !== 'false',
    };

    this.initializeDemoTokens();
    this.startTokenRotation();
    
    logger.info('Graph Chaos Light Service initialized', {
      config: this.config,
      requestId: ''
    });
  }

  private initializeDemoTokens() {
    const now = new Date();
    const demoTokens: GraphToken[] = [
      {
        accessToken: 'demo_access_token_1',
        refreshToken: 'demo_refresh_token_1',
        expiresAt: new Date(now.getTime() + 3600000).toISOString(), // 1 hour
        tokenType: 'Bearer',
        scope: 'https://graph.microsoft.com/.default',
        issuedAt: now.toISOString(),
      },
      {
        accessToken: 'demo_access_token_2',
        refreshToken: 'demo_refresh_token_2',
        expiresAt: new Date(now.getTime() + 1800000).toISOString(), // 30 minutes
        tokenType: 'Bearer',
        scope: 'https://graph.microsoft.com/.default',
        issuedAt: new Date(now.getTime() - 1800000).toISOString(),
      },
      {
        accessToken: 'demo_access_token_3',
        refreshToken: 'demo_refresh_token_3',
        expiresAt: new Date(now.getTime() + 7200000).toISOString(), // 2 hours
        tokenType: 'Bearer',
        scope: 'https://graph.microsoft.com/.default',
        issuedAt: new Date(now.getTime() - 3600000).toISOString(),
      },
    ];

    demoTokens.forEach((token, index) => {
      this.tokens.set(`token_${index + 1}`, token);
    });
  }

  private startTokenRotation() {
    if (!this.config.enabled || this.isRunning) return;

    this.isRunning = true;
    this.rotationInterval = setInterval(() => {
      this.performTokenRotation();
    }, this.config.rotationIntervalMs);

    logger.info('Graph token rotation started', {
      interval: this.config.rotationIntervalMs,
      requestId: ''
    });
  }

  private stopTokenRotation() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = undefined;
    }
    this.isRunning = false;

    logger.info('Graph token rotation stopped', {
      requestId: ''
    });
  }

  private performTokenRotation() {
    if (!this.config.enabled) return;

    const tokenIds = Array.from(this.tokens.keys());
    if (tokenIds.length === 0) return;

    // Select random token to rotate
    const tokenId = tokenIds[Math.floor(Math.random() * tokenIds.length)];
    const token = this.tokens.get(tokenId);
    
    if (!token) return;

    // Simulate token rotation
    const newToken: GraphToken = {
      accessToken: `rotated_access_token_${Date.now()}`,
      refreshToken: `rotated_refresh_token_${Date.now()}`,
      expiresAt: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
      tokenType: 'Bearer',
      scope: token.scope,
      issuedAt: new Date().toISOString(),
    };

    this.tokens.set(tokenId, newToken);

    // Log rotation event
    this.addChaosEvent({
      type: 'token_rotation',
      severity: 'medium',
      description: `Token rotated for ${tokenId}`,
      metadata: {
        tokenId,
        endpoint: '/oauth2/v2.0/token',
        method: 'POST',
      },
    });

    logger.info('Graph token rotated', {
      tokenId,
      newAccessToken: newToken.accessToken.substring(0, 20) + '...',
      requestId: ''
    });
  }

  private addChaosEvent(event: Omit<GraphChaosEvent, 'id' | 'timestamp'>) {
    const chaosEvent: GraphChaosEvent = {
      id: `chaos_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };

    this.chaosEvents.push(chaosEvent);

    // Keep only last 100 events
    if (this.chaosEvents.length > 100) {
      this.chaosEvents = this.chaosEvents.slice(-100);
    }
  }

  // Public methods
  async simulateGraphApiCall(endpoint: string, method: string = 'GET'): Promise<{
    success: boolean;
    statusCode: number;
    latency: number;
    error?: string;
    tokenUsed?: string;
  }> {
    // Always simulate for testing purposes, even if disabled
    const shouldSimulate = this.config.enabled || this.config.simulationMode;
    
    if (!shouldSimulate) {
      return {
        success: true,
        statusCode: 200,
        latency: 0,
      };
    }

    const startTime = Date.now();
    const shouldFail = Math.random() < this.config.failureRate;
    const latency = Math.random() * (this.config.latencyMs.max - this.config.latencyMs.min) + this.config.latencyMs.min;

    // Simulate latency
    await new Promise(resolve => setTimeout(resolve, latency));

    if (shouldFail) {
      const errorType = this.config.errorTypes[Math.floor(Math.random() * this.config.errorTypes.length)];
      let statusCode = 500;
      let errorMessage = 'Unknown error';

      switch (errorType) {
        case 'token_expired':
          statusCode = 401;
          errorMessage = 'Token has expired';
          break;
        case 'rate_limit':
          statusCode = 429;
          errorMessage = 'Rate limit exceeded';
          break;
        case 'service_unavailable':
          statusCode = 503;
          errorMessage = 'Service temporarily unavailable';
          break;
        case 'unauthorized':
          statusCode = 403;
          errorMessage = 'Insufficient permissions';
          break;
      }

      this.addChaosEvent({
        type: 'api_failure',
        severity: statusCode === 401 || statusCode === 403 ? 'high' : 'medium',
        description: `Graph API call failed: ${errorMessage}`,
        metadata: {
          endpoint,
          method,
          statusCode,
          latency,
          errorMessage,
        },
      });

      return {
        success: false,
        statusCode,
        latency,
        error: errorMessage,
      };
    }

    // Success case
    const tokenIds = Array.from(this.tokens.keys());
    const tokenId = tokenIds[Math.floor(Math.random() * tokenIds.length)];

    this.addChaosEvent({
      type: 'latency_injection',
      severity: 'low',
      description: `Graph API call successful with injected latency`,
      metadata: {
        endpoint,
        method,
        statusCode: 200,
        latency,
        tokenId,
      },
    });

    return {
      success: true,
      statusCode: 200,
      latency,
      tokenUsed: tokenId,
    };
  }

  getTokens(): GraphToken[] {
    return Array.from(this.tokens.values());
  }

  getChaosEvents(): GraphChaosEvent[] {
    return [...this.chaosEvents];
  }

  getChaosStats(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    averageLatency: number;
    failureRate: number;
  } {
    const eventsByType: Record<string, number> = {};
    const eventsBySeverity: Record<string, number> = {};
    let totalLatency = 0;
    let latencyCount = 0;
    let failureCount = 0;

    this.chaosEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1;
      
      if (event.metadata.latency) {
        totalLatency += event.metadata.latency;
        latencyCount++;
      }
      
      if (event.type === 'api_failure') {
        failureCount++;
      }
    });

    return {
      totalEvents: this.chaosEvents.length,
      eventsByType,
      eventsBySeverity,
      averageLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      failureRate: this.chaosEvents.length > 0 ? failureCount / this.chaosEvents.length : 0,
    };
  }

  updateConfig(newConfig: Partial<GraphTokenRotationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.enabled !== undefined) {
      if (newConfig.enabled && !this.isRunning) {
        this.startTokenRotation();
      } else if (!newConfig.enabled && this.isRunning) {
        this.stopTokenRotation();
      }
    }

    logger.info('Graph chaos config updated', {
      config: this.config,
      requestId: ''
    });
  }

  reset(): void {
    this.stopTokenRotation();
    this.chaosEvents = [];
    this.initializeDemoTokens();
    
    if (this.config.enabled) {
      this.startTokenRotation();
    }

    logger.info('Graph chaos service reset', {
      requestId: ''
    });
  }

  destroy(): void {
    this.stopTokenRotation();
    this.tokens.clear();
    this.chaosEvents = [];

    logger.info('Graph chaos service destroyed', {
      requestId: ''
    });
  }
}

// Singleton instance
export const graphChaosLightService = new GraphChaosLightService();
