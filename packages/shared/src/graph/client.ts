import { Client } from '@microsoft/microsoft-graph-client'
import { ConfidentialClientApplication } from '@azure/msal-node'
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials'
import { ClientSecretCredential } from '@azure/identity'
// import { createTracer } from '../otel/index.ts'
import { logger } from '../logging/index.ts'
import { env } from '../env.ts'

export interface GraphConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  defaultTeamId?: string
  defaultChannelId?: string
}

export interface GraphMessage {
  id: string
  subject: string
  body: {
    contentType: string
    content: string
  }
  toRecipients: Array<{
    emailAddress: {
      address: string
    }
  }>
  from?: {
    emailAddress: {
      address: string
    }
  }
  createdDateTime: string
  receivedDateTime: string
}

export interface GraphDraftMessage {
  subject: string
  body: {
    contentType: string
    content: string
  }
  toRecipients: Array<{
    emailAddress: {
      address: string
    }
  }>
  saveToSentItems?: boolean
}

export interface GraphTeamsMessage {
  content: string
  contentType?: 'html' | 'text'
}

export interface GraphPlannerTask {
  title: string
  dueDateTime?: string
  assignedTo?: string
  description?: string
}

export class GraphClient {
  private client: Client
  private msalApp: ConfidentialClientApplication
  private credential: ClientSecretCredential
  private tracer = createTracer('graph-client')
  private meter = createMeter('graph-client')
  private config: GraphConfig

  constructor(config: GraphConfig) {
    this.config = config
    
    // Initialize MSAL
    this.msalApp = new ConfidentialClientApplication({
      auth: {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        authority: `https://login.microsoftonline.com/${config.tenantId}`,
      },
    })

    // Initialize Azure credential
    this.credential = new ClientSecretCredential(
      config.tenantId,
      config.clientId,
      config.clientSecret
    )

    // Initialize Graph client
    const authProvider = new TokenCredentialAuthenticationProvider(this.credential, {
      scopes: [
        'https://graph.microsoft.com/.default',
        'Mail.ReadWrite',
        'Teamwork.Migrate.All',
        'Sites.Selected',
      ],
    })

    this.client = Client.initWithMiddleware({
      authProvider,
      defaultVersion: 'v1.0',
    })
  }

  /**
   * Create Outlook draft message
   */
  async createDraftMessage(
    userId: string,
    draft: GraphDraftMessage
  ): Promise<{ id: string; webLink: string }> {
    const span = this.tracer.startSpan('graph_create_draft_message')
    
    try {
      const response = await this.client
        .api(`/users/${userId}/messages`)
        .post({
          ...draft,
          isDraft: true,
        })

      span.setAttributes({
        'graph.user_id': userId,
        'graph.message_id': response.id,
        'graph.subject': draft.subject,
      })

      return {
        id: response.id,
        webLink: response.webLink,
      }
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError('createDraftMessage', error)
    } finally {
      span.end()
    }
  }

  /**
   * Send Teams message to channel
   */
  async sendTeamsMessage(
    teamId: string,
    channelId: string,
    message: GraphTeamsMessage
  ): Promise<{ id: string }> {
    const span = this.tracer.startSpan('graph_send_teams_message')
    
    try {
      const response = await this.client
        .api(`/teams/${teamId}/channels/${channelId}/messages`)
        .post({
          body: {
            contentType: message.contentType || 'html',
            content: message.content,
          },
        })

      span.setAttributes({
        'graph.team_id': teamId,
        'graph.channel_id': channelId,
        'graph.message_id': response.id,
      })

      return { id: response.id }
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError('sendTeamsMessage', error)
    } finally {
      span.end()
    }
  }

  /**
   * Create Planner task
   */
  async createPlannerTask(
    planId: string,
    task: GraphPlannerTask
  ): Promise<{ id: string; title: string }> {
    const span = this.tracer.startSpan('graph_create_planner_task')
    
    try {
      const response = await this.client
        .api('/planner/tasks')
        .post({
          planId,
          title: task.title,
          dueDateTime: task.dueDateTime,
          details: {
            description: task.description,
          },
        })

      span.setAttributes({
        'graph.plan_id': planId,
        'graph.task_id': response.id,
        'graph.task_title': task.title,
      })

      return {
        id: response.id,
        title: response.title,
      }
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError('createPlannerTask', error)
    } finally {
      span.end()
    }
  }

  /**
   * Get user messages with filtering
   */
  async getUserMessages(
    userId: string,
    filter?: string,
    top: number = 50
  ): Promise<GraphMessage[]> {
    const span = this.tracer.startSpan('graph_get_user_messages')
    
    try {
      let request = this.client
        .api(`/users/${userId}/messages`)
        .top(top)
        .orderBy('receivedDateTime DESC')

      if (filter) {
        request = request.filter(filter)
      }

      const response = await request.get()

      span.setAttributes({
        'graph.user_id': userId,
        'graph.message_count': response.value.length,
        'graph.filter': filter || 'none',
      })

      return response.value
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError('getUserMessages', error)
    } finally {
      span.end()
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string): Promise<{
    id: string
    displayName: string
    mail: string
    userPrincipalName: string
  }> {
    const span = this.tracer.startSpan('graph_get_user_profile')
    
    try {
      const response = await this.client
        .api(`/users/${userId}`)
        .select('id,displayName,mail,userPrincipalName')
        .get()

      span.setAttributes({
        'graph.user_id': userId,
        'graph.display_name': response.displayName,
      })

      return {
        id: response.id,
        displayName: response.displayName,
        mail: response.mail,
        userPrincipalName: response.userPrincipalName,
      }
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError('getUserProfile', error)
    } finally {
      span.end()
    }
  }

  /**
   * Get team channels
   */
  async getTeamChannels(teamId: string): Promise<Array<{
    id: string
    displayName: string
    description?: string
  }>> {
    const span = this.tracer.startSpan('graph_get_team_channels')
    
    try {
      const response = await this.client
        .api(`/teams/${teamId}/channels`)
        .get()

      span.setAttributes({
        'graph.team_id': teamId,
        'graph.channel_count': response.value.length,
      })

      return response.value.map(channel => ({
        id: channel.id,
        displayName: channel.displayName,
        description: channel.description,
      }))
    } catch (error) {
      span.recordException(error as Error)
      throw this.handleGraphError('getTeamChannels', error)
    } finally {
      span.end()
    }
  }

  /**
   * Check service health
   */
  async checkHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unavailable'
    latency: number
    error?: string
  }> {
    const span = this.tracer.startSpan('graph_health_check')
    const startTime = Date.now()
    
    try {
      // Test with a simple API call
      await this.client.api('/me').get()
      
      const latency = Date.now() - startTime
      
      span.setAttributes({
        'graph.latency_ms': latency,
        'graph.status': 'healthy',
      })

      return {
        status: 'healthy',
        latency,
      }
    } catch (error) {
      const latency = Date.now() - startTime
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      
      span.recordException(error as Error)
      span.setAttributes({
        'graph.latency_ms': latency,
        'graph.status': 'unavailable',
        'graph.error': errorMessage,
      })

      return {
        status: 'unavailable',
        latency,
        error: errorMessage,
      }
    } finally {
      span.end()
    }
  }

  /**
   * Handle Graph API errors with retry logic
   */
  private handleGraphError(operation: string, error: unknown): Error {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    // Check for rate limiting
    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      logger.warn('Graph API rate limited', {
        operation,
        error: errorMessage,
      })
      
      // TODO: Implement exponential backoff
      return new Error(`Graph API rate limited: ${errorMessage}`)
    }

    // Check for authentication errors
    if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
      logger.error('Graph API authentication failed', {
        operation,
        error: errorMessage,
      })
      
      return new Error(`Graph API authentication failed: ${errorMessage}`)
    }

    // Check for permission errors
    if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
      logger.error('Graph API permission denied', {
        operation,
        error: errorMessage,
      })
      
      return new Error(`Graph API permission denied: ${errorMessage}`)
    }

    // Generic error
    logger.error('Graph API error', {
      operation,
      error: errorMessage,
    })
    
    return new Error(`Graph API error in ${operation}: ${errorMessage}`)
  }
}

// Factory function to create Graph client
export function createGraphClient(config?: Partial<GraphConfig>): GraphClient {
  const envConfig = env()
  
  const graphConfig: GraphConfig = {
    tenantId: config?.tenantId || envConfig.AZURE_TENANT_ID || '',
    clientId: config?.clientId || envConfig.AZURE_CLIENT_ID || '',
    clientSecret: config?.clientSecret || envConfig.AZURE_CLIENT_SECRET || '',
    defaultTeamId: config?.defaultTeamId || envConfig.GRAPH_DEFAULT_TEAM_ID,
    defaultChannelId: config?.defaultChannelId || envConfig.GRAPH_DEFAULT_CHANNEL_ID,
  }

  if (!graphConfig.tenantId || !graphConfig.clientId || !graphConfig.clientSecret) {
    throw new Error('Microsoft Graph credentials not configured')
  }

  return new GraphClient(graphConfig)
}
