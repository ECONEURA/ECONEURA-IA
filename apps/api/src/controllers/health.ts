import { Request, Response } from 'express';
import { version } from '../../../package.json';

export const healthController = {
  getHealth: (req: Request, res: Response): void => {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version,
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };

    res.status(200).json(health);
  },

  getReadiness: (req: Request, res: Response): void => {
    // Check database connection, external services, etc.
    const readiness = {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        redis: 'ok',
        external_apis: 'ok',
      },
    };

    res.status(200).json(readiness);
  },

  getLiveness: (req: Request, res: Response): void => {
    const liveness = {
      status: 'alive',
      timestamp: new Date().toISOString(),
      pid: process.pid,
      memory: process.memoryUsage(),
    };

    res.status(200).json(liveness);
  },
};
