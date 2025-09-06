// Security Enhanced Service - Mejora 3: Seguridad y Compliance
import { logger } from './logger.js';

export interface SecurityEvent {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId?: string;
  orgId?: string;
  details: Record<string, any>;
  timestamp: Date;
}

export class SecurityEnhancedService {
  private events: Map<string, SecurityEvent> = new Map();

  constructor() {
    logger.info('SecurityEnhancedService initialized');
  }

  recordEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): SecurityEvent {
    const securityEvent: SecurityEvent = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...event,
      timestamp: new Date()
    };

    this.events.set(securityEvent.id, securityEvent);
    logger.warn('Security event recorded', { eventId: securityEvent.id });
    return securityEvent;
  }

  getEvents(): SecurityEvent[] {
    return Array.from(this.events.values());
  }

  getDashboard(): any {
    return {
      totalEvents: this.events.size,
      bySeverity: this.getEventsBySeverity(),
      timestamp: new Date()
    };
  }

  private getEventsBySeverity(): Record<string, number> {
    const events = Array.from(this.events.values());
    return events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

export const securityEnhancedService = new SecurityEnhancedService();

