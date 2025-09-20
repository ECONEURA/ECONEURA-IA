import { Response } from 'express';
export interface SSEClient {
    id: string;
    orgId: string;
    userId?: string;
    response: Response;
    subscriptions: Set<string>;
    connectedAt: Date;
    lastPing: Date;
}
export interface SSEEvent {
    id?: string;
    event?: string;
    data: any;
    retry?: number;
}
declare class SSEManager {
    private clients;
    private clientsByOrg;
    private pingInterval;
    constructor();
    addClient(orgId: string, userId: string | undefined, response: Response, subscriptions?: string[]): string;
    removeClient(clientId: string): void;
    sendToClient(clientId: string, event: SSEEvent): boolean;
    broadcastToOrg(orgId: string, event: SSEEvent, eventType?: string): number;
    broadcastToAll(event: SSEEvent, eventType?: string): number;
    private pingAllClients;
    getStats(): {
        totalClients: number;
        clientsByOrg: Record<string, number>;
        oldestConnection: Date | null;
        newestConnection: Date | null;
    };
    cleanup(): void;
}
export declare const sseManager: SSEManager;
export {};
//# sourceMappingURL=sse-manager.d.ts.map