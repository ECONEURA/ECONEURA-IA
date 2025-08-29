import { PlaybookDefinition, createPlaybookExecutor } from './dsl.ts'
import { createGraphClient } from '../graph/client.ts'
import { createEnhancedAIRouter } from '../ai/enhanced-router.ts'
import { logger } from '../logging/index.ts'

/**
 * CFO Collection Playbook v1.0
 * 
 * Detects overdue invoices and creates:
 * 1. AI-generated email draft using cheap model
 * 2. Outlook draft for CFO approval
 * 3. Teams notification to finance team
 * 4. Planner task for follow-up
 * 5. Audit trail with HITL approval pending
 */
export const CFO_COLLECTION_PLAYBOOK: PlaybookDefinition = {
  id: 'cfo_collection_proactive_v1',
  name: 'CFO Collection Proactive',
  description: 'Automated debt collection workflow with HITL approval',
  version: '1.0.0',
  timeout: 300000, // 5 minutes
  maxRetries: 2,
  steps: [
    {
      id: 'detect_overdue',
      type: 'database_query',
      name: 'Detect Overdue Invoices',
      description: 'Query database for overdue invoices',
      config: {
        query: `
          SELECT 
            i.id,
            i.invoice_number,
            i.amount,
            i.due_date,
            i.status,
            c.name as company_name,
            c.email as company_email,
            c.contact_person
          FROM invoices i
          JOIN companies c ON i.company_id = c.id
          WHERE i.status = 'sent'
            AND i.due_date < CURRENT_DATE
            AND i.amount > 0
          ORDER BY i.due_date ASC
          LIMIT 10
        `,
        params: {},
      },
      compensation: {
        type: 'webhook_trigger',
        config: {
          url: '/api/webhooks/make/collection-fallback',
          method: 'POST',
          payload: {
            action: 'manual_collection_required',
            reason: 'Database query failed',
          },
        },
        description: 'Trigger manual collection process',
      },
    },
    {
      id: 'ai_generate_draft',
      type: 'ai_generate',
      name: 'Generate Email Draft',
      description: 'Generate email draft using AI',
      dependsOn: ['detect_overdue'],
      config: {
        prompt: `
          Generate a professional email draft for debt collection.
          
          Context:
          - Company: {{detect_overdue.company_name}}
          - Invoice: {{detect_overdue.invoice_number}}
          - Amount: €{{detect_overdue.amount}}
          - Due Date: {{detect_overdue.due_date}}
          - Days Overdue: {{detect_overdue.days_overdue}}
          
          Requirements:
          - Professional and courteous tone
          - Clear payment instructions
          - Offer payment plan if amount > €1000
          - Include invoice details
          - Maximum 200 words
          
          Generate the email content only, no subject line.
        `,
        model: 'mistral-instruct',
        maxTokens: 500,
        temperature: 0.7,
      },
      compensation: {
        type: 'webhook_trigger',
        config: {
          url: '/api/webhooks/make/ai-fallback',
          method: 'POST',
          payload: {
            action: 'manual_draft_required',
            reason: 'AI generation failed',
          },
        },
        description: 'Trigger manual draft creation',
      },
    },
    {
      id: 'create_outlook_draft',
      type: 'graph_outlook_draft',
      name: 'Create Outlook Draft',
      description: 'Create draft email in Outlook for CFO approval',
      dependsOn: ['ai_generate_draft'],
      config: {
        userId: '{{cfo_user_id}}',
        subject: 'Payment Reminder - Invoice {{detect_overdue.invoice_number}}',
        body: {
          contentType: 'html',
          content: `
            <p>Dear {{detect_overdue.contact_person}},</p>
            
            <p>{{ai_generate_draft.content}}</p>
            
            <p>Best regards,<br>
            Finance Team<br>
            {{company_name}}</p>
            
            <hr>
            <small>This is an automated draft requiring CFO approval before sending.</small>
          `,
        },
        recipients: [
          {
            emailAddress: {
              address: '{{detect_overdue.company_email}}',
            },
          },
        ],
        saveToSentItems: false,
      },
      compensation: {
        type: 'graph_teams_notify',
        config: {
          teamId: '{{finance_team_id}}',
          channelId: '{{finance_channel_id}}',
          message: `
            ⚠️ **Outlook Draft Creation Failed**
            
            Invoice: {{detect_overdue.invoice_number}}
            Company: {{detect_overdue.company_name}}
            Amount: €{{detect_overdue.amount}}
            
            Manual intervention required to create draft.
          `,
        },
        description: 'Notify finance team of draft creation failure',
      },
    },
    {
      id: 'teams_notification',
      type: 'graph_teams_notify',
      name: 'Send Teams Notification',
      description: 'Notify finance team of new collection action',
      dependsOn: ['create_outlook_draft'],
      config: {
        teamId: '{{finance_team_id}}',
        channelId: '{{finance_channel_id}}',
        message: `
          📧 **New Collection Action Created**
          
          **Invoice:** {{detect_overdue.invoice_number}}
          **Company:** {{detect_overdue.company_name}}
          **Amount:** €{{detect_overdue.amount}}
          **Days Overdue:** {{detect_overdue.days_overdue}}
          
          **Draft Created:** [View in Outlook]({{create_outlook_draft.webLink}})
          
          **Status:** Pending CFO Approval
          **Expires:** {{approval_expiry}}
          
          Please review and approve the draft email.
        `,
      },
    },
    {
      id: 'create_planner_task',
      type: 'graph_planner_task',
      name: 'Create Follow-up Task',
      description: 'Create Planner task for follow-up',
      dependsOn: ['teams_notification'],
      config: {
        planId: '{{finance_plan_id}}',
        title: `Follow-up: {{detect_overdue.company_name}} - Invoice {{detect_overdue.invoice_number}}`,
        description: `
          Follow up on overdue invoice payment.
          
          Invoice: {{detect_overdue.invoice_number}}
          Amount: €{{detect_overdue.amount}}
          Due Date: {{detect_overdue.due_date}}
          Days Overdue: {{detect_overdue.days_overdue}}
          
          Draft email created and pending approval.
          Check approval status and send if approved.
        `,
        dueDateTime: '{{follow_up_date}}',
        assignedTo: '{{finance_manager_id}}',
      },
    },
    {
      id: 'audit_record',
      type: 'database_query',
      name: 'Record Audit Event',
      description: 'Record audit event for HITL approval',
      dependsOn: ['create_planner_task'],
      config: {
        query: `
          INSERT INTO audit_events (
            org_id, 
            actor, 
            action, 
            payload_json, 
            created_at
          ) VALUES (
            $1, 
            $2, 
            $3, 
            $4, 
            NOW()
          )
        `,
        params: [
          '{{org_id}}',
          '{{user_id}}',
          'cfo_collection_playbook_executed',
          JSON.stringify({
            playbook_id: 'cfo_collection_proactive_v1',
            invoice_id: '{{detect_overdue.id}}',
            invoice_number: '{{detect_overdue.invoice_number}}',
            company_name: '{{detect_overdue.company_name}}',
            amount: '{{detect_overdue.amount}}',
            draft_id: '{{create_outlook_draft.draftId}}',
            task_id: '{{create_planner_task.taskId}}',
            status: 'pending_approval',
            approval_expiry: '{{approval_expiry}}',
            steps_completed: [
              'detect_overdue',
              'ai_generate_draft',
              'create_outlook_draft',
              'teams_notification',
              'create_planner_task',
            ],
          }),
        ],
      },
    },
  ],
  variables: {
    // These will be set by the executor
    org_id: '',
    user_id: '',
    cfo_user_id: '',
    finance_team_id: '',
    finance_channel_id: '',
    finance_plan_id: '',
    finance_manager_id: '',
    approval_expiry: '',
    follow_up_date: '',
  },
}

/**
 * CFO Collection Playbook Executor
 */
export class CFOCollectionExecutor {
  private graphClient: ReturnType<typeof createGraphClient>
  private aiRouter: ReturnType<typeof createEnhancedAIRouter>

  constructor() {
    this.graphClient = createGraphClient()
    this.aiRouter = createEnhancedAIRouter()
  }

  /**
   * Execute CFO collection playbook
   */
  async executeCollectionPlaybook(context: {
    orgId: string
    userId: string
    requestId: string
    cfoUserId: string
    financeTeamId: string
    financeChannelId: string
    financePlanId: string
    financeManagerId: string
  }): Promise<{
    success: boolean
    results: Map<string, any>
    auditTrail: any[]
    approvalRequired: boolean
    approvalExpiry: string
  }> {
    const logger = logger.child({
      playbook_id: CFO_COLLECTION_PLAYBOOK.id,
      org_id: context.orgId,
      user_id: context.userId,
      request_id: context.requestId,
    })

    logger.info('Starting CFO collection playbook')

    // Set up variables
    const approvalExpiry = new Date()
    approvalExpiry.setHours(approvalExpiry.getHours() + 48) // 48 hours

    const followUpDate = new Date()
    followUpDate.setDate(followUpDate.getDate() + 7) // 7 days

    const playbookContext = {
      orgId: context.orgId,
      userId: context.userId,
      requestId: context.requestId,
      variables: {
        org_id: context.orgId,
        user_id: context.userId,
        cfo_user_id: context.cfoUserId,
        finance_team_id: context.financeTeamId,
        finance_channel_id: context.financeChannelId,
        finance_plan_id: context.financePlanId,
        finance_manager_id: context.financeManagerId,
        approval_expiry: approvalExpiry.toISOString(),
        follow_up_date: followUpDate.toISOString(),
      },
    }

    // Create and execute playbook
    const executor = createPlaybookExecutor(CFO_COLLECTION_PLAYBOOK, playbookContext)
    const result = await executor.execute()

    logger.info('CFO collection playbook completed', {
      success: result.success,
      total_steps: CFO_COLLECTION_PLAYBOOK.steps.length,
      audit_events: result.auditTrail.length,
    })

    return {
      success: result.success,
      results: result.results,
      auditTrail: result.auditTrail,
      approvalRequired: true,
      approvalExpiry: approvalExpiry.toISOString(),
    }
  }

  /**
   * Get playbook status
   */
  async getPlaybookStatus(playbookId: string): Promise<{
    status: 'pending' | 'approved' | 'rejected' | 'expired'
    approvalExpiry: string
    auditTrail: any[]
  }> {
    // TODO: Query database for playbook status
    return {
      status: 'pending',
      approvalExpiry: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      auditTrail: [],
    }
  }

  /**
   * Approve playbook execution
   */
  async approvePlaybook(playbookId: string, approverId: string): Promise<{
    success: boolean
    message: string
  }> {
    // TODO: Implement approval logic
    logger.info('Playbook approved', {
      playbook_id: playbookId,
      approver_id: approverId,
    })

    return {
      success: true,
      message: 'Playbook approved successfully',
    }
  }

  /**
   * Reject playbook execution
   */
  async rejectPlaybook(playbookId: string, rejectorId: string, reason: string): Promise<{
    success: boolean
    message: string
  }> {
    // TODO: Implement rejection logic
    logger.info('Playbook rejected', {
      playbook_id: playbookId,
      rejector_id: rejectorId,
      reason,
    })

    return {
      success: true,
      message: 'Playbook rejected successfully',
    }
  }
}

// Factory function
export function createCFOCollectionExecutor(): CFOCollectionExecutor {
  return new CFOCollectionExecutor()
}
