import { EventEmitter } from 'events';
export interface GraphUser {
    id: string;
    displayName: string;
    mail: string;
    userPrincipalName: string;
    jobTitle?: string;
    department?: string;
    officeLocation?: string;
    businessPhones?: string[];
    mobilePhone?: string;
}
export interface GraphMessage {
    id: string;
    subject: string;
    body: {
        content: string;
        contentType: 'text' | 'html';
    };
    from: {
        emailAddress: {
            name: string;
            address: string;
        };
    };
    toRecipients: Array<{
        emailAddress: {
            name: string;
            address: string;
        };
    }>;
    receivedDateTime: string;
    isRead: boolean;
    hasAttachments: boolean;
}
export interface GraphCalendarEvent {
    id: string;
    subject: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    location?: {
        displayName: string;
    };
    attendees: Array<{
        emailAddress: {
            name: string;
            address: string;
        };
        type: 'required' | 'optional' | 'resource';
    }>;
    isOnlineMeeting: boolean;
    onlineMeetingProvider?: 'teamsForBusiness' | 'skypeForBusiness' | 'teamsForConsumer';
}
export interface GraphDriveItem {
    id: string;
    name: string;
    size: number;
    lastModifiedDateTime: string;
    webUrl: string;
    downloadUrl?: string;
    file?: {
        mimeType: string;
        hashes?: {
            sha1Hash?: string;
            sha256Hash?: string;
        };
    };
    folder?: {
        childCount: number;
    };
}
export interface GraphTeam {
    id: string;
    displayName: string;
    description?: string;
    createdDateTime: string;
    webUrl: string;
    members: Array<{
        id: string;
        displayName: string;
        roles: string[];
    }>;
}
export interface GraphChannel {
    id: string;
    displayName: string;
    description?: string;
    membershipType: 'standard' | 'private' | 'shared';
    webUrl: string;
    messages: Array<{
        id: string;
        body: {
            content: string;
            contentType: 'text' | 'html';
        };
        from: {
            user: {
                displayName: string;
                id: string;
            };
        };
        createdDateTime: string;
    }>;
}
export interface GraphOutboxMessage {
    id: string;
    subject: string;
    body: string;
    toRecipients: string[];
    ccRecipients?: string[];
    bccRecipients?: string[];
    importance: 'low' | 'normal' | 'high';
    isDraft: boolean;
    scheduledDateTime?: string;
    createdAt: string;
    status: 'pending' | 'sent' | 'failed' | 'cancelled';
}
export declare class GraphWrappersService extends EventEmitter {
    private outbox;
    private readonly DEMO_MODE;
    private readonly CACHE_TTL;
    constructor();
    private initializeDemoData;
    getUsers(organizationId: string): Promise<GraphUser[]>;
    getUser(userId: string, organizationId: string): Promise<GraphUser | null>;
    getMessages(organizationId: string, userId: string, limit?: number): Promise<GraphMessage[]>;
    getCalendarEvents(organizationId: string, userId: string, startDate?: string, endDate?: string): Promise<GraphCalendarEvent[]>;
    getDriveItems(organizationId: string, userId: string, folderId?: string): Promise<GraphDriveItem[]>;
    getTeams(organizationId: string): Promise<GraphTeam[]>;
    getTeamChannels(teamId: string, organizationId: string): Promise<GraphChannel[]>;
    addToOutbox(message: Omit<GraphOutboxMessage, 'id' | 'createdAt' | 'status'>): Promise<GraphOutboxMessage>;
    getOutboxMessages(organizationId: string, status?: GraphOutboxMessage['status']): Promise<GraphOutboxMessage[]>;
    sendOutboxMessage(messageId: string): Promise<boolean>;
    cancelOutboxMessage(messageId: string): Promise<boolean>;
    getHealth(): Promise<{
        status: 'ok' | 'degraded' | 'error';
        mode: 'demo' | 'azure';
        outboxCount: number;
        cacheStats: any;
    }>;
}
export declare const graphWrappersService: GraphWrappersService;
//# sourceMappingURL=graph-wrappers.service.d.ts.map