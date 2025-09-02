// Prefer shared OTEL mock/helpers when available to keep CI green
let otel: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  otel = require('@opentelemetry/api');
} catch {}
import { tracer as sharedTracer } from '@econeura/shared/otel/index';

export function withSpan(name:string, fn:()=>Promise<any>|any, attrs?:Record<string,any>) {
  const tracer = otel?.trace?.getTracer ? otel.trace.getTracer('econeura-api') : (sharedTracer.getTracer ? sharedTracer.getTracer('econeura-api') : sharedTracer);
  const span = tracer.startSpan(name);
  try {
    if (attrs) Object.entries(attrs).forEach(([k,v])=> span.setAttribute(k as any, String(v)));
    return Promise.resolve(fn()).finally(()=> span.end());
  } catch (e) {
  try { (span as any).recordException ? (span as any).recordException(e as any as Error) : span.addEvent?.('exception', { message: String((e as any)?.message || e) } as any) } catch {}
  try { (span as any).setStatus ? (span as any).setStatus({ code: 2 as any }) : span.setAttribute?.('error', true as any) } catch {}
  try { span.end() } catch {}
    throw e;
  }
}
