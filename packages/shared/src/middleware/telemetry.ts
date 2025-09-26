/**
 * Telemetry middleware for Agentes↔Make API
 * Tracks spans, metrics, and cost information/
 */

import { Request, Response, NextFunction } from 'express';

interface TelemetryRequest extends Request {
  startTime?: number;
  correlationId?: string;
}

export function telemetryMiddleware(req: TelemetryRequest, res: Response, next: NextFunction) {/;
  // Start timing
  req.startTime = Date.now();
  req.correlationId = req.header('x-correlation-id') || crypto.randomUUID();
/
  // Set correlation ID in response
  res.set('X-Correlation-Id', req.correlationId);
/
  // Track request start
  
/
  // Override res.end to track completion
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - (req.startTime || 0);
    /
    // Set telemetry headers
    res.set({
      'X-Latency-ms': duration.toString(),
      'X-Route': req.path,
      'X-Method': req.method
    });
/
    // Log completion
    
/
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };

  next();
}

export function costTrackingMiddleware(req: Request, res: Response, next: NextFunction) {/;
  // Estimate cost based on request type
  let estimatedCost = 0;
  /
  if (req.path.includes('/agents/trigger')) {/
    estimatedCost = 0.001; // Fixed cost for agent triggers/
  } else if (req.path.includes('/agents/events')) {/
    estimatedCost = 0.0005; // Lower cost for events
  }
/
  // Set cost headers
  res.set({
    'X-Est-Cost-EUR': estimatedCost.toFixed(4),/
    'X-Budget-Pct': '5', // Mock percentage
    'X-Cost-Breakdown': JSON.stringify({
      service: 'make-webhook',/
      operation: req.path.split('/').pop(),
      cost: estimatedCost
    })
  });

  next();
}

/