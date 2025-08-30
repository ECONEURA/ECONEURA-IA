import { Router } from "express";
import { registry } from "../lib/observe.js";
import { logger } from "../lib/logger.js";

export const health = Router();

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  services: {
    azure_openai: 'healthy' | 'degraded' | 'unhealthy';
    azure_speech: 'healthy' | 'degraded' | 'unhealthy';
    cache: 'healthy' | 'degraded' | 'unhealthy';
    database?: 'healthy' | 'degraded' | 'unhealthy';
  };
  metrics: {
    total_requests: number;
    error_rate: number;
    avg_response_time: number;
  };
}

health.get("/", async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Verificar servicios
    const azureOpenAI = process.env.AZURE_OPENAI_API_KEY ? 'healthy' : 'degraded';
    const azureSpeech = process.env.AZURE_SPEECH_KEY ? 'healthy' : 'degraded';
    const cache = 'healthy'; // Cache en memoria siempre disponible

    // Calcular métricas básicas
    const metrics = await registry.getMetricsAsJSON();
    const totalRequests = metrics.find(m => m.name === 'ai_requests_total')?.values?.[0]?.value || 0;
    const errorRequests = metrics.find(m => m.name === 'ai_requests_total' && m.labels?.status !== '200')?.values?.[0]?.value || 0;
    const errorRate = totalRequests > 0 ? (errorRequests / totalRequests) * 100 : 0;

    const healthStatus: HealthStatus = {
      status: azureOpenAI === 'healthy' && azureSpeech === 'healthy' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      services: {
        azure_openai: azureOpenAI,
        azure_speech: azureSpeech,
        cache: cache
      },
      metrics: {
        total_requests: totalRequests,
        error_rate: errorRate,
        avg_response_time: Date.now() - startTime
      }
    };

    logger.info('Health check completed', {
      endpoint: '/health',
      method: 'GET',
      duration: Date.now() - startTime,
      status: healthStatus.status
    });

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(healthStatus);
  } catch (error) {
    logger.error('Health check failed', {
      endpoint: '/health',
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

health.get("/ready", (req, res) => {
  // Liveness probe - verificar que la app está lista
  res.status(200).json({
    status: 'ready',
    timestamp: new Date().toISOString()
  });
});

health.get("/live", (req, res) => {
  // Readiness probe - verificar que la app está viva
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});