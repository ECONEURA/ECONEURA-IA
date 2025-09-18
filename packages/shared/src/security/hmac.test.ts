import { describe, it, expect } from 'vitest';
import { sha256Hex, verifyHmacSignature } from './hmac.js';

describe('hmac helpers', () => {
  it('sha256Hex produces expected hex', () => {
    const val = sha256Hex('abc', 'key');
    expect(typeof val).toBe('string');
    expect(val.length).toBeGreaterThan(0);
  });

  it('verifyHmacSignature accepts valid signature and rejects expired/invalid', () => {
    const secret = 'test-secret';
    const body = JSON.stringify({ a: 1 });
    const ts = Math.floor(Date.now() / 1000).toString();
    const sig = `sha256=${sha256Hex(`${ts}\n${body}`, secret)}`;
    expect(verifyHmacSignature(ts, body, sig, secret)).toBe(true);

    // invalid signature
    expect(verifyHmacSignature(ts, body, 'sha256=deadbeef', secret)).toBe(false);

    // expired timestamp
    const oldTs = (Math.floor(Date.now() / 1000) - 10000).toString();
    const oldSig = `sha256=${sha256Hex(`${oldTs}\n${body}`, secret)}`;
    expect(verifyHmacSignature(oldTs, body, oldSig, secret)).toBe(false);
  });
});
