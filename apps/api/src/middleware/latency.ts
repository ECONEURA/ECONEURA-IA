import type { Request, Response, NextFunction } from "express";
export function latency() {
  return (req: Request, res: Response, next: NextFunction) => {
    const start = process.hrtime.bigint();
    res.on("finish", () => {
      const end = process.hrtime.bigint();
      const ms = Number(end - start) / 1_000_000;
      // En 'finish' las cabeceras ya pueden estar enviadas; evita mutarlas.
      // Solo registrar/emitir si no se enviaron previamente.
      if (!res.headersSent && res.getHeader("X-Latency-ms") == null) {
        try {
          res.setHeader("X-Latency-ms", Math.max(0, Math.round(ms)).toString());
        } catch {
          // noop: no podemos escribir cabeceras tras el envío
        }
      }
    });
    next();
  };
}
