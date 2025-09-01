import { describe, expect, it } from 'vitest';
import {
  bytesToHuman,
  parseBytes,
  formatDuration,
  parseDuration,
  formatDate,
  parseDate,
  formatNumber,
  formatCurrency
} from './format';

describe('Format Utilities', () => {
  describe('bytesToHuman', () => {
    it('should format bytes correctly', () => {
      expect(bytesToHuman(0)).toBe('0.00 B');
      expect(bytesToHuman(1024)).toBe('1.00 KB');
      expect(bytesToHuman(1024 * 1024)).toBe('1.00 MB');
      expect(bytesToHuman(1024 * 1024 * 1024)).toBe('1.00 GB');
    });
  });

  describe('parseBytes', () => {
    it('should parse byte strings correctly', () => {
      expect(parseBytes('1KB')).toBe(1024);
      expect(parseBytes('1.5MB')).toBe(1572864);
      expect(parseBytes('1 GB')).toBe(1073741824);
    });

    it('should throw on invalid input', () => {
      expect(() => parseBytes('invalid')).toThrow();
    });
  });

  describe('formatDuration', () => {
    it('should format durations correctly', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(60000)).toBe('1m 0s');
      expect(formatDuration(3600000)).toBe('1h 0m');
      expect(formatDuration(86400000)).toBe('1d 0h');
    });
  });

  describe('parseDuration', () => {
    it('should parse duration strings correctly', () => {
      expect(parseDuration('1s')).toBe(1000);
      expect(parseDuration('1m')).toBe(60000);
      expect(parseDuration('1h')).toBe(3600000);
      expect(parseDuration('1d')).toBe(86400000);
    });

    it('should parse combined durations', () => {
      expect(parseDuration('1h 30m')).toBe(5400000);
    });

    it('should throw on invalid input', () => {
      expect(() => parseDuration('invalid')).toThrow();
    });
  });

  describe('formatDate', () => {
    it('should format dates with timezone', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      expect(formatDate(date)).toMatch(/2024-01-01T\d{2}:00:00[+-]\d{2}:\d{2}/);
    });
  });

  describe('parseDate', () => {
    it('should parse date strings correctly', () => {
      const date = parseDate('2024-01-01T00:00:00Z');
      expect(date.getFullYear()).toBe(2024);
    });

    it('should throw on invalid input', () => {
      expect(() => parseDate('invalid')).toThrow();
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with thousand separators', () => {
      expect(formatNumber(1000)).toBe('1.000');
      expect(formatNumber(1000000)).toBe('1.000.000');
    });
  });

  describe('formatCurrency', () => {
    it('should format currency amounts correctly', () => {
      expect(formatCurrency(1000)).toBe('1.000,00 €');
      expect(formatCurrency(1000, 'USD', 'en-US')).toBe('$1,000.00');
    });
  });
});
