import { v4 as uuid } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

export function requestId(req: Request, res: Response, next: NextFunction): void {
  // Generate x-request-id if missing
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = uuid();
  }

  // Generate traceparent if missing (W3C Trace Context)
  if (!req.headers['traceparent']) {
    const traceId = uuid().replace(/-/g, '') + '0000000000000000';
    const spanId = uuid().replace(/-/g, '').substring(0, 16);
    req.headers['traceparent'] = `00-${traceId}-${spanId}-01`;
  }

  // Set response headers for tracking
  res.setHeader('x-request-id', req.headers['x-request-id']);
  res.setHeader('traceparent', req.headers['traceparent']);

  // Store in res.locals for access in other middlewares
  res.locals.corr_id = req.headers['x-request-id'];
  res.locals.trace_id = req.headers['traceparent'];

  next();
}