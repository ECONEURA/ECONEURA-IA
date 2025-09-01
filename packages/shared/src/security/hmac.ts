import crypto from 'node:crypto';

export type HmacAlgo = 'sha256';
export interface HmacOptions { algo?: HmacAlgo; secret: string }

export function hmacSign(timestampSec: string, rawBody: string, opts: HmacOptions): string {
  const algo = opts.algo ?? 'sha256';
  const toSign = `${timestampSec}\n${rawBody}`;
  return crypto.createHmac(algo, opts.secret).update(toSign, 'utf8').digest('hex');
}

export function hmacVerify(timestampSec: string, rawBody: string, signatureHeader: string, opts: HmacOptions, windowSec = 300): boolean {
  const now = Math.floor(Date.now()/1000);
  const ts = Number(timestampSec);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > windowSec) return false;
  const expected = hmacSign(timestampSec, rawBody, opts);
  const provided = (signatureHeader || '').replace(/^sha256=/, '');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(provided));
  } catch {
    return false;
  }
}
import crypto from 'crypto';

export function sha256Hex(input: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(input).digest('hex');
}

export function verifyHmacSignature(timestamp: string, body: string, signature: string, secret: string, windowSeconds = 300) {
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(timestamp, 10);
  if (Number.isNaN(ts)) return false;
  if (Math.abs(now - ts) > windowSeconds) return false;
  const toSign = `${timestamp}\n${body}`;
  const expected = sha256Hex(toSign, secret);
  return signature === `sha256=${expected}`;
}
