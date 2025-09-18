export * from './hmac.js';
export * from './idempotency.js';
import crypto from 'crypto';
export function redactPII(text) {
    const tokens = {};
    let redacted = text;
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    redacted = redacted.replace(emailPattern, (match) => {
        const token = `[EMAIL_${Object.keys(tokens).length + 1}]`;
        tokens[token] = match;
        return token;
    });
    const phonePattern = /(\+?\d{1,4}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g;
    redacted = redacted.replace(phonePattern, (match) => {
        if (match.length > 6) {
            const token = `[PHONE_${Object.keys(tokens).length + 1}]`;
            tokens[token] = match;
            return token;
        }
        return match;
    });
    const ccPattern = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
    redacted = redacted.replace(ccPattern, (match) => {
        const token = `[CC_${Object.keys(tokens).length + 1}]`;
        tokens[token] = match;
        return token;
    });
    const ibanPattern = /\b[A-Z]{2}\d{2}[A-Z0-9]{4}\d{7}[A-Z0-9]{0,16}\b/g;
    redacted = redacted.replace(ibanPattern, (match) => {
        const token = `[IBAN_${Object.keys(tokens).length + 1}]`;
        tokens[token] = match;
        return token;
    });
    const commonWords = new Set(['The', 'And', 'Or', 'But', 'In', 'On', 'At', 'To', 'For', 'Of', 'With', 'By']);
    const namePattern = /\b[A-Z][a-z]{2,}\s[A-Z][a-z]{2,}\b/g;
    redacted = redacted.replace(namePattern, (match) => {
        const words = match.split(' ');
        if (!words.some(w => commonWords.has(w))) {
            const token = `[NAME_${Object.keys(tokens).length + 1}]`;
            tokens[token] = match;
            return token;
        }
        return match;
    });
    return { redacted, tokens };
}
export function restorePII(redacted, tokens) {
    let restored = redacted;
    for (const [token, original] of Object.entries(tokens)) {
        restored = restored.replace(new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), original);
    }
    return restored;
}
export function generateHMAC(timestamp, body, secret) {
    const payload = `${timestamp}.${body}`;
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}
export function verifyHMAC(timestamp, body, signature, secret, maxSkewSeconds = 300) {
    const now = Math.floor(Date.now() / 1000);
    const requestTime = parseInt(timestamp);
    if (Math.abs(now - requestTime) > maxSkewSeconds) {
        return false;
    }
    const expectedSignature = generateHMAC(timestamp, body, secret);
    const providedSignature = signature.startsWith('sha256=') ? signature.slice(7) : signature;
    return crypto.timingSafeEqual(Buffer.from(expectedSignature, 'hex'), Buffer.from(providedSignature, 'hex'));
}
export function hashApiKey(apiKey) {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
}
export function generateApiKey(prefix = 'ek') {
    const randomBytes = crypto.randomBytes(32);
    return `${prefix}_${randomBytes.toString('base64url')}`;
}
export function validateApiKeyFormat(apiKey) {
    return /^[a-zA-Z0-9]{2,}_[A-Za-z0-9_-]{40,}$/.test(apiKey);
}
export function generateCorrelationId() {
    return crypto.randomUUID();
}
export function generateRequestId() {
    return crypto.randomUUID();
}
export function generateTraceParent() {
    const traceId = crypto.randomBytes(16).toString('hex');
    const spanId = crypto.randomBytes(8).toString('hex');
    return `00-${traceId}-${spanId}-01`;
}
export const CSP_HEADER = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'"
].join('; ');
export const SECURITY_HEADERS = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': CSP_HEADER,
};
//# sourceMappingURL=index.js.map