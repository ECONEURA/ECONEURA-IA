import { Request, Response } from 'express'
import { z } from 'zod'
import { createCFOCollectionExecutor } from '@econeura/shared'
import { Problems } from '../middleware/problem-json.js'
import { v4 as uuidv4 } from 'uuid'

// Request validation schemas
const ExecuteCollectionRequestSchema = z.object({
  cfoUserId: z.string().min(1, 'CFO user ID is required'),
  financeTeamId: z.string().min(1, 'Finance team ID is required'),
  financeChannelId: z.string().min(1, 'Finance channel ID is required'),
  financePlanId: z.string().min(1, 'Finance plan ID is required'),
  financeManagerId: z.string().min(1, 'Finance manager ID is required'),
})

const PlaybookStatusRequestSchema = z.object({
  playbookId: z.string().min(1, 'Playbook ID is required'),
})

const PlaybookApprovalRequestSchema = z.object({
  playbookId: z.string().min(1, 'Playbook ID is required'),
  action: z.enum(['approve', 'reject']),
  reason: z.string().optional(),
})

export class FlowsController {
  private cfoExecutor = createCFOCollectionExecutor()

  /**
   * Execute CFO collection playbook
   */
  async executeCollection(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedBody = ExecuteCollectionRequestSchema.parse(req.body)
      
      // Get organization and user from auth context
      const orgId = req.orgId
      const userId = req.user?.id
      
      if (!orgId) {
        throw Problems.UNAUTHORIZED('Organization context required')
      }
      
      if (!userId) {
        throw Problems.UNAUTHORIZED('User context required')
      }

      // Generate request ID
      const requestId = uuidv4()

      // Execute collection playbook
      const result = await this.cfoExecutor.executeCollectionPlaybook({
        orgId,
        userId,
        requestId,
        cfoUserId: validatedBody.cfoUserId,
        financeTeamId: validatedBody.financeTeamId,
        financeChannelId: validatedBody.financeChannelId,
        financePlanId: validatedBody.financePlanId,
        financeManagerId: validatedBody.financeManagerId,
      })

      res.status(202).json({
        success: true,
        data: {
          playbookId: requestId,
          status: 'executing',
          approvalRequired: result.approvalRequired,
          approvalExpiry: result.approvalExpiry,
          stepsCompleted: result.results.size,
          auditEvents: result.auditTrail.length,
        },
        message: 'CFO collection playbook started successfully',
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        throw Problems.BAD_REQUEST('Invalid request data', {
          details: error.errors,
        })
      }

      throw error
    }
  }

  /**
   * Get playbook status
   */
  async getPlaybookStatus(req: Request, res: Response) {
    try {
      // Validate request
      const { playbookId } = PlaybookStatusRequestSchema.parse(req.params)
      
      // Get organization from auth context
      const orgId = req.orgId
      if (!orgId) {
        throw Problems.UNAUTHORIZED('Organization context required')
      }

      // Get playbook status
      const status = await this.cfoExecutor.getPlaybookStatus(playbookId)

      res.json({
        success: true,
        data: {
          playbookId,
          status: status.status,
          approvalExpiry: status.approvalExpiry,
          auditTrail: status.auditTrail,
        },
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        throw Problems.BAD_REQUEST('Invalid request data', {
          details: error.errors,
        })
      }

      throw error
    }
  }

  /**
   * Approve or reject playbook
   */
  async approvePlaybook(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedBody = PlaybookApprovalRequestSchema.parse(req.body)
      
      // Get user from auth context
      const userId = req.user?.id
      if (!userId) {
        throw Problems.UNAUTHORIZED('User context required')
      }

      // Execute approval/rejection
      let result
      if (validatedBody.action === 'approve') {
        result = await this.cfoExecutor.approvePlaybook(
          validatedBody.playbookId,
          userId
        )
      } else {
        result = await this.cfoExecutor.rejectPlaybook(
          validatedBody.playbookId,
          userId,
          validatedBody.reason || 'No reason provided'
        )
      }

      res.json({
        success: true,
        data: {
          playbookId: validatedBody.playbookId,
          action: validatedBody.action,
          approverId: userId,
          result: result.message,
        },
        message: result.message,
      })

    } catch (error) {
      if (error instanceof z.ZodError) {
        throw Problems.BAD_REQUEST('Invalid request data', {
          details: error.errors,
        })
      }

      throw error
    }
  }

  /**
   * Get available playbooks
   */
  async getAvailablePlaybooks(req: Request, res: Response) {
    try {
      // Get organization from auth context
      const orgId = req.orgId
      if (!orgId) {
        throw Problems.UNAUTHORIZED('Organization context required')
      }

      const playbooks = [
        {
          id: 'cfo_collection_proactive_v1',
          name: 'CFO Collection Proactive',
          description: 'Automated debt collection workflow with HITL approval',
          version: '1.0.0',
          category: 'finance',
          tags: ['collections', 'automation', 'hitl'],
          estimatedDuration: '5 minutes',
          requiresApproval: true,
          approvalExpiry: '48 hours',
        },
        // Add more playbooks here as they are implemented
      ]

      res.json({
        success: true,
        data: {
          playbooks,
          total: playbooks.length,
        },
      })

    } catch (error) {
      throw error
    }
  }

  /**
   * Get playbook execution history
   */
  async getExecutionHistory(req: Request, res: Response) {
    try {
      // Get organization from auth context
      const orgId = req.orgId
      if (!orgId) {
        throw Problems.UNAUTHORIZED('Organization context required')
      }

      // TODO: Query database for execution history
      const history = [
        {
          id: 'exec_123',
          playbookId: 'cfo_collection_proactive_v1',
          status: 'completed',
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          stepsCompleted: 6,
          stepsTotal: 6,
          approvalStatus: 'approved',
          approverId: 'user_456',
        },
        // Add more history items
      ]

      res.json({
        success: true,
        data: {
          history,
          total: history.length,
        },
      })

    } catch (error) {
      throw error
    }
  }
}

export const flowsController = new FlowsController()
