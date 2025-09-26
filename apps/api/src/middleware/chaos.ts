import { Request, Response, NextFunction } from 'express';

import { logger } from '../lib/logger.js';

interface ChaosConfig {
  enabled: boolean;
  faultRate: number; // 0.0 - 1.0
  latencyMs: {
    min: number;
    max: number;
    probability: number; // 0.0 - 1.0
  };
  error: {
    probability: number; // 0.0 - 1.0
    statusCodes: number[];
  };
  onlyPaths?: RegExp[];
  skipPaths?: RegExp[];
}

const defaultConfig: ChaosConfig = {
  enabled: process.env.CHAOS_ENABLED === 'true',
  faultRate: Number(process.env.CHAOS_FAULT_RATE || 0.1),
  latencyMs: {
    min: Number(process.env.CHAOS_LAT_MIN || 50),
    max: Number(process.env.CHAOS_LAT_MAX || 350),
    probability: Number(process.env.CHAOS_LAT_PROB || 0.5),
  },
  error: {
    probability: Number(process.env.CHAOS_ERR_PROB || 0.05),
    statusCodes: [429, 500, 502, 503, 504],
  },
  onlyPaths: undefined,
  skipPaths: [
    /^\/health(\/.*)?$/,
    /^\/healthz$/,
    /^\/readyz$/,
    /^\/v1\/observability\/metrics(\/.*)?$/,
  ],
};

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shouldAffectPath(path: string, config: ChaosConfig): boolean {
  if (config.onlyPaths && config.onlyPaths.length > 0) {
    return config.onlyPaths.some(re => re.test(path));
  }
  if (config.skipPaths && config.skipPaths.some(re => re.test(path))) {
    return false;
  }
  return true;
}

export function chaosMiddleware(config: Partial<ChaosConfig> = {}) {
  const cfg: ChaosConfig = { ...defaultConfig, ...config };

  return async function(req: Request, res: Response, next: NextFunction) {
    try {
      if (!cfg.enabled) return next();
      if (!shouldAffectPath(req.path, cfg)) return next();

      const dice = Math.random();
      if (dice > cfg.faultRate) return next();

      // Latency injection
      if (Math.random() < cfg.latencyMs.probability) {
        const delay = randomInt(cfg.latencyMs.min, cfg.latencyMs.max);
        await new Promise(resolve => setTimeout(resolve, delay));
        logger.warn('Chaos: injected latency', { path: req.path, duration: delay });
      }

      // Error injection
      if (Math.random() < cfg.error.probability) {
        const status = cfg.error.statusCodes[randomInt(0, cfg.error.statusCodes.length - 1)];
        logger.error('Chaos: injected error', { path: req.path, statusCode: status });
        return res.status(status).json({
          error: 'CHAOS_INJECTED',
          message: 'Injected failure for chaos testing',
          status,
        });
      }

      return next();
    } catch (e: any) {
      logger.error('Chaos middleware failure', { error: e?.message });
      return next();
    }
  };
}

export function createChaosToggleEndpoints(app: any) {
  app.post('/v1/chaos/toggle', (req: any, res: any) => {
    const { enabled } = req.body || {};
    if (enabled === true || enabled === false) {
      process.env.CHAOS_ENABLED = String(enabled);
      return res.json({ success: true, enabled });
    }
    return res.status(400).json({ success: false, error: 'enabled must be boolean' });
  });

  app.get('/v1/chaos/status', (_req: any, res: any) => {
    res.json({
      enabled: process.env.CHAOS_ENABLED === 'true',
      faultRate: Number(process.env.CHAOS_FAULT_RATE || defaultConfig.faultRate),
      latency: {
        min: Number(process.env.CHAOS_LAT_MIN || defaultConfig.latencyMs.min),
        max: Number(process.env.CHAOS_LAT_MAX || defaultConfig.latencyMs.max),
        probability: Number(process.env.CHAOS_LAT_PROB || defaultConfig.latencyMs.probability),
      },
      error: {
        probability: Number(process.env.CHAOS_ERR_PROB || defaultConfig.error.probability),
      },
    });
  });
}

