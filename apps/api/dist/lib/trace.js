let otel = null;
try {
    otel = require('@opentelemetry/api');
}
catch {
}
import { tracer as sharedTracer } from '@econeura/shared/otel/index';
export function withSpan(name, fn, attrs) {
    const tracer = otel?.trace?.getTracer ? otel.trace.getTracer('econeura-api') : (sharedTracer.getTracer ? sharedTracer.getTracer('econeura-api') : sharedTracer);
    const span = tracer?.startSpan ? tracer.startSpan(name) : null;
    const safeSetAttribute = (key, value) => {
        try {
            const s = span;
            if (s && typeof s.setAttribute === 'function')
                s.setAttribute(key, value);
        }
        catch {
        }
    };
    const safeRecordException = (err) => {
        try {
            const s = span;
            if (s && typeof s.recordException === 'function')
                s.recordException(err);
            else if (s && typeof s.addEvent === 'function')
                s.addEvent('exception', { message: String(err['message'] || err) });
        }
        catch {
        }
    };
    try {
        if (attrs)
            Object.entries(attrs).forEach(([k, v]) => safeSetAttribute(k, String(v)));
        return Promise.resolve(fn()).finally(() => { try {
            const s = span;
            if (s && typeof s.end === 'function')
                s.end();
        }
        catch { } });
    }
    catch (e) {
        try {
            safeRecordException(e);
        }
        catch { }
        try {
            const s = span;
            if (s) {
                if (typeof s.setStatus === 'function')
                    s.setStatus({ code: 2 });
                else
                    safeSetAttribute('error', 'true');
            }
        }
        catch { }
        try {
            const s = span;
            if (s && typeof s.end === 'function')
                s.end();
        }
        catch { }
        throw e;
    }
}
//# sourceMappingURL=trace.js.map