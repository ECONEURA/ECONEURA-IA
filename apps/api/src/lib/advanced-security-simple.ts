import { structuredLogger } from './structured-logger.js';
import { apiCache } from './advanced-cache.js';

export interface SecurityEvent {
  id: string;
  type: 'threat' | 'anomaly' | 'compliance' | 'audit';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  metadata: Record<string, any>;
  userId?: string;
  orgId: string;
  ipAddress?: string;
  timestamp: string;
  resolved: boolean;
}

export interface ThreatDetection {
  id: string;
  threatType: 'brute_force' | 'sql_injection' | 'xss' | 'suspicious_activity';
  confidence: number;
  indicators: string[];
  blocked: boolean;
  timestamp: string;
}

export interface SecurityMetrics {
  totalThreats: number;
  threatsBlocked: number;
  activeAlerts: number;
  securityEvents: number;
  lastIncident: string;
  threatTypes: Array<{ type: string; count: number }>;
}

export class AdvancedSecurityService {
  private securityEvents: Map<string, SecurityEvent> = new Map();
  private threatDetections: Map<string, ThreatDetection> = new Map();
  private blockedIPs: Set<string> = new Set();

  constructor() {
    this.initializeSecurityData();
    structuredLogger.info('Advanced Security Service initialized');
  }

  // Detect threats
  async detectThreat(request: {
    ipAddress: string;
    userAgent: string;
    endpoint: string;
    method: string;
    userId?: string;
    orgId: string;
    body?: any;
  }): Promise<ThreatDetection | null> {
    // Check for brute force
    const bruteForceThreat = await this.detectBruteForce(request);
    if (bruteForceThreat) return bruteForceThreat;

    // Check for SQL injection
    const sqlInjectionThreat = this.detectSQLInjection(request);
    if (sqlInjectionThreat) return sqlInjectionThreat;

    // Check for XSS
    const xssThreat = this.detectXSS(request);
    if (xssThreat) return xssThreat;

    return null;
  }

  // Log security event
  async logSecurityEvent(eventData: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>): Promise<string> {
    const id = `security_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const event: SecurityEvent = {
      ...eventData,
      id,
      timestamp: new Date().toISOString(),
      resolved: false
    };

    this.securityEvents.set(id, event);
    apiCache.set(`security:event:${id}`, event);
    
    structuredLogger.warn('Security event logged', {
      eventId: id,
      type: event.type,
      severity: event.severity,
      orgId: event.orgId
    });

    return id;
  }

  // Get security metrics
  async getSecurityMetrics(orgId: string): Promise<SecurityMetrics> {
    const orgEvents = Array.from(this.securityEvents.values()).filter(e => e.orgId === orgId);
    const threats = Array.from(this.threatDetections.values());

    return {
      totalThreats: threats.length,
      threatsBlocked: threats.filter(t => t.blocked).length,
      activeAlerts: orgEvents.filter(e => !e.resolved && e.severity === 'high').length,
      securityEvents: orgEvents.length,
      lastIncident: orgEvents.length > 0 ? orgEvents[orgEvents.length - 1].timestamp : 'Never',
      threatTypes: this.getThreatTypeStats(threats)
    };
  }

  // Get security events
  async getSecurityEvents(orgId: string): Promise<SecurityEvent[]> {
    return Array.from(this.securityEvents.values())
      .filter(e => e.orgId === orgId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // Check if IP is blocked
  isIPBlocked(ipAddress: string): boolean {
    return this.blockedIPs.has(ipAddress);
  }

  // Private methods
  private async detectBruteForce(request: any): Promise<ThreatDetection | null> {
    const key = `brute_force:${request.ipAddress}`;
    const attempts = (apiCache.get(key) as number) || 0;
    
    if (attempts >= 5) {
      this.blockedIPs.add(request.ipAddress);
      return {
        id: `threat_${Date.now()}`,
        threatType: 'brute_force',
        confidence: 90,
        indicators: [`${attempts} failed attempts`],
        blocked: true,
        timestamp: new Date().toISOString()
      };
    }

    apiCache.set(key, attempts + 1);
    return null;
  }

  private detectSQLInjection(request: any): ThreatDetection | null {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b)/i,
      /(\b(OR|AND)\s+\d+\s*=\s*\d+)/i
    ];

    const bodyString = JSON.stringify(request.body || {});

    for (const pattern of sqlPatterns) {
      if (pattern.test(bodyString)) {
        return {
          id: `threat_${Date.now()}`,
          threatType: 'sql_injection',
          confidence: 85,
          indicators: ['SQL injection pattern detected'],
          blocked: true,
          timestamp: new Date().toISOString()
        };
      }
    }

    return null;
  }

  private detectXSS(request: any): ThreatDetection | null {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi
    ];

    const bodyString = JSON.stringify(request.body || {});

    for (const pattern of xssPatterns) {
      if (pattern.test(bodyString)) {
        return {
          id: `threat_${Date.now()}`,
          threatType: 'xss',
          confidence: 80,
          indicators: ['XSS pattern detected'],
          blocked: true,
          timestamp: new Date().toISOString()
        };
      }
    }

    return null;
  }

  private getThreatTypeStats(threats: ThreatDetection[]): Array<{ type: string; count: number }> {
    const typeCounts = threats.reduce((acc, threat) => {
      acc[threat.threatType] = (acc[threat.threatType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);
  }

  private initializeSecurityData(): void {
    const demoEvents: Omit<SecurityEvent, 'id' | 'timestamp' | 'resolved'>[] = [
      {
        type: 'threat',
        severity: 'medium',
        source: 'threat_detection',
        description: 'Suspicious login attempt detected',
        metadata: { ipAddress: '192.168.1.100', attempts: 3 },
        orgId: 'demo-org',
        ipAddress: '192.168.1.100'
      }
    ];

    demoEvents.forEach(async (eventData) => {
      await this.logSecurityEvent(eventData);
    });
  }

  getStats(): any {
    return {
      totalEvents: this.securityEvents.size,
      totalThreats: this.threatDetections.size,
      blockedIPs: this.blockedIPs.size,
      lastUpdated: new Date().toISOString()
    };
  }
}

export const advancedSecurity = new AdvancedSecurityService();
