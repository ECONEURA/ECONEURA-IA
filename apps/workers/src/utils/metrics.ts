/**
 * Prometheus Metrics - Metrics collection for monitoring
 * ECONEURA WORKERS OUTLOOK - Metrics Utility
 */

import promClient from 'prom-client';
import { logger } from './logger';

// Create metrics registry
const register = new promClient.Registry();

// Add default metrics
promClient.collectDefaultMetrics({
  register,
  prefix: 'econeura_workers_',
});

// Job queue metrics
const jobsQueued = new promClient.Counter({
  name: 'econeura_workers_jobs_queued_total',
  help: 'Total number of jobs added to queues',
  labelNames: ['type'],
  registers: [register]
});

const jobsProcessed = new promClient.Counter({
  name: 'econeura_workers_jobs_processed_total',
  help: 'Total number of jobs processed',
  labelNames: ['type', 'status'],
  registers: [register]
});

const jobsCompleted = new promClient.Counter({
  name: 'econeura_workers_jobs_completed_total',
  help: 'Total number of jobs completed successfully',
  labelNames: ['type'],
  registers: [register]
});

const jobsFailed = new promClient.Counter({
  name: 'econeura_workers_jobs_failed_total',
  help: 'Total number of jobs that failed',
  labelNames: ['type'],
  registers: [register]
});

const jobDuration = new promClient.Histogram({
  name: 'econeura_workers_job_duration_seconds',
  help: 'Job processing duration in seconds',
  labelNames: ['type'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60, 120, 300],
  registers: [register]
});

const jobQueueSize = new promClient.Gauge({
  name: 'econeura_workers_queue_size',
  help: 'Number of jobs in queue',
  labelNames: ['queue', 'status'],
  registers: [register]
});

// AI Router metrics
const aiCosts = new promClient.Counter({
  name: 'econeura_workers_ai_costs_eur_total',
  help: 'Total AI processing costs in EUR',
  registers: [register]
});

const aiRequests = new promClient.Counter({
  name: 'econeura_workers_ai_requests_total',
  help: 'Total AI requests made',
  labelNames: ['provider', 'model', 'status'],
  registers: [register]
});

const aiTokensUsed = new promClient.Counter({
  name: 'econeura_workers_ai_tokens_total',
  help: 'Total AI tokens used',
  labelNames: ['provider', 'model', 'type'],
  registers: [register]
});

const aiResponseTime = new promClient.Histogram({
  name: 'econeura_workers_ai_response_time_seconds',
  help: 'AI request response time in seconds',
  labelNames: ['provider', 'model'],
  buckets: [0.5, 1, 2, 5, 10, 20, 30, 60],
  registers: [register]
});

// Microsoft Graph API metrics
const graphRequests = new promClient.Counter({
  name: 'econeura_workers_graph_requests_total',
  help: 'Total Microsoft Graph API requests',
  labelNames: ['endpoint', 'status'],
  registers: [register]
});

const graphResponseTime = new promClient.Histogram({
  name: 'econeura_workers_graph_response_time_seconds',
  help: 'Microsoft Graph API response time in seconds',
  labelNames: ['endpoint'],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
  registers: [register]
});

const graphRateLimits = new promClient.Counter({
  name: 'econeura_workers_graph_rate_limits_total',
  help: 'Total Microsoft Graph API rate limit hits',
  labelNames: ['endpoint'],
  registers: [register]
});

const graphSubscriptions = new promClient.Gauge({
  name: 'econeura_workers_graph_subscriptions_active',
  help: 'Number of active Microsoft Graph subscriptions',
  registers: [register]
});

// Email processing metrics
const emailsProcessed = new promClient.Counter({
  name: 'econeura_workers_emails_processed_total',
  help: 'Total emails processed',
  labelNames: ['operation', 'status'],
  registers: [register]
});

const emailClassifications = new promClient.Counter({
  name: 'econeura_workers_email_classifications_total',
  help: 'Total email classifications',
  labelNames: ['category', 'priority', 'sentiment'],
  registers: [register]
});

const emailDraftsGenerated = new promClient.Counter({
  name: 'econeura_workers_email_drafts_generated_total',
  help: 'Total email drafts generated',
  labelNames: ['tone'],
  registers: [register]
});

const emailExtractions = new promClient.Counter({
  name: 'econeura_workers_email_extractions_total',
  help: 'Total email data extractions',
  labelNames: ['status'],
  registers: [register]
});

// System metrics
const redisConnections = new promClient.Gauge({
  name: 'econeura_workers_redis_connections',
  help: 'Number of Redis connections',
  registers: [register]
});

const memoryUsage = new promClient.Gauge({
  name: 'econeura_workers_memory_usage_bytes',
  help: 'Memory usage in bytes',
  labelNames: ['type'],
  registers: [register]
});

const httpRequests = new promClient.Counter({
  name: 'econeura_workers_http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'endpoint', 'status'],
  registers: [register]
});

const httpResponseTime = new promClient.Histogram({
  name: 'econeura_workers_http_response_time_seconds',
  help: 'HTTP response time in seconds',
  labelNames: ['method', 'endpoint'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register]
});

// Error tracking
const errors = new promClient.Counter({
  name: 'econeura_workers_errors_total',
  help: 'Total errors occurred',
  labelNames: ['type', 'source'],
  registers: [register]
});

// Performance metrics
const performanceMetrics = new promClient.Gauge({
  name: 'econeura_workers_performance',
  help: 'Performance metrics',
  labelNames: ['metric'],
  registers: [register]
});

// Export metrics object
export const prometheusMetrics = {
  register,
  
  // Job metrics
  jobsQueued,
  jobsProcessed,
  jobsCompleted,
  jobsFailed,
  jobDuration,
  jobQueueSize,
  
  // AI metrics
  aiCosts,
  aiRequests,
  aiTokensUsed,
  aiResponseTime,
  
  // Graph API metrics
  graphRequests,
  graphResponseTime,
  graphRateLimits,
  graphSubscriptions,
  
  // Email metrics
  emailsProcessed,
  emailClassifications,
  emailDraftsGenerated,
  emailExtractions,
  
  // System metrics
  redisConnections,
  memoryUsage,
  httpRequests,
  httpResponseTime,
  errors,
  performanceMetrics
};

// Utility functions for common metric operations
export const recordJobStart = (type: string) => {
  jobsQueued.inc({ type });
  logger.debug('Job queued metric recorded', { type });
};

export const recordJobComplete = (type: string, duration: number) => {
  jobsCompleted.inc({ type });
  jobDuration.observe({ type }, duration / 1000); // Convert ms to seconds
  logger.debug('Job completion metrics recorded', { type, duration });
};

export const recordJobFailure = (type: string, error: string) => {
  jobsFailed.inc({ type });
  errors.inc({ type: 'job_failure', source: type });
  logger.debug('Job failure metrics recorded', { type, error });
};

export const recordAIRequest = (provider: string, model: string, status: string, tokens: any, cost: number, duration: number) => {
  aiRequests.inc({ provider, model, status });
  aiCosts.inc(cost);
  aiResponseTime.observe({ provider, model }, duration / 1000);
  
  if (tokens) {
    if (tokens.prompt_tokens) {
      aiTokensUsed.inc({ provider, model, type: 'prompt' }, tokens.prompt_tokens);
    }
    if (tokens.completion_tokens) {
      aiTokensUsed.inc({ provider, model, type: 'completion' }, tokens.completion_tokens);
    }
  }
  
  logger.debug('AI request metrics recorded', { provider, model, status, cost, duration });
};

export const recordGraphRequest = (endpoint: string, status: string, duration: number) => {
  graphRequests.inc({ endpoint, status });
  graphResponseTime.observe({ endpoint }, duration / 1000);
  
  if (status === '429') {
    graphRateLimits.inc({ endpoint });
  }
  
  logger.debug('Graph API metrics recorded', { endpoint, status, duration });
};

export const recordEmailProcessing = (operation: string, status: string) => {
  emailsProcessed.inc({ operation, status });
  logger.debug('Email processing metrics recorded', { operation, status });
};

export const recordHttpRequest = (method: string, endpoint: string, status: string, duration: number) => {
  httpRequests.inc({ method, endpoint, status });
  httpResponseTime.observe({ method, endpoint }, duration / 1000);
  logger.debug('HTTP request metrics recorded', { method, endpoint, status, duration });
};

// Update system metrics periodically
export const updateSystemMetrics = () => {
  try {
    const memUsage = process.memoryUsage();
    memoryUsage.set({ type: 'rss' }, memUsage.rss);
    memoryUsage.set({ type: 'heapUsed' }, memUsage.heapUsed);
    memoryUsage.set({ type: 'heapTotal' }, memUsage.heapTotal);
    memoryUsage.set({ type: 'external' }, memUsage.external);
    
    // CPU usage (simplified)
    const cpuUsage = process.cpuUsage();
    performanceMetrics.set({ metric: 'cpu_user' }, cpuUsage.user);
    performanceMetrics.set({ metric: 'cpu_system' }, cpuUsage.system);
    
  } catch (error) {
    logger.error('Failed to update system metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
  }
};

// Start system metrics collection
setInterval(updateSystemMetrics, 30000); // Every 30 seconds

// Export metrics endpoint handler
export const getMetricsHandler = async () => {
  try {
    const metrics = await register.metrics();
    return {
      contentType: register.contentType,
      metrics
    };
  } catch (error) {
    logger.error('Failed to generate metrics', { error: error instanceof Error ? error.message : 'Unknown error' });
    throw error;
  }
};