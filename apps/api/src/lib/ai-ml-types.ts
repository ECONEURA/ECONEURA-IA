/**
 * AI/ML Types for ECONEURA Platform
 * 
 * Comprehensive type definitions for AI/ML automation, predictive analytics,
 * and the 60-agent registry system.
 */

import { z } from 'zod';

// ============================================================================
// PREDICTION TYPES
// ============================================================================

export interface Prediction {
  id: string;
  modelId: string;
  type: 'forecast' | 'classification' | 'regression' | 'anomaly' | 'recommendation' | 'clustering';
  input: Record<string, any>;
  output: Record<string, any>;
  confidence: number; // 0-1
  accuracy?: number; // 0-1, if available
  timestamp: Date;
  organizationId: string;
  createdBy: string;
  metadata?: Record<string, any>;
  tags: string[];
}

export interface CreatePredictionRequest {
  modelId: string;
  type: Prediction['type'];
  input: Record<string, any>;
  metadata?: Record<string, any>;
}

// ============================================================================
// FORECASTING TYPES
// ============================================================================

export interface ForecastPoint {
  timestamp: Date;
  value: number;
  confidence: number; // 0-1
}

export interface Forecast {
  id: string;
  modelId: string;
  series: string;
  horizon: number;
  frequency: 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly';
  predictions: ForecastPoint[];
  confidenceInterval: {
    lower: number[];
    upper: number[];
  };
  accuracy: number; // 0-1
  mape: number; // Mean Absolute Percentage Error
  rmse: number; // Root Mean Square Error
  mae: number; // Mean Absolute Error
  timestamp: Date;
  organizationId: string;
  metadata?: Record<string, any>;
}

export interface CreateForecastRequest {
  modelId: string;
  series: string;
  horizon: number;
  frequency: Forecast['frequency'];
  input: {
    baseValue?: number;
    trend?: number;
    seasonality?: number;
    confidenceLevel?: number;
  };
  metadata?: Record<string, any>;
}

// ============================================================================
// ANOMALY DETECTION TYPES
// ============================================================================

export interface AnomalyDetection {
  id: string;
  modelId: string;
  dataPoint: Record<string, any>;
  anomalyScore: number; // 0-1
  threshold: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  explanation: string;
  recommendations: string[];
  timestamp: Date;
  organizationId: string;
  metadata: Record<string, any>;
}

// ============================================================================
// RECOMMENDATION SYSTEM TYPES
// ============================================================================

export interface RecommendationItem {
  itemId: string;
  score: number; // 0-1
  reason: string;
  metadata: Record<string, any>;
}

export interface Recommendation {
  id: string;
  modelId: string;
  userId?: string;
  itemId?: string;
  context: Record<string, any>;
  recommendations: RecommendationItem[];
  confidence: number; // 0-1
  algorithm: string;
  timestamp: Date;
  organizationId: string;
  metadata: Record<string, any>;
}

// ============================================================================
// AGENT SYSTEM TYPES
// ============================================================================

export interface AgentDescriptor {
  id: string;
  name: string;
  description: string;
  category: 'sales' | 'marketing' | 'operations' | 'finance' | 'support';
  inputs: z.ZodSchema<any>;
  outputs: z.ZodSchema<any>;
  policy: AgentPolicy;
  costHint: number; // Estimated cost in EUR
  version: string;
  enabled: boolean;
  maxRetries: number;
  timeoutMs: number;
}

export interface AgentPolicy {
  requiresApproval: boolean;
  maxCostEUR: number;
  allowedProviders: ('mistral' | 'azure-openai')[];
  sensitivityLevel: 'low' | 'medium' | 'high';
  rateLimitPerHour: number;
}

export interface AgentRun {
  id: string;
  agentId: string;
  organizationId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  costEUR: number;
  provider: 'mistral' | 'azure-openai' | null;
  retryCount: number;
  idempotencyKey?: string;
  correlationId: string;
  metadata: Record<string, any>;
}

export interface AgentTask {
  id: string;
  runId: string;
  agentId: string;
  organizationId: string;
  step: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  inputs: Record<string, any>;
  outputs?: Record<string, any>;
  error?: string;
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  costEUR: number;
}

// ============================================================================
// AGENT EXECUTION TYPES
// ============================================================================

export interface RunAgentRequest {
  agentId: string;
  inputs: Record<string, any>;
  idempotencyKey?: string;
  maxCostEUR?: number;
  providerHint?: 'mistral' | 'azure-openai';
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export interface RunAgentResponse {
  runId: string;
  status: AgentRun['status'];
  estimatedDurationMs: number;
  estimatedCostEUR: number;
  queuePosition?: number;
}

export interface GetAgentRunResponse {
  run: AgentRun;
  tasks: AgentTask[];
  logs: AgentLog[];
}

export interface AgentLog {
  id: string;
  runId: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// ============================================================================
// COCKPIT TYPES
// ============================================================================

export interface CockpitOverview {
  agents: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    queued: number;
  };
  costs: {
    totalEUR: number;
    todayEUR: number;
    averagePerRun: number;
    budgetUsedPct: number;
  };
  performance: {
    avgDurationMs: number;
    successRate: number;
    p95DurationMs: number;
    throughputPerHour: number;
  };
  providers: {
    mistralUsage: number;
    azureOpenAIUsage: number;
    fallbackRate: number;
  };
  alerts: CockpitAlert[];
  timestamp: Date;
}

export interface CockpitAlert {
  id: string;
  type: 'budget' | 'performance' | 'error' | 'capacity';
  severity: 'info' | 'warning' | 'error' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface AgentMetrics {
  agentId: string;
  name: string;
  category: string;
  runs: {
    total: number;
    completed: number;
    failed: number;
    avgDurationMs: number;
    successRate: number;
  };
  costs: {
    totalEUR: number;
    avgCostPerRun: number;
    costTrend: 'up' | 'down' | 'stable';
  };
  performance: {
    p50DurationMs: number;
    p95DurationMs: number;
    p99DurationMs: number;
    throughputPerHour: number;
  };
  lastRun?: Date;
  enabled: boolean;
}

export interface CostMetrics {
  organizationId: string;
  period: 'hour' | 'day' | 'week' | 'month';
  totalCostEUR: number;
  budgetEUR: number;
  budgetUsedPct: number;
  costByProvider: Record<string, number>;
  costByAgent: Record<string, number>;
  costByCategory: Record<string, number>;
  trend: Array<{
    timestamp: Date;
    cost: number;
  }>;
  projectedMonthlyEUR: number;
  alerts: CockpitAlert[];
}

// ============================================================================
// PREDICTIVE ANALYTICS CONFIG
// ============================================================================

export interface PredictiveAnalyticsConfig {
  forecasting: boolean;
  anomalyDetection: boolean;
  riskPrediction: boolean;
  customerBehaviorPrediction: boolean;
  marketAnalysis: boolean;
  performancePrediction: boolean;
  churnPrediction: boolean;
  demandForecasting: boolean;
}

// ============================================================================
// ZOD SCHEMAS FOR VALIDATION
// ============================================================================

export const CreatePredictionRequestSchema = z.object({
  modelId: z.string().min(1),
  type: z.enum(['forecast', 'classification', 'regression', 'anomaly', 'recommendation', 'clustering']),
  input: z.record(z.unknown()),
  metadata: z.record(z.unknown()).optional(),
});

export const CreateForecastRequestSchema = z.object({
  modelId: z.string().min(1),
  series: z.string().min(1),
  horizon: z.number().int().positive().max(365),
  frequency: z.enum(['hourly', 'daily', 'weekly', 'monthly', 'yearly']),
  input: z.object({
    baseValue: z.number().optional(),
    trend: z.number().optional(),
    seasonality: z.number().optional(),
    confidenceLevel: z.number().min(0).max(1).optional(),
  }),
  metadata: z.record(z.unknown()).optional(),
});

export const RunAgentRequestSchema = z.object({
  agentId: z.string().min(1),
  inputs: z.record(z.unknown()),
  idempotencyKey: z.string().optional(),
  maxCostEUR: z.number().positive().optional(),
  providerHint: z.enum(['mistral', 'azure-openai']).optional(),
  priority: z.enum(['low', 'normal', 'high']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isPrediction(obj: any): obj is Prediction {
  return obj && typeof obj.id === 'string' && typeof obj.modelId === 'string';
}

export function isForecast(obj: any): obj is Forecast {
  return obj && typeof obj.id === 'string' && Array.isArray(obj.predictions);
}

export function isAgentRun(obj: any): obj is AgentRun {
  return obj && typeof obj.id === 'string' && typeof obj.agentId === 'string';
}

// ============================================================================
// EXPORT ALL TYPES
// ============================================================================

export type {
  Prediction,
  CreatePredictionRequest,
  ForecastPoint,
  Forecast,
  CreateForecastRequest,
  AnomalyDetection,
  RecommendationItem,
  Recommendation,
  AgentDescriptor,
  AgentPolicy,
  AgentRun,
  AgentTask,
  RunAgentRequest,
  RunAgentResponse,
  GetAgentRunResponse,
  AgentLog,
  CockpitOverview,
  CockpitAlert,
  AgentMetrics,
  CostMetrics,
  PredictiveAnalyticsConfig,
};
