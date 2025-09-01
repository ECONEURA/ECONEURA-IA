import type { RequestHandler } from 'express';
export const requireAAD: RequestHandler = (req, res, next) => {
  const required = (process.env.AAD_REQUIRED ?? 'false') === 'true';
  const has = (req.headers.authorization || '').toString().startsWith('Bearer ');
  if (!required) return next();
  if (!has) return res.status(401).json({ code: 'unauthorized', message: 'AAD token missing' });
  return next();
};
