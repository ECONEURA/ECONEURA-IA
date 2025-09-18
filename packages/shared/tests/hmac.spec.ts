import { describe, it, expect } from 'vitest';
import { hmacSign, hmacVerify } from '../src/security/hmac';

describe('HMAC', () => {
  const secret = 'test_secret';
  const body = JSON.stringify({ hello: 'world' });
  it('firma y verifica', () => {
    const ts = '1700000000';
    const sig = hmacSign(ts, body, { secret });
    expect(hmacVerify(ts, body, `sha256=${sig}`, { secret }, 1e9)).toBe(true);
  });
  it('rechaza fuera de ventana', () => {
    const old = '1000';
    const sig = hmacSign(old, body, { secret });
    expect(hmacVerify(old, body, `sha256=${sig}`, { secret }, 10)).toBe(false);
  });
});
