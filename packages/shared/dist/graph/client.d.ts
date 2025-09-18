export interface GraphConfig {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    defaultTeamId?: string;
    defaultChannelId?: string;
}
export interface GraphMessage {
    id: string;
    subject: string;
    body: {
        contentType: string;
        content: string;
    };
    toRecipients: Array<{
        emailAddress: {
            address: string;
        };
    }>;
    from?: {
        emailAddress: {
            address: string;
        };
    };
    createdDateTime: string;
    receivedDateTime: string;
}
export interface GraphDraftMessage {
    subject: string;
    body: {
        contentType: string;
        content: string;
    };
    toRecipients: Array<{
        emailAddress: {
            address: string;
        };
    }>;
    saveToSentItems?: boolean;
}
export interface GraphTeamsMessage {
    content: string;
    contentType?: 'html' | 'text';
}
export interface GraphPlannerTask {
    title: string;
    dueDateTime?: string;
    assignedTo?: string;
    description?: string;
}
export declare class GraphClient {
    private client;
    private msalApp;
    private credential;
    private tracer;
    private meter;
    private config;
    constructor(config: GraphConfig);
    createDraftMessage(userId: string, draft: GraphDraftMessage): Promise<{
        id: string;
        webLink: string;
    }>;
    sendTeamsMessage(teamId: string, channelId: string, message: GraphTeamsMessage): Promise<{
        id: string;
    }>;
    createPlannerTask(planId: string, task: GraphPlannerTask): Promise<{
        id: string;
        title: string;
    }>;
    getUserMessages(userId: string, filter?: string, top?: number): Promise<GraphMessage[]>;
    getUserProfile(userId: string): Promise<{
        id: string;
        displayName: string;
        mail: string;
        userPrincipalName: string;
    }>;
    getTeamChannels(teamId: string): Promise<Array<{
        id: string;
        displayName: string;
        description?: string;
    }>>;
    checkHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unavailable';
        latency: number;
        error?: string;
    }>;
    private handleGraphError;
}
export declare function createGraphClient(config?: Partial<GraphConfig>): GraphClient;
//# sourceMappingURL=client.d.ts.map