import { describe, expect, it } from 'vitest';
import {
  createSuccessResponse,
  createErrorResponse,
  createPaginatedResponse
} from './api.js';

describe('API Utilities', () => {
  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const response = createSuccessResponse({ foo: 'bar' });
      expect(response).toEqual({
        success: true,
        data: { foo: 'bar' }
      });
    });

    it('should include metadata', () => {
      const response = createSuccessResponse(
        [1, 2, 3],
        { total: 3, page: 1 }
      );
      expect(response).toEqual({
        success: true,
        data: [1, 2, 3],
        meta: { total: 3, page: 1 }
      });
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response', () => {
      const response = createErrorResponse(
        'NOT_FOUND',
        'Resource not found',
        { id: '123' }
      );
      expect(response).toEqual({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Resource not found',
          details: { id: '123' }
        }
      });
    });
  });

  describe('createPaginatedResponse', () => {
    it('should create paginated response', () => {
      const response = createPaginatedResponse(
        [1, 2, 3],
        1,
        10,
        30,
        100
      );
      expect(response).toEqual({
        success: true,
        data: [1, 2, 3],
        meta: {
          page: 1,
          perPage: 10,
          total: 30,
          took: 100
        }
      });
    });
  });
});
