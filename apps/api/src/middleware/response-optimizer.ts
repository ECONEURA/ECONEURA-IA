import { Request, Response, NextFunction } from 'express';

import { performanceOptimizer } from '../lib/performance-optimizer.js';
import { logger } from '../lib/logger.js';

import { prometheus } from './observability.js';

export interface OptimizedResponse extends Response {
  optimizedData?: any;
  optimizationHeaders?: Record<string, string>;
}

/**
 * Middleware to optimize API responses
 */
export function responseOptimizerMiddleware(
  req: Request,
  res: OptimizedResponse,
  next: NextFunction
): void {
  const startTime = Date.now();
  
  // Store original json method
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  
  // Override json method to optimize responses
  res.json = function(data: any) {
    const responseTime = Date.now() - startTime;
    
    // Only optimize responses that take longer than 100ms
    if (responseTime > 100) {
      optimizeResponse(data, res, req)
        .then(({ optimizedData, headers }) => {
          // Set optimization headers
          Object.entries(headers).forEach(([key, value]) => {
            res.set(key, value);
          });
          
          // Send optimized response
          originalJson(optimizedData);
          
          // Record metrics
          prometheus.responseOptimizations.inc();
          prometheus.responseOptimizationTime.observe(responseTime / 1000);
          
          logger.debug('Response optimized', {
            path: req.path,
            method: req.method,
            originalSize: JSON.stringify(data).length,
            optimizedSize: JSON.stringify(optimizedData).length,
            responseTime,
            optimizationRatio: (JSON.stringify(optimizedData).length / JSON.stringify(data).length * 100).toFixed(2) + '%'
          });
        })
        .catch((error) => {
          logger.error('Response optimization failed', {
            path: req.path,
            method: req.method,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Fallback to original response
          originalJson(data);
        });
    } else {
      // Send original response for fast responses
      originalJson(data);
    }
  };
  
  // Override send method for non-JSON responses
  res.send = function(data: any) {
    const responseTime = Date.now() - startTime;
    
    // Only optimize large responses
    if (typeof data === 'string' && data.length > 1024) {
      optimizeTextResponse(data, res, req)
        .then((optimizedData) => {
          originalSend(optimizedData);
          
          // Record metrics
          prometheus.textResponseOptimizations.inc();
          
          logger.debug('Text response optimized', {
            path: req.path,
            method: req.method,
            originalSize: data.length,
            optimizedSize: optimizedData.length,
            responseTime
          });
        })
        .catch((error) => {
          logger.error('Text response optimization failed', {
            path: req.path,
            method: req.method,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Fallback to original response
          originalSend(data);
        });
    } else {
      // Send original response
      originalSend(data);
    }
  };
  
  next();
}

/**
 * Optimize JSON response data
 */
async function optimizeResponse(
  data: any,
  res: Response,
  req: Request
): Promise<{ optimizedData: any; headers: Record<string, string> }> {
  const startTime = Date.now();
  
  try {
    // Determine content type
    const contentType = res.get('Content-Type') || 'application/json';
    
    // Optimize based on response size and type
    if (Array.isArray(data) && data.length > 100) {
      // Optimize large arrays with pagination
      return optimizeLargeArray(data, req);
    } else if (typeof data === 'object' && data !== null) {
      // Optimize large objects
      return optimizeLargeObject(data, req);
    } else {
      // Use general optimization
      return await performanceOptimizer.optimizeResponse(data, contentType);
    }
  } catch (error) {
    logger.error('Response optimization error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      path: req.path,
      method: req.method
    });
    
    // Return original data with basic headers
    return {
      optimizedData: data,
      headers: { 'Content-Type': 'application/json' }
    };
  }
}

/**
 * Optimize large array responses
 */
function optimizeLargeArray(
  data: any[],
  req: Request
): { optimizedData: any; headers: Record<string, string> } {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const maxLimit = 100;
  
  const actualLimit = Math.min(limit, maxLimit);
  const startIndex = (page - 1) * actualLimit;
  const endIndex = startIndex + actualLimit;
  
  const paginatedData = data.slice(startIndex, endIndex);
  
  const optimizedData = {
    data: paginatedData,
    pagination: {
      page,
      limit: actualLimit,
      total: data.length,
      totalPages: Math.ceil(data.length / actualLimit),
      hasNext: endIndex < data.length,
      hasPrev: page > 1
    }
  };
  
  return {
    optimizedData,
    headers: {
      'Content-Type': 'application/json',
      'X-Pagination-Page': page.toString(),
      'X-Pagination-Limit': actualLimit.toString(),
      'X-Pagination-Total': data.length.toString(),
      'X-Pagination-Total-Pages': Math.ceil(data.length / actualLimit).toString()
    }
  };
}

/**
 * Optimize large object responses
 */
function optimizeLargeObject(
  data: any,
  req: Request
): { optimizedData: any; headers: Record<string, string> } {
  // Remove unnecessary fields for list views
  if (req.path.includes('/list') || req.path.includes('/search')) {
    const optimizedData = removeUnnecessaryFields(data);
    
    return {
      optimizedData,
      headers: {
        'Content-Type': 'application/json',
        'X-Optimized': 'true',
        'X-Fields-Removed': 'unnecessary'
      }
    };
  }
  
  // For detail views, keep all fields but optimize nested objects
  const optimizedData = optimizeNestedObjects(data);
  
  return {
    optimizedData,
    headers: {
      'Content-Type': 'application/json',
      'X-Optimized': 'true'
    }
  };
}

/**
 * Remove unnecessary fields from objects
 */
function removeUnnecessaryFields(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => removeUnnecessaryFields(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const optimized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      // Skip unnecessary fields
      if (['createdAt', 'updatedAt', 'deletedAt', 'metadata', 'internalNotes'].includes(key)) {
        continue;
      }
      
      // Recursively optimize nested objects
      optimized[key] = removeUnnecessaryFields(value);
    }
    
    return optimized;
  }
  
  return data;
}

/**
 * Optimize nested objects
 */
function optimizeNestedObjects(data: any): any {
  if (Array.isArray(data)) {
    return data.map(item => optimizeNestedObjects(item));
  }
  
  if (typeof data === 'object' && data !== null) {
    const optimized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        // Limit nested array sizes
        if (Array.isArray(value) && value.length > 10) {
          optimized[key] = value.slice(0, 10);
        } else {
          optimized[key] = optimizeNestedObjects(value);
        }
      } else {
        optimized[key] = value;
      }
    }
    
    return optimized;
  }
  
  return data;
}

/**
 * Optimize text responses
 */
async function optimizeTextResponse(
  data: string,
  res: Response,
  req: Request
): Promise<string> {
  // Simple text optimization - remove extra whitespace
  return data
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();
}

/**
 * Middleware to add performance headers
 */
export function performanceHeadersMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const startTime = Date.now();
  
  // Add performance headers
  res.set('X-Response-Time', '0ms');
  res.set('X-Cache-Status', 'MISS');
  res.set('X-Optimization-Enabled', 'true');
  
  // Override end method to calculate response time
  const originalEnd = res.end.bind(res);
  res.end = function(chunk?: any, encoding?: any) {
    const responseTime = Date.now() - startTime;
    res.set('X-Response-Time', `${responseTime}ms`);
    
    // Record response time metric
    prometheus.responseTime.observe(responseTime / 1000);
    
    originalEnd(chunk, encoding);
  };
  
  next();
}

/**
 * Middleware to enable compression for large responses
 */
export function compressionMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check if client accepts gzip
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  if (acceptEncoding.includes('gzip')) {
    res.set('Content-Encoding', 'gzip');
    res.set('Vary', 'Accept-Encoding');
  }
  
  next();
}

// Export Prometheus metrics
export const responseOptimizationMetrics = {
  responseOptimizations: new prometheus.Counter({
    name: 'econeura_response_optimizations_total',
    help: 'Total number of response optimizations',
    labelNames: ['path', 'method']
  }),
  responseOptimizationTime: new prometheus.Histogram({
    name: 'econeura_response_optimization_time_seconds',
    help: 'Response optimization time in seconds',
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1]
  }),
  textResponseOptimizations: new prometheus.Counter({
    name: 'econeura_text_response_optimizations_total',
    help: 'Total number of text response optimizations',
    labelNames: ['path', 'method']
  }),
  responseTime: new prometheus.Histogram({
    name: 'econeura_response_time_seconds',
    help: 'Response time in seconds',
    labelNames: ['path', 'method', 'status_code'],
    buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 2, 5]
  })
};
