import rateLimit from "express-rate-limit";
import { getCache, setCache } from "../utils/cache.js";

// Rate limiting inteligente por organización
export const smartRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: (req) => {
    const org = req.headers["x-org-id"] as string || "demo-org";
    const isDemo = org === "demo-org";
    return isDemo ? 50 : 200; // Demo: 50 req/min, Producción: 200 req/min
  },
  keyGenerator: (req) => {
    const org = req.headers["x-org-id"] as string || "demo-org";
    const ip = req.ip;
    return `${org}:${ip}`;
  },
  handler: (req, res) => {
    const org = req.headers["x-org-id"] as string || "demo-org";
    res.status(429).json({
      ok: false,
      error: `Rate limit exceeded for ${org}. Try again in 1 minute.`,
      retryAfter: 60
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting específico para IA
export const aiRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: (req) => {
    const org = req.headers["x-org-id"] as string || "demo-org";
    const isDemo = org === "demo-org";
    return isDemo ? 10 : 30; // Demo: 10 req/min, Producción: 30 req/min
  },
  keyGenerator: (req) => {
    const org = req.headers["x-org-id"] as string || "demo-org";
    return `${org}:ai`;
  },
  handler: (req, res) => {
    res.status(429).json({
      ok: false,
      error: "AI rate limit exceeded. Please wait before making more requests.",
      retryAfter: 60
    });
  }
});
