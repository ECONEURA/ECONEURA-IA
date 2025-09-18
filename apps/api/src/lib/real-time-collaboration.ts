import { z } from "zod";
import { logger } from "./logger.js";
import { WebSocket, WebSocketServer } from "ws";
import { EventEmitter } from "events";

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

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

// ============================================================================
// COLLABORATION SYSTEM IMPLEMENTATION
// ============================================================================

export class RealTimeCollaborationSystem extends EventEmitter {
  private wss: WebSocketServer | null = null;
  private rooms: Map<string, z.infer<typeof CollaborationRoomSchema>> = new Map();
  private connections: Map<string, WebSocket> = new Map();
  private userRooms: Map<string, Set<string>> = new Map();
  private roomConnections: Map<string, Set<string>> = new Map();
  private messages: Map<string, z.infer<typeof CollaborationMessageSchema>[]> = new Map();
  private documentChanges: Map<string, z.infer<typeof DocumentChangeSchema>[]> = new Map();
  private userPresence: Map<string, z.infer<typeof UserPresenceSchema>> = new Map();
  private sessions: Map<string, z.infer<typeof CollaborationSessionSchema>[]> = new Map();
  private analytics: z.infer<typeof CollaborationAnalyticsSchema>;

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

  // ============================================================================
  // WEBSOCKET SERVER MANAGEMENT
  // ============================================================================

  initializeWebSocketServer(server: any): void {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket, request: any) => {
      this.handleConnection(ws, request);
    });

    logger.info("WebSocket server initialized", {
      port: server.address()?.port,
      connections: this.connections.size
    });
  }

  private handleConnection(ws: WebSocket, request: any): void {
    const connectionId = this.generateConnectionId();
    this.connections.set(connectionId, ws);

    logger.info("New WebSocket connection established", {
      connectionId,
      remoteAddress: request.socket.remoteAddress
    });

    ws.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(connectionId, message);
      } catch (error) {
        logger.error("Failed to parse WebSocket message", {
          connectionId,
          error: (error as Error).message
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

    // Send welcome message
    this.sendToConnection(connectionId, {
      type: 'welcome',
      connectionId,
      timestamp: new Date(),
      message: 'Connected to real-time collaboration system'
    });
  }

  private handleDisconnection(connectionId: string): void {
    const userId = this.getUserIdFromConnection(connectionId);

    if (userId) {
      this.updateUserPresence(userId, 'offline');
      this.leaveAllRooms(userId);
    }

    this.connections.delete(connectionId);
    logger.info("WebSocket connection closed", { connectionId, userId: userId || undefined });
  }

  // ============================================================================
  // MESSAGE HANDLING
  // ============================================================================

  private handleMessage(connectionId: string, message: any): void {
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

  private handleJoinRoom(connectionId: string, data: any): void {
    const { roomId, userId, userName } = data;

    if (!this.rooms.has(roomId)) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Room not found',
        roomId
      });
      return;
    }

    const room = this.rooms.get(roomId)!;

    // Check if user can join
    if (room.participants.length >= room.settings.maxParticipants) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Room is full',
        roomId
      });
      return;
    }

    // Add user to room
    this.addUserToRoom(userId, roomId);
    this.updateUserPresence(userId, 'online', roomId);

    // Start session
    this.startSession(userId, roomId, userName);

    // Notify other participants
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      userId,
      userName,
      timestamp: new Date()
    }, userId);

    // Send room info to joining user
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

  private handleLeaveRoom(connectionId: string, data: any): void {
    const { roomId, userId, userName } = data;

    this.removeUserFromRoom(userId, roomId);
    this.endSession(userId, roomId);

    // Notify other participants
    this.broadcastToRoom(roomId, {
      type: 'user_left',
      userId,
      userName,
      timestamp: new Date()
    }, userId);

    logger.info("User left room", { userId, userName, roomId });
  }

  private handleSendMessage(connectionId: string, data: any): void {
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
    const msgType = allowed.includes(messageType) ? messageType as 'text' | 'file' | 'system' | 'presence' | 'document_change' : 'text';
    const message: z.infer<typeof CollaborationMessageSchema> = {
      id: this.generateMessageId(),
      roomId,
      senderId: userId,
      senderName: userName,
      type: msgType,
      content,
      timestamp: new Date()
    };

    // Store message
    if (!this.messages.has(roomId)) {
      this.messages.set(roomId, []);
    }
    this.messages.get(roomId)!.push(message);

    // Broadcast to room
    this.broadcastToRoom(roomId, {
      type: 'new_message',
      message
    });

    // Update analytics
    this.updateMessageAnalytics(messageType);

    logger.info("Message sent", { userId, roomId, messageType });
  }

  private handleDocumentChange(connectionId: string, data: any): void {
    const { roomId, userId, userName, operation, position, content, version } = data;

    if (!this.rooms.has(roomId)) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Room not found',
        roomId
      });
      return;
    }

    const change: z.infer<typeof DocumentChangeSchema> = {
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

    // Store change
    if (!this.documentChanges.has(roomId)) {
      this.documentChanges.set(roomId, []);
    }
    this.documentChanges.get(roomId)!.push(change);

    // Broadcast to room
    this.broadcastToRoom(roomId, {
      type: 'document_change',
      change
    }, userId);

    // Update analytics
    this.updateDocumentChangeAnalytics();

    logger.info("Document change applied", { userId, roomId, operation, version });
  }

  private handleUpdatePresence(connectionId: string, data: any): void {
    const { userId, userName, status, roomId } = data;

    this.updateUserPresence(userId, status, roomId);

    // Broadcast presence update
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

  private handleGetRoomInfo(connectionId: string, data: any): void {
    const { roomId } = data;

    if (!this.rooms.has(roomId)) {
      this.sendToConnection(connectionId, {
        type: 'error',
        message: 'Room not found',
        roomId
      });
      return;
    }

    const room = this.rooms.get(roomId)!;
    this.sendToConnection(connectionId, {
      type: 'room_info',
      room
    });
  }

  private handleGetParticipants(connectionId: string, data: any): void {
    const { roomId } = data;

    const participants = this.getRoomParticipants(roomId);
    this.sendToConnection(connectionId, {
      type: 'participants',
      roomId,
      participants
    });
  }

  private handleGetMessages(connectionId: string, data: any): void {
    const { roomId, limit = 50 } = data;

    const messages = this.getRecentMessages(roomId, limit);
    this.sendToConnection(connectionId, {
      type: 'messages',
      roomId,
      messages
    });
  }

  private handleGetDocumentChanges(connectionId: string, data: any): void {
    const { roomId, limit = 100 } = data;

    const changes = this.getRecentDocumentChanges(roomId, limit);
    this.sendToConnection(connectionId, {
      type: 'document_changes',
      roomId,
      changes
    });
  }

  // ============================================================================
  // ROOM MANAGEMENT
  // ============================================================================

  createRoom(roomData: Omit<z.infer<typeof CollaborationRoomSchema>, 'id' | 'createdAt' | 'updatedAt'>): z.infer<typeof CollaborationRoomSchema> {
    const room: z.infer<typeof CollaborationRoomSchema> = {
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

    // Update analytics
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

  getRoom(roomId: string): z.infer<typeof CollaborationRoomSchema> | null {
    return this.rooms.get(roomId) || null;
  }

  updateRoom(roomId: string, updates: Partial<z.infer<typeof CollaborationRoomSchema>>): z.infer<typeof CollaborationRoomSchema> | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const updatedRoom = {
      ...room,
      ...updates,
      updatedAt: new Date()
    };

    this.rooms.set(roomId, updatedRoom);

    // Notify participants
    this.broadcastToRoom(roomId, {
      type: 'room_updated',
      room: updatedRoom
    });

    logger.info("Room updated", { roomId, updates: Object.keys(updates) });
    return updatedRoom;
  }

  deleteRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;

    // Notify participants
    this.broadcastToRoom(roomId, {
      type: 'room_deleted',
      roomId
    });

    // Clean up
    this.rooms.delete(roomId);
    this.messages.delete(roomId);
    this.documentChanges.delete(roomId);
    this.roomConnections.delete(roomId);
    this.sessions.delete(roomId);

    // Update analytics
    this.analytics.activeRooms--;

    logger.info("Room deleted", { roomId });
    return true;
  }

  listRooms(userId?: string): z.infer<typeof CollaborationRoomSchema>[] {
    if (userId) {
      const userRoomIds = this.userRooms.get(userId) || new Set();
      return Array.from(userRoomIds)
        .map(roomId => this.rooms.get(roomId))
        .filter(Boolean) as z.infer<typeof CollaborationRoomSchema>[];
    }

    return Array.from(this.rooms.values());
  }

  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================

  private addUserToRoom(userId: string, roomId: string): void {
    // Add user to room
    if (!this.userRooms.has(userId)) {
      this.userRooms.set(userId, new Set());
    }
    this.userRooms.get(userId)!.add(roomId);

    // Add room to user's connections
    const roomConnections = this.roomConnections.get(roomId) || new Set();
    roomConnections.add(userId);
    this.roomConnections.set(roomId, roomConnections);

    // Add user to room participants if not already there
    const room = this.rooms.get(roomId);
    if (room && !room.participants.includes(userId)) {
      room.participants.push(userId);
      room.updatedAt = new Date();
    }
  }

  private removeUserFromRoom(userId: string, roomId: string): void {
    // Remove user from room
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      userRooms.delete(roomId);
    }

    // Remove room from user's connections
    const roomConnections = this.roomConnections.get(roomId);
    if (roomConnections) {
      roomConnections.delete(userId);
    }

    // Remove user from room participants
    const room = this.rooms.get(roomId);
    if (room) {
      room.participants = room.participants.filter(id => id !== userId);
      room.updatedAt = new Date();
    }
  }

  private leaveAllRooms(userId: string): void {
    const userRooms = this.userRooms.get(userId);
    if (userRooms) {
      for (const roomId of userRooms) {
        this.removeUserFromRoom(userId, roomId);
      }
    }
  }

  private getRoomParticipants(roomId: string): z.infer<typeof UserPresenceSchema>[] {
    const room = this.rooms.get(roomId);
    if (!room) return [];

    return room.participants
      .map(userId => this.userPresence.get(userId))
      .filter(Boolean) as z.infer<typeof UserPresenceSchema>[];
  }

  // ============================================================================
  // PRESENCE MANAGEMENT
  // ============================================================================

  private updateUserPresence(userId: string, status: z.infer<typeof UserPresenceSchema>['status'], roomId?: string): void {
    const existing = this.userPresence.get(userId);

    const presence: z.infer<typeof UserPresenceSchema> = {
      userId,
      userName: existing?.userName || `User-${userId}`,
      status,
      lastSeen: new Date(),
      roomId,
      metadata: existing?.metadata || {}
    };

    this.userPresence.set(userId, presence);

    // Update analytics
    if (status === 'online') {
      this.analytics.activeUsers++;
    } else if (status === 'offline') {
      this.analytics.activeUsers = Math.max(0, this.analytics.activeUsers - 1);
    }
  }

  getUserPresence(userId: string): z.infer<typeof UserPresenceSchema> | null {
    return this.userPresence.get(userId) || null;
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  private startSession(userId: string, roomId: string, userName: string): void {
    const session: z.infer<typeof CollaborationSessionSchema> = {
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
    this.sessions.get(roomId)!.push(session);
  }

  private endSession(userId: string, roomId: string): void {
    const roomSessions = this.sessions.get(roomId);
    if (!roomSessions) return;

    const session = roomSessions.find(s => s.userId === userId && !s.leftAt);
    if (session) {
      session.leftAt = new Date();
      session.duration = session.leftAt.getTime() - session.joinedAt.getTime();
    }
  }

  // ============================================================================
  // MESSAGE AND DOCUMENT MANAGEMENT
  // ============================================================================

  private getRecentMessages(roomId: string, limit: number): z.infer<typeof CollaborationMessageSchema>[] {
    const messages = this.messages.get(roomId) || [];
    return messages.slice(-limit);
  }

  private getRecentDocumentChanges(roomId: string, limit: number): z.infer<typeof DocumentChangeSchema>[] {
    const changes = this.documentChanges.get(roomId) || [];
    return changes.slice(-limit);
  }

  private updateMessageAnalytics(messageType: string): void {
    this.analytics.totalMessages++;
    this.analytics.messageTypes[messageType] = (this.analytics.messageTypes[messageType] || 0) + 1;
  }

  private updateDocumentChangeAnalytics(): void {
    this.analytics.totalDocumentChanges++;
  }

  private updateRoomTypeAnalytics(roomType: string): void {
    this.analytics.roomTypes[roomType] = (this.analytics.roomTypes[roomType] || 0) + 1;
  }

  // ============================================================================
  // WEBSOCKET COMMUNICATION
  // ============================================================================

  private sendToConnection(connectionId: string, message: any): void {
    const ws = this.connections.get(connectionId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcastToRoom(roomId: string, message: any, excludeUserId?: string): void {
    const roomConnections = this.roomConnections.get(roomId);
    if (!roomConnections) return;

    for (const userId of roomConnections) {
      if (userId === excludeUserId) continue;

      const connectionId = this.getConnectionIdFromUser(userId);
      if (connectionId) {
        this.sendToConnection(connectionId, message);
      }
    }
  }

  private getUserIdFromConnection(connectionId: string): string | null {
    // In a real implementation, you'd maintain a mapping
    // For now, we'll use a simple approach
    return null;
  }

  private getConnectionIdFromUser(userId: string): string | null {
    // In a real implementation, you'd maintain a mapping
    // For now, we'll use a simple approach
    return null;
  }

  // ============================================================================
  // ANALYTICS
  // ============================================================================

  getCollaborationAnalytics(): z.infer<typeof CollaborationAnalyticsSchema> {
    return { ...this.analytics };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateRoomId(): string {
    return `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateConnectionId(): string {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateChangeId(): string {
    return `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ============================================================================
  // SAMPLE DATA INITIALIZATION
  // ============================================================================

  private initializeSampleData(): void {
    // Create sample rooms
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

    // Initialize user presence
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

// ============================================================================
// EXPORT INSTANCE
// ============================================================================

export const realTimeCollaborationSystem = new RealTimeCollaborationSystem();
