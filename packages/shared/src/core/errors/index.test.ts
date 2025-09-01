import { AppError, ValidationError } from './index';
import { describe, expect, it } from 'vitest';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with default status code', () => {
      const error = new AppError('Test error', 'TEST_ERROR');
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error).toBeInstanceOf(Error);
    });

    it('should create an error with custom status code and context', () => {
      const error = new AppError('Test error', 'TEST_ERROR', 418, { foo: 'bar' });
      expect(error.statusCode).toBe(418);
      expect(error.context).toEqual({ foo: 'bar' });
    });

    it('should capture stack trace', () => {
      const error = new AppError('Test error', 'TEST_ERROR');
      expect(error.stack).toBeDefined();
    });
  });

  describe('ValidationError', () => {
    it('should create a validation error with correct defaults', () => {
      const error = new ValidationError('Invalid input');
      expect(error.message).toBe('Invalid input');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
    });
  });
});

describe('createError', () => {
  it('should return AppError instances unchanged', () => {
    const original = new AppError('Test', 'TEST');
    const result = createError(original);
    expect(result).toBe(original);
  });

  it('should wrap Error instances', () => {
    const error = new Error('Test');
    const result = createError(error);
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('Test');
    expect(result.code).toBe('INTERNAL_ERROR');
  });

  it('should handle unknown error types', () => {
    const result = createError('not an error');
    expect(result).toBeInstanceOf(AppError);
    expect(result.message).toBe('An unexpected error occurred');
  });
});
