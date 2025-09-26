import { EventEmitter } from "events";

import { z } from "zod";
import { WebSocket, WebSocketServer } from "ws";

import { logger } from './logger.js';
export const CollaborationRoomSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    type: z.enum(["document", "chat", "meeting", "workspace"]),
    ownerId: z.string(),
    participants: z.array(z.string()),
    settings: z.object({
        maxParticipants: z.number().default(50),
        allowAnonymous: z.boolean().default(false),
        requireApproval: z.boolean().default(false),
        enableChat: z.boolean().default(true),
        enableScreenShare: z.boolean().default(false),
        enableRecording: z.boolean().default(false),
    }),
    metadata: z.record(z.any()).optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
});
export const CollaborationMessageSchema = z.object({
    id: z.string(),
    roomId: z.string(),
    senderId: z.string(),
    senderName: z.string(),
    type: z.enum(["text", "file", "system", "presence", "document_change"]),
    content: z.string(),
    metadata: z.record(z.any()).optional(),
    timestamp: z.date(),
});
export const DocumentChangeSchema = z.object({
    id: z.string(),
    roomId: z.string(),
    userId: z.string(),
    userName: z.string(),
    operation: z.enum(["insert", "delete", "update", "format"]),
    position: z.number(),
    content: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    timestamp: z.date(),
    version: z.number(),
});
export const UserPresenceSchema = z.object({
    userId: z.string(),
    userName: z.string(),
    status: z.enum(["online", "away", "busy", "offline"]),
    lastSeen: z.date(),
    roomId: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});
export const CollaborationSessionSchema = z.object({
    id: z.string(),
    roomId: z.string(),
    userId: z.string(),
    userName: z.string(),
    joinedAt: z.date(),
    leftAt: z.date().optional(),
    duration: z.number().optional(),
    activities: z.array(z.string()).default([]),
});
export const CollaborationAnalyticsSchema = z.object({
    totalRooms: z.number(),
    activeRooms: z.number(),
    totalUsers: z.number(),
    activeUsers: z.number(),
    totalMessages: z.number(),
    totalDocumentChanges: z.number(),
    averageSessionDuration: z.number(),
    topCollaborators: z.array(z.object({
        userId: z.string(),
        userName: z.string(),
        sessions: z.number(),
        messages: z.number(),
        changes: z.number(),
    })),
    roomTypes: z.record(z.number()),
    messageTypes: z.record(z.number()),
});
export class RealTimeCollaborationSystem extends EventEmitter {
    wss = null;
    rooms = new Map();
    connections = new Map();
    userRooms = new Map();
    roomConnections = new Map();
    messages = new Map();
    documentChanges = new Map();
    userPresence = new Map();
    sessions = new Map();
    analytics;
    constructor() {
        super();
        this.analytics = {
            totalRooms: 0,
            activeRooms: 0,
            totalUsers: 0,
            activeUsers: 0,
            totalMessages: 0,
            totalDocumentChanges: 0,
            averageSessionDuration: 0,
            topCollaborators: [],
            roomTypes: {},
            messageTypes: {},
        };
        this.initializeSampleData();
        logger.info("Real-time Collaboration System initialized", {
            collaboration: "real-time",
            features: ["websockets", "documents", "chat", "presence", "analytics"],
            roomsCount: this.rooms.size,
            connections: this.connections.size
        });
    }
    initializeWebSocketServer(server) {
        this.wss = new WebSocketServer({ server });
        this.wss.on('connection', (ws, request) => {
            this.handleConnection(ws, request);
        });
        logger.info("WebSocket server initialized", {
            port: server.address()?.port,
            connections: this.connections.size
        });
    }
    handleConnection(ws, request) {
        const connectionId = this.generateConnectionId();
        this.connections.set(connectionId, ws);
        logger.info("New WebSocket connection established", {
            connectionId,
            remoteAddress: request.socket.remoteAddress
        });
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(connectionId, message);
            }
            catch (error) {
                logger.error("Failed to parse WebSocket message", {
                    connectionId,
                    error: error.message
                });
            }
        });
        ws.on('close', () => {
            this.handleDisconnection(connectionId);
        });
        ws.on('error', (error) => {
            logger.error("WebSocket connection error", {
                connectionId,
                error: error.message
            });
            this.handleDisconnection(connectionId);
        });
        this.sendToConnection(connectionId, {
            type: 'welcome',
            connectionId,
            timestamp: new Date(),
            message: 'Connected to real-time collaboration system'
        });
    }
    handleDisconnection(connectionId) {
        const userId = this.getUserIdFromConnection(connectionId);
        if (userId) {
            this.updateUserPresence(userId, 'offline');
            this.leaveAllRooms(userId);
        }
        this.connections.delete(connectionId);
        logger.info("WebSocket connection closed", { connectionId, userId: userId || undefined });
    }
    handleMessage(connectionId, message) {
        const { type, data } = message;
        switch (type) {
            case 'join_room':
                this.handleJoinRoom(connectionId, data);
                break;
            case 'leave_room':
                this.handleLeaveRoom(connectionId, data);
                break;
            case 'send_message':
                this.handleSendMessage(connectionId, data);
                break;
            case 'document_change':
                this.handleDocumentChange(connectionId, data);
                break;
            case 'update_presence':
                this.handleUpdatePresence(connectionId, data);
                break;
            case 'get_room_info':
                this.handleGetRoomInfo(connectionId, data);
                break;
            case 'get_participants':
                this.handleGetParticipants(connectionId, data);
                break;
            case 'get_messages':
                this.handleGetMessages(connectionId, data);
                break;
            case 'get_document_changes':
                this.handleGetDocumentChanges(connectionId, data);
                break;
            default:
                logger.warn("Unknown message type", { connectionId, type });
        }
    }
    handleJoinRoom(connectionId, data) {
        const { roomId, userId, userName } = data;
        if (!this.rooms.has(roomId)) {
            this.sendToConnection(connectionId, {
                type: 'error',
                message: 'Room not found',
                roomId
            });
            return;
        }
        const room = this.rooms.get(roomId);
        if (room.participants.length >= room.settings.maxParticipants) {
            this.sendToConnection(connectionId, {
                type: 'error',
                message: 'Room is full',
                roomId
            });
            return;
        }
        this.addUserToRoom(userId, roomId);
        this.updateUserPresence(userId, 'online', roomId);
        this.startSession(userId, roomId, userName);
        this.broadcastToRoom(roomId, {
            type: 'user_joined',
            userId,
            userName,
            timestamp: new Date()
        }, userId);
        this.sendToConnection(connectionId, {
            type: 'room_joined',
            roomId,
            room: room,
            participants: this.getRoomParticipants(roomId),
            messages: this.getRecentMessages(roomId, 50),
            documentChanges: this.getRecentDocumentChanges(roomId, 100)
        });
        logger.info("User joined room", { userId, userName, roomId });
    }
    handleLeaveRoom(connectionId, data) {
        const { roomId, userId, userName } = data;
        this.removeUserFromRoom(userId, roomId);
        this.endSession(userId, roomId);
        this.broadcastToRoom(roomId, {
            type: 'user_left',
            userId,
            userName,
            timestamp: new Date()
        }, userId);
        logger.info("User left room", { userId, userName, roomId });
    }
    handleSendMessage(connectionId, data) {
        const { roomId, userId, userName, content, messageType = 'text' } = data;
        if (!this.rooms.has(roomId)) {
            this.sendToConnection(connectionId, {
                type: 'error',
                message: 'Room not found',
                roomId
            });
            return;
        }
        const allowed = ['text', 'file', 'system', 'presence', 'document_change'];
        const msgType = allowed.includes(messageType) ? messageType : 'text';
        const message = {
            id: this.generateMessageId(),
            roomId,
            senderId: userId,
            senderName: userName,
            type: msgType,
            content,
            timestamp: new Date()
        };
        if (!this.messages.has(roomId)) {
            this.messages.set(roomId, []);
        }
        this.messages.get(roomId).push(message);
        this.broadcastToRoom(roomId, {
            type: 'new_message',
            message
        });
        this.updateMessageAnalytics(messageType);
        logger.info("Message sent", { userId, roomId, messageType });
    }
    handleDocumentChange(connectionId, data) {
        const { roomId, userId, userName, operation, position, content, version } = data;
        if (!this.rooms.has(roomId)) {
            this.sendToConnection(connectionId, {
                type: 'error',
                message: 'Room not found',
                roomId
            });
            return;
        }
        const change = {
            id: this.generateChangeId(),
            roomId,
            userId,
            userName,
            operation,
            position,
            content,
            version,
            timestamp: new Date()
        };
        if (!this.documentChanges.has(roomId)) {
            this.documentChanges.set(roomId, []);
        }
        this.documentChanges.get(roomId).push(change);
        this.broadcastToRoom(roomId, {
            type: 'document_change',
            change
        }, userId);
        this.updateDocumentChangeAnalytics();
        logger.info("Document change applied", { userId, roomId, operation, version });
    }
    handleUpdatePresence(connectionId, data) {
        const { userId, userName, status, roomId } = data;
        this.updateUserPresence(userId, status, roomId);
        if (roomId) {
            this.broadcastToRoom(roomId, {
                type: 'presence_update',
                userId,
                userName,
                status,
                timestamp: new Date()
            }, userId);
        }
        logger.info("User presence updated", { userId, status, roomId });
    }
    handleGetRoomInfo(connectionId, data) {
        const { roomId } = data;
        if (!this.rooms.has(roomId)) {
            this.sendToConnection(connectionId, {
                type: 'error',
                message: 'Room not found',
                roomId
            });
            return;
        }
        const room = this.rooms.get(roomId);
        this.sendToConnection(connectionId, {
            type: 'room_info',
            room
        });
    }
    handleGetParticipants(connectionId, data) {
        const { roomId } = data;
        const participants = this.getRoomParticipants(roomId);
        this.sendToConnection(connectionId, {
            type: 'participants',
            roomId,
            participants
        });
    }
    handleGetMessages(connectionId, data) {
        const { roomId, limit = 50 } = data;
        const messages = this.getRecentMessages(roomId, limit);
        this.sendToConnection(connectionId, {
            type: 'messages',
            roomId,
            messages
        });
    }
    handleGetDocumentChanges(connectionId, data) {
        const { roomId, limit = 100 } = data;
        const changes = this.getRecentDocumentChanges(roomId, limit);
        this.sendToConnection(connectionId, {
            type: 'document_changes',
            roomId,
            changes
        });
    }
    createRoom(roomData) {
        const room = {
            ...roomData,
            id: this.generateRoomId(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.rooms.set(room.id, room);
        this.messages.set(room.id, []);
        this.documentChanges.set(room.id, []);
        this.roomConnections.set(room.id, new Set());
        this.sessions.set(room.id, []);
        this.analytics.totalRooms++;
        this.analytics.activeRooms++;
        this.updateRoomTypeAnalytics(room.type);
        logger.info("Room created", {
            roomId: room.id,
            name: room.name,
            type: room.type,
            ownerId: room.ownerId
        });
        return room;
    }
    getRoom(roomId) {
        return this.rooms.get(roomId) || null;
    }
    updateRoom(roomId, updates) {
        const room = this.rooms.get(roomId);
        if (!room)
            return null;
        const updatedRoom = {
            ...room,
            ...updates,
            updatedAt: new Date()
        };
        this.rooms.set(roomId, updatedRoom);
        this.broadcastToRoom(roomId, {
            type: 'room_updated',
            room: updatedRoom
        });
        logger.info("Room updated", { roomId, updates: Object.keys(updates) });
        return updatedRoom;
    }
    deleteRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return false;
        this.broadcastToRoom(roomId, {
            type: 'room_deleted',
            roomId
        });
        this.rooms.delete(roomId);
        this.messages.delete(roomId);
        this.documentChanges.delete(roomId);
        this.roomConnections.delete(roomId);
        this.sessions.delete(roomId);
        this.analytics.activeRooms--;
        logger.info("Room deleted", { roomId });
        return true;
    }
    listRooms(userId) {
        if (userId) {
            const userRoomIds = this.userRooms.get(userId) || new Set();
            return Array.from(userRoomIds)
                .map(roomId => this.rooms.get(roomId))
                .filter(Boolean);
        }
        return Array.from(this.rooms.values());
    }
    addUserToRoom(userId, roomId) {
        if (!this.userRooms.has(userId)) {
            this.userRooms.set(userId, new Set());
        }
        this.userRooms.get(userId).add(roomId);
        const roomConnections = this.roomConnections.get(roomId) || new Set();
        roomConnections.add(userId);
        this.roomConnections.set(roomId, roomConnections);
        const room = this.rooms.get(roomId);
        if (room && !room.participants.includes(userId)) {
            room.participants.push(userId);
            room.updatedAt = new Date();
        }
    }
    removeUserFromRoom(userId, roomId) {
        const userRooms = this.userRooms.get(userId);
        if (userRooms) {
            userRooms.delete(roomId);
        }
        const roomConnections = this.roomConnections.get(roomId);
        if (roomConnections) {
            roomConnections.delete(userId);
        }
        const room = this.rooms.get(roomId);
        if (room) {
            room.participants = room.participants.filter(id => id !== userId);
            room.updatedAt = new Date();
        }
    }
    leaveAllRooms(userId) {
        const userRooms = this.userRooms.get(userId);
        if (userRooms) {
            for (const roomId of userRooms) {
                this.removeUserFromRoom(userId, roomId);
            }
        }
    }
    getRoomParticipants(roomId) {
        const room = this.rooms.get(roomId);
        if (!room)
            return [];
        return room.participants
            .map(userId => this.userPresence.get(userId))
            .filter(Boolean);
    }
    updateUserPresence(userId, status, roomId) {
        const existing = this.userPresence.get(userId);
        const presence = {
            userId,
            userName: existing?.userName || `User-${userId}`,
            status,
            lastSeen: new Date(),
            roomId,
            metadata: existing?.metadata || {}
        };
        this.userPresence.set(userId, presence);
        if (status === 'online') {
            this.analytics.activeUsers++;
        }
        else if (status === 'offline') {
            this.analytics.activeUsers = Math.max(0, this.analytics.activeUsers - 1);
        }
    }
    getUserPresence(userId) {
        return this.userPresence.get(userId) || null;
    }
    startSession(userId, roomId, userName) {
        const session = {
            id: this.generateSessionId(),
            roomId,
            userId,
            userName,
            joinedAt: new Date(),
            activities: []
        };
        if (!this.sessions.has(roomId)) {
            this.sessions.set(roomId, []);
        }
        this.sessions.get(roomId).push(session);
    }
    endSession(userId, roomId) {
        const roomSessions = this.sessions.get(roomId);
        if (!roomSessions)
            return;
        const session = roomSessions.find(s => s.userId === userId && !s.leftAt);
        if (session) {
            session.leftAt = new Date();
            session.duration = session.leftAt.getTime() - session.joinedAt.getTime();
        }
    }
    getRecentMessages(roomId, limit) {
        const messages = this.messages.get(roomId) || [];
        return messages.slice(-limit);
    }
    getRecentDocumentChanges(roomId, limit) {
        const changes = this.documentChanges.get(roomId) || [];
        return changes.slice(-limit);
    }
    updateMessageAnalytics(messageType) {
        this.analytics.totalMessages++;
        this.analytics.messageTypes[messageType] = (this.analytics.messageTypes[messageType] || 0) + 1;
    }
    updateDocumentChangeAnalytics() {
        this.analytics.totalDocumentChanges++;
    }
    updateRoomTypeAnalytics(roomType) {
        this.analytics.roomTypes[roomType] = (this.analytics.roomTypes[roomType] || 0) + 1;
    }
    sendToConnection(connectionId, message) {
        const ws = this.connections.get(connectionId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    broadcastToRoom(roomId, message, excludeUserId) {
        const roomConnections = this.roomConnections.get(roomId);
        if (!roomConnections)
            return;
        for (const userId of roomConnections) {
            if (userId === excludeUserId)
                continue;
            const connectionId = this.getConnectionIdFromUser(userId);
            if (connectionId) {
                this.sendToConnection(connectionId, message);
            }
        }
    }
    getUserIdFromConnection(connectionId) {
        return null;
    }
    getConnectionIdFromUser(userId) {
        return null;
    }
    getCollaborationAnalytics() {
        return { ...this.analytics };
    }
    generateRoomId() {
        return `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generateConnectionId() {
        return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generateMessageId() {
        return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generateChangeId() {
        return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSessionId() {
        return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
    initializeSampleData() {
        this.createRoom({
            name: "Project Alpha - Development",
            description: "Main development room for Project Alpha",
            type: "workspace",
            ownerId: "user-1",
            participants: ["user-1", "user-2", "user-3"],
            settings: {
                maxParticipants: 20,
                allowAnonymous: false,
                requireApproval: true,
                enableChat: true,
                enableScreenShare: true,
                enableRecording: false,
            }
        });
        this.createRoom({
            name: "Design Review Meeting",
            description: "Weekly design review session",
            type: "meeting",
            ownerId: "user-2",
            participants: ["user-2", "user-4", "user-5"],
            settings: {
                maxParticipants: 10,
                allowAnonymous: false,
                requireApproval: false,
                enableChat: true,
                enableScreenShare: true,
                enableRecording: true,
            }
        });
        this.createRoom({
            name: "Documentation Collaboration",
            description: "Real-time documentation editing",
            type: "document",
            ownerId: "user-3",
            participants: ["user-3", "user-1"],
            settings: {
                maxParticipants: 15,
                allowAnonymous: false,
                requireApproval: false,
                enableChat: true,
                enableScreenShare: false,
                enableRecording: false,
            }
        });
        this.updateUserPresence("user-1", "online");
        this.updateUserPresence("user-2", "away");
        this.updateUserPresence("user-3", "online");
        this.updateUserPresence("user-4", "busy");
        this.updateUserPresence("user-5", "offline");
        logger.info("Sample data initialized for real-time collaboration system", {
            roomsCount: this.rooms.size,
            usersCount: this.userPresence.size
        });
    }
}
export const realTimeCollaborationSystem = new RealTimeCollaborationSystem();
//# sourceMappingURL=real-time-collaboration.js.map