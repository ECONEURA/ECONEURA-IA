import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import {
  ECONEURAClient,
  createECONEURAClient,
  ECONEURAError,
  MemoryPutRequestSchema,
  MemoryQueryRequestSchema,
} from '../client.js';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

describe('ECONEURAClient', () => {
  let client: ECONEURAClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockAxiosInstance = {
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
      post: vi.fn(),
      get: vi.fn(),
      request: vi.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    client = new ECONEURAClient({
      baseURL: 'http://localhost:4000',
      apiKey: 'test-api-key',
    });
  });

  describe('constructor', () => {
    it('should create axios instance with correct config', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:4000',
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ECONEURA-SDK/1.0.0',
          'Authorization': 'Bearer test-api-key',
        },
      });
    });

    it('should setup request and response interceptors', () => {
      expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
      expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
    });
  });

  describe('putMemory', () => {
    it('should store memory successfully', async () => {
      const request = {
        tenantId: 'tenant-123',
        namespace: 'conversations',
        text: 'Test memory',
      };

      const mockResponse = {
        data: {
          ok: true,
          id: 'mem_123',
          timestamp: '2024-01-15T10:30:00Z',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.putMemory(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/memory/put',
        request,
        { headers: {} }
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should include idempotency key in headers', async () => {
      const request = {
        tenantId: 'tenant-123',
        namespace: 'conversations',
        text: 'Test memory',
      };

      const mockResponse = {
        data: {
          ok: true,
          id: 'mem_123',
          timestamp: '2024-01-15T10:30:00Z',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      await client.putMemory(request, 'test-idempotency-key');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/memory/put',
        request,
        { headers: { 'x-idempotency-key': 'test-idempotency-key' } }
      );
    });

    it('should validate request schema', async () => {
      const invalidRequest = {
        // Missing required fields
        text: 'Test memory',
      };

      await expect(client.putMemory(invalidRequest as any)).rejects.toThrow();
    });

    it('should handle API errors', async () => {
      const request = {
        tenantId: 'tenant-123',
        namespace: 'conversations',
        text: 'Test memory',
      };

      const errorResponse = {
        response: {
          status: 400,
          data: {
            type: 'https://econeura/errors/validation-error',
            title: 'Validation Error',
            status: 400,
            detail: 'Invalid request',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(errorResponse);

      await expect(client.putMemory(request)).rejects.toThrow(ECONEURAError);
    });
  });

  describe('queryMemory', () => {
    it('should query memories successfully', async () => {
      const request = {
        tenantId: 'tenant-123',
        namespace: 'conversations',
        query: 'test query',
      };

      const mockResponse = {
        data: {
          matches: [
            {
              id: 'mem_123',
              score: 0.95,
              text: 'Test memory',
            },
          ],
          query: 'test query',
          namespace: 'conversations',
          timestamp: '2024-01-15T10:30:00Z',
          totalMatches: 1,
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.queryMemory(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/v1/memory/query',
        request
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should validate request schema', async () => {
      const invalidRequest = {
        // Missing required fields
        query: 'test query',
      };

      await expect(client.queryMemory(invalidRequest as any)).rejects.toThrow();
    });
  });

  describe('getMemoryStats', () => {
    it('should get memory stats successfully', async () => {
      const tenantId = 'tenant-123';
      const mockResponse = {
        data: {
          tenantId: 'tenant-123',
          totalRecords: 150,
          namespaces: ['conversations', 'embeddings'],
          lastUpdated: '2024-01-15T10:30:00Z',
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await client.getMemoryStats(tenantId);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith(
        `/v1/memory/stats/${tenantId}`
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('cleanupExpiredMemories', () => {
    it('should cleanup expired memories successfully', async () => {
      const mockResponse = {
        data: {
          ok: true,
          timestamp: '2024-01-15T10:30:00Z',
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await client.cleanupExpiredMemories();

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/v1/memory/cleanup');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('retry logic', () => {
    it('should retry on 5xx errors', async () => {
      const request = {
        tenantId: 'tenant-123',
        namespace: 'conversations',
        text: 'Test memory',
      };

      const errorResponse = {
        response: {
          status: 500,
          data: { error: 'Internal server error' },
        },
      };

      const successResponse = {
        data: {
          ok: true,
          id: 'mem_123',
          timestamp: '2024-01-15T10:30:00Z',
        },
      };

      // First call fails, second succeeds
      mockAxiosInstance.post
        .mockRejectedValueOnce(errorResponse)
        .mockResolvedValueOnce(successResponse);

      const result = await client.putMemory(request);

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(2);
      expect(result).toEqual(successResponse.data);
    });

    it('should not retry on 4xx errors', async () => {
      const request = {
        tenantId: 'tenant-123',
        namespace: 'conversations',
        text: 'Test memory',
      };

      const errorResponse = {
        response: {
          status: 400,
          data: { error: 'Bad request' },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(errorResponse);

      await expect(client.putMemory(request)).rejects.toThrow();

      expect(mockAxiosInstance.post).toHaveBeenCalledTimes(1);
    });
  });
});

describe('createECONEURAClient', () => {
  it('should create client with provided config', () => {
    const config = {
      baseURL: 'https://api.example.com',
      apiKey: 'test-key',
      timeout: 60000,
    };

    const client = createECONEURAClient(config);

    expect(client).toBeInstanceOf(ECONEURAClient);
  });
});

describe('ECONEURAError', () => {
  it('should create error with status and details', () => {
    const details = {
      type: 'https://econeura/errors/validation-error',
      title: 'Validation Error',
      status: 400,
      detail: 'Invalid request',
    };

    const error = new ECONEURAError('Test error', 400, details);

    expect(error.message).toBe('Test error');
    expect(error.status).toBe(400);
    expect(error.details).toEqual(details);
    expect(error.name).toBe('ECONEURAError');
  });
});
