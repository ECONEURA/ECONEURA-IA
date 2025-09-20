import { logger } from './logger.js';
export class SecurityEnhancedService {
    events = new Map();
    constructor() {
        logger.info('SecurityEnhancedService initialized');
    }
    recordEvent(event) {
        const securityEvent = {
            id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...event,
            timestamp: new Date()
        };
        this.events.set(securityEvent.id, securityEvent);
        logger.warn('Security event recorded', { eventId: securityEvent.id });
        return securityEvent;
    }
    getEvents() {
        return Array.from(this.events.values());
    }
    getDashboard() {
        return {
            totalEvents: this.events.size,
            bySeverity: this.getEventsBySeverity(),
            timestamp: new Date()
        };
    }
    getEventsBySeverity() {
        const events = Array.from(this.events.values());
        return events.reduce((acc, event) => {
            acc[event.severity] = (acc[event.severity] || 0) + 1;
            return acc;
        }, {});
    }
}
export const securityEnhancedService = new SecurityEnhancedService();
//# sourceMappingURL=security-enhanced.service.js.map