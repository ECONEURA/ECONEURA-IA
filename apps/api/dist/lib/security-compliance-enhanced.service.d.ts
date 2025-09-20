export interface SecurityEvent {
    id: string;
    type: 'authentication' | 'authorization' | 'data_access' | 'data_modification' | 'security_violation' | 'compliance_breach';
    severity: 'low' | 'medium' | 'high' | 'critical';
    userId?: string;
    sessionId?: string;
    ipAddress: string;
    userAgent: string;
    resource: string;
    action: string;
    result: 'success' | 'failure' | 'blocked';
    details: Record<string, any>;
    timestamp: Date;
    riskScore: number;
}
export interface ComplianceRule {
    id: string;
    name: string;
    framework: 'GDPR' | 'SOX' | 'PCI-DSS' | 'HIPAA' | 'ISO27001';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    conditions: ComplianceCondition[];
    actions: ComplianceAction[];
    lastChecked: Date;
    status: 'compliant' | 'non_compliant' | 'warning';
}
export interface ComplianceCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
    weight: number;
}
export interface ComplianceAction {
    type: 'alert' | 'block' | 'log' | 'notify' | 'auto_remediate';
    parameters: Record<string, any>;
}
export interface ThreatDetectionRule {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    conditions: ThreatCondition[];
    actions: ThreatAction[];
    riskScore: number;
    lastTriggered?: Date;
}
export interface ThreatCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'regex' | 'frequency';
    value: any;
    timeWindow?: number;
    threshold?: number;
}
export interface ThreatAction {
    type: 'block' | 'alert' | 'quarantine' | 'escalate' | 'log';
    parameters: Record<string, any>;
}
export interface SecurityPolicy {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    rules: SecurityPolicyRule[];
    lastUpdated: Date;
    version: number;
}
export interface SecurityPolicyRule {
    id: string;
    name: string;
    condition: string;
    action: 'allow' | 'deny' | 'require_mfa' | 'log' | 'alert';
    priority: number;
    enabled: boolean;
}
export interface EncryptionConfig {
    algorithm: string;
    keySize: number;
    mode: string;
    padding: string;
    keyRotationInterval: number;
    lastKeyRotation: Date;
}
export declare class SecurityComplianceEnhancedService {
    private static instance;
    private securityEvents;
    private complianceRules;
    private threatDetectionRules;
    private securityPolicies;
    private encryptionConfig;
    private db;
    private monitoringInterval;
    constructor();
    static getInstance(): SecurityComplianceEnhancedService;
    private initializeEncryptionConfig;
    private initializeDefaultComplianceRules;
    private initializeDefaultThreatDetectionRules;
    private initializeDefaultSecurityPolicies;
    private startSecurityMonitoring;
    private runComplianceChecks;
    private evaluateComplianceRule;
    private evaluateComplianceCondition;
    private handleComplianceViolation;
    private executeComplianceAction;
    private runThreatDetection;
    private evaluateThreatDetectionRule;
    private evaluateThreatCondition;
    private handleThreatDetection;
    private executeThreatAction;
    private rotateEncryptionKeys;
    private performKeyRotation;
    private logSecurityEvent;
    private calculateRiskScore;
    private getSeverityFromRiskScore;
    private sendComplianceAlert;
    private blockNonCompliantAccess;
    private logComplianceViolation;
    private notifyComplianceTeam;
    private autoRemediateComplianceIssue;
    private blockThreatSource;
    private sendThreatAlert;
    private quarantineThreatSource;
    private escalateThreat;
    private logThreatDetection;
    getSecurityEvents(eventType?: string): Promise<SecurityEvent[]>;
    getComplianceRules(): Promise<ComplianceRule[]>;
    getThreatDetectionRules(): Promise<ThreatDetectionRule[]>;
    getSecurityPolicies(): Promise<SecurityPolicy[]>;
    getComplianceStatus(): Promise<{
        overall: 'compliant' | 'non_compliant' | 'warning';
        frameworks: Record<string, {
            status: string;
            score: number;
            rules: number;
        }>;
    }>;
    getSecurityDashboard(): Promise<{
        events: SecurityEvent[];
        compliance: any;
        threats: ThreatDetectionRule[];
        policies: SecurityPolicy[];
    }>;
    getHealthStatus(): Promise<{
        status: string;
        details: any;
    }>;
    destroy(): void;
}
export declare const securityComplianceEnhanced: SecurityComplianceEnhancedService;
//# sourceMappingURL=security-compliance-enhanced.service.d.ts.map