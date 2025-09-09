import { Request, Response, NextFunction } from 'express';

export function finops(req: Request, res: Response, next: NextFunction): void {
  const t = process.hrtime.bigint();
  const cid = String(req.headers["x-correlation-id"] ?? Math.random().toString(36).slice(2, 10));

  res.setHeader("X-Correlation-Id", cid);

  const orig = res.writeHead;
  res.writeHead = function(statusCode: number, ...args: any[]) {
    const ms = Number((process.hrtime.bigint() - t) / 1000000n);
    res.setHeader("X-Latency-ms", String(ms));
    res.setHeader("X-Est-Cost-EUR", "0.0000");
    res.setHeader("X-Budget-Pct", "0");
    res.setHeader("X-Route", req.path);
    return orig.call(this, statusCode, ...args);
  };

  next();
}
