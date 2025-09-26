import { randomUUID } from 'crypto';

import { structuredLogger } from './structured-logger.js';
class SSEManager {
    clients = new Map();
    clientsByOrg = new Map();
    pingInterval;
    constructor() {
        this.pingInterval = setInterval(() => {
            this.pingAllClients();
        }, 30000);
    }
    addClient(orgId, userId, response, subscriptions = []) {
        const clientId = randomUUID();
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'X-Correlation-Id': clientId
        });
        const client = {
            id: clientId,
            orgId,
            userId,
            response,
            subscriptions: new Set(subscriptions),
            connectedAt: new Date(),
            lastPing: new Date()
        };
        this.clients.set(clientId, client);
        if (!this.clientsByOrg.has(orgId)) {
            this.clientsByOrg.set(orgId, new Set());
        }
        this.clientsByOrg.get(orgId).add(clientId);
        this.sendToClient(clientId, {
            event: 'connected',
            data: {
                clientId,
                timestamp: new Date().toISOString(),
                subscriptions: Array.from(client.subscriptions)
            }
        });
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
    removeClient(clientId) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        const orgClients = this.clientsByOrg.get(client.orgId);
        if (orgClients) {
            orgClients.delete(clientId);
            if (orgClients.size === 0) {
                this.clientsByOrg.delete(client.orgId);
            }
        }
        this.clients.delete(clientId);
        structuredLogger.info('SSE client disconnected', {
            clientId,
            orgId: client.orgId,
            connectionDuration: Date.now() - client.connectedAt.getTime()
        });
    }
    sendToClient(clientId, event) {
        const client = this.clients.get(clientId);
        if (!client)
            return false;
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
        }
        catch (error) {
            structuredLogger.error('Failed to send SSE event to client', error, {
                clientId,
                eventType: event.event
            });
            this.removeClient(clientId);
            return false;
        }
    }
    broadcastToOrg(orgId, event, eventType) {
        const orgClients = this.clientsByOrg.get(orgId);
        if (!orgClients)
            return 0;
        let sentCount = 0;
        for (const clientId of orgClients) {
            const client = this.clients.get(clientId);
            if (!client)
                continue;
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
    broadcastToAll(event, eventType) {
        let sentCount = 0;
        for (const [clientId, client] of this.clients) {
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
    pingAllClients() {
        const now = new Date();
        const staleThreshold = 60000;
        for (const [clientId, client] of this.clients) {
            if (now.getTime() - client.lastPing.getTime() > staleThreshold) {
                this.removeClient(clientId);
                continue;
            }
            this.sendToClient(clientId, {
                event: 'ping',
                data: { timestamp: now.toISOString() }
            });
        }
    }
    getStats() {
        const stats = {
            totalClients: this.clients.size,
            clientsByOrg: {},
            oldestConnection: null,
            newestConnection: null
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
    cleanup() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }
        for (const client of this.clients.values()) {
            try {
                client.response.end();
            }
            catch (error) {
            }
        }
        this.clients.clear();
        this.clientsByOrg.clear();
        structuredLogger.info('SSE Manager cleaned up');
    }
}
export const sseManager = new SSEManager();
//# sourceMappingURL=sse-manager.js.map