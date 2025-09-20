import { ThreatDetection, ThreatIndicator, SecurityIncident, CreateSecurityIncidentRequest, ThreatDetectionConfig } from './security-types.js';
export declare class ThreatDetectionService {
    private config;
    private threatDetections;
    private securityIncidents;
    private threatIntelligence;
    constructor(config?: Partial<ThreatDetectionConfig>);
    detectThreat(threatData: {
        type: ThreatDetection['threatType'];
        source: string;
        target: string;
        indicators: Omit<ThreatIndicator, 'id' | 'firstSeen' | 'lastSeen'>[];
        organizationId: string;
        description: string;
        metadata: Record<string, any>;
    }): Promise<ThreatDetection>;
    getThreatDetection(detectionId: string): Promise<ThreatDetection | null>;
    getThreatDetections(organizationId: string, filters?: {
        threatType?: string;
        severity?: string;
        status?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<ThreatDetection[]>;
    private determineThreatSeverity;
    private calculateThreatConfidence;
    private checkThreatIntelligence;
    private analyzeBehavior;
    private performThreatAnalysis;
    private generateThreatSummary;
    private generateTechnicalDetails;
    private identifyAttackVector;
    private identifyAffectedSystems;
    private identifyDataAtRisk;
    private assessPotentialImpact;
    private generateThreatRecommendations;
    private getThreatReferences;
    private initiateThreatResponse;
    private calculateRiskScore;
    private assessThreatImpact;
    private assessThreatLikelihood;
    private processThreatDetection;
    private updateThreatIntelligence;
    private performBehavioralAnalysis;
    private performAnomalyDetection;
    private triggerIncidentResponse;
    private mapThreatTypeToIncidentCategory;
    private mapResponseActionToIncidentAction;
    private performThreatHunting;
    createSecurityIncident(request: CreateSecurityIncidentRequest, organizationId: string, reportedBy: string): Promise<SecurityIncident>;
    getSecurityIncident(incidentId: string): Promise<SecurityIncident | null>;
    getSecurityIncidents(organizationId: string, filters?: {
        severity?: string;
        status?: string;
        category?: string;
        reportedBy?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }): Promise<SecurityIncident[]>;
    updateIncidentStatus(incidentId: string, status: SecurityIncident['status']): Promise<SecurityIncident | null>;
    getThreatAnalytics(organizationId: string, period?: {
        start: Date;
        end: Date;
    }): Promise<{
        totalThreats: number;
        threatsByType: Record<string, number>;
        threatsBySeverity: Record<string, number>;
        threatsByStatus: Record<string, number>;
        topThreats: Array<{
            type: string;
            count: number;
        }>;
        threatTrend: Array<{
            date: string;
            count: number;
        }>;
        riskScore: number;
        incidentCount: number;
    }>;
    private calculateThreatTrend;
    private calculateOverallRiskScore;
    private generateId;
    getServiceStats(): Promise<{
        totalThreats: number;
        totalIncidents: number;
        threatIntelligenceEntries: number;
        config: ThreatDetectionConfig;
    }>;
}
//# sourceMappingURL=threat-detection.service.d.ts.map