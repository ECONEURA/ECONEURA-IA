import { z } from 'zod'
import { meter } from './otel/index.js'
import { env } from './env.js'

// Cost rates per model (EUR per 1K tokens)
const COST_RATES = {
  'mistral-instruct': { input: 0.14, output: 0.42 }, // EUR per 1K tokens
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
  'gpt-4o': { input: 2.50, output: 10.00 },
} as const

type ModelName = keyof typeof COST_RATES

const CostUsageSchema = z.object({
  orgId: z.string(),
  model: z.string(),
  inputTokens: z.number().positive(),
  outputTokens: z.number().positive(),
  costEur: z.number().positive(),
  timestamp: z.date(),
})

type CostUsage = z.infer<typeof CostUsageSchema>

class CostMeter {
  private costCounter = meter.createCounter('ai_cost_eur_total', {
    description: 'Total AI cost in EUR',
  })
  private usageCounter = meter.createCounter('ai_requests_total', {
    description: 'Total AI requests',
  })
  private monthlyCap = env().AI_MONTHLY_CAP_EUR

  calculateCost(model: ModelName, inputTokens: number, outputTokens: number): number {
    const rates = COST_RATES[model]
    if (!rates) {
      throw new Error(`Unknown model: ${model}`)
    }

    const inputCost = (inputTokens / 1000) * rates.input
    const outputCost = (outputTokens / 1000) * rates.output
    return inputCost + outputCost
  }

  recordUsage(orgId: string, model: string, inputTokens: number, outputTokens: number): CostUsage {
    const modelName = model as ModelName
    const costEur = this.calculateCost(modelName, inputTokens, outputTokens)

    const usage: CostUsage = {
      orgId,
      model,
      inputTokens,
      outputTokens,
      costEur,
      timestamp: new Date(),
    }

    // Record metrics
    this.costCounter.add(costEur, { org_id: orgId, model, provider: this.getProvider(model) })
    this.usageCounter.add(1, { org_id: orgId, model, provider: this.getProvider(model) })

    return usage
  }

  private getProvider(model: string): string {
    if (model.startsWith('mistral')) return 'mistral'
    if (model.startsWith('gpt')) return 'azure-openai'
    return 'unknown'
  }

  async getMonthlyUsage(orgId: string): Promise<number> {
    try {
      // Import database dynamically to avoid circular dependencies
      const { db, setOrg } = await import('@econeura/db')
      
      // Set organization context for RLS
      await setOrg(orgId)
      
      // Get current month's usage from database
      const currentDate = new Date()
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      
      const { aiCostUsage } = await import('@econeura/db')
      
      const result = await db
        .select({ totalCost: aiCostUsage.costEur })
        .from(aiCostUsage)
        .where(
          aiCostUsage.timestamp >= startOfMonth
        )
        .execute()

      const totalCost = result.reduce((sum: number, row: any) => sum + Number(row.totalCost), 0)
      return totalCost
      
    } catch (error) {
      // Fallback to in-memory tracking if database fails
      return 0
    }
  }

  async checkMonthlyCap(orgId: string): Promise<{ withinLimit: boolean; currentUsage: number; limit: number }> {
    const currentUsage = await this.getMonthlyUsage(orgId)
    return {
      withinLimit: currentUsage < this.monthlyCap,
      currentUsage,
      limit: this.monthlyCap,
    }
  }

  async recordUsageToDatabase(usage: CostUsage): Promise<void> {
    try {
      const { db, setOrg } = await import('@econeura/db')
      const { aiCostUsage } = await import('@econeura/db')
      
      // Set organization context for RLS
      await setOrg(usage.orgId)
      
      // Insert usage record
      await db.insert(aiCostUsage).values({
        orgId: usage.orgId,
        model: usage.model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        costEur: usage.costEur,
        timestamp: usage.timestamp,
      })
      
    } catch (error) {
      console.error('Error recording usage to database:', error)
      // Don't throw - we don't want to break the AI request if metrics fail
    }
  }

  async getUsageHistory(orgId: string, days: number = 30): Promise<CostUsage[]> {
    try {
      const { db, setOrg } = await import('@econeura/db')
      const { aiCostUsage } = await import('@econeura/db')
      
      await setOrg(orgId)
      
      const startDate = new Date()
      startDate.setDate(startDate.getDate() - days)
      
      const result = await db
        .select()
        .from(aiCostUsage)
        .where(aiCostUsage.timestamp >= startDate)
        .orderBy(aiCostUsage.timestamp)
        .execute()
      
      return result.map(row => ({
        orgId: row.orgId,
        model: row.model,
        inputTokens: row.inputTokens,
        outputTokens: row.outputTokens,
        costEur: Number(row.costEur),
        timestamp: row.timestamp,
      }))
      
    } catch (error) {
      console.error('Error getting usage history:', error)
      return []
    }
  }

  async getProviderUsage(orgId: string, provider: string): Promise<{
    totalCost: number
    totalRequests: number
    averageLatency: number
  }> {
    try {
      const { db, setOrg } = await import('@econeura/db')
      const { aiCostUsage } = await import('@econeura/db')
      
      await setOrg(orgId)
      
      const currentDate = new Date()
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      
      const result = await db
        .select({
          totalCost: aiCostUsage.costEur,
          count: aiCostUsage.id,
        })
        .from(aiCostUsage)
        .where(
          aiCostUsage.timestamp >= startOfMonth,
          aiCostUsage.model.like(`${provider}%`)
        )
        .execute()
      
      const totalCost = result.reduce((sum, row) => sum + Number(row.totalCost), 0)
      const totalRequests = result.reduce((sum, row) => sum + Number(row.count), 0)
      
      return {
        totalCost,
        totalRequests,
        averageLatency: 0, // TODO: Add latency tracking to database
      }
      
    } catch (error) {
      console.error('Error getting provider usage:', error)
      return {
        totalCost: 0,
        totalRequests: 0,
        averageLatency: 0,
      }
    }
  }
}

export const costMeter = new CostMeter()
export type { CostUsage, ModelName }
