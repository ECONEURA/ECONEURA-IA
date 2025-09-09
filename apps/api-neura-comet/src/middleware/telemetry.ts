/**
 * Telemetry middleware for NEURA↔Comet API
 * Tracks spans, metrics, and cost information
 */

import { Request, Response, NextFunction } from 'express';

interface TelemetryRequest extends Request {
  startTime?: number;
  correlationId?: string;
}

export function telemetryMiddleware(req: TelemetryRequest, res: Response, next: NextFunction): void {
  // Start timing
  req.startTime = Date.now();
  req.correlationId = req.header('x-correlation-id') || crypto.randomUUID();

  // Set correlation ID in response
  res.set('X-Correlation-Id', req.correlationId);

  // Track request start
  console.log(`🔍 [${req.correlationId}] ${req.method} ${req.path} - Start`);

  // Override res.end to track completion
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - (req.startTime || 0);

    // Set telemetry headers
    res.set({
      'X-Latency-ms': duration.toString(),
      'X-Route': req.path,
      'X-Method': req.method
    });

    // Log completion
    console.log(`✅ [${req.correlationId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);

    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

export function costTrackingMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Estimate cost based on request type
  let estimatedCost = 0;

  if (req.path.includes('/neura/chat')) {
    // Estimate cost for chat requests
    const textLength = JSON.stringify(req.body).length;
    estimatedCost = Math.max(0.001, textLength * 0.00001); // Rough estimation
  }

  // Set cost headers
  res.set({
    'X-Est-Cost-EUR': estimatedCost.toFixed(4),
    'X-Budget-Pct': '15', // Mock percentage
    'X-Cost-Breakdown': JSON.stringify({
      model: 'sonar-pro',
      tokens: Math.ceil(textLength / 4),
      costPerToken: 0.000002
    })
  });

  next();
}

