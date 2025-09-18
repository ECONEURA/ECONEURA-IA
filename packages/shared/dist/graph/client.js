import { Client } from '@microsoft/microsoft-graph-client';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';
import { ClientSecretCredential } from '@azure/identity';
import { tracer as otelTracer, meter as otelMeter } from '../otel/index.js';
import { logger } from '../logging/index.js';
import { env } from '../env.js';
export class GraphClient {
    client;
    msalApp;
    credential;
    tracer = (otelTracer && typeof otelTracer.getTracer === 'function')
        ? otelTracer.getTracer('graph-client')
        : otelTracer;
    meter = (otelMeter && typeof otelMeter.getMeter === 'function')
        ? otelMeter.getMeter('graph-client')
        : otelMeter;
    config;
    constructor(config) {
        this.config = config;
        this.msalApp = new ConfidentialClientApplication({
            auth: {
                clientId: config.clientId,
                clientSecret: config.clientSecret,
                authority: `https://login.microsoftonline.com/${config.tenantId}`,
            },
        });
        this.credential = new ClientSecretCredential(config.tenantId, config.clientId, config.clientSecret);
        const authProvider = new TokenCredentialAuthenticationProvider(this.credential, {
            scopes: [
                'https://graph.microsoft.com/.default',
                'Mail.ReadWrite',
                'Teamwork.Migrate.All',
                'Sites.Selected',
            ],
        });
        this.client = Client.initWithMiddleware({
            authProvider,
            defaultVersion: 'v1.0',
        });
    }
    async createDraftMessage(userId, draft) {
        const span = this.tracer.startSpan('graph_create_draft_message');
        try {
            const response = await this.client
                .api(`/users/${userId}/messages`)
                .post({
                ...draft,
                isDraft: true,
            });
            span.setAttributes({
                'graph.user_id': userId,
                'graph.message_id': response.id,
                'graph.subject': draft.subject,
            });
            return {
                id: response.id,
                webLink: response.webLink,
            };
        }
        catch (error) {
            span.recordException(error);
            throw this.handleGraphError('createDraftMessage', error);
        }
        finally {
            span.end();
        }
    }
    async sendTeamsMessage(teamId, channelId, message) {
        const span = this.tracer.startSpan('graph_send_teams_message');
        try {
            const response = await this.client
                .api(`/teams/${teamId}/channels/${channelId}/messages`)
                .post({
                body: {
                    contentType: message.contentType || 'html',
                    content: message.content,
                },
            });
            span.setAttributes({
                'graph.team_id': teamId,
                'graph.channel_id': channelId,
                'graph.message_id': response.id,
            });
            return { id: response.id };
        }
        catch (error) {
            span.recordException(error);
            throw this.handleGraphError('sendTeamsMessage', error);
        }
        finally {
            span.end();
        }
    }
    async createPlannerTask(planId, task) {
        const span = this.tracer.startSpan('graph_create_planner_task');
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
            });
            span.setAttributes({
                'graph.plan_id': planId,
                'graph.task_id': response.id,
                'graph.task_title': task.title,
            });
            return {
                id: response.id,
                title: response.title,
            };
        }
        catch (error) {
            span.recordException(error);
            throw this.handleGraphError('createPlannerTask', error);
        }
        finally {
            span.end();
        }
    }
    async getUserMessages(userId, filter, top = 50) {
        const span = this.tracer.startSpan('graph_get_user_messages');
        try {
            let request = this.client
                .api(`/users/${userId}/messages`)
                .top(top)
                .orderBy('receivedDateTime DESC');
            if (filter) {
                request = request.filter(filter);
            }
            const response = await request.get();
            span.setAttributes({
                'graph.user_id': userId,
                'graph.message_count': response.value.length,
                'graph.filter': filter || 'none',
            });
            return response.value;
        }
        catch (error) {
            span.recordException(error);
            throw this.handleGraphError('getUserMessages', error);
        }
        finally {
            span.end();
        }
    }
    async getUserProfile(userId) {
        const span = this.tracer.startSpan('graph_get_user_profile');
        try {
            const response = await this.client
                .api(`/users/${userId}`)
                .select('id,displayName,mail,userPrincipalName')
                .get();
            span.setAttributes({
                'graph.user_id': userId,
                'graph.display_name': response.displayName,
            });
            return {
                id: response.id,
                displayName: response.displayName,
                mail: response.mail,
                userPrincipalName: response.userPrincipalName,
            };
        }
        catch (error) {
            span.recordException(error);
            throw this.handleGraphError('getUserProfile', error);
        }
        finally {
            span.end();
        }
    }
    async getTeamChannels(teamId) {
        const span = this.tracer.startSpan('graph_get_team_channels');
        try {
            const response = await this.client
                .api(`/teams/${teamId}/channels`)
                .get();
            span.setAttributes({
                'graph.team_id': teamId,
                'graph.channel_count': response.value.length,
            });
            return response.value.map((channel) => ({
                id: channel.id,
                displayName: channel.displayName,
                description: channel.description,
            }));
        }
        catch (error) {
            span.recordException(error);
            throw this.handleGraphError('getTeamChannels', error);
        }
        finally {
            span.end();
        }
    }
    async checkHealth() {
        const span = this.tracer.startSpan('graph_health_check');
        const startTime = Date.now();
        try {
            await this.client.api('/me').get();
            const latency = Date.now() - startTime;
            span.setAttributes({
                'graph.latency_ms': latency,
                'graph.status': 'healthy',
            });
            return {
                status: 'healthy',
                latency,
            };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            span.recordException(error);
            span.setAttributes({
                'graph.latency_ms': latency,
                'graph.status': 'unavailable',
                'graph.error': errorMessage,
            });
            return {
                status: 'unavailable',
                latency,
                error: errorMessage,
            };
        }
        finally {
            span.end();
        }
    }
    handleGraphError(operation, error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
            logger.warn('Graph API rate limited', {
                error: errorMessage,
            });
            return new Error(`Graph API rate limited: ${errorMessage}`);
        }
        if (errorMessage.includes('401') || errorMessage.includes('Unauthorized')) {
            logger.error('Graph API authentication failed', new Error(errorMessage), {});
            return new Error(`Graph API authentication failed: ${errorMessage}`);
        }
        if (errorMessage.includes('403') || errorMessage.includes('Forbidden')) {
            logger.error('Graph API permission denied', new Error(errorMessage), {});
            return new Error(`Graph API permission denied: ${errorMessage}`);
        }
        logger.error('Graph API error', new Error(errorMessage), {});
        return new Error(`Graph API error in ${operation}: ${errorMessage}`);
    }
}
export function createGraphClient(config) {
    const envConfig = env();
    const graphConfig = {
        tenantId: config?.tenantId || envConfig.AZURE_TENANT_ID || '',
        clientId: config?.clientId || envConfig.AZURE_CLIENT_ID || '',
        clientSecret: config?.clientSecret || envConfig.AZURE_CLIENT_SECRET || '',
        defaultTeamId: config?.defaultTeamId || envConfig.GRAPH_DEFAULT_TEAM_ID,
        defaultChannelId: config?.defaultChannelId || envConfig.GRAPH_DEFAULT_CHANNEL_ID,
    };
    if (!graphConfig.tenantId || !graphConfig.clientId || !graphConfig.clientSecret) {
        throw new Error('Microsoft Graph credentials not configured');
    }
    return new GraphClient(graphConfig);
}
//# sourceMappingURL=client.js.map