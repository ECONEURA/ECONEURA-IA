import { EventEmitter } from 'events';
import { logger } from '../lib/logger';

export interface RealtimeEvent {
  type: 'inventory_update' | 'stock_alert' | 'supplier_update' | 'product_update';
  org_id: string;
  data: any;
  timestamp: Date;
  user_id?: string;
}

export interface RealtimeConnection {
  id: string;
  org_id: string;
  user_id?: string;
  last_activity: Date;
  subscriptions: string[];
}

export class RealtimeService extends EventEmitter {
  private connections: Map<string, RealtimeConnection> = new Map();
  private orgSubscriptions: Map<string, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    super();
    this.startHeartbeat();
  }

  // Register a new connection
  registerConnection(connectionId: string, orgId: string, userId?: string): void {
    const connection: RealtimeConnection = {
      id: connectionId,
      org_id: orgId,
      user_id: userId,
      last_activity: new Date(),
      subscriptions: []
    };

    this.connections.set(connectionId, connection);
    
    // Add to org subscriptions
    if (!this.orgSubscriptions.has(orgId)) {
      this.orgSubscriptions.set(orgId, new Set());
    }
    this.orgSubscriptions.get(orgId)!.add(connectionId);

    logger.info(`Realtime connection registered: ${connectionId} for org: ${orgId}`);
  }

  // Remove a connection
  removeConnection(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      // Remove from org subscriptions
      const orgSubs = this.orgSubscriptions.get(connection.org_id);
      if (orgSubs) {
        orgSubs.delete(connectionId);
        if (orgSubs.size === 0) {
          this.orgSubscriptions.delete(connection.org_id);
        }
      }

      this.connections.delete(connectionId);
      logger.info(`Realtime connection removed: ${connectionId}`);
    }
  }

  // Update connection activity
  updateActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.last_activity = new Date();
    }
  }

  // Subscribe to events
  subscribe(connectionId: string, eventTypes: string[]): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.subscriptions = [...new Set([...connection.subscriptions, ...eventTypes])];
      logger.info(`Connection ${connectionId} subscribed to: ${eventTypes.join(', ')}`);
    }
  }

  // Unsubscribe from events
  unsubscribe(connectionId: string, eventTypes: string[]): void {
    const connection = this.connections.get(connectionId);
    if (connection) {
      connection.subscriptions = connection.subscriptions.filter(
        sub => !eventTypes.includes(sub)
      );
      logger.info(`Connection ${connectionId} unsubscribed from: ${eventTypes.join(', ')}`);
    }
  }

  // Broadcast event to organization
  broadcastToOrg(orgId: string, event: Omit<RealtimeEvent, 'org_id' | 'timestamp'>): void {
    const orgSubs = this.orgSubscriptions.get(orgId);
    if (!orgSubs) return;

    const realtimeEvent: RealtimeEvent = {
      ...event,
      org_id: orgId,
      timestamp: new Date()
    };

    // Emit to all connections in the org
    orgSubs.forEach(connectionId => {
      const connection = this.connections.get(connectionId);
      if (connection && this.shouldReceiveEvent(connection, realtimeEvent)) {
        this.emit('message', connectionId, realtimeEvent);
      }
    });

    logger.info(`Broadcasted ${event.type} to ${orgSubs.size} connections in org ${orgId}`);
  }

  // Broadcast event to specific user
  broadcastToUser(userId: string, event: Omit<RealtimeEvent, 'org_id' | 'timestamp'>): void {
    const userConnections = Array.from(this.connections.values())
      .filter(conn => conn.user_id === userId);

    const realtimeEvent: RealtimeEvent = {
      ...event,
      org_id: userConnections[0]?.org_id || '',
      timestamp: new Date()
    };

    userConnections.forEach(connection => {
      if (this.shouldReceiveEvent(connection, realtimeEvent)) {
        this.emit('message', connection.id, realtimeEvent);
      }
    });

    logger.info(`Broadcasted ${event.type} to user ${userId} (${userConnections.length} connections)`);
  }

  // Check if connection should receive event
  private shouldReceiveEvent(connection: RealtimeConnection, event: RealtimeEvent): boolean {
    return connection.subscriptions.includes(event.type) || 
           connection.subscriptions.includes('*');
  }

  // Inventory update event
  inventoryUpdated(orgId: string, productId: string, changes: any, userId?: string): void {
    this.broadcastToOrg(orgId, {
      type: 'inventory_update',
      data: {
        product_id: productId,
        changes,
        action: 'updated'
      },
      user_id: userId
    });
  }

  // Stock alert event
  stockAlert(orgId: string, alert: any, userId?: string): void {
    this.broadcastToOrg(orgId, {
      type: 'stock_alert',
      data: alert,
      user_id: userId
    });
  }

  // Supplier update event
  supplierUpdated(orgId: string, supplierId: string, changes: any, userId?: string): void {
    this.broadcastToOrg(orgId, {
      type: 'supplier_update',
      data: {
        supplier_id: supplierId,
        changes,
        action: 'updated'
      },
      user_id: userId
    });
  }

  // Product update event
  productUpdated(orgId: string, productId: string, changes: any, userId?: string): void {
    this.broadcastToOrg(orgId, {
      type: 'product_update',
      data: {
        product_id: productId,
        changes,
        action: 'updated'
      },
      user_id: userId
    });
  }

  // Get connection stats
  getStats(): {
    total_connections: number;
    orgs_with_connections: number;
    connections_by_org: Record<string, number>;
  } {
    const connectionsByOrg: Record<string, number> = {};
    
    this.connections.forEach(connection => {
      connectionsByOrg[connection.org_id] = (connectionsByOrg[connection.org_id] || 0) + 1;
    });

    return {
      total_connections: this.connections.size,
      orgs_with_connections: this.orgSubscriptions.size,
      connections_by_org: connectionsByOrg
    };
  }

  // Clean up inactive connections
  cleanupInactiveConnections(maxInactiveMinutes: number = 30): void {
    const cutoff = new Date(Date.now() - maxInactiveMinutes * 60 * 1000);
    const inactiveConnections: string[] = [];

    this.connections.forEach((connection, connectionId) => {
      if (connection.last_activity < cutoff) {
        inactiveConnections.push(connectionId);
      }
    });

    inactiveConnections.forEach(connectionId => {
      this.removeConnection(connectionId);
    });

    if (inactiveConnections.length > 0) {
      logger.info(`Cleaned up ${inactiveConnections.length} inactive connections`);
    }
  }

  // Start heartbeat to keep connections alive
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.emit('heartbeat');
      
      // Clean up inactive connections every 5 minutes
      if (Date.now() % (5 * 60 * 1000) < 1000) {
        this.cleanupInactiveConnections();
      }
    }, 30000); // 30 seconds
  }

  // Stop heartbeat
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  // Get connections for an organization
  getConnectionsForOrg(orgId: string): RealtimeConnection[] {
    const orgSubs = this.orgSubscriptions.get(orgId);
    if (!orgSubs) return [];

    return Array.from(orgSubs)
      .map(connectionId => this.connections.get(connectionId))
      .filter(Boolean) as RealtimeConnection[];
  }

  // Get connections for a user
  getConnectionsForUser(userId: string): RealtimeConnection[] {
    return Array.from(this.connections.values())
      .filter(connection => connection.user_id === userId);
  }

  // Check if user is online
  isUserOnline(userId: string): boolean {
    return this.getConnectionsForUser(userId).length > 0;
  }

  // Get online users for an organization
  getOnlineUsersForOrg(orgId: string): string[] {
    const connections = this.getConnectionsForOrg(orgId);
    const userIds = connections
      .map(conn => conn.user_id)
      .filter(Boolean) as string[];
    
    return [...new Set(userIds)];
  }
}

export const realtimeService = new RealtimeService();

