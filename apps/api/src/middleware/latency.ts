import type { Request, Response, NextFunction } from "express";
export function latencyHeader(req: Request, res: Response, next: NextFunction) {
  const t0 = process.hrtime.bigint();
  res.on("finish", () => {
    const t1 = process.hrtime.bigint();
    const ms = Number(t1 - t0) / 1e6;
    try { res.setHeader("X-Latency-ms", String(Math.round(ms))); } catch {}
  });
  next();
}
