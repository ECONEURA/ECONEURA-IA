// ============================================================================
// BASE USE CASE TESTS - Tests unitarios para el caso de uso base
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import { BaseUseCase, BaseRequest, BaseResponse } from '../../../application/use-cases/base.use-case.js';

// ========================================================================
// CASO DE USO DE PRUEBA
// ========================================================================

interface TestRequest extends BaseRequest {
  name: string;
  email: string;
  age?: number;
}

interface TestResponse extends BaseResponse {
  data: {
    id: string;
    name: string;
    email: string;
    age?: number;
  };
}

class TestUseCase extends BaseUseCase<TestRequest, TestResponse> {
  async execute(request: TestRequest): Promise<TestResponse> {
    this.validateBaseRequest(request);
    this.validateString(request.name, 'Name', 1, 100);
    this.validateEmail(request.email);
    
    if (request.age !== undefined) {
      if (request.age < 0 || request.age > 150) {
        throw new Error('Age must be between 0 and 150');
      }
    }

    const id = this.generateId();
    const data = {
      id,
      name: this.sanitizeString(request.name),
      email: request.email,
      age: request.age
    };

    return this.createSuccessResponse(data, 'Test entity created successfully');
  }
}

// ========================================================================
// TESTS
// ========================================================================

describe('BaseUseCase', () => {
  let useCase: TestUseCase;
  let validRequest: TestRequest;

  beforeEach(() => {
    useCase = new TestUseCase();
    validRequest = {
      organizationId: crypto.randomUUID(),
      name: 'John Doe',
      email: 'john.doe@example.com',
      age: 30
    };
  });

  describe('execute()', () => {
    it('should execute successfully with valid request', async () => {
      const result = await useCase.execute(validRequest);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john.doe@example.com');
      expect(result.data.age).toBe(30);
      expect(result.message).toBe('Test entity created successfully');
    });

    it('should execute successfully without optional fields', async () => {
      const requestWithoutAge = { ...validRequest };
      delete requestWithoutAge.age;

      const result = await useCase.execute(requestWithoutAge);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty('id');
      expect(result.data.name).toBe('John Doe');
      expect(result.data.email).toBe('john.doe@example.com');
      expect(result.data.age).toBeUndefined();
    });
  });

  describe('validateBaseRequest()', () => {
    it('should throw error for missing organizationId', async () => {
      const invalidRequest = { ...validRequest, organizationId: '' };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Organization ID is required');
    });

    it('should throw error for null organizationId', async () => {
      const invalidRequest = { ...validRequest, organizationId: null as any };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Organization ID is required');
    });

    it('should throw error for undefined organizationId', async () => {
      const invalidRequest = { ...validRequest };
      delete invalidRequest.organizationId;

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Organization ID is required');
    });
  });

  describe('validateString()', () => {
    it('should throw error for empty name', async () => {
      const invalidRequest = { ...validRequest, name: '' };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Name is required');
    });

    it('should throw error for null name', async () => {
      const invalidRequest = { ...validRequest, name: null as any };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Name is required');
    });

    it('should throw error for name too short', async () => {
      const invalidRequest = { ...validRequest, name: '' };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Name must be at least 1 characters long');
    });

    it('should throw error for name too long', async () => {
      const invalidRequest = { ...validRequest, name: 'a'.repeat(101) };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Name cannot exceed 100 characters');
    });

    it('should accept name with whitespace and trim it', async () => {
      const requestWithWhitespace = { ...validRequest, name: '  John Doe  ' };

      const result = await useCase.execute(requestWithWhitespace);

      expect(result.data.name).toBe('John Doe');
    });
  });

  describe('validateEmail()', () => {
    it('should throw error for invalid email format', async () => {
      const invalidRequest = { ...validRequest, email: 'invalid-email' };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for email without domain', async () => {
      const invalidRequest = { ...validRequest, email: 'john@' };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Invalid email format');
    });

    it('should throw error for email without @ symbol', async () => {
      const invalidRequest = { ...validRequest, email: 'john.doe.example.com' };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Invalid email format');
    });

    it('should accept valid email formats', async () => {
      const validEmails = [
        'john.doe@example.com',
        'user+tag@domain.co.uk',
        'test123@subdomain.example.org'
      ];

      for (const email of validEmails) {
        const request = { ...validRequest, email };
        const result = await useCase.execute(request);
        expect(result.data.email).toBe(email);
      }
    });
  });

  describe('validateId()', () => {
    it('should throw error for empty id', () => {
      expect(() => useCase.validateId('', 'Test ID')).toThrow('Test ID is required');
    });

    it('should throw error for null id', () => {
      expect(() => useCase.validateId(null as any, 'Test ID')).toThrow('Test ID is required');
    });

    it('should not throw error for valid id', () => {
      expect(() => useCase.validateId('valid-id', 'Test ID')).not.toThrow();
    });
  });

  describe('validateUrl()', () => {
    it('should throw error for invalid URL', () => {
      expect(() => useCase.validateUrl('invalid-url', 'Test URL')).toThrow('Invalid Test URL format');
    });

    it('should not throw error for valid URL', () => {
      expect(() => useCase.validateUrl('https://example.com', 'Test URL')).not.toThrow();
    });

    it('should not throw error for valid URL with path', () => {
      expect(() => useCase.validateUrl('https://example.com/path?query=value', 'Test URL')).not.toThrow();
    });
  });

  describe('validateUuid()', () => {
    it('should throw error for invalid UUID', () => {
      expect(() => useCase.validateUuid('invalid-uuid', 'Test UUID')).toThrow('Invalid Test UUID format');
    });

    it('should not throw error for valid UUID', () => {
      const validUuid = crypto.randomUUID();
      expect(() => useCase.validateUuid(validUuid, 'Test UUID')).not.toThrow();
    });
  });

  describe('Utility methods', () => {
    describe('generateId()', () => {
      it('should generate valid UUID', () => {
        const id = useCase.generateId();
        
        expect(typeof id).toBe('string');
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
      });

      it('should generate unique IDs', () => {
        const id1 = useCase.generateId();
        const id2 = useCase.generateId();
        
        expect(id1).not.toBe(id2);
      });
    });

    describe('getCurrentTimestamp()', () => {
      it('should return current date', () => {
        const timestamp = useCase.getCurrentTimestamp();
        
        expect(timestamp).toBeInstanceOf(Date);
        expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
      });
    });

    describe('sanitizeString()', () => {
      it('should trim whitespace', () => {
        const result = useCase.sanitizeString('  test string  ');
        expect(result).toBe('test string');
      });

      it('should handle empty string', () => {
        const result = useCase.sanitizeString('');
        expect(result).toBe('');
      });
    });

    describe('createSuccessResponse()', () => {
      it('should create success response', () => {
        const data = { test: 'data' };
        const message = 'Success message';
        
        const response = useCase.createSuccessResponse(data, message);
        
        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.message).toBe(message);
      });

      it('should create success response without message', () => {
        const data = { test: 'data' };
        
        const response = useCase.createSuccessResponse(data);
        
        expect(response.success).toBe(true);
        expect(response.data).toEqual(data);
        expect(response.message).toBeUndefined();
      });
    });

    describe('createErrorResponse()', () => {
      it('should create error response', () => {
        const code = 'TEST_ERROR';
        const message = 'Test error message';
        const details = { field: 'test' };
        
        const response = useCase.createErrorResponse(code, message, details);
        
        expect(response.success).toBe(false);
        expect(response.error.code).toBe(code);
        expect(response.error.message).toBe(message);
        expect(response.error.details).toEqual(details);
      });

      it('should create error response without details', () => {
        const code = 'TEST_ERROR';
        const message = 'Test error message';
        
        const response = useCase.createErrorResponse(code, message);
        
        expect(response.success).toBe(false);
        expect(response.error.code).toBe(code);
        expect(response.error.message).toBe(message);
        expect(response.error.details).toBeUndefined();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle age validation correctly', async () => {
      const negativeAgeRequest = { ...validRequest, age: -1 };
      await expect(useCase.execute(negativeAgeRequest)).rejects.toThrow('Age must be between 0 and 150');

      const tooOldRequest = { ...validRequest, age: 151 };
      await expect(useCase.execute(tooOldRequest)).rejects.toThrow('Age must be between 0 and 150');

      const validAgeRequest = { ...validRequest, age: 0 };
      const result = await useCase.execute(validAgeRequest);
      expect(result.data.age).toBe(0);
    });

    it('should handle multiple validation errors', async () => {
      const invalidRequest = {
        organizationId: '',
        name: '',
        email: 'invalid-email'
      };

      await expect(useCase.execute(invalidRequest)).rejects.toThrow('Organization ID is required');
    });
  });
});

