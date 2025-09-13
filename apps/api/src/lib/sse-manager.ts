import { Response } from 'express';
import { structuredLogger } from './structured-logger.js';
import { randomUUID } from 'crypto';

export interface SSEClient {
  id: string;
  orgId: string;
  userId?: string;
  response: Response;
  subscriptions: Set<string>; // Event types subscribed to
  connectedAt: Date;
  lastPing: Date;
}

export interface SSEEvent {
  id?: string;
  event?: string;
  data: any;
  retry?: number;
}

class SSEManager {
  private clients = new Map<string, SSEClient>();
  private clientsByOrg = new Map<string, Set<string>>();
  private pingInterval: NodeJS.Timeout;

  constructor() {
    // Send ping every 30 seconds to keep connections alive
    this.pingInterval = setInterval(() => {
      this.pingAllClients();
    }, 30000);
  }

  // Add new SSE client
  addClient(orgId: string, userId: string | undefined, response: Response, subscriptions: string[] = []): string {
    const clientId = randomUUID();
    
    // Configure SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*', // Will be overridden by CORS middleware
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Correlation-Id': clientId
    });

    const client: SSEClient = {
      id: clientId,
      orgId,
      userId,
      response,
      subscriptions: new Set(subscriptions),
      connectedAt: new Date(),
      lastPing: new Date()
    };

    this.clients.set(clientId, client);

    // Add to org index
    if (!this.clientsByOrg.has(orgId)) {
      this.clientsByOrg.set(orgId, new Set());
    }
    this.clientsByOrg.get(orgId)!.add(clientId);

    // Send welcome message
    this.sendToClient(clientId, {
      event: 'connected',
      data: {
        clientId,
        timestamp: new Date().toISOString(),
        subscriptions: Array.from(client.subscriptions)
      }
    });

    // Handle client disconnect
    response.on('close', () => {
      this.removeClient(clientId);
    });

    structuredLogger.info('SSE client connected', {
      clientId,
      orgId,
      userId,
      subscriptions
    });

    return clientId;
  }

  // Remove client
  removeClient(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from org index
    const orgClients = this.clientsByOrg.get(client.orgId);
    if (orgClients) {
      orgClients.delete(clientId);
      if (orgClients.size === 0) {
        this.clientsByOrg.delete(client.orgId);
      }
    }

    // Remove from main clients map
    this.clients.delete(clientId);

    structuredLogger.info('SSE client disconnected', {
      clientId,
      orgId: client.orgId,
      connectionDuration: Date.now() - client.connectedAt.getTime()
    });
  }

  // Send event to specific client
  sendToClient(clientId: string, event: SSEEvent): boolean {
    const client = this.clients.get(clientId);
    if (!client) return false;

    try {
      const eventId = event.id || randomUUID();
      const eventType = event.event || 'message';
      const data = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);

      let message = `id: ${eventId}\n`;
      message += `event: ${eventType}\n`;
      message += `data: ${data}\n`;
      if (event.retry) {
        message += `retry: ${event.retry}\n`;
      }
      message += '\n';

      client.response.write(message);
      client.lastPing = new Date();

      return true;
    } catch (error) {
      structuredLogger.error('Failed to send SSE event to client', error as Error, {
        clientId,
        eventType: event.event
      });
      
      // Remove broken client
      this.removeClient(clientId);
      return false;
    }
  }

  // Broadcast event to all clients in organization
  broadcastToOrg(orgId: string, event: SSEEvent, eventType?: string): number {
    const orgClients = this.clientsByOrg.get(orgId);
    if (!orgClients) return 0;

    let sentCount = 0;
    
    for (const clientId of orgClients) {
      const client = this.clients.get(clientId);
      if (!client) continue;

      // Check if client is subscribed to this event type
      if (eventType && client.subscriptions.size > 0 && !client.subscriptions.has(eventType)) {
        continue;
      }

      if (this.sendToClient(clientId, event)) {
        sentCount++;
      }
    }

    structuredLogger.debug('SSE event broadcasted to org', {
      orgId,
      eventType: event.event,
      clientCount: orgClients.size,
      sentCount
    });

    return sentCount;
  }

  // Broadcast to all clients
  broadcastToAll(event: SSEEvent, eventType?: string): number {
    let sentCount = 0;
    
    for (const [clientId, client] of this.clients) {
      // Check subscriptions
      if (eventType && client.subscriptions.size > 0 && !client.subscriptions.has(eventType)) {
        continue;
      }

      if (this.sendToClient(clientId, event)) {
        sentCount++;
      }
    }

    structuredLogger.debug('SSE event broadcasted to all clients', {
      eventType: event.event,
      totalClients: this.clients.size,
      sentCount
    });

    return sentCount;
  }

  // Send ping to all clients
  private pingAllClients(): void {
    const now = new Date();
    const staleThreshold = 60000; // 1 minute

    for (const [clientId, client] of this.clients) {
      // Remove stale clients
      if (now.getTime() - client.lastPing.getTime() > staleThreshold) {
        this.removeClient(clientId);
        continue;
      }

      // Send ping
      this.sendToClient(clientId, {
        event: 'ping',
        data: { timestamp: now.toISOString() }
      });
    }
  }

  // Get connection statistics
  getStats() {
    const stats = {
      totalClients: this.clients.size,
      clientsByOrg: {} as Record<string, number>,
      oldestConnection: null as Date | null,
      newestConnection: null as Date | null
    };

    for (const [orgId, clientIds] of this.clientsByOrg) {
      stats.clientsByOrg[orgId] = clientIds.size;
    }

    for (const client of this.clients.values()) {
      if (!stats.oldestConnection || client.connectedAt < stats.oldestConnection) {
        stats.oldestConnection = client.connectedAt;
      }
      if (!stats.newestConnection || client.connectedAt > stats.newestConnection) {
        stats.newestConnection = client.connectedAt;
      }
    }

    return stats;
  }

  // Cleanup on shutdown
  cleanup(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Close all connections
    for (const client of this.clients.values()) {
      try {
        client.response.end();
      } catch (error) {
        // Ignore errors on cleanup
      }
    }

    this.clients.clear();
    this.clientsByOrg.clear();

    structuredLogger.info('SSE Manager cleaned up');
  }
}

export const sseManager = new SSEManager();
