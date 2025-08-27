import { Router } from 'express';
import { db } from '../db/connection.js';
import { asyncHandler } from '../mw/problemJson.js';

export const healthRoutes = Router();

healthRoutes.get('/health', asyncHandler(async (req, res) => {
  const startTime = Date.now();
  
  // Check database health
  const dbHealth = await db.healthCheck();
  
  // Check external dependencies (mock for now)
  const dependencies = {
    mistral_edge: { status: 'ok' as const, latency_ms: 50 },
    redis: { status: 'ok' as const, latency_ms: 10 },
    openai_cloud: { status: 'ok' as const, latency_ms: 200 },
  };
  
  // Determine overall status
  let overallStatus: 'ok' | 'degraded' | 'error' = 'ok';
  
  if (dbHealth.status === 'error') {
    overallStatus = 'error';
  } else if (Object.values(dependencies).some(dep => dep.status !== 'ok')) {
    overallStatus = 'degraded';
  }
  
  const responseTime = Date.now() - startTime;
  
  const health = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    uptime_seconds: process.uptime(),
    response_time_ms: responseTime,
    database: {
      status: dbHealth.status,
      latency_ms: dbHealth.latency_ms,
    },
    dependencies,
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
    },
  };
  
  // Set appropriate HTTP status
  const statusCode = overallStatus === 'ok' ? 200 : overallStatus === 'degraded' ? 200 : 503;
  
  res.status(statusCode).json(health);
}));