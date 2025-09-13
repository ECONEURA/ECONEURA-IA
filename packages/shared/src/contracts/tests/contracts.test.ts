// ============================================================================
// CONTRACTS TESTS - VALIDATION & SDK
// ============================================================================

import { describe, it, expect, beforeEach } from 'vitest';
import {
  LoginRequestSchema,
  LoginResponseSchema,
  CreateUserRequestSchema,
  CreateContactRequestSchema,
  CreateDealRequestSchema,
  CreateProductRequestSchema,
  CreateOrderRequestSchema,
  AIRequestSchema,
  validateRequest,
  validateResponse
} from '../index.js';

describe('Contract Validation', () => {
  describe('LoginRequestSchema', () => {
    it('should validate valid login request', () => {
      const validRequest = {
        email: 'test@example.com',
        password: 'password123',
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        rememberMe: true
      };

      const result = LoginRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const invalidRequest = {
        email: 'invalid-email',
        password: 'password123'
      };

      const result = LoginRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Invalid email format');
      }
    });

    it('should reject empty password', () => {
      const invalidRequest = {
        email: 'test@example.com',
        password: ''
      };

      const result = LoginRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Password is required');
      }
    });
  });

  describe('CreateUserRequestSchema', () => {
    it('should validate valid user creation request', () => {
      const validRequest = {
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        roles: ['user']
      };

      const result = CreateUserRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const invalidRequest = {
        email: 'newuser@example.com',
        name: 'New User',
        password: '123',
        organizationId: '123e4567-e89b-12d3-a456-426614174000'
      };

      const result = CreateUserRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('at least 8 characters');
      }
    });
  });

  describe('CreateContactRequestSchema', () => {
    it('should validate valid contact creation request', () => {
      const validRequest = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+1234567890',
        company: 'Example Corp',
        title: 'Manager',
        tags: ['lead', 'important'],
        customFields: { source: 'website' }
      };

      const result = CreateContactRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidRequest = {
        firstName: 'John'
        // Missing lastName
      };

      const result = CreateContactRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Last name is required');
      }
    });
  });

  describe('CreateDealRequestSchema', () => {
    it('should validate valid deal creation request', () => {
      const validRequest = {
        title: 'Enterprise Deal',
        description: 'Large enterprise contract',
        value: 50000,
        currency: 'USD',
        stage: 'proposal',
        probability: 75,
        contactId: '123e4567-e89b-12d3-a456-426614174000',
        expectedCloseDate: '2024-12-31',
        customFields: { priority: 'high' }
      };

      const result = CreateDealRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject negative deal value', () => {
      const invalidRequest = {
        title: 'Enterprise Deal',
        value: -1000,
        stage: 'proposal'
      };

      const result = CreateDealRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('must be positive');
      }
    });

    it('should reject invalid probability', () => {
      const invalidRequest = {
        title: 'Enterprise Deal',
        value: 50000,
        stage: 'proposal',
        probability: 150 // Invalid: > 100
      };

      const result = CreateDealRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('must be less than or equal to 100');
      }
    });
  });

  describe('CreateProductRequestSchema', () => {
    it('should validate valid product creation request', () => {
      const validRequest = {
        name: 'Premium Product',
        description: 'High-quality product',
        sku: 'PROD-001',
        price: 99.99,
        currency: 'USD',
        category: 'Electronics',
        customFields: { weight: '1kg' }
      };

      const result = CreateProductRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject missing required fields', () => {
      const invalidRequest = {
        name: 'Premium Product'
        // Missing sku and price
      };

      const result = CreateProductRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('CreateOrderRequestSchema', () => {
    it('should validate valid order creation request', () => {
      const validRequest = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        items: [
          {
            productId: '123e4567-e89b-12d3-a456-426614174001',
            quantity: 2,
            price: 99.99
          }
        ],
        shippingAddress: {
          street: '123 Main St',
          city: 'New York',
          state: 'NY',
          zipCode: '10001',
          country: 'USA'
        },
        customFields: { notes: 'Handle with care' }
      };

      const result = CreateOrderRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty items array', () => {
      const invalidRequest = {
        customerId: '123e4567-e89b-12d3-a456-426614174000',
        items: [] // Empty array
      };

      const result = CreateOrderRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('At least one item is required');
      }
    });
  });

  describe('AIRequestSchema', () => {
    it('should validate valid AI request', () => {
      const validRequest = {
        prompt: 'What is the weather like?',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001',
        context: { previousMessages: [] }
      };

      const result = AIRequestSchema.safeParse(validRequest);
      expect(result.success).toBe(true);
    });

    it('should reject empty prompt', () => {
      const invalidRequest = {
        prompt: '',
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const result = AIRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('Prompt is required');
      }
    });

    it('should reject invalid temperature', () => {
      const invalidRequest = {
        prompt: 'What is the weather like?',
        temperature: 3.0, // Invalid: > 2
        organizationId: '123e4567-e89b-12d3-a456-426614174000',
        userId: '123e4567-e89b-12d3-a456-426614174001'
      };

      const result = AIRequestSchema.safeParse(invalidRequest);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors[0].message).toContain('must be less than or equal to 2');
      }
    });
  });
});

describe('Validation Helpers', () => {
  describe('validateRequest', () => {
    it('should validate and return data for valid request', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123'
      };

      const result = validateRequest(LoginRequestSchema, validData);
      expect(result).toEqual(validData);
    });

    it('should throw error for invalid request', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123'
      };

      expect(() => {
        validateRequest(LoginRequestSchema, invalidData);
      }).toThrow('Validation error');
    });
  });

  describe('validateResponse', () => {
    it('should validate and return data for valid response', () => {
      const validResponse = {
        success: true,
        data: {
          user: {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'test@example.com',
            name: 'Test User',
            organizationId: '123e4567-e89b-12d3-a456-426614174001',
            roles: ['user'],
            permissions: ['read:contacts'],
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          },
          accessToken: 'token123',
          refreshToken: 'refresh123',
          expiresIn: 3600,
          tokenType: 'Bearer' as const
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      const result = validateResponse(LoginResponseSchema, validResponse);
      expect(result).toEqual(validResponse);
    });

    it('should throw error for invalid response', () => {
      const invalidResponse = {
        success: true,
        data: {
          // Missing required fields
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      expect(() => {
        validateResponse(LoginResponseSchema, invalidResponse);
      }).toThrow('Response validation error');
    });
  });
});

describe('Schema Edge Cases', () => {
  it('should handle optional fields correctly', () => {
    const minimalRequest = {
      firstName: 'John',
      lastName: 'Doe'
    };

    const result = CreateContactRequestSchema.safeParse(minimalRequest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBeUndefined();
      expect(result.data.tags).toEqual([]);
      expect(result.data.customFields).toEqual({});
    }
  });

  it('should apply default values', () => {
    const requestWithoutDefaults = {
      title: 'Deal Title',
      value: 1000,
      stage: 'proposal'
    };

    const result = CreateDealRequestSchema.safeParse(requestWithoutDefaults);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.currency).toBe('USD');
      expect(result.data.probability).toBe(0);
      expect(result.data.customFields).toEqual({});
    }
  });

  it('should handle UUID validation', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    const invalidUUID = 'not-a-uuid';

    const validRequest = {
      email: 'test@example.com',
      password: 'password123',
      organizationId: validUUID
    };

    const invalidRequest = {
      email: 'test@example.com',
      password: 'password123',
      organizationId: invalidUUID
    };

    expect(LoginRequestSchema.safeParse(validRequest).success).toBe(true);
    expect(LoginRequestSchema.safeParse(invalidRequest).success).toBe(false);
  });
});
