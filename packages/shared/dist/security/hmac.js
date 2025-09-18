import crypto from 'node:crypto';
export function sha256Hex(value, key) {
    return crypto.createHmac('sha256', key).update(value, 'utf8').digest('hex');
}
export function hmacSign(timestampSec, rawBody, opts) {
    const algo = opts.algo ?? 'sha256';
    const toSign = `${timestampSec}\n${rawBody}`;
    return crypto.createHmac(algo, opts.secret).update(toSign, 'utf8').digest('hex');
}
export function hmacVerify(timestampSec, rawBody, signatureHeader, opts, windowSec = 300) {
    const now = Math.floor(Date.now() / 1000);
    const ts = Number(timestampSec);
    if (!Number.isFinite(ts) || Math.abs(now - ts) > windowSec)
        return false;
    const expected = hmacSign(timestampSec, rawBody, opts);
    const provided = (signatureHeader || '').replace(/^sha256=/, '');
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
    }
    catch {
        return false;
    }
}
export const verifyHmacSignature = (timestampSec, rawBody, signatureHeader, secretOrOpts, windowSec = 300) => {
    const opts = typeof secretOrOpts === 'string' ? { secret: secretOrOpts } : secretOrOpts;
    return hmacVerify(timestampSec, rawBody, signatureHeader, opts, windowSec);
};
//# sourceMappingURL=hmac.js.map