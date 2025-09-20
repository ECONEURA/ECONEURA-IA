// Prefer shared OTEL mock/helpers when available to keep CI green
let otel: any = null;
try {
   
  otel = require('@opentelemetry/api');
} catch {
  // catch vacío intencional: OTEL puede no estar disponible en todos los entornos
}
import { tracer as sharedTracer } from '@econeura/shared/otel/index';

export function withSpan(name: string, fn: () => Promise<any> | any, attrs?: Record<string, any>) {
  const tracer = otel?.trace?.getTracer ? otel.trace.getTracer('econeura-api') : (sharedTracer.getTracer ? sharedTracer.getTracer('econeura-api') : sharedTracer);
  const span = tracer?.startSpan ? tracer.startSpan(name) : null;

  const safeSetAttribute = (key: string, value: string) => {
    try {
      const s = span as unknown as {
        setAttribute?: (k: string, v: unknown) => void;
      } | null;
      if (s && typeof s.setAttribute === 'function') s.setAttribute(key, value);
      } catch {
        // catch vacío intencional: errores de OTEL no deben romper el flujo
      }
  };

  const safeRecordException = (err: unknown) => {
    try {
      const s = span as unknown as {
        recordException?: (e: Error) => void;
        addEvent?: (n: string, attrs?: Record<string, unknown>) => void;
      } | null;
      if (s && typeof s.recordException === 'function') s.recordException(err as Error);
  else if (s && typeof s.addEvent === 'function') s.addEvent('exception', { message: String(((err as unknown) as Record<string, unknown>)['message'] || err) });
      } catch {
        // catch vacío intencional: errores de OTEL no deben romper el flujo
      }
  };

  try {
    if (attrs) Object.entries(attrs).forEach(([k, v]) => safeSetAttribute(k, String(v)));
  return Promise.resolve(fn()).finally(() => { try { const s = span as unknown as { end?: () => void } | null; if (s && typeof s.end === 'function') s.end(); } catch { /* catch vacío intencional */ } });
  } catch (e) {
    try { safeRecordException(e); } catch {}
  try { const s = span as unknown as { setStatus?: (s: any) => void } | null; if (s) { if (typeof s.setStatus === 'function') s.setStatus({ code: 2 }); else safeSetAttribute('error', 'true'); } } catch {}
  try { const s = span as unknown as { end?: () => void } | null; if (s && typeof s.end === 'function') s.end(); } catch {}
    throw e;
  }
}
