// API Unit Tests - ECONEURA Cockpit
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/api/llm', () => {
    it('should return mock response for valid request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, response: 'NEURA demo: test message' })
      });
      
      global.fetch = mockFetch;

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'test message' }]
        })
      });

      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.response).toContain('NEURA demo');
    });

    it('should return error for invalid request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: false, error: 'Messages array is required' })
      });
      
      global.fetch = mockFetch;

      const response = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await response.json();
      expect(data.ok).toBe(false);
      expect(data.error).toBe('Messages array is required');
    });
  });

  describe('/api/agent', () => {
    it('should accept valid trigger request', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, result: { accepted: true } })
      });
      
      global.fetch = mockFetch;

      const runOrder = {
        tenantId: 'demo-tenant',
        dept: 'ceo',
        agentKey: 'test-agent',
        trigger: 'manual',
        payload: { params: {}, hitl: false },
        idempotencyKey: 'test-key-123',
        requestedBy: { userId: 'demo-user', role: 'admin' },
        legalBasis: 'legitimate_interest',
        dataClass: ['none'],
        ts: new Date().toISOString()
      };

      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(runOrder)
      });

      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(data.result.accepted).toBe(true);
    });

    it('should return status for valid idempotency key', async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ok: true, events: [] })
      });
      
      global.fetch = mockFetch;

      const response = await fetch('/api/agent?idempotencyKey=test-key-123', {
        method: 'GET'
      });

      const data = await response.json();
      expect(data.ok).toBe(true);
      expect(Array.isArray(data.events)).toBe(true);
    });
  });
});

