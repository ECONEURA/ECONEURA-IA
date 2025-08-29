import { describe, it, expect, beforeEach, vi } from 'vitest'
import { costMeter } from './cost-meter.ts'

// Mock database imports
vi.mock('@econeura/db', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          execute: vi.fn(() => Promise.resolve([
            { totalCost: '25.50' },
            { totalCost: '15.25' },
          ])),
        })),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve()),
    })),
  },
  setOrg: vi.fn(() => Promise.resolve()),
  aiCostUsage: {
    costEur: 'costEur',
    id: 'id',
    timestamp: 'timestamp',
    orgId: 'orgId',
    model: 'model',
    inputTokens: 'inputTokens',
    outputTokens: 'outputTokens',
  },
}))

describe('CostMeter', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('calculateCost', () => {
    it('should calculate cost for mistral-instruct correctly', () => {
      const cost = costMeter.calculateCost('mistral-instruct', 1000, 500)
      // 1000 input tokens * 0.14€/1K + 500 output tokens * 0.42€/1K
      // = 0.14€ + 0.21€ = 0.35€
      expect(cost).toBe(0.35)
    })

    it('should calculate cost for gpt-4o-mini correctly', () => {
      const cost = costMeter.calculateCost('gpt-4o-mini', 2000, 1000)
      // 2000 input tokens * 0.15€/1K + 1000 output tokens * 0.60€/1K
      // = 0.30€ + 0.60€ = 0.90€
      expect(cost).toBe(0.90)
    })

    it('should calculate cost for gpt-4o correctly', () => {
      const cost = costMeter.calculateCost('gpt-4o', 1000, 500)
      // 1000 input tokens * 2.50€/1K + 500 output tokens * 10.00€/1K
      // = 2.50€ + 5.00€ = 7.50€
      expect(cost).toBe(7.50)
    })

    it('should throw error for unknown model', () => {
      expect(() => {
        costMeter.calculateCost('unknown-model' as any, 1000, 500)
      }).toThrow('Unknown model: unknown-model')
    })
  })

  describe('recordUsage', () => {
    it('should record usage and return cost usage object', () => {
      const usage = costMeter.recordUsage('org1', 'mistral-instruct', 1000, 500)
      
      expect(usage).toEqual({
        orgId: 'org1',
        model: 'mistral-instruct',
        inputTokens: 1000,
        outputTokens: 500,
        costEur: 0.35,
        timestamp: expect.any(Date),
      })
    })

    it('should identify provider correctly', () => {
      const mistralUsage = costMeter.recordUsage('org1', 'mistral-instruct', 100, 50)
      const azureUsage = costMeter.recordUsage('org1', 'gpt-4o-mini', 100, 50)
      
      expect(mistralUsage).toBeDefined()
      expect(azureUsage).toBeDefined()
    })
  })

  describe('getMonthlyUsage', () => {
    it('should return monthly usage from database', async () => {
      const usage = await costMeter.getMonthlyUsage('org1')
      
      // Mock returns 25.50 + 15.25 = 40.75
      expect(usage).toBe(40.75)
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { db } = await import('@econeura/db')
      vi.mocked(db.select).mockImplementation(() => {
        throw new Error('Database connection failed')
      })

      const usage = await costMeter.getMonthlyUsage('org1')
      expect(usage).toBe(0) // Fallback to 0
    })
  })

  describe('checkMonthlyCap', () => {
    it('should return within limit when usage is below cap', async () => {
      // Mock low usage
      const { db } = await import('@econeura/db')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            execute: vi.fn(() => Promise.resolve([
              { totalCost: '25.00' },
            ])),
          })),
        })),
      } as any)

      const result = await costMeter.checkMonthlyCap('org1')
      
      expect(result).toEqual({
        withinLimit: true,
        currentUsage: 25.00,
        limit: 50, // Default cap from env
      })
    })

    it('should return exceeded when usage is above cap', async () => {
      // Mock high usage
      const { db } = await import('@econeura/db')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            execute: vi.fn(() => Promise.resolve([
              { totalCost: '55.00' },
            ])),
          })),
        })),
      } as any)

      const result = await costMeter.checkMonthlyCap('org1')
      
      expect(result).toEqual({
        withinLimit: false,
        currentUsage: 55.00,
        limit: 50,
      })
    })
  })

  describe('recordUsageToDatabase', () => {
    it('should record usage to database successfully', async () => {
      const usage = {
        orgId: 'org1',
        model: 'mistral-instruct',
        inputTokens: 1000,
        outputTokens: 500,
        costEur: 0.35,
        timestamp: new Date(),
      }

      await costMeter.recordUsageToDatabase(usage)
      
      // Verify setOrg was called
      const { setOrg } = await import('@econeura/db')
      expect(setOrg).toHaveBeenCalledWith('org1')
    })

    it('should handle database errors gracefully', async () => {
      // Mock database error
      const { db } = await import('@econeura/db')
      vi.mocked(db.insert).mockImplementation(() => {
        throw new Error('Database error')
      })

      const usage = {
        orgId: 'org1',
        model: 'mistral-instruct',
        inputTokens: 1000,
        outputTokens: 500,
        costEur: 0.35,
        timestamp: new Date(),
      }

      // Should not throw
      await expect(costMeter.recordUsageToDatabase(usage)).resolves.toBeUndefined()
    })
  })

  describe('getUsageHistory', () => {
    it('should return usage history for specified days', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            orderBy: vi.fn(() => ({
              execute: vi.fn(() => Promise.resolve([
                {
                  orgId: 'org1',
                  model: 'mistral-instruct',
                  inputTokens: 1000,
                  outputTokens: 500,
                  costEur: '0.35',
                  timestamp: new Date('2024-01-15'),
                },
              ])),
            })),
          })),
        })),
      } as any)

      const history = await costMeter.getUsageHistory('org1', 30)
      
      expect(history).toHaveLength(1)
      expect(history[0]).toEqual({
        orgId: 'org1',
        model: 'mistral-instruct',
        inputTokens: 1000,
        outputTokens: 500,
        costEur: 0.35,
        timestamp: expect.any(Date),
      })
    })
  })

  describe('getProviderUsage', () => {
    it('should return provider usage statistics', async () => {
      const { db } = await import('@econeura/db')
      vi.mocked(db.select).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            execute: vi.fn(() => Promise.resolve([
              { totalCost: '25.50', count: '10' },
            ])),
          })),
        })),
      } as any)

      const usage = await costMeter.getProviderUsage('org1', 'mistral')
      
      expect(usage).toEqual({
        totalCost: 25.50,
        totalRequests: 10,
        averageLatency: 0, // TODO: Implement latency tracking
      })
    })
  })
})

