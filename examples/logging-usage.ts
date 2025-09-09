// Example of structured logging usage in ECONEURA
// This file demonstrates how to replace console.log with structured logging

import { logger } from '../packages/shared/src/logging/index.js';

// ❌ OLD: Using console.log
// console.log('Server starting on port 3001');
// console.log('Database connected');
// console.error('Failed to connect to Redis');

// ✅ NEW: Using structured logging
export function startServer(port: number) {
  logger.info('Server starting', { 
    port,
    environment: process.env.NODE_ENV,
    pid: process.pid
  });
}

export function onDatabaseConnected() {
  logger.info('Database connection established', {
    type: 'database',
    driver: 'postgresql',
    host: process.env.PGHOST
  });
}

export function onRedisConnectionError(error: Error) {
  logger.error('Failed to connect to Redis', error, {
    type: 'redis',
    service: 'cache',
    retry_attempt: 1
  });
}

// Example AI request logging
export function logAICompletion(model: string, tokens: number, duration: number) {
  logger.logAIRequest('AI completion request completed', {
    model,
    tokens_used: tokens,
    duration_ms: duration,
    cost_estimate: tokens * 0.0001
  });
}

// Example webhook logging  
export function logWebhookReceived(source: string, event: string) {
  logger.logWebhookReceived('Webhook received', {
    source,
    event_type: event,
    timestamp: new Date().toISOString()
  });
}

// Example security event logging
export function logFailedLogin(email: string, ip: string) {
  logger.logSecurityEvent('Failed login attempt', {
    email,
    ip_address: ip,
    severity: 'medium',
    action_required: 'monitor'
  });
}