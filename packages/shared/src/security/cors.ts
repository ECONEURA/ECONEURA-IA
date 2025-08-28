import { RequestHandler } from 'express';

const parseOrigins = (origins: string | undefined): string[] => {
  if (!origins) return [];
  return origins.split(',').map((o) => o.trim()).filter(Boolean);
};

export function buildCorsMiddleware(): RequestHandler {
  const allowlist = parseOrigins(process.env.ALLOWED_ORIGINS);
  return (req, res, next) => {
    const origin = req.header('origin');
    if (!origin) return next();
    if (allowlist.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Access-Control-Allow-Credentials', 'true');
    }
    // Nunca permitir '*'
    next();
  };
}