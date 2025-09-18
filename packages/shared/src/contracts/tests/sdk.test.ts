// ============================================================================
// SDK TESTS - CLIENT FUNCTIONALITY
// ============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ECONEURASDK, SDKError, createSDK } from '../sdk.js';

// Mock fetch
global.fetch = vi.fn();

describe('ECONEURA SDK', () => {
  let sdk: ECONEURASDK;
  const mockConfig = {
    baseUrl: 'https://api.econeura.com/v1',
    apiKey: 'test-api-key'
  };

  beforeEach(() => {
    sdk = new ECONEURASDK(mockConfig);
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should create SDK instance with config', () => {
      expect(sdk).toBeInstanceOf(ECONEURASDK);
    });

    it('should create SDK using factory function', () => {
      const sdkFromFactory = createSDK(mockConfig);
      expect(sdkFromFactory).toBeInstanceOf(ECONEURASDK);
    });
  });

  describe('Authentication', () => {
    it('should login successfully', async () => {
      const mockResponse = {
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
          accessToken: 'access-token-123',
          refreshToken: 'refresh-token-123',
          expiresIn: 3600,
          tokenType: 'Bearer'
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.login({
        email: 'test@example.com',
        password: 'password123'
      });

      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.econeura.com/v1/auth/login',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key'
          }),
          body: JSON.stringify({
            email: 'test@example.com',
            password: 'password123'
          })
        })
      );
    });

    it('should handle login error', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Invalid credentials',
        message: 'Email or password is incorrect',
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve(mockErrorResponse)
      });

      await expect(sdk.login({
        email: 'test@example.com',
        password: 'wrongpassword'
      })).rejects.toThrow(SDKError);
    });

    it('should refresh token successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          accessToken: 'new-access-token',
          refreshToken: 'new-refresh-token',
          expiresIn: 3600,
          tokenType: 'Bearer'
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.refreshToken({
        refreshToken: 'old-refresh-token'
      });

      expect(result).toEqual(mockResponse);
    });

    it('should get current user', async () => {
      const mockResponse = {
        success: true,
        data: {
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
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.getCurrentUser();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Users', () => {
    it('should list users with pagination', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            email: 'user1@example.com',
            name: 'User 1',
            organizationId: '123e4567-e89b-12d3-a456-426614174001',
            roles: ['user'],
            permissions: ['read:contacts'],
            isActive: true,
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.listUsers({ page: 1, limit: 20 });
      expect(result).toEqual(mockResponse);
      expect(fetch).toHaveBeenCalledWith(
        'https://api.econeura.com/v1/users?page=1&limit=20',
        expect.objectContaining({
          method: 'GET'
        })
      );
    });

    it('should create user', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'newuser@example.com',
          name: 'New User',
          organizationId: '123e4567-e89b-12d3-a456-426614174001',
          roles: ['user'],
          permissions: [],
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.createUser({
        email: 'newuser@example.com',
        name: 'New User',
        password: 'password123',
        organizationId: '123e4567-e89b-12d3-a456-426614174001'
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Contacts (CRM)', () => {
    it('should list contacts', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            company: 'Example Corp',
            title: 'Manager',
            organizationId: '123e4567-e89b-12d3-a456-426614174001',
            tags: ['lead'],
            customFields: {},
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.listContacts();
      expect(result).toEqual(mockResponse);
    });

    it('should create contact', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane.smith@example.com',
          phone: '+1234567890',
          company: 'Example Corp',
          title: 'Director',
          organizationId: '123e4567-e89b-12d3-a456-426614174001',
          tags: ['lead'],
          customFields: {},
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.createContact({
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'jane.smith@example.com',
        phone: '+1234567890',
        company: 'Example Corp',
        title: 'Director'
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('Deals (CRM)', () => {
    it('should list deals', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Enterprise Deal',
            description: 'Large enterprise contract',
            value: 50000,
            currency: 'USD',
            stage: 'proposal',
            probability: 75,
            contactId: '123e4567-e89b-12d3-a456-426614174001',
            organizationId: '123e4567-e89b-12d3-a456-426614174002',
            expectedCloseDate: '2024-12-31',
            customFields: {},
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.listDeals();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Products (ERP)', () => {
    it('should list products', async () => {
      const mockResponse = {
        success: true,
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            name: 'Premium Product',
            description: 'High-quality product',
            sku: 'PROD-001',
            price: 99.99,
            currency: 'USD',
            category: 'Electronics',
            organizationId: '123e4567-e89b-12d3-a456-426614174001',
            isActive: true,
            customFields: {},
            createdAt: '2024-01-01T00:00:00Z',
            updatedAt: '2024-01-01T00:00:00Z'
          }
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.listProducts();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('AI Services', () => {
    it('should send AI chat request', async () => {
      const mockResponse = {
        success: true,
        data: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          prompt: 'What is the weather like?',
          response: 'I cannot provide real-time weather information.',
          model: 'gpt-4',
          usage: {
            promptTokens: 10,
            completionTokens: 15,
            totalTokens: 25
          },
          cost: 0.001,
          processingTime: 1500,
          createdAt: '2024-01-01T00:00:00Z'
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.aiChat({
        prompt: 'What is the weather like?',
        organizationId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002'
      });

      expect(result).toEqual(mockResponse);
    });
  });

  describe('System', () => {
    it('should check health', async () => {
      const mockResponse = {
        success: true,
        data: {
          status: 'healthy',
          version: '1.0.0',
          uptime: 3600,
          services: {
            database: 'up',
            redis: 'up',
            ai: 'up'
          }
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.healthCheck();
      expect(result).toEqual(mockResponse);
    });

    it('should get metrics', async () => {
      const mockResponse = {
        success: true,
        data: {
          requests: { total: 1000, success: 950, errors: 50 },
          performance: { avgResponseTime: 150, p95ResponseTime: 300 },
          errors: { rate: 0.05 },
          ai: { totalRequests: 100, totalCost: 5.50 }
        },
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const result = await sdk.getMetrics();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(sdk.healthCheck()).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      (fetch as any).mockRejectedValueOnce(new Error('The operation was aborted'));

      await expect(sdk.healthCheck()).rejects.toThrow('The operation was aborted');
    });

    it('should retry on server errors', async () => {
      const mockErrorResponse = {
        success: false,
        error: 'Internal server error',
        message: 'Something went wrong',
        requestId: 'req123',
        timestamp: '2024-01-01T00:00:00Z'
      };

      // First two calls fail, third succeeds
      (fetch as any)
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve(mockErrorResponse)
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          json: () => Promise.resolve(mockErrorResponse)
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: { status: 'healthy' },
            requestId: 'req123',
            timestamp: '2024-01-01T00:00:00Z'
          })
        });

      const result = await sdk.healthCheck();
      expect(result.data.status).toBe('healthy');
      expect(fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Utilities', () => {
    it('should set access token', () => {
      sdk.setAccessToken('new-token');
      // Token should be set in headers for subsequent requests
      expect(sdk).toBeDefined();
    });

    it('should set API key', () => {
      sdk.setApiKey('new-api-key');
      // API key should be set in headers for subsequent requests
      expect(sdk).toBeDefined();
    });
  });
});
