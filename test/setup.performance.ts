import { beforeAll, afterAll } from 'vitest'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'

// Global setup for performance tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test'
  
  // Create performance results directory
  const resultsDir = join(process.cwd(), 'performance-results')
  await mkdir(resultsDir, { recursive: true })
  
  // Initialize performance tracking
  global.performanceMetrics = {
    startTime: Date.now(),
    results: [],
  }
  
  console.log('✅ Performance test setup completed')
})

afterAll(async () => {
  // Save performance results
  const resultsDir = join(process.cwd(), 'performance-results')
  const resultsFile = join(resultsDir, 'summary.json')
  
  const summary = {
    timestamp: new Date().toISOString(),
    totalTests: global.performanceMetrics?.results?.length || 0,
    totalDuration: Date.now() - (global.performanceMetrics?.startTime || Date.now()),
    results: global.performanceMetrics?.results || [],
  }
  
  await writeFile(resultsFile, JSON.stringify(summary, null, 2))
  
  console.log('✅ Performance test teardown completed')
})

// Global performance utilities
export const performanceUtils = {
  // Helper to measure performance
  async measurePerformance<T>(
    name: string,
    fn: () => Promise<T>,
    thresholdMs: number = 1000
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      
      // Record performance metric
      if (global.performanceMetrics) {
        global.performanceMetrics.results.push({
          name,
          duration,
          threshold: thresholdMs,
          passed: duration <= thresholdMs,
          timestamp: new Date().toISOString(),
        })
      }
      
      // Assert performance threshold
      if (duration > thresholdMs) {
        throw new Error(
          `Performance test "${name}" failed: ${duration.toFixed(2)}ms > ${thresholdMs}ms threshold`
        )
      }
      
      return result
    } catch (error) {
      const duration = performance.now() - startTime
      
      // Record failed performance metric
      if (global.performanceMetrics) {
        global.performanceMetrics.results.push({
          name,
          duration,
          threshold: thresholdMs,
          passed: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        })
      }
      
      throw error
    }
  },
  
  // Helper to run load tests
  async runLoadTest<T>(
    name: string,
    fn: () => Promise<T>,
    concurrency: number = 10,
    iterations: number = 100
  ) {
    const startTime = performance.now()
    const results: Array<{ success: boolean; duration: number; error?: string }> = []
    
    // Run concurrent iterations
    const promises = Array.from({ length: iterations }, async () => {
      const iterationStart = performance.now()
      
      try {
        await fn()
        const duration = performance.now() - iterationStart
        
        results.push({ success: true, duration })
        return { success: true, duration }
      } catch (error) {
        const duration = performance.now() - iterationStart
        
        results.push({
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        return { success: false, duration, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })
    
    // Execute with concurrency limit
    const batchSize = Math.ceil(iterations / concurrency)
    const batches = []
    
    for (let i = 0; i < iterations; i += batchSize) {
      const batch = promises.slice(i, i + batchSize)
      batches.push(Promise.all(batch))
    }
    
    await Promise.all(batches)
    
    const totalDuration = performance.now() - startTime
    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length
    const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length
    
    // Record load test results
    if (global.performanceMetrics) {
      global.performanceMetrics.results.push({
        name: `load-test-${name}`,
        duration: totalDuration,
        threshold: 0, // No threshold for load tests
        passed: failed === 0,
        loadTest: {
          concurrency,
          iterations,
          successful,
          failed,
          avgDuration,
          successRate: (successful / iterations) * 100,
        },
        timestamp: new Date().toISOString(),
      })
    }
    
    return {
      name,
      totalDuration,
      successful,
      failed,
      avgDuration,
      successRate: (successful / iterations) * 100,
      results,
    }
  },
}

// Extend global types
declare global {
  var performanceMetrics: {
    startTime: number
    results: Array<{
      name: string
      duration: number
      threshold: number
      passed: boolean
      error?: string
      loadTest?: {
        concurrency: number
        iterations: number
        successful: number
        failed: number
        avgDuration: number
        successRate: number
      }
      timestamp: string
    }>
  }
}
