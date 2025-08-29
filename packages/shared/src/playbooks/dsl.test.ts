import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PlaybookDefinition, createPlaybookExecutor, StepDefinition } from './dsl.js'

// Mock dependencies
vi.mock('../otel/index.js', () => ({
  createTracer: () => ({
    startSpan: vi.fn(() => ({
      setAttributes: vi.fn(),
      recordException: vi.fn(),
      end: vi.fn(),
    })),
  }),
}))

vi.mock('../logging/index.js', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  },
}))

describe('Playbook DSL', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PlaybookExecutor', () => {
    it('should execute playbook successfully', async () => {
      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test playbook for unit testing',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: 'condition',
            name: 'Test Condition',
            config: {
              conditions: [
                {
                  field: 'test_value',
                  operator: 'equals',
                  value: 'expected',
                },
              ],
            },
          },
          {
            id: 'step2',
            type: 'delay',
            name: 'Test Delay',
            config: {
              duration: 10, // 10ms for testing
            },
          },
        ],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {
          test_value: 'expected',
        },
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.success).toBe(true)
      expect(result.results.size).toBe(2)
      expect(result.auditTrail.length).toBeGreaterThan(0)
    })

    it('should handle step dependencies correctly', async () => {
      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test playbook with dependencies',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: 'condition',
            name: 'First Step',
            config: {
              conditions: [
                {
                  field: 'test_value',
                  operator: 'equals',
                  value: 'expected',
                },
              ],
            },
          },
          {
            id: 'step2',
            type: 'delay',
            name: 'Dependent Step',
            dependsOn: ['step1'],
            config: {
              duration: 10,
            },
          },
        ],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {
          test_value: 'expected',
        },
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.success).toBe(true)
      expect(result.results.get('step1')?.success).toBe(true)
      expect(result.results.get('step2')?.success).toBe(true)
    })

    it('should skip dependent steps when dependency fails', async () => {
      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test playbook with failed dependency',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: 'condition',
            name: 'Failing Step',
            config: {
              conditions: [
                {
                  field: 'test_value',
                  operator: 'equals',
                  value: 'unexpected',
                },
              ],
            },
          },
          {
            id: 'step2',
            type: 'delay',
            name: 'Dependent Step',
            dependsOn: ['step1'],
            config: {
              duration: 10,
            },
          },
        ],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {
          test_value: 'expected',
        },
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.success).toBe(false)
      expect(result.results.get('step1')?.success).toBe(false)
      // step2 should be skipped due to dependency failure
      expect(result.results.has('step2')).toBe(false)
    })

    it('should execute compensation when step fails', async () => {
      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test playbook with compensation',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: 'ai_generate',
            name: 'Failing AI Step',
            config: {
              prompt: 'test',
              model: 'test-model',
              maxTokens: 100,
            },
            compensation: {
              type: 'webhook_trigger',
              config: {
                url: '/api/compensation',
                method: 'POST',
                payload: { action: 'compensate' },
              },
              description: 'Compensation for AI failure',
            },
          },
        ],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {},
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.success).toBe(false)
      expect(result.results.get('step1')?.success).toBe(false)
      expect(result.results.get('step1')?.compensationRequired).toBe(true)
    })

    it('should evaluate conditions correctly', async () => {
      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test playbook with conditions',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: 'condition',
            name: 'Test Conditions',
            config: {
              conditions: [
                {
                  field: 'string_value',
                  operator: 'equals',
                  value: 'test',
                },
                {
                  field: 'number_value',
                  operator: 'greater_than',
                  value: 5,
                },
                {
                  field: 'exists_value',
                  operator: 'exists',
                  value: true,
                },
              ],
            },
          },
        ],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {
          string_value: 'test',
          number_value: 10,
          exists_value: 'some_value',
        },
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.success).toBe(true)
      expect(result.results.get('step1')?.success).toBe(true)
      expect(result.results.get('step1')?.data?.result).toBe(true)
    })

    it('should handle variable substitution correctly', async () => {
      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test playbook with variable substitution',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: 'condition',
            name: 'Set Variable',
            config: {
              conditions: [
                {
                  field: 'test_value',
                  operator: 'equals',
                  value: 'expected',
                },
              ],
            },
          },
          {
            id: 'step2',
            type: 'condition',
            name: 'Use Variable',
            config: {
              conditions: [
                {
                  field: 'step1.result',
                  operator: 'equals',
                  value: true,
                },
              ],
            },
          },
        ],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {
          test_value: 'expected',
        },
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.success).toBe(true)
      expect(result.results.get('step1')?.success).toBe(true)
      expect(result.results.get('step2')?.success).toBe(true)
    })

    it('should handle step timeouts', async () => {
      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test playbook with timeout',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: 'delay',
            name: 'Long Delay',
            timeout: 50, // 50ms timeout
            config: {
              duration: 100, // 100ms delay (should timeout)
            },
          },
        ],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {},
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.success).toBe(false)
      expect(result.results.get('step1')?.success).toBe(false)
    })

    it('should retry failed steps', async () => {
      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test playbook with retries',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: 'condition',
            name: 'Retry Step',
            retries: 2,
            config: {
              conditions: [
                {
                  field: 'retry_count',
                  operator: 'greater_than',
                  value: 1,
                },
              ],
            },
          },
        ],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {
          retry_count: 2, // Will succeed on retry
        },
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.success).toBe(true)
      expect(result.results.get('step1')?.success).toBe(true)
    })

    it('should create comprehensive audit trail', async () => {
      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test playbook audit trail',
        version: '1.0.0',
        steps: [
          {
            id: 'step1',
            type: 'delay',
            name: 'Test Step',
            config: {
              duration: 10,
            },
          },
        ],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {},
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.auditTrail.length).toBeGreaterThan(0)
      
      // Check audit trail structure
      const auditEvent = result.auditTrail[0]
      expect(auditEvent).toHaveProperty('timestamp')
      expect(auditEvent).toHaveProperty('stepId')
      expect(auditEvent).toHaveProperty('action')
      expect(auditEvent).toHaveProperty('status')
      expect(auditEvent).toHaveProperty('metadata')
      expect(auditEvent.metadata).toHaveProperty('org_id')
      expect(auditEvent.metadata).toHaveProperty('user_id')
      expect(auditEvent.metadata).toHaveProperty('request_id')
    })
  })

  describe('Step Types', () => {
    it('should handle AI generation step', async () => {
      const step: StepDefinition = {
        id: 'ai_step',
        type: 'ai_generate',
        name: 'AI Generation',
        config: {
          prompt: 'Generate test content',
          model: 'mistral-instruct',
          maxTokens: 100,
        },
      }

      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test AI generation',
        version: '1.0.0',
        steps: [step],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {},
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.results.get('ai_step')?.success).toBe(true)
      expect(result.results.get('ai_step')?.data).toHaveProperty('content')
    })

    it('should handle Graph operations', async () => {
      const step: StepDefinition = {
        id: 'graph_step',
        type: 'graph_outlook_draft',
        name: 'Graph Draft',
        config: {
          userId: 'user1',
          subject: 'Test Subject',
          body: { contentType: 'text', content: 'Test content' },
          recipients: [{ emailAddress: { address: 'test@example.com' } }],
        },
      }

      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test Graph operations',
        version: '1.0.0',
        steps: [step],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {},
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.results.get('graph_step')?.success).toBe(true)
      expect(result.results.get('graph_step')?.data).toHaveProperty('draftId')
    })

    it('should handle database queries', async () => {
      const step: StepDefinition = {
        id: 'db_step',
        type: 'database_query',
        name: 'Database Query',
        config: {
          query: 'SELECT 1 as test',
          params: [],
        },
      }

      const definition: PlaybookDefinition = {
        id: 'test_playbook',
        name: 'Test Playbook',
        description: 'Test database queries',
        version: '1.0.0',
        steps: [step],
      }

      const context = {
        orgId: 'org1',
        userId: 'user1',
        requestId: 'req1',
        variables: {},
      }

      const executor = createPlaybookExecutor(definition, context)
      const result = await executor.execute()

      expect(result.results.get('db_step')?.success).toBe(true)
      expect(result.results.get('db_step')?.data).toHaveProperty('results')
    })
  })
})
