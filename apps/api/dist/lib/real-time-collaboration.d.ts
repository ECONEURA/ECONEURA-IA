import { z } from "zod";
import { EventEmitter } from "events";
export declare const CollaborationRoomSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    type: z.ZodEnum<["document", "chat", "meeting", "workspace"]>;
    ownerId: z.ZodString;
    participants: z.ZodArray<z.ZodString, "many">;
    settings: z.ZodObject<{
        maxParticipants: z.ZodDefault<z.ZodNumber>;
        allowAnonymous: z.ZodDefault<z.ZodBoolean>;
        requireApproval: z.ZodDefault<z.ZodBoolean>;
        enableChat: z.ZodDefault<z.ZodBoolean>;
        enableScreenShare: z.ZodDefault<z.ZodBoolean>;
        enableRecording: z.ZodDefault<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        maxParticipants?: number;
        allowAnonymous?: boolean;
        requireApproval?: boolean;
        enableChat?: boolean;
        enableScreenShare?: boolean;
        enableRecording?: boolean;
    }, {
        maxParticipants?: number;
        allowAnonymous?: boolean;
        requireApproval?: boolean;
        enableChat?: boolean;
        enableScreenShare?: boolean;
        enableRecording?: boolean;
    }>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "chat" | "meeting" | "document" | "workspace";
    name?: string;
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    settings?: {
        maxParticipants?: number;
        allowAnonymous?: boolean;
        requireApproval?: boolean;
        enableChat?: boolean;
        enableScreenShare?: boolean;
        enableRecording?: boolean;
    };
    participants?: string[];
    ownerId?: string;
}, {
    type?: "chat" | "meeting" | "document" | "workspace";
    name?: string;
    metadata?: Record<string, any>;
    id?: string;
    createdAt?: Date;
    updatedAt?: Date;
    description?: string;
    settings?: {
        maxParticipants?: number;
        allowAnonymous?: boolean;
        requireApproval?: boolean;
        enableChat?: boolean;
        enableScreenShare?: boolean;
        enableRecording?: boolean;
    };
    participants?: string[];
    ownerId?: string;
}>;
export declare const CollaborationMessageSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    senderId: z.ZodString;
    senderName: z.ZodString;
    type: z.ZodEnum<["text", "file", "system", "presence", "document_change"]>;
    content: z.ZodString;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timestamp: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    type?: "system" | "text" | "file" | "presence" | "document_change";
    timestamp?: Date;
    metadata?: Record<string, any>;
    id?: string;
    content?: string;
    roomId?: string;
    senderId?: string;
    senderName?: string;
}, {
    type?: "system" | "text" | "file" | "presence" | "document_change";
    timestamp?: Date;
    metadata?: Record<string, any>;
    id?: string;
    content?: string;
    roomId?: string;
    senderId?: string;
    senderName?: string;
}>;
export declare const DocumentChangeSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    userId: z.ZodString;
    userName: z.ZodString;
    operation: z.ZodEnum<["insert", "delete", "update", "format"]>;
    position: z.ZodNumber;
    content: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timestamp: z.ZodDate;
    version: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    operation?: "insert" | "update" | "delete" | "format";
    timestamp?: Date;
    version?: number;
    metadata?: Record<string, any>;
    id?: string;
    content?: string;
    position?: number;
    userName?: string;
    roomId?: string;
}, {
    userId?: string;
    operation?: "insert" | "update" | "delete" | "format";
    timestamp?: Date;
    version?: number;
    metadata?: Record<string, any>;
    id?: string;
    content?: string;
    position?: number;
    userName?: string;
    roomId?: string;
}>;
export declare const UserPresenceSchema: z.ZodObject<{
    userId: z.ZodString;
    userName: z.ZodString;
    status: z.ZodEnum<["online", "away", "busy", "offline"]>;
    lastSeen: z.ZodDate;
    roomId: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    status?: "online" | "offline" | "away" | "busy";
    userId?: string;
    metadata?: Record<string, any>;
    lastSeen?: Date;
    userName?: string;
    roomId?: string;
}, {
    status?: "online" | "offline" | "away" | "busy";
    userId?: string;
    metadata?: Record<string, any>;
    lastSeen?: Date;
    userName?: string;
    roomId?: string;
}>;
export declare const CollaborationSessionSchema: z.ZodObject<{
    id: z.ZodString;
    roomId: z.ZodString;
    userId: z.ZodString;
    userName: z.ZodString;
    joinedAt: z.ZodDate;
    leftAt: z.ZodOptional<z.ZodDate>;
    duration: z.ZodOptional<z.ZodNumber>;
    activities: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    userId?: string;
    duration?: number;
    id?: string;
    activities?: string[];
    userName?: string;
    roomId?: string;
    joinedAt?: Date;
    leftAt?: Date;
}, {
    userId?: string;
    duration?: number;
    id?: string;
    activities?: string[];
    userName?: string;
    roomId?: string;
    joinedAt?: Date;
    leftAt?: Date;
}>;
export declare const CollaborationAnalyticsSchema: z.ZodObject<{
    totalRooms: z.ZodNumber;
    activeRooms: z.ZodNumber;
    totalUsers: z.ZodNumber;
    activeUsers: z.ZodNumber;
    totalMessages: z.ZodNumber;
    totalDocumentChanges: z.ZodNumber;
    averageSessionDuration: z.ZodNumber;
    topCollaborators: z.ZodArray<z.ZodObject<{
        userId: z.ZodString;
        userName: z.ZodString;
        sessions: z.ZodNumber;
        messages: z.ZodNumber;
        changes: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        userId?: string;
        changes?: number;
        messages?: number;
        sessions?: number;
        userName?: string;
    }, {
        userId?: string;
        changes?: number;
        messages?: number;
        sessions?: number;
        userName?: string;
    }>, "many">;
    roomTypes: z.ZodRecord<z.ZodString, z.ZodNumber>;
    messageTypes: z.ZodRecord<z.ZodString, z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    totalUsers?: number;
    totalMessages?: number;
    activeUsers?: number;
    averageSessionDuration?: number;
    totalRooms?: number;
    activeRooms?: number;
    totalDocumentChanges?: number;
    topCollaborators?: {
        userId?: string;
        changes?: number;
        messages?: number;
        sessions?: number;
        userName?: string;
    }[];
    roomTypes?: Record<string, number>;
    messageTypes?: Record<string, number>;
}, {
    totalUsers?: number;
    totalMessages?: number;
    activeUsers?: number;
    averageSessionDuration?: number;
    totalRooms?: number;
    activeRooms?: number;
    totalDocumentChanges?: number;
    topCollaborators?: {
        userId?: string;
        changes?: number;
        messages?: number;
        sessions?: number;
        userName?: string;
    }[];
    roomTypes?: Record<string, number>;
    messageTypes?: Record<string, number>;
}>;
export declare class RealTimeCollaborationSystem extends EventEmitter {
    private wss;
    private rooms;
    private connections;
    private userRooms;
    private roomConnections;
    private messages;
    private documentChanges;
    private userPresence;
    private sessions;
    private analytics;
    constructor();
    initializeWebSocketServer(server: any): void;
    private handleConnection;
    private handleDisconnection;
    private handleMessage;
    private handleJoinRoom;
    private handleLeaveRoom;
    private handleSendMessage;
    private handleDocumentChange;
    private handleUpdatePresence;
    private handleGetRoomInfo;
    private handleGetParticipants;
    private handleGetMessages;
    private handleGetDocumentChanges;
    createRoom(roomData: Omit<z.infer<typeof CollaborationRoomSchema>, 'id' | 'createdAt' | 'updatedAt'>): z.infer<typeof CollaborationRoomSchema>;
    getRoom(roomId: string): z.infer<typeof CollaborationRoomSchema> | null;
    updateRoom(roomId: string, updates: Partial<z.infer<typeof CollaborationRoomSchema>>): z.infer<typeof CollaborationRoomSchema> | null;
    deleteRoom(roomId: string): boolean;
    listRooms(userId?: string): z.infer<typeof CollaborationRoomSchema>[];
    private addUserToRoom;
    private removeUserFromRoom;
    private leaveAllRooms;
    private getRoomParticipants;
    private updateUserPresence;
    getUserPresence(userId: string): z.infer<typeof UserPresenceSchema> | null;
    private startSession;
    private endSession;
    private getRecentMessages;
    private getRecentDocumentChanges;
    private updateMessageAnalytics;
    private updateDocumentChangeAnalytics;
    private updateRoomTypeAnalytics;
    private sendToConnection;
    private broadcastToRoom;
    private getUserIdFromConnection;
    private getConnectionIdFromUser;
    getCollaborationAnalytics(): z.infer<typeof CollaborationAnalyticsSchema>;
    private generateRoomId;
    private generateConnectionId;
    private generateMessageId;
    private generateChangeId;
    private generateSessionId;
    private initializeSampleData;
}
export declare const realTimeCollaborationSystem: RealTimeCollaborationSystem;
//# sourceMappingURL=real-time-collaboration.d.ts.map