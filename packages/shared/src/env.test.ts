import { describe, it, expect, beforeEach, vi } from 'vitest'
import { env } from './env.ts.js'

describe('env()', () => {
  beforeEach(() => {
    // Reset environment
    vi.resetModules()
    process.env = {
      PGHOST: 'localhost',
      PGUSER: 'test',
      PGPASSWORD: 'test',
      PGDATABASE: 'test',
      NODE_ENV: 'test',
    }
  })

  it('should parse valid environment variables', () => {
    const result = env()

    expect(result.PGHOST).toBe('localhost')
    expect(result.PGUSER).toBe('test')
    expect(result.PGPASSWORD).toBe('test')
    expect(result.PGDATABASE).toBe('test')
    expect(result.NODE_ENV).toBe('test')
    expect(result.PGPORT).toBe(5432) // default value
    expect(result.AI_MONTHLY_CAP_EUR).toBe(50) // default value
  })

  it('should throw error for missing required variables', async () => {
    // unset PGHOST to simulate missing variable
    (process.env as any).PGHOST = undefined

    // reset module cache so env() re-parses process.env
    vi.resetModules()

    await expect(async () => {
      const mod = await import('./env')
      mod.env()
    }).rejects.toThrow('Missing or invalid environment variables: PGHOST')
  })

  it('should use default values for optional variables', () => {
    const result = env()

    expect(result.MISTRAL_BASE_URL).toBe('http://mistral:8080')
    expect(result.AZURE_OPENAI_API_VERSION).toBe('2024-02-15-preview')
    expect(result.AZURE_OPENAI_DEPLOYMENT).toBe('gpt-4o-mini')
  })
})



