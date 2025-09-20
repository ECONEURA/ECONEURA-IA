// Performance Optimization Middleware
import compression from 'compression';
import { Request, Response, NextFunction } from 'express';

// Compression middleware with optimized settings
export const compressionMiddleware = compression({
  level: 6, // Balance between compression and speed
  threshold: 1024, // Only compress responses > 1KB
  filter: (req: Request, res: Response) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Response time middleware
export const responseTimeMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    res.setHeader('X-Response-Time', `${duration}ms`);
  });
  
  next();
};

// Cache control middleware
export const cacheControlMiddleware = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET') {
      res.setHeader('Cache-Control', `public, max-age=${maxAge}`);
    }
    next();
  };
};
