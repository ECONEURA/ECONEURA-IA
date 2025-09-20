import { TenantEntity } from '../models/base.js';

/**
 * System metrics
 */
export interface SystemMetrics {
  cpu: {
    usage: number;
    load: number[];
  };
  memory: {
    total: number;
    used: number;
    free: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
  };
}

/**
 * Application metrics
 */
export interface AppMetrics {
  requests: {
    total: number;
    success: number;
    failed: number;
    latency: {
      p50: number;
      p90: number;
      p99: number;
    };
  };
  database: {
    connections: number;
    queryTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
  };
  queue: {
    size: number;
    processed: number;
    failed: number;
  };
}

/**
 * Resource usage
 */
export interface ResourceUsage extends TenantEntity {
  period: 'hourly' | 'daily' | 'monthly';
  timestamp: Date;
  
  // API usage
  requests: number;
  bandwidth: number;
  
  // Compute usage
  computeUnits: number;
  storageGb: number;
  
  // AI usage
  aiTokens: number;
  aiCalls: number;
  
  // Costs
  costEur: number;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  name: string;
  description: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq';
  threshold: number;
  window: string; // e.g., '5m', '1h'
  severity: 'info' | 'warning' | 'error' | 'critical';
  enabled: boolean;
  notifications: {
    channels: string[];
    cooldown: string;
  };
}

/**
 * Alert event
 */
export interface AlertEvent extends TenantEntity {
  configId: string;
  status: 'triggered' | 'resolved';
  severity: 'info' | 'warning' | 'error' | 'critical';
  metric: string;
  value: number;
  threshold: number;
  message: string;
  metadata: Record<string, unknown>;
}
