import { describe, expect, it, vi } from 'vitest';
import {
  assertDefined,
  assertTrue,
  delay,
  retry,
  withTimeout,
  memoize,
  chunk,
  debounce,
  throttle
} from './common';

describe('Common Utilities', () => {
  describe('assertions', () => {
    it('assertDefined should throw on undefined/null', () => {
      expect(() => assertDefined(undefined)).toThrow();
      expect(() => assertDefined(null)).toThrow();
      expect(() => assertDefined(0)).not.toThrow();
    });

    it('assertTrue should throw on falsy values', () => {
      expect(() => assertTrue(false)).toThrow();
      expect(() => assertTrue('')).toThrow();
      expect(() => assertTrue(true)).not.toThrow();
    });
  });

  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(100);
      expect(Date.now() - start).toBeGreaterThanOrEqual(90);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      const fn = vi.fn()
        .mockRejectedValueOnce(new Error('fail'))
        .mockResolvedValueOnce('success');

      const result = await retry(fn, { initialDelay: 10 });
      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should respect max attempts', async () => {
      const fn = vi.fn().mockRejectedValue(new Error('fail'));
      await expect(retry(fn, { maxAttempts: 2, initialDelay: 10 }))
        .rejects.toThrow('fail');
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('withTimeout', () => {
    it('should resolve if within timeout', async () => {
      const result = await withTimeout(Promise.resolve('success'), 100);
      expect(result).toBe('success');
    });

    it('should reject on timeout', async () => {
      await expect(
        withTimeout(delay(200), 100)
      ).rejects.toThrow('Operation timed out');
    });
  });

  describe('memoize', () => {
    it('should cache function results', () => {
      const fn = vi.fn(x => x * 2);
      const memoized = memoize(fn);

      expect(memoized(2)).toBe(4);
      expect(memoized(2)).toBe(4);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect TTL', async () => {
      const fn = vi.fn(x => x * 2);
      const memoized = memoize(fn, { ttl: 50 });

      expect(memoized(2)).toBe(4);
      await delay(100);
      expect(memoized(2)).toBe(4);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('chunk', () => {
    it('should split array into chunks', () => {
      expect(chunk([1, 2, 3, 4, 5], 2))
        .toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 50);

      debounced();
      debounced();
      debounced();

      await delay(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const fn = vi.fn();
      const throttled = throttle(fn, 50);

      throttled();
      throttled();
      throttled();

      await delay(100);
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
