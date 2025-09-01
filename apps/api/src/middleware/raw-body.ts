import type { RequestHandler } from 'express';
export const rawJsonBody: RequestHandler = (req, res, next) => {
  let data = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => data += chunk);
  req.on('end', () => {
    (req as any)._rawBody = data || '{}';
    try { req.body = data ? JSON.parse(data) : {}; } catch { req.body = {}; }
    next();
  });
};
