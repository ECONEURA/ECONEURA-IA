export interface SecurityEvent {
    id: string;
    type: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    orgId?: string;
    details: Record<string, any>;
    timestamp: Date;
}
export declare class SecurityEnhancedService {
    private events;
    constructor();
    recordEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent;
    getEvents(): SecurityEvent[];
    getDashboard(): any;
    private getEventsBySeverity;
}
export declare const securityEnhancedService: SecurityEnhancedService;
//# sourceMappingURL=security-enhanced.service.d.ts.map