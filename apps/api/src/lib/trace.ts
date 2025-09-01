import { context, trace } from '@opentelemetry/api';
export function withSpan(name:string, fn:()=>Promise<any>|any, attrs?:Record<string,any>) {
  const tracer = trace.getTracer('econeura-api');
  const span = tracer.startSpan(name);
  try {
    if (attrs) Object.entries(attrs).forEach(([k,v])=> span.setAttribute(k as any, String(v)));
    return Promise.resolve(fn()).finally(()=> span.end());
  } catch (e) {
    span.recordException(e as any as Error);
    span.setStatus({ code: 2 as any });
    span.end();
    throw e;
  }
}
